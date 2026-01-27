// Centralized API Services Export
// This file provides a single point of access to all API services

// Core HTTP Client
export { default as httpClient } from './httpClient';

// Network Service
export { default as networkService } from './networkService';

// Configuration
export * from './config';

// Authentication Service
export { default as authService } from './authService';
export type {
  AuthService,
  User as AuthUser,
  LoginCredentials,
  LoginResponse,
  RegisterData,
} from './authService';

// Meal Management Service
export { default as mealService } from './mealService';
export type {
  MealEntry,
  MealFilters,
  MealService,
  MealStats,
  MealStatusUpdate,
  MealSubmission,
} from './mealService';

// Bazar (Grocery) Management Service
export { default as bazarService } from './bazarService';
export type {
  BazarEntry,
  BazarFilters,
  BazarItem,
  BazarService,
  BazarStats,
  BazarStatusUpdate,
  BazarSubmission,
} from './bazarService';

// Dashboard & Analytics Service
export { default as dashboardService } from './dashboardService';
export type {
  Activity,
  AnalyticsData,
  CombinedDashboardData,
  DashboardFilters,
  DashboardService,
  DashboardStats,
} from './dashboardService';

// User Management Service
export { default as userService } from './userService';
export type {
  CreateUserData,
  UpdateUserData,
  User,
  UserFilters,
  UserService,
  UserStats,
} from './userService';

// Notification Service
export { notificationService } from './notificationService';
export type {
  NotificationData,
  NotificationSettings,
  NotificationService,
} from './notificationService';

// Real-time Service
export { realtimeService } from './realtimeService';
export type {
  RealtimeEvent,
  RealtimeEventType,
  RealtimeConnection,
  RealtimeService,
} from './realtimeService';

// Background Sync Service
export { backgroundSyncService } from './backgroundSyncService';
export type {
  SyncTask,
  SyncStatus,
  BackgroundSyncService,
} from './backgroundSyncService';

// Crash Reporting Service
export { crashReportingService } from './crashReportingService';
export type {
  CrashReport,
  DeviceInfo as CrashDeviceInfo,
  AppInfo as CrashAppInfo,
  PerformanceMetric,
  CrashReportingService,
} from './crashReportingService';

// Analytics Tracking Service
export { analyticsTrackingService } from './analyticsTrackingService';
export type {
  AnalyticsEvent,
  UserProperties,
  SessionInfo,
  DeviceInfo,
  AppInfo,
  AnalyticsTrackingService,
} from './analyticsTrackingService';

// Feature Manager Service
export { featureManager } from './featureManager';
export type {
  FeatureConfig,
  FeatureStatus,
  FeatureManager,
} from './featureManager';

// Offline Storage Service
export { offlineStorage } from './offlineStorage';
export type { OfflineConfig, OfflineData, SyncQueueItem } from './offlineStorage';

// API Service Manager - For managing all services together
export class ApiServiceManager {
  static async clearAllCache(): Promise<void> {
    try {
      const httpClient = (await import('./httpClient')).default;
      await httpClient.clearCache();
      console.log('All API cache cleared');
    } catch (error) {
      console.error('Error clearing all cache:', error);
    }
  }

  static async healthCheck(): Promise<boolean> {
    try {
      const dashboardService = (await import('./dashboardService')).default;
      const response = await dashboardService.getHealth();
      return response.success;
    } catch (error) {
      console.error('Health check failed:', error);
      return false;
    }
  }

  static async refreshAllData(): Promise<void> {
    try {
      await this.clearAllCache();
      console.log('All data refreshed');
    } catch (error) {
      console.error('Error refreshing data:', error);
    }
  }
}
