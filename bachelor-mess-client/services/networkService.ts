import NetInfo from '@react-native-community/netinfo';
import { Platform } from 'react-native';
import httpClient from './httpClient';
import errorHandler from './errorHandler';

// Network status types
export enum NetworkStatus {
  UNKNOWN = 'unknown',
  CONNECTED = 'connected',
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting',
}

// Network type
export enum NetworkType {
  WIFI = 'wifi',
  CELLULAR = 'cellular',
  NONE = 'none',
  UNKNOWN = 'unknown',
}

// Network quality
export enum NetworkQuality {
  EXCELLENT = 'excellent',
  GOOD = 'good',
  POOR = 'poor',
  UNREACHABLE = 'unreachable',
}

// Network event interface
export interface NetworkEvent {
  type: 'status' | 'quality' | 'retry';
  status: NetworkStatus;
  networkType: NetworkType;
  quality: NetworkQuality;
  timestamp: number;
  details?: string;
}

// Network service interface
export interface NetworkService {
  getStatus: () => Promise<NetworkStatus>;
  getNetworkType: () => Promise<NetworkType>;
  getQuality: () => Promise<NetworkQuality>;
  isOnline: () => Promise<boolean>;
  addListener: (callback: (event: NetworkEvent) => void) => () => void;
  retryFailedRequests: () => Promise<void>;
  getNetworkInfo: () => Promise<{
    status: NetworkStatus;
    type: NetworkType;
    quality: NetworkQuality;
    isConnected: boolean;
    details: any;
  }>;
}

// Network service implementation
class NetworkServiceImpl implements NetworkService {
  private listeners: ((event: NetworkEvent) => void)[] = [];
  private lastStatus: NetworkStatus = NetworkStatus.UNKNOWN;
  private lastNetworkType: NetworkType = NetworkType.UNKNOWN;
  private lastQuality: NetworkQuality = NetworkQuality.UNREACHABLE;
  private isMonitoring = false;
  private retryInterval: ReturnType<typeof setInterval> | null = null;
  private netInfoUnsubscribe: (() => void) | null = null;

  constructor() {
    this.startMonitoring();
  }

  // Start network monitoring
  private startMonitoring(): void {
    if (this.isMonitoring) return;

    this.isMonitoring = true;
    console.log('🌐 Starting network monitoring...');

    // Monitor network state changes - store unsubscribe function to prevent memory leak
    this.netInfoUnsubscribe = NetInfo.addEventListener(state => {
      this.handleNetworkChange(state);
    });

    // Initial network check
    this.checkNetworkStatus();
  }

  // Handle network state changes
  private handleNetworkChange(state: any): void {
    const previousStatus = this.lastStatus;
    const previousType = this.lastNetworkType;

    // Update status
    this.lastStatus = state.isConnected
      ? NetworkStatus.CONNECTED
      : NetworkStatus.DISCONNECTED;
    this.lastNetworkType = this.mapNetworkType(state.type);
    this.lastQuality = this.assessNetworkQuality(state);

    // Log network change
    console.log('📡 Network changed:', {
      status: this.lastStatus,
      type: this.lastNetworkType,
      quality: this.lastQuality,
      isConnected: state.isConnected,
    });

    // Emit event
    const event: NetworkEvent = {
      type: 'status',
      status: this.lastStatus,
      networkType: this.lastNetworkType,
      quality: this.lastQuality,
      timestamp: Date.now(),
      details: `Network changed from ${previousStatus} to ${this.lastStatus}`,
    };

    this.notifyListeners(event);

    // Handle online/offline transitions
    if (previousStatus !== this.lastStatus) {
      if (this.lastStatus === NetworkStatus.CONNECTED) {
        this.handleOnlineTransition();
      } else if (this.lastStatus === NetworkStatus.DISCONNECTED) {
        this.handleOfflineTransition();
      }
    }
  }

  // Map NetInfo type to our NetworkType
  private mapNetworkType(netInfoType: string): NetworkType {
    switch (netInfoType) {
      case 'wifi':
        return NetworkType.WIFI;
      case 'cellular':
        return NetworkType.CELLULAR;
      case 'none':
        return NetworkType.NONE;
      default:
        return NetworkType.UNKNOWN;
    }
  }

  // Assess network quality based on connection details
  private assessNetworkQuality(state: any): NetworkQuality {
    if (!state.isConnected) {
      return NetworkQuality.UNREACHABLE;
    }

    // For WiFi, check signal strength if available
    if (state.type === 'wifi' && state.details) {
      const strength = state.details.strength || 0;
      if (strength > 80) return NetworkQuality.EXCELLENT;
      if (strength > 60) return NetworkQuality.GOOD;
      return NetworkQuality.POOR;
    }

    // For cellular, check connection type
    if (state.type === 'cellular' && state.details) {
      const cellularGeneration = state.details.cellularGeneration;
      if (cellularGeneration === '5g' || cellularGeneration === '4g') {
        return NetworkQuality.EXCELLENT;
      }
      if (cellularGeneration === '3g') {
        return NetworkQuality.GOOD;
      }
      return NetworkQuality.POOR;
    }

    // Default to good if connected but no detailed info
    return NetworkQuality.GOOD;
  }

  // Handle transition to online
  private async handleOnlineTransition(): Promise<void> {
    console.log('✅ Network is back online');

    // Retry failed requests
    await this.retryFailedRequests();

    // Emit retry event
    const event: NetworkEvent = {
      type: 'retry',
      status: this.lastStatus,
      networkType: this.lastNetworkType,
      quality: this.lastQuality,
      timestamp: Date.now(),
      details: 'Retrying failed requests after coming back online',
    };

    this.notifyListeners(event);
  }

