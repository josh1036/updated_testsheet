import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import SignaturePad from '../components/SignaturePad';
import PdfActionModal from '../components/PdfActionModal';
import TorqueReportContent from '../components/report/TorqueReportContent';
import { buildTorqueFilename, elementToPdfBlob } from '../lib/pdfUtils';
import { ArrowLeft, Save, CheckCircle2, Loader2, Zap, FileDown, Plus, Trash2, Upload, X, ChevronDown, ChevronUp, Copy, AlertTriangle } from 'lucide-react';

const DRAFT_KEY = 'torque_draft';
const PHASE_OPTIONS = [
  { value: 'L1', label: 'L1', color: '#dc2626', bg: '#fef2f2', border: '#fca5a5' },
  { value: 'L2', label: 'L2', color: '#f59e0b', bg: '#fffbeb', border: '#fcd34d' },
  { value: 'L3', label: 'L3', color: '#2563eb', bg: '#eff6ff', border: '#93c5fd' },
  { value: 'N', label: 'N', color: '#6b7280', bg: '#f9fafb', border: '#d1d5db' },
  { value: 'E', label: 'E', color: '#16a34a', bg: '#f0fdf4', border: '#86efac' },
  { value: 'PEN', label: 'PEN', color: '#15803d', bg: '#f0fdf4', border: '#4ade80' },
];
const EMPTY_ROW = () => ({ switchboard: '', deviceDescription: '', phase: '', requiredTorque: '', actualTorque: '', result: '', comments: '' });
const EMPTY_FORM = {
  status: 'Draft', certificateNumber: '', projectName: '', client: '', siteName: '',
  siteAddress: '', switchboardId: '', location: '', workOrderNumber: '', drawingReference: '',
  verificationDate: new Date().toISOString().slice(0, 10), technicianName: '', licenceNumber: '',
  companyName: '', companyAbn: '', companyPhone: '', companyAddress: '', companyLogoUrl: '',
  notes: '', toolType: '', torqueWrenchManufacturer: '', torqueWrenchModel: '', toolSerialNumber: '',
  calibrationCertNumber: '', calibrationDocUrl: '', torqueUnits: 'Nm', technicianSignature: '',
  supervisorName: '', supervisorDate: '',
};

function Field({ label, children, className = '' }) {
  return (
    <div className={`space-y-1 ${className}`}>
      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block">{label}</label>
      {children}
    </div>
  );
}
function TF({ id, value, onChange, placeholder = '', type = 'text' }) {
  return <input type={type} value={value || ''} onChange={e => onChange(id, e.target.value)} placeholder={placeholder} className="w-full h-8 px-3 text-sm border border-slate-200 rounded-md focus:outline-none focus:border-[#0f2044]" />;
}
function SectionHeader({ title, colour = 'bg-[#0f2044]' }) {
  return <div className={`${colour} text-white px-4 py-2.5 font-bold text-sm uppercase tracking-wider`}>{title}</div>;
}
function CellInput({ value, onChange, placeholder = '', type = 'text', className = '' }) {
  return <input type={type} value={value || ''} onChange={e => onChange(e.target.value)} placeholder={placeholder} className={`w-full bg-transparent border-none outline-none text-center text-xs py-0.5 px-1 focus:bg-blue-50/60 rounded ${className}`} />;
}
function PhaseCell({ value, onChange }) {
  return (
    <div className="flex items-center justify-center gap-1 flex-wrap py-0.5">
      {PHASE_OPTIONS.map(p => (
        <button key={p.value} type="button" onClick={() => onChange(value === p.value ? '' : p.value)}
          className="w-6 h-6 rounded-full border-2 flex items-center justify-center text-[9px] font-bold transition-all"
          style={{ background: value === p.value ? p.color : p.bg, borderColor: value === p.value ? p.color : p.border, color: value === p.value ? '#fff' : p.color }}>
          {p.label}
        </button>
      ))}
    </div>
  );
}
function ResultCell({ value, onChange }) {
  const opts = [{ v: 'Pass', bg: '#dcfce7', text: '#15803d', border: '#86efac' }, { v: 'Fail', bg: '#fef2f2', text: '#dc2626', border: '#fca5a5' }, { v: 'N/A', bg: '#f1f5f9', text: '#64748b', border: '#cbd5e1' }];
  return (
    <div className="flex items-center justify-center gap-1">
      {opts.map(o => (
        <button key={o.v} type="button" onClick={() => onChange(value === o.v ? '' : o.v)}
          className="text-[9px] font-bold px-1.5 py-0.5 rounded border transition-all"
          style={{ background: value === o.v ? o.bg : 'transparent', color: value === o.v ? o.text : '#94a3b8', borderColor: value === o.v ? o.border : '#e2e8f0' }}>
          {o.v}
        </button>
      ))}
    </div>
  );
}

