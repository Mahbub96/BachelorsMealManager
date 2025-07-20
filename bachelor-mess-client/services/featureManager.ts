import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
// Import services directly to avoid circular dependency
import { notificationService } from './notificationService';
import { realtimeService } from './realtimeService';
import { backgroundSyncService } from './backgroundSyncService';
import { crashReportingService } from './crashReportingService';
import { analyticsTrackingService } from './analyticsTrackingService';

// Feature configuration interface
export interface FeatureConfig {
  authentication: boolean;
  mealManagement: boolean;
  bazarManagement: boolean;
  dashboard: boolean;
  analytics: boolean;
  offlineStorage: boolean;
  pushNotifications: boolean;
  hapticFeedback: boolean;
  imageUpload: boolean;
  filePicker: boolean;
  realTimeUpdates: boolean;
  backgroundSync: boolean;
  crashReporting: boolean;
  analyticsTracking: boolean;
}

// Feature status interface
export interface FeatureStatus {
  name: string;
  enabled: boolean;
  initialized: boolean;
  lastError?: string;
  lastInitialized?: Date;
}

// Feature manager interface
export interface FeatureManager {
  // Core functionality
  initialize: () => Promise<boolean>;
  initializeFeature: (featureName: keyof FeatureConfig) => Promise<boolean>;
  getFeatureStatus: (featureName: keyof FeatureConfig) => FeatureStatus;
  getAllFeatureStatus: () => FeatureStatus[];

  // Configuration management
  getConfig: () => Promise<FeatureConfig>;
  updateConfig: (config: Partial<FeatureConfig>) => Promise<boolean>;
  resetConfig: () => Promise<boolean>;

  // Feature control
  enableFeature: (featureName: keyof FeatureConfig) => Promise<boolean>;
  disableFeature: (featureName: keyof FeatureConfig) => Promise<boolean>;
  isFeatureEnabled: (featureName: keyof FeatureConfig) => boolean;

  // Utility methods
  getEnabledFeatures: () => string[];
  getDisabledFeatures: () => string[];
  validateConfig: (config: FeatureConfig) => boolean;
  exportConfig: () => Promise<string>;
  importConfig: (configString: string) => Promise<boolean>;
}

// Feature manager implementation
class FeatureManagerImpl implements FeatureManager {
  private config: FeatureConfig = {
    authentication: true,
    mealManagement: true,
    bazarManagement: true,
    dashboard: true,
    analytics: true,
    offlineStorage: true,
    pushNotifications: false,
    hapticFeedback: true,
    imageUpload: true,
    filePicker: true,
    realTimeUpdates: false,
    backgroundSync: false,
    crashReporting: false,
    analyticsTracking: false,
  };

  private featureStatus: Map<keyof FeatureConfig, FeatureStatus> = new Map();
  private readonly STORAGE_KEY = 'feature_config';
  private isInitialized = false;

  async initialize(): Promise<boolean> {
    try {
      console.log('🔧 Initializing feature manager...');

      // Load configuration
      await this.loadConfig();

      // Initialize enabled features
      const enabledFeatures = this.getEnabledFeatures();
      console.log(
        `🚀 Initializing ${enabledFeatures.length} enabled features...`
      );

      for (const featureName of enabledFeatures) {
        await this.initializeFeature(featureName as keyof FeatureConfig);
      }

      this.isInitialized = true;
      console.log('✅ Feature manager initialized successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize feature manager:', error);
      return false;
    }
  }

