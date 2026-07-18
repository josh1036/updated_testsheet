import { useState, useEffect } from 'react';
import { downloadBlob, sharePdfBlob } from '../lib/pdfUtils';
export default function PdfActionModal({ open, onClose, pdfBlob, generating, progress = 0, error, filename }) {
  const [previewUrl, setPreviewUrl] = useState(null);
  const [shareResult, setShareResult] = useState(null);
  const [sharing, setSharing] = useState(false);
  useEffect(() => {
    if (pdfBlob) { const url = URL.createObjectURL(pdfBlob); setPreviewUrl(url); return () => URL.revokeObjectURL(url); }
    else setPreviewUrl(null);
  }, [pdfBlob]);
  useEffect(() => { if (!open) setShareResult(null); }, [open]);
  if (!open) return null;
  const handleShare = async () => {
    if (!pdfBlob) return; setSharing(true); setShareResult(null);
    const r = await sharePdfBlob(pdfBlob, filename); setSharing(false);
    if (r === 'downloaded') setShareResult('PDF saved — attach it manually to share.');
    else if (r === 'shared') setShareResult('Shared successfully!');
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.55)' }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h2 className="font-bold text-[#0f2044] text-base">PDF Report</h2>
          {!generating && <button onClick={onClose} className="text-slate-400 hover:text-slate-700 text-xl">×</button>}
        </div>
        <div className="px-5 py-5">
          {generating && (
            <div className="flex flex-col items-center gap-4 py-6">
              <div className="w-12 h-12 border-4 border-slate-200 border-t-[#0f2044] rounded-full animate-spin" />
              <p className="font-semibold text-slate-800">Generating PDF… {Math.round(progress * 100)}%</p>
              <div className="w-full bg-slate-100 rounded-full h-2"><div className="bg-[#0f2044] h-2 rounded-full transition-all" style={{ width: Math.round(progress * 100) + '%' }} /></div>
            </div>
          )}
          {!generating && error && (
            <div className="flex flex-col items-center gap-3 py-4 text-center">
              <p className="text-2xl">⚠️</p><p className="font-semibold text-slate-800">PDF generation failed</p>
              <p className="text-sm text-slate-500 bg-slate-50 rounded-lg p-3 font-mono text-left w-full">{error}</p>
              <button onClick={onClose} className="mt-2 px-4 py-2 border border-slate-200 rounded-xl text-sm hover:bg-slate-50">Close</button>
            </div>
          )}
          {!generating && !error && pdfBlob && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
                <span>✓</span><div><p className="font-semibold text-sm">PDF ready</p><p className="text-xs text-emerald-600 break-all">{filename}</p></div>
              </div>
              {shareResult && <div className="text-sm text-slate-600 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">{shareResult}</div>}
              <div className="grid gap-2">
                {previewUrl && <a href={previewUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 w-full h-10 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 text-sm font-semibold hover:bg-slate-100">👁 Preview PDF</a>}
                <button onClick={() => pdfBlob && downloadBlob(pdfBlob, filename)} className="flex items-center justify-center gap-2 w-full h-10 rounded-xl bg-[#0f2044] text-white text-sm font-semibold hover:bg-[#162d4a]">⬇ Save PDF</button>
                <button onClick={handleShare} disabled={sharing} className="flex items-center justify-center gap-2 w-full h-10 rounded-xl border border-[#0f2044] text-[#0f2044] text-sm font-semibold hover:bg-blue-50 disabled:opacity-60">{sharing ? 'Opening share…' : '↗ Share PDF'}</button>
              </div>
              <p className="text-xs text-slate-400 text-center">Opens native share menu on iPhone, iPad and Android.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}