  // Handle transition to offline
  private handleOfflineTransition(): void {
    console.log('❌ Network is offline');

    // Emit offline event
    const event: NetworkEvent = {
      type: 'status',
      status: this.lastStatus,
      networkType: this.lastNetworkType,
      quality: this.lastQuality,
      timestamp: Date.now(),
      details: 'Network connection lost',
    };

    this.notifyListeners(event);
  }

  // Check network status with API connectivity test
  private async checkNetworkStatus(): Promise<void> {
    try {
      const state = await NetInfo.fetch();
      const isOnline = state.isConnected;
      const quality = isOnline
        ? NetworkQuality.GOOD
        : NetworkQuality.UNREACHABLE;

      this.lastQuality = quality;

      console.log('🔍 Network status check:', {
        isOnline,
        quality,
        type: this.lastNetworkType,
      });
    } catch (error) {
      console.error('❌ Error checking network status:', error);
    }
  }

  // Get current network status
  async getStatus(): Promise<NetworkStatus> {
    const state = await NetInfo.fetch();
    this.lastStatus = state.isConnected
      ? NetworkStatus.CONNECTED
      : NetworkStatus.DISCONNECTED;
    return this.lastStatus;
  }

  // Get current network type
  async getNetworkType(): Promise<NetworkType> {
    const state = await NetInfo.fetch();
    this.lastNetworkType = this.mapNetworkType(state.type);
    return this.lastNetworkType;
  }

  // Get current network quality
  async getQuality(): Promise<NetworkQuality> {
    const state = await NetInfo.fetch();
    this.lastQuality = this.assessNetworkQuality(state);
    return this.lastQuality;
  }

  // Check if device is online
  async isOnline(): Promise<boolean> {
    const status = await this.getStatus();
    return status === NetworkStatus.CONNECTED;
  }

  // Add network event listener
  addListener(callback: (event: NetworkEvent) => void): () => void {
    this.listeners.push(callback);

    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  // Notify all listeners
  private notifyListeners(event: NetworkEvent): void {
    this.listeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error('Error in network listener:', error);
      }
    });
  }

  private retryInProgress = false;

  // Retry failed requests when back online (single-flight to avoid parallel runs)
  async retryFailedRequests(): Promise<void> {
    if (this.retryInProgress) {
      return;
    }
    this.retryInProgress = true;
    try {
      console.log('🔄 Retrying failed requests...');

      // Get offline status (uses count only, does not load full queue)
      const offlineStatus = await httpClient.getOfflineStatus();

      if (offlineStatus.pendingRequests > 0) {
        console.log(
          `📤 Retrying ${offlineStatus.pendingRequests} pending requests`
        );

        // Retry offline requests
        await httpClient.retryOfflineRequests();

        // Emit retry event
        const event: NetworkEvent = {
          type: 'retry',
          status: this.lastStatus,
          networkType: this.lastNetworkType,
          quality: this.lastQuality,
          timestamp: Date.now(),
          details: `Retried ${offlineStatus.pendingRequests} requests`,
        };

        this.notifyListeners(event);
      }
    } catch (error) {
      console.error('❌ Error retrying failed requests:', error);
      // Don't throw error, just log it to prevent app crashes
    } finally {
      this.retryInProgress = false;
    }
  }

  // Get comprehensive network information
  async getNetworkInfo(): Promise<{
    status: NetworkStatus;
    type: NetworkType;
    quality: NetworkQuality;
    isConnected: boolean;
    details: any;
  }> {
    const state = await NetInfo.fetch();

    return {
      status: this.lastStatus,
      type: this.lastNetworkType,
      quality: this.lastQuality,
      isConnected: state.isConnected || false,
      details: state,
    };
  }

  // Start periodic retry mechanism
  startPeriodicRetry(intervalMs: number = 30000): void {
    if (this.retryInterval) {
      clearInterval(this.retryInterval);
    }

    this.retryInterval = setInterval(async () => {
      const isOnline = await this.isOnline();
      if (isOnline) {
        await this.retryFailedRequests();
      }
    }, intervalMs);

    console.log(`🔄 Started periodic retry every ${intervalMs}ms`);
  }

  // Stop periodic retry mechanism
  stopPeriodicRetry(): void {
    if (this.retryInterval) {
      clearInterval(this.retryInterval);
      this.retryInterval = null;
      console.log('🔄 Stopped periodic retry');
    }
  }

  // Get network statistics
  getNetworkStats(): {
    currentStatus: NetworkStatus;
    currentType: NetworkType;
    currentQuality: NetworkQuality;
    isMonitoring: boolean;
    listenerCount: number;
  } {
    return {
      currentStatus: this.lastStatus,
      currentType: this.lastNetworkType,
      currentQuality: this.lastQuality,
      isMonitoring: this.isMonitoring,
      listenerCount: this.listeners.length,
    };
  }

  // Cleanup resources
  cleanup(): void {
    this.stopPeriodicRetry();
    
    // Unsubscribe from NetInfo to prevent memory leak
    if (this.netInfoUnsubscribe) {
      this.netInfoUnsubscribe();
      this.netInfoUnsubscribe = null;
    }
    
    this.listeners = [];
    this.isMonitoring = false;
    console.log('🧹 Network service cleaned up');
  }
}

// Export singleton instance
const networkService = new NetworkServiceImpl();
export default networkService;
