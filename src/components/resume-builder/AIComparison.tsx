import React from 'react';
import { Sparkles, X, Check, RefreshCw, ArrowRight } from 'lucide-react';

interface Props {
  current: string;
  suggested: string;
  onAccept: () => void;
  onReject: () => void;
  onRegenerate?: () => void;
  loading?: boolean;
  label?: string;
}

export default function AIComparison({ current, suggested, onAccept, onReject, onRegenerate, loading, label }: Props) {
  return (
    <div className="border border-purple-200 rounded-xl overflow-hidden bg-white shadow-sm">
      <div className="flex items-center gap-2 px-4 py-2 bg-purple-50 border-b border-purple-100">
        <Sparkles className="w-4 h-4 text-purple-500" />
        <span className="text-xs font-semibold text-purple-700">{label || 'AI Suggestion'}</span>
      </div>
      <div className="grid grid-cols-2 divide-x divide-gray-200">
        {/* Current */}
        <div className="p-3 bg-gray-50/50">
          <p className="text-[10px] font-medium text-gray-400 mb-1 uppercase tracking-wider">Current</p>
          <p className="text-sm text-gray-600">{current || '—'}</p>
        </div>
        {/* Suggested */}
        <div className="p-3 bg-purple-50/30">
          <p className="text-[10px] font-medium text-purple-400 mb-1 uppercase tracking-wider">Suggested</p>
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <RefreshCw className="w-3 h-3 animate-spin" /> Improving...
            </div>
          ) : (
            <p className="text-sm text-gray-800">{suggested}</p>
          )}
        </div>
      </div>
      <div className="flex items-center justify-end gap-2 px-4 py-2 border-t border-gray-100 bg-white">
        <button onClick={onReject}
          className="flex items-center gap-1 px-3 py-1.5 text-xs text-gray-600 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors">
          <X className="w-3 h-3" /> Reject
        </button>
        {onRegenerate && (
          <button onClick={onRegenerate} disabled={loading}
            className="flex items-center gap-1 px-3 py-1.5 text-xs text-purple-600 border border-purple-200 rounded-md hover:bg-purple-50 disabled:opacity-40 transition-colors">
            <RefreshCw className="w-3 h-3" /> Regenerate
          </button>
        )}
        <button onClick={onAccept}
          className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors">
          <Check className="w-3 h-3" /> Accept
        </button>
      </div>
    </div>
  );
}
