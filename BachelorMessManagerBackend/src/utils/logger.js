const winston = require('winston');
const path = require('path');
const fs = require('fs');

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.prettyPrint()
);

// Define console format for development
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let msg = `${timestamp} [${level}]: ${message}`;
    if (Object.keys(meta).length > 0) {
      msg += ` ${JSON.stringify(meta)}`;
    }
    return msg;
  })
);

// Create logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: { service: 'bachelor-mess-api' },
  transports: [
    // Write all logs with level 'error' and below to error.log
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    // Write all logs with level 'info' and below to combined.log
    new winston.transports.File({
      filename: path.join(logsDir, 'combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  ],
  exceptionHandlers: [
    new winston.transports.File({
      filename: path.join(logsDir, 'exceptions.log'),
    }),
  ],
  rejectionHandlers: [
    new winston.transports.File({
      filename: path.join(logsDir, 'rejections.log'),
    }),
  ],
});

// If we're not in production, log to the console as well
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: consoleFormat,
  }));
}

// Create a stream object for Morgan
logger.stream = {
  write: (message) => {
    logger.info(message.trim());
  },
};

/**
 * Uniform API Logging Functions
 */

/**
 * Log API request
 * @param {Object} req - Express request object
 * @param {Object} options - Additional options
 */
const logApiRequest = (req, options = {}) => {
  const logData = {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user?.id || null,
    requestId: req.headers['x-request-id'] || options.requestId,
    body: options.logBody ? req.body : '***',
    query: options.logQuery ? req.query : '***',
    params: options.logParams ? req.params : '***',
    headers: options.logHeaders ? req.headers : '***',
  };

  logger.info('API Request', logData);
};

/**
 * Log API response
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {number} responseTime - Response time in milliseconds
 * @param {Object} options - Additional options
 */
const logApiResponse = (req, res, responseTime, options = {}) => {
  const logData = {
    method: req.method,
    url: req.originalUrl,
    statusCode: res.statusCode,
    responseTime: `${responseTime}ms`,
    userId: req.user?.id || null,
    requestId: req.headers['x-request-id'] || options.requestId,
    contentLength: res.get('Content-Length') || 0,
  };

  if (res.statusCode >= 400) {
    logger.warn('API Response', logData);
  } else {
    logger.info('API Response', logData);
  }
};

/**
 * Log API error
 * @param {Object} req - Express request object
 * @param {Error} error - Error object
 * @param {Object} options - Additional options
 */
const logApiError = (req, error, options = {}) => {
  const logData = {
    method: req.method,
    url: req.originalUrl,
    error: error.message,
    stack: error.stack,
    userId: req.user?.id || null,
    requestId: req.headers['x-request-id'] || options.requestId,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  };

  logger.error('API Error', logData);
};

/**
 * Log database operation
 * @param {string} operation - Database operation (create, read, update, delete)
 * @param {string} model - Model name
 * @param {Object} data - Operation data
 * @param {Object} options - Additional options
 */
const logDatabaseOperation = (operation, model, data = {}, options = {}) => {
  const logData = {
    operation,
    model,
    data: options.logData ? data : '***',
    userId: options.userId || null,
    requestId: options.requestId || null,
    duration: options.duration || null,
  };

  logger.info('Database Operation', logData);
};

/**
 * Log authentication event
 * @param {string} event - Authentication event (login, logout, register, etc.)
 * @param {Object} user - User object
 * @param {Object} options - Additional options
 */
const logAuthEvent = (event, user = {}, options = {}) => {
  const logData = {
    event,
    userId: user.id || null,
    email: user.email || null,
    ip: options.ip || null,
    userAgent: options.userAgent || null,
    requestId: options.requestId || null,
    success: options.success !== false,
  };

  if (options.success === false) {
    logger.warn('Authentication Event', logData);
  } else {
    logger.info('Authentication Event', logData);
  }
};

/**
 * Log business logic event
 * @param {string} event - Business event name
 * @param {Object} data - Event data
 * @param {Object} options - Additional options
 */
