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

// SQLite best practices constants
const SQLITE_CONSTANTS = {
  BUSY_TIMEOUT: 30000, // 30 seconds
  MAX_RETRIES: 3,
  RETRY_DELAY: 100,
  LOCK_TIMEOUT: 5000,
  PRAGMA_SETTINGS: {
    journal_mode: 'WAL', // Write-Ahead Logging for better concurrency
    synchronous: 'NORMAL', // Balance between safety and performance
    cache_size: 1000, // Cache size in pages
    temp_store: 'MEMORY', // Store temp tables in memory
    mmap_size: 268435456, // 256MB memory mapping
    page_size: 4096,
    auto_vacuum: 'INCREMENTAL',
    incremental_vacuum: 1000,
  },
  // Connection pool settings
  CONNECTION_POOL: {
    MAX_CONNECTIONS: 1, // SQLite is single-threaded, so only one connection
    CONNECTION_TIMEOUT: 10000,
    IDLE_TIMEOUT: 30000,
  },
  // Transaction settings
  TRANSACTION: {
    TIMEOUT: 30000,
    MAX_RETRIES: 3,
  },
} as const;

class SQLiteDatabaseService implements DatabaseService {
  private db: SQLite.SQLiteDatabase | null = null;
  private readonly DATABASE_NAME = 'mess_manager.db';
  private isInitializing = false;
  private isInitialized = false;
  private isLocked = false;
  private lockTimeout = SQLITE_CONSTANTS.LOCK_TIMEOUT;
  private readonly MAX_RETRIES = SQLITE_CONSTANTS.MAX_RETRIES;
  private readonly RETRY_DELAY = SQLITE_CONSTANTS.RETRY_DELAY;
  private connectionTimeout: ReturnType<typeof setTimeout> | null = null;
  private lastActivity = Date.now();

  async init(): Promise<void> {
    // Prevent multiple simultaneous initializations
    if (this.isInitializing) {
      console.log(
        '🔄 SQLite Database - Initialization already in progress, waiting...'
      );
      while (this.isInitializing) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      return;
    }

    if (this.isInitialized && this.db) {
      console.log('✅ SQLite Database - Already initialized');
      return;
    }

    this.isInitializing = true;

    try {
      console.log('🔄 SQLite Database - Opening database...');
      this.db = await SQLite.openDatabaseAsync(this.DATABASE_NAME);

      // Configure SQLite for better performance and concurrency
      await this.configureDatabase();

      console.log('🔄 SQLite Database - Creating tables...');
      await this.createTables();

      console.log('🔄 SQLite Database - Running migrations...');
      await this.migrateDatabase();

      this.isInitialized = true;
      console.log('✅ SQLite Database - Initialized successfully');
    } catch (error) {
      console.error('❌ SQLite Database - Failed to initialize:', error);

      // Try to reset and reinitialize if initialization fails
      try {
        console.log('🔄 SQLite Database - Attempting database reset...');
        await this.resetDatabase();
        this.isInitialized = true;
      } catch (resetError) {
        console.error('❌ SQLite Database - Reset also failed:', resetError);
        this.isInitialized = false;
        throw error; // Throw original error
      }
    } finally {
      this.isInitializing = false;
    }
  }

