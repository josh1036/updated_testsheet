/**
 * TorqueReportContent — Dashboard-faithful PDF render target
 *
 * Design goal: the PDF should look IDENTICAL to the TorqueForm dashboard UI.
 * - Same dark navy (#0f2044) section headers with white bold uppercase text
 * - Same white cards with rounded corners, subtle border, and shadow
 * - Same table: dark navy thead, alternating row stripes, phase circles, Pass/Fail badges
 * - Same two-column detail grids
 * - Same declaration box and signature layout
 *
 * html2canvas rules:
 * - ALL styles are pure inline (no Tailwind classes)
 * - Hidden render target uses left:-9999px + opacity:1 (NOT opacity:0)
 * - No box-shadow shorthand that html2canvas misreads — use boxShadow
 */

const NAVY = '#0f2044';
const NAVY2 = '#1e4080';
const SLATE_700 = '#334155';
const SLATE_500 = '#64748b';
const SLATE_400 = '#94a3b8';
const SLATE_300 = '#cbd5e1';
const SLATE_200 = '#e2e8f0';
const SLATE_100 = '#f1f5f9';
const SLATE_50  = '#f8fafc';
const WHITE     = '#ffffff';
const EMERALD_600 = '#059669';
const EMERALD_50  = '#ecfdf5';
const EMERALD_200 = '#a7f3d0';
const RED_600   = '#dc2626';
const RED_50    = '#fef2f2';
const RED_200   = '#fecaca';

const SANS = "'Inter', system-ui, -apple-system, sans-serif";
const MONO = "'JetBrains Mono', 'Courier New', monospace";

/* A4 at 96dpi — html2canvas scale:2 → jsPDF maps to 210×297mm */
const PW = 794;
const PH = 1123;

const PHASE_OPTIONS = [
  { value: 'L1',  label: 'L1',  color: '#dc2626', bg: '#fef2f2', border: '#fca5a5' },
  { value: 'L2',  label: 'L2',  color: '#f59e0b', bg: '#fffbeb', border: '#fcd34d' },
  { value: 'L3',  label: 'L3',  color: '#2563eb', bg: '#eff6ff', border: '#93c5fd' },
  { value: 'N',   label: 'N',   color: '#6b7280', bg: '#f9fafb', border: '#d1d5db' },
  { value: 'E',   label: 'E',   color: '#16a34a', bg: '#f0fdf4', border: '#86efac' },
  { value: 'PEN', label: 'PEN', color: '#15803d', bg: '#f0fdf4', border: '#4ade80' },
];

/* ── Shared page wrapper ── */
const PAGE_STYLE = {
  width: `${PW}px`,
  minHeight: `${PH}px`,
  boxSizing: 'border-box',
  fontFamily: SANS,
  background: SLATE_50,
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
  position: 'relative',
  flexShrink: 0,
  padding: '0 0 24px 0',
};

/* ── Section header — matches SectionHeader in TorqueForm ── */
function SectionHeader({ title, bg = NAVY }) {
  return (
    <div style={{
      background: bg,
      color: WHITE,
      padding: '10px 16px',
      fontWeight: 700,
      fontSize: '11px',
      textTransform: 'uppercase',
      letterSpacing: '0.08em',
      fontFamily: SANS,
    }}>
      {title}
    </div>
  );
}

/* ── White card ── */
function Card({ children, style = {} }) {
  return (
    <div style={{
      background: WHITE,
      borderRadius: '10px',
      border: `1px solid ${SLATE_200}`,
      boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
      overflow: 'hidden',
      marginBottom: '14px',
      ...style,
    }}>
      {children}
    </div>
  );
}

/* ── Field label + value pair ── */
function FieldRow({ label, value, mono = false, span = 1 }) {
  return (
    <div style={{ gridColumn: `span ${span}` }}>
      <div style={{ fontSize: '9px', fontWeight: 600, color: SLATE_500, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '3px', fontFamily: SANS }}>{label}</div>
      <div style={{ fontSize: '11px', color: value ? SLATE_700 : SLATE_300, fontFamily: mono ? MONO : SANS, fontWeight: value ? 500 : 400 }}>{value || '—'}</div>
    </div>
  );
}

/* ── Phase circle badge ── */
function PhaseBadge({ phase }) {
  const p = PHASE_OPTIONS.find(x => x.value === phase);
  if (!p) return <span style={{ color: SLATE_300, fontSize: '9px' }}>—</span>;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      padding: '2px 8px', borderRadius: '4px',
      background: p.bg, color: p.color, border: `1px solid ${p.border}`,
      fontWeight: 800, fontSize: '9px', fontFamily: SANS,
    }}>
      {p.label}
    </span>
  );
}

