import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { API_ENDPOINTS, ApiResponse } from './config';
import httpClient from './httpClient';

// Background sync types
export interface SyncTask {
  id: string;
  type: 'meal' | 'bazar' | 'user' | 'notification' | 'data';
  action: 'create' | 'update' | 'delete' | 'sync';
  data: Record<string, any>;
  priority: 'high' | 'normal' | 'low';
  createdAt: Date;
  retryCount: number;
  maxRetries: number;
  lastAttempt?: Date;
  error?: string;
}

export interface SyncStatus {
  isRunning: boolean;
  lastSyncTime: Date | null;
  pendingTasks: number;
  failedTasks: number;
  totalTasks: number;
  syncProgress: number; // 0-100
}

export interface BackgroundSyncService {
  // Task management
  addTask: (
    task: Omit<SyncTask, 'id' | 'createdAt' | 'retryCount'>
  ) => Promise<string>;
  removeTask: (taskId: string) => Promise<boolean>;
  getPendingTasks: () => Promise<SyncTask[]>;
  clearAllTasks: () => Promise<void>;

  // Sync operations
  startSync: () => Promise<boolean>;
  stopSync: () => Promise<void>;
  syncNow: () => Promise<boolean>;
  getSyncStatus: () => Promise<SyncStatus>;

  // Data management
  syncMeals: () => Promise<boolean>;
  syncBazar: () => Promise<boolean>;
  syncUsers: () => Promise<boolean>;
  syncAll: () => Promise<boolean>;

  // Utility methods
  isOnline: () => boolean;
  getSyncHistory: (limit?: number) => Promise<SyncTask[]>;
  clearSyncHistory: () => Promise<void>;
  retryFailedTasks: () => Promise<boolean>;
}

// Background sync service implementation
class BackgroundSyncServiceImpl implements BackgroundSyncService {
  private syncStatus: SyncStatus = {
    isRunning: false,
    lastSyncTime: null,
    pendingTasks: 0,
    failedTasks: 0,
    totalTasks: 0,
    syncProgress: 0,
  };

  private syncInterval: ReturnType<typeof setInterval> | null = null;
  private readonly SYNC_INTERVAL = 5 * 60 * 1000; // 5 minutes
  private readonly STORAGE_KEY = 'background_sync_tasks';

  async addTask(
    task: Omit<SyncTask, 'id' | 'createdAt' | 'retryCount'>
  ): Promise<string> {
    try {
      const fullTask: SyncTask = {
        ...task,
        id: this.generateTaskId(),
        createdAt: new Date(),
        retryCount: 0,
      };

      const tasks = await this.getStoredTasks();
      tasks.push(fullTask);
      await this.storeTasks(tasks);

      console.log(`📝 Added sync task: ${task.type} - ${task.action}`);
      return fullTask.id;
    } catch (error) {
      console.error('❌ Error adding sync task:', error);
      throw error;
    }
  }

  async removeTask(taskId: string): Promise<boolean> {
    try {
      const tasks = await this.getStoredTasks();
      const filteredTasks = tasks.filter(task => task.id !== taskId);
      await this.storeTasks(filteredTasks);

      console.log(`🗑️ Removed sync task: ${taskId}`);
      return true;
    } catch (error) {
      console.error('❌ Error removing sync task:', error);
      return false;
    }
  }

  async getPendingTasks(): Promise<SyncTask[]> {
    try {
      const tasks = await this.getStoredTasks();
      return tasks.filter(task => task.retryCount < task.maxRetries);
    } catch (error) {
      console.error('❌ Error getting pending tasks:', error);
      return [];
    }
  }

