import { useState, useCallback } from 'react';
import { handleApiError, logError, ApiError } from '../utils/errorHandler';

interface UseErrorHandlerReturn {
  error: ApiError | null;
  isLoading: boolean;
  clearError: () => void;
  handleError: (error: any, context?: string) => void;
  executeAsync: <T>(asyncFn: () => Promise<T>, context?: string) => Promise<T | null>;
}

export const useErrorHandler = (initialLoading = false): UseErrorHandlerReturn => {
  const [error, setError] = useState<ApiError | null>(null);
  const [isLoading, setIsLoading] = useState(initialLoading);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const handleError = useCallback((error: any, context?: string) => {
    const apiError = handleApiError(error);
    setError(apiError);
    logError(apiError, context);
  }, []);

  const executeAsync = useCallback(async <T>(
    asyncFn: () => Promise<T>,
    context?: string
  ): Promise<T | null> => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await asyncFn();
      return result;
    } catch (error) {
      handleError(error, context);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [handleError]);

  return {
    error,
    isLoading,
    clearError,
    handleError,
    executeAsync
  };
};