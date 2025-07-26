import sqliteDatabase from './sqliteDatabase';

export interface DatabaseHealthStatus {
  isHealthy: boolean;
  lastCheck: number;
  consecutiveFailures: number;
  totalChecks: number;
  averageResponseTime: number;
  lastError?: string;
}

export interface HealthCheckConfig {
  checkInterval: number; // milliseconds
  maxConsecutiveFailures: number;
  timeout: number; // milliseconds
  enableAutoRecovery: boolean;
}

const DEFAULT_CONFIG: HealthCheckConfig = {
  checkInterval: 30000, // 30 seconds
  maxConsecutiveFailures: 3,
  timeout: 5000, // 5 seconds
  enableAutoRecovery: true,
};

class DatabaseHealthMonitor {
  private config: HealthCheckConfig;
  private isMonitoring = false;
  private healthInterval: ReturnType<typeof setInterval> | null = null;
  private status: DatabaseHealthStatus = {
    isHealthy: true,
    lastCheck: 0,
    consecutiveFailures: 0,
    totalChecks: 0,
    averageResponseTime: 0,
  };
  private responseTimes: number[] = [];

  constructor(config: Partial<HealthCheckConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  startMonitoring(): void {
    if (this.isMonitoring) {
      console.log('⚠️ DatabaseHealthMonitor - Already monitoring');
      return;
    }

    console.log('🔄 DatabaseHealthMonitor - Starting health monitoring...');
    this.isMonitoring = true;

    // Perform initial health check
    this.performHealthCheck();

    // Set up periodic health checks
    this.healthInterval = setInterval(() => {
      this.performHealthCheck();
    }, this.config.checkInterval);
  }

  stopMonitoring(): void {
    if (!this.isMonitoring) {
      return;
    }

    console.log('🔄 DatabaseHealthMonitor - Stopping health monitoring...');
    this.isMonitoring = false;

    if (this.healthInterval) {
      clearInterval(this.healthInterval);
      this.healthInterval = null;
    }
  }

  private async performHealthCheck(): Promise<void> {
    const startTime = Date.now();
    this.status.totalChecks++;

    try {
      console.log('🔍 DatabaseHealthMonitor - Performing health check...');

      // Check if database is initialized
      if (!sqliteDatabase['isInitialized']) {
        console.log(
          '🔄 DatabaseHealthMonitor - Database not initialized, attempting initialization...'
        );
        await sqliteDatabase.init();
      }

      // Perform a simple query to test database health
      const testQuery = 'SELECT 1';
      const result = await sqliteDatabase.executeQuery(testQuery);

      if (result && result.length > 0) {
        // Health check passed
        const responseTime = Date.now() - startTime;
        this.updateResponseTime(responseTime);

        this.status.isHealthy = true;
        this.status.consecutiveFailures = 0;
        this.status.lastCheck = Date.now();
        this.status.lastError = undefined;

        console.log(
          `✅ DatabaseHealthMonitor - Health check passed (${responseTime}ms)`
        );
      } else {
        throw new Error('Health check query returned unexpected result');
      }
    } catch (error) {
      const responseTime = Date.now() - startTime;
      this.updateResponseTime(responseTime);

      this.status.isHealthy = false;
      this.status.consecutiveFailures++;
      this.status.lastCheck = Date.now();
      this.status.lastError =
        error instanceof Error ? error.message : 'Unknown error';

      console.error(
        `❌ DatabaseHealthMonitor - Health check failed (${responseTime}ms):`,
        this.status.lastError
      );

      // Auto-recovery if enabled and too many consecutive failures
      if (
        this.config.enableAutoRecovery &&
        this.status.consecutiveFailures >= this.config.maxConsecutiveFailures
      ) {
        console.log(
          '🔄 DatabaseHealthMonitor - Too many consecutive failures, attempting recovery...'
        );
        await this.attemptRecovery();
      }
    }
  }

  private updateResponseTime(responseTime: number): void {
    this.responseTimes.push(responseTime);

    // Keep only last 10 response times for average calculation
    if (this.responseTimes.length > 10) {
      this.responseTimes.shift();
    }

    this.status.averageResponseTime =
      this.responseTimes.reduce((a, b) => a + b, 0) / this.responseTimes.length;
  }

  private async attemptRecovery(): Promise<void> {
    try {
      console.log('🔄 DatabaseHealthMonitor - Starting database recovery...');

      // Stop monitoring during recovery
      this.stopMonitoring();

      // Try graceful recovery first
      try {
        const recovered = await sqliteDatabase.gracefulRecovery();
        if (recovered) {
          console.log(
            '✅ DatabaseHealthMonitor - Graceful recovery successful'
          );
          this.startMonitoring();
          return;
        }
      } catch (gracefulError) {
        console.log(
          '⚠️ DatabaseHealthMonitor - Graceful recovery failed, trying emergency reset'
        );
      }

      // Try emergency reset
      try {
        await sqliteDatabase.emergencyReset();
        console.log('✅ DatabaseHealthMonitor - Emergency reset successful');
        this.startMonitoring();
        return;
      } catch (emergencyError) {
        console.log(
          '⚠️ DatabaseHealthMonitor - Emergency reset failed, using bypass mode'
        );
      }

      // Last resort: bypass mode
      try {
        await sqliteDatabase.bypassDatabase();
        console.log(
          '⚠️ DatabaseHealthMonitor - Using bypass mode - no data persistence'
        );
        this.startMonitoring();
        return;
      } catch (bypassError) {
        console.error('❌ DatabaseHealthMonitor - All recovery methods failed');
        throw bypassError;
      }
    } catch (error) {
      console.error('❌ DatabaseHealthMonitor - Recovery failed:', error);

      // Restart monitoring even if recovery failed
      this.startMonitoring();
    }
  }

  getStatus(): DatabaseHealthStatus {
    return { ...this.status };
  }

  isHealthy(): boolean {
    return this.status.isHealthy;
  }

  getConsecutiveFailures(): number {
    return this.status.consecutiveFailures;
  }

  getAverageResponseTime(): number {
    return this.status.averageResponseTime;
  }

  // Force a health check
  async forceHealthCheck(): Promise<boolean> {
    const startTime = Date.now();

    try {
      await this.performHealthCheck();
      return this.status.isHealthy;
    } catch (error) {
      console.error(
        '❌ DatabaseHealthMonitor - Force health check failed:',
        error
      );
      return false;
    }
  }

  // Update configuration
  updateConfig(newConfig: Partial<HealthCheckConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log('⚙️ DatabaseHealthMonitor - Configuration updated');
  }

  // Get current configuration
  getConfig(): HealthCheckConfig {
    return { ...this.config };
  }

  // Cleanup
  destroy(): void {
    this.stopMonitoring();
    console.log('🧹 DatabaseHealthMonitor - Destroyed');
  }
}

// Export singleton instance
export const databaseHealthMonitor = new DatabaseHealthMonitor();
export default databaseHealthMonitor;
