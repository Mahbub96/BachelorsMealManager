import { authService, User } from '@/services';
import { useCallback, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { useBazar, UseBazarReturn } from './useBazar';
import { useDashboard, UseDashboardReturn } from './useDashboard';
import { useMeals, UseMealsReturn } from './useMeals';
import { useOffline, UseOfflineReturn } from './useOffline';
import { useUsers, UseUsersReturn } from './useUsers';

export interface UseApiIntegrationReturn {
  // Individual hooks
  meals: UseMealsReturn;
  bazar: UseBazarReturn;
  users: UseUsersReturn;
  dashboard: UseDashboardReturn;
  offline: UseOfflineReturn;

  // Authentication
  currentUser: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (
    name: string,
    email: string,
    password: string,
    role?: 'admin' | 'member'
  ) => Promise<boolean>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<boolean>;

  // Global state
  loading: boolean;
  error: string | null;

  // Actions
  refreshAll: () => Promise<void>;
  clearAllErrors: () => void;
  healthCheck: () => Promise<boolean>;
}

export const useApiIntegration = (): UseApiIntegrationReturn => {
  // Individual hooks
  const meals = useMeals();
  const bazar = useBazar();
  const users = useUsers();
  const dashboard = useDashboard();
  const offline = useOffline();

  // Authentication state
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check authentication status on mount
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = useCallback(async () => {
    try {
      const authenticated = await authService.isAuthenticated();
      setIsAuthenticated(authenticated);

      if (authenticated) {
        const storedUser = await authService.getStoredUser();
        setCurrentUser(storedUser);
      }
    } catch (err) {
      console.error('Error checking auth status:', err);
    }
  }, []);

  const login = useCallback(
    async (email: string, password: string): Promise<boolean> => {
      setLoading(true);
      setError(null);

      try {
        const response = await authService.login({ email, password });

        if (response.success && response.data) {
          setCurrentUser(response.data.user);
          setIsAuthenticated(true);

          // Refresh all data after successful login
          await refreshAll();

          Alert.alert('Success', 'Login successful!');
          return true;
        } else {
          setError(response.error || 'Login failed');
          Alert.alert('Error', response.error || 'Login failed');
          return false;
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Login failed';
        setError(errorMessage);
        Alert.alert('Error', errorMessage);
        return false;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const register = useCallback(
    async (
      name: string,
      email: string,
      password: string,
      role: 'admin' | 'member' = 'member'
    ): Promise<boolean> => {
      setLoading(true);
      setError(null);

      try {
        const response = await authService.register({
          name,
          email,
          password,
          role,
        });

        if (response.success) {
          Alert.alert('Success', 'Registration successful! Please login.');
          return true;
        } else {
          setError(response.error || 'Registration failed');
          Alert.alert('Error', response.error || 'Registration failed');
          return false;
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Registration failed';
        setError(errorMessage);
        Alert.alert('Error', errorMessage);
        return false;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const logout = useCallback(async (): Promise<void> => {
    setLoading(true);

    try {
      await authService.logout();
      setCurrentUser(null);
      setIsAuthenticated(false);

      // Clear all data
      meals.clearError();
      bazar.clearError();
      users.clearError();
      dashboard.clearError();
      offline.clearError();
      setError(null);

      Alert.alert('Success', 'Logged out successfully!');
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setLoading(false);
    }
  }, [meals, bazar, users, dashboard, offline]);

  const updateProfile = useCallback(
    async (data: Partial<User>): Promise<boolean> => {
      setLoading(true);
      setError(null);

      try {
        const response = await authService.updateProfile(data);

        if (response.success && response.data) {
          setCurrentUser(response.data);
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

  const refreshAll = useCallback(async (): Promise<void> => {
    setLoading(true);

    try {
      await Promise.all([
        meals.refresh(),
        bazar.refresh(),
        users.refresh(),
        dashboard.refresh(),
        offline.refresh(),
      ]);
    } catch (err) {
      console.error('Error refreshing all data:', err);
    } finally {
      setLoading(false);
    }
  }, [meals, bazar, users, dashboard, offline]);

  const clearAllErrors = useCallback(() => {
    setError(null);
    meals.clearError();
    bazar.clearError();
    users.clearError();
    dashboard.clearError();
    offline.clearError();
  }, [meals, bazar, users, dashboard, offline]);

  const healthCheck = useCallback(async (): Promise<boolean> => {
    try {
      return await dashboard.getHealth();
    } catch (err) {
      console.error('Health check failed:', err);
      return false;
    }
  }, [dashboard]);

  return {
    meals,
    bazar,
    users,
    dashboard,
    offline,
    currentUser,
    isAuthenticated,
    login,
    register,
    logout,
    updateProfile,
    loading,
    error,
    refreshAll,
    clearAllErrors,
    healthCheck,
  };
};
