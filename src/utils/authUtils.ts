/**
 * Authentication utilities for consistent token handling across the application
 */

import { tokenStorage } from './tokenStorage';

/**
 * Get the current authentication token
 * @returns The access token or admin token, or null if not available
 */
export const getAuthToken = (): string | null => {
  return tokenStorage.getAccess() || tokenStorage.getAdmin();
};

/**
 * Get authentication headers for API requests
 * @returns Headers object with Authorization header if token is available
 */
export const getAuthHeaders = (): Record<string, string> => {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

/**
 * Get headers with Content-Type and Authorization
 * @param contentType - The content type (defaults to 'application/json')
 * @returns Headers object with Content-Type and Authorization if token is available
 */
export const getApiHeaders = (contentType: string = 'application/json'): Record<string, string> => {
  const token = getAuthToken();
  const headers: Record<string, string> = { 'Content-Type': contentType };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
};

/**
 * Check if user is authenticated
 * @returns true if user has a valid token
 */
export const isAuthenticated = (): boolean => {
  return !!getAuthToken();
};