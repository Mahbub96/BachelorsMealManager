import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import type { IconName } from '@/constants/IconTypes';
import { ThemedText } from '../ThemedText';
import { MealEntry } from '../../services/mealService';

interface MealAnalyticsProps {
  meals: MealEntry[];
  mealStats: Record<string, unknown>;
  userRole: 'admin' | 'member' | 'super_admin';
}

export const MealAnalytics: React.FC<MealAnalyticsProps> = ({
  meals,
  mealStats,
  userRole,
}) => {
  // Calculate additional analytics
  const calculateAnalytics = () => {
    // Count individual meals (breakfast + lunch + dinner), not just entries
    const totalMeals = meals.reduce((sum, meal) => {
      return sum + (meal.breakfast ? 1 : 0) + (meal.lunch ? 1 : 0) + (meal.dinner ? 1 : 0);
    }, 0);
    const totalEntries = meals.length; // Number of meal entry documents
    const pendingMeals = meals.filter(m => m.status === 'pending').length;
    const approvedMeals = meals.filter(m => m.status === 'approved').length;
    const rejectedMeals = meals.filter(m => m.status === 'rejected').length;

    const breakfastCount = meals.filter(m => m.breakfast).length;
    const lunchCount = meals.filter(m => m.lunch).length;
    const dinnerCount = meals.filter(m => m.dinner).length;

    const avgMealsPerDay =
      totalEntries > 0
        ? totalMeals / totalEntries
        : 0;

    return {
      totalMeals,
      pendingMeals,
      approvedMeals,
      rejectedMeals,
      breakfastCount,
      lunchCount,
      dinnerCount,
      avgMealsPerDay,
    };
  };

  const analytics = calculateAnalytics();

  const renderStatCard = (
    title: string,
    value: string | number,
    icon: string,
    colors: [string, string],
    subtitle?: string
  ) => (
    <View style={styles.statCard}>
      <LinearGradient colors={colors} style={styles.statGradient}>
        <Ionicons name={icon as IconName} size={24} color='#fff' />
        <ThemedText style={styles.statValue}>{value}</ThemedText>
        <ThemedText style={styles.statTitle}>{title}</ThemedText>
        {subtitle && (
          <ThemedText style={styles.statSubtitle}>{subtitle}</ThemedText>
        )}
      </LinearGradient>
    </View>
  );

  const renderMealTypeBreakdown = () => (
    <View style={styles.breakdownContainer}>
      <ThemedText style={styles.sectionTitle}>Meal Type Breakdown</ThemedText>
      <View style={styles.breakdownGrid}>
        <View style={styles.breakdownItem}>
          <View style={[styles.breakdownIcon, { backgroundColor: '#fbbf24' }]}>
            <Ionicons name='sunny' size={20} color='#fff' />
          </View>
          <View style={styles.breakdownContent}>
            <ThemedText style={styles.breakdownLabel}>Breakfast</ThemedText>
            <ThemedText style={styles.breakdownValue}>
              {analytics.breakfastCount} meals
            </ThemedText>
          </View>
        </View>

        <View style={styles.breakdownItem}>
          <View style={[styles.breakdownIcon, { backgroundColor: '#f59e0b' }]}>
            <Ionicons name='sunny' size={20} color='#fff' />
          </View>
          <View style={styles.breakdownContent}>
            <ThemedText style={styles.breakdownLabel}>Lunch</ThemedText>
            <ThemedText style={styles.breakdownValue}>
              {analytics.lunchCount} meals
            </ThemedText>
          </View>
        </View>

        <View style={styles.breakdownItem}>
          <View style={[styles.breakdownIcon, { backgroundColor: '#7c3aed' }]}>
            <Ionicons name='moon' size={20} color='#fff' />
          </View>
          <View style={styles.breakdownContent}>
            <ThemedText style={styles.breakdownLabel}>Dinner</ThemedText>
            <ThemedText style={styles.breakdownValue}>
              {analytics.dinnerCount} meals
            </ThemedText>
          </View>
        </View>
      </View>
    </View>
  );

  const renderStatusBreakdown = () => (
    <View style={styles.breakdownContainer}>
      <ThemedText style={styles.sectionTitle}>Status Breakdown</ThemedText>
      <View style={styles.statusGrid}>
        <View style={styles.statusItem}>
          <View
            style={[styles.statusIndicator, { backgroundColor: '#f59e0b' }]}
          />
          <ThemedText style={styles.statusLabel}>Pending</ThemedText>
          <ThemedText style={styles.statusValue}>
            {analytics.pendingMeals}
          </ThemedText>
        </View>

        <View style={styles.statusItem}>
          <View
            style={[styles.statusIndicator, { backgroundColor: '#10b981' }]}
          />
          <ThemedText style={styles.statusLabel}>Approved</ThemedText>
          <ThemedText style={styles.statusValue}>
            {analytics.approvedMeals}
          </ThemedText>
        </View>

        <View style={styles.statusItem}>
          <View
            style={[styles.statusIndicator, { backgroundColor: '#ef4444' }]}
          />
          <ThemedText style={styles.statusLabel}>Rejected</ThemedText>
          <ThemedText style={styles.statusValue}>
            {analytics.rejectedMeals}
          </ThemedText>
        </View>
      </View>
    </View>
  );

  const renderAdvancedMetrics = () => {
    if (userRole !== 'admin' && userRole !== 'super_admin') return null;

    return (
      <View style={styles.advancedContainer}>
        <ThemedText style={styles.sectionTitle}>Advanced Metrics</ThemedText>
        <View style={styles.metricsGrid}>
          <View style={styles.metricCard}>
            <ThemedText style={styles.metricTitle}>Avg Meals/Day</ThemedText>
            <ThemedText style={styles.metricValue}>
              {analytics.avgMealsPerDay.toFixed(1)}
            </ThemedText>
          </View>

          <View style={styles.metricCard}>
            <ThemedText style={styles.metricTitle}>Approval Rate</ThemedText>
            <ThemedText style={styles.metricValue}>
              {analytics.totalMeals > 0
                ? `${(
                    (analytics.approvedMeals / analytics.totalMeals) *
                    100
                  ).toFixed(1)}%`
                : '0%'}
            </ThemedText>
          </View>

          <View style={styles.metricCard}>
            <ThemedText style={styles.metricTitle}>Pending Rate</ThemedText>
            <ThemedText style={styles.metricValue}>
              {analytics.totalMeals > 0
                ? `${(
                    (analytics.pendingMeals / analytics.totalMeals) *
                    100
                  ).toFixed(1)}%`
                : '0%'}
            </ThemedText>
          </View>
        </View>
      </View>
    );
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Main Stats */}
      <View style={styles.statsGrid}>
        {renderStatCard('Total Meals', analytics.totalMeals, 'fast-food', [
          '#667eea',
          '#764ba2',
        ])}

        {renderStatCard(
          'Pending',
          analytics.pendingMeals,
          'time',
          ['#f59e0b', '#d97706'],
          'Awaiting approval'
        )}

        {renderStatCard(
          'Approved',
          analytics.approvedMeals,
          'checkmark-circle',
          ['#10b981', '#059669']
        )}

        {renderStatCard('Rejected', analytics.rejectedMeals, 'close-circle', [
          '#ef4444',
          '#dc2626',
        ])}
      </View>

      {/* Meal Type Breakdown */}
      {renderMealTypeBreakdown()}

      {/* Status Breakdown */}
      {renderStatusBreakdown()}

      {/* Advanced Metrics for Admin/Super Admin */}
      {renderAdvancedMetrics()}

      {/* Quick Insights */}
      <View style={styles.insightsContainer}>
        <ThemedText style={styles.sectionTitle}>Quick Insights</ThemedText>
        <View style={styles.insightsList}>
          <View style={styles.insightItem}>
            <Ionicons name='trending-up' size={16} color='#10b981' />
            <ThemedText style={styles.insightText}>
              {analytics.approvedMeals > analytics.rejectedMeals
                ? 'High approval rate indicates good meal quality'
                : 'Consider reviewing meal standards'}
            </ThemedText>
          </View>

          <View style={styles.insightItem}>
            <Ionicons name='alert-circle' size={16} color='#f59e0b' />
            <ThemedText style={styles.insightText}>
              {analytics.pendingMeals > 0
                ? `${analytics.pendingMeals} meals awaiting approval`
                : 'All meals have been processed'}
            </ThemedText>
          </View>

          <View style={styles.insightItem}>
            <Ionicons name='analytics' size={16} color='#667eea' />
            <ThemedText style={styles.insightText}>
              Average {analytics.avgMealsPerDay.toFixed(1)} meals per entry
            </ThemedText>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statCard: {
    width: '48%',
    marginBottom: 12,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  statGradient: {
    padding: 20,
    alignItems: 'center',
    minHeight: 100,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 8,
    marginBottom: 4,
  },
  statTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
  },
  statSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginTop: 4,
  },
  breakdownContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  breakdownGrid: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  breakdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  breakdownIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  breakdownContent: {
    flex: 1,
  },
  breakdownLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  breakdownValue: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  statusGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statusItem: {
    alignItems: 'center',
    flex: 1,
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginBottom: 8,
  },
  statusLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  statusValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  advancedContainer: {
    marginBottom: 24,
  },
  metricsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 4,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  metricTitle: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 8,
    textAlign: 'center',
  },
  metricValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  insightsContainer: {
    marginBottom: 24,
  },
  insightsList: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  insightItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  insightText: {
    fontSize: 14,
    color: '#374151',
    marginLeft: 12,
    flex: 1,
  },
});
