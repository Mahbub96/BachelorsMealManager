import { Alert } from 'react-native';

/**
 * Custom Error Classes for React Native
 */
export class AppError extends Error {
  public readonly code: string;
  public readonly statusCode?: number;
  public readonly isOperational: boolean;
  public readonly timestamp: string;

  constructor(
    message: string,
    code: string = 'UNKNOWN_ERROR',
    statusCode?: number,
    isOperational: boolean = true
  ) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.timestamp = new Date().toISOString();

    Error.captureStackTrace(this, this.constructor);
  }
}

export class NetworkError extends AppError {
  constructor(message: string = 'Network error occurred') {
    super(message, 'NETWORK_ERROR', undefined, true);
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication failed') {
    super(message, 'AUTHENTICATION_ERROR', 401, true);
  }
}

export class ValidationError extends AppError {
  public readonly details: Array<{
    field: string;
    message: string;
    value?: any;
  }>;

  constructor(
    message: string,
    details: Array<{ field: string; message: string; value?: any }> = []
  ) {
    super(message, 'VALIDATION_ERROR', 400, true);
    this.details = details;
  }
}

export class ServerError extends AppError {
  constructor(message: string = 'Server error occurred') {
    super(message, 'SERVER_ERROR', 500, false);
  }
}

export class OfflineError extends AppError {
  constructor(message: string = 'You are offline') {
    super(message, 'OFFLINE_ERROR', undefined, true);
  }
}

/**
 * Error Handler Class
 */
export class ErrorHandler {
  private static instance: ErrorHandler;
  private errorLog: Array<{ error: Error; timestamp: string; context?: any }> =
    [];

  private constructor() {}

  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  /**
   * Handle and log errors
   */
  handleError(error: Error, context?: any): void {
    // Log error
    this.logError(error, context);

    // Determine if we should show user-friendly message
    if (this.shouldShowUserMessage(error)) {
      this.showUserMessage(error);
    }

    // Handle specific error types
    this.handleSpecificError(error);
  }

  /**
   * Log error with context
   */
  private logError(error: Error, context?: any): void {
    const errorEntry = {
      error,
      timestamp: new Date().toISOString(),
      context,
    };

    this.errorLog.push(errorEntry);

    // Keep only last 100 errors
    if (this.errorLog.length > 100) {
      this.errorLog = this.errorLog.slice(-100);
    }

    // Log to console in development
    if (__DEV__) {
      console.error('Error occurred:', {
        message: error.message,
        stack: error.stack,
        context,
        timestamp: errorEntry.timestamp,
      });
    }
  }

  /**
   * Determine if error should show user message
   */
  private shouldShowUserMessage(error: Error): boolean {
    if (error instanceof AppError) {
      return error.isOperational;
    }
    return true;
  }

  /**
   * Show user-friendly error message
   */
  private showUserMessage(error: Error): void {
    let title = 'Error';
    let message = 'An unexpected error occurred';

    if (error instanceof AppError) {
      switch (error.code) {
        case 'NETWORK_ERROR':
          title = 'Connection Error';
          message = 'Please check your internet connection and try again.';
          break;
        case 'AUTHENTICATION_ERROR':
          title = 'Authentication Error';
          message = 'Please login again to continue.';
          break;
        case 'VALIDATION_ERROR':
          title = 'Validation Error';
          message = error.message;
          break;
        case 'OFFLINE_ERROR':
          title = 'Offline';
          message =
            'You are currently offline. Your changes will be saved and synced when you reconnect.';
          break;
        case 'SERVER_ERROR':
          title = 'Server Error';
          message =
            'Our servers are experiencing issues. Please try again later.';
          break;
        default:
          message = error.message;
      }
    } else {
      message = error.message || 'An unexpected error occurred';
    }

    Alert.alert(title, message);
  }

  /**
   * Handle specific error types
   */
  private handleSpecificError(error: Error): void {
    if (error instanceof AuthenticationError) {
      // Handle authentication errors (e.g., redirect to login)
      this.handleAuthError();
    } else if (error instanceof NetworkError) {
      // Handle network errors
      this.handleNetworkError();
    } else if (error instanceof OfflineError) {
      // Handle offline errors
      this.handleOfflineError();
    }
  }

  /**
   * Handle authentication errors
   */
  private handleAuthError(): void {
    // This would typically trigger a logout or redirect to login
    // Implementation depends on your auth context
    console.log('Authentication error - should redirect to login');
  }

  /**
   * Handle network errors
   */
  private handleNetworkError(): void {
    // Could implement retry logic or offline mode
    console.log('Network error - could implement retry logic');
  }

  /**
   * Handle offline errors
   */
  private handleOfflineError(): void {
    // Could show offline indicator or enable offline mode
    console.log('Offline error - could show offline indicator');
  }

  /**
   * Get error log
   */
  getErrorLog(): Array<{ error: Error; timestamp: string; context?: any }> {
    return [...this.errorLog];
  }

  /**
   * Clear error log
   */
  clearErrorLog(): void {
    this.errorLog = [];
  }

  /**
   * Create error from API response
   */
  static createFromApiResponse(response: any): AppError {
    if (response.error) {
      switch (response.errorCode) {
        case 'VALIDATION_ERROR':
          return new ValidationError(response.error, response.details || []);
        case 'AUTHENTICATION_ERROR':
          return new AuthenticationError(response.error);
        case 'NETWORK_ERROR':
          return new NetworkError(response.error);
        case 'SERVER_ERROR':
          return new ServerError(response.error);
        default:
          return new AppError(
            response.error,
            response.errorCode,
            response.statusCode
          );
      }
    }
    return new AppError('Unknown error occurred');
  }

  /**
   * Create error from network failure
   */
  static createFromNetworkFailure(error: any): NetworkError {
    if (error.message?.includes('Network request failed')) {
      return new NetworkError(
        'Unable to connect to server. Please check your internet connection.'
      );
    }
    return new NetworkError(error.message || 'Network error occurred');
  }

  /**
   * Create offline error
   */
  static createOfflineError(): OfflineError {
    return new OfflineError();
  }
}

/**
 * Async error wrapper for functions
 */
export const withErrorHandling = <T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  context?: any
) => {
  return async (...args: T): Promise<R> => {
    try {
      return await fn(...args);
    } catch (error) {
      const errorHandler = ErrorHandler.getInstance();
      errorHandler.handleError(error as Error, context);
      throw error;
    }
  };
};

/**
 * Retry mechanism for failed operations
 */
export const withRetry = <T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  maxRetries: number = 3,
  delay: number = 1000
) => {
  return async (...args: T): Promise<R> => {
    let lastError: Error;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await fn(...args);
      } catch (error) {
        lastError = error as Error;

        if (attempt === maxRetries) {
          throw lastError;
        }

        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, delay * attempt));
      }
    }

    throw lastError!;
  };
};

/**
 * Debounce function for error-prone operations
 */
export const debounce = <T extends any[], R>(
  fn: (...args: T) => R,
  delay: number = 300
) => {
  let timeoutId: NodeJS.Timeout;

  return (...args: T): void => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
};

// Export singleton instance
export const errorHandler = ErrorHandler.getInstance();
