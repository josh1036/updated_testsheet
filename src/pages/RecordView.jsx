import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useReactToPrint } from 'react-to-print';
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
 * PDF RENDER TARGET — pure inline styles, strict A4 page boundaries
 * Each page is exactly 794×1123px (A4 at 96dpi).
 * html2canvas CANNOT resolve Tailwind classes on off-screen elements.
 * ═══════════════════════════════════════════════════════════════════════════ */
const T = '#0f2044';
const SANS = "\'Inter\', system-ui, -apple-system, sans-serif";
const MONO = "\'JetBrains Mono\', \'Courier New\', monospace";

/* A4 at 96dpi */
const PW = 794;
const PH = 1123;
const BLEED_H = 3;
const FOOTER_H = 36;
const HEADER_H = 88;   /* full branded header: logo bar (44px) + gradient banner (44px) */
const HERO_H   = 185;  /* page-1 full hero block */

const PAGE_STYLE = {
  width: `${PW}px`,
  height: `${PH}px`,
  boxSizing: 'border-box',
  fontFamily: SANS,
  background: '#fff',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
  position: 'relative',
  flexShrink: 0,
};

function BleedLine() {
  return <div style={{ width: '100%', height: `${BLEED_H}px`, background: `linear-gradient(90deg, ${T} 0%, #1e4080 50%, #1d4ed8 100%)`, flexShrink: 0 }} />;
}

