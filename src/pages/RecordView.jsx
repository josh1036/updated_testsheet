import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getRecord, getRecordByShareToken } from '../lib/records';
import CircuitGrid from '../components/CircuitGrid';
import PdfActionModal from '../components/PdfActionModal';
import { buildTestRecordFilename, elementToPdfBlob } from '../lib/pdfUtils';
import { ArrowLeft, Printer, Edit, Zap, CheckCircle2, Clock, Loader2, Download } from 'lucide-react';

function Row({ label, value }) {
  return (
    <tr className="border-b border-slate-100">
      <td className="py-1.5 pr-4 text-xs text-slate-500 font-semibold uppercase tracking-wide w-48">{label}</td>
      <td className="py-1.5 text-sm text-slate-800">{value || '—'}</td>
    </tr>
  );
}

function SH({ title, colour }) {
  return <div className={`${colour} text-white px-4 py-2.5 font-bold text-sm uppercase tracking-wider`}>{title}</div>;
}

const emptyRow = () => ({
  circuitId: '', numPhases: '', maxDemand: '', ocpdType: '', ocpdCurrentRating: '', ocpdPscRating: '',
  conductorCcc: '', conductorSize: '', earthContMain: '', earthContEq: '', polarity: '',
  insResAE: '', insResAN: '', insResNE: '', insResPP: '', insResOk: '',
  zaRpheActual: '', zaRpheCompliant: '', rcdPushButton: '', rcdCurrentTrip: '',
  circuitLength: '', clearInterconnect: '', comments: '',
});