  async clearAllTasks(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.STORAGE_KEY);
      console.log('🗑️ Cleared all sync tasks');
    } catch (error) {
      console.error('❌ Error clearing sync tasks:', error);
    }
  }

  async startSync(): Promise<boolean> {
    try {
      if (this.syncStatus.isRunning) {
        console.log('⚠️ Sync already running');
        return true;
      }

      console.log('🔄 Starting background sync...');
      this.syncStatus.isRunning = true;

      // Start periodic sync
      this.syncInterval = setInterval(async () => {
        await this.performSync();
      }, this.SYNC_INTERVAL);

      // Perform initial sync
      await this.performSync();

      console.log('✅ Background sync started');
      return true;
    } catch (error) {
      console.error('❌ Error starting background sync:', error);
      this.syncStatus.isRunning = false;
      return false;
    }
  }

  async stopSync(): Promise<void> {
    try {
      console.log('🛑 Stopping background sync...');

      this.syncStatus.isRunning = false;

      if (this.syncInterval) {
        clearInterval(this.syncInterval);
        this.syncInterval = null;
      }

      console.log('✅ Background sync stopped');
    } catch (error) {
      console.error('❌ Error stopping background sync:', error);
    }
  }

  async syncNow(): Promise<boolean> {
    try {
      console.log('⚡ Performing immediate sync...');
      return await this.performSync();
    } catch (error) {
      console.error('❌ Error performing immediate sync:', error);
      return false;
    }
  }

  async getSyncStatus(): Promise<SyncStatus> {
    try {
      const tasks = await this.getPendingTasks();
      const failedTasks = tasks.filter(task => task.error);

      this.syncStatus.pendingTasks = tasks.length;
      this.syncStatus.failedTasks = failedTasks.length;
      this.syncStatus.totalTasks = tasks.length;

      return { ...this.syncStatus };
    } catch (error) {
      console.error('❌ Error getting sync status:', error);
      return { ...this.syncStatus };
    }
  }

  async syncMeals(): Promise<boolean> {
    try {
      console.log('🍽️ Syncing meals data...');

      const response = await httpClient.get('/api/meals/sync');

      if (response.success) {
        console.log('✅ Meals synced successfully');
        return true;
      } else {
        console.log('❌ Failed to sync meals');
        return false;
      }
    } catch (error) {
      console.error('❌ Error syncing meals:', error);
      return false;
    }
  }

  async syncBazar(): Promise<boolean> {
    try {
      console.log('🛒 Syncing bazar data...');

      const response = await httpClient.get('/api/bazar/sync');

      if (response.success) {
        console.log('✅ Bazar synced successfully');
        return true;
      } else {
        console.log('❌ Failed to sync bazar');
        return false;
      }
    } catch (error) {
      console.error('❌ Error syncing bazar:', error);
      return false;
    }
  }

  async syncUsers(): Promise<boolean> {
    try {
      console.log('👥 Syncing users data...');

      const response = await httpClient.get('/api/users/sync');

      if (response.success) {
        console.log('✅ Users synced successfully');
        return true;
      } else {
        console.log('❌ Failed to sync users');
        return false;
      }
    } catch (error) {
      console.error('❌ Error syncing users:', error);
      return false;
    }
  }

  async syncAll(): Promise<boolean> {
    try {
      console.log('🔄 Syncing all data...');

      const results = await Promise.allSettled([
        this.syncMeals(),
        this.syncBazar(),
        this.syncUsers(),
      ]);

      const successCount = results.filter(
        result => result.status === 'fulfilled' && result.value
      ).length;

      console.log(`✅ Sync completed: ${successCount}/3 successful`);
      return successCount > 0;
    } catch (error) {
      console.error('❌ Error syncing all data:', error);
      return false;
    }
  }

  isOnline(): boolean {
    // In a real app, this would check network connectivity
    return true;
  }

  async getSyncHistory(limit: number = 50): Promise<SyncTask[]> {
    try {
      const tasks = await this.getStoredTasks();
      return tasks.slice(-limit);
    } catch (error) {
      console.error('❌ Error getting sync history:', error);
      return [];
    }
  }

  async clearSyncHistory(): Promise<void> {
    try {
      await this.clearAllTasks();
      console.log('🗑️ Sync history cleared');
    } catch (error) {
      console.error('❌ Error clearing sync history:', error);
    }
  }

  async retryFailedTasks(): Promise<boolean> {
    try {
      console.log('🔄 Retrying failed tasks...');

      const tasks = await this.getStoredTasks();
      const failedTasks = tasks.filter(
        task => task.error && task.retryCount < task.maxRetries
      );

      let successCount = 0;
      for (const task of failedTasks) {
        try {
          const success = await this.executeTask(task);
          if (success) {
            await this.removeTask(task.id);
            successCount++;
          } else {
            task.retryCount++;
            task.lastAttempt = new Date();
            await this.updateTask(task);
          }
        } catch (error) {
          console.error(`❌ Error retrying task ${task.id}:`, error);
          task.retryCount++;
          task.lastAttempt = new Date();
          task.error = error instanceof Error ? error.message : 'Unknown error';
          await this.updateTask(task);
        }
      }

      console.log(
        `✅ Retry completed: ${successCount}/${failedTasks.length} successful`
      );
      return successCount > 0;
    } catch (error) {
      console.error('❌ Error retrying failed tasks:', error);
      return false;
    }
  }

  private async performSync(): Promise<boolean> {
    try {
      if (!this.isOnline()) {
        console.log('📱 Device offline, skipping sync');
        return false;
      }

      const tasks = await this.getPendingTasks();
      if (tasks.length === 0) {
        console.log('📝 No pending tasks to sync');
        return true;
      }

      console.log(`🔄 Processing ${tasks.length} sync tasks...`);

      let completedTasks = 0;
      for (const task of tasks) {
        try {
          const success = await this.executeTask(task);
          if (success) {
            await this.removeTask(task.id);
            completedTasks++;
          } else {
            task.retryCount++;
            task.lastAttempt = new Date();
            await this.updateTask(task);
          }
        } catch (error) {
          console.error(`❌ Error executing task ${task.id}:`, error);
          task.retryCount++;
          task.lastAttempt = new Date();
          task.error = error instanceof Error ? error.message : 'Unknown error';
          await this.updateTask(task);
        }
      }

      this.syncStatus.lastSyncTime = new Date();
      this.syncStatus.syncProgress = (completedTasks / tasks.length) * 100;

      console.log(
        `✅ Sync completed: ${completedTasks}/${tasks.length} tasks processed`
      );
      return completedTasks > 0;
    } catch (error) {
      console.error('❌ Error performing sync:', error);
      return false;
    }
  }

  private async executeTask(task: SyncTask): Promise<boolean> {
    try {
      console.log(`⚡ Executing task: ${task.type} - ${task.action}`);

      switch (task.type) {
        case 'meal':
          return await this.executeMealTask(task);
        case 'bazar':
          return await this.executeBazarTask(task);
        case 'user':
          return await this.executeUserTask(task);
        case 'notification':
          return await this.executeNotificationTask(task);
        case 'data':
          return await this.executeDataTask(task);
        default:
          console.log(`❌ Unknown task type: ${task.type}`);
          return false;
      }
    } catch (error) {
      console.error(`❌ Error executing task ${task.id}:`, error);
      return false;
    }
  }

  private async executeMealTask(task: SyncTask): Promise<boolean> {
    // Implement meal-specific task execution
    return true;
  }

  private async executeBazarTask(task: SyncTask): Promise<boolean> {
    // Implement bazar-specific task execution
    return true;
  }

  private async executeUserTask(task: SyncTask): Promise<boolean> {
    // Implement user-specific task execution
    return true;
  }

  private async executeNotificationTask(task: SyncTask): Promise<boolean> {
    // Implement notification-specific task execution
    return true;
  }

  private async executeDataTask(task: SyncTask): Promise<boolean> {
    // Implement data-specific task execution
    return true;
  }

  private async getStoredTasks(): Promise<SyncTask[]> {
    try {
      const stored = await AsyncStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('❌ Error getting stored tasks:', error);
      return [];
    }
  }

  private async storeTasks(tasks: SyncTask[]): Promise<void> {
    try {
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(tasks));
    } catch (error) {
      console.error('❌ Error storing tasks:', error);
    }
  }

  private async updateTask(updatedTask: SyncTask): Promise<void> {
    try {
      const tasks = await this.getStoredTasks();
      const index = tasks.findIndex(task => task.id === updatedTask.id);
      if (index !== -1) {
        tasks[index] = updatedTask;
        await this.storeTasks(tasks);
      }
    } catch (error) {
      console.error('❌ Error updating task:', error);
    }
  }

  private generateTaskId(): string {
    return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Export singleton instance
export const backgroundSyncService = new BackgroundSyncServiceImpl();
