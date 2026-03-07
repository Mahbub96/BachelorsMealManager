import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import {
  fetchNotifications,
  fetchUnreadCount,
  markAllNotificationsRead,
  markNotificationRead,
  NotificationItem,
} from '@/services/notificationService';
import {
  CHANNELS,
  connectRealtimeSocket,
  disconnectRealtimeSocket,
  isRealtimeConnected,
  onChannel,
} from '@/services/realtimeSocketClient';
import { useAuth } from '@/context/AuthContext';
import { config } from '@/config';

interface NotificationContextValue {
  notifications: NotificationItem[];
  unreadCount: number;
  isLoading: boolean;
  /** Increments when socket delivers a notification – use so badge re-renders in real time */
  realtimeTick: number;
  /** Set when fetch fails; cleared on successful refresh or when clearError is called */
  error: string | null;
  refresh: () => Promise<void>;
  clearError: () => void;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  /** Subscribe to realtime socket events; callback receives latest unreadCount so badge updates without relying on context re-render. Returns unsubscribe. */
  subscribeToRealtime: (onRealtime: (payload: { unreadCount: number }) => void) => () => void;
}

const NotificationContext = createContext<NotificationContextValue>({
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  realtimeTick: 0,
  error: null,
  refresh: async () => {},
  clearError: () => {},
  markRead: async () => {},
  markAllRead: async () => {},
  subscribeToRealtime: () => () => {},
});

export function NotificationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, token } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [realtimeTick, setRealtimeTick] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const realtimeListenersRef = useRef(new Set<(payload: { unreadCount: number }) => void>());
  const liveUnreadCountRef = useRef(0);

  const subscribeToRealtime = useCallback((onRealtime: (payload: { unreadCount: number }) => void) => {
    realtimeListenersRef.current.add(onRealtime);
    return () => {
      realtimeListenersRef.current.delete(onRealtime);
    };
  }, []);

  const refresh = useCallback(async () => {
    if (!user) return;
    setError(null);
    setIsLoading(true);
    try {
      const result = await fetchNotifications(
        1,
        config.notificationListPageSize
      );
      if (result) {
        setNotifications(result.notifications);
        setUnreadCount(result.unreadCount);
      } else {
        setError('Could not load notifications');
      }
    } catch {
      setError('Could not load notifications');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Realtime: connect socket as soon as we have a token (auto-connect when logged in or session restored).
  useEffect(() => {
    if (!token) {
      disconnectRealtimeSocket();
      if (!user) {
        setNotifications([]);
        setUnreadCount(0);
        setError(null);
      }
      return;
    }
    const unsubscribe = onChannel(CHANNELS.NOTIFICATION, (data: unknown) => {
      const raw = data as Record<string, unknown> | null;
      if (!raw || typeof raw._id !== 'string') return;
      const item: NotificationItem = {
        _id: String(raw._id),
        userId: String(raw.userId ?? ''),
        type: String(raw.type ?? ''),
        title: String(raw.title ?? ''),
        message: String(raw.message ?? ''),
        isRead: raw.isRead === true,
        refType: raw.refType != null ? String(raw.refType) : undefined,
        refId: raw.refId != null ? String(raw.refId) : undefined,
        createdAt:
          typeof raw.createdAt === 'string'
            ? raw.createdAt
            : new Date().toISOString(),
        updatedAt:
          typeof raw.updatedAt === 'string'
            ? raw.updatedAt
            : new Date().toISOString(),
      };
      setNotifications(prev => {
        if (prev.some(p => p._id === item._id)) return prev;
        return [item, ...prev];
      });
      const nextCount =
        typeof raw.unreadCount === 'number' && raw.unreadCount >= 0
          ? raw.unreadCount
          : undefined;
      if (nextCount !== undefined) {
        liveUnreadCountRef.current = nextCount;
        setUnreadCount(nextCount);
      } else {
        setUnreadCount(c => {
          const n = c + 1;
          liveUnreadCountRef.current = n;
          return n;
        });
      }
      setRealtimeTick(t => t + 1);
    });
    connectRealtimeSocket(token);
    return () => {
      unsubscribe();
      // Do not disconnect shared socket here; other features may use it.
    };
  }, [token]);

  // Notify badge with latest count after state commit (socket or poll) so UI updates without user action
  useLayoutEffect(() => {
    realtimeListenersRef.current.forEach((cb) => {
      try {
        cb({ unreadCount });
      } catch (_) {}
    });
  }, [unreadCount, realtimeTick]);

  // Keep ref in sync with state (refresh, mark read, etc.)
  liveUnreadCountRef.current = unreadCount;

  // Initial load and refresh on app focus (REST)
  useEffect(() => {
    if (!user) return;
    refresh();
  }, [user, refresh]);

  useEffect(() => {
    if (!user) return;
    const sub = AppState.addEventListener(
      'change',
      (nextState: AppStateStatus) => {
        if (nextState === 'active') {
          refresh();
          if (token && !isRealtimeConnected()) {
            connectRealtimeSocket(token);
          }
        }
      }
    );
    return () => sub.remove();
  }, [user, token, refresh]);

  // Poll unread count when app is active so badge updates even if socket misses or is disconnected
  useEffect(() => {
    if (!user) return;
    const interval = setInterval(async () => {
      if (AppState.currentState !== 'active') return;
      const count = await fetchUnreadCount();
      setUnreadCount((prev) => (count !== prev ? count : prev));
    }, config.notificationPollIntervalMs);
    return () => clearInterval(interval);
  }, [user]);

  const markRead = useCallback(async (id: string) => {
    await markNotificationRead(id);
    setNotifications(prev =>
      prev.map(n => (n._id === id ? { ...n, isRead: true } : n))
    );
    setUnreadCount(c => Math.max(0, c - 1));
  }, []);

  const markAllRead = useCallback(async () => {
    await markAllNotificationsRead();
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    setUnreadCount(0);
  }, []);

  const clearError = useCallback(() => setError(null), []);

  const value = useMemo(
    () => ({
      notifications,
      unreadCount,
      isLoading,
      realtimeTick,
      error,
      refresh,
      clearError,
      markRead,
      markAllRead,
      subscribeToRealtime,
    }),
    [
      notifications,
      unreadCount,
      isLoading,
      realtimeTick,
      error,
      refresh,
      clearError,
      markRead,
      markAllRead,
      subscribeToRealtime,
    ]
  );

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  return useContext(NotificationContext);
}
