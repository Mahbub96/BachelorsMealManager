import { Platform, Alert } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { API_ENDPOINTS, ApiResponse } from './config';
import httpClient from './httpClient';

// Notification types
export interface NotificationData {
  id: string;
  title: string;
  body: string;
  data?: Record<string, any>;
  type: 'meal' | 'bazar' | 'payment' | 'system' | 'reminder';
  priority: 'high' | 'normal' | 'low';
  scheduled?: boolean;
  scheduledAt?: Date;
}

export interface NotificationSettings {
  enabled: boolean;
  mealReminders: boolean;
  bazarReminders: boolean;
  paymentReminders: boolean;
  systemNotifications: boolean;
  quietHours: {
    enabled: boolean;
    start: string; // HH:mm format
    end: string; // HH:mm format
  };
  sound: boolean;
  vibration: boolean;
}

export interface NotificationService {
  // Core functionality
  initialize: () => Promise<boolean>;
  requestPermissions: () => Promise<boolean>;
  getToken: () => Promise<string | null>;
  sendLocalNotification: (notification: NotificationData) => Promise<void>;
  scheduleNotification: (
    notification: NotificationData,
    date: Date
  ) => Promise<string>;
  cancelNotification: (id: string) => Promise<void>;
  cancelAllNotifications: () => Promise<void>;

  // Settings management
  getSettings: () => Promise<NotificationSettings>;
  updateSettings: (settings: Partial<NotificationSettings>) => Promise<boolean>;

  // Server communication
  registerToken: (token: string) => Promise<ApiResponse<{ success: boolean }>>;
  unregisterToken: () => Promise<ApiResponse<{ success: boolean }>>;

  // Utility methods
  isEnabled: () => Promise<boolean>;
  getBadgeCount: () => Promise<number>;
  setBadgeCount: (count: number) => Promise<void>;
  clearBadge: () => Promise<void>;
}

// Notification service implementation
class NotificationServiceImpl implements NotificationService {
  private isInitialized = false;
  private token: string | null = null;

