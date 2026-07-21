/**
 * TorqueReportContent — Concept B "Editorial Premium"
 *
 * Design language:
 * - Full-bleed dark gradient hero with large watermark text
 * - 4-column summary strip with coloured bottom bars
 * - 20px dash + rule section headers
 * - JetBrains Mono for all numeric/code data
 * - Rounded table with soft shadow, phase-coloured row numbers
 * - Generous whitespace, Inter typeface
 * - Matching footer with centred page badge
 */

const T = '#0f2044';

const PHASE_OPTIONS = [
  { value: 'L1',  label: 'L1',  color: '#dc2626', bg: '#fef2f2', border: '#fecaca', barColor: '#dc2626' },
  { value: 'L2',  label: 'L2',  color: '#d97706', bg: '#fffbeb', border: '#fde68a', barColor: '#f59e0b' },
  { value: 'L3',  label: 'L3',  color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe', barColor: '#2563eb' },
  { value: 'N',   label: 'N',   color: '#64748b', bg: '#f8fafc', border: '#e2e8f0', barColor: '#64748b' },
  { value: 'E',   label: 'E',   color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0', barColor: '#16a34a' },
  { value: 'PEN', label: 'PEN', color: '#15803d', bg: '#f0fdf4', border: '#4ade80', barColor: '#15803d' },
];

const ROWS_ON_PAGE1 = 18;
const ROWS_PER_CONTINUATION = 22;

const MONO = "'JetBrains Mono', 'Courier New', monospace";
const SANS = "'Inter', system-ui, -apple-system, sans-serif";

const PAGE = {
  width: '210mm',
  minHeight: '297mm',
  boxSizing: 'border-box',
  fontFamily: SANS,
  background: '#fff',
  display: 'flex',
  flexDirection: 'column',
  pageBreakAfter: 'always',
  breakAfter: 'page',
};

/* ── Sub-components ── */

function CBHeader({ r }) {
  return (
    <div style={{
      padding: '20px 26px 16px 26px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      borderBottom: `2px solid ${T}`,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {r.companyLogoUrl
          ? <img src={r.companyLogoUrl} alt="Logo" crossOrigin="anonymous" style={{ height: '32px', maxWidth: '110px', objectFit: 'contain' }} />
          : (
            <div style={{ width: '34px', height: '34px', background: T, borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '16px', flexShrink: 0 }}>⚡</div>
          )
        }
        <div>
          <div style={{ fontSize: '12px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.01em' }}>{r.companyName || 'TestSheet'}</div>
          <div style={{ fontSize: '8px', color: '#64748b', marginTop: '2px' }}>Licensed Electrical Contractor</div>
        </div>
      </div>
      <div style={{ textAlign: 'right' }}>
        <div style={{ fontSize: '9px', fontWeight: 700, color: T, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Torque Verification Certificate</div>
        <div style={{ fontSize: '7.5px', color: '#94a3b8', marginTop: '3px' }}>AS/NZS 3000:2018 · Clause 8.3 · AS/NZS 3017</div>
      </div>
    </div>
  );
}

function CBCover({ r }) {
  const isDraft = !r.status || r.status === 'Draft';
  const isComplete = r.status === 'Complete';
  const statusBg = isComplete ? 'rgba(34,197,94,0.18)' : 'rgba(245,158,11,0.18)';
  const statusBorder = isComplete ? 'rgba(34,197,94,0.4)' : 'rgba(245,158,11,0.4)';
  const statusDot = isComplete ? '#22c55e' : '#f59e0b';
  const statusText = isComplete ? '#86efac' : '#fcd34d';
  const statusLabel = r.status || 'Draft';
  const subtitle = [r.projectName, r.siteAddress].filter(Boolean).join(' — ');

  return (
    <div style={{
      padding: '30px 26px 26px 26px',
      background: `linear-gradient(135deg, ${T} 0%, #1e3a6e 60%, #1d4ed8 100%)`,
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Watermark */}
      <div style={{
        position: 'absolute', right: '-10px', top: '50%', transform: 'translateY(-50%)',
        fontSize: '76px', fontWeight: 900, color: 'rgba(255,255,255,0.04)',
        letterSpacing: '-0.04em', whiteSpace: 'nowrap', userSelect: 'none',
        fontFamily: SANS,
      }}>TORQUE</div>

      <div style={{ fontSize: '8px', fontWeight: 600, color: '#93c5fd', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '10px' }}>
        Client Deliverable · Electrical Compliance
      </div>
      <h1 style={{ fontSize: '26px', fontWeight: 900, color: '#fff', lineHeight: 1.1, letterSpacing: '-0.03em', margin: '0 0 6px 0', fontFamily: SANS }}>
        Termination Torque<br />
        <span style={{ color: '#60a5fa' }}>Verification</span> Certificate
      </h1>
      {subtitle && (
        <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)', marginBottom: '18px' }}>{subtitle}</div>
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '6px',
          padding: '5px 14px', borderRadius: '6px',
          background: statusBg, border: `1px solid ${statusBorder}`,
        }}>
          <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: statusDot, boxShadow: `0 0 6px ${statusDot}` }} />
          <span style={{ fontSize: '9px', fontWeight: 700, color: statusText, letterSpacing: '0.1em', textTransform: 'uppercase' }}>{statusLabel}</span>
        </div>
        {r.certificateNumber && (
          <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.35)', fontFamily: MONO, letterSpacing: '0.04em' }}>
            {r.certificateNumber}{r.verificationDate ? ` · ${r.verificationDate}` : ''}
          </span>
        )}
      </div>
    </div>
  );
}

function CBStrip({ total, passed, failed, units }) {
  const passRate = total > 0 ? Math.round((passed / total) * 100) : 0;
  const stats = [
    { label: 'Total Verified', num: total || '—', sub: 'Terminations', bar: T, numStyle: {} },
    { label: 'Pass', num: passed || '—', sub: `${passRate}% pass rate`, bar: '#16a34a', numStyle: { color: passed > 0 ? '#16a34a' : '#0f172a' } },
    { label: 'Fail / Rectified', num: failed || '—', sub: 'Re-tightened on site', bar: '#dc2626', numStyle: { color: failed > 0 ? '#dc2626' : '#0f172a' } },
    { label: 'Torque Units', num: units || 'Nm', sub: 'Newton metres', bar: '#1d4ed8', numStyle: { fontSize: '16px', fontFamily: MONO } },
  ];
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
      {stats.map((s, i) => (
        <div key={i} style={{ padding: '14px 16px', borderRight: i < 3 ? '1px solid #e2e8f0' : 'none', position: 'relative' }}>
          <div style={{ fontSize: '7.5px', fontWeight: 700, color: '#94a3b8', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '5px' }}>{s.label}</div>
          <div style={{ fontSize: '20px', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.03em', lineHeight: 1, ...s.numStyle }}>{s.num}</div>
          <div style={{ fontSize: '8px', color: '#94a3b8', marginTop: '3px' }}>{s.sub}</div>
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '2px', background: s.bar }} />
        </div>
      ))}
    </div>
  );
}

function CBSHead({ title }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px', marginTop: '20px' }}>
      <div style={{ width: '20px', height: '2px', background: T, borderRadius: '1px', flexShrink: 0 }} />
      <span style={{ fontSize: '9px', fontWeight: 800, color: '#0f172a', letterSpacing: '0.12em', textTransform: 'uppercase' }}>{title}</span>
      <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
    </div>
  );
}

