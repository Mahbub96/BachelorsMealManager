import React, {
  createContext,
  useCallback,
  useRef,
  useContext,
  type ReactNode,
} from 'react';

type RefreshFn = () => void | Promise<void>;

interface AppRefreshContextValue {
  register: (key: string, fn: RefreshFn) => void;
  unregister: (key: string) => void;
  refreshAll: () => Promise<void>;
}

const AppRefreshContext = createContext<AppRefreshContextValue | null>(null);

export function AppRefreshProvider({ children }: { children: ReactNode }) {
  const refreshers = useRef<Map<string, RefreshFn>>(new Map());

  const register = useCallback((key: string, fn: RefreshFn) => {
    refreshers.current.set(key, fn);
  }, []);

  const unregister = useCallback((key: string) => {
    refreshers.current.delete(key);
  }, []);

  const refreshAll = useCallback(async () => {
    const fns = Array.from(refreshers.current.values());
    await Promise.all(fns.map((fn) => Promise.resolve(fn())));
  }, []);

  const value: AppRefreshContextValue = {
    register,
    unregister,
    refreshAll,
  };

  return (
    <AppRefreshContext.Provider value={value}>
      {children}
    </AppRefreshContext.Provider>
  );
}

export function useAppRefresh(): AppRefreshContextValue {
  const ctx = useContext(AppRefreshContext);
  if (!ctx) {
    throw new Error('useAppRefresh must be used within AppRefreshProvider');
  }
  return ctx;
}
