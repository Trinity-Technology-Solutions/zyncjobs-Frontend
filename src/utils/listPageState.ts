// One-time session snapshot for list pages (LinkedIn-style state restore).
// A list page saves its filter state + scroll position when it unmounts (user
// navigates to a detail page), and restores it once when it mounts again (e.g.
// after pressing Back). The snapshot is consumed on restore so a fresh visit or
// refresh never resurrects stale filters.

import { useEffect, useRef } from 'react';

export interface PageSnapshot<T> {
  state: T;
  scrollY: number;
}

const getScrollY = () => (typeof window !== 'undefined' ? window.scrollY || 0 : 0);

export function savePageSnapshot<T>(key: string, state: T): void {
  try {
    sessionStorage.setItem(key, JSON.stringify({ state, scrollY: getScrollY() } as PageSnapshot<T>));
  } catch { /* ignore quota/private mode errors */ }
}

export function consumePageSnapshot<T>(key: string): PageSnapshot<T> | null {
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    sessionStorage.removeItem(key);
    return JSON.parse(raw) as PageSnapshot<T>;
  } catch {
    try { sessionStorage.removeItem(key); } catch { /* ignore */ }
    return null;
  }
}

// Restores one saved snapshot on mount, then saves the current state on every
// unmount. `applySnapshot` receives the restored state + scroll position.
export function usePageSnapshot<T>(
  key: string,
  applySnapshot: (state: T, scrollY: number) => void,
  getState: () => T,
): void {
  // Always read the latest state in the unmount cleanup (avoids stale closures)
  const getStateRef = useRef(getState);
  getStateRef.current = getState;

  useEffect(() => {
    const snap = consumePageSnapshot<T>(key);
    if (snap) applySnapshot(snap.state, snap.scrollY);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  useEffect(() => {
    return () => { savePageSnapshot(key, getStateRef.current()); };
  }, [key]);
}
