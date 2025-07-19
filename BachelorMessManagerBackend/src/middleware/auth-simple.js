/**
 * Authentication Middleware
 * Fixed version to resolve logout issue
 */

const jwt = require('jsonwebtoken');
const User = require('../models/User');
const logger = require('../utils/logger');
const {
  AuthenticationError,
  AuthorizationError,
} = require('../utils/errorHandler');

/**
 * Protect routes - require authentication
 */
const protect = async (req, res, next) => {
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

    // Get user from database
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      throw new AuthenticationError('User not found');
    }

    // Check if user is active
    if (user.status !== 'active') {
      throw new AuthenticationError('User account is inactive');
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

/**
 * Require specific role
 */
const requireRole = roles => {
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
};

/**
 * Require admin role
 */
const requireAdmin = () => {
  return requireRole('admin');
};

/**
 * Require member role
 */
const requireMember = () => {
  return requireRole(['admin', 'member']);
};

module.exports = {
  protect,
  requireRole,
  requireAdmin,
  requireMember,
};
