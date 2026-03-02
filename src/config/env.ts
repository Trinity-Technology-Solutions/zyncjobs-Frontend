// Environment Configuration
// Only non-sensitive frontend configuration

// Debug: Log environment variables
console.log('🔧 VITE_API_URL:', import.meta.env.VITE_API_URL);
console.log('🔧 Environment:', import.meta.env.MODE);
console.log('🔧 All env vars:', import.meta.env);

export const config = {
  // API Configuration - Use Trinity Jobs Render endpoint
  API_URL: import.meta.env.VITE_API_URL || 'https://trinity-jobs.onrender.com',
  
  // App Configuration
  APP_NAME: import.meta.env.VITE_APP_NAME || 'ZyncJobs',
  APP_VERSION: import.meta.env.VITE_APP_VERSION || '1.0.0',
  
  // Feature Flags
  ENABLE_ANALYTICS: import.meta.env.VITE_ENABLE_ANALYTICS === 'true',
  ENABLE_CHAT: import.meta.env.VITE_ENABLE_CHAT !== 'false', // Default true
  ENABLE_AI_FEATURES: import.meta.env.VITE_ENABLE_AI_FEATURES !== 'false', // Default true
  
  // Environment
  IS_DEVELOPMENT: import.meta.env.DEV,
  IS_PRODUCTION: import.meta.env.PROD,
};

// Debug: Log final API URL
console.log('🌐 Final API_URL:', config.API_URL);

// API Endpoints
export const API_ENDPOINTS = {
  // Base URL
  BASE_URL: config.API_URL,
  
  // Auth
  LOGIN: `${config.API_URL}/api/users/login`,
  REGISTER: `${config.API_URL}/api/users/register`,
  LOGOUT: `${config.API_URL}/api/logout`,
  REFRESH_TOKEN: `${config.API_URL}/api/refresh-token`,
  
  // Jobs
  JOBS: `${config.API_URL}/api/jobs`,
  SEARCH: `${config.API_URL}/api/search`,
  
  // Applications
  APPLICATIONS: `${config.API_URL}/api/applications`,
  
  // Companies
  COMPANIES: `${config.API_URL}/api/companies`,
  
  // Chat
  CHAT: `${config.API_URL}/api/chat`,
  
  // AI Features
  GENERATE_JOB_DESCRIPTION: `${config.API_URL}/api/generate-job-description`,
  SUGGEST_JOB_TITLES: `${config.API_URL}/api/suggest-job-titles`,
  SUGGEST_LOCATIONS: `${config.API_URL}/api/suggest-locations`,
  
  // Meetings
  MEETINGS: `${config.API_URL}/api/meetings`,
  
  // Interviews
  INTERVIEWS: `${config.API_URL}/api/interviews`,
  
  // User
  PROFILE: `${config.API_URL}/api/profile`,
  USERS: `${config.API_URL}/api/users`,
};

// Legacy exports for backward compatibility
export const API_BASE_URL = config.API_URL;

export default config;