  async resetDatabase(): Promise<void> {
    try {
      console.log('🔄 SQLite Database - Resetting database...');

      // Release any existing locks
      this.releaseLock();

      // Close existing connection
      if (this.db) {
        try {
          await this.db.closeAsync();
        } catch (closeError) {
          console.log(
            '⚠️ SQLite Database - Error closing database:',
            closeError
          );
        }
        this.db = null;
      }

      this.isInitialized = false;

      // Wait a bit before trying to delete
      await new Promise(resolve => setTimeout(resolve, 500));

      // Try to delete database
      try {
        await SQLite.deleteDatabaseAsync(this.DATABASE_NAME);
        console.log('🗑️ SQLite Database - Database file deleted');
      } catch (deleteError) {
        console.log(
          '⚠️ Could not delete database file, will recreate tables instead'
        );
      }

      // Wait a bit before recreating
      await new Promise(resolve => setTimeout(resolve, 500));

      // Recreate database
      this.db = await SQLite.openDatabaseAsync(this.DATABASE_NAME);

      // Create tables
      await this.createTables();

      console.log('✅ SQLite Database - Reset successfully');
    } catch (error) {
      console.error('❌ SQLite Database - Failed to reset:', error);

      // Try to reinitialize without deleting
      try {
        console.log('🔄 SQLite Database - Attempting reinitialization...');
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

  async softResetDatabase(): Promise<void> {
    try {
      console.log('🔄 SQLite Database - Performing soft reset...');

      // Release any existing locks
      this.releaseLock();

      if (!this.db) {
        await this.init();
        return;
      }

      // Only recreate missing tables, don't drop existing ones
      await this.createTables();

      console.log('✅ SQLite Database - Soft reset completed');
    } catch (error) {
      console.error('❌ SQLite Database - Soft reset failed:', error);
      throw error;
    }
  }

  async forceResetDatabase(): Promise<void> {
    try {
      console.log('🔄 SQLite Database - Force resetting database...');

      // Release any existing locks
      this.releaseLock();

      // Close existing connection
      if (this.db) {
        try {
          await this.db.closeAsync();
        } catch (closeError) {
          console.log(
            '⚠️ SQLite Database - Error closing database:',
            closeError
          );
        }
        this.db = null;
      }

      this.isInitialized = false;

      // Force delete database file
      try {
        await SQLite.deleteDatabaseAsync(this.DATABASE_NAME);
        console.log('🗑️ SQLite Database - Database file force deleted');
      } catch (deleteError) {
        console.log('⚠️ Could not delete database file, continuing...');
      }

      // Wait a bit before recreating
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Recreate database
      this.db = await SQLite.openDatabaseAsync(this.DATABASE_NAME);
      await this.createTables();

      this.isInitialized = true;
      console.log('✅ SQLite Database - Force reset completed');
    } catch (error) {
      console.error('❌ SQLite Database - Force reset failed:', error);
      throw error;
    }
  }

  async close(): Promise<void> {
    if (this.db) {
      try {
        // Release any pending locks
        this.releaseLock();

        // Commit any pending transactions
        await this.db.execAsync('COMMIT');

        await this.db.closeAsync();
        console.log('🔒 SQLite Database - Closed successfully');
      } catch (error) {
        console.log('⚠️ SQLite Database - Error closing database:', error);
      }
      this.db = null;
    }
    this.isInitialized = false;
    this.isLocked = false;
  }

  async ensureConnection(): Promise<void> {
    if (!this.db || !this.isInitialized) {
      await this.init();
    }

    // Test connection health
    try {
      await this.db!.getAllAsync('SELECT 1');
    } catch (error) {
      console.log('🔄 SQLite Database - Connection lost, reinitializing...');
      await this.init();
    }
  }

  private async waitForUnlock(): Promise<void> {
    if (this.isLocked) {
      console.log('🔒 SQLite Database - Waiting for database unlock...');
      const startTime = Date.now();

      while (this.isLocked && Date.now() - startTime < this.lockTimeout) {
        await new Promise(resolve => setTimeout(resolve, this.RETRY_DELAY));
      }

      if (this.isLocked) {
        console.log(
          '⚠️ SQLite Database - Lock timeout reached, forcing unlock'
        );
        this.isLocked = false;
      }
    }
  }

  private async acquireLock(): Promise<void> {
    await this.waitForUnlock();
    this.isLocked = true;
  }

  private releaseLock(): void {
    this.isLocked = false;
  }

  private async configureDatabase(): Promise<void> {
    if (!this.db) return;

    try {
      // Set PRAGMA settings for better performance and concurrency
      const pragmaSettings = SQLITE_CONSTANTS.PRAGMA_SETTINGS;

      await this.db.execAsync(
        `PRAGMA journal_mode = ${pragmaSettings.journal_mode}`
      );
      await this.db.execAsync(
        `PRAGMA synchronous = ${pragmaSettings.synchronous}`
      );
      await this.db.execAsync(
        `PRAGMA cache_size = ${pragmaSettings.cache_size}`
      );
      await this.db.execAsync(
        `PRAGMA temp_store = ${pragmaSettings.temp_store}`
      );
      await this.db.execAsync(`PRAGMA mmap_size = ${pragmaSettings.mmap_size}`);
      await this.db.execAsync(`PRAGMA page_size = ${pragmaSettings.page_size}`);
      await this.db.execAsync(
        `PRAGMA auto_vacuum = ${pragmaSettings.auto_vacuum}`
      );
      await this.db.execAsync(
        `PRAGMA incremental_vacuum = ${pragmaSettings.incremental_vacuum}`
      );

      // Set busy timeout to handle concurrent access
      await this.db.execAsync(
        `PRAGMA busy_timeout = ${SQLITE_CONSTANTS.BUSY_TIMEOUT}`
      );

      // Enable foreign keys
      await this.db.execAsync('PRAGMA foreign_keys = ON');

      // Set recursive triggers
      await this.db.execAsync('PRAGMA recursive_triggers = ON');

      console.log('✅ SQLite Database - Configured with optimized settings');
    } catch (error) {
      console.log(
        '⚠️ SQLite Database - Failed to configure some settings:',
        error
      );
    }
  }

  private updateActivity(): void {
    this.lastActivity = Date.now();
    this.resetConnectionTimeout();
  }

  private resetConnectionTimeout(): void {
    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout);
    }

    this.connectionTimeout = setTimeout(() => {
      this.closeIdleConnection();
    }, SQLITE_CONSTANTS.CONNECTION_POOL.IDLE_TIMEOUT);
  }

  private async closeIdleConnection(): Promise<void> {
    const idleTime = Date.now() - this.lastActivity;
    if (idleTime >= SQLITE_CONSTANTS.CONNECTION_POOL.IDLE_TIMEOUT) {
      console.log('🔄 SQLite Database - Closing idle connection...');
      await this.close();
    }
  }

  private async executeWithRetry<T>(
    operation: () => Promise<T>,
    operationName: string
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.MAX_RETRIES; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        if (attempt < this.MAX_RETRIES) {
          console.log(
            `🔄 SQLite Database - ${operationName} failed (attempt ${attempt}/${this.MAX_RETRIES}), retrying...`
          );
          await new Promise(resolve =>
            setTimeout(resolve, this.RETRY_DELAY * attempt)
          );
        }
      }
    }

