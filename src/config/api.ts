const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export const API_ENDPOINTS = {
  JOBS: `${API_BASE_URL}/jobs`,
  USERS: `${API_BASE_URL}/users`,
  APPLICATIONS: `${API_BASE_URL}/applications`,
  COMPANIES: `${API_BASE_URL}/companies`,
  AUTH: `${API_BASE_URL}/auth`,
  BASE_URL: API_BASE_URL
};