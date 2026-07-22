import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getRecord, createRecord, updateRecord } from '../lib/records';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import CircuitGrid from '../components/CircuitGrid';
import MccbSettings from '../components/MccbSettings';
import SignaturePad from '../components/SignaturePad';
import {
  ArrowLeft, Save, CheckCircle2, Loader2, Zap,
  FileDown, Share2, ChevronDown, ChevronUp, Upload, X, Plus, Trash2, BookmarkCheck
} from 'lucide-react';

const DRAFT_KEY = 'asnzs_draft';
const COMPANY_PROFILE_KEY = (userId) => `asnzs_company_${userId}`;

const emptyRow = () => ({
  cableId: '', circuitId: '', numPhases: [], maxDemand: '', ocpdType: '', ocpdCurrentRating: '', ocpdPscRating: '',
  conductorCcc: '', conductorSize: '', earthContMain: '', earthContEq: '', polarity: '',
  insResAE: '', insResAN: '', insResNE: '', insResPP: '', insResOk: '',
  zaRpheActual: '', zaRpheCompliant: '', rcdPushButton: '', rcdCurrentTrip: '',
  circuitLength: '', clearInterconnect: '', comments: '',
});

const makeRows = (n) => Array.from({ length: n }, emptyRow);
const EMPTY_EQUIP_ROW = () => ({ type: '', serial: '', calDate: '' });

const EMPTY_FORM = {
  status: 'Draft',
  date: new Date().toLocaleDateString('en-AU'),
  addressLocation: '', switchboardNumber: '', contractorName: '',
  contractorNumber: '', workerName: '', licenceNumber: '', clientEmail: '',
  pscAtMainSwitch: '', livePartsScreened: '', mainLinkNeutralReconnected: '',
  signatureData: '',
  msbName: '', msbNameOther: '',
  msbMenCompliant: '', msbMaxDemand: '', msbMainSwitchCurrentRating: '',
  msbMainSwitchPscRating: '', msbConductorCcc: '', msbConductorSize: '',
  msbEarthContMain: '', msbEarthContEq: '',
  msbCircuitLength: '', msbArcFlashRating: '', msbComments: '',
  companyName: '', companyAbn: '', companyPhone: '', companyAddress: '', companyLogoUrl: '',
  notes: '',
};

function SH({ title, colour }) {
  return <div className={`${colour} text-white px-4 py-2.5 font-bold text-sm uppercase tracking-wider rounded-t-xl`}>{title}</div>;
}

function Field({ label, children, className = '' }) {
  return (
    <div className={`space-y-1 ${className}`}>
      <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide block">{label}</label>
      {children}
    </div>
  );
}

function TF({ id, value, onChange, placeholder = '', type = 'text' }) {
  return (
    <input type={type} value={value || ''} onChange={(e) => onChange(id, e.target.value)} placeholder={placeholder}
      className="w-full h-8 px-3 text-sm border border-slate-200 rounded-md focus:outline-none focus:border-[#0f2044] focus:ring-1 focus:ring-[#0f2044]/20" />
  );
}

