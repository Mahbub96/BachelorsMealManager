const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const morgan = require('morgan');
const path = require('path');
const cluster = require('cluster');
const os = require('os');
require('dotenv').config();

// Import custom modules
const logger = require('./src/utils/logger');
const errorHandler = require('./src/middleware/errorHandler');
const notFound = require('./src/middleware/notFound');
const {
  connectDB,
  checkDatabaseHealth,
  getDatabaseStats,
} = require('./src/config/database');

// Import uniform logging middleware
const {
  requestLogger,
  errorLogger,
  databaseLogger,
  businessEventLogger,
} = require('./src/middleware/requestLogger');

// Import routes
const authRoutes = require('./src/routes/auth');
const dashboardRoutes = require('./src/routes/dashboard');
const mealRoutes = require('./src/routes/meals');
const bazarRoutes = require('./src/routes/bazar');
const userRoutes = require('./src/routes/users');
const analyticsRoutes = require('./src/routes/analytics');
const monitoringRoutes = require('./src/routes/monitoring');

// Configuration
const config = {
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  apiPrefix: process.env.API_PREFIX || '/api',
  apiVersion: process.env.API_VERSION || 'v1',
  enableClustering: process.env.ENABLE_CLUSTERING === 'true',
  maxWorkers: parseInt(process.env.MAX_WORKERS) || os.cpus().length,
  corsOrigin: process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',')
    : ['http://localhost:3000'],
  corsCredentials: process.env.CORS_CREDENTIALS === 'true',
  rateLimitWindowMs:
    parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  slowDownDelayMs: parseInt(process.env.SLOW_DOWN_DELAY_MS) || 500,
  bodyLimit: process.env.BODY_LIMIT || '10mb',
  enableCompression: process.env.ENABLE_COMPRESSION !== 'false',
  enableSecurity: process.env.ENABLE_SECURITY !== 'false',
  enableLogging: process.env.ENABLE_LOGGING !== 'false',
  enableHealthCheck: process.env.ENABLE_HEALTH_CHECK !== 'false',
  enableMetrics: process.env.ENABLE_METRICS === 'true',
  gracefulShutdownTimeout:
    parseInt(process.env.GRACEFUL_SHUTDOWN_TIMEOUT) || 30000,
};

// Clustering for better performance in production
if (
  config.enableClustering &&
  cluster.isPrimary &&
  config.nodeEnv === 'production'
) {
  logger.info(`Master ${process.pid} is running`);

  // Fork workers
  for (let i = 0; i < config.maxWorkers; i++) {
    cluster.fork();
  }

  cluster.on('exit', (worker, code, signal) => {
    logger.warn(`Worker ${worker.process.pid} died. Restarting...`);
    cluster.fork();
  });

  cluster.on('online', worker => {
    logger.info(`Worker ${worker.process.pid} is online`);
  });
} else {
  // Worker process or single-threaded mode
  startServer();
}

