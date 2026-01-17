import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useApiData } from '@/hooks/useApiData';
import { activityService, type Activity } from '@/services/activityService';
import errorHandler from '@/services/errorHandler';
import userStatsService, {
  UserDashboardStats,
} from '@/services/userStatsService';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet } from 'react-native';
import { ThemedView } from '../ThemedView';
import { DataDisplay } from '../ui/DataDisplay';
import {
  DashboardHeader,
  QuickActions,
  RecentActivity,
  StatsGrid,
  type ActionItem,
  type ActivityItem,
  type StatItem,
} from './index';

export const UserDashboard: React.FC = () => {
  const router = useRouter();
  const { user } = useAuth();
  const { theme } = useTheme();
  const [dashboardData, setDashboardData] = useState<UserDashboardStats | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [apiConnected, setApiConnected] = useState<boolean | null>(null);

  const {
    data: userStats,
    loading: statsLoading,
    error: statsError,
    refetch: refetchStats,
  } = useApiData(userStatsService.getUserDashboardStats, {
    autoFetch: true,
    retryOnError: true,
    maxRetries: 3,
  });

  // Activity data from API
  const [activities, setActivities] = useState<Activity[]>([]);
  const [activitiesLoading, setActivitiesLoading] = useState(false);
  const [activitiesError, setActivitiesError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
    loadActivities();
  }, []);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      console.log('🔄 Loading user dashboard data...');

      // First test API connection (but don't block if it fails - try to fetch data anyway)
      console.log('🧪 Testing API connection...');
      const isConnected = await userStatsService.testApiConnection();
      setApiConnected(isConnected);

      if (!isConnected) {
        console.warn('⚠️ API connection test failed, but attempting to fetch data anyway...');
        // Don't return early - try to fetch data anyway as the connection test might be too strict
      } else {
        console.log('✅ API connection successful, fetching dashboard data...');
      }

      const response = await userStatsService.getUserDashboardStats();

      if (response.success && response.data) {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/7b131878-66d7-4e41-a34a-1e43324df177',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'UserDashboard.tsx:87',message:'Setting dashboard data',data:{meals:response.data.meals,bazar:response.data.bazar,payments:response.data.payments,mealsTotal:response.data.meals?.total,bazarTotal:response.data.bazar?.totalAmount,fullData:JSON.stringify(response.data)},timestamp:Date.now(),sessionId:'debug-session',runId:'dashboard',hypothesisId:'C'})}).catch(()=>{});
        // #endregion
        
        console.log('📊 Dashboard Data Received:', {
          meals: response.data.meals,
          bazar: response.data.bazar,
          payments: response.data.payments,
        });
        setDashboardData(response.data);
        console.log('✅ Dashboard data loaded successfully');
      } else {
        const errorMessage = response.error || 'Failed to load dashboard data';
        setError(errorMessage);
        console.error('❌ Failed to load dashboard data:', errorMessage);

        // Show user-friendly error
        const appError = errorHandler.handleError(
          new Error(errorMessage),
          'Dashboard Data'
        );
        errorHandler.showErrorAlert(appError);
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('❌ Error loading dashboard data:', err);

      // Show user-friendly error
      const appError = errorHandler.handleError(err, 'Dashboard Data');
      errorHandler.showErrorAlert(appError);
    } finally {
      setIsLoading(false);
    }
  };

  const loadActivities = async () => {
    try {
      setActivitiesLoading(true);
      setActivitiesError(null);

      console.log('📋 Loading recent activities...');
      const response = await activityService.getRecentActivities({}, 1, 10);

      if (response.success && response.data) {
        setActivities(response.data.activities);
        console.log(
          '✅ Activities loaded successfully:',
          response.data.activities.length
        );
      } else {
        setActivitiesError(response.error || 'Failed to load activities');
        console.error('❌ Failed to load activities:', response.error);
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to load activities';
      setActivitiesError(errorMessage);
      console.error('❌ Error loading activities:', err);
    } finally {
      setActivitiesLoading(false);
    }
  };

  const handleRetry = async () => {
    // Clear cache before retrying to ensure fresh data
    try {
      const { default: dashboardService } = await import('@/services/dashboardService');
      await dashboardService.refreshDashboard();
      // Also clear httpClient cache
      const { default: httpClient } = await import('@/services/httpClient');
      await httpClient.clearCache();
    } catch (error) {
      console.log('⚠️ Could not refresh dashboard service cache:', error);
    }
    await loadDashboardData();
    await loadActivities();
  };

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'add-meal':
        router.push('/(tabs)/meals');
        break;
      case 'add-bazar':
        router.push('/(tabs)/explore');
        break;
      case 'view-meals':
        router.push('/(tabs)/meals');
        break;
      case 'view-bazar':
        router.push('/(tabs)/explore');
        break;
      case 'make-payment':
        Alert.alert('Coming Soon', 'Payment feature will be available soon!');
        break;
      case 'view-profile':
        router.push('/profile');
        break;
      default:
        break;
    }
  };

  // Handle stat card clicks
  const handleStatCardClick = (statType: string) => {
    if (!user) {
      Alert.alert('Login Required', 'Please log in to access this feature', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Login', onPress: () => router.push('/LoginScreen') },
      ]);
      return;
    }

    switch (statType) {
      case 'Total Meals':
        router.push('/(tabs)/meals');
        break;
      case 'Bazar Total':
        router.push('/(tabs)/explore');
        break;
      case 'Avg/Day':
        router.push('/(tabs)/meals');
        break;
      case 'Payment Status':
        Alert.alert('Payment Details', 'Payment management coming soon!');
        break;
      default:
        break;
    }
  };

  // Handle activity card clicks
  const handleActivityClick = (activity: ActivityItem) => {
    if (!user) {
      Alert.alert('Login Required', 'Please log in to access this feature', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Login', onPress: () => router.push('/LoginScreen') },
      ]);
      return;
    }

    switch (activity.icon) {
      case 'fast-food':
        router.push('/(tabs)/meals');
        break;
      case 'cart':
        router.push('/(tabs)/explore');
        break;
      case 'card':
        Alert.alert('Payment Details', 'Payment management coming soon!');
        break;
      case 'person':
        router.push('/profile');
        break;
      default:
        router.push('/recent-activity');
        break;
    }
  };

  // Prepare dashboard data
  const stats = dashboardData || userStats;
  const userGreeting = user ? `Welcome back, ${user.name}` : undefined;

  // Debug logging with detailed data structure
  console.log('🔍 Dashboard Debug:', {
    dashboardData: dashboardData,
    userStats: userStats,
    stats: stats,
    isLoading: isLoading,
    statsLoading: statsLoading,
    error: error,
    statsError: statsError,
    apiConnected: apiConnected,
  });
  
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/7b131878-66d7-4e41-a34a-1e43324df177',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'UserDashboard.tsx:248',message:'Stats data analysis',data:{hasStats:!!stats,hasDashboardData:!!dashboardData,hasUserStats:!!userStats,statsBazar:stats?.bazar,statsMeals:stats?.meals,statsPayments:stats?.payments,bazarTotalAmount:stats?.bazar?.totalAmount,mealsTotal:stats?.meals?.total,fullStats:JSON.stringify(stats)},timestamp:Date.now(),sessionId:'debug-session',runId:'dashboard',hypothesisId:'C'})}).catch(()=>{});
  // #endregion

  // Prepare stats for StatsGrid - using real API data with click handlers
  const dashboardStats: StatItem[] = stats
    ? [
        {
          title: 'Total Meals',
          value: stats.meals?.total ?? 0,
          icon: 'fast-food',
          colors: theme.gradient.primary as [string, string],
          trend: stats.meals?.efficiency > 70 ? 'up' : 'neutral',
          change:
            stats.meals?.efficiency !== undefined
              ? `${stats.meals.efficiency}% approved`
              : 'N/A',
          period: 'this month',
          onPress: () => handleStatCardClick('Total Meals'),
        },
        {
          title: 'Bazar Total',
          value:
            stats.bazar?.totalAmount !== undefined
              ? `৳${stats.bazar.totalAmount.toLocaleString()}`
              : '৳0',
          icon: 'card',
          colors: theme.gradient.secondary as [string, string],
          trend: stats.bazar?.approvedAmount > 0 ? 'up' : 'neutral',
          change:
            stats.bazar?.approvedAmount !== undefined
              ? `৳${stats.bazar.approvedAmount.toLocaleString()} approved`
              : 'N/A',
          period: 'this month',
          onPress: () => handleStatCardClick('Bazar Total'),
        },
        {
          title: 'Avg/Day',
          value:
            stats.meals?.averagePerDay !== undefined
              ? stats.meals.averagePerDay.toFixed(1)
              : 'N/A',
          icon: 'trending-up',
          colors: theme.gradient.success as [string, string],
          trend: stats.meals?.averagePerDay > 2 ? 'up' : 'down',
          change:
            stats.meals?.daysSinceLastMeal !== undefined
              ? `${stats.meals.daysSinceLastMeal} days ago`
              : 'N/A',
          period: 'last meal',
          onPress: () => handleStatCardClick('Avg/Day'),
        },
        {
          title: 'Payment Status',
          value: stats.payments?.paymentStatus
            ? stats.payments.paymentStatus.toUpperCase()
            : 'N/A',
          icon: 'card',
          colors:
            stats.payments?.paymentStatus === 'paid'
              ? (theme.gradient.success as [string, string])
              : stats.payments?.paymentStatus === 'overdue'
              ? (theme.gradient.error as [string, string])
              : (theme.gradient.warning as [string, string]),
          change:
            stats.payments?.totalPaid !== undefined &&
            stats.payments?.monthlyContribution !== undefined
              ? `৳${stats.payments.totalPaid.toLocaleString()} / ৳${stats.payments.monthlyContribution.toLocaleString()}`
              : 'N/A',
          period: 'monthly',
          onPress: () => handleStatCardClick('Payment Status'),
        },
      ]
    : [
        // Default stats when no data available
        {
          title: 'Total Meals',
          value: 'N/A',
          icon: 'fast-food',
          colors: theme.gradient.primary as [string, string],
          trend: 'neutral',
          change: 'Login required',
          period: 'this month',
          onPress: () => handleStatCardClick('Total Meals'),
        },
        {
          title: 'Bazar Total',
          value: '৳N/A',
          icon: 'card',
          colors: theme.gradient.secondary as [string, string],
          trend: 'neutral',
          change: 'Login required',
          period: 'this month',
          onPress: () => handleStatCardClick('Bazar Total'),
        },
        {
          title: 'Avg/Day',
          value: 'N/A',
          icon: 'trending-up',
          colors: theme.gradient.success as [string, string],
          trend: 'neutral',
          change: 'Login required',
          period: 'last meal',
          onPress: () => handleStatCardClick('Avg/Day'),
        },
        {
          title: 'Payment Status',
          value: 'N/A',
          icon: 'card',
          colors: theme.gradient.warning as [string, string],
          change: 'Login required',
          period: 'monthly',
          onPress: () => handleStatCardClick('Payment Status'),
        },
      ];

  // Prepare quick actions - using real data from API or defaults
  const quickActions: ActionItem[] = [
    {
      id: 'add-meal',
      title: 'Add Meal',
      subtitle: 'Record your meals',
      icon: 'fast-food',
      color: theme.gradient.primary[0],
      onPress: () => {
        if (!user) {
          Alert.alert('Login Required', 'Please log in to add meals', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Login', onPress: () => router.push('/LoginScreen') },
          ]);
          return;
        }
        router.push('/(tabs)/meals');
      },
    },
    {
      id: 'add-bazar',
      title: 'Add Bazar',
      subtitle: 'Submit bazar items',
      icon: 'cart',
      color: theme.gradient.secondary[0],
      onPress: () => {
        if (!user) {
          Alert.alert('Login Required', 'Please log in to add bazar items', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Login', onPress: () => router.push('/LoginScreen') },
          ]);
          return;
        }
        router.push('/(tabs)/explore');
      },
    },
    {
      id: 'view-profile',
      title: 'Profile',
      subtitle: 'Manage your account',
      icon: 'person',
      color: theme.gradient.success[0],
      onPress: () => {
        if (!user) {
          Alert.alert('Login Required', 'Please log in to view profile', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Login', onPress: () => router.push('/LoginScreen') },
          ]);
          return;
        }
        router.push('/profile');
      },
    },
    {
      id: 'payments',
      title: 'Payments',
      subtitle: 'View payment status',
      icon: 'card',
      color: theme.gradient.warning[0],
      onPress: () => {
        if (!user) {
          Alert.alert('Login Required', 'Please log in to view payments', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Login', onPress: () => router.push('/LoginScreen') },
          ]);
          return;
        }
        Alert.alert('Payments', 'Payment management coming soon!');
      },
    },
  ];

  // Convert API activities to component format
  const convertActivitiesToComponentFormat = (
    activities: Activity[]
  ): ActivityItem[] => {
    return activities.map((activity, index) => ({
      id: activity.id || `activity-${index}`,
      title: activity.title || 'Activity',
      description: activity.description || 'No description',
      time: activity.time || 'Unknown time',
      icon: activity.icon || 'information-circle',
      colors: getActivityColors(activity.type, theme) as [string, string],
      onPress: () =>
        handleActivityClick({
          id: activity.id || `activity-${index}`,
          title: activity.title || 'Activity',
          description: activity.description || 'No description',
          time: activity.time || 'Unknown time',
          icon: activity.icon || 'information-circle',
          colors: getActivityColors(activity.type, theme) as [string, string],
        }),
    }));
  };

  // Helper function to get activity icon
  const getActivityIcon = (type: string): string => {
    switch (type) {
      case 'meal':
        return 'fast-food';
      case 'bazar':
        return 'cart';
      case 'payment':
        return 'card';
      case 'member':
        return 'person';
      case 'approval':
        return 'checkmark-circle';
      default:
        return 'notifications';
    }
  };

  // Helper function to get activity colors
  const getActivityColors = (type: string, theme: any): [string, string] => {
    switch (type) {
      case 'meal':
        return theme.gradient.success as [string, string];
      case 'bazar':
        return theme.gradient.secondary as [string, string];
      case 'payment':
        return theme.gradient.warning as [string, string];
      case 'member':
        return theme.gradient.primary as [string, string];
      case 'approval':
        return theme.gradient.success as [string, string];
      default:
        return theme.gradient.primary as [string, string];
    }
  };

  // Use real activities from API
  const recentActivities: ActivityItem[] =
    activities.length > 0 ? convertActivitiesToComponentFormat(activities) : [];

  // Show loading state
  if (isLoading || statsLoading) {
    return (
      <ThemedView style={styles.container}>
        <DashboardHeader
          title='Your Dashboard'
          subtitle="Here's your personal overview"
          icon='person'
        />
        <DataDisplay
          data={null}
          loading={true}
          error={null}
          loadingText='Loading your dashboard...'
        >
          {() => null}
        </DataDisplay>
      </ThemedView>
    );
  }

  // Show API connection error
  if (apiConnected === false) {
    return (
      <ThemedView style={styles.container}>
        <DashboardHeader
          title='Your Dashboard'
          subtitle="Here's your personal overview"
          icon='person'
        />
        <DataDisplay
          data={null}
          loading={false}
          error='Cannot connect to server. Please check your internet connection and try again.'
          onRetry={handleRetry}
        >
          {() => null}
        </DataDisplay>
      </ThemedView>
    );
  }

  // Show error state
  if (error || statsError) {
    return (
      <ThemedView style={styles.container}>
        <DashboardHeader
          title='Your Dashboard'
          subtitle="Here's your personal overview"
          icon='person'
        />
        <DataDisplay
          data={null}
          loading={false}
          error={error || statsError}
          onRetry={handleRetry}
        >
          {() => null}
        </DataDisplay>
      </ThemedView>
    );
  }

  // Show no data state
  if (!stats) {
    return (
      <ThemedView style={styles.container}>
        <DashboardHeader
          title='Your Dashboard'
          subtitle="Here's your personal overview"
          icon='person'
        />
        <DataDisplay
          data={null}
          loading={false}
          error={
            !user
              ? 'Please log in to view your dashboard'
              : 'No dashboard data available'
          }
          onRetry={handleRetry}
        >
          {() => null}
        </DataDisplay>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <DashboardHeader
        title='Your Dashboard'
        subtitle="Here's your personal overview"
        icon='person'
        userGreeting={userGreeting}
      />

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Stats Grid */}
        <StatsGrid stats={dashboardStats} columns={2} isSmallScreen={false} />

        {/* Quick Actions */}
        <QuickActions
          actions={quickActions}
          title='Quick Actions'
          subtitle='Manage your mess efficiently'
          columns={2}
          isSmallScreen={false}
        />

        {/* Recent Activity */}
        <RecentActivity
          activities={recentActivities}
          title='Recent Activity'
          subtitle='Latest updates from your mess'
          showViewAll={true}
          maxItems={3}
          isSmallScreen={false}
        />
      </ScrollView>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
    paddingLeft: 10,
  },
});