  async initializeFeature(featureName: keyof FeatureConfig): Promise<boolean> {
    try {
      if (!this.config[featureName]) {
        console.log(
          `⚠️ Feature ${featureName} is disabled, skipping initialization`
        );
        return false;
      }

      console.log(`🔧 Initializing feature: ${featureName}`);

      let success = false;
      let error: string | undefined;

      switch (featureName) {
        case 'pushNotifications':
          success = await notificationService.initialize();
          break;

        case 'realTimeUpdates':
          success = await realtimeService.connect();
          break;

        case 'backgroundSync':
          success = await backgroundSyncService.startSync();
          break;

        case 'crashReporting':
          success = await crashReportingService.initialize();
          break;

        case 'analyticsTracking':
          success = await analyticsTrackingService.initialize();
          break;

        default:
          console.log(
            `ℹ️ Feature ${featureName} doesn't require initialization`
          );
          success = true;
          break;
      }

      // Update feature status
      this.updateFeatureStatus(featureName, {
        name: featureName,
        enabled: this.config[featureName],
        initialized: success,
        lastError: error,
        lastInitialized: success ? new Date() : undefined,
      });

      if (success) {
        console.log(`✅ Feature ${featureName} initialized successfully`);
      } else {
        console.log(`❌ Feature ${featureName} initialization failed`);
      }

      return success;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error(
        `❌ Error initializing feature ${featureName}:`,
        errorMessage
      );

      this.updateFeatureStatus(featureName, {
        name: featureName,
        enabled: this.config[featureName],
        initialized: false,
        lastError: errorMessage,
      });

      return false;
    }
  }

  getFeatureStatus(featureName: keyof FeatureConfig): FeatureStatus {
    return (
      this.featureStatus.get(featureName) || {
        name: featureName,
        enabled: this.config[featureName],
        initialized: false,
      }
    );
  }

  getAllFeatureStatus(): FeatureStatus[] {
    return Object.keys(this.config).map(key =>
      this.getFeatureStatus(key as keyof FeatureConfig)
    );
  }

  async getConfig(): Promise<FeatureConfig> {
    return { ...this.config };
  }

  async updateConfig(newConfig: Partial<FeatureConfig>): Promise<boolean> {
    try {
      console.log('🔧 Updating feature configuration...');

      // Validate new configuration
      const updatedConfig = { ...this.config, ...newConfig };
      if (!this.validateConfig(updatedConfig)) {
        console.log('❌ Invalid configuration');
        return false;
      }

      // Update configuration
      this.config = updatedConfig;

      // Save to storage
      await this.saveConfig();

      // Re-initialize features if needed
      if (this.isInitialized) {
        await this.handleConfigChange(newConfig);
      }

      console.log('✅ Feature configuration updated');
      return true;
    } catch (error) {
      console.error('❌ Error updating configuration:', error);
      return false;
    }
  }

  async resetConfig(): Promise<boolean> {
    try {
      console.log('🔄 Resetting feature configuration...');

      // Reset to default configuration
      this.config = {
        authentication: true,
        mealManagement: true,
        bazarManagement: true,
        dashboard: true,
        analytics: true,
        offlineStorage: true,
        pushNotifications: false,
        hapticFeedback: true,
        imageUpload: true,
        filePicker: true,
        realTimeUpdates: false,
        backgroundSync: false,
        crashReporting: false,
        analyticsTracking: false,
      };

      // Clear feature status
      this.featureStatus.clear();

      // Save to storage
      await this.saveConfig();

      console.log('✅ Feature configuration reset');
      return true;
    } catch (error) {
      console.error('❌ Error resetting configuration:', error);
      return false;
    }
  }

  async enableFeature(featureName: keyof FeatureConfig): Promise<boolean> {
    try {
      console.log(`🔧 Enabling feature: ${featureName}`);

      this.config[featureName] = true;
      await this.saveConfig();

      // Initialize the feature if manager is already initialized
      if (this.isInitialized) {
        await this.initializeFeature(featureName);
      }

      console.log(`✅ Feature ${featureName} enabled`);
      return true;
    } catch (error) {
      console.error(`❌ Error enabling feature ${featureName}:`, error);
      return false;
    }
  }

