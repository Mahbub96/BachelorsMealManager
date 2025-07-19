import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { Alert } from 'react-native';

// Types for offline storage
export interface OfflineRequest {
  id: string;
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  data?: any;
  headers?: Record<string, string>;
  timestamp: number;
  retryCount: number;
  maxRetries: number;
}

export interface OfflineStorageConfig {
  maxRetries: number;
  retryDelay: number; // milliseconds
  maxStorageSize: number; // bytes
  cleanupInterval: number; // milliseconds
}

export interface OfflineStorageService {
  // Core functionality
  storeRequest: (
    request: Omit<OfflineRequest, 'id' | 'timestamp' | 'retryCount'>
  ) => Promise<string>;
  getPendingRequests: () => Promise<OfflineRequest[]>;
  removeRequest: (id: string) => Promise<void>;
  clearAllRequests: () => Promise<void>;

  // Network monitoring
  startNetworkMonitoring: () => void;
  stopNetworkMonitoring: () => void;

  // Retry mechanism
  retryPendingRequests: () => Promise<void>;
  retryRequest: (request: OfflineRequest) => Promise<boolean>;

  // Storage management
  getStorageSize: () => Promise<number>;
  cleanupOldRequests: () => Promise<void>;

  // Status
  isOnline: () => Promise<boolean>;
  getPendingCount: () => Promise<number>;
}

class OfflineStorageServiceImpl implements OfflineStorageService {
  private readonly STORAGE_KEY = 'offline_requests';
  private readonly CONFIG_KEY = 'offline_config';
  private readonly STATUS_KEY = 'offline_status';

  private defaultConfig: OfflineStorageConfig = {
    maxRetries: 3,
    retryDelay: 5000, // 5 seconds
    maxStorageSize: 10 * 1024 * 1024, // 10MB
    cleanupInterval: 24 * 60 * 60 * 1000, // 24 hours
  };

  private networkUnsubscribe?: () => void;
  private isRetrying = false;

  constructor() {
    this.initializeStorage();
  }

  private async initializeStorage() {
    try {
      // Initialize config if not exists
      const config = await AsyncStorage.getItem(this.CONFIG_KEY);
      if (!config) {
        await AsyncStorage.setItem(
          this.CONFIG_KEY,
          JSON.stringify(this.defaultConfig)
        );
      }

      // Start network monitoring
      this.startNetworkMonitoring();

      // Cleanup old requests
      await this.cleanupOldRequests();
    } catch (error) {
      console.error('Error initializing offline storage:', error);
    }
  }

  async storeRequest(
    request: Omit<OfflineRequest, 'id' | 'timestamp' | 'retryCount'>
  ): Promise<string> {
    try {
      const id = this.generateRequestId();
      const offlineRequest: OfflineRequest = {
        ...request,
        id,
        timestamp: Date.now(),
        retryCount: 0,
        maxRetries: this.defaultConfig.maxRetries,
      };

      const existingRequests = await this.getPendingRequests();
      existingRequests.push(offlineRequest);

      await AsyncStorage.setItem(
        this.STORAGE_KEY,
        JSON.stringify(existingRequests)
      );

      console.log(
        `Stored offline request: ${request.method} ${request.endpoint}`
      );

      // Show user notification
      this.showOfflineNotification();

      return id;
    } catch (error) {
      console.error('Error storing offline request:', error);
      throw error;
    }
  }

