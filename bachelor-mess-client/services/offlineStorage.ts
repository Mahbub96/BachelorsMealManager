import NetInfo from '@react-native-community/netinfo';
import sqliteDatabase from './sqliteDatabase';

// Types for offline data
export interface OfflineData {
  timestamp: number;
  data: any;
  version: string;
}

export interface SyncQueueItem {
  id: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  endpoint: string;
  data: any;
  timestamp: number;
  retryCount: number;
}

export interface OfflineConfig {
  maxRetries: number;
  syncInterval: number;
  cacheExpiry: number;
  maxCacheSize: number;
}

// Default configuration
const DEFAULT_CONFIG: OfflineConfig = {
  maxRetries: 3,
  syncInterval: 30000, // 30 seconds
  cacheExpiry: 24 * 60 * 60 * 1000, // 24 hours
  maxCacheSize: 50 * 1024 * 1024, // 50MB
};

class OfflineStorageService {
  private config: OfflineConfig;
  private isOnline: boolean = true;
  private syncInterval: ReturnType<typeof setInterval> | null = null;

  constructor(config: Partial<OfflineConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.initializeOfflineService();
  }

  private async initializeOfflineService() {
    try {
      // Initialize SQLite database
      await sqliteDatabase.init();

      // Set up network monitoring
      this.setupNetworkMonitoring();

      // Start sync interval
      this.startSyncInterval();

      // Clear expired cache
      await sqliteDatabase.clearExpiredCache();

      console.log('✅ OfflineStorage - Initialized with SQLite database');
    } catch (error) {
      console.error('❌ OfflineStorage - Failed to initialize:', error);
    }
  }

  private setupNetworkMonitoring() {
    NetInfo.addEventListener(state => {
      const wasOnline = this.isOnline;
      this.isOnline = state.isConnected ?? false;

      if (!wasOnline && this.isOnline) {
        console.log('🌐 OfflineStorage - Network restored, syncing data...');
        this.syncPendingData();
      } else if (wasOnline && !this.isOnline) {
        console.log(
          '📴 OfflineStorage - Network lost, switching to offline mode'
        );
      }
    });
  }

