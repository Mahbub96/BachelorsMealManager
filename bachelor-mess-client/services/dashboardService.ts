import { API_ENDPOINTS, ApiResponse } from './config';
import httpClient from './httpClient';

// Type definitions for dashboard
export interface DashboardStats {
  totalMembers: number;
  monthlyExpense: number;
  averageMeals: number;
  balance: number;
  totalMeals: number;
  pendingPayments: number;
  monthlyBudget: number;
  budgetUsed: number;
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

export interface CombinedDashboardData {
  analytics: AnalyticsData;
  stats: DashboardStats;
  activities: Activity[];
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

// Dashboard service implementation
class DashboardServiceImpl implements DashboardService {
  async getHealth(): Promise<
    ApiResponse<{ message: string; timestamp: string }>
  > {
    try {
      const response = await httpClient.get<{
        message: string;
        timestamp: string;
      }>(API_ENDPOINTS.DASHBOARD.HEALTH, {
        cache: true,
        cacheKey: 'health_check',
      });

      return response;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Health check failed',
      };
    }
  }

  async getStats(): Promise<ApiResponse<DashboardStats>> {
    try {
      const response = await httpClient.get<DashboardStats>(
        API_ENDPOINTS.DASHBOARD.STATS,
        {
          cache: true,
          cacheKey: 'dashboard_stats',
          offlineFallback: false, // Disable offline fallback for critical data
        }
      );

      return response;
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to fetch dashboard stats',
      };
    }
  }

  async getActivities(): Promise<ApiResponse<Activity[]>> {
    try {
      const response = await httpClient.get<Activity[]>(
        API_ENDPOINTS.DASHBOARD.ACTIVITIES,
        {
          cache: true,
          cacheKey: 'dashboard_activities',
          offlineFallback: false, // Disable offline fallback for critical data
        }
      );

      return response;
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to fetch activities',
      };
    }
  }

  async getAnalytics(
    filters: DashboardFilters = {}
  ): Promise<ApiResponse<AnalyticsData>> {
    try {
      const queryParams = this.buildQueryParams(filters);
      const endpoint = `${API_ENDPOINTS.ANALYTICS.DATA}${queryParams}`;

      const response = await httpClient.get<AnalyticsData>(endpoint, {
        cache: true,
        cacheKey: `analytics_${JSON.stringify(filters)}`,
      });

      return response;
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to fetch analytics data',
      };
    }
  }

  async getCombinedData(
    filters: DashboardFilters = {}
  ): Promise<ApiResponse<CombinedDashboardData>> {
    try {
      const queryParams = this.buildQueryParams(filters);
      const endpoint = `${API_ENDPOINTS.DASHBOARD.COMBINED}${queryParams}`;

      const response = await httpClient.get<CombinedDashboardData>(endpoint, {
        cache: true,
        cacheKey: `combined_dashboard_${JSON.stringify(filters)}`,
        offlineFallback: false, // Disable offline fallback for critical data
      });

      return response;
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to fetch combined dashboard data',
      };
    }
  }

  async getMealDistribution(
    timeframe: string = 'week'
  ): Promise<ApiResponse<AnalyticsData['mealDistribution']>> {
    try {
      const response = await httpClient.get<AnalyticsData['mealDistribution']>(
        `${API_ENDPOINTS.ANALYTICS.DATA}?timeframe=${timeframe}`,
        {
          cache: true,
          cacheKey: `meal_distribution_${timeframe}`,
        }
      );

      return response;
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to fetch meal distribution',
      };
    }
  }

  async getExpenseTrend(
    timeframe: string = 'week'
  ): Promise<ApiResponse<AnalyticsData['expenseTrend']>> {
    try {
      const response = await httpClient.get<AnalyticsData['expenseTrend']>(
        `${API_ENDPOINTS.ANALYTICS.DATA}?timeframe=${timeframe}`,
        {
          cache: true,
          cacheKey: `expense_trend_${timeframe}`,
        }
      );

      return response;
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to fetch expense trend',
      };
    }
  }

  async getCategoryBreakdown(
    timeframe: string = 'week'
  ): Promise<ApiResponse<AnalyticsData['categoryBreakdown']>> {
    try {
      const response = await httpClient.get<AnalyticsData['categoryBreakdown']>(
        `${API_ENDPOINTS.ANALYTICS.DATA}?timeframe=${timeframe}`,
        {
          cache: true,
          cacheKey: `category_breakdown_${timeframe}`,
        }
      );

      return response;
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to fetch category breakdown',
      };
    }
  }

  private buildQueryParams(filters: DashboardFilters): string {
    const params = new URLSearchParams();

    if (filters.timeframe) params.append('timeframe', filters.timeframe);
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);

    const queryString = params.toString();
    return queryString ? `?${queryString}` : '';
  }

  // Helper methods for common operations
  async getWeeklyData(): Promise<ApiResponse<CombinedDashboardData>> {
    return this.getCombinedData({ timeframe: 'week' });
  }

  async getMonthlyData(): Promise<ApiResponse<CombinedDashboardData>> {
    return this.getCombinedData({ timeframe: 'month' });
  }

  async getYearlyData(): Promise<ApiResponse<CombinedDashboardData>> {
    return this.getCombinedData({ timeframe: 'year' });
  }

  async refreshDashboard(): Promise<void> {
    try {
      // Clear all dashboard-related cache
      await httpClient.clearCache();
      console.log('Dashboard cache cleared');
    } catch (error) {
      console.error('Error clearing dashboard cache:', error);
    }
  }
}

// Create singleton instance
const dashboardService = new DashboardServiceImpl();

export default dashboardService;
