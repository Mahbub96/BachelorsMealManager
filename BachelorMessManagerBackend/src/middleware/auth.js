const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { AuthenticationError } = require('../utils/errorHandler');
const { cacheManager } = require('../utils/cache');

class AuthMiddleware {
  /**
   * Protect routes - require authentication
   */
  static protect() {
    return async (req, res, next) => {
      try {
        // 1️⃣ Get token from headers
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
          return res.status(401).json({ success: false, error: 'Not authorized, token missing', errorCode: 'AUTHENTICATION_ERROR' });
        }

        const token = authHeader.split(' ')[1];

        // 2️⃣ Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (!decoded.id) {
          return res.status(401).json({ success: false, error: 'Invalid token', errorCode: 'AUTHENTICATION_ERROR' });
        }

        // 3️⃣ Check cache first
        const cacheKey = `user:${decoded.id}`;
        let user = cacheManager.get(cacheKey);

        if (!user) {
          user = await User.findById(decoded.id).select('-password');
          if (!user || user.status !== 'active') {
            return res.status(401).json({ success: false, error: 'User not found or inactive', errorCode: 'AUTHENTICATION_ERROR' });
          }
          cacheManager.set(cacheKey, user, 300); // cache for 5 minutes
        }

        // 4️⃣ Attach user and token to request
        req.user = user;
        req.token = token;

        next();
      } catch (error) {
        console.error('AuthMiddleware protect error:', error.message);
        return res.status(401).json({ success: false, error: 'Not authorized', errorCode: 'AUTHENTICATION_ERROR' });
      }
    };
  }

  /**
   * Require specific role(s)
   */
  static requireRole(roles) {
    const allowedRoles = Array.isArray(roles) ? roles : [roles];
    return (req, res, next) => {
      if (!req.user) {
        return res.status(401).json({ success: false, error: 'Authentication required', errorCode: 'AUTHENTICATION_ERROR' });
      }
      if (!allowedRoles.includes(req.user.role)) {
        return res.status(403).json({ success: false, error: 'Access denied - Insufficient permissions', errorCode: 'AUTHORIZATION_ERROR' });
      }
      next();
    };
  }

  static requireAdmin() { return AuthMiddleware.requireRole('admin'); }
  static requireSuperAdmin() { return AuthMiddleware.requireRole('super_admin'); }
  static requireMember() { return AuthMiddleware.requireRole(['admin', 'member']); }
  static authorize(role) { return AuthMiddleware.requireRole(role); }

  /**
   * Optional authentication - doesn't fail if no token
   */
  static optional() {
    return async (req, res, next) => {
      try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) return next();

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

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
      } catch (err) {
        // ignore errors, continue without auth
      }
      next();
    };
  }

  /**
   * Rate limiting for authentication endpoints
   */
  static authRateLimit() {
    const rateLimit = require('express-rate-limit');
    return rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 5,
      message: {
        success: false,
        error: 'Too many authentication attempts. Please try again later.',
        errorCode: 'RATE_LIMIT_ERROR',
      },
      keyGenerator: req => req.ip || 'unknown',
    });
  }

  /**
   * Token refresh
   */
  static refreshToken() {
    return async (req, res) => {
      try {
        const { refreshToken } = req.body;
        if (!refreshToken) throw new AuthenticationError('Refresh token is required');

        const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
        const user = await User.findById(decoded.id).select('-password');
        if (!user || user.status !== 'active') throw new AuthenticationError('Invalid user');

        const newToken = user.generateAuthToken();
        const newRefreshToken = user.generateRefreshToken();
        await user.updateLastLogin();

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
        return res.status(401).json({ success: false, error: 'Invalid refresh token', errorCode: 'AUTHENTICATION_ERROR' });
      }
    };
  }

  /**
   * Logout
   */
  static logout() {
    return async (req, res) => {
      try {
        const token = req.headers.authorization?.split(' ')[1];
        if (token) {
          cacheManager.set(`blacklist:${token}`, true, 3600);
        }
        res.json({ success: true, message: 'Logged out successfully' });
      } catch (err) {
        res.status(500).json({ success: false, error: 'Logout failed' });
      }
    };
  }

  /**
   * Check if token is blacklisted
   */
  static checkBlacklist() {
    return (req, res, next) => {
      const token = req.headers.authorization?.split(' ')[1];
      if (token && cacheManager.get(`blacklist:${token}`)) {
        return res.status(401).json({ success: false, error: 'Token has been invalidated', errorCode: 'AUTHENTICATION_ERROR' });
      }
      next();
    };
  }
}

module.exports = AuthMiddleware;
