import React, {
  createContext,
  ReactNode,
  useContext,
  useState,
  useEffect,
} from 'react';
import { useRouter } from 'expo-router';
import authService, { User } from '@/services/authService';
import authEventEmitter from '@/services/authEventEmitter';
import logger from '@/utils/logger';

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

// Create context with proper default values
const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const router = useRouter();
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
        logger.debug('Auth check result', { isAuthenticated });

        if (isAuthenticated) {
          const token = await authService.getStoredToken();
          const user = await authService.getStoredUser();

          if (token && user) {
            setAuthState({
              user,
              token,
              role: user.role,
            });
          } else {
            setAuthState({ user: null, token: null, role: null });
          }
        } else {
          setAuthState({ user: null, token: null, role: null });
        }
      } catch (error) {
        logger.error('Error checking authentication', error);
        setAuthState({ user: null, token: null, role: null });
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();

    // Listen for auth events
    const handleAuthEvent = (event: { type?: string }) => {
      if (event?.type === 'session_expired' || event?.type === 'logout') {
        logout();
      }
    };

    authEventEmitter.onAuthEvent(handleAuthEvent);

    // Cleanup listener on unmount
    return () => {
      authEventEmitter.removeAuthListener(handleAuthEvent);
    };
  }, []);

  const setAuth = (data: AuthData) => {
    setAuthState(data);
  };

  const logout = async () => {
    try {
      setAuthState({ user: null, token: null, role: null });
      await authService.logout();

      try {
        router.replace('/LoginScreen');
      } catch (navError) {
        logger.error('Navigation error on logout', navError);
        try {
          router.push('/LoginScreen');
        } catch (fallbackError) {
          logger.error('Fallback navigation failed', fallbackError);
        }
      }
    } catch (error) {
      logger.error('Error during logout', error);
      setAuthState({ user: null, token: null, role: null });
      try {
        router.replace('/LoginScreen');
      } catch (navError) {
        logger.error('Navigation after logout failure', navError);
      }
    }
  };

  // Create the context value
  const contextValue: AuthContextType = {
    ...auth,
    setAuth,
    logout,
    isLoading,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
