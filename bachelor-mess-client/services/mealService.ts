import { API_ENDPOINTS, ApiResponse } from './config';
import httpClient from './httpClient';
import { formatMealDate as formatMealDateDisplay } from '../utils/dateUtils';

// Type definitions for meal management
export interface MealEntry {
  id: string;
  userId: string | { _id: string; name: string; email: string };
  date: string;
  breakfast: boolean;
  lunch: boolean;
  dinner: boolean;
  status: 'pending' | 'approved' | 'rejected';
  notes?: string;
  approvedBy?: string | { name: string };
  approvedAt?: string;
  createdAt: string;
  updatedAt: string;
  totalMeals?: number;
  mealSummary?: string;
  approvalInfo?: {
    status: string;
    message: string;
    approvedAt?: string;
    approvedBy?: string;
  };
  /** Optional guest meal counts (for tracking when member has guests) */
  guestBreakfast?: number;
  guestLunch?: number;
  guestDinner?: number;
  totalGuestMeals?: number;
}

export interface MealSubmission {
  breakfast: boolean;
  lunch: boolean;
  dinner: boolean;
  date: string;
  notes?: string;
  guestBreakfast?: number;
  guestLunch?: number;
  guestDinner?: number;
}

export interface MealUpdate {
  breakfast?: boolean;
  lunch?: boolean;
  dinner?: boolean;
  notes?: string;
  guestBreakfast?: number;
  guestLunch?: number;
  guestDinner?: number;
}

export interface MealStatusUpdate {
  status: 'approved' | 'rejected';
  notes?: string;
}

export interface MealFilters {
  startDate?: string;
  endDate?: string;
  status?: 'pending' | 'approved' | 'rejected';
  userId?: string;
  limit?: number;
  page?: number;
  /** When true, return only the current user's meals (for "existing meal" check). */
  onlyMine?: boolean;
}

export interface MealStats {
  totalMeals: number;
  totalBreakfast: number;
  totalLunch: number;
  totalDinner: number;
  pendingCount: number;
  approvedCount: number;
  rejectedCount: number;
  efficiency: number;
  averageMealsPerDay: number;
  lastUpdated: string;
}

export interface MealPagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface MealResponse {
  meals: MealEntry[];
  pagination: MealPagination;
}

export interface MealService {
  submitMeal: (data: MealSubmission) => Promise<ApiResponse<MealEntry>>;
  getUserMeals: (filters?: MealFilters) => Promise<ApiResponse<MealResponse>>;
  getAllMeals: (filters?: MealFilters) => Promise<ApiResponse<MealResponse>>;
  updateMealStatus: (
    mealId: string,
    status: MealStatusUpdate
  ) => Promise<ApiResponse<MealEntry>>;
  updateMeal: (
    mealId: string,
    data: MealUpdate
  ) => Promise<ApiResponse<MealEntry>>;
  deleteMeal: (mealId: string) => Promise<ApiResponse<void>>;
  getMealStats: (filters?: MealFilters) => Promise<ApiResponse<MealStats>>;
  getUserMealStats: (filters?: MealFilters) => Promise<ApiResponse<MealStats>>;
  getMealById: (mealId: string) => Promise<ApiResponse<MealEntry>>;
  bulkApproveMeals: (
    mealIds: string[],
    status: 'approved' | 'rejected',
    notes?: string
  ) => Promise<ApiResponse<{ updatedCount: number; totalRequested: number }>>;
}