function startServer() {
  const app = express();

  // Connect to MongoDB
  connectDB();

  // Security Middleware
  if (config.enableSecurity) {
    app.use(
      helmet({
        contentSecurityPolicy: {
          directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", 'data:', 'https:'],
            connectSrc: ["'self'"],
            fontSrc: ["'self'"],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'"],
            frameSrc: ["'none'"],
          },
        },
        crossOriginEmbedderPolicy: false,
        hsts: {
          maxAge: 31536000,
          includeSubDomains: true,
          preload: true,
        },
      })
    );
  }

  // CORS Configuration
  const corsOptions = {
    origin: config.corsOrigin,
    credentials: config.corsCredentials,
    optionsSuccessStatus: 200,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'X-API-Key',
    ],
    exposedHeaders: ['X-Total-Count', 'X-Page-Count'],
    maxAge: 86400, // 24 hours
  };
  app.use(cors(corsOptions));

  // Rate Limiting
  const limiter = rateLimit({
    windowMs: config.rateLimitWindowMs,
    max: config.rateLimitMaxRequests,
    message: {
      success: false,
      error: 'Too many requests from this IP, please try again later.',
      retryAfter: Math.ceil(config.rateLimitWindowMs / 1000),
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: false,
    skipFailedRequests: false,
    keyGenerator: req => {
      return (
        req.ip ||
        req.connection.remoteAddress ||
        req.socket.remoteAddress ||
        req.connection.socket?.remoteAddress
      );
    },
  });
  app.use(limiter);

  // Slow Down
  const speedLimiter = slowDown({
    windowMs: 15 * 60 * 1000, // 15 minutes
    delayAfter: 50, // allow 50 requests per 15 minutes, then...
    delayMs: () => config.slowDownDelayMs, // begin adding delay per request above 50
    maxDelayMs: 2000, // maximum delay of 2 seconds
    skipSuccessfulRequests: false,
    skipFailedRequests: false,
  });
  app.use(speedLimiter);

  // Body parsing middleware
  app.use(express.json({ limit: config.bodyLimit }));
  app.use(express.urlencoded({ extended: true, limit: config.bodyLimit }));

  // Data sanitization against NoSQL query injection
  app.use(
    mongoSanitize({
      replaceWith: '_',
    })
  );

  // Data sanitization against XSS
  app.use(xss());

  // Prevent parameter pollution
  app.use(
    hpp({
      whitelist: ['filter', 'sort', 'limit', 'page', 'fields'],
    })
  );

  // Compression middleware
  if (config.enableCompression) {
    app.use(
      compression({
        filter: (req, res) => {
          if (req.headers['x-no-compression']) {
            return false;
          }
          return compression.filter(req, res);
        },
        level: 6,
        threshold: 1024,
      })
    );
  }

  // Uniform logging middleware
  if (config.enableLogging) {
    app.use(
      requestLogger({
        logBody: config.nodeEnv === 'development',
        logQuery: config.nodeEnv === 'development',
        logParams: config.nodeEnv === 'development',
      })
    );

    app.use(
      databaseLogger({
        logData: config.nodeEnv === 'development',
      })
    );

    app.use(businessEventLogger());
  }

  // Legacy logging middleware (for backward compatibility)
  if (config.nodeEnv === 'development') {
    app.use(morgan('dev'));
  } else {
    app.use(
      morgan('combined', {
        stream: {
          write: message => logger.info(message.trim()),
        },
      })
    );
  }

  // Static files
  app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

  // Enhanced Health check endpoint
  if (config.enableHealthCheck) {
    app.get('/health', async (req, res) => {
      try {
        const healthCheck = {
          success: true,
          message: 'Bachelor Mess API is running',
          timestamp: new Date().toISOString(),
          environment: config.nodeEnv,
          version: process.env.npm_package_version || '1.0.0',
          uptime: process.uptime(),
          memory: process.memoryUsage(),
          pid: process.pid,
          worker: cluster.isWorker ? cluster.worker.id : 'master',
        };

        // Check database connection
        const dbHealth = await checkDatabaseHealth();
        healthCheck.database = dbHealth;
        if (!dbHealth.connected) {
          healthCheck.success = false;
        }

        // Check if metrics are enabled
        if (config.enableMetrics) {
          healthCheck.metrics = {
            requests: req.app.locals.requestCount || 0,
            errors: req.app.locals.errorCount || 0,
          };
        }

        const statusCode = healthCheck.success ? 200 : 503;
        res.status(statusCode).json(healthCheck);
      } catch (error) {
        logger.error('Health check failed:', error);
        res.status(503).json({
          success: false,
          message: 'Health check failed',
          error: error.message,
        });
      }
    });

    // Detailed health check for monitoring systems
    app.get('/health/detailed', async (req, res) => {
      try {
        const detailedHealth = {
          success: true,
          timestamp: new Date().toISOString(),
          system: {
            nodeVersion: process.version,
            platform: process.platform,
            arch: process.arch,
            memory: process.memoryUsage(),
            cpu: process.cpuUsage(),
            uptime: process.uptime(),
            pid: process.pid,
            worker: cluster.isWorker ? cluster.worker.id : 'master',
          },
          database: {
            status:
              mongoose.connection.readyState === 1
                ? 'connected'
                : 'disconnected',
            host: mongoose.connection.host,
            port: mongoose.connection.port,
            name: mongoose.connection.name,
          },
          environment: {
            nodeEnv: config.nodeEnv,
            port: config.port,
            apiPrefix: config.apiPrefix,
          },
        };

        const statusCode = detailedHealth.success ? 200 : 503;
        res.status(statusCode).json(detailedHealth);
      } catch (error) {
        logger.error('Detailed health check failed:', error);
        res.status(503).json({
          success: false,
          message: 'Detailed health check failed',
          error: error.message,
        });
      }
    });
  }

  // API Routes
  app.use(`${config.apiPrefix}/auth`, authRoutes);
  app.use(`${config.apiPrefix}/dashboard`, dashboardRoutes);
  app.use(`${config.apiPrefix}/meals`, mealRoutes);
  app.use(`${config.apiPrefix}/bazar`, bazarRoutes);
  app.use(`${config.apiPrefix}/users`, userRoutes);
  app.use(`${config.apiPrefix}/analytics`, analyticsRoutes);
  app.use(`${config.apiPrefix}/monitoring`, monitoringRoutes);

  // API Documentation endpoint
  app.get(`${config.apiPrefix}/docs`, (req, res) => {
    res.json({
      success: true,
      message: 'API Documentation',
      version: config.apiVersion,
      endpoints: {
        auth: `${config.apiPrefix}/auth`,
        dashboard: `${config.apiPrefix}/dashboard`,
        meals: `${config.apiPrefix}/meals`,
        bazar: `${config.apiPrefix}/bazar`,
        users: `${config.apiPrefix}/users`,
        analytics: `${config.apiPrefix}/analytics`,
      },
      documentation:
        'Refer to API_REQUIREMENT_DOC.md for complete documentation',
    });
  });

  // 404 handler
  app.use(notFound);

  // Error logging middleware
  if (config.enableLogging) {
    app.use(errorLogger());
  }

  // Global error handler
  app.use(errorHandler);

  // Graceful shutdown handling
  const gracefulShutdown = signal => {
    logger.info(`${signal} received, shutting down gracefully`);

    const server = app.listen();
    if (server) {
      server.close(() => {
        logger.info('HTTP server closed');

        // Close database connection
        mongoose.connection
          .close()
          .then(() => {
            logger.info('MongoDB connection closed');
            process.exit(0);
          })
          .catch(err => {
            logger.error('Error closing MongoDB connection:', err);
            process.exit(1);
          });
      });

      // Force close after timeout
      setTimeout(() => {
        logger.error(
          'Could not close connections in time, forcefully shutting down'
        );
        process.exit(1);
      }, config.gracefulShutdownTimeout);
    } else {
      process.exit(0);
    }
  };

  // Handle shutdown signals
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  // Unhandled promise rejections
  process.on('unhandledRejection', (err, promise) => {
    logger.error('Unhandled Rejection at:', promise, 'reason:', err);
    process.exit(1);
  });

  // Uncaught exceptions
  process.on('uncaughtException', err => {
    logger.error('Uncaught Exception thrown:', err);
    process.exit(1);
  });

  // Start server
  const server = app.listen(config.port, () => {
    logger.info(
      `Server running in ${config.nodeEnv} mode on port ${config.port}`
    );
    logger.info(`Worker ${process.pid} started`);
    logger.info(
      `Health check available at: http://localhost:${config.port}/health`
    );
    logger.info(
      `API available at: http://localhost:${config.port}${config.apiPrefix}`
    );
    logger.info(
      `API Documentation at: http://localhost:${config.port}${config.apiPrefix}/docs`
    );
  });

  // Initialize request counters for metrics
  if (config.enableMetrics) {
    app.locals.requestCount = 0;
    app.locals.errorCount = 0;

    // Middleware to count requests
    app.use((req, res, next) => {
      app.locals.requestCount++;
      next();
    });
  }

  module.exports = server;
}
