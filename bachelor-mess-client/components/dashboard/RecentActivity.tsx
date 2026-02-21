import { useTheme } from '@/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import type { IconName } from '@/constants/IconTypes';
import { router } from 'expo-router';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { ThemedText } from '../ThemedText';

export interface ActivityItem {
  id: string;
  title: string;
  description: string;
  time: string;
  amount?: string;
  icon: string;
  colors: [string, string];
  onPress?: () => void;
}

interface RecentActivityProps {
  activities: ActivityItem[];
  title?: string;
  subtitle?: string;
  showViewAll?: boolean;
  onViewAll?: () => void;
  isSmallScreen?: boolean;
  maxItems?: number;
  /** When false, only the list is rendered (use when title is rendered above search/filter). */
  showSectionHeader?: boolean;
}

export const RecentActivity: React.FC<RecentActivityProps> = ({
  activities,
  title = 'Recent Activity',
  subtitle = 'Latest updates from your flat',
  showViewAll = true,
  onViewAll,
  isSmallScreen = false,
  maxItems = 3,
  showSectionHeader = true,
}) => {
  const { theme } = useTheme();
  const displayActivities = (activities || []).slice(0, maxItems);

  return (
    <View style={[styles.wrap, { paddingHorizontal: 16, marginBottom: 28 }]}>
      {showSectionHeader && (
        <View style={styles.sectionHeader}>
          <View style={styles.headerLeft}>
            <ThemedText style={[styles.sectionTitle, { color: theme.text?.primary }]}>
              {title}
            </ThemedText>
            {subtitle && (
              <ThemedText style={[styles.sectionSubtitle, { color: theme.text?.secondary }]}>
                {subtitle}
              </ThemedText>
            )}
          </View>
          {showViewAll && (
            <TouchableOpacity
              style={[styles.viewAllBtn, { backgroundColor: theme.primary + '14' }]}
              onPress={onViewAll || (() => router.push('/recent-activity'))}
            >
              <ThemedText style={[styles.viewAllText, { color: theme.primary }]}>
                View all
              </ThemedText>
              <Ionicons name="chevron-forward" size={16} color={theme.primary} />
            </TouchableOpacity>
          )}
        </View>
      )}

      <View
        style={[
          styles.list,
          {
            backgroundColor: theme.cardBackground ?? theme.surface,
            borderColor: theme.border?.secondary ?? theme.cardBorder ?? 'transparent',
            shadowColor: theme.shadow?.light ?? theme.cardShadow,
          },
        ]}
      >
        {displayActivities.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="time-outline" size={32} color={theme.text?.tertiary} />
            <ThemedText style={[styles.emptyText, { color: theme.text?.secondary }]}>
              No recent activity
            </ThemedText>
          </View>
        ) : (
          displayActivities.map((activity, index) => (
            <TouchableOpacity
              key={activity.id}
              style={[
                styles.item,
                index < displayActivities.length - 1 && {
                  borderBottomWidth: 1,
                  borderBottomColor: theme.border?.secondary ?? theme.cardBorder,
                },
              ]}
              onPress={activity.onPress}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.iconWrap,
                  { backgroundColor: (activity.colors[0] ?? theme.primary) + '18' },
                ]}
              >
                <Ionicons
                  name={activity.icon as IconName}
                  size={isSmallScreen ? 16 : 18}
                  color={activity.colors[0] ?? theme.primary}
                />
              </View>
              <View style={styles.body}>
                <ThemedText
                  style={[styles.itemTitle, { color: theme.text?.primary }]}
                  numberOfLines={1}
                >
                  {activity.title}
                </ThemedText>
                <ThemedText
                  style={[styles.itemDesc, { color: theme.text?.secondary }]}
                  numberOfLines={2}
                >
                  {activity.description}
                </ThemedText>
                <View style={styles.meta}>
                  <ThemedText style={[styles.time, { color: theme.text?.tertiary }]}>
                    {activity.time}
                  </ThemedText>
                  {activity.amount != null && activity.amount !== '' && (
                    <ThemedText style={[styles.amount, { color: theme.primary }]}>
                      ৳{activity.amount}
                    </ThemedText>
                  )}
                </View>
              </View>
              <Ionicons name="chevron-forward" size={18} color={theme.text?.tertiary} />
            </TouchableOpacity>
          ))
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {},
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  headerLeft: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.2,
    marginBottom: 2,
  },
  sectionSubtitle: {
    fontSize: 13,
    fontWeight: '500',
  },
  viewAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    gap: 4,
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: '600',
  },
  list: {
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  body: {
    flex: 1,
    minWidth: 0,
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  itemDesc: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 6,
  },
  meta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  time: {
    fontSize: 12,
    fontWeight: '500',
  },
  amount: {
    fontSize: 12,
    fontWeight: '600',
  },
  empty: {
    paddingVertical: 32,
    paddingHorizontal: 24,
    alignItems: 'center',
    gap: 10,
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '500',
  },
});
