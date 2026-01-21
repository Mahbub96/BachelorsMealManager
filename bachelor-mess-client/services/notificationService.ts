import { Platform, Alert } from 'react-native';
import * as Device from 'expo-device';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { ApiResponse } from './config';
import httpClient from './httpClient';

// Lazy load expo-notifications to avoid errors in Expo Go
let Notifications: typeof import('expo-notifications') | null = null;

const getNotifications = async () => {
  if (Notifications) return Notifications;
  
  // Check if running in Expo Go (SDK 53+ removed push notifications from Expo Go)
  try {
    // Expo Go detection: check if appOwnership is 'expo' or executionEnvironment indicates Expo Go
    const isExpoGo = 
      Constants.appOwnership === 'expo' || 
      (Constants.executionEnvironment && Constants.executionEnvironment !== ExecutionEnvironment.Standalone);
    
    if (isExpoGo && __DEV__) {
      console.log('📱 Expo Go detected - expo-notifications not available in SDK 53+');
      return null;
    }
  } catch {
    // Constants might not be available, continue with import attempt
  }
  
  try {
    Notifications = await import('expo-notifications');
    return Notifications;
  } catch (error: any) {
    // Check if error is about Expo Go
    if (error?.message?.includes('Expo Go') || error?.message?.includes('SDK 53')) {
      console.log('📱 Expo Go detected via error - expo-notifications not available');
      return null;
    }
    console.log('⚠️ Failed to load expo-notifications:', error);
    return null;
  }
};

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
  private isExpoGo = false;

  constructor() {
    // Check if running in Expo Go
    try {
      const isExpoGo = Constants.appOwnership === 'expo';
      this.isExpoGo = isExpoGo || (__DEV__ && !Device.isDevice);
    } catch {
      // Fallback check
      this.isExpoGo = __DEV__ && !Device.isDevice;
    }
    if (this.isExpoGo) {
      console.log(
        '📱 Running in Expo Go - Push notifications are not supported'
      );
    }
  }

  async initialize(): Promise<boolean> {
    try {
      console.log('🔔 Initializing notification service...');

      // Check if running in Expo Go
      if (this.isExpoGo) {
        console.log('⚠️ Push notifications are not supported in Expo Go');
        console.log('💡 Use a development build for full notification support');
        this.isInitialized = true;
        return true;
      }

      // Skip initialization in development simulator
      if (__DEV__ && !Device.isDevice) {
        console.log('⚠️ Skipping notification initialization in simulator');
        this.isInitialized = true;
        return true;
      }

      // Configure notification behavior
      const NotificationsModule = await getNotifications();
      if (!NotificationsModule) {
        console.log('⚠️ expo-notifications not available, skipping configuration');
        this.isInitialized = true;
        return true;
      }
      
      NotificationsModule.setNotificationHandler({
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
        this.isInitialized = true;
        return true;
      }

      // Get device token
      this.token = await this.getToken();
      if (this.token) {
        console.log('✅ Device token obtained:', this.token);
        // Register token with server
        try {
          await this.registerToken(this.token);
        } catch {
          console.log(
            '⚠️ Failed to register token with server, but continuing...'
          );
        }
      }

      this.isInitialized = true;
      console.log('✅ Notification service initialized successfully');
      return true;
    } catch (error) {
      console.error('❌ Error initializing notification service:', error);
      this.isInitialized = true; // Mark as initialized to prevent errors
      return true;
    }
  }

  async requestPermissions(): Promise<boolean> {
    try {
      if (this.isExpoGo) {
        console.log('📱 Expo Go detected - skipping permission request');
        return true;
      }

      if (!Device.isDevice || __DEV__) {
        console.log(
          '📱 Not a physical device or in development, skipping permissions'
        );
        return true;
      }

      const NotificationsModule = await getNotifications();
      if (!NotificationsModule) {
        return true;
      }

      const { status: existingStatus } =
        await NotificationsModule.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await NotificationsModule.requestPermissionsAsync();
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
      return __DEV__ ? true : false;
    }
  }

  async getToken(): Promise<string | null> {
    try {
      if (this.isExpoGo) {
        console.log('📱 Expo Go detected - cannot get push token');
        return null;
      }

      if (!Device.isDevice || __DEV__) {
        console.log(
          '📱 Not a physical device or in development, cannot get token'
        );
        return null;
      }

      const NotificationsModule = await getNotifications();
      if (!NotificationsModule) {
        return null;
      }

      const token = await NotificationsModule.getExpoPushTokenAsync({
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

      // Skip in Expo Go or development
      if (this.isExpoGo || __DEV__ || !Device.isDevice) {
        console.log(
          '📱 Skipping local notification in Expo Go/development:',
          notification.title
        );
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

      const NotificationsModule = await getNotifications();
      if (!NotificationsModule) {
        return;
      }

      await NotificationsModule.scheduleNotificationAsync({
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

      // Skip in Expo Go or development
      if (this.isExpoGo || __DEV__ || !Device.isDevice) {
        console.log(
          '📱 Skipping scheduled notification in Expo Go/development:',
          notification.title
        );
        return 'dev-skip';
      }

      const notificationContent = {
        title: notification.title,
        body: notification.body,
        data: notification.data || {},
        sound: notification.priority === 'high' ? 'default' : undefined,
        priority: notification.priority,
        badge: 1,
      };

      const NotificationsModule = await getNotifications();
      if (!NotificationsModule) {
        return 'dev-skip';
      }

      const identifier = await NotificationsModule.scheduleNotificationAsync({
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
      // Skip in Expo Go or development
      if (this.isExpoGo || __DEV__ || !Device.isDevice) {
        console.log(
          '📱 Skipping notification cancellation in Expo Go/development:',
          id
        );
        return;
      }

      const NotificationsModule = await getNotifications();
      if (!NotificationsModule) {
        return;
      }

      await NotificationsModule.cancelScheduledNotificationAsync(id);
      console.log('✅ Notification cancelled:', id);
    } catch (error) {
      console.error('❌ Error cancelling notification:', error);
    }
  }

  async cancelAllNotifications(): Promise<void> {
    try {
      // Skip in Expo Go or development
      if (this.isExpoGo || __DEV__ || !Device.isDevice) {
        console.log(
          '📱 Skipping cancel all notifications in Expo Go/development'
        );
        return;
      }

      const NotificationsModule = await getNotifications();
      if (!NotificationsModule) {
        return;
      }

      await NotificationsModule.cancelAllScheduledNotificationsAsync();
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
      // Skip in Expo Go or development
      if (this.isExpoGo || __DEV__ || !Device.isDevice) {
        console.log('📱 Skipping token registration in Expo Go/development');
        return { success: true, data: { success: true } };
      }

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
      // Don't throw error in development
      if (__DEV__) {
        return { success: true, data: { success: true } };
      }
      return {
        success: false,
        error: 'Failed to register push token',
      };
    }
  }

  async unregisterToken(): Promise<ApiResponse<{ success: boolean }>> {
    try {
      // Skip in Expo Go or development
      if (this.isExpoGo || __DEV__ || !Device.isDevice) {
        console.log('📱 Skipping token unregistration in Expo Go/development');
        return { success: true, data: { success: true } };
      }

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
      // Don't throw error in development
      if (__DEV__) {
        return { success: true, data: { success: true } };
      }
      return {
        success: false,
        error: 'Failed to unregister push token',
      };
    }
  }

  async isEnabled(): Promise<boolean> {
    try {
      // Skip in Expo Go or development
      if (this.isExpoGo || __DEV__ || !Device.isDevice) {
        console.log('📱 Skipping permission check in Expo Go/development');
        return true;
      }

      const NotificationsModule = await getNotifications();
      if (!NotificationsModule) {
        return true;
      }

      const { status } = await NotificationsModule.getPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('❌ Error checking notification status:', error);
      return __DEV__ ? true : false;
    }
  }

  async getBadgeCount(): Promise<number> {
    try {
      // Skip in Expo Go or development
      if (this.isExpoGo || __DEV__ || !Device.isDevice) {
        console.log('📱 Skipping badge count check in Expo Go/development');
        return 0;
      }

      const NotificationsModule = await getNotifications();
      if (!NotificationsModule) {
        return 0;
      }

      return await NotificationsModule.getBadgeCountAsync();
    } catch (error) {
      console.error('❌ Error getting badge count:', error);
      return 0;
    }
  }

  async setBadgeCount(count: number): Promise<void> {
    try {
      // Skip in Expo Go or development
      if (this.isExpoGo || __DEV__ || !Device.isDevice) {
        console.log(
          '📱 Skipping badge count set in Expo Go/development:',
          count
        );
        return;
      }

      const NotificationsModule = await getNotifications();
      if (!NotificationsModule) {
        return;
      }

      await NotificationsModule.setBadgeCountAsync(count);
    } catch (error) {
      console.error('❌ Error setting badge count:', error);
    }
  }

  async clearBadge(): Promise<void> {
    try {
      // Skip in Expo Go or development
      if (this.isExpoGo || __DEV__ || !Device.isDevice) {
        console.log('📱 Skipping badge clear in Expo Go/development');
        return;
      }

      const NotificationsModule = await getNotifications();
      if (!NotificationsModule) {
        return;
      }

      await NotificationsModule.setBadgeCountAsync(0);
    } catch (error) {
      console.error('❌ Error clearing badge:', error);
    }
  }
}

// Export singleton instance
export const notificationService = new NotificationServiceImpl();
