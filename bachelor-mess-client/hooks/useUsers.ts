import {
  CreateUserData,
  UpdateUserData,
  User,
  UserFilters,
  userService,
  UserStats,
} from '@/services';
import { useCallback, useEffect, useState } from 'react';
import { Alert } from 'react-native';

export interface UseUsersReturn {
  // Data
  users: User[];
  activeUsers: User[];
  adminUsers: User[];
  currentUser: User | null;
  userStats: UserStats | null;
  loading: boolean;
  error: string | null;

  // Actions
  getAllUsers: (filters?: UserFilters) => Promise<void>;
  getUserById: (userId: string) => Promise<User | null>;
  createUser: (data: CreateUserData) => Promise<boolean>;
  updateUser: (userId: string, data: UpdateUserData) => Promise<boolean>;
  deleteUser: (userId: string) => Promise<boolean>;
  getUserStats: (
    userId: string,
    filters?: { startDate?: string; endDate?: string }
  ) => Promise<void>;
  getProfile: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<boolean>;
  searchUsers: (query: string) => Promise<void>;

  // Convenience methods
  getActiveUsers: () => Promise<void>;
  getAdminUsers: () => Promise<void>;
  getMembers: () => Promise<void>;
  getUserByEmail: (email: string) => Promise<User | null>;

  // Refresh
  refresh: () => Promise<void>;
  clearError: () => void;
}

