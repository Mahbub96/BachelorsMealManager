import { Platform } from 'react-native';
import { API_ENDPOINTS, ApiResponse } from './config';
import httpClient from './httpClient';

// Real-time event types
export type RealtimeEventType =
  | 'meal_updated'
  | 'bazar_updated'
  | 'user_joined'
  | 'user_left'
  | 'payment_received'
  | 'notification_received'
  | 'system_alert'
  | 'data_sync';

export interface RealtimeEvent {
  id: string;
  type: RealtimeEventType;
  data: Record<string, any>;
  timestamp: Date;
  userId?: string;
  priority: 'high' | 'normal' | 'low';
}

export interface RealtimeConnection {
  isConnected: boolean;
  lastConnected: Date | null;
  connectionId: string | null;
  reconnectAttempts: number;
  maxReconnectAttempts: number;
}

export interface RealtimeService {
  // Connection management
  connect: () => Promise<boolean>;
  disconnect: () => Promise<void>;
  reconnect: () => Promise<boolean>;
  getConnectionStatus: () => RealtimeConnection;

  // Event handling
  subscribe: (
    eventType: RealtimeEventType,
    callback: (event: RealtimeEvent) => void
  ) => string;
  unsubscribe: (subscriptionId: string) => boolean;
  publish: (event: Omit<RealtimeEvent, 'id' | 'timestamp'>) => Promise<boolean>;

  // Data synchronization
  syncData: (dataType: 'meals' | 'bazar' | 'users' | 'all') => Promise<boolean>;
  getLastSyncTime: (dataType: string) => Date | null;

  // Utility methods
  isOnline: () => boolean;
  getEventHistory: (limit?: number) => RealtimeEvent[];
  clearEventHistory: () => void;
}

// Real-time service implementation using polling (fallback for WebSocket)
class RealtimeServiceImpl implements RealtimeService {
  private connection: RealtimeConnection = {
    isConnected: false,
    lastConnected: null,
    connectionId: null,
    reconnectAttempts: 0,
    maxReconnectAttempts: 5,
  };

  private subscriptions = new Map<string, (event: RealtimeEvent) => void>();
  private eventHistory: RealtimeEvent[] = [];
  private pollingInterval: ReturnType<typeof setInterval> | null = null;
  private lastSyncTimes = new Map<string, Date>();

  async connect(): Promise<boolean> {
    try {
      console.log('🔌 Connecting to real-time service...');

      // Check if online
      if (!this.isOnline()) {
        console.log('❌ No internet connection available');
        return false;
      }

      // Initialize connection
      this.connection.isConnected = true;
      this.connection.lastConnected = new Date();
      this.connection.connectionId = this.generateConnectionId();
      this.connection.reconnectAttempts = 0;

      // Start polling for updates
      this.startPolling();

      console.log('✅ Real-time service connected');
      return true;
    } catch (error) {
      console.error('❌ Failed to connect to real-time service:', error);
      return false;
    }
  }

  async disconnect(): Promise<void> {
    try {
      console.log('🔌 Disconnecting from real-time service...');

      this.connection.isConnected = false;
      this.stopPolling();

      console.log('✅ Real-time service disconnected');
    } catch (error) {
      console.error('❌ Error disconnecting from real-time service:', error);
    }
  }

  async reconnect(): Promise<boolean> {
    try {
      console.log('🔄 Attempting to reconnect...');

      if (
        this.connection.reconnectAttempts >=
        this.connection.maxReconnectAttempts
      ) {
        console.log('❌ Max reconnection attempts reached');
        return false;
      }

      this.connection.reconnectAttempts++;
      await this.disconnect();
      const success = await this.connect();

      if (success) {
        this.connection.reconnectAttempts = 0;
      }

      return success;
    } catch (error) {
      console.error('❌ Error reconnecting:', error);
      return false;
    }
  }

  getConnectionStatus(): RealtimeConnection {
    return { ...this.connection };
  }

  subscribe(
    eventType: RealtimeEventType,
    callback: (event: RealtimeEvent) => void
  ): string {
    const subscriptionId = `${eventType}_${Date.now()}_${Math.random()}`;
    this.subscriptions.set(subscriptionId, callback);

    console.log(`📡 Subscribed to ${eventType} events`);
    return subscriptionId;
  }

  unsubscribe(subscriptionId: string): boolean {
    const removed = this.subscriptions.delete(subscriptionId);
    if (removed) {
      console.log(`📡 Unsubscribed from events: ${subscriptionId}`);
    }
    return removed;
  }

  async publish(
    event: Omit<RealtimeEvent, 'id' | 'timestamp'>
  ): Promise<boolean> {
    try {
      const fullEvent: RealtimeEvent = {
        ...event,
        id: this.generateEventId(),
        timestamp: new Date(),
      };

      // Add to event history
      this.eventHistory.push(fullEvent);
      if (this.eventHistory.length > 100) {
        this.eventHistory.shift();
      }

      // Notify subscribers
      this.subscriptions.forEach(callback => {
        try {
          callback(fullEvent);
        } catch (error) {
          console.error('❌ Error in event callback:', error);
        }
      });

      console.log(`📤 Published event: ${event.type}`);
      return true;
    } catch (error) {
      console.error('❌ Error publishing event:', error);
      return false;
    }
  }

  async syncData(
    dataType: 'meals' | 'bazar' | 'users' | 'all'
  ): Promise<boolean> {
    try {
      console.log(`🔄 Syncing ${dataType} data...`);

      const response = await httpClient.get<{ success: boolean }>(
        `/api/realtime/sync/${dataType}`
      );

      if (response.success) {
        this.lastSyncTimes.set(dataType, new Date());
        console.log(`✅ ${dataType} data synced successfully`);
        return true;
      } else {
        console.log(`❌ Failed to sync ${dataType} data`);
        return false;
      }
    } catch (error) {
      console.error(`❌ Error syncing ${dataType} data:`, error);
      return false;
    }
  }

  getLastSyncTime(dataType: string): Date | null {
    return this.lastSyncTimes.get(dataType) || null;
  }

  isOnline(): boolean {
    // In a real app, this would check network connectivity
    return this.connection.isConnected;
  }

  getEventHistory(limit: number = 50): RealtimeEvent[] {
    return this.eventHistory.slice(-limit);
  }

  clearEventHistory(): void {
    this.eventHistory = [];
    console.log('🗑️ Event history cleared');
  }

  private startPolling(): void {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
    }

    // Poll for updates every 30 seconds
    this.pollingInterval = setInterval(async () => {
      if (!this.connection.isConnected || !this.isOnline()) {
        return;
      }

      try {
        await this.checkForUpdates();
      } catch (error) {
        console.error('❌ Error polling for updates:', error);
      }
    }, 30000);

    console.log('🔄 Started polling for real-time updates');
  }

  private stopPolling(): void {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
      console.log('🔄 Stopped polling for real-time updates');
    }
  }

  private async checkForUpdates(): Promise<void> {
    try {
      const response = await httpClient.get<{ events: RealtimeEvent[] }>(
        '/api/realtime/events'
      );

      if (response.success && response.data?.events) {
        response.data.events.forEach(event => {
          this.publish(event);
        });
      }
    } catch (error) {
      console.error('❌ Error checking for updates:', error);
    }
  }

  private generateConnectionId(): string {
    return `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateEventId(): string {
    return `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Export singleton instance
export const realtimeService = new RealtimeServiceImpl();
