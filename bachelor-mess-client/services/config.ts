import { Platform } from 'react-native';

// Environment-based configuration for security
const getApiUrl = (): string => {
  // Use environment variable for API URL
  const envUrl = process.env.EXPO_PUBLIC_API_URL;

  console.log('🔧 Environment check:');
  console.log('🔧 EXPO_PUBLIC_API_URL:', envUrl);
  console.log('🔧 NODE_ENV:', process.env.NODE_ENV);
  console.log('🔧 __DEV__:', __DEV__);

  if (envUrl) {
    console.log('✅ Using environment API URL:', envUrl);
    return envUrl;
  }

  // Development fallback - should be overridden by environment
  if (__DEV__) {
    console.warn(
      '⚠️  Using development API URL. Set EXPO_PUBLIC_API_URL for production.'
    );
    // Use actual IP for development - works on device/emulator
    // Try different IPs based on environment
    let devUrl = 'http://192.168.0.130:3000';

    // For Android emulator, use 10.0.2.2
    if (Platform.OS === 'android' && __DEV__) {
      devUrl = 'http://10.0.2.2:3000';
    }

    // For iOS simulator, use localhost
    if (Platform.OS === 'ios' && __DEV__) {
      devUrl = 'http://localhost:3000';
    }
    console.log('🔧 Using development URL:', devUrl);
    return devUrl;
  }

  // Production should always use environment variable
  throw new Error(
    'EXPO_PUBLIC_API_URL environment variable is required for production'
  );
};

export const config = {
  apiUrl: getApiUrl(),
  timeout: parseInt(process.env.EXPO_PUBLIC_API_TIMEOUT || '10000'),
  maxRetries: parseInt(process.env.EXPO_PUBLIC_API_MAX_RETRIES || '3'),
  retryDelay: parseInt(process.env.EXPO_PUBLIC_API_RETRY_DELAY || '1000'),
  cacheDuration: parseInt(process.env.EXPO_PUBLIC_CACHE_DURATION || '300000'), // 5 minutes
};

// Validate configuration
if (!config.apiUrl) {
  throw new Error('API URL is not configured');
}

console.log('🔧 Final config:', {
  apiUrl: config.apiUrl,
  timeout: config.timeout,
  maxRetries: config.maxRetries,
  retryDelay: config.retryDelay,
  cacheDuration: config.cacheDuration,
});

// API Response interface
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  statusCode?: number;
}

// HTTP Status codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const;

// API Endpoints configuration - Updated to work with base URL (backend routes already include /api)
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/api/auth/login',
    REGISTER: '/api/auth/register',
    LOGOUT: '/api/auth/logout',
    REFRESH: '/api/auth/refresh',
  },
  USERS: {
    PROFILE: '/api/users/profile',
    UPDATE_PROFILE: '/api/users/profile',
    ALL: '/api/users',
    CREATE: '/api/users',
    BY_ID: (id: string) => `/api/users/${id}`,
    UPDATE: (id: string) => `/api/users/${id}`,
    DELETE: (id: string) => `/api/users/${id}`,
    STATS: (id: string) => `/api/users/${id}/stats`,
  },
  MEALS: {
    SUBMIT: '/api/meals/submit',
    USER: '/api/meals/user',
    ALL: '/api/meals',
    STATUS: (id: string) => `/api/meals/${id}/status`,
    UPDATE: (id: string) => `/api/meals/${id}`,
    DELETE: (id: string) => `/api/meals/${id}`,
    STATS: '/api/meals/stats/overview',
    USER_STATS: '/api/meals/user/stats',
    BY_ID: (id: string) => `/api/meals/${id}`,
    BULK_APPROVE: '/api/meals/bulk-approve',
  },
  BAZAR: {
    SUBMIT: '/api/bazar',
    USER: '/api/bazar/user',
    ALL: '/api/bazar/all',
    STATUS: (id: string) => `/api/bazar/${id}/status`,
    STATS: '/api/bazar/stats/overview',
    DELETE: (id: string) => `/api/bazar/${id}`,
    BY_ID: (id: string) => `/api/bazar/${id}`,
    UPDATE: (id: string) => `/api/bazar/${id}`,
    ADMIN_UPDATE: (id: string) => `/api/bazar/admin/${id}`,
    USER_STATS: '/api/bazar/stats/user',
    BULK_APPROVE: '/api/bazar/bulk-approve',
  },
  DASHBOARD: {
    HEALTH: '/health', // Public health endpoint
    STATS: '/api/dashboard/stats',
    ACTIVITIES: '/api/dashboard/activities',
    COMBINED: '/api/dashboard',
    STATISTICS: '/api/dashboard/statistics',
    ANALYTICS: '/api/dashboard/analytics',
    MEAL_DISTRIBUTION: '/api/dashboard/meal-distribution',
    EXPENSE_TREND: '/api/dashboard/expense-trend',
    CATEGORY_BREAKDOWN: '/api/dashboard/category-breakdown',
  },
  ANALYTICS: {
    DATA: '/api/analytics',
  },
  STATISTICS: {
    COMPLETE: '/api/statistics/complete',
    GLOBAL: '/api/statistics/global',
    MEALS: '/api/statistics/meals',
    BAZAR: '/api/statistics/bazar',
    USERS: '/api/statistics/users',
    ACTIVITY: '/api/statistics/activity',
    MONTHLY: '/api/statistics/monthly',
    REFRESH: '/api/statistics/refresh',
  },
  ACTIVITY: {
    RECENT: '/api/activity/recent',
    CURRENT_MONTH_MEALS: '/api/activity/meals/current-month',
    STATS: '/api/activity/stats',
    SEARCH: '/api/activity/search',
    BY_ID: (id: string) => `/api/activity/${id}`,
  },
  USER_STATS: {
    DASHBOARD: '/api/user-stats/dashboard',
    MEALS: '/api/user-stats/meals',
    BAZAR: '/api/bazar/stats/user', // Fixed: Use correct backend endpoint
    PAYMENTS: '/api/user-stats/payments',
  },
} as const;

export default config;
