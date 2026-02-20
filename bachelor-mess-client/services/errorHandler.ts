import { Alert } from 'react-native';
import { logger as appLogger } from '@/utils/logger';

// Error types for better categorization
enum ErrorType {
  NETWORK = 'NETWORK',
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  VALIDATION = 'VALIDATION',
  SERVER = 'SERVER',
  TIMEOUT = 'TIMEOUT',
  OFFLINE = 'OFFLINE',
  UNKNOWN = 'UNKNOWN',
}

// Error severity levels
enum ErrorSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

// Enhanced error interface
interface AppError {
  type: ErrorType;
  severity: ErrorSeverity;
  message: string;
  originalError?: unknown;
  context?: string;
  timestamp: number;
  retryable: boolean;
  userFriendlyMessage: string;
}

// Error handler class
class ErrorHandler {
  private errorLog: AppError[] = [];
  private readonly MAX_LOG_SIZE = 100;

  // Categorize error based on error message or type
  private categorizeError(error: any, context?: string): AppError {
    const errorMessage = error?.message || error?.toString() || 'Unknown error';
    const timestamp = Date.now();

    // Network/Connection errors
    if (
      errorMessage.includes('Network') ||
      errorMessage.includes('connection') ||
      errorMessage.includes('fetch') ||
      errorMessage.includes('timeout')
    ) {
      return {
        type: ErrorType.NETWORK,
        severity: ErrorSeverity.MEDIUM,
        message: errorMessage,
        originalError: error,
        context,
        timestamp,
        retryable: true,
        userFriendlyMessage:
          'Network connection issue. Please check your internet connection.',
      };
    }

    // Authentication errors
    if (
      errorMessage.includes('401') ||
      errorMessage.includes('unauthorized') ||
      errorMessage.includes('token') ||
      errorMessage.includes('login')
    ) {
      return {
        type: ErrorType.AUTHENTICATION,
        severity: ErrorSeverity.HIGH,
        message: errorMessage,
        originalError: error,
        context,
        timestamp,
        retryable: false,
        userFriendlyMessage: 'Session expired. Please login again.',
      };
    }

    // Authorization errors
    if (
      errorMessage.includes('403') ||
      errorMessage.includes('forbidden') ||
      errorMessage.includes('permission')
    ) {
      return {
        type: ErrorType.AUTHORIZATION,
        severity: ErrorSeverity.HIGH,
        message: errorMessage,
        originalError: error,
        context,
        timestamp,
        retryable: false,
        userFriendlyMessage:
          'Access denied. You do not have permission to perform this action.',
      };
    }

    // Validation errors
    if (
      errorMessage.includes('validation') ||
      errorMessage.includes('invalid') ||
      errorMessage.includes('required')
    ) {
      return {
        type: ErrorType.VALIDATION,
        severity: ErrorSeverity.LOW,
        message: errorMessage,
        originalError: error,
        context,
        timestamp,
        retryable: false,
        userFriendlyMessage: 'Please check your input and try again.',
      };
    }

    // Server errors
    if (
      errorMessage.includes('500') ||
      errorMessage.includes('server') ||
      errorMessage.includes('internal')
    ) {
      return {
        type: ErrorType.SERVER,
        severity: ErrorSeverity.HIGH,
        message: errorMessage,
        originalError: error,
        context,
        timestamp,
        retryable: true,
        userFriendlyMessage: 'Server error. Please try again later.',
      };
    }

    // Timeout errors
    if (errorMessage.includes('timeout') || errorMessage.includes('abort')) {
      return {
        type: ErrorType.TIMEOUT,
        severity: ErrorSeverity.MEDIUM,
        message: errorMessage,
        originalError: error,
        context,
        timestamp,
        retryable: true,
        userFriendlyMessage:
          'Request timeout. Please check your connection and try again.',
      };
    }

    // Offline errors
    if (
      errorMessage.includes('offline') ||
      errorMessage.includes('no internet')
    ) {
      return {
        type: ErrorType.OFFLINE,
        severity: ErrorSeverity.MEDIUM,
        message: errorMessage,
        originalError: error,
        context,
        timestamp,
        retryable: true,
        userFriendlyMessage:
          'You are offline. Please check your internet connection.',
      };
    }

    // Unknown errors
    return {
      type: ErrorType.UNKNOWN,
      severity: ErrorSeverity.MEDIUM,
      message: errorMessage,
      originalError: error,
      context,
      timestamp,
      retryable: false,
      userFriendlyMessage: 'An unexpected error occurred. Please try again.',
    };
  }

