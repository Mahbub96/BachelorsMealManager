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

  // Check if online by testing API connectivity
  private async isOnline(): Promise<boolean> {
    try {
      // Test API connectivity by making a simple health check
      const healthUrl = `${this.baseURL.replace('/api', '')}/health`;
      console.log('🔍 Checking API connectivity at:', healthUrl);

      const response = await fetch(healthUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(5000), // 5 second timeout
      });

      const isOnline = response.ok;
      console.log(
        '📡 API connectivity check result:',
        isOnline,
        'Status:',
        response.status
      );

      if (!isOnline) {
        const responseText = await response.text();
        console.log('📄 Response text:', responseText);
      }

      return isOnline;
    } catch (error) {
      console.log('❌ API connectivity check failed:', error);
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

  // Handle response errors
  private handleResponseError(error: any): ApiResponse<any> {
    if (error.response) {
      const { status, data } = error.response;

      // Handle specific HTTP status codes
      switch (status) {
        case 401:
          // Unauthorized - clear auth data and redirect to login
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
        case 422:
          return {
            success: false,
            error:
              data?.message || 'Validation error. Please check your input.',
          };
        case 500:
          return {
            success: false,
            error: 'Server error. Please try again later.',
          };
        default:
          return {
            success: false,
            error: data?.message || `Request failed with status ${status}`,
          };
      }
    } else if (error.request) {
      // Network error
      return {
        success: false,
        error: 'Network error. Please check your connection.',
      };
    } else {
      // Other error
      return {
        success: false,
        error: error.message || 'An unexpected error occurred.',
      };
    }
  }

  // Handle authentication errors
  private async handleAuthError(): Promise<void> {
    try {
      // Clear auth data
      await AsyncStorage.multiRemove(['auth_token', 'auth_user']);
      // Clear cache
      this.clearCache();
      console.log('Auth data cleared due to 401 error');
    } catch (error) {
      console.error('Error clearing auth data:', error);
    }
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
    try {
      // Check cache first if enabled
      if (config.cache && config.cacheKey) {
        const cached = await this.getCachedResponse<T>(config.cacheKey);
        if (cached) {
          return cached;
        }
      }

      // Check if online
      const isOnline = await this.isOnline();
      if (!isOnline) {
        if (config.offlineFallback) {
          // Store request for later retry
          await this.storeForOfflineRetry(endpoint, config);
          return {
            success: false,
            error:
              'You are offline. Request will be retried when connection is restored.',
          };
        }
        return {
          success: false,
          error: 'No internet connection. Please check your network settings.',
        };
      }

      // Create request configuration
      const requestConfig = await this.createRequestConfig(endpoint, config);

      // Make the request
      const response = await this.retryRequest(
        `${this.baseURL}${endpoint}`,
        requestConfig
      );

      // Handle response
      const result = await this.handleResponse<T>(response);

      // Cache successful responses
      if (config.cache && config.cacheKey && result.success) {
        await this.setCachedResponse(config.cacheKey, result);
      }

      return result;
    } catch (error) {
      console.error('Request error:', error);

      // Use improved error handling
      return this.handleResponseError(error);
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