function PageHeader({ record }) {
  return (
    <div style={{ flexShrink: 0 }}>
      {/* Logo + title bar */}
      <div style={{ height: '44px', padding: '0 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', background: '#fff' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {record.companyLogoUrl
            ? <img src={record.companyLogoUrl} alt="Logo" crossOrigin="anonymous" style={{ height: '28px', maxWidth: '90px', objectFit: 'contain' }} />
            : <div style={{ width: '28px', height: '28px', background: T, borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#F59E0B', fontSize: '14px' }}>⚡</div>
          }
          <div>
            <div style={{ fontSize: '11px', fontWeight: 800, color: '#0f172a', fontFamily: SANS }}>{record.companyName || 'TestSheet'}</div>
            <div style={{ fontSize: '8px', color: '#64748b', fontFamily: SANS }}>
              {[record.companyAbn && `ABN: ${record.companyAbn}`, record.companyPhone].filter(Boolean).join(' · ') || 'Licensed Electrical Contractor'}
            </div>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '10px', fontWeight: 800, color: T, letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: SANS }}>Schedule of Test Results</div>
          <div style={{ fontSize: '7.5px', color: '#94a3b8', marginTop: '2px', fontFamily: SANS }}>AS/NZS 3000:2018 · Clause 8.3 · AS/NZS 3017</div>
        </div>
      </div>
      {/* Gradient banner */}
      <div style={{ height: '44px', background: `linear-gradient(135deg, ${T} 0%, #1e3a6e 60%, #1d4ed8 100%)`, padding: '0 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: '13px', fontWeight: 900, color: '#fff', lineHeight: 1.1 }}>Schedule of Test Results</div>
          <div style={{ fontSize: '8px', color: 'rgba(255,255,255,0.55)', marginTop: '2px', fontFamily: MONO }}>
            {record.addressLocation || record.companyName || ''}{record.switchboardNo ? ` · ${record.switchboardNo}` : ''}{record.date ? ` · ${record.date}` : ''}
          </div>
        </div>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '4px 12px', borderRadius: '5px', background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)' }}>
          <span style={{ fontSize: '8px', fontWeight: 700, color: '#fff', letterSpacing: '0.08em', textTransform: 'uppercase' }}>AS/NZS 3000:2018</span>
        </div>
      </div>
    </div>
  );
}

function PageFooter({ record, pageLabel }) {
  return (
    <div style={{ height: `${FOOTER_H}px`, padding: '0 20px', borderTop: '2px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f8fafc', flexShrink: 0 }}>
      <div style={{ fontSize: '7.5px', color: '#94a3b8', fontFamily: SANS }}>{record.companyName || 'TestSheet'} · testsheet.com.au</div>
      <div style={{ fontSize: '7.5px', color: '#94a3b8', fontFamily: SANS }}>AS/NZS 3000:2018 · AS/NZS 3008.1.1 · AS/NZS 3017 — Generated {new Date().toLocaleDateString('en-AU')}</div>
      <div style={{ fontSize: '8px', fontWeight: 700, color: T, background: '#dbeafe', padding: '3px 12px', borderRadius: '4px', fontFamily: SANS }}>{pageLabel}</div>
    </div>
  );
}

function SHead({ title, color }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', marginTop: '12px', flexShrink: 0 }}>
      <div style={{ width: '16px', height: '2px', background: color || T, borderRadius: '1px', flexShrink: 0 }} />
      <span style={{ fontSize: '8px', fontWeight: 800, color: '#0f172a', letterSpacing: '0.12em', textTransform: 'uppercase', fontFamily: SANS }}>{title}</span>
      <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
    </div>
  );
}

function DRow({ label, value }) {
  return (
    <tr>
      <td style={{ padding: '4px 12px 4px 0', fontSize: '8.5px', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', width: '140px', borderBottom: '1px solid #f1f5f9', fontFamily: SANS, verticalAlign: 'top' }}>{label}</td>
      <td style={{ padding: '4px 0', fontSize: '10.5px', color: value ? '#1e293b' : '#cbd5e1', borderBottom: '1px solid #f1f5f9', fontFamily: SANS }}>{value || '—'}</td>
    </tr>
  );
}

/* ── Inline circuit grid (replaces CircuitGrid which uses Tailwind) ── */
const PHASE_OPTS = [
  { value: 'L1', color: '#dc2626', bg: '#fef2f2', border: '#fca5a5' },
  { value: 'L2', color: '#f59e0b', bg: '#fffbeb', border: '#fcd34d' },
  { value: 'L3', color: '#2563eb', bg: '#eff6ff', border: '#93c5fd' },
  { value: 'N',  color: '#6b7280', bg: '#f9fafb', border: '#d1d5db' },
  { value: 'E',  color: '#16a34a', bg: '#f0fdf4', border: '#86efac' },
  { value: 'PEN',color: '#15803d', bg: '#f0fdf4', border: '#4ade80' },
];

function InlineCircuitGrid({ rows }) {
  const headers = ['#', 'Circuit ID', 'Ph', 'Max D (A)', 'OCPD Type', 'OCPD (A)', 'PSC (kA)', 'CCC (A)', 'Size mm²', 'E-Cont Ω', 'Polarity', 'Ins A-E', 'Ins A-N', 'Ins N-E', 'Ins OK', 'Za/Rphe', 'RCD mA', 'Comments'];
  return (
    <div style={{ border: '1px solid #e2e8f0', borderRadius: '7px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '8px', fontFamily: SANS }}>
        <thead>
          <tr style={{ background: T }}>
            {headers.map((h, i) => (
              <th key={i} style={{ padding: '6px 4px', textAlign: 'center', fontSize: '7px', fontWeight: 700, color: 'rgba(255,255,255,0.85)', textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => {
            const ph = PHASE_OPTS.find(p => p.value === row.phase || p.value === row.numPhases);
            const rowBg = idx % 2 === 0 ? '#fff' : '#fafbff';
            const isEmpty = !row.circuitId && !row.maxDemand && !row.ocpdType;
            const c = (v) => <span style={{ color: isEmpty || !v ? '#cbd5e1' : '#1e293b', fontFamily: MONO, fontSize: '8px' }}>{v || '—'}</span>;
            return (
              <tr key={idx} style={{ background: rowBg, borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '5px 4px', textAlign: 'center' }}>
                  <span style={{ width: '16px', height: '16px', borderRadius: '3px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '7px', fontWeight: 700, fontFamily: MONO, background: ph ? ph.bg : '#f1f5f9', color: ph ? ph.color : '#94a3b8', border: ph ? `1px solid ${ph.border}` : '1px solid #e2e8f0' }}>{idx + 1}</span>
                </td>
                <td style={{ padding: '5px 4px', textAlign: 'center' }}>{c(row.circuitId)}</td>
                <td style={{ padding: '5px 4px', textAlign: 'center' }}>
                  {ph
                    ? <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '2px 5px', borderRadius: '3px', background: ph.bg, color: ph.color, border: `1px solid ${ph.border}`, fontWeight: 800, fontSize: '7px' }}>{ph.value}</span>
                    : <span style={{ color: '#cbd5e1' }}>—</span>
                  }
                </td>
                <td style={{ padding: '5px 4px', textAlign: 'center' }}>{c(row.maxDemand)}</td>
                <td style={{ padding: '5px 4px', textAlign: 'center' }}>{c(row.ocpdType)}</td>
                <td style={{ padding: '5px 4px', textAlign: 'center' }}>{c(row.ocpdCurrentRating)}</td>
                <td style={{ padding: '5px 4px', textAlign: 'center' }}>{c(row.ocpdPscRating)}</td>
                <td style={{ padding: '5px 4px', textAlign: 'center' }}>{c(row.conductorCcc)}</td>
                <td style={{ padding: '5px 4px', textAlign: 'center' }}>{c(row.conductorSize)}</td>
                <td style={{ padding: '5px 4px', textAlign: 'center' }}>{c(row.earthContMain)}</td>
                <td style={{ padding: '5px 4px', textAlign: 'center' }}>{c(row.polarity)}</td>
                <td style={{ padding: '5px 4px', textAlign: 'center' }}>{c(row.insResAE)}</td>
                <td style={{ padding: '5px 4px', textAlign: 'center' }}>{c(row.insResAN)}</td>
                <td style={{ padding: '5px 4px', textAlign: 'center' }}>{c(row.insResNE)}</td>
                <td style={{ padding: '5px 4px', textAlign: 'center' }}>
                  {row.insResOk === 'Yes' || row.insResOk === true
                    ? <span style={{ color: '#16a34a', fontWeight: 700, fontSize: '8px' }}>✓</span>
                    : row.insResOk === 'No' || row.insResOk === false
                    ? <span style={{ color: '#dc2626', fontWeight: 700, fontSize: '8px' }}>✗</span>
                    : <span style={{ color: '#cbd5e1' }}>—</span>
                  }
                </td>
                <td style={{ padding: '5px 4px', textAlign: 'center' }}>{c(row.zaRpheActual)}</td>
                <td style={{ padding: '5px 4px', textAlign: 'center' }}>{c(row.rcdCurrentTrip)}</td>
                <td style={{ padding: '5px 4px', textAlign: 'center', maxWidth: '60px' }}>{c(row.comments)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function PdfBody({ record, mainsRows, subRows }) {
  const isComplete = record.status === 'Complete';
  const statusBg    = isComplete ? 'rgba(34,197,94,0.15)'   : 'rgba(245,158,11,0.15)';
  const statusColor = isComplete ? '#16a34a'                : '#d97706';
  const statusLabel = record.status || 'Draft';

  /* Test equipment rows */
  const testEquip = [
    { type: record.testEquip1Type, serial: record.testEquip1Serial, cal: record.testEquip1CalDate },
    { type: record.testEquip2Type, serial: record.testEquip2Serial, cal: record.testEquip2CalDate },
    { type: record.testEquip3Type, serial: record.testEquip3Serial, cal: record.testEquip3CalDate },
    { type: record.testEquip4Type, serial: record.testEquip4Serial, cal: record.testEquip4CalDate },
  ].filter(e => e.type);

  /* Content heights for page 1 (px) — used to size the content area */
  const P1_CONTENT_H = PH - BLEED_H - FOOTER_H - HERO_H;

  return (
    <div style={{ fontFamily: SANS, background: '#e5e7eb', display: 'inline-flex', flexDirection: 'column', gap: '2px' }}>

      {/* ══════════════════════════════════════════════
          PAGE 1: Hero + Project + Company + MSB + Equipment
          ══════════════════════════════════════════════ */}
      <div className="report-page" style={PAGE_STYLE}>
        <BleedLine />

        {/* Full hero header */}
        <div style={{ flexShrink: 0 }}>
          {/* Logo + title bar */}
          <div style={{ padding: '12px 20px 10px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {record.companyLogoUrl
                ? <img src={record.companyLogoUrl} alt="Logo" crossOrigin="anonymous" style={{ height: '32px', maxWidth: '110px', objectFit: 'contain' }} />
                : <div style={{ width: '32px', height: '32px', background: T, borderRadius: '7px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#F59E0B', fontSize: '16px' }}>⚡</div>
              }
              <div>
                <div style={{ fontSize: '12px', fontWeight: 800, color: '#0f172a', fontFamily: SANS }}>{record.companyName || 'TestSheet'}</div>
                <div style={{ fontSize: '8px', color: '#64748b', fontFamily: SANS }}>Licensed Electrical Contractor</div>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '10px', fontWeight: 700, color: T, letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: SANS }}>Schedule of Test Results</div>
              <div style={{ fontSize: '7.5px', color: '#94a3b8', marginTop: '2px', fontFamily: SANS }}>AS/NZS 3000:2018 · Clause 8.3 · AS/NZS 3017</div>
            </div>
          </div>
          {/* Hero gradient banner */}
          <div style={{ background: `linear-gradient(135deg, ${T} 0%, #1e3a6e 60%, #1d4ed8 100%)`, padding: '16px 20px 12px 20px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', right: '-10px', top: '50%', transform: 'translateY(-50%)', fontSize: '56px', fontWeight: 900, color: 'rgba(255,255,255,0.04)', letterSpacing: '-0.04em', whiteSpace: 'nowrap', userSelect: 'none' }}>TESTSHEET</div>
            <div style={{ fontSize: '8px', fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '3px' }}>Client Deliverable · Electrical Compliance</div>
            <div style={{ fontSize: '19px', fontWeight: 900, color: '#fff', lineHeight: 1.1, marginBottom: '1px' }}>Schedule of Test Results</div>
            <div style={{ fontSize: '19px', fontWeight: 900, color: '#60a5fa', lineHeight: 1.1, marginBottom: '7px' }}>AS/NZS 3000:2018 Wiring Rules</div>
            <div style={{ fontSize: '8.5px', color: 'rgba(255,255,255,0.6)', marginBottom: '8px' }}>{record.addressLocation || record.companyName || ''}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '4px 12px', borderRadius: '5px', background: statusBg, border: `1px solid ${statusColor}30` }}>
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: statusColor }} />
                <span style={{ fontSize: '8px', fontWeight: 700, color: statusColor, letterSpacing: '0.1em', textTransform: 'uppercase' }}>{statusLabel}</span>
              </div>
              {record.date && <span style={{ fontSize: '8px', color: 'rgba(255,255,255,0.4)', fontFamily: MONO }}>{record.date}</span>}
            </div>
          </div>
        </div>

        {/* Content area */}
        <div style={{ flex: 1, padding: '0 20px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <SHead title="Project & Contractor Details" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 24px', flexShrink: 0 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}><tbody>
              <DRow label="Contractor" value={record.contractorName} />
              <DRow label="Licence No." value={record.licenceNumber} />
              <DRow label="Address" value={record.addressLocation} />
              <DRow label="Date" value={record.date} />
              <DRow label="Job No." value={record.jobNumber} />
            </tbody></table>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}><tbody>
              <DRow label="Consumer" value={record.consumerName} />
              <DRow label="Supply Address" value={record.supplyAddress} />
              <DRow label="Earthing System" value={record.earthingSystem} />
              <DRow label="Wiring System" value={record.wiringSystem} />
              <DRow label="Status" value={record.status} />
            </tbody></table>
          </div>

          {(record.companyName || record.companyAbn) && (
            <>
              <SHead title="Company Details" color="#334155" />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 24px', flexShrink: 0 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}><tbody>
                  <DRow label="Company" value={record.companyName} />
                  <DRow label="ABN" value={record.companyAbn} />
                </tbody></table>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}><tbody>
                  <DRow label="Phone" value={record.companyPhone} />
                  <DRow label="Address" value={record.companyAddress} />
                </tbody></table>
              </div>
            </>
          )}

          {(record.msbMaxDemand || record.msbMainSwitchCurrentRating || record.pscAtMainSwitch) && (
            <>
              <SHead title="Main Switchboard (MSB) Details" color="#1e4080" />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 24px', flexShrink: 0 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}><tbody>
                  <DRow label="Max Demand (A)" value={record.msbMaxDemand} />
                  <DRow label="Main Switch (A)" value={record.msbMainSwitchCurrentRating} />
                  <DRow label="PSC at Main Switch" value={record.pscAtMainSwitch} />
                  <DRow label="Conductor CCC (A)" value={record.msbConductorCcc} />
                </tbody></table>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}><tbody>
                  <DRow label="Conductor Size mm²" value={record.msbConductorSize} />
                  <DRow label="Earth Cont. Main Ω" value={record.msbEarthContMain} />
                  <DRow label="Earth Cont. Eq. Ω" value={record.msbEarthContEq} />
                  <DRow label="Ins Res A-E (MΩ)" value={record.msbInsResAE} />
                </tbody></table>
              </div>
            </>
          )}

          {testEquip.length > 0 && (
            <>
              <SHead title="Test Equipment & Calibration" color="#475569" />
              <div style={{ border: '1px solid #e2e8f0', borderRadius: '7px', overflow: 'hidden', flexShrink: 0 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9px', fontFamily: SANS }}>
                  <thead>
                    <tr style={{ background: '#f8fafc' }}>
                      {['Instrument Type', 'Serial Number', 'Cal. Due Date'].map(h => (
                        <th key={h} style={{ padding: '6px 10px', fontSize: '8px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: 'left', borderBottom: '2px solid #e2e8f0', fontFamily: SANS }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {testEquip.map((e, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '6px 10px', fontSize: '10px', color: '#1e293b', fontFamily: SANS }}>{e.type || '—'}</td>
                        <td style={{ padding: '6px 10px', fontSize: '10px', color: '#1e293b', fontFamily: MONO }}>{e.serial || '—'}</td>
                        <td style={{ padding: '6px 10px', fontSize: '10px', color: '#1e293b', fontFamily: SANS }}>{e.cal || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>

        <PageFooter record={record} pageLabel="Page 1 of 3" />
      </div>

      {/* ══════════════════════════════════════════════
          PAGE 2: Circuit Test Results
          ══════════════════════════════════════════════ */}
      <div className="report-page" style={PAGE_STYLE}>
        <BleedLine />
        <PageHeader record={record} />
        <div style={{ flex: 1, padding: '0 20px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <SHead title="Consumer and Sub Mains" color="#1e4080" />
          <div style={{ flexShrink: 0, marginBottom: '12px' }}>
            <InlineCircuitGrid rows={mainsRows} />
          </div>
          <SHead title="Final Sub Circuits" color="#1a3a6b" />
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <InlineCircuitGrid rows={subRows} />
          </div>
        </div>
        <PageFooter record={record} pageLabel="Page 2 of 3" />
      </div>

      {/* ══════════════════════════════════════════════
          PAGE 3: Declaration & Sign-Off
          ══════════════════════════════════════════════ */}
      <div className="report-page" style={PAGE_STYLE}>
        <BleedLine />
        <PageHeader record={record} />
        <div style={{ flex: 1, padding: '0 20px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <SHead title="Declaration & Sign-Off" />
          {/* Declaration box */}
          <div style={{ background: '#dbeafe', border: `1px solid ${T}`, borderLeft: `4px solid ${T}`, borderRadius: '6px', padding: '12px 14px', marginBottom: '14px', flexShrink: 0 }}>
            <p style={{ fontSize: '9.5px', color: '#1c1917', lineHeight: 1.7, margin: 0, fontFamily: SANS }}>
              I certify that the electrical installation described in this schedule has been inspected and found to comply with the requirements of AS/NZS 3000:2018 to the best of my knowledge and belief.
            </p>
          </div>
          {/* Signature + Checklist */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px', flexShrink: 0 }}>
            {/* Signature card */}
            <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
              <div style={{ padding: '7px 12px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '7.5px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: SANS }}>Registered Electrical Worker</span>
              </div>
              <div style={{ padding: '10px 12px' }}>
                {record.signatureData
                  ? <div style={{ marginBottom: '8px' }}>
                      <img src={record.signatureData} alt="Signature" crossOrigin="anonymous" style={{ height: '54px', maxWidth: '100%', objectFit: 'contain' }} />
                      <div style={{ height: '1px', background: '#e2e8f0', marginTop: '5px' }} />
                      <div style={{ fontSize: '7.5px', color: '#94a3b8', fontFamily: SANS, marginTop: '3px' }}>Authorised Signature</div>
                    </div>
                  : <div style={{ height: '54px', borderBottom: '2px solid #e2e8f0', marginBottom: '8px', display: 'flex', alignItems: 'flex-end' }}>
                      <div style={{ fontSize: '7.5px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px', fontFamily: SANS }}>Authorised Signature</div>
                    </div>
                }
                <table style={{ width: '100%', borderCollapse: 'collapse' }}><tbody>
                  <DRow label="Name" value={record.workerName} />
                  <DRow label="Licence No." value={record.licenceNumber} />
                  <DRow label="Date" value={record.date} />
                </tbody></table>
              </div>
            </div>
            {/* Verification checklist */}
            <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
              <div style={{ padding: '7px 12px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '7.5px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: SANS }}>Verification Checklist</span>
              </div>
              <div style={{ padding: '10px 12px' }}>
                {[
                  ['Live Parts Screened', record.livePartsScreened],
                  ['Main Link / Neutral Reconnected', record.mainLinkNeutralReconnected],
                  ['MEN Compliant', record.msbMenCompliant],
                ].map(([label, val]) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 0', borderBottom: '1px solid #f1f5f9' }}>
                    <span style={{ fontSize: '10px', color: '#475569', fontFamily: SANS }}>{label}</span>
                    <span style={{ fontSize: '9px', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', background: val === true || val === 'Yes' ? '#dcfce7' : val === false || val === 'No' ? '#fee2e2' : '#f1f5f9', color: val === true || val === 'Yes' ? '#16a34a' : val === false || val === 'No' ? '#dc2626' : '#64748b', fontFamily: SANS }}>
                      {val === true || val === 'Yes' ? '✓ Yes' : val === false || val === 'No' ? '✗ No' : '—'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          {/* Notes */}
          {record.notes && (
            <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderLeft: '4px solid #f59e0b', borderRadius: '7px', padding: '10px 14px', flexShrink: 0 }}>
              <div style={{ fontSize: '8px', fontWeight: 800, color: '#78716c', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '5px', fontFamily: SANS }}>Notes / Defects</div>
              <p style={{ fontSize: '10px', color: '#1c1917', lineHeight: 1.7, margin: 0, fontFamily: SANS }}>{record.notes}</p>
            </div>
          )}
          {/* Standards note */}
          <div style={{ marginTop: 'auto', paddingTop: '8px', borderTop: '1px solid #f1f5f9', flexShrink: 0 }}>
            <p style={{ fontSize: '7px', color: '#94a3b8', margin: 0, fontFamily: SANS }}>
              This document has been prepared in accordance with AS/NZS 3000:2018 Wiring Rules, AS/NZS 3008.1.1 Selection of Cables, and AS/NZS 3017 Electrical Installations — Verification Guidelines. Results are valid at the time of testing only.
            </p>
          </div>
        </div>
        <PageFooter record={record} pageLabel="Page 3 of 3" />
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
  const printRef = useRef(null); // react-to-print trial
  const [pdfModal, setPdfModal] = useState({ open: false, blob: null, generating: false, progress: 0, error: null });

  // ── react-to-print trial: uses browser's native print engine ──
  // To revert: change onClick={handlePrint} back to onClick={handleSavePdf}
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: record ? buildTestRecordFilename(record) : 'Schedule of Test Results',
    pageStyle: `
      @page { size: A4 portrait; margin: 12mm 10mm; }
      @media print {
        * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        .no-print { display: none !important; }
        table { page-break-inside: auto; }
        tr { page-break-inside: avoid; }
        thead { display: table-header-group; }
        .print-break-before { break-before: page; page-break-before: always; }
      }
    `,
  });

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
            {/* TRIAL react-to-print — to revert change handlePrint → handleSavePdf */}
            <button onClick={handlePrint} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0f2044] text-white text-sm hover:bg-[#162d4a] transition-colors no-print">
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
          opacity: 1, visibility: 'visible', pointerEvents: 'none', zIndex: -1,
          overflow: 'visible',
        }}
        aria-hidden="true"
      >
        {record && <PdfBody record={record} mainsRows={mainsRows} subRows={subRows} />}
      </div>

      {/* ── Visible on-screen content — printRef points here for react-to-print ── */}
      <div ref={printRef} className="max-w-5xl mx-auto px-4 py-6 space-y-4 print-page">
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
            {/* TRIAL react-to-print — to revert change handlePrint → handleSavePdf */}
            <button onClick={handlePrint} className="flex items-center gap-1.5 px-4 py-2 bg-[#0f2044] text-white rounded-xl text-sm hover:bg-[#162d4a] transition-colors">
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
