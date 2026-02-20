import { API_ENDPOINTS, ApiResponse, config as API_CONFIG } from './config';
import httpClient from './httpClient';
import errorHandler from './errorHandler';
import { offlineStorage } from './offlineStorage';
import logger from '../utils/logger';

// Type definitions for dashboard with new statistics system
export interface DashboardStats {
  totalMembers: number;
  activeMembers: number;
  totalMeals: number;
  pendingMeals: number;
  approvedMeals?: number;
  totalBazarAmount: number;
  pendingBazar: number;
  monthlyExpense: number;
  averageMeals: number;
  balance: number;
  monthlyBudget: number;
  budgetUsed: number;
  lastUpdated?: string;
  mealRate?: number;
  todayMeals?: number;
  todayBreakfast?: number;
  todayLunch?: number;
  todayDinner?: number;
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

class DashboardServiceImpl implements DashboardService {
  async getHealth(): Promise<
    ApiResponse<{ message: string; timestamp: string }>
  > {
    try {
      logger.debug('Dashboard Service - Health check');
      const response = await httpClient.get<{
        message: string;
        timestamp: string;
      }>(API_ENDPOINTS.DASHBOARD.HEALTH);

      if (!response.success) {
        logger.error('Dashboard Service - Health check failed', response.error);
      }

      return response;
    } catch (error) {
      logger.error('Dashboard Service - Health check error', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Health check failed',
        data: undefined,
      };
    }
  }

  async getStats(): Promise<ApiResponse<DashboardStats>> {
    // Initialize dashboard data system (non-blocking)
    // This is called silently in the background and won't block the app
    offlineStorage.initializeDashboardData().catch(() => {
      // Silently handle - initialization is non-critical
    });

    return offlineStorage
      .getDataWithOfflineFallback(
        'dashboard_stats',
        async () => {
          logger.debug('Dashboard Service - Fetching stats');
          const response = await httpClient.get<DashboardStats>(
            API_ENDPOINTS.DASHBOARD.STATS
          );

          if (response.success && response.data) {
            await offlineStorage.setOfflineData(
              'dashboard_stats',
              response.data
            );
          } else {
            logger.error('Dashboard Service - Failed to fetch stats', response.error);
          }

          return response.data;
        },
        { useCache: true, forceRefresh: false }
      )
      .then(result => ({
        success: result.data !== null,
        data: result.data as DashboardStats | undefined,
        error: result.error,
      }));
  }

  async getActivities(): Promise<ApiResponse<Activity[]>> {
    return offlineStorage
      .getDataWithOfflineFallback(
        'dashboard_activities',
        async () => {
          logger.debug('Dashboard Service - Fetching activities');
          const response = await httpClient.get(
            API_ENDPOINTS.DASHBOARD.ACTIVITIES
          );

          if (response.success && response.data) {
            await offlineStorage.setOfflineData(
              'dashboard_activities',
              response.data
            );
          } else {
            logger.error('Dashboard Service - Failed to fetch activities', response.error);
          }

          return response.data;
        },
        { useCache: false, forceRefresh: true }
      )
      .then(result => ({
        success: result.data !== null,
        data: result.data as Activity[] | undefined,
        error: result.error,
      }));
  }

