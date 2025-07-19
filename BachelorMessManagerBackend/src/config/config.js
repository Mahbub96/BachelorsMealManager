const path = require('path');

// Environment-based configuration
const config = {
  // Server Configuration
  server: {
    port: process.env.PORT || 3000,
    host: process.env.HOST || '0.0.0.0',
    nodeEnv: process.env.NODE_ENV || 'development',
    apiPrefix: process.env.API_PREFIX || '/api',
    apiVersion: process.env.API_VERSION || 'v1',
    gracefulShutdownTimeout: parseInt(process.env.GRACEFUL_SHUTDOWN_TIMEOUT) || 30000,
  },

  // Clustering Configuration
  clustering: {
    enabled: process.env.ENABLE_CLUSTERING === 'true',
    maxWorkers: parseInt(process.env.MAX_WORKERS) || require('os').cpus().length,
  },

  // Database Configuration
  database: {
    uri: process.env.NODE_ENV === 'production' 
      ? process.env.MONGODB_URI_PROD 
      : process.env.MONGODB_URI,
    options: {
      maxPoolSize: parseInt(process.env.MONGODB_MAX_POOL_SIZE) || 10,
      minPoolSize: parseInt(process.env.MONGODB_MIN_POOL_SIZE) || 2,
      serverSelectionTimeoutMS: parseInt(process.env.MONGODB_SERVER_SELECTION_TIMEOUT) || 5000,
      socketTimeoutMS: parseInt(process.env.MONGODB_SOCKET_TIMEOUT) || 45000,
      maxIdleTimeMS: parseInt(process.env.MONGODB_MAX_IDLE_TIME) || 30000,
      retryWrites: true,
      w: 'majority',
      readPreference: 'primary',
      readConcern: { level: 'local' },
      writeConcern: { w: 'majority', j: true }
    }
  },

  // JWT Configuration
  jwt: {
    secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  },

  // Security Configuration
  security: {
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS) || 12,
    rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
    rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
    slowDownDelayMs: parseInt(process.env.SLOW_DOWN_DELAY_MS) || 500,
    enabled: process.env.ENABLE_SECURITY !== 'false',
  },

  // CORS Configuration
  cors: {
    origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : ['http://localhost:3000'],
    credentials: process.env.CORS_CREDENTIALS === 'true',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-API-Key'],
    exposedHeaders: ['X-Total-Count', 'X-Page-Count'],
    maxAge: 86400 // 24 hours
  },

  // File Upload Configuration
  upload: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 5242880, // 5MB
    allowedFileTypes: process.env.ALLOWED_FILE_TYPES ? 
      process.env.ALLOWED_FILE_TYPES.split(',') : 
      ['image/jpeg', 'image/png', 'image/webp'],
    uploadPath: process.env.UPLOAD_PATH || path.join(__dirname, '../../uploads'),
  },

  // Cloudinary Configuration
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET,
  },

  // Logging Configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    filePath: process.env.LOG_FILE_PATH || 'logs/app.log',
    enabled: process.env.ENABLE_LOGGING !== 'false',
    maxFiles: parseInt(process.env.LOG_MAX_FILES) || 5,
    maxSize: process.env.LOG_MAX_SIZE || '10m',
  },

  // Performance Configuration
  performance: {
    enableCompression: process.env.ENABLE_COMPRESSION !== 'false',
    bodyLimit: process.env.BODY_LIMIT || '10mb',
    enableHealthCheck: process.env.ENABLE_HEALTH_CHECK !== 'false',
    enableMetrics: process.env.ENABLE_METRICS === 'true',
  },

  // Monitoring Configuration
  monitoring: {
    enabled: process.env.ENABLE_MONITORING === 'true',
    metricsPort: parseInt(process.env.METRICS_PORT) || 9090,
    healthCheckInterval: parseInt(process.env.HEALTH_CHECK_INTERVAL) || 30000,
  },

  // Pagination Configuration
  pagination: {
    defaultLimit: parseInt(process.env.DEFAULT_PAGINATION_LIMIT) || 10,
    maxLimit: parseInt(process.env.MAX_PAGINATION_LIMIT) || 100,
  },

  // Cache Configuration
  cache: {
    enabled: process.env.ENABLE_CACHE === 'true',
    ttl: parseInt(process.env.CACHE_TTL) || 300, // 5 minutes
    maxSize: parseInt(process.env.CACHE_MAX_SIZE) || 100,
  },

  // Email Configuration (for future use)
  email: {
    enabled: process.env.ENABLE_EMAIL === 'true',
    provider: process.env.EMAIL_PROVIDER || 'smtp',
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: process.env.EMAIL_SECURE === 'true',
    username: process.env.EMAIL_USERNAME,
    password: process.env.EMAIL_PASSWORD,
  },

  // SMS Configuration (for future use)
  sms: {
    enabled: process.env.ENABLE_SMS === 'true',
    provider: process.env.SMS_PROVIDER || 'twilio',
    accountSid: process.env.SMS_ACCOUNT_SID,
    authToken: process.env.SMS_AUTH_TOKEN,
    fromNumber: process.env.SMS_FROM_NUMBER,
  },

  // Feature Flags
  features: {
    enableUserRegistration: process.env.ENABLE_USER_REGISTRATION !== 'false',
    enableEmailVerification: process.env.ENABLE_EMAIL_VERIFICATION === 'true',
    enableSMSVerification: process.env.ENABLE_SMS_VERIFICATION === 'true',
    enablePasswordReset: process.env.ENABLE_PASSWORD_RESET !== 'false',
    enableTwoFactorAuth: process.env.ENABLE_TWO_FACTOR_AUTH === 'true',
    enableAuditLog: process.env.ENABLE_AUDIT_LOG === 'true',
    enableBackup: process.env.ENABLE_BACKUP === 'true',
  },

  // Business Logic Configuration
  business: {
    defaultMealPrice: parseFloat(process.env.DEFAULT_MEAL_PRICE) || 120,
    maxMealsPerDay: parseInt(process.env.MAX_MEALS_PER_DAY) || 3,
    maxBazarAmount: parseFloat(process.env.MAX_BAZAR_AMOUNT) || 10000,
    mealApprovalRequired: process.env.MEAL_APPROVAL_REQUIRED === 'true',
    bazarApprovalRequired: process.env.BAZAR_APPROVAL_REQUIRED === 'true',
    autoApproveMeals: process.env.AUTO_APPROVE_MEALS === 'true',
    autoApproveBazar: process.env.AUTO_APPROVE_BAZAR === 'true',
  }
};

