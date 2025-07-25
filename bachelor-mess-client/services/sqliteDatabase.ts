import * as SQLite from 'expo-sqlite';

// Database interface
export interface DatabaseService {
  // Core operations
  init(): Promise<void>;
  close(): Promise<void>;

  // Data operations
  saveData(table: string, data: any): Promise<void>;
  getData(table: string, query?: string, params?: any[]): Promise<any[]>;
  updateData(table: string, id: string, data: any): Promise<void>;
  deleteData(table: string, id: string): Promise<void>;
  clearTable(table: string): Promise<void>;

  // Sync operations
  getPendingSync(): Promise<any[]>;
  markSynced(id: string): Promise<void>;
  addToSyncQueue(item: any): Promise<void>;

  // Utility operations
  getTableInfo(table: string): Promise<any[]>;
  executeQuery(query: string, params?: any[]): Promise<any>;
}

class SQLiteDatabaseService implements DatabaseService {
  private db: SQLite.SQLiteDatabase | null = null;
  private readonly DATABASE_NAME = 'mess_manager.db';

  async init(): Promise<void> {
    try {
      if (this.db) {
        console.log('✅ SQLite Database - Already initialized');
        return;
      }

      this.db = await SQLite.openDatabaseAsync(this.DATABASE_NAME);
      await this.createTables();
      await this.migrateDatabase();
      console.log('✅ SQLite Database - Initialized successfully');
    } catch (error) {
      console.error('❌ SQLite Database - Failed to initialize:', error);
      throw error;
    }
  }

  async resetDatabase(): Promise<void> {
    try {
      console.log('🔄 SQLite Database - Resetting database...');

      // Close existing connection
      if (this.db) {
        await this.db.closeAsync();
        this.db = null;
      }

      // Wait a bit before trying to delete
      await new Promise(resolve => setTimeout(resolve, 100));

      // Try to delete database
      try {
        await SQLite.deleteDatabaseAsync(this.DATABASE_NAME);
      } catch (deleteError) {
        console.log(
          '⚠️ Could not delete database, will recreate tables instead'
        );
      }

      // Recreate database
      this.db = await SQLite.openDatabaseAsync(this.DATABASE_NAME);

      // Drop and recreate all tables
      await this.db.execAsync('DROP TABLE IF EXISTS dashboard_data');
      await this.db.execAsync('DROP TABLE IF EXISTS api_cache');
      await this.db.execAsync('DROP TABLE IF EXISTS sync_queue');
      await this.db.execAsync('DROP TABLE IF EXISTS activities');
      await this.db.execAsync('DROP TABLE IF EXISTS bazar_entries');
      await this.db.execAsync('DROP TABLE IF EXISTS meal_entries');
      await this.db.execAsync('DROP TABLE IF EXISTS user_data');
      await this.db.execAsync('DROP TABLE IF EXISTS statistics');

      await this.createTables();

      console.log('✅ SQLite Database - Reset successfully');
    } catch (error) {
      console.error('❌ SQLite Database - Failed to reset:', error);
      // Try to reinitialize without deleting
      try {
        this.db = await SQLite.openDatabaseAsync(this.DATABASE_NAME);
        await this.createTables();
        console.log('✅ SQLite Database - Reinitialized successfully');
      } catch (reinitError) {
        console.error(
          '❌ SQLite Database - Failed to reinitialize:',
          reinitError
        );
        throw reinitError;
      }
    }
  }

  async forceResetDatabase(): Promise<void> {
    try {
      console.log('🔄 SQLite Database - Force resetting database...');

      // Close existing connection
      if (this.db) {
        await this.db.closeAsync();
        this.db = null;
      }

      // Force delete database file
      try {
        await SQLite.deleteDatabaseAsync(this.DATABASE_NAME);
      } catch (deleteError) {
        console.log('⚠️ Could not delete database file, continuing...');
      }

      // Wait a bit before recreating
      await new Promise(resolve => setTimeout(resolve, 100));

      // Recreate database
      this.db = await SQLite.openDatabaseAsync(this.DATABASE_NAME);
      await this.createTables();

      console.log('✅ SQLite Database - Force reset completed');
    } catch (error) {
      console.error('❌ SQLite Database - Force reset failed:', error);
      throw error;
    }
  }

