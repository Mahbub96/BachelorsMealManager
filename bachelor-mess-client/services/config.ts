import { Platform } from 'react-native';

// Environment-based configuration for security
const getApiUrl = (): string => {
  // Use environment variable for API URL (highest priority)
  const envUrl = process.env.EXPO_PUBLIC_API_URL;

  // If environment variable is set, use it (remove trailing /api if present, we add it in endpoints)
  if (envUrl) {
    // Remove trailing slash and /api if present
    const cleanUrl = envUrl.replace(/\/api\/?$/, '').replace(/\/$/, '');
    return cleanUrl;
  }

  // Development fallback - platform-specific defaults
  if (__DEV__) {
    // Use localhost for web platform (browser) - works with local backend
    if (Platform.OS === 'web') {
      return 'http://localhost:3000';
    }

    // For Android emulator, use 10.0.2.2 (maps to host's localhost)
    if (Platform.OS === 'android') {
      return 'http://10.0.2.2:3000';
    }

    // For iOS simulator, use localhost
    if (Platform.OS === 'ios') {
      return 'http://localhost:3000';
    }

    // Fallback for other platforms
    return 'http://localhost:3000';
  }

  // Production should always use environment variable
  throw new Error(
    'EXPO_PUBLIC_API_URL is required in production. Please set it in your .env file.'
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
    CHANGE_PASSWORD: '/api/auth/change-password',
    FORGOT_PASSWORD: '/api/auth/forgot-password',
    RESET_PASSWORD: '/api/auth/reset-password',
    VERIFY_TOKEN: '/api/auth/verify',
    PROFILE: '/api/auth/profile',
  },
  USERS: {
    PROFILE: '/api/users/profile',
    UPDATE_PROFILE: '/api/users/profile',
    ALL: '/api/users',
    CREATE: '/api/users',
    BY_ID: (id: string) => `/api/users/${id}`,
    UPDATE: (id: string) => `/api/users/${id}`,
    DELETE: (id: string) => `/api/users/${id}`,
    RESET_PASSWORD: (id: string) => `/api/users/${id}/reset-password`,
    STATS: (id: string) => `/api/users/${id}/stats`,
  },
  MEALS: {
    SUBMIT: '/api/meals',
    USER: '/api/meals',
    ALL: '/api/meals/all',
    STATUS: (id: string) => `/api/meals/${id}/status`,
    UPDATE: (id: string) => `/api/meals/${id}`,
    DELETE: (id: string) => `/api/meals/${id}`,
    STATS: '/api/meals/stats/overview',
    USER_STATS: '/api/meals/stats/user',
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
  UI_CONFIG: {
    ACTIVE: '/api/ui-config/active',
    CREATE: '/api/ui-config',
    UPDATE: (id: string) => `/api/ui-config/${id}`,
    DELETE: (id: string) => `/api/ui-config/${id}`,
    BY_ID: (id: string) => `/api/ui-config/${id}`,
    ALL: '/api/ui-config',
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
    BAZAR: '/api/user-stats/bazar', // Group-scoped: my total + group total (this month)
    PAYMENTS: '/api/user-stats/payments',
  },
} as const;

export default config;
