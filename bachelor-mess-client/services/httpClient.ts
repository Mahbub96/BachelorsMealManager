import AsyncStorage from '@react-native-async-storage/async-storage';
import logger from '../utils/logger';
import authEventEmitter from './authEventEmitter';
import { config as API_CONFIG, ApiResponse, HTTP_STATUS } from './config';
import { offlineStorage } from './offlineStorage';

// Request configuration interface
interface RequestConfig {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: any;
  timeout?: number;
  retries?: number;
  cache?: boolean;
  cacheKey?: string;
  offlineFallback?: boolean;
  skipAuth?: boolean; // Skip auth token for public endpoints
}

// Enhanced error types
interface ApiError extends Error {
  status?: number;
  code?: string;
  response?: any;
}

// HTTP Client Class
class HttpClient {
  private baseURL: string;
  private defaultHeaders: Record<string, string>;
  private requestInterceptors: ((config: RequestConfig) => RequestConfig)[] =
    [];
  private responseInterceptors: ((response: Response) => Response)[] = [];
  private isOnlineCache: { status: boolean; timestamp: number } | null = null;
  private readonly ONLINE_CACHE_DURATION = 60000; // 60 seconds (increased to reduce health check frequency)

  constructor() {
    this.baseURL = API_CONFIG.apiUrl;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };
  }

  // Add request interceptor
  addRequestInterceptor(interceptor: (config: RequestConfig) => RequestConfig) {
    this.requestInterceptors.push(interceptor);
  }

  // Add response interceptor
  addResponseInterceptor(interceptor: (response: Response) => Response) {
    this.responseInterceptors.push(interceptor);
  }

  // Get auth token from storage
  private async getAuthToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem('auth_token');
    } catch (error) {
      logger.error('Error getting auth token:', error);
      return null;
    }
  }

  // Apply request interceptors
  private applyRequestInterceptors(config: RequestConfig): RequestConfig {
    return this.requestInterceptors.reduce((config, interceptor) => {
      return interceptor(config);
    }, config);
  }

  // Apply response interceptors
  private applyResponseInterceptors(response: Response): Response {
    return this.responseInterceptors.reduce((response, interceptor) => {
      return interceptor(response);
    }, response);
  }

  // Create request configuration
  private async createRequestConfig(
    endpoint: string,
    config: RequestConfig = {}
  ): Promise<RequestConfig> {
    const token = config.skipAuth ? null : await this.getAuthToken();

    const defaultConfig: RequestConfig = {
      method: 'GET',
      headers: {
        ...this.defaultHeaders,
        ...(token && { Authorization: `Bearer ${token}` }),
        ...config.headers,
      },
      timeout: API_CONFIG.timeout,
      retries: API_CONFIG.maxRetries,
      offlineFallback: true,
    };

    return this.applyRequestInterceptors({
      ...defaultConfig,
      ...config,
    });
  }

  // Enhanced online check with caching
  private async isOnline(): Promise<boolean> {
    // Check cache first
    if (
      this.isOnlineCache &&
      Date.now() - this.isOnlineCache.timestamp < this.ONLINE_CACHE_DURATION
    ) {
      return this.isOnlineCache.status;
    }

    try {
      // Try both /health and /api/health endpoints
      const healthUrls = [
        `${this.baseURL}/health`,
        `${this.baseURL}/api/health`,
      ];

      let lastError: Error | null = null;
      
      // Try each health URL
      for (const healthUrl of healthUrls) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 10000);

          const response = await fetch(healthUrl, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'User-Agent': 'BachelorFlatManager/1.0',
            },
            signal: controller.signal,
          });

          clearTimeout(timeoutId);

          if (response.ok) {
            this.isOnlineCache = {
              status: true,
              timestamp: Date.now(),
            };
            return true;
          } else if (response.status === 429) {
            // 429 = Rate limited, but server IS online
            logger.warn(`API rate limited (429), but server is online`);
            this.isOnlineCache = {
              status: true,
              timestamp: Date.now(),
            };
            return true;
          } else {
            lastError = new Error(`HTTP ${response.status}: ${response.statusText}`);
            continue; // Try next URL
          }
        } catch (error) {
          lastError = error instanceof Error ? error : new Error(String(error));
          continue; // Try next URL
        }
      }

      // All URLs failed
      logger.error('All health check URLs failed:', lastError?.message);
      this.isOnlineCache = {
        status: false,
        timestamp: Date.now(),
      };
      return false;
    } catch (error) {
      this.isOnlineCache = {
        status: false,
        timestamp: Date.now(),
      };
      return false;
    }
  }

  // Store request for offline retry
  private async storeForOfflineRetry(
    endpoint: string,
    config: RequestConfig
  ): Promise<string> {
    const offlineRequest = {
      endpoint,
      method: config.method!,
      data: config.body,
      headers: config.headers,
      maxRetries: 3,
      timestamp: Date.now(),
    };

    return await offlineStorage.storeRequest(offlineRequest);
  }

  // Enhanced retry logic with exponential backoff and jitter
  private async retryRequest(
    url: string,
    config: RequestConfig,
    retryCount: number = 0
  ): Promise<Response> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(
        () => controller.abort(),
        config.timeout || API_CONFIG.timeout
      );

      // Convert body to JSON string if it's an object
      const requestBody = config.body 
        ? (typeof config.body === 'string' ? config.body : JSON.stringify(config.body))
        : undefined;

      const response = await fetch(url, {
        method: config.method,
        headers: config.headers,
        body: requestBody,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Handle rate limiting (429)
      if (response.status === 429) {
        await new Promise(
          resolve => setTimeout(resolve, 5000 * (retryCount + 1)) // Increased delay
        );

        if (retryCount < (config.retries || API_CONFIG.maxRetries)) {
          return this.retryRequest(url, config, retryCount + 1);
        }
      }

      return this.applyResponseInterceptors(response);
    } catch (error) {
      const maxRetries = config.retries || API_CONFIG.maxRetries;

      if (retryCount < maxRetries) {
        // Exponential backoff with jitter
        const baseDelay = API_CONFIG.retryDelay;
        const exponentialDelay = baseDelay * Math.pow(2, retryCount);
        const jitter = Math.random() * 0.1 * exponentialDelay;
        const delay = exponentialDelay + jitter;

        await new Promise(resolve => setTimeout(resolve, delay));
        return this.retryRequest(url, config, retryCount + 1);
      }

      throw error;
    }
  }

  // Enhanced response handling
  private async handleResponse<T>(response: Response, endpoint?: string): Promise<ApiResponse<T>> {
    const contentType = response.headers.get('content-type');
    const isJson = contentType?.includes('application/json');

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      let errorData: any = null;

      if (isJson) {
        try {
          errorData = await response.json();
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch {
          // Fallback to default error message
        }
      }

      // Create enhanced error object
      const error: ApiError = new Error(errorMessage) as ApiError;
      error.status = response.status;
      error.response = errorData;

      // Check if this is a login/register endpoint (should not trigger session expiration)
      // Use endpoint parameter or fallback to response.url
      const checkUrl = endpoint || response.url || '';
      const isAuthEndpoint = 
        checkUrl.includes('/auth/login') || 
        checkUrl.includes('/auth/register') ||
        checkUrl.includes('/auth/forgot-password') ||
        checkUrl.includes('/auth/reset-password');

      // Handle specific status codes
      switch (response.status) {
        case HTTP_STATUS.UNAUTHORIZED:
          // Don't trigger session expiration for login/register endpoints
          // These are expected to return 401 for invalid credentials
          if (!isAuthEndpoint) {
            await this.handleAuthError();
            throw new Error('Session expired. Please login again.');
          }
          // For auth endpoints, return failure instead of throwing so we don't log as ERROR
          return {
            success: false,
            error: errorMessage || 'Invalid email or password.',
          } as ApiResponse<T>;
        case HTTP_STATUS.FORBIDDEN:
          throw new Error('Access denied. Insufficient permissions.');
        case HTTP_STATUS.NOT_FOUND:
          throw new Error('Resource not found.');
        case HTTP_STATUS.INTERNAL_SERVER_ERROR:
          throw new Error('Server error. Please try again later.');
        case HTTP_STATUS.BAD_REQUEST:
          throw new Error(
            errorData?.message || errorData?.error || 'Invalid request data.'
          );
        default:
          throw error;
      }
    }

    if (response.status === HTTP_STATUS.NO_CONTENT) {
      return { success: true };
    }

    if (isJson) {
      const data = await response.json();
      return data;
    }

    const text = await response.text();
    return { success: true, data: text } as ApiResponse<T>;
  }

  // Enhanced error handling
  private handleResponseError(error: unknown): ApiResponse<never> {
    const err = error as { name?: string; message?: string; response?: { status?: number; data?: { message?: string } }; code?: string };
    const msg = error instanceof Error ? error.message : (err?.message ?? 'Unknown error');
    logger.error('HTTP Client Error:', msg);

    if (err?.name === 'AbortError') {
      return {
        success: false,
        error: 'Request timeout. Please check your connection and try again.',
      };
    }

    if (err?.response) {
      const { status, data } = err.response;

      switch (status) {
        case 401:
          this.handleAuthError();
          return {
            success: false,
            error: 'Session expired. Please login again.',
          };
        case 403:
          return {
            success: false,
            error:
              'Access denied. You do not have permission to perform this action.',
          };
        case 404:
          return {
            success: false,
            error: 'Resource not found.',
          };
        case 500:
          return {
            success: false,
            error: 'Server error. Please try again later.',
          };
        default:
          return {
            success: false,
            error: data?.message || `HTTP ${status} error occurred.`,
          };
      }
    }

    if (err?.code === 'NETWORK_ERROR') {
      return {
        success: false,
        error: 'Network error. Please check your internet connection.',
      };
    }

    return {
      success: false,
      error: msg,
    };
  }

  // Handle authentication errors
  private async handleAuthError(): Promise<void> {
    try {
      await AsyncStorage.removeItem('auth_token');
      await AsyncStorage.removeItem('user_data');
      await AsyncStorage.removeItem('auth_user');

      // Clear online cache to force re-check
      this.isOnlineCache = null;

      // Trigger logout event to redirect user to login
      await this.triggerLogout();
    } catch (error) {
      logger.error('Error clearing auth data:', error);
    }
  }

  // Trigger logout event
  private async triggerLogout(): Promise<void> {
    try {
      // Clear auth data directly
      await AsyncStorage.multiRemove(['auth_token', 'auth_user']);

      // Emit auth event
      authEventEmitter.emitAuthEvent({
        type: 'session_expired',
        data: { message: 'Session expired. Please login again.' },
      });
    } catch (error) {
      logger.error('Error triggering logout:', error);
    }
  }

  // Enhanced caching
  private async getCachedResponse<T>(
    cacheKey: string
  ): Promise<ApiResponse<T> | null> {
    try {
      const cached = await AsyncStorage.getItem(`cache_${cacheKey}`);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < API_CONFIG.cacheDuration) {
          return data;
        }
      }
    } catch (error) {
      // Silently handle cache read errors
    }
    return null;
  }

  private async setCachedResponse<T>(
    cacheKey: string,
    data: ApiResponse<T>
  ): Promise<void> {
    try {
      const cacheData = {
        data,
        timestamp: Date.now(),
      };
      await AsyncStorage.setItem(
        `cache_${cacheKey}`,
        JSON.stringify(cacheData)
      );
    } catch (error) {
      // Silently handle cache write errors
    }
  }

  // Main request method with enhanced error handling
  async request<T>(
    endpoint: string,
    config: RequestConfig = {}
  ): Promise<ApiResponse<T>> {
    try {
      const requestConfig = await this.createRequestConfig(endpoint, config);
      const url = `${this.baseURL}${endpoint}`;

      // Log API request (only in development)
      logger.apiRequest(requestConfig.method || 'GET', url, requestConfig.body);
      
      // Warn if request body contains userId/user_id (should be removed)
      if (['POST', 'PUT', 'PATCH'].includes(requestConfig.method || 'GET') && requestConfig.body) {
        const bodyData = typeof requestConfig.body === 'string' 
          ? JSON.parse(requestConfig.body || '{}') 
          : requestConfig.body;
        if (bodyData?.userId || bodyData?.user_id) {
          logger.warn('HTTP Client - Request body contains userId/user_id (should be removed):', { 
            hasUserId: !!bodyData.userId, 
            hasUser_id: !!bodyData.user_id 
          });
        }
      }

      // Check if device is online
      const online = await this.isOnline();

      if (!online) {
        console.log('📱 Device is offline');

        if (requestConfig.offlineFallback) {
          // Store for offline retry
          const requestId = await this.storeForOfflineRetry(
            endpoint,
            requestConfig
          );

          return {
            success: false,
            error:
              'Device is offline. Request will be retried when connection is restored.',
          };
        }

        return {
          success: false,
          error: 'No internet connection. Please check your network settings.',
        };
      }

      // Try cached response for GET requests
      if (
        requestConfig.method === 'GET' &&
        requestConfig.cache &&
        requestConfig.cacheKey
      ) {
        const cached = await this.getCachedResponse<T>(requestConfig.cacheKey);
        if (cached) {
          return cached;
        }
      }

      // Make the request with retry logic
      const response = await this.retryRequest(url, requestConfig);

      // Handle the response (pass endpoint to check if it's an auth endpoint)
      const result = await this.handleResponse<T>(response, endpoint);

      // Cache successful GET responses
      if (
        requestConfig.method === 'GET' &&
        result.success &&
        requestConfig.cache &&
        requestConfig.cacheKey
      ) {
        await this.setCachedResponse(requestConfig.cacheKey, result);
      }

      return result;
    } catch (error) {
      return this.handleResponseError(error);
    }
  }

  // HTTP method shortcuts
  async get<T>(
    endpoint: string,
    config: Omit<RequestConfig, 'method'> = {}
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...config, method: 'GET' });
  }

  async post<T>(
    endpoint: string,
    data?: unknown,
    config: Omit<RequestConfig, 'method' | 'body'> = {}
  ): Promise<ApiResponse<T>> {
    // Do not log request body here — it may contain password/tokens; request() uses logger.apiRequest with sanitized body
    // Remove userId/user_id from data if present (for meal submissions)
    // Backend should use authenticated user ID from JWT token
    let cleanData = data;
    if (data && typeof data === 'object' && !Array.isArray(data)) {
      const obj = data as Record<string, unknown>;
      const { userId, user_id, ...rest } = obj;
      if (userId !== undefined || user_id !== undefined) {
        cleanData = rest;
      }
    }
    
    return this.request<T>(endpoint, { ...config, method: 'POST', body: cleanData });
  }

  async put<T>(
    endpoint: string,
    data?: any,
    config: Omit<RequestConfig, 'method' | 'body'> = {}
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...config, method: 'PUT', body: data });
  }

  async delete<T>(
    endpoint: string,
    config: Omit<RequestConfig, 'method'> = {}
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...config, method: 'DELETE' });
  }

  async patch<T>(
    endpoint: string,
    data?: any,
    config: Omit<RequestConfig, 'method' | 'body'> = {}
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...config,
      method: 'PATCH',
      body: data,
    });
  }

  // Enhanced file upload with progress tracking
  async uploadFile<T>(
    endpoint: string,
    file: { uri: string; type: string; name: string },
    additionalData?: Record<string, any>,
    config: Omit<RequestConfig, 'method' | 'body'> = {}
  ): Promise<ApiResponse<T>> {
    try {
      const requestConfig = await this.createRequestConfig(endpoint, config);
      const url = `${this.baseURL}${endpoint}`;

      console.log(`📤 Uploading file: ${file.name} to ${url}`);

      // Check if online
      const online = await this.isOnline();
      if (!online) {
        if (requestConfig.offlineFallback) {
          const requestId = await this.storeForOfflineRetry(endpoint, {
            ...requestConfig,
            body: { file, ...additionalData },
          });
          console.log(`💾 File upload stored for offline retry: ${requestId}`);
          return {
            success: false,
            error:
              'Device is offline. Upload will be retried when connection is restored.',
          };
        }
        return {
          success: false,
          error: 'No internet connection. Please check your network settings.',
        };
      }

      // Create form data
      const formData = new FormData();
      formData.append('file', {
        uri: file.uri,
        type: file.type,
        name: file.name,
      } as unknown as Blob);

      // Add additional data
      if (additionalData) {
        Object.keys(additionalData).forEach(key => {
          formData.append(key, additionalData[key]);
        });
      }

      // Make upload request
      const response = await this.retryRequest(url, {
        ...requestConfig,
        method: 'POST',
        body: formData,
        headers: {
          ...requestConfig.headers,
          'Content-Type': 'multipart/form-data',
        },
      });

      const result = await this.handleResponse<T>(response);
      return result;
    } catch (error) {
      return this.handleResponseError(error);
    }
  }

  // Cache management
  async clearCache(): Promise<void> {
    try {
      // Clear all cached responses
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(
        key =>
          key.startsWith('cache_') ||
          key.includes('_stats') ||
          key.includes('_dashboard') ||
          key.includes('_analytics') ||
          key.includes('_meals') ||
          key.includes('_bazar')
      );

      if (cacheKeys.length > 0) {
        await AsyncStorage.multiRemove(cacheKeys);
      }

      // Clear online cache
      this.isOnlineCache = null;

      // Clear offline requests
      const offlineRequestKeys = keys.filter(
        key =>
          key.includes('offline_request') ||
          key.includes('req_') ||
          key.includes('pending_request')
      );

      if (offlineRequestKeys.length > 0) {
        await AsyncStorage.multiRemove(offlineRequestKeys);
      }
    } catch (error) {
      // Silently handle cache clearing errors
    }
  }

  // Network testing functionality (integrated from networkTest.ts)
  async testNetworkConnection(): Promise<{
    success: boolean;
    message: string;
    details?: any;
  }> {
    try {

      const response = await fetch(
        `${this.baseURL.replace('/api', '')}/health`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        return {
          success: true,
          message: '✅ Network connection successful',
          details: {
            status: response.status,
            url: this.baseURL,
            serverResponse: data,
          },
        };
      } else {
        return {
          success: false,
          message: `❌ Server responded with status: ${response.status}`,
          details: {
            status: response.status,
            statusText: response.statusText,
            url: this.baseURL,
          },
        };
      }
    } catch (error) {
      return {
        success: false,
        message: `❌ Network connection failed: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
        details: {
          error: error instanceof Error ? error.message : 'Unknown error',
          url: this.baseURL,
          type: error instanceof Error ? error.constructor.name : 'Unknown',
        },
      };
    }
  }

  async testLoginEndpoint(): Promise<{
    success: boolean;
    message: string;
    details?: any;
  }> {
    try {

      const response = await fetch(`${this.baseURL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'testpassword',
        }),
      });

      // We expect a 400 or 404 for invalid credentials, but the endpoint should be reachable
      if (response.status === 400 || response.status === 404) {
        return {
          success: true,
          message:
            '✅ Login endpoint is reachable (expected error for invalid credentials)',
          details: {
            status: response.status,
            url: `${this.baseURL}/auth/login`,
          },
        };
      } else if (response.ok) {
        return {
          success: true,
          message: '✅ Login endpoint is working',
          details: {
            status: response.status,
            url: `${this.baseURL}/auth/login`,
          },
        };
      } else {
        return {
          success: false,
          message: `❌ Login endpoint returned unexpected status: ${response.status}`,
          details: {
            status: response.status,
            statusText: response.statusText,
            url: `${this.baseURL}/auth/login`,
          },
        };
      }
    } catch (error) {
      return {
        success: false,
        message: `❌ Login endpoint test failed: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
        details: {
          error: error instanceof Error ? error.message : 'Unknown error',
          url: `${this.baseURL}/auth/login`,
          type: error instanceof Error ? error.constructor.name : 'Unknown',
        },
      };
    }
  }

  async runFullNetworkTest(): Promise<{
    connection: any;
    login: any;
    summary: string;
  }> {

    const connectionTest = await this.testNetworkConnection();
    const loginTest = await this.testLoginEndpoint();

    const allTestsPassed = connectionTest.success && loginTest.success;
    const summary = allTestsPassed
      ? '✅ All network tests passed! The app should be able to connect to the backend.'
      : '❌ Some network tests failed. Check the details below.';

    return {
      connection: connectionTest,
      login: loginTest,
      summary,
    };
  }

  // Enhanced offline status
  async getOfflineStatus() {
    try {
      const online = await this.isOnline();
      const pendingRequests = offlineStorage?.getPendingRequests
        ? await offlineStorage.getPendingRequests()
        : [];
      const storageSize = offlineStorage?.getStorageSize
        ? await offlineStorage.getStorageSize()
        : 0;

      return {
        isOnline: online,
        pendingRequests: pendingRequests.length,
        pendingCount: pendingRequests.length,
        storageSize: storageSize,
        lastChecked: this.isOnlineCache?.timestamp || null,
      };
    } catch (error) {
      return {
        isOnline: await this.isOnline(),
        pendingRequests: 0,
        pendingCount: 0,
        storageSize: 0,
        lastChecked: this.isOnlineCache?.timestamp || null,
      };
    }
  }

  // Enhanced offline request retry
  async retryOfflineRequests(): Promise<void> {
    try {
      const online = await this.isOnline();
      if (!online) {
        return;
      }

      const pendingRequests = offlineStorage?.getPendingRequests
        ? await offlineStorage.getPendingRequests()
        : [];

      for (const request of pendingRequests) {
        try {
          const url = `${this.baseURL}${request.endpoint}`;

          // Minimal fix: Extract method and headers from data if stored
          let method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' = 'POST';
          let headers: Record<string, string> = {};
          let requestBody = request.data;
          
          if (request.data && typeof request.data === 'object' && request.data._method) {
            method = request.data._method;
            headers = request.data._headers || {};
            const { _method, _headers, ...cleanData } = request.data;
            requestBody = cleanData;
          } else if (request.action) {
            // Fallback: map action to method
            method = request.action === 'UPDATE' ? 'PUT' : request.action === 'DELETE' ? 'DELETE' : 'POST';
          }

          // Reconstruct headers with auth token
          const token = await this.getAuthToken();
          const finalHeaders = {
            ...this.defaultHeaders,
            ...(token && { Authorization: `Bearer ${token}` }),
            ...headers,
          };

          const response = await this.retryRequest(url, {
            method: method,
            body: requestBody,
            headers: finalHeaders,
            timeout: API_CONFIG.timeout,
            retries: 1, // Only retry once for offline requests
          });

          const result = await this.handleResponse(response);

          if (result.success) {
            if (offlineStorage?.removeRequest) {
              await offlineStorage.removeRequest(request.id);
            }
          }
        } catch (error) {
          logger.error(
            `Failed to retry offline request ${request.endpoint}:`,
            error
          );
        }
      }
    } catch (error) {
      logger.error('Error retrying offline requests:', error);
      throw error;
    }
  }
}

// Export singleton instance
const httpClient = new HttpClient();
export default httpClient;
