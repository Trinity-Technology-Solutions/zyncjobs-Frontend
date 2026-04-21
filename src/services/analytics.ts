// Google Analytics Service
// Provides methods to track events, page views, and user interactions

declare global {
  interface Window {
    gtag: (...args: any[]) => void;
    dataLayer: any[];
  }
}

export const GA_TRACKING_ID = 'G-0NM343KT24';

// Initialize Google Analytics
export const initGA = () => {
  if (typeof window === 'undefined') return;
  
  // Check if gtag is available
  if (typeof window.gtag === 'function') {
    window.gtag('config', GA_TRACKING_ID, {
      page_title: document.title,
      page_location: window.location.href,
    });
  }
};

// Track page views
export const trackPageView = (path: string, title?: string) => {
  if (typeof window === 'undefined' || typeof window.gtag !== 'function') return;
  
  window.gtag('config', GA_TRACKING_ID, {
    page_path: path,
    page_title: title || document.title,
  });
};

// Track custom events
export const trackEvent = (action: string, category: string, label?: string, value?: number) => {
  if (typeof window === 'undefined' || typeof window.gtag !== 'function') return;
  
  window.gtag('event', action, {
    event_category: category,
    event_label: label,
    value: value,
  });
};

// Job-specific tracking events
export const jobAnalytics = {
  // Track job search
  searchJobs: (searchTerm: string, filters?: any) => {
    trackEvent('search', 'jobs', searchTerm);
    if (filters) {
      trackEvent('filter_applied', 'jobs', JSON.stringify(filters));
    }
  },

  // Track job view
  viewJob: (jobId: string, jobTitle: string) => {
    trackEvent('view_item', 'jobs', `${jobTitle} (${jobId})`);
  },

  // Track job application
  applyToJob: (jobId: string, jobTitle: string) => {
    trackEvent('apply_job', 'jobs', `${jobTitle} (${jobId})`);
  },

  // Track job save
  saveJob: (jobId: string, jobTitle: string) => {
    trackEvent('save_job', 'jobs', `${jobTitle} (${jobId})`);
  },

  // Track job share
  shareJob: (jobId: string, platform: string) => {
    trackEvent('share', 'jobs', `${platform} - ${jobId}`);
  },
};

// User-specific tracking events
export const userAnalytics = {
  // Track user registration
  register: (userType: 'candidate' | 'employer') => {
    trackEvent('sign_up', 'user', userType);
  },

  // Track user login
  login: (userType: 'candidate' | 'employer') => {
    trackEvent('login', 'user', userType);
  },

  // Track profile completion
  completeProfile: (completionPercentage: number) => {
    trackEvent('profile_complete', 'user', 'completion', completionPercentage);
  },

  // Track resume upload
  uploadResume: () => {
    trackEvent('upload_resume', 'user', 'resume');
  },

  // Track skill assessment
  takeAssessment: (skillName: string) => {
    trackEvent('skill_assessment', 'user', skillName);
  },
};

// Company-specific tracking events
export const companyAnalytics = {
  // Track job posting
  postJob: (jobTitle: string, location: string) => {
    trackEvent('post_job', 'company', `${jobTitle} - ${location}`);
  },

  // Track candidate search
  searchCandidates: (searchTerm: string) => {
    trackEvent('search', 'candidates', searchTerm);
  },

  // Track candidate view
  viewCandidate: (candidateId: string) => {
    trackEvent('view_candidate', 'company', candidateId);
  },

  // Track interview scheduling
  scheduleInterview: (candidateId: string, jobId: string) => {
    trackEvent('schedule_interview', 'company', `${candidateId}-${jobId}`);
  },
};

// Feature usage tracking
export const featureAnalytics = {
  // Track AI features
  useAIRecommendations: (feature: string) => {
    trackEvent('ai_feature', 'engagement', feature);
  },

  // Track chat usage
  useChat: (context: string) => {
    trackEvent('chat_usage', 'engagement', context);
  },

  // Track filter usage
  useFilter: (filterType: string, filterValue: string) => {
    trackEvent('filter_usage', 'search', `${filterType}: ${filterValue}`);
  },

  // Track mobile app install prompt
  showInstallPrompt: () => {
    trackEvent('pwa_install_prompt', 'engagement', 'shown');
  },

  installPWA: () => {
    trackEvent('pwa_install', 'engagement', 'installed');
  },
};

// Error tracking
export const errorAnalytics = {
  // Track API errors
  apiError: (endpoint: string, statusCode: number) => {
    trackEvent('api_error', 'error', `${endpoint} - ${statusCode}`);
  },

  // Track JavaScript errors
  jsError: (error: string, component?: string) => {
    trackEvent('js_error', 'error', `${component || 'unknown'}: ${error}`);
  },

  // Track 404 errors
  pageNotFound: (path: string) => {
    trackEvent('404_error', 'error', path);
  },
};

// Performance tracking
export const performanceAnalytics = {
  // Track page load time
  pageLoadTime: (loadTime: number) => {
    trackEvent('page_load_time', 'performance', 'milliseconds', loadTime);
  },

  // Track search response time
  searchResponseTime: (responseTime: number) => {
    trackEvent('search_response_time', 'performance', 'milliseconds', responseTime);
  },
};

export default {
  initGA,
  trackPageView,
  trackEvent,
  jobAnalytics,
  userAnalytics,
  companyAnalytics,
  featureAnalytics,
  errorAnalytics,
  performanceAnalytics,
};