/* ── Result badge ── */
function ResultBadge({ result }) {
  if (result === 'Pass') return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', padding: '2px 8px', borderRadius: '4px', background: EMERALD_50, border: `1px solid ${EMERALD_200}`, color: EMERALD_600, fontSize: '9px', fontWeight: 700 }}>✓ Pass</span>
  );
  if (result === 'Fail') return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', padding: '2px 8px', borderRadius: '4px', background: RED_50, border: `1px solid ${RED_200}`, color: RED_600, fontSize: '9px', fontWeight: 700 }}>✗ Fail</span>
  );
  return <span style={{ color: SLATE_300, fontSize: '9px' }}>—</span>;
}

/* ── Page header — branding bar shown on every page ── */
function PageHeader({ r }) {
  return (
    <div style={{ background: WHITE, borderBottom: `1px solid ${SLATE_200}`, padding: '10px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {r.companyLogoUrl
          ? <img src={r.companyLogoUrl} alt="Logo" crossOrigin="anonymous" style={{ height: '30px', maxWidth: '100px', objectFit: 'contain' }} />
          : <div style={{ width: '30px', height: '30px', background: NAVY, borderRadius: '7px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#F59E0B', fontSize: '15px' }}>⚡</div>
        }
        <div>
          <div style={{ fontSize: '11px', fontWeight: 700, color: NAVY, fontFamily: SANS }}>{r.companyName || 'Electrical Contractor'}</div>
          <div style={{ fontSize: '8px', color: SLATE_400, fontFamily: SANS }}>
            {[r.companyAbn && `ABN: ${r.companyAbn}`, r.companyPhone].filter(Boolean).join(' · ') || 'Licensed Electrical Contractor'}
          </div>
        </div>
      </div>
      <div style={{ textAlign: 'right' }}>
        <div style={{ fontSize: '10px', fontWeight: 800, color: NAVY, letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: SANS }}>Termination Torque Certificate</div>
        <div style={{ fontSize: '8px', color: SLATE_400, marginTop: '2px', fontFamily: SANS }}>AS/NZS 3000:2018 · Clause 5.4.2</div>
      </div>
    </div>
  );
}

/* ── Page footer ── */
function PageFooter({ certNumber, pageLabel, companyName }) {
  return (
    <div style={{
      padding: '8px 20px',
      borderTop: `1px solid ${SLATE_200}`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      background: WHITE,
      flexShrink: 0,
      marginTop: 'auto',
    }}>
      <span style={{ fontSize: '8px', color: SLATE_400, fontFamily: SANS }}>{companyName ? `${companyName} · ` : ''}testsheet.com.au</span>
      {pageLabel && <span style={{ fontSize: '8px', fontWeight: 700, color: NAVY, background: '#dbeafe', padding: '3px 10px', borderRadius: '4px', fontFamily: SANS }}>{pageLabel}</span>}
      {certNumber && <span style={{ fontSize: '8px', color: SLATE_300, fontFamily: MONO }}>{certNumber}</span>}
    </div>
  );
}

/* ── Termination table — mirrors the dashboard table exactly ── */
function TermTable({ rows, units, startIndex }) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px', fontFamily: SANS }}>
        <thead>
          <tr style={{ background: NAVY, color: WHITE }}>
            {['#', 'Switchboard', 'Protection Device', 'Phase', `Required (${units})`, `Actual (${units})`, 'Result', 'Comments'].map((h, i) => (
              <th key={i} style={{
                padding: '8px 8px',
                textAlign: 'center',
                fontSize: '9px',
                fontWeight: 700,
                color: 'rgba(255,255,255,0.85)',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                border: `1px solid ${NAVY2}`,
                whiteSpace: 'nowrap',
                fontFamily: SANS,
              }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => {
            const rowNum = startIndex + idx + 1;
            const p = PHASE_OPTIONS.find(x => x.value === row.phase);
            const isEmpty = !row.deviceDescription && !row.switchboard && !row.phase;
            const isPass = row.result === 'Pass';
            const isFail = row.result === 'Fail';
            const rowBg = isPass ? '#f0fdf4' : isFail ? '#fef2f2' : idx % 2 === 0 ? WHITE : SLATE_50;
            const actualNum = parseFloat(row.actualTorque);
            const reqNum = parseFloat(row.requiredTorque);
            const actualColor = row.actualTorque && row.requiredTorque
              ? (actualNum >= reqNum ? EMERALD_600 : RED_600) : SLATE_700;

            const cellStyle = {
              border: `1px solid ${SLATE_200}`,
              padding: '6px 8px',
              verticalAlign: 'middle',
              background: rowBg,
              fontFamily: SANS,
            };

            return (
              <tr key={idx}>
                {/* Row number with phase colour */}
                <td style={{ ...cellStyle, textAlign: 'center' }}>
                  <span style={{
                    width: '20px', height: '20px', borderRadius: '50%',
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '9px', fontWeight: 700, fontFamily: MONO,
                    background: p ? p.bg : SLATE_100,
                    color: p ? p.color : SLATE_400,
                    border: p ? `1px solid ${p.border}` : `1px solid ${SLATE_200}`,
                  }}>{rowNum}</span>
                </td>
                <td style={{ ...cellStyle, textAlign: 'left', color: isEmpty ? SLATE_300 : SLATE_700, fontSize: '10px' }}>{row.switchboard || (isEmpty ? '—' : '')}</td>
                <td style={{ ...cellStyle, textAlign: 'left', color: isEmpty ? SLATE_300 : SLATE_700, fontWeight: isEmpty ? 400 : 500, fontSize: '10px' }}>{row.deviceDescription || (isEmpty ? '—' : '')}</td>
                <td style={{ ...cellStyle, textAlign: 'center' }}>
                  <PhaseBadge phase={row.phase} />
                </td>
                <td style={{ ...cellStyle, textAlign: 'center', fontFamily: MONO, color: isEmpty ? SLATE_300 : SLATE_700, fontSize: '10px' }}>{row.requiredTorque || '—'}</td>
                <td style={{ ...cellStyle, textAlign: 'center', fontFamily: MONO, fontWeight: 700, color: isEmpty ? SLATE_300 : actualColor, fontSize: '10px' }}>{row.actualTorque || '—'}</td>
                <td style={{ ...cellStyle, textAlign: 'center' }}>
                  <ResultBadge result={row.result} />
                </td>
                <td style={{ ...cellStyle, textAlign: 'left', color: SLATE_500, fontSize: '9px' }}>{row.comments || ''}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/* ══════════════════════════════════════════════
   MAIN EXPORT
   ══════════════════════════════════════════════ */
export default function TorqueReportContent({ record }) {
  const r = record || {};
  const rows = r.terminationRows || [];
  const filledRows = rows.filter(x => x.deviceDescription || x.switchboard || x.phase);
  const passed = filledRows.filter(x => x.result === 'Pass').length;
  const failed = filledRows.filter(x => x.result === 'Fail').length;
  const units = r.torqueUnits || 'Nm';
  const certNum = r.certificateNumber;

  /* Pagination — rows per page (approx) */
  const ROWS_PER_PAGE = 18;
  const rowChunks = [];
  for (let i = 0; i < rows.length; i += ROWS_PER_PAGE) {
    rowChunks.push(rows.slice(i, i + ROWS_PER_PAGE));
  }
  if (rowChunks.length === 0) rowChunks.push([]);

  const totalPages = rowChunks.length + 1; // +1 for declaration page

  const isComplete = r.status === 'Complete';
  const isRectified = r.status === 'Requires Rectification';
  const statusBg    = isComplete ? EMERALD_50 : isRectified ? RED_50 : '#fef3c7';
  const statusColor = isComplete ? EMERALD_600 : isRectified ? RED_600 : '#b45309';

  const contentPad = { padding: '16px 20px' };

  return (
    <div style={{ fontFamily: SANS, background: '#e5e7eb', display: 'inline-flex', flexDirection: 'column', gap: '4px' }}>

      {/* ══════════════════════════════════════════════
          PAGES: Certificate & Project Info + Tool + Rows
          ══════════════════════════════════════════════ */}
      {rowChunks.map((chunk, pageIdx) => {
        const isFirstPage = pageIdx === 0;
        const pageNum = pageIdx + 1;

        return (
          <div key={pageIdx} className="report-page" style={PAGE_STYLE}>
            <PageHeader r={r} />

            <div style={{ flex: 1, padding: '16px 20px 0 20px', display: 'flex', flexDirection: 'column', gap: '0' }}>

              {/* Page title — first page only */}
              {isFirstPage && (
                <div style={{ marginBottom: '14px' }}>
                  <div style={{ fontSize: '20px', fontWeight: 700, color: NAVY, fontFamily: SANS }}>{r.projectName || r.certificateNumber || 'Torque Certificate'}</div>
                  <div style={{ fontSize: '11px', color: SLATE_500, marginTop: '2px', fontFamily: SANS }}>Termination Torque Verification Certificate</div>
                </div>
              )}

              {/* ── Certificate & Project Information — first page only ── */}
              {isFirstPage && (
                <Card>
                  <SectionHeader title="Certificate & Project Information" />
                  <div style={{ ...contentPad, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px 20px' }}>
                    <FieldRow label="Certificate Number" value={r.certificateNumber} mono />
                    <FieldRow label="Project Name" value={r.projectName} span={2} />
                    <FieldRow label="Client" value={r.client} />
                    <FieldRow label="Site Address" value={r.siteAddress} span={2} />
                    <FieldRow label="Date of Verification" value={r.verificationDate} />
                    <FieldRow label="Technician Name" value={r.technicianName} span={2} />
                    <FieldRow label="Licence Number" value={r.licenceNumber} mono />
                    <FieldRow label="Work Order No." value={r.workOrderNumber} />
                    {r.notes && <FieldRow label="Notes / Scope" value={r.notes} span={4} />}
                  </div>
                </Card>
              )}

              {/* ── Torque Tool & Calibration — first page only ── */}
              {isFirstPage && (
                <Card>
                  <SectionHeader title="Torque Tool & Calibration" bg={SLATE_700} />
                  <div style={{ ...contentPad, display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px 20px' }}>
                    <FieldRow label="Tool Type" value={r.toolType} />
                    <FieldRow label="Manufacturer" value={r.torqueWrenchManufacturer} />
                    <FieldRow label="Model" value={r.torqueWrenchModel} mono />
                    <FieldRow label="Serial Number" value={r.toolSerialNumber} mono />
                    <FieldRow label="Cal. Certificate No." value={r.calibrationCertNumber} mono />
                    {r.calibrationDocUrl && (
                      <div style={{ gridColumn: 'span 5' }}>
                        <div style={{ fontSize: '9px', fontWeight: 600, color: SLATE_500, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>Calibration Certificate</div>
                        <img src={r.calibrationDocUrl} alt="Calibration cert" crossOrigin="anonymous" style={{ height: '80px', maxWidth: '200px', objectFit: 'contain', border: `1px solid ${SLATE_200}`, borderRadius: '6px', background: WHITE, padding: '4px' }} />
                      </div>
                    )}
                  </div>
                </Card>
              )}

              {/* ── Termination Verification Records ── */}
              <Card style={{ marginBottom: 0 }}>
                <SectionHeader title={isFirstPage ? 'Termination Verification Records' : `Termination Verification Records (continued) — Page ${pageNum}`} bg={NAVY2} />

                {/* Summary strip — first page only */}
                {isFirstPage && filledRows.length > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '8px 16px', background: SLATE_50, borderBottom: `1px solid ${SLATE_100}` }}>
                    <span style={{ fontSize: '11px', color: SLATE_500, fontWeight: 600, fontFamily: SANS }}>Total: <span style={{ color: SLATE_700 }}>{filledRows.length}</span></span>
                    {passed > 0 && <span style={{ fontSize: '11px', color: EMERALD_600, fontWeight: 600, fontFamily: SANS }}>✓ Pass: {passed}</span>}
                    {failed > 0 && <span style={{ fontSize: '11px', color: RED_600, fontWeight: 600, fontFamily: SANS }}>✗ Fail: {failed}</span>}
                    <span style={{ fontSize: '11px', color: SLATE_500, fontWeight: 600, marginLeft: 'auto', fontFamily: SANS }}>Units: <span style={{ color: SLATE_700, fontFamily: MONO }}>{units}</span></span>
                  </div>
                )}

                <TermTable rows={chunk} units={units} startIndex={pageIdx * ROWS_PER_PAGE} />

                {/* Units note */}
                <div style={{ padding: '6px 16px', borderTop: `1px solid ${SLATE_100}`, background: SLATE_50 }}>
                  <span style={{ fontSize: '9px', color: SLATE_400, fontFamily: SANS }}>Torque units: <strong style={{ color: SLATE_700 }}>{units}</strong></span>
                </div>
              </Card>
            </div>

            <div style={{ padding: '0 20px' }}>
              <PageFooter certNumber={certNum} pageLabel={`Page ${pageNum} of ${totalPages}`} companyName={r.companyName} />
            </div>
          </div>
        );
      })}

      {/* ══════════════════════════════════════════════
          FINAL PAGE: Declaration & Sign-Off
          ══════════════════════════════════════════════ */}
      <div className="report-page" style={PAGE_STYLE}>
        <PageHeader r={r} />

        <div style={{ flex: 1, padding: '16px 20px 0 20px', display: 'flex', flexDirection: 'column' }}>

          {/* Declaration card */}
          <Card>
            <SectionHeader title="Declaration & Sign-Off" bg={SLATE_700} />
            <div style={contentPad}>
              {/* Declaration text — matches the form's declaration box */}
              <div style={{ background: SLATE_50, border: `1px solid ${SLATE_200}`, borderRadius: '8px', padding: '12px 14px', marginBottom: '16px' }}>
                <p style={{ fontSize: '11px', color: '#475569', lineHeight: 1.7, margin: 0, fontFamily: SANS }}>
                  I certify that the electrical terminations recorded in this certificate were checked and/or tightened using the identified torque tool and verified against manufacturer torque requirements or approved project documentation.
                </p>
              </div>

              {/* Signature + Status grid — mirrors the form layout */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                {/* Technician Signature */}
                <div style={{ border: `1px solid ${SLATE_200}`, borderRadius: '8px', overflow: 'hidden' }}>
                  <div style={{ padding: '7px 12px', background: SLATE_50, borderBottom: `1px solid ${SLATE_200}` }}>
                    <span style={{ fontSize: '9px', fontWeight: 700, color: SLATE_400, textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: SANS }}>Technician Signature</span>
                  </div>
                  <div style={{ padding: '10px 12px' }}>
                    {(r.technicianSignature || r.signatureData)
                      ? <div>
                          <img src={r.technicianSignature || r.signatureData} alt="Signature" crossOrigin="anonymous" style={{ height: '56px', maxWidth: '100%', objectFit: 'contain' }} />
                          <div style={{ width: '100%', height: '1px', background: SLATE_200, marginTop: '5px' }} />
                        </div>
                      : <div style={{ height: '56px', borderBottom: `2px solid ${SLATE_200}`, display: 'flex', alignItems: 'flex-end' }}>
                          <p style={{ fontSize: '8px', color: SLATE_400, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px', fontFamily: SANS }}>Authorised Signature</p>
                        </div>
                    }
                    <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <FieldRow label="Technician" value={r.technicianName} />
                      <FieldRow label="Date" value={r.verificationDate} />
                      <FieldRow label="Licence No." value={r.licenceNumber} mono />
                    </div>
                  </div>
                </div>

                {/* Final Status */}
                <div style={{ border: `1px solid ${SLATE_200}`, borderRadius: '8px', overflow: 'hidden' }}>
                  <div style={{ padding: '7px 12px', background: SLATE_50, borderBottom: `1px solid ${SLATE_200}` }}>
                    <span style={{ fontSize: '9px', fontWeight: 700, color: SLATE_400, textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: SANS }}>Final Status</span>
                  </div>
                  <div style={{ padding: '14px 12px' }}>
                    <div style={{
                      display: 'inline-flex', alignItems: 'center', gap: '6px',
                      padding: '6px 14px', borderRadius: '999px',
                      fontSize: '11px', fontWeight: 700,
                      background: statusBg, color: statusColor,
                      marginBottom: '12px', fontFamily: SANS,
                    }}>
                      {isComplete ? '✓' : isRectified ? '✗' : '●'} {r.status || 'Draft'}
                    </div>
                    {filledRows.length > 0 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <FieldRow label="Total Terminations" value={String(filledRows.length)} />
                        {passed > 0 && <FieldRow label="Pass" value={`${passed} (${Math.round((passed / filledRows.length) * 100)}%)`} />}
                        {failed > 0 && <FieldRow label="Fail / Rectified" value={String(failed)} />}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Standards note */}
              <div style={{ paddingTop: '10px', borderTop: `1px solid ${SLATE_100}` }}>
                <p style={{ fontSize: '8px', color: SLATE_400, margin: 0, fontFamily: SANS }}>
                  AS/NZS 3000:2018 · AS/NZS 3008.1.1 · AS/NZS 3017 — Generated {new Date().toLocaleDateString('en-AU')} · testsheet.com.au
                </p>
              </div>
            </div>
          </Card>
        </div>

        <div style={{ padding: '0 20px' }}>
          <PageFooter certNumber={certNum} pageLabel={`Page ${totalPages} of ${totalPages}`} companyName={r.companyName} />
        </div>
      </div>

    </div>
  );
}
