import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_ENDPOINTS, ApiResponse } from './config';
import httpClient from './httpClient';

// Crash reporting types
export interface CrashReport {
  id: string;
  type: 'error' | 'crash' | 'warning' | 'performance';
  message: string;
  stack?: string;
  timestamp: Date;
  userId?: string;
  sessionId: string;
  deviceInfo: DeviceInfo;
  appInfo: AppInfo;
  context: Record<string, any>;
  severity: 'low' | 'medium' | 'high' | 'critical';
  resolved: boolean;
  tags: string[];
}

export interface DeviceInfo {
  platform: string;
  version: string;
  model: string;
  manufacturer: string;
  memory: number;
  storage: number;
  batteryLevel?: number;
  isOnline: boolean;
  networkType?: string;
}

export interface AppInfo {
  version: string;
  buildNumber: string;
  bundleId: string;
  environment: string;
  timestamp: Date;
}

export interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  timestamp: Date;
  context: Record<string, any>;
}

export interface CrashReportingService {
  // Core functionality
  initialize: () => Promise<boolean>;
  captureError: (
    error: Error,
    context?: Record<string, any>
  ) => Promise<string>;
  captureCrash: (crash: any, context?: Record<string, any>) => Promise<string>;
  captureWarning: (
    message: string,
    context?: Record<string, any>
  ) => Promise<string>;
  capturePerformance: (metric: PerformanceMetric) => Promise<void>;

  // Report management
  getReports: (limit?: number) => Promise<CrashReport[]>;
  getReport: (id: string) => Promise<CrashReport | null>;
  markResolved: (id: string) => Promise<boolean>;
  deleteReport: (id: string) => Promise<boolean>;

  // Server communication
  uploadReports: () => Promise<boolean>;
  uploadReport: (
    report: CrashReport
  ) => Promise<ApiResponse<{ success: boolean }>>;

  // Utility methods
  isEnabled: () => boolean;
  setEnabled: (enabled: boolean) => Promise<void>;
  getDeviceInfo: () => DeviceInfo;
  getAppInfo: () => AppInfo;
  setUserContext: (userId: string) => void;
  addTag: (tag: string) => void;
  removeTag: (tag: string) => void;
}

// Crash reporting service implementation
class CrashReportingServiceImpl implements CrashReportingService {
  private isInitialized = false;
  private enabled = true;
  private sessionId = '';
  private userId?: string;
  private tags: string[] = [];
  private reports: CrashReport[] = [];
  private readonly STORAGE_KEY = 'crash_reports';
  private readonly MAX_REPORTS = 100;

  async initialize(): Promise<boolean> {
    try {
      console.log('🚨 Initializing crash reporting service...');

      // Generate session ID
      this.sessionId = this.generateSessionId();

      // Load existing reports
      await this.loadReports();

      // Set up global error handler
      this.setupGlobalErrorHandler();

      this.isInitialized = true;
      console.log('✅ Crash reporting service initialized');
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize crash reporting service:', error);
      return false;
    }
  }

  async captureError(
    error: Error,
    context?: Record<string, any>
  ): Promise<string> {
    try {
      const report: CrashReport = {
        id: this.generateReportId(),
        type: 'error',
        message: error.message,
        stack: error.stack,
        timestamp: new Date(),
        userId: this.userId,
        sessionId: this.sessionId,
        deviceInfo: this.getDeviceInfo(),
        appInfo: this.getAppInfo(),
        context: context || {},
        severity: this.determineSeverity(error),
        resolved: false,
        tags: [...this.tags, 'error'],
      };

      await this.addReport(report);
      console.log('📝 Error captured:', error.message);
      return report.id;
    } catch (err) {
      console.error('❌ Error capturing error:', err);
      return '';
    }
  }

