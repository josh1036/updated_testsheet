/**
 * ReportContent — ONE SOURCE OF TRUTH for the Electrical Test Sheet PDF/print layout.
 *
 * This component is shared between:
 *   - ReportPreview.jsx  (on-screen preview + PDF generation)
 *   - RecordView.jsx     (hidden render target for PDF generation)
 *
 * Any change to the design here automatically updates BOTH the browser preview
 * and the generated PDF. Never maintain a separate PDF layout.
 */

/* ── Design tokens ── */
const T = '#0f2044';
const MONO = "'JetBrains Mono', 'Courier New', monospace";
const SANS = "'Inter', system-ui, -apple-system, sans-serif";

/* ── Phase colour system ── */
export const PHASE_COLORS = {
  L1:  { color: '#dc2626', label: 'L1' },
  L2:  { color: '#f59e0b', label: 'L2' },
  L3:  { color: '#2563eb', label: 'L3' },
  N:   { color: '#6b7280', label: 'N' },
  E:   { color: '#16a34a', label: 'E' },
  PEN: { color: '#15803d', label: 'PEN' },
};

/* ── Sub-components ── */
function CBRow({ label, value, mono }) {
  if (!value) return null;
  return (
    <div style={{ padding: '7px 0', borderBottom: '1px solid #f8fafc', display: 'flex', gap: '14px', alignItems: 'baseline' }}>
      <span style={{ fontSize: '7.5px', fontWeight: 600, color: '#94a3b8', letterSpacing: '0.1em', textTransform: 'uppercase', width: '120px', flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: '10px', color: '#0f172a', fontWeight: 500, fontFamily: mono ? MONO : SANS }}>{value}</span>
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

function CBHeader({ record }) {
  const r = record;
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
          ? <img src={r.companyLogoUrl} alt="Logo" style={{ height: '32px', maxWidth: '110px', objectFit: 'contain' }} />
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
        <div style={{ fontSize: '9px', fontWeight: 700, color: T, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Schedule of Test Results</div>
        <div style={{ fontSize: '7.5px', color: '#94a3b8', marginTop: '3px' }}>AS/NZS 3000:2018 · Clause 8.3 · AS/NZS 3017</div>
      </div>
    </div>
  );
}

function CBFooter({ record, pageLabel }) {
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
      <span style={{ fontSize: '7.5px', color: '#94a3b8' }}>{record.companyName ? `${record.companyName} · ` : ''}testsheet.com.au</span>
      {pageLabel && (
        <span style={{ fontSize: '8px', fontWeight: 700, color: T, background: '#dbeafe', padding: '3px 12px', borderRadius: '4px' }}>{pageLabel}</span>
      )}
    </div>
  );
}

function PassBadge({ value }) {
  if (!value) return null;
  const v = String(value).toLowerCase();
  if (v === 'pass' || v === 'yes') return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', padding: '3px 9px', borderRadius: '5px', background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#15803d', fontSize: '8px', fontWeight: 700 }}>
      ✓ {v === 'yes' ? 'Yes' : 'Pass'}
    </span>
  );
  if (v === 'fail' || v === 'no') return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', padding: '3px 9px', borderRadius: '5px', background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', fontSize: '8px', fontWeight: 700 }}>
      ✗ {v === 'no' ? 'No' : 'Fail'}
    </span>
  );
  return <span style={{ fontSize: '9px', color: '#0f172a' }}>{value}</span>;
}

function PhasePill({ value }) {
  if (!value || value === 'na') return <span style={{ color: '#94a3b8', fontSize: '8px' }}>—</span>;
  const p = PHASE_COLORS[value];
  if (!p) return <span style={{ fontSize: '8px', color: '#334155' }}>{value}</span>;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      width: '24px', height: '24px', borderRadius: '50%',
      background: p.color, color: '#fff', fontWeight: 900, fontSize: '8px',
      fontFamily: SANS, flexShrink: 0,
    }}>{p.label}</span>
  );
}

