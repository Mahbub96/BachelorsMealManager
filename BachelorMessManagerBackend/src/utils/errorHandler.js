const logger = require('./logger');

/**
 * Custom Error Classes for better error handling
 */
class AppError extends Error {
  constructor(message, statusCode, errorCode = null, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.isOperational = isOperational;
    this.timestamp = new Date().toISOString();

    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends AppError {
  constructor(message, details = []) {
    super(message, 400, 'VALIDATION_ERROR');
    this.details = details;
  }
}

class AuthenticationError extends AppError {
  constructor(message = 'Authentication failed') {
    super(message, 401, 'AUTHENTICATION_ERROR');
  }
}

class AuthorizationError extends AppError {
  constructor(message = 'Access denied') {
    super(message, 403, 'AUTHORIZATION_ERROR');
  }
}

class NotFoundError extends AppError {
  constructor(resource = 'Resource') {
    super(`${resource} not found`, 404, 'NOT_FOUND_ERROR');
  }
}

class ConflictError extends AppError {
  constructor(message = 'Resource conflict') {
    super(message, 409, 'CONFLICT_ERROR');
  }
}

class RateLimitError extends AppError {
  constructor(message = 'Too many requests') {
    super(message, 429, 'RATE_LIMIT_ERROR');
  }
}

/**
 * Enhanced Error Handler Middleware
 */
const errorHandler = (err, req, res, _next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error with context
  const logContext = {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user?.id || 'anonymous',
    requestId: req.headers['x-request-id'],
    timestamp: new Date().toISOString(),
  };

  // Handle different error types
  if (err instanceof AppError) {
    // Custom application errors
    logger.error('Application Error', logContext);
  } else if (err.name === 'CastError') {
    // Mongoose bad ObjectId
    error = new NotFoundError('Resource');
    logger.warn('Invalid ObjectId', logContext);
  } else if (err.code === 11000) {
    // Mongoose duplicate key
    const field = Object.keys(err.keyValue)[0];
    error = new ConflictError(`${field} already exists`);
    logger.warn('Duplicate key error', { ...logContext, field });
  } else if (err.name === 'ValidationError') {
    // Mongoose validation error
    const details = Object.values(err.errors).map(val => ({
      field: val.path,
      message: val.message,
      value: val.value,
    }));
    error = new ValidationError('Validation failed', details);
    logger.warn('Validation error', { ...logContext, details });
  } else if (err.name === 'JsonWebTokenError') {
    // JWT errors
    error = new AuthenticationError('Invalid token');
    logger.warn('JWT validation failed', logContext);
  } else if (err.name === 'TokenExpiredError') {
    error = new AuthenticationError('Token expired');
    logger.warn('JWT token expired', logContext);
  } else if (err.code === 'LIMIT_FILE_SIZE') {
    error = new ValidationError('File too large');
    logger.warn('File size limit exceeded', logContext);
  } else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    error = new ValidationError('Unexpected file field');
    logger.warn('Unexpected file field', logContext);
  } else if (err.http_code) {
    // Cloudinary errors
    error = new ValidationError(err.message || 'File upload failed');
    logger.error('Cloudinary error', logContext);
  } else {
    // Unknown errors
    logger.error('Unhandled error', logContext);
  }

  // Determine response status and message
  const statusCode = error.statusCode || err.statusCode || 500;
  const message = error.message || 'Internal Server Error';

  // Don't leak error details in production
  const responseMessage =
    process.env.NODE_ENV === 'production' && statusCode === 500
      ? 'Internal Server Error'
      : message;

  // Build response object
  const response = {
    success: false,
    error: responseMessage,
    timestamp: new Date().toISOString(),
    requestId: req.headers['x-request-id'] || generateRequestId(),
  };

  // Add error code if available
  if (error.errorCode) {
    response.errorCode = error.errorCode;
  }

  // Add validation details if available
  if (error.details && Array.isArray(error.details)) {
    response.details = error.details;
  }

  // Add stack trace in development
  if (process.env.NODE_ENV === 'development') {
    response.stack = err.stack;
    response.debug = {
      originalError: err.message,
      statusCode: err.statusCode,
      name: err.name,
    };
  }

  // Add retry-after header for rate limiting
  if (statusCode === 429) {
    res.setHeader('Retry-After', '60');
  }

  res.status(statusCode).json(response);
};

/**
 * Generate unique request ID
 */
const generateRequestId = () => {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Async error wrapper for controllers
 */
const asyncHandler = fn => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Validate request body against schema
 */
const validateRequest = schema => {
  return (req, res, next) => {
    try {
      const { error, value } = schema.validate(req.body, {
        abortEarly: false,
        stripUnknown: true,
      });

      if (error) {
        const details = error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message,
          value: detail.context?.value,
        }));

        const validationError = new ValidationError(
          'Validation failed',
          details
        );
        return next(validationError);
      }

      req.body = value;
      next();
    } catch (err) {
      next(err);
    }
  };
};

/**
 * Check if error is operational
 */
const isOperationalError = error => {
  if (error instanceof AppError) {
    return error.isOperational;
  }
  return false;
};

/**
 * Global error handler for unhandled rejections
 */
const handleUnhandledRejection = (reason, promise) => {
  logger.error('Unhandled Rejection', {
    reason: reason?.message || reason,
    stack: reason?.stack,
    promise: promise.toString(),
  });

  // In production, you might want to exit the process
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Unhandled Rejection - Application shutting down');
  }
};

/**
 * Global error handler for uncaught exceptions
 */
const handleUncaughtException = error => {
  logger.error('Uncaught Exception', {
    message: error.message,
    stack: error.stack,
  });

  // In production, you might want to exit the process
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Uncaught Exception - Application shutting down');
  }
};

module.exports = {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  errorHandler,
  asyncHandler,
  validateRequest,
  isOperationalError,
  handleUnhandledRejection,
  handleUncaughtException,
  generateRequestId,
};
