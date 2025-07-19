/**
 * Request Logger Middleware
 * Provides uniform request logging and context management
 */

const logger = require('../utils/logger');
const { generateRequestId, getRequestContext } = require('../utils/responseHandler');

/**
 * Request logger middleware
 * Logs API requests and responses with uniform formatting
 */
const requestLogger = (options = {}) => {
  return (req, res, next) => {
    // Generate or use existing request ID
    const requestId = req.headers['x-request-id'] || generateRequestId();
    req.requestId = requestId;
    
    // Add request ID to response headers
    res.setHeader('X-Request-ID', requestId);
    
    // Store request context
    req.context = getRequestContext(req);
    
    // Log request start
    const startTime = Date.now();
    
    logger.logApiRequest(req, {
      requestId,
      logBody: options.logBody !== false,
      logQuery: options.logQuery !== false,
      logParams: options.logParams !== false,
      logHeaders: options.logHeaders === true,
    });
    
    // Override res.json to log responses
    const originalJson = res.json;
    res.json = function(data) {
      const responseTime = Date.now() - startTime;
      
      // Log response
      logger.logApiResponse(req, res, responseTime, {
        requestId,
        logResponse: options.logResponse === true,
      });
      
      // Call original json method
      return originalJson.call(this, data);
    };
    
    // Override res.send to log responses
    const originalSend = res.send;
    res.send = function(data) {
      const responseTime = Date.now() - startTime;
      
      // Log response
      logger.logApiResponse(req, res, responseTime, {
        requestId,
        logResponse: options.logResponse === true,
      });
      
      // Call original send method
      return originalSend.call(this, data);
    };
    
    // Log performance metric
    res.on('finish', () => {
      const responseTime = Date.now() - startTime;
      
      logger.logPerformanceMetric('response_time', responseTime, 'ms', {
        requestId,
        endpoint: `${req.method} ${req.originalUrl}`,
        userId: req.user?.id || null,
      });
    });
    
    next();
  };
};

/**
 * Error logger middleware
 * Logs API errors with uniform formatting
 */
const errorLogger = (options = {}) => {
  return (err, req, res, next) => {
    // Log API error
    logger.logApiError(req, err, {
      requestId: req.requestId,
      logStack: options.logStack !== false,
    });
    
    // Log security event for certain error types
    if (err.status === 401 || err.status === 403) {
      logger.logSecurityEvent('unauthorized_access', {
        error: err.message,
        status: err.status,
      }, {
        requestId: req.requestId,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        userId: req.user?.id || null,
        severity: 'warn',
      });
    }
    
    next(err);
  };
};

/**
 * Database operation logger middleware
 * Logs database operations with uniform formatting
 */
const databaseLogger = (options = {}) => {
  return (req, res, next) => {
    // Store original mongoose methods to intercept
    const mongoose = require('mongoose');
    const originalExec = mongoose.Query.prototype.exec;
    const originalCreate = mongoose.Model.create;
    const originalFindByIdAndUpdate = mongoose.Model.findByIdAndUpdate;
    const originalFindByIdAndDelete = mongoose.Model.findByIdAndDelete;
    
    // Intercept exec method
    mongoose.Query.prototype.exec = function() {
      const startTime = Date.now();
      const query = this;
      
      return originalExec.apply(this, arguments).then(result => {
        const duration = Date.now() - startTime;
        
        logger.logDatabaseOperation('read', query.model.modelName, {
          filter: query._conditions,
          options: query._options,
        }, {
          requestId: req.requestId,
          userId: req.user?.id || null,
          duration,
          logData: options.logData === true,
        });
        
        return result;
      }).catch(error => {
        const duration = Date.now() - startTime;
        
        logger.error('Database Operation Error', {
          operation: 'read',
          model: query.model.modelName,
          error: error.message,
          requestId: req.requestId,
          userId: req.user?.id || null,
          duration,
        });
        
        throw error;
      });
    };
    
    // Intercept create method
    mongoose.Model.create = function(docs) {
      const startTime = Date.now();
      const model = this;
      
      return originalCreate.apply(this, arguments).then(result => {
        const duration = Date.now() - startTime;
        
        logger.logDatabaseOperation('create', model.modelName, {
          data: Array.isArray(docs) ? docs.length : 1,
        }, {
          requestId: req.requestId,
          userId: req.user?.id || null,
          duration,
          logData: options.logData === true,
        });
        
        return result;
      }).catch(error => {
        const duration = Date.now() - startTime;
        
        logger.error('Database Operation Error', {
          operation: 'create',
          model: model.modelName,
          error: error.message,
          requestId: req.requestId,
          userId: req.user?.id || null,
          duration,
        });
        
        throw error;
      });
    };
    
    // Intercept findByIdAndUpdate method
    mongoose.Model.findByIdAndUpdate = function(id, update, options) {
      const startTime = Date.now();
      const model = this;
      
      return originalFindByIdAndUpdate.apply(this, arguments).then(result => {
        const duration = Date.now() - startTime;
        
        logger.logDatabaseOperation('update', model.modelName, {
          id,
          update: Object.keys(update || {}),
        }, {
          requestId: req.requestId,
          userId: req.user?.id || null,
          duration,
          logData: options.logData === true,
        });
        
        return result;
      }).catch(error => {
        const duration = Date.now() - startTime;
        
        logger.error('Database Operation Error', {
          operation: 'update',
          model: model.modelName,
          error: error.message,
          requestId: req.requestId,
          userId: req.user?.id || null,
          duration,
        });
        
        throw error;
      });
    };
    
    // Intercept findByIdAndDelete method
    mongoose.Model.findByIdAndDelete = function(id, options) {
      const startTime = Date.now();
      const model = this;
      
      return originalFindByIdAndDelete.apply(this, arguments).then(result => {
        const duration = Date.now() - startTime;
        
        logger.logDatabaseOperation('delete', model.modelName, {
          id,
        }, {
          requestId: req.requestId,
          userId: req.user?.id || null,
          duration,
          logData: options.logData === true,
        });
        
        return result;
      }).catch(error => {
        const duration = Date.now() - startTime;
        
        logger.error('Database Operation Error', {
          operation: 'delete',
          model: model.modelName,
          error: error.message,
          requestId: req.requestId,
          userId: req.user?.id || null,
          duration,
        });
        
        throw error;
      });
    };
    
    next();
  };
};

/**
 * Business event logger middleware
 * Provides helper function to log business events
 */
const businessEventLogger = (options = {}) => {
  return (req, res, next) => {
    // Add business event logger to request object
    req.logBusinessEvent = (event, data = {}, eventOptions = {}) => {
      logger.logBusinessEvent(event, data, {
        requestId: req.requestId,
        userId: req.user?.id || null,
        ...eventOptions,
      });
    };
    
    next();
  };
};

module.exports = {
  requestLogger,
  errorLogger,
  databaseLogger,
  businessEventLogger,
}; 