import { API_ENDPOINTS, ApiResponse } from './config';
import httpClient from './httpClient';
import errorHandler from './errorHandler';

export interface UserDashboardStats {
  meals: {
    total: number;
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
  };
  payments: {
    monthlyContribution: number;
    lastPaymentDate: string | null;
    paymentStatus: 'paid' | 'pending' | 'overdue';
    totalPaid: number;
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
    ApiResponse<UserDashboardStats['payments']>
  >;
  getUserDashboard: () => Promise<ApiResponse<any>>;
}

class UserStatsServiceImpl implements UserStatsService {
  async getUserDashboardStats(): Promise<ApiResponse<UserDashboardStats>> {
    try {
      console.log('📊 Fetching user dashboard stats...');
      console.log('🔗 Endpoint:', API_ENDPOINTS.USER_STATS.DASHBOARD);

      const response = await httpClient.get<UserDashboardStats>(
        API_ENDPOINTS.USER_STATS.DASHBOARD,
        {
          cache: true,
          cacheKey: 'user_dashboard_stats',
          offlineFallback: false,
          retries: 3,
          timeout: 15000,
        }
      );

      console.log('📡 API Response:', response);

      if (!response.success) {
        const appError = errorHandler.handleApiResponse(
          response,
          'User Dashboard Stats'
        );
        console.error(
          '❌ Failed to fetch user dashboard stats:',
          appError?.message
        );

        return {
          success: false,
          error: appError?.message || 'Failed to fetch user dashboard stats',
        };
      }

      console.log('✅ User dashboard stats fetched successfully');
      return response;
    } catch (error) {
      console.error('💥 Exception in getUserDashboardStats:', error);
      const appError = errorHandler.handleError(error, 'User Dashboard Stats');
      console.error(
        '❌ Error fetching user dashboard stats:',
        appError.message
      );

      return {
        success: false,
        error: appError.message,
      };
    }
  }

  async getUserMealStats(): Promise<ApiResponse<UserDashboardStats['meals']>> {
    try {
      console.log('🍽️ Fetching user meal stats...');
      console.log('🔗 Endpoint:', API_ENDPOINTS.USER_STATS.MEALS);

      const response = await httpClient.get<UserDashboardStats['meals']>(
        API_ENDPOINTS.USER_STATS.MEALS,
        {
          cache: true,
          cacheKey: 'user_meal_stats',
          offlineFallback: false,
          retries: 3,
          timeout: 10000,
        }
      );

      console.log('📡 Meal Stats Response:', response);

      if (!response.success) {
        const appError = errorHandler.handleApiResponse(
          response,
          'User Meal Stats'
        );
        console.error('❌ Failed to fetch meal stats:', appError?.message);

        return {
          success: false,
          error: appError?.message || 'Failed to fetch meal statistics',
        };
      }

      console.log('✅ User meal stats fetched successfully');
      return response;
    } catch (error) {
      console.error('💥 Exception in getUserMealStats:', error);
      const appError = errorHandler.handleError(error, 'User Meal Stats');
      console.error('❌ Error fetching meal stats:', appError.message);

      return {
        success: false,
        error: appError.message,
      };
    }
  }

  async getUserBazarStats(): Promise<ApiResponse<UserDashboardStats['bazar']>> {
    try {
      console.log('🛒 Fetching user bazar stats...');
      console.log('🔗 Endpoint:', API_ENDPOINTS.USER_STATS.BAZAR);

      const response = await httpClient.get<UserDashboardStats['bazar']>(
        API_ENDPOINTS.USER_STATS.BAZAR,
        {
          cache: true,
          cacheKey: 'user_bazar_stats',
          offlineFallback: false,
          retries: 3,
          timeout: 10000,
        }
      );

      console.log('📡 Bazar Stats Response:', response);

      if (!response.success) {
        const appError = errorHandler.handleApiResponse(
          response,
          'User Bazar Stats'
        );
        console.error('❌ Failed to fetch bazar stats:', appError?.message);

        return {
          success: false,
          error: appError?.message || 'Failed to fetch bazar statistics',
        };
      }

      console.log('✅ User bazar stats fetched successfully');
      return response;
    } catch (error) {
      console.error('💥 Exception in getUserBazarStats:', error);
      const appError = errorHandler.handleError(error, 'User Bazar Stats');
      console.error('❌ Error fetching bazar stats:', appError.message);

      return {
        success: false,
        error: appError.message,
      };
    }
  }

  async getUserPaymentStats(): Promise<
    ApiResponse<UserDashboardStats['payments']>
  > {
    try {
      console.log('💰 Fetching user payment stats...');
      console.log('🔗 Endpoint:', API_ENDPOINTS.USER_STATS.PAYMENTS);

      const response = await httpClient.get<UserDashboardStats['payments']>(
        API_ENDPOINTS.USER_STATS.PAYMENTS,
        {
          cache: true,
          cacheKey: 'user_payment_stats',
          offlineFallback: false,
          retries: 3,
          timeout: 10000,
        }
      );

      console.log('📡 Payment Stats Response:', response);

      if (!response.success) {
        const appError = errorHandler.handleApiResponse(
          response,
          'User Payment Stats'
        );
        console.error('❌ Failed to fetch payment stats:', appError?.message);

        return {
          success: false,
          error: appError?.message || 'Failed to fetch payment statistics',
        };
      }

      console.log('✅ User payment stats fetched successfully');
      return response;
    } catch (error) {
      console.error('💥 Exception in getUserPaymentStats:', error);
      const appError = errorHandler.handleError(error, 'User Payment Stats');
      console.error('❌ Error fetching payment stats:', appError.message);

      return {
        success: false,
        error: appError.message,
      };
    }
  }

  async getUserDashboard(): Promise<ApiResponse<any>> {
    try {
      console.log('📈 Fetching user dashboard data...');
      console.log('🔗 Endpoint:', API_ENDPOINTS.USER_STATS.DASHBOARD);

      const response = await httpClient.get<any>(
        API_ENDPOINTS.USER_STATS.DASHBOARD,
        {
          cache: true,
          cacheKey: 'user_dashboard_data',
          offlineFallback: false,
          retries: 3,
          timeout: 15000,
        }
      );

      console.log('📡 Dashboard Data Response:', response);

      if (!response.success) {
        const appError = errorHandler.handleApiResponse(
          response,
          'User Dashboard Data'
        );
        console.error(
          '❌ Failed to fetch user dashboard data:',
          appError?.message
        );

        return {
          success: false,
          error: appError?.message || 'Failed to fetch user dashboard data',
        };
      }

      console.log('✅ User dashboard data fetched successfully');
      return response;
    } catch (error) {
      console.error('💥 Exception in getUserDashboard:', error);
      const appError = errorHandler.handleError(error, 'User Dashboard Data');
      console.error('❌ Error fetching user dashboard data:', appError.message);

      return {
        success: false,
        error: appError.message,
      };
    }
  }

  // Test method to check API connectivity
  async testApiConnection(): Promise<boolean> {
    try {
      console.log('🧪 Testing API connection...');
      const response = await httpClient.get('/health', {
        skipAuth: true,
        timeout: 5000,
      });

      console.log('✅ API connection test successful:', response);
      return response.success;
    } catch (error) {
      console.error('❌ API connection test failed:', error);
      return false;
    }
  }
}

const userStatsService = new UserStatsServiceImpl();
export default userStatsService;
