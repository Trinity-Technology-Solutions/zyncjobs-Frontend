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

// Proactive token refresh: refresh 5 minutes before expiry
const TOKEN_REFRESH_BUFFER = 5 * 60 * 1000; // 5 minutes

function isTokenNearExpiry(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const expiry = payload.exp * 1000; // Convert to milliseconds
    return Date.now() + 5 * 60 * 1000 >= expiry; // 5 min buffer
  } catch {
    return true; // If can't parse, assume expired
  }
}

function onRefreshed(newToken: string) {
  refreshQueue.forEach(cb => cb(newToken));
  refreshQueue = [];
}

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = tokenStorage.getRefresh();

  try {
    console.log('Attempting token refresh...');
    // The backend reads the httpOnly refreshToken cookie first, so a refresh is
    // attempted even when no token is mirrored in storage (e.g. new tab / reload).
    const res = await fetch(`${API_BASE}/users/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: refreshToken ? JSON.stringify({ refreshToken }) : JSON.stringify({}),
      credentials: 'include',
    });

    if (!res.ok) {
      console.warn('Token refresh failed:', res.status, res.statusText);
      const errorText = await res.text().catch(() => 'Unknown error');
      console.warn('Token refresh error details:', errorText);
      tokenStorage.clear();
      window.dispatchEvent(new CustomEvent('zync:logout'));
      return null;
    }

    const data = await res.json();
    console.log('Token refresh successful');
    
    // Backend returns 'accessToken' (no refreshToken in response - handled via httpOnly cookies)
    const newAccessToken = data.accessToken;
    if (!newAccessToken) {
      console.error('No access token in refresh response:', data);
      tokenStorage.clear();
      window.dispatchEvent(new CustomEvent('zync:logout'));
      return null;
    }
    
    tokenStorage.setAccess(newAccessToken);
    return newAccessToken;
  } catch (error) {
    console.error('Token refresh error:', error);
    tokenStorage.clear();
    window.dispatchEvent(new CustomEvent('zync:logout'));
    return null;
  }
}

export async function apiFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const accessToken = tokenStorage.getAccess();

  // Proactive token refresh: refresh if token is near expiry (within 5 minutes)
  if (accessToken && isTokenNearExpiry(accessToken)) {
    console.log('Access token near expiry, proactively refreshing...');
    const newToken = await refreshAccessToken();
    if (newToken) {
      console.log('Proactively refreshed access token');
    }
  }

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

    console.warn('Received 401 response, attempting token refresh...');

    // Check if it's a TOKEN_EXPIRED error
    const cloned = response.clone();
    let body: any = {};
    try { body = await cloned.json(); } catch { /* ignore */ }

    // Always try refresh on 401 - don't rely on specific error codes
    if (!isRefreshing) {
      isRefreshing = true;
      const newToken = await refreshAccessToken();
      isRefreshing = false;
      
      if (newToken) {
        onRefreshed(newToken);
        headers.set('Authorization', `Bearer ${newToken}`);
        console.log('Retrying original request with new token');
        return fetch(safeUrl, { ...options, headers });
      }
    } else {
      // Wait for ongoing refresh
      return new Promise(resolve => {
        refreshQueue.push(async (newToken: string) => {
          headers.set('Authorization', `Bearer ${newToken}`);
          resolve(fetch(safeUrl, { ...options, headers }));
        });
      });
    }
    
    // Refresh failed — return original 401
    console.warn('Token refresh failed, user needs to re-login');
    return response;
  } catch (error) {
    console.warn(`Network error for ${url.replace(/[\r\n]/g, '')}:`, error);
    return new Response(JSON.stringify({ error: 'Network error' }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