export default function RecordView({ shareMode = false }) {
  const params = useParams();
  const navigate = useNavigate();
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const reportRef = useRef(null);
  const [pdfModal, setPdfModal] = useState({ open: false, blob: null, generating: false, progress: 0, error: null });

  useEffect(() => {
    const load = async () => {
      if (shareMode && params.token) {
        setRecord(await getRecordByShareToken(params.token));
      } else {
        setRecord(await getRecord(params.id));
      }
      setLoading(false);
    };
    load();
  }, [params.id, params.token, shareMode]);

  const handleSavePdf = async () => {
    setPdfModal({ open: true, blob: null, generating: true, progress: 0.05, error: null });
    try {
      const el = reportRef.current;
      if (!el) throw new Error('Report content not found.');
      const blob = await elementToPdfBlob(el, { onProgress: p => setPdfModal(m => ({ ...m, progress: p })) });
      setPdfModal({ open: true, blob, generating: false, progress: 1, error: null });
    } catch (err) {
      setPdfModal({ open: true, blob: null, generating: false, progress: 0, error: err.message });
    }
  };

  if (loading) return (
    <div className="fixed inset-0 flex items-center justify-center bg-white">
      <Loader2 className="w-8 h-8 animate-spin text-[#0f2044]" />
    </div>
  );

  if (!record) return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4">
      <p className="text-slate-500">Record not found or access denied.</p>
      {!shareMode && <button onClick={() => navigate('/dashboard')} className="bg-[#0f2044] text-white px-4 py-2 rounded-xl text-sm">Back to Dashboard</button>}
    </div>
  );

  const mainsRows = record.mainsCircuits?.length > 0 ? record.mainsCircuits : Array.from({ length: 5 }, emptyRow);
  const subRows = record.subCircuits?.length > 0 ? record.subCircuits : Array.from({ length: 20 }, emptyRow);
  const hasCompanyBranding = record.companyName || record.companyAbn || record.companyPhone || record.companyLogoUrl;
  const filename = buildTestRecordFilename(record);

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      {/* Sticky top nav bar */}
      <div className="bg-white border-b border-slate-100 sticky top-0 z-40 no-print">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {!shareMode && (
              <button onClick={() => navigate('/dashboard')} className="flex items-center gap-1.5 text-slate-500 hover:text-[#0f2044] text-sm transition-colors">
                <ArrowLeft className="w-4 h-4" /> Dashboard
              </button>
            )}
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-[#0f2044] flex items-center justify-center"><Zap className="w-3 h-3 text-[#F59E0B]" /></div>
              <span className="font-semibold text-slate-700 text-sm truncate">{record.addressLocation || 'Test Record'}</span>
              {record.status === 'Complete'
                ? <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700"><CheckCircle2 className="w-3 h-3" /> Complete</span>
                : <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700"><Clock className="w-3 h-3" /> Draft</span>
              }
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => window.print()} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 text-sm hover:border-[#0f2044] transition-colors no-print">
              <Printer className="w-4 h-4" /> Print
            </button>
            <button onClick={handleSavePdf} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0f2044] text-white text-sm hover:bg-[#162d4a] transition-colors no-print">
              <Download className="w-4 h-4" /> Save PDF
            </button>
            {!shareMode && params.id && (
              <button onClick={() => navigate(`/records/${params.id}/edit`)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#0f2044] text-[#0f2044] text-sm hover:bg-blue-50 transition-colors no-print">
                <Edit className="w-4 h-4" /> Edit
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Hidden off-screen render target for PDF generation */}
      <div
        ref={reportRef}
        style={{ position: 'fixed', top: 0, left: 0, width: '794px', opacity: 0, pointerEvents: 'none', zIndex: -1, background: 'white', overflow: 'visible' }}
        aria-hidden="true"
      >
        <div className="report-page" style={{ width: '794px', minHeight: '1123px', background: 'white', padding: '32px' }}>
          {hasCompanyBranding && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', marginBottom: '16px', padding: '16px', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
              {record.companyLogoUrl && <img src={record.companyLogoUrl} alt="Company logo" style={{ height: '64px', maxWidth: '160px', objectFit: 'contain' }} />}
              <div>
                {record.companyName && <div style={{ fontWeight: 'bold', color: '#0f2044', fontSize: '18px' }}>{record.companyName}</div>}
                {record.companyAbn && <div style={{ fontSize: '13px', color: '#64748b' }}>ABN: {record.companyAbn}</div>}
                {record.companyPhone && <div style={{ fontSize: '13px', color: '#64748b' }}>{record.companyPhone}</div>}
                {record.companyAddress && <div style={{ fontSize: '13px', color: '#64748b' }}>{record.companyAddress}</div>}
              </div>
            </div>
          )}
          <div style={{ background: 'linear-gradient(135deg, #0f2044, #1e4080)', color: 'white', borderRadius: '8px', padding: '24px', marginBottom: '16px' }}>
            <div style={{ fontSize: '20px', fontWeight: 'bold' }}>Schedule of Test Results</div>
            <div style={{ fontSize: '11px', color: '#bfdbfe', marginTop: '4px' }}>Mandatory testing in accordance with AS/NZS 3000:2018 clause 8.3</div>
            {record.signatureData && (
              <div style={{ marginTop: '16px' }}>
                <div style={{ fontSize: '10px', color: '#93c5fd', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '600' }}>Digital Signature</div>
                <img src={record.signatureData} alt="Signature" style={{ height: '48px', background: 'white', borderRadius: '8px', padding: '4px 8px' }} />
              </div>
            )}
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '16px', fontSize: '12px' }}>
            <thead><tr style={{ background: '#0f2044', color: 'white' }}><th colSpan={4} style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Contractor &amp; Job Details</th></tr></thead>
            <tbody>
              <tr><td style={{ padding: '4px 8px', color: '#64748b', fontWeight: '600', textTransform: 'uppercase', fontSize: '10px', width: '25%' }}>Address / Location</td><td style={{ padding: '4px 8px', width: '25%' }}>{record.addressLocation || '—'}</td><td style={{ padding: '4px 8px', color: '#64748b', fontWeight: '600', textTransform: 'uppercase', fontSize: '10px', width: '25%' }}>Date</td><td style={{ padding: '4px 8px', width: '25%' }}>{record.date || '—'}</td></tr>
              <tr style={{ background: '#f8fafc' }}><td style={{ padding: '4px 8px', color: '#64748b', fontWeight: '600', textTransform: 'uppercase', fontSize: '10px' }}>Switchboard No.</td><td style={{ padding: '4px 8px' }}>{record.switchboardNumber || '—'}</td><td style={{ padding: '4px 8px', color: '#64748b', fontWeight: '600', textTransform: 'uppercase', fontSize: '10px' }}>Contractor Name</td><td style={{ padding: '4px 8px' }}>{record.contractorName || '—'}</td></tr>
              <tr><td style={{ padding: '4px 8px', color: '#64748b', fontWeight: '600', textTransform: 'uppercase', fontSize: '10px' }}>Contractor Number</td><td style={{ padding: '4px 8px' }}>{record.contractorNumber || '—'}</td><td style={{ padding: '4px 8px', color: '#64748b', fontWeight: '600', textTransform: 'uppercase', fontSize: '10px' }}>Worker Name</td><td style={{ padding: '4px 8px' }}>{record.workerName || '—'}</td></tr>
              <tr style={{ background: '#f8fafc' }}><td style={{ padding: '4px 8px', color: '#64748b', fontWeight: '600', textTransform: 'uppercase', fontSize: '10px' }}>Licence Number</td><td style={{ padding: '4px 8px' }}>{record.licenceNumber || '—'}</td><td style={{ padding: '4px 8px', color: '#64748b', fontWeight: '600', textTransform: 'uppercase', fontSize: '10px' }}>Client Email</td><td style={{ padding: '4px 8px' }}>{record.clientEmail || '—'}</td></tr>
            </tbody>
          </table>
          <div style={{ marginBottom: '16px' }}>
            <div style={{ background: '#1e4080', color: 'white', padding: '8px 12px', fontWeight: 'bold', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em', borderRadius: '4px 4px 0 0' }}>Consumer and Sub Mains</div>
            <div style={{ border: '1px solid #e2e8f0', borderTop: 'none', padding: '8px', borderRadius: '0 0 4px 4px' }}>
              <CircuitGrid rows={mainsRows} onChange={() => {}} readOnly />
            </div>
          </div>
          <div style={{ marginBottom: '16px' }}>
            <div style={{ background: '#1a3a6b', color: 'white', padding: '8px 12px', fontWeight: 'bold', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em', borderRadius: '4px 4px 0 0' }}>Final Sub Circuits</div>
            <div style={{ border: '1px solid #e2e8f0', borderTop: 'none', padding: '8px', borderRadius: '0 0 4px 4px' }}>
              <CircuitGrid rows={subRows} onChange={() => {}} readOnly />
            </div>
          </div>
          <div>
            <div style={{ background: '#475569', color: 'white', padding: '8px 12px', fontWeight: 'bold', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em', borderRadius: '4px 4px 0 0' }}>Declaration</div>
            <div style={{ border: '1px solid #e2e8f0', borderTop: 'none', padding: '16px', borderRadius: '0 0 4px 4px' }}>
              <p style={{ fontSize: '11px', color: '#475569', marginBottom: '12px' }}>I declare that the electrical installation described above has been tested in accordance with AS/NZS 3000:2018 and AS/NZS 3017 and the results are as recorded above.</p>
              {record.signatureData && (
                <div style={{ marginBottom: '12px' }}>
                  <div style={{ fontSize: '10px', color: '#64748b', fontWeight: '600', marginBottom: '4px' }}>Signature</div>
                  <img src={record.signatureData} alt="Signature" style={{ height: '64px', border: '1px solid #e2e8f0', borderRadius: '8px' }} />
                </div>
              )}
              <table style={{ fontSize: '11px' }}>
                <tbody>
                  <tr><td style={{ paddingRight: '16px', color: '#64748b', fontWeight: '600', textTransform: 'uppercase', fontSize: '10px' }}>Name</td><td>{record.workerName || '—'}</td></tr>
                  <tr><td style={{ paddingRight: '16px', color: '#64748b', fontWeight: '600', textTransform: 'uppercase', fontSize: '10px' }}>Licence No.</td><td>{record.licenceNumber || '—'}</td></tr>
                </tbody>
              </table>
              {record.notes && (
                <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px', padding: '12px', marginTop: '12px' }}>
                  <div style={{ fontSize: '10px', color: '#64748b', fontWeight: '600', textTransform: 'uppercase', marginBottom: '4px' }}>Notes / Defects</div>
                  <p style={{ fontSize: '12px', color: '#334155' }}>{record.notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Visible on-screen record content */}
      <div className="max-w-5xl mx-auto px-4 py-6 space-y-4 print-page">
        {hasCompanyBranding && (
          <div className="bg-white rounded-xl border border-slate-200 p-5 flex items-start gap-4">
            {record.companyLogoUrl && <img src={record.companyLogoUrl} alt="Company logo" className="h-16 max-w-[160px] object-contain" />}
            <div>
              {record.companyName && <div className="font-bold text-[#0f2044] text-lg">{record.companyName}</div>}
              {record.companyAbn && <div className="text-sm text-slate-500">ABN: {record.companyAbn}</div>}
              {record.companyPhone && <div className="text-sm text-slate-500">{record.companyPhone}</div>}
              {record.companyAddress && <div className="text-sm text-slate-500">{record.companyAddress}</div>}
            </div>
          </div>
        )}
        <div className="bg-gradient-to-br from-[#0f2044] to-[#1e4080] text-white rounded-xl p-6">
          <h1 className="text-xl font-bold tracking-tight">Schedule of Test Results</h1>
          <p className="text-blue-200 text-xs mt-1">Mandatory testing in accordance with AS/NZS 3000:2018 clause 8.3</p>
          {record.signatureData && (
            <div className="mt-4">
              <p className="text-xs text-blue-300 mb-1 uppercase tracking-wide font-semibold">Digital Signature</p>
              <img src={record.signatureData} alt="Signature" className="h-12 bg-white rounded-lg px-2 py-1" />
            </div>
          )}
        </div>
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <SH title="Contractor & Job Details" colour="bg-[#0f2044]" />
          <div className="p-4 grid sm:grid-cols-2 gap-x-8">
            <table className="w-full"><tbody>
              <Row label="Address / Location" value={record.addressLocation} />
              <Row label="Date" value={record.date} />
              <Row label="Switchboard No." value={record.switchboardNumber} />
              <Row label="Contractor Name" value={record.contractorName} />
            </tbody></table>
            <table className="w-full"><tbody>
              <Row label="Contractor Number" value={record.contractorNumber} />
              <Row label="Worker Name" value={record.workerName} />
              <Row label="Licence Number" value={record.licenceNumber} />
              <Row label="Client Email" value={record.clientEmail} />
            </tbody></table>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <SH title="Consumer and Sub Mains" colour="bg-[#1e4080]" />
          <div className="p-3"><CircuitGrid rows={mainsRows} onChange={() => {}} readOnly /></div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <SH title="Final Sub Circuits" colour="bg-[#1a3a6b]" />
          <div className="p-3"><CircuitGrid rows={subRows} onChange={() => {}} readOnly /></div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <SH title="Declaration" colour="bg-slate-700" />
          <div className="p-5 space-y-3">
            <p className="text-xs text-slate-600">I declare that the electrical installation described above has been tested in accordance with AS/NZS 3000:2018 and AS/NZS 3017 and the results are as recorded above.</p>
            {record.signatureData && (
              <div>
                <p className="text-xs text-slate-500 font-semibold mb-1">Signature</p>
                <img src={record.signatureData} alt="Signature" className="h-16 border border-slate-200 rounded-lg" />
              </div>
            )}
            <table className="w-full max-w-sm"><tbody>
              <Row label="Name" value={record.workerName} />
              <Row label="Licence No." value={record.licenceNumber} />
            </tbody></table>
            {record.notes && (
              <div className="bg-amber-50 border border-amber-100 rounded-lg p-3">
                <p className="text-xs text-slate-500 font-semibold mb-1 uppercase">Notes / Defects</p>
                <p className="text-sm text-slate-700">{record.notes}</p>
              </div>
            )}
          </div>
        </div>
        <div className="flex justify-between items-center pb-8 no-print">
          {!shareMode && (
            <button onClick={() => navigate('/dashboard')} className="text-slate-400 hover:text-slate-600 text-sm flex items-center gap-1">
              <ArrowLeft className="w-4 h-4" /> Back to Dashboard
            </button>
          )}
          <div className="flex gap-2 ml-auto">
            <button onClick={() => window.print()} className="flex items-center gap-1.5 px-4 py-2 border border-slate-200 rounded-xl text-sm hover:border-[#0f2044] transition-colors">
              <Printer className="w-4 h-4" /> Print
            </button>
            <button onClick={handleSavePdf} className="flex items-center gap-1.5 px-4 py-2 bg-[#0f2044] text-white rounded-xl text-sm hover:bg-[#162d4a] transition-colors">
              <Download className="w-4 h-4" /> Save PDF
            </button>
            {!shareMode && params.id && (
              <button onClick={() => navigate(`/records/${params.id}/edit`)} className="flex items-center gap-1.5 px-4 py-2 border border-[#0f2044] text-[#0f2044] rounded-xl text-sm hover:bg-blue-50 transition-colors">
                <Edit className="w-4 h-4" /> Edit Record
              </button>
            )}
          </div>
        </div>
      </div>

      <PdfActionModal
        open={pdfModal.open}
        onClose={() => setPdfModal(m => ({ ...m, open: false }))}
        pdfBlob={pdfModal.blob}
        generating={pdfModal.generating}
        progress={pdfModal.progress}
        error={pdfModal.error}
        filename={filename}
      />
    </div>
  );
}
