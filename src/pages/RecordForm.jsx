import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getRecord, createRecord, updateRecord } from '../lib/records';
import { useAuth } from '../hooks/useAuth.jsx';
import { supabase } from '../lib/supabase';
import CircuitGrid from '../components/CircuitGrid';
import SignaturePad from '../components/SignaturePad';
import {
  ArrowLeft, Save, CheckCircle2, Loader2, Zap,
  FileDown, Share2, ChevronDown, ChevronUp, Upload, X, BookmarkCheck, Mail
} from 'lucide-react';

const DRAFT_KEY = 'asnzs_draft';
const COMPANY_PROFILE_KEY = (userId) => `asnzs_company_${userId}`;

const emptyRow = () => ({
  circuitId: '', numPhases: '', maxDemand: '', ocpdType: '', ocpdCurrentRating: '', ocpdPscRating: '',
  conductorCcc: '', conductorSize: '', earthContMain: '', earthContEq: '', polarity: '',
  insResAE: '', insResAN: '', insResNE: '', insResPP: '', insResOk: '',
  zaRpheActual: '', zaRpheCompliant: '', rcdPushButton: '', rcdCurrentTrip: '',
  circuitLength: '', clearInterconnect: '', comments: '',
});

const makeRows = (n) => Array.from({ length: n }, emptyRow);

