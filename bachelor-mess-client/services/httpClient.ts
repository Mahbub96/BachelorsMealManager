import AsyncStorage from '@react-native-async-storage/async-storage';
import { config as API_CONFIG, ApiResponse, HTTP_STATUS } from './config';
import offlineStorage from './offlineStorage';
import authEventEmitter from './authEventEmitter';

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
      console.error('Error getting auth token:', error);
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
      // Simple health check
      const healthUrl = `${this.baseURL.replace('/api', '')}/health`;
      console.log('🔍 Checking API connectivity at:', healthUrl);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(healthUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        console.log('✅ API connectivity check successful');
        this.isOnlineCache = {
          status: true,
          timestamp: Date.now(),
        };
        return true;
      } else {
        console.log('❌ Health check failed with status:', response.status);
        this.isOnlineCache = {
          status: false,
          timestamp: Date.now(),
        };
        return false;
      }
    } catch (error) {
      console.log('❌ API connectivity check failed:', error);
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

      const response = await fetch(url, {
        method: config.method,
        headers: config.headers,
        body: config.body ? JSON.stringify(config.body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Handle rate limiting (429)
      if (response.status === 429) {
        console.log('⚠️ Rate limited, waiting before retry...');
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

        console.log(
          `🔄 Retrying request (${
            retryCount + 1
          }/${maxRetries}) after ${delay}ms`
        );

        await new Promise(resolve => setTimeout(resolve, delay));
        return this.retryRequest(url, config, retryCount + 1);
      }

      throw error;
    }
  }

  // Enhanced response handling
  private async handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
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

      // Handle specific status codes
      switch (response.status) {
        case HTTP_STATUS.UNAUTHORIZED:
          await this.handleAuthError();
          throw new Error('Session expired. Please login again.');
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
    return { success: true, data: text as any };
  }

  // Enhanced error handling
  private handleResponseError(error: any): ApiResponse<any> {
    console.error('🚨 HTTP Client Error:', error);

    if (error.name === 'AbortError') {
      return {
        success: false,
        error: 'Request timeout. Please check your connection and try again.',
      };
    }

    if (error.response) {
      const { status, data } = error.response;

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

    if (error.code === 'NETWORK_ERROR') {
      return {
        success: false,
        error: 'Network error. Please check your internet connection.',
      };
    }

    return {
      success: false,
      error: error.message || 'An unexpected error occurred.',
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

      console.log('🔐 Auth token cleared due to unauthorized access');

      // Trigger logout event to redirect user to login
      await this.triggerLogout();
    } catch (error) {
      console.error('Error clearing auth data:', error);
    }
  }

  // Trigger logout event
  private async triggerLogout(): Promise<void> {
    try {
      // Clear auth data directly
      await AsyncStorage.multiRemove(['auth_token', 'auth_user']);
      console.log('🔐 Auth token cleared due to unauthorized access');

      // Emit auth event
      authEventEmitter.emitAuthEvent({
        type: 'session_expired',
        data: { message: 'Session expired. Please login again.' },
      });
    } catch (error) {
      console.error('Error triggering logout:', error);
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
      console.error('Error reading cache:', error);
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
      console.error('Error writing cache:', error);
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

      console.log(`🌐 Making ${requestConfig.method} request to: ${url}`);

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
          console.log(`💾 Request stored for offline retry: ${requestId}`);

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
          console.log(
            '📦 HTTP Client - Returning cached response for:',
            requestConfig.cacheKey
          );
          console.log('📦 HTTP Client - Cached data:', {
            success: cached.success,
            hasData: !!cached.data,
            dataType: typeof cached.data,
          });
          return cached;
        } else {
          console.log(
            '📦 HTTP Client - No cached response found for:',
            requestConfig.cacheKey
          );
        }
      }

      // Make the request with retry logic
      const response = await this.retryRequest(url, requestConfig);

      // Handle the response
      const result = await this.handleResponse<T>(response);

      // Cache successful GET responses
      if (
        requestConfig.method === 'GET' &&
        result.success &&
        requestConfig.cache &&
        requestConfig.cacheKey
      ) {
        console.log(
          '📦 HTTP Client - Caching response for:',
          requestConfig.cacheKey
        );
        console.log('📦 HTTP Client - Caching data:', {
          success: result.success,
          hasData: !!result.data,
          dataType: typeof result.data,
        });
        await this.setCachedResponse(requestConfig.cacheKey, result);
      }

      console.log(`✅ Request successful: ${endpoint}`);
      return result;
    } catch (error) {
      console.error(`❌ Request failed: ${endpoint}`, error);
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
    data?: any,
    config: Omit<RequestConfig, 'method' | 'body'> = {}
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...config, method: 'POST', body: data });
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
      } as any);

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
      console.log(`✅ File upload successful: ${file.name}`);
      return result;
    } catch (error) {
      console.error(`❌ File upload failed: ${file.name}`, error);
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
        console.log(`🗑️ Cleared ${cacheKeys.length} cached responses`);
      }

      // Clear online cache
      this.isOnlineCache = null;

      // Clear offline requests
      const offlineKeys = keys.filter(
        key =>
          key.includes('offline_request') ||
          key.includes('req_') ||
          key.includes('pending_request')
      );

      if (offlineKeys.length > 0) {
        await AsyncStorage.multiRemove(offlineKeys);
        console.log(`🗑️ Cleared ${offlineKeys.length} offline requests`);
      }

      console.log('✅ HTTP Client cache cleared');
    } catch (error) {
      console.error('❌ Error clearing HTTP Client cache:', error);
    }
  }

  // Enhanced offline status
  async getOfflineStatus() {
    const online = await this.isOnline();
    const pendingRequests = await offlineStorage.getPendingRequests();
    const storageSize = await offlineStorage.getStorageSize();

    return {
      isOnline: online,
      pendingRequests: pendingRequests.length,
      pendingCount: pendingRequests.length,
      storageSize: storageSize,
      lastChecked: this.isOnlineCache?.timestamp || null,
    };
  }

  // Enhanced offline request retry
  async retryOfflineRequests(): Promise<void> {
    try {
      const online = await this.isOnline();
      if (!online) {
        console.log('📱 Still offline, skipping retry');
        return;
      }

      const pendingRequests = await offlineStorage.getPendingRequests();
      console.log(`🔄 Retrying ${pendingRequests.length} offline requests`);

      for (const request of pendingRequests) {
        try {
          const url = `${this.baseURL}${request.endpoint}`;
          console.log(`🔄 Retrying offline request to: ${url}`);

          const response = await this.retryRequest(url, {
            method: request.method as any,
            body: request.data,
            headers: request.headers,
            timeout: API_CONFIG.timeout,
            retries: 1, // Only retry once for offline requests
          });

          const result = await this.handleResponse(response);

          if (result.success) {
            await offlineStorage.removeRequest(request.id);
            console.log(`✅ Offline request successful: ${request.endpoint}`);
          } else {
            console.log(
              `❌ Offline request failed: ${request.endpoint}`,
              result.error
            );
          }
        } catch (error) {
          console.error(
            `❌ Error retrying offline request: ${request.endpoint}`,
            error
          );
        }
      }
    } catch (error) {
      console.error('Error retrying offline requests:', error);
    }
  }
}

// Export singleton instance
const httpClient = new HttpClient();
export default httpClient;