  async captureCrash(
    crash: any,
    context?: Record<string, any>
  ): Promise<string> {
    try {
      const report: CrashReport = {
        id: this.generateReportId(),
        type: 'crash',
        message: crash.message || 'Application crash',
        stack: crash.stack,
        timestamp: new Date(),
        userId: this.userId,
        sessionId: this.sessionId,
        deviceInfo: this.getDeviceInfo(),
        appInfo: this.getAppInfo(),
        context: context || {},
        severity: 'critical',
        resolved: false,
        tags: [...this.tags, 'crash'],
      };

      await this.addReport(report);
      console.log('💥 Crash captured:', crash.message);
      return report.id;
    } catch (err) {
      console.error('❌ Error capturing crash:', err);
      return '';
    }
  }

  async captureWarning(
    message: string,
    context?: Record<string, any>
  ): Promise<string> {
    try {
      const report: CrashReport = {
        id: this.generateReportId(),
        type: 'warning',
        message,
        timestamp: new Date(),
        userId: this.userId,
        sessionId: this.sessionId,
        deviceInfo: this.getDeviceInfo(),
        appInfo: this.getAppInfo(),
        context: context || {},
        severity: 'low',
        resolved: false,
        tags: [...this.tags, 'warning'],
      };

      await this.addReport(report);
      console.log('⚠️ Warning captured:', message);
      return report.id;
    } catch (err) {
      console.error('❌ Error capturing warning:', err);
      return '';
    }
  }

  async capturePerformance(metric: PerformanceMetric): Promise<void> {
    try {
      const report: CrashReport = {
        id: this.generateReportId(),
        type: 'performance',
        message: `${metric.name}: ${metric.value} ${metric.unit}`,
        timestamp: new Date(),
        userId: this.userId,
        sessionId: this.sessionId,
        deviceInfo: this.getDeviceInfo(),
        appInfo: this.getAppInfo(),
        context: { ...metric.context, metric },
        severity: 'low',
        resolved: false,
        tags: [...this.tags, 'performance'],
      };

      await this.addReport(report);
      console.log('📊 Performance metric captured:', metric.name);
    } catch (err) {
      console.error('❌ Error capturing performance metric:', err);
    }
  }

  async getReports(limit: number = 50): Promise<CrashReport[]> {
    try {
      return this.reports.slice(-limit);
    } catch (error) {
      console.error('❌ Error getting reports:', error);
      return [];
    }
  }

  async getReport(id: string): Promise<CrashReport | null> {
    try {
      return this.reports.find(report => report.id === id) || null;
    } catch (error) {
      console.error('❌ Error getting report:', error);
      return null;
    }
  }

  async markResolved(id: string): Promise<boolean> {
    try {
      const report = this.reports.find(r => r.id === id);
      if (report) {
        report.resolved = true;
        await this.saveReports();
        console.log('✅ Report marked as resolved:', id);
        return true;
      }
      return false;
    } catch (error) {
      console.error('❌ Error marking report as resolved:', error);
      return false;
    }
  }

  async deleteReport(id: string): Promise<boolean> {
    try {
      this.reports = this.reports.filter(report => report.id !== id);
      await this.saveReports();
      console.log('🗑️ Report deleted:', id);
      return true;
    } catch (error) {
      console.error('❌ Error deleting report:', error);
      return false;
    }
  }

  async uploadReports(): Promise<boolean> {
    try {
      const unresolvedReports = this.reports.filter(report => !report.resolved);

      if (unresolvedReports.length === 0) {
        console.log('📝 No reports to upload');
        return true;
      }

      console.log(`📤 Uploading ${unresolvedReports.length} reports...`);

      const results = await Promise.allSettled(
        unresolvedReports.map(report => this.uploadReport(report))
      );

      const successCount = results.filter(
        result => result.status === 'fulfilled' && result.value?.success
      ).length;

      console.log(
        `✅ Upload completed: ${successCount}/${unresolvedReports.length} successful`
      );
      return successCount > 0;
    } catch (error) {
      console.error('❌ Error uploading reports:', error);
      return false;
    }
  }

