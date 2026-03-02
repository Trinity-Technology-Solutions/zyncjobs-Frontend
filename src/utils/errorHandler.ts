export interface ApiError {
  message: string;
  status?: number;
  code?: string;
}

export class AppError extends Error {
  public status: number;
  public code?: string;

  constructor(message: string, status: number = 500, code?: string) {
    super(message);
    this.status = status;
    this.code = code;
    this.name = 'AppError';
  }
}

export const handleApiError = (error: any): ApiError => {
  // Network errors
  if (!error.response) {
    return {
      message: 'Network error. Please check your connection.',
      status: 0,
      code: 'NETWORK_ERROR'
    };
  }

  // Server errors
  const { status, data } = error.response;
  
  switch (status) {
    case 400:
      return {
        message: data?.error || 'Invalid request',
        status,
        code: 'BAD_REQUEST'
      };
    case 401:
      return {
        message: 'Please log in to continue',
        status,
        code: 'UNAUTHORIZED'
      };
    case 403:
      return {
        message: 'You don\'t have permission to access this resource',
        status,
        code: 'FORBIDDEN'
      };
    case 404:
      return {
        message: 'Resource not found',
        status,
        code: 'NOT_FOUND'
      };
    case 429:
      return {
        message: 'Too many requests. Please try again later.',
        status,
        code: 'RATE_LIMITED'
      };
    case 500:
      return {
        message: 'Server error. Please try again later.',
        status,
        code: 'SERVER_ERROR'
      };
    default:
      return {
        message: data?.error || 'Something went wrong',
        status,
        code: 'UNKNOWN_ERROR'
      };
  }
};

export const logError = (error: Error | ApiError, context?: string) => {
  const timestamp = new Date().toISOString();
  const errorInfo = {
    timestamp,
    context,
    message: error.message,
    stack: 'stack' in error ? error.stack : undefined,
    userAgent: navigator.userAgent,
    url: window.location.href
  };

  console.error('Error logged:', errorInfo);
  
  // In production, send to error tracking service
  if (process.env.NODE_ENV === 'production') {
    // Example: sendToErrorService(errorInfo);
  }
};