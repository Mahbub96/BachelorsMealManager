import { useState, useEffect, useCallback, useRef } from 'react';
import {
  activityService,
  Activity,
  ActivityFilters,
  ActivityResponse,
  CurrentMonthMealsResponse,
} from '../services/activityService';

interface UseActivityOptions {
  autoFetch?: boolean;
  cacheKey?: string;
  refreshInterval?: number;
}

interface UseActivityReturn {
  // Data
  activities: Activity[];
  currentMonthMeals: CurrentMonthMealsResponse['meals'] | null;
  stats: ActivityResponse['stats'] | null;

  // Loading states
  loading: boolean;
  loadingMeals: boolean;
  loadingStats: boolean;

  // Error states
  error: string | null;
  errorMeals: string | null;
  errorStats: string | null;

  // Pagination
  pagination: ActivityResponse['pagination'] | null;
  mealsPagination: CurrentMonthMealsResponse['pagination'] | null;

  // Actions
  fetchActivities: (
    filters?: ActivityFilters,
    page?: number,
    limit?: number
  ) => Promise<void>;
  fetchCurrentMonthMeals: (
    status?: string,
    page?: number,
    limit?: number
  ) => Promise<void>;
  fetchStats: (filters?: ActivityFilters) => Promise<void>;
  refreshActivities: () => Promise<void>;
  refreshMeals: () => Promise<void>;
  clearError: () => void;
  clearErrorMeals: () => void;
  clearErrorStats: () => void;

  // Search and filter
  searchActivities: (query: string) => Promise<Activity[]>;
  setFilters: (filters: ActivityFilters) => void;
  currentFilters: ActivityFilters;
}

export const useActivity = (
  options: UseActivityOptions = {}
): UseActivityReturn => {
  const { autoFetch = true, cacheKey = 'default', refreshInterval } = options;

  // State
  const [activities, setActivities] = useState<Activity[]>([]);
  const [currentMonthMeals, setCurrentMonthMeals] = useState<
    CurrentMonthMealsResponse['meals'] | null
  >(null);
  const [stats, setStats] = useState<ActivityResponse['stats'] | null>(null);

  const [loading, setLoading] = useState(false);
  const [loadingMeals, setLoadingMeals] = useState(false);
  const [loadingStats, setLoadingStats] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [errorMeals, setErrorMeals] = useState<string | null>(null);
  const [errorStats, setErrorStats] = useState<string | null>(null);

  const [pagination, setPagination] = useState<
    ActivityResponse['pagination'] | null
  >(null);
  const [mealsPagination, setMealsPagination] = useState<
    CurrentMonthMealsResponse['pagination'] | null
  >(null);

  const [currentFilters, setCurrentFilters] = useState<ActivityFilters>({});

  // Refs for cleanup
  const refreshIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
    null
  );
  const mountedRef = useRef(true);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, []);

  // Set up refresh interval
  useEffect(() => {
    if (refreshInterval && refreshInterval > 0) {
      refreshIntervalRef.current = setInterval(() => {
        if (mountedRef.current) {
          fetchActivities(currentFilters);
        }
      }, refreshInterval);
    }

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [refreshInterval, currentFilters]);

  // Auto-fetch on mount
  useEffect(() => {
    if (autoFetch && mountedRef.current) {
      fetchActivities();
      fetchCurrentMonthMeals();
      fetchStats();
    }
  }, [autoFetch]);

  // Fetch activities
  const fetchActivities = useCallback(
    async (
      filters: ActivityFilters = {},
      page: number = 1,
      limit: number = 20
    ) => {
      if (!mountedRef.current) return;

      setLoading(true);
      setError(null);

      try {
        const response = await activityService.getRecentActivities(
          filters,
          page,
          limit
        );

        if (response.success && response.data) {
          setActivities(response.data.activities);
          setPagination(response.data.pagination);
          setStats(response.data.stats);
        } else {
          setError(response.error || 'Failed to fetch activities');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        if (mountedRef.current) {
          setLoading(false);
        }
      }
    },
    []
  );

  // Fetch current month meals
  const fetchCurrentMonthMeals = useCallback(
    async (status?: string, page: number = 1, limit: number = 50) => {
      if (!mountedRef.current) return;

      setLoadingMeals(true);
      setErrorMeals(null);

      try {
        const response = await activityService.getCurrentMonthMeals(
          status,
          page,
          limit
        );

        if (response.success && response.data) {
          setCurrentMonthMeals(response.data.meals);
          setMealsPagination(response.data.pagination);
        } else {
          setErrorMeals(
            response.error || 'Failed to fetch current month meals'
          );
        }
      } catch (err) {
        setErrorMeals(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        if (mountedRef.current) {
          setLoadingMeals(false);
        }
      }
    },
    []
  );

  // Fetch stats
  const fetchStats = useCallback(async (filters: ActivityFilters = {}) => {
    if (!mountedRef.current) return;

    setLoadingStats(true);
    setErrorStats(null);

    try {
      const response = await activityService.getActivityStats(filters);

      if (response.success && response.data) {
        setStats(response.data);
      } else {
        setErrorStats(response.error || 'Failed to fetch activity statistics');
      }
    } catch (err) {
      setErrorStats(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      if (mountedRef.current) {
        setLoadingStats(false);
      }
    }
  }, []);

  // Refresh activities
  const refreshActivities = useCallback(async () => {
    if (!mountedRef.current) return;

    setLoading(true);
    setError(null);

    try {
      const response = await activityService.refreshActivities();

      if (response.success && response.data) {
        setActivities(response.data.activities);
        setPagination(response.data.pagination);
        setStats(response.data.stats);
      } else {
        setError(response.error || 'Failed to refresh activities');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, []);

  // Refresh meals
  const refreshMeals = useCallback(async () => {
    if (!mountedRef.current) return;

    setLoadingMeals(true);
    setErrorMeals(null);

    try {
      const response = await activityService.getCurrentMonthMeals();

      if (response.success && response.data) {
        setCurrentMonthMeals(response.data.meals);
        setMealsPagination(response.data.pagination);
      } else {
        setErrorMeals(response.error || 'Failed to refresh meals');
      }
    } catch (err) {
      setErrorMeals(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      if (mountedRef.current) {
        setLoadingMeals(false);
      }
    }
  }, []);

  // Search activities
  const searchActivities = useCallback(
    async (query: string): Promise<Activity[]> => {
      try {
        const response = await activityService.searchActivities(query);

        if (response.success && response.data) {
          return response.data;
        } else {
          throw new Error(response.error || 'Search failed');
        }
      } catch (err) {
        throw new Error(err instanceof Error ? err.message : 'Search failed');
      }
    },
    []
  );

  // Set filters
  const setFilters = useCallback(
    (filters: ActivityFilters) => {
      setCurrentFilters(filters);
      fetchActivities(filters);
    },
    [fetchActivities]
  );

  // Clear errors
  const clearError = useCallback(() => setError(null), []);
  const clearErrorMeals = useCallback(() => setErrorMeals(null), []);
  const clearErrorStats = useCallback(() => setErrorStats(null), []);

  return {
    // Data
    activities,
    currentMonthMeals,
    stats,

    // Loading states
    loading,
    loadingMeals,
    loadingStats,

    // Error states
    error,
    errorMeals,
    errorStats,

    // Pagination
    pagination,
    mealsPagination,

    // Actions
    fetchActivities,
    fetchCurrentMonthMeals,
    fetchStats,
    refreshActivities,
    refreshMeals,
    clearError,
    clearErrorMeals,
    clearErrorStats,

    // Search and filter
    searchActivities,
    setFilters,
    currentFilters,
  };
};