const EMPTY_FORM = {
  status: 'Draft',
  date: new Date().toLocaleDateString('en-AU'),
  addressLocation: '', switchboardNumber: '', contractorName: '',
  contractorNumber: '', workerName: '', licenceNumber: '', clientEmail: '',
  pscAtMainSwitch: '', livePartsScreened: '', mainLinkNeutralReconnected: '',
  signatureData: '',
  testEquip1Type: '', testEquip1Serial: '', testEquip1CalDate: '',
  testEquip2Type: '', testEquip2Serial: '', testEquip2CalDate: '',
  testEquip3Type: '', testEquip3Serial: '', testEquip3CalDate: '',
  testEquip4Type: '', testEquip4Serial: '', testEquip4CalDate: '',
  msbMenCompliant: '', msbMaxDemand: '', msbMainSwitchCurrentRating: '',
  msbMainSwitchPscRating: '', msbConductorCcc: '', msbConductorSize: '',
  msbEarthContMain: '', msbEarthContEq: '', msbPolarity: '',
  msbInsResAE: '', msbInsResAN: '', msbInsResNE: '', msbInsResPP: '',
  msbCircuitLength: '', msbComments: '',
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

// MSB displayed as a horizontal table row (label top, value bottom)
function MsbTable({ form, setField }) {
  const yn = [{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }];
  const pf = [{ value: 'pass', label: '✓ Pass' }, { value: 'fail', label: '✗ Fail' }];

  const Cell = ({ label, children }) => (
    <td className="border border-slate-200 px-2 py-1 min-w-[100px]">
      <div className="text-[9px] font-semibold text-slate-500 uppercase tracking-wide mb-1">{label}</div>
      {children}
    </td>
  );

  const inp = (id) => (
    <input value={form[id] || ''} onChange={(e) => setField(id, e.target.value)}
      className="w-full bg-transparent border-none outline-none text-xs focus:bg-blue-50/60 rounded px-0.5" />
  );

  const sel = (id, opts) => (
    <select value={form[id] || ''} onChange={(e) => setField(id, e.target.value)}
      className="w-full bg-transparent border-none outline-none text-xs focus:bg-blue-50/60 rounded appearance-none cursor-pointer">
      <option value="">—</option>
      {opts.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );

  return (
    <div className="p-3 overflow-x-auto">
      <table className="w-full text-xs border-collapse" style={{ minWidth: '1200px' }}>
        <thead>
          <tr className="bg-[#0f2044] text-white text-[9px] uppercase tracking-wider">
            <th className="border border-[#1e4080] px-2 py-1.5 text-center">M.E.N. Compliant</th>
            <th className="border border-[#1e4080] px-2 py-1.5 text-center">Max Demand (A)</th>
            <th className="border border-[#1e4080] px-2 py-1.5 text-center">Main Switch Rating (A)</th>
            <th className="border border-[#1e4080] px-2 py-1.5 text-center">Main Switch PSC (kA)</th>
            <th className="border border-[#1e4080] px-2 py-1.5 text-center">Conductor CCC (A)</th>
            <th className="border border-[#1e4080] px-2 py-1.5 text-center">Conductor Size (mm²)</th>
            <th className="border border-[#1e4080] px-2 py-1.5 text-center">Earth Cont. Main (Ω)</th>
            <th className="border border-[#1e4080] px-2 py-1.5 text-center">Earth Cont. EQ (Ω)</th>
            <th className="border border-[#1e4080] px-2 py-1.5 text-center">Polarity</th>
            <th className="border border-[#1e4080] px-2 py-1.5 text-center">Ins. Res. A-E (MΩ)</th>
            <th className="border border-[#1e4080] px-2 py-1.5 text-center">Ins. Res. A-N (MΩ)</th>
            <th className="border border-[#1e4080] px-2 py-1.5 text-center">Ins. Res. N-E (MΩ)</th>
            <th className="border border-[#1e4080] px-2 py-1.5 text-center">Ins. Res. Ph-Ph (MΩ)</th>
            <th className="border border-[#1e4080] px-2 py-1.5 text-center">PSC at Main Switch (kA)</th>
            <th className="border border-[#1e4080] px-2 py-1.5 text-center">Live Parts Screened</th>
            <th className="border border-[#1e4080] px-2 py-1.5 text-center">Main Link / Neutral Reconnected</th>
            <th className="border border-[#1e4080] px-2 py-1.5 text-center">Circuit Length (m)</th>
          </tr>
        </thead>
        <tbody>
          <tr className="bg-white">
            <td className="border border-slate-200 px-1 py-1">{sel('msbMenCompliant', yn)}</td>
            <td className="border border-slate-200 px-1 py-1">{inp('msbMaxDemand')}</td>
            <td className="border border-slate-200 px-1 py-1">{inp('msbMainSwitchCurrentRating')}</td>
            <td className="border border-slate-200 px-1 py-1">{inp('msbMainSwitchPscRating')}</td>
            <td className="border border-slate-200 px-1 py-1">{inp('msbConductorCcc')}</td>
            <td className="border border-slate-200 px-1 py-1">{inp('msbConductorSize')}</td>
            <td className="border border-slate-200 px-1 py-1">{inp('msbEarthContMain')}</td>
            <td className="border border-slate-200 px-1 py-1">{inp('msbEarthContEq')}</td>
            <td className="border border-slate-200 px-1 py-1">{sel('msbPolarity', pf)}</td>
            <td className="border border-slate-200 px-1 py-1">{inp('msbInsResAE')}</td>
            <td className="border border-slate-200 px-1 py-1">{inp('msbInsResAN')}</td>
            <td className="border border-slate-200 px-1 py-1">{inp('msbInsResNE')}</td>
            <td className="border border-slate-200 px-1 py-1">{inp('msbInsResPP')}</td>
            <td className="border border-slate-200 px-1 py-1">{inp('pscAtMainSwitch')}</td>
            <td className="border border-slate-200 px-1 py-1">{sel('livePartsScreened', yn)}</td>
            <td className="border border-slate-200 px-1 py-1">{sel('mainLinkNeutralReconnected', yn)}</td>
            <td className="border border-slate-200 px-1 py-1">{inp('msbCircuitLength')}</td>
          </tr>
        </tbody>
      </table>
      <div className="mt-3">
        <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide block mb-1">Comments</label>
        <textarea value={form.msbComments || ''} onChange={(e) => setField('msbComments', e.target.value)} rows={2}
          className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:border-[#0f2044] focus:ring-1 focus:ring-[#0f2044]/20" />
      </div>
    </div>
  );
}

const YN_OPTIONS = [{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }];
const PF_OPTIONS = [{ value: 'pass', label: '✓ Pass' }, { value: 'fail', label: '✗ Fail' }];

export default function RecordForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isNew = !id || id === 'new';

  const [form, setForm] = useState(EMPTY_FORM);
  const [mainsRows, setMainsRows] = useState(makeRows(5));
  const [subRows, setSubRows] = useState(makeRows(20));
  const [loading, setLoading] = useState(!!id && id !== 'new');
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [showBranding, setShowBranding] = useState(false);
  const [toast, setToast] = useState('');
  const [copied, setCopied] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);

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
        }
      } catch { if (companyProfile) setForm({ ...EMPTY_FORM, ...companyProfile }); }
      if (companyProfile) setShowBranding(true);
      return;
    }
    getRecord(id).then((data) => {
      setForm({ ...EMPTY_FORM, ...data });
      if (data.mainsCircuits?.length) setMainsRows(data.mainsCircuits);
      if (data.subCircuits?.length) setSubRows(data.subCircuits);
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
      const { error } = await supabase.storage.from('Company Logos').upload(path, file, { upsert: true });
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from('Company Logos').getPublicUrl(path);
      setField('companyLogoUrl', publicUrl);
    } catch (err) {
      showToast('Logo upload failed: ' + err.message);
    }
    setUploadingLogo(false);
  };

  const handleSave = async (markComplete = false) => {
    setSaving(true);
    const payload = { ...form, status: markComplete ? 'Complete' : (form.status || 'Draft'), mainsCircuits: mainsRows, subCircuits: subRows };
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

  const handleEmailClient = async () => {
    if (!form.clientEmail) { showToast('Please enter a client email first'); return; }
    if (isNew) { showToast('Please save the record first'); return; }
    setSendingEmail(true);
    try {
      // Generate share token if needed
      let shareToken = form.share_token;
      if (!shareToken) {
        shareToken = crypto.randomUUID().replace(/-/g, '').slice(0, 12);
        await updateRecord(id, { ...form, share_token: shareToken, mainsCircuits: mainsRows, subCircuits: subRows });
        setField('share_token', shareToken);
      }
      const shareUrl = `${window.location.origin}/share/${shareToken}`;
      const subject = encodeURIComponent(`Electrical Test Results — ${form.addressLocation || 'Job'}`);
      const body = encodeURIComponent(
        `Dear Client,\n\nPlease find below a link to your electrical test results for the following job:\n\n` +
        `Address: ${form.addressLocation || '—'}\n` +
        `Date: ${form.date || '—'}\n` +
        `Switchboard: ${form.switchboardNumber || '—'}\n` +
        `Worker: ${form.workerName || '—'}\n` +
        `Licence: ${form.licenceNumber || '—'}\n\n` +
        `View & download your test results here:\n${shareUrl}\n\n` +
        `From the link you can also print or save as PDF.\n\n` +
        `Regards,\n${form.companyName || form.contractorName || 'Your Electrician'}`
      );
      window.open(`mailto:${form.clientEmail}?subject=${subject}&body=${body}`);
      showToast('Email client opened ✓');
    } catch (e) {
      showToast('Error: ' + e.message);
    }
    setSendingEmail(false);
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
              <>
                <button onClick={handleEmailClient} disabled={sendingEmail || !form.clientEmail} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-medium hover:border-blue-400 hover:text-blue-600 disabled:opacity-40 transition-colors" title={!form.clientEmail ? 'Add client email first' : 'Email job card to client'}>
                  {sendingEmail ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Mail className="w-3.5 h-3.5" />} Email Client
                </button>
                <button onClick={handleCopyShareLink} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-medium hover:border-[#0f2044] transition-colors">
                  {copied ? <><CheckCircle2 className="w-3.5 h-3.5 text-green-500" /> Copied!</> : <><Share2 className="w-3.5 h-3.5" /> Share</>}
                </button>
              </>
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

        {/* Contractor & Job Details */}
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
            <Field label="Client Email"><TF id="clientEmail" value={form.clientEmail} onChange={setField} type="email" placeholder="client@example.com" /></Field>
          </div>
        </div>

        {/* Test Equipment */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <SH title="Test Equipment" colour="bg-slate-700" />
          <div className="p-5 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-xs text-slate-500 uppercase tracking-wide">
                  <th className="text-left px-3 py-2">#</th>
                  <th className="text-left px-3 py-2">Type / Description</th>
                  <th className="text-left px-3 py-2">Serial Number</th>
                  <th className="text-left px-3 py-2">Cal. Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {[1, 2, 3, 4].map((n) => (
                  <tr key={n}>
                    <td className="px-3 py-2 text-slate-400 font-mono text-xs">{n}</td>
                    <td className="px-3 py-2"><TF id={`testEquip${n}Type`} value={form[`testEquip${n}Type`]} onChange={setField} placeholder="e.g. Insulation tester" /></td>
                    <td className="px-3 py-2"><TF id={`testEquip${n}Serial`} value={form[`testEquip${n}Serial`]} onChange={setField} /></td>
                    <td className="px-3 py-2"><TF id={`testEquip${n}CalDate`} value={form[`testEquip${n}CalDate`]} onChange={setField} type="date" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Main Switchboard — displayed as a single data row */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <SH title="Main Switchboard (MSB)" colour="bg-[#1e4080]" />
          <MsbTable form={form} setField={setField} />
        </div>

        {/* Consumer and Sub Mains */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <SH title="Consumer and Sub Mains" colour="bg-[#1e4080]" />
          <div className="p-3"><CircuitGrid rows={mainsRows} onChange={setMainsRows} minRows={5} /></div>
        </div>

        {/* Final Sub Circuits */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <SH title="Final Sub Circuits" colour="bg-[#1a3a6b]" />
          <div className="p-3"><CircuitGrid rows={subRows} onChange={setSubRows} minRows={10} /></div>
        </div>

        {/* Company Branding */}
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

        {/* Declaration & Signature */}
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