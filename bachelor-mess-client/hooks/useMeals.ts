import {
  MealEntry,
  MealFilters,
  mealService,
  MealStats,
  MealSubmission,
} from '@/services';
import { useCallback, useEffect, useState } from 'react';
import { Alert } from 'react-native';

export interface UseMealsReturn {
  // Data
  meals: MealEntry[];
  recentMeals: MealEntry[];
  mealStats: MealStats | null;
  loading: boolean;
  error: string | null;

  // Actions
  submitMeal: (data: MealSubmission) => Promise<boolean>;
  getUserMeals: (filters?: MealFilters) => Promise<void>;
  getAllMeals: (filters?: MealFilters) => Promise<void>;
  updateMealStatus: (
    mealId: string,
    status: 'approved' | 'rejected',
    notes?: string
  ) => Promise<boolean>;
  getMealStats: (filters?: MealFilters) => Promise<void>;

  // Convenience methods
  getTodayMeals: () => Promise<void>;
  getWeekMeals: () => Promise<void>;
  getPendingMeals: () => Promise<void>;
  getApprovedMeals: () => Promise<void>;

  // Refresh
  refresh: () => Promise<void>;
  clearError: () => void;
}

export const useMeals = (): UseMealsReturn => {
  const [meals, setMeals] = useState<MealEntry[]>([]);
  const [recentMeals, setRecentMeals] = useState<MealEntry[]>([]);
  const [mealStats, setMealStats] = useState<MealStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const submitMeal = useCallback(
    async (data: MealSubmission): Promise<boolean> => {
      setLoading(true);
      setError(null);

      try {
        const response = await mealService.submitMeal(data);

        if (response.success && response.data) {
          // Add to recent meals
          setRecentMeals(prev => [response.data!, ...prev.slice(0, 9)]);

          // Refresh stats
          await getMealStats();

          Alert.alert('Success', 'Meal entry submitted successfully!');
          return true;
        } else {
          setError(response.error || 'Failed to submit meal');
          Alert.alert('Error', response.error || 'Failed to submit meal');
          return false;
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to submit meal';
        setError(errorMessage);
        Alert.alert('Error', errorMessage);
        return false;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const getUserMeals = useCallback(
    async (filters?: MealFilters): Promise<void> => {
      setLoading(true);
      setError(null);

      try {
        const response = await mealService.getUserMeals(filters);

        if (response.success && response.data) {
          setMeals(response.data);
          // Update recent meals with the first 10 entries
          setRecentMeals(response.data.slice(0, 10));
        } else {
          setError(response.error || 'Failed to fetch meals');
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to fetch meals';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const getAllMeals = useCallback(
    async (filters?: MealFilters): Promise<void> => {
      setLoading(true);
      setError(null);

      try {
        const response = await mealService.getAllMeals(filters);

        if (response.success && response.data) {
          setMeals(response.data);
          setRecentMeals(response.data.slice(0, 10));
        } else {
          setError(response.error || 'Failed to fetch all meals');
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to fetch all meals';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const updateMealStatus = useCallback(
    async (
      mealId: string,
      status: 'approved' | 'rejected',
      notes?: string
    ): Promise<boolean> => {
      setLoading(true);
      setError(null);

      try {
        const response = await mealService.updateMealStatus(mealId, {
          status,
          notes,
        });

        if (response.success && response.data) {
          // Update the meal in the list
          setMeals(prev =>
            prev.map(meal => (meal.id === mealId ? response.data! : meal))
          );
          setRecentMeals(prev =>
            prev.map(meal => (meal.id === mealId ? response.data! : meal))
          );

          Alert.alert('Success', `Meal ${status} successfully!`);
          return true;
        } else {
          setError(response.error || `Failed to ${status} meal`);
          Alert.alert('Error', response.error || `Failed to ${status} meal`);
          return false;
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : `Failed to ${status} meal`;
        setError(errorMessage);
        Alert.alert('Error', errorMessage);
        return false;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const getMealStats = useCallback(
    async (filters?: MealFilters): Promise<void> => {
      setLoading(true);
      setError(null);

      try {
        const response = await mealService.getMealStats(filters);

        if (response.success && response.data) {
          setMealStats(response.data);
        } else {
          setError(response.error || 'Failed to fetch meal statistics');
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : 'Failed to fetch meal statistics';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Convenience methods
  const getTodayMeals = useCallback(async (): Promise<void> => {
    const today = new Date().toISOString().split('T')[0];
    await getUserMeals({ startDate: today, endDate: today });
  }, [getUserMeals]);

  const getWeekMeals = useCallback(async (): Promise<void> => {
    const today = new Date();
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    await getUserMeals({
      startDate: weekAgo.toISOString().split('T')[0],
      endDate: today.toISOString().split('T')[0],
    });
  }, [getUserMeals]);

  const getPendingMeals = useCallback(async (): Promise<void> => {
    await getUserMeals({ status: 'pending' });
  }, [getUserMeals]);

  const getApprovedMeals = useCallback(async (): Promise<void> => {
    await getUserMeals({ status: 'approved' });
  }, [getUserMeals]);

  const refresh = useCallback(async (): Promise<void> => {
    await Promise.all([getUserMeals(), getMealStats()]);
  }, [getUserMeals, getMealStats]);

  // Initial load
  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    meals,
    recentMeals,
    mealStats,
    loading,
    error,
    submitMeal,
    getUserMeals,
    getAllMeals,
    updateMealStatus,
    getMealStats,
    getTodayMeals,
    getWeekMeals,
    getPendingMeals,
    getApprovedMeals,
    refresh,
    clearError,
  };
};