  async initialize(): Promise<boolean> {
    try {
      console.log('🔔 Initializing notification service...');

      // Skip initialization in Expo Go (notifications not fully supported)
      if (__DEV__ && !Device.isDevice) {
        console.log('⚠️ Skipping notification initialization in Expo Go');
        return false;
      }

      // Configure notification behavior
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: true,
          shouldShowBanner: true,
          shouldShowList: true,
        }),
      });

      // Request permissions
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        console.log('❌ Notification permissions not granted');
        return false;
      }

      // Get device token
      this.token = await this.getToken();
      if (this.token) {
        console.log('✅ Device token obtained:', this.token);
        // Register token with server
        await this.registerToken(this.token);
      }

      this.isInitialized = true;
      console.log('✅ Notification service initialized successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize notification service:', error);
      return false;
    }
  }

  async requestPermissions(): Promise<boolean> {
    try {
      if (!Device.isDevice) {
        console.log('📱 Not a physical device, skipping permissions');
        return false;
      }

      const { status: existingStatus } =
        await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        Alert.alert(
          'Notification Permission',
          'Please enable notifications in your device settings to receive important updates.',
          [{ text: 'OK' }]
        );
        return false;
      }

      console.log('✅ Notification permissions granted');
      return true;
    } catch (error) {
      console.error('❌ Error requesting notification permissions:', error);
      return false;
    }
  }

  async getToken(): Promise<string | null> {
    try {
      if (!Device.isDevice) {
        console.log('📱 Not a physical device, cannot get token');
        return null;
      }

      const token = await Notifications.getExpoPushTokenAsync({
        projectId: process.env.EXPO_PUBLIC_EAS_PROJECT_ID,
      });

      console.log('📱 Expo push token:', token.data);
      return token.data;
    } catch (error) {
      console.error('❌ Error getting push token:', error);
      return null;
    }
  }

  async sendLocalNotification(notification: NotificationData): Promise<void> {
    try {
      if (!this.isInitialized) {
        console.log('⚠️ Notification service not initialized');
        return;
      }

      const notificationContent = {
        title: notification.title,
        body: notification.body,
        data: notification.data || {},
        sound: notification.priority === 'high' ? 'default' : undefined,
        priority: notification.priority,
        badge: 1,
      };

      await Notifications.scheduleNotificationAsync({
        content: notificationContent,
        trigger: null, // Send immediately
      });

      console.log('✅ Local notification sent:', notification.title);
    } catch (error) {
      console.error('❌ Error sending local notification:', error);
    }
  }

  async scheduleNotification(
    notification: NotificationData,
    date: Date
  ): Promise<string> {
    try {
      if (!this.isInitialized) {
        throw new Error('Notification service not initialized');
      }

      const notificationContent = {
        title: notification.title,
        body: notification.body,
        data: notification.data || {},
        sound: notification.priority === 'high' ? 'default' : undefined,
        priority: notification.priority,
        badge: 1,
      };

      const identifier = await Notifications.scheduleNotificationAsync({
        content: notificationContent,
        trigger: {
          date: date,
        } as any,
      });

      console.log(
        '✅ Notification scheduled:',
        notification.title,
        'for',
        date
      );
      return identifier;
    } catch (error) {
      console.error('❌ Error scheduling notification:', error);
      throw error;
    }
  }

  async cancelNotification(id: string): Promise<void> {
    try {
      await Notifications.cancelScheduledNotificationAsync(id);
      console.log('✅ Notification cancelled:', id);
    } catch (error) {
      console.error('❌ Error cancelling notification:', error);
    }
  }

  async cancelAllNotifications(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      console.log('✅ All notifications cancelled');
    } catch (error) {
      console.error('❌ Error cancelling all notifications:', error);
    }
  }

  async getSettings(): Promise<NotificationSettings> {
    try {
      // In a real app, this would be stored in AsyncStorage or fetched from server
      const defaultSettings: NotificationSettings = {
        enabled: true,
        mealReminders: true,
        bazarReminders: true,
        paymentReminders: true,
        systemNotifications: true,
        quietHours: {
          enabled: false,
          start: '22:00',
          end: '08:00',
        },
        sound: true,
        vibration: true,
      };

      return defaultSettings;
    } catch (error) {
      console.error('❌ Error getting notification settings:', error);
      throw error;
    }
  }

  async updateSettings(
    settings: Partial<NotificationSettings>
  ): Promise<boolean> {
    try {
      console.log('🔧 Updating notification settings:', settings);
      // In a real app, this would save to AsyncStorage or send to server
      return true;
    } catch (error) {
      console.error('❌ Error updating notification settings:', error);
      return false;
    }
  }

  async registerToken(
    token: string
  ): Promise<ApiResponse<{ success: boolean }>> {
    try {
      const response = await httpClient.post<{ success: boolean }>(
        '/api/notifications/register',
        { token, platform: Platform.OS }
      );

      if (response.success) {
        console.log('✅ Push token registered with server');
      } else {
        console.log('⚠️ Failed to register push token with server');
      }

      return response;
    } catch (error) {
      console.error('❌ Error registering push token:', error);
      return {
        success: false,
        error: 'Failed to register push token',
      };
    }
  }

  async unregisterToken(): Promise<ApiResponse<{ success: boolean }>> {
    try {
      const response = await httpClient.post<{ success: boolean }>(
        '/api/notifications/unregister',
        { token: this.token }
      );

      if (response.success) {
        console.log('✅ Push token unregistered from server');
      }

      return response;
    } catch (error) {
      console.error('❌ Error unregistering push token:', error);
      return {
        success: false,
        error: 'Failed to unregister push token',
      };
    }
  }

  async isEnabled(): Promise<boolean> {
    try {
      const { status } = await Notifications.getPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('❌ Error checking notification status:', error);
      return false;
    }
  }

  async getBadgeCount(): Promise<number> {
    try {
      return await Notifications.getBadgeCountAsync();
    } catch (error) {
      console.error('❌ Error getting badge count:', error);
      return 0;
    }
  }

  async setBadgeCount(count: number): Promise<void> {
    try {
      await Notifications.setBadgeCountAsync(count);
    } catch (error) {
      console.error('❌ Error setting badge count:', error);
    }
  }

  async clearBadge(): Promise<void> {
    try {
      await Notifications.setBadgeCountAsync(0);
    } catch (error) {
      console.error('❌ Error clearing badge:', error);
    }
  }
}

// Export singleton instance
export const notificationService = new NotificationServiceImpl();
