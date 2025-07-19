import { useCallback, useEffect, useState } from 'react';
import { useAuth as useAuthContext } from '../context/AuthContext';
import { authService, LoginCredentials, RegisterData } from '../services';
import type { User } from '../services/userService';

interface UseAuthReturn {
  // State
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  login: (credentials: LoginCredentials) => Promise<boolean>;
  register: (data: RegisterData) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  clearError: () => void;
}

export const useAuth = (): UseAuthReturn => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user, setAuth, logout: logoutContext } = useAuthContext();

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const login = useCallback(
    async (credentials: LoginCredentials): Promise<boolean> => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await authService.login(credentials);

        if (response.success && response.data) {
          setAuth({
            user: response.data.user,
            token: response.data.token,
            role: response.data.user.role,
          });
          return true;
        } else {
          setError(response.error || 'Login failed');
          return false;
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Login failed';
        setError(errorMessage);
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [setAuth]
  );

  const register = useCallback(async (data: RegisterData): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await authService.register(data);

      if (response.success) {
        return true;
      } else {
        setError(response.error || 'Registration failed');
        return false;
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Registration failed';
      setError(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      await authService.logout();
      logoutContext();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Logout failed';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [logoutContext]);

  const refreshProfile = useCallback(async (): Promise<void> => {
    if (!user) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await authService.getProfile();

      if (response.success && response.data) {
        setAuth({
          user: response.data,
          token: (await authService.getStoredToken()) || '',
          role: response.data.role,
        });
      } else {
        setError(response.error || 'Failed to refresh profile');
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to refresh profile';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [user, setAuth]);

  // Check authentication status on mount
  useEffect(() => {
    const checkAuth = async () => {
      const isAuth = await authService.isAuthenticated();
      if (!isAuth && user) {
        // Token expired or invalid, clear auth
        logoutContext();
      }
    };

    checkAuth();
  }, [user, logoutContext]);

  return {
    user: user as any, // Type assertion for backward compatibility
    isAuthenticated: !!user,
    isLoading,
    error,
    login,
    register,
    logout,
    refreshProfile,
    clearError,
  };
};
