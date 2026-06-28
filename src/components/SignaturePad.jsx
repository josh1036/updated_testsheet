import { useRef, useEffect, useState, useCallback } from 'react';
import { Trash2, PenLine } from 'lucide-react';
export default function SignaturePad({ value, onChange, readOnly = false }) {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(!!value);
  const lastPos = useRef(null);
  useEffect(() => {
    if (value && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const img = new Image();
      img.onload = () => { ctx.clearRect(0, 0, canvas.width, canvas.height); ctx.drawImage(img, 0, 0, canvas.width, canvas.height); };
      img.src = value;
      setHasSignature(true);
    }
  }, []);
  const getPos = (e, canvas) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if (e.touches) return { x: (e.touches[0].clientX - rect.left) * scaleX, y: (e.touches[0].clientY - rect.top) * scaleY };
    return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY };
  };
  const startDrawing = useCallback((e) => {
    if (readOnly) return; e.preventDefault();
    const canvas = canvasRef.current; if (!canvas) return;
    setIsDrawing(true); lastPos.current = getPos(e, canvas);
  }, [readOnly]);
  const draw = useCallback((e) => {
    if (!isDrawing || readOnly) return; e.preventDefault();
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d'); if (!ctx) return;
    const pos = getPos(e, canvas);
    ctx.beginPath(); ctx.moveTo(lastPos.current.x, lastPos.current.y); ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = '#1a1a2e'; ctx.lineWidth = 2; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.stroke();
    lastPos.current = pos;
  }, [isDrawing, readOnly]);
  const stopDrawing = useCallback(() => {
    if (!isDrawing) return; setIsDrawing(false); lastPos.current = null;
    const canvas = canvasRef.current; if (!canvas) return;
    onChange(canvas.toDataURL('image/png')); setHasSignature(true);
  }, [isDrawing, onChange]);
  const clear = () => {
    const canvas = canvasRef.current; if (!canvas) return;
    canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false); onChange(undefined);
  };
  return (
    <div className="relative border-2 border-dashed border-slate-300 rounded-xl bg-slate-50 overflow-hidden" style={{ height: 120 }}>
      {!hasSignature && !readOnly && (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-slate-400 gap-1">
          <PenLine className="w-5 h-5" /><span className="text-xs">Sign here</span>
        </div>
      )}
      <canvas ref={canvasRef} width={600} height={120} className="w-full h-full touch-none"
        onMouseDown={startDrawing} onMouseMove={draw} onMouseUp={stopDrawing} onMouseLeave={stopDrawing}
        onTouchStart={startDrawing} onTouchMove={draw} onTouchEnd={stopDrawing}
        style={{ cursor: readOnly ? 'default' : 'crosshair' }} />
      {!readOnly && hasSignature && (
        <button type="button" onClick={clear} className="absolute bottom-1 right-1 flex items-center gap-1 text-xs text-red-400 hover:text-red-600 px-2 py-1 rounded hover:bg-red-50 transition-colors">
          <Trash2 className="w-3 h-3" /> Clear signature
        </button>
      )}
    </div>
  );
}