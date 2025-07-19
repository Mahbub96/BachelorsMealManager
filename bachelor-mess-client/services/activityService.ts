import httpClient from './httpClient';
import errorHandler from './errorHandler';
import { API_ENDPOINTS } from './config';

export interface Activity {
  id: string;
  type: 'meal' | 'bazar' | 'member' | 'payment' | 'approval';
  title: string;
  description: string;
  time: string;
  priority: 'low' | 'medium' | 'high';
  amount?: number;
  user?: string;
  icon?: string;
  status?: 'pending' | 'approved' | 'rejected';
  date?: string;
  approvedBy?: string;
  approvedAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ActivityStats {
  total: number;
  byType: {
    meals: number;
    bazar: number;
    members: number;
  };
  byStatus: {
    pending: number;
    approved: number;
    rejected: number;
  };
  recent: {
    today: number;
    week: number;
    month: number;
  };
}

export interface ActivityFilters {
  type?: 'meals' | 'bazar' | 'members' | 'all';
  status?: 'pending' | 'approved' | 'rejected';
  startDate?: string;
  endDate?: string;
  search?: string;
  sortBy?: 'createdAt' | 'date' | 'amount';
  sortOrder?: 'asc' | 'desc';
}

export interface ActivityResponse {
  activities: Activity[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  stats: ActivityStats;
}

export interface Meal {
  id: string;
  userId: {
    _id: string;
    name: string;
    email: string;
  };
  date: string;
  breakfast: boolean;
  lunch: boolean;
  dinner: boolean;
  status: 'pending' | 'approved' | 'rejected';
  notes?: string;
  approvedBy?: {
    _id: string;
    name: string;
  };
  approvedAt?: string;
  createdAt: string;
  updatedAt: string;
  time: string;
}

export interface MonthlyMealStats {
  totalMeals: number;
  totalBreakfast: number;
  totalLunch: number;
  totalDinner: number;
  pendingMeals: number;
  approvedMeals: number;
  rejectedMeals: number;
  efficiency: number;
  averageMealsPerDay: number;
}

export interface CurrentMonthMealsResponse {
  meals: Meal[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  stats: MonthlyMealStats;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

class ActivityService {
  /**
   * Get recent activities with advanced filtering
   */
  async getRecentActivities(
    filters: ActivityFilters = {},
    page: number = 1,
    limit: number = 20
  ): Promise<ApiResponse<ActivityResponse>> {
    try {
      console.log('📋 Fetching recent activities...', { filters, page, limit });

      // Build query parameters
      const queryParams = new URLSearchParams();
      queryParams.append('page', page.toString());
      queryParams.append('limit', limit.toString());

      if (filters.type && filters.type !== 'all') {
        queryParams.append('type', filters.type);
      }

      if (filters.status) {
        queryParams.append('status', filters.status);
      }

      if (filters.startDate) {
        queryParams.append('startDate', filters.startDate);
      }

      if (filters.endDate) {
        queryParams.append('endDate', filters.endDate);
      }

      if (filters.search) {
        queryParams.append('search', filters.search);
      }

      if (filters.sortBy) {
        queryParams.append('sortBy', filters.sortBy);
      }

      if (filters.sortOrder) {
        queryParams.append('sortOrder', filters.sortOrder);
      }

      const response = await httpClient.get<ActivityResponse>(
        `${API_ENDPOINTS.ACTIVITY.RECENT}?${queryParams.toString()}`,
        {
          cache: true,
          cacheKey: `activities_${JSON.stringify(filters)}_${page}_${limit}`,
          offlineFallback: true,
          retries: 2,
        }
      );

      if (!response.success) {
        const appError = errorHandler.handleApiResponse(
          response,
          'Recent Activities'
        );
        console.error('❌ Failed to fetch activities:', appError?.message);
      } else {
        console.log('✅ Recent activities fetched successfully');
      }

      return response;
    } catch (error) {
      const appError = errorHandler.handleError(error, 'Recent Activities');
      return {
        success: false,
        error: appError.userFriendlyMessage,
      };
    }
  }

  /**
   * Get current month meals with statistics
   */
  async getCurrentMonthMeals(
    status?: string,
    page: number = 1,
    limit: number = 50
  ): Promise<ApiResponse<CurrentMonthMealsResponse>> {
    try {
      console.log('🍽️ Fetching current month meals...', {
        status,
        page,
        limit,
      });

      // Build query parameters
      const queryParams = new URLSearchParams();
      queryParams.append('page', page.toString());
      queryParams.append('limit', limit.toString());

      if (status) {
        queryParams.append('status', status);
      }

      const response = await httpClient.get<CurrentMonthMealsResponse>(
        `${
          API_ENDPOINTS.ACTIVITY.CURRENT_MONTH_MEALS
        }?${queryParams.toString()}`,
        {
          cache: true,
          cacheKey: `current_month_meals_${status}_${page}_${limit}`,
          offlineFallback: true,
          retries: 2,
        }
      );

      if (!response.success) {
        const appError = errorHandler.handleApiResponse(
          response,
          'Current Month Meals'
        );
        console.error(
          '❌ Failed to fetch current month meals:',
          appError?.message
        );
      } else {
        console.log('✅ Current month meals fetched successfully');
      }

      return response;
    } catch (error) {
      const appError = errorHandler.handleError(error, 'Current Month Meals');
      return {
        success: false,
        error: appError.userFriendlyMessage,
      };
    }
  }

  /**
   * Get activity statistics
   */
  async getActivityStats(
    filters: ActivityFilters = {}
  ): Promise<ApiResponse<ActivityStats>> {
    try {
      console.log('📊 Fetching activity statistics...', { filters });

      const response = await httpClient.get<ActivityStats>(
        API_ENDPOINTS.ACTIVITY.STATS,
        {
          cache: true,
          cacheKey: `activity_stats_${JSON.stringify(filters)}`,
          offlineFallback: true,
          retries: 2,
        }
      );

      if (!response.success) {
        const appError = errorHandler.handleApiResponse(
          response,
          'Activity Statistics'
        );
        console.error('❌ Failed to fetch activity stats:', appError?.message);
      } else {
        console.log('✅ Activity statistics fetched successfully');
      }

      return response;
    } catch (error) {
      const appError = errorHandler.handleError(error, 'Activity Statistics');
      return {
        success: false,
        error: appError.userFriendlyMessage,
      };
    }
  }

  /**
   * Search activities with real-time suggestions
   */
  async searchActivities(
    query: string,
    limit: number = 10
  ): Promise<ApiResponse<Activity[]>> {
    try {
      console.log('🔍 Searching activities...', { query, limit });

      const response = await httpClient.get<Activity[]>(
        `${API_ENDPOINTS.ACTIVITY.SEARCH}?q=${encodeURIComponent(
          query
        )}&limit=${limit}`,
        {
          cache: true,
          cacheKey: `activity_search_${query}_${limit}`,
          offlineFallback: true,
          retries: 1,
        }
      );

      if (!response.success) {
        const appError = errorHandler.handleApiResponse(
          response,
          'Activity Search'
        );
        console.error('❌ Failed to search activities:', appError?.message);
      } else {
        console.log('✅ Activity search completed successfully');
      }

      return response;
    } catch (error) {
      const appError = errorHandler.handleError(error, 'Activity Search');
      return {
        success: false,
        error: appError.userFriendlyMessage,
      };
    }
  }

  /**
   * Get activity by ID with detailed information
   */
  async getActivityById(id: string): Promise<ApiResponse<Activity>> {
    try {
      console.log('📄 Fetching activity details...', { id });

      const response = await httpClient.get<Activity>(
        `${API_ENDPOINTS.ACTIVITY.BY_ID}/${id}`,
        {
          cache: true,
          cacheKey: `activity_${id}`,
          offlineFallback: true,
          retries: 2,
        }
      );

      if (!response.success) {
        const appError = errorHandler.handleApiResponse(
          response,
          'Activity Details'
        );
        console.error(
          '❌ Failed to fetch activity details:',
          appError?.message
        );
      } else {
        console.log('✅ Activity details fetched successfully');
      }

      return response;
    } catch (error) {
      const appError = errorHandler.handleError(error, 'Activity Details');
      return {
        success: false,
        error: appError.userFriendlyMessage,
      };
    }
  }

  /**
   * Clear activity cache
   */
  clearCache(): void {
    console.log('🗑️ Clearing activity cache...');
    // This would be implemented in the httpClient
    // For now, we'll just log it
  }

  /**
   * Refresh activity data
   */
  async refreshActivities(): Promise<ApiResponse<ActivityResponse>> {
    try {
      console.log('🔄 Refreshing activities...');

      // Clear cache first
      this.clearCache();

      // Fetch fresh data
      return await this.getRecentActivities();
    } catch (error) {
      const appError = errorHandler.handleError(error, 'Activity Refresh');
      return {
        success: false,
        error: appError.userFriendlyMessage,
      };
    }
  }
}

export const activityService = new ActivityService();
