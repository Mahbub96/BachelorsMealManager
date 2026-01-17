import React, { useEffect, useState } from 'react';
import {
  Alert,
  Dimensions,
  ScrollView,
  StyleSheet,
  View,
  Text,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  dashboardService,
  DashboardStats,
  Activity as ApiActivity,
  AnalyticsData,
} from '@/services';
import { StatsGrid } from '../ModernCharts';
import { ChartsSection } from './ChartsSection';
import { DashboardHeader } from './DashboardHeader';
import { QuickActions } from './QuickActions';
import { RecentActivity } from './RecentActivity';
import { useTheme } from '@/context/ThemeContext';
import { ThemedView } from '../ThemedView';

import errorHandler from '@/services/errorHandler';

const { width: screenWidth } = Dimensions.get('window');

// Removed hardcoded design system - using theme instead

export const ApiDashboard: React.FC = () => {
  const router = useRouter();
  const { theme } = useTheme();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dashboardData, setDashboardData] = useState<{
    stats: DashboardStats | null;
    activities: ApiActivity[];
    analytics: AnalyticsData | null;
    charts?: any;
  } | null>(null);

  const isTablet = screenWidth >= 768;
  const isMobile = screenWidth < 768;
  const containerPadding = isTablet ? 24 : 16;
  const cardSpacing = isTablet ? 20 : 12;

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    setError(null);

    try {
      console.log('Loading dashboard data from API...');
      const response = await dashboardService.getCombinedData();

      console.log('Dashboard response:', response);

      if (response.success && response.data) {
        setDashboardData(response.data);
        console.log('✅ Dashboard data loaded successfully');
      } else {
        const errorMessage = response.error || 'Failed to load dashboard data';
        setError(errorMessage);
        console.error('❌ Failed to load dashboard data:', errorMessage);

        // Don't show alert for every error, let the UI handle it
        console.log('🚨 Error Handler:', {
          context: 'Dashboard Data',
          message: errorMessage,
          severity: 'MEDIUM',
          timestamp: new Date().toISOString(),
          type: 'UNKNOWN',
        });
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('❌ Error loading dashboard data:', err);

      // Log the error for debugging
      console.log('🚨 Error Handler:', {
        context: 'Dashboard Data',
        message: errorMessage,
        severity: 'MEDIUM',
        timestamp: new Date().toISOString(),
        type: 'UNKNOWN',
      });
    } finally {
      setLoading(false);
    }
  };

  const refreshData = async () => {
    // Clear cache before refreshing to ensure fresh data
    try {
      const { default: dashboardService } = await import('@/services/dashboardService');
      await dashboardService.refreshDashboard();
    } catch (error) {
      console.log('⚠️ Could not refresh dashboard service cache:', error);
    }
    await loadDashboardData();
  };

  const handleReset = async () => {
    // Reload dashboard data after reset
    await loadDashboardData();
  };

  // Safe number conversion - always returns 0 if invalid
  const safeNumber = (value: any): number => {
    if (value === null || value === undefined || value === '') return 0;
    const num = Number(value);
    return isNaN(num) ? 0 : num;
  };

  // Safe string conversion - always returns '0' if invalid
  const safeString = (value: any): string => {
    if (value === null || value === undefined || value === '') return '0';
    return String(value);
  };

  // Get stats from API data
  const getStats = () => {
    if (!dashboardData?.stats) {
      return [];
    }

    const stats = dashboardData.stats;
    return [
      {
        title: 'Total Members',
        value: safeString(stats.totalMembers || 0),
        icon: 'people',
        gradient: theme.gradient.success as [string, string],
        details: {
          change: '0',
          period: 'this month',
          trend: 'up' as const,
        },
      },
      {
        title: 'Monthly Expenses',
        value: `৳${safeNumber(stats.monthlyExpense || 0).toLocaleString()}`,
        icon: 'card',
        gradient: theme.gradient.warning as [string, string],
        details: {
          change: '0%',
          period: 'vs last month',
          trend: 'up' as const,
        },
      },
      {
        title: 'Total Meals',
        value: safeString(stats.totalMeals || 0),
        icon: 'restaurant',
        gradient: theme.gradient.info as [string, string],
        details: {
          change: '0%',
          period: 'vs last month',
          trend: 'up' as const,
        },
      },
      {
        title: 'Average Meals',
        value: safeString(stats.averageMeals || 0),
        icon: 'trending-up',
        gradient: theme.gradient.primary as [string, string],
        details: {
          change: '0',
          period: 'per day',
          trend: 'up' as const,
        },
      },
    ];
  };

  const getActivities = () => {
    return dashboardData?.activities || [];
  };

  const getChartsData = () => {
    if (!dashboardData?.charts) {
      console.log('❌ No charts data available');
      return {
        monthlyRevenue: [],
        currentMonthRevenue: {
          revenue: 0,
          expenses: 0,
        },
      };
    }

    const chartsData = {
      monthlyRevenue: dashboardData.charts.monthlyRevenue || [],
      currentMonthRevenue: {
        revenue: safeNumber(dashboardData.stats?.balance || 0),
        expenses: safeNumber(dashboardData.stats?.monthlyExpense || 0),
      },
    };

    console.log('📊 Charts data:', {
      monthlyRevenueCount: chartsData.monthlyRevenue.length,
      monthlyRevenueData: chartsData.monthlyRevenue,
      currentMonthRevenue: chartsData.currentMonthRevenue,
    });

    return chartsData;
  };

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'add-meal':
        router.push('/meals');
        break;
      case 'add-bazar':
        router.push('/admin');
        break;
      case 'view-expenses':
        router.push({
          pathname: '/expense-details',
          params: {
            title: 'Monthly Expenses',
            value: safeString(dashboardData?.stats?.monthlyExpense || 0),
            type: 'monthly',
            color: '#f59e0b',
          },
        });
        break;
      case 'view-members':
        router.push('/admin');
        break;
      default:
        Alert.alert('Coming Soon', 'This feature will be available soon!');
    }
  };

  // Show loading state
  if (loading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size='large' color={theme.primary} />
        <Text style={[styles.loadingText, { color: theme.text.primary }]}>
          Loading dashboard...
        </Text>
      </ThemedView>
    );
  }

  // Show error state
  if (error) {
    return (
      <ThemedView style={styles.errorContainer}>
        <Text style={[styles.errorTitle, { color: theme.text.primary }]}>
          Connection Issue
        </Text>
        <Text style={[styles.errorText, { color: theme.text.secondary }]}>
          {error.includes('Network') || error.includes('connection')
            ? 'Unable to connect to the server. Please check your internet connection and try again.'
            : error.includes('Server') || error.includes('unavailable')
            ? 'The server is temporarily unavailable. Please try again in a few moments.'
            : error.includes('timeout')
            ? 'Request timed out. Please check your connection and try again.'
            : error}
        </Text>
        <Text
          style={[styles.retryText, { color: theme.primary }]}
          onPress={refreshData}
        >
          Tap to retry
        </Text>
      </ThemedView>
    );
  }

  // Show no data state
  if (!dashboardData) {
    return (
      <ThemedView style={styles.errorContainer}>
        <Text style={[styles.errorText, { color: theme.text.secondary }]}>
          No dashboard data available
        </Text>
        <Text
          style={[styles.retryText, { color: theme.primary }]}
          onPress={refreshData}
        >
          Tap to retry
        </Text>
      </ThemedView>
    );
  }

  const stats = getStats();
  const activities = getActivities();
  const chartsData = getChartsData();

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.contentContainer,
          { padding: containerPadding },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <View style={styles.refreshControl}>
            <Text
              style={[styles.refreshText, { color: theme.text.secondary }]}
              onPress={refreshData}
            >
              Pull to refresh
            </Text>
          </View>
        }
      >
        {/* Header Section */}
        <DashboardHeader
          title='Admin Dashboard'
          subtitle='Manage your mess operations'
          icon='analytics'
          colors={['#667eea', '#764ba2']}
        />

        {/* Data Source Indicator */}
        <View
          style={[
            styles.dataSourceIndicator,
            {
              backgroundColor: theme.cardBackground,
              borderColor: theme.cardBorder,
            },
          ]}
        >
          <Text style={[styles.dataSourceText, { color: theme.text.primary }]}>
            Live Data
          </Text>
        </View>

        {/* Stats Grid */}
        <View style={[styles.statsContainer, { marginBottom: cardSpacing }]}>
          <StatsGrid stats={stats || []} />
        </View>

        {/* Charts Section */}
        <ChartsSection
          monthlyRevenue={chartsData?.monthlyRevenue || []}
          currentMonthRevenue={chartsData?.currentMonthRevenue || {}}
          expenseBreakdown={dashboardData?.charts?.expenseBreakdown || []}
          weeklyMeals={dashboardData?.charts?.weeklyMeals || []}
          isTablet={isTablet}
        />

        {/* Quick Actions */}
        <QuickActions
          actions={[
            {
              id: 'add-meal',
              title: 'Add Meal',
              subtitle: "Record today's meals",
              icon: 'restaurant',
              color: theme.status.success,
              onPress: () => handleQuickAction('add-meal'),
            },
            {
              id: 'add-bazar',
              title: 'Add Bazar',
              subtitle: 'Upload shopping list',
              icon: 'cart',
              color: theme.status.warning,
              onPress: () => handleQuickAction('add-bazar'),
            },
            {
              id: 'view-expenses',
              title: 'View Expenses',
              subtitle: 'Check spending details',
              icon: 'card',
              color: theme.status.error,
              onPress: () => handleQuickAction('view-expenses'),
            },
            {
              id: 'view-revenue',
              title: 'View Revenue',
              subtitle: 'See income breakdown',
              icon: 'trending-up',
              color: theme.status.info,
              onPress: () => handleQuickAction('view-revenue'),
            },
          ]}
        />

        {/* Recent Activity */}
        <RecentActivity
          activities={(activities || []).map(activity => ({
            ...activity,
            colors: [theme.primary, theme.secondary] as [string, string],
            amount: activity.amount?.toString(),
          }))}
          maxItems={3}
        />
      </ScrollView>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 100,
  },
  statsContainer: {
    marginBottom: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryText: {
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  refreshControl: {
    padding: 16,
    alignItems: 'center',
  },
  refreshText: {
    fontSize: 14,
  },
  dataSourceIndicator: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'flex-start',
    marginBottom: 16,
    borderWidth: 1,
  },
  dataSourceText: {
    fontSize: 12,
    fontWeight: '500',
  },
});
