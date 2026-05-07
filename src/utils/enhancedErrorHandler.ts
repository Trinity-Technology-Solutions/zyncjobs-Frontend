interface ApiError {
  isBackendDown: boolean;
  isNetworkError: boolean;
  isServerError: boolean;
  isClientError: boolean;
  message: string;
  status?: number;
  shouldRetry: boolean;
  retryAfter?: number;
}

export const handleApiError = (error: any, context?: string): ApiError => {
  const status = error?.status || error?.response?.status;
  
  // Network/Connection errors
  if (error?.message?.includes('Failed to fetch') || 
      error?.message?.includes('Network request failed') ||
      error?.name === 'NetworkError') {
    console.warn(`Network error${context ? ` (${context})` : ''}:`, error);
    return {
      isBackendDown: true,
      isNetworkError: true,
      isServerError: false,
      isClientError: false,
      message: 'Unable to connect to server. Please check your internet connection.',
      shouldRetry: true,
      retryAfter: 5000
    };
  }

  // 5xx Server errors
  if (status >= 500 && status < 600) {
    console.warn(`Server error ${status}${context ? ` (${context})` : ''}:`, error);
    return {
      isBackendDown: true,
      isNetworkError: false,
      isServerError: true,
      isClientError: false,
      message: getServerErrorMessage(status),
      status,
      shouldRetry: status !== 501, // Don't retry "Not Implemented"
      retryAfter: getRetryDelay(status)
    };
  }

  // 4xx Client errors
  if (status >= 400 && status < 500) {
    console.warn(`Client error ${status}${context ? ` (${context})` : ''}:`, error);
    return {
      isBackendDown: false,
      isNetworkError: false,
      isServerError: false,
      isClientError: true,
      message: getClientErrorMessage(status),
      status,
      shouldRetry: status === 429, // Only retry rate limits
      retryAfter: status === 429 ? 60000 : undefined
    };
  }

  // JSON parsing errors (likely server returning HTML error page)
  if (error?.message?.includes('Unexpected token') || 
      error?.message?.includes('JSON.parse')) {
    console.warn(`Invalid API response${context ? ` (${context})` : ''}:`, error);
    return {
      isBackendDown: true,
      isNetworkError: false,
      isServerError: true,
      isClientError: false,
      message: 'Server returned an invalid response. Please try again.',
      shouldRetry: true,
      retryAfter: 3000
    };
  }

  // Generic error
  return {
    isBackendDown: false,
    isNetworkError: false,
    isServerError: false,
    isClientError: false,
    message: error?.message || 'An unexpected error occurred',
    shouldRetry: false
  };
};

function getServerErrorMessage(status: number): string {
  switch (status) {
    case 500:
      return 'Internal server error. Our team has been notified.';
    case 502:
      return 'Service temporarily unavailable. Please try again in a moment.';
    case 503:
      return 'Service under maintenance. Please try again later.';
    case 504:
      return 'Request timeout. Please try again.';
    default:
      return 'Server error occurred. Please try again later.';
  }
}

function getClientErrorMessage(status: number): string {
  switch (status) {
    case 400:
      return 'Invalid request. Please check your input.';
    case 401:
      return 'Authentication required. Please log in again.';
    case 403:
      return 'Access denied. You don\'t have permission for this action.';
    case 404:
      return 'Resource not found.';
    case 429:
      return 'Too many requests. Please wait a moment before trying again.';
    default:
      return 'Request failed. Please try again.';
  }
}

function getRetryDelay(status: number): number {
  switch (status) {
    case 500:
    case 502:
      return 2000; // 2 seconds
    case 503:
      return 10000; // 10 seconds
    case 504:
      return 5000; // 5 seconds
    default:
      return 3000; // 3 seconds
  }
}

export const withErrorHandling = async <T>(
  apiCall: () => Promise<T>,
  fallback: T,
  context?: string
): Promise<T> => {
  try {
    return await apiCall();
  } catch (error) {
    const errorInfo = handleApiError(error, context);
    
    // Log error for monitoring
    console.error(`API Error${context ? ` (${context})` : ''}:`, {
      error: errorInfo,
      originalError: error,
      timestamp: new Date().toISOString()
    });

    // Return fallback for server/network errors
    if (errorInfo.isBackendDown || errorInfo.isNetworkError) {
      return fallback;
    }
    
    // Re-throw client errors
    throw error;
  }
};

// Global error handler for unhandled API errors
export const setupGlobalErrorHandler = () => {
  window.addEventListener('unhandledrejection', (event) => {
    const error = event.reason;
    const errorInfo = handleApiError(error, 'unhandled');
    
    if (errorInfo.isBackendDown) {
      console.warn('Unhandled API error detected:', errorInfo.message);
      
      // Show user-friendly notification
      window.dispatchEvent(new CustomEvent('zync:api-error', {
        detail: {
          message: errorInfo.message,
          shouldRetry: errorInfo.shouldRetry,
          retryAfter: errorInfo.retryAfter
        }
      }));
      
      // Prevent default error logging
      event.preventDefault();
    }
  });
};

// Utility to check if backend is healthy
export const checkBackendHealth = async (): Promise<boolean> => {
  try {
    const response = await fetch('/api/health', {
      method: 'GET',
      timeout: 5000
    } as any);
    return response.ok;
  } catch {
    return false;
  }
};