import { API_ENDPOINTS as ORIGINAL_API_ENDPOINTS, ApiResponse } from './config';
// Extending API_ENDPOINTS locally since we can't easily modify config.ts without seeing it
const API_ENDPOINTS = {
  ...ORIGINAL_API_ENDPOINTS,
  STATISTICS: {
    ...ORIGINAL_API_ENDPOINTS.STATISTICS,
    REPORT: '/api/statistics/report',
  }
};
import httpClient from './httpClient';
import errorHandler from './errorHandler';

// Type definitions for statistics
export interface GlobalStats {
  totalUsers: number;
  activeUsers: number;
  totalMeals: number;
  totalBazarEntries: number;
  totalRevenue: number;
  totalExpenses: number;
  lastUpdated: string;
}

export interface MealStats {
  totalBreakfast: number;
  totalLunch: number;
  totalDinner: number;
  pendingMeals: number;
  approvedMeals: number;
  rejectedMeals: number;
  averageMealsPerDay: number;
  efficiency: number;
  lastUpdated: string;
}

export interface BazarStats {
  totalAmount: number;
  totalEntries: number;
  pendingEntries: number;
  approvedEntries: number;
  rejectedEntries: number;
  averageAmount: number;
  averageItemsPerEntry: number;
  lastUpdated: string;
}

export interface UserStats {
  adminUsers: number;
  memberUsers: number;
  inactiveUsers: number;
  newUsersThisMonth: number;
  activeUsersThisMonth: number;
  lastUpdated: string;
}

export interface MonthlyStats {
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

export interface CompleteStatistics {
  global: GlobalStats;
  meals: MealStats;
  bazar: BazarStats;
  users: UserStats;
  monthly: MonthlyStats;
  activity: ActivityStats;
  lastUpdated: string;
  isStale: boolean;
}

export interface MonthlyReportData {
  period: {
    month: number;
    year: number;
    startDate: string;
    endDate: string;
  };
  summary: {
    totalMeals: number;
    totalCost: number;
    mealRate: number;
    totalMembers: number;
  };
  members: Array<{
    user: {
      _id: string;
      name: string;
      email: string;
      profileImage?: string;
    };
    meals: {
      total: number;
      breakfast: number;
      lunch: number;
      dinner: number;
    };
    bazar: {
      totalAmount: number;
      entryCount: number;
    };
    financial: {
      mealCost: number;
      balance: number;
    };
  }>;
}

export interface StatisticsFilters {
  forceUpdate?: boolean;
  timeframe?: 'day' | 'week' | 'month' | 'year';
  type?: 'global' | 'meals' | 'bazar' | 'users' | 'activity';
}

export interface StatisticsService {
  getCompleteStatistics: (
    filters?: StatisticsFilters
  ) => Promise<ApiResponse<CompleteStatistics>>;
  getGlobalStats: (forceUpdate?: boolean) => Promise<ApiResponse<GlobalStats>>;
  getMealStats: (forceUpdate?: boolean) => Promise<ApiResponse<MealStats>>;
  getBazarStats: (forceUpdate?: boolean) => Promise<ApiResponse<BazarStats>>;
  getUserStats: (forceUpdate?: boolean) => Promise<ApiResponse<UserStats>>;
  getActivityStats: (
    forceUpdate?: boolean
  ) => Promise<ApiResponse<ActivityStats>>;
  getMonthlyStats: (
    forceUpdate?: boolean
  ) => Promise<ApiResponse<MonthlyStats>>;
  refreshStatistics: () => Promise<ApiResponse<void>>;
  getMonthlyReport: (
    month: number,
    year: number
  ) => Promise<ApiResponse<MonthlyReportData>>;
}

// Statistics service implementation
class StatisticsServiceImpl implements StatisticsService {
  async getCompleteStatistics(
    filters: StatisticsFilters = {}
  ): Promise<ApiResponse<CompleteStatistics>> {
    try {
      console.log('📊 Fetching complete statistics...', filters);
      const queryParams = this.buildQueryParams(filters);
      const endpoint = `${API_ENDPOINTS.STATISTICS.COMPLETE}${queryParams}`;

      const response = await httpClient.get<CompleteStatistics>(endpoint, {
        cache: true,
        cacheKey: `complete_statistics_${JSON.stringify(filters)}`,
        offlineFallback: true,
        retries: 2,
      });

      if (!response.success) {
        const appError = errorHandler.handleApiResponse(
          response,
          'Complete Statistics'
        );
        console.error(
          '❌ Failed to fetch complete statistics:',
          appError?.message
        );
      } else {
        console.log('✅ Complete statistics fetched successfully');
      }

      return response;
    } catch (error) {
      const appError = errorHandler.handleError(error, 'Complete Statistics');
      return {
        success: false,
        error: appError.userFriendlyMessage,
      };
    }
  }