function Sel({ id, value, onChange, options }) {
  return (
    <select value={value || ''} onChange={(e) => onChange(id, e.target.value)}
      className="w-full h-8 px-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:border-[#0f2044] bg-white">
      <option value="">—</option>
      {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

export default function RecordForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isNew = !id || id === 'new';

  const [form, setForm] = useState(EMPTY_FORM);
  const [mainsRows, setMainsRows] = useState(makeRows(5));
  const [subRows, setSubRows] = useState(makeRows(20));
  const [equipRows, setEquipRows] = useState([EMPTY_EQUIP_ROW(), EMPTY_EQUIP_ROW(), EMPTY_EQUIP_ROW(), EMPTY_EQUIP_ROW()]);
  const [loading, setLoading] = useState(!!id && id !== 'new');
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [showBranding, setShowBranding] = useState(false);
  const [toast, setToast] = useState('');
  const [copied, setCopied] = useState(false);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  useEffect(() => {
    if (isNew) {
      const companyProfile = user ? (() => {
        try { return JSON.parse(localStorage.getItem(COMPANY_PROFILE_KEY(user.id)) || 'null'); } catch { return null; }
      })() : null;
      try {
        const draft = localStorage.getItem(DRAFT_KEY);
        if (draft) {
          const parsed = JSON.parse(draft);
          setForm({ ...EMPTY_FORM, ...companyProfile, ...parsed.form });
          if (parsed.mainsRows) setMainsRows(parsed.mainsRows);
          if (parsed.subRows) setSubRows(parsed.subRows);
        } else if (companyProfile) {
          setForm({ ...EMPTY_FORM, ...companyProfile });
          setShowBranding(true);
        }
      } catch {}
      if (companyProfile) setShowBranding(true);
      return;
    }
    getRecord(id).then((data) => {
      setForm({ ...EMPTY_FORM, ...data });
      if (data.mainsCircuits?.length) setMainsRows(data.mainsCircuits);
      if (data.subCircuits?.length) setSubRows(data.subCircuits);
      if (data.testEquipment?.length) setEquipRows(data.testEquipment);
      if (data.companyName || data.companyLogoUrl) setShowBranding(true);
      setLoading(false);
    });
  }, [id, isNew, user]);

  useEffect(() => {
    if (!isNew) return;
    const interval = setInterval(() => {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ form, mainsRows, subRows }));
    }, 30000);
    return () => clearInterval(interval);
  }, [form, mainsRows, subRows, isNew]);

  const setField = useCallback((field, value) => {
    setForm((f) => ({ ...f, [field]: value }));
  }, []);

  const saveCompanyProfile = () => {
    if (!user) return;
    const profile = { companyName: form.companyName, companyAbn: form.companyAbn, companyPhone: form.companyPhone, companyAddress: form.companyAddress, companyLogoUrl: form.companyLogoUrl };
    localStorage.setItem(COMPANY_PROFILE_KEY(user.id), JSON.stringify(profile));
    showToast('Company details saved as default ✓');
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploadingLogo(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `logos/${user.id}/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from('company-logos').upload(path, file, { upsert: true });
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from('company-logos').getPublicUrl(path);
      setField('companyLogoUrl', publicUrl);
    } catch (err) {
      showToast('Logo upload failed: ' + err.message);
    }
    setUploadingLogo(false);
  };

  const handleSave = async (markComplete = false) => {
    setSaving(true);
    const payload = { ...form, status: markComplete ? 'Complete' : (form.status || 'Draft'), mainsCircuits: mainsRows, subCircuits: subRows, testEquipment: equipRows, mccbSettings: form.mccbSettings || [] };
    try {
      if (isNew) {
        const created = await createRecord(payload);
        localStorage.removeItem(DRAFT_KEY);
        showToast(markComplete ? 'Record marked as complete ✓' : 'Record saved');
        navigate(`/records/${created.id}/edit`);
      } else {
        await updateRecord(id, payload);
        showToast(markComplete ? 'Record marked as complete ✓' : 'Changes saved');
      }
    } catch (e) {
      showToast('Failed to save: ' + e.message);
    }
    setSaving(false);
  };

  const handleCopyShareLink = async () => {
    if (isNew) return;
    let shareToken = form.share_token;
    if (!shareToken) {
      shareToken = crypto.randomUUID().replace(/-/g, '').slice(0, 12);
      await updateRecord(id, { ...form, share_token: shareToken, mainsCircuits: mainsRows, subCircuits: subRows });
      setField('share_token', shareToken);
    }
    navigator.clipboard.writeText(`${window.location.origin}/share/${shareToken}`);
    setCopied(true);
    showToast('Shareable link copied!');
    setTimeout(() => setCopied(false), 2500);
  };

  if (loading) return (
    <div className="fixed inset-0 flex items-center justify-center bg-white">
      <Loader2 className="w-8 h-8 animate-spin text-[#0f2044]" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      {toast && <div className="fixed top-4 right-4 z-50 bg-[#0f2044] text-white px-4 py-2 rounded-xl text-sm shadow-lg">{toast}</div>}

      <nav className="bg-white border-b border-slate-100 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 text-slate-600 hover:text-[#0f2044] transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <div className="w-6 h-6 rounded-lg bg-[#0f2044] flex items-center justify-center"><Zap className="w-3 h-3 text-[#F59E0B]" /></div>
            <span className="font-bold text-[#0f2044] text-sm hidden sm:block">AS/NZS Test Results</span>
          </button>
          <div className="flex items-center gap-2">
            {!isNew && (
              <button onClick={handleCopyShareLink} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-medium hover:border-[#0f2044] transition-colors">
                {copied ? <><CheckCircle2 className="w-3.5 h-3.5 text-green-500" /> Copied!</> : <><Share2 className="w-3.5 h-3.5" /> Share</>}
              </button>
            )}
            <button onClick={() => !isNew && navigate(`/records/${id}/view`)} disabled={isNew} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-medium hover:border-[#0f2044] disabled:opacity-40 transition-colors">
              <FileDown className="w-3.5 h-3.5" /> View / PDF
            </button>
            <button onClick={() => handleSave(false)} disabled={saving} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-medium hover:border-[#0f2044] disabled:opacity-60 transition-colors">
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />} Save
            </button>
            <button onClick={() => handleSave(true)} disabled={saving} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold disabled:opacity-60 transition-colors">
              <CheckCircle2 className="w-3.5 h-3.5" /> Mark Complete
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-[#0f2044]">{isNew ? 'New Test Record' : (form.addressLocation || 'Test Record')}</h1>
          <p className="text-slate-500 text-sm mt-1">AS/NZS 3000:2018 & AS/NZS 3008 Schedule of Test Results</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <SH title="Contractor & Job Details" colour="bg-[#0f2044]" />
          <div className="p-5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            <Field label="Address / Location" className="col-span-2 sm:col-span-3 lg:col-span-2">
              <TF id="addressLocation" value={form.addressLocation} onChange={setField} placeholder="Site address" />
            </Field>
            <Field label="Date"><TF id="date" value={form.date} onChange={setField} type="date" /></Field>
            <Field label="Switchboard No."><TF id="switchboardNumber" value={form.switchboardNumber} onChange={setField} placeholder="SB-01" /></Field>
            <Field label="Contractor Name"><TF id="contractorName" value={form.contractorName} onChange={setField} /></Field>
            <Field label="Contractor Number"><TF id="contractorNumber" value={form.contractorNumber} onChange={setField} /></Field>
            <Field label="Worker Name"><TF id="workerName" value={form.workerName} onChange={setField} /></Field>
            <Field label="Licence Number"><TF id="licenceNumber" value={form.licenceNumber} onChange={setField} /></Field>
            <Field label="Client Email"><TF id="clientEmail" value={form.clientEmail} onChange={setField} type="email" /></Field>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <SH title="Test Equipment" colour="bg-slate-700" />
          <div className="p-5">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 text-xs text-slate-500 uppercase tracking-wide">
                    <th className="text-left px-3 py-2">#</th>
                    <th className="text-left px-3 py-2">Type / Description</th>
                    <th className="text-left px-3 py-2">Serial Number</th>
                    <th className="text-left px-3 py-2">Cal. Date</th>
                    <th className="px-3 py-2 w-8"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {equipRows.map((row, i) => (
                    <tr key={i}>
                      <td className="px-3 py-2 text-slate-400 font-mono text-xs">{i + 1}</td>
                      <td className="px-3 py-2"><TF id="type" value={row.type} onChange={(_, v) => setEquipRows(r => r.map((x, idx) => idx === i ? { ...x, type: v } : x))} placeholder="e.g. Insulation tester" /></td>
                      <td className="px-3 py-2"><TF id="serial" value={row.serial} onChange={(_, v) => setEquipRows(r => r.map((x, idx) => idx === i ? { ...x, serial: v } : x))} /></td>
                      <td className="px-3 py-2"><TF id="calDate" value={row.calDate} onChange={(_, v) => setEquipRows(r => r.map((x, idx) => idx === i ? { ...x, calDate: v } : x))} type="date" /></td>
                      <td className="px-3 py-2"><button onClick={() => setEquipRows(r => r.filter((_, idx) => idx !== i))} disabled={equipRows.length <= 1} className="text-slate-300 hover:text-red-500 disabled:opacity-20"><Trash2 className="w-3.5 h-3.5" /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-3">
              <button onClick={() => setEquipRows(r => [...r, EMPTY_EQUIP_ROW()])} className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 rounded-lg text-xs text-slate-700 hover:bg-slate-50 transition-colors">
                <Plus className="w-3 h-3" /> Add Equipment
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="bg-[#1e4080] text-white px-4 py-2.5 font-bold text-sm uppercase tracking-wider">
            {form.msbName && form.msbName !== 'Other' ? form.msbName : form.msbNameOther || 'Switchboard'}
          </div>
          <div className="p-5 space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              <Field label="Switchboard Type" className="col-span-2 sm:col-span-2">
                <select value={form.msbName || ''} onChange={(e) => setField('msbName', e.target.value)} className="w-full h-8 px-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:border-[#0f2044]">
                  <option value="">— Select —</option>
                  <option value="Main Switchboard (MSB)">Main Switchboard (MSB)</option>
                  <option value="Distribution Board (DB)">Distribution Board (DB)</option>
                  <option value="Sub-board">Sub-board</option>
                  <option value="MCC">MCC</option>
                  <option value="Control Panel">Control Panel</option>
                  <option value="Generator Switchboard">Generator Switchboard</option>
                  <option value="Other">Other (specify below)</option>
                </select>
                {form.msbName === 'Other' && <TF id="msbNameOther" value={form.msbNameOther} onChange={setField} placeholder="Specify..." />}
              </Field>
              <Field label="M.E.N. Compliant">
                <select value={form.msbMenCompliant || ''} onChange={(e) => setField('msbMenCompliant', e.target.value)} className="w-full h-8 px-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:border-[#0f2044]">
                  <option value="">—</option><option value="yes">Yes</option><option value="no">No</option>
                </select>
              </Field>
              <Field label="Max Demand (A)"><TF id="msbMaxDemand" value={form.msbMaxDemand} onChange={setField} /></Field>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              <Field label="Main Switch Current Rating (A)"><TF id="msbMainSwitchCurrentRating" value={form.msbMainSwitchCurrentRating} onChange={setField} /></Field>
              <Field label="Main Switch PSC Rating (kA)"><TF id="msbMainSwitchPscRating" value={form.msbMainSwitchPscRating} onChange={setField} /></Field>
              <Field label="Conductor CCC (A)"><TF id="msbConductorCcc" value={form.msbConductorCcc} onChange={setField} /></Field>
              <Field label="Conductor Size (mm²)"><TF id="msbConductorSize" value={form.msbConductorSize} onChange={setField} /></Field>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              <Field label="Earth Cont. — Main (Ω)"><TF id="msbEarthContMain" value={form.msbEarthContMain} onChange={setField} /></Field>
              <Field label="Earth Cont. — EQ (Ω)"><TF id="msbEarthContEq" value={form.msbEarthContEq} onChange={setField} /></Field>
              <Field label="PSC at Main Switch (kA)"><TF id="pscAtMainSwitch" value={form.pscAtMainSwitch} onChange={setField} /></Field>
              <Field label="Arc Flash Rating (kA)"><TF id="msbArcFlashRating" value={form.msbArcFlashRating} onChange={setField} /></Field>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              <Field label="Live Parts Screened">
                <select value={form.livePartsScreened || ''} onChange={(e) => setField('livePartsScreened', e.target.value)} className="w-full h-8 px-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:border-[#0f2044]">
                  <option value="">—</option><option value="yes">Yes</option><option value="no">No</option>
                </select>
              </Field>
              <Field label="Main Link / Neutral Reconnected">
                <select value={form.mainLinkNeutralReconnected || ''} onChange={(e) => setField('mainLinkNeutralReconnected', e.target.value)} className="w-full h-8 px-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:border-[#0f2044]">
                  <option value="">—</option><option value="yes">Yes</option><option value="no">No</option>
                </select>
              </Field>
              <Field label="Circuit Length (m)"><TF id="msbCircuitLength" value={form.msbCircuitLength} onChange={setField} /></Field>
            </div>
            <Field label="Comments">
              <textarea value={form.msbComments || ''} onChange={(e) => setField('msbComments', e.target.value)} rows={2}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:border-[#0f2044]" />
            </Field>
          </div>
        </div>

        <MccbSettings rows={form.mccbSettings || []} onChange={(v) => setField('mccbSettings', v)} />

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <SH title="Consumer and Sub Mains" colour="bg-[#1e4080]" />
          <div className="p-3"><CircuitGrid rows={mainsRows} onChange={setMainsRows} minRows={5} /></div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <SH title="Final Sub Circuits" colour="bg-[#1a3a6b]" />
          <div className="p-3"><CircuitGrid rows={subRows} onChange={setSubRows} minRows={10} /></div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <button className="w-full flex items-center justify-between px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors" onClick={() => setShowBranding(!showBranding)}>
            <span>Company Branding (optional)</span>
            {showBranding ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          {showBranding && (
            <div className="p-5 border-t border-slate-100 space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <Field label="Company Name" className="col-span-2 sm:col-span-1"><TF id="companyName" value={form.companyName} onChange={setField} /></Field>
                <Field label="ABN"><TF id="companyAbn" value={form.companyAbn} onChange={setField} /></Field>
                <Field label="Phone"><TF id="companyPhone" value={form.companyPhone} onChange={setField} /></Field>
                <Field label="Company Address" className="col-span-2 sm:col-span-3"><TF id="companyAddress" value={form.companyAddress} onChange={setField} /></Field>
                <Field label="Company Logo" className="col-span-2 sm:col-span-3">
                  {form.companyLogoUrl ? (
                    <div className="flex items-center gap-3">
                      <img src={form.companyLogoUrl} alt="Company logo" className="h-14 max-w-[180px] object-contain border border-slate-200 rounded-lg p-1 bg-white" />
                      <button onClick={() => setField('companyLogoUrl', '')} className="text-slate-400 hover:text-red-500 transition-colors"><X className="w-4 h-4" /></button>
                    </div>
                  ) : (
                    <label className="flex items-center gap-2 cursor-pointer w-fit">
                      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600 text-xs font-medium transition-colors">
                        {uploadingLogo ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                        {uploadingLogo ? 'Uploading…' : 'Upload Logo'}
                      </div>
                      <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} disabled={uploadingLogo} />
                      <span className="text-xs text-slate-400">PNG, JPG — shown on PDF</span>
                    </label>
                  )}
                </Field>
              </div>
              <button onClick={saveCompanyProfile} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 text-xs font-semibold hover:bg-emerald-100 transition-colors">
                <BookmarkCheck className="w-3.5 h-3.5" /> Save as Default (auto-fills new records)
              </button>
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <SH title="Declaration & Signature" colour="bg-slate-700" />
          <div className="p-5 space-y-4">
            <p className="text-xs text-slate-600 bg-slate-50 rounded-lg p-3 border border-slate-200">
              I declare that the electrical installation described above has been tested in accordance with AS/NZS 3000:2018 and AS/NZS 3017 and the results are as recorded above.
            </p>
            <Field label="Signature — Registered Electrical Worker">
              <SignaturePad value={form.signatureData} onChange={(v) => setField('signatureData', v || '')} />
            </Field>
            <Field label="Notes / Defects">
              <textarea value={form.notes || ''} onChange={(e) => setField('notes', e.target.value)} rows={3}
                placeholder="Any defects, observations or notes..."
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:border-[#0f2044] focus:ring-1 focus:ring-[#0f2044]/20" />
            </Field>
          </div>
        </div>

        <div className="flex justify-between items-center pb-8">
          <button onClick={() => navigate('/dashboard')} className="text-slate-400 hover:text-slate-600 text-sm flex items-center gap-1">
            <ArrowLeft className="w-4 h-4" /> Back to dashboard
          </button>
          <div className="flex gap-2">
            <button onClick={() => handleSave(false)} disabled={saving} className="flex items-center gap-1.5 px-4 py-2 border border-slate-200 rounded-xl text-sm hover:border-[#0f2044] disabled:opacity-60">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save Draft
            </button>
            <button onClick={() => handleSave(true)} disabled={saving} className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold disabled:opacity-60">
              <CheckCircle2 className="w-4 h-4" /> Mark Complete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}