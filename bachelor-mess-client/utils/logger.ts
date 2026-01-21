/**
 * Production-safe logging utility
 * Only logs in development mode to prevent performance issues and data leaks
 */

type LogLevel = 'log' | 'warn' | 'error' | 'debug' | 'info';

class Logger {
  private isDevelopment: boolean;

  constructor() {
    this.isDevelopment = __DEV__ || process.env.NODE_ENV === 'development';
  }

  /**
   * Sanitize sensitive data from log objects
   */
  private sanitize(data: any): any {
    if (!data || typeof data !== 'object') {
      return data;
    }

    if (Array.isArray(data)) {
      return data.map(item => this.sanitize(item));
    }

    const sensitiveKeys = [
      'password',
      'token',
      'auth_token',
      'refreshToken',
      'authorization',
      'apiKey',
      'secret',
      'privateKey',
      'accessToken',
      'bearer',
    ];

    const sanitized: any = {};
    for (const [key, value] of Object.entries(data)) {
      const lowerKey = key.toLowerCase();
      const isSensitive = sensitiveKeys.some(sk => lowerKey.includes(sk));

      if (isSensitive && value) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = this.sanitize(value);
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  /**
   * Log message (only in development)
   */
  log(message: string, ...args: any[]): void {
    if (this.isDevelopment) {
      const sanitizedArgs = args.map(arg => this.sanitize(arg));
      console.log(message, ...sanitizedArgs);
    }
  }

  /**
   * Log warning (always logged, but sanitized in production)
   */
  warn(message: string, ...args: any[]): void {
    const sanitizedArgs = args.map(arg => this.sanitize(arg));
    console.warn(message, ...sanitizedArgs);
  }

  /**
   * Log error (always logged, but sanitized)
   */
  error(message: string, ...args: any[]): void {
    const sanitizedArgs = args.map(arg => this.sanitize(arg));
    console.error(message, ...sanitizedArgs);
  }

  /**
   * Debug log (only in development)
   */
  debug(message: string, ...args: any[]): void {
    if (this.isDevelopment) {
      const sanitizedArgs = args.map(arg => this.sanitize(arg));
      console.log(`[DEBUG] ${message}`, ...sanitizedArgs);
    }
  }

  /**
   * Info log (only in development)
   */
  info(message: string, ...args: any[]): void {
    if (this.isDevelopment) {
      const sanitizedArgs = args.map(arg => this.sanitize(arg));
      console.log(`[INFO] ${message}`, ...sanitizedArgs);
    }
  }

  /**
   * Log API request (sanitized, only in development)
   */
  apiRequest(method: string, url: string, data?: any): void {
    if (this.isDevelopment) {
      const sanitizedData = data ? this.sanitize(data) : undefined;
      console.log(`🌐 [${method}] ${url}`, sanitizedData ? { data: sanitizedData } : '');
    }
  }

  /**
   * Log API response (sanitized, only in development)
   */
  apiResponse(method: string, url: string, success: boolean, data?: any): void {
    if (this.isDevelopment) {
      const sanitizedData = data ? this.sanitize(data) : undefined;
      const icon = success ? '✅' : '❌';
      console.log(`${icon} [${method}] ${url}`, sanitizedData ? { data: sanitizedData } : '');
    }
  }
}

// Export singleton instance
export const logger = new Logger();
export default logger;
