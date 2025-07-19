// Environment-based configuration for security
const getApiUrl = (): string => {
  // Use environment variable for API URL
  const envUrl = process.env.EXPO_PUBLIC_API_URL;

  if (envUrl) {
    return envUrl;
  }

  // Development fallback - should be overridden by environment
  if (__DEV__) {
    console.warn(
      '⚠️  Using development API URL. Set EXPO_PUBLIC_API_URL for production.'
    );
    // Use actual IP for development - works on device/emulator
    return 'http://192.168.0.130:3000/api';
  }

  // Production should always use environment variable
  throw new Error(
    'EXPO_PUBLIC_API_URL environment variable is required for production'
  );
};

export const config = {
  apiUrl: getApiUrl(),
  timeout: 10000,
  maxRetries: 3,
  retryDelay: 1000,
  cacheDuration: 300000, // 5 minutes
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

// API Endpoints configuration
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
  },
  USERS: {
    PROFILE: '/users/profile',
    UPDATE_PROFILE: '/users/profile',
    ALL: '/users',
    BY_ID: (id: string) => `/users/${id}`,
    UPDATE: (id: string) => `/users/${id}`,
    DELETE: (id: string) => `/users/${id}`,
    STATS: (id: string) => `/users/${id}/stats`,
  },
  MEALS: {
    SUBMIT: '/meals/submit',
    USER: '/meals/user',
    ALL: '/meals',
    STATUS: (id: string) => `/meals/${id}/status`,
    UPDATE: (id: string) => `/meals/${id}`,
    DELETE: (id: string) => `/meals/${id}`,
    STATS: '/meals/stats/overview',
    USER_STATS: '/meals/user/stats',
    BY_ID: (id: string) => `/meals/${id}`,
    BULK_APPROVE: '/meals/bulk-approve',
  },
  BAZAR: {
    SUBMIT: '/bazar',
    USER: '/bazar/user',
    ALL: '/bazar/all',
    STATUS: (id: string) => `/bazar/${id}/status`,
    STATS: '/bazar/stats/overview',
    DELETE: (id: string) => `/bazar/${id}`,
    BY_ID: (id: string) => `/bazar/${id}`,
    UPDATE: (id: string) => `/bazar/${id}`,
    USER_STATS: '/bazar/stats/user',
    BULK_APPROVE: '/bazar/bulk-approve',
  },
  DASHBOARD: {
    HEALTH: '/health', // Public health endpoint
    STATS: '/dashboard/stats',
    ACTIVITIES: '/dashboard/activities',
    COMBINED: '/dashboard',
    STATISTICS: '/dashboard/statistics',
  },
  ANALYTICS: {
    DATA: '/analytics',
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
  ACTIVITY: {
    RECENT: '/activity/recent',
    CURRENT_MONTH_MEALS: '/activity/current-month-meals',
    STATS: '/activity/stats',
    SEARCH: '/activity/search',
    BY_ID: (id: string) => `/activity/${id}`,
  },
  USER_STATS: {
    DASHBOARD: '/user-stats/dashboard',
    MEALS: '/user-stats/meals',
    BAZAR: '/user-stats/bazar',
    PAYMENTS: '/user-stats/payments',
  },
} as const;

export default config;