// Validation function to check required configuration
const validateConfig = () => {
  const errors = [];

  // Check required environment variables
  if (!config.database.uri) {
    errors.push('MONGODB_URI is required');
  }

  if (!config.jwt.secret || config.jwt.secret === 'your-super-secret-jwt-key-change-this-in-production') {
    errors.push('JWT_SECRET must be set to a secure value');
  }

  if (!config.cloudinary.cloudName || !config.cloudinary.apiKey || !config.cloudinary.apiSecret) {
    console.warn('Cloudinary configuration is incomplete. File uploads may not work properly.');
  }

  if (errors.length > 0) {
    throw new Error(`Configuration errors: ${errors.join(', ')}`);
  }

  return true;
};

// Get configuration for specific environment
const getConfig = (key) => {
  const keys = key.split('.');
  let value = config;
  
  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = value[k];
    } else {
      return undefined;
    }
  }
  
  return value;
};

// Check if feature is enabled
const isFeatureEnabled = (featureName) => {
  return config.features[featureName] === true;
};

// Check if environment is production
const isProduction = () => {
  return config.server.nodeEnv === 'production';
};

// Check if environment is development
const isDevelopment = () => {
  return config.server.nodeEnv === 'development';
};

// Check if environment is test
const isTest = () => {
  return config.server.nodeEnv === 'test';
};

module.exports = {
  config,
  validateConfig,
  getConfig,
  isFeatureEnabled,
  isProduction,
  isDevelopment,
  isTest
}; 