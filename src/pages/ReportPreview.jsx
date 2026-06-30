import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getRecord } from '../lib/records';
import { ArrowLeft, Printer, Edit, Loader2 } from 'lucide-react';

export default function ReportPreview() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getRecord(id).then((data) => { setRecord(data); setLoading(false); });
  }, [id]);

  if (loading) return (
    <div className="fixed inset-0 flex items-center justify-center bg-white">
      <Loader2 className="w-8 h-8 animate-spin text-[#0f2044]" />
    </div>
  );

  if (!record) return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4">
      <p className="text-slate-500">Record not found.</p>
      <button onClick={() => navigate('/dashboard')} className="bg-[#0f2044] text-white px-4 py-2 rounded-xl text-sm">Back to Dashboard</button>
    </div>
  );

  const switchboardId = record.msbName === 'Other' ? (record.msbNameOther || 'Other') : record.msbName;

  return (
    <div className="min-h-screen bg-[#ddd9d4]">
      {/* Toolbar */}
      <div className="bg-white border-b border-stone-200 sticky top-0 z-40 no-print">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/records/' + id + '/edit')} className="flex items-center gap-1.5 text-stone-500 hover:text-stone-800 text-sm transition-colors">
              <ArrowLeft className="w-4 h-4" /> Back to Form
            </button>
            <span className="text-stone-300">|</span>
            <span className="text-sm font-semibold text-stone-700 truncate">{record.addressLocation || 'Report Preview'}</span>
            <span className={"text-xs px-2 py-0.5 rounded font-semibold shrink-0 border " + (record.status === 'Complete' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200')}>{record.status}</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => navigate('/records/' + id + '/edit')} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 text-sm hover:border-[#0f2044] transition-colors">
              <Edit className="w-4 h-4" /> Edit
            </button>
            <button onClick={() => window.print()} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0f2044] text-white text-sm hover:bg-[#162d4a] transition-colors">
              <Printer className="w-4 h-4" /> Save as PDF
            </button>
          </div>
        </div>
      </div>

      {/* A4 Report */}
      <div className="py-8 px-4">
        <div className="bg-white shadow-sm mx-auto" style={{ width: 'min(210mm, 100%)', minHeight: '297mm', padding: '16mm 18mm 20mm 18mm', boxSizing: 'border-box' }}>
          {/* Header */}
          <div style={{ borderBottom: '2px solid #0f2044', paddingBottom: '12px', marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {record.companyLogoUrl
                  ? <img src={record.companyLogoUrl} alt="Logo" style={{ height: '28px', maxWidth: '110px', objectFit: 'contain' }} />
                  : <span style={{ fontSize: '11px', fontWeight: 800, color: '#0f2044' }}>{record.companyName || 'Electrical Report'}</span>
                }
                {record.companyLogoUrl && record.companyName && (
                  <span style={{ fontSize: '10px', fontWeight: 700, color: '#0f2044', borderLeft: '1px solid #e2e8f0', paddingLeft: '10px' }}>{record.companyName}</span>
                )}
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: '8px', fontWeight: 700, color: '#0f2044', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Schedule of Test Results</p>
                <p style={{ fontSize: '7.5px', color: '#94a3b8', marginTop: '2px' }}>AS/NZS 3000:2018 · Clause 8.3</p>
                {record.addressLocation && <p style={{ fontSize: '7.5px', color: '#94a3b8', marginTop: '1px' }}>{record.addressLocation}</p>}
              </div>
            </div>
          </div>

          {/* Project Details */}
          <div style={{ marginBottom: '22px' }}>
            <h2 style={{ fontSize: '9px', fontWeight: 900, color: '#0f2044', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '10px', paddingBottom: '4px', borderBottom: '1px solid #e2e8f0' }}>Project Information</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 24px' }}>
              {[
                ['Site Address', record.addressLocation], ['Date', record.date],
                ['Report / Job No.', record.switchboardNumber], ['Status', record.status],
                ['Inspector', record.workerName], ['Licence No.', record.licenceNumber],
                ['Contractor', record.contractorName], ['Contractor No.', record.contractorNumber],
              ].filter(([,v]) => v).map(([label, value]) => (
                <div key={label} style={{ display: 'flex', gap: '8px', padding: '5px 0', borderBottom: '1px solid #f1f5f9' }}>
                  <span style={{ fontSize: '7.5px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', width: '110px', flexShrink: 0 }}>{label}</span>
                  <span style={{ fontSize: '10px', color: '#1e293b' }}>{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Switchboard */}
          {(switchboardId || record.msbMaxDemand || record.msbMainSwitchCurrentRating) && (
            <div style={{ marginBottom: '22px' }}>
              <h2 style={{ fontSize: '9px', fontWeight: 900, color: '#0f2044', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '10px', paddingBottom: '4px', borderBottom: '1px solid #e2e8f0' }}>Switchboard {switchboardId ? '— ' + switchboardId : ''}</h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 24px' }}>
                {[
                  ['M.E.N. Compliant', record.msbMenCompliant], ['Max Demand (A)', record.msbMaxDemand],
                  ['Main Switch Rating (A)', record.msbMainSwitchCurrentRating], ['Main Switch PSC (kA)', record.msbMainSwitchPscRating],
                  ['Conductor CCC (A)', record.msbConductorCcc], ['Conductor Size (mm²)', record.msbConductorSize],
                  ['Earth Cont. Main (Ω)', record.msbEarthContMain], ['Earth Cont. EQ (Ω)', record.msbEarthContEq],
                  ['Polarity', record.msbPolarity], ['Ins. Res. A-E (MΩ)', record.msbInsResAE],
                  ['Ins. Res. A-N (MΩ)', record.msbInsResAN], ['Ins. Res. N-E (MΩ)', record.msbInsResNE],
                  ['PSC at Main Switch (kA)', record.pscAtMainSwitch], ['Live Parts Screened', record.livePartsScreened],
                  ['Main Link / Neutral', record.mainLinkNeutralReconnected], ['Circuit Length (m)', record.msbCircuitLength],
                ].filter(([,v]) => v).map(([label, value]) => (
                  <div key={label} style={{ display: 'flex', gap: '8px', padding: '5px 0', borderBottom: '1px solid #f1f5f9' }}>
                    <span style={{ fontSize: '7.5px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', width: '110px', flexShrink: 0 }}>{label}</span>
                    <span style={{ fontSize: '10px', color: '#1e293b' }}>{value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Circuit Tables */}
          {(record.mainsCircuits || []).some(r => r.circuitId || r.conductorSize) && (
            <div style={{ marginBottom: '22px' }}>
              <h2 style={{ fontSize: '9px', fontWeight: 900, color: '#0f2044', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '10px', paddingBottom: '4px', borderBottom: '1px solid #e2e8f0' }}>Consumer and Sub Mains</h2>
              <CircuitTableSimple rows={record.mainsCircuits.filter(r => r.circuitId || r.conductorSize)} />
            </div>
          )}
          {(record.subCircuits || []).some(r => r.circuitId || r.conductorSize) && (
            <div style={{ marginBottom: '22px' }}>
              <h2 style={{ fontSize: '9px', fontWeight: 900, color: '#0f2044', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '10px', paddingBottom: '4px', borderBottom: '1px solid #e2e8f0' }}>Final Sub Circuits</h2>
              <CircuitTableSimple rows={record.subCircuits.filter(r => r.circuitId || r.conductorSize)} />
            </div>
          )}

          {/* Notes */}
          {record.notes && (
            <div style={{ marginBottom: '22px' }}>
              <h2 style={{ fontSize: '9px', fontWeight: 900, color: '#0f2044', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '10px', paddingBottom: '4px', borderBottom: '1px solid #e2e8f0' }}>Notes and Observations</h2>
              <p style={{ fontSize: '10px', color: '#334155', lineHeight: 1.7, whiteSpace: 'pre-wrap', padding: '10px 12px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '4px' }}>{record.notes}</p>
            </div>
          )}

          {/* Declaration */}
          <div style={{ marginBottom: '22px' }}>
            <h2 style={{ fontSize: '9px', fontWeight: 900, color: '#0f2044', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '10px', paddingBottom: '4px', borderBottom: '1px solid #e2e8f0' }}>Declaration</h2>
            <p style={{ fontSize: '9px', color: '#64748b', lineHeight: 1.7, marginBottom: '16px' }}>
              I declare that the electrical installation described in this report has been tested in accordance with AS/NZS 3000:2018 and AS/NZS 3017, and that the results are as recorded above.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                {[['Name', record.workerName], ['Licence No.', record.licenceNumber], ['Date', record.date]].filter(([,v]) => v).map(([label, value]) => (
                  <div key={label} style={{ display: 'flex', gap: '8px', padding: '5px 0', borderBottom: '1px solid #f1f5f9' }}>
                    <span style={{ fontSize: '7.5px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', width: '80px', flexShrink: 0 }}>{label}</span>
                    <span style={{ fontSize: '10px', color: '#1e293b' }}>{value}</span>
                  </div>
                ))}
              </div>
              <div>
                {record.signatureData ? (
                  <img src={record.signatureData} alt="Signature" style={{ height: '60px', maxWidth: '100%', objectFit: 'contain', border: '1px solid #e2e8f0', borderRadius: '4px', padding: '4px' }} />
                ) : (
                  <div style={{ borderBottom: '2px solid #e2e8f0', width: '160px', height: '52px', marginBottom: '4px' }} />
                )}
                <p style={{ fontSize: '7px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: '4px' }}>Authorised Signature</p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '8px', marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '7px', color: '#94a3b8' }}>{record.companyName || ''}</span>
            <span style={{ fontSize: '7px', color: '#94a3b8' }}>Generated {new Date().toLocaleDateString('en-AU')} · AS/NZS 3000:2018</span>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-4 flex justify-between items-center no-print">
        <button onClick={() => navigate('/records/' + id + '/edit')} className="text-stone-400 hover:text-stone-700 text-sm flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" /> Back to Inspection Form
        </button>
        <p className="text-xs text-stone-400">Click "Save as PDF" then select "Save as PDF" as the printer destination.</p>
      </div>
    </div>
  );
}

function CircuitTableSimple({ rows }) {
  const cols = [
    { label: 'Circuit ID', key: 'circuitId' }, { label: 'Ph', key: 'numPhases' },
    { label: 'Max Dem.', key: 'maxDemand' }, { label: 'OCPD Type', key: 'ocpdType' },
    { label: 'OCPD (A)', key: 'ocpdCurrentRating' }, { label: 'CCC (A)', key: 'conductorCcc' },
    { label: 'Size (mm²)', key: 'conductorSize' }, { label: 'Earth Main', key: 'earthContMain' },
    { label: 'Polarity', key: 'polarity' }, { label: 'IR A-E', key: 'insResAE' },
    { label: 'IR A-N', key: 'insResAN' }, { label: 'Za/Rphe', key: 'zaRpheActual' },
    { label: 'RCD', key: 'rcdPushButton' }, { label: 'Length (m)', key: 'circuitLength' },
  ].filter(col => rows.some(r => r[col.key]));

  return (
    <div style={{ border: '1px solid #e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '8px' }}>
        <thead>
          <tr style={{ background: '#0f2044' }}>
            {cols.map(c => <th key={c.key} style={{ padding: '6px 8px', textAlign: 'left', color: 'white', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', borderRight: '1px solid #1e4080', whiteSpace: 'nowrap' }}>{c.label}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} style={{ background: i % 2 === 0 ? 'white' : '#f8fafc' }}>
              {cols.map(c => <td key={c.key} style={{ padding: '5px 8px', borderBottom: '1px solid #f1f5f9', borderRight: '1px solid #f1f5f9', color: '#334155', fontWeight: c.key === 'circuitId' ? 700 : 400 }}>{row[c.key] || ''}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}