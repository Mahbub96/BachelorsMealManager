const express = require('express');
const router = express.Router();
const superAdminController = require('../controllers/superAdminController');
const { protect, authorize } = require('../middleware/auth');

// Super Admin middleware - only super admins can access these routes
const superAdminOnly = authorize('super_admin');

// ==================== DASHBOARD & ANALYTICS ROUTES ====================

// Get system overview
router.get(
  '/overview',
  protect,
  superAdminOnly,
  superAdminController.getSystemOverview
);

// Get detailed analytics
router.get(
  '/analytics',
  protect,
  superAdminOnly,
  superAdminController.getAnalytics
);

// ==================== USER MANAGEMENT ROUTES ====================

// Get all users with pagination and filters
router.get('/users', protect, superAdminOnly, superAdminController.getAllUsers);

// Get specific user details
router.get(
  '/users/:userId',
  protect,
  superAdminOnly,
  superAdminController.getUserDetails
);

// Update user role and status
router.put(
  '/users/:userId',
  protect,
  superAdminOnly,
  superAdminController.updateUserRole
);

// Delete user
router.delete(
  '/users/:userId',
  protect,
  superAdminOnly,
  superAdminController.deleteUser
);

// ==================== SYSTEM MANAGEMENT ROUTES ====================

// Get system settings
router.get(
  '/system/settings',
  protect,
  superAdminOnly,
  superAdminController.getSystemSettings
);

// Update system settings
router.put(
  '/system/settings',
  protect,
  superAdminOnly,
  superAdminController.updateSystemSettings
);

// Get system logs
router.get(
  '/system/logs',
  protect,
  superAdminOnly,
  superAdminController.getSystemLogs
);

// ==================== AUDIT & MONITORING ROUTES ====================

// Get audit logs
router.get(
  '/audit/logs',
  protect,
  superAdminOnly,
  superAdminController.getAuditLogs
);

// Get performance metrics
router.get(
  '/performance/metrics',
  protect,
  superAdminOnly,
  superAdminController.getPerformanceMetrics
);

// ==================== BACKUP & RESTORE ROUTES ====================

// Create system backup
router.post(
  '/backup/create',
  protect,
  superAdminOnly,
  superAdminController.createBackup
);

// Get backup list
router.get(
  '/backup/list',
  protect,
  superAdminOnly,
  superAdminController.getBackups
);

// ==================== BILLING & SUPPORT ROUTES ====================

// Get billing information
router.get(
  '/billing/info',
  protect,
  superAdminOnly,
  superAdminController.getBillingInfo
);

// Get support tickets
router.get(
  '/support/tickets',
  protect,
  superAdminOnly,
  superAdminController.getSupportTickets
);

module.exports = router;
