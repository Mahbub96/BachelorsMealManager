import React, { createContext, ReactNode, useContext, useState } from 'react';

interface User {
  name: string;
  email: string;
}

interface AuthData {
  user: User | null;
  token: string | null;
  role: string | null;
}

interface AuthContextType extends AuthData {
  setAuth: (data: AuthData) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  role: null,
  setAuth: () => {},
  logout: () => {},
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

  const setAuth = (data: AuthData) => setAuthState(data);
  const logout = () => setAuthState({ user: null, token: null, role: null });

  return (
    <AuthContext.Provider value={{ ...auth, setAuth, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  return useContext(AuthContext);
}
