import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
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
  const { theme } = useTheme();
  const onPrimaryText = theme.onPrimary?.text ?? theme.text.inverse;
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
    <View style={[styles.statCard, { shadowColor: theme.shadow.light }]}>
      <LinearGradient colors={colors} style={styles.statGradient}>
        <Ionicons name={icon as IconName} size={24} color={onPrimaryText} />
        <ThemedText style={[styles.statValue, { color: onPrimaryText }]}>{value}</ThemedText>
        <ThemedText style={[styles.statTitle, { color: onPrimaryText }]}>{title}</ThemedText>
        {subtitle && (
          <ThemedText style={[styles.statSubtitle, { color: theme.onPrimary?.overlay ?? onPrimaryText }]}>{subtitle}</ThemedText>
        )}
      </LinearGradient>
    </View>
  );

  const renderMealTypeBreakdown = () => (
    <View style={styles.breakdownContainer}>
      <ThemedText style={[styles.sectionTitle, { color: theme.text.primary }]}>Meal Type Breakdown</ThemedText>
      <View style={[styles.breakdownGrid, { backgroundColor: theme.surface, shadowColor: theme.shadow.light }]}>
        <View style={[styles.breakdownItem, { borderBottomColor: theme.border.secondary }]}>
          <View style={[styles.breakdownIcon, { backgroundColor: theme.status.warning }]}>
            <Ionicons name='sunny' size={20} color={onPrimaryText} />
          </View>
          <View style={styles.breakdownContent}>
            <ThemedText style={[styles.breakdownLabel, { color: theme.text.primary }]}>Breakfast</ThemedText>
            <ThemedText style={[styles.breakdownValue, { color: theme.text.secondary }]}>
              {analytics.breakfastCount} meals
            </ThemedText>
          </View>
        </View>

        <View style={[styles.breakdownItem, { borderBottomColor: theme.border.secondary }]}>
          <View style={[styles.breakdownIcon, { backgroundColor: theme.status.warning }]}>
            <Ionicons name='sunny' size={20} color={onPrimaryText} />
          </View>
          <View style={styles.breakdownContent}>
            <ThemedText style={[styles.breakdownLabel, { color: theme.text.primary }]}>Lunch</ThemedText>
            <ThemedText style={[styles.breakdownValue, { color: theme.text.secondary }]}>
              {analytics.lunchCount} meals
            </ThemedText>
          </View>
        </View>

        <View style={[styles.breakdownItem, { borderBottomColor: theme.border.secondary }]}>
          <View style={[styles.breakdownIcon, { backgroundColor: theme.status.pending }]}>
            <Ionicons name='moon' size={20} color={onPrimaryText} />
          </View>
          <View style={styles.breakdownContent}>
            <ThemedText style={[styles.breakdownLabel, { color: theme.text.primary }]}>Dinner</ThemedText>
            <ThemedText style={[styles.breakdownValue, { color: theme.text.secondary }]}>
              {analytics.dinnerCount} meals
            </ThemedText>
          </View>
        </View>
      </View>
    </View>
  );

  const renderStatusBreakdown = () => (
    <View style={styles.breakdownContainer}>
      <ThemedText style={[styles.sectionTitle, { color: theme.text.primary }]}>Status Breakdown</ThemedText>
      <View style={[styles.statusGrid, { backgroundColor: theme.surface, shadowColor: theme.shadow.light }]}>
        <View style={styles.statusItem}>
          <View style={[styles.statusIndicator, { backgroundColor: theme.status.warning }]} />
          <ThemedText style={[styles.statusLabel, { color: theme.text.secondary }]}>Pending</ThemedText>
          <ThemedText style={[styles.statusValue, { color: theme.text.primary }]}>{analytics.pendingMeals}</ThemedText>
        </View>
        <View style={styles.statusItem}>
          <View style={[styles.statusIndicator, { backgroundColor: theme.status.success }]} />
          <ThemedText style={[styles.statusLabel, { color: theme.text.secondary }]}>Approved</ThemedText>
          <ThemedText style={[styles.statusValue, { color: theme.text.primary }]}>{analytics.approvedMeals}</ThemedText>
        </View>
        <View style={styles.statusItem}>
          <View style={[styles.statusIndicator, { backgroundColor: theme.status.error }]} />
          <ThemedText style={[styles.statusLabel, { color: theme.text.secondary }]}>Rejected</ThemedText>
          <ThemedText style={[styles.statusValue, { color: theme.text.primary }]}>{analytics.rejectedMeals}</ThemedText>
        </View>
      </View>
    </View>
  );

  const renderAdvancedMetrics = () => {
    if (userRole !== 'admin' && userRole !== 'super_admin') return null;

    return (
      <View style={styles.advancedContainer}>
        <ThemedText style={[styles.sectionTitle, { color: theme.text.primary }]}>Advanced Metrics</ThemedText>
        <View style={styles.metricsGrid}>
          <View style={[styles.metricCard, { backgroundColor: theme.surface, shadowColor: theme.shadow.light }]}>
            <ThemedText style={[styles.metricTitle, { color: theme.text.secondary }]}>Avg Meals/Day</ThemedText>
            <ThemedText style={[styles.metricValue, { color: theme.text.primary }]}>{analytics.avgMealsPerDay.toFixed(1)}</ThemedText>
          </View>
          <View style={[styles.metricCard, { backgroundColor: theme.surface, shadowColor: theme.shadow.light }]}>
            <ThemedText style={[styles.metricTitle, { color: theme.text.secondary }]}>Approval Rate</ThemedText>
            <ThemedText style={[styles.metricValue, { color: theme.text.primary }]}>
              {analytics.totalMeals > 0 ? `${((analytics.approvedMeals / analytics.totalMeals) * 100).toFixed(1)}%` : '0%'}
            </ThemedText>
          </View>
          <View style={[styles.metricCard, { backgroundColor: theme.surface, shadowColor: theme.shadow.light }]}>
            <ThemedText style={[styles.metricTitle, { color: theme.text.secondary }]}>Pending Rate</ThemedText>
            <ThemedText style={[styles.metricValue, { color: theme.text.primary }]}>
              {analytics.totalMeals > 0 ? `${((analytics.pendingMeals / analytics.totalMeals) * 100).toFixed(1)}%` : '0%'}
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
        {renderStatCard('Total Meals', analytics.totalMeals, 'fast-food', theme.gradient.primary as [string, string])}
        {renderStatCard(
          'Pending',
          analytics.pendingMeals,
          'time',
          theme.gradient.warning as [string, string],
          'Awaiting approval'
        )}
        {renderStatCard(
          'Approved',
          analytics.approvedMeals,
          'checkmark-circle',
          theme.gradient.success as [string, string]
        )}
        {renderStatCard('Rejected', analytics.rejectedMeals, 'close-circle', theme.gradient.error as [string, string])}
      </View>

      {/* Meal Type Breakdown */}
      {renderMealTypeBreakdown()}

      {/* Status Breakdown */}
      {renderStatusBreakdown()}

      {/* Advanced Metrics for Admin/Super Admin */}
      {renderAdvancedMetrics()}

      <View style={styles.insightsContainer}>
        <ThemedText style={[styles.sectionTitle, { color: theme.text.primary }]}>Quick Insights</ThemedText>
        <View style={[styles.insightsList, { backgroundColor: theme.surface, shadowColor: theme.shadow.light }]}>
          <View style={[styles.insightItem, { borderBottomColor: theme.border.secondary }]}>
            <Ionicons name='trending-up' size={16} color={theme.status.success} />
            <ThemedText style={[styles.insightText, { color: theme.text.primary }]}>
              {analytics.approvedMeals > analytics.rejectedMeals
                ? 'High approval rate indicates good meal quality'
                : 'Consider reviewing meal standards'}
            </ThemedText>
          </View>

          <View style={[styles.insightItem, { borderBottomColor: theme.border.secondary }]}>
            <Ionicons name='alert-circle' size={16} color={theme.status.warning} />
            <ThemedText style={[styles.insightText, { color: theme.text.primary }]}>
              {analytics.pendingMeals > 0
                ? `${analytics.pendingMeals} meals awaiting approval`
                : 'All meals have been processed'}
            </ThemedText>
          </View>

          <View style={[styles.insightItem, { borderBottomColor: theme.border.secondary }]}>
            <Ionicons name='analytics' size={16} color={theme.primary} />
            <ThemedText style={[styles.insightText, { color: theme.text.primary }]}>
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
    marginTop: 8,
    marginBottom: 4,
  },
  statTitle: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  statSubtitle: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
  },
  breakdownContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  breakdownGrid: {
    borderRadius: 12,
    padding: 16,
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
  },
  breakdownValue: {
    fontSize: 14,
    marginTop: 2,
  },
  statusGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderRadius: 12,
    padding: 16,
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
    marginBottom: 4,
  },
  statusValue: {
    fontSize: 18,
    fontWeight: 'bold',
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
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 4,
    alignItems: 'center',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  metricTitle: {
    fontSize: 12,
    marginBottom: 8,
    textAlign: 'center',
  },
  metricValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  insightsContainer: {
    marginBottom: 24,
  },
  insightsList: {
    borderRadius: 12,
    padding: 16,
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
  },
  insightText: {
    fontSize: 14,
    marginLeft: 12,
    flex: 1,
  },
});
