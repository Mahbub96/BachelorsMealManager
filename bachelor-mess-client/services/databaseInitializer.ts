import databaseHealthMonitor from './databaseHealthMonitor';
import sqliteDatabase from './sqliteDatabase';

export interface InitializationConfig {
  maxRetries: number;
  retryDelay: number;
  initializationTimeout: number;
  enableHealthMonitoring: boolean;
  enableAutoRecovery: boolean;
}

const DEFAULT_CONFIG: InitializationConfig = {
  maxRetries: 5,
  retryDelay: 1000,
  initializationTimeout: 30000, // 30 seconds
  enableHealthMonitoring: true,
  enableAutoRecovery: true,
};

class DatabaseInitializer {
  private config: InitializationConfig;
  private isInitializing = false;
  private initializationPromise: Promise<void> | null = null;
  private lastInitializationTime = 0;
  private consecutiveFailures = 0;

  constructor(config: Partial<InitializationConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  async initialize(): Promise<void> {
    // Prevent multiple simultaneous initializations
    if (this.isInitializing && this.initializationPromise) {
      console.log(
        '🔄 DatabaseInitializer - Initialization already in progress, waiting...'
      );
      return this.initializationPromise;
    }

    // Check if recently initialized
    const timeSinceLastInit = Date.now() - this.lastInitializationTime;
    if (timeSinceLastInit < 5000) {
      // 5 seconds cooldown
      console.log('🔄 DatabaseInitializer - Recently initialized, skipping...');
      return;
    }

    this.isInitializing = true;
    this.initializationPromise = this.performInitialization();

    try {
      await this.initializationPromise;
    } finally {
      this.isInitializing = false;
      this.initializationPromise = null;
    }
  }

  private async performInitialization(): Promise<void> {
    let attempt = 0;

    while (attempt < this.config.maxRetries) {
      attempt++;
      console.log(
        `🔄 DatabaseInitializer - Initialization attempt ${attempt}/${this.config.maxRetries}`
      );

      try {
        // Set up timeout for initialization
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => {
            reject(new Error('Initialization timeout'));
          }, this.config.initializationTimeout);
        });

        // Perform initialization with timeout
        await Promise.race([this.initializeDatabase(), timeoutPromise]);

        // Success - update tracking
        this.lastInitializationTime = Date.now();
        this.consecutiveFailures = 0;

        console.log(
          `✅ DatabaseInitializer - Initialization successful (attempt ${attempt})`
        );
        return;
      } catch (error) {
        this.consecutiveFailures++;
        console.log(
          `❌ DatabaseInitializer - Initialization failed (attempt ${attempt}):`,
          error
        );

        // If we've had too many consecutive failures, try emergency reset
        if (this.consecutiveFailures >= 3) {
          console.log(
            '🚨 DatabaseInitializer - Too many consecutive failures, attempting emergency reset...'
          );
          try {
            await sqliteDatabase.emergencyReset();
            this.consecutiveFailures = 0;
            // Continue with next attempt
          } catch (resetError) {
            console.log(
              '❌ DatabaseInitializer - Emergency reset failed:',
              resetError
            );
          }
        }

        if (attempt >= this.config.maxRetries) {
          console.log(
            '❌ DatabaseInitializer - Max retries reached, giving up'
          );
          throw error;
        }

        // Wait before retry with exponential backoff
        const delay = this.config.retryDelay * Math.pow(2, attempt - 1);
        console.log(
          `⏳ DatabaseInitializer - Waiting ${delay}ms before retry...`
        );
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  private async initializeDatabase(): Promise<void> {
    console.log('🔄 DatabaseInitializer - Starting database initialization...');

    // Step 1: Initialize SQLite database
    console.log(
      '🔄 DatabaseInitializer - Step 1: Initializing SQLite database...'
    );
    await sqliteDatabase.init();

    // Step 2: Verify database health
    console.log(
      '🔄 DatabaseInitializer - Step 2: Verifying database health...'
    );
    const isHealthy = await sqliteDatabase.healthCheck();
    if (!isHealthy) {
      throw new Error('Database health check failed after initialization');
    }

    // Step 3: Start health monitoring if enabled (skip on web)
    if (this.config.enableHealthMonitoring) {
      const { Platform } = await import('react-native');
      if (Platform.OS !== 'web') {
        console.log(
          '🔄 DatabaseInitializer - Step 3: Starting health monitoring...'
        );
        await databaseHealthMonitor.startMonitoring();
      } else {
        console.log(
          'ℹ️ DatabaseInitializer - Skipping health monitoring on web platform'
        );
      }
    }

    // Step 4: Perform test operations
    console.log(
      '🔄 DatabaseInitializer - Step 4: Performing test operations...'
    );
    await this.performTestOperations();

    console.log(
      '✅ DatabaseInitializer - Database initialization completed successfully'
    );
  }

  private async performTestOperations(): Promise<void> {
    // Skip test operations on web platform since SQLite is not available
    const { Platform } = await import('react-native');
    if (Platform.OS === 'web') {
      console.log(
        'ℹ️ DatabaseInitializer - Skipping test operations on web platform'
      );
      return;
    }

    try {
      // Test basic database operations with correct schema
      const testData = {
        id: 'test_initialization',
        table_name: 'test_table',
        data: JSON.stringify({
          test: 'database_initialization',
          timestamp: Date.now(),
        }),
        timestamp: Date.now(),
        created_at: Date.now(),
        updated_at: Date.now(),
        version: '1.0',
      };

      // Test save operation
      await sqliteDatabase.saveData('dashboard_data', testData);

      // Test get operation
      const retrievedData = await sqliteDatabase.getData(
        'dashboard_data',
        'SELECT * FROM dashboard_data WHERE id = ?',
        ['test_initialization']
      );

      if (retrievedData.length === 0) {
        throw new Error('Test data not found after save');
      }

      // Test query execution
      await sqliteDatabase.executeQuery(
        'SELECT COUNT(*) as count FROM dashboard_data'
      );

      // Clean up test data
      await sqliteDatabase.deleteData('dashboard_data', 'test_initialization');

      console.log(
        '✅ DatabaseInitializer - Test operations completed successfully'
      );
    } catch (error) {
      console.log('❌ DatabaseInitializer - Test operations failed:', error);
      throw new Error(
        `Test operations failed: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
    }
  }

  // Force reinitialization
  async forceReinitialize(): Promise<void> {
    console.log('🔄 DatabaseInitializer - Force reinitialization requested...');

    // Reset tracking
    this.consecutiveFailures = 0;
    this.lastInitializationTime = 0;

    // Try graceful recovery first
    try {
      const recoverySuccess = await sqliteDatabase.gracefulRecovery();
      if (recoverySuccess) {
        console.log('✅ DatabaseInitializer - Graceful recovery successful');
        return;
      }
    } catch (error) {
      console.log(
        '⚠️ DatabaseInitializer - Graceful recovery failed, trying aggressive reset...'
      );
    }

    // Perform aggressive reset as fallback
    try {
      await sqliteDatabase.resetDatabase();
      await this.initialize();
    } catch (error) {
      console.log(
        '❌ DatabaseInitializer - Force reinitialization failed:',
        error
      );
      throw error;
    }
  }

  // Get initialization status
  getStatus(): {
    isInitializing: boolean;
    consecutiveFailures: number;
    lastInitializationTime: number;
    timeSinceLastInit: number;
  } {
    return {
      isInitializing: this.isInitializing,
      consecutiveFailures: this.consecutiveFailures,
      lastInitializationTime: this.lastInitializationTime,
      timeSinceLastInit: Date.now() - this.lastInitializationTime,
    };
  }

  // Check if database is ready
  async isReady(): Promise<boolean> {
    try {
      // On web, SQLite is always "ready" (stub implementation)
      const { Platform } = await import('react-native');
      if (Platform.OS === 'web') {
        return true;
      }

      if (!sqliteDatabase['isInitialized']) {
        return false;
      }

      const isHealthy = await sqliteDatabase.healthCheck();
      return isHealthy;
    } catch (error) {
      console.log('❌ DatabaseInitializer - Health check failed:', error);
      return false;
    }
  }

  // Update configuration
  updateConfig(newConfig: Partial<InitializationConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log('⚙️ DatabaseInitializer - Configuration updated');
  }

  // Get current configuration
  getConfig(): InitializationConfig {
    return { ...this.config };
  }

  // Cleanup
  destroy(): void {
    this.isInitializing = false;
    this.initializationPromise = null;
    console.log('🧹 DatabaseInitializer - Destroyed');
  }
}

// Export singleton instance
export const databaseInitializer = new DatabaseInitializer();
export default databaseInitializer;
