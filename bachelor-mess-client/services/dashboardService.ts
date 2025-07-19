import { API_ENDPOINTS, ApiResponse } from './config';
import httpClient from './httpClient';
import errorHandler from './errorHandler';

// Type definitions for dashboard with new statistics system
export interface DashboardStats {
  totalMembers: number;
  activeMembers: number;
  totalMeals: number;
  pendingMeals: number;
  totalBazarAmount: number;
  pendingBazar: number;
  monthlyExpense: number;
  averageMeals: number;
  balance: number;
  monthlyBudget: number;
  budgetUsed: number;
  lastUpdated: string;
}

export interface Activity {
  id: string;
  type: 'meal' | 'bazar' | 'payment' | 'user';
  title: string;
  description: string;
  time: string;
  priority: 'low' | 'medium' | 'high';
  amount?: number;
  user?: string;
  icon: string;
}

export interface AnalyticsData {
  mealDistribution: {
    label: string;
    value: number;
    color: string;
    gradient: string[];
    trend: 'up' | 'down' | 'stable';
  }[];
  expenseTrend: {
    date: string;
    value: number;
  }[];
  categoryBreakdown: {
    label: string;
    value: number;
    color: string;
    gradient: string[];
  }[];
  monthlyProgress: {
    current: number;
    target: number;
  };
}

export interface StatisticsData {
  global: {
    totalUsers: number;
    activeUsers: number;
    totalMeals: number;
    totalBazarEntries: number;
    totalRevenue: number;
    totalExpenses: number;
    lastUpdated: string;
  };
  meals: {
    totalBreakfast: number;
    totalLunch: number;
    totalDinner: number;
    pendingMeals: number;
    approvedMeals: number;
    rejectedMeals: number;
    averageMealsPerDay: number;
    efficiency: number;
    lastUpdated: string;
  };
  bazar: {
    totalAmount: number;
    totalEntries: number;
    pendingEntries: number;
    approvedEntries: number;
    rejectedEntries: number;
    averageAmount: number;
    averageItemsPerEntry: number;
    lastUpdated: string;
  };
  users: {
    adminUsers: number;
    memberUsers: number;
    inactiveUsers: number;
    newUsersThisMonth: number;
    activeUsersThisMonth: number;
    lastUpdated: string;
  };
  monthly: {
    currentMonth: {
      meals: {
        total: number;
        breakfast: number;
        lunch: number;
        dinner: number;
        pending: number;
        approved: number;
        rejected: number;
      };
      bazar: {
        totalAmount: number;
        totalEntries: number;
        averageAmount: number;
        pendingEntries: number;
        approvedEntries: number;
        rejectedEntries: number;
      };
      users: {
        newUsers: number;
        activeUsers: number;
      };
      lastUpdated: string;
    };
  };
  lastUpdated: string;
  isStale: boolean;
}

export interface CombinedDashboardData {
  analytics: AnalyticsData;
  stats: DashboardStats;
  activities: Activity[];
  statistics: StatisticsData;
  charts?: {
    weeklyMeals: AnalyticsData['mealDistribution'];
    monthlyRevenue: AnalyticsData['expenseTrend'];
    expenseBreakdown: AnalyticsData['categoryBreakdown'];
  };
}

export interface DashboardFilters {
  timeframe?: 'week' | 'month' | 'year';
  startDate?: string;
  endDate?: string;
  forceUpdate?: boolean;
}

export interface DashboardService {
  getHealth: () => Promise<ApiResponse<{ message: string; timestamp: string }>>;
  getStats: () => Promise<ApiResponse<DashboardStats>>;
  getActivities: () => Promise<ApiResponse<Activity[]>>;
  getAnalytics: (
    filters?: DashboardFilters
  ) => Promise<ApiResponse<AnalyticsData>>;
  getCombinedData: (
    filters?: DashboardFilters
  ) => Promise<ApiResponse<CombinedDashboardData>>;
  getStatistics: (
    forceUpdate?: boolean
  ) => Promise<ApiResponse<StatisticsData>>;
  getMealDistribution: (
    timeframe?: string
  ) => Promise<ApiResponse<AnalyticsData['mealDistribution']>>;
  getExpenseTrend: (
    timeframe?: string
  ) => Promise<ApiResponse<AnalyticsData['expenseTrend']>>;
  getCategoryBreakdown: (
    timeframe?: string
  ) => Promise<ApiResponse<AnalyticsData['categoryBreakdown']>>;
}

