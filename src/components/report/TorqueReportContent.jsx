/**
 * TorqueReportContent
 * Redesigned to match the electrical test sheet PDF style (ReportPreview.jsx):
 * - Inline section headers (3px left accent bar + uppercase text + horizontal rule)
 * - Plain field rows (label/value pairs with thin bottom borders)
 * - Dark navy gradient hero banner on page 1
 * - Clean footer with centred page-label badge
 * - No Card wrappers, no grey rounded field boxes
 */

const T = '#0f2044';

const PHASE_OPTIONS = [
  { value: 'L1',  label: 'L1',  color: '#dc2626', bg: '#fef2f2', border: '#fca5a5' },
  { value: 'L2',  label: 'L2',  color: '#f59e0b', bg: '#fffbeb', border: '#fcd34d' },
  { value: 'L3',  label: 'L3',  color: '#2563eb', bg: '#eff6ff', border: '#93c5fd' },
  { value: 'N',   label: 'N',   color: '#6b7280', bg: '#f9fafb', border: '#d1d5db' },
  { value: 'E',   label: 'E',   color: '#16a34a', bg: '#f0fdf4', border: '#86efac' },
  { value: 'PEN', label: 'PEN', color: '#15803d', bg: '#f0fdf4', border: '#4ade80' },
];

const ROWS_ON_PAGE1 = 20;
const ROWS_PER_CONTINUATION = 25;

const PAGE_STYLE = {
  width: '210mm',
  boxSizing: 'border-box',
  fontFamily: 'system-ui, -apple-system, sans-serif',
  background: '#fff',
  padding: '16mm 16mm 20mm 16mm',
  display: 'flex',
  flexDirection: 'column',
};

// Section header — matches SHead from ReportPreview
function SHead({ title }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', marginTop: '16px' }}>
      <div style={{ width: '3px', height: '15px', background: T, borderRadius: '1px', flexShrink: 0 }} />
      <h2 style={{ fontSize: '9px', fontWeight: 900, color: '#1c1917', textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0 }}>{title}</h2>
      <div style={{ flex: 1, height: '1px', background: '#e7e5e0' }} />
    </div>
  );
}

// Field row — matches Row from ReportPreview
function Row({ label, value }) {
  if (!value) return null;
  return (
    <div style={{ display: 'flex', gap: '14px', padding: '6px 0', borderBottom: '1px solid #f0eeec', alignItems: 'baseline' }}>
      <span style={{ fontSize: '8px', fontWeight: 700, color: '#a8a29e', textTransform: 'uppercase', letterSpacing: '0.1em', width: '130px', flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: '10px', color: '#1c1917', fontWeight: 500 }}>{value}</span>
    </div>
  );
}

