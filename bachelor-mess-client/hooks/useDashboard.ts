import {
  Activity,
  AnalyticsData,
  CombinedDashboardData,
  DashboardFilters,
  dashboardService,
  DashboardStats,
} from '@/services';
import { useCallback, useEffect, useState } from 'react';

export interface UseDashboardReturn {
  // Data
  stats: DashboardStats | null;
  activities: Activity[];
  analytics: AnalyticsData | null;
  combinedData: CombinedDashboardData | null;
  loading: boolean;
  error: string | null;

  // Actions
  getStats: () => Promise<void>;
  getActivities: () => Promise<void>;
  getAnalytics: (filters?: DashboardFilters) => Promise<void>;
  getCombinedData: (filters?: DashboardFilters) => Promise<void>;
  getHealth: () => Promise<boolean>;

  // Convenience methods
  getWeeklyData: () => Promise<void>;
  getMonthlyData: () => Promise<void>;
  getYearlyData: () => Promise<void>;
  getMealDistribution: (timeframe?: string) => Promise<void>;
  getExpenseTrend: (timeframe?: string) => Promise<void>;
  getCategoryBreakdown: (timeframe?: string) => Promise<void>;

  // Refresh
  refresh: () => Promise<void>;
  clearError: () => void;
}

export const useDashboard = (): UseDashboardReturn => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [combinedData, setCombinedData] =
    useState<CombinedDashboardData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const getStats = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      const response = await dashboardService.getStats();

      if (response.success && response.data) {
        setStats(response.data);
      } else {
        setError(response.error || 'Failed to fetch dashboard stats');
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to fetch dashboard stats';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const getActivities = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      const response = await dashboardService.getActivities();

      if (response.success && response.data) {
        setActivities(response.data);
      } else {
        setError(response.error || 'Failed to fetch activities');
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to fetch activities';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const getAnalytics = useCallback(
    async (filters?: DashboardFilters): Promise<void> => {
      setLoading(true);
      setError(null);

      try {
        const response = await dashboardService.getAnalytics(filters);

        if (response.success && response.data) {
          setAnalytics(response.data);
        } else {
          setError(response.error || 'Failed to fetch analytics data');
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to fetch analytics data';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const getCombinedData = useCallback(
    async (filters?: DashboardFilters): Promise<void> => {
      setLoading(true);
      setError(null);

      try {
        const response = await dashboardService.getCombinedData(filters);

        if (response.success && response.data) {
          setCombinedData(response.data);
          // Also update individual data
          setStats(response.data.stats);
          setActivities(response.data.activities);
          setAnalytics(response.data.analytics);
        } else {
          setError(response.error || 'Failed to fetch combined dashboard data');
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : 'Failed to fetch combined dashboard data';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const getHealth = useCallback(async (): Promise<boolean> => {
    try {
      const response = await dashboardService.getHealth();
      return response.success;
    } catch (err) {
      console.error('Health check failed:', err);
      return false;
    }
  }, []);

  // Convenience methods
  const getWeeklyData = useCallback(async (): Promise<void> => {
    await getCombinedData({ timeframe: 'week' });
  }, [getCombinedData]);

  const getMonthlyData = useCallback(async (): Promise<void> => {
    await getCombinedData({ timeframe: 'month' });
  }, [getCombinedData]);

  const getYearlyData = useCallback(async (): Promise<void> => {
    await getCombinedData({ timeframe: 'year' });
  }, [getCombinedData]);

  const getMealDistribution = useCallback(
    async (timeframe: string = 'week'): Promise<void> => {
      setLoading(true);
      setError(null);

      try {
        const response = await dashboardService.getMealDistribution(timeframe);

        if (response.success && response.data) {
          // Update analytics with new meal distribution data
          setAnalytics(prev => {
            if (!prev) {
              // Create new analytics object if none exists
              return {
                mealDistribution: response.data || [],
                expenseTrend: [],
                categoryBreakdown: [],
                monthlyProgress: { current: 0, target: 100 },
              };
            }
            // Update existing analytics
            return { ...prev, mealDistribution: response.data || [] };
          });
        } else {
          setError(response.error || 'Failed to fetch meal distribution');
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : 'Failed to fetch meal distribution';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const getExpenseTrend = useCallback(
    async (timeframe: string = 'week'): Promise<void> => {
      setLoading(true);
      setError(null);

      try {
        const response = await dashboardService.getExpenseTrend(timeframe);

        if (response.success && response.data) {
          // Update analytics with new expense trend data
          setAnalytics(prev => {
            if (!prev) {
              // Create new analytics object if none exists
              return {
                mealDistribution: [],
                expenseTrend: response.data || [],
                categoryBreakdown: [],
                monthlyProgress: { current: 0, target: 100 },
              };
            }
            // Update existing analytics
            return { ...prev, expenseTrend: response.data || [] };
          });
        } else {
          setError(response.error || 'Failed to fetch expense trend');
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to fetch expense trend';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const getCategoryBreakdown = useCallback(
    async (timeframe: string = 'week'): Promise<void> => {
      setLoading(true);
      setError(null);

      try {
        const response = await dashboardService.getCategoryBreakdown(timeframe);

        if (response.success && response.data) {
          // Update analytics with new category breakdown data
          setAnalytics(prev => {
            if (!prev) {
              // Create new analytics object if none exists
              return {
                mealDistribution: [],
                expenseTrend: [],
                categoryBreakdown: response.data || [],
                monthlyProgress: { current: 0, target: 100 },
              };
            }
            // Update existing analytics
            return { ...prev, categoryBreakdown: response.data || [] };
          });
        } else {
          setError(response.error || 'Failed to fetch category breakdown');
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : 'Failed to fetch category breakdown';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const refresh = useCallback(async (): Promise<void> => {
    await Promise.all([getStats(), getActivities(), getAnalytics()]);
  }, [getStats, getActivities, getAnalytics]);

  // Initial load - only run once on mount
  useEffect(() => {
    // Only load on initial mount, not on every refresh change
    const initialLoad = async () => {
      await Promise.all([getStats(), getActivities(), getAnalytics()]);
    };
    initialLoad();
  }, []); // Empty dependency array to run only once

  return {
    stats,
    activities,
    analytics,
    combinedData,
    loading,
    error,
    getStats,
    getActivities,
    getAnalytics,
    getCombinedData,
    getHealth,
    getWeeklyData,
    getMonthlyData,
    getYearlyData,
    getMealDistribution,
    getExpenseTrend,
    getCategoryBreakdown,
    refresh,
    clearError,
  };
};