  async getGlobalStats(
    forceUpdate?: boolean
  ): Promise<ApiResponse<GlobalStats>> {
    try {
      console.log('🌍 Fetching global statistics...', forceUpdate);
      const queryParams = this.buildQueryParams({ forceUpdate });
      const endpoint = `${API_ENDPOINTS.STATISTICS.GLOBAL}${queryParams}`;

      const response = await httpClient.get<GlobalStats>(endpoint, {
        cache: true,
        cacheKey: `global_stats_${forceUpdate ? 'force' : ''}`,
        offlineFallback: true,
        retries: 2,
      });

      if (!response.success) {
        const appError = errorHandler.handleApiResponse(
          response,
          'Global Statistics'
        );
        console.error(
          '❌ Failed to fetch global statistics:',
          appError?.message
        );
      } else {
        console.log('✅ Global statistics fetched successfully');
      }

      return response;
    } catch (error) {
      const appError = errorHandler.handleError(error, 'Global Statistics');
      return {
        success: false,
        error: appError.userFriendlyMessage,
      };
    }
  }

  async getMealStats(forceUpdate?: boolean): Promise<ApiResponse<MealStats>> {
    try {
      console.log('🍽️ Fetching meal statistics...', forceUpdate);
      const queryParams = this.buildQueryParams({ forceUpdate });
      const endpoint = `${API_ENDPOINTS.STATISTICS.MEALS}${queryParams}`;

      const response = await httpClient.get<MealStats>(endpoint, {
        cache: true,
        cacheKey: `meal_stats_${forceUpdate ? 'force' : ''}`,
        offlineFallback: true,
        retries: 2,
      });

      if (!response.success) {
        const appError = errorHandler.handleApiResponse(
          response,
          'Meal Statistics'
        );
        console.error('❌ Failed to fetch meal statistics:', appError?.message);
      } else {
        console.log('✅ Meal statistics fetched successfully');
      }

      return response;
    } catch (error) {
      const appError = errorHandler.handleError(error, 'Meal Statistics');
      return {
        success: false,
        error: appError.userFriendlyMessage,
      };
    }
  }

  async getBazarStats(forceUpdate?: boolean): Promise<ApiResponse<BazarStats>> {
    try {
      console.log('🛒 Fetching bazar statistics...', forceUpdate);
      const queryParams = this.buildQueryParams({ forceUpdate });
      const endpoint = `${API_ENDPOINTS.STATISTICS.BAZAR}${queryParams}`;

      const response = await httpClient.get<BazarStats>(endpoint, {
        cache: true,
        cacheKey: `bazar_stats_${forceUpdate ? 'force' : ''}`,
        offlineFallback: true,
        retries: 2,
      });

      if (!response.success) {
        const appError = errorHandler.handleApiResponse(
          response,
          'Bazar Statistics'
        );
        console.error(
          '❌ Failed to fetch bazar statistics:',
          appError?.message
        );
      } else {
        console.log('✅ Bazar statistics fetched successfully');
      }

      return response;
    } catch (error) {
      const appError = errorHandler.handleError(error, 'Bazar Statistics');
      return {
        success: false,
        error: appError.userFriendlyMessage,
      };
    }
  }

  async getUserStats(forceUpdate?: boolean): Promise<ApiResponse<UserStats>> {
    try {
      console.log('👥 Fetching user statistics...', forceUpdate);
      const queryParams = this.buildQueryParams({ forceUpdate });
      const endpoint = `${API_ENDPOINTS.STATISTICS.USERS}${queryParams}`;

      const response = await httpClient.get<UserStats>(endpoint, {
        cache: true,
        cacheKey: `user_stats_${forceUpdate ? 'force' : ''}`,
        offlineFallback: true,
        retries: 2,
      });

      if (!response.success) {
        const appError = errorHandler.handleApiResponse(
          response,
          'User Statistics'
        );
        console.error('❌ Failed to fetch user statistics:', appError?.message);
      } else {
        console.log('✅ User statistics fetched successfully');
      }

      return response;
    } catch (error) {
      const appError = errorHandler.handleError(error, 'User Statistics');
      return {
        success: false,
        error: appError.userFriendlyMessage,
      };
    }
  }

