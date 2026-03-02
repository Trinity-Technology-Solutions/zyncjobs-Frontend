import { handleApiError, logError } from './errorHandler';
import { API_CONFIG } from '../config/constants';

const API_BASE_URL = `${API_CONFIG.BASE_URL}/api`;

interface RequestConfig {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  body?: any;
}

export const apiRequest = async <T>(
  endpoint: string,
  config: RequestConfig = {}
): Promise<T> => {
  const { method = 'GET', headers = {}, body } = config;
  
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw {
        response: {
          status: response.status,
          data: errorData
        }
      };
    }

    return await response.json();
  } catch (error) {
    logError(error as Error, `API request to ${endpoint}`);
    throw error;
  }
};

export const api = {
  get: <T>(endpoint: string, headers?: Record<string, string>) =>
    apiRequest<T>(endpoint, { method: 'GET', headers }),
  
  post: <T>(endpoint: string, body?: any, headers?: Record<string, string>) =>
    apiRequest<T>(endpoint, { method: 'POST', body, headers }),
  
  put: <T>(endpoint: string, body?: any, headers?: Record<string, string>) =>
    apiRequest<T>(endpoint, { method: 'PUT', body, headers }),
  
  delete: <T>(endpoint: string, headers?: Record<string, string>) =>
    apiRequest<T>(endpoint, { method: 'DELETE', headers }),
};