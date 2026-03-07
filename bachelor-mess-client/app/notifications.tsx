import React, { useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { useRouter, useFocusEffect, type Href } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ScreenLayout } from '@/components/layout';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { ListCard, ModernLoader, StatusRow } from '@/components/ui';
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

  // Refresh when screen is focused so we pick up new notifications (e.g. after adding bazar) if socket missed
  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

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
          <View style={[styles.actionsBar, { borderBottomColor: theme.border?.secondary }]}>
            <TouchableOpacity
              style={[styles.markAllBtn, { backgroundColor: (theme.primary ?? '#667eea') + '18' }]}
              onPress={onMarkAllRead}
              accessibilityRole="button"
              accessibilityLabel="Mark all notifications as read"
            >
              <Ionicons name="checkmark-done" size={16} color={theme.primary ?? '#667eea'} />
              <ThemedText style={[styles.markAllText, { color: theme.primary ?? '#667eea' }]}>
                Mark all as read
              </ThemedText>
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
              <Ionicons name="notifications-off-outline" size={56} color={theme.text?.tertiary ?? theme.text?.secondary} />
              <ThemedText style={[styles.emptyTitle, { color: theme.text?.primary }]}>No notifications yet</ThemedText>
              <ThemedText style={[styles.emptySubtitle, { color: theme.text?.secondary }]}>
                Events like meal approvals, payments, and votes will appear here.
              </ThemedText>
            </View>
          </View>
        ) : (
          <View style={styles.listSection}>
            <ScrollView
              style={styles.scrollView}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={true}
              refreshControl={
                <RefreshControl
                  refreshing={isLoading}
                  onRefresh={refresh}
                  tintColor={theme.primary}
                />
              }
            >
              {groups.map((group) => (
                <View key={group.label} style={styles.group}>
                  <ThemedText style={[styles.groupLabel, { color: theme.text?.tertiary ?? theme.text?.secondary }]}>
                    {group.label}
                  </ThemedText>
                  <ListCard>
                    {group.data.map((item) => {
                      const cfg = getNotificationTypeConfig(item.type);
                      return (
                        <StatusRow
                          key={item._id}
                          icon={
                            <Ionicons
                              name={cfg.icon as IconName}
                              size={20}
                              color={cfg.color}
                            />
                          }
                          iconBackgroundColor={cfg.bg}
                          title={item.title}
                          subtitle={item.message}
                          statusLabel={notificationTimeAgo(item.createdAt)}
                          statusColor={item.isRead ? (theme.text?.secondary ?? '#6b7280') : (theme.primary ?? '#667eea')}
                          onPress={() => handleCardPress(item)}
                        />
                      );
                    })}
                  </ListCard>
                </View>
              ))}
              <View style={styles.bottomPad} />
            </ScrollView>
          </View>
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
  },
  markAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  markAllText: {
    fontSize: 13,
    fontWeight: '600',
  },

  listSection: { flex: 1, minHeight: 0 },
  scrollView: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 24 },
  group: { marginBottom: 16 },
  groupLabel: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: 8,
    marginBottom: 8,
    marginLeft: 4,
  },
  bottomPad: { height: 24 },

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
