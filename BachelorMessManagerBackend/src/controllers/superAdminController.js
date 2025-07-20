const User = require('../models/User');
const Meal = require('../models/Meal');
const Bazar = require('../models/Bazar');
const Statistics = require('../models/Statistics');
const { catchAsync } = require('../utils/errorHandler');
const { successResponse, errorResponse } = require('../utils/responseHandler');

// Super Admin Controller
const superAdminController = {
  // ==================== DASHBOARD & ANALYTICS ====================

  // Get comprehensive system overview
  getSystemOverview: catchAsync(async (req, res) => {
    const [
      userStats,
      mealStats,
      bazarStats,
      superAdminStats,
      recentActivities,
    ] = await Promise.all([
      User.getStats(),
      Meal.aggregate([
        {
          $group: {
            _id: null,
            totalMeals: { $sum: 1 },
            totalCost: { $sum: '$cost' },
            avgCost: { $avg: '$cost' },
            pendingMeals: {
              $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] },
            },
            approvedMeals: {
              $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] },
            },
          },
        },
      ]),
      Bazar.aggregate([
        {
          $group: {
            _id: null,
            totalBazar: { $sum: 1 },
            totalAmount: { $sum: '$amount' },
            avgAmount: { $avg: '$amount' },
            pendingBazar: {
              $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] },
            },
            approvedBazar: {
              $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] },
            },
          },
        },
      ]),
      User.getSuperAdminStats(),
      // Get recent activities (last 7 days)
      User.find({
        updatedAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      })
        .sort({ updatedAt: -1 })
        .limit(10),
    ]);

    const systemOverview = {
      users: userStats,
      meals: mealStats[0] || {
        totalMeals: 0,
        totalCost: 0,
        avgCost: 0,
        pendingMeals: 0,
        approvedMeals: 0,
      },
      bazar: bazarStats[0] || {
        totalBazar: 0,
        totalAmount: 0,
        avgAmount: 0,
        pendingBazar: 0,
        approvedBazar: 0,
      },
      superAdmins: superAdminStats,
      recentActivities: recentActivities.map(user => ({
        id: user._id,
        name: user.name,
        email: user.email,
        action: user.lastSuperAdminAction
          ? 'Super admin action'
          : 'User updated',
        timestamp: user.updatedAt,
      })),
      systemHealth: {
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
        nodeVersion: process.version,
        platform: process.platform,
      },
    };

    return successResponse(
      res,
      'System overview retrieved successfully',
      systemOverview
    );
  }),

  // Get detailed analytics
  getAnalytics: catchAsync(async (req, res) => {
    const { period = '30d' } = req.query;
    const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const analytics = await Promise.all([
      // User growth over time
      User.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
            },
            newUsers: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),

      // Meal statistics over time
      Meal.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
            },
            totalMeals: { $sum: 1 },
            totalCost: { $sum: '$cost' },
          },
        },
        { $sort: { _id: 1 } },
      ]),

      // Bazar statistics over time
      Bazar.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
            },
            totalBazar: { $sum: 1 },
            totalAmount: { $sum: '$amount' },
          },
        },
        { $sort: { _id: 1 } },
      ]),
    ]);

    return successResponse(res, 'Analytics retrieved successfully', {
      userGrowth: analytics[0],
      mealStats: analytics[1],
      bazarStats: analytics[2],
      period,
    });
  }),

  // ==================== USER MANAGEMENT ====================

  // Get all users with pagination and filters
  getAllUsers: catchAsync(async (req, res) => {
    const { page = 1, limit = 20, role, status, search } = req.query;
    const skip = (page - 1) * limit;

    let query = {};

    if (role) query.role = role;
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const [users, total] = await Promise.all([
      User.find(query)
        .select('-password')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      User.countDocuments(query),
    ]);

    return successResponse(res, 'Users retrieved successfully', {
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  }),

  // Get user details
  getUserDetails: catchAsync(async (req, res) => {
    const { userId } = req.params;

    const user = await User.findById(userId).select('-password');
    if (!user) {
      return errorResponse(res, 'User not found', 404);
    }

    // Get user's meal and bazar history
    const [meals, bazar] = await Promise.all([
      Meal.find({ userId }).sort({ createdAt: -1 }).limit(10),
      Bazar.find({ userId }).sort({ createdAt: -1 }).limit(10),
    ]);

    return successResponse(res, 'User details retrieved successfully', {
      user,
      recentMeals: meals,
      recentBazar: bazar,
    });
  }),

  // Update user role and status
  updateUserRole: catchAsync(async (req, res) => {
    const { userId } = req.params;
    const { role, status, superAdminPermissions } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return errorResponse(res, 'User not found', 404);
    }

    // Validate role change
    if (role && !['super_admin', 'admin', 'member'].includes(role)) {
      return errorResponse(res, 'Invalid role', 400);
    }

    // Update user
    if (role) user.role = role;
    if (status) user.status = status;
    if (superAdminPermissions && role === 'super_admin') {
      user.superAdminPermissions = superAdminPermissions;
    }

    await user.save();

    // Log super admin action
    if (req.user.isSuperAdminUser()) {
      await req.user.updateSuperAdminAction(
        `Updated user ${user.email} role to ${role}`
      );
    }

    return successResponse(res, 'User updated successfully', { user });
  }),

  // Delete user
  deleteUser: catchAsync(async (req, res) => {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return errorResponse(res, 'User not found', 404);
    }

    // Prevent deleting super admins
    if (user.isSuperAdminUser()) {
      return errorResponse(res, 'Cannot delete super admin users', 403);
    }

    await User.findByIdAndDelete(userId);

    // Log super admin action
    if (req.user.isSuperAdminUser()) {
      await req.user.updateSuperAdminAction(`Deleted user ${user.email}`);
    }

    return successResponse(res, 'User deleted successfully');
  }),

  // ==================== SYSTEM MANAGEMENT ====================

  // Get system settings
  getSystemSettings: catchAsync(async (req, res) => {
    const settings = {
      environment: process.env.NODE_ENV,
      database: {
        url: process.env.MONGODB_URI ? 'Configured' : 'Not configured',
        connection: 'Connected',
      },
      jwt: {
        secret: process.env.JWT_SECRET ? 'Configured' : 'Not configured',
        expiresIn: process.env.JWT_EXPIRES_IN || '7d',
      },
      server: {
        port: process.env.PORT || 5000,
        cors: process.env.CORS_ORIGIN || 'All origins',
      },
      features: {
        pushNotifications:
          process.env.EXPO_PUBLIC_FEATURE_PUSH_NOTIFICATIONS === 'true',
        realTimeUpdates:
          process.env.EXPO_PUBLIC_FEATURE_REAL_TIME_UPDATES === 'true',
        backgroundSync:
          process.env.EXPO_PUBLIC_FEATURE_BACKGROUND_SYNC === 'true',
        crashReporting:
          process.env.EXPO_PUBLIC_FEATURE_CRASH_REPORTING === 'true',
        analyticsTracking:
          process.env.EXPO_PUBLIC_FEATURE_ANALYTICS_TRACKING === 'true',
      },
    };

    return successResponse(
      res,
      'System settings retrieved successfully',
      settings
    );
  }),

  // Update system settings
  updateSystemSettings: catchAsync(async (req, res) => {
    const { settings } = req.body;

    // Log the settings update
    if (req.user.isSuperAdminUser()) {
      await req.user.updateSuperAdminAction(
        `Updated system settings: ${JSON.stringify(settings)}`
      );
    }

    return successResponse(res, 'System settings updated successfully', {
      settings,
    });
  }),

  // Get system logs
  getSystemLogs: catchAsync(async (req, res) => {
    const { type = 'all', limit = 100 } = req.query;

    // In a real application, you would have a proper logging system
    // For now, we'll return mock logs
    const logs = [
      {
        id: 1,
        type: 'info',
        message: 'System started successfully',
        timestamp: new Date(),
        level: 'info',
      },
      {
        id: 2,
        type: 'warning',
        message: 'High memory usage detected',
        timestamp: new Date(Date.now() - 1000 * 60 * 5),
        level: 'warning',
      },
      {
        id: 3,
        type: 'error',
        message: 'Database connection timeout',
        timestamp: new Date(Date.now() - 1000 * 60 * 10),
        level: 'error',
      },
    ];

    return successResponse(res, 'System logs retrieved successfully', { logs });
  }),

  // ==================== AUDIT & MONITORING ====================

  // Get audit logs
  getAuditLogs: catchAsync(async (req, res) => {
    const { page = 1, limit = 50, userId, action } = req.query;
    const skip = (page - 1) * limit;

    let query = {};
    if (userId) query.userId = userId;
    if (action) query.action = { $regex: action, $options: 'i' };

    // Get super admin actions
    const superAdmins = await User.findSuperAdmins();
    const auditLogs = superAdmins
      .filter(user => user.lastSuperAdminAction)
      .map(user => ({
        id: user._id,
        userId: user._id,
        userName: user.name,
        userEmail: user.email,
        action: user.superAdminNotes,
        timestamp: user.lastSuperAdminAction,
        type: 'super_admin_action',
      }))
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(skip, skip + parseInt(limit));

    const total = superAdmins.filter(user => user.lastSuperAdminAction).length;

    return successResponse(res, 'Audit logs retrieved successfully', {
      logs: auditLogs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  }),

  // Get performance metrics
  getPerformanceMetrics: catchAsync(async (req, res) => {
    const metrics = {
      system: {
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
        cpuUsage: process.cpuUsage(),
        nodeVersion: process.version,
        platform: process.platform,
      },
      database: {
        collections: await Promise.all([
          User.countDocuments(),
          Meal.countDocuments(),
          Bazar.countDocuments(),
          Statistics.countDocuments(),
        ]),
      },
      api: {
        requestsPerMinute: 0, // Would be tracked in a real app
        averageResponseTime: 0,
        errorRate: 0,
      },
    };

    return successResponse(
      res,
      'Performance metrics retrieved successfully',
      metrics
    );
  }),

  // ==================== BACKUP & RESTORE ====================

  // Create system backup
  createBackup: catchAsync(async (req, res) => {
    const backupData = {
      timestamp: new Date(),
      users: await User.find().select('-password'),
      meals: await Meal.find(),
      bazar: await Bazar.find(),
      statistics: await Statistics.find(),
    };

    // In a real application, you would save this to a file or cloud storage
    const backupId = `backup_${Date.now()}`;

    // Log backup creation
    if (req.user.isSuperAdminUser()) {
      await req.user.updateSuperAdminAction(
        `Created system backup: ${backupId}`
      );
    }

    return successResponse(res, 'Backup created successfully', {
      backupId,
      timestamp: backupData.timestamp,
      size: JSON.stringify(backupData).length,
    });
  }),

  // Get backup list
  getBackups: catchAsync(async (req, res) => {
    // In a real application, you would retrieve from storage
    const backups = [
      {
        id: 'backup_1',
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
        size: '2.5MB',
        status: 'completed',
      },
      {
        id: 'backup_2',
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        size: '2.3MB',
        status: 'completed',
      },
    ];

    return successResponse(res, 'Backups retrieved successfully', { backups });
  }),

  // ==================== BILLING & SUPPORT ====================

  // Get billing information
  getBillingInfo: catchAsync(async (req, res) => {
    const billingInfo = {
      plan: 'Enterprise',
      status: 'Active',
      nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      amount: 99.99,
      currency: 'USD',
      features: [
        'Unlimited Users',
        'Advanced Analytics',
        'Priority Support',
        'Custom Integrations',
      ],
    };

    return successResponse(
      res,
      'Billing information retrieved successfully',
      billingInfo
    );
  }),

  // Get support tickets
  getSupportTickets: catchAsync(async (req, res) => {
    const { status = 'all' } = req.query;

    // In a real application, you would have a support ticket system
    const tickets = [
      {
        id: 'TICKET-001',
        subject: 'Payment issue',
        status: 'open',
        priority: 'high',
        createdAt: new Date(),
        user: {
          name: 'John Doe',
          email: 'john@example.com',
        },
      },
      {
        id: 'TICKET-002',
        subject: 'Feature request',
        status: 'in_progress',
        priority: 'medium',
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
        user: {
          name: 'Jane Smith',
          email: 'jane@example.com',
        },
      },
    ];

    const filteredTickets =
      status === 'all'
        ? tickets
        : tickets.filter(ticket => ticket.status === status);

    return successResponse(res, 'Support tickets retrieved successfully', {
      tickets: filteredTickets,
      total: filteredTickets.length,
    });
  }),
};

module.exports = superAdminController;
