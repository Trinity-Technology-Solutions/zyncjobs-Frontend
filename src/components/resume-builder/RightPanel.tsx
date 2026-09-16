import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  FileText, ZoomIn, ZoomOut, ChevronDown, ChevronUp,
  LayoutTemplate, Maximize2, Minimize2,
} from 'lucide-react';
import { useResumeStore } from '../../store/useResumeStore';
import ResumeTemplate from './ResumeTemplate';

// A4 at 96 dpi: 794 × 1123 px — these are the document's natural dimensions.
// They must NOT be changed to fix the preview; only the preview scale changes.
const DOC_W = 794;
const DOC_H = 1123;

const TEMPLATES = ['classic', 'modern', 'minimal', 'executive', 'compact', 'professional'] as const;

const MIN_ZOOM = 0.2;
const MAX_ZOOM = 2.0;
const ZOOM_STEP = 0.1;

interface Props {
  onNavigate?: (page: string) => void;
}

export default function RightPanel({ onNavigate: _onNavigate }: Props) {
  const { data, update } = useResumeStore();
  const [showTemplates, setShowTemplates] = useState(false);
  const [page, setPage] = useState(1);

  // zoom === null means "fit mode" — scale is auto-calculated from container
  const [zoom, setZoom] = useState<number | null>(null);

  const viewportRef = useRef<HTMLDivElement>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);
  const [fitScale, setFitScale] = useState(0.75);

  const hasContent = !!(
    data.personalInfo.name ||
    (Array.isArray(data.summary) ? data.summary.length > 0 : !!data.summary) ||
    data.experience.length > 0
  );

  // Calculate the scale that fits the document inside the available viewport.
  // Called on mount and whenever the container resizes.
  const recalcFit = useCallback(() => {
    const vp = viewportRef.current;
    if (!vp) return;

    const vpW = vp.clientWidth;
    const vpH = vp.clientHeight;

    if (vpW <= 0 || vpH <= 0) return;

    // Subtract internal padding (p-3 = 12px each side → 24px total)
    const pad = 24;
    const availW = vpW - pad;
    const availH = vpH - pad;

    if (availW <= 0 || availH <= 0) return;

    const scaleW = availW / DOC_W;
    const scaleH = availH / DOC_H;

    // Use the smaller of the two so the full page fits without clipping.
    // Clamp to valid range to guard against degenerate container sizes.
    const scale = Math.min(scaleW, scaleH);
    const clamped = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, scale));

    setFitScale(clamped);
  }, []);

  // Attach ResizeObserver to the viewport container so fit recalculates
  // whenever the panel is resized (e.g. browser resize, sidebar toggle).
  useEffect(() => {
    const vp = viewportRef.current;
    if (!vp) return;

    recalcFit();

    const ro = new ResizeObserver(() => {
      recalcFit();
    });
    ro.observe(vp);
    return () => ro.disconnect();
  }, [recalcFit]);

  // The effective scale used for rendering:
  // null zoom → use fitScale; explicit zoom → use that value.
  const effectiveScale = zoom !== null ? zoom : fitScale;

  const handleFitToPage = () => {
    setZoom(null); // re-enter fit mode; fitScale will be used
  };

  const handleFitToWidth = () => {
    // Fit width only (ignore height constraint)
    const vp = viewportRef.current;
    if (!vp) { setZoom(null); return; }
    const pad = 24;
    const availW = vp.clientWidth - pad;
    if (availW <= 0) { setZoom(null); return; }
    const s = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, availW / DOC_W));
    setZoom(s);
  };

  const handleZoomOut = () => {
    const base = zoom !== null ? zoom : fitScale;
    setZoom(Math.max(MIN_ZOOM, parseFloat((base - ZOOM_STEP).toFixed(2))));
  };

  const handleZoomIn = () => {
    const base = zoom !== null ? zoom : fitScale;
    setZoom(Math.min(MAX_ZOOM, parseFloat((base + ZOOM_STEP).toFixed(2))));
  };

  // Scaled document dimensions used to size the layout container.
  // Because CSS transform does NOT affect layout flow, we must explicitly
  // set the outer container to the post-scale dimensions so the scroll
  // container knows the correct scrollable area.
  const scaledW = DOC_W * effectiveScale;
  const scaledH = DOC_H * effectiveScale;

  const isFitMode = zoom === null;

  return (
    <div className="flex flex-col h-full overflow-hidden bg-white">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-200 bg-gray-50/50 flex-shrink-0">
        <span className="text-sm font-semibold text-gray-700 flex items-center gap-2">
          <FileText className="w-4 h-4 text-gray-400" />
          Preview
        </span>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-gray-400">A4</span>
          <span className="text-[10px] text-gray-300">·</span>
          <span className="text-[10px] text-gray-400 capitalize">{data.template}</span>
        </div>
      </div>

      {/* Template switcher */}
      <div className="border-b border-gray-100 px-4 py-2 flex-shrink-0">
        <button
          onClick={() => setShowTemplates(!showTemplates)}
          className="flex items-center gap-2 text-xs font-medium text-gray-600 hover:text-gray-900 w-full"
        >
          <LayoutTemplate className="w-3.5 h-3.5 text-gray-400" />
          <span className="text-gray-400">Template</span>
          <span className="capitalize font-semibold text-blue-600 ml-1">{data.template}</span>
          {showTemplates ? <ChevronUp className="w-3 h-3 ml-auto text-gray-400" /> : <ChevronDown className="w-3 h-3 ml-auto text-gray-400" />}
        </button>
        {showTemplates && (
          <div className="grid grid-cols-3 gap-1 mt-1.5">
            {TEMPLATES.map((t) => (
              <button
                key={t}
                onClick={() => { update('template', t); setShowTemplates(false); }}
                className={`px-1.5 py-1 text-[10px] rounded border capitalize transition-colors
                  ${data.template === t
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'border-gray-200 text-gray-600 hover:border-blue-400 hover:text-blue-600'
                  }`}
              >
                {t}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Controls: Zoom + Fit + Page */}
      <div ref={toolbarRef} className="flex items-center gap-1 px-4 py-2 border-b border-gray-100 bg-gray-50/30 flex-shrink-0">
        <button onClick={handleZoomOut} className="p-0.5 rounded hover:bg-gray-200 text-gray-500 transition-colors" title="Zoom out">
          <ZoomOut className="w-3 h-3" />
        </button>
        <span className="text-[10px] text-gray-500 w-8 text-center font-medium">
          {Math.round(effectiveScale * 100)}%
        </span>
        <button onClick={handleZoomIn} className="p-0.5 rounded hover:bg-gray-200 text-gray-500 transition-colors" title="Zoom in">
          <ZoomIn className="w-3 h-3" />
        </button>

        <div className="w-px h-4 bg-gray-200 mx-1" />

        {/* Fit width */}
        <button
          onClick={handleFitToWidth}
          className="p-0.5 rounded transition-colors hover:bg-gray-200 text-gray-400"
          title="Fit width"
        >
          <Maximize2 className="w-3 h-3" />
        </button>
        {/* Fit page (full fit mode) */}
        <button
          onClick={handleFitToPage}
          className={`p-0.5 rounded transition-colors ${isFitMode ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-200 text-gray-400'}`}
          title="Fit page"
        >
          <Minimize2 className="w-3 h-3" />
        </button>

        <div className="flex-1" />

        {/* Page nav */}
        <button
          onClick={() => setPage(Math.max(1, page - 1))}
          className="p-0.5 rounded hover:bg-gray-200 text-gray-400 transition-colors"
          disabled={page <= 1}
        >
          <ChevronDown className="w-3 h-3 -rotate-90" />
        </button>
        <span className="text-[10px] text-gray-500 w-12 text-center">{page} / {page}</span>
        <button
          onClick={() => setPage(page + 1)}
          className="p-0.5 rounded hover:bg-gray-200 text-gray-400 transition-colors"
        >
          <ChevronDown className="w-3 h-3 rotate-90" />
        </button>
      </div>

      
      <div
        ref={viewportRef}
        className="flex-1 overflow-auto bg-gray-100/60"
        style={{ padding: '12px' }}
      >
        {!hasContent ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 py-12">
            <FileText className="w-10 h-10 mb-2 opacity-20" />
            <p className="text-xs font-medium">Resume preview</p>
            <p className="text-[10px] mt-0.5">Add content to see it live</p>
          </div>
        ) : (
          // Centering wrapper: fills the viewport, centers the doc when it fits.
          // Uses inline-flex so it shrinks to content when doc is larger than viewport.
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'flex-start',
              minWidth: '100%',
              minHeight: '100%',
            }}
          >
            {/*
              Scale anchor: explicitly sized to the post-scale document dimensions.
              This is what the scroll container measures for scrollable area.
              overflow: visible so the (pre-scale) document can paint outside
              without being clipped here — clipping is handled by the viewport.
            */}
            <div
              style={{
                position: 'relative',
                width: scaledW,
                height: scaledH,
                flexShrink: 0,
              }}
            >
              {/*
                Document: natural A4 size, scaled via CSS transform.
                transformOrigin: 'top left' so scaling anchors to the top-left
                corner of the scale-anchor, which is already centered by the
                centering wrapper.
                The shadow is on this element so it scales with the document.
              */}
              <div
                id="resume-preview-content"
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: DOC_W,
                  // height is intentionally not set — document grows with content
                  transformOrigin: 'top left',
                  transform: `scale(${effectiveScale})`,
                  background: '#fff',
                  boxShadow: '0 2px 16px rgba(0,0,0,0.12)',
                }}
              >
                <ResumeTemplate data={data} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
