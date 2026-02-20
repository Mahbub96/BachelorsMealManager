import NetInfo from '@react-native-community/netinfo';
import databaseHealthMonitor from './databaseHealthMonitor';
import databaseInitializer from './databaseInitializer';
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
  private netInfoUnsubscribe: (() => void) | null = null;
  private isSyncing: boolean = false; // Prevent concurrent syncs

  constructor(config: Partial<OfflineConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    // Initialize asynchronously to avoid blocking the constructor
    setTimeout(() => {
      this.initializeOfflineService();
    }, 100);
  }

  private async initializeOfflineService() {
    const maxRetries = 3;
    let retryCount = 0;

    while (retryCount < maxRetries) {
      try {

        // Initialize SQLite database using the initializer
        await databaseInitializer.initialize();

        // Verify database is ready
        const isReady = await databaseInitializer.isReady();
        if (!isReady) {
          throw new Error('Database not ready after initialization');
        }

        // Set up network monitoring
        this.setupNetworkMonitoring();

        // Start sync interval
        this.startSyncInterval();

        // Health monitoring is started by the database initializer

        // Clear expired cache
        try {
          await sqliteDatabase.clearExpiredCache();
        } catch (cacheError) {
          // Non-critical - continue
        }
        return; // Success, exit the retry loop
      } catch (error) {
        retryCount++;
        if (retryCount >= maxRetries) {
          console.error('OfflineStorage - Failed to initialize after max retries:', error);
        }

        // If we've had multiple failures, try emergency reset
        if (retryCount >= 2) {
          try {
            await sqliteDatabase.emergencyReset();
            // Continue with next attempt
          } catch (resetError) {
            try {
              await sqliteDatabase.bypassDatabase();
              return; // Exit retry loop
            } catch (bypassError) {
              console.error('OfflineStorage - All recovery methods failed:', bypassError);
            }
          }
        }

        if (retryCount >= maxRetries) {
          return;
        }

        // Wait before retrying with exponential backoff
        await new Promise(resolve =>
          setTimeout(resolve, 1000 * Math.pow(2, retryCount - 1))
        );
      }
    }
  }

  private setupNetworkMonitoring() {
    // Store unsubscribe function to prevent memory leak
    this.netInfoUnsubscribe = NetInfo.addEventListener(state => {
      const wasOnline = this.isOnline;
      this.isOnline = state.isConnected ?? false;

      if (!wasOnline && this.isOnline) {
        // Only sync if not already syncing
        if (!this.isSyncing) {
          this.syncPendingData();
        }
      }
    });
  }

  private startSyncInterval() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    this.syncInterval = setInterval(async () => {
      if (this.isOnline && !this.isSyncing) {
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
    } catch (error) {
      console.error('OfflineStorage - Failed to cache data:', error);
    }
  }

  async getCacheData(key: string): Promise<any | null> {
    try {
      const data = await sqliteDatabase.getCacheData(key);

      if (data) {
        return data;
      }

      return null;
    } catch (error) {
      console.error('OfflineStorage - Failed to get cached data:', error);
      return null;
    }
  }

  async clearCache(): Promise<void> {
    try {
      await sqliteDatabase.clearTable('api_cache');
    } catch (error) {
      console.error('OfflineStorage - Failed to clear cache:', error);
    }
  }

  async clearDashboardData(): Promise<void> {
    try {
      await sqliteDatabase.clearTable('dashboard_data');
    } catch (error) {
      console.error('OfflineStorage - Failed to clear dashboard data:', error);
    }
  }

  async ensureDashboardDataExists(): Promise<void> {
    try {
      // Check if dashboard_data table exists
      const tableExists = await sqliteDatabase.executeQuery(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='dashboard_data'"
      );

      if (tableExists.length === 0) {
        await sqliteDatabase.init();

        // Verify the table was created
        const verifyTable = await sqliteDatabase.executeQuery(
          "SELECT name FROM sqlite_master WHERE type='table' AND name='dashboard_data'"
        );

        if (verifyTable.length === 0) {
          console.error('OfflineStorage - Failed to create dashboard_data table');
        }
      }
    } catch (error) {
      console.error(
        '❌ OfflineStorage - Failed to ensure dashboard data exists:',
        error
      );
      throw error;
    }
  }

  async initializeDashboardData(): Promise<void> {
    try {
      // Ensure the database and tables exist
      await this.ensureDashboardDataExists();

      // Test saving and retrieving data
      const testData = {
        test: 'dashboard_data_initialized',
        timestamp: Date.now(),
      };
      await this.setOfflineData('test_dashboard', testData);

      // Test data retrieval (non-critical)
      const retrievedData = await this.getOfflineData('test_dashboard');
      if (!retrievedData || retrievedData.test !== testData.test) {
        // Non-critical test failure - continue
      }
    } catch (error) {
      // Non-critical - don't throw error to prevent blocking the app
    }
  }

  // Sync Queue Management using SQLite
  async addToSyncQueue(
    item: Omit<SyncQueueItem, 'id' | 'timestamp' | 'retryCount'>
  ): Promise<void> {
    try {
      await sqliteDatabase.addToSyncQueue(item);
    } catch (error) {
      console.error('OfflineStorage - Failed to add to sync queue:', error);
    }
  }

  private async syncPendingData(): Promise<void> {
    // Prevent concurrent syncs
    if (this.isSyncing) {
      return;
    }

    // Check if online before starting sync
    if (!this.isOnline) {
      return;
    }

    this.isSyncing = true;

    try {
      const pendingSync = await sqliteDatabase.getPendingSync();

      if (pendingSync.length === 0) {
        this.isSyncing = false;
        return;
      }

      const successfulItems: string[] = [];
      const failedItems: any[] = [];

      for (const item of pendingSync) {
        // Check if still online before processing each item
        if (!this.isOnline) {
          break; // Stop syncing if network is lost
        }

        try {
          const success = await this.processSyncItem(item);
          if (success) {
            successfulItems.push(item.id);
            // Mark as synced BEFORE clearing data to prevent data loss
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

      // Clear synced data - only clear items that were actually synced
      if (successfulItems.length > 0) {
        // Check if new items were added during sync (to prevent clearing unsynced data)
        const currentPendingSync = await sqliteDatabase.getPendingSync();
        const syncedItemIds = new Set(successfulItems);
        const hasNewItems = currentPendingSync.some(item => !syncedItemIds.has(item.id));

        if (failedItems.length === 0 && !hasNewItems) {
          // All items synced successfully AND no new items added during sync
          await this.clearAllTablesAfterSync();
          // Clear sync_queue since all items are synced
          try {
            await sqliteDatabase.clearTable('sync_queue');
          } catch (error) {
            // Non-critical - continue
          }
        } else {
          // Partial sync or new items added - only clear successfully synced items
          for (const itemId of successfulItems) {
            const item = pendingSync.find(i => i.id === itemId);
            if (item) {
              await this.clearSyncedData(item);
            }
          }
        }
      }
    } catch (error) {
      console.error('❌ OfflineStorage - Failed to sync pending data:', error);
    } finally {
      // Always reset sync flag, even on error
      this.isSyncing = false;
    }
  }

  private async processSyncItem(item: any): Promise<boolean> {
    try {

      // Make API call with timeout
      const syncPromise = this.makeApiCall(item);
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Sync timeout')), 30000)
      );

      const response = await Promise.race([syncPromise, timeoutPromise]) as { success?: boolean } | undefined;

      if (response && response.success) {
        // Clear the corresponding SQLite data after successful API submission
        try {
          await this.clearSyncedData(item);
        } catch (clearError) {
          // Continue even if clearing fails - item is already synced
        }

        return true;
      } else {
        return false;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(
        `❌ OfflineStorage - API call failed for ${item.id}:`,
        errorMessage
      );
      return false;
    }
  }

  // Clear synced data from SQLite after successful API submission
  private async clearSyncedData(item: any): Promise<void> {
    try {
      // Extract the actual data ID from the item
      // item.data should be an object (parsed from JSON in getPendingSync)
      // If item.data is an object, use item.data.id
      // Otherwise, try to extract ID from the sync queue item itself
      let itemId: string | undefined;
      
      if (item.data && typeof item.data === 'object' && item.data.id) {
        itemId = item.data.id;
      } else if (item.data && typeof item.data === 'string') {
        // If data is still a string, try to parse it
        try {
          const parsedData = JSON.parse(item.data);
          itemId = parsedData?.id;
        } catch (e) {
          // Failed to parse - skip deletion
        }
      }
      
      // If we still don't have an ID, skip deletion to prevent deleting wrong data
      if (!itemId) {
        return;
      }

      // Determine which table to clear based on endpoint
      if (item.endpoint.includes('/bazar')) {
        await sqliteDatabase.deleteData('bazar_entries', itemId);
      } else if (item.endpoint.includes('/meals')) {
        await sqliteDatabase.deleteData('meal_entries', itemId);
      } else if (item.endpoint.includes('/payments')) {
        await sqliteDatabase.deleteData('payment_entries', itemId);
      } else if (item.endpoint.includes('/users')) {
        await sqliteDatabase.deleteData('user_data', itemId);
      } else {
        // Generic clear from activities table
        await sqliteDatabase.deleteData('activities', itemId);
      }
    } catch (error) {
      console.error('❌ OfflineStorage - Failed to clear synced data:', error);
      // Don't throw - this is cleanup, continue even if it fails
    }
  }

  // Clear all tables after successful sync
  private async clearAllTablesAfterSync(): Promise<void> {
    try {
      const tablesToClear = [
        'activities',
        'bazar_entries',
        'meal_entries',
        'payment_entries',
        'user_data',
        'dashboard_data',
        'api_cache',
      ];

      // Clear each table
      for (const table of tablesToClear) {
        try {
          await sqliteDatabase.clearTable(table);
        } catch (error) {
          // Continue with other tables even if one fails
        }
      }
    } catch (error) {
      console.error('OfflineStorage - Failed to clear all tables:', error);
      // Don't throw - this is a cleanup operation
    }
  }

  // Read-only endpoints stored as CREATE when offline; must be sent as GET on sync
  private static readonly GET_ONLY_ENDPOINTS = [
    '/api/bazar/user',
    '/api/activity/recent',
    '/api/user-stats/dashboard',
    '/api/user-stats/me',
    '/api/meals',
    '/api/health',
  ];

  private isGetOnlyEndpoint(endpoint: string): boolean {
    return OfflineStorageService.GET_ONLY_ENDPOINTS.some(
      (p) => endpoint === p || endpoint.startsWith(p + '?')
    );
  }

  private async makeApiCall(item: SyncQueueItem): Promise<any> {
    try {
      const httpClient = (await import('./httpClient')).default;

      let response;
      switch (item.action) {
        case 'CREATE': {
          const useGet =
            (item.data && item.data._method === 'GET') ||
            this.isGetOnlyEndpoint(item.endpoint);
          if (useGet) {
            response = await httpClient.get(item.endpoint);
          } else {
            response = await httpClient.post(item.endpoint, item.data);
          }
          break;
        }
        case 'UPDATE':
          response = await httpClient.put(item.endpoint, item.data);
          break;
        case 'DELETE':
          response = await httpClient.delete(item.endpoint);
          break;
        default:
          throw new Error(`Unknown action: ${item.action}`);
      }

      // Check if response indicates success
      if (response && response.success !== false) {
        return { success: true, data: response.data || response };
      } else {
        return {
          success: false,
          error: response?.error || 'API call failed',
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
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
          if (networkData != null) {
            await this.setCacheData(key, networkData);
            return { data: networkData, source: 'network' };
          }
          // API returned no data (e.g. 404); fall through to cache/offline
        } catch (error) {
          // Network failed, try cache
        }
      }

      // Try cache
      if (useCache) {
        const cachedData = await this.getCacheData(key);
        if (cachedData) {
          return { data: cachedData, source: 'cache' };
        }
      }

      // If offline and no cache, return offline data from SQLite
      if (!this.isOnline) {
        const offlineData = await this.getOfflineData(key);
        if (offlineData) {
          return { data: offlineData, source: 'offline' };
        }
      }
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
    if (data === undefined || data === null) return;
    try {
      const offlineData = {
        id: key,
        table_name: 'dashboard_data',
        data: typeof data === 'string' ? data : JSON.stringify(data),
        timestamp: Date.now(),
        version: '1.0',
      };

      await sqliteDatabase.saveData('dashboard_data', offlineData);
    } catch (error) {
      console.error('❌ OfflineStorage - Failed to store offline data:', error);
    }
  }

  async getOfflineData(key: string): Promise<any | null> {
    try {
      // First check if the table exists
      const tableExists = await sqliteDatabase.executeQuery(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='dashboard_data'"
      );

      if (tableExists.length === 0) {
        console.log(
          '⚠️ OfflineStorage - dashboard_data table does not exist, creating...'
        );
        await this.ensureDashboardDataExists();
        return null;
      }

      const result = await sqliteDatabase.getData(
        'dashboard_data',
        `SELECT * FROM dashboard_data WHERE id = ?`,
        [key]
      );

      if (result.length > 0) {
        // getData already parses JSON fields, so check if it's already an object
        const data = result[0].data;
        let parsedData;
        
        if (typeof data === 'string') {
          // If it's still a string, parse it
          try {
            parsedData = JSON.parse(data);
          } catch (parseError) {
            return null;
          }
        } else {
          // Already parsed by getData
          parsedData = data;
        }
        
        return parsedData;
      }

      return null;
    } catch (error) {
      console.error('❌ OfflineStorage - Failed to get offline data:', error);

      // Try to recover by ensuring tables exist
      try {
        await this.ensureDashboardDataExists();
      } catch (recoveryError) {
        console.error(
          '❌ OfflineStorage - Failed to recover dashboard data:',
          recoveryError
        );
      }

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

  // Form submission methods with offline-first approach
  async submitBazarForm(formData: any): Promise<{
    success: boolean;
    message: string;
    isOffline: boolean;
    syncId?: string;
  }> {
    try {
      // Always save to SQLite first
      await sqliteDatabase.saveBazarEntry(formData);

      // Check if online
      if (this.isOnline) {
        try {
          // Try to submit to API immediately
          const httpClient = (await import('./httpClient')).default;
          const response = await httpClient.post('/api/bazar', formData);

          if (response.success) {
            console.log(
              '✅ OfflineStorage - Bazar form submitted to API successfully'
            );
            return {
              success: true,
              message: 'Form submitted successfully',
              isOffline: false,
            };
          } else {
            throw new Error(response.error || 'API submission failed');
          }
        } catch (apiError) {
          console.log(
            '⚠️ OfflineStorage - API submission failed, will sync later'
          );
          // Add to sync queue for later
          await this.addToSyncQueue({
            action: 'CREATE',
            endpoint: '/api/bazar',
            data: formData,
          });

          return {
            success: true,
            message: 'Form saved offline, will sync when network is restored',
            isOffline: true,
            syncId: formData.id,
          };
        }
      } else {
        // Offline - add to sync queue
        await this.addToSyncQueue({
          action: 'CREATE',
          endpoint: '/api/bazar',
          data: formData,
        });

        console.log('📱 OfflineStorage - Bazar form saved offline');
        return {
          success: true,
          message: 'Form saved offline, will sync when network is restored',
          isOffline: true,
          syncId: formData.id,
        };
      }
    } catch (error) {
      console.error('❌ OfflineStorage - Failed to submit bazar form:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
        isOffline: true,
      };
    }
  }

  async submitMealForm(formData: any): Promise<{
    success: boolean;
    message: string;
    isOffline: boolean;
    syncId?: string;
  }> {
    try {
      // Always save to SQLite first
      await sqliteDatabase.saveMealEntry(formData);

      // Check if online
      if (this.isOnline) {
        try {
          // Try to submit to API immediately
          const httpClient = (await import('./httpClient')).default;
          const response = await httpClient.post('/api/meals', formData);

          if (response.success) {
            console.log(
              '✅ OfflineStorage - Meal form submitted to API successfully'
            );
            return {
              success: true,
              message: 'Form submitted successfully',
              isOffline: false,
            };
          } else {
            throw new Error(response.error || 'API submission failed');
          }
        } catch (apiError) {
          console.log(
            '⚠️ OfflineStorage - API submission failed, will sync later'
          );
          // Add to sync queue for later
          await this.addToSyncQueue({
            action: 'CREATE',
            endpoint: '/api/meals',
            data: formData,
          });

          return {
            success: true,
            message: 'Form saved offline, will sync when network is restored',
            isOffline: true,
            syncId: formData.id,
          };
        }
      } else {
        // Offline - add to sync queue
        await this.addToSyncQueue({
          action: 'CREATE',
          endpoint: '/api/meals',
          data: formData,
        });

        console.log('📱 OfflineStorage - Meal form saved offline');
        return {
          success: true,
          message: 'Form saved offline, will sync when network is restored',
          isOffline: true,
          syncId: formData.id,
        };
      }
    } catch (error) {
      console.error('❌ OfflineStorage - Failed to submit meal form:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
        isOffline: true,
      };
    }
  }

  async submitPaymentForm(formData: any): Promise<{
    success: boolean;
    message: string;
    isOffline: boolean;
    syncId?: string;
  }> {
    try {
      // Always save to SQLite first
      await sqliteDatabase.savePaymentEntryData(formData);

      // Check if online
      if (this.isOnline) {
        try {
          // Try to submit to API immediately
          const httpClient = (await import('./httpClient')).default;
          const response = await httpClient.post('/api/payments', formData);

          if (response.success) {
            console.log(
              '✅ OfflineStorage - Payment form submitted to API successfully'
            );
            return {
              success: true,
              message: 'Form submitted successfully',
              isOffline: false,
            };
          } else {
            throw new Error(response.error || 'API submission failed');
          }
        } catch (apiError) {
          console.log(
            '⚠️ OfflineStorage - API submission failed, will sync later'
          );
          // Add to sync queue for later
          await this.addToSyncQueue({
            action: 'CREATE',
            endpoint: '/api/payments',
            data: formData,
          });

          return {
            success: true,
            message: 'Form saved offline, will sync when network is restored',
            isOffline: true,
            syncId: formData.id,
          };
        }
      } else {
        // Offline - add to sync queue
        await this.addToSyncQueue({
          action: 'CREATE',
          endpoint: '/api/payments',
          data: formData,
        });

        console.log('📱 OfflineStorage - Payment form saved offline');
        return {
          success: true,
          message: 'Form saved offline, will sync when network is restored',
          isOffline: true,
          syncId: formData.id,
        };
      }
    } catch (error) {
      console.error(
        '❌ OfflineStorage - Failed to submit payment form:',
        error
      );
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
        isOffline: true,
      };
    }
  }

  // Generic form submission method
  async submitForm(
    endpoint: string,
    formData: any,
    action: 'CREATE' | 'UPDATE' | 'DELETE' = 'CREATE'
  ): Promise<{
    success: boolean;
    message: string;
    isOffline: boolean;
    syncId?: string;
  }> {
    try {
      // Generate unique ID for the form data
      const formId =
        formData.id ||
        `form_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const dataWithId = { ...formData, id: formId };

      // Save to appropriate SQLite table based on endpoint
      if (endpoint.includes('/bazar')) {
        await sqliteDatabase.saveBazarEntry(dataWithId);
      } else if (endpoint.includes('/meals')) {
        await sqliteDatabase.saveMealEntry(dataWithId);
      } else if (endpoint.includes('/payments')) {
        await sqliteDatabase.savePaymentEntryData(dataWithId);
      } else {
        // Generic save to activities table
        await sqliteDatabase.saveActivity({
          ...dataWithId,
          type: 'form_submission',
          endpoint: endpoint,
        });
      }


      // Check if online
      if (this.isOnline) {
        try {
          // Try to submit to API immediately
          const httpClient = (await import('./httpClient')).default;
          let response;

          switch (action) {
            case 'CREATE':
              response = await httpClient.post(endpoint, dataWithId);
              break;
            case 'UPDATE':
              response = await httpClient.put(endpoint, dataWithId);
              break;
            case 'DELETE':
              response = await httpClient.delete(endpoint);
              break;
          }

          if (response.success) {
            console.log(
              `✅ OfflineStorage - Form submitted to API successfully: ${endpoint}`
            );
            return {
              success: true,
              message: 'Form submitted successfully',
              isOffline: false,
            };
          } else {
            throw new Error(response.error || 'API submission failed');
          }
        } catch (apiError) {
          console.log(
            '⚠️ OfflineStorage - API submission failed, will sync later'
          );
          // Add to sync queue for later
          await this.addToSyncQueue({
            action: action,
            endpoint: endpoint,
            data: dataWithId,
          });

          return {
            success: true,
            message: 'Form saved offline, will sync when network is restored',
            isOffline: true,
            syncId: formId,
          };
        }
      } else {
        // Offline - add to sync queue
        await this.addToSyncQueue({
          action: action,
          endpoint: endpoint,
          data: dataWithId,
        });

        console.log(`📱 OfflineStorage - Form saved offline for ${endpoint}`);
        return {
          success: true,
          message: 'Form saved offline, will sync when network is restored',
          isOffline: true,
          syncId: formId,
        };
      }
    } catch (error) {
      console.error('❌ OfflineStorage - Failed to submit form:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
        isOffline: true,
      };
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
      return sqliteDatabase.getPendingSyncCount
        ? await sqliteDatabase.getPendingSyncCount()
        : 0;
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
      // Minimal fix: Store method and headers in data for retry
      const requestData = {
        ...request.data,
        _method: request.method,
        _headers: request.headers,
      };
      
      const syncItem = {
        id: requestId,
        action: 'CREATE',
        endpoint: request.endpoint,
        data: requestData, // Don't stringify here - addToSyncQueue handles it
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
    } catch (error) {
      console.error('❌ Error removing request:', error);
    }
  }

  /** Remove all pending requests for an endpoint (stops duplicate GET retry storm) */
  async removePendingRequestsByEndpoint(endpoint: string): Promise<void> {
    try {
      await sqliteDatabase.removePendingSyncByEndpoint(endpoint);
    } catch (error) {
      console.error('❌ Error removing pending requests by endpoint:', error);
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
    } catch (error) {
      console.error('❌ OfflineStorage - Failed to clear sync queue:', error);
    }
  }

  async clearAllRequests(): Promise<void> {
    try {
      await sqliteDatabase.clearTable('sync_queue');
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
      await sqliteDatabase.softResetDatabase();
    } catch (error) {
      console.error(
        '❌ OfflineStorage - Failed to reset database:',
        error instanceof Error ? error.message : 'Unknown error'
      );

      // Try hard reset as last resort
      try {
        await sqliteDatabase.resetDatabase();
      } catch (hardResetError) {
        console.error(
          '❌ OfflineStorage - Hard reset also failed:',
          hardResetError instanceof Error
            ? hardResetError.message
            : 'Unknown error'
        );
        throw error;
      }
    }
  }

  // Cleanup
  destroy(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }

    // Unsubscribe from NetInfo to prevent memory leak
    if (this.netInfoUnsubscribe) {
      this.netInfoUnsubscribe();
      this.netInfoUnsubscribe = null;
    }

    // Stop health monitoring
    databaseHealthMonitor.destroy();

    // Destroy database initializer
    databaseInitializer.destroy();

    // Close database connection
    sqliteDatabase.close().catch(error => {
      console.error('❌ OfflineStorage - Failed to close database:', error);
    });
  }
}

// Export singleton instance
export const offlineStorage = new OfflineStorageService();
