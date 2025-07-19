const jwt = require('jsonwebtoken');
const User = require('../models/User');
const logger = require('../utils/logger');
const {
  AuthenticationError,
  AuthorizationError,
} = require('../utils/errorHandler');
const { cacheManager } = require('../utils/cache');

/**
 * Enhanced Authentication Middleware
 * Implements security best practices
 */
class AuthMiddleware {
  /**
   * Protect routes - require authentication
   */
  static protect() {
    return async (req, res, next) => {
      try {
        let token;

        // Get token from header
        if (
          req.headers.authorization &&
          req.headers.authorization.startsWith('Bearer')
        ) {
          token = req.headers.authorization.split(' ')[1];
        }

        if (!token) {
          throw new AuthenticationError('Access denied - No token provided');
        }

        // Validate token format
        if (!/^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]*$/.test(token)) {
          throw new AuthenticationError('Invalid token format');
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Check if token is expired
        if (decoded.exp && Date.now() >= decoded.exp * 1000) {
          throw new AuthenticationError('Token expired');
        }

        // Get user from cache first, then database
        const cacheKey = `user:${decoded.id}`;
        let user = cacheManager.get(cacheKey);

        if (!user) {
          user = await User.findById(decoded.id).select('-password');

          if (!user) {
            throw new AuthenticationError('User not found');
          }

          // Cache user for 5 minutes
          cacheManager.set(cacheKey, user, 300);
        }

        // Check if user is active
        if (user.status !== 'active') {
          throw new AuthenticationError('User account is inactive');
        }

        // Check if user's role has changed (token might be stale)
        if (decoded.role && decoded.role !== user.role) {
          // Clear cache and throw error
          cacheManager.del(cacheKey);
          throw new AuthenticationError('Token invalid - user role changed');
        }

        // Add user to request
        req.user = user;
        req.token = token;

        // Log successful authentication
        logger.info('User authenticated', {
          userId: user._id,
          email: user.email,
          role: user.role,
          ip: req.ip,
          userAgent: req.get('User-Agent'),
        });

        next();
      } catch (error) {
        if (error instanceof AuthenticationError) {
          return res.status(401).json({
            success: false,
            error: error.message,
            errorCode: 'AUTHENTICATION_ERROR',
          });
        }

        logger.error('Authentication error', {
          error: error.message,
          ip: req.ip,
          userAgent: req.get('User-Agent'),
        });

        return res.status(401).json({
          success: false,
          error: 'Access denied',
          errorCode: 'AUTHENTICATION_ERROR',
        });
      }
    };
  }

