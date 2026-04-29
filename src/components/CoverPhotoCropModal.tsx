import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, ZoomIn, ZoomOut, Check } from 'lucide-react';

interface Props {
  src: string;
  onClose: () => void;
  onApply: (croppedBlob: Blob) => void;
}

// Cover photo aspect ratio: 3:1 (banner style)
const ASPECT = 3 / 1;

const CoverPhotoCropModal: React.FC<Props> = ({ src, onClose, onApply }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, ox: 0, oy: 0 });
  const [imgLoaded, setImgLoaded] = useState(false);
  const [applying, setApplying] = useState(false);

  // Canvas display size
  const CANVAS_W = 720;
  const CANVAS_H = Math.round(CANVAS_W / ASPECT); // 240

  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      imgRef.current = img;
      // Fit image to canvas initially
      const scaleW = CANVAS_W / img.width;
      const scaleH = CANVAS_H / img.height;
      const initZoom = Math.max(scaleW, scaleH);
      setZoom(initZoom);
      setOffset({ x: 0, y: 0 });
      setImgLoaded(true);
    };
    img.src = src;
  }, [src]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img) return;
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

    const drawW = img.width * zoom;
    const drawH = img.height * zoom;
    const x = (CANVAS_W - drawW) / 2 + offset.x;
    const y = (CANVAS_H - drawH) / 2 + offset.y;

    ctx.drawImage(img, x, y, drawW, drawH);
  }, [zoom, offset]);

  useEffect(() => {
    if (imgLoaded) draw();
  }, [imgLoaded, draw]);

  const clampOffset = (ox: number, oy: number, z: number) => {
    const img = imgRef.current;
    if (!img) return { x: ox, y: oy };
    const drawW = img.width * z;
    const drawH = img.height * z;
    const maxX = Math.max(0, (drawW - CANVAS_W) / 2);
    const maxY = Math.max(0, (drawH - CANVAS_H) / 2);
    return {
      x: Math.min(maxX, Math.max(-maxX, ox)),
      y: Math.min(maxY, Math.max(-maxY, oy)),
    };
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragging) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    setOffset(clampOffset(dragStart.current.ox + dx, dragStart.current.oy + dy, zoom));
  };

  const handleMouseUp = () => setDragging(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    setDragging(true);
    dragStart.current = { x: t.clientX, y: t.clientY, ox: offset.x, oy: offset.y };
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!dragging) return;
    const t = e.touches[0];
    const dx = t.clientX - dragStart.current.x;
    const dy = t.clientY - dragStart.current.y;
    setOffset(clampOffset(dragStart.current.ox + dx, dragStart.current.oy + dy, zoom));
  };

  const changeZoom = (delta: number) => {
    const img = imgRef.current;
    if (!img) return;
    const minZoom = Math.max(CANVAS_W / img.width, CANVAS_H / img.height);
    const newZoom = Math.min(4, Math.max(minZoom, zoom + delta));
    setZoom(newZoom);
    setOffset(prev => clampOffset(prev.x, prev.y, newZoom));
  };

  const handleApply = async () => {
    const img = imgRef.current;
    if (!img) return;
    setApplying(true);

    // Render at 2x for quality
    const OUT_W = 1200;
    const OUT_H = Math.round(OUT_W / ASPECT);
    const scale = OUT_W / CANVAS_W;

    const offscreen = document.createElement('canvas');
    offscreen.width = OUT_W;
    offscreen.height = OUT_H;
    const ctx = offscreen.getContext('2d')!;

    const drawW = img.width * zoom * scale;
    const drawH = img.height * zoom * scale;
    const x = (OUT_W - drawW) / 2 + offset.x * scale;
    const y = (OUT_H - drawH) / 2 + offset.y * scale;
    ctx.drawImage(img, x, y, drawW, drawH);

    offscreen.toBlob(blob => {
      if (blob) onApply(blob);
      setApplying(false);
    }, 'image/jpeg', 0.88);
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Crop Cover Photo</h2>
            <p className="text-xs text-gray-500 mt-0.5">Drag to reposition · Scroll or use buttons to zoom</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Crop area */}
        <div className="px-6 pt-5 pb-3">
          <div
            ref={containerRef}
            className="relative rounded-xl overflow-hidden border-2 border-blue-200 bg-gray-100"
            style={{ width: '100%', aspectRatio: `${ASPECT}` }}
          >
            <canvas
              ref={canvasRef}
              width={CANVAS_W}
              height={CANVAS_H}
              className="w-full h-full block"
              style={{ cursor: dragging ? 'grabbing' : 'grab', touchAction: 'none' }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleMouseUp}
              onWheel={e => { e.preventDefault(); changeZoom(e.deltaY < 0 ? 0.05 : -0.05); }}
            />
            {!imgLoaded && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full" />
              </div>
            )}
          </div>
        </div>

        {/* Zoom controls */}
        <div className="flex items-center justify-center gap-3 px-6 pb-4">
          <button onClick={() => changeZoom(-0.1)} className="p-2 rounded-full border border-gray-200 hover:bg-gray-50 text-gray-600 transition-colors">
            <ZoomOut size={16} />
          </button>
          <input
            type="range" min={0} max={100} step={1}
            value={Math.round(((zoom - 1) / 3) * 100)}
            onChange={e => {
              const img = imgRef.current;
              if (!img) return;
              const minZoom = Math.max(CANVAS_W / img.width, CANVAS_H / img.height);
              const newZoom = minZoom + (parseInt(e.target.value) / 100) * (4 - minZoom);
              setZoom(newZoom);
              setOffset(prev => clampOffset(prev.x, prev.y, newZoom));
            }}
            className="w-40 accent-blue-600"
          />
          <button onClick={() => changeZoom(0.1)} className="p-2 rounded-full border border-gray-200 hover:bg-gray-50 text-gray-600 transition-colors">
            <ZoomIn size={16} />
          </button>
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 pb-6">
          <button onClick={onClose} className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
            Cancel
          </button>
          <button
            onClick={handleApply}
            disabled={!imgLoaded || applying}
            className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-60 transition-colors flex items-center justify-center gap-2 shadow-sm"
          >
            {applying ? (
              <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Applying...</>
            ) : (
              <><Check size={16} />Apply Cover Photo</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CoverPhotoCropModal;
