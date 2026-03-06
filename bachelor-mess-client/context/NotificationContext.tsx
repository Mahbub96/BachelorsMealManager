import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  fetchNotifications,
  fetchUnreadCount,
  markAllNotificationsRead,
  markNotificationRead,
  NotificationItem,
} from '@/services/notificationService';
import { useAuth } from '@/context/AuthContext';

interface NotificationContextValue {
  notifications: NotificationItem[];
  unreadCount: number;
  isLoading: boolean;
  /** Fetch/refresh full notifications list */
  refresh: () => Promise<void>;
  /** Mark one notification as read and update local state */
  markRead: (id: string) => Promise<void>;
  /** Mark all as read and update local state */
  markAllRead: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextValue>({
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  refresh: async () => {},
  markRead: async () => {},
  markAllRead: async () => {},
});

const POLL_INTERVAL_MS = 30_000; // 30 seconds

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const pollTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const refresh = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const result = await fetchNotifications(1, 30);
      if (result) {
        setNotifications(result.notifications);
        setUnreadCount(result.unreadCount);
      }
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  /** Lightweight badge count poll — avoids fetching full list every 30s */
  const pollUnreadCount = useCallback(async () => {
    if (!user) return;
    const count = await fetchUnreadCount();
    setUnreadCount(count);
  }, [user]);

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }
    // Initial load
    refresh();

    // Poll unread count every 30s
    pollTimer.current = setInterval(pollUnreadCount, POLL_INTERVAL_MS);
    return () => {
      if (pollTimer.current) clearInterval(pollTimer.current);
    };
  }, [user, refresh, pollUnreadCount]);

  const markRead = useCallback(async (id: string) => {
    await markNotificationRead(id);
    setNotifications((prev) =>
      prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
    );
    setUnreadCount((c) => Math.max(0, c - 1));
  }, []);

  const markAllRead = useCallback(async () => {
    await markAllNotificationsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
  }, []);

  return (
    <NotificationContext.Provider
      value={{ notifications, unreadCount, isLoading, refresh, markRead, markAllRead }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  return useContext(NotificationContext);
}
