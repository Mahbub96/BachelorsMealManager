import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG, ApiResponse, HTTP_STATUS } from './config';
import offlineStorage from './offlineStorage';

// Request configuration interface
interface RequestConfig {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: any;
  timeout?: number;
  retries?: number;
  cache?: boolean;
  cacheKey?: string;
  offlineFallback?: boolean; // New option for offline fallback
}

// HTTP Client Class
class HttpClient {
  private baseURL: string;
  private defaultHeaders: Record<string, string>;
  private requestInterceptors: ((config: RequestConfig) => RequestConfig)[] =
    [];
  private responseInterceptors: ((response: Response) => Response)[] = [];

  constructor() {
    this.baseURL = API_CONFIG.BASE_URL;
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
    const token = await this.getAuthToken();

    const defaultConfig: RequestConfig = {
      method: 'GET',
      headers: {
        ...this.defaultHeaders,
        ...(token && { Authorization: `Bearer ${token}` }),
        ...config.headers,
      },
      timeout: API_CONFIG.TIMEOUT,
      retries: API_CONFIG.MAX_RETRIES,
      offlineFallback: true, // Enable offline fallback by default
    };

    return this.applyRequestInterceptors({
      ...defaultConfig,
      ...config,
    });
  }

  // Check if we're online
  private async isOnline(): Promise<boolean> {
    return await offlineStorage.isOnline();
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
      maxRetries: 3, // Default max retries
    };

