import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useApiData } from '@/hooks/useApiData';
import { activityService, type Activity } from '@/services/activityService';
import errorHandler from '@/services/errorHandler';
import httpClient from '@/services/httpClient';
import userStatsService, {
  UserDashboardStats,
} from '@/services/userStatsService';
import logger from '@/utils/logger';
import { useRouter, useFocusEffect } from 'expo-router';
import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useAppRefresh } from '@/context/AppRefreshContext';
import { ThemedView } from '../ThemedView';
import { ThemedText } from '../ThemedText';
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
import { ModernLoader } from '../ui/ModernLoader';

export const UserDashboard: React.FC = () => {
  const isMounted = useRef(true);
  const router = useRouter();
  const { user } = useAuth();
  const { theme } = useTheme();
  const [dashboardData, setDashboardData] = useState<UserDashboardStats | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [apiConnected, setApiConnected] = useState<boolean | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const { register, unregister, refreshAll } = useAppRefresh();

  const {
    data: userStats,
    loading: statsLoading,
    error: statsError,
  } = useApiData(userStatsService.getUserDashboardStats, {
    // Disable automatic fetching & retries here to avoid duplicate
    // requests; this screen uses its own explicit loader.
    autoFetch: false,
    retryOnError: false,
    maxRetries: 0,
  });

  // Activity data from API
  const [activities, setActivities] = useState<Activity[]>([]);
  const [activitiesLoading, setActivitiesLoading] = useState(false);
  const [activitiesError, setActivitiesError] = useState<string | null>(null);



  const loadDashboardData = useCallback(async () => {
    try {
      if (isMounted.current) {
        setIsLoading(true);
        setError(null);
      }

      const isConnected = await userStatsService.testApiConnection();
      if (isMounted.current) setApiConnected(isConnected);

      const response = await userStatsService.getUserDashboardStats();

      if (response.success && response.data) {
        if (isMounted.current) {
          setDashboardData(response.data);
        }
      } else {
        const errorMessage = response.error || 'Failed to load dashboard data';
        if (isMounted.current) {
          setError(errorMessage);
        }
        logger.error('Failed to load dashboard data', errorMessage);

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
      if (isMounted.current) {
        setError(errorMessage);
      }
      logger.error('Error loading dashboard data', err);

      // Show user-friendly error
      const appError = errorHandler.handleError(err, 'Dashboard Data');
      errorHandler.showErrorAlert(appError);
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
      }
    }
  }, []);

  const loadActivities = useCallback(async () => {
    try {
      if (isMounted.current) {
        setActivitiesLoading(true);
        setActivitiesError(null);
      }

      const response = await activityService.getRecentActivities({}, 1, 10);

      if (response.success && response.data) {
        if (isMounted.current) {
          setActivities(response.data.activities);
        }
      } else {
        const errorMsg = response.error || 'Failed to load activities';
        if (isMounted.current) setActivitiesError(errorMsg);
        logger.error('Failed to load activities', response.error);
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to load activities';
      if (isMounted.current) setActivitiesError(errorMessage);
      logger.error('Error loading activities', err);
    } finally {
      if (isMounted.current) setActivitiesLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      isMounted.current = true;
      loadDashboardData();
      loadActivities();
      return () => {
        isMounted.current = false;
      };
    }, [loadDashboardData, loadActivities])
  );

  useEffect(() => {
    register('dashboard', async () => {
      await loadDashboardData();
      await loadActivities();
    });
    return () => unregister('dashboard');
  }, [register, unregister, loadDashboardData, loadActivities]);

  const handlePullRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refreshAll();
    } finally {
      if (isMounted.current) setRefreshing(false);
    }
  }, [refreshAll]);

  const handleRetry = async () => {
    httpClient.clearOnlineCache();
    try {
      const { default: dashboardService } = await import('@/services/dashboardService');
      await dashboardService.refreshDashboard();
    } catch (error) {
        logger.warn('Could not refresh dashboard service cache', error);
    }
    await loadDashboardData();
    await loadActivities();
  };

  const handleQuickAction = (action: string) => {
    if (!user) {
      Alert.alert('Login Required', 'Please log in to use this feature', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Login', onPress: () => router.push('/LoginScreen') },
      ]);
      return;
    }
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
      case 'payments':
        Alert.alert('Payments', 'Payment management coming soon!');
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
      case 'Meals + Guest':
      case 'Total Meals':
        router.push('/(tabs)/meals');
        break;
      case 'Bazar Total':
        router.push('/(tabs)/explore');
        break;
      case 'Flat Bazar':
        router.push('/(tabs)/explore');
        break;
      case 'Meal Rate':
        Alert.alert(
          'Current Meal Rate',
          `Meal rate (this month) = Total group bazar ÷ Total group meals. Same for everyone in your group.`,
        );
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


  // Prepare stats for StatsGrid - using real API data with click handlers
  const dashboardStats: StatItem[] = stats
    ? [
        {
          title: 'Meals + Guest',
          value: stats.meals?.total ?? 0,
          icon: 'fast-food',
          colors: theme.gradient.primary as [string, string],
          trend: stats.meals?.efficiency > 70 ? 'up' : 'neutral',
          change:
            (stats.meals?.guestMeals ?? 0) > 0
              ? `${(stats.meals?.total ?? 0) - (stats.meals?.guestMeals ?? 0)} meals + ${stats.meals.guestMeals} guest`
              : stats.meals?.efficiency !== undefined
                ? `${stats.meals.efficiency}% approved`
                : 'N/A',
          period: 'this month',
          onPress: () => handleStatCardClick('Meals + Guest'),
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
          title: 'Flat Bazar',
          value:
            stats.flatBazar?.totalAmount !== undefined
              ? `৳${stats.flatBazar.totalAmount.toLocaleString()}`
              : '৳0',
          icon: 'home',
          colors: theme.gradient.success as [string, string],
          trend: stats.flatBazar?.totalAmount ? 'up' : 'neutral',
          change:
            stats.flatBazar?.memberCount !== undefined &&
            stats.flatBazar?.sharePerPerson !== undefined
              ? `৳${stats.flatBazar.sharePerPerson.toFixed(0)} each (${stats.flatBazar.memberCount} ${stats.flatBazar.memberCount === 1 ? 'person' : 'people'})`
              : 'Shared equally',
          period: 'this month',
          onPress: () => handleStatCardClick('Flat Bazar'),
        },
        {
          title: 'Meal Rate',
          value:
            stats.currentMealRate?.rate !== undefined
              ? stats.currentMealRate.rate.toFixed(3)
              : 'N/A',
          icon: 'calculator',
          colors: theme.gradient.warning as [string, string],
          trend: stats.currentMealRate?.rate > 0 ? 'up' : 'neutral',
          change:
            stats.currentMealRate?.totalMeals !== undefined &&
            stats.currentMealRate?.totalBazarAmount !== undefined
              ? `${stats.currentMealRate.totalMeals} meals / ৳${stats.currentMealRate.totalBazarAmount.toLocaleString()}`
              : 'N/A',
          period: 'this month',
          onPress: () => handleStatCardClick('Meal Rate'),
        },
      ]
    : [
        // Default stats when no data available
        {
          title: 'Meals + Guest',
          value: 'N/A',
          icon: 'fast-food',
          colors: theme.gradient.primary as [string, string],
          trend: 'neutral',
          change: 'Login required',
          period: 'this month',
          onPress: () => handleStatCardClick('Meals + Guest'),
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
          title: 'Flat Bazar',
          value: '৳0',
          icon: 'home',
          colors: theme.gradient.success as [string, string],
          trend: 'neutral',
          change: 'Shared equally',
          period: 'this month',
          onPress: () => handleStatCardClick('Flat Bazar'),
        },
        {
          title: 'Meal Rate',
          value: 'N/A',
          icon: 'calculator',
          colors: theme.gradient.warning as [string, string],
          change: 'Login required',
          period: 'this month',
          onPress: () => handleStatCardClick('Meal Rate'),
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
      onPress: () => handleQuickAction('add-meal'),
    },
    {
      id: 'add-bazar',
      title: 'Add Bazar',
      subtitle: 'Submit bazar items',
      icon: 'cart',
      color: theme.gradient.secondary[0],
      onPress: () => handleQuickAction('add-bazar'),
    },
    {
      id: 'view-profile',
      title: 'Profile',
      subtitle: 'Manage your account',
      icon: 'person',
      color: theme.gradient.success[0],
      onPress: () => handleQuickAction('view-profile'),
    },
    {
      id: 'payments',
      title: 'Payments',
      subtitle: 'View payment status',
      icon: 'card',
      color: theme.gradient.warning[0],
      onPress: () => handleQuickAction('payments'),
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
      icon: activity.icon || getActivityIcon(activity.type),
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
  const getActivityColors = (type: string, theme: ReturnType<typeof useTheme>['theme']): [string, string] => {
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
      <ModernLoader visible={true} text="Loading your dashboard..." />
    );
  }

  // Show API connection error
  if (apiConnected === false) {
    return (
      <ThemedView style={styles.container}>
        <DashboardHeader
          title={user ? `Welcome back, ${user.name}` : 'Your Dashboard'}
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
          title={user ? `Welcome back, ${user.name}` : 'Your Dashboard'}  
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
        title={user ? `Welcome back, ${user.name}` : 'Your Dashboard'}  
        subtitle="Here's your personal overview"
        icon='person'
        userGreeting={userGreeting}
      />

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handlePullRefresh} />
        }
      >
        {/* Stats Grid */}
        <StatsGrid stats={dashboardStats} columns={2} isSmallScreen={false} />

        {/* Quick Actions */}
        <QuickActions
          actions={quickActions}
          title='Quick Actions'
          subtitle='Manage your flat efficiently'
          columns={2}
          isSmallScreen={false}
        />

        {/* Recent Activity */}
        {activitiesLoading && (
          <View style={{ padding: 16, alignItems: 'center', height: 100 }}>
             <ModernLoader visible={true} overlay={false} size="small" />
          </View>
        )}
        {activitiesError && !activitiesLoading && (
          <ThemedText style={{ padding: 16, color: theme?.status?.error }}>{activitiesError}</ThemedText>
        )}
        {!activitiesLoading && (
          <RecentActivity
            activities={recentActivities}
            title='Recent Activity'
            subtitle='Latest updates from your flat'
            showViewAll={true}
            maxItems={3}
            isSmallScreen={false}
          />
        )}
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
    paddingBottom: 28,
  },
});