  async uploadReport(
    report: CrashReport
  ): Promise<ApiResponse<{ success: boolean }>> {
    try {
      const response = await httpClient.post<{ success: boolean }>(
        '/api/crash-reporting/upload',
        report
      );

      if (response.success) {
        console.log('✅ Report uploaded successfully:', report.id);
      } else {
        console.log('❌ Failed to upload report:', report.id);
      }

      return response;
    } catch (error) {
      console.error('❌ Error uploading report:', error);
      return {
        success: false,
        error: 'Failed to upload report',
      };
    }
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  async setEnabled(enabled: boolean): Promise<void> {
    try {
      this.enabled = enabled;
      await AsyncStorage.setItem(
        'crash_reporting_enabled',
        JSON.stringify(enabled)
      );
      console.log(`🔧 Crash reporting ${enabled ? 'enabled' : 'disabled'}`);
    } catch (error) {
      console.error('❌ Error setting crash reporting enabled:', error);
    }
  }

  getDeviceInfo(): DeviceInfo {
    return {
      platform: Platform.OS,
      version: Platform.Version.toString(),
      model: 'Unknown', // Would use Device.deviceName in real app
      manufacturer: 'Unknown',
      memory: 0, // Would get actual memory in real app
      storage: 0, // Would get actual storage in real app
      isOnline: true, // Would check network status in real app
    };
  }

  getAppInfo(): AppInfo {
    return {
      version: '1.0.0',
      buildNumber: '1',
      bundleId: 'com.bachelormess.client',
      environment: process.env.EXPO_PUBLIC_ENV || 'development',
      timestamp: new Date(),
    };
  }

  setUserContext(userId: string): void {
    this.userId = userId;
    console.log('👤 User context set:', userId);
  }

  addTag(tag: string): void {
    if (!this.tags.includes(tag)) {
      this.tags.push(tag);
      console.log('🏷️ Tag added:', tag);
    }
  }

  removeTag(tag: string): void {
    this.tags = this.tags.filter(t => t !== tag);
    console.log('🏷️ Tag removed:', tag);
  }

  private setupGlobalErrorHandler(): void {
    // Set up global error handler for React Native
    if (__DEV__) {
      // In development, let errors bubble up to React Native's error screen
      return;
    }

    // In production, capture unhandled errors
    const originalErrorHandler = ErrorUtils.setGlobalHandler;
    ErrorUtils.setGlobalHandler((error: Error, isFatal?: boolean) => {
      console.error('🚨 Unhandled error:', error);

      if (this.enabled) {
        this.captureError(error, {
          isFatal,
          unhandled: true,
        });
      }
    });
  }

  private async addReport(report: CrashReport): Promise<void> {
    if (!this.enabled) {
      return;
    }

    this.reports.push(report);

    // Keep only the latest reports
    if (this.reports.length > this.MAX_REPORTS) {
      this.reports = this.reports.slice(-this.MAX_REPORTS);
    }

    await this.saveReports();
  }

  private async loadReports(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        this.reports = JSON.parse(stored);
      }
    } catch (error) {
      console.error('❌ Error loading reports:', error);
      this.reports = [];
    }
  }

  private async saveReports(): Promise<void> {
    try {
      await AsyncStorage.setItem(
        this.STORAGE_KEY,
        JSON.stringify(this.reports)
      );
    } catch (error) {
      console.error('❌ Error saving reports:', error);
    }
  }

  private determineSeverity(
    error: Error
  ): 'low' | 'medium' | 'high' | 'critical' {
    const message = error.message.toLowerCase();

    if (message.includes('network') || message.includes('timeout')) {
      return 'medium';
    }

    if (message.includes('crash') || message.includes('fatal')) {
      return 'critical';
    }

    if (message.includes('warning')) {
      return 'low';
    }

    return 'high';
  }

  private generateReportId(): string {
    return `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Export singleton instance
export const crashReportingService = new CrashReportingServiceImpl();
