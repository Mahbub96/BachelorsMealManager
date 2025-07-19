// API Configuration - Centralized settings for easy maintenance
export const API_CONFIG = {
  // Base URL - Change this to switch between development and production
  // For React Native development, we need to use the computer's IP address
  BASE_URL: __DEV__
    ? 'http://192.168.0.130:3000/api' // Use computer's IP for React Native development
    : 'https://your-production-domain.com/api',

  // API Version
  VERSION: 'v1',

  // Timeout settings
  TIMEOUT: 30000, // 30 seconds

  // Retry settings
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000, // 1 second

  // File upload settings
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_FILE_TYPES: ['image/jpeg', 'image/png', 'image/webp'],

  // Pagination defaults
  DEFAULT_PAGE_SIZE: 10,
  MAX_PAGE_SIZE: 100,

  // Cache settings
  CACHE_DURATION: 5 * 60 * 1000, // 5 minutes
};

// Environment-specific settings
export const ENV_CONFIG = {
  development: {
    logLevel: 'debug',
    enableMockData: false, // Disable mock data to use real database
  },
  production: {
    logLevel: 'error',
    enableMockData: false,
  },
};

export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL || 'http://192.168.0.130:3000/api';

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    VERIFY: '/auth/verify',
  },
  USERS: {
    PROFILE: '/users/profile',
    STATS: (userId: string) => `/users/stats/${userId}`,
    DASHBOARD: '/users/dashboard',
  },
  USER_STATS: {
    DASHBOARD: '/user-stats/dashboard',
    MEALS: '/user-stats/meals',
    BAZAR: '/user-stats/bazar',
    PAYMENTS: '/user-stats/payments',
  },
  MEALS: {
    LIST: '/meals',
    CREATE: '/meals',
    UPDATE: (id: string) => `/meals/${id}`,
    DELETE: (id: string) => `/meals/${id}`,
    USER_STATS: '/meals/stats/user',
    STATS: '/meals/stats/overview',
    SUBMIT: '/meals',
    USER: '/meals/user',
    ALL: '/meals/all',
    STATUS: (id: string) => `/meals/${id}/status`,
    BY_ID: (id: string) => `/meals/${id}`,
    BULK_APPROVE: '/meals/bulk-approve',
  },
  BAZAR: {
    LIST: '/bazar',
    CREATE: '/bazar',
    UPDATE: (id: string) => `/bazar/${id}`,
    DELETE: (id: string) => `/bazar/${id}`,
    USER_STATS: '/bazar/stats/user',
    SUBMIT: '/bazar',
    USER: '/bazar/user',
    ALL: '/bazar/all',
    STATUS: (id: string) => `/bazar/${id}/status`,
    STATS: '/bazar/stats/overview',
  },
  DASHBOARD: {
    STATS: '/dashboard/stats',
    ACTIVITIES: '/dashboard/activities',
    COMBINED: '/dashboard',
    HEALTH: '/health',
    STATISTICS: '/dashboard/statistics',
  },
  ANALYTICS: {
    OVERVIEW: '/analytics/overview',
    MEALS: '/analytics/meals',
    EXPENSES: '/analytics/expenses',
    DATA: '/analytics/data',
  },
  ACTIVITY: {
    RECENT: '/activity/recent',
    CURRENT_MONTH_MEALS: '/activity/meals/current-month',
    STATS: '/activity/stats',
    SEARCH: '/activity/search',
    BY_ID: '/activity',
  },
  STATISTICS: {
    COMPLETE: '/statistics/complete',
    GLOBAL: '/statistics/global',
    MEALS: '/statistics/meals',
    BAZAR: '/statistics/bazar',
    USERS: '/statistics/users',
    ACTIVITY: '/statistics/activity',
    MONTHLY: '/statistics/monthly',
    REFRESH: '/statistics/refresh',
  },
};

export const HTTP_CONFIG = {
  TIMEOUT: 10000,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
  CACHE_DURATION: 5 * 60 * 1000, // 5 minutes
};

export const ERROR_MESSAGES = {
  NETWORK_ERROR:
    'Network connection error. Please check your internet connection.',
  TIMEOUT_ERROR: 'Request timeout. Please try again.',
  SERVER_ERROR: 'Server error. Please try again later.',
  AUTH_ERROR: 'Authentication failed. Please log in again.',
  VALIDATION_ERROR: 'Invalid data provided.',
  UNKNOWN_ERROR: 'An unexpected error occurred.',
};

export const SUCCESS_MESSAGES = {
  LOGIN_SUCCESS: 'Login successful!',
  LOGOUT_SUCCESS: 'Logout successful!',
  PROFILE_UPDATED: 'Profile updated successfully!',
  MEAL_CREATED: 'Meal added successfully!',
  MEAL_UPDATED: 'Meal updated successfully!',
  MEAL_DELETED: 'Meal deleted successfully!',
  BAZAR_CREATED: 'Bazar entry added successfully!',
  BAZAR_UPDATED: 'Bazar entry updated successfully!',
  BAZAR_DELETED: 'Bazar entry deleted successfully!',
};

// HTTP Status Codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
} as const;

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Common API Error Types
export interface ApiError {
  code: string;
  message: string;
  details?: any;
}