  async getAnalytics(
    filters: DashboardFilters = {}
  ): Promise<ApiResponse<AnalyticsData>> {
    const cacheKey = `dashboard_analytics_${JSON.stringify(filters)}`;

    return offlineStorage
      .getDataWithOfflineFallback(
        cacheKey,
        async () => {
          try {
            logger.debug('📈 Dashboard Service - Fetching analytics from API...');
            const queryParams = this.buildQueryParams(filters);
            const response = await httpClient.get(
              `${API_ENDPOINTS.DASHBOARD.ANALYTICS}?${queryParams}`
            );

            if (response.success && response.data != null) {
              logger.debug(
                '✅ Dashboard Service - Analytics fetched successfully'
              );
              await offlineStorage.setOfflineData(cacheKey, response.data);
              return response.data;
            }
            // 404 or missing endpoint: log as warn and return null so cache/offline can be used
            if (response.error?.includes('Resource not found') || response.error?.includes('not found')) {
              logger.warn(
                '⚠️ Dashboard Service - Analytics endpoint not available:',
                response.error
              );
            } else {
              logger.error(
                '❌ Dashboard Service - Failed to fetch analytics:',
                response.error
              );
            }
            return null;
          } catch (error) {
            const msg = error instanceof Error ? error.message : 'Unknown error';
            if (msg.includes('Resource not found')) {
              logger.warn('Dashboard Service - Analytics endpoint not available');
            } else {
              logger.error('Dashboard Service - Analytics fetch error', msg);
            }
            return null;
          }
        },
        { useCache: true, forceRefresh: false }
      )
      .then(result => ({
        success: result.data !== null,
        data: result.data as AnalyticsData,
        error: result.error,
      }));
  }

  async getCombinedData(
    filters: DashboardFilters = {}
  ): Promise<ApiResponse<CombinedDashboardData>> {
    const cacheKey = `dashboard_combined_${JSON.stringify(filters)}`;


    return offlineStorage
      .getDataWithOfflineFallback(
        cacheKey,
        async () => {
          logger.debug(
            '🔄 Dashboard Service - Fetching combined data from API...'
          );
          const queryParams = this.buildQueryParams(filters);
          const endpoint = `${API_ENDPOINTS.DASHBOARD.COMBINED}?${queryParams}`;

          const response = await httpClient.get(
            endpoint
          );

          if (response.success && response.data) {

            // Store offline data for future use
            await offlineStorage.setOfflineData(cacheKey, response.data);
          } else {
            logger.error(
              '❌ Dashboard Service - Failed to fetch combined data:',
              response.error
            );
          }

          return response.data;
        },
        { useCache: true, forceRefresh: false }
      )
      .then(result => ({
        success: result.data !== null,
        data: result.data as CombinedDashboardData,
        error: result.error,
      }));
  }

  async getStatistics(
    forceUpdate?: boolean
  ): Promise<ApiResponse<StatisticsData>> {
    return offlineStorage
      .getDataWithOfflineFallback(
        'dashboard_statistics',
        async () => {
          logger.debug('📊 Dashboard Service - Fetching statistics from API...');
          const response = await httpClient.get(
            API_ENDPOINTS.DASHBOARD.STATISTICS
          );

          if (response.success && response.data) {
            logger.debug(
              '✅ Dashboard Service - Statistics fetched successfully'
            );
            // Store offline data for future use
            await offlineStorage.setOfflineData(
              'dashboard_statistics',
              response.data
            );
          } else {
            logger.error(
              '❌ Dashboard Service - Failed to fetch statistics:',
              response.error
            );
          }

          return response.data;
        },
        { useCache: true, forceRefresh: forceUpdate || false }
      )
      .then(result => ({
        success: result.data !== null,
        data: result.data as StatisticsData,
        error: result.error,
      }));
  }

  async getMealDistribution(
    timeframe: string = 'week'
  ): Promise<ApiResponse<AnalyticsData['mealDistribution']>> {
    const cacheKey = `meal_distribution_${timeframe}`;

    return offlineStorage
      .getDataWithOfflineFallback(
        cacheKey,
        async () => {
          logger.debug(
            '🍽️ Dashboard Service - Fetching meal distribution from API...'
          );
          const response = await httpClient.get(
            `${API_ENDPOINTS.DASHBOARD.MEAL_DISTRIBUTION}?timeframe=${timeframe}`
          );

          if (response.success && response.data) {
            logger.debug(
              '✅ Dashboard Service - Meal distribution fetched successfully'
            );
            // Store offline data for future use
            await offlineStorage.setOfflineData(cacheKey, response.data);
          } else {
            logger.error(
              '❌ Dashboard Service - Failed to fetch meal distribution:',
              response.error
            );
          }

          return response.data;
        },
        { useCache: true, forceRefresh: false }
      )
      .then(result => ({
        success: result.data !== null,
        data: result.data as AnalyticsData['mealDistribution'],
        error: result.error,
      }));
  }

