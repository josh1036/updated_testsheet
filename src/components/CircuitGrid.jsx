import { Copy, Plus, Trash2 } from 'lucide-react';

const PHASE_OPTIONS = [
  { value: 'L1',  label: 'L1',  color: '#dc2626', bg: '#fef2f2', border: '#fca5a5', rowTint: 'rgba(220,38,38,0.04)' },
  { value: 'L2',  label: 'L2',  color: '#f59e0b', bg: '#fffbeb', border: '#fcd34d', rowTint: 'rgba(245,158,11,0.05)' },
  { value: 'L3',  label: 'L3',  color: '#2563eb', bg: '#eff6ff', border: '#93c5fd', rowTint: 'rgba(37,99,235,0.04)' },
  { value: 'N',   label: 'N',   color: '#6b7280', bg: '#f9fafb', border: '#d1d5db', rowTint: 'rgba(107,114,128,0.04)' },
  { value: 'E',   label: 'E',   color: '#16a34a', bg: '#f0fdf4', border: '#86efac', rowTint: 'rgba(22,163,74,0.05)' },
  { value: 'PEN', label: 'PEN', color: '#15803d', bg: '#f0fdf4', border: '#4ade80', rowTint: 'rgba(21,128,61,0.05)' },
];

function PhaseCell({ value, onChange, readOnly }) {
  if (readOnly) {
    const opt = PHASE_OPTIONS.find(p => p.value === value);
    if (!opt) return <span style={{ display: 'block', textAlign: 'center', fontSize: '12px', color: '#94a3b8' }}>—</span>;
    return <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', borderRadius: '50%', background: opt.color, color: '#fff', fontWeight: 900, fontSize: '9px' }}>{opt.label}</span>;
  }
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2px', flexWrap: 'wrap', padding: '2px' }}>
      {PHASE_OPTIONS.map(p => (
        <button key={p.value} type="button" title={p.label} onClick={() => onChange(value === p.value ? '' : p.value)}
          style={{ width: '22px', height: '22px', fontSize: '7px', borderRadius: '50%', border: `2px solid ${value === p.value ? p.color : p.border}`, background: value === p.value ? p.color : p.bg, color: value === p.value ? '#fff' : p.color, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {p.label}
        </button>
      ))}
    </div>
  );
}

export const emptyRow = () => ({
  rowOrder: 0, cableId: '', circuitId: '', numPhases: '', maxDemand: '', ocpdType: '', ocpdCurrentRating: '', ocpdPscRating: '',
  conductorCcc: '', conductorSize: '', earthContMain: '', earthContEq: '', polarity: '',
  insResAE: '', insResAN: '', insResNE: '', insResPP: '', insResOk: '',
  zaRpheActual: '', zaRpheCompliant: '', rcdPushButton: '', rcdCurrentTrip: '',
  circuitLength: '', clearInterconnect: '', comments: '',
});

function updateRow(rows, index, field, value) { return rows.map((r, i) => (i === index ? { ...r, [field]: value } : r)); }

export default function CircuitGrid({ rows, onChange, minRows = 5, readOnly = false }) {
  const addRow = () => onChange([...rows, emptyRow()]);
  const duplicateRow = (index) => { const copy = { ...rows[index] }; const next = [...rows]; next.splice(index + 1, 0, copy); onChange(next); };
  const removeRow = (index) => { if (rows.length <= minRows) return; onChange(rows.filter((_, i) => i !== index)); };
  const set = (index, field, value) => onChange(updateRow(rows, index, field, value));

  const inp = (index, field, placeholder = '') => readOnly
    ? <span style={{ display: 'block', textAlign: 'center', fontSize: '12px' }}>{rows[index][field] || '—'}</span>
    : <input value={rows[index][field] || ''} onChange={e => set(index, field, e.target.value)} placeholder={placeholder} style={{ width: '100%', background: 'transparent', border: 'none', outline: 'none', textAlign: 'center', fontSize: '12px', padding: '2px 4px' }} />;

  const sel = (index, field, options) => readOnly
    ? <span style={{ display: 'block', textAlign: 'center', fontSize: '12px' }}>{options.find(o => o.value === rows[index][field])?.label || '—'}</span>
    : <select value={rows[index][field] || ''} onChange={e => set(index, field, e.target.value)} style={{ width: '100%', background: 'transparent', border: 'none', outline: 'none', textAlign: 'center', fontSize: '12px', padding: '2px', cursor: 'pointer', appearance: 'none' }}>{options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</select>;

  return (
    <div style={{ overflowX: 'auto', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
      <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse', minWidth: '1400px' }}>
        <thead>
          <tr style={{ background: '#0f2044', color: 'white', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            <th rowSpan={2} style={{ border: '1px solid #1e4080', padding: '6px 8px', textAlign: 'center', minWidth: '72px' }}>Cable No.</th>
            <th rowSpan={2} style={{ border: '1px solid #1e4080', padding: '6px 8px', textAlign: 'center' }}>Circuit ID</th>
            <th rowSpan={2} style={{ border: '1px solid #1e4080', padding: '6px 4px', textAlign: 'center' }}>Ph.</th>
            <th rowSpan={2} style={{ border: '1px solid #1e4080', padding: '6px 4px', textAlign: 'center' }}>Max Demand (A)</th>
            <th colSpan={3} style={{ border: '1px solid #1e4080', padding: '4px 8px', textAlign: 'center' }}>OCPD</th>
            <th colSpan={2} style={{ border: '1px solid #1e4080', padding: '4px 8px', textAlign: 'center' }}>Conductor</th>
            <th colSpan={2} style={{ border: '1px solid #1e4080', padding: '4px 8px', textAlign: 'center' }}>Earth Cont. (Ω)</th>
            <th rowSpan={2} style={{ border: '1px solid #1e4080', padding: '6px 4px', textAlign: 'center' }}>Polarity</th>
            <th colSpan={5} style={{ border: '1px solid #1e4080', padding: '4px 8px', textAlign: 'center' }}>Insulation Resistance (MΩ)</th>
            <th colSpan={2} style={{ border: '1px solid #1e4080', padding: '4px 8px', textAlign: 'center' }}>Zs / Rphe (Ω)</th>
            <th colSpan={2} style={{ border: '1px solid #1e4080', padding: '4px 8px', textAlign: 'center' }}>RCD Test</th>
            <th rowSpan={2} style={{ border: '1px solid #1e4080', padding: '6px 4px', textAlign: 'center' }}>Cct. Length (m)</th>
            <th rowSpan={2} style={{ border: '1px solid #1e4080', padding: '6px 4px', textAlign: 'center' }}>Clear Inter.</th>
            <th rowSpan={2} style={{ border: '1px solid #1e4080', padding: '6px 8px', textAlign: 'center' }}>Comments</th>
            {!readOnly && <th rowSpan={2} style={{ border: '1px solid #1e4080', padding: '6px 4px', width: '48px' }}></th>}
          </tr>
          <tr style={{ background: '#162d4a', color: 'white', fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {['Type*','Rating (A)','PSC* (kA)','CCC* (A)','Size (mm²)','Main Earth','EQ Bonding*','A-E*','A-N*','N-E','Ph-Ph*','OK?','Actual','Compliant','Push Btn','Trip (ms)'].map(h => <th key={h} style={{ border: '1px solid #1e4080', padding: '4px', textAlign: 'center' }}>{h}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => {
            const phaseOpt = PHASE_OPTIONS.find(p => p.value === row.numPhases);
            const bg = phaseOpt ? phaseOpt.rowTint : (i % 2 === 0 ? '#fff' : 'rgba(248,250,252,0.6)');
            return (
              <tr key={i} style={{ background: bg }}>
                <td style={{ border: '1px solid #e2e8f0', padding: '2px 4px' }}>{inp(i, 'cableId')}</td>
                <td style={{ border: '1px solid #e2e8f0', padding: '2px 4px' }}>{inp(i, 'circuitId')}</td>
                <td style={{ border: '1px solid #e2e8f0', padding: '2px', minWidth: '155px' }}><PhaseCell value={row.numPhases} onChange={v => set(i, 'numPhases', v)} readOnly={readOnly} /></td>
                <td style={{ border: '1px solid #e2e8f0', padding: '2px 4px' }}>{inp(i, 'maxDemand')}</td>
                <td style={{ border: '1px solid #e2e8f0', padding: '2px 4px' }}>
                  {readOnly ? <span style={{ display: 'block', textAlign: 'center', fontSize: '12px' }}>{row.ocpdType || '—'}</span>
                    : <select value={row.ocpdType || ''} onChange={e => set(i, 'ocpdType', e.target.value)} style={{ width: '100%', background: 'transparent', border: 'none', outline: 'none', textAlign: 'center', fontSize: '12px', cursor: 'pointer', appearance: 'none' }}><option value=""></option><option value="c/b B">c/b B</option><option value="c/b C">c/b C</option><option value="c/b D">c/b D</option><option value="rcd">rcd</option><option value="hrc">hrc</option><option value="rf">rf</option><option value="Isol">Isol</option></select>}
                </td>
                <td style={{ border: '1px solid #e2e8f0', padding: '2px 4px' }}>{inp(i, 'ocpdCurrentRating')}</td>
                <td style={{ border: '1px solid #e2e8f0', padding: '2px 4px' }}>{inp(i, 'ocpdPscRating')}</td>
                <td style={{ border: '1px solid #e2e8f0', padding: '2px 4px' }}>{inp(i, 'conductorCcc')}</td>
                <td style={{ border: '1px solid #e2e8f0', padding: '2px 4px' }}>{inp(i, 'conductorSize')}</td>
                <td style={{ border: '1px solid #e2e8f0', padding: '2px 4px' }}>{inp(i, 'earthContMain')}</td>
                <td style={{ border: '1px solid #e2e8f0', padding: '2px 4px' }}>{inp(i, 'earthContEq')}</td>
                <td style={{ border: '1px solid #e2e8f0', padding: '2px 4px' }}>{sel(i, 'polarity', [{ value: '', label: '' }, { value: 'pass', label: '✓' }, { value: 'fail', label: '✗' }])}</td>
                <td style={{ border: '1px solid #e2e8f0', padding: '2px 4px' }}>{inp(i, 'insResAE')}</td>
                <td style={{ border: '1px solid #e2e8f0', padding: '2px 4px' }}>{inp(i, 'insResAN')}</td>
                <td style={{ border: '1px solid #e2e8f0', padding: '2px 4px' }}>{inp(i, 'insResNE')}</td>
                <td style={{ border: '1px solid #e2e8f0', padding: '2px 4px' }}>{inp(i, 'insResPP')}</td>
                <td style={{ border: '1px solid #e2e8f0', padding: '2px 4px' }}>{sel(i, 'insResOk', [{ value: '', label: '' }, { value: 'yes', label: '✓' }, { value: 'no', label: '✗' }])}</td>
                <td style={{ border: '1px solid #e2e8f0', padding: '2px 4px' }}>{inp(i, 'zaRpheActual')}</td>
                <td style={{ border: '1px solid #e2e8f0', padding: '2px 4px' }}>{inp(i, 'zaRpheCompliant')}</td>
                <td style={{ border: '1px solid #e2e8f0', padding: '2px 4px' }}>{sel(i, 'rcdPushButton', [{ value: '', label: '' }, { value: 'pass', label: '✓' }, { value: 'fail', label: '✗' }, { value: 'na', label: 'N/A' }])}</td>
                <td style={{ border: '1px solid #e2e8f0', padding: '2px 4px' }}>
                  {readOnly ? <span style={{ display: 'block', textAlign: 'center', fontSize: '12px' }}>{row.rcdCurrentTrip === 'na' ? 'N/A' : row.rcdCurrentTrip || '—'}</span>
                    : <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                        {row.rcdCurrentTrip !== 'na' && <input value={row.rcdCurrentTrip || ''} onChange={e => set(i, 'rcdCurrentTrip', e.target.value)} placeholder="ms" style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', textAlign: 'center', fontSize: '12px', minWidth: 0 }} />}
                        {row.rcdCurrentTrip === 'na' && <button onClick={() => set(i, 'rcdCurrentTrip', '')} style={{ flex: 1, textAlign: 'center', fontSize: '12px', background: '#f1f5f9', border: 'none', borderRadius: '4px', padding: '2px 4px', cursor: 'pointer' }}>N/A</button>}
                        <button onClick={() => set(i, 'rcdCurrentTrip', row.rcdCurrentTrip === 'na' ? '' : 'na')} style={{ fontSize: '9px', fontWeight: 700, padding: '2px', borderRadius: '4px', border: 'none', cursor: 'pointer', background: row.rcdCurrentTrip === 'na' ? '#94a3b8' : 'transparent', color: row.rcdCurrentTrip === 'na' ? '#fff' : '#94a3b8' }}>N/A</button>
                      </div>}
                </td>
                <td style={{ border: '1px solid #e2e8f0', padding: '2px 4px' }}>{inp(i, 'circuitLength')}</td>
                <td style={{ border: '1px solid #e2e8f0', padding: '2px 4px' }}>{sel(i, 'clearInterconnect', [{ value: '', label: '' }, { value: 'yes', label: '✓' }, { value: 'no', label: '✗' }])}</td>
                <td style={{ border: '1px solid #e2e8f0', padding: '2px 4px' }}>{inp(i, 'comments')}</td>
                {!readOnly && (
                  <td style={{ border: '1px solid #e2e8f0', padding: '2px 4px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                      <button onClick={() => duplicateRow(i)} title="Duplicate" style={{ color: '#60a5fa', background: 'none', border: 'none', cursor: 'pointer', padding: '2px' }}><Copy style={{ width: '12px', height: '12px' }} /></button>
                      <button onClick={() => removeRow(i)} disabled={rows.length <= minRows} title="Delete" style={{ color: rows.length <= minRows ? '#e2e8f0' : '#f87171', background: 'none', border: 'none', cursor: 'pointer', padding: '2px' }}><Trash2 style={{ width: '12px', height: '12px' }} /></button>
                    </div>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
      {!readOnly && (
        <div style={{ padding: '8px', background: '#f8fafc', borderTop: '1px solid #e2e8f0' }}>
          <button onClick={addRow} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', border: '1px solid #e2e8f0', borderRadius: '8px', background: 'white', fontSize: '12px', color: '#475569', cursor: 'pointer' }}>
            <Plus style={{ width: '12px', height: '12px' }} /> Add Row
          </button>
        </div>
      )}
    </div>
  );
}