function CBRow({ label, value, mono }) {
  if (!value) return null;
  return (
    <div style={{ padding: '7px 0', borderBottom: '1px solid #f8fafc', display: 'flex', gap: '14px', alignItems: 'baseline' }}>
      <span style={{ fontSize: '7.5px', fontWeight: 600, color: '#94a3b8', letterSpacing: '0.1em', textTransform: 'uppercase', width: '105px', flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: '10px', color: '#0f172a', fontWeight: 500, fontFamily: mono ? MONO : SANS }}>{value}</span>
    </div>
  );
}

/* Always renders — shows dash when value is empty */
function CBRowFull({ label, value, mono }) {
  return (
    <div style={{ padding: '7px 0', borderBottom: '1px solid #f8fafc', display: 'flex', gap: '14px', alignItems: 'baseline' }}>
      <span style={{ fontSize: '7.5px', fontWeight: 600, color: '#94a3b8', letterSpacing: '0.1em', textTransform: 'uppercase', width: '105px', flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: '10px', color: value ? '#0f172a' : '#cbd5e1', fontWeight: 500, fontFamily: mono ? MONO : SANS }}>{value || '—'}</span>
    </div>
  );
}

function CBFooter({ certNumber, pageLabel, companyName }) {
  return (
    <div style={{
      padding: '9px 26px',
      borderTop: '1px solid #e2e8f0',
      marginTop: 'auto',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      background: '#fafbff',
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

function CBTableChunk({ rows, units, showLegend, startIndex }) {
  return (
    <div style={{ flex: 1 }}>
      {showLegend && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '7.5px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Phase:</span>
          {PHASE_OPTIONS.map(p => (
            <span key={p.value} style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '8px', fontWeight: 600, color: p.color }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '3px', background: p.color, display: 'inline-block', flexShrink: 0 }} />
              {p.label}
            </span>
          ))}
        </div>
      )}
      <div style={{ borderRadius: '8px', overflow: 'hidden', border: '1px solid #e2e8f0', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9px', fontFamily: SANS }}>
          <thead>
            <tr style={{ background: T }}>
              {['#', 'Switchboard', 'Protection Device', 'Phase', `Req. (${units})`, `Actual (${units})`, 'Result', 'Notes'].map((h, i) => (
                <th key={i} style={{
                  padding: '9px 10px',
                  textAlign: i === 0 ? 'center' : i <= 2 ? 'left' : 'center',
                  color: '#93c5fd',
                  fontSize: '7px',
                  fontWeight: 700,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  borderRight: i < 7 ? '1px solid rgba(255,255,255,0.06)' : 'none',
                  whiteSpace: 'nowrap',
                  width: i === 0 ? '30px' : undefined,
                }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => {
              const rowNum = startIndex + idx + 1;
              const p = PHASE_OPTIONS.find(x => x.value === row.phase);
              const isPass = row.result === 'Pass';
              const isFail = row.result === 'Fail';
              const isEmpty = !row.deviceDescription && !row.switchboard && !row.phase;
              const rowBg = idx % 2 === 0 ? '#fff' : '#fafbff';
              const actualNum = parseFloat(row.actualTorque);
              const reqNum = parseFloat(row.requiredTorque);
              const actualColor = row.actualTorque && row.requiredTorque
                ? (actualNum >= reqNum ? '#16a34a' : '#dc2626')
                : '#334155';

              return (
                <tr key={idx} style={{ background: rowBg, borderBottom: '1px solid #f1f5f9' }}>
                  {/* Row number */}
                  <td style={{ padding: '8px 10px', textAlign: 'center', verticalAlign: 'middle' }}>
                    <span style={{
                      width: '20px', height: '20px', borderRadius: '5px',
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '7.5px', fontWeight: 700, fontFamily: MONO,
                      background: p ? p.bg : '#f1f5f9',
                      color: p ? p.color : '#94a3b8',
                      border: p ? `1px solid ${p.border}` : '1px solid #e2e8f0',
                    }}>
                      {rowNum}
                    </span>
                  </td>
                  <td style={{ padding: '8px 10px', color: isEmpty ? '#cbd5e1' : '#334155', verticalAlign: 'middle' }}>
                    {row.switchboard || (isEmpty ? '—' : '')}
                  </td>
                  <td style={{ padding: '8px 10px', color: isEmpty ? '#cbd5e1' : '#334155', fontWeight: isEmpty ? 400 : 500, verticalAlign: 'middle' }}>
                    {row.deviceDescription || (isEmpty ? '—' : '')}
                  </td>
                  <td style={{ padding: '8px 10px', textAlign: 'center', verticalAlign: 'middle' }}>
                    {p
                      ? <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '3px 9px', borderRadius: '5px', background: p.bg, color: p.color, border: `1px solid ${p.border}`, fontWeight: 800, fontSize: '9px' }}>{p.label}</span>
                      : <span style={{ color: '#cbd5e1' }}>—</span>
                    }
                  </td>
                  <td style={{ padding: '8px 10px', textAlign: 'center', fontFamily: MONO, color: isEmpty ? '#cbd5e1' : '#334155', verticalAlign: 'middle' }}>
                    {row.requiredTorque || <span style={{ color: '#cbd5e1' }}>—</span>}
                  </td>
                  <td style={{ padding: '8px 10px', textAlign: 'center', fontFamily: MONO, fontWeight: 700, color: isEmpty ? '#cbd5e1' : actualColor, verticalAlign: 'middle' }}>
                    {row.actualTorque || <span style={{ color: '#cbd5e1', fontWeight: 400 }}>—</span>}
                  </td>
                  <td style={{ padding: '8px 10px', textAlign: 'center', verticalAlign: 'middle' }}>
                    {isPass && <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', padding: '3px 9px', borderRadius: '5px', background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#15803d', fontSize: '8px', fontWeight: 700 }}>✓ Pass</span>}
                    {isFail && <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', padding: '3px 9px', borderRadius: '5px', background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', fontSize: '8px', fontWeight: 700 }}>✗ Fail</span>}
                    {!isPass && !isFail && <span style={{ color: '#cbd5e1' }}>—</span>}
                  </td>
                  <td style={{ padding: '8px 10px', fontSize: '8px', color: '#94a3b8', verticalAlign: 'middle' }}>
                    {row.comments || ''}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div style={{ paddingTop: '6px', fontSize: '8px', color: '#94a3b8' }}>
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

  const page1Rows = rows.slice(0, ROWS_ON_PAGE1);
  const remainingRows = rows.slice(ROWS_ON_PAGE1);
  const continuationChunks = [];
  for (let i = 0; i < remainingRows.length; i += ROWS_PER_CONTINUATION) {
    continuationChunks.push(remainingRows.slice(i, i + ROWS_PER_CONTINUATION));
  }
  const totalPages = 1 + continuationChunks.length + 1;

  const isComplete = r.status === 'Complete';
  const isRectified = r.status === 'Requires Rectification';
  const statusBg = isComplete ? '#f0fdf4' : isRectified ? '#fef2f2' : '#fef3c7';
  const statusColor = isComplete ? '#15803d' : isRectified ? '#dc2626' : '#b45309';
  const statusIcon = isComplete ? '✓' : isRectified ? '✗' : '●';

  return (
    <div>
      {/* ── PAGE 1: Cover + Info + Tool + Records ── */}
      <div className="report-page" style={PAGE}>
        <CBHeader r={r} />
        <CBCover r={r} />
        <CBStrip total={filledRows.length} passed={passed} failed={failed} units={units} />

        <div style={{ padding: '0 26px 20px 26px', flex: 1, display: 'flex', flexDirection: 'column' }}>
          {/* Project & Certificate Details */}
          <CBSHead title="Project & Certificate Details" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 28px', marginBottom: '4px' }}>
            <div>
              <CBRow label="Certificate No." value={r.certificateNumber} mono />
              <CBRow label="Project" value={r.projectName} />
              <CBRow label="Site Address" value={r.siteAddress} />
              <CBRow label="Date" value={r.verificationDate} />
            </div>
            <div>
              <CBRow label="Client" value={r.client} />
              <CBRow label="Technician" value={r.technicianName} />
              <CBRow label="Licence No." value={r.licenceNumber} mono />
              <CBRow label="Work Order" value={r.workOrderNumber} mono />
            </div>
          </div>

          {r.notes && (
            <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderLeft: '4px solid #f59e0b', borderRadius: '6px', padding: '10px 14px', marginTop: '10px', marginBottom: '4px' }}>
              <p style={{ fontSize: '8px', fontWeight: 700, color: '#78716c', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px' }}>Notes / Scope</p>
              <p style={{ fontSize: '9.5px', color: '#1c1917', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{r.notes}</p>
            </div>
          )}

          {/* Torque Tool & Calibration */}
          <CBSHead title="Torque Tool & Calibration" />
          <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden', marginBottom: '4px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0', background: '#fff' }}>
              <div style={{ padding: '10px 14px', borderRight: '1px solid #f1f5f9' }}>
                <CBRowFull label="Tool Type" value={r.toolType} />
                <CBRowFull label="Manufacturer" value={r.torqueWrenchManufacturer} />
                <CBRowFull label="Model" value={r.torqueWrenchModel} mono />
              </div>
              <div style={{ padding: '10px 14px' }}>
                <CBRowFull label="Serial No." value={r.toolSerialNumber} mono />
                <CBRowFull label="Cal. Cert. No." value={r.calibrationCertNumber} mono />
                <div style={{ padding: '7px 0', borderBottom: '1px solid #f8fafc', display: 'flex', gap: '14px', alignItems: 'baseline' }}>
                  <span style={{ fontSize: '7.5px', fontWeight: 600, color: '#94a3b8', letterSpacing: '0.1em', textTransform: 'uppercase', width: '105px', flexShrink: 0 }}>Cal. Status</span>
                  {r.calibrationCertNumber
                    ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '2px 8px', borderRadius: '4px', background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#15803d', fontSize: '8px', fontWeight: 700 }}>✓ Valid</span>
                    : <span style={{ fontSize: '10px', color: '#cbd5e1' }}>—</span>
                  }
                </div>
              </div>
            </div>
          </div>

          {/* Termination Records */}
          <CBSHead title={`Termination Verification Records${filledRows.length > 0 ? ` — ${filledRows.length} total` : ''}`} />
          <CBTableChunk rows={page1Rows} units={units} showLegend={true} startIndex={0} />
        </div>

        <CBFooter certNumber={certNum} pageLabel={`Page 1 of ${totalPages}`} companyName={r.companyName} />
      </div>

      {/* ── CONTINUATION PAGES ── */}
      {continuationChunks.map((chunk, ci) => (
        <div key={ci} className="report-page" style={PAGE}>
          <CBHeader r={r} />
          <div style={{ padding: '0 26px 20px 26px', flex: 1, display: 'flex', flexDirection: 'column' }}>
            <CBSHead title="Termination Verification Records (continued)" />
            <CBTableChunk rows={chunk} units={units} showLegend={false} startIndex={ROWS_ON_PAGE1 + ci * ROWS_PER_CONTINUATION} />
          </div>
          <CBFooter certNumber={certNum} pageLabel={`Page ${2 + ci} of ${totalPages}`} companyName={r.companyName} />
        </div>
      ))}

      {/* ── FINAL PAGE: Declaration & Sign-Off ── */}
      <div className="report-page" style={PAGE}>
        <CBHeader r={r} />

        <div style={{ padding: '0 26px 20px 26px', flex: 1, display: 'flex', flexDirection: 'column' }}>
          <CBSHead title="Declaration & Sign-Off" />

          {/* Declaration box */}
          <div style={{
            background: '#dbeafe',
            border: `1px solid ${T}`,
            borderLeft: `4px solid ${T}`,
            borderRadius: '6px',
            padding: '14px 16px',
            marginBottom: '18px',
          }}>
            <p style={{ fontSize: '10px', color: '#1c1917', lineHeight: 1.8 }}>
              I certify that the electrical terminations recorded in this certificate were checked and/or tightened using the identified torque tool and verified against manufacturer torque requirements or approved project documentation.
            </p>
          </div>

          {/* Signature + Status */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '18px' }}>
            {/* Signature */}
            <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
              <div style={{ padding: '8px 12px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '8px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Technician Signature</span>
              </div>
              <div style={{ padding: '10px 12px' }}>
                {(r.technicianSignature || r.signatureData)
                  ? <div>
                      <img src={r.technicianSignature || r.signatureData} alt="Signature" crossOrigin="anonymous" style={{ height: '60px', maxWidth: '100%', objectFit: 'contain' }} />
                      <div style={{ width: '100%', height: '1px', background: '#e2e8f0', marginTop: '6px' }} />
                    </div>
                  : <div style={{ height: '60px', borderBottom: '2px solid #e2e8f0', display: 'flex', alignItems: 'flex-end' }}>
                      <p style={{ fontSize: '7px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px' }}>Authorised Signature</p>
                    </div>
                }
                <CBRow label="Technician" value={r.technicianName} />
                <CBRow label="Date" value={r.verificationDate} />
                <CBRow label="Licence No." value={r.licenceNumber} mono />
              </div>
            </div>

            {/* Final Status */}
            <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
              <div style={{ padding: '8px 12px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '8px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Final Status</span>
              </div>
              <div style={{ padding: '14px 12px' }}>
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: '6px',
                  padding: '6px 16px', borderRadius: '999px',
                  fontSize: '11px', fontWeight: 700,
                  background: statusBg, color: statusColor,
                  marginBottom: '12px',
                }}>
                  {statusIcon} {r.status || 'Draft'}
                </div>
                {filledRows.length > 0 && (
                  <div>
                    <CBRow label="Total Terminations" value={String(filledRows.length)} />
                    {passed > 0 && <CBRow label="Pass" value={`${passed} (${Math.round((passed / filledRows.length) * 100)}%)`} />}
                    {failed > 0 && <CBRow label="Fail / Rectified" value={String(failed)} />}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div style={{ marginTop: 'auto', paddingTop: '10px', borderTop: '1px solid #f1f5f9' }}>
            <p style={{ fontSize: '7px', color: '#94a3b8' }}>
              AS/NZS 3000:2018 · AS/NZS 3008.1.1 · AS/NZS 3017 — Generated {new Date().toLocaleDateString('en-AU')} · testsheet.com.au
            </p>
          </div>
        </div>

        <CBFooter certNumber={certNum} pageLabel={`Page ${totalPages} of ${totalPages}`} companyName={r.companyName} />
      </div>
    </div>
  );
}
