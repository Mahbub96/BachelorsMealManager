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
  role: 'super_admin' | 'admin' | 'member';
  status: 'active' | 'inactive';
  joinDate: string;
  lastLogin?: string;
  isEmailVerified?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LoginResponse {
  token: string;
  refreshToken: string;
  user: User;
}

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
}

export interface ForgotPasswordData {
  email: string;
}

export interface ResetPasswordData {
  token: string;
  newPassword: string;
}

export interface RefreshTokenData {
  refreshToken: string;
}

export interface AuthService {
  login: (credentials: LoginCredentials) => Promise<ApiResponse<LoginResponse>>;
  register: (data: RegisterData) => Promise<ApiResponse<{ message: string }>>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<ApiResponse<{ token: string }>>;
  getProfile: () => Promise<ApiResponse<User>>;
  updateProfile: (data: Partial<User>) => Promise<ApiResponse<User>>;
  changePassword: (
    data: ChangePasswordData
  ) => Promise<ApiResponse<{ message: string }>>;
  forgotPassword: (
    data: ForgotPasswordData
  ) => Promise<ApiResponse<{ message: string }>>;
  resetPassword: (
    data: ResetPasswordData
  ) => Promise<ApiResponse<{ message: string }>>;
  verifyToken: () => Promise<ApiResponse<{ valid: boolean }>>;
  isAuthenticated: () => Promise<boolean>;
  getStoredToken: () => Promise<string | null>;
  getStoredRefreshToken: () => Promise<string | null>;
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

      // Handle the new API response structure where data is nested under response.data
      const loginData = response.data as LoginResponse;

      if (response.success && loginData && loginData.token && loginData.user) {
        // Store token, refresh token and user data
        await this.storeAuthData(
          loginData.token,
          loginData.refreshToken,
          loginData.user
        );
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
          skipAuth: true, // Registration is a public endpoint
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
      const storedRefreshToken = await this.getStoredRefreshToken();

      if (!storedRefreshToken) {
        return {
          success: false,
          error: 'No refresh token available',
        };
      }

      const response = await httpClient.post<{
        token: string;
        refreshToken: string;
      }>(API_ENDPOINTS.AUTH.REFRESH, { refreshToken: storedRefreshToken });

      // Handle the new API response structure where data is nested under response.data
      const tokenData = response.data as {
        token: string;
        refreshToken: string;
      };

      if (response.success && tokenData && tokenData.token) {
        // Update stored token and refresh token
        await AsyncStorage.multiSet([
          [this.TOKEN_KEY, tokenData.token],
          ['refresh_token', tokenData.refreshToken],
        ]);
      }

      return {
        ...response,
        data: { token: tokenData?.token || '' },
      };
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

      // Handle the new API response structure where data is nested under response.data
      const userData = response.data as User;

      if (response.success && userData) {
        // Update stored user data
        await AsyncStorage.setItem(this.USER_KEY, JSON.stringify(userData));
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

      // Handle the new API response structure where data is nested under response.data
      const userData = response.data as User;

      if (response.success && userData) {
        // Update stored user data
        await AsyncStorage.setItem(this.USER_KEY, JSON.stringify(userData));
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

  async changePassword(
    data: ChangePasswordData
  ): Promise<ApiResponse<{ message: string }>> {
    try {
      const response = await httpClient.put<{ message: string }>(
        API_ENDPOINTS.AUTH.CHANGE_PASSWORD,
        data
      );
      return response;
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to change password',
      };
    }
  }

  async forgotPassword(
    data: ForgotPasswordData
  ): Promise<ApiResponse<{ message: string }>> {
    try {
      const response = await httpClient.post<{ message: string }>(
        API_ENDPOINTS.AUTH.FORGOT_PASSWORD,
        data
      );
      return response;
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to send forgot password email',
      };
    }
  }

  async resetPassword(
    data: ResetPasswordData
  ): Promise<ApiResponse<{ message: string }>> {
    try {
      const response = await httpClient.post<{ message: string }>(
        API_ENDPOINTS.AUTH.RESET_PASSWORD,
        data
      );
      return response;
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to reset password',
      };
    }
  }

  async verifyToken(): Promise<ApiResponse<{ valid: boolean }>> {
    try {
      const response = await httpClient.get<{ valid: boolean }>(
        API_ENDPOINTS.AUTH.VERIFY_TOKEN
      );
      return response;
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to verify token',
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

  async getStoredRefreshToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem('refresh_token'); // Assuming refresh token is stored under 'refresh_token' key
    } catch (error) {
      console.error('Error getting stored refresh token:', error);
      return null;
    }
  }

  async clearStoredAuth(): Promise<void> {
    try {
      console.log('🧹 Clearing stored auth data...');
      await AsyncStorage.multiRemove([
        this.TOKEN_KEY,
        this.USER_KEY,
        'refresh_token',
      ]);
      // Clear all API cache
      await httpClient.clearCache();
      console.log('✅ Stored auth data cleared');
    } catch (error) {
      console.error('❌ Error clearing stored auth:', error);
    }
  }

  private async storeAuthData(
    token: string,
    refreshToken: string,
    user: User
  ): Promise<void> {
    try {
      await AsyncStorage.multiSet([
        [this.TOKEN_KEY, token],
        [this.USER_KEY, JSON.stringify(user)],
        ['refresh_token', refreshToken], // Store refresh token
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
