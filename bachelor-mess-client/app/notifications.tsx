import React, { useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ScreenLayout } from '@/components/layout';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { ModernLoader } from '@/components/ui';
import { useTheme } from '@/context/ThemeContext';
import { useNotifications } from '@/context/NotificationContext';
import { useThrottledCallback, PRESS_THROTTLE_MS } from '@/hooks/useDebounce';
import type { NotificationItem } from '@/services/notificationService';
import type { IconName } from '@/constants/IconTypes';
import {
  getNotificationTypeConfig,
  getNotificationRoute,
  notificationTimeAgo,
} from '@/utils/notificationUtils';

// ─── Group by date label ───────────────────────────────────────────────────
function groupByDate(items: NotificationItem[]): { label: string; data: NotificationItem[] }[] {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);

  const groups: Record<string, NotificationItem[]> = {};
  for (const n of items) {
    const d = new Date(n.createdAt); d.setHours(0, 0, 0, 0);
    let label = 'Earlier';
    if (d.getTime() === today.getTime()) label = 'Today';
    else if (d.getTime() === yesterday.getTime()) label = 'Yesterday';
    if (!groups[label]) groups[label] = [];
    groups[label].push(n);
  }
  const ORDER = ['Today', 'Yesterday', 'Earlier'];
  return ORDER.filter((l) => groups[l]).map((l) => ({ label: l, data: groups[l] }));
}

// ─── NotificationCard ──────────────────────────────────────────────────────
function NotificationCard({
  item,
  onPress,
}: {
  item: NotificationItem;
  onPress: (item: NotificationItem) => void;
}) {
  const cfg = getNotificationTypeConfig(item.type);
  return (
    <TouchableOpacity
      style={[styles.card, !item.isRead && styles.cardUnread]}
      onPress={() => onPress(item)}
      activeOpacity={0.75}
      accessibilityRole="button"
      accessibilityLabel={`${item.title}. ${item.message}. ${item.isRead ? 'Read' : 'Unread'}`}
    >
      {!item.isRead && <View style={styles.unreadDot} />}
      <View style={[styles.iconCircle, { backgroundColor: cfg.bg }]}>
        <Ionicons name={cfg.icon as IconName} size={22} color={cfg.color} />
      </View>
      <View style={styles.cardContent}>
        <ThemedText style={styles.cardTitle} numberOfLines={1}>
          {item.title}
        </ThemedText>
        <ThemedText style={styles.cardMessage} numberOfLines={2}>
          {item.message}
        </ThemedText>
        <ThemedText style={styles.cardTime}>{notificationTimeAgo(item.createdAt)}</ThemedText>
      </View>
    </TouchableOpacity>
  );
}

// ─── Main screen ───────────────────────────────────────────────────────────
export default function NotificationsScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const {
    notifications,
    unreadCount,
    isLoading,
    error,
    refresh,
    clearError,
    markRead,
    markAllRead,
  } = useNotifications();

  const groups = groupByDate(notifications);

  const onMarkAllRead = useThrottledCallback(markAllRead, PRESS_THROTTLE_MS);

  const onCardPress = useCallback(
    async (item: NotificationItem) => {
      await markRead(item._id);
      const route = getNotificationRoute(item.refType, item.refId, item.type);
      if (route) {
        const href = (route.params ? { pathname: route.pathname, params: route.params } : route.pathname) as Href;
        setTimeout(() => router.push(href), 0);
      }
    },
    [markRead, router]
  );
  const handleCardPress = useThrottledCallback(onCardPress, PRESS_THROTTLE_MS, (item) => item._id);

  return (
    <ScreenLayout
      title="Notifications"
      subtitle={unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
      showBack
      onBackPress={() => router.back()}
    >
      <ThemedView style={styles.root}>
        {error && (
          <View style={styles.errorBar}>
            <ThemedText style={styles.errorText}>{error}</ThemedText>
            <TouchableOpacity
              onPress={() => { clearError(); refresh(); }}
              accessibilityRole="button"
              accessibilityLabel="Retry loading notifications"
            >
              <ThemedText style={styles.errorRetry}>Retry</ThemedText>
            </TouchableOpacity>
          </View>
        )}

        {unreadCount > 0 && (
          <View style={styles.actionsBar}>
            <TouchableOpacity
              style={styles.markAllBtn}
              onPress={onMarkAllRead}
              accessibilityRole="button"
              accessibilityLabel="Mark all notifications as read"
            >
              <Ionicons name="checkmark-done" size={16} color="#667eea" />
              <ThemedText style={styles.markAllText}>Mark all as read</ThemedText>
            </TouchableOpacity>
          </View>
        )}

        {isLoading && notifications.length === 0 ? (
          <View style={styles.center}>
          <ModernLoader />
          </View>
        ) : notifications.length === 0 ? (
          <View style={styles.center}>
            <View style={styles.emptyBox}>
              <Ionicons name="notifications-off-outline" size={56} color="#9ca3af" />
              <ThemedText style={styles.emptyTitle}>No notifications yet</ThemedText>
              <ThemedText style={styles.emptySubtitle}>
                Events like meal approvals, payments, and votes will appear here.
              </ThemedText>
            </View>
          </View>
        ) : (
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={isLoading}
                onRefresh={refresh}
                tintColor={theme.primary ?? '#667eea'}
              />
            }
          >
            {groups.map((group) => (
              <View key={group.label}>
                <ThemedText style={styles.groupLabel}>{group.label}</ThemedText>
                {group.data.map((item) => (
                  <NotificationCard key={item._id} item={item} onPress={handleCardPress} />
                ))}
              </View>
            ))}
            {/* Bottom padding */}
            <View style={{ height: 24 }} />
          </ScrollView>
        )}
      </ThemedView>
    </ScreenLayout>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1 },

  errorBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#fef2f2',
    borderBottomWidth: 1,
    borderBottomColor: '#fecaca',
  },
  errorText: {
    fontSize: 13,
    color: '#b91c1c',
    flex: 1,
  },
  errorRetry: {
    fontSize: 13,
    fontWeight: '600',
    color: '#667eea',
    marginLeft: 12,
  },

  actionsBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  markAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: '#ede9fe',
  },
  markAllText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#667eea',
  },

  scroll: { flex: 1 },
  scrollContent: { padding: 16, gap: 0 },

  groupLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#9ca3af',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: 16,
    marginBottom: 8,
  },

  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  cardUnread: {
    borderColor: '#c7d2fe',
    backgroundColor: '#fafafe',
  },
  unreadDot: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#667eea',
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    flexShrink: 0,
  },
  cardContent: { flex: 1 },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 3,
  },
  cardMessage: {
    fontSize: 13,
    color: '#6b7280',
    lineHeight: 18,
    marginBottom: 6,
  },
  cardTime: {
    fontSize: 11,
    color: '#9ca3af',
    fontWeight: '500',
  },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  emptyBox: { alignItems: 'center', gap: 12, maxWidth: 260 },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#374151',
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    lineHeight: 20,
  },
});