    throw (
      lastError ||
      new Error(`${operationName} failed after ${this.MAX_RETRIES} attempts`)
    );
  }

  async healthCheck(): Promise<boolean> {
    try {
      if (!this.db) {
        console.log(
          '🔍 SQLite Database - Health check: Database not initialized'
        );
        return false;
      }

      // Try a simple query to test database health
      await this.db.getAllAsync('SELECT 1');
      console.log('✅ SQLite Database - Health check passed');
      return true;
    } catch (error) {
      console.error(
        '❌ SQLite Database - Health check failed:',
        error instanceof Error ? error.message : 'Unknown error'
      );
      return false;
    }
  }

  private shouldResetDatabase(errorMessage: string): boolean {
    return (
      errorMessage.includes('NullPointerException') ||
      errorMessage.includes('prepareAsync') ||
      errorMessage.includes('Access to closed resource') ||
      errorMessage.includes('database is locked') ||
      errorMessage.includes('database table is locked')
    );
  }

  private async handleDatabaseCorruption(): Promise<void> {
    console.log(
      '🔄 SQLite Database - Database corrupted, attempting soft reset...'
    );
    try {
      await this.softResetDatabase();
    } catch (resetError) {
      console.error(
        '❌ SQLite Database - Soft reset failed:',
        resetError instanceof Error ? resetError.message : 'Unknown error'
      );
      console.log('🔄 SQLite Database - Attempting hard reset...');
      await this.resetDatabase();
    }
  }

  private async createTables(): Promise<void> {
    if (!this.db) {
      console.log(
        '🔄 SQLite Database - Database not initialized, attempting to initialize...'
      );
      await this.init();
      if (!this.db) throw new Error('Database not initialized after init');
    }

    // Wait for any existing locks
    await this.waitForUnlock();

    try {
      console.log('🔄 SQLite Database - Checking existing tables...');

      // Check if tables already exist
      const existingTables = await this.db.getAllAsync(
        "SELECT name FROM sqlite_master WHERE type='table'"
      );

      const tableNames = existingTables.map((row: any) => row.name);
      console.log('📋 SQLite Database - Existing tables:', tableNames);

      // Only create tables if they don't exist
      const requiredTables = [
        'dashboard_data',
        'api_cache',
        'sync_queue',
        'activities',
        'bazar_entries',
        'meal_entries',
        'user_data',
        'statistics',
      ];

      // Check which tables are missing
      const missingTables = requiredTables.filter(
        table => !tableNames.includes(table)
      );

      if (missingTables.length > 0) {
        console.log(
          `🔄 SQLite Database - Creating missing tables: ${missingTables.join(
            ', '
          )}`
        );

        // Use transaction for table creation
        await this.db.execAsync('BEGIN TRANSACTION');
        try {
          await this.createMissingTables(missingTables);
          await this.db.execAsync('COMMIT');
          console.log('✅ SQLite Database - Tables created successfully');
        } catch (error) {
          await this.db.execAsync('ROLLBACK');
          throw error;
        }
      } else {
        console.log('✅ SQLite Database - All required tables already exist');
        return;
      }

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

  private async createMissingTables(missingTables: string[]): Promise<void> {
    const tableDefinitions: { [key: string]: string } = {
      dashboard_data: `
        CREATE TABLE dashboard_data (
          id TEXT PRIMARY KEY,
          table_name TEXT NOT NULL,
          data TEXT NOT NULL,
          timestamp INTEGER NOT NULL,
          created_at INTEGER NOT NULL,
          updated_at INTEGER NOT NULL,
          version TEXT DEFAULT '1.0'
        )
      `,
      api_cache: `
        CREATE TABLE api_cache (
          id TEXT PRIMARY KEY,
          key TEXT UNIQUE NOT NULL,
          data TEXT NOT NULL,
          timestamp INTEGER NOT NULL,
          expiry INTEGER NOT NULL,
          created_at INTEGER NOT NULL,
          updated_at INTEGER NOT NULL
        )
      `,
      sync_queue: `
        CREATE TABLE sync_queue (
          id TEXT PRIMARY KEY,
          action TEXT NOT NULL,
          endpoint TEXT NOT NULL,
          data TEXT NOT NULL,
          timestamp INTEGER NOT NULL,
          retry_count INTEGER DEFAULT 0,
          max_retries INTEGER DEFAULT 3,
          status TEXT DEFAULT 'pending'
        )
      `,
      activities: `
        CREATE TABLE activities (
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
        )
      `,
      bazar_entries: `
        CREATE TABLE bazar_entries (
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
        )
      `,
      meal_entries: `
        CREATE TABLE meal_entries (
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
        )
      `,
      user_data: `
        CREATE TABLE user_data (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          email TEXT NOT NULL,
          role TEXT NOT NULL,
          profile_data TEXT,
          created_at INTEGER NOT NULL,
          updated_at INTEGER NOT NULL
        )
      `,
      statistics: `
        CREATE TABLE statistics (
          id TEXT PRIMARY KEY,
          type TEXT NOT NULL,
          data TEXT NOT NULL,
          timestamp INTEGER NOT NULL,
          version TEXT DEFAULT '1.0'
        )
      `,
    };

    for (const tableName of missingTables) {
      if (tableDefinitions[tableName]) {
        await this.db!.execAsync(tableDefinitions[tableName]);
        console.log(`✅ SQLite Database - Created table: ${tableName}`);
      }
    }
  }

  private async migrateDatabase(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      // Check if api_cache table exists first
      const tableCheck = await this.db.getAllAsync(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='api_cache'"
      );

      if (tableCheck.length === 0) {
        console.log(
          '📋 SQLite Database - api_cache table does not exist, skipping migration'
        );
        return;
      }

      // Check if api_cache table has updated_at column
      const tableInfo = await this.db.getAllAsync(
        'PRAGMA table_info(api_cache)'
      );

      const hasUpdatedAt = tableInfo.some(
        (column: any) => column.name === 'updated_at'
      );

      if (!hasUpdatedAt) {
        console.log(
          '🔄 SQLite Database - Adding updated_at column to api_cache table'
        );
        await this.db.execAsync(
          'ALTER TABLE api_cache ADD COLUMN updated_at INTEGER NOT NULL DEFAULT 0'
        );
        console.log('✅ SQLite Database - Migration completed');
      } else {
        console.log(
          '✅ SQLite Database - Migration not needed, updated_at column already exists'
        );
      }
    } catch (error) {
      console.error(
        '❌ SQLite Database - Migration failed:',
        error instanceof Error ? error.message : 'Unknown error'
      );
      // Don't throw error, just log it
    }
  }

  async saveData(table: string, data: any): Promise<void> {
    try {
      await this.ensureConnection();
      await this.acquireLock();
      this.updateActivity();

      const timestamp = Date.now();
      const id =
        data.id ||
        `${table}_${timestamp}_${Math.random().toString(36).substr(2, 9)}`;
      const dataKeys = Object.keys(data).filter(key => key !== 'id');

      // Use prepared statement for better performance and security
      const query = `
        INSERT OR REPLACE INTO ${table} 
        (id, ${dataKeys.join(', ')}, created_at, updated_at)
        VALUES (?, ${dataKeys.map(() => '?').join(', ')}, ?, ?)
      `;

      const params = [
        id,
        ...dataKeys.map(key =>
          typeof data[key] === 'object' ? JSON.stringify(data[key]) : data[key]
        ),
        timestamp,
        timestamp,
      ];

      // Use transaction for better performance and atomicity
      await this.executeWithRetry(async () => {
        // Check if we're already in a transaction
        const inTransaction = await this.isInTransaction();
        if (!inTransaction) {
          await this.db!.execAsync('BEGIN TRANSACTION');
        }

        try {
          await this.db!.runAsync(query, params);
          if (!inTransaction) {
            await this.db!.execAsync('COMMIT');
          }
        } catch (error) {
          if (!inTransaction) {
            await this.db!.execAsync('ROLLBACK');
          }
          throw error;
        }
      }, `save data to ${table}`);

      console.log(`💾 SQLite Database - Saved data to ${table}: ${id}`);
    } catch (error) {
      console.error(
        `❌ SQLite Database - Failed to save data to ${table}:`,
        error instanceof Error ? error.message : 'Unknown error'
      );

      if (error instanceof Error && this.shouldResetDatabase(error.message)) {
        await this.handleDatabaseCorruption();
      }

      console.log(
        `⚠️ SQLite Database - Skipping save to ${table} due to error`
      );
    } finally {
      this.releaseLock();
    }
  }

  private async isInTransaction(): Promise<boolean> {
    try {
      const result = await this.db!.getAllAsync(
        'SELECT * FROM sqlite_master LIMIT 1'
      );
      return false; // If we can query, we're not in a failed transaction
    } catch (error) {
      return true; // If query fails, we might be in a failed transaction
    }
  }

  async getData(table: string, query?: string, params?: any[]): Promise<any[]> {
    try {
      await this.ensureConnection();
      await this.acquireLock();
      this.updateActivity();

      // Check if table exists first
      const tableExists = await this.executeWithRetry(async () => {
        const result = await this.db!.getAllAsync(
          "SELECT name FROM sqlite_master WHERE type='table' AND name=?",
          [table]
        );
        return result.length > 0;
      }, `check table ${table} exists`);

      if (!tableExists) {
        console.log(
          `⚠️ SQLite Database - Table ${table} does not exist, creating missing tables...`
        );
        await this.createTables();
        return [];
      }

      const sql = query || `SELECT * FROM ${table} ORDER BY created_at DESC`;

      // Use transaction for read operations to ensure consistency
      const result = await this.executeWithRetry(async () => {
        const inTransaction = await this.isInTransaction();
        if (!inTransaction) {
          await this.db!.execAsync('BEGIN TRANSACTION');
        }

        try {
          const data = await this.db!.getAllAsync(sql, params || []);
          if (!inTransaction) {
            await this.db!.execAsync('COMMIT');
          }
          return data;
        } catch (error) {
          if (!inTransaction) {
            await this.db!.execAsync('ROLLBACK');
          }
          throw error;
        }
      }, `get data from ${table}`);

      // Parse JSON fields
      const parsedResult = result.map((row: any) => {
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
        error instanceof Error ? error.message : 'Unknown error'
      );

      if (error instanceof Error && this.shouldResetDatabase(error.message)) {
        await this.handleDatabaseCorruption();
      }

      return [];
    } finally {
      this.releaseLock();
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
      await this.ensureConnection();
      await this.acquireLock();

      // Check if sync_queue table exists
      const tableCheck = await this.executeWithRetry(
        () =>
          this.db!.getAllAsync(
            "SELECT name FROM sqlite_master WHERE type='table' AND name='sync_queue'"
          ),
        'check sync_queue table existence'
      );

      if (tableCheck.length === 0) {
        console.log(
          "⚠️ SQLite Database - sync_queue table doesn't exist, creating missing tables..."
        );
        await this.createTables();
        return [];
      }

      const query = `SELECT * FROM sync_queue WHERE status = 'pending' ORDER BY timestamp ASC`;
      const result = await this.executeWithRetry(
        () => this.db!.getAllAsync(query),
        'get pending sync items'
      );

      const parsedResult = result.map((row: any) => ({
        ...row,
        data: JSON.parse(row.data),
      }));

      console.log(
        `📋 SQLite Database - Retrieved ${parsedResult.length} pending sync items`
      );
      return parsedResult;
    } catch (error) {
      console.error(
        '❌ SQLite Database - Failed to get pending sync:',
        error instanceof Error ? error.message : 'Unknown error'
      );

      if (error instanceof Error && this.shouldResetDatabase(error.message)) {
        await this.handleDatabaseCorruption();
      }

      return [];
    } finally {
      this.releaseLock();
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
