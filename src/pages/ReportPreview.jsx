import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getRecord } from '../lib/records';
import { ArrowLeft, Edit, Download, Share2 } from 'lucide-react';
import PdfActionModal from '../components/PdfActionModal';
import ReportContent from '../components/report/ReportContent';
import { buildTestRecordFilename, elementToPdfBlob, sharePdfBlob } from '../lib/pdfUtils';

/* ── Page component ── */

export default function ReportPreview() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const reportRef = useRef(null);
  const [pdfModal, setPdfModal] = useState({ open: false, blob: null, generating: false, progress: 0, error: null });

  useEffect(() => { getRecord(id).then(d => { setRecord(d); setLoading(false); }); }, [id]);

  const handlePdf = async () => {
    setPdfModal({ open: true, blob: null, generating: true, progress: 0.05, error: null });
    try {
      const el = reportRef.current;
      if (!el) throw new Error('Report content not found.');
      const blob = await elementToPdfBlob(el, { onProgress: p => setPdfModal(m => ({ ...m, progress: p })) });
      setPdfModal({ open: true, blob, generating: false, progress: 1, error: null });
    } catch (err) {
      setPdfModal({ open: true, blob: null, generating: false, progress: 0, error: err.message });
    }
  };

  const handleQuickShare = async () => {
    setPdfModal({ open: true, blob: null, generating: true, progress: 0.05, error: null });
    try {
      const el = reportRef.current;
      if (!el) throw new Error('Report content not found.');
      const blob = await elementToPdfBlob(el, { onProgress: p => setPdfModal(m => ({ ...m, progress: p })) });
      setPdfModal({ open: true, blob, generating: false, progress: 1, error: null });
      await sharePdfBlob(blob, buildTestRecordFilename(record));
    } catch (err) {
      setPdfModal({ open: true, blob: null, generating: false, progress: 0, error: err.message });
    }
  };

  if (loading) return (
    <div className="fixed inset-0 flex items-center justify-center bg-white">
      <div className="w-8 h-8 border-4 border-slate-200 border-t-[#0f2044] rounded-full animate-spin" />
    </div>
  );
  if (!record) return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4">
      <p className="text-slate-500">Record not found.</p>
      <button onClick={() => navigate('/dashboard')} className="bg-[#0f2044] text-white px-4 py-2 rounded-xl text-sm">Back to Dashboard</button>
    </div>
  );

  const filename = buildTestRecordFilename(record);
  return (
    <div className="min-h-screen bg-[#ddd9d4]">
      {/* Sticky nav */}
      <div className="bg-white border-b border-stone-200 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/records/' + id + '/edit')} className="flex items-center gap-1.5 text-stone-500 hover:text-stone-800 text-sm">
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <span className="text-sm font-semibold text-stone-700 truncate">{record.addressLocation || 'Report Preview'}</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => navigate('/records/' + id + '/edit')} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 text-sm hover:border-[#0f2044]">
              <Edit className="w-4 h-4" /> Edit
            </button>
            <button onClick={handleQuickShare} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#0f2044] text-[#0f2044] text-sm hover:bg-blue-50">
              <Share2 className="w-4 h-4" /> Share PDF
            </button>
            <button onClick={handlePdf} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0f2044] text-white text-sm hover:bg-[#162d4a]">
              <Download className="w-4 h-4" /> Save PDF
            </button>
          </div>
        </div>
      </div>

      {/* Report preview */}
      <div className="py-8 flex justify-center px-2">
        <ReportContent record={record} />
      </div>

      {/* Bottom actions */}
      <div className="max-w-5xl mx-auto px-4 py-4 flex justify-between items-center">
        <button onClick={() => navigate('/records/' + id + '/edit')} className="text-stone-400 hover:text-stone-700 text-sm flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" /> Back to Form
        </button>
        <div className="flex gap-2">
          <button onClick={handleQuickShare} className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-[#0f2044] text-[#0f2044] text-sm hover:bg-blue-50">
            <Share2 className="w-4 h-4" /> Share PDF
          </button>
          <button onClick={handlePdf} className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0f2044] text-white text-sm hover:bg-[#162d4a]">
            <Download className="w-4 h-4" /> Save PDF
          </button>
        </div>
      </div>

      {/* Hidden render target for PDF generation */}
      <div
        ref={reportRef}
        style={{ position: 'fixed', top: 0, left: 0, width: '794px', opacity: 0, pointerEvents: 'none', zIndex: -1, background: 'white', overflow: 'visible' }}
        aria-hidden="true"
      >
        {record && <ReportContent record={record} />}
      </div>

      <PdfActionModal
        open={pdfModal.open}
        onClose={() => setPdfModal(m => ({ ...m, open: false }))}
        pdfBlob={pdfModal.blob}
        generating={pdfModal.generating}
        progress={pdfModal.progress}
        error={pdfModal.error}
        filename={filename}
      />
    </div>
  );
}
