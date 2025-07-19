import { useState, useEffect, useCallback, useRef } from 'react';

interface UseApiDataOptions<T> {
  onSuccess?: (data: T) => void;
  onError?: (error: string) => void;
  autoFetch?: boolean;
  dependencies?: any[];
  cacheTime?: number;
  debounceTime?: number;
  retryOnError?: boolean;
  maxRetries?: number;
  retryDelay?: number;
  enableOfflineFallback?: boolean;
}

interface UseApiDataReturn<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  setData: (data: T | null) => void;
  isOffline: boolean;
  retryCount: number;
}

export function useApiData<T>(
  fetchFunction: () => Promise<{ success: boolean; data?: T; error?: string }>,
  options: UseApiDataOptions<T> = {}
): UseApiDataReturn<T> {
  const {
    onSuccess,
    onError,
    autoFetch = true,
    dependencies = [],
    cacheTime = 30000,
    debounceTime = 1000,
    retryOnError = true,
    maxRetries = 3,
    retryDelay = 2000,
    enableOfflineFallback = true,
  } = options;

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  const cacheRef = useRef<{ data: T | null; timestamp: number } | null>(null);
  const debounceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFetchingRef = useRef(false);
  const retryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Enhanced error handling with retry logic
  const handleError = useCallback(
    (errorMessage: string, shouldRetry: boolean = true) => {
      console.error('🚨 API Data Error:', errorMessage);

      setError(errorMessage);
      onError?.(errorMessage);

      // Check if error indicates offline status
      if (
        errorMessage.includes('offline') ||
        errorMessage.includes('connection')
      ) {
        setIsOffline(true);
      }

      // Retry logic
      if (shouldRetry && retryOnError && retryCount < maxRetries) {
        const delay = retryDelay * Math.pow(2, retryCount); // Exponential backoff
        console.log(
          `🔄 Retrying in ${delay}ms (${retryCount + 1}/${maxRetries})`
        );

        retryTimeoutRef.current = setTimeout(() => {
          setRetryCount(prev => prev + 1);
          fetchData();
        }, delay);
      }
    },
    [retryOnError, maxRetries, retryCount, retryDelay, onError]
  );

  const fetchData = useCallback(async () => {
    // Prevent multiple simultaneous requests
    if (isFetchingRef.current) {
      return;
    }

    // Check cache first
    if (
      cacheRef.current &&
      Date.now() - cacheRef.current.timestamp < cacheTime
    ) {
      setData(cacheRef.current.data);
      setError(null);
      setIsOffline(false);
      return;
    }

    isFetchingRef.current = true;
    setLoading(true);
    setError(null);
    setIsOffline(false);

    try {
      console.log('🌐 Fetching API data...');
      const response = await fetchFunction();

      if (response.success && response.data) {
        setData(response.data);
        setRetryCount(0); // Reset retry count on success

        // Cache the result
        cacheRef.current = {
          data: response.data,
          timestamp: Date.now(),
        };

        onSuccess?.(response.data);
        console.log('✅ API data fetched successfully');
      } else {
        const errorMessage = response.error || 'Failed to fetch data';
        handleError(errorMessage, true);
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'An error occurred';
      handleError(errorMessage, true);
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  }, [fetchFunction, onSuccess, cacheTime, handleError]);

  const debouncedFetchData = useCallback(() => {
    // Clear existing timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // Set new timeout
    debounceTimeoutRef.current = setTimeout(() => {
      fetchData();
    }, debounceTime);
  }, [fetchData, debounceTime]);

  // Manual refetch function
  const refetch = useCallback(async () => {
    // Clear cache to force fresh data
    cacheRef.current = null;
    setRetryCount(0);
    setError(null);
    setIsOffline(false);

    // Clear any pending retry
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
    }

    await fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (autoFetch) {
      debouncedFetchData();
    }

    // Cleanup timeouts on unmount
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, [debouncedFetchData, autoFetch, ...dependencies]);

  return {
    data,
    loading,
    error,
    refetch,
    setData,
    isOffline,
    retryCount,
  };
}

// Enhanced hook for offline-aware data fetching
export function useOfflineAwareApiData<T>(
  fetchFunction: () => Promise<{ success: boolean; data?: T; error?: string }>,
  options: UseApiDataOptions<T> = {}
) {
  const apiData = useApiData(fetchFunction, {
    ...options,
    enableOfflineFallback: true,
  });

  // Additional offline-specific functionality
  const retryWhenOnline = useCallback(async () => {
    if (apiData.isOffline) {
      console.log('📱 Waiting for connection to retry...');
      // This could be enhanced with network status listeners
    }
  }, [apiData.isOffline]);

  return {
    ...apiData,
    retryWhenOnline,
  };
}

// Hook for handling API responses with better error categorization
export function useApiResponse<T>() {
  const [response, setResponse] = useState<{
    success: boolean;
    data?: T;
    error?: string;
  } | null>(null);

  const handleResponse = useCallback((apiResponse: any) => {
    setResponse(apiResponse);

    if (!apiResponse.success) {
      console.error('❌ API Response Error:', apiResponse.error);
    }
  }, []);

  const clearResponse = useCallback(() => {
    setResponse(null);
  }, []);

  return {
    response,
    handleResponse,
    clearResponse,
    isSuccess: response?.success || false,
    data: response?.data,
    error: response?.error,
  };
}
