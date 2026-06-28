import { Copy, Plus, Trash2 } from 'lucide-react';
export const emptyRow = () => ({
  circuitId: '', numPhases: '', maxDemand: '', ocpdType: '', ocpdCurrentRating: '', ocpdPscRating: '',
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
  const inp = (index, field, placeholder = '') => readOnly ? (
    <span className="block text-center text-xs">{rows[index][field] || '—'}</span>
  ) : (
    <input value={rows[index][field] || ''} onChange={(e) => set(index, field, e.target.value)} placeholder={placeholder}
      className="w-full bg-transparent border-none outline-none text-center text-xs py-0.5 px-1 focus:bg-blue-50/60 rounded" />
  );
  const sel = (index, field, options) => readOnly ? (
    <span className="block text-center text-xs">{options.find((o) => o.value === rows[index][field])?.label || '—'}</span>
  ) : (
    <select value={rows[index][field] || ''} onChange={(e) => set(index, field, e.target.value)}
      className="w-full bg-transparent border-none outline-none text-center text-xs py-0.5 px-0.5 focus:bg-blue-50/60 rounded appearance-none cursor-pointer">
      {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-sm">
      <table className="w-full text-xs border-collapse" style={{ minWidth: '1400px' }}>
        <thead>
          <tr className="bg-[#0f2044] text-white text-[10px] uppercase tracking-wider">
            <th rowSpan={2} className="border border-[#1e4080] px-2 py-1.5 text-center">Circuit ID</th>
            <th rowSpan={2} className="border border-[#1e4080] px-1 py-1.5 text-center">Ph.</th>
            <th rowSpan={2} className="border border-[#1e4080] px-1 py-1.5 text-center">Max Demand (A)</th>
            <th colSpan={3} className="border border-[#1e4080] px-2 py-1 text-center">OCPD</th>
            <th colSpan={2} className="border border-[#1e4080] px-2 py-1 text-center">Conductor</th>
            <th colSpan={2} className="border border-[#1e4080] px-2 py-1 text-center">Earth Cont. (Ω)</th>
            <th rowSpan={2} className="border border-[#1e4080] px-1 py-1.5 text-center">Polarity</th>
            <th colSpan={5} className="border border-[#1e4080] px-2 py-1 text-center">Insulation Resistance (MΩ)</th>
            <th colSpan={2} className="border border-[#1e4080] px-2 py-1 text-center">Za / Rphe (Ω)</th>
            <th colSpan={2} className="border border-[#1e4080] px-2 py-1 text-center">RCD Test</th>
            <th rowSpan={2} className="border border-[#1e4080] px-1 py-1.5 text-center">Cct. Length (m)</th>
            <th rowSpan={2} className="border border-[#1e4080] px-1 py-1.5 text-center">Clear Inter.</th>
            <th rowSpan={2} className="border border-[#1e4080] px-2 py-1.5 text-center">Comments</th>
            {!readOnly && <th rowSpan={2} className="border border-[#1e4080] px-1 py-1.5 w-12"></th>}
          </tr>
          <tr className="bg-[#162d4a] text-white text-[9px] uppercase tracking-wider">
            <th className="border border-[#1e4080] px-1 py-1 text-center">Type*</th>
            <th className="border border-[#1e4080] px-1 py-1 text-center">Rating (A)</th>
            <th className="border border-[#1e4080] px-1 py-1 text-center">PSC* (kA)</th>
            <th className="border border-[#1e4080] px-1 py-1 text-center">CCC* (A)</th>
            <th className="border border-[#1e4080] px-1 py-1 text-center">Size (mm²)</th>
            <th className="border border-[#1e4080] px-1 py-1 text-center">Main Earth</th>
            <th className="border border-[#1e4080] px-1 py-1 text-center">EQ Bonding*</th>
            <th className="border border-[#1e4080] px-1 py-1 text-center">A-E*</th>
            <th className="border border-[#1e4080] px-1 py-1 text-center">A-N*</th>
            <th className="border border-[#1e4080] px-1 py-1 text-center">N-E</th>
            <th className="border border-[#1e4080] px-1 py-1 text-center">Ph-Ph*</th>
            <th className="border border-[#1e4080] px-1 py-1 text-center">OK?</th>
            <th className="border border-[#1e4080] px-1 py-1 text-center">Actual</th>
            <th className="border border-[#1e4080] px-1 py-1 text-center">Compliant</th>
            <th className="border border-[#1e4080] px-1 py-1 text-center">Push Btn</th>
            <th className="border border-[#1e4080] px-1 py-1 text-center">Trip (ms)</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'}>
              <td className="border border-slate-200 px-1 py-0.5">{inp(i, 'circuitId')}</td>
              <td className="border border-slate-200 px-1 py-0.5">{inp(i, 'numPhases', '1')}</td>
              <td className="border border-slate-200 px-1 py-0.5">{inp(i, 'maxDemand')}</td>
              <td className="border border-slate-200 px-1 py-0.5">
                {readOnly ? <span className="block text-center text-xs">{row.ocpdType || '—'}</span> : (
                  <select value={row.ocpdType || ''} onChange={(e) => set(i, 'ocpdType', e.target.value)}
                    className="w-full bg-transparent border-none outline-none text-center text-xs py-0.5 focus:bg-blue-50/60 rounded appearance-none cursor-pointer">
                    <option value=""></option>
                    <option value="c/b B">c/b B</option><option value="c/b C">c/b C</option><option value="c/b D">c/b D</option>
                    <option value="rcd">rcd</option><option value="hrc">hrc</option><option value="rf">rf</option><option value="Isol">Isol</option>
                  </select>
                )}
              </td>
              <td className="border border-slate-200 px-1 py-0.5">{inp(i, 'ocpdCurrentRating')}</td>
              <td className="border border-slate-200 px-1 py-0.5">{inp(i, 'ocpdPscRating')}</td>
              <td className="border border-slate-200 px-1 py-0.5">{inp(i, 'conductorCcc')}</td>
              <td className="border border-slate-200 px-1 py-0.5">{inp(i, 'conductorSize')}</td>
              <td className="border border-slate-200 px-1 py-0.5">{inp(i, 'earthContMain')}</td>
              <td className="border border-slate-200 px-1 py-0.5">{inp(i, 'earthContEq')}</td>
              <td className="border border-slate-200 px-1 py-0.5">{sel(i, 'polarity', [{ value: '', label: '' }, { value: 'pass', label: '✓' }, { value: 'fail', label: '✗' }])}</td>
              <td className="border border-slate-200 px-1 py-0.5">{inp(i, 'insResAE')}</td>
              <td className="border border-slate-200 px-1 py-0.5">{inp(i, 'insResAN')}</td>
              <td className="border border-slate-200 px-1 py-0.5">{inp(i, 'insResNE')}</td>
              <td className="border border-slate-200 px-1 py-0.5">{inp(i, 'insResPP')}</td>
              <td className="border border-slate-200 px-1 py-0.5">{sel(i, 'insResOk', [{ value: '', label: '' }, { value: 'yes', label: '✓' }, { value: 'no', label: '✗' }])}</td>
              <td className="border border-slate-200 px-1 py-0.5">{inp(i, 'zaRpheActual')}</td>
              <td className="border border-slate-200 px-1 py-0.5">{inp(i, 'zaRpheCompliant')}</td>
              <td className="border border-slate-200 px-1 py-0.5">{sel(i, 'rcdPushButton', [{ value: '', label: '' }, { value: 'pass', label: '✓' }, { value: 'fail', label: '✗' }, { value: 'na', label: 'N/A' }])}</td>
              <td className="border border-slate-200 px-1 py-0.5">
                {readOnly ? <span className="block text-center text-xs">{row.rcdCurrentTrip === 'na' ? 'N/A' : row.rcdCurrentTrip || '—'}</span> : (
                  <div className="flex items-center gap-0.5">
                    {row.rcdCurrentTrip === 'na' ? (
                      <button onClick={() => set(i, 'rcdCurrentTrip', '')} className="w-full text-center text-xs py-0.5 px-1 bg-slate-100 rounded text-slate-500 hover:bg-slate-200">N/A</button>
                    ) : (
                      <input value={row.rcdCurrentTrip || ''} onChange={(e) => set(i, 'rcdCurrentTrip', e.target.value)} placeholder="ms"
                        className="w-full bg-transparent border-none outline-none text-center text-xs py-0.5 px-1 focus:bg-blue-50/60 rounded min-w-0" />
                    )}
                    <button onClick={() => set(i, 'rcdCurrentTrip', row.rcdCurrentTrip === 'na' ? '' : 'na')}
                      className={`shrink-0 text-[9px] font-bold px-0.5 py-0.5 rounded transition-colors ${row.rcdCurrentTrip === 'na' ? 'bg-slate-400 text-white' : 'text-slate-300 hover:text-slate-500 hover:bg-slate-100'}`}>N/A</button>
                  </div>
                )}
              </td>
              <td className="border border-slate-200 px-1 py-0.5">{inp(i, 'circuitLength')}</td>
              <td className="border border-slate-200 px-1 py-0.5">{sel(i, 'clearInterconnect', [{ value: '', label: '' }, { value: 'yes', label: '✓' }, { value: 'no', label: '✗' }])}</td>
              <td className="border border-slate-200 px-1 py-0.5">{inp(i, 'comments')}</td>
              {!readOnly && (
                <td className="border border-slate-200 px-1 py-0.5">
                  <div className="flex items-center gap-0.5">
                    <button onClick={() => duplicateRow(i)} title="Duplicate" className="text-blue-400 hover:text-blue-600 p-0.5 rounded hover:bg-blue-50"><Copy className="w-3 h-3" /></button>
                    <button onClick={() => removeRow(i)} disabled={rows.length <= minRows} title="Delete" className="text-slate-300 hover:text-red-500 disabled:opacity-20 p-0.5 rounded hover:bg-red-50"><Trash2 className="w-3 h-3" /></button>
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
      {!readOnly && (
        <div className="p-2 bg-slate-50 border-t border-slate-200">
          <button onClick={addRow} className="flex items-center gap-1.5 text-xs px-3 py-1.5 border border-slate-200 rounded-lg hover:border-[#0f2044] hover:text-[#0f2044] transition-colors">
            <Plus className="w-3 h-3" /> Add Row
          </button>
        </div>
      )}
    </div>
  );
}