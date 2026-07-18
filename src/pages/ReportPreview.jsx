import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getRecord } from '../lib/records';
import { ArrowLeft, Edit, Loader2, Download } from 'lucide-react';
import PdfActionModal from '../components/PdfActionModal';
import { buildTestRecordFilename, elementToPdfBlob } from '../lib/pdfUtils';

const T = '#0f2044';

function Row({ label, value }) {
  if (!value) return null;
  return (
    <div style={{ display: 'flex', gap: '14px', padding: '6px 0', borderBottom: '1px solid #f0eeec', alignItems: 'baseline' }}>
      <span style={{ fontSize: '8px', fontWeight: 700, color: '#a8a29e', textTransform: 'uppercase', letterSpacing: '0.1em', width: '130px', flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: '10px', color: '#1c1917', fontWeight: 500 }}>{value}</span>
    </div>
  );
}

function SHead({ title }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', marginTop: '16px' }}>
      <div style={{ width: '3px', height: '15px', background: T, borderRadius: '1px', flexShrink: 0 }} />
      <h2 style={{ fontSize: '9px', fontWeight: 900, color: '#1c1917', textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0 }}>{title}</h2>
      <div style={{ flex: 1, height: '1px', background: '#e7e5e0' }} />
    </div>
  );
}

function PH({ record }) {
  return (
    <div style={{ marginBottom: '14px', paddingBottom: '10px', borderBottom: `2px solid ${T}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {record.companyLogoUrl
          ? <img src={record.companyLogoUrl} alt="Logo" style={{ height: '26px', maxWidth: '100px', objectFit: 'contain' }} />
          : <span style={{ fontSize: '10px', fontWeight: 800, color: T }}>{record.companyName || 'TestSheet'}</span>
        }
        {record.companyLogoUrl && record.companyName && <span style={{ fontSize: '9px', fontWeight: 700, color: '#1c1917', borderLeft: '1px solid #e7e5e0', paddingLeft: '8px' }}>{record.companyName}</span>}
      </div>
      <div style={{ textAlign: 'right' }}>
        <p style={{ fontSize: '8px', fontWeight: 700, color: T, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Schedule of Test Results</p>
        <p style={{ fontSize: '7px', color: '#a8a29e', marginTop: '2px' }}>AS/NZS 3000:2018 · Clause 8.3</p>
      </div>
    </div>
  );
}

function PF({ record, pageLabel }) {
  return (
    <div style={{ borderTop: '1px solid #e7e5e0', paddingTop: '8px', marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ fontSize: '7px', color: '#a8a29e' }}>{record.companyName || ''}</span>
      {pageLabel && <span style={{ fontSize: '7.5px', color: T, fontWeight: 700, background: '#dbeafe', padding: '2px 8px', borderRadius: '2px' }}>{pageLabel}</span>}
    </div>
  );
}

function PassBadge({ value }) {
  if (!value) return null;
  const v = String(value).toLowerCase();
  if (v === 'pass' || v === 'yes' || v === '✓ pass') return <span style={{ fontSize: '8px', fontWeight: 700, color: '#15803d', background: '#dcfce7', border: '1px solid #86efac', padding: '2px 7px', borderRadius: '3px' }}>✓ {v === 'yes' ? 'Yes' : 'Pass'}</span>;
  if (v === 'fail' || v === 'no' || v === '✗ fail') return <span style={{ fontSize: '8px', fontWeight: 700, color: '#dc2626', background: '#fef2f2', border: '1px solid #fca5a5', padding: '2px 7px', borderRadius: '3px' }}>✗ {v === 'no' ? 'No' : 'Fail'}</span>;
  return <span style={{ fontSize: '9px', color: '#1c1917' }}>{value}</span>;
}

function CircuitTbl({ rows }) {
  const filled = (rows || []).filter(r => r.circuitId || r.conductorSize || r.maxDemand);
  if (!filled.length) return null;
  const allCols = [
    { key: 'circuitId', label: 'Circuit ID' }, { key: 'numPhases', label: 'Ph' },
    { key: 'maxDemand', label: 'Max Dem (A)' }, { key: 'ocpdType', label: 'OCPD Type' },
    { key: 'ocpdCurrentRating', label: 'OCPD (A)' }, { key: 'conductorCcc', label: 'CCC (A)' },
    { key: 'conductorSize', label: 'Size (mm²)' }, { key: 'earthContMain', label: 'Earth Main' },
    { key: 'polarity', label: 'Polarity', pf: true }, { key: 'insResAE', label: 'IR A-E (MΩ)' },
    { key: 'insResAN', label: 'IR A-N (MΩ)' }, { key: 'zaRpheActual', label: 'Za/Rphe (Ω)' },
    { key: 'zaRpheCompliant', label: 'Za Comply', pf: true }, { key: 'rcdPushButton', label: 'RCD Test', pf: true },
    { key: 'rcdCurrentTrip', label: 'RCD (ms)' }, { key: 'circuitLength', label: 'Length (m)' },
    { key: 'comments', label: 'Comments' },
  ];
  const cols = allCols.filter(c => filled.some(r => r[c.key] && r[c.key] !== 'na'));
  return (
    <div style={{ border: '1px solid #e7e5e0', borderRadius: '3px', overflow: 'hidden' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'auto' }}>
        <thead>
          <tr style={{ background: T }}>
            {cols.map(c => <th key={c.key} style={{ padding: '6px 7px', textAlign: 'left', color: '#dbeafe', fontSize: '7px', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', borderRight: '1px solid #1e3a6e', whiteSpace: 'nowrap' }}>{c.label}</th>)}
          </tr>
        </thead>
        <tbody>
          {filled.map((row, i) => (
            <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : '#f0f5ff', pageBreakInside: 'avoid' }}>
              {cols.map(c => {
                const val = row[c.key];
                const empty = !val || val === 'na';
                return <td key={c.key} style={{ padding: '5px 7px', borderBottom: '1px solid #f0eeec', borderRight: '1px solid #f0eeec', fontSize: '8.5px', color: c.key === 'circuitId' ? T : '#44403c', fontWeight: c.key === 'circuitId' ? 700 : 400 }}>{empty ? null : c.pf ? <PassBadge value={val} /> : val}</td>;
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PageWrap({ children }) {
  return (
    <div className="report-page" style={{ width: '210mm', minHeight: '297mm', padding: '16mm 16mm 20mm 16mm', boxSizing: 'border-box', background: 'white', display: 'flex', flexDirection: 'column', pageBreakAfter: 'always', breakAfter: 'page' }}>
      {children}
    </div>
  );
}

function ReportContent({ record }) {
  const r = record;
  const swId = r.msbName === 'Other' ? (r.msbNameOther || 'Other') : r.msbName;
  const equip = [1,2,3,4].filter(n => r[`testEquip${n}Type`]).map(n => ({ type: r[`testEquip${n}Type`], serial: r[`testEquip${n}Serial`], calDate: r[`testEquip${n}CalDate`] }));
  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', background: 'white' }}>
      <PageWrap>
        <PH record={r} />
        <div style={{ background: `linear-gradient(135deg, ${T} 0%, #1e3a6e 100%)`, padding: '20px 18px', borderRadius: '4px', marginBottom: '16px' }}>
          <h1 style={{ fontSize: '22px', fontWeight: 900, color: '#fff', lineHeight: 1.1, margin: 0 }}>Schedule of<br />Test Results</h1>
          <div style={{ width: '36px', height: '3px', background: '#3b82f6', borderRadius: '2px', margin: '10px 0' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: r.status === 'Complete' ? '#22c55e' : '#f59e0b' }} />
            <span style={{ fontSize: '9px', fontWeight: 800, color: r.status === 'Complete' ? '#86efac' : '#fcd34d', textTransform: 'uppercase' }}>{r.status}</span>
          </div>
        </div>
        <SHead title="Project & Contractor Details" />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 24px', marginBottom: '14px' }}>
          <div><Row label="Address / Location" value={r.addressLocation} /><Row label="Date" value={r.date} /><Row label="Switchboard No." value={r.switchboardNumber} /><Row label="Contractor" value={r.contractorName} /></div>
          <div><Row label="Contractor No." value={r.contractorNumber} /><Row label="Worker Name" value={r.workerName} /><Row label="Licence No." value={r.licenceNumber} /></div>
        </div>
        {(r.companyName || r.companyAbn) && (
          <><SHead title="Company Information" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 24px', marginBottom: '14px' }}>
            <div><Row label="Company" value={r.companyName} /><Row label="ABN" value={r.companyAbn} /></div>
            <div><Row label="Phone" value={r.companyPhone} /><Row label="Address" value={r.companyAddress} /></div>
          </div></>
        )}
        <PF record={r} pageLabel="Cover" />
      </PageWrap>
      {(equip.length > 0 || swId || r.msbMaxDemand) && (
        <PageWrap>
          <PH record={r} />
          {equip.length > 0 && (<>
            <SHead title="Test Equipment" />
            <div style={{ border: '1px solid #e7e5e0', borderRadius: '3px', overflow: 'hidden', marginBottom: '16px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr style={{ background: T }}>{['#','Type / Description','Serial Number','Cal. Date'].map(h => <th key={h} style={{ padding: '6px 9px', textAlign: 'left', color: '#dbeafe', fontSize: '7.5px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', borderRight: '1px solid #1e3a6e' }}>{h}</th>)}</tr></thead>
                <tbody>{equip.map((e, i) => <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : '#f0f5ff' }}><td style={{ padding: '6px 9px', fontSize: '9px', color: '#a8a29e', borderBottom: '1px solid #f0eeec' }}>{i+1}</td><td style={{ padding: '6px 9px', fontSize: '9.5px', color: T, fontWeight: 700, borderBottom: '1px solid #f0eeec' }}>{e.type}</td><td style={{ padding: '6px 9px', fontSize: '9px', fontFamily: 'monospace', borderBottom: '1px solid #f0eeec' }}>{e.serial || ''}</td><td style={{ padding: '6px 9px', fontSize: '9px', borderBottom: '1px solid #f0eeec' }}>{e.calDate || ''}</td></tr>)}</tbody>
              </table>
            </div>
          </>)}
          {(swId || r.msbMaxDemand) && (<>
            <SHead title={'Switchboard Test Results' + (swId ? ' — ' + swId : '')} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
              <div style={{ border: '1px solid #e7e5e0', borderRadius: '3px', overflow: 'hidden' }}><div style={{ padding: '6px 10px', background: '#fafaf9', borderBottom: '1px solid #e7e5e0' }}><span style={{ fontSize: '8px', fontWeight: 900, color: '#a8a29e', textTransform: 'uppercase' }}>General</span></div><div style={{ padding: '4px 10px 8px' }}><Row label="Max Demand (A)" value={r.msbMaxDemand} /><Row label="Main Switch (A)" value={r.msbMainSwitchCurrentRating} /><Row label="Main Switch PSC (kA)" value={r.msbMainSwitchPscRating} /><Row label="Conductor CCC (A)" value={r.msbConductorCcc} /><Row label="Conductor Size (mm²)" value={r.msbConductorSize} /><Row label="Circuit Length (m)" value={r.msbCircuitLength} /><Row label="PSC at Main Switch (kA)" value={r.pscAtMainSwitch} /></div></div>
              <div style={{ border: '1px solid #e7e5e0', borderRadius: '3px', overflow: 'hidden' }}><div style={{ padding: '6px 10px', background: '#fafaf9', borderBottom: '1px solid #e7e5e0' }}><span style={{ fontSize: '8px', fontWeight: 900, color: '#a8a29e', textTransform: 'uppercase' }}>Test Results</span></div><div style={{ padding: '4px 10px 8px' }}><Row label="M.E.N. Compliant" value={r.msbMenCompliant} /><Row label="Earth Cont. Main (Ω)" value={r.msbEarthContMain} /><Row label="Earth Cont. EQ (Ω)" value={r.msbEarthContEq} /><Row label="Polarity" value={r.msbPolarity} /><Row label="IR A-E (MΩ)" value={r.msbInsResAE} /><Row label="IR A-N (MΩ)" value={r.msbInsResAN} /><Row label="Live Parts Screened" value={r.livePartsScreened} /><Row label="Main Link / Neutral" value={r.mainLinkNeutralReconnected} /></div></div>
            </div>
          </>)}
          <PF record={r} pageLabel="Equipment & Switchboard" />
        </PageWrap>
      )}
      {(r.mainsCircuits || []).some(x => x.circuitId || x.conductorSize) && (
        <PageWrap><PH record={r} /><SHead title="Consumer and Sub Mains" /><CircuitTbl rows={r.mainsCircuits} /><PF record={r} pageLabel="Consumer & Sub Mains" /></PageWrap>
      )}
      {(r.subCircuits || []).some(x => x.circuitId || x.conductorSize) && (
        <PageWrap><PH record={r} /><SHead title="Final Sub Circuits" /><CircuitTbl rows={r.subCircuits} /><PF record={r} pageLabel="Final Sub Circuits" /></PageWrap>
      )}
      <PageWrap>
        <PH record={r} />
        <SHead title="Declaration and Certification" />
        <div style={{ background: '#dbeafe', border: `1px solid ${T}`, borderLeft: `4px solid ${T}`, borderRadius: '3px', padding: '12px 14px', marginBottom: '16px' }}>
          <p style={{ fontSize: '10px', color: '#1c1917', lineHeight: 1.8 }}>I declare that the electrical installation described in this report has been tested in accordance with AS/NZS 3000:2018 and AS/NZS 3017, and that the results are as recorded above.</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '16px' }}>
          <div style={{ border: '1px solid #e7e5e0', borderRadius: '3px', overflow: 'hidden' }}><div style={{ padding: '6px 10px', background: '#fafaf9', borderBottom: '1px solid #e7e5e0' }}><span style={{ fontSize: '8px', fontWeight: 900, color: '#a8a29e', textTransform: 'uppercase' }}>Registered Electrical Worker</span></div><div style={{ padding: '8px 10px' }}><Row label="Name" value={r.workerName} /><Row label="Licence No." value={r.licenceNumber} /><Row label="Date" value={r.date} />{r.signatureData ? <div style={{ marginTop: '8px' }}><img src={r.signatureData} alt="Sig" style={{ height: '50px', maxWidth: '100%', objectFit: 'contain' }} /><div style={{ width: '100%', height: '1px', background: '#e7e5e0', marginTop: '6px' }} /></div> : <div style={{ marginTop: '10px' }}><div style={{ width: '140px', height: '48px', borderBottom: '2px solid #e7e5e0' }} /><p style={{ fontSize: '7px', color: '#a8a29e', marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Authorised Signature</p></div>}</div></div>
        </div>
        {r.notes && <div style={{ background: '#fffbeb', border: '1px solid #fed7aa', borderLeft: '4px solid #1d6faa', borderRadius: '3px', padding: '10px 12px', marginBottom: '14px' }}><p style={{ fontSize: '8px', fontWeight: 700, color: '#78716c', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px' }}>Notes / Defects</p><p style={{ fontSize: '9.5px', color: '#1c1917', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{r.notes}</p></div>}
        <div style={{ marginTop: 'auto', paddingTop: '10px', borderTop: '1px solid #f0eeec' }}><p style={{ fontSize: '7px', color: '#a8a29e' }}>AS/NZS 3000:2018 · AS/NZS 3008.1.1 · AS/NZS 3017 — Generated {new Date().toLocaleDateString('en-AU')} · testsheet.com.au</p></div>
        <PF record={r} pageLabel="Declaration" />
      </PageWrap>
    </div>
  );
}

export default function ReportPreview() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const reportRef = useRef(null);
  const [pdfModal, setPdfModal] = useState({ open: false, blob: null, generating: false, progress: 0, error: null });

  useEffect(() => { getRecord(id).then(d => { setRecord(d); setLoading(false); }); }, [id]);

  const handlePdf = async () => {
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

  if (loading) return <div className="fixed inset-0 flex items-center justify-center bg-white"><div className="w-8 h-8 border-4 border-slate-200 border-t-[#0f2044] rounded-full animate-spin" /></div>;
  if (!record) return <div className="flex flex-col items-center justify-center min-h-screen gap-4"><p className="text-slate-500">Record not found.</p><button onClick={() => navigate('/dashboard')} className="bg-[#0f2044] text-white px-4 py-2 rounded-xl text-sm">Back to Dashboard</button></div>;

  const filename = buildTestRecordFilename(record);
  return (
    <div className="min-h-screen bg-[#ddd9d4]">
      <div className="bg-white border-b border-stone-200 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/records/' + id + '/edit')} className="flex items-center gap-1.5 text-stone-500 hover:text-stone-800 text-sm"><ArrowLeft className="w-4 h-4" /> Back</button>
            <span className="text-sm font-semibold text-stone-700 truncate">{record.addressLocation || 'Report Preview'}</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => navigate('/records/' + id + '/edit')} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 text-sm hover:border-[#0f2044]"><Edit className="w-4 h-4" /> Edit</button>
            <button onClick={handlePdf} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0f2044] text-white text-sm hover:bg-[#162d4a]"><Download className="w-4 h-4" /> Generate PDF</button>
          </div>
        </div>
      </div>
      <div className="py-8 flex justify-center px-2">
        <ReportContent record={record} />
      </div>
      <div className="max-w-5xl mx-auto px-4 py-4 flex justify-between items-center">
        <button onClick={() => navigate('/records/' + id + '/edit')} className="text-stone-400 hover:text-stone-700 text-sm flex items-center gap-1"><ArrowLeft className="w-4 h-4" /> Back to Form</button>
        <button onClick={handlePdf} className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0f2044] text-white text-sm hover:bg-[#162d4a]"><Download className="w-4 h-4" /> Generate PDF</button>
      </div>
      <div ref={reportRef} style={{ position: 'fixed', top: 0, left: '-9999px', width: '210mm', zIndex: -1, background: 'white' }} aria-hidden="true">
        {record && <ReportContent record={record} />}
      </div>
      <PdfActionModal open={pdfModal.open} onClose={() => setPdfModal(m => ({ ...m, open: false }))} pdfBlob={pdfModal.blob} generating={pdfModal.generating} progress={pdfModal.progress} error={pdfModal.error} filename={filename} />
    </div>
  );
}