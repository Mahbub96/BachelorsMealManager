// Client App Configuration
const APP_CONFIG = {
  // App Information
  APP_NAME: process.env.EXPO_PUBLIC_APP_NAME || "Bachelor Mess Manager",
  APP_VERSION: process.env.EXPO_PUBLIC_APP_VERSION || "1.0.0",

  // UI Configuration
  UI: {
    THEME: {
      PRIMARY_COLOR: "#667eea",
      SECONDARY_COLOR: "#764ba2",
      SUCCESS_COLOR: "#10b981",
      WARNING_COLOR: "#f59e0b",
      ERROR_COLOR: "#ef4444",
      BACKGROUND_COLOR: "#f8fafc",
      TEXT_COLOR: "#1f2937",
      TEXT_SECONDARY: "#6b7280",
    },
    SPACING: {
      XS: 4,
      SM: 8,
      MD: 16,
      LG: 24,
      XL: 32,
    },
    BORDER_RADIUS: {
      SM: 8,
      MD: 12,
      LG: 16,
      XL: 24,
    },
  },

  // Validation Configuration
  VALIDATION: {
    PASSWORD_MIN_LENGTH: 6,
    EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    NAME_MIN_LENGTH: 2,
    NAME_MAX_LENGTH: 50,
  },

  // Features Configuration
  FEATURES: {
    GOOGLE_AUTH: false,
    PUSH_NOTIFICATIONS: true,
    DARK_MODE: true,
    OFFLINE_MODE: false,
  },

  // API Configuration
  API: {
    BASE_URL: "http://localhost:5001/api",
    TIMEOUT: 10000,
    RETRY_ATTEMPTS: 3,
  },

  // Storage Configuration
  STORAGE: {
    USER_TOKEN_KEY: "user_token",
    USER_DATA_KEY: "user_data",
    SETTINGS_KEY: "app_settings",
  },

  // Limits
  LIMITS: {
    MAX_MEALS_PER_DAY: 3,
    MAX_BAZAR_AMOUNT: 10000,
    MAX_USERS_PER_MESS: 50,
  },
};

export default APP_CONFIG;
