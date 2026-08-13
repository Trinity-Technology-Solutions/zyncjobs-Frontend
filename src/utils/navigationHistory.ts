// Session-based in-app navigation history.
// Tracks the previous in-app route (pathname + search) so the BackButton can
// deterministically return to the page the user actually came from, even after
// a refresh. Unlike window.history, this never includes pages from before the
// app loaded (external sites, Google search, etc.), so Back never leaves the app.

const KEY = 'zync:nav:previous';

export const getPreviousPath = (): string | null => {
  try { return sessionStorage.getItem(KEY); } catch { return null; }
};

export const setPreviousPath = (path: string): void => {
  try { sessionStorage.setItem(KEY, path); } catch { /* ignore */ }
};

export const clearPreviousPath = (): void => {
  try { sessionStorage.removeItem(KEY); } catch { /* ignore */ }
};
