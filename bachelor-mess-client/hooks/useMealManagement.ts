import { useState, useEffect, useCallback, useRef } from 'react';
import { Alert } from 'react-native';
import httpClient from '../services/httpClient';
import mealService, {
  MealFilters,
  MealStats,
  MealEntry,
} from '../services/mealService';
import { useAuth } from '../context/AuthContext';

export type MealManagementShowAlert = (
  title: string,
  message: string,
  variant?: 'info' | 'success' | 'error' | 'warning'
) => void;

export interface UseMealManagementOptions {
  showAlert?: MealManagementShowAlert;
}

interface UseMealManagementReturn {
  // State
  meals: MealEntry[];
  mealStats: MealStats | null;
  filters: MealFilters;
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  selectedMeal: MealEntry | null;

  // Actions
  loadMeals: () => Promise<void>;
  loadMealStats: () => Promise<void>;
  refreshMeals: () => Promise<void>;
  updateFilters: (newFilters: MealFilters) => void;
  handleMealPress: (meal: MealEntry) => void;
  closeMealDetail: () => void;
  handleStatusUpdate: (
    mealId: string,
    status: 'approved' | 'rejected'
  ) => Promise<void>;
  handleDeleteMeal: (mealId: string, meal?: MealEntry) => void;
  /** Delete without confirmation (e.g. for bulk delete after one confirmation). Own meal only. */
  deleteMealById: (mealId: string) => Promise<boolean>;
  /** Request deletion (admin only, for others' meals). No confirmation. */
  requestDeletionForMeal: (mealId: string) => Promise<boolean>;
  handleEditMeal: (mealId: string) => void;
  handleMealSubmitted: () => Promise<void>;

  // Computed
  isAdmin: boolean;
  hasMeals: boolean;
  pendingMealsCount: number;
}