// Page header — matches PH from ReportPreview
function PH({ r }) {
  return (
    <div style={{ marginBottom: '14px', paddingBottom: '10px', borderBottom: `2px solid ${T}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {r.companyLogoUrl
          ? <img src={r.companyLogoUrl} alt="Logo" style={{ height: '26px', maxWidth: '100px', objectFit: 'contain' }} />
          : <span style={{ fontSize: '10px', fontWeight: 800, color: T }}>{r.companyName || 'TestSheet'}</span>
        }
        {r.companyLogoUrl && r.companyName && (
          <span style={{ fontSize: '9px', fontWeight: 700, color: '#1c1917', borderLeft: '1px solid #e7e5e0', paddingLeft: '8px' }}>{r.companyName}</span>
        )}
      </div>
      <div style={{ textAlign: 'right' }}>
        <p style={{ fontSize: '8px', fontWeight: 700, color: T, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Termination Torque Verification Certificate</p>
        <p style={{ fontSize: '7px', color: '#a8a29e', marginTop: '2px' }}>AS/NZS 3000:2018 · Clause 8.3</p>
      </div>
    </div>
  );
}

// Page footer — matches PF from ReportPreview
function PF({ certNumber, pageLabel }) {
  return (
    <div style={{ borderTop: '1px solid #e7e5e0', paddingTop: '8px', marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ fontSize: '7px', color: '#a8a29e' }}>TestSheet — testsheet.com.au</span>
      {pageLabel && (
        <span style={{ fontSize: '7.5px', color: T, fontWeight: 700, background: '#dbeafe', padding: '2px 8px', borderRadius: '2px' }}>{pageLabel}</span>
      )}
      {certNumber && (
        <span style={{ fontSize: '7px', color: '#a8a29e', fontFamily: 'monospace' }}>{certNumber}</span>
      )}
    </div>
  );
}

// Pass/Fail badge
function PassBadge({ value }) {
  if (!value) return null;
  const v = String(value).toLowerCase();
  if (v === 'pass') return <span style={{ fontSize: '8px', fontWeight: 700, color: '#15803d', background: '#dcfce7', border: '1px solid #86efac', padding: '2px 7px', borderRadius: '3px' }}>✓ Pass</span>;
  if (v === 'fail') return <span style={{ fontSize: '8px', fontWeight: 700, color: '#dc2626', background: '#fef2f2', border: '1px solid #fca5a5', padding: '2px 7px', borderRadius: '3px' }}>✗ Fail</span>;
  return <span style={{ fontSize: '9px', color: '#1c1917' }}>{value}</span>;
}

// Termination records table chunk
function TableChunk({ rows, units, showLegend, startIndex }) {
  const cellBase = { border: '1px solid #e7e5e0', padding: '4px 6px', verticalAlign: 'middle' };
  return (
    <div style={{ flex: 1 }}>
      {showLegend && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 0 8px 0', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '8px', color: '#a8a29e', fontWeight: 700, textTransform: 'uppercase' }}>Phase:</span>
          {PHASE_OPTIONS.map(p => (
            <span key={p.value} style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '8px', fontWeight: 700, color: p.color }}>
              <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: p.color, display: 'inline-block' }} />
              {p.label}
            </span>
          ))}
        </div>
      )}
      <div style={{ border: '1px solid #e7e5e0', borderRadius: '3px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9px' }}>
          <thead>
            <tr style={{ background: T }}>
              {['#', 'Switchboard', 'Protection Device', 'Phase', `Req. (${units})`, `Actual (${units})`, 'Result', 'Comments'].map((h, i) => (
                <th key={i} style={{
                  padding: '6px 7px',
                  textAlign: i === 0 ? 'center' : i <= 2 ? 'left' : 'center',
                  color: '#dbeafe',
                  fontSize: '7px',
                  fontWeight: 700,
                  letterSpacing: '0.07em',
                  textTransform: 'uppercase',
                  borderRight: '1px solid #1e3a6e',
                  whiteSpace: 'nowrap',
                  width: i === 0 ? '22px' : undefined,
                }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => {
              const i = startIndex + idx;
              const phaseOpt = PHASE_OPTIONS.find(p => p.value === row.phase);
              const rowBg = row.result === 'Pass' ? 'rgba(220,252,231,0.35)' : row.result === 'Fail' ? 'rgba(254,242,242,0.5)' : idx % 2 === 0 ? '#fff' : '#f0f5ff';
              const actualNum = parseFloat(row.actualTorque);
              const reqNum    = parseFloat(row.requiredTorque);
              const actualColor = row.actualTorque && row.requiredTorque
                ? actualNum >= reqNum ? '#15803d' : '#dc2626'
                : '#1c1917';
              return (
                <tr key={i} style={{ background: rowBg }}>
                  <td style={{ ...cellBase, textAlign: 'center' }}>
                    <span style={{
                      width: '16px', height: '16px', borderRadius: '50%',
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '7px', fontWeight: 700,
                      background: phaseOpt ? phaseOpt.bg : '#f1f5f9',
                      color: phaseOpt ? phaseOpt.color : '#a8a29e',
                      border: phaseOpt ? `1px solid ${phaseOpt.border}` : '1px solid #e2e8f0',
                    }}>
                      {i + 1}
                    </span>
                  </td>
                  <td style={{ ...cellBase, color: '#44403c' }}>{row.switchboard || ''}</td>
                  <td style={{ ...cellBase, color: '#44403c', fontWeight: 500 }}>{row.deviceDescription || ''}</td>
                  <td style={{ ...cellBase, textAlign: 'center', padding: '3px 4px' }}>
                    {phaseOpt
                      ? <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '2px 6px', borderRadius: '3px', background: phaseOpt.color, color: '#fff', fontWeight: 900, fontSize: '9px', minWidth: '28px' }}>{phaseOpt.label}</span>
                      : <span style={{ color: '#a8a29e' }}>—</span>
                    }
                  </td>
                  <td style={{ ...cellBase, textAlign: 'center', fontFamily: 'monospace', color: '#44403c' }}>{row.requiredTorque || <span style={{ color: '#a8a29e' }}>—</span>}</td>
                  <td style={{ ...cellBase, textAlign: 'center', fontFamily: 'monospace', fontWeight: 600, color: actualColor }}>{row.actualTorque || <span style={{ color: '#a8a29e', fontWeight: 400 }}>—</span>}</td>
                  <td style={{ ...cellBase, textAlign: 'center' }}>
                    {row.result ? <PassBadge value={row.result} /> : <span style={{ color: '#a8a29e' }}>—</span>}
                  </td>
                  <td style={{ ...cellBase, color: '#78716c', fontSize: '8px' }}>{row.comments || ''}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div style={{ paddingTop: '6px', fontSize: '8px', color: '#a8a29e' }}>
        Torque units: <strong style={{ color: '#44403c' }}>{units}</strong>
      </div>
    </div>
  );
}

export default function TorqueReportContent({ record }) {
  const r = record || {};
  const rows = r.terminationRows || [];
  const filledRows = rows.filter(x => x.deviceDescription || x.switchboard || x.phase);
  const passed = filledRows.filter(x => x.result === 'Pass').length;
  const failed = filledRows.filter(x => x.result === 'Fail').length;
  const units  = r.torqueUnits || 'Nm';
  const certNum = r.certificateNumber;

  const statusBg    = r.status === 'Complete' ? '#dcfce7' : r.status === 'Requires Rectification' ? '#fef2f2' : '#fef3c7';
  const statusColor = r.status === 'Complete' ? '#15803d' : r.status === 'Requires Rectification' ? '#dc2626' : '#b45309';
  const statusIcon  = r.status === 'Complete' ? '✓' : r.status === 'Requires Rectification' ? '✗' : '●';

  const page1Rows = rows.slice(0, ROWS_ON_PAGE1);
  const remainingRows = rows.slice(ROWS_ON_PAGE1);
  const continuationChunks = [];
  for (let i = 0; i < remainingRows.length; i += ROWS_PER_CONTINUATION) {
    continuationChunks.push(remainingRows.slice(i, i + ROWS_PER_CONTINUATION));
  }
  const totalPages = 1 + continuationChunks.length + 1;

  return (
    <div>
      {/* ── PAGE 1: Cover + Project Info + Tool Info + Records ── */}
      <div className="report-page" style={PAGE_STYLE}>
        <PH r={r} />

        {/* Hero banner — matches electrical PDF */}
        <div style={{
          background: `linear-gradient(135deg, ${T} 0%, #1e3a6e 100%)`,
          padding: '20px 18px',
          borderRadius: '4px',
          marginBottom: '16px',
        }}>
          <h1 style={{ fontSize: '20px', fontWeight: 900, color: '#fff', lineHeight: 1.1, margin: 0 }}>
            Termination Torque<br />Verification Certificate
          </h1>
          <div style={{ width: '36px', height: '3px', background: '#3b82f6', borderRadius: '2px', margin: '10px 0' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: r.status === 'Complete' ? '#22c55e' : '#f59e0b' }} />
              <span style={{ fontSize: '9px', fontWeight: 800, color: r.status === 'Complete' ? '#86efac' : '#fcd34d', textTransform: 'uppercase' }}>
                {r.status || 'Draft'}
              </span>
            </div>
            {certNum && (
              <span style={{ fontSize: '8px', color: 'rgba(255,255,255,0.5)', fontFamily: 'monospace' }}>{certNum}</span>
            )}
          </div>
        </div>

        {/* Certificate & Project Information */}
        <SHead title="Certificate & Project Information" />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 24px', marginBottom: '14px' }}>
          <div>
            <Row label="Certificate Number" value={r.certificateNumber} />
            <Row label="Project Name" value={r.projectName} />
            <Row label="Site Address" value={r.siteAddress} />
            <Row label="Date of Verification" value={r.verificationDate} />
          </div>
          <div>
            <Row label="Client" value={r.client} />
            <Row label="Technician Name" value={r.technicianName} />
            <Row label="Licence Number" value={r.licenceNumber} />
            <Row label="Job Number" value={r.workOrderNumber} />
          </div>
        </div>
        {r.notes && (
          <div style={{ background: '#fffbeb', border: '1px solid #fed7aa', borderLeft: '4px solid #f59e0b', borderRadius: '3px', padding: '10px 12px', marginBottom: '14px' }}>
            <p style={{ fontSize: '8px', fontWeight: 700, color: '#78716c', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px' }}>Notes / Scope</p>
            <p style={{ fontSize: '9.5px', color: '#1c1917', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{r.notes}</p>
          </div>
        )}

        {/* Torque Tool & Calibration */}
        <SHead title="Torque Tool & Calibration" />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 24px', marginBottom: '14px' }}>
          <div>
            <Row label="Tool Type" value={r.toolType} />
            <Row label="Manufacturer" value={r.torqueWrenchManufacturer} />
            <Row label="Model" value={r.torqueWrenchModel} />
          </div>
          <div>
            <Row label="Serial Number" value={r.toolSerialNumber} />
            <Row label="Cal. Certificate No." value={r.calibrationCertNumber} />
          </div>
        </div>
        {r.calibrationDocUrl && (
          <div style={{ marginBottom: '14px' }}>
            <span style={{ fontSize: '8px', fontWeight: 700, color: '#a8a29e', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: '4px' }}>Calibration Certificate</span>
            <img src={r.calibrationDocUrl} alt="Calibration certificate" style={{ height: '64px', maxWidth: '180px', objectFit: 'contain', border: '1px solid #e7e5e0', borderRadius: '3px', background: '#fff', padding: '3px' }} />
          </div>
        )}

        {/* Termination Verification Records */}
        <SHead title={`Termination Verification Records${filledRows.length > 0 ? ` — Total: ${filledRows.length}${passed > 0 ? ` · ✓ Pass: ${passed}` : ''}${failed > 0 ? ` · ✗ Fail: ${failed}` : ''}` : ''}`} />
        <TableChunk rows={page1Rows} units={units} showLegend={true} startIndex={0} />

        <PF certNumber={certNum} pageLabel={`Page 1 of ${totalPages}`} />
      </div>

      {/* ── CONTINUATION PAGES ── */}
      {continuationChunks.map((chunk, chunkIdx) => (
        <div key={chunkIdx} className="report-page" style={PAGE_STYLE}>
          <PH r={r} />
          <SHead title="Termination Verification Records (continued)" />
          <TableChunk
            rows={chunk}
            units={units}
            showLegend={false}
            startIndex={ROWS_ON_PAGE1 + chunkIdx * ROWS_PER_CONTINUATION}
          />
          <PF certNumber={certNum} pageLabel={`Page ${2 + chunkIdx} of ${totalPages}`} />
        </div>
      ))}

      {/* ── FINAL PAGE: Declaration & Sign-Off ── */}
      <div className="report-page" style={PAGE_STYLE}>
        <PH r={r} />

        <SHead title="Declaration & Sign-Off" />

        {/* Declaration text — matches electrical PDF blue box */}
        <div style={{ background: '#dbeafe', border: `1px solid ${T}`, borderLeft: `4px solid ${T}`, borderRadius: '3px', padding: '12px 14px', marginBottom: '16px' }}>
          <p style={{ fontSize: '10px', color: '#1c1917', lineHeight: 1.8 }}>
            I certify that the electrical terminations recorded in this certificate were checked and/or tightened using the identified torque tool and verified against manufacturer torque requirements or approved project documentation.
          </p>
        </div>

        {/* Signature section */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '16px' }}>
          <div style={{ border: '1px solid #e7e5e0', borderRadius: '3px', overflow: 'hidden' }}>
            <div style={{ padding: '6px 10px', background: '#fafaf9', borderBottom: '1px solid #e7e5e0' }}>
              <span style={{ fontSize: '8px', fontWeight: 900, color: '#a8a29e', textTransform: 'uppercase' }}>Technician Signature</span>
            </div>
            <div style={{ padding: '8px 10px' }}>
              {r.signatureData
                ? <div>
                    <img src={r.signatureData} alt="Signature" style={{ height: '60px', maxWidth: '100%', objectFit: 'contain' }} />
                    <div style={{ width: '100%', height: '1px', background: '#e7e5e0', marginTop: '6px' }} />
                  </div>
                : <div style={{ height: '60px', borderBottom: '2px solid #e7e5e0', display: 'flex', alignItems: 'flex-end' }}>
                    <p style={{ fontSize: '7px', color: '#a8a29e', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px' }}>Authorised Signature</p>
                  </div>
              }
              <Row label="Technician Name" value={r.technicianName} />
              <Row label="Date" value={r.verificationDate} />
            </div>
          </div>
          <div style={{ border: '1px solid #e7e5e0', borderRadius: '3px', overflow: 'hidden' }}>
            <div style={{ padding: '6px 10px', background: '#fafaf9', borderBottom: '1px solid #e7e5e0' }}>
              <span style={{ fontSize: '8px', fontWeight: 900, color: '#a8a29e', textTransform: 'uppercase' }}>Final Status</span>
            </div>
            <div style={{ padding: '12px 10px' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '5px 14px', borderRadius: '999px', fontSize: '11px', fontWeight: 700, background: statusBg, color: statusColor }}>
                {statusIcon} {r.status || 'Draft'}
              </div>
              {filledRows.length > 0 && (
                <div style={{ marginTop: '10px' }}>
                  <Row label="Total Terminations" value={String(filledRows.length)} />
                  {passed > 0 && <Row label="Pass" value={String(passed)} />}
                  {failed > 0 && <Row label="Fail" value={String(failed)} />}
                </div>
              )}
            </div>
          </div>
        </div>

        <div style={{ marginTop: 'auto', paddingTop: '10px', borderTop: '1px solid #f0eeec' }}>
          <p style={{ fontSize: '7px', color: '#a8a29e' }}>
            AS/NZS 3000:2018 · AS/NZS 3008.1.1 · AS/NZS 3017 — Generated {new Date().toLocaleDateString('en-AU')} · testsheet.com.au
          </p>
        </div>

        <PF certNumber={certNum} pageLabel={`Page ${totalPages} of ${totalPages}`} />
      </div>
    </div>
  );
}
