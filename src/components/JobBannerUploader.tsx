import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Upload, X, ZoomIn, ZoomOut, Check, AlertCircle, Image as ImageIcon, Trash2 } from 'lucide-react';
import { API_ENDPOINTS } from '../config/env';
import { apiFetch } from '../api/apiFetch';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];
const MAX_SIZE = 5 * 1024 * 1024;
const ASPECT = 3 / 1;
const OUT_W = 1200;
const OUT_H = Math.round(OUT_W / ASPECT);

interface JobBannerUploaderProps {
  currentBanner?: string;
  onChange: (url: string) => void;
  onRemove: () => void;
}

function JobBannerUploader({ currentBanner, onChange, onRemove }: JobBannerUploaderProps) {
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [rawFile, setRawFile] = useState<File | null>(null);
  const [rawPreview, setRawPreview] = useState<string | null>(null);
  const [showCropper, setShowCropper] = useState(false);
  const [bannerUrl, setBannerUrl] = useState(currentBanner || '');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setBannerUrl(currentBanner || '');
  }, [currentBanner]);

  useEffect(() => {
    return () => {
      if (rawPreview) URL.revokeObjectURL(rawPreview);
    };
  }, [rawPreview]);

  const validateFile = (file: File): string | null => {
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!ALLOWED_TYPES.includes(file.type) || !ALLOWED_EXTENSIONS.includes(ext)) {
      return 'Only JPG, JPEG, PNG, and WEBP files are allowed';
    }
    if (file.size > MAX_SIZE) {
      return 'File size exceeds 5MB limit';
    }
    if (file.size === 0) {
      return 'File is empty';
    }
    return null;
  };

  const handleFile = (file: File) => {
    setError(null);
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }
    setRawFile(file);
    const preview = URL.createObjectURL(file);
    setRawPreview(preview);
    setShowCropper(true);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    if (e.target) e.target.value = '';
  };

  const handleCropApply = async (croppedBlob: Blob) => {
    setShowCropper(false);
    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('banner', croppedBlob, 'job-banner.jpg');

      const response = await apiFetch(`${API_ENDPOINTS.JOBS}/upload-banner`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const result = await response.json().catch(() => ({}));
        throw new Error(result.error || 'Upload failed');
      }

      const result = await response.json();
      if (result.fileUrl) {
        setBannerUrl(result.fileUrl);
        onChange(result.fileUrl);
      } else {
        throw new Error('No URL returned from upload');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
      setRawFile(null);
      if (rawPreview) {
        URL.revokeObjectURL(rawPreview);
        setRawPreview(null);
      }
    }
  };

  const handleRemove = () => {
    setBannerUrl('');
    setRawFile(null);
    if (rawPreview) {
      URL.revokeObjectURL(rawPreview);
      setRawPreview(null);
    }
    setError(null);
    onRemove();
  };

  return (
    <div className="space-y-3">
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          <AlertCircle size={16} className="shrink-0" />
          {error}
        </div>
      )}

      {uploading && (
        <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-blue-700">Uploading banner image...</span>
        </div>
      )}

      {bannerUrl && !showCropper && !uploading ? (
        <div className="relative rounded-lg overflow-hidden bg-gray-900 group">
          <img
            src={bannerUrl}
            alt="Job banner"
            className="w-full h-36 object-cover opacity-80"
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&h=400&fit=crop';
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-blue-900/40 to-purple-900/30" />
          <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-2 bg-white/90 rounded-lg hover:bg-white text-gray-700 shadow-sm transition-colors"
              title="Replace banner"
            >
              <Upload size={16} />
            </button>
            <button
              type="button"
              onClick={handleRemove}
              className="p-2 bg-white/90 rounded-lg hover:bg-white text-red-600 shadow-sm transition-colors"
              title="Remove banner"
            >
              <Trash2 size={16} />
            </button>
          </div>
          <div className="absolute bottom-2 left-2">
            <span className="text-[10px] text-white/70 bg-black/40 px-2 py-0.5 rounded">1200 x 400</span>
          </div>
        </div>
      ) : !showCropper && !uploading ? (
        <div
          className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer ${
            dragOver ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
          }`}
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onClick={() => fileInputRef.current?.click()}
        >
          <ImageIcon className="w-10 h-10 text-gray-400 mx-auto mb-2" />
          <p className="text-sm font-medium text-gray-700 mb-1">
            Click to upload or drag & drop
          </p>
          <p className="text-xs text-gray-500">
            JPG, PNG, or WEBP &middot; Max 5MB
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Recommended: 1200 x 400 px
          </p>
        </div>
      ) : null}

      <input
        ref={fileInputRef}
        type="file"
        accept=".jpg,.jpeg,.png,.webp"
        onChange={handleFileInput}
        className="hidden"
      />

      {showCropper && rawPreview && (
        <CropModal
          src={rawPreview}
          onClose={() => {
            setShowCropper(false);
            setRawFile(null);
            if (rawPreview) {
              URL.revokeObjectURL(rawPreview);
              setRawPreview(null);
            }
          }}
          onApply={handleCropApply}
        />
      )}
    </div>
  );
}

// Crop modal with fixed 3:1 aspect ratio, outputs 1200x400
interface CropModalProps {
  src: string;
  onClose: () => void;
  onApply: (blob: Blob) => void;
}

function CropModal({ src, onClose, onApply }: CropModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, ox: 0, oy: 0 });
  const [imgLoaded, setImgLoaded] = useState(false);
  const [cropError, setCropError] = useState<string | null>(null);
  const [applying, setApplying] = useState(false);

  const CANVAS_W = 720;
  const CANVAS_H = Math.round(CANVAS_W / ASPECT);

  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      imgRef.current = img;
      const scaleW = CANVAS_W / img.width;
      const scaleH = CANVAS_H / img.height;
      const initZoom = Math.max(scaleW, scaleH);
      setZoom(initZoom);
      setOffset({ x: 0, y: 0 });
      setImgLoaded(true);
      setCropError(null);
    };
    img.onerror = () => {
      setCropError('Failed to load image for cropping. The file may be corrupted or unsupported.');
      setImgLoaded(false);
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

  const resetZoom = () => {
    const img = imgRef.current;
    if (!img) return;
    const scaleW = CANVAS_W / img.width;
    const scaleH = CANVAS_H / img.height;
    const initZoom = Math.max(scaleW, scaleH);
    setZoom(initZoom);
    setOffset({ x: 0, y: 0 });
  };

  const handleApply = async () => {
    const img = imgRef.current;
    if (!img) return;
    setApplying(true);

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
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Crop Job Banner</h2>
            <p className="text-xs text-gray-500 mt-0.5">Drag to reposition &middot; Scroll or use controls to zoom</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
            <X size={20} />
          </button>
        </div>

        {cropError && (
          <div className="mx-6 mt-4 flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            <AlertCircle size={16} className="shrink-0" />
            {cropError}
          </div>
        )}

        {!cropError && (<>
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
            <button onClick={resetZoom} className="p-2 rounded-full border border-gray-200 hover:bg-gray-50 text-gray-500 transition-colors text-xs font-medium px-3">
              Reset
            </button>
          </div>

          <div className="flex items-center justify-between gap-3 px-6 pb-6">
            <div className="text-[11px] text-gray-400">
              Output: 1200 x 400 px
            </div>
            <div className="flex gap-3">
              <button onClick={onClose} className="px-5 py-2.5 border-2 border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              <button
                onClick={handleApply}
                disabled={!imgLoaded || applying || !!cropError}
                className="px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-60 transition-colors flex items-center gap-2 shadow-sm"
              >
                {applying ? (
                  <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Processing...</>
                ) : (
                  <><Check size={16} />Apply Banner</>
                )}
              </button>
            </div>
          </div>
        </>)}
      </div>
    </div>
  );
}

export default JobBannerUploader;
