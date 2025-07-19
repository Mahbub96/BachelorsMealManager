import { API_ENDPOINTS, ApiResponse } from './config';
import httpClient from './httpClient';

// Type definitions for meal management
export interface MealEntry {
  id: string;
  userId: string;
  date: string;
  breakfast: boolean;
  lunch: boolean;
  dinner: boolean;
  status: 'pending' | 'approved' | 'rejected';
  notes?: string;
  approvedBy?: string;
  approvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MealSubmission {
  breakfast: boolean;
  lunch: boolean;
  dinner: boolean;
  date: string;
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
  totalBreakfast: number;
  totalLunch: number;
  totalDinner: number;
  totalMeals: number;
  pendingCount: number;
  approvedCount: number;
  rejectedCount: number;
}

export interface MealService {
  submitMeal: (data: MealSubmission) => Promise<ApiResponse<MealEntry>>;
  getUserMeals: (filters?: MealFilters) => Promise<ApiResponse<MealEntry[]>>;
  getAllMeals: (filters?: MealFilters) => Promise<ApiResponse<MealEntry[]>>;
  updateMealStatus: (
    mealId: string,
    status: MealStatusUpdate
  ) => Promise<ApiResponse<MealEntry>>;
  getMealStats: (filters?: MealFilters) => Promise<ApiResponse<MealStats>>;
  getMealById: (mealId: string) => Promise<ApiResponse<MealEntry>>;
}

// Meal service implementation
class MealServiceImpl implements MealService {
  async submitMeal(data: MealSubmission): Promise<ApiResponse<MealEntry>> {
    try {
      const response = await httpClient.post<MealEntry>(
        API_ENDPOINTS.MEALS.SUBMIT,
        data
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
  ): Promise<ApiResponse<MealEntry[]>> {
    try {
      const queryParams = this.buildQueryParams(filters);
      const endpoint = `${API_ENDPOINTS.MEALS.USER}${queryParams}`;

      const response = await httpClient.get<MealEntry[]>(endpoint, {
        cache: true,
        cacheKey: `user_meals_${JSON.stringify(filters)}`,
      });

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
  ): Promise<ApiResponse<MealEntry[]>> {
    try {
      const queryParams = this.buildQueryParams(filters);
      const endpoint = `${API_ENDPOINTS.MEALS.ALL}${queryParams}`;

      const response = await httpClient.get<MealEntry[]>(endpoint, {
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
      const response = await httpClient.put<MealEntry>(
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

  async getMealById(mealId: string): Promise<ApiResponse<MealEntry>> {
    try {
      const response = await httpClient.get<MealEntry>(
        `${API_ENDPOINTS.MEALS.ALL}/${mealId}`,
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

  private async clearMealCache(): Promise<void> {
    try {
      // Clear all meal-related cache
      const keys = await httpClient.clearCache();
      console.log('Meal cache cleared');
    } catch (error) {
      console.error('Error clearing meal cache:', error);
    }
  }

  // Helper methods for common operations
  async getTodayMeals(): Promise<ApiResponse<MealEntry[]>> {
    const today = new Date().toISOString().split('T')[0];
    return this.getUserMeals({ startDate: today, endDate: today });
  }

  async getWeekMeals(): Promise<ApiResponse<MealEntry[]>> {
    const today = new Date();
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

    return this.getUserMeals({
      startDate: weekAgo.toISOString().split('T')[0],
      endDate: today.toISOString().split('T')[0],
    });
  }

  async getPendingMeals(): Promise<ApiResponse<MealEntry[]>> {
    return this.getUserMeals({ status: 'pending' });
  }

  async getApprovedMeals(): Promise<ApiResponse<MealEntry[]>> {
    return this.getUserMeals({ status: 'approved' });
  }
}

// Create singleton instance
const mealService = new MealServiceImpl();

export default mealService;
