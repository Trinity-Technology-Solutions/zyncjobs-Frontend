import { useState, useCallback } from 'react';

interface AlertState {
  isOpen: boolean;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
}

export const useAlert = () => {
  const [alert, setAlert] = useState<AlertState>({
    isOpen: false,
    title: '',
    message: '',
    type: 'info',
  });

  const showAlert = useCallback((message: string, title = 'Notice', type: AlertState['type'] = 'info') => {
    setAlert({ isOpen: true, title, message, type });
  }, []);

  const hideAlert = useCallback(() => {
    setAlert(a => ({ ...a, isOpen: false }));
  }, []);

  return { alert, showAlert, hideAlert };
};
