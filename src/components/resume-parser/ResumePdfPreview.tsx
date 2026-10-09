import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Download, Loader2, ZoomIn, ZoomOut } from 'lucide-react';
import * as pdfjs from 'pdfjs-dist';
import { pdfDocumentOptions } from '../../lib/parse-resume-from-pdf/pdfjs-config';

export default function ResumePdfPreview({ url, fileName }: { url: string; fileName: string }) {
  const [document, setDocument] = useState<pdfjs.PDFDocumentProxy | null>(null);
  const [page, setPage] = useState(1);
  const [zoom, setZoom] = useState(1);
  const [width, setWidth] = useState(600);
  const [loading, setLoading] = useState(true);
  const [rendering, setRendering] = useState(false);
  const [error, setError] = useState('');
  const container = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let cancelled = false;
    setDocument(null); setPage(1); setZoom(1); setLoading(true); setError('');
    const task = pdfjs.getDocument({ url, ...pdfDocumentOptions, disableStream: true });
    task.promise.then(pdf => { if (!cancelled) setDocument(pdf); }).catch(() => {
      if (!cancelled) setError('Unable to preview this PDF. You can download the original file below.');
    }).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; void task.destroy().catch(() => {}); };
  }, [url]);

  useEffect(() => {
    if (!container.current) return;
    const observer = new ResizeObserver(entries => {
      setWidth(Math.max(200, entries[0].contentRect.width - 32));
    });
    observer.observe(container.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!document || !canvas.current) return;
    let cancelled = false;
    let task: pdfjs.RenderTask | undefined;
    const element = canvas.current;
    setRendering(true); setError('');
    document.getPage(page).then(pdfPage => {
      if (cancelled) return;
      const natural = pdfPage.getViewport({ scale: 1 });
      const viewport = pdfPage.getViewport({ scale: (width / natural.width) * zoom });
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      element.width = Math.floor(viewport.width * ratio);
      element.height = Math.floor(viewport.height * ratio);
      element.style.width = `${viewport.width}px`;
      element.style.height = `${viewport.height}px`;
      task = pdfPage.render({ canvas: element, viewport, transform: ratio !== 1 ? [ratio, 0, 0, ratio, 0, 0] : undefined });
      return task.promise;
    }).catch(cause => {
      if (!cancelled && cause?.name !== 'RenderingCancelledException') setError('This PDF page could not be rendered. Download the original file to view it.');
    }).finally(() => { if (!cancelled) setRendering(false); });
    return () => { cancelled = true; task?.cancel(); };
  }, [document, page, zoom, width]);

  const buttonClass = 'p-2 rounded-md hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600';
  return (
    <div className="bg-slate-50" aria-label="Resume PDF preview">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-200 bg-white px-3 py-2 text-sm text-gray-600">
        <div className="flex items-center gap-1">
          <button type="button" className={buttonClass} disabled={!document || page <= 1} onClick={() => setPage(value => value - 1)} aria-label="Previous page"><ChevronLeft size={18} /></button>
          <span aria-live="polite">{document ? `${page} / ${document.numPages}` : 'Loading PDF'}</span>
          <button type="button" className={buttonClass} disabled={!document || page >= document.numPages} onClick={() => setPage(value => value + 1)} aria-label="Next page"><ChevronRight size={18} /></button>
        </div>
        <div className="flex items-center gap-1">
          <button type="button" className={buttonClass} disabled={!document || zoom <= .5} onClick={() => setZoom(value => Math.max(.5, value - .25))} aria-label="Zoom out"><ZoomOut size={18} /></button>
          <span className="min-w-12 text-center">{Math.round(zoom * 100)}%</span>
          <button type="button" className={buttonClass} disabled={!document || zoom >= 2} onClick={() => setZoom(value => Math.min(2, value + .25))} aria-label="Zoom in"><ZoomIn size={18} /></button>
          <a href={url} download={fileName} className={buttonClass} aria-label="Download original resume"><Download size={18} /></a>
        </div>
      </div>
      <div ref={container} className="relative max-h-[800px] min-h-[240px] overflow-auto p-4" aria-busy={loading || rendering}>
        {(loading || rendering) && <div role="status" className="flex items-center justify-center gap-2 py-4 text-sm text-gray-500"><Loader2 size={18} className="animate-spin" /> Loading preview...</div>}
        {error && <p role="alert" className="p-4 text-sm text-red-700">{error}</p>}
        <canvas ref={canvas} role="img" aria-label={`${fileName}, page ${page}`} className={`mx-auto bg-white shadow-sm ${loading || error ? 'hidden' : ''}`} />
      </div>
    </div>
  );
}
