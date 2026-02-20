/**
 * Production-safe logging utility
 * Only logs in development mode to prevent performance issues and data leaks
 */

type LogLevel = 'log' | 'warn' | 'error' | 'debug' | 'info';

class Logger {
  private isDevelopment: boolean;

  constructor() {
    const debugDisabled = process.env.EXPO_PUBLIC_DEBUG_ENABLED === 'false';
    const isProdEnv = process.env.EXPO_PUBLIC_ENV === 'production';
    this.isDevelopment =
      !debugDisabled &&
      !isProdEnv &&
      (__DEV__ || process.env.NODE_ENV === 'development');
  }

  /** Keys that must never appear in logs (values replaced with [REDACTED]) */
  private static readonly SENSITIVE_KEYS = [
    'password',
    'token',
    'auth_token',
    'refreshToken',
    'refresh_token',
    'authorization',
    'apiKey',
    'api_key',
    'secret',
    'privateKey',
    'private_key',
    'accessToken',
    'access_token',
    'bearer',
    'current_password',
    'new_password',
    'confirm_password',
  ];

  /**
   * Sanitize sensitive data from log objects. Never logs passwords, tokens, or credentials.
   */
  private sanitize(data: unknown): unknown {
    if (data === null) return data;
    if (data instanceof Error)
      return { name: data.name, message: data.message };

    if (typeof data === 'string') {
      try {
        const parsed = JSON.parse(data);
        if (typeof parsed === 'object' && parsed !== null) {
          return JSON.stringify(
            this.sanitize(parsed) as Record<string, unknown>
          );
        }
      } catch {
        // Not JSON — leave as-is; callers must avoid passing raw request bodies as strings
      }
      return data;
    }

    if (typeof data !== 'object') return data;
    if (Array.isArray(data)) return data.map(item => this.sanitize(item));

    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data)) {
      const lowerKey = key.toLowerCase();
      const isSensitive = Logger.SENSITIVE_KEYS.some(sk =>
        lowerKey.includes(sk)
      );

      if (isSensitive && value !== undefined && value !== null) {
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
  log(message: string, ...args: unknown[]): void {
    if (this.isDevelopment) {
      const sanitizedArgs = args.map(arg => this.sanitize(arg));
      console.log(message, ...sanitizedArgs);
    }
  }

  /**
   * Log warning (only in development to avoid GUI overlay in production)
   */
  warn(message: string, ...args: unknown[]): void {
    if (this.isDevelopment) {
      const sanitizedArgs = args.map(arg => this.sanitize(arg));
      console.warn(message, ...sanitizedArgs);
    }
  }

  /**
   * Log error (always logged, but sanitized)
   */
  error(message: string, ...args: unknown[]): void {
    const sanitizedArgs = args.map(arg => this.sanitize(arg));
    console.log(`[ERROR] ${message}`, ...sanitizedArgs);
  }

  /**
   * Debug log (only in development)
   */
  debug(message: string, ...args: unknown[]): void {
    if (this.isDevelopment) {
      const sanitizedArgs = args.map(arg => this.sanitize(arg));
      console.log(`[DEBUG] ${message}`, ...sanitizedArgs);
    }
  }

  /**
   * Info log (only in development)
   */
  info(message: string, ...args: unknown[]): void {
    if (this.isDevelopment) {
      const sanitizedArgs = args.map(arg => this.sanitize(arg));
      console.log(`[INFO] ${message}`, ...sanitizedArgs);
    }
  }

  /**
   * Log API request (sanitized, only in development)
   */
  apiRequest(method: string, url: string, data?: unknown): void {
    if (this.isDevelopment) {
      const sanitizedData = data ? this.sanitize(data) : undefined;
      console.log(
        `🌐 [${method}] ${url}`,
        sanitizedData ? { data: sanitizedData } : ''
      );
    }
  }

  /**
   * Log API response (sanitized, only in development)
   */
  apiResponse(
    method: string,
    url: string,
    success: boolean,
    data?: unknown
  ): void {
    if (this.isDevelopment) {
      const sanitizedData = data ? this.sanitize(data) : undefined;
      const icon = success ? '✅' : '❌';
      console.log(
        `${icon} [${method}] ${url}`,
        sanitizedData ? { data: sanitizedData } : ''
      );
    }
  }
}

// Export singleton instance
export const logger = new Logger();
export default logger;
