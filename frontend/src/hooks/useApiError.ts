import { useState, useCallback } from 'react';
import { extractErrorMessage } from '../utils/errorUtils';

interface UseApiErrorReturn {
  error: string | null;
  setError: (error: string | null) => void;
  handleError: (error: any) => void;
  clearError: () => void;
}

/**
 * Custom hook for handling API errors
 * Provides consistent error handling across the application
 */
export const useApiError = (): UseApiErrorReturn => {
  const [error, setError] = useState<string | null>(null);

  const handleError = useCallback((error: any) => {
    const errorMessage = extractErrorMessage(error);
    setError(errorMessage);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    error,
    setError,
    handleError,
    clearError,
  };
};

