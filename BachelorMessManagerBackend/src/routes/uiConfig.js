const express = require('express');
const router = express.Router();
const uiConfigController = require('../controllers/uiConfigController');
const { protect, authorize } = require('../middleware/auth');

// UI Configuration middleware - only super admins can manage UI config
const superAdminOnly = authorize('super_admin');

// ==================== CONFIGURATION MANAGEMENT ROUTES ====================

// Get active UI configuration (public endpoint)
router.get('/active', uiConfigController.getActiveConfig);

// Get configuration by version
router.get('/version/:appId/:version', uiConfigController.getConfigByVersion);

// Create new configuration (super admin only)
router.post('/', protect, superAdminOnly, uiConfigController.createConfig);

// Update configuration (super admin only)
router.put(
  '/:configId',
  protect,
  superAdminOnly,
  uiConfigController.updateConfig
);

// Clone configuration (super admin only)
router.post(
  '/:configId/clone',
  protect,
  superAdminOnly,
  uiConfigController.cloneConfig
);

// Delete configuration (super admin only)
router.delete(
  '/:configId',
  protect,
  superAdminOnly,
  uiConfigController.deleteConfig
);

// Get all configurations (super admin only)
router.get('/', protect, superAdminOnly, uiConfigController.getAllConfigs);

// Get configuration history (super admin only)
router.get(
  '/:configId/history',
  protect,
  superAdminOnly,
  uiConfigController.getConfigHistory
);

// Validate configuration (super admin only)
router.get(
  '/:configId/validate',
  protect,
  superAdminOnly,
  uiConfigController.validateConfig
);

// ==================== THEME MANAGEMENT ROUTES ====================

// Get theme (public endpoint)
router.get('/theme', uiConfigController.getTheme);

// Update theme (super admin only)
router.put(
  '/:configId/theme',
  protect,
  superAdminOnly,
  uiConfigController.updateTheme
);

// ==================== FEATURE FLAGS ROUTES ====================

// Get feature flags (public endpoint)
router.get('/features', uiConfigController.getFeatureFlags);

// Update feature flags (super admin only)
router.put(
  '/:configId/features',
  protect,
  superAdminOnly,
  uiConfigController.updateFeatureFlags
);

// Toggle specific feature (super admin only)
router.post(
  '/:configId/features/toggle',
  protect,
  superAdminOnly,
  uiConfigController.toggleFeature
);

// ==================== NAVIGATION MANAGEMENT ROUTES ====================

// Get navigation (public endpoint)
router.get('/navigation', uiConfigController.getNavigation);

// Update navigation (super admin only)
router.put(
  '/:configId/navigation',
  protect,
  superAdminOnly,
  uiConfigController.updateNavigation
);

// ==================== COMPONENT CONFIGURATION ROUTES ====================

// Get component configuration (public endpoint)
router.get('/components', uiConfigController.getComponents);

// Update component configuration (super admin only)
router.put(
  '/:configId/components',
  protect,
  superAdminOnly,
  uiConfigController.updateComponents
);

// ==================== CONTENT MANAGEMENT ROUTES ====================

// Get content (public endpoint)
router.get('/content', uiConfigController.getContent);

// Update content (super admin only)
router.put(
  '/:configId/content',
  protect,
  superAdminOnly,
  uiConfigController.updateContent
);

// ==================== SECURITY SETTINGS ROUTES ====================

// Get security settings (super admin only)
router.get(
  '/security',
  protect,
  superAdminOnly,
  uiConfigController.getSecurity
);

// Update security settings (super admin only)
router.put(
  '/:configId/security',
  protect,
  superAdminOnly,
  uiConfigController.updateSecurity
);

// ==================== PERFORMANCE SETTINGS ROUTES ====================

// Get performance settings (super admin only)
router.get(
  '/performance',
  protect,
  superAdminOnly,
  uiConfigController.getPerformance
);

// Update performance settings (super admin only)
router.put(
  '/:configId/performance',
  protect,
  superAdminOnly,
  uiConfigController.updatePerformance
);

module.exports = router;