export const useMealManagement = (
  options?: UseMealManagementOptions
): UseMealManagementReturn => {
  const { user } = useAuth();
  const showAlert = options?.showAlert;
  const alert = useCallback(
    (title: string, message: string, variant?: 'info' | 'success' | 'error' | 'warning') => {
      if (showAlert) showAlert(title, message, variant);
      else Alert.alert(title, message);
    },
    [showAlert]
  );
  const [meals, setMeals] = useState<MealEntry[]>([]);
  const [mealStats, setMealStats] = useState<MealStats | null>(null);
  const [filters, setFilters] = useState<MealFilters>({
    status: 'approved',
    limit: 20,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedMeal, setSelectedMeal] = useState<MealEntry | null>(null);
  const lastFetchTimeRef = useRef<number>(0);

  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';
  const useGroupApi =
    user?.role === 'admin' ||
    user?.role === 'member' ||
    user?.role === 'super_admin';

  const loadMeals = useCallback(
    async (forceRefresh = false) => {
      try {
        // Prevent excessive API calls - only fetch if forced or if last fetch was more than 30 seconds ago
        const now = Date.now();
        if (!forceRefresh && now - lastFetchTimeRef.current < 30000) {
          return;
        }

        setLoading(true);
        setError(null);

        const cacheOpt = forceRefresh ? { cache: false as const } : undefined;
        const response = useGroupApi
          ? await mealService.getAllMeals(filters, cacheOpt)
          : await mealService.getUserMeals(filters, cacheOpt);

        if (response.success && response.data) {
          // Handle both response structures: { meals, pagination } or direct array
          let mealsData: MealEntry[] = [];
          if (Array.isArray(response.data)) {
            mealsData = response.data as MealEntry[];
          } else if (
            response.data.meals &&
            Array.isArray(response.data.meals)
          ) {
            mealsData = response.data.meals as MealEntry[];
          } else if (response.data && typeof response.data === 'object') {
            // Fallback: try to extract meals from any structure
            mealsData = (response.data as { meals?: MealEntry[] }).meals || [];
          }

          // Ensure all meals have id field (transform _id to id if needed)
          type RawMeal = Partial<MealEntry> & { _id?: string; userId?: string | { _id?: string; name?: string; email?: string } };
          const transformedMeals: MealEntry[] = mealsData.map(
            (meal: RawMeal) => {
              const uid = meal?.userId;
              const userId: MealEntry['userId'] =
                typeof uid === 'object' && uid
                  ? { _id: uid._id ?? '', name: uid.name ?? '', email: uid.email ?? '' }
                  : (typeof uid === 'string' ? uid : '');
              return {
              id: meal.id || meal._id || '',
              userId,
              date: meal?.date ?? new Date().toISOString().split('T')[0],
              breakfast: meal?.breakfast ?? false,
              lunch: meal.lunch ?? false,
              dinner: meal?.dinner ?? false,
              status: meal?.status ?? 'pending',
              notes: meal?.notes ?? '',
              approvedBy: meal?.approvedBy ?? '',
              approvedAt: meal.approvedAt,
              createdAt: meal.createdAt ?? new Date().toISOString(),
              updatedAt: meal.updatedAt ?? new Date().toISOString(),
              totalMeals: meal?.totalMeals ?? 0,
              mealSummary: meal?.mealSummary ?? '',
              approvalInfo: meal?.approvalInfo ?? {
                status: '',
                message: '',
              },
              guestBreakfast: meal?.guestBreakfast ?? 0,
              guestLunch: meal?.guestLunch ?? 0,
              guestDinner: meal?.guestDinner ?? 0,
              totalGuestMeals: meal?.totalGuestMeals,
            };
            }
          );

          setMeals(transformedMeals);
          lastFetchTimeRef.current = now;
        } else {
          setError(
            response.message || response.error || 'Failed to load meals'
          );
          setMeals([]);
        }
      } catch (error) {
        setError('Failed to load meals. Please try again.');
        setMeals([]);
      } finally {
        setLoading(false);
      }
    },
    [filters, useGroupApi]
  );

  const loadMealStats = useCallback(
    async (forceRefresh = false) => {
      try {
        const now = Date.now();
        if (!forceRefresh && now - lastFetchTimeRef.current < 60000) {
          return;
        }

        const cacheOpt = forceRefresh ? { cache: false as const } : undefined;
        const response = await mealService.getUserMealStats(filters, cacheOpt);
        if (response.success && response.data) {
          setMealStats(response.data);
          lastFetchTimeRef.current = now;
        }
      } catch (error) {
        // Silently handle stats loading errors
      }
    },
    [filters]
  );

  const refreshMeals = useCallback(async () => {
    httpClient.clearOnlineCache();
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
    lastFetchTimeRef.current = 0;
  }, []);

  const handleMealPress = useCallback((meal: MealEntry) => {
    setSelectedMeal(meal);
  }, []);

  const closeMealDetail = useCallback(() => {
    setSelectedMeal(null);
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
          alert('Success', `Meal ${status} successfully`, 'success');
          await loadMealStats(); // Refresh stats after status update
        } else {
          alert(
            'Error',
            response.message || 'Failed to update meal status',
            'error'
          );
        }
      } catch {
        alert('Error', 'Failed to update meal status', 'error');
      }
    },
    [loadMealStats, alert]
  );

  const getMealOwnerLabel = useCallback((m?: MealEntry) => {
    if (!m?.userId) return null;
    if (typeof m.userId === 'object' && (m.userId.name || m.userId.email)) {
      return m.userId.name || m.userId.email;
    }
    return null;
  }, []);

  const getMealOwnerId = useCallback((m?: MealEntry) => {
    if (!m?.userId) return null;
    if (typeof m.userId === 'string') return m.userId;
    const u = m.userId as { _id?: string; id?: string };
    return u._id ?? u.id ?? null;
  }, []);

  const handleDeleteMeal = useCallback(
    (mealId: string, meal?: MealEntry) => {
      const id = (mealId && String(mealId).trim()) || '';
      if (!id) return;

      const ownerLabel = getMealOwnerLabel(meal);
      const dateLabel = meal?.date ? mealService.formatMealDate(meal.date) : '';
      const ownerId = getMealOwnerId(meal);
      const isOwnMeal = user?.id && ownerId && (String(user.id) === String(ownerId));

      if (isAdmin && !isOwnMeal && meal) {
        const title = `Request deletion of ${ownerLabel || 'this'}'s meal?`;
        const message = `A delete request will be sent to ${ownerLabel || 'the meal owner'}. The meal will only be removed after they confirm.`;
        Alert.alert(title, message, [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Request deletion',
            style: 'destructive',
            onPress: async () => {
              try {
                const response = await mealService.createMealDeleteRequest(id);
                if (response.success) {
                  if (showAlert) showAlert('Request sent', `${ownerLabel || 'The member'} will need to confirm to delete this meal.`, 'success');
                  else Alert.alert('Request sent', `${ownerLabel || 'The member'} will need to confirm to delete this meal.`);
                  try { await loadMeals(true); } catch { /* ignore */ }
                } else {
                  if (showAlert) showAlert('Error', response.message || response.error || 'Failed to send delete request', 'error');
                  else Alert.alert('Error', response.message || response.error || 'Failed to send delete request');
                }
              } catch {
                if (showAlert) showAlert('Error', 'Failed to send delete request', 'error');
                else Alert.alert('Error', 'Failed to send delete request');
              }
            },
          },
        ]);
        return;
      }

      const title = ownerLabel ? `Delete ${ownerLabel}'s meal record?` : 'Delete meal record?';
      const message = ownerLabel
        ? `This will permanently remove the meal record for ${dateLabel}. This action cannot be undone.`
        : dateLabel
          ? `Remove the meal for ${dateLabel}? This cannot be undone.`
          : 'Are you sure you want to delete this meal? This action cannot be undone.';

      Alert.alert(title, message, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await mealService.deleteMeal(id);
              if (response.success) {
                setMeals(prevMeals => prevMeals.filter(m => m.id !== id));
                if (showAlert) showAlert('Success', 'Meal deleted successfully', 'success');
                else Alert.alert('Success', 'Meal deleted successfully');
                try { await loadMealStats(); } catch { /* ignore */ }
              } else {
                if (showAlert) showAlert('Error', response.message || response.error || 'Failed to delete meal', 'error');
                else Alert.alert('Error', response.message || response.error || 'Failed to delete meal');
              }
            } catch {
              if (showAlert) showAlert('Error', 'Failed to delete meal', 'error');
              else Alert.alert('Error', 'Failed to delete meal');
            }
          },
        },
      ]);
    },
    [loadMealStats, loadMeals, showAlert, getMealOwnerLabel, getMealOwnerId, isAdmin, user?.id]
  );

  const deleteMealById = useCallback(
    async (mealId: string): Promise<boolean> => {
      const id = mealId && String(mealId).trim();
      if (!id) return false;
      try {
        const response = await mealService.deleteMeal(id);
        if (response.success) {
          setMeals(prev => prev.filter(m => m.id !== id));
          try {
            await loadMealStats();
          } catch {
            // Ignore refresh errors (e.g. unmounted)
          }
          return true;
        }
        return false;
      } catch {
        return false;
      }
    },
    [loadMealStats]
  );

  const requestDeletionForMeal = useCallback(
    async (mealId: string): Promise<boolean> => {
      const id = mealId && String(mealId).trim();
      if (!id) return false;
      try {
        const response = await mealService.createMealDeleteRequest(id);
        if (response.success) {
          try {
            await loadMeals(true);
          } catch {
            // Ignore refresh errors (e.g. unmounted)
          }
          return true;
        }
        return false;
      } catch {
        return false;
      }
    },
    [loadMeals]
  );

  const handleEditMeal = useCallback(
    (mealId: string) => {
      if (showAlert) showAlert('Edit Meal', 'Edit functionality coming soon', 'info');
      else Alert.alert('Edit Meal', 'Edit functionality coming soon');
    },
    [showAlert]
  );

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
    selectedMeal,

    // Actions
    loadMeals,
    loadMealStats,
    refreshMeals,
    updateFilters,
    handleMealPress,
    closeMealDetail,
    handleStatusUpdate,
    handleDeleteMeal,
    deleteMealById,
    requestDeletionForMeal,
    handleEditMeal,
    handleMealSubmitted,

    // Computed
    isAdmin,
    hasMeals,
    pendingMealsCount,
  };
};
