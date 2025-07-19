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
      const response = await httpClient.post<LoginResponse>(
        API_ENDPOINTS.AUTH.LOGIN,
        credentials
      );

      if (response.success && response.data) {
        // Store token and user data
        await this.storeAuthData(response.data.token, response.data.user);
      }

      return response;
    } catch (error) {
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
        data
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
      // Call logout endpoint if available
      await httpClient.post(API_ENDPOINTS.AUTH.LOGOUT);
    } catch (error) {
      // Continue with local logout even if API call fails
      console.warn('Logout API call failed, proceeding with local logout');
    } finally {
      // Clear stored auth data
      await this.clearStoredAuth();
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
      await AsyncStorage.multiRemove([this.TOKEN_KEY, this.USER_KEY]);
      // Clear all API cache
      await httpClient.clearCache();
    } catch (error) {
      console.error('Error clearing stored auth:', error);
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
