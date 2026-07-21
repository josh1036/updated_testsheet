import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getRecord, getRecordByShareToken } from '../lib/records';
import CircuitGrid from '../components/CircuitGrid';
import PdfActionModal from '../components/PdfActionModal';
import { buildTestRecordFilename, elementToPdfBlob } from '../lib/pdfUtils';
import { ArrowLeft, Printer, Edit, Zap, CheckCircle2, Clock, Loader2, Download } from 'lucide-react';

/* ── Screen-only helpers (Tailwind is fine here) ── */
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

/* ═══════════════════════════════════════════════════════════════════════════
 * PdfBody — pure inline-style PDF render target.
 * html2canvas CANNOT resolve Tailwind classes on off-screen elements.
 * Everything here uses style={{}} props only.
 * Mirrors the on-screen view: same sections, same data, same colours.
 * ═══════════════════════════════════════════════════════════════════════════ */
const T = '#0f2044';
const SANS = "'Inter', system-ui, -apple-system, sans-serif";
const MONO = "'JetBrains Mono', 'Courier New', monospace";

/* Shared inline-style primitives */
const card = { background: 'white', borderRadius: '10px', border: '1px solid #e2e8f0', overflow: 'hidden', marginBottom: '14px' };
const cardHead = (bg) => ({ background: bg, color: 'white', padding: '9px 16px', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.07em', fontFamily: SANS });
const cardBody = { padding: '14px 16px' };
const labelCell = { padding: '5px 14px 5px 0', fontSize: '10px', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', width: '150px', borderBottom: '1px solid #f1f5f9', fontFamily: SANS };
const valueCell = { padding: '5px 0', fontSize: '12px', color: '#1e293b', borderBottom: '1px solid #f1f5f9', fontFamily: SANS };
const divider = { height: '1px', background: '#e2e8f0', margin: '10px 0' };

function PdfRow({ label, value }) {
  return (
    <tr>
      <td style={labelCell}>{label}</td>
      <td style={valueCell}>{value || '—'}</td>
    </tr>
  );
}

/* Page header — appears at top of every page */
function PdfHeader({ record }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '14px 20px', borderBottom: `3px solid ${T}`,
      background: 'white',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {record.companyLogoUrl
          ? <img src={record.companyLogoUrl} alt="Company logo" style={{ height: '36px', maxWidth: '120px', objectFit: 'contain' }} crossOrigin="anonymous" />
          : <div style={{ width: '36px', height: '36px', background: T, borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#F59E0B', fontSize: '18px', flexShrink: 0 }}>⚡</div>
        }
        <div>
          <div style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a', fontFamily: SANS }}>{record.companyName || 'TestSheet'}</div>
          <div style={{ fontSize: '9px', color: '#64748b', fontFamily: SANS }}>Licensed Electrical Contractor</div>
        </div>
      </div>
      <div style={{ textAlign: 'right' }}>
        <div style={{ fontSize: '10px', fontWeight: 700, color: T, letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: SANS }}>Schedule of Test Results</div>
        <div style={{ fontSize: '8px', color: '#94a3b8', marginTop: '2px', fontFamily: SANS }}>AS/NZS 3000:2018 · Clause 8.3 · AS/NZS 3017</div>
      </div>
    </div>
  );
}

/* Page footer */
function PdfFooter({ record, pageLabel }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '8px 20px', borderTop: '1px solid #e2e8f0',
      background: '#f8fafc', marginTop: 'auto',
    }}>
      <div style={{ fontSize: '8px', color: '#94a3b8', fontFamily: SANS }}>
        {record.companyName || 'TestSheet'} · testsheet.com.au
      </div>
      <div style={{ fontSize: '8px', color: '#94a3b8', fontFamily: SANS }}>
        AS/NZS 3000:2018 · AS/NZS 3008.1.1 · AS/NZS 3017 — Generated {new Date().toLocaleDateString('en-AU')}
      </div>
      <div style={{ fontSize: '8px', color: '#94a3b8', fontFamily: SANS }}>{pageLabel}</div>
    </div>
  );
}

function PdfBody({ record, mainsRows, subRows }) {
  const isComplete = record.status === 'Complete';
  const statusBg = isComplete ? 'rgba(34,197,94,0.15)' : 'rgba(245,158,11,0.15)';
  const statusColor = isComplete ? '#16a34a' : '#d97706';
  const statusLabel = record.status || 'Draft';

  /* Collect test equipment rows */
  const testEquip = [
    { type: record.testEquip1Type, serial: record.testEquip1Serial, cal: record.testEquip1CalDate },
    { type: record.testEquip2Type, serial: record.testEquip2Serial, cal: record.testEquip2CalDate },
    { type: record.testEquip3Type, serial: record.testEquip3Serial, cal: record.testEquip3CalDate },
    { type: record.testEquip4Type, serial: record.testEquip4Serial, cal: record.testEquip4CalDate },
  ].filter(e => e.type);

  const PAGE = {
    width: '210mm',
    boxSizing: 'border-box',
    fontFamily: SANS,
    background: 'white',
    display: 'flex',
    flexDirection: 'column',
    minHeight: '297mm',
  };

  return (
    <div style={{ fontFamily: SANS, background: '#f8fafc' }}>

      {/* ── PAGE 1: Cover + Project Details ── */}
      <div className="report-page" style={PAGE}>
        <PdfHeader record={record} />

        {/* Hero banner */}
        <div style={{
          background: `linear-gradient(135deg, ${T} 0%, #1e3a6e 60%, #1d4ed8 100%)`,
          padding: '28px 20px 24px 20px',
          position: 'relative',
          overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', right: '-10px', top: '50%', transform: 'translateY(-50%)', fontSize: '72px', fontWeight: 900, color: 'rgba(255,255,255,0.04)', letterSpacing: '-0.04em', whiteSpace: 'nowrap', userSelect: 'none' }}>TESTSHEET</div>
          <div style={{ fontSize: '8px', fontWeight: 600, color: '#93c5fd', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '8px', fontFamily: SANS }}>Client Deliverable · Electrical Compliance</div>
          <h1 style={{ fontSize: '24px', fontWeight: 900, color: '#fff', lineHeight: 1.1, letterSpacing: '-0.03em', margin: '0 0 6px 0', fontFamily: SANS }}>
            Schedule of<br /><span style={{ color: '#60a5fa' }}>Test Results</span>
          </h1>
          {(record.addressLocation || record.contractorName) && (
            <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)', marginBottom: '14px', fontFamily: SANS }}>
              {[record.addressLocation, record.contractorName].filter(Boolean).join(' — ')}
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 12px', borderRadius: '6px', background: statusBg, border: `1px solid ${statusColor}40` }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: statusColor }} />
              <span style={{ fontSize: '9px', fontWeight: 700, color: statusColor, letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: SANS }}>{statusLabel}</span>
            </div>
            {record.date && <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.4)', fontFamily: MONO }}>{record.date}</span>}
          </div>
        </div>

        {/* Project & Contractor Details */}
        <div style={{ padding: '16px 20px', flex: 1 }}>
          <div style={card}>
            <div style={cardHead(T)}>Project &amp; Contractor Details</div>
            <div style={{ ...cardBody, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 24px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}><tbody>
                <PdfRow label="Address / Location" value={record.addressLocation} />
                <PdfRow label="Date" value={record.date} />
                <PdfRow label="Switchboard No." value={record.switchboardNumber} />
                <PdfRow label="Contractor Name" value={record.contractorName} />
              </tbody></table>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}><tbody>
                <PdfRow label="Contractor Number" value={record.contractorNumber} />
                <PdfRow label="Worker Name" value={record.workerName} />
                <PdfRow label="Licence Number" value={record.licenceNumber} />
                <PdfRow label="Client" value={record.clientEmail} />
              </tbody></table>
            </div>
          </div>

          {/* Company Branding (if present) */}
          {(record.companyAbn || record.companyPhone || record.companyAddress) && (
            <div style={card}>
              <div style={cardHead('#334155')}>Company Details</div>
              <div style={cardBody}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}><tbody>
                  {record.companyAbn && <PdfRow label="ABN" value={record.companyAbn} />}
                  {record.companyPhone && <PdfRow label="Phone" value={record.companyPhone} />}
                  {record.companyAddress && <PdfRow label="Address" value={record.companyAddress} />}
                </tbody></table>
              </div>
            </div>
          )}

          {/* MSB / Main Switch Details */}
          {(record.msbMaxDemand || record.msbMainSwitchCurrentRating || record.pscAtMainSwitch) && (
            <div style={card}>
              <div style={cardHead('#1e4080')}>Main Switchboard (MSB) Details</div>
              <div style={{ ...cardBody, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 24px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}><tbody>
                  <PdfRow label="Max Demand (A)" value={record.msbMaxDemand} />
                  <PdfRow label="Main Switch Rating (A)" value={record.msbMainSwitchCurrentRating} />
                  <PdfRow label="Main Switch PSC (kA)" value={record.msbMainSwitchPscRating} />
                  <PdfRow label="PSC at Main Switch" value={record.pscAtMainSwitch} />
                </tbody></table>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}><tbody>
                  <PdfRow label="Conductor CCC (A)" value={record.msbConductorCcc} />
                  <PdfRow label="Conductor Size (mm²)" value={record.msbConductorSize} />
                  <PdfRow label="Earth Cont. Main (Ω)" value={record.msbEarthContMain} />
                  <PdfRow label="Earth Cont. Eq. (Ω)" value={record.msbEarthContEq} />
                </tbody></table>
              </div>
              {(record.msbInsResAE || record.msbInsResAN || record.msbInsResNE) && (
                <div style={{ ...cardBody, borderTop: '1px solid #f1f5f9', paddingTop: '10px' }}>
                  <div style={{ fontSize: '10px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px', fontFamily: SANS }}>Insulation Resistance (MΩ)</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                    {[['A–E', record.msbInsResAE], ['A–N', record.msbInsResAN], ['N–E', record.msbInsResNE], ['PP', record.msbInsResPP]].map(([l, v]) => v ? (
                      <div key={l} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '6px 8px', textAlign: 'center' }}>
                        <div style={{ fontSize: '9px', color: '#94a3b8', fontFamily: SANS }}>{l}</div>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: T, fontFamily: MONO }}>{v}</div>
                      </div>
                    ) : null)}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Test Equipment */}
          {testEquip.length > 0 && (
            <div style={card}>
              <div style={cardHead('#475569')}>Test Equipment &amp; Calibration</div>
              <div style={cardBody}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc' }}>
                      {['Instrument Type', 'Serial Number', 'Cal. Due Date'].map(h => (
                        <th key={h} style={{ padding: '6px 10px', fontSize: '9px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: 'left', borderBottom: '2px solid #e2e8f0', fontFamily: SANS }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {testEquip.map((e, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '7px 10px', fontSize: '11px', color: '#1e293b', fontFamily: SANS }}>{e.type || '—'}</td>
                        <td style={{ padding: '7px 10px', fontSize: '11px', color: '#1e293b', fontFamily: MONO }}>{e.serial || '—'}</td>
                        <td style={{ padding: '7px 10px', fontSize: '11px', color: '#1e293b', fontFamily: SANS }}>{e.cal || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <PdfFooter record={record} pageLabel="Page 1" />
      </div>

      {/* ── PAGE 2: Circuit Test Results ── */}
      <div className="report-page" style={PAGE}>
        <PdfHeader record={record} />
        <div style={{ padding: '16px 20px', flex: 1 }}>
          {/* Consumer and Sub Mains */}
          <div style={card}>
            <div style={cardHead('#1e4080')}>Consumer and Sub Mains</div>
            <div style={{ padding: '8px' }}>
              <CircuitGrid rows={mainsRows} onChange={() => {}} readOnly />
            </div>
          </div>

          {/* Final Sub Circuits */}
          <div style={card}>
            <div style={cardHead('#1a3a6b')}>Final Sub Circuits</div>
            <div style={{ padding: '8px' }}>
              <CircuitGrid rows={subRows} onChange={() => {}} readOnly />
            </div>
          </div>
        </div>
        <PdfFooter record={record} pageLabel="Page 2" />
      </div>

      {/* ── PAGE 3: Declaration & Sign-Off ── */}
      <div className="report-page" style={PAGE}>
        <PdfHeader record={record} />
        <div style={{ padding: '16px 20px', flex: 1 }}>

          {/* Declaration box */}
          <div style={{ background: '#dbeafe', border: `1px solid ${T}`, borderLeft: `4px solid ${T}`, borderRadius: '8px', padding: '14px 16px', marginBottom: '16px' }}>
            <p style={{ fontSize: '11px', color: '#1c1917', lineHeight: 1.8, margin: 0, fontFamily: SANS }}>
              I declare that the electrical installation described in this report has been tested in accordance with AS/NZS 3000:2018 and AS/NZS 3017, and that the results are as recorded above. The installation has been inspected and found to comply with the requirements of AS/NZS 3000:2018 to the best of my knowledge and belief.
            </p>
          </div>

          {/* Signature + Verification details */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '16px' }}>
            {/* Signature card */}
            <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
              <div style={{ padding: '8px 12px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '9px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: SANS }}>Registered Electrical Worker</span>
              </div>
              <div style={{ padding: '12px' }}>
                {record.signatureData
                  ? <div style={{ marginBottom: '10px' }}>
                      <img src={record.signatureData} alt="Signature" style={{ height: '56px', maxWidth: '100%', objectFit: 'contain' }} />
                      <div style={divider} />
                      <div style={{ fontSize: '8px', color: '#94a3b8', fontFamily: SANS }}>Authorised Signature</div>
                    </div>
                  : <div style={{ height: '56px', borderBottom: '2px solid #e2e8f0', marginBottom: '8px', display: 'flex', alignItems: 'flex-end' }}>
                      <div style={{ fontSize: '8px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px', fontFamily: SANS }}>Authorised Signature</div>
                    </div>
                }
                <table style={{ width: '100%', borderCollapse: 'collapse' }}><tbody>
                  <PdfRow label="Name" value={record.workerName} />
                  <PdfRow label="Licence No." value={record.licenceNumber} />
                  <PdfRow label="Date" value={record.date} />
                </tbody></table>
              </div>
            </div>

            {/* Verification checklist */}
            <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
              <div style={{ padding: '8px 12px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '9px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: SANS }}>Verification Checklist</span>
              </div>
              <div style={{ padding: '12px' }}>
                {[
                  ['Live Parts Screened', record.livePartsScreened],
                  ['Main Link / Neutral Reconnected', record.mainLinkNeutralReconnected],
                  ['MEN Compliant', record.msbMenCompliant],
                ].map(([label, val]) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 0', borderBottom: '1px solid #f1f5f9' }}>
                    <span style={{ fontSize: '11px', color: '#475569', fontFamily: SANS }}>{label}</span>
                    <span style={{
                      fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '4px',
                      background: val === true || val === 'Yes' ? '#dcfce7' : val === false || val === 'No' ? '#fee2e2' : '#f1f5f9',
                      color: val === true || val === 'Yes' ? '#16a34a' : val === false || val === 'No' ? '#dc2626' : '#64748b',
                      fontFamily: SANS,
                    }}>
                      {val === true || val === 'Yes' ? '✓ Yes' : val === false || val === 'No' ? '✗ No' : '—'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Notes / Defects */}
          {record.notes && (
            <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderLeft: '4px solid #f59e0b', borderRadius: '8px', padding: '12px 14px' }}>
              <div style={{ fontSize: '9px', fontWeight: 800, color: '#78716c', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '6px', fontFamily: SANS }}>Notes / Defects</div>
              <p style={{ fontSize: '11px', color: '#1c1917', lineHeight: 1.7, margin: 0, fontFamily: SANS }}>{record.notes}</p>
            </div>
          )}

          {/* Standards footer note */}
          <div style={{ marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid #f1f5f9' }}>
            <p style={{ fontSize: '8px', color: '#94a3b8', fontFamily: SANS }}>
              This document has been prepared in accordance with AS/NZS 3000:2018 Wiring Rules, AS/NZS 3008.1.1 Selection of Cables, and AS/NZS 3017 Electrical Installations — Verification Guidelines. Results are valid at the time of testing only.
            </p>
          </div>
        </div>
        <PdfFooter record={record} pageLabel="Page 3 of 3" />
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
 * RecordView — main page component
 * ═══════════════════════════════════════════════════════════════════════════ */
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
      {/* Sticky top nav */}
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

      {/* Hidden PDF render target — pdfUtils.js makes this visible before capture */}
      <div
        ref={reportRef}
        style={{
          position: 'fixed', top: 0, left: '-9999px',
          width: '1000px',
          opacity: 0, pointerEvents: 'none', zIndex: -1,
          overflow: 'visible',
        }}
        aria-hidden="true"
      >
        {record && <PdfBody record={record} mainsRows={mainsRows} subRows={subRows} />}
      </div>

      {/* ── Visible on-screen content (Tailwind is fine here) ── */}
      <div className="max-w-5xl mx-auto px-4 py-6 space-y-4 print-page">
        {hasCompanyBranding && (
          <div className="bg-white rounded-xl border border-slate-200 p-5 flex items-start gap-4">
            {record.companyLogoUrl && <img src={record.companyLogoUrl} alt="Company logo" className="h-16 max-w-[160px] object-contain" crossOrigin="anonymous" />}
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