  async disableFeature(featureName: keyof FeatureConfig): Promise<boolean> {
    try {
      console.log(`🔧 Disabling feature: ${featureName}`);

      this.config[featureName] = false;
      await this.saveConfig();

      // Clean up the feature if manager is already initialized
      if (this.isInitialized) {
        await this.cleanupFeature(featureName);
      }

      console.log(`✅ Feature ${featureName} disabled`);
      return true;
    } catch (error) {
      console.error(`❌ Error disabling feature ${featureName}:`, error);
      return false;
    }
  }

  isFeatureEnabled(featureName: keyof FeatureConfig): boolean {
    return this.config[featureName];
  }

  getEnabledFeatures(): string[] {
    return Object.entries(this.config)
      .filter(([_, enabled]) => enabled)
      .map(([feature]) => feature);
  }

  getDisabledFeatures(): string[] {
    return Object.entries(this.config)
      .filter(([_, enabled]) => !enabled)
      .map(([feature]) => feature);
  }

  validateConfig(config: FeatureConfig): boolean {
    // Basic validation - ensure required features are enabled
    const requiredFeatures: (keyof FeatureConfig)[] = [
      'authentication',
      'mealManagement',
      'bazarManagement',
      'dashboard',
    ];

    for (const feature of requiredFeatures) {
      if (!config[feature]) {
        console.log(`❌ Required feature ${feature} is disabled`);
        return false;
      }
    }

    return true;
  }

  async exportConfig(): Promise<string> {
    try {
      return JSON.stringify(this.config, null, 2);
    } catch (error) {
      console.error('❌ Error exporting configuration:', error);
      return '';
    }
  }

  async importConfig(configString: string): Promise<boolean> {
    try {
      const importedConfig = JSON.parse(configString);

      if (!this.validateConfig(importedConfig)) {
        console.log('❌ Invalid imported configuration');
        return false;
      }

      this.config = importedConfig;
      await this.saveConfig();

      console.log('✅ Configuration imported successfully');
      return true;
    } catch (error) {
      console.error('❌ Error importing configuration:', error);
      return false;
    }
  }

  private async loadConfig(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const loadedConfig = JSON.parse(stored);
        if (this.validateConfig(loadedConfig)) {
          this.config = loadedConfig;
          console.log('📋 Feature configuration loaded from storage');
        }
      }
    } catch (error) {
      console.error('❌ Error loading configuration:', error);
    }
  }

  private async saveConfig(): Promise<void> {
    try {
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.config));
    } catch (error) {
      console.error('❌ Error saving configuration:', error);
    }
  }

  private updateFeatureStatus(
    featureName: keyof FeatureConfig,
    status: FeatureStatus
  ): void {
    this.featureStatus.set(featureName, status);
  }

  private async handleConfigChange(
    changedConfig: Partial<FeatureConfig>
  ): Promise<void> {
    for (const [featureName, enabled] of Object.entries(changedConfig)) {
      const key = featureName as keyof FeatureConfig;

      if (enabled) {
        await this.initializeFeature(key);
      } else {
        await this.cleanupFeature(key);
      }
    }
  }

  private async cleanupFeature(
    featureName: keyof FeatureConfig
  ): Promise<void> {
    try {
      console.log(`🧹 Cleaning up feature: ${featureName}`);

      switch (featureName) {
        case 'realTimeUpdates':
          await realtimeService.disconnect();
          break;

        case 'backgroundSync':
          await backgroundSyncService.stopSync();
          break;

        case 'pushNotifications':
          await notificationService.cancelAllNotifications();
          break;

        case 'analyticsTracking':
          await analyticsTrackingService.endSession();
          break;

        default:
          console.log(`ℹ️ Feature ${featureName} doesn't require cleanup`);
          break;
      }

      // Update feature status
      this.updateFeatureStatus(featureName, {
        name: featureName,
        enabled: false,
        initialized: false,
        lastInitialized: undefined,
      });

      console.log(`✅ Feature ${featureName} cleaned up`);
    } catch (error) {
      console.error(`❌ Error cleaning up feature ${featureName}:`, error);
    }
  }
}

// Export singleton instance
export const featureManager = new FeatureManagerImpl();
