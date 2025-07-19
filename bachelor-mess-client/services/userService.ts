import { API_ENDPOINTS, ApiResponse } from './config';
import httpClient from './httpClient';

// Type definitions for user management
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

export interface CreateUserData {
  name: string;
  email: string;
  password: string;
  phone?: string;
  role?: 'admin' | 'member';
}

export interface UpdateUserData {
  name?: string;
  email?: string;
  phone?: string;
  role?: 'admin' | 'member';
  status?: 'active' | 'inactive';
}

export interface UserFilters {
  status?: 'active' | 'inactive';
  role?: 'admin' | 'member';
  search?: string;
  limit?: number;
  page?: number;
}

export interface UserStats {
  mealStats: {
    totalMeals: number;
    totalBreakfast: number;
    totalLunch: number;
    totalDinner: number;
  };
  bazarStats: {
    totalAmount: number;
    totalEntries: number;
    averageAmount: number;
  };
}

export interface UserService {
  getAllUsers: (filters?: UserFilters) => Promise<ApiResponse<User[]>>;
  getUserById: (userId: string) => Promise<ApiResponse<User>>;
  createUser: (data: CreateUserData) => Promise<ApiResponse<User>>;
  updateUser: (
    userId: string,
    data: UpdateUserData
  ) => Promise<ApiResponse<User>>;
  deleteUser: (userId: string) => Promise<ApiResponse<{ message: string }>>;
  getUserStats: (
    userId: string,
    filters?: { startDate?: string; endDate?: string }
  ) => Promise<ApiResponse<UserStats>>;
  getProfile: () => Promise<ApiResponse<User>>;
  updateProfile: (data: Partial<User>) => Promise<ApiResponse<User>>;
  searchUsers: (query: string) => Promise<ApiResponse<User[]>>;
  getActiveUsers: () => Promise<ApiResponse<User[]>>;
  getAdminUsers: () => Promise<ApiResponse<User[]>>;
}

// User service implementation
class UserServiceImpl implements UserService {
  async getAllUsers(filters: UserFilters = {}): Promise<ApiResponse<User[]>> {
    try {
      const queryParams = this.buildQueryParams(filters);
      const endpoint = `${API_ENDPOINTS.USERS.ALL}${queryParams}`;

      const response = await httpClient.get<User[]>(endpoint, {
        cache: true,
        cacheKey: `all_users_${JSON.stringify(filters)}`,
      });

      return response;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch users',
      };
    }
  }

  async getUserById(userId: string): Promise<ApiResponse<User>> {
    try {
      const response = await httpClient.get<User>(
        API_ENDPOINTS.USERS.BY_ID(userId),
        {
          cache: true,
          cacheKey: `user_${userId}`,
        }
      );

      return response;
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to fetch user details',
      };
    }
  }

  async createUser(data: CreateUserData): Promise<ApiResponse<User>> {
    try {
      const response = await httpClient.post<User>(
        API_ENDPOINTS.USERS.CREATE,
        data
      );

      // Clear cache after successful creation
      if (response.success) {
        await this.clearUserCache();
      }

      return response;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create user',
      };
    }
  }

  async updateUser(
    userId: string,
    data: UpdateUserData
  ): Promise<ApiResponse<User>> {
    try {
      const response = await httpClient.put<User>(
        API_ENDPOINTS.USERS.UPDATE(userId),
        data
      );

      // Clear cache after successful update
      if (response.success) {
        await this.clearUserCache();
      }

      return response;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update user',
      };
    }
  }

  async deleteUser(userId: string): Promise<ApiResponse<{ message: string }>> {
    try {
      const response = await httpClient.delete<{ message: string }>(
        API_ENDPOINTS.USERS.DELETE(userId)
      );

      // Clear cache after successful deletion
      if (response.success) {
        await this.clearUserCache();
      }

      return response;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete user',
      };
    }
  }

  async getUserStats(
    userId: string,
    filters: { startDate?: string; endDate?: string } = {}
  ): Promise<ApiResponse<UserStats>> {
    try {
      const queryParams = this.buildStatsQueryParams(filters);
      const endpoint = `${API_ENDPOINTS.USERS.STATS(userId)}${queryParams}`;

      const response = await httpClient.get<UserStats>(endpoint, {
        cache: true,
        cacheKey: `user_stats_${userId}_${JSON.stringify(filters)}`,
      });

      return response;
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to fetch user statistics',
      };
    }
  }

  async getProfile(): Promise<ApiResponse<User>> {
    try {
      const response = await httpClient.get<User>(API_ENDPOINTS.USERS.PROFILE, {
        cache: true,
        cacheKey: 'user_profile',
      });

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

      // Clear cache after successful update
      if (response.success) {
        await this.clearUserCache();
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

  async searchUsers(query: string): Promise<ApiResponse<User[]>> {
    try {
      const response = await httpClient.get<User[]>(
        `${API_ENDPOINTS.USERS.ALL}?search=${encodeURIComponent(query)}`,
        {
          cache: true,
          cacheKey: `user_search_${query}`,
        }
      );

      return response;
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to search users',
      };
    }
  }

  async getActiveUsers(): Promise<ApiResponse<User[]>> {
    try {
      const response = await httpClient.get<User[]>(
        `${API_ENDPOINTS.USERS.ALL}?status=active`,
        {
          cache: true,
          cacheKey: 'active_users',
        }
      );

      return response;
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to fetch active users',
      };
    }
  }

  async getAdminUsers(): Promise<ApiResponse<User[]>> {
    try {
      const response = await httpClient.get<User[]>(
        `${API_ENDPOINTS.USERS.ALL}?role=admin`,
        {
          cache: true,
          cacheKey: 'admin_users',
        }
      );

      return response;
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to fetch admin users',
      };
    }
  }

  private buildQueryParams(filters: UserFilters): string {
    const params = new URLSearchParams();

    if (filters.status) params.append('status', filters.status);
    if (filters.role) params.append('role', filters.role);
    if (filters.search) params.append('search', filters.search);
    if (filters.limit) params.append('limit', filters.limit.toString());
    if (filters.page) params.append('page', filters.page.toString());

    const queryString = params.toString();
    return queryString ? `?${queryString}` : '';
  }

  private buildStatsQueryParams(filters: {
    startDate?: string;
    endDate?: string;
  }): string {
    const params = new URLSearchParams();

    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);

    const queryString = params.toString();
    return queryString ? `?${queryString}` : '';
  }

  private async clearUserCache(): Promise<void> {
    try {
      // Clear all user-related cache
      await httpClient.clearCache();
      console.log('User cache cleared');
    } catch (error) {
      console.error('Error clearing user cache:', error);
    }
  }

  // Helper methods for common operations
  async getMembers(): Promise<ApiResponse<User[]>> {
    return this.getAllUsers({ role: 'member' });
  }

  async getAdmins(): Promise<ApiResponse<User[]>> {
    return this.getAllUsers({ role: 'admin' });
  }

  async getOnlineUsers(): Promise<ApiResponse<User[]>> {
    return this.getAllUsers({ status: 'active' });
  }

  async getUserByEmail(email: string): Promise<ApiResponse<User>> {
    try {
      const response = await this.searchUsers(email);
      if (response.success && response.data) {
        const user = response.data.find(u => u.email === email);
        if (user) {
          return { success: true, data: user };
        }
      }
      return { success: false, error: 'User not found' };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to find user by email',
      };
    }
  }
}

// Create singleton instance
const userService = new UserServiceImpl();

export default userService;
