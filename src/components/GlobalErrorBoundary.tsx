import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  isRetrying: boolean;
}

export class GlobalErrorBoundary extends Component<Props, State> {
  private retryCount = 0;
  private maxRetries = 3;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      isRetrying: false
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo
    });

    // Log error to monitoring service
    console.error('Global Error Boundary caught an error:', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString()
    });

    // Send to error tracking service (e.g., Sentry)
    if (window.Sentry) {
      window.Sentry.captureException(error, {
        contexts: {
          react: {
            componentStack: errorInfo.componentStack
          }
        }
      });
    }
  }

  handleRetry = async () => {
    if (this.retryCount >= this.maxRetries) {
      return;
    }

    this.setState({ isRetrying: true });
    this.retryCount++;

    // Wait a bit before retrying
    await new Promise(resolve => setTimeout(resolve, 1000));

    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      isRetrying: false
    });
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const isNetworkError = this.state.error?.message?.includes('fetch') ||
                            this.state.error?.message?.includes('Network');
      
      const isServerError = this.state.error?.message?.includes('500') ||
                           this.state.error?.message?.includes('502') ||
                           this.state.error?.message?.includes('503');

      return (
        <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-gray-900 rounded-xl border border-gray-800 p-6 text-center">
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-400" />
            </div>
            
            <h1 className="text-xl font-semibold text-white mb-2">
              {isNetworkError ? 'Connection Error' : 
               isServerError ? 'Server Error' : 
               'Something went wrong'}
            </h1>
            
            <p className="text-gray-400 text-sm mb-6">
              {isNetworkError ? 
                'Unable to connect to the server. Please check your internet connection.' :
               isServerError ?
                'Our servers are experiencing issues. Please try again in a few moments.' :
                'An unexpected error occurred. Our team has been notified.'}
            </p>

            <div className="space-y-3">
              {(isNetworkError || isServerError) && this.retryCount < this.maxRetries && (
                <button
                  onClick={this.handleRetry}
                  disabled={this.state.isRetrying}
                  className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  <RefreshCw className={`w-4 h-4 ${this.state.isRetrying ? 'animate-spin' : ''}`} />
                  {this.state.isRetrying ? 'Retrying...' : 'Try Again'}
                </button>
              )}
              
              <button
                onClick={this.handleGoHome}
                className="w-full flex items-center justify-center gap-2 bg-gray-800 hover:bg-gray-700 text-gray-300 px-4 py-2 rounded-lg transition-colors"
              >
                <Home className="w-4 h-4" />
                Go to Homepage
              </button>
            </div>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-6 text-left">
                <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-400">
                  Error Details (Development)
                </summary>
                <div className="mt-2 p-3 bg-gray-800 rounded text-xs text-red-400 font-mono overflow-auto max-h-32">
                  <div className="mb-2 font-semibold">Error:</div>
                  <div className="mb-2">{this.state.error.message}</div>
                  {this.state.error.stack && (
                    <>
                      <div className="mb-2 font-semibold">Stack:</div>
                      <pre className="whitespace-pre-wrap text-xs">
                        {this.state.error.stack}
                      </pre>
                    </>
                  )}
                </div>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Hook for handling async errors in functional components
export const useErrorHandler = () => {
  const handleError = (error: Error, errorInfo?: any) => {
    console.error('Async error caught:', error, errorInfo);
    
    // Trigger error boundary
    throw error;
  };

  return handleError;
};

// Global error event listener component
export const GlobalErrorListener: React.FC = () => {
  React.useEffect(() => {
    const handleApiError = (event: CustomEvent) => {
      const { message, shouldRetry, retryAfter } = event.detail;
      
      // Show toast notification or modal
      console.warn('API Error:', message);
      
      // You can integrate with your notification system here
      // e.g., toast.error(message);
    };

    window.addEventListener('zync:api-error', handleApiError as EventListener);
    
    return () => {
      window.removeEventListener('zync:api-error', handleApiError as EventListener);
    };
  }, []);

  return null;
};