// Dashboard service implementation with enhanced error handling
class DashboardServiceImpl implements DashboardService {
  async getHealth(): Promise<
    ApiResponse<{ message: string; timestamp: string }>
  > {
    try {
      console.log('🔍 Checking API health...');
      const response = await httpClient.get<{
        message: string;
        timestamp: string;
      }>(API_ENDPOINTS.DASHBOARD.HEALTH, {
        cache: true,
        cacheKey: 'health_check',
        skipAuth: true, // Health check doesn't need auth
        timeout: 10000, // 10 second timeout for health check
      });

      if (!response.success) {
        const appError = errorHandler.handleApiResponse(
          response,
          'Dashboard Health Check'
        );
        console.error('❌ Health check failed:', appError?.message);
      } else {
        console.log('✅ Health check successful');
      }

      return response;
    } catch (error) {
      const appError = errorHandler.handleError(
        error,
        'Dashboard Health Check'
      );
      return {
        success: false,
        error: appError.userFriendlyMessage,
      };
    }
  }

  async getStats(): Promise<ApiResponse<DashboardStats>> {
    try {
      console.log('📊 Fetching dashboard stats...');
      const response = await httpClient.get<DashboardStats>(
        API_ENDPOINTS.DASHBOARD.STATS,
        {
          cache: true,
          cacheKey: 'dashboard_stats',
          offlineFallback: true, // Enable offline fallback for stats
          retries: 2, // Retry up to 2 times for stats
        }
      );

      if (!response.success) {
        const appError = errorHandler.handleApiResponse(
          response,
          'Dashboard Stats'
        );
        console.error('❌ Failed to fetch dashboard stats:', appError?.message);
      } else {
        console.log('✅ Dashboard stats fetched successfully');
      }

      return response;
    } catch (error) {
      const appError = errorHandler.handleError(error, 'Dashboard Stats');
      return {
        success: false,
        error: appError.userFriendlyMessage,
      };
    }
  }

  async getActivities(): Promise<ApiResponse<Activity[]>> {
    try {
      console.log('📋 Fetching dashboard activities...');
      const response = await httpClient.get<Activity[]>(
        API_ENDPOINTS.DASHBOARD.ACTIVITIES,
        {
          cache: true,
          cacheKey: 'dashboard_activities',
          offlineFallback: true, // Enable offline fallback for activities
          retries: 2,
        }
      );

      if (!response.success) {
        const appError = errorHandler.handleApiResponse(
          response,
          'Dashboard Activities'
        );
        console.error('❌ Failed to fetch activities:', appError?.message);
      } else {
        console.log('✅ Dashboard activities fetched successfully');
      }

      return response;
    } catch (error) {
      const appError = errorHandler.handleError(error, 'Dashboard Activities');
      return {
        success: false,
        error: appError.userFriendlyMessage,
      };
    }
  }

  async getAnalytics(
    filters: DashboardFilters = {}
  ): Promise<ApiResponse<AnalyticsData>> {
    try {
      console.log('📈 Fetching analytics data...', filters);
      const queryParams = this.buildQueryParams(filters);
      const endpoint = `${API_ENDPOINTS.ANALYTICS.DATA}${queryParams}`;

      const response = await httpClient.get<AnalyticsData>(endpoint, {
        cache: true,
        cacheKey: `analytics_${JSON.stringify(filters)}`,
        offlineFallback: true,
        retries: 2,
      });

      if (!response.success) {
        const appError = errorHandler.handleApiResponse(
          response,
          'Dashboard Analytics'
        );
        console.error('❌ Failed to fetch analytics:', appError?.message);
      } else {
        console.log('✅ Analytics data fetched successfully');
      }

      return response;
    } catch (error) {
      const appError = errorHandler.handleError(error, 'Dashboard Analytics');
      return {
        success: false,
        error: appError.userFriendlyMessage,
      };
    }
  }

