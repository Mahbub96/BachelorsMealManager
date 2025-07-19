import { API_ENDPOINTS, ApiResponse } from './config';
import httpClient from './httpClient';

// Type definitions for meal management
export interface MealEntry {
  id: string;
  userId: string | { name: string; email: string };
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
}

export interface MealSubmission {
  breakfast: boolean;
  lunch: boolean;
  dinner: boolean;
  date: string;
  notes?: string;
}

export interface MealUpdate {
  breakfast?: boolean;
  lunch?: boolean;
  dinner?: boolean;
  notes?: string;
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

      const response = await httpClient.post<MealEntry>(
        API_ENDPOINTS.MEALS.SUBMIT,
        data,
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
      console.log(
        '🍽️ Meal Service - getUserMeals called with filters:',
        filters
      );
      const queryParams = this.buildQueryParams(filters);
      const endpoint = `${API_ENDPOINTS.MEALS.USER}${queryParams}`;
      console.log('🔗 Meal Service - Making request to endpoint:', endpoint);

      const response = await httpClient.get<MealResponse>(endpoint, {
        cache: true,
        cacheKey: `user_meals_${JSON.stringify(filters)}`,
      });

      console.log('🍽️ Meal Service - Raw response:', {
        success: response.success,
        hasData: !!response.data,
        dataType: typeof response.data,
        error: response.error,
      });

      // Transform the response to match expected structure
      if (response.success && response.data) {
        const meals = response.data.meals || response.data;

        console.log('🍽️ Meal Service - Meals before transform:', {
          count: Array.isArray(meals) ? meals.length : 'not array',
          type: typeof meals,
          sample: Array.isArray(meals) && meals.length > 0 ? meals[0] : null,
        });

        // Transform _id to id for each meal
        const transformedMeals = Array.isArray(meals)
          ? meals.map((meal: any) => {
              const transformed = {
                ...meal,
                id: meal._id || meal.id,
              };
              console.log('🍽️ Meal Service - Transformed meal:', {
                originalId: meal._id,
                newId: transformed.id,
                status: meal.status,
                date: meal.date,
              });
              return transformed;
            })
          : meals;

        console.log('🍽️ Meal Service - Final transformed data:', {
          count: transformedMeals?.length || 0,
          success: true,
        });

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

      console.log('❌ Meal Service - Response not successful:', response);
      return response;
    } catch (error) {
      console.error('❌ Error fetching user meals:', error);
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

      // Clear cache for meal stats to ensure fresh data
      await httpClient.clearCache();

      const response = await httpClient.get<MealStats>(endpoint, {
        cache: false, // Disable caching for meal stats
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
      console.log('🍽️ Fetching user meal stats with filters:', filters);
      const queryParams = this.buildQueryParams(filters);
      const endpoint = `${API_ENDPOINTS.MEALS.USER_STATS}${queryParams}`;
      console.log('🔗 Endpoint:', endpoint);

      // Clear cache for meal stats to ensure fresh data
      await httpClient.clearCache();

      const response = await httpClient.get<MealStats>(endpoint, {
        cache: false, // Disable caching for meal stats
      });

      console.log('📊 Meal stats response:', response);
      return response;
    } catch (error) {
      console.error('❌ Error fetching meal stats:', error);
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

    const queryString = params.toString();
    return queryString ? `?${queryString}` : '';
  }

  async clearMealCache(): Promise<void> {
    try {
      // Clear all meal-related cache
      await httpClient.clearCache();
      console.log('🗑️ Meal cache cleared');
    } catch (error) {
      console.error('❌ Error clearing meal cache:', error);
    }
  }

  // Force refresh meal data
  async forceRefreshUserMeals(
    filters: MealFilters = {}
  ): Promise<ApiResponse<MealResponse>> {
    try {
      // Clear cache first
      await this.clearMealCache();

      console.log('🍽️ Force refreshing user meals with filters:', filters);
      const queryParams = this.buildQueryParams(filters);
      const endpoint = `${API_ENDPOINTS.MEALS.USER}${queryParams}`;
      console.log('🔗 Endpoint:', endpoint);

      const response = await httpClient.get<{
        meals: MealEntry[];
        pagination: MealPagination;
      }>(endpoint, {
        cache: false, // Disable caching for force refresh
      });

      console.log('📊 User meals response:', response);

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
            ...response.data,
            meals: transformedMeals,
          },
        } as unknown as ApiResponse<MealResponse>;
      }

      return response;
    } catch (error) {
      console.error('❌ Force refresh failed:', error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to refresh user meals',
      };
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

  // Utility methods
  formatMealDate(date: string): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
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
