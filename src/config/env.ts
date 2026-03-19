// Environment Configuration
// Only non-sensitive frontend configuration

export const config = {
  // API Configuration - Use Trinity Jobs Render endpoint
  API_URL: import.meta.env.VITE_API_URL || '/api',
  
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

// API Endpoints
export const API_ENDPOINTS = {
  // Base URL
  BASE_URL: config.API_URL.replace(/\/$/, ''),
  
  // Auth
  LOGIN: `${config.API_URL}/users/login`,
  REGISTER: `${config.API_URL}/users/register`,
  LOGOUT: `${config.API_URL}/users/logout`,
  REFRESH_TOKEN: `${config.API_URL}/users/refresh`,
  
  // Jobs
  JOBS: `${config.API_URL}/jobs`,
  SEARCH: `${config.API_URL}/search`,
  
  // Applications
  APPLICATIONS: `${config.API_URL}/applications`,
  
  // Companies
  COMPANIES: `${config.API_URL}/companies`,
  
  // Chat
  CHAT: `${config.API_URL}/chat`,
  
  // AI Features
  GENERATE_JOB_DESCRIPTION: `${config.API_URL}/generate-job-description`,
  SUGGEST_JOB_TITLES: `${config.API_URL}/suggest-job-titles`,
  SUGGEST_LOCATIONS: `${config.API_URL}/suggest-locations`,
  
  // Meetings
  MEETINGS: `${config.API_URL}/meetings`,
  
  // Interviews
  INTERVIEWS: `${config.API_URL}/interviews`,
  
  // User
  PROFILE: `${config.API_URL}/profile`,
  USERS: `${config.API_URL}/users`,
  
  // Resume Viewer
  RESUME_VIEWER: `${config.API_URL}/resume-viewer`,
  
  // Saved Candidates
  SAVED_CANDIDATES: `${config.API_URL}/saved-candidates`,

  // Notifications
  NOTIFICATIONS: `${config.API_URL}/notifications`,
  CANDIDATE_NOTIFICATIONS: `${config.API_URL}/notifications/candidate`,
};

// Legacy exports for backward compatibility
export const API_BASE_URL = config.API_URL;

export default config;