async function supabaseUploadFile(file) {
  const ext = file.name.split('.').pop();
  const path = `uploads/${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from('company-logos').upload(path, file, { upsert: true });
  if (error) throw error;
  const { data: { publicUrl } } = supabase.storage.from('company-logos').getPublicUrl(path);
  return publicUrl;
}

function toDb(form, rows) {
  return {
    status: form.status, certificate_number: form.certificateNumber, project_name: form.projectName,
    client: form.client, site_name: form.siteName, site_address: form.siteAddress,
    switchboard_id: form.switchboardId, location: form.location, work_order_number: form.workOrderNumber,
    drawing_reference: form.drawingReference, verification_date: form.verificationDate,
    technician_name: form.technicianName, licence_number: form.licenceNumber,
    company_name: form.companyName, company_abn: form.companyAbn, company_phone: form.companyPhone,
    company_address: form.companyAddress, company_logo_url: form.companyLogoUrl, notes: form.notes,
    tool_type: form.toolType, torque_wrench_manufacturer: form.torqueWrenchManufacturer,
    torque_wrench_model: form.torqueWrenchModel, tool_serial_number: form.toolSerialNumber,
    calibration_cert_number: form.calibrationCertNumber, calibration_doc_url: form.calibrationDocUrl,
    torque_units: form.torqueUnits, technician_signature: form.technicianSignature,
    supervisor_name: form.supervisorName, supervisor_date: form.supervisorDate,
    termination_rows: rows,
  };
}
function fromDb(row) {
  if (!row) return null;
  return {
    id: row.id, status: row.status, certificateNumber: row.certificate_number, projectName: row.project_name,
    client: row.client, siteName: row.site_name, siteAddress: row.site_address,
    switchboardId: row.switchboard_id, location: row.location, workOrderNumber: row.work_order_number,
    drawingReference: row.drawing_reference, verificationDate: row.verification_date,
    technicianName: row.technician_name, licenceNumber: row.licence_number,
    companyName: row.company_name, companyAbn: row.company_abn, companyPhone: row.company_phone,
    companyAddress: row.company_address, companyLogoUrl: row.company_logo_url, notes: row.notes,
    toolType: row.tool_type, torqueWrenchManufacturer: row.torque_wrench_manufacturer,
    torqueWrenchModel: row.torque_wrench_model, toolSerialNumber: row.tool_serial_number,
    calibrationCertNumber: row.calibration_cert_number, calibrationDocUrl: row.calibration_doc_url,
    torqueUnits: row.torque_units, technicianSignature: row.technician_signature,
    supervisorName: row.supervisor_name, supervisorDate: row.supervisor_date,
    terminationRows: row.termination_rows || [],
  };
}

export default function TorqueForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = !id || id === 'new';
  const reportRef = useRef(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [rows, setRows] = useState([EMPTY_ROW(), EMPTY_ROW(), EMPTY_ROW()]);
  const [loading, setLoading] = useState(!!id && id !== 'new');
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingCalDoc, setUploadingCalDoc] = useState(false);
  const [showBranding, setShowBranding] = useState(false);
  const [toast, setToast] = useState('');
  const [pdfModal, setPdfModal] = useState({ open: false, blob: null, generating: false, progress: 0, error: null });

  const showToast = msg => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  useEffect(() => {
    if (isNew) {
      try { const d = localStorage.getItem(DRAFT_KEY); if (d) { const p = JSON.parse(d); setForm({ ...EMPTY_FORM, ...p.form }); if (p.rows?.length) setRows(p.rows); } } catch {}
      setForm(f => ({ ...f, certificateNumber: 'TTC-' + new Date().getFullYear() + '-' + String(Date.now()).slice(-5) }));
      return;
    }
    supabase.from('torque_certificates').select('*').eq('id', id).single().then(({ data }) => {
      if (data) { const r = fromDb(data); setForm({ ...EMPTY_FORM, ...r }); if (r.terminationRows?.length) setRows(r.terminationRows); if (r.companyName || r.companyLogoUrl) setShowBranding(true); }
      setLoading(false);
    });
  }, [id, isNew]);

  useEffect(() => {
    if (!isNew) return;
    const t = setInterval(() => { try { localStorage.setItem(DRAFT_KEY, JSON.stringify({ form, rows })); } catch {} }, 30000);
    return () => clearInterval(t);
  }, [form, rows, isNew]);

  const setField = useCallback((field, value) => setForm(f => ({ ...f, [field]: value })), []);
  const setRow = (index, field, value) => setRows(r => r.map((x, i) => i === index ? { ...x, [field]: value } : x));
  const addRow = () => setRows(r => [...r, EMPTY_ROW()]);
  const addThreePhase = () => {
    const sb = form.switchboardId || '';
    setRows(r => [...r, { ...EMPTY_ROW(), switchboard: sb, phase: 'L1' }, { ...EMPTY_ROW(), switchboard: sb, phase: 'L2' }, { ...EMPTY_ROW(), switchboard: sb, phase: 'L3' }, { ...EMPTY_ROW(), switchboard: sb, phase: 'N' }, { ...EMPTY_ROW(), switchboard: sb, phase: 'E' }]);
  };
  const duplicateRow = i => setRows(r => { const c = [...r]; c.splice(i + 1, 0, { ...r[i] }); return c; });
  const removeRow = i => setRows(r => r.filter((_, idx) => idx !== i));

  const handleSave = async (status = null) => {
    if (saving) return;
    setSaving(true);
    const payload = { ...toDb(form, rows), status: status || form.status || 'Draft' };
    const { data: { user } } = await supabase.auth.getUser();
    try {
      if (isNew) {
        const { data, error } = await supabase.from('torque_certificates').insert({ ...payload, user_id: user.id }).select().single();
        if (error) throw error;
        localStorage.removeItem(DRAFT_KEY);
        showToast('Certificate saved');
        navigate(`/torque/${data.id}/edit`);
      } else {
        const { error } = await supabase.from('torque_certificates').update(payload).eq('id', id);
        if (error) throw error;
        showToast(status === 'Complete' ? 'Marked complete ✓' : 'Saved');
      }
    } catch (err) { showToast('Failed to save: ' + (err?.message || 'unknown error')); }
    setSaving(false);
  };

  const handleLogoUpload = async e => {
    const file = e.target.files?.[0]; if (!file) return;
    setUploadingLogo(true);
    try { setField('companyLogoUrl', await supabaseUploadFile(file)); } catch (err) { showToast('Upload failed: ' + err.message); }
    setUploadingLogo(false);
  };
  const handleCalDocUpload = async e => {
    const file = e.target.files?.[0]; if (!file) return;
    setUploadingCalDoc(true);
    try { setField('calibrationDocUrl', await supabaseUploadFile(file)); } catch (err) { showToast('Upload failed: ' + err.message); }
    setUploadingCalDoc(false);
  };

  const handleGeneratePdf = async () => {
    setPdfModal({ open: true, blob: null, generating: true, progress: 0.05, error: null });
    try {
      if (!isNew) await supabase.from('torque_certificates').update(toDb(form, rows)).eq('id', id);
      const el = reportRef.current;
      if (!el) throw new Error('Report content not found.');
      const blob = await elementToPdfBlob(el, { onProgress: p => setPdfModal(m => ({ ...m, progress: p })) });
      setPdfModal({ open: true, blob, generating: false, progress: 1, error: null });
    } catch (err) { setPdfModal({ open: true, blob: null, generating: false, progress: 0, error: err.message }); }
  };

  const passed = rows.filter(r => r.result === 'Pass').length;
  const failed = rows.filter(r => r.result === 'Fail').length;
  const filledRows = rows.filter(r => r.deviceDescription || r.switchboard || r.phase);

  if (loading) return <div className="fixed inset-0 flex items-center justify-center bg-white"><Loader2 className="w-8 h-8 animate-spin text-[#0f2044]" /></div>;

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      {toast && <div className="fixed top-4 right-4 z-50 bg-[#0f2044] text-white px-4 py-2 rounded-xl text-sm shadow-lg">{toast}</div>}
      <nav className="bg-white border-b border-slate-100 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 text-slate-600 hover:text-[#0f2044]">
            <ArrowLeft className="w-4 h-4" />
            <div className="w-6 h-6 rounded-lg bg-[#0f2044] flex items-center justify-center"><Zap className="w-3 h-3 text-[#F59E0B]" /></div>
            <span className="font-bold text-[#0f2044] text-sm hidden sm:block">Torque Certificate</span>
          </button>
          <div className="flex items-center gap-2">
            <button onClick={handleGeneratePdf} disabled={isNew} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-medium hover:border-[#0f2044] disabled:opacity-40">
              <FileDown className="w-3.5 h-3.5" /> PDF
            </button>
            <button onClick={() => handleSave()} disabled={saving} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-medium hover:border-[#0f2044] disabled:opacity-60">
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />} Save
            </button>
            <button onClick={() => handleSave('Complete')} disabled={saving} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold disabled:opacity-60">
              <CheckCircle2 className="w-3.5 h-3.5" /> Complete
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-[#0f2044]">{isNew ? 'New Torque Certificate' : (form.projectName || form.certificateNumber || 'Torque Certificate')}</h1>
          <p className="text-slate-500 text-sm mt-1">Termination Torque Verification Certificate</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <SectionHeader title="Certificate & Project Information" />
          <div className="p-5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            <Field label="Certificate Number"><TF id="certificateNumber" value={form.certificateNumber} onChange={setField} /></Field>
            <Field label="Project Name" className="col-span-2"><TF id="projectName" value={form.projectName} onChange={setField} /></Field>
            <Field label="Client"><TF id="client" value={form.client} onChange={setField} /></Field>
            <Field label="Site Address" className="col-span-2"><TF id="siteAddress" value={form.siteAddress} onChange={setField} /></Field>
            <Field label="Date of Verification"><TF id="verificationDate" value={form.verificationDate} onChange={setField} type="date" /></Field>
            <Field label="Technician Name" className="col-span-2"><TF id="technicianName" value={form.technicianName} onChange={setField} /></Field>
            <Field label="Licence Number"><TF id="licenceNumber" value={form.licenceNumber} onChange={setField} /></Field>
            <Field label="Work Order No."><TF id="workOrderNumber" value={form.workOrderNumber} onChange={setField} /></Field>
            <Field label="Notes / Scope" className="col-span-2 sm:col-span-3 lg:col-span-4">
              <textarea value={form.notes || ''} onChange={e => setField('notes', e.target.value)} rows={2} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:border-[#0f2044]" />
            </Field>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <SectionHeader title="Torque Tool & Calibration" colour="bg-slate-700" />
          <div className="p-5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            <Field label="Tool Type"><TF id="toolType" value={form.toolType} onChange={setField} /></Field>
            <Field label="Manufacturer"><TF id="torqueWrenchManufacturer" value={form.torqueWrenchManufacturer} onChange={setField} /></Field>
            <Field label="Model"><TF id="torqueWrenchModel" value={form.torqueWrenchModel} onChange={setField} /></Field>
            <Field label="Serial Number"><TF id="toolSerialNumber" value={form.toolSerialNumber} onChange={setField} /></Field>
            <Field label="Cal. Certificate No."><TF id="calibrationCertNumber" value={form.calibrationCertNumber} onChange={setField} /></Field>
            <Field label="Calibration Certificate Photo" className="col-span-2 sm:col-span-3 lg:col-span-5">
              {form.calibrationDocUrl ? (
                <div className="flex items-center gap-4">
                  <img src={form.calibrationDocUrl} alt="Cal cert" className="h-24 max-w-[200px] object-contain border border-slate-200 rounded-lg bg-white p-1" onError={e => { e.target.style.display = 'none'; }} />
                  <button onClick={() => setField('calibrationDocUrl', '')} className="text-slate-400 hover:text-red-500"><X className="w-4 h-4" /></button>
                </div>
              ) : (
                <label className="cursor-pointer w-fit">
                  <div className="flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-dashed border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600 text-xs font-medium">
                    {uploadingCalDoc ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    {uploadingCalDoc ? 'Uploading…' : 'Upload calibration certificate photo'}
                  </div>
                  <input type="file" accept="image/*" className="hidden" onChange={handleCalDocUpload} disabled={uploadingCalDoc} />
                </label>
              )}
            </Field>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <SectionHeader title="Termination Verification Records" colour="bg-[#1e4080]" />
          {filledRows.length > 0 && (
            <div className="flex items-center gap-4 px-4 py-2 bg-slate-50 border-b border-slate-100 text-xs font-semibold">
              <span className="text-slate-500">Total: <span className="text-slate-800">{filledRows.length}</span></span>
              {passed > 0 && <span className="text-emerald-700">✓ Pass: {passed}</span>}
              {failed > 0 && <span className="text-red-700 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Fail: {failed}</span>}
            </div>
          )}
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse" style={{ minWidth: '800px' }}>
              <thead>
                <tr className="bg-[#0f2044] text-white text-[10px] uppercase tracking-wider">
                  {['#', 'Switchboard', 'Protection Device', 'Phase', `Required (${form.torqueUnits || 'Nm'})`, `Actual (${form.torqueUnits || 'Nm'})`, 'Result', 'Comments', ''].map((h, i) => (
                    <th key={i} className="border border-[#1e4080] px-2 py-2 text-center">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => {
                  const phaseOpt = PHASE_OPTIONS.find(p => p.value === row.phase);
                  const rowBg = row.result === 'Pass' ? 'bg-emerald-50/40' : row.result === 'Fail' ? 'bg-red-50/40' : i % 2 === 0 ? 'bg-white' : 'bg-slate-50/60';
                  return (
                    <tr key={i} className={rowBg}>
                      <td className="border border-slate-200 px-1 py-1 text-center">
                        <span className="w-5 h-5 rounded-full inline-flex items-center justify-center text-[9px] font-bold" style={phaseOpt ? { background: phaseOpt.bg, color: phaseOpt.color, border: `1px solid ${phaseOpt.border}` } : { background: '#f1f5f9', color: '#94a3b8' }}>{i + 1}</span>
                      </td>
                      <td className="border border-slate-200 px-1 py-1"><CellInput value={row.switchboard} onChange={v => setRow(i, 'switchboard', v)} className="text-left" /></td>
                      <td className="border border-slate-200 px-1 py-1"><CellInput value={row.deviceDescription} onChange={v => setRow(i, 'deviceDescription', v)} className="text-left" /></td>
                      <td className="border border-slate-200 px-1 py-0.5"><PhaseCell value={row.phase} onChange={v => setRow(i, 'phase', v)} /></td>
                      <td className="border border-slate-200 px-1 py-1"><CellInput value={row.requiredTorque} onChange={v => setRow(i, 'requiredTorque', v)} type="number" /></td>
                      <td className="border border-slate-200 px-1 py-1"><CellInput value={row.actualTorque} onChange={v => setRow(i, 'actualTorque', v)} type="number" className={row.actualTorque && row.requiredTorque ? parseFloat(row.actualTorque) >= parseFloat(row.requiredTorque) ? 'text-emerald-700 font-semibold' : 'text-red-600 font-semibold' : ''} /></td>
                      <td className="border border-slate-200 px-1 py-1"><ResultCell value={row.result} onChange={v => setRow(i, 'result', v)} /></td>
                      <td className="border border-slate-200 px-1 py-1"><CellInput value={row.comments} onChange={v => setRow(i, 'comments', v)} className="text-left" /></td>
                      <td className="border border-slate-200 px-1 py-1">
                        <div className="flex items-center gap-0.5 justify-center">
                          <button onClick={() => duplicateRow(i)} className="text-slate-300 hover:text-blue-500 p-0.5 rounded"><Copy className="w-3 h-3" /></button>
                          <button onClick={() => removeRow(i)} className="text-slate-300 hover:text-red-500 p-0.5 rounded"><Trash2 className="w-3 h-3" /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="flex flex-wrap gap-2 p-3 bg-slate-50 border-t border-slate-100">
            <div className="flex items-center gap-2 mr-2">
              <span className="text-xs text-slate-500 font-semibold">Units:</span>
              <select value={form.torqueUnits || 'Nm'} onChange={e => setField('torqueUnits', e.target.value)} className="h-7 text-xs border border-slate-200 rounded-md px-2 bg-white">
                <option value="Nm">Nm</option><option value="lb-ft">lb-ft</option><option value="lb-in">lb-in</option>
              </select>
            </div>
            <button onClick={addRow} className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 rounded-lg text-xs hover:border-[#0f2044]"><Plus className="w-3.5 h-3.5" /> Add Row</button>
            <button onClick={addThreePhase} className="flex items-center gap-1.5 px-3 py-1.5 border border-blue-200 rounded-lg text-xs text-blue-700 hover:bg-blue-50"><Plus className="w-3.5 h-3.5" /> Add 3-Phase Set</button>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <button className="w-full flex items-center justify-between px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50" onClick={() => setShowBranding(!showBranding)}>
            <span>Company Branding (optional)</span>
            {showBranding ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          {showBranding && (
            <div className="p-5 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-3 gap-4">
              <Field label="Company Name"><TF id="companyName" value={form.companyName} onChange={setField} /></Field>
              <Field label="ABN"><TF id="companyAbn" value={form.companyAbn} onChange={setField} /></Field>
              <Field label="Phone"><TF id="companyPhone" value={form.companyPhone} onChange={setField} /></Field>
              <Field label="Address" className="col-span-2 sm:col-span-3"><TF id="companyAddress" value={form.companyAddress} onChange={setField} /></Field>
              <Field label="Company Logo" className="col-span-2 sm:col-span-3">
                {form.companyLogoUrl ? (
                  <div className="flex items-center gap-3">
                    <img src={form.companyLogoUrl} alt="Logo" className="h-14 max-w-[180px] object-contain border border-slate-200 rounded-lg p-1 bg-white" />
                    <button onClick={() => setField('companyLogoUrl', '')} className="text-slate-400 hover:text-red-500"><X className="w-4 h-4" /></button>
                  </div>
                ) : (
                  <label className="cursor-pointer w-fit">
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600 text-xs font-medium">
                      {uploadingLogo ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                      {uploadingLogo ? 'Uploading…' : 'Upload Logo'}
                    </div>
                    <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} disabled={uploadingLogo} />
                  </label>
                )}
              </Field>
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <SectionHeader title="Declaration & Sign-Off" colour="bg-slate-700" />
          <div className="p-5 space-y-4">
            <p className="text-xs text-slate-600 bg-slate-50 rounded-lg p-3 border border-slate-200">I certify that the electrical terminations recorded in this certificate were checked and/or tightened using the identified torque tool and verified against manufacturer torque requirements or approved project documentation.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Technician Signature"><SignaturePad value={form.technicianSignature} onChange={v => setField('technicianSignature', v || '')} /></Field>
              <div className="space-y-3">
                <Field label="Technician Name"><TF id="supervisorName" value={form.supervisorName} onChange={setField} /></Field>
                <Field label="Date"><TF id="supervisorDate" value={form.supervisorDate} onChange={setField} type="date" /></Field>
              </div>
            </div>
            <Field label="Final Status">
              <select value={form.status || 'Draft'} onChange={e => setField('status', e.target.value)} className="h-8 text-sm border border-slate-200 rounded-md px-2 bg-white">
                <option value="Draft">Draft</option>
                <option value="Complete">Complete</option>
                <option value="Requires Rectification">Requires Rectification</option>
              </select>
            </Field>
          </div>
        </div>

        <div className="flex justify-between items-center pb-8">
          <button onClick={() => navigate('/dashboard')} className="text-slate-400 hover:text-slate-600 text-sm flex items-center gap-1"><ArrowLeft className="w-4 h-4" /> Dashboard</button>
          <div className="flex gap-2">
            <button onClick={() => handleSave()} disabled={saving} className="flex items-center gap-1.5 px-4 py-2 border border-slate-200 rounded-xl text-sm hover:border-[#0f2044] disabled:opacity-60">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save Draft
            </button>
            <button onClick={handleGeneratePdf} disabled={isNew} className="flex items-center gap-1.5 px-4 py-2 border border-slate-200 rounded-xl text-sm hover:border-[#0f2044] disabled:opacity-40">
              <FileDown className="w-4 h-4" /> Generate PDF
            </button>
            <button onClick={() => handleSave('Complete')} disabled={saving} className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold disabled:opacity-60">
              <CheckCircle2 className="w-4 h-4" /> Mark Complete
            </button>
          </div>
        </div>
      </div>

      <div ref={reportRef} style={{ position: 'fixed', top: 0, left: '-9999px', width: '794px', opacity: 1, visibility: 'visible', pointerEvents: 'none', zIndex: -1, background: 'white', overflow: 'visible' }} aria-hidden="true">
        <TorqueReportContent record={{ ...form, terminationRows: rows }} />
      </div>

      <PdfActionModal open={pdfModal.open} onClose={() => setPdfModal(m => ({ ...m, open: false }))} pdfBlob={pdfModal.blob} generating={pdfModal.generating} progress={pdfModal.progress} error={pdfModal.error} filename={buildTorqueFilename(form)} />
    </div>
  );
}