/**
 * API Error Handler - Provides consistent error handling and fallback mechanisms
 */

export interface ApiError {
  status: number;
  message: string;
  details?: any;
}

export class ApiErrorHandler {
  static handleResponse(response: Response, data: any): ApiError | null {
    if (response.ok) return null;

    const error: ApiError = {
      status: response.status,
      message: this.getErrorMessage(response.status, data),
      details: data
    };

    console.error('API Error:', error);
    return error;
  }

  static getErrorMessage(status: number, data: any): string {
    // Check if server provided a specific error message
    if (data?.error) {
      // Handle specific AWS/server configuration errors
      if (data.error.includes('Missing credentials in config')) {
        return 'Server configuration issue: IAM role permissions need to be verified. Please contact support.';
      }
      if (data.error.includes('AWS_CONFIG_FILE')) {
        return 'Server configuration issue: IAM role is not properly configured. Please try again later.';
      }
      if (data.error.includes('S3') || data.error.includes('AWS')) {
        return 'File storage service is temporarily unavailable. Please try again later.';
      }
      if (data.error.includes('credentials') || data.error.includes('access')) {
        return 'Server permissions issue: File upload service needs configuration. Please contact support.';
      }
      return data.error;
    }
    if (data?.message) {
      if (data.message.includes('credentials') || data.message.includes('AWS') || data.message.includes('access')) {
        return 'File upload service is temporarily unavailable due to server configuration. Please try again later.';
      }
      return data.message;
    }

    // Default messages based on status code
    switch (status) {
      case 400:
        return 'Invalid request. Please check your input and try again.';
      case 401:
        return 'Authentication required. Please log in and try again.';
      case 403:
        return 'Access denied. You don\'t have permission to perform this action.';
      case 404:
        return 'The requested resource was not found.';
      case 413:
        return 'File too large. Please upload a smaller file.';
      case 415:
        return 'Unsupported file type. Please upload a PDF or DOC file.';
      case 429:
        return 'Too many requests. Please wait a moment and try again.';
      case 500:
        return 'Server error. Our team has been notified. Please try again later.';
      case 502:
      case 503:
      case 504:
        return 'Service temporarily unavailable. Please try again in a few minutes.';
      default:
        return `Unexpected error (${status}). Please try again.`;
    }
  }

  static isRetryableError(status: number): boolean {
    return [408, 429, 500, 502, 503, 504].includes(status);
  }

  static async retryRequest(
    requestFn: () => Promise<Response>,
    maxRetries: number = 3,
    delay: number = 1000
  ): Promise<Response> {
    let lastError: Error;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await requestFn();
        
        if (response.ok || !this.isRetryableError(response.status)) {
          return response;
        }

        if (attempt === maxRetries) {
          return response; // Return the last response even if it failed
        }

        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, delay * attempt));
      } catch (error) {
        lastError = error as Error;
        
        if (attempt === maxRetries) {
          throw lastError;
        }

        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, delay * attempt));
      }
    }

    throw lastError!;
  }
}

export default ApiErrorHandler;