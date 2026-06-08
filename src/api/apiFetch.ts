/**
 * apiFetch — drop-in replacement for fetch() that auto-refreshes
 * the access token when the backend returns 401 + TOKEN_EXPIRED.
 *
 * Usage:  import { apiFetch } from '../api/apiFetch';
 *         const res = await apiFetch('/api/jobs', { headers: {...} });
 */

import { tokenStorage } from '../utils/tokenStorage';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

function resolveSafeUrl(url: string): string {
  const base = (API_BASE.startsWith('http') ? API_BASE : window.location.origin + API_BASE).replace(/\/$/, '');
  const resolved = url.startsWith('/') ? window.location.origin + url : url;
  if (!resolved.replace(/\/$/, '').startsWith(base)) {
    throw new Error(`Blocked request to disallowed URL: ${url}`);
  }
  return resolved;
}

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

  const safeUrl = resolveSafeUrl(url);

  try {
    const response = await fetch(safeUrl, { ...options, headers });
    
    // Handle 502 errors gracefully
    if (response.status === 502) {
      console.warn(`Backend unavailable: ${url.replace(/[\r\n]/g, '')}`);
      return new Response(JSON.stringify({ error: 'Service temporarily unavailable' }), {
        status: 502,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Not expired — return as-is
    if (response.status !== 401) return response;

    // Check if it's a TOKEN_EXPIRED error
    const cloned = response.clone();
    let body: any = {};
    try { body = await cloned.json(); } catch { /* ignore */ }

    if (body?.code !== 'TOKEN_EXPIRED') {
      // Try a refresh anyway on any 401 — the server may not send TOKEN_EXPIRED code
      if (!isRefreshing) {
        isRefreshing = true;
        const newToken = await refreshAccessToken();
        isRefreshing = false;
        if (newToken) {
          onRefreshed(newToken);
          headers.set('Authorization', `Bearer ${newToken}`);
          return fetch(safeUrl, { ...options, headers });
        }
      }
      // Refresh failed or token truly invalid — force logout
      tokenStorage.clear();
      window.dispatchEvent(new CustomEvent('zync:logout'));
      return response;
    }

    // Only one refresh at a time
    if (isRefreshing) {
      return new Promise(resolve => {
        refreshQueue.push(async (newToken: string) => {
          headers.set('Authorization', `Bearer ${newToken}`);
          resolve(fetch(safeUrl, { ...options, headers }));
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
    return fetch(safeUrl, { ...options, headers });
  } catch (error) {
    console.warn(`Network error for ${url.replace(/[\r\n]/g, '')}:`, error);
    return new Response(JSON.stringify({ error: 'Network error' }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
