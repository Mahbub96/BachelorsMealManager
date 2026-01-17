import { API_ENDPOINTS, ApiResponse, config as API_CONFIG } from './config';
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

      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/7b131878-66d7-4e41-a34a-1e43324df177',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'userStatsService.ts:46',message:'getUserDashboardStats called',data:{baseURL:API_CONFIG.apiUrl,endpoint:API_ENDPOINTS.USER_STATS.DASHBOARD},timestamp:Date.now(),sessionId:'debug-session',runId:'dashboard',hypothesisId:'B'})}).catch(()=>{});
      // #endregion

      // Disable cache to ensure fresh data (cache was causing stale zeros)
      const response = await httpClient.get<UserDashboardStats>(
        API_ENDPOINTS.USER_STATS.DASHBOARD,
        {
          cache: false, // Changed: Disable cache to always get fresh data
          cacheKey: 'user_dashboard_stats',
          offlineFallback: false,
          retries: 3,
          timeout: 15000,
        }
      );

      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/7b131878-66d7-4e41-a34a-1e43324df177',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'userStatsService.ts:62',message:'User dashboard stats response received',data:{success:response.success,hasData:!!response.data,error:response.error,dataKeys:response.data?Object.keys(response.data):[],fullData:JSON.stringify(response.data)},timestamp:Date.now(),sessionId:'debug-session',runId:'dashboard',hypothesisId:'B'})}).catch(()=>{});
      // #endregion

      console.log('📡 API Response:', response);
      console.log('📡 API Response Data:', JSON.stringify(response.data, null, 2));
      
      // #region agent log
      if (response.data) {
        fetch('http://127.0.0.1:7242/ingest/7b131878-66d7-4e41-a34a-1e43324df177',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'userStatsService.ts:70',message:'Detailed response data analysis',data:{meals:response.data.meals,bazar:response.data.bazar,payments:response.data.payments,mealsTotal:response.data.meals?.total,bazarTotal:response.data.bazar?.totalAmount},timestamp:Date.now(),sessionId:'debug-session',runId:'dashboard',hypothesisId:'B'})}).catch(()=>{});
      }
      // #endregion

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
      
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/7b131878-66d7-4e41-a34a-1e43324df177',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'userStatsService.ts:299',message:'testApiConnection called',data:{baseURL:API_CONFIG.apiUrl},timestamp:Date.now(),sessionId:'debug-session',runId:'connection-test',hypothesisId:'D'})}).catch(()=>{});
      // #endregion
      
      // Try multiple health check endpoints (same as httpClient.isOnline)
      const healthUrls = [
        `${API_CONFIG.apiUrl.replace('/api', '')}/health`,
        `${API_CONFIG.apiUrl}/health`,
        `${API_CONFIG.apiUrl}/api/health`,
      ];

      let lastError: Error | null = null;
      
      for (const healthUrl of healthUrls) {
        try {
          console.log(`🧪 Trying health check: ${healthUrl}`);
          
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/7b131878-66d7-4e41-a34a-1e43324df177',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'userStatsService.ts:310',message:'Trying health check URL',data:{healthUrl},timestamp:Date.now(),sessionId:'debug-session',runId:'connection-test',hypothesisId:'D'})}).catch(()=>{});
          // #endregion
          
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
            console.log(`✅ API connection test successful via ${healthUrl}`);
            
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/7b131878-66d7-4e41-a34a-1e43324df177',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'userStatsService.ts:330',message:'Health check successful',data:{healthUrl,status:response.status},timestamp:Date.now(),sessionId:'debug-session',runId:'connection-test',hypothesisId:'D'})}).catch(()=>{});
            // #endregion
            
            return true;
          } else {
            lastError = new Error(`HTTP ${response.status}: ${response.statusText}`);
            console.log(`⚠️ Health check failed for ${healthUrl}: ${response.status}`);
            continue; // Try next URL
          }
        } catch (error) {
          lastError = error instanceof Error ? error : new Error(String(error));
          console.log(`⚠️ Health check error for ${healthUrl}:`, error);
          continue; // Try next URL
        }
      }

      // All URLs failed
      console.error('❌ All health check URLs failed:', lastError?.message);
      
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/7b131878-66d7-4e41-a34a-1e43324df177',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'userStatsService.ts:350',message:'All health checks failed',data:{lastError:lastError?.message,healthUrls},timestamp:Date.now(),sessionId:'debug-session',runId:'connection-test',hypothesisId:'D'})}).catch(()=>{});
      // #endregion
      
      return false;
    } catch (error) {
      console.error('❌ API connection test failed:', error);
      
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/7b131878-66d7-4e41-a34a-1e43324df177',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'userStatsService.ts:357',message:'Connection test exception',data:{error:error instanceof Error?error.message:String(error)},timestamp:Date.now(),sessionId:'debug-session',runId:'connection-test',hypothesisId:'D'})}).catch(()=>{});
      // #endregion
      
      return false;
    }
  }
}

const userStatsService = new UserStatsServiceImpl();
export default userStatsService;
