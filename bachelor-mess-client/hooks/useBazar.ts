import {
  BazarEntry,
  BazarFilters,
  bazarService,
  BazarStats,
  BazarSubmission,
} from '@/services';
import { useCallback, useEffect, useState } from 'react';
import { Alert } from 'react-native';

export interface UseBazarReturn {
  // Data
  bazarEntries: BazarEntry[];
  recentBazarEntries: BazarEntry[];
  bazarStats: BazarStats | null;
  loading: boolean;
  error: string | null;

  // Actions
  submitBazar: (data: BazarSubmission) => Promise<boolean>;
  getUserBazarEntries: (filters?: BazarFilters) => Promise<void>;
  getAllBazarEntries: (filters?: BazarFilters) => Promise<void>;
  updateBazarStatus: (
    bazarId: string,
    status: 'approved' | 'rejected',
    notes?: string
  ) => Promise<boolean>;
  getBazarStats: (filters?: BazarFilters) => Promise<void>;
  uploadReceipt: (file: {
    uri: string;
    type: string;
    name: string;
  }) => Promise<string | null>;

  // Convenience methods
  getTodayBazarEntries: () => Promise<void>;
  getWeekBazarEntries: () => Promise<void>;
  getPendingBazarEntries: () => Promise<void>;
  getApprovedBazarEntries: () => Promise<void>;
  getMonthlyBazarEntries: () => Promise<void>;

  // Refresh
  refresh: () => Promise<void>;
  clearError: () => void;
}

export const useBazar = (): UseBazarReturn => {
  const [bazarEntries, setBazarEntries] = useState<BazarEntry[]>([]);
  const [recentBazarEntries, setRecentBazarEntries] = useState<BazarEntry[]>(
    []
  );
  const [bazarStats, setBazarStats] = useState<BazarStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const submitBazar = useCallback(
    async (data: BazarSubmission): Promise<boolean> => {
      setLoading(true);
      setError(null);

      try {
        const response = await bazarService.submitBazar(data);

        if (response.success && response.data) {
          // Add to recent entries
          setRecentBazarEntries(prev => [response.data!, ...prev.slice(0, 9)]);

          // Refresh stats
          await getBazarStats();

          Alert.alert('Success', 'Bazar entry submitted successfully!');
          return true;
        } else {
          setError(response.error || 'Failed to submit bazar entry');
          Alert.alert(
            'Error',
            response.error || 'Failed to submit bazar entry'
          );
          return false;
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to submit bazar entry';
        setError(errorMessage);
        Alert.alert('Error', errorMessage);
        return false;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const getUserBazarEntries = useCallback(
    async (filters?: BazarFilters): Promise<void> => {
      setLoading(true);
      setError(null);

      try {
        const response = await bazarService.getUserBazarEntries(filters);

        if (response.success && response.data) {
          setBazarEntries(response.data);
          // Update recent entries with the first 10 entries
          setRecentBazarEntries(response.data.slice(0, 10));
        } else {
          setError(response.error || 'Failed to fetch bazar entries');
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to fetch bazar entries';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const getAllBazarEntries = useCallback(
    async (filters?: BazarFilters): Promise<void> => {
      setLoading(true);
      setError(null);

      try {
        const response = await bazarService.getAllBazarEntries(filters);

        if (response.success && response.data) {
          setBazarEntries(response.data);
          setRecentBazarEntries(response.data.slice(0, 10));
        } else {
          setError(response.error || 'Failed to fetch all bazar entries');
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : 'Failed to fetch all bazar entries';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const updateBazarStatus = useCallback(
    async (
      bazarId: string,
      status: 'approved' | 'rejected',
      notes?: string
    ): Promise<boolean> => {
      setLoading(true);
      setError(null);

      try {
        const response = await bazarService.updateBazarStatus(bazarId, {
          status,
          notes,
        });

        if (response.success && response.data) {
          // Update the entry in the list
          setBazarEntries(prev =>
            prev.map(entry => (entry.id === bazarId ? response.data! : entry))
          );
          setRecentBazarEntries(prev =>
            prev.map(entry => (entry.id === bazarId ? response.data! : entry))
          );

          Alert.alert('Success', `Bazar entry ${status} successfully!`);
          return true;
        } else {
          setError(response.error || `Failed to ${status} bazar entry`);
          Alert.alert(
            'Error',
            response.error || `Failed to ${status} bazar entry`
          );
          return false;
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : `Failed to ${status} bazar entry`;
        setError(errorMessage);
        Alert.alert('Error', errorMessage);
        return false;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const getBazarStats = useCallback(
    async (filters?: BazarFilters): Promise<void> => {
      setLoading(true);
      setError(null);

      try {
        const response = await bazarService.getBazarStats(filters);

        if (response.success && response.data) {
          setBazarStats(response.data);
        } else {
          setError(response.error || 'Failed to fetch bazar statistics');
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : 'Failed to fetch bazar statistics';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const uploadReceipt = useCallback(
    async (file: {
      uri: string;
      type: string;
      name: string;
    }): Promise<string | null> => {
      try {
        const response = await bazarService.uploadReceipt(file);

        if (response.success && response.data) {
          return response.data.url;
        } else {
          setError(response.error || 'Failed to upload receipt');
          Alert.alert('Error', response.error || 'Failed to upload receipt');
          return null;
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to upload receipt';
        setError(errorMessage);
        Alert.alert('Error', errorMessage);
        return null;
      }
    },
    []
  );

  // Convenience methods
  const getTodayBazarEntries = useCallback(async (): Promise<void> => {
    const today = new Date().toISOString().split('T')[0];
    await getUserBazarEntries({ startDate: today, endDate: today });
  }, [getUserBazarEntries]);

  const getWeekBazarEntries = useCallback(async (): Promise<void> => {
    const today = new Date();
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    await getUserBazarEntries({
      startDate: weekAgo.toISOString().split('T')[0],
      endDate: today.toISOString().split('T')[0],
    });
  }, [getUserBazarEntries]);

  const getPendingBazarEntries = useCallback(async (): Promise<void> => {
    await getUserBazarEntries({ status: 'pending' });
  }, [getUserBazarEntries]);

  const getApprovedBazarEntries = useCallback(async (): Promise<void> => {
    await getUserBazarEntries({ status: 'approved' });
  }, [getUserBazarEntries]);

  const getMonthlyBazarEntries = useCallback(async (): Promise<void> => {
    const today = new Date();
    const monthAgo = new Date(
      today.getFullYear(),
      today.getMonth() - 1,
      today.getDate()
    );
    await getUserBazarEntries({
      startDate: monthAgo.toISOString().split('T')[0],
      endDate: today.toISOString().split('T')[0],
    });
  }, [getUserBazarEntries]);

  const refresh = useCallback(async (): Promise<void> => {
    await Promise.all([getUserBazarEntries(), getBazarStats()]);
  }, [getUserBazarEntries, getBazarStats]);

  // Initial load
  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    bazarEntries,
    recentBazarEntries,
    bazarStats,
    loading,
    error,
    submitBazar,
    getUserBazarEntries,
    getAllBazarEntries,
    updateBazarStatus,
    getBazarStats,
    uploadReceipt,
    getTodayBazarEntries,
    getWeekBazarEntries,
    getPendingBazarEntries,
    getApprovedBazarEntries,
    getMonthlyBazarEntries,
    refresh,
    clearError,
  };
};
