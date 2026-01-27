import httpClient from './httpClient';
import { cacheManager } from './cacheManager';
import { ApiResponse } from './config';

// Types for UI Configuration
export interface Theme {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  textColor: string;
  borderRadius: number;
  shadow: string;
}

export interface NavigationTab {
  id: string;
  title: string;
  icon: string;
  route: string;
  isVisible: boolean;
  isEnabled: boolean;
  order: number;
  permissions: string[];
}

export interface Navigation {
  tabs: NavigationTab[];
  showTabBar: boolean;
  tabBarStyle: {
    backgroundColor: string;
    borderTopColor: string;
  };
}

export interface FeatureFlags {
  authentication: {
    enabled: boolean;
    allowRegistration: boolean;
    allowPasswordReset: boolean;
    requireEmailVerification: boolean;
  };
  mealManagement: {
    enabled: boolean;
    allowCreate: boolean;
    allowEdit: boolean;
    allowDelete: boolean;
    requireApproval: boolean;
  };
  bazarManagement: {
    enabled: boolean;
    allowCreate: boolean;
    allowEdit: boolean;
    allowDelete: boolean;
    requireApproval: boolean;
  };
  dashboard: {
    enabled: boolean;
    showAnalytics: boolean;
    showRecentActivity: boolean;
    showQuickActions: boolean;
  };
  notifications: {
    enabled: boolean;
    pushNotifications: boolean;
    emailNotifications: boolean;
    inAppNotifications: boolean;
  };
  realTimeUpdates: {
    enabled: boolean;
    pollingInterval: number;
  };
  backgroundSync: {
    enabled: boolean;
    syncInterval: number;
  };
  crashReporting: {
    enabled: boolean;
    collectUserData: boolean;
  };
  analyticsTracking: {
    enabled: boolean;
    trackUserBehavior: boolean;
    trackPerformance: boolean;
  };
}

export interface Components {
  header: {
    showLogo: boolean;
    logoUrl: string;
    showTitle: boolean;
    title: string;
    showUserMenu: boolean;
    showNotifications: boolean;
  };
  forms: {
    showValidationMessages: boolean;
    autoSave: boolean;
    showProgressIndicator: boolean;
  };
  lists: {
    itemsPerPage: number;
    showPagination: boolean;
    showSearch: boolean;
    showFilters: boolean;
  };
  cards: {
    showShadows: boolean;
    showBorders: boolean;
    borderRadius: number;
  };
}

export interface Content {
  appName: string;
  appDescription: string;
  welcomeMessage: string;
  loadingMessage: string;
  errorMessages: {
    networkError: string;
    serverError: string;
    validationError: string;
    unauthorizedError: string;
  };
  successMessages: {
    dataSaved: string;
    dataDeleted: string;
    actionCompleted: string;
  };
}

export interface Security {
  requireAuthentication: boolean;
  sessionTimeout: number;
  maxLoginAttempts: number;
  passwordPolicy: {
    minLength: number;
    requireUppercase: boolean;
    requireLowercase: boolean;
    requireNumbers: boolean;
    requireSpecialChars: boolean;
  };
}

export interface Performance {
  cacheEnabled: boolean;
  cacheDuration: number;
  imageOptimization: boolean;
  lazyLoading: boolean;
  compression: boolean;
}

export interface UIConfig {
  _id: string;
  appId: string;
  version: string;
  environment: string;
  isActive: boolean;
  theme: Theme;
  navigation: Navigation;
  features: FeatureFlags;
  components: Components;
  content: Content;
  security: Security;
  performance: Performance;
  createdBy: string;
  lastModifiedBy: string;
  createdAt: string;
  updatedAt: string;
}

// UI Configuration Service
class UIConfigService {
  private cacheKey = 'ui_config';
  private cacheDuration = 5 * 60 * 1000; // 5 minutes
  private config: UIConfig | null = null;
  private listeners: ((config: UIConfig) => void)[] = [];

