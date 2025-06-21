import React, {
  createContext,
  ReactNode,
  useContext,
  useState,
  useEffect,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import API_CONFIG from "../config/api";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface AuthData {
  user: User | null;
  token: string | null;
  role: string | null;
}

interface AuthContextType extends AuthData {
  setAuth: (data: AuthData) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  role: null,
  setAuth: () => {},
  logout: () => {},
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

  // Load auth data from storage on app start
  useEffect(() => {
    loadAuthFromStorage();
  }, []);

  const loadAuthFromStorage = async () => {
    try {
      const [token, userData] = await Promise.all([
        AsyncStorage.getItem(API_CONFIG.STORAGE_KEYS.AUTH_TOKEN),
        AsyncStorage.getItem(API_CONFIG.STORAGE_KEYS.USER_DATA),
      ]);

      if (token && userData) {
        const user = JSON.parse(userData);
        setAuthState({
          user,
          token,
          role: user.role,
        });
      }
    } catch (error) {
      console.error("Error loading auth from storage:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const setAuth = async (data: AuthData) => {
    try {
      // Save to storage
      await Promise.all([
        AsyncStorage.setItem(
          API_CONFIG.STORAGE_KEYS.AUTH_TOKEN,
          data.token || ""
        ),
        AsyncStorage.setItem(
          API_CONFIG.STORAGE_KEYS.USER_DATA,
          JSON.stringify(data.user)
        ),
      ]);

      // Update state
      setAuthState(data);
    } catch (error) {
      console.error("Error saving auth to storage:", error);
    }
  };

  const logout = async () => {
    try {
      // Clear storage first
      await Promise.all([
        AsyncStorage.removeItem(API_CONFIG.STORAGE_KEYS.AUTH_TOKEN),
        AsyncStorage.removeItem(API_CONFIG.STORAGE_KEYS.USER_DATA),
      ]);

      // Clear state immediately to prevent race conditions
      setAuthState({ user: null, token: null, role: null });

      // Optional: Call logout API endpoint if available
      // This would invalidate the token on the server
      try {
        // await authAPI.logout(); // Uncomment if you have a logout endpoint
      } catch (apiError) {
        console.warn("Logout API call failed:", apiError);
        // Don't throw error here as we've already cleared local data
      }

      console.log("✅ Logout successful");
    } catch (error) {
      console.error("❌ Error during logout:", error);
      // Even if storage clearing fails, clear the state
      setAuthState({ user: null, token: null, role: null });
      throw error; // Re-throw to let calling component handle it
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
