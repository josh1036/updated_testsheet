import { useState } from 'react';
import { Plus, Trash2, Copy, ChevronDown, ChevronUp } from 'lucide-react';

const EMPTY_ROW = () => ({
  cbNumber: '', service: '', breakerSize: '', breakerModel: '',
  In: '', Ir: '', Io: '', tr: '', Isd: '', tsd: '', Ii: '', mA: '', tripTime: '', comments: '',
});

const COLS = [
  { key: 'cbNumber',    label: 'CB No.',       width: '60px' },
  { key: 'service',     label: 'Service',       width: '120px' },
  { key: 'breakerSize', label: 'Breaker Size',  width: '90px' },
  { key: 'breakerModel',label: 'Breaker Model', width: '100px' },
  { key: 'In',          label: 'I(n)',           width: '60px' },
  { key: 'Ir',          label: 'I(r)',           width: '60px' },
  { key: 'Io',          label: 'I(o)',           width: '60px' },
  { key: 'tr',          label: 't(r)',           width: '60px' },
  { key: 'Isd',         label: 'I(sd)',          width: '65px' },
  { key: 'tsd',         label: 't(sd)',          width: '65px' },
  { key: 'Ii',          label: 'I(i)',           width: '60px' },
  { key: 'mA',          label: 'mA',            width: '60px' },
  { key: 'tripTime',    label: 'TRIP TIME',     width: '80px' },
  { key: 'comments',    label: 'Comments',      width: '160px' },
];

export default function MccbSettings({ rows, onChange }) {
  const [open, setOpen] = useState(false);
  const addRow = () => onChange([...rows, EMPTY_ROW()]);
  const removeRow = (i) => onChange(rows.filter((_, idx) => idx !== i));
  const duplicateRow = (i) => { const next = [...rows]; next.splice(i + 1, 0, { ...rows[i] }); onChange(next); };
  const setField = (i, key, value) => onChange(rows.map((r, idx) => (idx === i ? { ...r, [key]: value } : r)));
  const filledCount = rows.filter(r => r.service || r.breakerModel || r.In || r.Ir).length;
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <button className="w-full flex items-center justify-between px-4 py-2.5 bg-[#1e4080] text-white hover:bg-[#162d4a] transition-colors" onClick={() => setOpen(o => !o)} type="button">
        <div className="flex items-center gap-3">
          <span className="font-bold text-sm uppercase tracking-wider">MCCB / Breaker Settings</span>
          {filledCount > 0 && <span className="px-2 py-0.5 rounded-full bg-white/20 text-white text-xs font-semibold">{filledCount} breaker{filledCount !== 1 ? 's' : ''}</span>}
        </div>
        {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>
      {open && (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse" style={{ minWidth: COLS.reduce((s, c) => s + parseInt(c.width), 0) + 60 + 'px' }}>
              <thead>
                <tr className="bg-[#0f2044] text-white text-[10px] tracking-wider">
                  {COLS.map(c => <th key={c.key} className="border border-[#1e4080] px-2 py-2 text-center font-bold" style={{ minWidth: c.width }}>{c.label}</th>)}
                  <th className="border border-[#1e4080] px-1 py-2 w-12"></th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 && <tr><td colSpan={COLS.length + 1} className="text-center py-6 text-slate-400 text-xs">No breaker settings recorded yet — click "Add Breaker" below.</td></tr>}
                {rows.map((row, i) => (
                  <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'}>
                    {COLS.map(c => (
                      <td key={c.key} className="border border-slate-200 px-1 py-0.5">
                        <input value={row[c.key] || ''} onChange={e => setField(i, c.key, e.target.value)} className="w-full bg-transparent border-none outline-none text-center text-xs py-0.5 px-1 focus:bg-blue-50/60 rounded" style={{ minWidth: c.width }} />
                      </td>
                    ))}
                    <td className="border border-slate-200 px-1 py-0.5">
                      <div className="flex items-center gap-0.5 justify-center">
                        <button onClick={() => duplicateRow(i)} title="Duplicate" className="text-blue-400 hover:text-blue-600 p-0.5 rounded hover:bg-blue-50"><Copy className="w-3 h-3" /></button>
                        <button onClick={() => removeRow(i)} title="Delete" className="text-slate-300 hover:text-red-500 p-0.5 rounded hover:bg-red-50"><Trash2 className="w-3 h-3" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="p-3 bg-slate-50 border-t border-slate-200">
            <button onClick={addRow} className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 rounded-lg text-xs text-slate-700 hover:bg-slate-100 transition-colors">
              <Plus className="w-3 h-3" /> Add Breaker
            </button>
          </div>
        </>
      )}
    </div>
  );
}