  /**
   * Require specific role
   */
  static requireRole(roles) {
    const allowedRoles = Array.isArray(roles) ? roles : [roles];

    return (req, res, next) => {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required',
          errorCode: 'AUTHENTICATION_ERROR',
        });
      }

      if (!allowedRoles.includes(req.user.role)) {
        logger.warn('Unauthorized access attempt', {
          userId: req.user._id,
          userRole: req.user.role,
          requiredRoles: allowedRoles,
          endpoint: req.originalUrl,
          ip: req.ip,
        });

        return res.status(403).json({
          success: false,
          error: 'Access denied - Insufficient permissions',
          errorCode: 'AUTHORIZATION_ERROR',
        });
      }

      next();
    };
  }

  /**
   * Require admin role
   */
  static requireAdmin() {
    return AuthMiddleware.requireRole('admin');
  }

  /**
   * Require member role
   */
  static requireMember() {
    return AuthMiddleware.requireRole(['admin', 'member']);
  }

  /**
   * Optional authentication - doesn't fail if no token
   */
  static optional() {
    return async (req, res, next) => {
      try {
        let token;

        if (
          req.headers.authorization &&
          req.headers.authorization.startsWith('Bearer')
        ) {
          token = req.headers.authorization.split(' ')[1];
        }

        if (token) {
          // Validate token format
          if (!/^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]*$/.test(token)) {
            return next(); // Continue without authentication
          }

          try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Check if token is expired
            if (decoded.exp && Date.now() >= decoded.exp * 1000) {
              return next(); // Continue without authentication
            }

            // Get user from cache first
            const cacheKey = `user:${decoded.id}`;
            let user = cacheManager.get(cacheKey);

            if (!user) {
              user = await User.findById(decoded.id).select('-password');
              if (user && user.status === 'active') {
                cacheManager.set(cacheKey, user, 300);
              }
            }

            if (user && user.status === 'active') {
              req.user = user;
              req.token = token;
            }
          } catch (error) {
            // Token is invalid, continue without authentication
            logger.debug('Optional auth failed', { error: error.message });
          }
        }

        next();
      } catch (error) {
        // Continue without authentication on any error
        next();
      }
    };
  }

  /**
   * Rate limiting for authentication endpoints
   */
  static authRateLimit() {
    const rateLimit = require('express-rate-limit');

    return rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 5, // 5 attempts per window
      message: {
        success: false,
        error: 'Too many authentication attempts. Please try again later.',
        errorCode: 'RATE_LIMIT_ERROR',
      },
      keyGenerator: req => {
        return req.ip || 'unknown';
      },
      handler: (req, res) => {
        logger.warn('Authentication rate limit exceeded', {
          ip: req.ip,
          userAgent: req.get('User-Agent'),
        });
        res.status(429).json({
          success: false,
          error: 'Too many authentication attempts. Please try again later.',
          errorCode: 'RATE_LIMIT_ERROR',
        });
      },
    });
  }

  /**
   * Token refresh middleware
   */
  static refreshToken() {
    return async (req, res, next) => {
      try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
          throw new AuthenticationError('Refresh token is required');
        }

        // Verify refresh token
        const decoded = jwt.verify(
          refreshToken,
          process.env.JWT_REFRESH_SECRET
        );

        // Get user
        const user = await User.findById(decoded.id).select('-password');
        if (!user) {
          throw new AuthenticationError('User not found');
        }

        if (user.status !== 'active') {
          throw new AuthenticationError('User account is inactive');
        }

        // Generate new tokens
        const newToken = user.generateAuthToken();
        const newRefreshToken = user.generateRefreshToken();

        // Update last login
        await user.updateLastLogin();

        logger.info('Token refreshed', {
          userId: user._id,
          email: user.email,
        });

        res.json({
          success: true,
          data: {
            token: newToken,
            refreshToken: newRefreshToken,
            user: {
              id: user._id,
              name: user.name,
              email: user.email,
              role: user.role,
              status: user.status,
            },
          },
        });
      } catch (error) {
        if (error instanceof AuthenticationError) {
          return res.status(401).json({
            success: false,
            error: error.message,
            errorCode: 'AUTHENTICATION_ERROR',
          });
        }

        logger.error('Token refresh error', {
          error: error.message,
          ip: req.ip,
        });

        return res.status(401).json({
          success: false,
          error: 'Invalid refresh token',
          errorCode: 'AUTHENTICATION_ERROR',
        });
      }
    };
  }

  /**
   * Logout middleware
   */
  static logout() {
    return async (req, res, next) => {
      try {
        const token = req.headers.authorization?.split(' ')[1];

        if (token) {
          // Add token to blacklist (in production, use Redis)
          const blacklistKey = `blacklist:${token}`;
          cacheManager.set(blacklistKey, true, 3600); // 1 hour
        }

        logger.info('User logged out', {
          userId: req.user?._id,
          ip: req.ip,
        });

        res.json({
          success: true,
          message: 'Logged out successfully',
        });
      } catch (error) {
        next(error);
      }
    };
  }

  /**
   * Check if token is blacklisted
   */
  static checkBlacklist() {
    return async (req, res, next) => {
      const token = req.headers.authorization?.split(' ')[1];

      if (token) {
        const blacklistKey = `blacklist:${token}`;
        const isBlacklisted = cacheManager.get(blacklistKey);

        if (isBlacklisted) {
          return res.status(401).json({
            success: false,
            error: 'Token has been invalidated',
            errorCode: 'AUTHENTICATION_ERROR',
          });
        }
      }

      next();
    };
  }
}

module.exports = AuthMiddleware;