const logBusinessEvent = (event, data = {}, options = {}) => {
  const logData = {
    event,
    data: options.logData ? data : '***',
    userId: options.userId || null,
    requestId: options.requestId || null,
    severity: options.severity || 'info',
  };

  const level = options.severity || 'info';
  logger[level]('Business Event', logData);
};

/**
 * Log performance metric
 * @param {string} metric - Metric name
 * @param {number} value - Metric value
 * @param {string} unit - Metric unit
 * @param {Object} options - Additional options
 */
const logPerformanceMetric = (metric, value, unit = 'ms', options = {}) => {
  const logData = {
    metric,
    value,
    unit,
    userId: options.userId || null,
    requestId: options.requestId || null,
    endpoint: options.endpoint || null,
  };

  logger.info('Performance Metric', logData);
};

/**
 * Log security event
 * @param {string} event - Security event name
 * @param {Object} data - Event data
 * @param {Object} options - Additional options
 */
const logSecurityEvent = (event, data = {}, options = {}) => {
  const logData = {
    event,
    data: options.logData ? data : '***',
    ip: options.ip || null,
    userAgent: options.userAgent || null,
    userId: options.userId || null,
    requestId: options.requestId || null,
    severity: options.severity || 'warn',
  };

  const level = options.severity || 'warn';
  logger[level]('Security Event', logData);
};

/**
 * Log system event
 * @param {string} event - System event name
 * @param {Object} data - Event data
 * @param {Object} options - Additional options
 */
const logSystemEvent = (event, data = {}, options = {}) => {
  const logData = {
    event,
    data: options.logData ? data : '***',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    version: process.env.npm_package_version || '1.0.0',
  };

  logger.info('System Event', logData);
};

/**
 * Log validation error
 * @param {Array} errors - Validation errors
 * @param {Object} req - Express request object
 * @param {Object} options - Additional options
 */
const logValidationError = (errors, req, options = {}) => {
  const logData = {
    errors,
    method: req.method,
    url: req.originalUrl,
    userId: req.user?.id || null,
    requestId: req.headers['x-request-id'] || options.requestId,
    ip: req.ip,
  };

  logger.warn('Validation Error', logData);
};

/**
 * Log middleware execution
 * @param {string} middleware - Middleware name
 * @param {Object} req - Express request object
 * @param {Object} options - Additional options
 */
const logMiddlewareExecution = (middleware, req, options = {}) => {
  const logData = {
    middleware,
    method: req.method,
    url: req.originalUrl,
    userId: req.user?.id || null,
    requestId: req.headers['x-request-id'] || options.requestId,
    duration: options.duration || null,
  };

  logger.debug('Middleware Execution', logData);
};

/**
 * Log external API call
 * @param {string} service - External service name
 * @param {string} endpoint - API endpoint
 * @param {Object} data - Request/response data
 * @param {Object} options - Additional options
 */
const logExternalApiCall = (service, endpoint, data = {}, options = {}) => {
  const logData = {
    service,
    endpoint,
    method: options.method || 'GET',
    statusCode: options.statusCode || null,
    duration: options.duration || null,
    userId: options.userId || null,
    requestId: options.requestId || null,
    data: options.logData ? data : '***',
  };

  if (options.statusCode >= 400) {
    logger.warn('External API Call', logData);
  } else {
    logger.info('External API Call', logData);
  }
};

module.exports = {
  // Original logger methods
  error: logger.error.bind(logger),
  warn: logger.warn.bind(logger),
  info: logger.info.bind(logger),
  debug: logger.debug.bind(logger),
  verbose: logger.verbose.bind(logger),
  silly: logger.silly.bind(logger),
  stream: logger.stream,
  
  // Uniform logging functions
  logApiRequest,
  logApiResponse,
  logApiError,
  logDatabaseOperation,
  logAuthEvent,
  logBusinessEvent,
  logPerformanceMetric,
  logSecurityEvent,
  logSystemEvent,
  logValidationError,
  logMiddlewareExecution,
  logExternalApiCall,
}; 