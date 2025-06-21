// Backend App Configuration
const APP_CONFIG = {
  // Server Configuration
  SERVER: {
    PORT: process.env.PORT || 5001,
    NODE_ENV: process.env.NODE_ENV || "development",
    CORS_ORIGIN: process.env.CORS_ORIGIN || "*",
  },

  // Database Configuration
  DATABASE: {
    MONGO_URI:
      process.env.MONGO_URI || "mongodb://localhost:27017/bachelor-mess",
    OPTIONS: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    },
  },

  // Authentication Configuration
  AUTH: {
    JWT_SECRET:
      process.env.JWT_SECRET ||
      "your-super-secret-jwt-key-change-this-in-production",
    JWT_EXPIRES_IN: "1d",
    PASSWORD_SALT_ROUNDS: 10,
  },

  // File Upload Configuration
  UPLOAD: {
    MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
    ALLOWED_MIME_TYPES: ["image/jpeg", "image/png", "image/gif"],
    UPLOAD_DIR: "uploads",
  },

  // Cloudinary Configuration (optional)
  CLOUDINARY: {
    CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
    API_KEY: process.env.CLOUDINARY_API_KEY,
    API_SECRET: process.env.CLOUDINARY_API_SECRET,
  },

  // API Configuration
  API: {
    PREFIX: "/api",
    VERSION: "v1",
    TIMEOUT: 10000,
  },

  // Validation
  VALIDATION: {
    PASSWORD_MIN_LENGTH: 6,
    EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  },

  // Limits
  LIMITS: {
    MAX_MEALS_PER_DAY: 3,
    MAX_BAZAR_AMOUNT: 10000,
    MAX_USERS_PER_MESS: 50,
  },
};

module.exports = APP_CONFIG;