export const useUsers = (): UseUsersReturn => {
  const [users, setUsers] = useState<User[]>([]);
  const [activeUsers, setActiveUsers] = useState<User[]>([]);
  const [adminUsers, setAdminUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const getAllUsers = useCallback(
    async (filters?: UserFilters): Promise<void> => {
      setLoading(true);
      setError(null);

      try {
        const response = await userService.getAllUsers(filters);

        if (response.success && response.data) {
          setUsers(response.data);
          // Update active and admin users
          setActiveUsers(
            response.data.filter(user => user.status === 'active')
          );
          setAdminUsers(response.data.filter(user => user.role === 'admin'));
        } else {
          setError(response.error || 'Failed to fetch users');
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to fetch users';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const getUserById = useCallback(
    async (userId: string): Promise<User | null> => {
      setLoading(true);
      setError(null);

      try {
        const response = await userService.getUserById(userId);

        if (response.success && response.data) {
          return response.data;
        } else {
          setError(response.error || 'Failed to fetch user details');
          return null;
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to fetch user details';
        setError(errorMessage);
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const createUser = useCallback(
    async (data: CreateUserData): Promise<boolean> => {
      setLoading(true);
      setError(null);

      try {
        const response = await userService.createUser(data);

        if (response.success && response.data) {
          // Add to users list
          setUsers(prev => [...prev, response.data!]);

          // Update active users if the new user is active
          if (response.data.status === 'active') {
            setActiveUsers(prev => [...prev, response.data!]);
          }

          // Update admin users if the new user is admin
          if (response.data.role === 'admin') {
            setAdminUsers(prev => [...prev, response.data!]);
          }

          Alert.alert('Success', 'User created successfully!');
          return true;
        } else {
          setError(response.error || 'Failed to create user');
          Alert.alert('Error', response.error || 'Failed to create user');
          return false;
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to create user';
        setError(errorMessage);
        Alert.alert('Error', errorMessage);
        return false;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const updateUser = useCallback(
    async (userId: string, data: UpdateUserData): Promise<boolean> => {
      setLoading(true);
      setError(null);

      try {
        const response = await userService.updateUser(userId, data);

        if (response.success && response.data) {
          // Update user in all lists
          setUsers(prev =>
            prev.map(user => (user.id === userId ? response.data! : user))
          );
          setActiveUsers(prev =>
            prev.map(user => (user.id === userId ? response.data! : user))
          );
          setAdminUsers(prev =>
            prev.map(user => (user.id === userId ? response.data! : user))
          );

          // Update current user if it's the same user
          if (currentUser?.id === userId) {
            setCurrentUser(response.data);
          }

          Alert.alert('Success', 'User updated successfully!');
          return true;
        } else {
          setError(response.error || 'Failed to update user');
          Alert.alert('Error', response.error || 'Failed to update user');
          return false;
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to update user';
        setError(errorMessage);
        Alert.alert('Error', errorMessage);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [currentUser]
  );

  const deleteUser = useCallback(async (userId: string): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const response = await userService.deleteUser(userId);

      if (response.success) {
        // Remove user from all lists
        setUsers(prev => prev.filter(user => user.id !== userId));
        setActiveUsers(prev => prev.filter(user => user.id !== userId));
        setAdminUsers(prev => prev.filter(user => user.id !== userId));

        Alert.alert('Success', 'User deleted successfully!');
        return true;
      } else {
        setError(response.error || 'Failed to delete user');
        Alert.alert('Error', response.error || 'Failed to delete user');
        return false;
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to delete user';
      setError(errorMessage);
      Alert.alert('Error', errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const getUserStats = useCallback(
    async (
      userId: string,
      filters?: { startDate?: string; endDate?: string }
    ): Promise<void> => {
      setLoading(true);
      setError(null);

      try {
        const response = await userService.getUserStats(userId, filters);

        if (response.success && response.data) {
          setUserStats(response.data);
        } else {
          setError(response.error || 'Failed to fetch user statistics');
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : 'Failed to fetch user statistics';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const getProfile = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      const response = await userService.getProfile();

      if (response.success && response.data) {
        setCurrentUser(response.data);
      } else {
        setError(response.error || 'Failed to fetch profile');
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to fetch profile';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateProfile = useCallback(
    async (data: Partial<User>): Promise<boolean> => {
      setLoading(true);
      setError(null);

      try {
        const response = await userService.updateProfile(data);

        if (response.success && response.data) {
          setCurrentUser(response.data);

          // Update in users list if it exists
          setUsers(prev =>
            prev.map(user =>
              user.id === response.data!.id ? response.data! : user
            )
          );

          Alert.alert('Success', 'Profile updated successfully!');
          return true;
        } else {
          setError(response.error || 'Failed to update profile');
          Alert.alert('Error', response.error || 'Failed to update profile');
          return false;
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to update profile';
        setError(errorMessage);
        Alert.alert('Error', errorMessage);
        return false;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const searchUsers = useCallback(async (query: string): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      const response = await userService.searchUsers(query);

      if (response.success && response.data) {
        setUsers(response.data);
      } else {
        setError(response.error || 'Failed to search users');
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to search users';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Convenience methods
  const getActiveUsers = useCallback(async (): Promise<void> => {
    await getAllUsers({ status: 'active' });
  }, [getAllUsers]);

  const getAdminUsers = useCallback(async (): Promise<void> => {
    await getAllUsers({ role: 'admin' });
  }, [getAllUsers]);

  const getMembers = useCallback(async (): Promise<void> => {
    await getAllUsers({ role: 'member' });
  }, [getAllUsers]);

  const getUserByEmail = useCallback(
    async (email: string): Promise<User | null> => {
      try {
        const response = await userService.getUserByEmail(email);

        if (response.success && response.data) {
          return response.data;
        } else {
          setError(response.error || 'Failed to fetch user by email');
          return null;
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to fetch user by email';
        setError(errorMessage);
        return null;
      }
    },
    []
  );

  const refresh = useCallback(async (): Promise<void> => {
    await Promise.all([getAllUsers(), getProfile()]);
  }, [getAllUsers, getProfile]);

  // Initial load
  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    users,
    activeUsers,
    adminUsers,
    currentUser,
    userStats,
    loading,
    error,
    getAllUsers,
    getUserById,
    createUser,
    updateUser,
    deleteUser,
    getUserStats,
    getProfile,
    updateProfile,
    searchUsers,
    getActiveUsers,
    getAdminUsers,
    getMembers,
    getUserByEmail,
    refresh,
    clearError,
  };
};
