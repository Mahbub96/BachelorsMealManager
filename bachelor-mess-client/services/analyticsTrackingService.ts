import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { API_ENDPOINTS, ApiResponse } from './config';
import httpClient from './httpClient';

// Device and app info types
export interface DeviceInfo {
  platform: string;
  version: string;
  model: string;
  manufacturer: string;
  memory: number;
  storage: number;
  batteryLevel?: number;
  isOnline: boolean;
  networkType?: string;
}

export interface AppInfo {
  version: string;
  buildNumber: string;
  bundleId: string;
  environment: string;
  timestamp: Date;
}

// Analytics tracking types
export interface AnalyticsEvent {
  id: string;
  name: string;
  category: string;
  action: string;
  label?: string;
  value?: number;
  properties: Record<string, any>;
  timestamp: Date;
  userId?: string;
  sessionId: string;
  deviceInfo: DeviceInfo;
  appInfo: AppInfo;
}

export interface UserProperties {
  userId: string;
  name?: string;
  email?: string;
  role?: string;
  joinDate?: Date;
  lastLogin?: Date;
  preferences?: Record<string, any>;
}

export interface SessionInfo {
  id: string;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  events: number;
  userId?: string;
}

export interface AnalyticsTrackingService {
  // Core functionality
  initialize: () => Promise<boolean>;
  trackEvent: (
    event: Omit<
      AnalyticsEvent,
      'id' | 'timestamp' | 'sessionId' | 'deviceInfo' | 'appInfo'
    >
  ) => Promise<string>;
  trackScreen: (
    screenName: string,
    properties?: Record<string, any>
  ) => Promise<string>;
  trackUserAction: (
    action: string,
    properties?: Record<string, any>
  ) => Promise<string>;
  trackError: (
    error: Error,
    properties?: Record<string, any>
  ) => Promise<string>;

  // User tracking
  identifyUser: (properties: UserProperties) => Promise<void>;
  setUserProperty: (key: string, value: any) => Promise<void>;
  clearUserData: () => Promise<void>;

  // Session management
  startSession: () => Promise<string>;
  endSession: () => Promise<void>;
  getCurrentSession: () => SessionInfo | null;

  // Data management
  getEvents: (limit?: number) => Promise<AnalyticsEvent[]>;
  clearEvents: () => Promise<void>;
  uploadEvents: () => Promise<boolean>;

  // Utility methods
  isEnabled: () => boolean;
  setEnabled: (enabled: boolean) => Promise<void>;
  getDeviceInfo: () => DeviceInfo;
  getAppInfo: () => AppInfo;
  addEventProperty: (key: string, value: any) => void;
  removeEventProperty: (key: string) => void;
}

// Analytics tracking service implementation
class AnalyticsTrackingServiceImpl implements AnalyticsTrackingService {
  private isInitialized = false;
  private enabled = true;
  private sessionId = '';
  private userId?: string;
  private userProperties: UserProperties | null = null;
  private sessionInfo: SessionInfo | null = null;
  private events: AnalyticsEvent[] = [];
  private globalProperties: Record<string, any> = {};
  private readonly STORAGE_KEY = 'analytics_events';
  private readonly MAX_EVENTS = 1000;

  async initialize(): Promise<boolean> {
    try {
      console.log('📊 Initializing analytics tracking service...');

      // Load existing events
      await this.loadEvents();

      // Start session
      await this.startSession();

      this.isInitialized = true;
      console.log('✅ Analytics tracking service initialized');
      return true;
    } catch (error) {
      console.error(
        '❌ Failed to initialize analytics tracking service:',
        error
      );
      return false;
    }
  }

  async trackEvent(
    event: Omit<
      AnalyticsEvent,
      'id' | 'timestamp' | 'sessionId' | 'deviceInfo' | 'appInfo'
    >
  ): Promise<string> {
    try {
      if (!this.enabled) {
        return '';
      }

      const fullEvent: AnalyticsEvent = {
        ...event,
        id: this.generateEventId(),
        timestamp: new Date(),
        sessionId: this.sessionId,
        deviceInfo: this.getDeviceInfo(),
        appInfo: this.getAppInfo(),
        properties: {
          ...this.globalProperties,
          ...event.properties,
        },
      };

      await this.addEvent(fullEvent);
      console.log(`📊 Event tracked: ${event.name}`);
      return fullEvent.id;
    } catch (error) {
      console.error('❌ Error tracking event:', error);
      return '';
    }
  }

  async trackScreen(
    screenName: string,
    properties?: Record<string, any>
  ): Promise<string> {
    return this.trackEvent({
      name: 'screen_view',
      category: 'navigation',
      action: 'view',
      label: screenName,
      properties: {
        screen_name: screenName,
        ...properties,
      },
    });
  }

  async trackUserAction(
    action: string,
    properties?: Record<string, any>
  ): Promise<string> {
    return this.trackEvent({
      name: 'user_action',
      category: 'user_interaction',
      action,
      properties: {
        action_type: action,
        ...properties,
      },
    });
  }

  async trackError(
    error: Error,
    properties?: Record<string, any>
  ): Promise<string> {
    return this.trackEvent({
      name: 'error',
      category: 'error',
      action: 'occurred',
      label: error.message,
      properties: {
        error_message: error.message,
        error_stack: error.stack,
        ...properties,
      },
    });
  }

  async identifyUser(properties: UserProperties): Promise<void> {
    try {
      this.userProperties = properties;
      this.userId = properties.userId;

      // Track user identification
      await this.trackEvent({
        name: 'user_identified',
        category: 'user',
        action: 'identify',
        properties: {
          user_id: properties.userId,
          user_name: properties.name,
          user_email: properties.email,
          user_role: properties.role,
        },
      });

      console.log('👤 User identified:', properties.userId);
    } catch (error) {
      console.error('❌ Error identifying user:', error);
    }
  }

