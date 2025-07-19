/**
 * Example Route - Demonstrates Uniform Response, CRUD Operations, and Logging
 * This file shows how to use the new uniform utilities in your API routes
 */

const express = require('express');
const router = express.Router();
const AuthMiddleware = require('../middleware/auth');
const { validateObjectId } = require('../middleware/validation');

// Import uniform utilities
const {
  sendSuccess,
  sendCreated,
  sendError,
  sendNotFound,
  sendUnauthorized,
  sendForbidden,
  sendValidationError,
  sendPaginated,
  getRequestContext,
} = require('../utils/responseHandler');

const {
  createResource,
  findResources,
  findResourceById,
  updateResource,
  deleteResource,
  countResources,
  resourceExists,
} = require('../utils/crudOperations');

const logger = require('../utils/logger');

// Import your models
const User = require('../models/User');
const Meal = require('../models/Meal');

/**
 * Example: Create a new user with uniform response and logging
 */
router.post('/users', AuthMiddleware.protect(), AuthMiddleware.requireAdmin(), async (req, res, next) => {
  try {
    const { name, email, password, role = 'member' } = req.body;
    const context = getRequestContext(req);

    // Log business event
    req.logBusinessEvent('user_creation_attempt', {
      email,
      role,
      adminId: req.user.id,
    });

    // Check if user already exists
    const exists = await resourceExists(User, { email }, { context });
    if (exists) {
      return sendError(res, 409, 'User already exists', 'USER_EXISTS', {
        ...context,
        endpoint: 'POST /api/example/users',
      });
    }

    // Create user using uniform CRUD operation
    const user = await createResource(User, {
      name,
      email,
      password,
      role,
    }, {
      context,
      logData: false, // Don't log sensitive data
    });

    // Log successful creation
    req.logBusinessEvent('user_created', {
      userId: user._id,
      email: user.email,
      role: user.role,
    });

    // Send uniform response
    sendCreated(res, 'User created successfully', {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    }, {
      ...context,
      endpoint: 'POST /api/example/users',
    });

  } catch (error) {
    next(error);
  }
});

/**
 * Example: Get users with pagination and uniform response
 */
router.get('/users', AuthMiddleware.protect(), AuthMiddleware.requireAdmin(), async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search, role, status } = req.query;
    const context = getRequestContext(req);

    // Build filter
    const filter = {};
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }
    if (role) filter.role = role;
    if (status) filter.status = status;

    // Find users using uniform CRUD operation
    const result = await findResources(User, filter, {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { createdAt: -1 },
      select: '-password',
      populate: null,
      context,
    });

    // Log business event
    req.logBusinessEvent('users_retrieved', {
      count: result.resources.length,
      total: result.pagination.total,
      filters: { search, role, status },
    });

    // Send paginated response
    sendPaginated(res, 'Users retrieved successfully', result.resources, result.pagination, {
      ...context,
      endpoint: 'GET /api/example/users',
    });

  } catch (error) {
    next(error);
  }
});

/**
 * Example: Get user by ID with uniform response
 */
router.get('/users/:userId', AuthMiddleware.protect(), async (req, res, next) => {
  try {
    const { userId } = req.params;
    const context = getRequestContext(req);

    // Check if user can access this resource
    if (req.user.role !== 'admin' && req.user.id !== userId) {
      return sendForbidden(res, 'Access denied to this user resource', {
        ...context,
        endpoint: 'GET /api/example/users/:userId',
      });
    }

    // Find user using uniform CRUD operation
    const user = await findResourceById(User, userId, {
      select: '-password',
      populate: null,
      context,
    });

    if (!user) {
      return sendNotFound(res, 'User not found', {
        ...context,
        endpoint: 'GET /api/example/users/:userId',
      });
    }

    // Log business event
    req.logBusinessEvent('user_retrieved', {
      userId: user._id,
      requestedBy: req.user.id,
    });

    // Send success response
    sendSuccess(res, 200, 'User retrieved successfully', {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      createdAt: user.createdAt,
    }, {
      ...context,
      endpoint: 'GET /api/example/users/:userId',
    });

  } catch (error) {
    next(error);
  }
});

/**
 * Example: Update user with uniform response
 */
