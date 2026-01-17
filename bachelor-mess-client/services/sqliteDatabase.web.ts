// Web-specific stub implementation that prevents Metro from processing expo-sqlite
// This file is automatically used by Metro on web platform instead of sqliteDatabase.ts
import type { DatabaseService } from './databaseService.types';

class SQLiteDatabaseServiceWeb implements DatabaseService {
  private isInitialized = false;

  async init(): Promise<void> {
    console.log(
      'ℹ️ SQLite Database - Web platform: SQLite not available, using stub implementation'
    );
    this.isInitialized = true;
  }

  async close(): Promise<void> {
    console.log('ℹ️ SQLite Database - Web platform: close() called (no-op)');
  }

  async saveData(_table: string, _data: Record<string, any>): Promise<void> {
    console.warn(
      '⚠️ SQLite Database - Web platform: saveData() is not supported'
    );
  }

  async getData(
    _table: string,
    _query?: string,
    _params?: any[]
  ): Promise<Record<string, any>[]> {
    console.warn(
      '⚠️ SQLite Database - Web platform: getData() is not supported'
    );
    return [];
  }

  async updateData(
    _table: string,
    _id: string,
    _data: Record<string, any>
  ): Promise<void> {
    console.warn(
      '⚠️ SQLite Database - Web platform: updateData() is not supported'
    );
  }

  async deleteData(_table: string, _id: string): Promise<void> {
    console.warn(
      '⚠️ SQLite Database - Web platform: deleteData() is not supported'
    );
  }

  async clearTable(_table: string): Promise<void> {
    console.warn(
      '⚠️ SQLite Database - Web platform: clearTable() is not supported'
    );
  }

  async getPendingSync(): Promise<Record<string, any>[]> {
    return [];
  }

  async markSynced(_id: string): Promise<void> {
    // No-op on web
  }

  async addToSyncQueue(_item: Record<string, any>): Promise<void> {
    console.warn(
      '⚠️ SQLite Database - Web platform: addToSyncQueue() is not supported'
    );
  }

  async getTableInfo(_table: string): Promise<Record<string, any>[]> {
    return [];
  }

  async executeQuery(_query: string, _params?: any[]): Promise<any> {
    console.warn(
      '⚠️ SQLite Database - Web platform: executeQuery() is not supported'
    );
    return [];
  }

  async healthCheck(): Promise<boolean> {
    return true; // Always return true on web
  }

  async vacuum(): Promise<void> {
    // No-op on web
  }

  async optimize(): Promise<void> {
    // No-op on web
  }

  // Additional methods required by DatabaseInitializer and other services
  async emergencyReset(): Promise<void> {
    console.log(
      'ℹ️ SQLite Database - Web platform: emergencyReset() called (no-op)'
    );
    this.isInitialized = true;
  }

  async gracefulRecovery(): Promise<boolean> {
    console.log(
      'ℹ️ SQLite Database - Web platform: gracefulRecovery() called (no-op)'
    );
    return true;
  }

  async resetDatabase(): Promise<void> {
    console.log(
      'ℹ️ SQLite Database - Web platform: resetDatabase() called (no-op)'
    );
    this.isInitialized = true;
  }

  async softResetDatabase(): Promise<void> {
    console.log(
      'ℹ️ SQLite Database - Web platform: softResetDatabase() called (no-op)'
    );
    this.isInitialized = true;
  }

  async forceResetDatabase(): Promise<void> {
    console.log(
      'ℹ️ SQLite Database - Web platform: forceResetDatabase() called (no-op)'
    );
    this.isInitialized = true;
  }

  async bypassDatabase(): Promise<void> {
    console.log(
      'ℹ️ SQLite Database - Web platform: bypassDatabase() called (no-op)'
    );
    this.isInitialized = true;
  }
}

// Export singleton instance
export const sqliteDatabase = new SQLiteDatabaseServiceWeb();
export default sqliteDatabase;
