import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
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
import { useAuth } from '@/context/AuthContext';
import { config } from '@/config';

interface NotificationContextValue {
  notifications: NotificationItem[];
  unreadCount: number;
  isLoading: boolean;
  /** Set when fetch fails; cleared on successful refresh or when clearError is called */
  error: string | null;
  /** Fetch/refresh full notifications list */
  refresh: () => Promise<void>;
  /** Clear current error (e.g. before retry). */
  clearError: () => void;
  /** Mark one notification as read and update local state */
  markRead: (id: string) => Promise<void>;
  /** Mark all as read and update local state */
  markAllRead: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextValue>({
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  error: null,
  refresh: async () => {},
  clearError: () => {},
  markRead: async () => {},
  markAllRead: async () => {},
});

export function NotificationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pollTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const refresh = useCallback(async () => {
    if (!user) return;
    setError(null);
    setIsLoading(true);
    try {
      const result = await fetchNotifications(1, config.notificationListPageSize);
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

  /** Poll unread count; when it increases, refresh full list so new notifications appear ASAP. */
  const pollUnreadCount = useCallback(async () => {
    if (!user) return;
    const count = await fetchUnreadCount();
    setUnreadCount(prev => {
      if (count > prev) refresh();
      return count;
    });
  }, [user, refresh]);

  useEffect(() => {
    if (!user) {
      if (pollTimer.current) {
        clearInterval(pollTimer.current);
        pollTimer.current = null;
      }
      setNotifications([]);
      setUnreadCount(0);
      setError(null);
      return;
    }
    refresh();
    pollTimer.current = setInterval(pollUnreadCount, config.notificationPollIntervalMs);
    return () => {
      if (pollTimer.current) {
        clearInterval(pollTimer.current);
        pollTimer.current = null;
      }
    };
  }, [user, refresh, pollUnreadCount]);

  /** Refresh notifications as soon as app comes to foreground so user sees latest ASAP. */
  useEffect(() => {
    if (!user) return;
    const subscription = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      if (nextState === 'active') refresh();
    });
    return () => subscription.remove();
  }, [user, refresh]);

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

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        isLoading,
        error,
        refresh,
        clearError,
        markRead,
        markAllRead,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  return useContext(NotificationContext);
}
