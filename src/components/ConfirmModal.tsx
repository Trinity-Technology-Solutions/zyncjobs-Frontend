import { useEffect } from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface Props {
  open: boolean;
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({
  open, title = 'Confirm', message,
  confirmLabel = 'Delete', cancelLabel = 'Cancel',
  danger = true, onConfirm, onCancel
}: Props) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
      if (e.key === 'Enter') onConfirm();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onConfirm, onCancel]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/70 z-[100] flex items-center justify-center p-4"
      onClick={onCancel}>
      <div className="bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4"
        onClick={e => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            {danger && (
              <div className="w-10 h-10 rounded-full bg-red-900/40 flex items-center justify-center shrink-0">
                <AlertTriangle size={20} className="text-red-400" />
              </div>
            )}
            <h3 className="font-semibold text-white text-base">{title}</h3>
          </div>
          <button onClick={onCancel} className="text-gray-400 hover:text-white shrink-0">
            <X size={18} />
          </button>
        </div>
        <p className="text-sm text-gray-300 leading-relaxed">{message}</p>
        <div className="flex gap-3 pt-1">
          <button onClick={onCancel}
            className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 text-gray-300 text-sm font-medium rounded-lg hover:bg-gray-700 transition-colors">
            {cancelLabel}
          </button>
          <button onClick={onConfirm}
            className={`flex-1 px-4 py-2 text-white text-sm font-medium rounded-lg transition-colors ${
              danger ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'
            }`}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
