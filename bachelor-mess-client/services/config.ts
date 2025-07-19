// API Configuration - Centralized settings for easy maintenance
export const API_CONFIG = {
  // Base URL - Change this to switch between development and production
  BASE_URL: __DEV__
    ? 'http://192.168.0.130:3000/api'
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
    enableMockData: true,
  },
  production: {
    logLevel: 'error',
    enableMockData: false,
  },
};

// API Endpoints - Centralized for easy maintenance
export const API_ENDPOINTS = {
  // Authentication
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
  },

  // Dashboard
  DASHBOARD: {
    HEALTH: '/health',
    STATS: '/dashboard/stats',
    ACTIVITIES: '/dashboard/activities',
    COMBINED: '/dashboard',
  },

  // Meals
  MEALS: {
    SUBMIT: '/meals/submit',
    USER: '/meals/user',
    ALL: '/meals/all',
    STATS: '/meals/stats',
    STATUS: (id: string) => `/meals/${id}/status`,
  },

  // Bazar (Grocery)
  BAZAR: {
    SUBMIT: '/bazar/submit',
    USER: '/bazar/user',
    ALL: '/bazar/all',
    STATS: '/bazar/stats',
    STATUS: (id: string) => `/bazar/${id}/status`,
  },

  // Users
  USERS: {
    ALL: '/users/all',
    BY_ID: (id: string) => `/users/${id}`,
    CREATE: '/users/create',
    UPDATE: (id: string) => `/users/${id}`,
    DELETE: (id: string) => `/users/${id}`,
    STATS: (id: string) => `/users/${id}/stats`,
    PROFILE: '/users/profile',
    UPDATE_PROFILE: '/users/profile',
  },

  // Analytics
  ANALYTICS: {
    DATA: '/analytics',
  },
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
