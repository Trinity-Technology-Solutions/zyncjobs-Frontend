import { useState, useCallback } from 'react';

export type ToastType = 'success' | 'error' | 'info';

interface Toast {
  type: ToastType;
  message: string;
  isVisible: boolean;
}

export function useToast() {
  const [toast, setToast] = useState<Toast>({ type: 'info', message: '', isVisible: false });

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    setToast({ type, message, isVisible: true });
  }, []);

  const hideToast = useCallback(() => {
    setToast(prev => ({ ...prev, isVisible: false }));
  }, []);

  return { toast, showToast, hideToast };
}