router.put('/users/:userId', AuthMiddleware.protect(), async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { name, email, role, status } = req.body;
    const context = getRequestContext(req);

    // Check permissions
    if (req.user.role !== 'admin' && req.user.id !== userId) {
      return sendForbidden(res, 'Access denied to update this user', {
        ...context,
        endpoint: 'PUT /api/example/users/:userId',
      });
    }

    // Check if user exists
    const userExists = await resourceExists(User, { _id: userId }, { context });
    if (!userExists) {
      return sendNotFound(res, 'User not found', {
        ...context,
        endpoint: 'PUT /api/example/users/:userId',
      });
    }

    // Prepare update data
    const updateData = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (role && req.user.role === 'admin') updateData.role = role;
    if (status && req.user.role === 'admin') updateData.status = status;

    // Update user using uniform CRUD operation
    const updatedUser = await updateResource(User, userId, updateData, {
      context,
      logData: false,
    });

    if (!updatedUser) {
      return sendError(res, 500, 'Failed to update user', 'UPDATE_FAILED', {
        ...context,
        endpoint: 'PUT /api/example/users/:userId',
      });
    }

    // Log business event
    req.logBusinessEvent('user_updated', {
      userId: updatedUser._id,
      updatedBy: req.user.id,
      updatedFields: Object.keys(updateData),
    });

    // Send success response
    sendSuccess(res, 200, 'User updated successfully', {
      id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      status: updatedUser.status,
      updatedAt: updatedUser.updatedAt,
    }, {
      ...context,
      endpoint: 'PUT /api/example/users/:userId',
    });

  } catch (error) {
    next(error);
  }
});

/**
 * Example: Delete user with uniform response
 */
router.delete('/users/:userId', AuthMiddleware.protect(), AuthMiddleware.requireAdmin(), async (req, res, next) => {
  try {
    const { userId } = req.params;
    const context = getRequestContext(req);

    // Check if user exists
    const user = await findResourceById(User, userId, { context });
    if (!user) {
      return sendNotFound(res, 'User not found', {
        ...context,
        endpoint: 'DELETE /api/example/users/:userId',
      });
    }

    // Prevent admin from deleting themselves
    if (userId === req.user.id) {
      return sendError(res, 400, 'Cannot delete your own account', 'SELF_DELETE_ATTEMPT', {
        ...context,
        endpoint: 'DELETE /api/example/users/:userId',
      });
    }

    // Delete user using uniform CRUD operation
    const deletedUser = await deleteResource(User, userId, { context });

    // Log business event
    req.logBusinessEvent('user_deleted', {
      deletedUserId: userId,
      deletedBy: req.user.id,
      deletedUserEmail: user.email,
    });

    // Send success response
    sendSuccess(res, 200, 'User deleted successfully', {
      id: deletedUser._id,
      email: deletedUser.email,
      deletedAt: new Date().toISOString(),
    }, {
      ...context,
      endpoint: 'DELETE /api/example/users/:userId',
    });

  } catch (error) {
    next(error);
  }
});

/**
 * Example: Get user statistics with uniform response
 */
router.get('/users/stats', AuthMiddleware.protect(), AuthMiddleware.requireAdmin(), async (req, res, next) => {
  try {
    const context = getRequestContext(req);

    // Get counts using uniform CRUD operations
    const [totalUsers, activeUsers, adminUsers] = await Promise.all([
      countResources(User, {}, { context }),
      countResources(User, { status: 'active' }, { context }),
      countResources(User, { role: 'admin' }, { context }),
    ]);

    // Log business event
    req.logBusinessEvent('user_stats_retrieved', {
      totalUsers,
      activeUsers,
      adminUsers,
    });

    // Send success response
    sendSuccess(res, 200, 'User statistics retrieved successfully', {
      total: totalUsers,
      active: activeUsers,
      admins: adminUsers,
      inactive: totalUsers - activeUsers,
    }, {
      ...context,
      endpoint: 'GET /api/example/users/stats',
    });

  } catch (error) {
    next(error);
  }
});

/**
 * Example: Get meals with advanced filtering and pagination
 */
router.get('/meals', AuthMiddleware.protect(), async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status, startDate, endDate, userId } = req.query;
    const context = getRequestContext(req);

    // Build filter based on user role
    const filter = {};
    if (req.user.role !== 'admin') {
      filter.userId = req.user.id; // Users can only see their own meals
    } else if (userId) {
      filter.userId = userId; // Admins can filter by specific user
    }

    if (status) filter.status = status;
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    // Find meals using uniform CRUD operation
    const result = await findResources(Meal, filter, {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { date: -1 },
      populate: [
        { path: 'userId', select: 'name email' },
        { path: 'approvedBy', select: 'name' },
      ],
      context,
    });

    // Log business event
    req.logBusinessEvent('meals_retrieved', {
      count: result.resources.length,
      total: result.pagination.total,
      filters: { status, startDate, endDate, userId },
      userRole: req.user.role,
    });

    // Send paginated response
    sendPaginated(res, 'Meals retrieved successfully', result.resources, result.pagination, {
      ...context,
      endpoint: 'GET /api/example/meals',
    });

  } catch (error) {
    next(error);
  }
});

module.exports = router; 