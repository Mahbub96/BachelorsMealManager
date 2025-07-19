import httpClient from '@/services/httpClient';
import offlineStorage from '@/services/offlineStorage';
import { useCallback, useEffect, useState } from 'react';
import { Alert } from 'react-native';

export interface OfflineStatus {
  isOnline: boolean;
  pendingCount: number;
  storageSize: number;
  isRetrying: boolean;
}

export interface UseOfflineReturn {
  // Status
  status: OfflineStatus;
  loading: boolean;
  error: string | null;

  // Actions
  retryPendingRequests: () => Promise<void>;
  clearAllOfflineRequests: () => Promise<void>;
  getOfflineStatus: () => Promise<void>;

  // Utilities
  isOnline: () => Promise<boolean>;
  getPendingCount: () => Promise<number>;
  getStorageSize: () => Promise<number>;

  // Refresh
  refresh: () => Promise<void>;
  clearError: () => void;
}

export const useOffline = (): UseOfflineReturn => {
  const [status, setStatus] = useState<OfflineStatus>({
    isOnline: true,
    pendingCount: 0,
    storageSize: 0,
    isRetrying: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const getOfflineStatus = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      const httpStatus = await httpClient.getOfflineStatus();
      setStatus(prev => ({
        ...prev,
        isOnline: httpStatus.isOnline,
        pendingCount: httpStatus.pendingCount,
        storageSize: httpStatus.storageSize,
      }));
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to get offline status';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const retryPendingRequests = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      setStatus(prev => ({ ...prev, isRetrying: true }));

      await httpClient.retryOfflineRequests();

      // Refresh status after retry
      await getOfflineStatus();

      Alert.alert('Success', 'Offline requests have been processed');
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to retry offline requests';
      setError(errorMessage);
      Alert.alert('Error', errorMessage);
    } finally {
      setStatus(prev => ({ ...prev, isRetrying: false }));
      setLoading(false);
    }
  }, [getOfflineStatus]);

  const clearAllOfflineRequests = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      await offlineStorage.clearAllRequests();
      await getOfflineStatus();

      Alert.alert('Success', 'All offline requests have been cleared');
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to clear offline requests';
      setError(errorMessage);
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  }, [getOfflineStatus]);

  const isOnline = useCallback(async (): Promise<boolean> => {
    try {
      return await offlineStorage.isOnline();
    } catch (err) {
      console.error('Error checking online status:', err);
      return false;
    }
  }, []);

  const getPendingCount = useCallback(async (): Promise<number> => {
    try {
      return await offlineStorage.getPendingCount();
    } catch (err) {
      console.error('Error getting pending count:', err);
      return 0;
    }
  }, []);

  const getStorageSize = useCallback(async (): Promise<number> => {
    try {
      return await offlineStorage.getStorageSize();
    } catch (err) {
      console.error('Error getting storage size:', err);
      return 0;
    }
  }, []);

  const refresh = useCallback(async (): Promise<void> => {
    await getOfflineStatus();
  }, [getOfflineStatus]);

  // Initial load
  useEffect(() => {
    refresh();
  }, [refresh]);

  // Set up periodic status refresh
  useEffect(() => {
    const interval = setInterval(() => {
      refresh();
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [refresh]);

  return {
    status,
    loading,
    error,
    retryPendingRequests,
    clearAllOfflineRequests,
    getOfflineStatus,
    isOnline,
    getPendingCount,
    getStorageSize,
    refresh,
    clearError,
  };
};
