export const handleApiError = (error: any, context?: string) => {
  if (error?.message?.includes('502') || error?.status === 502) {
    console.warn(`Backend unavailable${context ? ` (${context})` : ''}`);
    return { isBackendDown: true, message: 'Service temporarily unavailable' };
  }
  
  if (error?.message?.includes('Unexpected token')) {
    console.warn(`Invalid API response${context ? ` (${context})` : ''}`);
    return { isBackendDown: true, message: 'Service temporarily unavailable' };
  }
  
  return { isBackendDown: false, message: error?.message || 'Unknown error' };
};

export const withErrorHandling = async <T>(
  apiCall: () => Promise<T>,
  fallback: T,
  context?: string
): Promise<T> => {
  try {
    return await apiCall();
  } catch (error) {
    const { isBackendDown } = handleApiError(error, context);
    if (isBackendDown) return fallback;
    throw error;
  }
};