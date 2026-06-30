import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import CircuitGrid, { emptyRow } from "@/components/CircuitGrid";
import SignaturePad from "@/components/SignaturePad";
import { ArrowLeft, Save, CheckCircle2, Loader2, Zap, FileDown, Share2, ChevronDown, ChevronUp, Plus, Trash2, Upload, X, Mail } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const DRAFT_KEY = "asnzs_draft";
const makeRows = (n) => Array.from({ length: n }, emptyRow);
const EMPTY_EQUIP_ROW = () => ({ type: "", serial: "", calDate: "" });
const EQUIP_PLACEHOLDERS = ["Insulation tester", "Multifunction tester", "Torque wrench", "Thermal camera"];

const EMPTY_FORM = {
  status: "Draft",
  date: new Date().toLocaleDateString("en-AU"),
  contractorName: "", contractorNumber: "", addressLocation: "",
  workerName: "", licenceNumber: "", switchboardNumber: "",
  pscAtMainSwitch: "", livePartsScreened: "", mainLinkNeutralReconnected: "",
  signatureData: "", clientEmail: "",
  msbName: "",
  msbMenCompliant: "", msbMaxDemand: "", msbMainSwitchCurrentRating: "",
  msbMainSwitchPscRating: "", msbConductorCcc: "", msbConductorSize: "",
  msbEarthContMain: "", msbEarthContEq: "", msbPolarity: "",
  msbInsResAE: "", msbInsResAN: "", msbInsResNE: "", msbInsResPP: "",
  msbCircuitLength: "", msbComments: "",
  companyName: "", companyAbn: "", companyPhone: "", companyAddress: "", companyLogoUrl: "",
  notes: "",
};

function SectionHeader({ title, colour }) {
  return <div className={`${colour} text-white px-4 py-2.5 font-bold text-sm uppercase tracking-wider rounded-t-xl`}>{title}</div>;
}

function Field({ label, children, className = "" }) {
  return (
    <div className={`space-y-1 ${className}`}>
      <Label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">{label}</Label>
      {children}
    </div>
  );
}

function TF({ id, value, onChange, placeholder = "", type = "text" }) {
  return <Input type={type} value={value || ""} onChange={(e) => onChange(id, e.target.value)} placeholder={placeholder} className="h-8 text-sm border-slate-200 focus:border-[#0f2044]" />;
}

function YNSelect({ id, value, onChange }) {
  return (
    <Select value={value || ""} onValueChange={(v) => onChange(id, v)}>
      <SelectTrigger className="h-8 text-sm border-slate-200"><SelectValue placeholder="—" /></SelectTrigger>
      <SelectContent><SelectItem value="yes">Yes</SelectItem><SelectItem value="no">No</SelectItem></SelectContent>
    </Select>
  );
}

function PFSelect({ id, value, onChange }) {
  return (
    <Select value={value || ""} onValueChange={(v) => onChange(id, v)}>
      <SelectTrigger className="h-8 text-sm border-slate-200"><SelectValue placeholder="—" /></SelectTrigger>
      <SelectContent><SelectItem value="pass">✓ Pass</SelectItem><SelectItem value="fail">✗ Fail</SelectItem></SelectContent>
    </Select>
  );
}