    return await offlineStorage.storeRequest(offlineRequest);
  }

  // Retry logic with exponential backoff
  private async retryRequest(
    url: string,
    config: RequestConfig,
    retryCount: number = 0
  ): Promise<Response> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(
        () => controller.abort(),
        config.timeout || API_CONFIG.TIMEOUT
      );

      const response = await fetch(url, {
        method: config.method,
        headers: config.headers,
        body: config.body ? JSON.stringify(config.body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      return this.applyResponseInterceptors(response);
    } catch (error) {
      if (retryCount < (config.retries || API_CONFIG.MAX_RETRIES)) {
        const delay = API_CONFIG.RETRY_DELAY * Math.pow(2, retryCount);
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.retryRequest(url, config, retryCount + 1);
      }
      throw error;
    }
  }

  // Handle API response
  private async handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
    const contentType = response.headers.get('content-type');
    const isJson = contentType?.includes('application/json');

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;

      if (isJson) {
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch {
          // Fallback to default error message
        }
      }

      // Handle specific status codes
      switch (response.status) {
        case HTTP_STATUS.UNAUTHORIZED:
          // Clear auth token and redirect to login
          await AsyncStorage.removeItem('auth_token');
          throw new Error('Session expired. Please login again.');
        case HTTP_STATUS.FORBIDDEN:
          throw new Error('Access denied. Insufficient permissions.');
        case HTTP_STATUS.NOT_FOUND:
          throw new Error('Resource not found.');
        case HTTP_STATUS.INTERNAL_SERVER_ERROR:
          throw new Error('Server error. Please try again later.');
        default:
          throw new Error(errorMessage);
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

  // Cache management
  private async getCachedResponse<T>(
    cacheKey: string
  ): Promise<ApiResponse<T> | null> {
    try {
      const cached = await AsyncStorage.getItem(`cache_${cacheKey}`);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < API_CONFIG.CACHE_DURATION) {
          return data;
        }
      }
    } catch (error) {
      console.error('Cache read error:', error);
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
      console.error('Cache write error:', error);
    }
  }

  // Main request method with offline support
  async request<T>(
    endpoint: string,
    config: RequestConfig = {}
  ): Promise<ApiResponse<T>> {
    const requestConfig = await this.createRequestConfig(endpoint, config);
    const url = `${this.baseURL}${endpoint}`;

    // Check if we should use cache for GET requests
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

    try {
      // Check if we're online
      const online = await this.isOnline();

      if (
        !online &&
        requestConfig.offlineFallback &&
        requestConfig.method !== 'GET'
      ) {
        // Store request for offline retry
        const requestId = await this.storeForOfflineRetry(
          endpoint,
          requestConfig
        );

        return {
          success: false,
          error:
            "You're offline. Your request will be saved and synced when you're back online.",
          data: { offlineRequestId: requestId } as any,
        };
      }

      const response = await this.retryRequest(url, requestConfig);
      const result = await this.handleResponse<T>(response);

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
      // If offline fallback is enabled and it's not a GET request, store for retry
      if (requestConfig.offlineFallback && requestConfig.method !== 'GET') {
        try {
          const requestId = await this.storeForOfflineRetry(
            endpoint,
            requestConfig
          );
          return {
            success: false,
            error:
              "Network error. Your request will be saved and synced when you're back online.",
            data: { offlineRequestId: requestId } as any,
          };
        } catch (storageError) {
          console.error('Error storing offline request:', storageError);
        }
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  // GET request
  async get<T>(
    endpoint: string,
    config: Omit<RequestConfig, 'method'> = {}
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...config, method: 'GET' });
  }

  // POST request
  async post<T>(
    endpoint: string,
    data?: any,
    config: Omit<RequestConfig, 'method' | 'body'> = {}
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...config,
      method: 'POST',
      body: data,
    });
  }

  // PUT request
  async put<T>(
    endpoint: string,
    data?: any,
    config: Omit<RequestConfig, 'method' | 'body'> = {}
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...config,
      method: 'PUT',
      body: data,
    });
  }

  // DELETE request
  async delete<T>(
    endpoint: string,
    config: Omit<RequestConfig, 'method'> = {}
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...config, method: 'DELETE' });
  }

  // PATCH request
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

  // File upload with offline support
  async uploadFile<T>(
    endpoint: string,
    file: { uri: string; type: string; name: string },
    additionalData?: Record<string, any>,
    config: Omit<RequestConfig, 'method' | 'body'> = {}
  ): Promise<ApiResponse<T>> {
    const requestConfig = await this.createRequestConfig(endpoint, config);
    const url = `${this.baseURL}${endpoint}`;

    try {
      // Check if we're online
      const online = await this.isOnline();

      if (!online && requestConfig.offlineFallback) {
        // Store file upload for offline retry
        const requestId = await this.storeForOfflineRetry(endpoint, {
          ...requestConfig,
          method: 'POST',
          body: { file, ...additionalData },
        });

        return {
          success: false,
          error:
            "You're offline. Your file upload will be saved and synced when you're back online.",
          data: { offlineRequestId: requestId } as any,
        };
      }

      const formData = new FormData();
      formData.append('file', {
        uri: file.uri,
        type: file.type,
        name: file.name,
      } as any);

      if (additionalData) {
        Object.keys(additionalData).forEach(key => {
          formData.append(key, additionalData[key]);
        });
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          ...requestConfig.headers,
          'Content-Type': 'multipart/form-data',
        },
        body: formData,
      });

      return await this.handleResponse<T>(response);
    } catch (error) {
      // If offline fallback is enabled, store for retry
      if (requestConfig.offlineFallback) {
        try {
          const requestId = await this.storeForOfflineRetry(endpoint, {
            ...requestConfig,
            method: 'POST',
            body: { file, ...additionalData },
          });
          return {
            success: false,
            error:
              "Network error. Your file upload will be saved and synced when you're back online.",
            data: { offlineRequestId: requestId } as any,
          };
        } catch (storageError) {
          console.error('Error storing offline file upload:', storageError);
        }
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : 'File upload failed',
      };
    }
  }

  // Clear cache
  async clearCache(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith('cache_'));
      await AsyncStorage.multiRemove(cacheKeys);
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  }

  // Get offline status
  async getOfflineStatus() {
    return {
      isOnline: await this.isOnline(),
      pendingCount: await offlineStorage.getPendingCount(),
      storageSize: await offlineStorage.getStorageSize(),
    };
  }

  // Manually retry offline requests
  async retryOfflineRequests(): Promise<void> {
    await offlineStorage.retryPendingRequests();
  }
}

// Create singleton instance
const httpClient = new HttpClient();

export default httpClient;
