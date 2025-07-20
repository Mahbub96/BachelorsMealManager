import React, {
  createContext,
  ReactNode,
  useContext,
  useState,
  useEffect,
} from 'react';
import { useRouter } from 'expo-router';
import authService from '@/services/authService';
import authEventEmitter from '@/services/authEventEmitter';
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
        console.log('🔍 Checking authentication status...');
        const isAuthenticated = await authService.isAuthenticated();
        console.log('🔍 Authentication check result:', isAuthenticated);
        
        if (isAuthenticated) {
          const token = await authService.getStoredToken();
          const user = await authService.getStoredUser();
          console.log('🔍 Stored token:', token ? 'Yes' : 'No');
          console.log('🔍 Stored user:', user ? 'Yes' : 'No');
          
          if (token && user) {
            setAuthState({
              user,
              token,
              role: user.role,
            });
            console.log('✅ Auth state initialized with stored data');
          } else {
            // Clear invalid auth state
            setAuthState({ user: null, token: null, role: null });
            console.log('🧹 Cleared invalid auth state');
          }
        } else {
          // No authentication found
          setAuthState({ user: null, token: null, role: null });
          console.log('🧹 No authentication found, cleared state');
        }
      } catch (error) {
        console.error('❌ Error checking authentication:', error);
        // Clear auth state on error
        setAuthState({ user: null, token: null, role: null });
      } finally {
        setIsLoading(false);
        console.log('✅ Auth initialization complete');
      }
    };

    checkAuth();

    // Listen for auth events
    const handleAuthEvent = (event: any) => {
      console.log('🔔 Auth Event Received:', event);

      if (event.type === 'session_expired' || event.type === 'logout') {
        console.log('🔄 Handling auth event:', event.type);
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
    console.log('🔄 Setting auth data:', { hasUser: !!data.user, hasToken: !!data.token });
    setAuthState(data);
  };

  const logout = async () => {
    try {
      console.log('🚪 Starting logout from AuthContext...');

      // Clear auth state first
      setAuthState({ user: null, token: null, role: null });
      console.log('🧹 Auth state cleared');

      // Call logout service
      await authService.logout();
      console.log('✅ Logout service completed');

      // Navigate to login screen
      try {
        router.replace('/LoginScreen');
        console.log('🔄 Navigated to login screen');
      } catch (navError) {
        console.error('❌ Navigation error:', navError);
        // Fallback navigation
        try {
          router.push('/LoginScreen');
          console.log('🔄 Fallback navigation to login screen');
        } catch (fallbackError) {
          console.error('❌ Fallback navigation also failed:', fallbackError);
        }
      }
    } catch (error) {
      console.error('❌ Error during logout:', error);
      // Even if logout fails, ensure we clear state and navigate
      setAuthState({ user: null, token: null, role: null });
      try {
        router.replace('/LoginScreen');
      } catch (navError) {
        console.error('❌ Navigation error after logout failure:', navError);
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

  console.log('🔧 AuthContext value:', {
    hasUser: !!auth.user,
    hasToken: !!auth.token,
    isLoading,
  });

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
