import React, { useState, useEffect } from 'react';
import ConfirmDialog from './ConfirmDialog';

interface AlertState {
  isOpen: boolean;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
}

interface ConfirmState {
  isOpen: boolean;
  message: string;
}

const getTypeFromMessage = (msg: string): { type: AlertState['type']; title: string } => {
  const m = msg.toLowerCase();
  if (m.includes('error') || m.includes('fail') || m.includes('invalid') || m.includes('wrong'))
    return { type: 'error', title: 'Error' };
  if (m.includes('success') || m.includes('saved') || m.includes('updated') || m.includes('created') || m.includes('sent'))
    return { type: 'success', title: 'Success' };
  if (m.includes('please') || m.includes('login') || m.includes('warning') || m.includes('required'))
    return { type: 'warning', title: 'Warning' };
  return { type: 'info', title: 'Notice' };
};

const GlobalAlert: React.FC = () => {
  const [alert, setAlert] = useState<AlertState>({ isOpen: false, title: 'Notice', message: '', type: 'info' });
  const [confirm, setConfirm] = useState<ConfirmState>({ isOpen: false, message: '' });

  useEffect(() => {
    // Mark GlobalAlert as ready for confirm overrides
    (window as any).__zyncConfirmReady = true;

    const alertHandler = (e: Event) => {
      const msg = (e as CustomEvent).detail?.message ?? '';
      const { type, title } = getTypeFromMessage(msg);
      setAlert({ isOpen: true, title, message: msg, type });
    };

    const confirmHandler = (e: Event) => {
      const msg = (e as CustomEvent).detail?.message ?? '';
      setConfirm({ isOpen: true, message: msg });
    };

    window.addEventListener('zync:alert', alertHandler);
    window.addEventListener('zync:confirm', confirmHandler);
    return () => {
      window.removeEventListener('zync:alert', alertHandler);
      window.removeEventListener('zync:confirm', confirmHandler);
      (window as any).__zyncConfirmReady = false;
    };
  }, []);

  const resolveConfirm = (result: boolean) => {
    setConfirm({ isOpen: false, message: '' });
    const resolve = (window as any).__zyncConfirmResolve;
    if (typeof resolve === 'function') {
      (window as any).__zyncConfirmResolve = null;
      resolve(result);
    }
  };

  const styles = alert.isOpen ? {
    info:    { bg: 'bg-blue-100',   icon: 'text-blue-600',   btn: 'bg-blue-600 hover:bg-blue-700' },
    warning: { bg: 'bg-orange-100', icon: 'text-orange-500', btn: 'bg-orange-500 hover:bg-orange-600' },
    error:   { bg: 'bg-red-100',    icon: 'text-red-600',    btn: 'bg-red-600 hover:bg-red-700' },
    success: { bg: 'bg-green-100',  icon: 'text-green-600',  btn: 'bg-green-600 hover:bg-green-700' },
  }[alert.type] : null;

  const icons: Record<AlertState['type'], React.ReactNode> = {
    info: <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 100 20A10 10 0 0012 2z" /></svg>,
    warning: <svg className="w-6 h-6 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /></svg>,
    error: <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M12 2a10 10 0 100 20A10 10 0 0012 2z" /></svg>,
    success: <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>,
  };

  const closeAlert = () => setAlert(a => ({ ...a, isOpen: false }));

  return (
    <>
      {/* Alert dialog */}
      {alert.isOpen && styles && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center">
          <div className="fixed inset-0 bg-black bg-opacity-40" onClick={closeAlert} />
          <div className="relative bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm mx-4 z-10">
            <div className="flex flex-col items-center text-center">
              <div className={`w-12 h-12 rounded-full ${styles.bg} flex items-center justify-center mb-4`}>
                {icons[alert.type]}
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{alert.title}</h3>
              <p className="text-sm text-gray-500 mb-6">{alert.message}</p>
              <button onClick={closeAlert} className={`w-full ${styles.btn} text-white py-2.5 rounded-xl font-medium transition-colors`}>
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm dialog */}
      <ConfirmDialog
        isOpen={confirm.isOpen}
        title="Confirm"
        message={confirm.message}
        confirmLabel="OK"
        cancelLabel="Cancel"
        variant="warning"
        onConfirm={() => resolveConfirm(true)}
        onCancel={() => resolveConfirm(false)}
      />
    </>
  );
};

export default GlobalAlert;
