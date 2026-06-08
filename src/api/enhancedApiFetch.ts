/**
 * Enhanced apiFetch with comprehensive error handling for 500 errors
 */

import { tokenStorage } from '../utils/tokenStorage';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  message?: string;
  success?: boolean;
}

interface RetryConfig {
  maxRetries: number;
  retryDelay: number;
  retryOn5xx: boolean;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  retryDelay: 1000,
  retryOn5xx: true
};

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

  try {
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
  } catch (error) {
    console.error('Token refresh failed:', error);
    tokenStorage.clear();
    window.dispatchEvent(new CustomEvent('zync:logout'));
    return null;
  }
}

async function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function apiFetch(
  url: string, 
  options: RequestInit = {},
  retryConfig: Partial<RetryConfig> = {}
): Promise<Response> {
  const config = { ...DEFAULT_RETRY_CONFIG, ...retryConfig };
  const accessToken = tokenStorage.getAccess();

  // Inject Authorization header
  const headers = new Headers(options.headers || {});
  if (accessToken && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }

  const safeUrl = resolveSafeUrl(url);

  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      const response = await fetch(safeUrl, { ...options, headers });
      
      // Handle 5xx errors with retry logic
      if (response.status >= 500 && response.status < 600) {
        const errorText = await response.text().catch(() => 'Server Error');
        lastError = new Error(`Server error (${response.status}): ${errorText}`);
        
        // Don't retry on last attempt
        if (attempt < config.maxRetries && config.retryOn5xx) {
          console.warn(`Server error ${response.status}, retrying in ${config.retryDelay}ms (attempt ${attempt + 1}/${config.maxRetries + 1})`);
          await delay(config.retryDelay * (attempt + 1)); // Exponential backoff
          continue;
        }
        
        // Return error response for final attempt
        return new Response(JSON.stringify({ 
          error: 'Server temporarily unavailable',
          message: 'Please try again in a few moments',
          status: response.status
        }), {
          status: response.status,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // Handle 401 (token expired)
      if (response.status === 401) {
        const cloned = response.clone();
        let body: any = {};
        try { body = await cloned.json(); } catch { /* ignore */ }

        if (body?.code !== 'TOKEN_EXPIRED') return response;

        // Token refresh logic
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

        if (!newToken) return response;

        onRefreshed(newToken);
        headers.set('Authorization', `Bearer ${newToken}`);
        return fetch(safeUrl, { ...options, headers });
      }

      // Success - return response
      return response;
      
    } catch (error) {
      lastError = error as Error;
      
      // Network errors - retry if configured
      if (attempt < config.maxRetries) {
        console.warn(`Network error, retrying in ${config.retryDelay}ms (attempt ${attempt + 1}/${config.maxRetries + 1}):`, error);
        await delay(config.retryDelay * (attempt + 1));
        continue;
      }
    }
  }

  // All retries exhausted
  console.error(`API call failed after ${config.maxRetries + 1} attempts:`, lastError?.message?.replace(/[\r\n]/g, '') ?? 'Unknown error');
  return new Response(JSON.stringify({ 
    error: 'Network error',
    message: 'Unable to connect to server. Please check your connection and try again.',
    details: lastError?.message
  }), {
    status: 502,
    headers: { 'Content-Type': 'application/json' }
  });
}

// Convenience wrapper for JSON responses
export async function apiRequest<T = any>(
  url: string,
  options: RequestInit = {},
  retryConfig?: Partial<RetryConfig>
): Promise<ApiResponse<T>> {
  try {
    const response = await apiFetch(url, options, retryConfig);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      return {
        success: false,
        error: errorData.error || errorData.message || `HTTP ${response.status}`,
        data: undefined
      };
    }

    const data = await response.json();
    return {
      success: true,
      data,
      error: undefined
    };
  } catch (error) {
    return {
      success: false,
      error: (error as Error).message || 'Network error',
      data: undefined
    };
  }
}