  // Get active UI configuration
  async getActiveConfig(
    appId: string = 'bachelor-flat-manager',
    environment: string = 'development'
  ): Promise<UIConfig> {
    try {
      // Check cache first
      const cached = cacheManager.get(this.cacheKey);
      if (cached && Date.now() - cached.timestamp < this.cacheDuration) {
        this.config = cached.data as UIConfig;
        return this.config;
      }

      // Fetch from API
      const response = await httpClient.get(
        `/api/ui-config/active?appId=${appId}&environment=${environment}`
      );

      if (response.success) {
        this.config = response.data as UIConfig;

        // Cache the configuration
        cacheManager.set(this.cacheKey, {
          data: this.config,
          timestamp: Date.now(),
        });

        // Notify listeners
        if (this.config) {
          this.notifyListeners(this.config);
        }

        return this.config;
      } else {
        throw new Error(response.error || 'Failed to fetch UI configuration');
      }
    } catch (error) {
      console.error('Error fetching UI configuration:', error);
      throw error;
    }
  }

  // Get theme
  async getTheme(): Promise<Theme> {
    const config = await this.getActiveConfig();
    return config.theme;
  }

  // Get navigation
  async getNavigation(): Promise<Navigation> {
    const config = await this.getActiveConfig();
    return config.navigation;
  }

  // Get feature flags
  async getFeatureFlags(): Promise<FeatureFlags> {
    const config = await this.getActiveConfig();
    return config.features;
  }

  // Check if feature is enabled
  async isFeatureEnabled(featurePath: string): Promise<boolean> {
    const features = await this.getFeatureFlags();
    const pathParts = featurePath.split('.');
    let current: any = features;

    for (const part of pathParts) {
      if (current && typeof current === 'object' && part in current) {
        current = current[part];
      } else {
        return false;
      }
    }

    return Boolean(current);
  }

  // Get components configuration
  async getComponents(): Promise<Components> {
    const config = await this.getActiveConfig();
    return config.components;
  }

  // Get content
  async getContent(): Promise<Content> {
    const config = await this.getActiveConfig();
    return config.content;
  }

  // Get security settings
  async getSecurity(): Promise<Security> {
    const config = await this.getActiveConfig();
    return config.security;
  }

  // Get performance settings
  async getPerformance(): Promise<Performance> {
    const config = await this.getActiveConfig();
    return config.performance;
  }

  // Get visible navigation tabs for user role
  async getVisibleTabs(userRole: string): Promise<NavigationTab[]> {
    const navigation = await this.getNavigation();
    return navigation.tabs
      .filter(tab => tab.isVisible && tab.isEnabled)
      .filter(
        tab => !tab.permissions.length || tab.permissions.includes(userRole)
      )
      .sort((a, b) => a.order - b.order);
  }

  // Get app branding
  async getAppBranding(): Promise<{
    name: string;
    description: string;
    logoUrl: string;
  }> {
    const [content, components] = await Promise.all([
      this.getContent(),
      this.getComponents(),
    ]);

    return {
      name: content.appName,
      description: content.appDescription,
      logoUrl: components.header.logoUrl,
    };
  }

  // Get error message by type
  async getErrorMessage(type: keyof Content['errorMessages']): Promise<string> {
    const content = await this.getContent();
    return content.errorMessages[type];
  }

  // Get success message by type
  async getSuccessMessage(
    type: keyof Content['successMessages']
  ): Promise<string> {
    const content = await this.getContent();
    return content.successMessages[type];
  }

  // Get form configuration
  async getFormConfig(): Promise<Components['forms']> {
    const components = await this.getComponents();
    return components.forms;
  }

  // Get list configuration
  async getListConfig(): Promise<Components['lists']> {
    const components = await this.getComponents();
    return components.lists;
  }

  // Get card configuration
  async getCardConfig(): Promise<Components['cards']> {
    const components = await this.getComponents();
    return components.cards;
  }

  // Clear cache
  clearCache(): void {
    cacheManager.remove(this.cacheKey);
    this.config = null;
  }

  // Refresh configuration
  async refreshConfig(): Promise<UIConfig> {
    this.clearCache();
    return await this.getActiveConfig();
  }