function CircuitTbl({ rows }) {
  const filled = (rows || []).filter(r => r.cableId || r.circuitId || r.conductorSize || r.maxDemand);
  if (!filled.length) return null;
  const allCols = [
    { key: 'cableId', label: 'Cable No.' }, { key: 'circuitId', label: 'Circuit ID' }, { key: 'numPhases', label: 'Ph', phase: true },
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
    <div style={{ borderRadius: '8px', overflow: 'hidden', border: '1px solid #e2e8f0', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'auto', fontFamily: SANS }}>
        <thead>
          <tr style={{ background: T }}>
            {cols.map(c => (
              <th key={c.key} style={{ padding: '9px 8px', textAlign: 'left', color: '#93c5fd', fontSize: '7px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', borderRight: '1px solid rgba(255,255,255,0.06)', whiteSpace: 'nowrap' }}>
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filled.map((row, i) => (
            <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : '#fafbff', borderBottom: '1px solid #f1f5f9', pageBreakInside: 'avoid' }}>
              {cols.map(c => {
                const val = row[c.key];
                const empty = !val || val === 'na';
                return (
                  <td key={c.key} style={{
                    padding: '6px 8px',
                    borderRight: '1px solid #f1f5f9',
                    fontSize: '8.5px',
                    color: c.key === 'circuitId' || c.key === 'cableId' ? T : '#334155',
                    fontWeight: c.key === 'circuitId' || c.key === 'cableId' ? 700 : 400,
                    fontFamily: ['ocpdCurrentRating','conductorCcc','conductorSize','earthContMain','insResAE','insResAN','zaRpheActual','rcdCurrentTrip','circuitLength','maxDemand'].includes(c.key) ? MONO : SANS,
                  }}>
                    {empty ? null : c.phase ? <PhasePill value={val} /> : c.pf ? <PassBadge value={val} /> : val}
                  </td>
                );
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
    <div className="report-page" style={{
      width: '210mm',
      minHeight: '297mm',
      boxSizing: 'border-box',
      background: 'white',
      display: 'flex',
      flexDirection: 'column',
      pageBreakAfter: 'always',
      breakAfter: 'page',
      fontFamily: SANS,
    }}>
      {children}
    </div>
  );
}

/**
 * ReportContent — renders the full Schedule of Test Results document.
 * Used for both on-screen preview and PDF generation (ONE SOURCE OF TRUTH).
 */
export default function ReportContent({ record }) {
  const r = record;
  const swId = r.msbName === 'Other' ? (r.msbNameOther || 'Other') : r.msbName;
  const equip = (r.testEquipment || []).filter(e => e.type);
  const isComplete = r.status === 'Complete';
  const statusBg = isComplete ? 'rgba(34,197,94,0.18)' : 'rgba(245,158,11,0.18)';
  const statusBorder = isComplete ? 'rgba(34,197,94,0.4)' : 'rgba(245,158,11,0.4)';
  const statusDot = isComplete ? '#22c55e' : '#f59e0b';
  const statusText = isComplete ? '#86efac' : '#fcd34d';
  const subtitle = [r.addressLocation, r.contractorName].filter(Boolean).join(' — ');
  return (
    <div style={{ fontFamily: SANS, background: 'white' }}>
      {/* ── PAGE 1: Cover ── */}
      <PageWrap>
        <CBHeader record={r} />
        {/* Editorial hero — Concept B */}
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
          }}>TEST</div>
          <div style={{ fontSize: '8px', fontWeight: 600, color: '#93c5fd', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '10px' }}>
            Client Deliverable · Electrical Compliance
          </div>
          <h1 style={{ fontSize: '26px', fontWeight: 900, color: '#fff', lineHeight: 1.1, letterSpacing: '-0.03em', margin: '0 0 6px 0' }}>
            Schedule of<br />
            <span style={{ color: '#60a5fa' }}>Test</span> Results
          </h1>
          {subtitle && (
            <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)', marginBottom: '18px' }}>{subtitle}</div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            {r.status && (
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                padding: '5px 14px', borderRadius: '6px',
                background: statusBg, border: `1px solid ${statusBorder}`,
              }}>
                <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: statusDot, boxShadow: `0 0 6px ${statusDot}` }} />
                <span style={{ fontSize: '9px', fontWeight: 700, color: statusText, letterSpacing: '0.1em', textTransform: 'uppercase' }}>{r.status}</span>
              </div>
            )}
            {r.date && (
              <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.35)', fontFamily: MONO, letterSpacing: '0.04em' }}>{r.date}</span>
            )}
          </div>
        </div>
        <div style={{ padding: '0 26px 20px 26px', flex: 1, display: 'flex', flexDirection: 'column' }}>
          <CBSHead title="Project & Contractor Details" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 28px', marginBottom: '4px' }}>
            <div>
              <CBRow label="Address / Location" value={r.addressLocation} />
              <CBRow label="Date" value={r.date} />
              <CBRow label="Switchboard No." value={r.switchboardNumber} mono />
              <CBRow label="Contractor" value={r.contractorName} />
            </div>
            <div>
              <CBRow label="Contractor No." value={r.contractorNumber} mono />
              <CBRow label="Worker Name" value={r.workerName} />
              <CBRow label="Licence No." value={r.licenceNumber} mono />
            </div>
          </div>
          {(r.companyName || r.companyAbn) && (
            <>
              <CBSHead title="Company Information" />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 28px', marginBottom: '4px' }}>
                <div>
                  <CBRow label="Company" value={r.companyName} />
                  <CBRow label="ABN" value={r.companyAbn} mono />
                </div>
                <div>
                  <CBRow label="Phone" value={r.companyPhone} />
                  <CBRow label="Address" value={r.companyAddress} />
                </div>
              </div>
            </>
          )}
        </div>
        <CBFooter record={r} pageLabel="Cover" />
      </PageWrap>

      {/* ── PAGE 2: Equipment & Switchboard ── */}
      {(equip.length > 0 || swId || r.msbMaxDemand) && (
        <PageWrap>
          <CBHeader record={r} />
          <div style={{ padding: '0 26px 20px 26px', flex: 1, display: 'flex', flexDirection: 'column' }}>
            {equip.length > 0 && (
              <>
                <CBSHead title="Test Equipment" />
                <div style={{ borderRadius: '8px', overflow: 'hidden', border: '1px solid #e2e8f0', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', marginBottom: '4px' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: SANS }}>
                    <thead>
                      <tr style={{ background: T }}>
                        {['#', 'Type / Description', 'Serial Number', 'Cal. Date'].map(h => (
                          <th key={h} style={{ padding: '9px 10px', textAlign: 'left', color: '#93c5fd', fontSize: '7px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', borderRight: '1px solid rgba(255,255,255,0.06)' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {equip.map((e, i) => (
                        <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : '#fafbff', borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '7px 10px', fontSize: '9px', color: '#94a3b8', fontFamily: MONO }}>{i + 1}</td>
                          <td style={{ padding: '7px 10px', fontSize: '9.5px', color: T, fontWeight: 700 }}>{e.type}</td>
                          <td style={{ padding: '7px 10px', fontSize: '9px', fontFamily: MONO }}>{e.serial || ''}</td>
                          <td style={{ padding: '7px 10px', fontSize: '9px' }}>{e.calDate || ''}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
            {(swId || r.msbMaxDemand) && (
              <>
                <CBSHead title={'Switchboard Test Results' + (swId ? ' — ' + swId : '')} />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '4px' }}>
                  <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                    <div style={{ padding: '8px 12px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                      <span style={{ fontSize: '8px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em' }}>General</span>
                    </div>
                    <div style={{ padding: '6px 12px 10px' }}>
                      <CBRow label="Max Demand (A)" value={r.msbMaxDemand} mono />
                      <CBRow label="Main Switch (A)" value={r.msbMainSwitchCurrentRating} mono />
                      <CBRow label="Main Switch PSC (kA)" value={r.msbMainSwitchPscRating} mono />
                      <CBRow label="Conductor CCC (A)" value={r.msbConductorCcc} mono />
                      <CBRow label="Conductor Size (mm²)" value={r.msbConductorSize} mono />
                      <CBRow label="Circuit Length (m)" value={r.msbCircuitLength} mono />
                      <CBRow label="PSC at Main Switch (kA)" value={r.pscAtMainSwitch} mono />
                    </div>
                  </div>
                  <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                    <div style={{ padding: '8px 12px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                      <span style={{ fontSize: '8px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Test Results</span>
                    </div>
                    <div style={{ padding: '6px 12px 10px' }}>
                      <CBRow label="M.E.N. Compliant" value={r.msbMenCompliant} />
                      <CBRow label="Earth Cont. Main (Ω)" value={r.msbEarthContMain} mono />
                      <CBRow label="Earth Cont. EQ (Ω)" value={r.msbEarthContEq} mono />
                      <CBRow label="Polarity" value={r.msbPolarity} />
                      <CBRow label="IR A-E (MΩ)" value={r.msbInsResAE} mono />
                      <CBRow label="IR A-N (MΩ)" value={r.msbInsResAN} mono />
                      <CBRow label="Live Parts Screened" value={r.livePartsScreened} />
                      <CBRow label="Main Link / Neutral" value={r.mainLinkNeutralReconnected} />
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
          <CBFooter record={r} pageLabel="Equipment & Switchboard" />
        </PageWrap>
      )}

      {/* ── Consumer & Sub Mains ── */}
      {(r.mainsCircuits || []).some(x => x.cableId || x.circuitId || x.conductorSize) && (
        <PageWrap>
          <CBHeader record={r} />
          <div style={{ padding: '0 26px 20px 26px', flex: 1, display: 'flex', flexDirection: 'column' }}>
            <CBSHead title="Consumer and Sub Mains" />
            <CircuitTbl rows={r.mainsCircuits} />
          </div>
          <CBFooter record={r} pageLabel="Consumer & Sub Mains" />
        </PageWrap>
      )}

      {/* ── Final Sub Circuits ── */}
      {(r.subCircuits || []).some(x => x.cableId || x.circuitId || x.conductorSize) && (
        <PageWrap>
          <CBHeader record={r} />
          <div style={{ padding: '0 26px 20px 26px', flex: 1, display: 'flex', flexDirection: 'column' }}>
            <CBSHead title="Final Sub Circuits" />
            <CircuitTbl rows={r.subCircuits} />
          </div>
          <CBFooter record={r} pageLabel="Final Sub Circuits" />
        </PageWrap>
      )}

      {/* ── Declaration ── */}
      <PageWrap>
        <CBHeader record={r} />
        <div style={{ padding: '0 26px 20px 26px', flex: 1, display: 'flex', flexDirection: 'column' }}>
          <CBSHead title="Declaration and Certification" />
          <div style={{
            background: '#dbeafe',
            border: `1px solid ${T}`,
            borderLeft: `4px solid ${T}`,
            borderRadius: '6px',
            padding: '14px 16px',
            marginBottom: '18px',
          }}>
            <p style={{ fontSize: '10px', color: '#1c1917', lineHeight: 1.8 }}>
              I declare that the electrical installation described in this report has been tested in accordance with AS/NZS 3000:2018 and AS/NZS 3017, and that the results are as recorded above.
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '18px' }}>
            <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
              <div style={{ padding: '8px 12px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '8px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Registered Electrical Worker</span>
              </div>
              <div style={{ padding: '10px 12px' }}>
                <CBRow label="Name" value={r.workerName} />
                <CBRow label="Licence No." value={r.licenceNumber} mono />
                <CBRow label="Date" value={r.date} />
                {r.signatureData
                  ? <div style={{ marginTop: '10px' }}>
                      <img src={r.signatureData} alt="Sig" style={{ height: '50px', maxWidth: '100%', objectFit: 'contain' }} />
                      <div style={{ width: '100%', height: '1px', background: '#e2e8f0', marginTop: '6px' }} />
                    </div>
                  : <div style={{ marginTop: '12px' }}>
                      <div style={{ width: '140px', height: '48px', borderBottom: '2px solid #e2e8f0' }} />
                      <p style={{ fontSize: '7px', color: '#94a3b8', marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Authorised Signature</p>
                    </div>
                }
              </div>
            </div>
            {/* Spacer column */}
            <div />
          </div>
          {r.notes && (
            <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderLeft: '4px solid #f59e0b', borderRadius: '6px', padding: '10px 14px', marginBottom: '14px' }}>
              <p style={{ fontSize: '8px', fontWeight: 700, color: '#78716c', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px' }}>Notes / Defects</p>
              <p style={{ fontSize: '9.5px', color: '#1c1917', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{r.notes}</p>
            </div>
          )}
          <div style={{ marginTop: 'auto', paddingTop: '10px', borderTop: '1px solid #f1f5f9' }}>
            <p style={{ fontSize: '7px', color: '#94a3b8' }}>
              AS/NZS 3000:2018 · AS/NZS 3008.1.1 · AS/NZS 3017 — Generated {new Date().toLocaleDateString('en-AU')} · testsheet.com.au
            </p>
          </div>
        </div>
        <CBFooter record={r} pageLabel="Declaration" />
      </PageWrap>
    </div>
  );
}
