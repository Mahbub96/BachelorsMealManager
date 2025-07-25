import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedView } from '../ThemedView';
import { useAuth } from '@/context/AuthContext';
import { useApiData } from '@/hooks/useApiData';
import statisticsService from '@/services/statisticsService';
import userStatsService, {
  UserDashboardStats,
} from '@/services/userStatsService';
import { DashboardHeader } from './DashboardHeader';
import { StatCard } from './StatCard';
import { DataDisplay } from '../ui/DataDisplay';
import { useTheme } from '@/context/ThemeContext';
import errorHandler from '@/services/errorHandler';

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

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      console.log('🔄 Loading user dashboard data...');

      // First test API connection
      console.log('🧪 Testing API connection...');
      const isConnected = await userStatsService.testApiConnection();
      setApiConnected(isConnected);

      if (!isConnected) {
        const errorMessage =
          'Cannot connect to the server. Please check your internet connection and try again.';
        setError(errorMessage);
        console.error('❌ API connection failed');

        // Show user-friendly error
        const appError = errorHandler.handleError(
          new Error(errorMessage),
          'API Connection'
        );
        errorHandler.showErrorAlert(appError);
        return;
      }

      console.log('✅ API connection successful, fetching dashboard data...');

      const response = await userStatsService.getUserDashboardStats();

      if (response.success && response.data) {
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

  const handleRetry = async () => {
    await loadDashboardData();
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

  // Show loading state
  if (isLoading || statsLoading) {
    return (
      <ThemedView style={styles.container}>
        <DashboardHeader
          title='Your Dashboard'
          subtitle="Here's your personal overview"
          icon='person'
          user={user ? { name: user.name, role: user.role } : undefined}
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
          user={user ? { name: user.name, role: user.role } : undefined}
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
          user={user ? { name: user.name, role: user.role } : undefined}
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

  // Use dashboard data from API
  const stats = dashboardData || userStats;

  // Show no data state
  if (!stats) {
    return (
      <ThemedView style={styles.container}>
        <DashboardHeader
          title='Your Dashboard'
          subtitle="Here's your personal overview"
          icon='person'
          user={user ? { name: user.name, role: user.role } : undefined}
        />
        <DataDisplay
          data={null}
          loading={false}
          error='No dashboard data available'
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
        colors={['#667eea', '#764ba2']}
      />

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20 }}
      >
        {/* Personal Stats */}
        <View style={styles.statsContainer}>
          <StatCard
            title='Total Meals'
            value={stats.meals.total}
            icon='fast-food'
            gradient={['#667eea', '#764ba2']}
            subtitle={`${stats.meals.efficiency}% approved`}
          />
          <StatCard
            title='Bazar Total'
            value={`৳${stats.bazar.totalAmount.toLocaleString()}`}
            icon='card'
            gradient={['#f093fb', '#f5576c']}
            subtitle={
              stats.bazar.approvedAmount > 0
                ? `৳${stats.bazar.approvedAmount.toLocaleString()} approved`
                : 'No approved'
            }
          />
          <StatCard
            title='Avg/Day'
            value={stats.meals.averagePerDay.toFixed(1)}
            icon='trending-up'
            gradient={['#43e97b', '#38f9d7']}
            subtitle={`${stats.meals.daysSinceLastMeal} day${
              stats.meals.daysSinceLastMeal !== 1 ? 's' : ''
            } ago`}
          />
        </View>

        {/* Payment Status */}
        <View style={styles.paymentCard}>
          <StatCard
            title='Payment Status'
            value={stats.payments.paymentStatus.toUpperCase()}
            icon='card'
            gradient={
              stats.payments.paymentStatus === 'paid'
                ? ['#10b981', '#059669']
                : stats.payments.paymentStatus === 'overdue'
                ? ['#ef4444', '#dc2626']
                : ['#f59e0b', '#d97706']
            }
            subtitle={`৳${stats.payments.totalPaid.toLocaleString()} / ৳${stats.payments.monthlyContribution.toLocaleString()}`}
          />
        </View>

        {/* Performance Overview */}
        <View style={styles.overviewCard}>
          <StatCard
            title='Performance'
            value={`${stats.overview.performanceScore}%`}
            icon='trending-up'
            gradient={['#8b5cf6', '#7c3aed']}
            subtitle={`${stats.overview.recentActivityCount} recent activities`}
          />
        </View>
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
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: 20,
    marginBottom: 24,
  },
  paymentCard: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  overviewCard: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
});
