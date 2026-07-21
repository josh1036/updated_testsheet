/**
 * TorqueReportContent — Concept B "Editorial Premium"
 *
 * LAYOUT RULES (critical for correct PDF output):
 * - Every page is EXACTLY 794×1123px (A4 at 96dpi, 2× scale = 1588×2246px canvas)
 * - overflow: hidden on every page — nothing bleeds past the boundary
 * - Page 1: full hero header + summary strip + details + tool + rows
 * - Continuation pages: compact 48px header + bleed line + rows
 * - Final page: compact header + declaration + signature
 * - Every page has a 3px coloured bleed line at top and a footer bar at bottom
 */

const T = '#0f2044';
const PHASE_OPTIONS = [
  { value: 'L1',  label: 'L1',  color: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
  { value: 'L2',  label: 'L2',  color: '#d97706', bg: '#fffbeb', border: '#fde68a' },
  { value: 'L3',  label: 'L3',  color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe' },
  { value: 'N',   label: 'N',   color: '#64748b', bg: '#f8fafc', border: '#e2e8f0' },
  { value: 'E',   label: 'E',   color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' },
  { value: 'PEN', label: 'PEN', color: '#15803d', bg: '#f0fdf4', border: '#4ade80' },
];

/* A4 at 96 dpi — html2canvas scale:2 → 1588×2246px canvas → jsPDF maps to 210×297mm */
const PW = 794;   // page width px
const PH = 1123;  // page height px

/* Row heights (px) — used to calculate how many rows fit per page */
const ROW_H = 34;          // each table row
const TABLE_HEAD_H = 34;   // thead row
const LEGEND_H = 28;       // phase legend strip
const SECTION_HEAD_H = 36; // CBSHead

/* Fixed chrome heights (px) */
const BLEED_H = 3;
const FOOTER_H = 36;
const COMPACT_HEADER_H = 48;
const FULL_HEADER_H = 200; // hero + strip (approx)
const PADDING_V = 20;      // top+bottom padding inside content area

const MONO = "'JetBrains Mono', 'Courier New', monospace";
const SANS = "'Inter', system-ui, -apple-system, sans-serif";

/* ── Strict A4 page wrapper ── */
const PAGE = {
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

/* ── Bleed line ── */
function BleedLine() {
  return <div style={{ width: '100%', height: `${BLEED_H}px`, background: `linear-gradient(90deg, ${T} 0%, #1d4ed8 60%, #3b82f6 100%)`, flexShrink: 0 }} />;
}

/* ── Compact page header (continuation + declaration pages) ── */
function CompactHeader({ r }) {
  return (
    <div style={{
      height: `${COMPACT_HEADER_H}px`,
      padding: '0 24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderBottom: '1px solid #e2e8f0',
      background: '#fff',
      flexShrink: 0,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {r.companyLogoUrl
          ? <img src={r.companyLogoUrl} alt="Logo" crossOrigin="anonymous" style={{ height: '28px', maxWidth: '90px', objectFit: 'contain' }} />
          : <div style={{ width: '28px', height: '28px', background: T, borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '14px' }}>⚡</div>
        }
        <div>
          <div style={{ fontSize: '10px', fontWeight: 700, color: T }}>{r.companyName || 'Electrical Contractor'}</div>
          <div style={{ fontSize: '8px', color: '#94a3b8' }}>Licensed Electrical Contractor</div>
        </div>
      </div>
      <div style={{ textAlign: 'right' }}>
        <div style={{ fontSize: '9px', fontWeight: 800, color: T, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Torque Verification Certificate</div>
        <div style={{ fontSize: '7.5px', color: '#94a3b8', fontFamily: MONO }}>AS/NZS 3000:2018 · Clause 6.1 · AS/NZS 3017</div>
      </div>
    </div>
  );
}

/* ── Page footer ── */
function PageFooter({ certNumber, pageLabel, companyName }) {
  return (
    <div style={{
      height: `${FOOTER_H}px`,
      padding: '0 24px',
      borderTop: '2px solid #e2e8f0',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      background: '#fafbff',
      flexShrink: 0,
    }}>
      <span style={{ fontSize: '7.5px', color: '#94a3b8' }}>{companyName ? `${companyName} · ` : ''}testsheet.com.au</span>
      {pageLabel && (
        <span style={{ fontSize: '8px', fontWeight: 700, color: T, background: '#dbeafe', padding: '3px 12px', borderRadius: '4px' }}>{pageLabel}</span>
      )}
      {certNumber && (
        <span style={{ fontSize: '7px', color: '#cbd5e1', fontFamily: MONO }}>{certNumber}</span>
      )}
    </div>
  );
}

/* ── Section heading ── */
function SHead({ title }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px', marginTop: '14px', flexShrink: 0 }}>
      <div style={{ width: '18px', height: '2px', background: T, borderRadius: '1px', flexShrink: 0 }} />
      <span style={{ fontSize: '8.5px', fontWeight: 800, color: '#0f172a', letterSpacing: '0.12em', textTransform: 'uppercase' }}>{title}</span>
      <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
    </div>
  );
}

/* ── Data row (always renders — dash when empty) ── */
function DRow({ label, value, mono }) {
  return (
    <div style={{ padding: '5px 0', borderBottom: '1px solid #f8fafc', display: 'flex', gap: '12px', alignItems: 'baseline' }}>
      <span style={{ fontSize: '7px', fontWeight: 600, color: '#94a3b8', letterSpacing: '0.1em', textTransform: 'uppercase', width: '100px', flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: '9.5px', color: value ? '#0f172a' : '#cbd5e1', fontWeight: 500, fontFamily: mono ? MONO : SANS }}>{value || '—'}</span>
    </div>
  );
}

/* ── Termination table ── */
function TermTable({ rows, units, showLegend, startIndex }) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      {showLegend && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', flexWrap: 'wrap', flexShrink: 0 }}>
          <span style={{ fontSize: '7px', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginRight: '2px' }}>Phase:</span>
          {PHASE_OPTIONS.map(p => (
            <span key={p.value} style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', padding: '2px 7px', borderRadius: '4px', background: p.bg, border: `1px solid ${p.border}`, color: p.color, fontSize: '7.5px', fontWeight: 700 }}>{p.label}</span>
          ))}
        </div>
      )}
      <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9px', fontFamily: SANS }}>
          <thead>
            <tr style={{ background: T }}>
              {['#', 'Switchboard', 'Protection Device', 'Phase', `Req. (${units})`, `Actual (${units})`, 'Result', 'Notes'].map((h, i) => (
                <th key={i} style={{ padding: '8px 8px', textAlign: i === 0 ? 'center' : i <= 2 ? 'left' : 'center', fontSize: '7.5px', fontWeight: 700, color: 'rgba(255,255,255,0.85)', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => {
              const rowNum = startIndex + idx + 1;
              const p = PHASE_OPTIONS.find(x => x.value === row.phase);
              const isEmpty = !row.deviceDescription && !row.switchboard && !row.phase;
              const rowBg = idx % 2 === 0 ? '#fff' : '#fafbff';
              const isPass = row.result === 'Pass';
              const isFail = row.result === 'Fail';
              const actualNum = parseFloat(row.actualTorque);
              const reqNum = parseFloat(row.requiredTorque);
              const actualColor = row.actualTorque && row.requiredTorque
                ? (actualNum >= reqNum ? '#16a34a' : '#dc2626') : '#334155';
              return (
                <tr key={idx} style={{ background: rowBg, borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '6px 8px', textAlign: 'center', verticalAlign: 'middle' }}>
                    <span style={{ width: '18px', height: '18px', borderRadius: '4px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '7px', fontWeight: 700, fontFamily: MONO, background: p ? p.bg : '#f1f5f9', color: p ? p.color : '#94a3b8', border: p ? `1px solid ${p.border}` : '1px solid #e2e8f0' }}>{rowNum}</span>
                  </td>
                  <td style={{ padding: '6px 8px', color: isEmpty ? '#cbd5e1' : '#334155', verticalAlign: 'middle', fontSize: '8.5px' }}>{row.switchboard || (isEmpty ? '—' : '')}</td>
                  <td style={{ padding: '6px 8px', color: isEmpty ? '#cbd5e1' : '#334155', fontWeight: isEmpty ? 400 : 500, verticalAlign: 'middle', fontSize: '8.5px' }}>{row.deviceDescription || (isEmpty ? '—' : '')}</td>
                  <td style={{ padding: '6px 8px', textAlign: 'center', verticalAlign: 'middle' }}>
                    {p ? <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '2px 7px', borderRadius: '4px', background: p.bg, color: p.color, border: `1px solid ${p.border}`, fontWeight: 800, fontSize: '8px' }}>{p.label}</span>
                       : <span style={{ color: '#cbd5e1' }}>—</span>}
                  </td>
                  <td style={{ padding: '6px 8px', textAlign: 'center', fontFamily: MONO, color: isEmpty ? '#cbd5e1' : '#334155', verticalAlign: 'middle', fontSize: '8.5px' }}>{row.requiredTorque || <span style={{ color: '#cbd5e1' }}>—</span>}</td>
                  <td style={{ padding: '6px 8px', textAlign: 'center', fontFamily: MONO, fontWeight: 700, color: isEmpty ? '#cbd5e1' : actualColor, verticalAlign: 'middle', fontSize: '8.5px' }}>{row.actualTorque || <span style={{ color: '#cbd5e1', fontWeight: 400 }}>—</span>}</td>
                  <td style={{ padding: '6px 8px', textAlign: 'center', verticalAlign: 'middle' }}>
                    {isPass && <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', padding: '2px 7px', borderRadius: '4px', background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#15803d', fontSize: '7.5px', fontWeight: 700 }}>✓ Pass</span>}
                    {isFail && <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', padding: '2px 7px', borderRadius: '4px', background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', fontSize: '7.5px', fontWeight: 700 }}>✗ Fail</span>}
                    {!isPass && !isFail && <span style={{ color: '#cbd5e1' }}>—</span>}
                  </td>
                  <td style={{ padding: '6px 8px', fontSize: '7.5px', color: '#94a3b8', verticalAlign: 'middle' }}>{row.comments || ''}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div style={{ paddingTop: '5px', fontSize: '7.5px', color: '#94a3b8', flexShrink: 0 }}>
        Torque units: <strong style={{ color: '#334155' }}>{units}</strong>
      </div>
    </div>
  );
}

/* ── Main export ── */
export default function TorqueReportContent({ record }) {
  const r = record || {};
  const rows = r.terminationRows || [];
  const filledRows = rows.filter(x => x.deviceDescription || x.switchboard || x.phase);
  const passed = filledRows.filter(x => x.result === 'Pass').length;
  const failed = filledRows.filter(x => x.result === 'Fail').length;
  const units = r.torqueUnits || 'Nm';
  const certNum = r.certificateNumber;

  /* ── Calculate how many rows fit on each page ──
   * Page 1 content area = PH - BLEED_H - FOOTER_H - FULL_HEADER_H - PADDING_V
   * Continuation content area = PH - BLEED_H - FOOTER_H - COMPACT_HEADER_H - PADDING_V
   * Each page also needs: SHead (36) + legend (28 on p1 only) + table head (34)
   */
  const P1_CONTENT = PH - BLEED_H - FOOTER_H - FULL_HEADER_H - PADDING_V;
  const CONT_CONTENT = PH - BLEED_H - FOOTER_H - COMPACT_HEADER_H - PADDING_V;

  /* Page 1: subtract fixed chrome within content area */
  /* Fixed items on p1: project section head + tool section head + table section head + legend + table head */
  const P1_FIXED_CHROME = SECTION_HEAD_H * 3 + LEGEND_H + TABLE_HEAD_H + 180; /* 180 = approx for details + tool grid */
  const ROWS_ON_P1 = Math.max(4, Math.floor((P1_CONTENT - P1_FIXED_CHROME) / ROW_H));

  /* Continuation pages: subtract fixed chrome */
  const CONT_FIXED_CHROME = SECTION_HEAD_H + TABLE_HEAD_H;
  const ROWS_PER_CONT = Math.max(6, Math.floor((CONT_CONTENT - CONT_FIXED_CHROME) / ROW_H));

  const page1Rows = rows.slice(0, ROWS_ON_P1);
  const remainingRows = rows.slice(ROWS_ON_P1);
  const continuationChunks = [];
  for (let i = 0; i < remainingRows.length; i += ROWS_PER_CONT) {
    continuationChunks.push(remainingRows.slice(i, i + ROWS_PER_CONT));
  }
  const totalPages = 1 + continuationChunks.length + 1;

  const isComplete = r.status === 'Complete';
  const isRectified = r.status === 'Requires Rectification';
  const statusBg = isComplete ? '#f0fdf4' : isRectified ? '#fef2f2' : '#fef3c7';
  const statusColor = isComplete ? '#15803d' : isRectified ? '#dc2626' : '#b45309';
  const statusIcon = isComplete ? '✓' : isRectified ? '✗' : '●';

  /* Summary strip stats */
  const passRate = filledRows.length > 0 ? Math.round((passed / filledRows.length) * 100) : 0;

  return (
    <div style={{ fontFamily: SANS, background: '#e5e7eb', display: 'inline-flex', flexDirection: 'column', gap: '2px' }}>

      {/* ══════════════════════════════════════════════
          PAGE 1: Cover hero + details + tool + rows
          ══════════════════════════════════════════════ */}
      <div className="report-page" style={PAGE}>
        {/* Top bleed line */}
        <BleedLine />

        {/* Full hero header */}
        <div style={{ flexShrink: 0 }}>
          {/* Logo + doc title bar */}
          <div style={{ padding: '12px 24px 10px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {r.companyLogoUrl
                ? <img src={r.companyLogoUrl} alt="Logo" crossOrigin="anonymous" style={{ height: '32px', maxWidth: '110px', objectFit: 'contain' }} />
                : <div style={{ width: '32px', height: '32px', background: T, borderRadius: '7px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '16px' }}>⚡</div>
              }
              <div>
                <div style={{ fontSize: '11px', fontWeight: 700, color: T }}>{r.companyName || 'Electrical Contractor'}</div>
                <div style={{ fontSize: '8px', color: '#94a3b8' }}>Licensed Electrical Contractor</div>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '10px', fontWeight: 800, color: T, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Torque Verification Certificate</div>
              <div style={{ fontSize: '7.5px', color: '#94a3b8', fontFamily: MONO }}>AS/NZS 3000:2018 · Clause 6.1 · AS/NZS 3017</div>
            </div>
          </div>

          {/* Hero gradient banner */}
          <div style={{ background: `linear-gradient(135deg, ${T} 0%, #1e3a6e 60%, #1d4ed8 100%)`, padding: '18px 24px 14px 24px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', right: '-10px', top: '50%', transform: 'translateY(-50%)', fontSize: '60px', fontWeight: 900, color: 'rgba(255,255,255,0.04)', letterSpacing: '-0.04em', whiteSpace: 'nowrap', userSelect: 'none' }}>TORQUE</div>
            <div style={{ fontSize: '8px', fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '4px' }}>Client Deliverable · Electrical Compliance</div>
            <div style={{ fontSize: '20px', fontWeight: 900, color: '#fff', lineHeight: 1.1, marginBottom: '2px' }}>Termination Torque</div>
            <div style={{ fontSize: '20px', fontWeight: 900, color: '#60a5fa', lineHeight: 1.1, marginBottom: '8px' }}>Verification Certificate</div>
            <div style={{ fontSize: '8.5px', color: 'rgba(255,255,255,0.6)', marginBottom: '10px' }}>{r.siteAddress || r.projectName || ''}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '4px 12px', borderRadius: '5px', background: statusBg, border: `1px solid ${statusColor}30` }}>
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: statusColor }} />
                <span style={{ fontSize: '8px', fontWeight: 700, color: statusColor, letterSpacing: '0.1em', textTransform: 'uppercase' }}>{r.status || 'Draft'}</span>
              </div>
              {certNum && <span style={{ fontSize: '8px', color: 'rgba(255,255,255,0.35)', fontFamily: MONO }}>{certNum}{r.verificationDate ? ` · ${r.verificationDate}` : ''}</span>}
            </div>
          </div>

          {/* Summary strip */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
            {[
              { label: 'Total Verified', num: filledRows.length || '—', sub: 'Terminations', bar: T },
              { label: 'Pass', num: passed || '—', sub: `${passRate}% pass rate`, bar: '#16a34a', numColor: passed > 0 ? '#16a34a' : '#0f172a' },
              { label: 'Fail / Rectified', num: failed || '—', sub: 'Re-tightened on site', bar: '#dc2626', numColor: failed > 0 ? '#dc2626' : '#0f172a' },
              { label: 'Torque Units', num: units, sub: 'Newton metres', bar: '#1d4ed8', numFont: MONO },
            ].map((s, i) => (
              <div key={i} style={{ padding: '10px 14px', borderRight: i < 3 ? '1px solid #e2e8f0' : 'none', position: 'relative' }}>
                <div style={{ fontSize: '7px', fontWeight: 700, color: '#94a3b8', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '3px' }}>{s.label}</div>
                <div style={{ fontSize: '17px', fontWeight: 900, color: s.numColor || '#0f172a', lineHeight: 1, fontFamily: s.numFont || SANS }}>{s.num}</div>
                <div style={{ fontSize: '7.5px', color: '#94a3b8', marginTop: '2px' }}>{s.sub}</div>
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '2px', background: s.bar }} />
              </div>
            ))}
          </div>
        </div>

        {/* Content area */}
        <div style={{ flex: 1, padding: '0 24px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {/* Project & Certificate Details */}
          <SHead title="Project & Certificate Details" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 28px', marginBottom: '2px', flexShrink: 0 }}>
            <div>
              <DRow label="Certificate No." value={r.certificateNumber} mono />
              <DRow label="Project" value={r.projectName} />
              <DRow label="Site Address" value={r.siteAddress} />
              <DRow label="Date" value={r.verificationDate} />
            </div>
            <div>
              <DRow label="Client" value={r.client} />
              <DRow label="Technician" value={r.technicianName} />
              <DRow label="Licence No." value={r.licenceNumber} mono />
              {r.notes && <DRow label="Notes / Scope" value={r.notes} />}
            </div>
          </div>

          {/* Torque Tool & Calibration */}
          <SHead title="Torque Tool & Calibration" />
          <div style={{ border: '1px solid #e2e8f0', borderRadius: '7px', overflow: 'hidden', marginBottom: '8px', flexShrink: 0 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', background: '#fff' }}>
              <div style={{ padding: '8px 12px', borderRight: '1px solid #f1f5f9' }}>
                <DRow label="Tool Type" value={r.toolType} />
                <DRow label="Manufacturer" value={r.torqueWrenchManufacturer} />
                <DRow label="Model" value={r.torqueWrenchModel} mono />
              </div>
              <div style={{ padding: '8px 12px' }}>
                <DRow label="Serial No." value={r.toolSerialNumber} mono />
                <DRow label="Cal. Cert. No." value={r.calibrationCertNumber} mono />
                <div style={{ padding: '5px 0', display: 'flex', gap: '12px', alignItems: 'baseline' }}>
                  <span style={{ fontSize: '7px', fontWeight: 600, color: '#94a3b8', letterSpacing: '0.1em', textTransform: 'uppercase', width: '100px', flexShrink: 0 }}>Cal. Status</span>
                  {r.calibrationCertNumber
                    ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '2px 8px', borderRadius: '4px', background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#15803d', fontSize: '7.5px', fontWeight: 700 }}>✓ Valid</span>
                    : <span style={{ fontSize: '9.5px', color: '#cbd5e1' }}>—</span>
                  }
                </div>
              </div>
            </div>
          </div>

          {/* Termination Records — page 1 rows */}
          <SHead title={`Termination Verification Records${filledRows.length > 0 ? ` — ${filledRows.length} total` : ''}`} />
          <TermTable rows={page1Rows} units={units} showLegend={true} startIndex={0} />
        </div>

        <PageFooter certNumber={certNum} pageLabel={`Page 1 of ${totalPages}`} companyName={r.companyName} />
      </div>

      {/* ══════════════════════════════════════════════
          CONTINUATION PAGES
          ══════════════════════════════════════════════ */}
      {continuationChunks.map((chunk, ci) => (
        <div key={ci} className="report-page" style={PAGE}>
          <BleedLine />
          <CompactHeader r={r} />
          <div style={{ flex: 1, padding: '0 24px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <SHead title={`Termination Verification Records (continued) — Page ${2 + ci}`} />
            <TermTable rows={chunk} units={units} showLegend={false} startIndex={ROWS_ON_P1 + ci * ROWS_PER_CONT} />
          </div>
          <PageFooter certNumber={certNum} pageLabel={`Page ${2 + ci} of ${totalPages}`} companyName={r.companyName} />
        </div>
      ))}

      {/* ══════════════════════════════════════════════
          FINAL PAGE: Declaration & Sign-Off
          ══════════════════════════════════════════════ */}
      <div className="report-page" style={PAGE}>
        <BleedLine />
        <CompactHeader r={r} />
        <div style={{ flex: 1, padding: '0 24px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <SHead title="Declaration & Sign-Off" />

          {/* Declaration box */}
          <div style={{ background: '#dbeafe', border: `1px solid ${T}`, borderLeft: `4px solid ${T}`, borderRadius: '6px', padding: '12px 14px', marginBottom: '16px', flexShrink: 0 }}>
            <p style={{ fontSize: '9.5px', color: '#1c1917', lineHeight: 1.7, margin: 0 }}>
              I certify that the electrical terminations recorded in this certificate were checked and/or tightened using the identified torque tool and verified against manufacturer torque requirements or approved project documentation.
            </p>
          </div>

          {/* Signature + Status grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '16px', flexShrink: 0 }}>
            {/* Technician Signature */}
            <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
              <div style={{ padding: '7px 12px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '7.5px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Technician Signature</span>
              </div>
              <div style={{ padding: '10px 12px' }}>
                {(r.technicianSignature || r.signatureData)
                  ? <div>
                      <img src={r.technicianSignature || r.signatureData} alt="Signature" crossOrigin="anonymous" style={{ height: '56px', maxWidth: '100%', objectFit: 'contain' }} />
                      <div style={{ width: '100%', height: '1px', background: '#e2e8f0', marginTop: '5px' }} />
                    </div>
                  : <div style={{ height: '56px', borderBottom: '2px solid #e2e8f0', display: 'flex', alignItems: 'flex-end' }}>
                      <p style={{ fontSize: '7px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px' }}>Authorised Signature</p>
                    </div>
                }
                <DRow label="Technician" value={r.technicianName} />
                <DRow label="Date" value={r.verificationDate} />
                <DRow label="Licence No." value={r.licenceNumber} mono />
              </div>
            </div>

            {/* Final Status */}
            <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
              <div style={{ padding: '7px 12px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '7.5px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Final Status</span>
              </div>
              <div style={{ padding: '14px 12px' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 14px', borderRadius: '999px', fontSize: '10px', fontWeight: 700, background: statusBg, color: statusColor, marginBottom: '10px' }}>
                  {statusIcon} {r.status || 'Draft'}
                </div>
                {filledRows.length > 0 && (
                  <div>
                    <DRow label="Total Terminations" value={String(filledRows.length)} />
                    {passed > 0 && <DRow label="Pass" value={`${passed} (${passRate}%)`} />}
                    {failed > 0 && <DRow label="Fail / Rectified" value={String(failed)} />}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Standards note */}
          <div style={{ marginTop: 'auto', paddingTop: '8px', borderTop: '1px solid #f1f5f9', flexShrink: 0 }}>
            <p style={{ fontSize: '7px', color: '#94a3b8', margin: 0 }}>
              AS/NZS 3000:2018 · AS/NZS 3008.1.1 · AS/NZS 3017 — Generated {new Date().toLocaleDateString('en-AU')} · testsheet.com.au
            </p>
          </div>
        </div>
        <PageFooter certNumber={certNum} pageLabel={`Page ${totalPages} of ${totalPages}`} companyName={r.companyName} />
      </div>

    </div>
  );
}
