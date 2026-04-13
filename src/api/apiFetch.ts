/**
 * apiFetch — drop-in replacement for fetch() that auto-refreshes
 * the access token when the backend returns 401 + TOKEN_EXPIRED.
 *
 * Usage:  import { apiFetch } from '../api/apiFetch';
 *         const res = await apiFetch('/api/jobs', { headers: {...} });
 */

import { tokenStorage } from '../utils/tokenStorage';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

let isRefreshing = false;
let refreshQueue: Array<(token: string) => void> = [];

function onRefreshed(newToken: string) {
  refreshQueue.forEach(cb => cb(newToken));
  refreshQueue = [];
}

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = tokenStorage.getRefresh();
  if (!refreshToken) return null;

  const res = await fetch(`${API_BASE}/token/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });

  if (!res.ok) {
    tokenStorage.clear();
    window.dispatchEvent(new CustomEvent('zync:logout'));
    return null;
  }

  const data = await res.json();
  tokenStorage.setAccess(data.accessToken);
  if (data.refreshToken) tokenStorage.setRefresh(data.refreshToken);

  return data.accessToken;
}

export async function apiFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const accessToken = tokenStorage.getAccess();

  // Inject Authorization header
  const headers = new Headers(options.headers || {});
  if (accessToken && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }

  const response = await fetch(url, { ...options, headers });

  // Not expired — return as-is
  if (response.status !== 401) return response;

  // Check if it's a TOKEN_EXPIRED error
  const cloned = response.clone();
  let body: any = {};
  try { body = await cloned.json(); } catch { /* ignore */ }

  if (body?.code !== 'TOKEN_EXPIRED') return response;

  // Only one refresh at a time
  if (isRefreshing) {
    return new Promise(resolve => {
      refreshQueue.push(async (newToken: string) => {
        headers.set('Authorization', `Bearer ${newToken}`);
        resolve(fetch(url, { ...options, headers }));
      });
    });
  }

  isRefreshing = true;
  const newToken = await refreshAccessToken();
  isRefreshing = false;

  if (!newToken) {
    // Return original 401 — caller handles logout
    return response;
  }

  onRefreshed(newToken);

  // Retry original request with new token
  headers.set('Authorization', `Bearer ${newToken}`);
  return fetch(url, { ...options, headers });
}
