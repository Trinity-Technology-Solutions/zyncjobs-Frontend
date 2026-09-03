/**
 * tokenStorage — stores accessToken in localStorage so it survives
 * page refreshes in production (sessionStorage is cleared on refresh).
 *
 * SECURITY: the long-lived refresh token is NOT persisted to localStorage
 * (XSS-accessible). It lives only in sessionStorage (per-tab) and in the
 * backend httpOnly cookie, which is the durable source for refresh.
 */

// amazonq-ignore-next-line
const ACCESS_KEY = 'accessToken';
const REFRESH_KEY = 'refreshToken';
const ADMIN_KEY = 'adminToken';

export const tokenStorage = {
  // Access token — localStorage (persists across page refreshes)
  getAccess: () => localStorage.getItem(ACCESS_KEY) || sessionStorage.getItem(ACCESS_KEY),
  setAccess: (token: string) => {
    localStorage.setItem(ACCESS_KEY, token);
    sessionStorage.setItem(ACCESS_KEY, token);
  },

  // Refresh token — sessionStorage only (per-tab) + backend httpOnly cookie.
  // getRefresh still reads localStorage as a transitional fallback for sessions
  // created before this hardening; setRefresh removes the localStorage copy.
  getRefresh: () => sessionStorage.getItem(REFRESH_KEY) || localStorage.getItem(REFRESH_KEY),
  setRefresh: (token: string) => {
    sessionStorage.setItem(REFRESH_KEY, token);
    localStorage.removeItem(REFRESH_KEY);
  },

  // Admin token — sessionStorage only (admin sessions end on tab close)
  getAdmin: () => sessionStorage.getItem(ADMIN_KEY),
  setAdmin: (token: string) => sessionStorage.setItem(ADMIN_KEY, token),

  clear: () => {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem(ADMIN_KEY);
    localStorage.removeItem('token');
    sessionStorage.removeItem(ACCESS_KEY);
    sessionStorage.removeItem(ADMIN_KEY);
    sessionStorage.removeItem(REFRESH_KEY);
  },
};
