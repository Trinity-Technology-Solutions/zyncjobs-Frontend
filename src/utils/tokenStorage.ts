/**
 * tokenStorage — stores accessToken in localStorage so it survives
 * page refreshes in production (sessionStorage is cleared on refresh).
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

  // Refresh token — localStorage (long-lived) + sessionStorage mirror
  getRefresh: () => localStorage.getItem(REFRESH_KEY) || sessionStorage.getItem(REFRESH_KEY),
  setRefresh: (token: string) => {
    localStorage.setItem(REFRESH_KEY, token);
    sessionStorage.setItem(REFRESH_KEY, token);
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
