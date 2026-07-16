import React, { useState } from 'react';
import {
  FileText, ZoomIn, ZoomOut, ChevronDown, ChevronUp,
  LayoutTemplate, Maximize2, Minimize2, Monitor, BookOpen,
  Palette, Type,
} from 'lucide-react';
import { useResumeStore } from '../../store/useResumeStore';
import ResumeTemplate from './ResumeTemplate';

const TEMPLATES = ['classic', 'modern', 'minimal', 'executive', 'compact', 'professional'] as const;

interface Props {
  onNavigate?: (page: string) => void;
}

export default function RightPanel({ onNavigate }: Props) {
  const { data, update } = useResumeStore();
  const [zoom, setZoom] = useState(0.75);
  const [showTemplates, setShowTemplates] = useState(false);
  const [page, setPage] = useState(1);
  const [fitMode, setFitMode] = useState<'width' | 'page'>('width');

  const hasContent = !!(data.personalInfo.name || (Array.isArray(data.summary) ? data.summary.length > 0 : !!data.summary) || data.experience.length > 0);

  const fitToWidth = () => { setZoom(0.75); setFitMode('width'); };
  const fitToPage = () => { setZoom(0.62); setFitMode('page'); };

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
      <div className="flex items-center gap-1 px-4 py-2 border-b border-gray-100 bg-gray-50/30 flex-shrink-0">
        <button onClick={() => setZoom(Math.max(0.3, +(zoom - 0.1).toFixed(1)))} className="p-0.5 rounded hover:bg-gray-200 text-gray-500 transition-colors" title="Zoom out">
          <ZoomOut className="w-3 h-3" />
        </button>
        <span className="text-[10px] text-gray-500 w-8 text-center font-medium">{Math.round(zoom * 100)}%</span>
        <button onClick={() => setZoom(Math.min(1.2, +(zoom + 0.1).toFixed(1)))} className="p-0.5 rounded hover:bg-gray-200 text-gray-500 transition-colors" title="Zoom in">
          <ZoomIn className="w-3 h-3" />
        </button>

        <div className="w-px h-4 bg-gray-200 mx-1" />

        <button
          onClick={fitToWidth}
          className={`p-0.5 rounded transition-colors ${fitMode === 'width' ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-200 text-gray-400'}`}
          title="Fit width"
        >
          <Maximize2 className="w-3 h-3" />
        </button>
        <button
          onClick={fitToPage}
          className={`p-0.5 rounded transition-colors ${fitMode === 'page' ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-200 text-gray-400'}`}
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

      {/* Preview canvas */}
      <div className="flex-1 overflow-auto bg-gray-100/60 p-3">
        {!hasContent ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 py-12">
            <FileText className="w-10 h-10 mb-2 opacity-20" />
            <p className="text-xs font-medium">Resume preview</p>
            <p className="text-[10px] mt-0.5">Add content to see it live</p>
          </div>
        ) : (
          <div
            className="bg-white shadow-lg mx-auto"
            style={{
              width: `${zoom * 794}px`,
              minHeight: `${zoom * 1123}px`,
              transform: 'translateZ(0)',
            }}
          >
            <div id="resume-preview-content" style={{ transform: `scale(${zoom})`, transformOrigin: 'top left', width: `${(1/zoom)*100}%` }}>
              <ResumeTemplate data={data} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
