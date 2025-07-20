import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_ENDPOINTS, ApiResponse } from './config';
import httpClient from './httpClient';

// Type definitions for authentication
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  phone: string;
  role?: 'admin' | 'member';
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'admin' | 'member';
  status: 'active' | 'inactive';
  joinDate: string;
  createdAt: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface AuthService {
  login: (credentials: LoginCredentials) => Promise<ApiResponse<LoginResponse>>;
  register: (data: RegisterData) => Promise<ApiResponse<{ message: string }>>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<ApiResponse<{ token: string }>>;
  getProfile: () => Promise<ApiResponse<User>>;
  updateProfile: (data: Partial<User>) => Promise<ApiResponse<User>>;
  isAuthenticated: () => Promise<boolean>;
  getStoredToken: () => Promise<string | null>;
  clearStoredAuth: () => Promise<void>;
}

// Authentication service implementation
class AuthServiceImpl implements AuthService {
  private readonly TOKEN_KEY = 'auth_token';
  private readonly USER_KEY = 'auth_user';

  async login(
    credentials: LoginCredentials
  ): Promise<ApiResponse<LoginResponse>> {
    try {
      console.log('🔐 Attempting login for:', credentials.email);

      const response = await httpClient.post<LoginResponse>(
        API_ENDPOINTS.AUTH.LOGIN,
        credentials,
        {
          offlineFallback: false, // Disable offline fallback for login
          timeout: 10000, // 10 second timeout for login
        }
      );

      console.log(
        '📥 Login response:',
        response.success ? 'Success' : 'Failed'
      );
      if (!response.success) {
        console.log('❌ Login error:', response.error);
      }

      if (response.success && response.data) {
        // Store token and user data
        await this.storeAuthData(response.data.token, response.data.user);
        console.log('✅ Auth data stored successfully');
      }

      return response;
    } catch (error) {
      console.log('💥 Login exception:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Login failed',
      };
    }
  }

  async register(
    data: RegisterData
  ): Promise<ApiResponse<{ message: string }>> {
    try {
      const response = await httpClient.post<{ message: string }>(
        API_ENDPOINTS.AUTH.REGISTER,
        data,
        {
          skipAuth: true // Registration is a public endpoint
        }
      );
      return response;
    } catch (error) {

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Registration failed',
      };
    }
  }

  async logout(): Promise<void> {
    try {
      console.log('🔐 Starting logout process...');

      // Get current token for logout request
      const token = await this.getStoredToken();
      console.log('🔑 Token found:', token ? 'Yes' : 'No');

      if (token) {
        // Call logout endpoint with proper error handling
        try {
          console.log('📤 Calling logout API...');
          const response = await httpClient.post(
            API_ENDPOINTS.AUTH.LOGOUT,
            {},
            {
              timeout: 10000, // 10 second timeout for logout
              offlineFallback: false, // Disable offline fallback for logout
            }
          );

          if (response.success) {
            console.log('✅ Logout API call successful');
          } else {
            console.warn('⚠️ Logout API call failed:', response.error);
          }
        } catch (error) {
          console.warn(
            '⚠️ Logout API call failed, proceeding with local logout:',
            error
          );
        }
      } else {
        console.log('ℹ️ No token found, proceeding with local logout only');
      }
    } catch (error) {
      console.warn('❌ Error during logout process:', error);
    } finally {
      // Always clear stored auth data regardless of API call result
      console.log('🧹 Clearing local auth data...');
      await this.clearStoredAuth();
      console.log('✅ Local auth data cleared');
    }
  }

  async refreshToken(): Promise<ApiResponse<{ token: string }>> {
    try {
      const response = await httpClient.post<{ token: string }>(
        API_ENDPOINTS.AUTH.REFRESH
      );

      if (response.success && response.data) {
        // Update stored token
        await AsyncStorage.setItem(this.TOKEN_KEY, response.data.token);
      }

      return response;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Token refresh failed',
      };
    }
  }

  async getProfile(): Promise<ApiResponse<User>> {
    try {
      const response = await httpClient.get<User>(API_ENDPOINTS.USERS.PROFILE, {
        cache: true,
        cacheKey: 'user_profile',
      });

      if (response.success && response.data) {
        // Update stored user data
        await AsyncStorage.setItem(
          this.USER_KEY,
          JSON.stringify(response.data)
        );
      }

      return response;
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to fetch profile',
      };
    }
  }

  async updateProfile(data: Partial<User>): Promise<ApiResponse<User>> {
    try {
      const response = await httpClient.put<User>(
        API_ENDPOINTS.USERS.UPDATE_PROFILE,
        data
      );

      if (response.success && response.data) {
        // Update stored user data
        await AsyncStorage.setItem(
          this.USER_KEY,
          JSON.stringify(response.data)
        );
        // Clear profile cache
        await httpClient.clearCache();
      }

      return response;
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to update profile',
      };
    }
  }

  async isAuthenticated(): Promise<boolean> {
    try {
      const token = await this.getStoredToken();
      return !!token;
    } catch (error) {
      return false;
    }
  }

  async getStoredToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(this.TOKEN_KEY);
    } catch (error) {
      console.error('Error getting stored token:', error);
      return null;
    }
  }

  async clearStoredAuth(): Promise<void> {
    try {
      console.log('🧹 Clearing stored auth data...');
      await AsyncStorage.multiRemove([this.TOKEN_KEY, this.USER_KEY]);
      // Clear all API cache
      await httpClient.clearCache();
      console.log('✅ Stored auth data cleared');
    } catch (error) {
      console.error('❌ Error clearing stored auth:', error);
    }
  }

  private async storeAuthData(token: string, user: User): Promise<void> {
    try {
      await AsyncStorage.multiSet([
        [this.TOKEN_KEY, token],
        [this.USER_KEY, JSON.stringify(user)],
      ]);
    } catch (error) {
      console.error('Error storing auth data:', error);
    }
  }

  async getStoredUser(): Promise<User | null> {
    try {
      const userData = await AsyncStorage.getItem(this.USER_KEY);
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Error getting stored user:', error);
      return null;
    }
  }
}

// Create singleton instance
const authService = new AuthServiceImpl();

export default authService;
