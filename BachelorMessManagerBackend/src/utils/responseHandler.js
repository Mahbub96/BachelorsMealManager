/**
 * Uniform API Response Handler
 * Provides standardized response functions for consistent API responses
 */

const logger = require('./logger');

/**
 * Standard API Response Structure
 * @typedef {Object} ApiResponse
 * @property {boolean} success - Indicates if the operation was successful
 * @property {string} message - Human-readable message
 * @property {*} data - Response data (optional)
 * @property {string} timestamp - ISO timestamp
 * @property {string} requestId - Unique request identifier
 */

/**
 * Send success response
 * @param {Object} res - Express response object
 * @param {number} statusCode - HTTP status code (default: 200)
 * @param {string} message - Success message
 * @param {*} data - Response data
 * @param {Object} options - Additional options
 */
const sendSuccess = (
  res,
  statusCode = 200,
  message = 'Success',
  data = null,
  options = {}
) => {
  const response = {
    success: true,
    message,
    timestamp: new Date().toISOString(),
    requestId: options.requestId || generateRequestId(),
  };

  if (data !== null) {
    response.data = data;
  }

  // Add pagination info if provided
  if (options.pagination) {
    response.pagination = options.pagination;
  }

  // Add metadata if provided
  if (options.metadata) {
    response.metadata = options.metadata;
  }

  logger.info(`API Success: ${message}`, {
    statusCode,
    requestId: response.requestId,
    endpoint: options.endpoint,
    userId: options.userId,
  });

  res.status(statusCode).json(response);
};

/**
 * Send error response
 * @param {Object} res - Express response object
 * @param {number} statusCode - HTTP status code (default: 400)
 * @param {string} message - Error message
 * @param {string} errorCode - Custom error code
 * @param {Object} options - Additional options
 */
const sendError = (
  res,
  statusCode = 400,
  message = 'Error occurred',
  errorCode = null,
  options = {}
) => {
  const response = {
    success: false,
    message,
    timestamp: new Date().toISOString(),
    requestId: options.requestId || generateRequestId(),
  };

  if (errorCode) {
    response.errorCode = errorCode;
  }

  // Add validation errors if provided
  if (options.validationErrors) {
    response.errors = options.validationErrors;
  }

  // Add stack trace in development
  if (process.env.NODE_ENV === 'development' && options.stack) {
    response.stack = options.stack;
  }

  logger.error(`API Error: ${message}`, {
    statusCode,
    errorCode,
    requestId: response.requestId,
    endpoint: options.endpoint,
    userId: options.userId,
    stack: options.stack,
  });

  res.status(statusCode).json(response);
};

/**
 * Send created response (201)
 * @param {Object} res - Express response object
 * @param {string} message - Success message
 * @param {*} data - Created resource data
 * @param {Object} options - Additional options
 */
const sendCreated = (
  res,
  message = 'Resource created successfully',
  data = null,
  options = {}
) => {
  sendSuccess(res, 201, message, data, options);
};

/**
 * Send no content response (204)
 * @param {Object} res - Express response object
 * @param {Object} options - Additional options
 */
const sendNoContent = (res, options = {}) => {
  logger.info('API Success: No content', {
    statusCode: 204,
    requestId: options.requestId || generateRequestId(),
    endpoint: options.endpoint,
    userId: options.userId,
  });

  res.status(204).send();
};

/**
 * Send paginated response
 * @param {Object} res - Express response object
 * @param {string} message - Success message
 * @param {Array} data - Array of items
 * @param {Object} pagination - Pagination info
 * @param {Object} options - Additional options
 */
const sendPaginated = (
  res,
  message = 'Data retrieved successfully',
  data = [],
  pagination = {},
  options = {}
) => {
  sendSuccess(res, 200, message, data, {
    ...options,
    pagination: {
      page: pagination.page || 1,
      limit: pagination.limit || 10,
      total: pagination.total || 0,
      totalPages: pagination.totalPages || 0,
      hasNext: pagination.hasNext || false,
      hasPrev: pagination.hasPrev || false,
    },
  });
};

/**
 * Send validation error response
 * @param {Object} res - Express response object
 * @param {Array} errors - Validation errors array
 * @param {Object} options - Additional options
 */
const sendValidationError = (res, errors = [], options = {}) => {
  sendError(res, 400, 'Validation failed', 'VALIDATION_ERROR', {
    ...options,
    validationErrors: errors,
  });
};

/**
 * Send not found response
 * @param {Object} res - Express response object
 * @param {string} message - Not found message
 * @param {Object} options - Additional options
 */
const sendNotFound = (res, message = 'Resource not found', options = {}) => {
  sendError(res, 404, message, 'NOT_FOUND', options);
};

/**
 * Send unauthorized response
 * @param {Object} res - Express response object
 * @param {string} message - Unauthorized message
 * @param {Object} options - Additional options
 */
const sendUnauthorized = (
  res,
  message = 'Unauthorized access',
  options = {}
) => {
  sendError(res, 401, message, 'UNAUTHORIZED', options);
};

/**
 * Send forbidden response
 * @param {Object} res - Express response object
 * @param {string} message - Forbidden message
 * @param {Object} options - Additional options
 */
const sendForbidden = (res, message = 'Access forbidden', options = {}) => {
  sendError(res, 403, message, 'FORBIDDEN', options);
};

/**
 * Send conflict response
 * @param {Object} res - Express response object
 * @param {string} message - Conflict message
 * @param {Object} options - Additional options
 */
const sendConflict = (res, message = 'Resource conflict', options = {}) => {
  sendError(res, 409, message, 'CONFLICT', options);
};

/**
 * Send server error response
 * @param {Object} res - Express response object
 * @param {string} message - Server error message
 * @param {Object} options - Additional options
 */
const sendServerError = (
  res,
  message = 'Internal server error',
  options = {}
) => {
  sendError(res, 500, message, 'INTERNAL_SERVER_ERROR', options);
};

/**
 * Generate unique request ID
 * @returns {string} Request ID
 */
const generateRequestId = () => {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Extract request context for logging
 * @param {Object} req - Express request object
 * @returns {Object} Request context
 */
const getRequestContext = req => {
  return {
    requestId: req.headers['x-request-id'] || generateRequestId(),
    endpoint: `${req.method} ${req.originalUrl}`,
    userId: req.user?.id || null,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  };
};

module.exports = {
  sendSuccess,
  sendError,
  sendSuccessResponse: sendSuccess,
  sendErrorResponse: sendError,
  sendCreated,
  sendNoContent,
  sendPaginated,
  sendValidationError,
  sendNotFound,
  sendUnauthorized,
  sendForbidden,
  sendConflict,
  sendServerError,
  generateRequestId,
  getRequestContext,
};