export default function RecordForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isNew = !id || id === "new";

  const [form, setForm] = useState(EMPTY_FORM);
  const [mainsRows, setMainsRows] = useState(makeRows(5));
  const [subRows, setSubRows] = useState(makeRows(10));
  const [equipRows, setEquipRows] = useState([EMPTY_EQUIP_ROW(), EMPTY_EQUIP_ROW(), EMPTY_EQUIP_ROW(), EMPTY_EQUIP_ROW()]);
  const [loading, setLoading] = useState(!!id && id !== "new");
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [showBranding, setShowBranding] = useState(false);
  const [copied, setCopied] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);

  useEffect(() => {
    if (isNew) {
      try {
        const draft = localStorage.getItem(DRAFT_KEY);
        if (draft) {
          const parsed = JSON.parse(draft);
          setForm({ ...EMPTY_FORM, ...parsed.form });
          if (parsed.mainsRows) setMainsRows(parsed.mainsRows);
          if (parsed.subRows) setSubRows(parsed.subRows);
        }
      } catch {}
      return;
    }
    base44.entities.TestRecord.get(id).then((data) => {
      setForm({ ...EMPTY_FORM, ...data });
      if (data.mainsCircuits) setMainsRows(data.mainsCircuits);
      if (data.subCircuits) setSubRows(data.subCircuits);
      if (data.testEquipment?.length) setEquipRows(data.testEquipment);
      if (data.companyName || data.companyLogoUrl) setShowBranding(true);
      setLoading(false);
    });
  }, [id, isNew]);

  useEffect(() => {
    if (!isNew) return;
    const interval = setInterval(() => {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ form, mainsRows, subRows, equipRows }));
    }, 30000);
    return () => clearInterval(interval);
  }, [form, mainsRows, subRows, equipRows, isNew]);

  const setField = useCallback((field, value) => setForm((f) => ({ ...f, [field]: value })), []);

  const handleSave = async (markComplete = false) => {
    setSaving(true);
    const payload = { ...form, status: markComplete ? "Complete" : (form.status || "Draft"), mainsCircuits: mainsRows, subCircuits: subRows, testEquipment: equipRows };
    try {
      if (isNew) {
        const created = await base44.entities.TestRecord.create(payload);
        localStorage.removeItem(DRAFT_KEY);
        toast({ title: markComplete ? "Record marked as complete ✓" : "Record saved" });
        navigate(`/records/${created.id}/edit`);
      } else {
        await base44.entities.TestRecord.update(id, payload);
        toast({ title: markComplete ? "Record marked as complete ✓" : "Record saved" });
      }
    } catch { toast({ title: "Failed to save record", variant: "destructive" }); }
    setSaving(false);
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingLogo(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setField("companyLogoUrl", file_url);
    setUploadingLogo(false);
  };

  const setEquipField = (index, field, value) => setEquipRows((rows) => rows.map((r, i) => i === index ? { ...r, [field]: value } : r));
  const addEquipRow = () => setEquipRows((rows) => [...rows, EMPTY_EQUIP_ROW()]);
  const removeEquipRow = (index) => { if (equipRows.length <= 1) return; setEquipRows((rows) => rows.filter((_, i) => i !== index)); };

  const handleEmailClient = async () => {
    if (!form.clientEmail) { toast({ title: "Please enter a client email first", variant: "destructive" }); return; }
    if (isNew) { toast({ title: "Please save the record first", variant: "destructive" }); return; }
    setSendingEmail(true);
    try {
      let shareToken = form.share_token;
      if (!shareToken) {
        shareToken = crypto.randomUUID().replace(/-/g, "").slice(0, 12);
        await base44.entities.TestRecord.update(id, { share_token: shareToken });
        setField("share_token", shareToken);
      }
      const shareUrl = `${window.location.origin}/share/${shareToken}`;
      const res = await base44.functions.invoke("sendJobCardEmail", {
        to: form.clientEmail, shareUrl,
        addressLocation: form.addressLocation, date: form.date,
        switchboardNumber: form.switchboardNumber, workerName: form.workerName,
        licenceNumber: form.licenceNumber, companyName: form.companyName, contractorName: form.contractorName,
      });
      if (res.data?.success) { toast({ title: "Email sent to client \u2713" }); }
      else { toast({ title: res.data?.error || "Failed to send email", variant: "destructive" }); }
    } catch { toast({ title: "Failed to send email", variant: "destructive" }); }
    setSendingEmail(false);
  };

  const handleCopyShareLink = async () => {
    if (!id || isNew) return;
    let shareToken = form.share_token;
    if (!shareToken) {
      shareToken = crypto.randomUUID().replace(/-/g, "").slice(0, 12);
      await base44.entities.TestRecord.update(id, { share_token: shareToken });
      setField("share_token", shareToken);
    }
    navigator.clipboard.writeText(`${window.location.origin}/share/${shareToken}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
    toast({ title: "Shareable link copied to clipboard" });
  };

  if (loading) return <div className="fixed inset-0 flex items-center justify-center bg-white"><Loader2 className="w-8 h-8 animate-spin text-[#0f2044]" /></div>;

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <nav className="bg-white border-b border-slate-100 sticky top-0 z-40 no-print">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <button onClick={() => navigate("/dashboard")} className="flex items-center gap-2 text-slate-600 hover:text-[#0f2044] transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <div className="w-6 h-6 rounded-lg bg-[#0f2044] flex items-center justify-center"><Zap className="w-3 h-3 text-[#F59E0B]" /></div>
            <span className="font-bold text-[#0f2044] text-sm hidden sm:block">AS/NZS Test Results</span>
          </button>
          <div className="flex items-center gap-2">
            {!isNew && (
              <>
                <Button variant="outline" size="sm" onClick={handleEmailClient} disabled={sendingEmail || !form.clientEmail} className="gap-1.5 text-xs" title={!form.clientEmail ? "Add client email first" : "Email job card to client"}>
                  {sendingEmail ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Mail className="w-3.5 h-3.5" />} Email Client
                </Button>
                <Button variant="outline" size="sm" onClick={handleCopyShareLink} className="gap-1.5 text-xs">
                  {copied ? <><CheckCircle2 className="w-3.5 h-3.5 text-green-500" /> Copied!</> : <><Share2 className="w-3.5 h-3.5" /> Share</>}
                </Button>
              </>
            )}
            <Button variant="outline" size="sm" onClick={() => !isNew && navigate(`/records/${id}/view`)} disabled={isNew} className="gap-1.5 text-xs">
              <FileDown className="w-3.5 h-3.5" /> View / PDF
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleSave(false)} disabled={saving} className="gap-1.5 text-xs">
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />} Save
            </Button>
            <Button size="sm" onClick={() => handleSave(true)} disabled={saving} className="gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white">
              <CheckCircle2 className="w-3.5 h-3.5" /> Mark Complete
            </Button>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-[#0f2044]">{isNew ? "New Test Record" : (form.addressLocation || "Record")}</h1>
          <p className="text-slate-500 text-sm mt-1">AS/NZS 3000:2018 & AS/NZS 3008 Schedule of Test Results</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <SectionHeader title="Contractor & Job Details" colour="bg-[#0f2044]" />
          <div className="p-5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            <Field label="Address / Location" className="col-span-2 sm:col-span-3 lg:col-span-2"><TF id="addressLocation" value={form.addressLocation} onChange={setField} placeholder="Site address" /></Field>
            <Field label="Date"><TF id="date" value={form.date} onChange={setField} type="date" /></Field>
            <Field label="Switchboard No."><TF id="switchboardNumber" value={form.switchboardNumber} onChange={setField} placeholder="SB-01" /></Field>
            <Field label="Contractor Name"><TF id="contractorName" value={form.contractorName} onChange={setField} /></Field>
            <Field label="Contractor Number"><TF id="contractorNumber" value={form.contractorNumber} onChange={setField} /></Field>
            <Field label="Worker Name"><TF id="workerName" value={form.workerName} onChange={setField} /></Field>
            <Field label="Licence Number"><TF id="licenceNumber" value={form.licenceNumber} onChange={setField} /></Field>
            <Field label="Client Email"><TF id="clientEmail" value={form.clientEmail} onChange={setField} type="email" placeholder="client@example.com" /></Field>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <SectionHeader title="Test Equipment" colour="bg-slate-700" />
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
                      <td className="px-3 py-2"><Input value={row.type || ""} onChange={(e) => setEquipField(i, "type", e.target.value)} placeholder={EQUIP_PLACEHOLDERS[i] || "Type / description"} className="h-8 text-sm border-slate-200 focus:border-[#0f2044]" /></td>
                      <td className="px-3 py-2"><Input value={row.serial || ""} onChange={(e) => setEquipField(i, "serial", e.target.value)} className="h-8 text-sm border-slate-200 focus:border-[#0f2044]" /></td>
                      <td className="px-3 py-2"><Input type="date" value={row.calDate || ""} onChange={(e) => setEquipField(i, "calDate", e.target.value)} className="h-8 text-sm border-slate-200 focus:border-[#0f2044]" /></td>
                      <td className="px-3 py-2"><button onClick={() => removeEquipRow(i)} disabled={equipRows.length <= 1} className="text-slate-300 hover:text-red-500 disabled:opacity-20 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-3">
              <Button variant="outline" size="sm" onClick={addEquipRow} className="gap-1.5 text-xs"><Plus className="w-3 h-3" /> Add Equipment</Button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <SectionHeader title="Switchboard" colour="bg-[#1e4080]" />
          <div className="p-5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            <Field label="Switchboard Name" className="col-span-2 sm:col-span-2 lg:col-span-2">
              <TF id="msbName" value={form.msbName} onChange={setField} placeholder="e.g. Main Switchboard, Distribution Board, EV Distribution Board" />
            </Field>
            <Field label="M.E.N. Compliant"><YNSelect id="msbMenCompliant" value={form.msbMenCompliant} onChange={setField} /></Field>
            <Field label="Max Demand (A)"><TF id="msbMaxDemand" value={form.msbMaxDemand} onChange={setField} /></Field>
            <Field label="Main Switch Current Rating (A)"><TF id="msbMainSwitchCurrentRating" value={form.msbMainSwitchCurrentRating} onChange={setField} /></Field>
            <Field label="Main Switch PSC Rating (kA)"><TF id="msbMainSwitchPscRating" value={form.msbMainSwitchPscRating} onChange={setField} /></Field>
            <Field label="Conductor CCC (A)"><TF id="msbConductorCcc" value={form.msbConductorCcc} onChange={setField} /></Field>
            <Field label="Conductor Size (mm²)"><TF id="msbConductorSize" value={form.msbConductorSize} onChange={setField} /></Field>
            <Field label="Earth Cont. — Main (Ω)"><TF id="msbEarthContMain" value={form.msbEarthContMain} onChange={setField} /></Field>
            <Field label="Earth Cont. — EQ (Ω)"><TF id="msbEarthContEq" value={form.msbEarthContEq} onChange={setField} /></Field>
            <Field label="Polarity"><PFSelect id="msbPolarity" value={form.msbPolarity} onChange={setField} /></Field>
            <Field label="Ins. Res. A-E (MΩ)"><TF id="msbInsResAE" value={form.msbInsResAE} onChange={setField} /></Field>
            <Field label="Ins. Res. A-N (MΩ)"><TF id="msbInsResAN" value={form.msbInsResAN} onChange={setField} /></Field>
            <Field label="Ins. Res. N-E (MΩ)"><TF id="msbInsResNE" value={form.msbInsResNE} onChange={setField} /></Field>
            <Field label="Ins. Res. Ph-Ph (MΩ)"><TF id="msbInsResPP" value={form.msbInsResPP} onChange={setField} /></Field>
            <Field label="PSC at Main Switch (kA)"><TF id="pscAtMainSwitch" value={form.pscAtMainSwitch} onChange={setField} /></Field>
            <Field label="Live Parts Screened"><YNSelect id="livePartsScreened" value={form.livePartsScreened} onChange={setField} /></Field>
            <Field label="Main Link / Neutral Reconnected"><YNSelect id="mainLinkNeutralReconnected" value={form.mainLinkNeutralReconnected} onChange={setField} /></Field>
            <Field label="Circuit Length (m)"><TF id="msbCircuitLength" value={form.msbCircuitLength} onChange={setField} /></Field>
            <Field label="Comments" className="col-span-2 lg:col-span-4">
              <Textarea value={form.msbComments || ""} onChange={(e) => setField("msbComments", e.target.value)} rows={2} className="text-sm border-slate-200 focus:border-[#0f2044]" />
            </Field>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <SectionHeader title="Consumer and Sub Mains" colour="bg-[#1e4080]" />
          <div className="p-3"><CircuitGrid rows={mainsRows} onChange={setMainsRows} minRows={5} /></div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <SectionHeader title="Final Sub Circuits" colour="bg-[#1a3a6b]" />
          <div className="p-3"><CircuitGrid rows={subRows} onChange={setSubRows} minRows={10} /></div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <button className="w-full flex items-center justify-between px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors" onClick={() => setShowBranding(!showBranding)}>
            <span>Company Branding (optional)</span>
            {showBranding ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          {showBranding && (
            <div className="p-5 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-3 gap-4">
              <Field label="Company Name" className="col-span-2 sm:col-span-1"><TF id="companyName" value={form.companyName} onChange={setField} /></Field>
              <Field label="ABN"><TF id="companyAbn" value={form.companyAbn} onChange={setField} /></Field>
              <Field label="Phone"><TF id="companyPhone" value={form.companyPhone} onChange={setField} /></Field>
              <Field label="Company Address" className="col-span-2 sm:col-span-3"><TF id="companyAddress" value={form.companyAddress} onChange={setField} /></Field>
              <Field label="Company Logo" className="col-span-2 sm:col-span-3">
                {form.companyLogoUrl ? (
                  <div className="flex items-center gap-3">
                    <img src={form.companyLogoUrl} alt="Company logo" className="h-14 max-w-[180px] object-contain border border-slate-200 rounded-lg p-1 bg-white" />
                    <button onClick={() => setField("companyLogoUrl", "")} className="text-slate-400 hover:text-red-500 transition-colors"><X className="w-4 h-4" /></button>
                  </div>
                ) : (
                  <label className="flex items-center gap-2 cursor-pointer w-fit">
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600 text-xs font-medium transition-colors">
                      {uploadingLogo ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                      {uploadingLogo ? "Uploading…" : "Upload Logo"}
                    </div>
                    <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} disabled={uploadingLogo} />
                    <span className="text-xs text-slate-400">PNG, JPG — shown on PDF</span>
                  </label>
                )}
              </Field>
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <SectionHeader title="Declaration & Signature" colour="bg-slate-700" />
          <div className="p-5 space-y-4">
            <p className="text-xs text-slate-600 bg-slate-50 rounded-lg p-3 border border-slate-200">
              I declare that the electrical installation described above has been tested in accordance with AS/NZS 3000:2018 and AS/NZS 3017 and the results are as recorded above.
            </p>
            <Field label="Signature — Registered Electrical Worker">
              <SignaturePad value={form.signatureData} onChange={(v) => setField("signatureData", v || "")} />
            </Field>
            <Field label="Notes / Defects">
              <Textarea value={form.notes || ""} onChange={(e) => setField("notes", e.target.value)} rows={3} placeholder="Any defects, observations or notes..." className="text-sm border-slate-200" />
            </Field>
          </div>
        </div>

        <div className="flex justify-between items-center pb-8 no-print">
          <button onClick={() => navigate("/dashboard")} className="text-slate-400 hover:text-slate-600 text-sm flex items-center gap-1">
            <ArrowLeft className="w-4 h-4" /> Back to dashboard
          </button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => handleSave(false)} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : <Save className="w-4 h-4 mr-1.5" />} Save Draft
            </Button>
            <Button onClick={() => handleSave(true)} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700 text-white">
              <CheckCircle2 className="w-4 h-4 mr-1.5" /> Mark Complete
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}