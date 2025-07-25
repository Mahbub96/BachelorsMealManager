import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { ThemedText } from '../ThemedText';
import { useTheme } from '@/context/ThemeContext';

export interface ActivityItem {
  id: string;
  title: string;
  description: string;
  time: string;
  amount?: string;
  icon: string;
  colors: [string, string];
}

interface RecentActivityProps {
  activities: ActivityItem[];
  title?: string;
  subtitle?: string;
  showViewAll?: boolean;
  onViewAll?: () => void;
  isSmallScreen?: boolean;
  maxItems?: number;
}

export const RecentActivity: React.FC<RecentActivityProps> = ({
  activities,
  title = 'Recent Activity',
  subtitle = 'Latest updates from your mess',
  showViewAll = true,
  onViewAll,
  isSmallScreen = false,
  maxItems = 3,
}) => {
  const { theme } = useTheme();
  const displayActivities = (activities || []).slice(0, maxItems);

  return (
    <View style={styles.container}>
      <View style={styles.sectionHeader}>
        <View style={styles.headerLeft}>
          {title && (
            <ThemedText
              style={[
                styles.sectionTitle,
                isSmallScreen && styles.sectionTitleSmall,
              ]}
            >
              {title}
            </ThemedText>
          )}
          {subtitle && (
            <ThemedText
              style={[
                styles.sectionSubtitle,
                isSmallScreen && styles.sectionSubtitleSmall,
              ]}
            >
              {subtitle}
            </ThemedText>
          )}
        </View>

        {showViewAll && (
          <TouchableOpacity
            style={styles.viewAllButton}
            onPress={onViewAll || (() => router.push('/recent-activity'))}
          >
            <ThemedText style={styles.viewAllText}>View All</ThemedText>
            <Ionicons name='arrow-forward' size={16} color={theme.primary} />
          </TouchableOpacity>
        )}
      </View>

      <View
        style={[
          styles.activityList,
          {
            backgroundColor: theme.cardBackground,
            borderColor: theme.cardBorder,
            shadowColor: theme.cardShadow,
          },
        ]}
      >
        {displayActivities.map((activity, index) => (
          <View
            key={activity.id}
            style={[
              styles.activityItem,
              {
                borderBottomColor: theme.border.secondary,
              },
              index === displayActivities.length - 1 && styles.lastActivityItem,
            ]}
          >
            <View style={styles.activityIcon}>
              <LinearGradient
                colors={activity.colors}
                style={styles.activityIconGradient}
              >
                <Ionicons
                  name={activity.icon as any}
                  size={isSmallScreen ? 14 : 16}
                  color={theme.text.inverse}
                />
              </LinearGradient>
            </View>

            <View style={styles.activityContent}>
              <ThemedText
                style={[
                  styles.activityTitle,
                  isSmallScreen && styles.activityTitleSmall,
                ]}
              >
                {activity.title}
              </ThemedText>
              <ThemedText
                style={[
                  styles.activityDescription,
                  isSmallScreen && styles.activityDescriptionSmall,
                ]}
              >
                {activity.description}
              </ThemedText>
              <View style={styles.activityMeta}>
                <ThemedText
                  style={[
                    styles.activityTime,
                    isSmallScreen && styles.activityTimeSmall,
                  ]}
                >
                  {activity.time}
                </ThemedText>
                {activity.amount && (
                  <ThemedText
                    style={[
                      styles.activityAmount,
                      isSmallScreen && styles.activityAmountSmall,
                    ]}
                  >
                    ৳{activity.amount}
                  </ThemedText>
                )}
              </View>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  headerLeft: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  sectionTitleSmall: {
    fontSize: 16,
  },
  sectionSubtitle: {
    fontSize: 14,
    opacity: 0.7,
  },
  sectionSubtitleSmall: {
    fontSize: 12,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '600',
  },
  activityList: {
    borderRadius: 16,
    padding: 16,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  lastActivityItem: {
    borderBottomWidth: 0,
  },
  activityIcon: {
    marginRight: 12,
  },
  activityIconGradient: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  activityTitleSmall: {
    fontSize: 14,
  },
  activityDescription: {
    fontSize: 14,
    opacity: 0.7,
    marginBottom: 8,
    lineHeight: 18,
  },
  activityDescriptionSmall: {
    fontSize: 12,
    lineHeight: 16,
  },
  activityMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  activityTime: {
    fontSize: 12,
    opacity: 0.5,
  },
  activityTimeSmall: {
    fontSize: 10,
  },
  activityAmount: {
    fontSize: 12,
    fontWeight: '600',
  },
  activityAmountSmall: {
    fontSize: 10,
  },
});
