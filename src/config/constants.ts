export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_URL || '/api',
  TIMEOUT: 10000,
  RETRY_ATTEMPTS: 3
};

// API endpoints helper
export const API_ENDPOINTS = {
  BASE_URL: API_CONFIG.BASE_URL,
  JOBS: `${API_CONFIG.BASE_URL}/jobs`,
  APPLICATIONS: `${API_CONFIG.BASE_URL}/applications`,
  USERS: `${API_CONFIG.BASE_URL}/users`,
  COMPANIES: `${API_CONFIG.BASE_URL}/companies`,
  TEST: `${API_CONFIG.BASE_URL}/test`
};

export const APP_CONFIG = {
  NAME: import.meta.env.VITE_APP_NAME || 'ZyncJobs',
  VERSION: import.meta.env.VITE_APP_VERSION || '1.0.0',
  FEATURES: {
    ANALYTICS: import.meta.env.VITE_ENABLE_ANALYTICS === 'true',
    CHAT: import.meta.env.VITE_ENABLE_CHAT === 'true',
    AI: import.meta.env.VITE_ENABLE_AI_FEATURES === 'true'
  }
};
