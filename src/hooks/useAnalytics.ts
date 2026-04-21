import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { config } from '../config/env';
import analytics from '../services/analytics';

// Hook to initialize and track page views
export const useAnalytics = () => {
  const location = useLocation();

  useEffect(() => {
    // Initialize GA on mount
    if (config.ENABLE_ANALYTICS) {
      analytics.initGA();
    }
  }, []);

  useEffect(() => {
    // Track page views on route change
    if (config.ENABLE_ANALYTICS) {
      analytics.trackPageView(location.pathname + location.search);
    }
  }, [location]);

  return {
    trackEvent: analytics.trackEvent,
    jobAnalytics: analytics.jobAnalytics,
    userAnalytics: analytics.userAnalytics,
    companyAnalytics: analytics.companyAnalytics,
    featureAnalytics: analytics.featureAnalytics,
    errorAnalytics: analytics.errorAnalytics,
    performanceAnalytics: analytics.performanceAnalytics,
  };
};