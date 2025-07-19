// Legacy API Service - Updated to use new scalable structure
// This file maintains backward compatibility while using the new service architecture

import { dashboardService } from './index';

// Legacy analytics API - now uses the new dashboard service
export const analyticsAPI = {
  // Get analytics data for a specific timeframe
  getAnalyticsData: async (timeframe = 'week') => {
    try {
      const response = await dashboardService.getAnalytics({ timeframe });
      return response;
    } catch (error) {
      console.error('Error fetching analytics data:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  },

  // Get dashboard stats
  getDashboardStats: async () => {
    try {
      const response = await dashboardService.getStats();
      return response;
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  },

  // Get recent activities
  getRecentActivities: async () => {
    try {
      const response = await dashboardService.getActivities();
      return response;
    } catch (error) {
      console.error('Error fetching recent activities:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  },

  // Get all dashboard data
  getDashboardData: async (timeframe = 'week') => {
    try {
      const response = await dashboardService.getCombinedData({ timeframe });
      return response;
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  },

  // Get specific data types individually (for faster loading)
  getMealDistribution: async (timeframe = 'week') => {
    try {
      const response = await dashboardService.getMealDistribution(timeframe);
      return response;
    } catch (error) {
      console.error('Error fetching meal distribution:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  },

  getExpenseTrend: async (timeframe = 'week') => {
    try {
      const response = await dashboardService.getExpenseTrend(timeframe);
      return response;
    } catch (error) {
      console.error('Error fetching expense trend:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  },

  getCategoryBreakdown: async (timeframe = 'week') => {
    try {
      const response = await dashboardService.getCategoryBreakdown(timeframe);
      return response;
    } catch (error) {
      console.error('Error fetching category breakdown:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  },
};

// Export default for backward compatibility
export default analyticsAPI;

// Export new services for modern usage
export {
  authService,
  bazarService,
  dashboardService,
  mealService,
  userService,
} from './index';