  // Handle error with logging and categorization
  handleError(error: any | unknown, context?: string): AppError {
    const appError = this.categorizeError(error, context);

    // Log the error
    this.logError(appError);

    // Use app logger (sanitized, no red-box overlay from console.error)
    appLogger.error('Error Handler', {
      type: appError.type,
      severity: appError.severity,
      message: appError.message,
      context: appError.context,
      timestamp: new Date(appError.timestamp).toISOString(),
    });

    return appError;
  }

  // Log error to internal storage
  private logError(error: AppError): void {
    this.errorLog.push(error);

    // Keep log size manageable
    if (this.errorLog.length > this.MAX_LOG_SIZE) {
      this.errorLog = this.errorLog.slice(-this.MAX_LOG_SIZE);
    }
  }

  // Get error log
  getErrorLog(): AppError[] {
    return [...this.errorLog];
  }

  // Clear error log
  clearErrorLog(): void {
    this.errorLog = [];
  }

  // Show user-friendly error alert
  showErrorAlert(error: AppError, onRetry?: () => void): void {
    const buttons: any[] = [
      {
        text: 'OK',
        style: 'default' as const,
      },
    ];

    if (error.retryable && onRetry) {
      buttons.unshift({
        text: 'Retry',
        style: 'default' as const,
        onPress: onRetry,
      });
    }

    Alert.alert('Error', error.userFriendlyMessage, buttons, {
      cancelable: true,
    });
  }

  // Handle API response errors
  handleApiResponse(
    response: { success: boolean; error?: string; data?: any },
    context?: string
  ): AppError | null {
    if (response.success) {
      return null;
    }

    const error = new Error(response.error || 'API request failed');
    return this.handleError(error, context);
  }

  // Check if error is retryable
  isRetryableError(error: AppError): boolean {
    return (
      error.retryable &&
      error.type !== ErrorType.AUTHENTICATION &&
      error.type !== ErrorType.AUTHORIZATION
    );
  }

  // Get error statistics
  getErrorStats(): {
    total: number;
    byType: Record<ErrorType, number>;
    bySeverity: Record<ErrorSeverity, number>;
    recentErrors: AppError[];
  } {
    const byType: Record<ErrorType, number> = {
      [ErrorType.NETWORK]: 0,
      [ErrorType.AUTHENTICATION]: 0,
      [ErrorType.AUTHORIZATION]: 0,
      [ErrorType.VALIDATION]: 0,
      [ErrorType.SERVER]: 0,
      [ErrorType.TIMEOUT]: 0,
      [ErrorType.OFFLINE]: 0,
      [ErrorType.UNKNOWN]: 0,
    };

    const bySeverity: Record<ErrorSeverity, number> = {
      [ErrorSeverity.LOW]: 0,
      [ErrorSeverity.MEDIUM]: 0,
      [ErrorSeverity.HIGH]: 0,
      [ErrorSeverity.CRITICAL]: 0,
    };

    this.errorLog.forEach(error => {
      byType[error.type]++;
      bySeverity[error.severity]++;
    });

    const recentErrors = this.errorLog
      .slice(-10)
      .sort((a, b) => b.timestamp - a.timestamp);

    return {
      total: this.errorLog.length,
      byType,
      bySeverity,
      recentErrors,
    };
  }

  // Check if there are critical errors
  hasCriticalErrors(): boolean {
    return this.errorLog.some(
      error => error.severity === ErrorSeverity.CRITICAL
    );
  }

  // Get most common error type
  getMostCommonErrorType(): ErrorType | null {
    const stats = this.getErrorStats();
    const maxCount = Math.max(...Object.values(stats.byType));

    if (maxCount === 0) return null;

    const mostCommon = Object.entries(stats.byType).find(
      ([_, count]) => count === maxCount
    );
    return mostCommon ? (mostCommon[0] as ErrorType) : null;
  }

  // Format error for display
  formatErrorForDisplay(error: AppError): string {
    const timeAgo = this.getTimeAgo(error.timestamp);
    return `${error.userFriendlyMessage}\n\nTime: ${timeAgo}\nType: ${error.type}`;
  }

  // Get time ago string
  private getTimeAgo(timestamp: number): string {
    const now = Date.now();
    const diff = now - timestamp;

    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return `${Math.floor(diff / 86400000)}d ago`;
  }
}

// Export singleton instance
const errorHandler = new ErrorHandler();
export default errorHandler;

// Export types for use in other files
export { ErrorType, ErrorSeverity };
export type { AppError };