  private startSyncInterval() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    this.syncInterval = setInterval(async () => {
      if (this.isOnline) {
        const pendingSync = await sqliteDatabase.getPendingSync();
        if (pendingSync.length > 0) {
          this.syncPendingData();
        }
      }
    }, this.config.syncInterval);
  }

  // Cache Management using SQLite
  async setCacheData(key: string, data: any, expiry?: number): Promise<void> {
    try {
      const expiryTime = expiry || this.config.cacheExpiry;
      await sqliteDatabase.saveCacheData(key, data, expiryTime / (60 * 1000)); // Convert to minutes

      console.log(`💾 OfflineStorage - Cached data for key: ${key}`);
    } catch (error) {
      console.error('❌ OfflineStorage - Failed to cache data:', error);
    }
  }

  async getCacheData(key: string): Promise<any | null> {
    try {
      const data = await sqliteDatabase.getCacheData(key);

      if (data) {
        console.log(
          `📦 OfflineStorage - Retrieved cached data for key: ${key}`
        );
        return data;
      }

      console.log(
        `⏰ OfflineStorage - Cache expired or not found for key: ${key}`
      );
      return null;
    } catch (error) {
      console.error('❌ OfflineStorage - Failed to get cached data:', error);
      return null;
    }
  }

  async clearCache(): Promise<void> {
    try {
      await sqliteDatabase.clearTable('api_cache');
      console.log('🧹 OfflineStorage - Cache cleared');
    } catch (error) {
      console.error('❌ OfflineStorage - Failed to clear cache:', error);
    }
  }

  // Sync Queue Management using SQLite
  async addToSyncQueue(
    item: Omit<SyncQueueItem, 'id' | 'timestamp' | 'retryCount'>
  ): Promise<void> {
    try {
      await sqliteDatabase.addToSyncQueue(item);

      console.log(
        `📝 OfflineStorage - Added to sync queue: ${item.action} ${item.endpoint}`
      );
    } catch (error) {
      console.error('❌ OfflineStorage - Failed to add to sync queue:', error);
    }
  }

  private async syncPendingData(): Promise<void> {
    try {
      const pendingSync = await sqliteDatabase.getPendingSync();

      if (pendingSync.length === 0) return;

      console.log(
        `🔄 OfflineStorage - Syncing ${pendingSync.length} pending items...`
      );

      const successfulItems: string[] = [];
      const failedItems: any[] = [];

      for (const item of pendingSync) {
        try {
          const success = await this.processSyncItem(item);
          if (success) {
            successfulItems.push(item.id);
            await sqliteDatabase.markSynced(item.id);
          } else {
            failedItems.push(item);
          }
        } catch (error) {
          console.error(
            `❌ OfflineStorage - Failed to sync item ${item.id}:`,
            error
          );
          failedItems.push(item);
        }
      }

      console.log(
        `✅ OfflineStorage - Sync completed. Success: ${successfulItems.length}, Failed: ${failedItems.length}`
      );
    } catch (error) {
      console.error('❌ OfflineStorage - Failed to sync pending data:', error);
    }
  }

  private async processSyncItem(item: any): Promise<boolean> {
    try {
      // This would integrate with your actual API service
      // For now, we'll simulate the API call
      const response = await this.makeApiCall(item);
      return response.success;
    } catch (error) {
      console.error(
        `❌ OfflineStorage - API call failed for ${item.id}:`,
        error
      );
      return false;
    }
  }

  private async makeApiCall(item: SyncQueueItem): Promise<any> {
    // This is a placeholder - integrate with your actual API service
    return new Promise(resolve => {
      setTimeout(() => {
        resolve({ success: Math.random() > 0.3 }); // 70% success rate for demo
      }, 1000);
    });
  }

  // Offline-first data fetching
  async getDataWithOfflineFallback<T>(
    key: string,
    fetchFunction: () => Promise<T>,
    options: {
      useCache?: boolean;
      forceRefresh?: boolean;
    } = {}
  ): Promise<{
    data: T | null;
    source: 'cache' | 'network' | 'offline';
    error?: string;
  }> {
    const { useCache = true, forceRefresh = false } = options;

    try {
      // If online and not forcing refresh, try network first
      if (this.isOnline && !forceRefresh) {
        try {
          const networkData = await fetchFunction();
          await this.setCacheData(key, networkData);
          console.log(`🌐 OfflineStorage - Data fetched from network: ${key}`);
          return { data: networkData, source: 'network' };
        } catch (error) {
          console.log(
            `⚠️ OfflineStorage - Network failed, trying cache: ${key}`
          );
        }
      }

      // Try cache
      if (useCache) {
        const cachedData = await this.getCacheData(key);
        if (cachedData) {
          console.log(`📦 OfflineStorage - Data from cache: ${key}`);
          return { data: cachedData, source: 'cache' };
        }
      }

      // If offline and no cache, return offline data from SQLite
      if (!this.isOnline) {
        const offlineData = await this.getOfflineData(key);
        if (offlineData) {
          console.log(`📴 OfflineStorage - Data from offline storage: ${key}`);
          return { data: offlineData, source: 'offline' };
        }
      }

      console.log(`❌ OfflineStorage - No data available for: ${key}`);
      return { data: null, source: 'offline' };
    } catch (error) {
      console.error(
        `❌ OfflineStorage - Error fetching data for ${key}:`,
        error
      );
      return {
        data: null,
        source: 'offline',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // Offline data storage using SQLite
  async setOfflineData(key: string, data: any): Promise<void> {
    try {
      const offlineData = {
        id: key,
        table_name: 'offline_data',
        data: JSON.stringify(data),
        timestamp: Date.now(),
        version: '1.0',
      };

      await sqliteDatabase.saveData('dashboard_data', offlineData);
      console.log(`📴 OfflineStorage - Stored offline data: ${key}`);
    } catch (error) {
      console.error('❌ OfflineStorage - Failed to store offline data:', error);
    }
  }

  async getOfflineData(key: string): Promise<any | null> {
    try {
      const result = await sqliteDatabase.getData(
        'dashboard_data',
        `SELECT * FROM dashboard_data WHERE id = ?`,
        [key]
      );

      if (result.length > 0) {
        return JSON.parse(result[0].data);
      }

      return null;
    } catch (error) {
      console.error('❌ OfflineStorage - Failed to get offline data:', error);
      return null;
    }
  }

  // Activity-specific methods
  async saveActivity(activity: any): Promise<void> {
    try {
      await sqliteDatabase.saveActivity(activity);
      console.log(`📝 OfflineStorage - Saved activity: ${activity.id}`);
    } catch (error) {
      console.error('❌ OfflineStorage - Failed to save activity:', error);
    }
  }

  async getActivities(limit?: number): Promise<any[]> {
    try {
      const activities = await sqliteDatabase.getActivities(limit);
      console.log(
        `📋 OfflineStorage - Retrieved ${activities.length} activities`
      );
      return activities;
    } catch (error) {
      console.error('❌ OfflineStorage - Failed to get activities:', error);
      return [];
    }
  }

  // Bazar-specific methods
  async saveBazarEntry(bazar: any): Promise<void> {
    try {
      await sqliteDatabase.saveBazarEntry(bazar);
      console.log(`📝 OfflineStorage - Saved bazar entry: ${bazar.id}`);
    } catch (error) {
      console.error('❌ OfflineStorage - Failed to save bazar entry:', error);
    }
  }

  async getBazarEntries(limit?: number): Promise<any[]> {
    try {
      const entries = await sqliteDatabase.getBazarEntries(limit);
      console.log(
        `📋 OfflineStorage - Retrieved ${entries.length} bazar entries`
      );
      return entries;
    } catch (error) {
      console.error('❌ OfflineStorage - Failed to get bazar entries:', error);
      return [];
    }
  }

  // Meal-specific methods
  async saveMealEntry(meal: any): Promise<void> {
    try {
      await sqliteDatabase.saveMealEntry(meal);
      console.log(`📝 OfflineStorage - Saved meal entry: ${meal.id}`);
    } catch (error) {
      console.error('❌ OfflineStorage - Failed to save meal entry:', error);
    }
  }

  async getMealEntries(limit?: number): Promise<any[]> {
    try {
      const entries = await sqliteDatabase.getMealEntries(limit);
      console.log(
        `📋 OfflineStorage - Retrieved ${entries.length} meal entries`
      );
      return entries;
    } catch (error) {
      console.error('❌ OfflineStorage - Failed to get meal entries:', error);
      return [];
    }
  }

  // Statistics methods
  async saveStatistics(type: string, data: any): Promise<void> {
    try {
      await sqliteDatabase.saveStatistics(type, data);
      console.log(`📊 OfflineStorage - Saved statistics: ${type}`);
    } catch (error) {
      console.error('❌ OfflineStorage - Failed to save statistics:', error);
    }
  }

  async getStatistics(type: string): Promise<any | null> {
    try {
      const stats = await sqliteDatabase.getStatistics(type);
      console.log(`📊 OfflineStorage - Retrieved statistics: ${type}`);
      return stats;
    } catch (error) {
      console.error('❌ OfflineStorage - Failed to get statistics:', error);
      return null;
    }
  }

  // Utility methods
  isNetworkAvailable(): boolean {
    return this.isOnline;
  }

  async getSyncQueueLength(): Promise<number> {
    try {
      const pendingSync = await sqliteDatabase.getPendingSync();
      return pendingSync.length;
    } catch (error) {
      console.error(
        '❌ OfflineStorage - Failed to get sync queue length:',
        error
      );
      return 0;
    }
  }

  async getPendingCount(): Promise<number> {
    try {
      const pendingSync = await sqliteDatabase.getPendingSync();
      return pendingSync.length;
    } catch (error) {
      console.error('❌ OfflineStorage - Failed to get pending count:', error);
      return 0;
    }
  }

  async getPendingRequests(): Promise<any[]> {
    try {
      const pendingSync = await sqliteDatabase.getPendingSync();
      return pendingSync;
    } catch (error) {
      console.error('❌ Error getting pending requests:', error);
      // Try to reset database if it's corrupted
      if (
        error instanceof Error &&
        (error.message.includes('NullPointerException') ||
          error.message.includes('prepareAsync'))
      ) {
        console.log(
          '🔄 OfflineStorage - Database corrupted, attempting reset...'
        );
        try {
          await this.resetDatabase();
        } catch (resetError) {
          console.error(
            '❌ OfflineStorage - Database reset failed:',
            resetError
          );
        }
      }
      return [];
    }
  }

  async storeRequest(request: any): Promise<string> {
    try {
      const requestId = `request_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`;
      const syncItem = {
        id: requestId,
        action: 'CREATE',
        endpoint: request.endpoint,
        data: JSON.stringify(request.data),
        timestamp: Date.now(),
        retryCount: 0,
      };

      await sqliteDatabase.addToSyncQueue(syncItem);
      console.log(
        `💾 OfflineStorage - Stored request for offline retry: ${requestId}`
      );
      return requestId;
    } catch (error) {
      console.error('❌ OfflineStorage - Failed to store request:', error);
      throw error;
    }
  }

  async removeRequest(requestId: string): Promise<void> {
    try {
      await sqliteDatabase.deleteData('sync_queue', requestId);
      console.log(`✅ Removed request: ${requestId}`);
    } catch (error) {
      console.error('❌ Error removing request:', error);
    }
  }

  async getStorageSize(): Promise<number> {
    try {
      const allData = await sqliteDatabase.getData('sync_queue');
      return allData.length;
    } catch (error) {
      console.error('❌ Error getting storage size:', error);
      return 0;
    }
  }

  async clearSyncQueue(): Promise<void> {
    try {
      await sqliteDatabase.clearTable('sync_queue');
      console.log('🧹 OfflineStorage - Sync queue cleared');
    } catch (error) {
      console.error('❌ OfflineStorage - Failed to clear sync queue:', error);
    }
  }

  async clearAllRequests(): Promise<void> {
    try {
      await sqliteDatabase.clearTable('sync_queue');
      console.log('🧹 OfflineStorage - All requests cleared');
    } catch (error) {
      console.error('❌ OfflineStorage - Failed to clear all requests:', error);
    }
  }

  // Database management
  async getDatabaseInfo(): Promise<any> {
    try {
      const tables = [
        'activities',
        'bazar_entries',
        'meal_entries',
        'sync_queue',
        'dashboard_data',
        'api_cache',
      ];
      const info: any = {};

      for (const table of tables) {
        const count = await sqliteDatabase.executeQuery(
          `SELECT COUNT(*) as count FROM ${table}`
        );
        info[table] = count[0]?.count || 0;
      }

      return info;
    } catch (error) {
      console.error('❌ OfflineStorage - Failed to get database info:', error);
      return {};
    }
  }

  // Database management
  async resetDatabase(): Promise<void> {
    try {
      console.log('🔄 OfflineStorage - Resetting database...');
      await sqliteDatabase.forceResetDatabase();
      console.log('✅ OfflineStorage - Database reset completed');
    } catch (error) {
      console.error('❌ OfflineStorage - Failed to reset database:', error);
      throw error;
    }
  }

  // Cleanup
  destroy(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    // Close database connection
    sqliteDatabase.close().catch(error => {
      console.error('❌ OfflineStorage - Failed to close database:', error);
    });
  }
}

// Export singleton instance
export const offlineStorage = new OfflineStorageService();
