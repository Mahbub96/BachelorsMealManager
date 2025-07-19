import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Dimensions,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import {
  BarChart,
  LineChart,
  PieChart,
  ProgressChart,
  StatsGrid,
} from '../ModernCharts';
import { ThemedText } from '../ThemedText';
import { useDashboard } from '../../hooks/useDashboard';

const { width } = Dimensions.get('window');

interface ApiDashboardProps {
  onRefresh?: () => void;
  refreshing?: boolean;
}

interface QuickAction {
  id: string;
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  gradient: [string, string];
  onPress: () => void;
}

interface ActivityItem {
  id: string;
  type: 'meal' | 'bazar' | 'payment' | 'notification';
  title: string;
  subtitle: string;
  time: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}

export const ApiDashboard: React.FC<ApiDashboardProps> = ({
  onRefresh,
  refreshing = false,
}) => {
  const router = useRouter();
  const [selectedTimeframe, setSelectedTimeframe] = useState<
    'week' | 'month' | 'year'
  >('week');

  const {
    stats,
    activities,
    analytics,
    combinedData,
    loading,
    error,
    getCombinedData,
    refresh,
    clearError,
  } = useDashboard();

  // Load data on component mount
  useEffect(() => {
    getCombinedData({ timeframe: selectedTimeframe });
  }, [selectedTimeframe, getCombinedData]);

  // Handle refresh
  const handleRefresh = async () => {
    await refresh();
    onRefresh?.();
  };

  // Handle timeframe change
  const handleTimeframeChange = (timeframe: 'week' | 'month' | 'year') => {
    setSelectedTimeframe(timeframe);
  };

  // Format stats for display
  const formatStats = () => {
    if (!stats) return [];

    return [
      {
        title: 'Total Members',
        value: stats.totalMembers?.toString() || '0',
        icon: 'people',
        gradient: ['#667eea', '#764ba2'] as const,
      },
      {
        title: 'Monthly Expense',
        value: `৳${(stats.monthlyExpense || 0).toLocaleString()}`,
        icon: 'cash',
        gradient: ['#f093fb', '#f5576c'] as const,
      },
      {
        title: 'Avg. Meals',
        value: stats.averageMeals?.toString() || '0',
        icon: 'restaurant',
        gradient: ['#43e97b', '#38f9d7'] as const,
      },
      {
        title: 'Balance',
        value: `৳${(stats.balance || 0).toLocaleString()}`,
        icon: 'wallet',
        gradient: ['#fa709a', '#fee140'] as const,
      },
    ];
  };

  // Format activities for display
  const formatActivities = (): ActivityItem[] => {
    if (!activities || activities.length === 0) return [];

    return activities.slice(0, 4).map(activity => ({
      id: activity.id,
      type: activity.type as ActivityItem['type'],
      title: activity.title,
      subtitle: activity.description,
      time: activity.time,
      icon: getActivityIcon(activity.type),
      color: getActivityColor(activity.type),
    }));
  };

  // Get activity icon
  const getActivityIcon = (type: string): keyof typeof Ionicons.glyphMap => {
    switch (type) {
      case 'meal':
        return 'fast-food';
      case 'bazar':
        return 'cart';
      case 'payment':
        return 'card';
      case 'notification':
        return 'notifications';
      default:
        return 'information-circle';
    }
  };

  // Get activity color
  const getActivityColor = (type: string): string => {
    switch (type) {
      case 'meal':
        return '#10b981';
      case 'bazar':
        return '#6366f1';
      case 'payment':
        return '#f59e0b';
      case 'notification':
        return '#8b5cf6';
      default:
        return '#6b7280';
    }
  };

  const quickActions: QuickAction[] = [
    {
      id: 'add-meal',
      title: 'Add Meal',
      subtitle: "Record today's meal",
      icon: 'fast-food',
      gradient: ['#667eea', '#764ba2'],
      onPress: () => router.push('/(tabs)/meals'),
    },
    {
      id: 'add-bazar',
      title: 'Add Bazar',
      subtitle: 'Upload bazar list',
      icon: 'cart',
      gradient: ['#f093fb', '#f5576c'],
      onPress: () => router.push('/(tabs)/explore'),
    },
    {
      id: 'view-reports',
      title: 'Reports',
      subtitle: 'View analytics',
      icon: 'analytics',
      gradient: ['#43e97b', '#38f9d7'],
      onPress: () => Alert.alert('Reports', 'Reports feature coming soon!'),
    },
    {
      id: 'settings',
      title: 'Settings',
      subtitle: 'Manage preferences',
      icon: 'settings',
      gradient: ['#fa709a', '#fee140'],
      onPress: () => router.push('/settings'),
    },
  ];

  // Get chart data from API
  const getWeeklyMealsData = () => {
    if (!combinedData?.charts?.weeklyMeals) {
      return [];
    }
    return combinedData.charts.weeklyMeals;
  };

  const getMonthlyRevenueData = () => {
    if (!combinedData?.charts?.monthlyRevenue) {
      return [];
    }
    return combinedData.charts.monthlyRevenue;
  };

  const getExpenseBreakdownData = () => {
    if (!combinedData?.charts?.expenseBreakdown) {
      return [];
    }
    return combinedData.charts.expenseBreakdown;
  };

  // Show error if any
  if (error) {
    return (
      <View style={styles.errorContainer}>
        <ThemedText style={styles.errorText}>
          Error loading dashboard: {error}
        </ThemedText>
        <Pressable style={styles.retryButton} onPress={handleRefresh}>
          <ThemedText style={styles.retryButtonText}>Retry</ThemedText>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing || loading}
          onRefresh={handleRefresh}
        />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <ThemedText style={styles.greeting}>Good morning! 👋</ThemedText>
          <ThemedText style={styles.subtitle}>
            Here&apos;s what&apos;s happening in your mess
          </ThemedText>
        </View>
        <Pressable
          style={styles.profileButton}
          onPress={() => router.push('/profile')}
        >
          <Ionicons name='person-circle' size={32} color='#667eea' />
        </Pressable>
      </View>

      {/* Stats Grid */}
      <View style={styles.section}>
        <StatsGrid stats={formatStats()} />
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <ThemedText style={styles.sectionTitle}>Quick Actions</ThemedText>
        <View style={styles.quickActionsGrid}>
          {quickActions.map(action => (
            <Pressable
              key={action.id}
              style={styles.quickActionCard}
              onPress={action.onPress}
            >
              <LinearGradient
                colors={action.gradient}
                style={styles.quickActionGradient}
              >
                <Ionicons name={action.icon} size={24} color='#fff' />
              </LinearGradient>
              <View style={styles.quickActionContent}>
                <ThemedText style={styles.quickActionTitle}>
                  {action.title}
                </ThemedText>
                <ThemedText style={styles.quickActionSubtitle}>
                  {action.subtitle}
                </ThemedText>
              </View>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Charts Section */}
      <View style={styles.section}>
        <View style={styles.chartHeader}>
          <ThemedText style={styles.sectionTitle}>Analytics</ThemedText>
          <View style={styles.timeframeSelector}>
            {(['week', 'month', 'year'] as const).map(timeframe => (
              <Pressable
                key={timeframe}
                style={[
                  styles.timeframeButton,
                  selectedTimeframe === timeframe &&
                    styles.timeframeButtonActive,
                ]}
                onPress={() => handleTimeframeChange(timeframe)}
              >
                <ThemedText
                  style={[
                    styles.timeframeText,
                    selectedTimeframe === timeframe &&
                      styles.timeframeTextActive,
                  ]}
                >
                  {timeframe.charAt(0).toUpperCase() + timeframe.slice(1)}
                </ThemedText>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Weekly Meals Chart */}
        <View style={styles.chartContainer}>
          <BarChart
            data={getWeeklyMealsData()}
            title='Weekly Meals'
            height={200}
            showForecast={true}
            showTrend={true}
          />
        </View>

        {/* Revenue Chart */}
        <View style={styles.chartContainer}>
          <LineChart
            data={getMonthlyRevenueData()}
            title='Monthly Revenue (৳)'
            color='#667eea'
            showForecast={true}
          />
        </View>

        {/* Expense Breakdown */}
        <View style={styles.chartContainer}>
          <PieChart
            data={getExpenseBreakdownData()}
            title='Expense Breakdown'
            showForecast={true}
          />
        </View>
      </View>

      {/* Recent Activity */}
      <View style={styles.section}>
        <View style={styles.activityHeader}>
          <ThemedText style={styles.sectionTitle}>Recent Activity</ThemedText>
          <Pressable onPress={() => router.push('/notifications')}>
            <ThemedText style={styles.viewAllText}>View All</ThemedText>
          </Pressable>
        </View>
        <View style={styles.activityList}>
          {formatActivities().map(activity => (
            <Pressable
              key={activity.id}
              style={styles.activityItem}
              onPress={() => {
                router.push({
                  pathname: '/activity-details',
                  params: {
                    id: activity.id,
                    type: activity.type,
                    title: activity.title,
                    description: activity.subtitle,
                    time: activity.time,
                    user: 'User',
                    amount: '0',
                    priority: 'medium',
                    status: 'completed',
                  },
                });
              }}
            >
              <View
                style={[
                  styles.activityIcon,
                  { backgroundColor: activity.color + '20' },
                ]}
              >
                <Ionicons
                  name={activity.icon}
                  size={20}
                  color={activity.color}
                />
              </View>
              <View style={styles.activityContent}>
                <ThemedText style={styles.activityTitle}>
                  {activity.title}
                </ThemedText>
                <ThemedText style={styles.activitySubtitle}>
                  {activity.subtitle}
                </ThemedText>
                <ThemedText style={styles.activityTime}>
                  {activity.time}
                </ThemedText>
              </View>
              <Ionicons name='chevron-forward' size={16} color='#9ca3af' />
            </Pressable>
          ))}
        </View>
      </View>

      {/* Progress Section */}
      <View style={styles.section}>
        <ThemedText style={styles.sectionTitle}>Monthly Goals</ThemedText>
        <View style={styles.progressContainer}>
          <ProgressChart
            title='Meal Target'
            current={analytics?.monthlyProgress?.current || 0}
            target={analytics?.monthlyProgress?.target || 100}
            color='#10b981'
            gradient={['#34d399', '#10b981']}
          />
          <ProgressChart
            title='Revenue Target'
            current={stats?.monthlyExpense || 0}
            target={stats?.monthlyBudget || 40000}
            color='#6366f1'
            gradient={['#818cf8', '#6366f1']}
          />
        </View>
      </View>

      {/* Bottom Spacing */}
      <View style={styles.bottomSpacing} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 4,
  },
  profileButton: {
    padding: 8,
  },
  section: {
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickActionCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    width: (width - 52) / 2,
  },
  quickActionGradient: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  quickActionContent: {
    flex: 1,
  },
  quickActionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 2,
  },
  quickActionSubtitle: {
    fontSize: 12,
    color: '#6b7280',
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  timeframeSelector: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    padding: 4,
  },
  timeframeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  timeframeButtonActive: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  timeframeText: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  timeframeTextActive: {
    color: '#1f2937',
    fontWeight: '600',
  },
  chartContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  viewAllText: {
    fontSize: 14,
    color: '#667eea',
    fontWeight: '600',
  },
  activityList: {
    backgroundColor: '#fff',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 2,
  },
  activitySubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  activityTime: {
    fontSize: 12,
    color: '#9ca3af',
  },
  progressContainer: {
    gap: 16,
  },
  bottomSpacing: {
    height: 100,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#ef4444',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#667eea',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ApiDashboard;
