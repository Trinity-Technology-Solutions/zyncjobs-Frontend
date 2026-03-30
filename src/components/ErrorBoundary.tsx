import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorId?: string;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorId: Math.random().toString(36).slice(2, 8).toUpperCase(),
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    if (import.meta.env.DEV) {
      console.error('Error caught by boundary:', error, errorInfo);
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorId: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
          <div className="text-center max-w-lg w-full">
            {/* Icon */}
            <div className="relative mb-8">
              <div className="text-[100px] font-black text-gray-100 leading-none select-none">500</div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="bg-gray-50 px-4">
                  <div className="text-5xl">⚠️</div>
                </div>
              </div>
            </div>

            <h1 className="text-2xl font-bold text-gray-900 mb-2">Something went wrong</h1>
            <p className="text-gray-500 mb-2">
              An unexpected error occurred. Our team has been notified.
            </p>

            {this.state.errorId && (
              <p className="text-xs text-gray-400 mb-8 font-mono bg-gray-100 inline-block px-3 py-1 rounded-full">
                Error ID: {this.state.errorId}
              </p>
            )}

            <div className="flex flex-wrap gap-3 justify-center mb-8">
              <button
                onClick={this.handleReset}
                className="bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 font-medium transition-colors"
              >
                🔄 Try Again
              </button>
              <button
                onClick={() => window.location.href = '/'}
                className="border border-gray-300 text-gray-700 px-6 py-2.5 rounded-lg hover:bg-gray-100 font-medium transition-colors"
              >
                🏠 Go Home
              </button>
              <button
                onClick={() => window.location.reload()}
                className="border border-gray-300 text-gray-700 px-6 py-2.5 rounded-lg hover:bg-gray-100 font-medium transition-colors"
              >
                ↺ Reload Page
              </button>
            </div>

            {import.meta.env.DEV && this.state.error && (
              <details className="text-left bg-red-50 border border-red-200 rounded-lg p-4 text-xs text-red-700 font-mono">
                <summary className="cursor-pointer font-semibold mb-2">Error Details (dev only)</summary>
                <pre className="whitespace-pre-wrap break-all">{this.state.error.message}</pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