  // Add configuration change listener
  addListener(listener: (config: UIConfig) => void): () => void {
    this.listeners.push(listener);

    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  // Notify listeners
  private notifyListeners(config: UIConfig): void {
    this.listeners.forEach(listener => {
      try {
        listener(config);
      } catch (error) {
        console.error('Error in UI config listener:', error);
      }
    });
  }

  // Get current configuration (cached)
  getCurrentConfig(): UIConfig | null {
    return this.config;
  }

  // Check if configuration is loaded
  isConfigLoaded(): boolean {
    return this.config !== null;
  }

  // Get configuration version
  getConfigVersion(): string | null {
    return this.config?.version || null;
  }

  // Get configuration environment
  getConfigEnvironment(): string | null {
    return this.config?.environment || null;
  }

  // Check if configuration is active
  isConfigActive(): boolean {
    return this.config?.isActive || false;
  }

  // Get configuration metadata
  getConfigMetadata(): {
    version: string;
    environment: string;
    isActive: boolean;
  } | null {
    if (!this.config) return null;

    return {
      version: this.config.version,
      environment: this.config.environment,
      isActive: this.config.isActive,
    };
  }

  // Validate configuration
  validateConfig(): boolean {
    if (!this.config) return false;

    // Basic validation
    const requiredFields = [
      'theme',
      'navigation',
      'features',
      'components',
      'content',
    ];
    return requiredFields.every(field => this.config && field in this.config);
  }

  // Get configuration summary
  getConfigSummary(): {
    version: string;
    environment: string;
    activeFeatures: number;
    totalTabs: number;
    visibleTabs: number;
  } | null {
    if (!this.config) return null;

    const activeFeatures = Object.values(this.config.features).filter(
      feature => typeof feature === 'object' && feature.enabled
    ).length;

    const totalTabs = this.config.navigation.tabs.length;
    const visibleTabs = this.config.navigation.tabs.filter(
      tab => tab.isVisible
    ).length;

    return {
      version: this.config.version,
      environment: this.config.environment,
      activeFeatures,
      totalTabs,
      visibleTabs,
    };
  }

  // Save/Update UI configuration to backend
  async saveConfig(configData: Partial<UIConfig>): Promise<ApiResponse<UIConfig>> {
    try {
      const response = await httpClient.post<UIConfig>(
        '/api/ui-config',
        configData
      );

      if (response.success && response.data) {
        // Update local cache
        this.config = response.data;
        cacheManager.set(this.cacheKey, {
          data: this.config,
          timestamp: Date.now(),
        });

        // Notify listeners
        this.notifyListeners(this.config);
      }

      return response;
    } catch (error) {
      console.error('Error saving UI configuration:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to save UI configuration',
      };
    }
  }

  // Update existing UI configuration
  async updateConfig(
    configId: string,
    configData: Partial<UIConfig>
  ): Promise<ApiResponse<UIConfig>> {
    try {
      const response = await httpClient.put<UIConfig>(
        `/api/ui-config/${configId}`,
        configData
      );

      if (response.success && response.data) {
        // Update local cache if this is the active config
        if (this.config?._id === configId) {
          this.config = response.data;
          cacheManager.set(this.cacheKey, {
            data: this.config,
            timestamp: Date.now(),
          });

          // Notify listeners
          this.notifyListeners(this.config);
        }
      }

      return response;
    } catch (error) {
      console.error('Error updating UI configuration:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update UI configuration',
      };
    }
  }

  // Delete UI configuration
  async deleteConfig(configId: string): Promise<ApiResponse<{ success: boolean }>> {
    try {
      const response = await httpClient.delete<{ success: boolean }>(
        `/api/ui-config/${configId}`
      );

      // Clear cache if deleted config was the active one
      if (this.config?._id === configId) {
        this.clearCache();
      }

      return response;
    } catch (error) {
      console.error('Error deleting UI configuration:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete UI configuration',
      };
    }
  }

  // Get all UI configurations (for admin)
  async getAllConfigs(
    appId?: string,
    environment?: string
  ): Promise<ApiResponse<UIConfig[]>> {
    try {
      const params = new URLSearchParams();
      if (appId) params.append('appId', appId);
      if (environment) params.append('environment', environment);

      const queryString = params.toString();
      const endpoint = `/api/ui-config${queryString ? `?${queryString}` : ''}`;

      return await httpClient.get<UIConfig[]>(endpoint);
    } catch (error) {
      console.error('Error fetching all UI configurations:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch UI configurations',
      };
    }
  }
}

// Export singleton instance
export const uiConfigService = new UIConfigService();
export default uiConfigService;
