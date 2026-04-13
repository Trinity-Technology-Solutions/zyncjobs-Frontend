/**
     * tokenStorage — Hybrid token storage (industry standard).
 *
 * accessToken  → sessionStorage  (short-lived, XSS-safe, cleared on tab close)
 * refreshToken → localStorage    (long-lived, enables silent re-login on next visit)
 * adminToken   → sessionStorage  (admin sessions always end on tab close)
 *
 * This matches the approach used by LinkedIn, Google, etc.
 */

const ACCESS_KEY = 'accessToken';
const REFRESH_KEY = 'refreshToken';
const ADMIN_KEY = 'adminToken';

export const tokenStorage = {
  // Access token — sessionStorage only (short-lived, ~15min-1hr)
  getAccess: () => sessionStorage.getItem(ACCESS_KEY),
  setAccess: (token: string) => sessionStorage.setItem(ACCESS_KEY, token),

  // Refresh token — localStorage (long-lived, 7-30 days, enables auto re-login)
  getRefresh: () => localStorage.getItem(REFRESH_KEY),
  setRefresh: (token: string) => localStorage.setItem(REFRESH_KEY, token),

  // Admin token — sessionStorage only (admin sessions must end on tab close)
  getAdmin: () => sessionStorage.getItem(ADMIN_KEY),
  setAdmin: (token: string) => sessionStorage.setItem(ADMIN_KEY, token),

  clear: () => {
    sessionStorage.removeItem(ACCESS_KEY);
    sessionStorage.removeItem(ADMIN_KEY);
    localStorage.removeItem(REFRESH_KEY);
    // also clear any legacy keys
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(ADMIN_KEY);
    localStorage.removeItem('token');
    sessionStorage.removeItem(REFRESH_KEY);
  },
};