  async getCombinedData(
    filters: DashboardFilters = {}
  ): Promise<ApiResponse<CombinedDashboardData>> {
    try {
      console.log('🔄 Fetching combined dashboard data...', filters);
      const queryParams = this.buildQueryParams(filters);
      const endpoint = `${API_ENDPOINTS.DASHBOARD.COMBINED}${queryParams}`;

      const response = await httpClient.get<CombinedDashboardData>(endpoint, {
        cache: true,
        cacheKey: `combined_dashboard_${JSON.stringify(filters)}`,
        offlineFallback: true,
        retries: 3, // More retries for combined data
        timeout: 30000, // Longer timeout for combined data
      });

      if (!response.success) {
        const appError = errorHandler.handleApiResponse(
          response,
          'Combined Dashboard Data'
        );
        console.error('❌ Failed to fetch combined data:', appError?.message);

        // Return a more specific error message
        return {
          success: false,
          error:
            appError?.userFriendlyMessage ||
            'Failed to load dashboard data. Please check your connection and try again.',
        };
      } else {
        console.log('✅ Combined dashboard data fetched successfully');
      }

      return response;
    } catch (error) {
      const appError = errorHandler.handleError(
        error,
        'Combined Dashboard Data'
      );

      // Provide more specific error messages based on error type
      let userMessage = appError.userFriendlyMessage;
      if (appError.type === 'NETWORK') {
        userMessage =
          'Network connection issue. Please check your internet connection and try again.';
      } else if (appError.type === 'SERVER') {
        userMessage =
          'Server is temporarily unavailable. Please try again in a few moments.';
      } else if (appError.type === 'TIMEOUT') {
        userMessage =
          'Request timed out. Please check your connection and try again.';
      }

      return {
        success: false,
        error: userMessage,
      };
    }
  }

  async getStatistics(
    forceUpdate?: boolean
  ): Promise<ApiResponse<StatisticsData>> {
    try {
      console.log('�� Fetching dashboard statistics...', forceUpdate);
      const queryParams = this.buildQueryParams({ forceUpdate: forceUpdate });
      const endpoint = `${API_ENDPOINTS.DASHBOARD.STATISTICS}${queryParams}`;

      const response = await httpClient.get<StatisticsData>(endpoint, {
        cache: true,
        cacheKey: `dashboard_statistics_${forceUpdate ? 'force' : ''}`,
        offlineFallback: true,
        retries: 2,
      });

      if (!response.success) {
        const appError = errorHandler.handleApiResponse(
          response,
          'Dashboard Statistics'
        );
        console.error('❌ Failed to fetch statistics:', appError?.message);
      } else {
        console.log('✅ Dashboard statistics fetched successfully');
      }

      return response;
    } catch (error) {
      const appError = errorHandler.handleError(error, 'Dashboard Statistics');
      return {
        success: false,
        error: appError.userFriendlyMessage,
      };
    }
  }

  async getMealDistribution(
    timeframe: string = 'week'
  ): Promise<ApiResponse<AnalyticsData['mealDistribution']>> {
    try {
      console.log('🍽️ Fetching meal distribution...', timeframe);
      const response = await httpClient.get<AnalyticsData['mealDistribution']>(
        `${API_ENDPOINTS.ANALYTICS.DATA}?timeframe=${timeframe}`,
        {
          cache: true,
          cacheKey: `meal_distribution_${timeframe}`,
          offlineFallback: true,
          retries: 2,
        }
      );

      if (!response.success) {
        const appError = errorHandler.handleApiResponse(
          response,
          'Meal Distribution'
        );
        console.error(
          '❌ Failed to fetch meal distribution:',
          appError?.message
        );
      } else {
        console.log('✅ Meal distribution fetched successfully');
      }

      return response;
    } catch (error) {
      const appError = errorHandler.handleError(error, 'Meal Distribution');
      return {
        success: false,
        error: appError.userFriendlyMessage,
      };
    }
  }

