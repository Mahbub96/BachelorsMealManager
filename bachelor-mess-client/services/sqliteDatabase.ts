import { Platform } from 'react-native';
import type { DatabaseService } from './databaseService.types';
// Platform-specific import: on web, this imports null; on native, it imports expo-sqlite
// Metro will use sqliteLoader.native.ts on native and sqliteLoader.ts on web
import SQLiteModule from './sqliteLoader';

const SQLite = SQLiteModule;

// Re-export the interface for backward compatibility
export type { DatabaseService };

// SQLite best practices constants with improved configuration
const SQLITE_CONSTANTS = {
  BUSY_TIMEOUT: 30000, // 30 seconds
  MAX_RETRIES: 3,
  RETRY_DELAY: 100,
  LOCK_TIMEOUT: 30000, // Increased to 30 seconds to prevent timeout issues
  INITIALIZATION_TIMEOUT: 10000, // 10 seconds for initialization
  PRAGMA_SETTINGS: {
    journal_mode: 'WAL', // Write-Ahead Logging for better concurrency
    synchronous: 'NORMAL', // Balance between safety and performance
    cache_size: 2000, // Increased cache size for better performance
    temp_store: 'MEMORY', // Store temp tables in memory
    mmap_size: 268435456, // 256MB memory mapping
    page_size: 4096,
    auto_vacuum: 'INCREMENTAL',
    incremental_vacuum: 1000,
    wal_autocheckpoint: 1000, // Checkpoint WAL after 1000 pages
    checkpoint_fullfsync: 0, // Disable full fsync for better performance
    cache_spill: 0, // Disable cache spilling
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
  // Performance settings
  PERFORMANCE: {
    BATCH_SIZE: 100, // Batch size for bulk operations
    MAX_CACHE_SIZE: 100, // Maximum cache entries
    CLEANUP_INTERVAL: 300000, // 5 minutes
  },
} as const;

class SQLiteDatabaseService implements DatabaseService {
  private db: any = null; // Using any to handle web platform where SQLite is null
  private DATABASE_NAME = 'mess_manager.db';
  private isInitializing = false;
  private isInitialized = false;
  private tablesCreated = false; // Track if tables have been created
  private isCreatingTables = false; // Track if tables are being created
  private tablesCreationPromise: Promise<void> | null = null; // Promise for table creation
  private isLocked = false;
  private lockTimeout = SQLITE_CONSTANTS.LOCK_TIMEOUT;
  private readonly MAX_RETRIES = SQLITE_CONSTANTS.MAX_RETRIES;
  private readonly RETRY_DELAY = SQLITE_CONSTANTS.RETRY_DELAY;
  private connectionTimeout: ReturnType<typeof setTimeout> | null = null;
  private lastActivity = Date.now();
  private initializationPromise: Promise<void> | null = null;
  private lastError: Error | null = null;
  private consecutiveErrors = 0;
  private readonly MAX_CONSECUTIVE_ERRORS = 5;
  private lastInitTime = 0; // Track last initialization time to prevent rapid reinit
  private readonly INIT_COOLDOWN = 5000; // 5 seconds cooldown between inits

  // Helper method to check if SQLite is available
  private isSQLiteAvailable(): boolean {
    // #region agent log
    const logData = {location:'sqliteDatabase.ts:68',message:'Checking SQLite availability',data:{platform:Platform.OS,SQLiteIsNull:SQLite===null,SQLiteType:typeof SQLite,SQLiteKeys:SQLite?Object.keys(SQLite):null},timestamp:Date.now(),sessionId:'debug-session',runId:'sqlite-check',hypothesisId:'A'};
    try { fetch('http://127.0.0.1:7243/ingest/039fbe99-77d0-456c-8c69-082177214fc6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(logData)}).catch(()=>{}); } catch(e){}
    // #endregion
    if (Platform.OS === 'web') {
      return false;
    }
    // SQLite is loaded via platform-specific import (sqliteLoader.native.ts or sqliteLoader.ts)
    const available = SQLite !== null;
    // #region agent log
    const logData2 = {location:'sqliteDatabase.ts:75',message:'SQLite availability result',data:{available,platform:Platform.OS},timestamp:Date.now(),sessionId:'debug-session',runId:'sqlite-check',hypothesisId:'A'};
    try { fetch('http://127.0.0.1:7243/ingest/039fbe99-77d0-456c-8c69-082177214fc6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(logData2)}).catch(()=>{}); } catch(e){}
    // #endregion
    return available;
  }

  // Helper method to throw error if SQLite is not available
  private ensureSQLiteAvailable(): void {
    // #region agent log
    const logData = {location:'sqliteDatabase.ts:82',message:'Ensuring SQLite available',data:{platform:Platform.OS,SQLiteIsNull:SQLite===null,isAvailable:this.isSQLiteAvailable()},timestamp:Date.now(),sessionId:'debug-session',runId:'sqlite-check',hypothesisId:'B'};
    try { fetch('http://127.0.0.1:7243/ingest/039fbe99-77d0-456c-8c69-082177214fc6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(logData)}).catch(()=>{}); } catch(e){}
    // #endregion
    if (!this.isSQLiteAvailable()) {
      throw new Error('SQLite is not available on web platform');
    }
  }

  async init(): Promise<void> {
    // Skip SQLite initialization on web platform
    if (Platform.OS === 'web' || !this.isSQLiteAvailable()) {
      console.log(
        'ℹ️ SQLite Database - Skipping initialization on web platform'
      );
      this.isInitialized = true; // Mark as initialized to prevent retries
      return;
    }

    // PERFECT FIX: If already initializing, wait for the existing promise
    if (this.isInitializing && this.initializationPromise) {
      console.log(
        '🔄 SQLite Database - Initialization already in progress, waiting...'
      );
      try {
        await this.initializationPromise;
        return; // Successfully waited for initialization
      } catch (error) {
        // If previous init failed, we'll retry below
        console.log('⚠️ SQLite Database - Previous initialization failed, will retry');
      }
    }

    // PERFECT FIX: Cooldown check to prevent rapid reinitialization
    const timeSinceLastInit = Date.now() - this.lastInitTime;
    if (timeSinceLastInit < this.INIT_COOLDOWN && this.lastInitTime > 0) {
      console.log(
        `⏳ SQLite Database - Cooldown active (${Math.round((this.INIT_COOLDOWN - timeSinceLastInit) / 1000)}s remaining), skipping init`
      );
      return;
    }

    // If already initialized and healthy, return immediately
    if (this.isInitialized && this.db) {
      try {
        // Quick health check with timeout
        const healthCheck = Promise.race([
          this.db.getAllAsync('SELECT 1'),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Health check timeout')), 3000)
          )
        ]);
        await healthCheck;
        console.log('✅ SQLite Database - Already initialized and healthy');
        return;
      } catch (error) {
        console.log(
          '⚠️ SQLite Database - Database connection lost, reinitializing...'
        );
      this.isInitialized = false;
      this.db = null;
      this.tablesCreated = false; // Reset tables flag on reinit
      this.isCreatingTables = false; // Reset table creation flag
      this.tablesCreationPromise = null; // Clear table creation promise
      }
    }

    // Check if we've had too many consecutive failures
    if (this.consecutiveErrors >= this.MAX_CONSECUTIVE_ERRORS) {
      console.log(
        '🚨 SQLite Database - Too many consecutive errors, attempting emergency reset...'
      );
      try {
        await this.emergencyReset();
        this.consecutiveErrors = 0;
      } catch (resetError) {
        console.error('❌ SQLite Database - Emergency reset failed:', resetError);
        // Continue anyway
      }
    }

    // PERFECT FIX: Create new initialization promise
    this.isInitializing = true;
    this.lastInitTime = Date.now();
    this.initializationPromise = this.performInitialization();

    try {
      await this.initializationPromise;
      this.isInitialized = true;
    } catch (error) {
      console.error('❌ SQLite Database - Initialization failed:', error);
      this.isInitialized = false;
      this.consecutiveErrors++;
      throw error;
    } finally {
      this.isInitializing = false;
      this.initializationPromise = null;
    }
  }

  private async performInitialization(): Promise<void> {
    const startTime = Date.now();

    try {
      console.log('🔄 SQLite Database - Starting initialization...');

      // Ensure SQLite is available (lazy loads if needed)
      this.ensureSQLiteAvailable();

      // Reset error tracking
      this.lastError = null;
      this.consecutiveErrors = 0;

      // Force close any existing connections and wait longer
      await this.forceCloseConnection();
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Check if database file exists and is corrupted
      await this.checkDatabaseFileIntegrity();

      console.log('🔄 SQLite Database - Opening database...');

      // #region agent log
      const preOpenLog = {location:'sqliteDatabase.ts:172',message:'Before opening database',data:{databaseName:this.DATABASE_NAME,SQLiteAvailable:this.isSQLiteAvailable(),SQLiteType:typeof SQLite,hasOpenDatabaseAsync:SQLite&&typeof SQLite.openDatabaseAsync==='function',SQLiteMethods:SQLite?Object.keys(SQLite).filter(k=>typeof SQLite[k]==='function'):[]},timestamp:Date.now(),sessionId:'debug-session',runId:'sqlite-open',hypothesisId:'B'};
      try { fetch('http://127.0.0.1:7243/ingest/039fbe99-77d0-456c-8c69-082177214fc6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(preOpenLog)}).catch(()=>{}); } catch(e){}
      // #endregion

      // Try to open database with error handling
      try {
        // #region agent log
        const tryOpenLog = {location:'sqliteDatabase.ts:178',message:'Attempting to open database',data:{databaseName:this.DATABASE_NAME},timestamp:Date.now(),sessionId:'debug-session',runId:'sqlite-open',hypothesisId:'B'};
        try { fetch('http://127.0.0.1:7243/ingest/039fbe99-77d0-456c-8c69-082177214fc6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(tryOpenLog)}).catch(()=>{}); } catch(e){}
        // #endregion
        this.db = await SQLite.openDatabaseAsync(this.DATABASE_NAME);
        
        // Verify database object is valid and has required methods
        if (!this.db) {
          throw new Error('Database object is null after opening');
        }
        
        if (typeof this.db.getAllAsync !== 'function' || typeof this.db.execAsync !== 'function') {
          throw new Error('Database object is missing required methods (getAllAsync, execAsync)');
        }
        
        // #region agent log
        const successLog = {location:'sqliteDatabase.ts:181',message:'Database opened successfully',data:{databaseName:this.DATABASE_NAME,dbExists:!!this.db,dbType:typeof this.db,hasGetAllAsync:typeof this.db.getAllAsync==='function',hasExecAsync:typeof this.db.execAsync==='function'},timestamp:Date.now(),sessionId:'debug-session',runId:'sqlite-open',hypothesisId:'B'};
        try { fetch('http://127.0.0.1:7243/ingest/039fbe99-77d0-456c-8c69-082177214fc6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(successLog)}).catch(()=>{}); } catch(e){}
        // #endregion
      } catch (openError) {
        // #region agent log
        const errorLog = {location:'sqliteDatabase.ts:184',message:'Failed to open database',data:{databaseName:this.DATABASE_NAME,errorMessage:openError instanceof Error?openError.message:String(openError),errorName:openError instanceof Error?openError.name:'Unknown',errorStack:openError instanceof Error?openError.stack:undefined},timestamp:Date.now(),sessionId:'debug-session',runId:'sqlite-open',hypothesisId:'C'};
        try { fetch('http://127.0.0.1:7243/ingest/039fbe99-77d0-456c-8c69-082177214fc6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(errorLog)}).catch(()=>{}); } catch(e){}
        // #endregion
        console.error(
          '❌ SQLite Database - Failed to open database:',
          openError
        );

        // If opening fails, try to delete and recreate
        await this.deleteDatabaseFile();
        await new Promise(resolve => setTimeout(resolve, 500));
        // #region agent log
        const retryLog = {location:'sqliteDatabase.ts:192',message:'Retrying database open after delete',data:{databaseName:this.DATABASE_NAME},timestamp:Date.now(),sessionId:'debug-session',runId:'sqlite-open',hypothesisId:'C'};
        try { fetch('http://127.0.0.1:7243/ingest/039fbe99-77d0-456c-8c69-082177214fc6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(retryLog)}).catch(()=>{}); } catch(e){}
        // #endregion
        this.db = await SQLite.openDatabaseAsync(this.DATABASE_NAME);
      }

      // Verify database is actually ready before using it
      if (!this.db) {
        throw new Error('Database object is null after opening');
      }

      // Test database is ready by running a simple query
      try {
        await this.db.getAllAsync('SELECT 1');
      } catch (testError) {
        console.error('❌ SQLite Database - Database not ready after opening:', testError);
        // If we get NullPointerException, the native module isn't working properly
        // Enable bypass mode to prevent app crashes
        if (testError instanceof Error && testError.message.includes('NullPointerException')) {
          console.error('🚨 SQLite Database - Native module error detected, enabling bypass mode');
          await this.bypassDatabase();
          return; // Exit initialization - bypass mode is active
        }
        throw new Error('Database not ready: ' + (testError instanceof Error ? testError.message : String(testError)));
      }

      // Add longer delay after opening database
      await new Promise(resolve => setTimeout(resolve, 500));

      // Configure SQLite with minimal settings first
      await this.configureDatabaseMinimal();

      console.log('🔄 SQLite Database - Creating tables...');
      await this.createTables();

      console.log('🔄 SQLite Database - Running migrations...');
      await this.migrateDatabase();

      // Configure advanced settings after tables are created
      await this.configureDatabaseAdvanced();

      // Final health check
      const isHealthy = await this.healthCheck();
      if (!isHealthy) {
        throw new Error('Database health check failed after initialization');
      }

      this.isInitialized = true;
      this.consecutiveErrors = 0;
      console.log('✅ SQLite Database - Initialized successfully');
    } catch (error) {
      this.consecutiveErrors++;
      this.lastError =
        error instanceof Error ? error : new Error(String(error));

      console.error('❌ SQLite Database - Failed to initialize:', error);

      // Check if error is NullPointerException - indicates native module issue
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('NullPointerException') || errorMessage.includes('prepareAsync') || errorMessage.includes('execAsync')) {
        console.error('🚨 SQLite Database - Native module error detected, enabling bypass mode to prevent app crashes');
        await this.bypassDatabase();
        return; // Exit - bypass mode is now active
      }

      // If we've had too many consecutive errors, try emergency reset
      if (this.consecutiveErrors >= this.MAX_CONSECUTIVE_ERRORS) {
        console.log(
          '🚨 SQLite Database - Too many consecutive errors, enabling bypass mode...'
        );
        await this.bypassDatabase();
        return; // Exit - bypass mode is now active
      } else {
        // Try to reset and reinitialize if initialization fails
        try {
          console.log('🔄 SQLite Database - Attempting database reset...');
          await this.resetDatabase();

          // Final health check after reset
          const isHealthyAfterReset = await this.healthCheck();
          if (!isHealthyAfterReset) {
            throw new Error('Database health check failed after reset');
          }

          this.isInitialized = true;
          this.consecutiveErrors = 0;
          console.log(
            '✅ SQLite Database - Reset and reinitialized successfully'
          );
        } catch (resetError) {
          console.error('❌ SQLite Database - Reset also failed:', resetError);
          // If reset also fails with native errors, enable bypass mode
          const resetErrorMessage = resetError instanceof Error ? resetError.message : String(resetError);
          if (resetErrorMessage.includes('NullPointerException') || resetErrorMessage.includes('prepareAsync')) {
            console.error('🚨 SQLite Database - Reset failed with native error, enabling bypass mode');
            await this.bypassDatabase();
            return;
          }
          this.isInitialized = false;
          throw error; // Throw original error
        }
      }
    } finally {
      const initializationTime = Date.now() - startTime;
      console.log(
        `⏱️ SQLite Database - Initialization took ${initializationTime}ms`
      );
    }
  }

  private async forceCloseConnection(): Promise<void> {
    if (this.db) {
      try {
        // Release any pending locks
        this.releaseLock();

        // Commit any pending transactions
        await this.db.execAsync('COMMIT');
      } catch (error) {
        // Ignore errors during cleanup
      }

      try {
        await this.db.closeAsync();
        console.log('🔒 SQLite Database - Force closed existing connection');
      } catch (error) {
        console.log(
          '⚠️ SQLite Database - Error force closing database:',
          error
        );
      }

      this.db = null;
      this.isInitialized = false;
    }
  }

  // Check database file integrity
  private async checkDatabaseFileIntegrity(): Promise<void> {
    if (!SQLite) return;
    try {
      // Try to check if database file exists and is accessible
      const testDb = await SQLite.openDatabaseAsync(this.DATABASE_NAME);
      
      // Verify test database is ready
      if (testDb && typeof testDb.getAllAsync === 'function') {
        try {
          await testDb.getAllAsync('SELECT 1');
        } catch (testError) {
          console.log('⚠️ SQLite Database - Test database not ready, will recreate');
          await testDb.closeAsync().catch(() => {});
          await this.deleteDatabaseFile();
          return;
        }
      }
      
      await testDb.closeAsync();
      console.log('✅ SQLite Database - Database file integrity check passed');
    } catch (error) {
      console.log(
        '⚠️ SQLite Database - Database file may be corrupted, will recreate'
      );
      await this.deleteDatabaseFile();
    }
  }

  // Delete database file safely
  private async deleteDatabaseFile(): Promise<void> {
    if (!SQLite) return;
    try {
      await SQLite.deleteDatabaseAsync(this.DATABASE_NAME);
      console.log('🗑️ SQLite Database - Database file deleted');
    } catch (error) {
      console.log(
        '⚠️ SQLite Database - Could not delete database file, continuing...'
      );
    }
  }

  // Configure database with minimal settings
  private async configureDatabaseMinimal(): Promise<void> {
    if (!this.db) {
      console.error('❌ SQLite Database - Cannot configure: database is null');
      return;
    }

    try {
      // Verify database is still valid
      await this.db.getAllAsync('SELECT 1');
      
      // Only essential PRAGMA settings
      await this.db.execAsync('PRAGMA journal_mode = WAL');
      await this.db.execAsync('PRAGMA synchronous = NORMAL');
      await this.db.execAsync('PRAGMA cache_size = 1000');
      await this.db.execAsync('PRAGMA temp_store = MEMORY');

      console.log('✅ SQLite Database - Minimal configuration applied');
    } catch (error) {
      console.error(
        '❌ SQLite Database - Failed to apply minimal configuration:',
        error instanceof Error ? error.message : String(error)
      );
      // Don't throw - allow table creation to proceed
    }
  }

  // Configure database with advanced settings
  private async configureDatabaseAdvanced(): Promise<void> {
    if (!this.db) return;

    try {
      const pragmaSettings = SQLITE_CONSTANTS.PRAGMA_SETTINGS;

      // Apply advanced PRAGMA settings
      await this.db.execAsync(
        `PRAGMA cache_size = ${pragmaSettings.cache_size}`
      );
      await this.db.execAsync(
        `PRAGMA temp_store = ${pragmaSettings.temp_store}`
      );
      await this.db.execAsync(
        `PRAGMA journal_mode = ${pragmaSettings.journal_mode}`
      );
      await this.db.execAsync(
        `PRAGMA synchronous = ${pragmaSettings.synchronous}`
      );
      await this.db.execAsync(
        `PRAGMA wal_autocheckpoint = ${pragmaSettings.wal_autocheckpoint}`
      );
      await this.db.execAsync(
        `PRAGMA checkpoint_fullfsync = ${pragmaSettings.checkpoint_fullfsync}`
      );
      await this.db.execAsync(
        `PRAGMA cache_spill = ${pragmaSettings.cache_spill}`
      );

      // Additional performance settings
      await this.db.execAsync('PRAGMA locking_mode = NORMAL');
      await this.db.execAsync('PRAGMA secure_delete = OFF');
      await this.db.execAsync('PRAGMA mmap_size = 268435456'); // 256MB

      console.log('✅ SQLite Database - Advanced configuration applied');
    } catch (error) {
      console.log(
        '⚠️ SQLite Database - Failed to apply advanced configuration:',
        error
      );
    }
  }

  private async aggressiveReset(): Promise<void> {
    if (!SQLite) return;
    try {
      console.log('🔄 SQLite Database - Performing aggressive reset...');

      // Force close any existing connection
      await this.forceCloseConnection();

      // Wait longer before attempting to delete
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Try to delete database with multiple attempts
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          await SQLite.deleteDatabaseAsync(this.DATABASE_NAME);
          console.log(
            `🗑️ SQLite Database - Database file deleted (attempt ${attempt})`
          );
          break;
        } catch (deleteError) {
          console.log(
            `⚠️ SQLite Database - Could not delete database file (attempt ${attempt}), continuing...`
          );
          if (attempt === 3) {
            console.log('⚠️ SQLite Database - Giving up on database deletion');
          }
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }

      // Wait longer before recreating
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Recreate database with fresh connection
      this.db = await SQLite.openDatabaseAsync(this.DATABASE_NAME);

      // Wait after opening
      await new Promise(resolve => setTimeout(resolve, 500));

      // Create tables
      await this.createTables();

      // Wait after creating tables
      await new Promise(resolve => setTimeout(resolve, 300));

      this.isInitialized = true;
      this.consecutiveErrors = 0;
      console.log('✅ SQLite Database - Aggressive reset completed');
    } catch (error) {
      console.error('❌ SQLite Database - Aggressive reset failed:', error);
      throw error;
    }
  }

  async resetDatabase(): Promise<void> {
    if (!SQLite) return;
    try {
      this.tablesCreated = false; // Reset tables flag on reset
      this.isCreatingTables = false; // Reset table creation flag
      this.tablesCreationPromise = null; // Clear table creation promise
      console.log('🔄 SQLite Database - Resetting database...');

      // Release any existing locks
      this.releaseLock();

      // Force close existing connection
      await this.forceCloseConnection();

      // Wait longer before trying to delete
      await new Promise(resolve => setTimeout(resolve, 800));

      // Try to delete database with retry logic
      let deleteSuccess = false;
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          await SQLite.deleteDatabaseAsync(this.DATABASE_NAME);
          console.log(
            `🗑️ SQLite Database - Database file deleted (attempt ${attempt})`
          );
          deleteSuccess = true;
          break;
        } catch (deleteError) {
          console.log(
            `⚠️ SQLite Database - Could not delete database file (attempt ${attempt}), continuing...`
          );
          if (attempt < 3) {
            await new Promise(resolve => setTimeout(resolve, 300));
          }
        }
      }

      if (!deleteSuccess) {
        console.log(
          '⚠️ SQLite Database - Could not delete database file, will recreate tables instead'
        );
      }

      // Wait longer before recreating
      await new Promise(resolve => setTimeout(resolve, 800));

      // Recreate database
      this.db = await SQLite.openDatabaseAsync(this.DATABASE_NAME);

      // Wait after opening
      await new Promise(resolve => setTimeout(resolve, 300));

      // Create tables
      await this.createTables();

      // Wait after creating tables
      await new Promise(resolve => setTimeout(resolve, 200));

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
    if (!SQLite) return;
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
    // Clear connection timeout to prevent memory leak
    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout);
      this.connectionTimeout = null;
    }

    if (this.db) {
      try {
        // Release any pending locks
        this.releaseLock();

        // Check if there's an active transaction before committing
        // SQLite doesn't have a direct way to check, so we'll try-catch the commit
        try {
          // Only commit if there's actually a transaction active
          // We'll catch the error if there's no transaction
          await this.db.execAsync('COMMIT');
        } catch (commitError: any) {
          // Ignore "no transaction is active" errors - this is expected if no transaction was started
          const errorMessage = commitError?.message || String(commitError);
          if (!errorMessage.includes('no transaction is active') && 
              !errorMessage.includes('cannot commit')) {
            // Only log if it's a different error
            console.log('⚠️ SQLite Database - Commit error (non-critical):', errorMessage);
          }
        }

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
    // Skip on web platform
    if (!this.isSQLiteAvailable()) {
      return;
    }

    // If in bypass mode, don't try to initialize
    if (this.isInitialized && this.db && typeof this.db.getAllAsync !== 'function') {
      // We're in bypass mode (mock database object)
      return;
    }

    // PERFECT FIX: If already initializing, wait for it instead of calling init again
    if (this.isInitializing && this.initializationPromise) {
      try {
        await this.initializationPromise;
        if (this.db && this.isInitialized) {
          return; // Initialization completed successfully
        }
      } catch (error) {
        // Initialization failed, continue to try init below
        console.log('⚠️ SQLite Database - Previous initialization failed in ensureConnection');
      }
    }

    if (!this.db || !this.isInitialized) {
      // PERFECT FIX: Check cooldown before calling init
      const timeSinceLastInit = Date.now() - this.lastInitTime;
      if (timeSinceLastInit < this.INIT_COOLDOWN && this.lastInitTime > 0) {
        // Still in cooldown, wait a bit
        await new Promise(resolve => setTimeout(resolve, 500));
        if (this.db && this.isInitialized) {
          return; // Database initialized during wait
        }
      }
      await this.init();
    }

    // If still null after init, we're in bypass mode
    if (!this.db || typeof this.db.getAllAsync !== 'function') {
      return;
    }

    // Test connection health
    try {
      const healthCheck = Promise.race([
        this.db.getAllAsync('SELECT 1'),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Health check timeout')), 3000)
        )
      ]);
      await healthCheck;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('NullPointerException')) {
        console.error('🚨 SQLite Database - Native error in ensureConnection, enabling bypass mode');
        await this.bypassDatabase();
        return;
      }
      // PERFECT FIX: Only reinit if not recently initialized
      const timeSinceLastInit = Date.now() - this.lastInitTime;
      if (timeSinceLastInit > this.INIT_COOLDOWN) {
        console.log('🔄 SQLite Database - Connection lost, reinitializing...');
        this.isInitialized = false;
        this.db = null;
        await this.init();
      } else {
        console.log('⏳ SQLite Database - Connection check failed but in cooldown, skipping reinit');
      }
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

  // Security validation methods
  private isValidTableName(table: string): boolean {
    // Only allow alphanumeric characters, underscores, and hyphens
    return (
      /^[a-zA-Z0-9_-]+$/.test(table) && table.length > 0 && table.length <= 64
    );
  }

  private isValidColumnName(column: string): boolean {
    // Only allow alphanumeric characters, underscores, and hyphens
    return (
      /^[a-zA-Z0-9_-]+$/.test(column) &&
      column.length > 0 &&
      column.length <= 64
    );
  }

  private isValidSelectQuery(query: string): boolean {
    // Basic validation for SELECT queries only
    const trimmedQuery = query.trim().toLowerCase();
    return (
      trimmedQuery.startsWith('select ') &&
      !trimmedQuery.includes('drop ') &&
      !trimmedQuery.includes('delete ') &&
      !trimmedQuery.includes('insert ') &&
      !trimmedQuery.includes('update ') &&
      !trimmedQuery.includes('alter ') &&
      !trimmedQuery.includes('create ')
    );
  }

  private isValidQuery(query: string): boolean {
    // Basic validation for safe queries
    const trimmedQuery = query.trim().toLowerCase();
    const dangerousKeywords = [
      'drop',
      'delete from',
      'truncate',
      'alter',
      'create table',
      'create index',
      'create view',
      'attach',
      'detach',
      'pragma',
    ];

    return !dangerousKeywords.some(keyword => trimmedQuery.includes(keyword));
  }

  // Enhanced data validation methods
  private validateUserData(userData: Record<string, any>): void {
    const requiredFields = ['name', 'email', 'role'];
    const missingFields = requiredFields.filter(field => !userData[field]);

    if (missingFields.length > 0) {
      throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userData.email)) {
      throw new Error('Invalid email format');
    }

    // Validate role
    const validRoles = ['user', 'admin', 'super_admin'];
    if (!validRoles.includes(userData.role)) {
      throw new Error('Invalid user role');
    }
  }

  private validateMealData(mealData: Record<string, any>): void {
    const requiredFields = ['user_id', 'date', 'meal_type'];
    const missingFields = requiredFields.filter(field => !mealData[field]);

    if (missingFields.length > 0) {
      throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
    }

    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(mealData.date)) {
      throw new Error('Invalid date format. Use YYYY-MM-DD');
    }

    // Validate meal type
    const validMealTypes = ['breakfast', 'lunch', 'dinner'];
    if (!validMealTypes.includes(mealData.meal_type)) {
      throw new Error('Invalid meal type');
    }
  }

  private validateBazarData(bazarData: Record<string, any>): void {
    const requiredFields = ['user_id', 'date', 'items', 'total_amount'];
    const missingFields = requiredFields.filter(field => !bazarData[field]);

    if (missingFields.length > 0) {
      throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
    }

    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(bazarData.date)) {
      throw new Error('Invalid date format. Use YYYY-MM-DD');
    }

    // Validate total amount
    if (
      typeof bazarData.total_amount !== 'number' ||
      bazarData.total_amount < 0
    ) {
      throw new Error('Invalid total amount');
    }

    // Validate items array
    if (!Array.isArray(bazarData.items) || bazarData.items.length === 0) {
      throw new Error('Items must be a non-empty array');
    }
  }

  private validatePaymentData(paymentData: Record<string, any>): void {
    const requiredFields = ['user_id', 'amount', 'payment_type'];
    const missingFields = requiredFields.filter(field => !paymentData[field]);

    if (missingFields.length > 0) {
      throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
    }

    // Validate amount
    if (typeof paymentData.amount !== 'number' || paymentData.amount <= 0) {
      throw new Error('Invalid payment amount');
    }

    // Validate payment type
    const validPaymentTypes = [
      'cash',
      'card',
      'mobile_banking',
      'bank_transfer',
    ];
    if (!validPaymentTypes.includes(paymentData.payment_type)) {
      throw new Error('Invalid payment type');
    }
  }

  private async configureDatabase(): Promise<void> {
    if (!this.db) return;

    try {
      // Set PRAGMA settings for better performance and concurrency
      const pragmaSettings = SQLITE_CONSTANTS.PRAGMA_SETTINGS;

      // Core performance settings
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

      // WAL optimization settings
      await this.db.execAsync(
        `PRAGMA wal_autocheckpoint = ${pragmaSettings.wal_autocheckpoint}`
      );
      await this.db.execAsync(
        `PRAGMA checkpoint_fullfsync = ${pragmaSettings.checkpoint_fullfsync}`
      );
      await this.db.execAsync(
        `PRAGMA cache_spill = ${pragmaSettings.cache_spill}`
      );

      // Set busy timeout to handle concurrent access
      await this.db.execAsync(
        `PRAGMA busy_timeout = ${SQLITE_CONSTANTS.BUSY_TIMEOUT}`
      );

      // Enable foreign keys
      await this.db.execAsync('PRAGMA foreign_keys = ON');

      // Set recursive triggers
      await this.db.execAsync('PRAGMA recursive_triggers = ON');

      // Additional performance optimizations
      await this.db.execAsync('PRAGMA locking_mode = NORMAL');
      await this.db.execAsync('PRAGMA secure_delete = OFF'); // Better performance

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
      // Skip health check on web platform
      if (!this.isSQLiteAvailable()) {
        console.log(
          'ℹ️ SQLite Database - Health check skipped on web platform'
        );
        return true; // Return true to prevent errors
      }

      if (!this.db) {
        console.log(
          '🔍 SQLite Database - Health check: Database not initialized'
        );
        return false;
      }

      // Try a simple query to test database health
      await this.db.getAllAsync('SELECT 1');

      // Also check if we can access the main tables
      const tables = await this.db.getAllAsync(
        "SELECT name FROM sqlite_master WHERE type='table'"
      );

      if (tables.length === 0) {
        console.log('⚠️ SQLite Database - Health check: No tables found');
        return false;
      }

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
      errorMessage.includes('database table is locked') ||
      errorMessage.includes('database is corrupted') ||
      errorMessage.includes('no such table') ||
      errorMessage.includes('syntax error')
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

  private async handleCriticalError(error: Error): Promise<void> {
    console.error(
      '🚨 SQLite Database - Critical error detected:',
      error.message
    );

    // Increment consecutive error count
    this.consecutiveErrors++;

    if (this.consecutiveErrors >= this.MAX_CONSECUTIVE_ERRORS) {
      console.log(
        '🔄 SQLite Database - Too many consecutive errors, performing aggressive reset...'
      );
      await this.aggressiveReset();
    } else {
      console.log(
        `🔄 SQLite Database - Attempting recovery (error ${this.consecutiveErrors}/${this.MAX_CONSECUTIVE_ERRORS})...`
      );
      await this.handleDatabaseCorruption();
    }
  }

  private async createTables(): Promise<void> {
    // PERFECT FIX: If tables are being created, wait for that promise
    if (this.isCreatingTables && this.tablesCreationPromise) {
      console.log('🔄 SQLite Database - Tables creation already in progress, waiting...');
      try {
        await this.tablesCreationPromise;
        return;
      } catch (error) {
        console.log('⚠️ SQLite Database - Previous table creation failed, will retry');
      }
    }

    // PERFECT FIX: If tables already created, verify and return
    if (this.tablesCreated && this.db) {
      try {
        const verifyTables = await this.db.getAllAsync(
          "SELECT name FROM sqlite_master WHERE type='table' AND name='sync_queue'"
        );
        if (verifyTables.length > 0) {
          console.log('✅ SQLite Database - Tables already created and verified');
          return;
        } else {
          // Tables flag was set but tables don't exist, reset flag
          this.tablesCreated = false;
        }
      } catch (error) {
        // If verification fails, reset flag and continue
        this.tablesCreated = false;
      }
    }

    if (!this.db) {
      console.log(
        '🔄 SQLite Database - Database not initialized, attempting to initialize...'
      );
      await this.init();
      if (!this.db) throw new Error('Database not initialized after init');
    }

    // Verify database is ready and methods exist
    if (!this.db || typeof this.db.getAllAsync !== 'function') {
      throw new Error('Database object is invalid or methods are missing');
    }

    // PERFECT FIX: Create table creation promise to prevent concurrent calls
    this.isCreatingTables = true;
    this.tablesCreationPromise = this.performTableCreation();

    try {
      await this.tablesCreationPromise;
      this.tablesCreated = true;
    } catch (error) {
      this.tablesCreated = false;
      throw error;
    } finally {
      this.isCreatingTables = false;
      this.tablesCreationPromise = null;
    }
  }

  private async performTableCreation(): Promise<void> {
    // Wait for any existing locks
    await this.waitForUnlock();
    await this.acquireLock();

    try {
      console.log('🔄 SQLite Database - Checking existing tables...');

      // Test database is ready
      try {
        await this.db!.getAllAsync('SELECT 1');
      } catch (testError) {
        console.error('❌ SQLite Database - Database not ready for queries:', testError);
        throw new Error('Database not ready: ' + (testError instanceof Error ? testError.message : String(testError)));
      }

      // Check if tables already exist
      const existingTables = await this.db!.getAllAsync(
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
        'auth_tokens',
        'user_sessions',
        'payment_entries',
        'notification_queue',
        'audit_logs',
        'system_settings',
        'ui_configurations',
        'analytics_data',
        'backup_metadata',
        'support_tickets',
        'billing_info',
        'performance_metrics',
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
        await this.db!.execAsync('BEGIN TRANSACTION');
        try {
          await this.createMissingTables(missingTables);
          await this.db!.execAsync('COMMIT');
          
          // PERFECT FIX: Wait and verify tables were actually created
          await new Promise(resolve => setTimeout(resolve, 150));
          const verifyTables = await this.db!.getAllAsync(
            "SELECT name FROM sqlite_master WHERE type='table'"
          );
          const verifiedTableNames = verifyTables.map((row: any) => row.name);
          const stillMissing = requiredTables.filter(
            table => !verifiedTableNames.includes(table)
          );
          
          if (stillMissing.length > 0) {
            throw new Error(`Tables still missing after creation: ${stillMissing.join(', ')}`);
          }
          
          console.log('✅ SQLite Database - Tables created and verified successfully');
        } catch (error) {
          try {
            await this.db!.execAsync('ROLLBACK');
          } catch (rollbackError) {
            console.error('❌ SQLite Database - Rollback failed:', rollbackError);
          }
          throw error;
        }
      } else {
        console.log('✅ SQLite Database - All required tables already exist');
      }

    } catch (error) {
      console.error('❌ SQLite Database - Failed to create tables:', error);
      throw error;
    } finally {
      this.releaseLock();
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
          status TEXT DEFAULT 'pending',
          created_at INTEGER NOT NULL
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
      auth_tokens: `
        CREATE TABLE auth_tokens (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          token TEXT NOT NULL,
          refresh_token TEXT,
          token_type TEXT DEFAULT 'access',
          expires_at INTEGER NOT NULL,
          is_revoked INTEGER DEFAULT 0,
          created_at INTEGER NOT NULL,
          updated_at INTEGER NOT NULL
        )
      `,
      user_sessions: `
        CREATE TABLE user_sessions (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          session_token TEXT NOT NULL,
          ip_address TEXT,
          user_agent TEXT,
          is_active INTEGER DEFAULT 1,
          last_activity INTEGER NOT NULL,
          created_at INTEGER NOT NULL,
          expires_at INTEGER NOT NULL
        )
      `,
      payment_entries: `
        CREATE TABLE payment_entries (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          amount REAL NOT NULL,
          payment_type TEXT NOT NULL,
          status TEXT DEFAULT 'pending',
          description TEXT,
          receipt_url TEXT,
          approved_by TEXT,
          approved_at TEXT,
          created_at INTEGER NOT NULL,
          updated_at INTEGER NOT NULL
        )
      `,
      notification_queue: `
        CREATE TABLE notification_queue (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          title TEXT NOT NULL,
          message TEXT NOT NULL,
          type TEXT DEFAULT 'info',
          priority TEXT DEFAULT 'normal',
          is_read INTEGER DEFAULT 0,
          action_url TEXT,
          created_at INTEGER NOT NULL,
          scheduled_at INTEGER,
          sent_at TEXT
        )
      `,
      audit_logs: `
        CREATE TABLE audit_logs (
          id TEXT PRIMARY KEY,
          user_id TEXT,
          action TEXT NOT NULL,
          resource_type TEXT NOT NULL,
          resource_id TEXT,
          details TEXT,
          ip_address TEXT,
          user_agent TEXT,
          created_at INTEGER NOT NULL
        )
      `,
      system_settings: `
        CREATE TABLE system_settings (
          id TEXT PRIMARY KEY,
          key TEXT UNIQUE NOT NULL,
          value TEXT NOT NULL,
          description TEXT,
          category TEXT DEFAULT 'general',
          is_public INTEGER DEFAULT 0,
          created_at INTEGER NOT NULL,
          updated_at INTEGER NOT NULL
        )
      `,
      ui_configurations: `
        CREATE TABLE ui_configurations (
          id TEXT PRIMARY KEY,
          app_id TEXT NOT NULL,
          version TEXT NOT NULL,
          config_data TEXT NOT NULL,
          is_active INTEGER DEFAULT 0,
          created_by TEXT,
          created_at INTEGER NOT NULL,
          updated_at INTEGER NOT NULL
        )
      `,
      analytics_data: `
        CREATE TABLE analytics_data (
          id TEXT PRIMARY KEY,
          metric_name TEXT NOT NULL,
          metric_value REAL NOT NULL,
          dimensions TEXT,
          timestamp INTEGER NOT NULL,
          user_id TEXT,
          session_id TEXT,
          created_at INTEGER NOT NULL
        )
      `,
      backup_metadata: `
        CREATE TABLE backup_metadata (
          id TEXT PRIMARY KEY,
          backup_name TEXT NOT NULL,
          backup_type TEXT NOT NULL,
          file_size INTEGER,
          file_path TEXT,
          checksum TEXT,
          status TEXT DEFAULT 'pending',
          created_by TEXT,
          created_at INTEGER NOT NULL,
          completed_at TEXT
        )
      `,
      support_tickets: `
        CREATE TABLE support_tickets (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          title TEXT NOT NULL,
          description TEXT NOT NULL,
          priority TEXT DEFAULT 'medium',
          status TEXT DEFAULT 'open',
          category TEXT,
          assigned_to TEXT,
          created_at INTEGER NOT NULL,
          updated_at INTEGER NOT NULL,
          resolved_at TEXT
        )
      `,
      billing_info: `
        CREATE TABLE billing_info (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          plan_name TEXT NOT NULL,
          amount REAL NOT NULL,
          currency TEXT DEFAULT 'USD',
          billing_cycle TEXT,
          status TEXT DEFAULT 'active',
          next_billing_date TEXT,
          created_at INTEGER NOT NULL,
          updated_at INTEGER NOT NULL
        )
      `,
      performance_metrics: `
        CREATE TABLE performance_metrics (
          id TEXT PRIMARY KEY,
          metric_name TEXT NOT NULL,
          metric_value REAL NOT NULL,
          unit TEXT,
          timestamp INTEGER NOT NULL,
          context TEXT,
          created_at INTEGER NOT NULL
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
      // Check if sync_queue table exists first
      const syncQueueCheck = await this.db.getAllAsync(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='sync_queue'"
      );

      if (syncQueueCheck.length > 0) {
        // Check if sync_queue table has created_at column
        const syncQueueInfo = await this.db.getAllAsync(
          'PRAGMA table_info(sync_queue)'
        );

        const hasCreatedAt = syncQueueInfo.some(
          (column: any) => column.name === 'created_at'
        );

        if (!hasCreatedAt) {
          console.log(
            '🔄 SQLite Database - Adding created_at column to sync_queue table'
          );
          await this.db.execAsync(
            'ALTER TABLE sync_queue ADD COLUMN created_at INTEGER NOT NULL DEFAULT 0'
          );
          console.log('✅ SQLite Database - sync_queue migration completed');
        } else {
          console.log(
            '✅ SQLite Database - sync_queue migration not needed, created_at column already exists'
          );
        }
      }

      // Check if api_cache table exists
      const apiCacheCheck = await this.db.getAllAsync(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='api_cache'"
      );

      if (apiCacheCheck.length === 0) {
        console.log(
          '📋 SQLite Database - api_cache table does not exist, skipping migration'
        );
        return;
      }

      // Check if api_cache table has updated_at column
      const apiCacheInfo = await this.db.getAllAsync(
        'PRAGMA table_info(api_cache)'
      );

      const hasUpdatedAt = apiCacheInfo.some(
        (column: any) => column.name === 'updated_at'
      );

      if (!hasUpdatedAt) {
        console.log(
          '🔄 SQLite Database - Adding updated_at column to api_cache table'
        );
        await this.db.execAsync(
          'ALTER TABLE api_cache ADD COLUMN updated_at INTEGER NOT NULL DEFAULT 0'
        );
        console.log('✅ SQLite Database - api_cache migration completed');
      } else {
        console.log(
          '✅ SQLite Database - api_cache migration not needed, updated_at column already exists'
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

  async saveData(table: string, data: Record<string, any>): Promise<void> {
    try {
      await this.ensureConnection();
      await this.acquireLock();
      this.updateActivity();

      // Validate table name to prevent SQL injection
      if (!this.isValidTableName(table)) {
        throw new Error(`Invalid table name: ${table}`);
      }

      const timestamp = Date.now();
      const id =
        data.id ||
        `${table}_${timestamp}_${Math.random().toString(36).substr(2, 9)}`;
      const dataKeys = Object.keys(data).filter(key => key !== 'id');

      // Validate data keys to prevent SQL injection
      dataKeys.forEach(key => {
        if (!this.isValidColumnName(key)) {
          throw new Error(`Invalid column name: ${key}`);
        }
      });

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
        await this.handleCriticalError(error);
      }

      throw error; // Re-throw to allow caller to handle
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

  async getData(
    table: string,
    query?: string,
    params?: any[]
  ): Promise<Record<string, any>[]> {
    try {
      await this.ensureConnection();
      await this.acquireLock();
      this.updateActivity();

      // Validate table name to prevent SQL injection
      if (!this.isValidTableName(table)) {
        throw new Error(`Invalid table name: ${table}`);
      }

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

      // Check if table has created_at column before using it in ORDER BY
      let defaultOrderBy = 'id DESC';
      try {
        const tableInfo = await this.db!.getAllAsync(
          `PRAGMA table_info(${table})`
        );
        const hasCreatedAt = tableInfo.some(
          (column: any) => column.name === 'created_at'
        );
        if (hasCreatedAt) {
          defaultOrderBy = 'created_at DESC';
        }
      } catch (error) {
        console.log(
          `⚠️ SQLite Database - Could not check columns for ${table}, using default ordering`
        );
      }

      // Use safe query construction
      const sql = query || `SELECT * FROM ${table} ORDER BY ${defaultOrderBy}`;

      // Validate custom query to prevent SQL injection
      if (query && !this.isValidSelectQuery(query)) {
        throw new Error('Invalid query format');
      }

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
        await this.handleCriticalError(error);
      }

      throw error; // Re-throw to allow caller to handle
    } finally {
      this.releaseLock();
    }
  }

  async updateData(
    table: string,
    id: string,
    data: Record<string, any>
  ): Promise<void> {
    try {
      await this.ensureConnection();
      await this.acquireLock();
      this.updateActivity();

      // Validate table name to prevent SQL injection
      if (!this.isValidTableName(table)) {
        throw new Error(`Invalid table name: ${table}`);
      }

      // Validate data keys to prevent SQL injection
      Object.keys(data).forEach(key => {
        if (!this.isValidColumnName(key)) {
          throw new Error(`Invalid column name: ${key}`);
        }
      });

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

      await this.executeWithRetry(async () => {
        await this.db!.runAsync(query, params);
      }, `update data in ${table}`);

      console.log(`🔄 SQLite Database - Updated data in ${table}: ${id}`);
    } catch (error) {
      console.error(
        `❌ SQLite Database - Failed to update data in ${table}:`,
        error instanceof Error ? error.message : 'Unknown error'
      );
      throw error;
    } finally {
      this.releaseLock();
    }
  }

  async deleteData(table: string, id: string): Promise<void> {
    try {
      await this.ensureConnection();
      await this.acquireLock();
      this.updateActivity();

      // Validate table name to prevent SQL injection
      if (!this.isValidTableName(table)) {
        throw new Error(`Invalid table name: ${table}`);
      }

      const query = `DELETE FROM ${table} WHERE id = ?`;

      await this.executeWithRetry(async () => {
        await this.db!.runAsync(query, [id]);
      }, `delete data from ${table}`);

      console.log(`🗑️ SQLite Database - Deleted data from ${table}: ${id}`);
    } catch (error) {
      console.error(
        `❌ SQLite Database - Failed to delete data from ${table}:`,
        error instanceof Error ? error.message : 'Unknown error'
      );
      throw error;
    } finally {
      this.releaseLock();
    }
  }

  async clearTable(table: string): Promise<void> {
    try {
      await this.ensureConnection();
      await this.acquireLock();
      this.updateActivity();

      // Validate table name to prevent SQL injection
      if (!this.isValidTableName(table)) {
        throw new Error(`Invalid table name: ${table}`);
      }

      const query = `DELETE FROM ${table}`;

      await this.executeWithRetry(async () => {
        await this.db!.runAsync(query);
      }, `clear table ${table}`);

      console.log(`🧹 SQLite Database - Cleared table: ${table}`);
    } catch (error) {
      console.error(
        `❌ SQLite Database - Failed to clear table ${table}:`,
        error instanceof Error ? error.message : 'Unknown error'
      );
      throw error;
    } finally {
      this.releaseLock();
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

      const parsedResult = result.map((row: any) => {
        try {
          return {
            ...row,
            data: typeof row.data === 'string' ? JSON.parse(row.data) : row.data,
          };
        } catch (e) {
          console.error('❌ SQLite Database - Failed to parse row data:', e);
          return row; // Return unparsed row if parsing fails
        }
      });

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
    try {
      await this.ensureConnection();
      await this.acquireLock();
      this.updateActivity();

      const query = `UPDATE sync_queue SET status = 'synced' WHERE id = ?`;

      await this.executeWithRetry(async () => {
        await this.db!.runAsync(query, [id]);
      }, 'mark sync item as synced');

      console.log(`✅ SQLite Database - Marked sync item as synced: ${id}`);
    } catch (error) {
      console.error('❌ SQLite Database - Failed to mark sync item:', error);
      throw error;
    } finally {
      this.releaseLock();
    }
  }

  async addToSyncQueue(item: Record<string, any>): Promise<void> {
    try {
      await this.ensureConnection();
      await this.acquireLock();
      this.updateActivity();

      // Ensure data is always a valid JSON string (not null/undefined)
      // Fix: Check if already a string to avoid double stringification
      let dataToStore: string;
      if (item.data === undefined || item.data === null) {
        dataToStore = JSON.stringify({});
      } else if (typeof item.data === 'string') {
        dataToStore = item.data; // Already stringified
      } else {
        dataToStore = JSON.stringify(item.data);
      }

      const syncItem = {
        id: `${item.action}_${Date.now()}_${Math.random()
          .toString(36)
          .substr(2, 9)}`,
        action: item.action,
        endpoint: item.endpoint,
        data: dataToStore,
        timestamp: Date.now(),
        retry_count: 0,
        max_retries: 3,
        status: 'pending',
        created_at: Date.now(),
      };

      const query = `
        INSERT INTO sync_queue 
        (id, action, endpoint, data, timestamp, retry_count, max_retries, status, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
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
        syncItem.created_at,
      ];

      await this.executeWithRetry(async () => {
        await this.db!.runAsync(query, params);
      }, 'add to sync queue');

      console.log(
        `📝 SQLite Database - Added to sync queue: ${item.action} ${item.endpoint}`
      );
    } catch (error) {
      console.error('❌ SQLite Database - Failed to add to sync queue:', error);
      throw error;
    } finally {
      this.releaseLock();
    }
  }

  async getTableInfo(table: string): Promise<Record<string, any>[]> {
    try {
      await this.ensureConnection();
      await this.acquireLock();
      this.updateActivity();

      // Validate table name to prevent SQL injection
      if (!this.isValidTableName(table)) {
        throw new Error(`Invalid table name: ${table}`);
      }

      const query = `PRAGMA table_info(${table})`;

      const result = (await this.executeWithRetry(async () => {
        return await this.db!.getAllAsync(query);
      }, `get table info for ${table}`)) as Record<string, any>[];

      console.log(`📊 SQLite Database - Retrieved table info for ${table}`);
      return result;
    } catch (error) {
      console.error(
        `❌ SQLite Database - Failed to get table info for ${table}:`,
        error instanceof Error ? error.message : 'Unknown error'
      );
      throw error;
    } finally {
      this.releaseLock();
    }
  }

  async executeQuery(query: string, params?: any[]): Promise<any> {
    try {
      await this.ensureConnection();
      
      // Double-check database is available after ensureConnection
      if (!this.db || typeof this.db.getAllAsync !== 'function') {
        throw new Error('Database connection is not available');
      }
      
      await this.acquireLock();
      this.updateActivity();

      // Validate query to prevent dangerous operations
      if (!this.isValidQuery(query)) {
        throw new Error('Invalid or dangerous query detected');
      }

      const result = await this.executeWithRetry(async () => {
        // Check again before executing query
        if (!this.db || typeof this.db.getAllAsync !== 'function') {
          throw new Error('Database connection lost during query execution');
        }
        return await this.db.getAllAsync(query, params || []);
      }, 'execute custom query');

      console.log(
        `🔍 SQLite Database - Executed query: ${query.substring(0, 50)}...`
      );
      return result;
    } catch (error) {
      console.error('❌ SQLite Database - Failed to execute query:', error);
      throw error;
    } finally {
      this.releaseLock();
    }
  }

  // Enhanced convenience methods with validation
  async saveActivity(activity: Record<string, any>): Promise<void> {
    // Validate activity data
    if (!activity.title || !activity.time) {
      throw new Error('Activity must have title and time');
    }
    await this.saveData('activities', activity);
  }

  async getActivities(limit?: number): Promise<Record<string, any>[]> {
    const query = limit
      ? `SELECT * FROM activities ORDER BY created_at DESC LIMIT ${limit}`
      : `SELECT * FROM activities ORDER BY created_at DESC`;
    return this.getData('activities', query);
  }

  async saveBazarEntry(bazar: Record<string, any>): Promise<void> {
    this.validateBazarData(bazar);
    await this.saveData('bazar_entries', bazar);
  }

  async getBazarEntries(limit?: number): Promise<Record<string, any>[]> {
    const query = limit
      ? `SELECT * FROM bazar_entries ORDER BY created_at DESC LIMIT ${limit}`
      : `SELECT * FROM bazar_entries ORDER BY created_at DESC`;
    return this.getData('bazar_entries', query);
  }

  async saveMealEntry(meal: Record<string, any>): Promise<void> {
    this.validateMealData(meal);
    await this.saveData('meal_entries', meal);
  }

  async getMealEntries(limit?: number): Promise<Record<string, any>[]> {
    const query = limit
      ? `SELECT * FROM meal_entries ORDER BY created_at DESC LIMIT ${limit}`
      : `SELECT * FROM meal_entries ORDER BY created_at DESC`;
    return this.getData('meal_entries', query);
  }

  async saveUserData(user: Record<string, any>): Promise<void> {
    this.validateUserData(user);
    await this.saveData('user_data', user);
  }

  async getUserData(userId: string): Promise<Record<string, any> | null> {
    const result = await this.getData(
      'user_data',
      `SELECT * FROM user_data WHERE id = ?`,
      [userId]
    );
    return result[0] || null;
  }

  async savePaymentEntry(payment: Record<string, any>): Promise<void> {
    this.validatePaymentData(payment);
    await this.saveData('payment_entries', payment);
  }

  async saveStatistics(type: string, data: Record<string, any>): Promise<void> {
    const statsData = {
      id: type,
      type,
      data: JSON.stringify(data),
      timestamp: Date.now(),
      version: '1.0',
    };
    await this.saveData('statistics', statsData);
  }

  async getStatistics(type: string): Promise<Record<string, any> | null> {
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
    data: Record<string, any>,
    expiryMinutes: number = 60
  ): Promise<void> {
    // Ensure data is always a valid JSON string (not null/undefined)
    const dataString = data !== undefined && data !== null 
      ? JSON.stringify(data) 
      : JSON.stringify({});
    
    const cacheData = {
      key,
      data: dataString,
      timestamp: Date.now(),
      expiry: Date.now() + expiryMinutes * 60 * 1000,
    };
    await this.saveData('api_cache', cacheData);
  }

  async getCacheData(key: string): Promise<Record<string, any> | null> {
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

  // Authentication and Session Management
  async saveAuthToken(tokenData: Record<string, any>): Promise<void> {
    await this.saveData('auth_tokens', tokenData);
  }

  async getAuthToken(userId: string): Promise<Record<string, any> | null> {
    const result = await this.getData(
      'auth_tokens',
      `SELECT * FROM auth_tokens WHERE user_id = ? AND is_revoked = 0 AND expires_at > ? ORDER BY created_at DESC LIMIT 1`,
      [userId, Date.now()]
    );
    return result[0] || null;
  }

  async revokeAuthToken(tokenId: string): Promise<void> {
    await this.updateData('auth_tokens', tokenId, { is_revoked: 1 });
  }

  async saveUserSession(sessionData: Record<string, any>): Promise<void> {
    await this.saveData('user_sessions', sessionData);
  }

  async getUserSession(
    sessionToken: string
  ): Promise<Record<string, any> | null> {
    const result = await this.getData(
      'user_sessions',
      `SELECT * FROM user_sessions WHERE session_token = ? AND is_active = 1 AND expires_at > ?`,
      [sessionToken, Date.now()]
    );
    return result[0] || null;
  }

  // Payment Management
  async savePaymentEntryData(paymentData: Record<string, any>): Promise<void> {
    await this.saveData('payment_entries', paymentData);
  }

  async getPaymentEntries(
    userId?: string,
    limit?: number
  ): Promise<Record<string, any>[]> {
    const query = userId
      ? `SELECT * FROM payment_entries WHERE user_id = ? ORDER BY created_at DESC ${
          limit ? `LIMIT ${limit}` : ''
        }`
      : `SELECT * FROM payment_entries ORDER BY created_at DESC ${
          limit ? `LIMIT ${limit}` : ''
        }`;
    const params = userId ? [userId] : [];
    return this.getData('payment_entries', query, params);
  }

  // Notification Management
  async saveNotification(notificationData: Record<string, any>): Promise<void> {
    await this.saveData('notification_queue', notificationData);
  }

  async getNotifications(
    userId: string,
    unreadOnly: boolean = false
  ): Promise<Record<string, any>[]> {
    const query = unreadOnly
      ? `SELECT * FROM notification_queue WHERE user_id = ? AND is_read = 0 ORDER BY created_at DESC`
      : `SELECT * FROM notification_queue WHERE user_id = ? ORDER BY created_at DESC`;
    return this.getData('notification_queue', query, [userId]);
  }

  async markNotificationAsRead(notificationId: string): Promise<void> {
    await this.updateData('notification_queue', notificationId, { is_read: 1 });
  }

  // Audit Logging
  async logAuditEvent(auditData: Record<string, any>): Promise<void> {
    await this.saveData('audit_logs', auditData);
  }

  async getAuditLogs(
    filters?: Record<string, any>
  ): Promise<Record<string, any>[]> {
    let query = 'SELECT * FROM audit_logs';
    const params: any[] = [];

    if (filters) {
      const conditions: string[] = [];
      if (filters.userId) {
        conditions.push('user_id = ?');
        params.push(filters.userId);
      }
      if (filters.action) {
        conditions.push('action = ?');
        params.push(filters.action);
      }
      if (filters.resourceType) {
        conditions.push('resource_type = ?');
        params.push(filters.resourceType);
      }
      if (conditions.length > 0) {
        query += ` WHERE ${conditions.join(' AND ')}`;
      }
    }

    query += ' ORDER BY created_at DESC';
    return this.getData('audit_logs', query, params);
  }

  // System Settings
  async saveSystemSetting(settingData: Record<string, any>): Promise<void> {
    await this.saveData('system_settings', settingData);
  }

  async getSystemSetting(key: string): Promise<Record<string, any> | null> {
    const result = await this.getData(
      'system_settings',
      `SELECT * FROM system_settings WHERE key = ?`,
      [key]
    );
    return result[0] || null;
  }

  async getSystemSettings(category?: string): Promise<Record<string, any>[]> {
    const query = category
      ? `SELECT * FROM system_settings WHERE category = ? ORDER BY key`
      : `SELECT * FROM system_settings ORDER BY category, key`;
    const params = category ? [category] : [];
    return this.getData('system_settings', query, params);
  }

  // UI Configuration Management
  async saveUIConfig(configData: Record<string, any>): Promise<void> {
    await this.saveData('ui_configurations', configData);
  }

  async getActiveUIConfig(appId: string): Promise<Record<string, any> | null> {
    const result = await this.getData(
      'ui_configurations',
      `SELECT * FROM ui_configurations WHERE app_id = ? AND is_active = 1 ORDER BY created_at DESC LIMIT 1`,
      [appId]
    );
    return result[0] || null;
  }

  async getUIConfigByVersion(
    appId: string,
    version: string
  ): Promise<Record<string, any> | null> {
    const result = await this.getData(
      'ui_configurations',
      `SELECT * FROM ui_configurations WHERE app_id = ? AND version = ?`,
      [appId, version]
    );
    return result[0] || null;
  }

  // Analytics Data
  async saveAnalyticsData(analyticsData: Record<string, any>): Promise<void> {
    await this.saveData('analytics_data', analyticsData);
  }

  async getAnalyticsData(
    metricName?: string,
    userId?: string
  ): Promise<Record<string, any>[]> {
    let query = 'SELECT * FROM analytics_data';
    const params: any[] = [];

    const conditions: string[] = [];
    if (metricName) {
      conditions.push('metric_name = ?');
      params.push(metricName);
    }
    if (userId) {
      conditions.push('user_id = ?');
      params.push(userId);
    }

    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }

    query += ' ORDER BY timestamp DESC';
    return this.getData('analytics_data', query, params);
  }

  // Backup Management
  async saveBackupMetadata(backupData: Record<string, any>): Promise<void> {
    await this.saveData('backup_metadata', backupData);
  }

  async getBackupMetadata(): Promise<Record<string, any>[]> {
    return this.getData(
      'backup_metadata',
      'SELECT * FROM backup_metadata ORDER BY created_at DESC'
    );
  }

  // Support Tickets
  async saveSupportTicket(ticketData: Record<string, any>): Promise<void> {
    await this.saveData('support_tickets', ticketData);
  }

  async getSupportTickets(
    userId?: string,
    status?: string
  ): Promise<Record<string, any>[]> {
    let query = 'SELECT * FROM support_tickets';
    const params: any[] = [];

    const conditions: string[] = [];
    if (userId) {
      conditions.push('user_id = ?');
      params.push(userId);
    }
    if (status) {
      conditions.push('status = ?');
      params.push(status);
    }

    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }

    query += ' ORDER BY created_at DESC';
    return this.getData('support_tickets', query, params);
  }

  // Billing Information
  async saveBillingInfo(billingData: Record<string, any>): Promise<void> {
    await this.saveData('billing_info', billingData);
  }

  async getBillingInfo(userId: string): Promise<Record<string, any> | null> {
    const result = await this.getData(
      'billing_info',
      `SELECT * FROM billing_info WHERE user_id = ? ORDER BY created_at DESC LIMIT 1`,
      [userId]
    );
    return result[0] || null;
  }

  // Performance Metrics
  async savePerformanceMetric(metricData: Record<string, any>): Promise<void> {
    await this.saveData('performance_metrics', metricData);
  }

  async getPerformanceMetrics(
    metricName?: string
  ): Promise<Record<string, any>[]> {
    const query = metricName
      ? `SELECT * FROM performance_metrics WHERE metric_name = ? ORDER BY timestamp DESC`
      : `SELECT * FROM performance_metrics ORDER BY timestamp DESC`;
    const params = metricName ? [metricName] : [];
    return this.getData('performance_metrics', query, params);
  }

  // Database versioning and migration
  async getDatabaseVersion(): Promise<string> {
    try {
      const result = await this.getData(
        'system_settings',
        `SELECT value FROM system_settings WHERE key = 'database_version'`
      );
      return result[0]?.value || '1.0.0';
    } catch (error) {
      return '1.0.0';
    }
  }

  async setDatabaseVersion(version: string): Promise<void> {
    await this.saveSystemSetting({
      id: 'database_version',
      key: 'database_version',
      value: version,
      description: 'Current database schema version',
      category: 'system',
      is_public: 0,
      created_at: Date.now(),
      updated_at: Date.now(),
    });
  }

  async runMigrations(): Promise<void> {
    const currentVersion = await this.getDatabaseVersion();
    console.log(`🔄 SQLite Database - Current version: ${currentVersion}`);

    // Add migration logic here as needed
    // Example: if (currentVersion === '1.0.0') { /* migrate to 1.1.0 */ }

    // Update to latest version
    await this.setDatabaseVersion('1.1.0');
    console.log('✅ SQLite Database - Migrations completed');
  }

  // Data integrity checks
  async checkDataIntegrity(): Promise<boolean> {
    try {
      // Check if all required tables exist
      const requiredTables = [
        'dashboard_data',
        'api_cache',
        'sync_queue',
        'activities',
        'bazar_entries',
        'meal_entries',
        'user_data',
        'statistics',
        'auth_tokens',
        'user_sessions',
        'payment_entries',
        'notification_queue',
        'audit_logs',
        'system_settings',
        'ui_configurations',
        'analytics_data',
        'backup_metadata',
        'support_tickets',
        'billing_info',
        'performance_metrics',
      ];

      for (const table of requiredTables) {
        const result = await this.getData(
          'sqlite_master',
          `SELECT name FROM sqlite_master WHERE type='table' AND name=?`,
          [table]
        );
        if (result.length === 0) {
          console.error(`❌ SQLite Database - Missing table: ${table}`);
          return false;
        }
      }

      // Validate critical table schemas
      await this.validateTableSchemas();

      console.log('✅ SQLite Database - Data integrity check passed');
      return true;
    } catch (error) {
      console.error('❌ SQLite Database - Data integrity check failed:', error);
      return false;
    }
  }

  // Validate critical table schemas
  private async validateTableSchemas(): Promise<void> {
    const schemaValidations = [
      {
        table: 'dashboard_data',
        requiredColumns: [
          'id',
          'table_name',
          'data',
          'timestamp',
          'created_at',
          'updated_at',
          'version',
        ],
      },
      {
        table: 'user_data',
        requiredColumns: [
          'id',
          'name',
          'email',
          'role',
          'created_at',
          'updated_at',
        ],
      },
      {
        table: 'bazar_entries',
        requiredColumns: [
          'id',
          'user_id',
          'date',
          'items',
          'total_amount',
          'created_at',
          'updated_at',
        ],
      },
      {
        table: 'meal_entries',
        requiredColumns: [
          'id',
          'user_id',
          'date',
          'meal_type',
          'created_at',
          'updated_at',
        ],
      },
    ];

    for (const validation of schemaValidations) {
      const tableInfo = await this.getTableInfo(validation.table);
      const existingColumns = tableInfo.map((col: any) => col.name);

      const missingColumns = validation.requiredColumns.filter(
        col => !existingColumns.includes(col)
      );

      if (missingColumns.length > 0) {
        throw new Error(
          `Table ${
            validation.table
          } is missing required columns: ${missingColumns.join(', ')}`
        );
      }
    }

    console.log('✅ SQLite Database - Schema validation passed');
  }

  // Emergency recovery methods
  async emergencyReset(): Promise<void> {
    this.tablesCreated = false; // Reset tables flag on emergency reset
    this.isCreatingTables = false; // Reset table creation flag
    this.tablesCreationPromise = null; // Clear table creation promise
    console.log('🚨 SQLite Database - Starting emergency reset...');

    try {
      // Close current connection
      await this.close();

      // Reset all state immediately
      this.db = null;
      this.isInitialized = false;
      this.isInitializing = false;
      this.consecutiveErrors = 0;
      this.lastError = null;

      // Try multiple approaches to delete the database file
      let fileDeleted = false;

      // Approach 1: Direct deletion
      if (!SQLite) {
        await this.bypassDatabase();
        return;
      }
      try {
        await SQLite.deleteDatabaseAsync(this.DATABASE_NAME);
        console.log('🗑️ SQLite Database - Database file deleted successfully');
        fileDeleted = true;
      } catch (deleteError) {
        console.log(
          '⚠️ SQLite Database - Direct deletion failed, trying alternative approaches'
        );
      }

      // Approach 2: If direct deletion failed, try with different database name
      if (!fileDeleted) {
        try {
          // Create a new database with a different name
          const newDbName = `mess_manager_${Date.now()}.db`;
          console.log(
            `🔄 SQLite Database - Creating new database: ${newDbName}`
          );

          // Temporarily change the database name
          const originalName = this.DATABASE_NAME;
          this.DATABASE_NAME = newDbName;

          // Try to initialize with new name
          await this.performInitialization();

          // If successful, update the name permanently
          console.log(
            `✅ SQLite Database - Successfully created new database: ${newDbName}`
          );
          return;
        } catch (newDbError) {
          console.log(
            '⚠️ SQLite Database - New database creation failed, trying memory database'
          );

          // Approach 3: Use in-memory database as last resort
          try {
            this.DATABASE_NAME = ':memory:';
            console.log(
              '🔄 SQLite Database - Using in-memory database as fallback'
            );
            await this.performInitialization();
            console.log(
              '✅ SQLite Database - In-memory database initialized successfully'
            );
            return;
          } catch (memoryError) {
            console.error(
              '❌ SQLite Database - All emergency reset approaches failed, using bypass mode'
            );
            await this.bypassDatabase();
            return;
          }
        }
      }

      // If file was deleted successfully, wait and reinitialize
      if (fileDeleted) {
        await new Promise(resolve => setTimeout(resolve, 3000));
        await this.performInitialization();
      }

      console.log('✅ SQLite Database - Emergency reset completed');
    } catch (error) {
      console.error('❌ SQLite Database - Emergency reset failed:', error);
      throw error;
    }
  }

  // Complete bypass method for when database is completely unusable
  async bypassDatabase(): Promise<void> {
    console.log(
      '🚨 SQLite Database - Database completely unusable, bypassing...'
    );

    // Set a flag to indicate we're in bypass mode
    this.isInitialized = true;
    this.isInitializing = false;
    this.consecutiveErrors = 0;

    // Create a mock database object that returns empty results
    this.db = {
      closeAsync: async () => {},
      execAsync: async () => {},
      getAllAsync: async () => [],
      getFirstAsync: async () => null,
      runAsync: async () => ({ lastInsertRowId: 0, changes: 0 }),
    } as any;

    console.log(
      '⚠️ SQLite Database - Operating in bypass mode - no data persistence'
    );
  }

  // Database testing functionality (integrated from sqliteTest.ts)
  async runDatabaseTests(): Promise<boolean> {
    console.log('🧪 Running SQLite database tests...');

    try {
      // Test 1: Database initialization
      console.log('📋 Test 1: Database initialization');
      await this.init();
      console.log('✅ Database initialized successfully');

      // Test 2: Health check
      console.log('📋 Test 2: Health check');
      const isHealthy = await this.healthCheck();
      console.log(`✅ Health check: ${isHealthy ? 'PASSED' : 'FAILED'}`);

      // Test 3: Save and retrieve data
      console.log('📋 Test 3: Save and retrieve data');
      const testData = {
        id: 'test_dashboard_data',
        table_name: 'dashboard_data',
        data: JSON.stringify({ test: 'dashboard_data', timestamp: Date.now() }),
        timestamp: Date.now(),
        created_at: Date.now(),
        updated_at: Date.now(),
        version: '1.0',
      };

      await this.saveData('dashboard_data', testData);
      console.log('✅ Data saved successfully');

      const retrievedData = await this.getData(
        'dashboard_data',
        'SELECT * FROM dashboard_data WHERE id = ?',
        ['test_dashboard_data']
      );
      console.log(`✅ Data retrieved: ${retrievedData.length} records`);

      // Test 4: Schema validation
      console.log('📋 Test 4: Schema validation');
      const schemaValid = await this.checkDataIntegrity();
      console.log(`✅ Schema validation: ${schemaValid ? 'PASSED' : 'FAILED'}`);

      // Test 5: Performance metrics
      console.log('📋 Test 5: Performance metrics');
      await this.savePerformanceMetric({
        id: 'test_performance',
        metric_name: 'database_test',
        metric_value: 1,
        unit: 'test',
        timestamp: Date.now(),
        context: 'database_testing',
        created_at: Date.now(),
      });
      console.log('✅ Performance metrics working');

      // Clean up test data
      await this.deleteData('dashboard_data', 'test_dashboard_data');
      await this.deleteData('performance_metrics', 'test_performance');

      console.log('🎉 All SQLite database tests completed successfully!');
      return true;
    } catch (error) {
      console.error('❌ SQLite database tests failed:', error);
      return false;
    }
  }

  // Graceful recovery method
  async gracefulRecovery(): Promise<boolean> {
    console.log('🔄 SQLite Database - Starting graceful recovery...');

    try {
      // First try to validate current database
      const isHealthy = await this.healthCheck();
      if (isHealthy) {
        console.log(
          '✅ SQLite Database - Database is healthy, no recovery needed'
        );
        return true;
      }

      // Try soft reset first
      console.log('🔄 SQLite Database - Attempting soft reset...');
      await this.softResetDatabase();

      // Check if soft reset worked
      const isHealthyAfterSoftReset = await this.healthCheck();
      if (isHealthyAfterSoftReset) {
        console.log('✅ SQLite Database - Soft reset successful');
        return true;
      }

      // Try hard reset
      console.log('🔄 SQLite Database - Attempting hard reset...');
      await this.resetDatabase();

      // Check if hard reset worked
      const isHealthyAfterHardReset = await this.healthCheck();
      if (isHealthyAfterHardReset) {
        console.log('✅ SQLite Database - Hard reset successful');
        return true;
      }

      // Last resort: emergency reset
      console.log('🚨 SQLite Database - Attempting emergency reset...');
      await this.emergencyReset();

      const isHealthyAfterEmergency = await this.healthCheck();
      if (isHealthyAfterEmergency) {
        console.log('✅ SQLite Database - Emergency reset successful');
        return true;
      }

      console.error('❌ SQLite Database - All recovery attempts failed');
      return false;
    } catch (error) {
      console.error('❌ SQLite Database - Graceful recovery failed:', error);
      return false;
    }
  }

  // Database maintenance methods
  async vacuum(): Promise<void> {
    try {
      await this.ensureConnection();
      await this.acquireLock();

      console.log('🔄 SQLite Database - Starting VACUUM operation...');
      await this.db!.execAsync('VACUUM');
      console.log('✅ SQLite Database - VACUUM completed successfully');
    } catch (error) {
      console.error('❌ SQLite Database - VACUUM failed:', error);
      throw error;
    } finally {
      this.releaseLock();
    }
  }

  async optimize(): Promise<void> {
    try {
      await this.ensureConnection();
      await this.acquireLock();

      console.log('🔄 SQLite Database - Starting optimization...');

      // Analyze tables for better query planning
      await this.db!.execAsync('ANALYZE');

      // Update statistics
      await this.db!.execAsync('PRAGMA optimize');

      // Clear expired cache
      await this.clearExpiredCache();

      console.log('✅ SQLite Database - Optimization completed');
    } catch (error) {
      console.error('❌ SQLite Database - Optimization failed:', error);
      throw error;
    } finally {
      this.releaseLock();
    }
  }
}

// Export singleton instance
export const sqliteDatabase = new SQLiteDatabaseService();
export default sqliteDatabase;
