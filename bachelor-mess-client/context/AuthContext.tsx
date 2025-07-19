import React, {
  createContext,
  ReactNode,
  useContext,
  useState,
  useEffect,
} from 'react';
import authService from '@/services/authService';
import { User } from '@/services/authService';

interface AuthData {
  user: User | null;
  token: string | null;
  role: string | null;
}

interface AuthContextType extends AuthData {
  setAuth: (data: AuthData) => void;
  logout: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  role: null,
  setAuth: () => {},
  logout: async () => {},
  isLoading: true,
});

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [auth, setAuthState] = useState<AuthData>({
    user: null,
    token: null,
    role: null,
  });
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing authentication on app start
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const isAuthenticated = await authService.isAuthenticated();
        if (isAuthenticated) {
          const token = await authService.getStoredToken();
          const user = await authService.getStoredUser();
          if (token && user) {
            setAuthState({
              user,
              token,
              role: user.role,
            });
          }
        }
      } catch (error) {
        console.error('Error checking authentication:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const setAuth = (data: AuthData) => setAuthState(data);

  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      setAuthState({ user: null, token: null, role: null });
    }
  };

  return (
    <AuthContext.Provider value={{ ...auth, setAuth, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  return useContext(AuthContext);
}