  async getExpenseTrend(
    timeframe: string = 'week'
  ): Promise<ApiResponse<AnalyticsData['expenseTrend']>> {
    const cacheKey = `expense_trend_${timeframe}`;

    return offlineStorage
      .getDataWithOfflineFallback(
        cacheKey,
        async () => {
          logger.debug(
            '💰 Dashboard Service - Fetching expense trend from API...'
          );
          const response = await httpClient.get(
            `${API_ENDPOINTS.DASHBOARD.EXPENSE_TREND}?timeframe=${timeframe}`
          );

          if (response.success && response.data) {
            logger.debug(
              '✅ Dashboard Service - Expense trend fetched successfully'
            );
            // Store offline data for future use
            await offlineStorage.setOfflineData(cacheKey, response.data);
          } else {
            logger.error(
              '❌ Dashboard Service - Failed to fetch expense trend:',
              response.error
            );
          }

          return response.data;
        },
        { useCache: true, forceRefresh: false }
      )
      .then(result => ({
        success: result.data !== null,
        data: result.data as AnalyticsData['expenseTrend'],
        error: result.error,
      }));
  }

  async getCategoryBreakdown(
    timeframe: string = 'week'
  ): Promise<ApiResponse<AnalyticsData['categoryBreakdown']>> {
    const cacheKey = `category_breakdown_${timeframe}`;

    return offlineStorage
      .getDataWithOfflineFallback(
        cacheKey,
        async () => {
          logger.debug(
            '📊 Dashboard Service - Fetching category breakdown from API...'
          );
          const response = await httpClient.get(
            `${API_ENDPOINTS.DASHBOARD.CATEGORY_BREAKDOWN}?timeframe=${timeframe}`
          );

          if (response.success && response.data) {
            logger.debug(
              '✅ Dashboard Service - Category breakdown fetched successfully'
            );
            // Store offline data for future use
            await offlineStorage.setOfflineData(cacheKey, response.data);
          } else {
            logger.error(
              '❌ Dashboard Service - Failed to fetch category breakdown:',
              response.error
            );
          }

          return response.data;
        },
        { useCache: true, forceRefresh: false }
      )
      .then(result => ({
        success: result.data !== null,
        data: result.data as AnalyticsData['categoryBreakdown'],
        error: result.error,
      }));
  }

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
      params.append('forceUpdate', 'true');
    }

    return params.toString();
  }

  // Convenience methods for different timeframes
  async getWeeklyData(): Promise<ApiResponse<CombinedDashboardData>> {
    return this.getCombinedData({ timeframe: 'week' });
  }

  async getMonthlyData(): Promise<ApiResponse<CombinedDashboardData>> {
    return this.getCombinedData({ timeframe: 'month' });
  }

  async getYearlyData(): Promise<ApiResponse<CombinedDashboardData>> {
    return this.getCombinedData({ timeframe: 'year' });
  }

  // Offline-first refresh method
  async refreshDashboard(): Promise<void> {
    logger.debug('🔄 Dashboard Service - Refreshing dashboard data...');

    try {
      // Clear cache to force fresh data
      await offlineStorage.clearCache();

      // Fetch fresh data
      await Promise.all([
        this.getStats(),
        this.getActivities(),
        this.getAnalytics(),
        this.getStatistics(true),
      ]);

      logger.debug('✅ Dashboard Service - Dashboard refreshed successfully');
    } catch (error) {
      logger.error(
        '❌ Dashboard Service - Failed to refresh dashboard:',
        error
      );
      throw error;
    }
  }

  // Error tracking methods
  getErrorStats() {
    return errorHandler.getErrorStats();
  }

  hasCriticalErrors(): boolean {
    return errorHandler.hasCriticalErrors();
  }
}

// Create and export singleton instance
const dashboardService = new DashboardServiceImpl();
export default dashboardService;
