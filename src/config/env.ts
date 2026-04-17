// Environment Configuration
// Only non-sensitive frontend configuration

export const config = {
  // API Configuration
  // For local dev: uses /api (proxied by Vite to qaapi backend)
  // For builds: set VITE_API_URL environment variable if needed
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
  FORGOT_PASSWORD: `${config.API_URL}/forgot-password`,
  RESET_PASSWORD: `${config.API_URL}/reset-password`,
  
  // Jobs
  JOBS: `${config.API_URL}/jobs`,
  SEARCH: `${config.API_URL}/search`,
  
  // Applications
  APPLICATIONS: `${config.API_URL}/applications`,
  
  // Companies
  COMPANIES: `${config.API_URL}/companies`,
  
  // Chat
  CHAT: `${config.API_URL}/chat`,
  MESSAGES: `${config.API_URL}/messages`,
  
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
  
  // Saved Jobs
  SAVED_JOBS: `${config.API_URL}/saved-jobs`,

  // Saved Candidates
  SAVED_CANDIDATES: `${config.API_URL}/saved-candidates`,

  // Candidate Credentialing
  CREDENTIALING: `${config.API_URL}/credentialing`,

  // Salary Insights
  SALARY_INSIGHTS: `${config.API_URL}/salary-insights`,

  // GDPR
  GDPR_CONSENT: `${config.API_URL}/gdpr/consent`,
  GDPR_PRIVACY_SETTINGS: `${config.API_URL}/gdpr/privacy-settings`,
  GDPR_DOWNLOAD_DATA: `${config.API_URL}/gdpr/download-data`,
  GDPR_DELETE_ACCOUNT: `${config.API_URL}/gdpr/delete-account`,

  // Notifications
  NOTIFICATIONS: `${config.API_URL}/notifications`,
  CANDIDATE_NOTIFICATIONS: `${config.API_URL}/notifications/candidate`,

  // Admin
  ADMIN_OVERVIEW: `${config.API_URL}/admin/analytics/overview`,
  ADMIN_USER_GROWTH: `${config.API_URL}/admin/analytics/user-growth`,
  ADMIN_JOB_STATS: `${config.API_URL}/admin/analytics/job-stats`,
  ADMIN_APP_STATS: `${config.API_URL}/admin/analytics/application-stats`,
  ADMIN_TOP_COMPANIES: `${config.API_URL}/admin/analytics/top-companies`,
  ADMIN_TOP_ROLES: `${config.API_URL}/admin/analytics/top-roles`,
  ADMIN_USERS: `${config.API_URL}/admin/users`,
  ADMIN_JOBS_PENDING: `${config.API_URL}/admin/jobs/pending`,
  ADMIN_SETTINGS: `${config.API_URL}/admin/settings`,
  ADMIN_AUDIT: `${config.API_URL}/admin/audit`,
  ADMIN_NOTIFICATIONS_BROADCAST: `${config.API_URL}/admin/notifications/broadcast`,
  ADMIN_NOTIFICATIONS_QUEUE: `${config.API_URL}/admin/notifications/queue`,
  ADMIN_SYSTEM_HEALTH: `${config.API_URL}/admin/system/health`,
};

// Google OAuth base — strips /api suffix to get server root
export const GOOGLE_AUTH_BASE = config.API_URL.replace(/\/api\/?$/, '');

// Legacy exports for backward compatibility
export const API_BASE_URL = config.API_URL;

export default config;

