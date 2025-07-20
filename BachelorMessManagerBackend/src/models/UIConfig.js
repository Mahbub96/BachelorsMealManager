const mongoose = require('mongoose');

const uiConfigSchema = new mongoose.Schema(
  {
    // Core configuration
    appId: {
      type: String,
      required: [true, 'App ID is required'],
      unique: true,
      default: 'bachelor-mess-manager',
    },
    version: {
      type: String,
      required: [true, 'Version is required'],
      default: '1.0.0',
    },
    environment: {
      type: String,
      enum: ['development', 'staging', 'production'],
      default: 'development',
    },
    isActive: {
      type: Boolean,
      default: true,
    },

    // Theme and styling
    theme: {
      primaryColor: {
        type: String,
        default: '#667eea',
        validate: {
          validator: function (v) {
            return /^#[0-9A-F]{6}$/i.test(v);
          },
          message: 'Primary color must be a valid hex color',
        },
      },
      secondaryColor: {
        type: String,
        default: '#f3f4f6',
        validate: {
          validator: function (v) {
            return /^#[0-9A-F]{6}$/i.test(v);
          },
          message: 'Secondary color must be a valid hex color',
        },
      },
      accentColor: {
        type: String,
        default: '#10b981',
        validate: {
          validator: function (v) {
            return /^#[0-9A-F]{6}$/i.test(v);
          },
          message: 'Accent color must be a valid hex color',
        },
      },
      backgroundColor: {
        type: String,
        default: '#ffffff',
        validate: {
          validator: function (v) {
            return /^#[0-9A-F]{6}$/i.test(v);
          },
          message: 'Background color must be a valid hex color',
        },
      },
      textColor: {
        type: String,
        default: '#1f2937',
        validate: {
          validator: function (v) {
            return /^#[0-9A-F]{6}$/i.test(v);
          },
          message: 'Text color must be a valid hex color',
        },
      },
      borderRadius: {
        type: Number,
        default: 12,
        min: [0, 'Border radius cannot be negative'],
        max: [50, 'Border radius cannot exceed 50'],
      },
      shadow: {
        type: String,
        default: '0 2px 4px rgba(0, 0, 0, 0.1)',
      },
    },

    // Navigation configuration
    navigation: {
      tabs: [
        {
          id: {
            type: String,
            required: true,
          },
          title: {
            type: String,
            required: true,
          },
          icon: {
            type: String,
            required: true,
          },
          route: {
            type: String,
            required: true,
          },
          isVisible: {
            type: Boolean,
            default: true,
          },
          isEnabled: {
            type: Boolean,
            default: true,
          },
          order: {
            type: Number,
            default: 0,
          },
          permissions: [
            {
              type: String,
              enum: ['admin', 'member', 'super_admin'],
            },
          ],
        },
      ],
      showTabBar: {
        type: Boolean,
        default: true,
      },
      tabBarStyle: {
        backgroundColor: {
          type: String,
          default: '#ffffff',
        },
        borderTopColor: {
          type: String,
          default: '#e5e7eb',
        },
      },
    },

    // Feature flags
    features: {
      authentication: {
        enabled: {
          type: Boolean,
          default: true,
        },
        allowRegistration: {
          type: Boolean,
          default: true,
        },
        allowPasswordReset: {
          type: Boolean,
          default: true,
        },
        requireEmailVerification: {
          type: Boolean,
          default: false,
        },
      },
      mealManagement: {
        enabled: {
          type: Boolean,
          default: true,
        },
        allowCreate: {
          type: Boolean,
          default: true,
        },
        allowEdit: {
          type: Boolean,
          default: true,
        },
        allowDelete: {
          type: Boolean,
          default: false,
        },
        requireApproval: {
          type: Boolean,
          default: true,
        },
      },
      bazarManagement: {
        enabled: {
          type: Boolean,
          default: true,
        },
        allowCreate: {
          type: Boolean,
          default: true,
        },
        allowEdit: {
          type: Boolean,
          default: true,
        },
        allowDelete: {
          type: Boolean,
          default: false,
        },
        requireApproval: {
          type: Boolean,
          default: true,
        },
      },
      dashboard: {
        enabled: {
          type: Boolean,
          default: true,
        },
        showAnalytics: {
          type: Boolean,
          default: true,
        },
        showRecentActivity: {
          type: Boolean,
          default: true,
        },
        showQuickActions: {
          type: Boolean,
          default: true,
        },
      },
      notifications: {
        enabled: {
          type: Boolean,
          default: true,
        },
        pushNotifications: {
          type: Boolean,
          default: false,
        },
        emailNotifications: {
          type: Boolean,
          default: true,
        },
        inAppNotifications: {
          type: Boolean,
          default: true,
        },
      },
      realTimeUpdates: {
        enabled: {
          type: Boolean,
          default: false,
        },
        pollingInterval: {
          type: Number,
          default: 30000,
          min: [5000, 'Polling interval cannot be less than 5 seconds'],
        },
      },
      backgroundSync: {
        enabled: {
          type: Boolean,
          default: false,
        },
        syncInterval: {
          type: Number,
          default: 300000,
          min: [60000, 'Sync interval cannot be less than 1 minute'],
        },
      },
      crashReporting: {
        enabled: {
          type: Boolean,
          default: false,
        },
        collectUserData: {
          type: Boolean,
          default: false,
        },
      },
      analyticsTracking: {
        enabled: {
          type: Boolean,
          default: false,
        },
        trackUserBehavior: {
          type: Boolean,
          default: false,
        },
        trackPerformance: {
          type: Boolean,
          default: false,
        },
      },
    },

    // Component configurations
    components: {
      header: {
        showLogo: {
          type: Boolean,
          default: true,
        },
        logoUrl: {
          type: String,
          default: '/assets/logo.png',
        },
        showTitle: {
          type: Boolean,
          default: true,
        },
        title: {
          type: String,
          default: 'Bachelor Mess Manager',
        },
        showUserMenu: {
          type: Boolean,
          default: true,
        },
        showNotifications: {
          type: Boolean,
          default: true,
        },
      },
      forms: {
        showValidationMessages: {
          type: Boolean,
          default: true,
        },
        autoSave: {
          type: Boolean,
          default: false,
        },
        showProgressIndicator: {
          type: Boolean,
          default: true,
        },
      },
      lists: {
        itemsPerPage: {
          type: Number,
          default: 20,
          min: [5, 'Items per page cannot be less than 5'],
          max: [100, 'Items per page cannot exceed 100'],
        },
        showPagination: {
          type: Boolean,
          default: true,
        },
        showSearch: {
          type: Boolean,
          default: true,
        },
        showFilters: {
          type: Boolean,
          default: true,
        },
      },
      cards: {
        showShadows: {
          type: Boolean,
          default: true,
        },
        showBorders: {
          type: Boolean,
          default: true,
        },
        borderRadius: {
          type: Number,
          default: 12,
        },
      },
    },

    // Content and messaging
    content: {
      appName: {
        type: String,
        default: 'Bachelor Mess Manager',
      },
      appDescription: {
        type: String,
        default: 'Manage your mess expenses and meals efficiently',
      },
      welcomeMessage: {
        type: String,
        default: 'Welcome to Bachelor Mess Manager',
      },
      loadingMessage: {
        type: String,
        default: 'Loading...',
      },
      errorMessages: {
        networkError: {
          type: String,
          default: 'Network error. Please check your connection.',
        },
        serverError: {
          type: String,
          default: 'Server error. Please try again later.',
        },
        validationError: {
          type: String,
          default: 'Please check your input and try again.',
        },
        unauthorizedError: {
          type: String,
          default: 'You are not authorized to perform this action.',
        },
      },
      successMessages: {
        dataSaved: {
          type: String,
          default: 'Data saved successfully.',
        },
        dataDeleted: {
          type: String,
          default: 'Data deleted successfully.',
        },
        actionCompleted: {
          type: String,
          default: 'Action completed successfully.',
        },
      },
    },

    // Security settings
    security: {
      requireAuthentication: {
        type: Boolean,
        default: true,
      },
      sessionTimeout: {
        type: Number,
        default: 3600000, // 1 hour in milliseconds
        min: [300000, 'Session timeout cannot be less than 5 minutes'],
      },
      maxLoginAttempts: {
        type: Number,
        default: 5,
        min: [1, 'Max login attempts cannot be less than 1'],
        max: [10, 'Max login attempts cannot exceed 10'],
      },
      passwordPolicy: {
        minLength: {
          type: Number,
          default: 6,
          min: [4, 'Minimum password length cannot be less than 4'],
        },
        requireUppercase: {
          type: Boolean,
          default: false,
        },
        requireLowercase: {
          type: Boolean,
          default: true,
        },
        requireNumbers: {
          type: Boolean,
          default: true,
        },
        requireSpecialChars: {
          type: Boolean,
          default: false,
        },
      },
    },

    // Performance settings
    performance: {
      cacheEnabled: {
        type: Boolean,
        default: true,
      },
      cacheDuration: {
        type: Number,
        default: 300000, // 5 minutes in milliseconds
      },
      imageOptimization: {
        type: Boolean,
        default: true,
      },
      lazyLoading: {
        type: Boolean,
        default: true,
      },
      compression: {
        type: Boolean,
        default: true,
      },
    },

    // Metadata
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    lastModifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    changeHistory: [
      {
        field: {
          type: String,
          required: true,
        },
        oldValue: mongoose.Schema.Types.Mixed,
        newValue: mongoose.Schema.Types.Mixed,
        changedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        changedAt: {
          type: Date,
          default: Date.now,
        },
        reason: String,
      },
    ],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for better query performance
uiConfigSchema.index({ appId: 1, environment: 1 });
uiConfigSchema.index({ isActive: 1 });
uiConfigSchema.index({ createdAt: -1 });

// Virtual for formatted version
uiConfigSchema.virtual('formattedVersion').get(function () {
  return `v${this.version}`;
});

// Virtual for active features count
uiConfigSchema.virtual('activeFeaturesCount').get(function () {
  const features = this.features;
  let count = 0;

  Object.keys(features).forEach(key => {
    if (features[key].enabled) {
      count++;
    }
  });

  return count;
});

// Pre-save middleware to track changes
uiConfigSchema.pre('save', function (next) {
  if (this.isModified()) {
    // Track changes for audit
    const changes = this.modifiedPaths();
    changes.forEach(field => {
      if (field !== 'changeHistory' && field !== 'lastModifiedBy') {
        this.changeHistory.push({
          field,
          oldValue: this._original ? this._original[field] : undefined,
          newValue: this[field],
          changedBy: this.lastModifiedBy,
          changedAt: new Date(),
        });
      }
    });
  }
  next();
});

// Static method to get active configuration
uiConfigSchema.statics.getActiveConfig = function (
  appId = 'bachelor-mess-manager',
  environment = 'development'
) {
  return this.findOne({
    appId,
    environment,
    isActive: true,
  }).sort({ createdAt: -1 });
};

// Static method to get configuration by version
uiConfigSchema.statics.getConfigByVersion = function (appId, version) {
  return this.findOne({
    appId,
    version,
    isActive: true,
  });
};

// Static method to create default configuration
uiConfigSchema.statics.createDefaultConfig = function (createdBy) {
  return this.create({
    createdBy,
    lastModifiedBy: createdBy,
  });
};

// Instance method to clone configuration
uiConfigSchema.methods.clone = function (newCreatedBy) {
  const cloned = this.toObject();
  delete cloned._id;
  delete cloned.createdAt;
  delete cloned.updatedAt;
  delete cloned.changeHistory;

  cloned.createdBy = newCreatedBy;
  cloned.lastModifiedBy = newCreatedBy;
  cloned.version = `${this.version}-clone`;

  return this.constructor.create(cloned);
};

// Instance method to validate configuration
uiConfigSchema.methods.validateConfig = function () {
  const errors = [];

  // Validate theme colors
  const colorFields = [
    'primaryColor',
    'secondaryColor',
    'accentColor',
    'backgroundColor',
    'textColor',
  ];
  colorFields.forEach(field => {
    if (this.theme[field] && !/^#[0-9A-F]{6}$/i.test(this.theme[field])) {
      errors.push(`Invalid ${field}: ${this.theme[field]}`);
    }
  });

  // Validate navigation tabs
  if (this.navigation.tabs) {
    this.navigation.tabs.forEach((tab, index) => {
      if (!tab.id || !tab.title || !tab.route) {
        errors.push(`Invalid tab at index ${index}`);
      }
    });
  }

  return errors;
};

module.exports = mongoose.model('UIConfig', uiConfigSchema);
