const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');
const hpp = require('hpp');
const xss = require('xss-clean');
const mongoSanitize = require('express-mongo-sanitize');
const cors = require('cors');
const { config } = require('../config/config');
const logger = require('../utils/logger');

/**
 * Comprehensive Security Middleware
 * Implements industry best practices for API security
 */
class SecurityMiddleware {
  /**
   * Get Helmet configuration with security headers
   */
  static getHelmetConfig() {
    return helmet({
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
          upgradeInsecureRequests: [],
        },
      },
      crossOriginEmbedderPolicy: false,
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true,
      },
      noSniff: true,
      referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
      xssFilter: true,
    });
  }

  /**
   * Get CORS configuration
   */
  static getCorsConfig() {
    return cors({
      origin: config.cors.origin,
      credentials: config.cors.credentials,
      optionsSuccessStatus: 200,
      methods: config.cors.methods,
      allowedHeaders: config.cors.allowedHeaders,
      exposedHeaders: config.cors.exposedHeaders,
      maxAge: config.cors.maxAge,
    });
  }

  /**
   * Get rate limiting configuration
   */
  static getRateLimitConfig() {
    return rateLimit({
      windowMs: config.security.rateLimitWindowMs,
      max: config.security.rateLimitMaxRequests,
      message: {
        success: false,
        error: 'Too many requests from this IP, please try again later.',
        retryAfter: Math.ceil(config.security.rateLimitWindowMs / 1000),
      },
      standardHeaders: true,
      legacyHeaders: false,
      skipSuccessfulRequests: false,
      skipFailedRequests: false,
      skip: req => {
        // Skip rate limiting for health checks and development
        return (
          req.path === '/health' ||
          req.path === '/api/health' ||
          config.server.nodeEnv === 'development'
        );
      },
      keyGenerator: req => {
        return (
          req.ip ||
          req.connection.remoteAddress ||
          req.socket.remoteAddress ||
          req.connection.socket?.remoteAddress ||
          'unknown'
        );
      },
      handler: (req, res) => {
        logger.warn('Rate limit exceeded', {
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          endpoint: req.originalUrl,
        });
        res.status(429).json({
          success: false,
          error: 'Too many requests from this IP, please try again later.',
          retryAfter: Math.ceil(config.security.rateLimitWindowMs / 1000),
        });
      },
    });
  }

  /**
   * Get slow down configuration
   */
  static getSlowDownConfig() {
    return slowDown({
      windowMs: 15 * 60 * 1000, // 15 minutes
      delayAfter: 50, // allow 50 requests per 15 minutes, then...
      delayMs: () => config.security.slowDownDelayMs,
      maxDelayMs: 2000, // maximum delay of 2 seconds
      skipSuccessfulRequests: false,
      skipFailedRequests: false,
      keyGenerator: req => {
        return (
          req.ip ||
          req.connection.remoteAddress ||
          req.socket.remoteAddress ||
          req.connection.socket?.remoteAddress ||
          'unknown'
        );
      },
    });
  }

  /**
   * Get HPP (HTTP Parameter Pollution) configuration
   */
  static getHppConfig() {
    return hpp({
      whitelist: ['filter', 'sort', 'limit', 'page', 'fields', 'items'],
    });
  }

  /**
   * Get MongoDB sanitization configuration
   */
  static getMongoSanitizeConfig() {
    return mongoSanitize({
      replaceWith: '_',
      onSanitize: ({ req, key }) => {
        logger.warn('MongoDB injection attempt detected', {
          key,
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          endpoint: req.originalUrl,
        });
      },
    });
  }

  /**
   * Get XSS protection configuration
   */
  static getXssConfig() {
    return xss();
  }

  /**
   * Request size limiter
   */
  static requestSizeLimiter() {
    return (req, res, next) => {
      const contentLength = parseInt(req.headers['content-length'] || '0');
      const maxSize = 10 * 1024 * 1024; // 10MB

      if (contentLength > maxSize) {
        logger.warn('Request size limit exceeded', {
          contentLength,
          maxSize,
          ip: req.ip,
          endpoint: req.originalUrl,
        });
        return res.status(413).json({
          success: false,
          error: 'Request entity too large',
        });
      }
      next();
    };
  }

  /**
   * SQL injection protection
   */
  static sqlInjectionProtection() {
    return (req, res, next) => {
      const sqlPatterns = [
        /(\b(union|select|insert|update|delete|drop|create|alter)\b)/i,
        /(\b(or|and)\b\s+\d+\s*=\s*\d+)/i,
        /(\b(union|select|insert|update|delete|drop|create|alter)\b.*\b(union|select|insert|update|delete|drop|create|alter)\b)/i,
      ];

      const checkValue = value => {
        if (typeof value === 'string') {
          return sqlPatterns.some(pattern => pattern.test(value));
        }
        if (typeof value === 'object' && value !== null) {
          return Object.values(value).some(checkValue);
        }
        return false;
      };

      const hasSqlInjection =
        checkValue(req.body) || checkValue(req.query) || checkValue(req.params);

      if (hasSqlInjection) {
        logger.warn('SQL injection attempt detected', {
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          endpoint: req.originalUrl,
          body: req.body,
          query: req.query,
          params: req.params,
        });
        return res.status(400).json({
          success: false,
          error: 'Invalid request data',
        });
      }
      next();
    };
  }

  /**
   * JWT token validation enhancement
   */
  static enhancedJwtValidation() {
    return (req, res, next) => {
      const token = req.headers.authorization?.split(' ')[1];

      if (token) {
        // Check token format
        if (!/^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]*$/.test(token)) {
          logger.warn('Invalid JWT token format', {
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            endpoint: req.originalUrl,
          });
          return res.status(401).json({
            success: false,
            error: 'Invalid token format',
          });
        }
      }
      next();
    };
  }

  /**
   * Security headers middleware
   */
  static securityHeaders() {
    return (req, res, next) => {
      // Remove server information
      res.removeHeader('X-Powered-By');

      // Add security headers
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('X-Frame-Options', 'DENY');
      res.setHeader('X-XSS-Protection', '1; mode=block');
      res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
      res.setHeader(
        'Permissions-Policy',
        'geolocation=(), microphone=(), camera=()'
      );

      next();
    };
  }

  /**
   * Request logging for security monitoring
   */
  static securityLogging() {
    return (req, res, next) => {
      // Log suspicious requests
      const suspiciousPatterns = [
        /\.\.\//, // Directory traversal
        /<script/i, // XSS attempts
        /javascript:/i, // JavaScript injection
        /union\s+select/i, // SQL injection
        /eval\s*\(/i, // Code injection
      ];

      const userInput = JSON.stringify({
        body: req.body,
        query: req.query,
        params: req.params,
        headers: req.headers,
      });

      const isSuspicious = suspiciousPatterns.some(pattern =>
        pattern.test(userInput)
      );

      if (isSuspicious) {
        logger.warn('Suspicious request detected', {
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          endpoint: req.originalUrl,
          method: req.method,
          userInput,
        });
      }

      next();
    };
  }
}

module.exports = SecurityMiddleware;
