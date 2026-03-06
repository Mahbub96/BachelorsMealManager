import React, { useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ScreenLayout } from '@/components/layout';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { ModernLoader } from '@/components/ui';
import { useTheme } from '@/context/ThemeContext';
import { useNotifications } from '@/context/NotificationContext';
import type { NotificationItem } from '@/services/notificationService';
import type { IconName } from '@/constants/IconTypes';

// ─── Icon + colour map per notification type ───────────────────────────────
const TYPE_CONFIG: Record<string, { icon: string; color: string; bg: string }> = {
  bazar_submitted:    { icon: 'cart',              color: '#f59e0b', bg: '#fef3c7' },
  bazar_approved:     { icon: 'cart',              color: '#10b981', bg: '#d1fae5' },
  bazar_rejected:     { icon: 'cart',              color: '#ef4444', bg: '#fee2e2' },
  meal_submitted:     { icon: 'restaurant',        color: '#f59e0b', bg: '#fef3c7' },
  meal_approved:      { icon: 'restaurant',        color: '#10b981', bg: '#d1fae5' },
  meal_rejected:      { icon: 'restaurant',        color: '#ef4444', bg: '#fee2e2' },
  payment_requested:  { icon: 'cash',              color: '#6366f1', bg: '#ede9fe' },
  payment_approved:   { icon: 'checkmark-circle',  color: '#10b981', bg: '#d1fae5' },
  payment_rejected:   { icon: 'close-circle',      color: '#ef4444', bg: '#fee2e2' },
  refund_sent:        { icon: 'cash-outline',       color: '#8b5cf6', bg: '#ede9fe' },
  refund_acknowledged:{ icon: 'checkmark-done',    color: '#10b981', bg: '#d1fae5' },
  vote_started:       { icon: 'people',            color: '#0ea5e9', bg: '#e0f2fe' },
  vote_cast:          { icon: 'thumbs-up',         color: '#0ea5e9', bg: '#e0f2fe' },
  election_started:   { icon: 'medal',             color: '#f97316', bg: '#ffedd5' },
  removal_requested:  { icon: 'exit',              color: '#f97316', bg: '#ffedd5' },
  removal_resolved:   { icon: 'exit',              color: '#6b7280', bg: '#f3f4f6' },
};

const DEFAULT_CONFIG = { icon: 'notifications', color: '#667eea', bg: '#ede9fe' };

function getConfig(type: string) {
  return TYPE_CONFIG[type] ?? DEFAULT_CONFIG;
}

// ─── Relative time helper ──────────────────────────────────────────────────
function timeAgo(dateStr: string): string {
  const now = Date.now();
  const diff = now - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(diff / 86400000);
  if (m < 1) return 'Just now';
  if (m < 60) return `${m}m ago`;
  if (h < 24) return `${h}h ago`;
  if (d === 1) return 'Yesterday';
  return `${d}d ago`;
}

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
  onPress: (id: string) => void;
}) {
  const cfg = getConfig(item.type);
  return (
    <TouchableOpacity
      style={[styles.card, !item.isRead && styles.cardUnread]}
      onPress={() => onPress(item._id)}
      activeOpacity={0.75}
    >
      {/* Unread dot */}
      {!item.isRead && <View style={styles.unreadDot} />}

      {/* Icon area */}
      <View style={[styles.iconCircle, { backgroundColor: cfg.bg }]}>
        <Ionicons name={cfg.icon as IconName} size={22} color={cfg.color} />
      </View>

      {/* Text area */}
      <View style={styles.cardContent}>
        <ThemedText style={styles.cardTitle} numberOfLines={1}>
          {item.title}
        </ThemedText>
        <ThemedText style={styles.cardMessage} numberOfLines={2}>
          {item.message}
        </ThemedText>
        <ThemedText style={styles.cardTime}>{timeAgo(item.createdAt)}</ThemedText>
      </View>
    </TouchableOpacity>
  );
}

// ─── Main screen ───────────────────────────────────────────────────────────
export default function NotificationsScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const { notifications, unreadCount, isLoading, refresh, markRead, markAllRead } =
    useNotifications();

  const groups = groupByDate(notifications);

  const handleCardPress = useCallback(
    async (id: string) => {
      await markRead(id);
    },
    [markRead]
  );

  return (
    <ScreenLayout
      title="Notifications"
      subtitle={unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
      showBack
      onBackPress={() => router.back()}
    >
      <ThemedView style={styles.root}>
        {/* Top actions bar */}
        {unreadCount > 0 && (
          <View style={styles.actionsBar}>
            <TouchableOpacity style={styles.markAllBtn} onPress={markAllRead}>
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
