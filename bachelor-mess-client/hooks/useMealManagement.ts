import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import mealService, {
  MealFilters,
  MealStats,
  MealEntry,
} from '../services/mealService';
import { useAuth } from '../context/AuthContext';

interface UseMealManagementReturn {
  // State
  meals: MealEntry[];
  mealStats: MealStats | null;
  filters: MealFilters;
  loading: boolean;
  refreshing: boolean;
  error: string | null;

  // Actions
  loadMeals: () => Promise<void>;
  loadMealStats: () => Promise<void>;
  refreshMeals: () => Promise<void>;
  updateFilters: (newFilters: MealFilters) => void;
  handleMealPress: (meal: MealEntry) => void;
  handleStatusUpdate: (
    mealId: string,
    status: 'approved' | 'rejected'
  ) => Promise<void>;
  handleDeleteMeal: (mealId: string) => Promise<void>;
  handleEditMeal: (mealId: string) => void;
  handleMealSubmitted: () => Promise<void>;

  // Computed
  isAdmin: boolean;
  hasMeals: boolean;
  pendingMealsCount: number;
}

export const useMealManagement = (): UseMealManagementReturn => {
  const { user } = useAuth();
  const [meals, setMeals] = useState<MealEntry[]>([]);
  const [mealStats, setMealStats] = useState<MealStats | null>(null);
  const [filters, setFilters] = useState<MealFilters>({
    status: 'approved',
    limit: 20,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFetchTime, setLastFetchTime] = useState<number>(0);

  const isAdmin = user?.role === 'admin';
  const useGroupApi =
    user?.role === 'admin' ||
    user?.role === 'member' ||
    user?.role === 'super_admin';

  const loadMeals = useCallback(
    async (forceRefresh = false) => {
      try {
        // Prevent excessive API calls - only fetch if forced or if last fetch was more than 30 seconds ago
        const now = Date.now();
        if (!forceRefresh && now - lastFetchTime < 30000) {
          return;
        }

        setLoading(true);
        setError(null);

        // Use getAllMeals for admin/member/super_admin (group or all), getUserMeals for others
        const response = useGroupApi
          ? await mealService.getAllMeals(filters)
          : await mealService.getUserMeals(filters);

        if (response.success && response.data) {
          // Handle both response structures: { meals, pagination } or direct array
          let mealsData: MealEntry[] = [];
          if (Array.isArray(response.data)) {
            mealsData = response.data as MealEntry[];
          } else if (response.data.meals && Array.isArray(response.data.meals)) {
            mealsData = response.data.meals as MealEntry[];
          } else if (response.data && typeof response.data === 'object') {
            // Fallback: try to extract meals from any structure
            mealsData = (response.data as { meals?: MealEntry[] }).meals || [];
          }

          // Ensure all meals have id field (transform _id to id if needed)
          type RawMeal = Partial<MealEntry> & { _id?: string };
          const transformedMeals: MealEntry[] = mealsData.map((meal: RawMeal) => ({
            id: meal.id || meal._id || '',
            userId: meal.userId ?? '',
            date: meal.date ?? new Date().toISOString().split('T')[0],
            breakfast: meal.breakfast ?? false,
            lunch: meal.lunch ?? false,
            dinner: meal.dinner ?? false,
            status: meal.status ?? 'pending',
            notes: meal.notes,
            approvedBy: meal.approvedBy,
            approvedAt: meal.approvedAt,
            createdAt: meal.createdAt ?? new Date().toISOString(),
            updatedAt: meal.updatedAt ?? new Date().toISOString(),
            totalMeals: meal.totalMeals,
            mealSummary: meal.mealSummary,
            approvalInfo: meal.approvalInfo,
          }));

          setMeals(transformedMeals);
          setLastFetchTime(now);
        } else {
          setError(response.message || response.error || 'Failed to load meals');
          setMeals([]);
        }
        } catch (error) {
          setError('Failed to load meals. Please try again.');
          setMeals([]);
        } finally {
        setLoading(false);
      }
    },
    [filters, lastFetchTime, useGroupApi]
  );

  const loadMealStats = useCallback(
    async (forceRefresh = false) => {
      try {
        // Prevent excessive API calls for stats
        const now = Date.now();
        if (!forceRefresh && now - lastFetchTime < 60000) {
          // 1 minute cache for stats
          return;
        }

        const response = await mealService.getUserMealStats();
        if (response.success && response.data) {
          setMealStats(response.data);
          setLastFetchTime(now);
        }
      } catch (error) {
        // Silently handle stats loading errors
      }
    },
    [lastFetchTime]
  );

  const refreshMeals = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      loadMeals(true), // Force refresh
      loadMealStats(true), // Force refresh
    ]);
    setRefreshing(false);
  }, [loadMeals, loadMealStats]);

  const updateFilters = useCallback((newFilters: MealFilters) => {
    setFilters(newFilters);
    // Reset last fetch time to allow immediate fetch with new filters
    setLastFetchTime(0);
  }, []);

  const handleMealPress = useCallback((meal: MealEntry) => {
    Alert.alert(
      'Meal Details',
      `Date: ${mealService.formatMealDate(meal.date)}\nStatus: ${
        meal.status
      }\n${meal.notes ? `Notes: ${meal.notes}` : ''}`
    );
  }, []);

  const handleStatusUpdate = useCallback(
    async (mealId: string, status: 'approved' | 'rejected') => {
      try {
        const response = await mealService.updateMealStatus(mealId, { status });
        if (response.success) {
          setMeals(prevMeals =>
            prevMeals.map(meal =>
              meal.id === mealId ? { ...meal, status } : meal
            )
          );
          Alert.alert('Success', `Meal ${status} successfully`);
          await loadMealStats(); // Refresh stats after status update
        } else {
          Alert.alert(
            'Error',
            response.message || 'Failed to update meal status'
          );
        }
      } catch (error) {
        Alert.alert('Error', 'Failed to update meal status');
      }
    },
    [loadMealStats]
  );

  const handleDeleteMeal = useCallback(
    async (mealId: string) => {
      Alert.alert('Delete Meal', 'Are you sure you want to delete this meal?', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await mealService.deleteMeal(mealId);
              if (response.success) {
                setMeals(prevMeals =>
                  prevMeals.filter(meal => meal.id !== mealId)
                );
                Alert.alert('Success', 'Meal deleted successfully');
                await loadMealStats(); // Refresh stats after deletion
              } else {
                Alert.alert(
                  'Error',
                  response.message || 'Failed to delete meal'
                );
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to delete meal');
            }
          },
        },
      ]);
    },
    [loadMealStats]
  );

  const handleEditMeal = useCallback((mealId: string) => {
    // Navigate to edit meal screen or open edit modal
    Alert.alert('Edit Meal', 'Edit functionality coming soon');
  }, []);

  const handleMealSubmitted = useCallback(async () => {
    await Promise.all([loadMeals(), loadMealStats()]);
  }, [loadMeals, loadMealStats]);

  // Load initial data - only run once on mount
  useEffect(() => {
    // Only load on initial mount, not on every refresh change
    const initialLoad = async () => {
      await Promise.all([
        loadMeals(true), // Force initial load
        loadMealStats(true), // Force initial load
      ]);
    };
    initialLoad();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array to run only once - loadMeals and loadMealStats are stable

  // Computed values
  const hasMeals = meals.length > 0;
  const pendingMealsCount = meals.filter(
    meal => meal.status === 'pending'
  ).length;

  return {
    // State
    meals,
    mealStats,
    filters,
    loading,
    refreshing,
    error,

    // Actions
    loadMeals,
    loadMealStats,
    refreshMeals,
    updateFilters,
    handleMealPress,
    handleStatusUpdate,
    handleDeleteMeal,
    handleEditMeal,
    handleMealSubmitted,

    // Computed
    isAdmin,
    hasMeals,
    pendingMealsCount,
  };
};