// Meal service implementation
class MealServiceImpl implements MealService {
  async submitMeal(data: MealSubmission): Promise<ApiResponse<MealEntry>> {
    try {
      // Validate input
      if (!data.date) {
        return {
          success: false,
          error: 'Date is required',
        };
      }

      if (!data.breakfast && !data.lunch && !data.dinner) {
        return {
          success: false,
          error: 'Please select at least one meal',
        };
      }

      // Remove userId from data if present - backend should use authenticated user's ID from token
      // This prevents "userId already exists" errors when different users submit meals
      const { userId, user_id, ...rest } = data as unknown as Record<
        string,
        unknown
      > & { userId?: string; user_id?: string };
      // Sanitize optional guest counts for production (0–99)
      const clamp = (n: unknown) => Math.min(99, Math.max(0, Number(n) || 0));
      const mealData = {
        ...rest,
        guestBreakfast: rest.guestBreakfast !== undefined ? clamp(rest.guestBreakfast) : 0,
        guestLunch: rest.guestLunch !== undefined ? clamp(rest.guestLunch) : 0,
        guestDinner: rest.guestDinner !== undefined ? clamp(rest.guestDinner) : 0,
      };

      const response = await httpClient.post<MealEntry>(
        API_ENDPOINTS.MEALS.SUBMIT,
        mealData,
        { offlineFallback: true } // Enable offline fallback
      );

      // Clear cache after successful submission
      if (response.success) {
        await this.clearMealCache();
      }

      return response;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to submit meal',
      };
    }
  }

  async getUserMeals(
    filters: MealFilters = {}
  ): Promise<ApiResponse<MealResponse>> {
    try {
      const queryParams = this.buildQueryParams(filters);
      const endpoint = `${API_ENDPOINTS.MEALS.USER}${queryParams}`;

      const response = await httpClient.get<MealResponse>(endpoint, {
        cache: !filters.onlyMine,
        cacheKey: filters.onlyMine ? undefined : `user_meals_${JSON.stringify(filters)}`,
      });

      // Transform the response to match expected structure
      if (response.success && response.data) {
        const meals = response.data.meals || response.data;

        // Transform _id to id for each meal
        const transformedMeals = Array.isArray(meals)
          ? meals.map((meal: any) => ({
              ...meal,
              id: meal._id || meal.id,
            }))
          : meals;

        return {
          ...response,
          data: {
            meals: transformedMeals,
            pagination: response.data.pagination || {
              page: 1,
              limit: 20,
              total: transformedMeals?.length || 0,
              pages: 1,
            },
          },
        } as unknown as ApiResponse<MealResponse>;
      }

      return response;
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to fetch user meals',
      };
    }
  }

  async getAllMeals(
    filters: MealFilters = {}
  ): Promise<ApiResponse<MealResponse>> {
    try {
      const queryParams = this.buildQueryParams(filters);
      const endpoint = `${API_ENDPOINTS.MEALS.ALL}${queryParams}`;

      const response = await httpClient.get<MealResponse>(endpoint, {
        cache: true,
        cacheKey: `all_meals_${JSON.stringify(filters)}`,
      });

      // Transform the response to match expected structure
      if (response.success && response.data) {
        // Handle both { meals, pagination } structure and direct array
        let meals: MealEntry[] = [];
        let pagination: MealPagination | null = null;

        if (Array.isArray(response.data)) {
          meals = response.data as MealEntry[];
        } else if (response.data.meals && Array.isArray(response.data.meals)) {
          meals = response.data.meals as MealEntry[];
          pagination = response.data.pagination as MealPagination | null;
        } else {
          meals = [];
        }

        // Transform _id to id for each meal
        const transformedMeals: MealEntry[] = meals.map((meal: any) => ({
          ...meal,
          id: meal._id || meal.id,
        }));

        return {
          ...response,
          data: {
            meals: transformedMeals,
            pagination: pagination ||
              response.data.pagination || {
                page: 1,
                limit: filters.limit || 20,
                total: transformedMeals.length,
                pages: 1,
              },
          },
        } as unknown as ApiResponse<MealResponse>;
      }

      return response;
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to fetch all meals',
      };
    }
  }

  async updateMealStatus(
    mealId: string,
    status: MealStatusUpdate
  ): Promise<ApiResponse<MealEntry>> {
    try {
      const response = await httpClient.patch<MealEntry>(
        API_ENDPOINTS.MEALS.STATUS(mealId),
        status
      );

      // Clear cache after status update
      if (response.success) {
        await this.clearMealCache();
      }

      return response;
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to update meal status',
      };
    }
  }

  async updateMeal(
    mealId: string,
    data: MealUpdate
  ): Promise<ApiResponse<MealEntry>> {
    try {
      const response = await httpClient.put<MealEntry>(
        API_ENDPOINTS.MEALS.UPDATE(mealId),
        data
      );

      // Clear cache after update
      if (response.success) {
        await this.clearMealCache();
      }

      return response;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update meal',
      };
    }
  }

  async deleteMeal(mealId: string): Promise<ApiResponse<void>> {
    try {
      const response = await httpClient.delete<void>(
        API_ENDPOINTS.MEALS.DELETE(mealId)
      );

      // Clear cache after deletion
      if (response.success) {
        await this.clearMealCache();
      }

      return response;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete meal',
      };
    }
  }

  async getMealStats(
    filters: MealFilters = {}
  ): Promise<ApiResponse<MealStats>> {
    try {
      const queryParams = this.buildQueryParams(filters);
      const endpoint = `${API_ENDPOINTS.MEALS.STATS}${queryParams}`;

      const response = await httpClient.get<MealStats>(endpoint, {
        cache: true,
        cacheKey: `meal_stats_${JSON.stringify(filters)}`,
      });

      return response;
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to fetch meal statistics',
      };
    }
  }

  async getUserMealStats(
    filters: MealFilters = {}
  ): Promise<ApiResponse<MealStats>> {
    try {
      const queryParams = this.buildQueryParams(filters);
      const endpoint = `${API_ENDPOINTS.MEALS.USER_STATS}${queryParams}`;

      const response = await httpClient.get<MealStats>(endpoint, {
        cache: true,
        cacheKey: `user_meal_stats_${JSON.stringify(filters)}`,
      });

      return response;
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to fetch user meal statistics',
      };
    }
  }

  async getMealById(mealId: string): Promise<ApiResponse<MealEntry>> {
    try {
      const response = await httpClient.get<MealEntry>(
        API_ENDPOINTS.MEALS.BY_ID(mealId),
        {
          cache: true,
          cacheKey: `meal_${mealId}`,
        }
      );

      return response;
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to fetch meal details',
      };
    }
  }

  async bulkApproveMeals(
    mealIds: string[],
    status: 'approved' | 'rejected',
    notes?: string
  ): Promise<ApiResponse<{ updatedCount: number; totalRequested: number }>> {
    try {
      const response = await httpClient.post<{
        updatedCount: number;
        totalRequested: number;
      }>(API_ENDPOINTS.MEALS.BULK_APPROVE, { mealIds, status, notes });

      // Clear cache after bulk update
      if (response.success) {
        await this.clearMealCache();
      }

      return response;
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to bulk update meals',
      };
    }
  }

  private buildQueryParams(filters: MealFilters): string {
    const params = new URLSearchParams();

    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    if (filters.status) params.append('status', filters.status);
    if (filters.userId) params.append('userId', filters.userId);
    if (filters.limit) params.append('limit', filters.limit.toString());
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.onlyMine) params.append('onlyMine', 'true');

    const queryString = params.toString();
    return queryString ? `?${queryString}` : '';
  }

  async clearMealCache(): Promise<void> {
    try {
      // Clear all meal-related cache
      await httpClient.clearCache();
    } catch (error) {
      // Silently fail cache clearing
    }
  }

  // Helper methods for common operations
  async getTodayMeals(): Promise<ApiResponse<MealResponse>> {
    const today = new Date().toISOString().split('T')[0];
    return this.getUserMeals({ startDate: today, endDate: today });
  }

  async getWeekMeals(): Promise<ApiResponse<MealResponse>> {
    const today = new Date();
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

    return this.getUserMeals({
      startDate: weekAgo.toISOString().split('T')[0],
      endDate: today.toISOString().split('T')[0],
    });
  }

  async getPendingMeals(): Promise<ApiResponse<MealResponse>> {
    return this.getUserMeals({ status: 'pending' });
  }

  async getApprovedMeals(): Promise<ApiResponse<MealResponse>> {
    return this.getUserMeals({ status: 'approved' });
  }

  async getRejectedMeals(): Promise<ApiResponse<MealResponse>> {
    return this.getUserMeals({ status: 'rejected' });
  }

  // Utility methods (delegate to shared dateUtils for consistency)
  formatMealDate(date: string): string {
    return formatMealDateDisplay(date);
  }

  getMealIcon(mealType: 'breakfast' | 'lunch' | 'dinner'): string {
    switch (mealType) {
      case 'breakfast':
        return 'sunny';
      case 'lunch':
        return 'restaurant';
      case 'dinner':
        return 'moon';
      default:
        return 'fast-food';
    }
  }

  getMealColor(mealType: 'breakfast' | 'lunch' | 'dinner'): string {
    switch (mealType) {
      case 'breakfast':
        return '#f59e0b';
      case 'lunch':
        return '#10b981';
      case 'dinner':
        return '#6366f1';
      default:
        return '#6b7280';
    }
  }

  getStatusColor(status: 'pending' | 'approved' | 'rejected'): string {
    switch (status) {
      case 'pending':
        return '#f59e0b';
      case 'approved':
        return '#10b981';
      case 'rejected':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  }
}

// Create singleton instance
const mealService = new MealServiceImpl();

export default mealService;
