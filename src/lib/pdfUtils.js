export function sanitiseFilename(str) {
  if (!str) return '';
  return str.replace(/[^a-zA-Z0-9\-_\s]/g, '').replace(/\s+/g, '_').trim().slice(0, 60);
}
export function buildTestRecordFilename(record) {
  const parts = ['TestSheet', sanitiseFilename(record?.contractorName || record?.companyName), sanitiseFilename(record?.addressLocation), (record?.date || new Date().toISOString().slice(0, 10)).replace(/\//g, '-')].filter(Boolean);
  return parts.join('_') + '.pdf';
}
export function buildTorqueFilename(record) {
  const parts = ['Termination_Torque_Certificate', sanitiseFilename(record?.projectName || record?.companyName), sanitiseFilename(record?.switchboardId), (record?.verificationDate || new Date().toISOString().slice(0, 10)).replace(/\//g, '-')].filter(Boolean);
  return parts.join('_') + '.pdf';
}
export async function elementToPdfBlob(element, { onProgress } = {}) {
  onProgress?.(0.05);
  // jsPDF v4 uses named export; v3 used default. Handle both.
  const jspdfMod = await import('jspdf');
  const jsPDF = jspdfMod.jsPDF || jspdfMod.default;
  if (!jsPDF) throw new Error('jsPDF failed to load — check package version.');
  const html2canvasMod = await import('html2canvas');
  const html2canvas = html2canvasMod.default || html2canvasMod;
  if (!html2canvas) throw new Error('html2canvas failed to load.');
  const A4_W = 210, A4_H = 297, SCALE = 2;
  const pageEls = element.querySelectorAll('.report-page');
  const pages = pageEls.length > 0 ? Array.from(pageEls) : [element];
  if (pages.length === 0) throw new Error('No report pages found to render.');
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4', compress: true });
  for (let i = 0; i < pages.length; i++) {
    onProgress?.(0.1 + (0.8 * i) / pages.length);
    const canvas = await html2canvas(pages[i], { scale: SCALE, useCORS: true, allowTaint: false, backgroundColor: '#ffffff', logging: false, imageTimeout: 20000 });
    const pxPerMm = canvas.width / A4_W;
    const a4Px = A4_H * pxPerMm;
    if (i > 0) pdf.addPage();
    let yPx = 0, firstSlice = true;
    while (yPx < canvas.height) {
      const sliceH = Math.min(a4Px, canvas.height - yPx);
      const sc = document.createElement('canvas'); sc.width = canvas.width; sc.height = sliceH;
      sc.getContext('2d').drawImage(canvas, 0, -yPx);
      if (!firstSlice) pdf.addPage();
      firstSlice = false;
      pdf.addImage(sc.toDataURL('image/jpeg', 0.92), 'JPEG', 0, 0, A4_W, sliceH / pxPerMm);
      yPx += a4Px;
    }
  }
  onProgress?.(0.97);
  const blob = pdf.output('blob');
  onProgress?.(1.0);
  return blob;
}
export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
  if (isIOS) { window.open(url, '_blank'); setTimeout(() => URL.revokeObjectURL(url), 60000); return; }
  const a = document.createElement('a'); a.href = url; a.download = filename; a.style.display = 'none';
  document.body.appendChild(a); a.click();
  setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 1000);
}
export async function sharePdfBlob(blob, filename) {
  const file = new File([blob], filename, { type: 'application/pdf' });
  const shareSupported = navigator.share && navigator.canShare && navigator.canShare({ files: [file] });
  if (shareSupported) {
    try {
      await navigator.share({ title: filename.replace(/\.pdf$/, '').replace(/_/g, ' '), files: [file] });
      return 'shared';
    } catch (err) {
      if (err.name === 'AbortError') return 'cancelled';
    }
  }
  downloadBlob(blob, filename);
  return 'downloaded';
}