// Navigation helper utility for proper back navigation
export const navigationHelper = {
  // Go back to previous page using browser history
  goBack: () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      // Fallback to home if no history
      window.location.href = '/';
    }
  },

  // Go back with fallback page
  goBackWithFallback: (fallbackPage: string, onNavigate?: (page: string) => void) => {
    if (window.history.length > 1) {
      window.history.back();
    } else if (onNavigate) {
      onNavigate(fallbackPage);
    } else {
      window.location.href = '/';
    }
  },

  // Check if we can go back
  canGoBack: () => {
    return window.history.length > 1;
  },

  // Navigate to specific page
  navigateTo: (page: string, onNavigate?: (page: string, data?: any) => void, data?: any) => {
    if (onNavigate) {
      onNavigate(page, data);
    } else {
      window.location.href = `/${page}`;
    }
  }
};