  async close(): Promise<void> {
    if (this.db) {
      await this.db.closeAsync();
      this.db = null;
      console.log('🔒 SQLite Database - Closed successfully');
    }
  }

  private async createTables(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      // Drop existing tables to ensure clean schema
      await this.db.execAsync('DROP TABLE IF EXISTS dashboard_data');
      await this.db.execAsync('DROP TABLE IF EXISTS api_cache');
      await this.db.execAsync('DROP TABLE IF EXISTS sync_queue');
      await this.db.execAsync('DROP TABLE IF EXISTS activities');
      await this.db.execAsync('DROP TABLE IF EXISTS bazar_entries');
      await this.db.execAsync('DROP TABLE IF EXISTS meal_entries');
      await this.db.execAsync('DROP TABLE IF EXISTS user_data');
      await this.db.execAsync('DROP TABLE IF EXISTS statistics');

      const tables = [
        // Dashboard data table
        `CREATE TABLE dashboard_data (
          id TEXT PRIMARY KEY,
          table_name TEXT NOT NULL,
          data TEXT NOT NULL,
          timestamp INTEGER NOT NULL,
          created_at INTEGER NOT NULL,
          updated_at INTEGER NOT NULL,
          version TEXT DEFAULT '1.0'
        )`,

        // Activities table
        `CREATE TABLE activities (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          description TEXT,
          time TEXT NOT NULL,
          amount REAL,
          icon TEXT,
          colors TEXT,
          type TEXT,
          priority TEXT,
          user_id TEXT,
          created_at INTEGER NOT NULL,
          updated_at INTEGER NOT NULL
        )`,

        // Bazar entries table
        `CREATE TABLE bazar_entries (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          date TEXT NOT NULL,
          items TEXT NOT NULL,
          total_amount REAL NOT NULL,
          description TEXT,
          status TEXT DEFAULT 'pending',
          notes TEXT,
          approved_by TEXT,
          approved_at TEXT,
          created_at INTEGER NOT NULL,
          updated_at INTEGER NOT NULL
        )`,

        // Meal entries table
        `CREATE TABLE meal_entries (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          date TEXT NOT NULL,
          meal_type TEXT NOT NULL,
          status TEXT DEFAULT 'pending',
          notes TEXT,
          approved_by TEXT,
          approved_at TEXT,
          created_at INTEGER NOT NULL,
          updated_at INTEGER NOT NULL
        )`,

        // Sync queue table
        `CREATE TABLE sync_queue (
          id TEXT PRIMARY KEY,
          action TEXT NOT NULL,
          endpoint TEXT NOT NULL,
          data TEXT NOT NULL,
          timestamp INTEGER NOT NULL,
          retry_count INTEGER DEFAULT 0,
          max_retries INTEGER DEFAULT 3,
          status TEXT DEFAULT 'pending'
        )`,

        // User data table
        `CREATE TABLE user_data (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          email TEXT NOT NULL,
          role TEXT NOT NULL,
          profile_data TEXT,
          created_at INTEGER NOT NULL,
          updated_at INTEGER NOT NULL
        )`,

        // Statistics table
        `CREATE TABLE statistics (
          id TEXT PRIMARY KEY,
          type TEXT NOT NULL,
          data TEXT NOT NULL,
          timestamp INTEGER NOT NULL,
          version TEXT DEFAULT '1.0'
        )`,

        // Cache table for API responses
        `CREATE TABLE api_cache (
          id TEXT PRIMARY KEY,
          key TEXT UNIQUE NOT NULL,
          data TEXT NOT NULL,
          timestamp INTEGER NOT NULL,
          expiry INTEGER NOT NULL,
          created_at INTEGER NOT NULL,
          updated_at INTEGER NOT NULL
        )`,
      ];

      for (const table of tables) {
        await this.db.execAsync(table);
      }

      console.log('✅ SQLite Database - Tables created successfully');
    } catch (error) {
      console.error('❌ SQLite Database - Failed to create tables:', error);
      throw error;
    }
  }

  private async migrateDatabase(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      // Check if api_cache table has updated_at column
      const tableInfo = await this.db.getAllAsync(
        "PRAGMA table_info(api_cache)"
      );
      
      const hasUpdatedAt = tableInfo.some((column: any) => 
        column.name === 'updated_at'
      );

      if (!hasUpdatedAt) {
        console.log('🔄 SQLite Database - Adding updated_at column to api_cache table');
        await this.db.execAsync(
          'ALTER TABLE api_cache ADD COLUMN updated_at INTEGER NOT NULL DEFAULT 0'
        );
        console.log('✅ SQLite Database - Migration completed');
      }
    } catch (error) {
      console.error('❌ SQLite Database - Migration failed:', error instanceof Error ? error.message : 'Unknown error');
      // Don't throw error, just log it
    }
  }

  async saveData(table: string, data: any): Promise<void> {
    try {
      if (!this.db) {
        console.log('🔄 SQLite Database - Reinitializing database...');
        await this.init();
      }

      const timestamp = Date.now();
      const id =
        data.id ||
        `${table}_${timestamp}_${Math.random().toString(36).substr(2, 9)}`;

      const query = `
        INSERT OR REPLACE INTO ${table} 
        (id, ${Object.keys(data)
          .filter(key => key !== 'id')
          .join(', ')}, created_at, updated_at)
        VALUES (?, ${Object.keys(data)
          .filter(key => key !== 'id')
          .map(() => '?')
          .join(', ')}, ?, ?)
      `;

      const params = [
        id,
        ...Object.keys(data)
          .filter(key => key !== 'id')
          .map(key =>
            typeof data[key] === 'object'
              ? JSON.stringify(data[key])
              : data[key]
          ),
        timestamp,
        timestamp,
      ];

      if (this.db) {
        await this.db.runAsync(query, params);
        console.log(`💾 SQLite Database - Saved data to ${table}: ${id}`);
      }
    } catch (error) {
      console.error(
        `❌ SQLite Database - Failed to save data to ${table}:`,
        error instanceof Error ? error.message : 'Unknown error'
      );

      // Try to reset database if it's corrupted
      if (
        error instanceof Error && (
          error.message.includes('NullPointerException') ||
          error.message.includes('prepareAsync') ||
          error.message.includes('Failed to save data')
        )
      ) {
        console.log(
          '🔄 SQLite Database - Database corrupted, attempting reset...'
        );
        try {
          await this.resetDatabase();
        } catch (resetError) {
          console.error('❌ SQLite Database - Reset failed:', resetError instanceof Error ? resetError.message : 'Unknown error');
          // Try force reset as last resort
          await this.forceResetDatabase();
        }
      }

      // Don't throw error, just log it to prevent app crashes
      console.log(
        `⚠️ SQLite Database - Skipping save to ${table} due to error`
      );
    }
  }

  async getData(table: string, query?: string, params?: any[]): Promise<any[]> {
    try {
      if (!this.db) {
        console.log('🔄 SQLite Database - Reinitializing database...');
        await this.init();
      }

      const sql = query || `SELECT * FROM ${table} ORDER BY created_at DESC`;
      const result = await this.db.getAllAsync(sql, params || []);

      // Parse JSON fields
      const parsedResult = result.map(row => {
        const parsed = { ...row };
        Object.keys(parsed).forEach(key => {
          if (
            typeof parsed[key] === 'string' &&
            (parsed[key].startsWith('{') || parsed[key].startsWith('['))
          ) {
            try {
              parsed[key] = JSON.parse(parsed[key]);
            } catch (e) {
              // Keep as string if parsing fails
            }
          }
        });
        return parsed;
      });

      console.log(
        `📦 SQLite Database - Retrieved ${parsedResult.length} records from ${table}`
      );
      return parsedResult;
    } catch (error) {
      console.error(
        `❌ SQLite Database - Failed to get data from ${table}:`,
        error
      );

      // Try to reset database if it's corrupted
      if (
        error.message.includes('NullPointerException') ||
        error.message.includes('prepareAsync') ||
        error.message.includes('Failed to get data')
      ) {
        console.log(
          '🔄 SQLite Database - Database corrupted, attempting reset...'
        );
        try {
          await this.resetDatabase();
        } catch (resetError) {
          console.error('❌ SQLite Database - Reset failed:', resetError);
          // Try force reset as last resort
          await this.forceResetDatabase();
        }
      }

      // Return empty array instead of throwing error
      return [];
    }
  }

  async updateData(table: string, id: string, data: any): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      const timestamp = Date.now();
      const setClause = Object.keys(data)
        .map(key => `${key} = ?`)
        .join(', ');
      const query = `UPDATE ${table} SET ${setClause}, updated_at = ? WHERE id = ?`;

      const params = [
        ...Object.keys(data).map(key =>
          typeof data[key] === 'object' ? JSON.stringify(data[key]) : data[key]
        ),
        timestamp,
        id,
      ];

      await this.db.runAsync(query, params);
      console.log(`🔄 SQLite Database - Updated data in ${table}: ${id}`);
    } catch (error) {
      console.error(
        `❌ SQLite Database - Failed to update data in ${table}:`,
        error
      );
      throw error;
    }
  }

  async deleteData(table: string, id: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      const query = `DELETE FROM ${table} WHERE id = ?`;
      await this.db.runAsync(query, [id]);
      console.log(`🗑️ SQLite Database - Deleted data from ${table}: ${id}`);
    } catch (error) {
      console.error(
        `❌ SQLite Database - Failed to delete data from ${table}:`,
        error
      );
      throw error;
    }
  }

  async clearTable(table: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      const query = `DELETE FROM ${table}`;
      await this.db.runAsync(query);
      console.log(`🧹 SQLite Database - Cleared table: ${table}`);
    } catch (error) {
      console.error(
        `❌ SQLite Database - Failed to clear table ${table}:`,
        error
      );
      throw error;
    }
  }

  async getPendingSync(): Promise<any[]> {
    try {
      if (!this.db) {
        console.log('🔄 SQLite Database - Reinitializing database...');
        await this.init();
      }

      const query = `SELECT * FROM sync_queue WHERE status = 'pending' ORDER BY timestamp ASC`;
      const result = await this.db.getAllAsync(query);

      const parsedResult = result.map(row => ({
        ...row,
        data: JSON.parse(row.data),
      }));

      console.log(
        `📋 SQLite Database - Retrieved ${parsedResult.length} pending sync items`
      );
      return parsedResult;
    } catch (error) {
      console.error('❌ SQLite Database - Failed to get pending sync:', error);

      // Try to reset database if it's corrupted
      if (
        error.message.includes('NullPointerException') ||
        error.message.includes('prepareAsync') ||
        error.message.includes('Failed to get pending sync')
      ) {
        console.log(
          '🔄 SQLite Database - Database corrupted, attempting reset...'
        );
        try {
          await this.resetDatabase();
        } catch (resetError) {
          console.error('❌ SQLite Database - Reset failed:', resetError);
          // Try force reset as last resort
          await this.forceResetDatabase();
        }
      }

      return [];
    }
  }

  async markSynced(id: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      const query = `UPDATE sync_queue SET status = 'synced' WHERE id = ?`;
      await this.db.runAsync(query, [id]);
      console.log(`✅ SQLite Database - Marked sync item as synced: ${id}`);
    } catch (error) {
      console.error('❌ SQLite Database - Failed to mark sync item:', error);
      throw error;
    }
  }

  async addToSyncQueue(item: any): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      const syncItem = {
        id: `${item.action}_${Date.now()}_${Math.random()
          .toString(36)
          .substr(2, 9)}`,
        action: item.action,
        endpoint: item.endpoint,
        data: JSON.stringify(item.data),
        timestamp: Date.now(),
        retry_count: 0,
        max_retries: 3,
        status: 'pending',
      };

      const query = `
        INSERT INTO sync_queue 
        (id, action, endpoint, data, timestamp, retry_count, max_retries, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const params = [
        syncItem.id,
        syncItem.action,
        syncItem.endpoint,
        syncItem.data,
        syncItem.timestamp,
        syncItem.retry_count,
        syncItem.max_retries,
        syncItem.status,
      ];

      await this.db.runAsync(query, params);
      console.log(
        `📝 SQLite Database - Added to sync queue: ${item.action} ${item.endpoint}`
      );
    } catch (error) {
      console.error('❌ SQLite Database - Failed to add to sync queue:', error);
      throw error;
    }
  }

  async getTableInfo(table: string): Promise<any[]> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      const query = `PRAGMA table_info(${table})`;
      const result = await this.db.getAllAsync(query);
      console.log(`📊 SQLite Database - Retrieved table info for ${table}`);
      return result;
    } catch (error) {
      console.error(
        `❌ SQLite Database - Failed to get table info for ${table}:`,
        error
      );
      throw error;
    }
  }

  async executeQuery(query: string, params?: any[]): Promise<any> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      const result = await this.db.getAllAsync(query, params || []);
      console.log(
        `🔍 SQLite Database - Executed query: ${query.substring(0, 50)}...`
      );
      return result;
    } catch (error) {
      console.error('❌ SQLite Database - Failed to execute query:', error);
      throw error;
    }
  }

  // Convenience methods for specific data types
  async saveActivity(activity: any): Promise<void> {
    await this.saveData('activities', activity);
  }

  async getActivities(limit?: number): Promise<any[]> {
    const query = limit
      ? `SELECT * FROM activities ORDER BY created_at DESC LIMIT ${limit}`
      : `SELECT * FROM activities ORDER BY created_at DESC`;
    return this.getData('activities', query);
  }

  async saveBazarEntry(bazar: any): Promise<void> {
    await this.saveData('bazar_entries', bazar);
  }

  async getBazarEntries(limit?: number): Promise<any[]> {
    const query = limit
      ? `SELECT * FROM bazar_entries ORDER BY created_at DESC LIMIT ${limit}`
      : `SELECT * FROM bazar_entries ORDER BY created_at DESC`;
    return this.getData('bazar_entries', query);
  }

  async saveMealEntry(meal: any): Promise<void> {
    await this.saveData('meal_entries', meal);
  }

  async getMealEntries(limit?: number): Promise<any[]> {
    const query = limit
      ? `SELECT * FROM meal_entries ORDER BY created_at DESC LIMIT ${limit}`
      : `SELECT * FROM meal_entries ORDER BY created_at DESC`;
    return this.getData('meal_entries', query);
  }

  async saveUserData(user: any): Promise<void> {
    await this.saveData('user_data', user);
  }

  async getUserData(userId: string): Promise<any> {
    const result = await this.getData(
      'user_data',
      `SELECT * FROM user_data WHERE id = ?`,
      [userId]
    );
    return result[0] || null;
  }

  async saveStatistics(type: string, data: any): Promise<void> {
    const statsData = {
      id: type,
      type,
      data: JSON.stringify(data),
      timestamp: Date.now(),
      version: '1.0',
    };
    await this.saveData('statistics', statsData);
  }

  async getStatistics(type: string): Promise<any> {
    const result = await this.getData(
      'statistics',
      `SELECT * FROM statistics WHERE type = ?`,
      [type]
    );
    if (result.length > 0) {
      return JSON.parse(result[0].data);
    }
    return null;
  }

  async saveCacheData(
    key: string,
    data: any,
    expiryMinutes: number = 60
  ): Promise<void> {
    const cacheData = {
      key,
      data: JSON.stringify(data),
      timestamp: Date.now(),
      expiry: Date.now() + expiryMinutes * 60 * 1000,
    };
    await this.saveData('api_cache', cacheData);
  }

  async getCacheData(key: string): Promise<any> {
    const result = await this.getData(
      'api_cache',
      `SELECT * FROM api_cache WHERE key = ? AND expiry > ?`,
      [key, Date.now()]
    );
    if (result.length > 0) {
      return JSON.parse(result[0].data);
    }
    return null;
  }

  async clearExpiredCache(): Promise<void> {
    const query = `DELETE FROM api_cache WHERE expiry <= ?`;
    await this.db?.runAsync(query, [Date.now()]);
    console.log('🧹 SQLite Database - Cleared expired cache');
  }
}

// Export singleton instance
export const sqliteDatabase = new SQLiteDatabaseService();
export default sqliteDatabase;
