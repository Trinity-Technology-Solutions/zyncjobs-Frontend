// Override window.alert and window.confirm BEFORE React mounts
const originalAlert = window.alert.bind(window);
const originalConfirm = window.confirm.bind(window);

window.alert = (message?: unknown) => {
  const msg = String(message ?? '');
  window.dispatchEvent(new CustomEvent('zync:alert', { detail: { message: msg } }));
};

// Returns a Promise<boolean> — callers must await it
// Falls back to native confirm if GlobalAlert isn't mounted yet
window.confirm = (message?: string): boolean => {
  const msg = String(message ?? '');
  // Check if GlobalAlert listener is ready
  const hasListener = (window as any).__zyncConfirmReady;
  if (!hasListener) return originalConfirm(msg);

  // Dispatch event; GlobalAlert resolves via __zyncConfirmResolve
  window.dispatchEvent(new CustomEvent('zync:confirm', { detail: { message: msg } }));
  // Return true as placeholder — async callers should use window.confirmAsync
  return true;
};

// Async version for code that can await
(window as any).confirmAsync = (message?: string): Promise<boolean> => {
  const msg = String(message ?? '');
  const hasListener = (window as any).__zyncConfirmReady;
  if (!hasListener) return Promise.resolve(originalConfirm(msg));

  return new Promise<boolean>((resolve) => {
    (window as any).__zyncConfirmResolve = resolve;
    window.dispatchEvent(new CustomEvent('zync:confirm', { detail: { message: msg } }));
  });
};

export { originalAlert, originalConfirm };
