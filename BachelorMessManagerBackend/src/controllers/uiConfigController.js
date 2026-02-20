const UIConfig = require('../models/UIConfig');
const { catchAsync } = require('../utils/errorHandler');
const { successResponse, errorResponse } = require('../utils/responseHandler');
const logger = require('../utils/logger');

const uiConfigController = {
  // ==================== CONFIGURATION MANAGEMENT ====================

  // Get active UI configuration
  getActiveConfig: catchAsync(async (req, res) => {
    const { appId = 'bachelor-mess-manager', environment = 'development' } =
      req.query;

    let config = await UIConfig.getActiveConfig(appId, environment);

    if (!config) {
      // Create default configuration if none exists
      config = await UIConfig.createDefaultConfig(req.user._id);
    }

    // Validate configuration
    const validationErrors = config.validateConfig();
    if (validationErrors.length > 0) {
      logger.warn('UI Configuration validation errors', { count: validationErrors.length });
    }

    return successResponse(
      res,
      'UI configuration retrieved successfully',
      config
    );
  }),

  // Get configuration by version
  getConfigByVersion: catchAsync(async (req, res) => {
    const { appId, version } = req.params;

    const config = await UIConfig.getConfigByVersion(appId, version);
    if (!config) {
      return errorResponse(res, 'Configuration not found', 404);
    }

    return successResponse(
      res,
      'UI configuration retrieved successfully',
      config
    );
  }),

  // Create new configuration
  createConfig: catchAsync(async (req, res) => {
    const configData = {
      ...req.body,
      createdBy: req.user._id,
      lastModifiedBy: req.user._id,
    };

    // Validate configuration
    const tempConfig = new UIConfig(configData);
    const validationErrors = tempConfig.validateConfig();

    if (validationErrors.length > 0) {
      return errorResponse(res, 'Invalid configuration', 400, {
        validationErrors,
      });
    }

    const config = await UIConfig.create(configData);

    return successResponse(
      res,
      'UI configuration created successfully',
      config
    );
  }),

  // Update configuration
  updateConfig: catchAsync(async (req, res) => {
    const { configId } = req.params;
    const updateData = {
      ...req.body,
      lastModifiedBy: req.user._id,
    };

    const config = await UIConfig.findById(configId);
    if (!config) {
      return errorResponse(res, 'Configuration not found', 404);
    }

    // Validate updated configuration
    const tempConfig = new UIConfig({ ...config.toObject(), ...updateData });
    const validationErrors = tempConfig.validateConfig();

    if (validationErrors.length > 0) {
      return errorResponse(res, 'Invalid configuration', 400, {
        validationErrors,
      });
    }

    // Update configuration
    Object.assign(config, updateData);
    await config.save();

    return successResponse(
      res,
      'UI configuration updated successfully',
      config
    );
  }),

  // Clone configuration
  cloneConfig: catchAsync(async (req, res) => {
    const { configId } = req.params;

    const originalConfig = await UIConfig.findById(configId);
    if (!originalConfig) {
      return errorResponse(res, 'Configuration not found', 404);
    }

    const clonedConfig = await originalConfig.clone(req.user._id);

    return successResponse(
      res,
      'UI configuration cloned successfully',
      clonedConfig
    );
  }),

  // Delete configuration
  deleteConfig: catchAsync(async (req, res) => {
    const { configId } = req.params;

    const config = await UIConfig.findById(configId);
    if (!config) {
      return errorResponse(res, 'Configuration not found', 404);
    }

    // Check if this is the only active configuration
    const activeConfigs = await UIConfig.countDocuments({
      appId: config.appId,
      environment: config.environment,
      isActive: true,
    });

    if (activeConfigs <= 1) {
      return errorResponse(
        res,
        'Cannot delete the only active configuration',
        400
      );
    }

    await UIConfig.findByIdAndDelete(configId);

    return successResponse(res, 'UI configuration deleted successfully');
  }),

  // ==================== THEME MANAGEMENT ====================

  // Update theme
  updateTheme: catchAsync(async (req, res) => {
    const { configId } = req.params;
    const { theme } = req.body;

    const config = await UIConfig.findById(configId);
    if (!config) {
      return errorResponse(res, 'Configuration not found', 404);
    }

    // Validate theme colors
    const colorFields = [
      'primaryColor',
      'secondaryColor',
      'accentColor',
      'backgroundColor',
      'textColor',
    ];
    const validationErrors = [];

    colorFields.forEach(field => {
      if (theme[field] && !/^#[0-9A-F]{6}$/i.test(theme[field])) {
        validationErrors.push(`Invalid ${field}: ${theme[field]}`);
      }
    });

    if (validationErrors.length > 0) {
      return errorResponse(res, 'Invalid theme colors', 400, {
        validationErrors,
      });
    }

    config.theme = { ...config.theme, ...theme };
    config.lastModifiedBy = req.user._id;
    await config.save();

    return successResponse(res, 'Theme updated successfully', config.theme);
  }),

  // Get theme
  getTheme: catchAsync(async (req, res) => {
    const { appId = 'bachelor-mess-manager', environment = 'development' } =
      req.query;

    const config = await UIConfig.getActiveConfig(appId, environment);
    if (!config) {
      return errorResponse(res, 'Configuration not found', 404);
    }

    return successResponse(res, 'Theme retrieved successfully', config.theme);
  }),

  // ==================== FEATURE FLAGS ====================

  // Update feature flags
  updateFeatureFlags: catchAsync(async (req, res) => {
    const { configId } = req.params;
    const { features } = req.body;

    const config = await UIConfig.findById(configId);
    if (!config) {
      return errorResponse(res, 'Configuration not found', 404);
    }

    config.features = { ...config.features, ...features };
    config.lastModifiedBy = req.user._id;
    await config.save();

    return successResponse(
      res,
      'Feature flags updated successfully',
      config.features
    );
  }),

  // Get feature flags
  getFeatureFlags: catchAsync(async (req, res) => {
    const { appId = 'bachelor-mess-manager', environment = 'development' } =
      req.query;

    const config = await UIConfig.getActiveConfig(appId, environment);
    if (!config) {
      return errorResponse(res, 'Configuration not found', 404);
    }

    return successResponse(
      res,
      'Feature flags retrieved successfully',
      config.features
    );
  }),

  // Toggle specific feature
  toggleFeature: catchAsync(async (req, res) => {
    const { configId } = req.params;
    const { featurePath, enabled } = req.body;

    const config = await UIConfig.findById(configId);
    if (!config) {
      return errorResponse(res, 'Configuration not found', 404);
    }

    // Navigate to nested feature path
    const pathParts = featurePath.split('.');
    let current = config.features;

    for (let i = 0; i < pathParts.length - 1; i++) {
      if (!current[pathParts[i]]) {
        return errorResponse(res, 'Invalid feature path', 400);
      }
      current = current[pathParts[i]];
    }

    const lastPart = pathParts[pathParts.length - 1];
    if (!(lastPart in current)) {
      return errorResponse(res, 'Invalid feature path', 400);
    }

    current[lastPart] = enabled;
    config.lastModifiedBy = req.user._id;
    await config.save();

    return successResponse(res, 'Feature toggled successfully', {
      feature: featurePath,
      enabled,
    });
  }),

  // ==================== NAVIGATION MANAGEMENT ====================

  // Update navigation
  updateNavigation: catchAsync(async (req, res) => {
    const { configId } = req.params;
    const { navigation } = req.body;

    const config = await UIConfig.findById(configId);
    if (!config) {
      return errorResponse(res, 'Configuration not found', 404);
    }

    // Validate navigation tabs
    if (navigation.tabs) {
      const validationErrors = [];
      navigation.tabs.forEach((tab, index) => {
        if (!tab.id || !tab.title || !tab.route) {
          validationErrors.push(`Invalid tab at index ${index}`);
        }
      });

      if (validationErrors.length > 0) {
        return errorResponse(res, 'Invalid navigation configuration', 400, {
          validationErrors,
        });
      }
    }

    config.navigation = { ...config.navigation, ...navigation };
    config.lastModifiedBy = req.user._id;
    await config.save();

    return successResponse(
      res,
      'Navigation updated successfully',
      config.navigation
    );
  }),

  // Get navigation
  getNavigation: catchAsync(async (req, res) => {
    const { appId = 'bachelor-mess-manager', environment = 'development' } =
      req.query;

    const config = await UIConfig.getActiveConfig(appId, environment);
    if (!config) {
      return errorResponse(res, 'Configuration not found', 404);
    }

    return successResponse(
      res,
      'Navigation retrieved successfully',
      config.navigation
    );
  }),

  // ==================== COMPONENT CONFIGURATION ====================

  // Update component configuration
  updateComponents: catchAsync(async (req, res) => {
    const { configId } = req.params;
    const { components } = req.body;

    const config = await UIConfig.findById(configId);
    if (!config) {
      return errorResponse(res, 'Configuration not found', 404);
    }

    config.components = { ...config.components, ...components };
    config.lastModifiedBy = req.user._id;
    await config.save();

    return successResponse(
      res,
      'Component configuration updated successfully',
      config.components
    );
  }),

  // Get component configuration
  getComponents: catchAsync(async (req, res) => {
    const { appId = 'bachelor-mess-manager', environment = 'development' } =
      req.query;

    const config = await UIConfig.getActiveConfig(appId, environment);
    if (!config) {
      return errorResponse(res, 'Configuration not found', 404);
    }

    return successResponse(
      res,
      'Component configuration retrieved successfully',
      config.components
    );
  }),

  // ==================== CONTENT MANAGEMENT ====================

  // Update content
  updateContent: catchAsync(async (req, res) => {
    const { configId } = req.params;
    const { content } = req.body;

    const config = await UIConfig.findById(configId);
    if (!config) {
      return errorResponse(res, 'Configuration not found', 404);
    }

    config.content = { ...config.content, ...content };
    config.lastModifiedBy = req.user._id;
    await config.save();

    return successResponse(res, 'Content updated successfully', config.content);
  }),

  // Get content
  getContent: catchAsync(async (req, res) => {
    const { appId = 'bachelor-mess-manager', environment = 'development' } =
      req.query;

    const config = await UIConfig.getActiveConfig(appId, environment);
    if (!config) {
      return errorResponse(res, 'Configuration not found', 404);
    }

    return successResponse(
      res,
      'Content retrieved successfully',
      config.content
    );
  }),

  // ==================== SECURITY SETTINGS ====================

  // Update security settings
  updateSecurity: catchAsync(async (req, res) => {
    const { configId } = req.params;
    const { security } = req.body;

    const config = await UIConfig.findById(configId);
    if (!config) {
      return errorResponse(res, 'Configuration not found', 404);
    }

    config.security = { ...config.security, ...security };
    config.lastModifiedBy = req.user._id;
    await config.save();

    return successResponse(
      res,
      'Security settings updated successfully',
      config.security
    );
  }),

  // Get security settings
  getSecurity: catchAsync(async (req, res) => {
    const { appId = 'bachelor-mess-manager', environment = 'development' } =
      req.query;

    const config = await UIConfig.getActiveConfig(appId, environment);
    if (!config) {
      return errorResponse(res, 'Configuration not found', 404);
    }

    return successResponse(
      res,
      'Security settings retrieved successfully',
      config.security
    );
  }),

  // ==================== PERFORMANCE SETTINGS ====================

  // Update performance settings
  updatePerformance: catchAsync(async (req, res) => {
    const { configId } = req.params;
    const { performance } = req.body;

    const config = await UIConfig.findById(configId);
    if (!config) {
      return errorResponse(res, 'Configuration not found', 404);
    }

    config.performance = { ...config.performance, ...performance };
    config.lastModifiedBy = req.user._id;
    await config.save();

    return successResponse(
      res,
      'Performance settings updated successfully',
      config.performance
    );
  }),

  // Get performance settings
  getPerformance: catchAsync(async (req, res) => {
    const { appId = 'bachelor-mess-manager', environment = 'development' } =
      req.query;

    const config = await UIConfig.getActiveConfig(appId, environment);
    if (!config) {
      return errorResponse(res, 'Configuration not found', 404);
    }

    return successResponse(
      res,
      'Performance settings retrieved successfully',
      config.performance
    );
  }),

  // ==================== CONFIGURATION LISTING ====================

  // Get all configurations
  getAllConfigs: catchAsync(async (req, res) => {
    const { appId, environment, page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    let query = {};
    if (appId) query.appId = appId;
    if (environment) query.environment = environment;

    const [configs, total] = await Promise.all([
      UIConfig.find(query)
        .populate('createdBy', 'name email')
        .populate('lastModifiedBy', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      UIConfig.countDocuments(query),
    ]);

    return successResponse(res, 'Configurations retrieved successfully', {
      configs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  }),

  // Get configuration history
  getConfigHistory: catchAsync(async (req, res) => {
    const { configId } = req.params;

    const config = await UIConfig.findById(configId).populate(
      'changeHistory.changedBy',
      'name email'
    );
    if (!config) {
      return errorResponse(res, 'Configuration not found', 404);
    }

    return successResponse(
      res,
      'Configuration history retrieved successfully',
      {
        history: config.changeHistory,
        totalChanges: config.changeHistory.length,
      }
    );
  }),

  // ==================== VALIDATION ====================

  // Validate configuration
  validateConfig: catchAsync(async (req, res) => {
    const { configId } = req.params;

    const config = await UIConfig.findById(configId);
    if (!config) {
      return errorResponse(res, 'Configuration not found', 404);
    }

    const validationErrors = config.validateConfig();

    return successResponse(res, 'Configuration validation completed', {
      isValid: validationErrors.length === 0,
      errors: validationErrors,
      errorCount: validationErrors.length,
    });
  }),
};

module.exports = uiConfigController;
