import { useState, useEffect, useCallback } from 'react';
import { AxiosError } from 'axios';

interface UseFetchState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

interface UseFetchReturn<T> extends UseFetchState<T> {
  refetch: () => Promise<void>;
}

/**
 * Hook for fetching data on mount with automatic loading states
 */
export function useFetch<T = any>(
  fetchFunction: () => Promise<any>,
  dependencies: any[] = []
): UseFetchReturn<T> {
  const [state, setState] = useState<UseFetchState<T>>({
    data: null,
    loading: true,
    error: null,
  });

  const fetchData = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const response = await fetchFunction();
      const data = response.data?.data || response.data;
      setState({ data, loading: false, error: null });
    } catch (err) {
      const error = err as AxiosError<{ error?: string }>;
      const errorMessage = error.response?.data?.error || 'Failed to fetch data';
      setState({ data: null, loading: false, error: errorMessage });
      console.error('Fetch error:', error);
    }
  }, [fetchFunction]);

  useEffect(() => {
    fetchData();
  }, dependencies);

  return {
    ...state,
    refetch: fetchData,
  };
}


