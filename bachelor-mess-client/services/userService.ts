import { API_ENDPOINTS, ApiResponse } from './config';
import httpClient from './httpClient';

// Type definitions for user management
export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'admin' | 'member' | 'super_admin';
  status: 'active' | 'inactive';
  joinDate: string;
  createdAt: string;
}

export interface CreateUserData {
  name: string;
  email: string;
  password: string;
  phone?: string;
  role?: 'admin' | 'member' | 'super_admin';
}

export interface UpdateUserData {
  name?: string;
  email?: string;
  phone?: string;
  role?: 'admin' | 'member' | 'super_admin';
  status?: 'active' | 'inactive';
}

export interface UserFilters {
  status?: 'active' | 'inactive';
  role?: 'admin' | 'member' | 'super_admin';
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
  resetUserPassword: (
    userId: string,
    newPassword: string
  ) => Promise<ApiResponse<{ id: string; email: string }>>;
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
      // Use ALL endpoint instead of PROFILE endpoint to get all users
      const endpoint = `${API_ENDPOINTS.USERS.ALL}${queryParams}`;

      const response = await httpClient.get<{
        users: User[];
        pagination?: any;
      }>(endpoint, {
        cache: true,
        cacheKey: `all_users_${JSON.stringify(filters)}`,
      });

      // Backend returns { users, pagination }, extract users array
      if (response.success && response.data) {
        type UsersResponse = { users?: User[] } | User[];
        const data = response.data as UsersResponse;
        let users: User[] = [];
        if (Array.isArray(data)) {
          users = data;
        } else if (data && 'users' in data && Array.isArray(data.users)) {
          users = data.users;
        }

        // Transform _id to id for each user (MongoDB returns _id)
        type RawUser = User & { _id?: string };
        const transformedUsers = users.map((user: RawUser) => ({
          ...user,
          id: user._id || user.id,
        }));

        return { ...response, data: transformedUsers };
      }

      // 403 = member calling admin-only endpoint; return empty list, no error
      if (!response.success) {
        const errMsg = response.error || '';
        if (
          errMsg.includes('Access denied') ||
          errMsg.includes('Insufficient permissions')
        ) {
          return { success: true, data: [] };
        }
        if (process.env.NODE_ENV !== 'production') {
          console.warn('UserService - getAllUsers failed:', response.error);
        }
      }

      return response as unknown as ApiResponse<User[]>;
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

      // Transform _id to id if needed
      if (response.success && response.data) {
        type RawUser = User & { _id?: string };
        const user = response.data as RawUser;
        return {
          ...response,
          data: { ...user, id: user._id || user.id },
        };
      }

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
      // Import offlineStorage and sqliteDatabase dynamically to avoid circular dependencies
      const { offlineStorage } = await import('./offlineStorage');
      const sqliteDatabase = (await import('./sqliteDatabase')).default;

      // Generate unique ID for offline storage
      const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const userDataWithId = { ...data, id: userId };

      // Always save to SQLite first (offline-first approach)
      try {
        await sqliteDatabase.saveUserData(userDataWithId);
      } catch (sqliteError) {
        // Continue even if SQLite save fails - API might still work
      }

      // Check if online before attempting API call
      const isOnline = offlineStorage.isNetworkAvailable();

      // Try to submit to API immediately if online
      if (isOnline) {
        try {
          const response = await httpClient.post<User>(
            API_ENDPOINTS.USERS.CREATE,
            data
          );

          if (response.success && response.data) {
            // Successfully created - clear cache and remove from SQLite
            await this.clearUserCache();
            type RawUser = User & { _id?: string };
            const user = response.data as RawUser;
            const transformedUser = {
              ...user,
              id: user._id || user.id,
            };

            // Remove from SQLite since it's now synced
            try {
              await sqliteDatabase.deleteData('user_data', userId);
            } catch (deleteError) {
              // Non-critical - continue
            }

            return { ...response, data: transformedUser };
          } else {
            // API returned error - add to sync queue for retry
            try {
              await offlineStorage.addToSyncQueue({
                action: 'CREATE',
                endpoint: API_ENDPOINTS.USERS.CREATE,
                data: userDataWithId,
              });
            } catch (queueError) {
              // Continue even if queue fails
            }

            // Return success since data is saved locally
            return {
              success: true,
              data: userDataWithId as unknown as User,
            };
          }
        } catch (apiError) {
          // Network error or API failure - add to sync queue
          try {
            await offlineStorage.addToSyncQueue({
              action: 'CREATE',
              endpoint: API_ENDPOINTS.USERS.CREATE,
              data: userDataWithId,
            });
          } catch (queueError) {
            // Continue even if queue fails
          }
          return { success: true, data: userDataWithId as unknown as User };
        }
      } else {
        // Offline - add to sync queue
        try {
          await offlineStorage.addToSyncQueue({
            action: 'CREATE',
            endpoint: API_ENDPOINTS.USERS.CREATE,
            data: userDataWithId,
          });
        } catch (queueError) {
          // Continue even if queue fails
        }
        return { success: true, data: userDataWithId as unknown as User };
      }
    } catch (error) {
      console.error('❌ UserService - createUser error:', error);
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

        // Transform _id to id if needed
        if (response.data) {
          type RawUser = User & { _id?: string };
          const user = response.data as RawUser;
          return {
            ...response,
            data: {
              ...user,
              id: user._id || user.id,
            },
          };
        }
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

      // Clear cache after deletion (success or not found - both mean user is gone)
      if (
        response.success ||
        response.error?.includes('not found') ||
        response.error?.includes('404')
      ) {
        await this.clearUserCache();
      }

      // If user not found, treat it as success (user already deleted)
      if (
        response.error?.includes('not found') ||
        response.error?.includes('404')
      ) {
        return {
          success: true,
          data: { message: 'User not found (may have been already deleted)' },
        };
      }

      return response;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to delete user';

      // If it's a "not found" error, clear cache and return success
      if (errorMessage.includes('not found') || errorMessage.includes('404')) {
        await this.clearUserCache();
        return {
          success: true,
          data: { message: 'User not found (may have been already deleted)' },
        };
      }

      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  async resetUserPassword(
    userId: string,
    newPassword: string
  ): Promise<ApiResponse<{ id: string; email: string }>> {
    try {
      const response = await httpClient.post<{ id: string; email: string }>(
        API_ENDPOINTS.USERS.RESET_PASSWORD(userId),
        { newPassword }
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

  async clearUserCache(): Promise<void> {
    try {
      await httpClient.clearCache();
    } catch (error) {
      console.error('UserService - Error clearing cache:', error);
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
