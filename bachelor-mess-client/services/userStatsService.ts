import { API_ENDPOINTS, ApiResponse, config as API_CONFIG } from './config';
import httpClient from './httpClient';
import errorHandler from './errorHandler';

export interface UserDashboardStats {
  meals: {
    total: number;
    /** Guest meals count (included in total); shown on dashboard when > 0 */
    guestMeals?: number;
    approved: number;
    pending: number;
    rejected: number;
    efficiency: number;
    averagePerDay: number;
    daysSinceLastMeal: number;
  };
  bazar: {
    totalAmount: number;
    pendingAmount: number;
    approvedAmount: number;
    totalEntries: number;
    averageAmount: number;
    /** Current user's bazar total for current month (for bazar tab) */
    myTotalAmount?: number;
  };
  /** Flat bazar (shared equipment): total and per-person share; separate from meal bazar */
  flatBazar?: {
    totalAmount: number;
    memberCount: number;
    sharePerPerson: number;
  };
  currentMealRate: {
    rate: number;
    totalMeals: number;
    totalBazarAmount: number;
  };
  overview: {
    totalActivities: number;
    recentActivityCount: number;
    performanceScore: number;
  };
}

export interface UserStatsService {
  getUserDashboardStats: () => Promise<ApiResponse<UserDashboardStats>>;
  getUserMealStats: () => Promise<ApiResponse<UserDashboardStats['meals']>>;
  getUserBazarStats: () => Promise<ApiResponse<UserDashboardStats['bazar']>>;
  getUserPaymentStats: () => Promise<
    ApiResponse<UserDashboardStats['currentMealRate']>
  >;
  getUserDashboard: () => Promise<ApiResponse<any>>;
}

class UserStatsServiceImpl implements UserStatsService {
  async getUserDashboardStats(): Promise<ApiResponse<UserDashboardStats>> {
    try {
      const response = await httpClient.get<UserDashboardStats>(
        API_ENDPOINTS.USER_STATS.DASHBOARD,
        {
          cache: false,
          retries: 3,
          timeout: 15000,
        }
      );

      if (!response.success) {
        const appError = errorHandler.handleApiResponse(
          response,
          'User Dashboard Stats'
        );

        return {
          success: false,
          error: appError?.message || 'Failed to fetch user dashboard stats',
        };
      }

      return response;
    } catch (error) {
      const appError = errorHandler.handleError(error, 'User Dashboard Stats');

      return {
        success: false,
        error: appError.message,
      };
    }
  }

  async getUserMealStats(): Promise<ApiResponse<UserDashboardStats['meals']>> {
    try {
      const response = await httpClient.get<UserDashboardStats['meals']>(
        API_ENDPOINTS.USER_STATS.MEALS,
        {
          cache: true,
          cacheKey: 'user_meal_stats',
          retries: 3,
          timeout: 10000,
        }
      );

      if (!response.success) {
        const appError = errorHandler.handleApiResponse(
          response,
          'User Meal Stats'
        );

        return {
          success: false,
          error: appError?.message || 'Failed to fetch meal statistics',
        };
      }

      return response;
    } catch (error) {
      const appError = errorHandler.handleError(error, 'User Meal Stats');

      return {
        success: false,
        error: appError.message,
      };
    }
  }

  async getUserBazarStats(): Promise<ApiResponse<UserDashboardStats['bazar']>> {
    try {
      const response = await httpClient.get<UserDashboardStats['bazar']>(
        API_ENDPOINTS.USER_STATS.BAZAR,
        {
          cache: true,
          cacheKey: 'user_bazar_stats',
          retries: 3,
          timeout: 10000,
        }
      );

      if (!response.success) {
        const appError = errorHandler.handleApiResponse(
          response,
          'User Bazar Stats'
        );

        return {
          success: false,
          error: appError?.message || 'Failed to fetch bazar statistics',
        };
      }

      return response;
    } catch (error) {
      const appError = errorHandler.handleError(error, 'User Bazar Stats');

      return {
        success: false,
        error: appError.message,
      };
    }
  }

  async getUserPaymentStats(): Promise<
    ApiResponse<UserDashboardStats['currentMealRate']>
  > {
    try {
      // Use dashboard endpoint to get current meal rate
      const dashboardResponse = await this.getUserDashboardStats();
      
      if (!dashboardResponse.success || !dashboardResponse.data) {
        return {
          success: false,
          error: dashboardResponse.error || 'Failed to fetch current meal rate',
        };
      }

      return {
        success: true,
        data: dashboardResponse.data.currentMealRate,
      };
    } catch (error) {
      const appError = errorHandler.handleError(error, 'Current Meal Rate');

      return {
        success: false,
        error: appError.message,
      };
    }
  }

  async getUserDashboard(): Promise<ApiResponse<any>> {
    try {
      const response = await httpClient.get<any>(
        API_ENDPOINTS.USER_STATS.DASHBOARD,
        {
          cache: true,
          cacheKey: 'user_dashboard_data',
          retries: 3,
          timeout: 15000,
        }
      );

      if (!response.success) {
        const appError = errorHandler.handleApiResponse(
          response,
          'User Dashboard Data'
        );

        return {
          success: false,
          error: appError?.message || 'Failed to fetch user dashboard data',
        };
      }

      return response;
    } catch (error) {
      const appError = errorHandler.handleError(error, 'User Dashboard Data');

      return {
        success: false,
        error: appError.message,
      };
    }
  }

  // Test method to check API connectivity
  async testApiConnection(): Promise<boolean> {
    try {
      // Try multiple health check endpoints (same as httpClient.isOnline)
      const healthUrls = [
        `${API_CONFIG.apiUrl.replace('/api', '')}/health`,
        `${API_CONFIG.apiUrl}/health`,
        `${API_CONFIG.apiUrl}/api/health`,
      ];

      let lastError: Error | null = null;
      
      for (const healthUrl of healthUrls) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000);

          const response = await fetch(healthUrl, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
            signal: controller.signal,
          });

          clearTimeout(timeoutId);

          if (response.ok) {
            return true;
          } else {
            lastError = new Error(`HTTP ${response.status}: ${response.statusText}`);
            continue; // Try next URL
          }
        } catch (error) {
          lastError = error instanceof Error ? error : new Error(String(error));
          continue; // Try next URL
        }
      }

      // All URLs failed
      return false;
    } catch (error) {
      return false;
    }
  }
}

const userStatsService = new UserStatsServiceImpl();
export default userStatsService;
