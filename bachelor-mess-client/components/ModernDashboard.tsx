import { useMessData } from '@/context/MessDataContext';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Dimensions, ScrollView, StyleSheet, View } from 'react-native';
import { BarChart, SwappableLineChart } from './ModernCharts';
import { ThemedText } from './ThemedText';
import {
  DashboardHeader,
  StatsGrid,
  QuickActions,
  RecentActivity,
  ChartSection,
  StatItem,
  ActionItem,
  ActivityItem,
} from './dashboard/index';

const { width: screenWidth } = Dimensions.get('window');

// Design System Colors
const DESIGN_SYSTEM = {
  colors: {
    primary: '#667eea',
    secondary: '#764ba2',
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444',
    info: '#3b82f6',
    light: '#f8fafc',
    dark: '#1f2937',
  },
};

export const ModernDashboard: React.FC = () => {
  const router = useRouter();
  const {
    monthlyRevenue,
    currentMonthRevenue,
    members,
    monthlyMealStats,
    recentActivities,
  } = useMessData();

  const [selectedPeriod, setSelectedPeriod] = useState<'current' | 'forecast'>(
    'current'
  );

  // Responsive layout calculations
  const isSmallScreen = screenWidth < 375;
  const containerPadding = isSmallScreen ? 12 : 16;

  // Generate chart data
  const expenseChartData = monthlyRevenue.slice(-6).map(item => ({
    label: item.month,
    value: item.expenses,
    forecast: Math.round(item.expenses * 1.02),
    color: DESIGN_SYSTEM.colors.danger,
    gradient: [DESIGN_SYSTEM.colors.danger, '#dc2626'] as [string, string],
    trend: (item.expenses > item.revenue * 0.85 ? 'up' : 'down') as
      | 'up'
      | 'down',
  }));

  const mealChartData = monthlyRevenue.slice(-6).map(item => ({
    label: item.month,
    value: Math.round(item.averageMeals * item.memberCount * 30),
    forecast: Math.round(item.averageMeals * item.memberCount * 30 * 1.03),
    color: DESIGN_SYSTEM.colors.success,
    gradient: [DESIGN_SYSTEM.colors.success, '#059669'] as [string, string],
    trend: 'up' as const,
  }));

  // Stats data
  const stats: StatItem[] = [
    {
      title: 'Total Revenue',
      value: `৳${currentMonthRevenue.revenue.toLocaleString()}`,
      icon: 'trending-up',
      colors: [DESIGN_SYSTEM.colors.primary, DESIGN_SYSTEM.colors.secondary],
      trend: 'up',
      change: '+12.5%',
      period: 'vs last month',
    },
    {
      title: 'Monthly Expenses',
      value: `৳${currentMonthRevenue.expenses.toLocaleString()}`,
      icon: 'card',
      colors: [DESIGN_SYSTEM.colors.warning, '#d97706'],
      trend: 'up',
      change: '+8.2%',
      period: 'vs last month',
    },
    {
      title: 'Active Members',
      value: `${members.filter(m => m.status === 'active').length}`,
      icon: 'people',
      colors: [DESIGN_SYSTEM.colors.success, '#059669'],
      trend: 'up',
      change: '+1',
      period: 'this month',
    },
    {
      title: 'Total Meals',
      value: `${monthlyMealStats.totalMeals}`,
      icon: 'restaurant',
      colors: [DESIGN_SYSTEM.colors.info, '#2563eb'],
      trend: 'up',
      change: '+15.3%',
      period: 'vs last month',
    },
  ];

  // Quick actions data
  const actions: ActionItem[] = [
    {
      id: 'add-meal',
      title: 'Add Meal',
      subtitle: "Record today's meals",
      icon: 'restaurant',
      color: DESIGN_SYSTEM.colors.success,
      onPress: () => router.push('/meals'),
    },
    {
      id: 'add-bazar',
      title: 'Add Bazar',
      subtitle: 'Upload shopping list',
      icon: 'cart',
      color: DESIGN_SYSTEM.colors.warning,
      onPress: () => router.push('/admin'),
    },
    {
      id: 'view-expenses',
      title: 'View Expenses',
      subtitle: 'Check spending details',
      icon: 'card',
      color: DESIGN_SYSTEM.colors.danger,
      onPress: () => {
        router.push({
          pathname: '/expense-details',
          params: {
            title: 'Monthly Expenses',
            value: currentMonthRevenue.expenses.toString(),
            type: 'monthly',
            color: DESIGN_SYSTEM.colors.warning,
          },
        });
      },
    },
    {
      id: 'view-revenue',
      title: 'View Revenue',
      subtitle: 'See income breakdown',
      icon: 'trending-up',
      color: DESIGN_SYSTEM.colors.primary,
      onPress: () => {
        router.push({
          pathname: '/expense-details',
          params: {
            title: 'Monthly Revenue',
            value: currentMonthRevenue.revenue.toString(),
            type: 'monthly',
            color: DESIGN_SYSTEM.colors.primary,
          },
        });
      },
    },
  ];

  // Recent activities data
  const activities: ActivityItem[] = (recentActivities || [])
    .slice(0, 3)
    .map((activity, index) => ({
      id: `activity-${index}`,
      title: activity.title,
      description: activity.description,
      time: activity.time,
      amount: activity.amount?.toString(),
      icon: activity.icon || 'document',
      colors: [DESIGN_SYSTEM.colors.primary, DESIGN_SYSTEM.colors.secondary],
    }));

  const handleViewAllActivities = () => {
    router.push('/recent-activity');
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.contentContainer,
        { padding: containerPadding },
      ]}
      showsVerticalScrollIndicator={false}
    >
      {/* Dashboard Header */}
      <DashboardHeader
        title='Dashboard'
        subtitle="Welcome back! Here's your mess overview"
        icon='home'
        colors={[DESIGN_SYSTEM.colors.primary, DESIGN_SYSTEM.colors.secondary]}
        showNotificationButton={true}
        isSmallScreen={isSmallScreen}
      />

      {/* Stats Grid */}
      <StatsGrid stats={stats} columns={2} isSmallScreen={isSmallScreen} />

      {/* Revenue Trend Chart */}
      <ChartSection
        title='Revenue Trend'
        subtitle='Monthly revenue performance'
        showPeriodToggle={true}
        selectedPeriod={selectedPeriod}
        onPeriodChange={setSelectedPeriod}
        isSmallScreen={isSmallScreen}
      >
        <SwappableLineChart
          monthlyRevenue={monthlyRevenue.slice(-6)}
          title=''
          color={DESIGN_SYSTEM.colors.primary}
          showForecast={selectedPeriod === 'forecast'}
          showTrend={true}
        />
      </ChartSection>

      {/* Charts Row */}
      <View style={[styles.chartsRow, isSmallScreen && styles.chartsRowSmall]}>
        {/* Expenses Chart */}
        <ChartSection
          title='Monthly Expenses'
          subtitle='Track spending patterns'
          isSmallScreen={isSmallScreen}
          marginBottom={0}
        >
          <BarChart
            data={expenseChartData}
            title=''
            height={isSmallScreen ? 140 : 160}
            showForecast={true}
            showTrend={true}
          />
        </ChartSection>

        {/* Meals Chart */}
        <ChartSection
          title='Meal Consumption'
          subtitle='Daily meal tracking'
          isSmallScreen={isSmallScreen}
          marginBottom={0}
        >
          <BarChart
            data={mealChartData}
            title=''
            height={isSmallScreen ? 140 : 160}
            showForecast={true}
            showTrend={true}
          />
        </ChartSection>
      </View>

      {/* Quick Actions */}
      <QuickActions
        actions={actions}
        title='Quick Actions'
        subtitle='Manage your mess efficiently'
        isSmallScreen={isSmallScreen}
        columns={2}
      />

      {/* Recent Activity */}
      <RecentActivity
        activities={activities}
        title='Recent Activity'
        subtitle='Latest updates from your mess'
        showViewAll={true}
        onViewAll={handleViewAllActivities}
        isSmallScreen={isSmallScreen}
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
  chartsRow: {
    flexDirection: 'row',
    gap: 16,
  },
  chartsRowSmall: {
    flexDirection: 'column',
    gap: 12,
  },
});
