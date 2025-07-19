const User = require('../models/User');
const { config } = require('../config/config');
const logger = require('../utils/logger');
const { sendSuccessResponse, sendErrorResponse } = require('../utils/responseHandler');

class UserController {
  // Get all users (admin only)
  async getAllUsers(req, res, next) {
    try {
      const { status, role, search, limit = 20, page = 1 } = req.query;

      // Build query
      const query = {};
      
      if (status) {
        query.status = status;
      }

      if (role) {
        query.role = role;
      }

      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ];
      }

      // Calculate pagination
      const skip = (parseInt(page) - 1) * parseInt(limit);
      
      // Get users with pagination
      const users = await User.find(query)
        .select('-password')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));

      // Get total count
      const total = await User.countDocuments(query);

      return sendSuccessResponse(res, 200, 'All users retrieved successfully', {
        users,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // Get user by ID (admin only)
  async getUserById(req, res, next) {
    try {
      const { userId } = req.params;

      const user = await User.findById(userId).select('-password');
      if (!user) {
        return sendErrorResponse(res, 404, 'User not found');
      }

      return sendSuccessResponse(res, 200, 'User retrieved successfully', user);
    } catch (error) {
      next(error);
    }
  }

  // Create user (admin only)
  async createUser(req, res, next) {
    try {
      const { name, email, password, phone, role = 'member' } = req.body;

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
        phone,
        role
      });

      logger.info(`New user created by admin ${req.user.email}: ${email}`);

      return sendSuccessResponse(res, 201, 'User created successfully', {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        status: user.status
      });
    } catch (error) {
      next(error);
    }
  }

  // Update user (admin only)
  async updateUser(req, res, next) {
    try {
      const { userId } = req.params;
      const { name, email, phone, role, status } = req.body;

      const user = await User.findById(userId);
      if (!user) {
        return sendErrorResponse(res, 404, 'User not found');
      }

      // Check if email is being changed and if it already exists
      if (email && email !== user.email) {
        const existingUser = await User.findByEmail(email);
        if (existingUser) {
          return sendErrorResponse(res, 400, 'Email already exists');
        }
      }

      // Update user
      const updateData = {};
      if (name) updateData.name = name;
      if (email) updateData.email = email;
      if (phone !== undefined) updateData.phone = phone;
      if (role) updateData.role = role;
      if (status) updateData.status = status;

      const updatedUser = await User.findByIdAndUpdate(
        userId,
        updateData,
        { new: true, runValidators: true }
      ).select('-password');

      logger.info(`User updated by admin ${req.user.email}: ${updatedUser.email}`);

      return sendSuccessResponse(res, 200, 'User updated successfully', updatedUser);
    } catch (error) {
      next(error);
    }
  }

  // Delete user (admin only)
  async deleteUser(req, res, next) {
    try {
      const { userId } = req.params;

      const user = await User.findById(userId);
      if (!user) {
        return sendErrorResponse(res, 404, 'User not found');
      }

      // Prevent admin from deleting themselves
      if (userId === req.user.id) {
        return sendErrorResponse(res, 400, 'Cannot delete your own account');
      }

      await User.findByIdAndDelete(userId);

      logger.info(`User deleted by admin ${req.user.email}: ${user.email}`);

      return sendSuccessResponse(res, 200, 'User deleted successfully');
    } catch (error) {
      next(error);
    }
  }

  // Get user statistics (admin only)
  async getUserStats(req, res, next) {
    try {
      const { userId } = req.params;
      const { startDate, endDate } = req.query;

      const user = await User.findById(userId);
      if (!user) {
        return sendErrorResponse(res, 404, 'User not found');
      }

      // Build date query
      const dateQuery = {};
      if (startDate && endDate) {
        dateQuery.date = {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        };
      }

      // Get user statistics
      const stats = await User.getUserStats(userId, dateQuery);

      return sendSuccessResponse(res, 200, 'User statistics retrieved successfully', stats);
    } catch (error) {
      next(error);
    }
  }

  // Get current user profile
  async getCurrentUserProfile(req, res, next) {
    try {
      const user = await User.findById(req.user.id).select('-password');
      
      return sendSuccessResponse(res, 200, 'Profile retrieved successfully', user.fullProfile);
    } catch (error) {
      next(error);
    }
  }

  // Update current user profile
  async updateCurrentUserProfile(req, res, next) {
    try {
      const { name, phone } = req.body;
      const updateData = {};

      if (name) updateData.name = name;
      if (phone !== undefined) updateData.phone = phone;

      const user = await User.findByIdAndUpdate(
        req.user.id,
        updateData,
        { new: true, runValidators: true }
      ).select('-password');

      return sendSuccessResponse(res, 200, 'Profile updated successfully', user.fullProfile);
    } catch (error) {
      next(error);
    }
  }

  // Change user status (admin only)
  async changeUserStatus(req, res, next) {
    try {
      const { userId } = req.params;
      const { status } = req.body;

      if (!['active', 'inactive'].includes(status)) {
        return sendErrorResponse(res, 400, 'Invalid status value');
      }

      const user = await User.findById(userId);
      if (!user) {
        return sendErrorResponse(res, 404, 'User not found');
      }

      // Prevent admin from deactivating themselves
      if (userId === req.user.id && status === 'inactive') {
        return sendErrorResponse(res, 400, 'Cannot deactivate your own account');
      }

      user.status = status;
      await user.save();

      logger.info(`User status changed by admin ${req.user.email}: ${user.email} -> ${status}`);

      return sendSuccessResponse(res, 200, 'User status updated successfully', {
        id: user._id,
        email: user.email,
        status: user.status
      });
    } catch (error) {
      next(error);
    }
  }

  // Change user role (admin only)
  async changeUserRole(req, res, next) {
    try {
      const { userId } = req.params;
      const { role } = req.body;

      if (!['admin', 'member'].includes(role)) {
        return sendErrorResponse(res, 400, 'Invalid role value');
      }

      const user = await User.findById(userId);
      if (!user) {
        return sendErrorResponse(res, 404, 'User not found');
      }

      // Prevent admin from changing their own role
      if (userId === req.user.id) {
        return sendErrorResponse(res, 400, 'Cannot change your own role');
      }

      user.role = role;
      await user.save();

      logger.info(`User role changed by admin ${req.user.email}: ${user.email} -> ${role}`);

      return sendSuccessResponse(res, 200, 'User role updated successfully', {
        id: user._id,
        email: user.email,
        role: user.role
      });
    } catch (error) {
      next(error);
    }
  }

  // Get user activity (admin only)
  async getUserActivity(req, res, next) {
    try {
      const { userId } = req.params;
      const { limit = 50 } = req.query;

      const user = await User.findById(userId);
      if (!user) {
        return sendErrorResponse(res, 404, 'User not found');
      }

      // Get user activity (this would need to be implemented based on your activity tracking)
      const activity = await User.getUserActivity(userId, parseInt(limit));

      return sendSuccessResponse(res, 200, 'User activity retrieved successfully', activity);
    } catch (error) {
      next(error);
    }
  }

  // Bulk update users (admin only)
  async bulkUpdateUsers(req, res, next) {
    try {
      const { userIds, updates } = req.body;

      if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
        return sendErrorResponse(res, 400, 'User IDs array is required');
      }

      if (!updates || typeof updates !== 'object') {
        return sendErrorResponse(res, 400, 'Updates object is required');
      }

      // Prevent admin from updating themselves
      if (userIds.includes(req.user.id)) {
        return sendErrorResponse(res, 400, 'Cannot update your own account in bulk operation');
      }

      // Update multiple users
      const result = await User.updateMany(
        { _id: { $in: userIds } },
        updates
      );

      logger.info(`Bulk user update by admin ${req.user.email}: ${result.modifiedCount} users updated`);

      return sendSuccessResponse(res, 200, 'Bulk user update successful', {
        updatedCount: result.modifiedCount,
        totalRequested: userIds.length
      });
    } catch (error) {
      next(error);
    }
  }

  // Get system statistics (admin only)
  async getSystemStats(req, res, next) {
    try {
      const stats = await User.getStats();

      return sendSuccessResponse(res, 200, 'System statistics retrieved successfully', stats);
    } catch (error) {
      next(error);
    }
  }

  // Search users (admin only)
  async searchUsers(req, res, next) {
    try {
      const { q, role, status, limit = 20 } = req.query;

      if (!q) {
        return sendErrorResponse(res, 400, 'Search query is required');
      }

      // Build search query
      const query = {
        $or: [
          { name: { $regex: q, $options: 'i' } },
          { email: { $regex: q, $options: 'i' } },
          { phone: { $regex: q, $options: 'i' } }
        ]
      };

      if (role) {
        query.role = role;
      }

      if (status) {
        query.status = status;
      }

      const users = await User.find(query)
        .select('-password')
        .sort({ name: 1 })
        .limit(parseInt(limit));

      return sendSuccessResponse(res, 200, 'Users search completed successfully', {
        users,
        query: q,
        count: users.length
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new UserController(); 