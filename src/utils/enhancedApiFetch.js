/**
 * Enhanced API fetch utility with better error handling for production
 */

import { tokenStorage } from '../utils/tokenStorage';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

// Enhanced error handling for API responses
const handleApiResponse = async (response, url) => {
  const contentType = response.headers.get('content-type');
  
  // Check if response is HTML (likely 404/error page)
  if (contentType && contentType.includes('text/html')) {
    console.error(`❌ API returned HTML instead of JSON for ${url}`);
    console.error(`Status: ${response.status} ${response.statusText}`);
    
    // Try to get error details from HTML
    const htmlText = await response.text();
    const titleMatch = htmlText.match(/<title>(.*?)<\/title>/i);
    const errorTitle = titleMatch ? titleMatch[1] : 'Unknown Error';
    
    throw new Error(`API Error: ${errorTitle} (${response.status})`);
  }
  
  // Handle non-JSON responses
  if (!contentType || !contentType.includes('application/json')) {
    const text = await response.text();
    console.error(`❌ API returned non-JSON response for ${url}:`, text.substring(0, 200));
    throw new Error(`Invalid API response format for ${url}`);
  }
  
  // Parse JSON response
  try {
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || data.message || `HTTP ${response.status}`);
    }
    
    return data;
  } catch (jsonError) {
    if (jsonError.name === 'SyntaxError') {
      console.error(`❌ JSON parse error for ${url}:`, jsonError.message);
      throw new Error(`Invalid JSON response from ${url}`);
    }
    throw jsonError;
  }
};

export async function apiFetch(url, options = {}) {
  const accessToken = tokenStorage.getAccess();

  // Inject Authorization header
  const headers = new Headers(options.headers || {});
  if (accessToken && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }

  // Add timeout for production
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

  try {
    const response = await fetch(url, { 
      ...options, 
      headers,
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    // Handle the response with enhanced error checking
    const data = await handleApiResponse(response, url);
    
    return { ok: true, data, status: response.status };
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error.name === 'AbortError') {
      console.error(`❌ API timeout for ${url}`);
      throw new Error(`Request timeout for ${url}`);
    }
    
    // Network errors
    if (error.message.includes('Failed to fetch')) {
      console.error(`❌ Network error for ${url}:`, error.message);
      throw new Error(`Network error: Unable to reach ${url}`);
    }
    
    throw error;
  }
}

// Specific API functions with better error handling
export const apiUtils = {
  async getJobs(params = {}) {
    try {
      const queryString = new URLSearchParams(params).toString();
      const url = `${API_BASE}/jobs${queryString ? `?${queryString}` : ''}`;
      const result = await apiFetch(url);
      return result.data;
    } catch (error) {
      console.error('❌ Error fetching jobs:', error.message);
      // Return empty array instead of throwing to prevent UI crashes
      return { jobs: [], total: 0, error: error.message };
    }
  },

  async getJobTitles() {
    try {
      const result = await apiFetch(`${API_BASE}/job-titles`);
      return result.data;
    } catch (error) {
      console.error('❌ Error fetching job titles:', error.message);
      return []; // Return empty array as fallback
    }
  },

  async getLocations() {
    try {
      const result = await apiFetch(`${API_BASE}/locations`);
      return result.data;
    } catch (error) {
      console.error('❌ Error fetching locations:', error.message);
      return []; // Return empty array as fallback
    }
  },

  async getPopularSearches() {
    try {
      const result = await apiFetch(`${API_BASE}/popular-searches`);
      return result.data;
    } catch (error) {
      console.error('❌ Error fetching popular searches:', error.message);
      return []; // Return empty array as fallback
    }
  },

  // Health check endpoint
  async healthCheck() {
    try {
      const result = await apiFetch(`${API_BASE}/health`);
      return { healthy: true, ...result.data };
    } catch (error) {
      console.error('❌ API health check failed:', error.message);
      return { healthy: false, error: error.message };
    }
  }
};

export default apiFetch;