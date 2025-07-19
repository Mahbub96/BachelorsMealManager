const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { config } = require('../config/config');
const logger = require('../utils/logger');
const { sendSuccessResponse, sendErrorResponse } = require('../utils/responseHandler');
const crypto = require('crypto');

class AuthController {
  // Register new user
  async register(req, res, next) {
    try {
      const { name, email, password, role = 'member' } = req.body;

      // Check if user already exists
      const existingUser = await User.findByEmail(email);
      if (existingUser) {
        return sendErrorResponse(res, 400, 'User already exists');
      }

      // Create user
      const user = await User.create({
        name,
        email,
        password,
        role
      });

      logger.info(`New user registered: ${email}`);

      return sendSuccessResponse(res, 201, 'User registered successfully', {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      });
    } catch (error) {
      next(error);
    }
  }

  // Login user
  async login(req, res, next) {
    try {
      const { email, password } = req.body;

      // Check if user exists
      const user = await User.findByEmail(email).select('+password');
      if (!user) {
        return sendErrorResponse(res, 404, 'User not found');
      }

      // Check if user is active
      if (user.status !== 'active') {
        return sendErrorResponse(res, 401, 'User account is inactive');
      }

      // Check if password matches
      const isMatch = await user.matchPassword(password);
      if (!isMatch) {
        return sendErrorResponse(res, 400, 'Invalid credentials');
      }

      // Update last login
      await user.updateLastLogin();

      // Generate tokens
      const token = user.generateAuthToken();
      const refreshToken = user.generateRefreshToken();

      logger.info(`User logged in: ${email}`);

      return sendSuccessResponse(res, 200, 'Login successful', {
        token,
        refreshToken,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          status: user.status
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // Get current user profile
  async getProfile(req, res, next) {
    try {
      const user = await User.findById(req.user.id);
      
      return sendSuccessResponse(res, 200, 'Profile retrieved successfully', user.fullProfile);
    } catch (error) {
      next(error);
    }
  }

  // Update current user profile
  async updateProfile(req, res, next) {
    try {
      const { name, phone } = req.body;
      const updateData = {};

      if (name) updateData.name = name;
      if (phone) updateData.phone = phone;

      const user = await User.findByIdAndUpdate(
        req.user.id,
        updateData,
        { new: true, runValidators: true }
      );

      return sendSuccessResponse(res, 200, 'Profile updated successfully', user.fullProfile);
    } catch (error) {
      next(error);
    }
  }

  // Change password
  async changePassword(req, res, next) {
    try {
      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        return sendErrorResponse(res, 400, 'Current password and new password are required');
      }

      // Get user with password
      const user = await User.findById(req.user.id).select('+password');

      // Check current password
      const isMatch = await user.matchPassword(currentPassword);
      if (!isMatch) {
        return sendErrorResponse(res, 400, 'Current password is incorrect');
      }

      // Update password
      user.password = newPassword;
      await user.save();

      logger.info(`Password changed for user: ${user.email}`);

      return sendSuccessResponse(res, 200, 'Password changed successfully');
    } catch (error) {
      next(error);
    }
  }

  // Refresh token
  async refreshToken(req, res, next) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return sendErrorResponse(res, 400, 'Refresh token is required');
      }

      // Verify refresh token
      const decoded = jwt.verify(refreshToken, config.jwt.refreshSecret);
      
      if (decoded.type !== 'refresh') {
        return sendErrorResponse(res, 401, 'Invalid token type');
      }

      // Get user
      const user = await User.findById(decoded.id);
      if (!user || user.status !== 'active') {
        return sendErrorResponse(res, 401, 'User not found or inactive');
      }

      // Generate new tokens
      const newToken = user.generateAuthToken();
      const newRefreshToken = user.generateRefreshToken();

      return sendSuccessResponse(res, 200, 'Token refreshed successfully', {
        token: newToken,
        refreshToken: newRefreshToken
      });
    } catch (error) {
      if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
        return sendErrorResponse(res, 401, 'Invalid or expired refresh token');
      }
      next(error);
    }
  }

  // Logout user
  async logout(req, res, next) {
    try {
      // In a more complex system, you might want to blacklist the token
      // For now, we'll just return a success response
      logger.info(`User logged out: ${req.user.email}`);

      return sendSuccessResponse(res, 200, 'Logged out successfully');
    } catch (error) {
      next(error);
    }
  }

  // Verify token
  async verifyToken(req, res, next) {
    try {
      return sendSuccessResponse(res, 200, 'Token is valid', {
        user: req.user.fullProfile
      });
    } catch (error) {
      next(error);
    }
  }

  // Forgot password
  async forgotPassword(req, res, next) {
    try {
      const { email } = req.body;

      const user = await User.findByEmail(email);
      if (!user) {
        return sendErrorResponse(res, 404, 'User not found');
      }

      // Generate reset token
      const resetToken = user.getResetPasswordToken();
      await user.save();

      // In a real application, you would send an email here
      // For now, we'll just return the token (in production, this should be sent via email)
      logger.info(`Password reset requested for: ${email}`);

      return sendSuccessResponse(res, 200, 'Password reset email sent', {
        message: 'If an account with that email exists, a password reset link has been sent'
      });
    } catch (error) {
      next(error);
    }
  }

  // Reset password
  async resetPassword(req, res, next) {
    try {
      const { token, newPassword } = req.body;

      if (!token || !newPassword) {
        return sendErrorResponse(res, 400, 'Token and new password are required');
      }

      // Get hashed token
      const resetPasswordToken = crypto
        .createHash('sha256')
        .update(token)
        .digest('hex');

      const user = await User.findOne({
        passwordResetToken: resetPasswordToken,
        passwordResetExpires: { $gt: Date.now() }
      });

      if (!user) {
        return sendErrorResponse(res, 400, 'Invalid or expired reset token');
      }

      // Set new password
      user.password = newPassword;
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save();

      logger.info(`Password reset completed for: ${user.email}`);

      return sendSuccessResponse(res, 200, 'Password reset successful');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AuthController(); 