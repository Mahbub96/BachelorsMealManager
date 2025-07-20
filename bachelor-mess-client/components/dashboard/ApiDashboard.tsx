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

import errorHandler from '@/services/errorHandler';

const { width: screenWidth } = Dimensions.get('window');

const DESIGN_SYSTEM = {
  colors: {
    light: '#f8fafc',
    error: '#ef4444',
    success: '#10b981',
  },
  spacing: {
    lg: 20,
    xl: 24,
  },
};

export const ApiDashboard: React.FC = () => {
  const router = useRouter();

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
        gradient: ['#10b981', '#059669'] as [string, string],
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
        gradient: ['#f59e0b', '#d97706'] as [string, string],
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
        gradient: ['#8b5cf6', '#7c3aed'] as [string, string],
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
        gradient: ['#667eea', '#764ba2'] as [string, string],
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
      return {
        monthlyRevenue: [],
        currentMonthRevenue: {
          revenue: 0,
          expenses: 0,
        },
      };
    }

    return {
      monthlyRevenue: dashboardData.charts.monthlyRevenue || [],
      currentMonthRevenue: {
        revenue: safeNumber(dashboardData.stats?.balance || 0),
        expenses: safeNumber(dashboardData.stats?.monthlyExpense || 0),
      },
    };
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
      <View style={styles.loadingContainer}>
        <ActivityIndicator size='large' color='#667eea' />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  // Show error state
  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>Connection Issue</Text>
        <Text style={styles.errorText}>
          {error.includes('Network') || error.includes('connection')
            ? 'Unable to connect to the server. Please check your internet connection and try again.'
            : error.includes('Server') || error.includes('unavailable')
            ? 'The server is temporarily unavailable. Please try again in a few moments.'
            : error.includes('timeout')
            ? 'Request timed out. Please check your connection and try again.'
            : error}
        </Text>
        <Text style={styles.retryText} onPress={refreshData}>
          Tap to retry
        </Text>
      </View>
    );
  }

  // Show no data state
  if (!dashboardData) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>No dashboard data available</Text>
        <Text style={styles.retryText} onPress={refreshData}>
          Tap to retry
        </Text>
      </View>
    );
  }

  const stats = getStats();
  const activities = getActivities();
  const chartsData = getChartsData();

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.contentContainer,
        { padding: containerPadding },
      ]}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <View style={styles.refreshControl}>
          <Text style={styles.refreshText} onPress={refreshData}>
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
      <View style={styles.dataSourceIndicator}>
        <Text style={styles.dataSourceText}>Live Data</Text>
      </View>

      {/* Stats Grid */}
      <View style={[styles.statsContainer, { marginBottom: cardSpacing }]}>
        <StatsGrid stats={stats || []} />
      </View>

      {/* Charts Section */}
      <ChartsSection
        monthlyRevenue={chartsData?.monthlyRevenue || []}
        currentMonthRevenue={chartsData?.currentMonthRevenue || {}}
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
            color: '#10b981',
            onPress: () => handleQuickAction('add-meal'),
          },
          {
            id: 'add-bazar',
            title: 'Add Bazar',
            subtitle: 'Upload shopping list',
            icon: 'cart',
            color: '#f59e0b',
            onPress: () => handleQuickAction('add-bazar'),
          },
          {
            id: 'view-expenses',
            title: 'View Expenses',
            subtitle: 'Check spending details',
            icon: 'card',
            color: '#ef4444',
            onPress: () => handleQuickAction('view-expenses'),
          },
          {
            id: 'view-revenue',
            title: 'View Revenue',
            subtitle: 'See income breakdown',
            icon: 'trending-up',
            color: '#667eea',
            onPress: () => handleQuickAction('view-revenue'),
          },
        ]}
      />

      {/* Recent Activity */}
      <RecentActivity
        activities={(activities || []).map(activity => ({
          ...activity,
          colors: ['#667eea', '#764ba2'] as [string, string],
          amount: activity.amount?.toString(),
        }))}
        maxItems={3}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DESIGN_SYSTEM.colors.light,
  },
  contentContainer: {
    paddingBottom: 100,
  },
  statsContainer: {
    marginBottom: DESIGN_SYSTEM.spacing.xl,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: DESIGN_SYSTEM.colors.light,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: DESIGN_SYSTEM.colors.light,
    padding: 20,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: DESIGN_SYSTEM.colors.error,
    textAlign: 'center',
    marginBottom: 8,
  },
  errorText: {
    fontSize: 16,
    color: DESIGN_SYSTEM.colors.error,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryText: {
    fontSize: 14,
    color: DESIGN_SYSTEM.colors.success,
    textDecorationLine: 'underline',
  },
  refreshControl: {
    padding: 16,
    alignItems: 'center',
  },
  refreshText: {
    fontSize: 14,
    color: '#6b7280',
  },
  dataSourceIndicator: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  dataSourceText: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
});