  async setUserProperty(key: string, value: any): Promise<void> {
    try {
      if (this.userProperties) {
        this.userProperties.preferences = {
          ...this.userProperties.preferences,
          [key]: value,
        };

        await this.trackEvent({
          name: 'user_property_set',
          category: 'user',
          action: 'property_set',
          properties: {
            property_key: key,
            property_value: value,
          },
        });

        console.log(`👤 User property set: ${key} = ${value}`);
      }
    } catch (error) {
      console.error('❌ Error setting user property:', error);
    }
  }

  async clearUserData(): Promise<void> {
    try {
      this.userProperties = null;
      this.userId = undefined;

      await this.trackEvent({
        name: 'user_data_cleared',
        category: 'user',
        action: 'clear_data',
        properties: {},
      });

      console.log('🗑️ User data cleared');
    } catch (error) {
      console.error('❌ Error clearing user data:', error);
    }
  }

  async startSession(): Promise<string> {
    try {
      this.sessionId = this.generateSessionId();
      this.sessionInfo = {
        id: this.sessionId,
        startTime: new Date(),
        events: 0,
        userId: this.userId,
      };

      await this.trackEvent({
        name: 'session_start',
        category: 'session',
        action: 'start',
        properties: {
          session_id: this.sessionId,
        },
      });

      console.log('🔄 Session started:', this.sessionId);
      return this.sessionId;
    } catch (error) {
      console.error('❌ Error starting session:', error);
      return '';
    }
  }

  async endSession(): Promise<void> {
    try {
      if (this.sessionInfo) {
        this.sessionInfo.endTime = new Date();
        this.sessionInfo.duration =
          this.sessionInfo.endTime.getTime() -
          this.sessionInfo.startTime.getTime();

        await this.trackEvent({
          name: 'session_end',
          category: 'session',
          action: 'end',
          properties: {
            session_id: this.sessionId,
            session_duration: this.sessionInfo.duration,
            session_events: this.sessionInfo.events,
          },
        });

        console.log('🔄 Session ended:', this.sessionId);
      }
    } catch (error) {
      console.error('❌ Error ending session:', error);
    }
  }

  getCurrentSession(): SessionInfo | null {
    return this.sessionInfo;
  }

  async getEvents(limit: number = 100): Promise<AnalyticsEvent[]> {
    try {
      return this.events.slice(-limit);
    } catch (error) {
      console.error('❌ Error getting events:', error);
      return [];
    }
  }

  async clearEvents(): Promise<void> {
    try {
      this.events = [];
      await this.saveEvents();
      console.log('🗑️ Analytics events cleared');
    } catch (error) {
      console.error('❌ Error clearing events:', error);
    }
  }

  async uploadEvents(): Promise<boolean> {
    try {
      if (this.events.length === 0) {
        console.log('📊 No events to upload');
        return true;
      }

      console.log(`📤 Uploading ${this.events.length} events...`);

      const response = await httpClient.post<{ success: boolean }>(
        '/api/analytics/upload',
        { events: this.events }
      );

      if (response.success) {
        console.log('✅ Events uploaded successfully');
        await this.clearEvents();
        return true;
      } else {
        console.log('❌ Failed to upload events');
        return false;
      }
    } catch (error) {
      console.error('❌ Error uploading events:', error);
      return false;
    }
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  async setEnabled(enabled: boolean): Promise<void> {
    try {
      this.enabled = enabled;
      await AsyncStorage.setItem(
        'analytics_tracking_enabled',
        JSON.stringify(enabled)
      );
      console.log(`🔧 Analytics tracking ${enabled ? 'enabled' : 'disabled'}`);
    } catch (error) {
      console.error('❌ Error setting analytics tracking enabled:', error);
    }
  }

  getDeviceInfo(): DeviceInfo {
    return {
      platform: Platform.OS,
      version: Platform.Version.toString(),
      model: 'Unknown',
      manufacturer: 'Unknown',
      memory: 0,
      storage: 0,
      isOnline: true,
    };
  }

  getAppInfo(): AppInfo {
    return {
      version: '1.0.0',
      buildNumber: '1',
      bundleId: 'com.bachelormess.client',
      environment: process.env.EXPO_PUBLIC_ENV || 'development',
      timestamp: new Date(),
    };
  }

  addEventProperty(key: string, value: any): void {
    this.globalProperties[key] = value;
    console.log(`📊 Event property added: ${key} = ${value}`);
  }

  removeEventProperty(key: string): void {
    delete this.globalProperties[key];
    console.log(`📊 Event property removed: ${key}`);
  }

  private async addEvent(event: AnalyticsEvent): Promise<void> {
    if (!this.enabled) {
      return;
    }

    this.events.push(event);

    // Update session event count
    if (this.sessionInfo) {
      this.sessionInfo.events++;
    }

    // Keep only the latest events
    if (this.events.length > this.MAX_EVENTS) {
      this.events = this.events.slice(-this.MAX_EVENTS);
    }

    await this.saveEvents();
  }

  private async loadEvents(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        this.events = JSON.parse(stored);
      }
    } catch (error) {
      console.error('❌ Error loading events:', error);
      this.events = [];
    }
  }

  private async saveEvents(): Promise<void> {
    try {
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.events));
    } catch (error) {
      console.error('❌ Error saving events:', error);
    }
  }

  private generateEventId(): string {
    return `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Export singleton instance
export const analyticsTrackingService = new AnalyticsTrackingServiceImpl();