  async getExpenseTrend(
    timeframe: string = 'week'
  ): Promise<ApiResponse<AnalyticsData['expenseTrend']>> {
    try {
      console.log('💰 Fetching expense trend...', timeframe);
      const response = await httpClient.get<AnalyticsData['expenseTrend']>(
        `${API_ENDPOINTS.ANALYTICS.DATA}?timeframe=${timeframe}`,
        {
          cache: true,
          cacheKey: `expense_trend_${timeframe}`,
          offlineFallback: true,
          retries: 2,
        }
      );

      if (!response.success) {
        const appError = errorHandler.handleApiResponse(
          response,
          'Expense Trend'
        );
        console.error('❌ Failed to fetch expense trend:', appError?.message);
      } else {
        console.log('✅ Expense trend fetched successfully');
      }

      return response;
    } catch (error) {
      const appError = errorHandler.handleError(error, 'Expense Trend');
      return {
        success: false,
        error: appError.userFriendlyMessage,
      };
    }
  }

  async getCategoryBreakdown(
    timeframe: string = 'week'
  ): Promise<ApiResponse<AnalyticsData['categoryBreakdown']>> {
    try {
      console.log('📊 Fetching category breakdown...', timeframe);
      const response = await httpClient.get<AnalyticsData['categoryBreakdown']>(
        `${API_ENDPOINTS.ANALYTICS.DATA}?timeframe=${timeframe}`,
        {
          cache: true,
          cacheKey: `category_breakdown_${timeframe}`,
          offlineFallback: true,
          retries: 2,
        }
      );

      if (!response.success) {
        const appError = errorHandler.handleApiResponse(
          response,
          'Category Breakdown'
        );
        console.error(
          '❌ Failed to fetch category breakdown:',
          appError?.message
        );
      } else {
        console.log('✅ Category breakdown fetched successfully');
      }

      return response;
    } catch (error) {
      const appError = errorHandler.handleError(error, 'Category Breakdown');
      return {
        success: false,
        error: appError.userFriendlyMessage,
      };
    }
  }

  // Helper method to build query parameters
  private buildQueryParams(filters: DashboardFilters): string {
    const params = new URLSearchParams();

    if (filters.timeframe) {
      params.append('timeframe', filters.timeframe);
    }
    if (filters.startDate) {
      params.append('startDate', filters.startDate);
    }
    if (filters.endDate) {
      params.append('endDate', filters.endDate);
    }
    if (filters.forceUpdate) {
      params.append('forceUpdate', filters.forceUpdate.toString());
    }

    const queryString = params.toString();
    return queryString ? `?${queryString}` : '';
  }

  // Convenience methods for specific timeframes
  async getWeeklyData(): Promise<ApiResponse<CombinedDashboardData>> {
    return this.getCombinedData({ timeframe: 'week' });
  }

  async getMonthlyData(): Promise<ApiResponse<CombinedDashboardData>> {
    return this.getCombinedData({ timeframe: 'month' });
  }

  async getYearlyData(): Promise<ApiResponse<CombinedDashboardData>> {
    return this.getCombinedData({ timeframe: 'year' });
  }

  // Refresh dashboard data and clear cache
  async refreshDashboard(): Promise<void> {
    try {
      console.log('🔄 Refreshing dashboard data...');
      await httpClient.clearCache();
      console.log('✅ Dashboard cache cleared');
    } catch (error) {
      const appError = errorHandler.handleError(error, 'Dashboard Refresh');
      console.error('❌ Failed to refresh dashboard:', appError.message);
    }
  }

  // Get error statistics for dashboard
  getErrorStats() {
    return errorHandler.getErrorStats();
  }

  // Check if there are critical errors
  hasCriticalErrors(): boolean {
    return errorHandler.hasCriticalErrors();
  }
}

// Export singleton instance
const dashboardService = new DashboardServiceImpl();
export default dashboardService;