  async getPendingRequests(): Promise<OfflineRequest[]> {
    try {
      const data = await AsyncStorage.getItem(this.STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting pending requests:', error);
      return [];
    }
  }

  async removeRequest(id: string): Promise<void> {
    try {
      const requests = await this.getPendingRequests();
      const filteredRequests = requests.filter(req => req.id !== id);
      await AsyncStorage.setItem(
        this.STORAGE_KEY,
        JSON.stringify(filteredRequests)
      );
    } catch (error) {
      console.error('Error removing request:', error);
    }
  }

  async clearAllRequests(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.STORAGE_KEY);
      console.log('Cleared all offline requests');
    } catch (error) {
      console.error('Error clearing requests:', error);
    }
  }

  startNetworkMonitoring(): void {
    if (this.networkUnsubscribe) {
      this.networkUnsubscribe();
    }

    this.networkUnsubscribe = NetInfo.addEventListener((state: any) => {
      if (state.isConnected && !this.isRetrying) {
        console.log('Network connected, retrying pending requests...');
        this.retryPendingRequests();
      }
    });
  }

  stopNetworkMonitoring(): void {
    if (this.networkUnsubscribe) {
      this.networkUnsubscribe();
      this.networkUnsubscribe = undefined;
    }
  }

  async retryPendingRequests(): Promise<void> {
    if (this.isRetrying) {
      return;
    }

    this.isRetrying = true;

    try {
      const requests = await this.getPendingRequests();
      if (requests.length === 0) {
        return;
      }

      console.log(`Retrying ${requests.length} pending requests...`);

      const results = await Promise.allSettled(
        requests.map(request => this.retryRequest(request))
      );

      const successfulCount = results.filter(
        result => result.status === 'fulfilled' && result.value
      ).length;
      const failedCount = results.length - successfulCount;

      if (successfulCount > 0) {
        Alert.alert(
          'Sync Complete',
          `Successfully synced ${successfulCount} items${
            failedCount > 0 ? `, ${failedCount} failed` : ''
          }`
        );
      }
    } catch (error) {
      console.error('Error retrying pending requests:', error);
    } finally {
      this.isRetrying = false;
    }
  }

  async retryRequest(request: OfflineRequest): Promise<boolean> {
    try {
      // Check if request has exceeded max retries
      if (request.retryCount >= request.maxRetries) {
        console.log(`Request ${request.id} exceeded max retries, removing...`);
        await this.removeRequest(request.id);
        return false;
      }

      // Import httpClient dynamically to avoid circular dependencies
      const { default: httpClient } = await import('./httpClient');

      let response;

      switch (request.method) {
        case 'GET':
          response = await httpClient.get(request.endpoint, request.headers);
          break;
        case 'POST':
          response = await httpClient.post(
            request.endpoint,
            request.data,
            request.headers
          );
          break;
        case 'PUT':
          response = await httpClient.put(
            request.endpoint,
            request.data,
            request.headers
          );
          break;
        case 'PATCH':
          response = await httpClient.patch(
            request.endpoint,
            request.data,
            request.headers
          );
          break;
        case 'DELETE':
          response = await httpClient.delete(request.endpoint, request.headers);
          break;
        default:
          throw new Error(`Unsupported method: ${request.method}`);
      }

      if (response.success) {
        // Remove successful request
        await this.removeRequest(request.id);
        console.log(
          `Successfully retried request: ${request.method} ${request.endpoint}`
        );
        return true;
      } else {
        // Increment retry count
        await this.incrementRetryCount(request.id);
        console.log(
          `Failed to retry request: ${request.method} ${
            request.endpoint
          }, retry count: ${request.retryCount + 1}`
        );
        return false;
      }
    } catch (error) {
      console.error(`Error retrying request ${request.id}:`, error);

      // Increment retry count
      await this.incrementRetryCount(request.id);
      return false;
    }
  }

  private async incrementRetryCount(requestId: string): Promise<void> {
    try {
      const requests = await this.getPendingRequests();
      const updatedRequests = requests.map(req =>
        req.id === requestId ? { ...req, retryCount: req.retryCount + 1 } : req
      );
      await AsyncStorage.setItem(
        this.STORAGE_KEY,
        JSON.stringify(updatedRequests)
      );
    } catch (error) {
      console.error('Error incrementing retry count:', error);
    }
  }

  async getStorageSize(): Promise<number> {
    try {
      const data = await AsyncStorage.getItem(this.STORAGE_KEY);
      return data ? new Blob([data]).size : 0;
    } catch (error) {
      console.error('Error getting storage size:', error);
      return 0;
    }
  }

  async cleanupOldRequests(): Promise<void> {
    try {
      const requests = await this.getPendingRequests();
      const now = Date.now();
      const cleanupThreshold = now - this.defaultConfig.cleanupInterval;

      const validRequests = requests.filter(
        req => req.timestamp > cleanupThreshold
      );

      if (validRequests.length !== requests.length) {
        await AsyncStorage.setItem(
          this.STORAGE_KEY,
          JSON.stringify(validRequests)
        );
        console.log(
          `Cleaned up ${requests.length - validRequests.length} old requests`
        );
      }
    } catch (error) {
      console.error('Error cleaning up old requests:', error);
    }
  }

  async isOnline(): Promise<boolean> {
    try {
      const state = await NetInfo.fetch();
      return state.isConnected ?? false;
    } catch (error) {
      console.error('Error checking network status:', error);
      return false;
    }
  }

  async getPendingCount(): Promise<number> {
    try {
      const requests = await this.getPendingRequests();
      return requests.length;
    } catch (error) {
      console.error('Error getting pending count:', error);
      return 0;
    }
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private showOfflineNotification(): void {
    Alert.alert(
      'Offline Mode',
      "You're offline. Your submission will be saved and synced when you're back online.",
      [{ text: 'OK' }]
    );
  }
}

// Create singleton instance
const offlineStorage = new OfflineStorageServiceImpl();

export default offlineStorage;