  async getActivityStats(
    forceUpdate?: boolean
  ): Promise<ApiResponse<ActivityStats>> {
    try {
      console.log('📈 Fetching activity statistics...', forceUpdate);
      const queryParams = this.buildQueryParams({ forceUpdate });
      const endpoint = `${API_ENDPOINTS.STATISTICS.ACTIVITY}${queryParams}`;

      const response = await httpClient.get<ActivityStats>(endpoint, {
        cache: true,
        cacheKey: `activity_stats_${forceUpdate ? 'force' : ''}`,
        offlineFallback: true,
        retries: 2,
      });

      if (!response.success) {
        const appError = errorHandler.handleApiResponse(
          response,
          'Activity Statistics'
        );
        console.error(
          '❌ Failed to fetch activity statistics:',
          appError?.message
        );
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

  async getMonthlyStats(
    forceUpdate?: boolean
  ): Promise<ApiResponse<MonthlyStats>> {
    try {
      console.log('📅 Fetching monthly statistics...', forceUpdate);
      const queryParams = this.buildQueryParams({ forceUpdate });
      const endpoint = `${API_ENDPOINTS.STATISTICS.MONTHLY}${queryParams}`;

      const response = await httpClient.get<MonthlyStats>(endpoint, {
        cache: true,
        cacheKey: `monthly_stats_${forceUpdate ? 'force' : ''}`,
        offlineFallback: true,
        retries: 2,
      });

      if (!response.success) {
        const appError = errorHandler.handleApiResponse(
          response,
          'Monthly Statistics'
        );
        console.error(
          '❌ Failed to fetch monthly statistics:',
          appError?.message
        );
      } else {
        console.log('✅ Monthly statistics fetched successfully');
      }

      return response;
    } catch (error) {
      const appError = errorHandler.handleError(error, 'Monthly Statistics');
      return {
        success: false,
        error: appError.userFriendlyMessage,
      };
    }
  }

  async getMonthlyReport(
    month: number,
    year: number
  ): Promise<ApiResponse<MonthlyReportData>> {
    try {
      const endpoint = `${API_ENDPOINTS.STATISTICS.REPORT}?month=${month}&year=${year}`;

      const response = await httpClient.get<MonthlyReportData>(endpoint, {
        cache: true,
        cacheKey: `monthly_report_${month}_${year}`,
        offlineFallback: true,
        retries: 2,
      });

      if (!response.success) {
        const appError = errorHandler.handleApiResponse(
          response,
          'Monthly Report'
        );
        console.error('❌ Failed to fetch monthly report:', appError?.message);
      }

      return response;
    } catch (error) {
      const appError = errorHandler.handleError(error, 'Monthly Report');
      return {
        success: false,
        error: appError.userFriendlyMessage,
      };
    }
  }

  async refreshStatistics(): Promise<ApiResponse<void>> {
    try {
      console.log('🔄 Refreshing all statistics...');
      const response = await httpClient.post<void>(
        API_ENDPOINTS.STATISTICS.REFRESH,
        {},
        { cache: false }
      );

      if (!response.success) {
        const appError = errorHandler.handleApiResponse(
          response,
          'Statistics Refresh'
        );
        console.error('❌ Failed to refresh statistics:', appError?.message);
      } else {
        console.log('✅ Statistics refreshed successfully');
      }

      return response;
    } catch (error) {
      const appError = errorHandler.handleError(error, 'Statistics Refresh');
      return {
        success: false,
        error: appError.userFriendlyMessage,
      };
    }
  }

  private buildQueryParams(filters: StatisticsFilters): string {
    const params = new URLSearchParams();

    if (filters.forceUpdate) {
      params.append('forceUpdate', filters.forceUpdate.toString());
    }

    if (filters.timeframe) {
      params.append('timeframe', filters.timeframe);
    }

    if (filters.type) {
      params.append('type', filters.type);
    }

    const queryString = params.toString();
    return queryString ? `?${queryString}` : '';
  }

  // Utility methods for quick access
  async getDashboardStats() {
    const stats = await this.getCompleteStatistics();
    if (stats.success && stats.data) {
      return {
        totalMembers: stats.data.global.totalUsers,
        activeMembers: stats.data.global.activeUsers,
        totalMeals: stats.data.global.totalMeals,
        pendingMeals: stats.data.meals.pendingMeals,
        totalBazarAmount: stats.data.bazar.totalAmount,
        pendingBazar: stats.data.bazar.pendingEntries,
        monthlyExpense: stats.data.monthly.currentMonth.bazar.totalAmount,
        averageMeals: stats.data.meals.averageMealsPerDay,
        balance: 0, // Calculate based on your business logic
        monthlyBudget: 40000,
        budgetUsed:
          stats.data.monthly.currentMonth.bazar.totalAmount > 0
            ? Math.round(
                (stats.data.monthly.currentMonth.bazar.totalAmount / 40000) *
                  100
              )
            : 0,
        lastUpdated: stats.data.lastUpdated,
      };
    }
    return null;
  }

  async getQuickStats() {
    const [global, meals, bazar] = await Promise.all([
      this.getGlobalStats(),
      this.getMealStats(),
      this.getBazarStats(),
    ]);

    return {
      global: global.success ? global.data : null,
      meals: meals.success ? meals.data : null,
      bazar: bazar.success ? bazar.data : null,
    };
  }
}

// Export singleton instance
const statisticsService = new StatisticsServiceImpl();
export default statisticsService;
