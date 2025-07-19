import React, { useState } from 'react';
import { Dimensions, StyleSheet, TouchableOpacity, View } from 'react-native';
import { BarChart, SwappableLineChart } from '../ModernCharts';
import { ThemedText } from '../ThemedText';

const { width: screenWidth } = Dimensions.get('window');

const DESIGN_SYSTEM = {
  colors: {
    primary: '#667eea',
    secondary: '#764ba2',
    danger: '#ef4444',
    success: '#10b981',
    dark: '#1f2937',
    gray: {
      100: '#f3f4f6',
      200: '#e5e7eb',
      500: '#6b7280',
      600: '#4b5563',
    },
  },
  spacing: {
    xs: 6,
    sm: 12,
    md: 16,
    lg: 20,
    xl: 24,
  },
  borderRadius: {
    xs: 8,
    lg: 20,
  },
  fontSize: {
    lg: 18,
    sm: 14,
    xs: 12,
  },
  shadows: {
    medium: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.12,
      shadowRadius: 12,
      elevation: 8,
    },
  },
};

interface ChartsSectionProps {
  monthlyRevenue: any[];
  currentMonthRevenue: any;
  isTablet?: boolean;
}

export const ChartsSection: React.FC<ChartsSectionProps> = ({
  monthlyRevenue,
  currentMonthRevenue,
  isTablet = false,
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState('current');

  // Generate meaningful chart data with safety checks
  const revenueChartData = (monthlyRevenue || []).slice(-6).map(item => ({
    date: item?.month || 'Unknown',
    value: item?.revenue || 0,
    forecast: Math.round((item?.revenue || 0) * 1.05),
    details: {
      expenses: item?.expenses || 0,
      profit: item?.profit || 0,
      memberCount: item?.memberCount || 0,
    },
  }));

  // Create meaningful expense breakdown data with safety checks
  const safeExpenses = currentMonthRevenue?.expenses || 0;
  const expenseChartData = [
    {
      label: 'Groceries',
      value: Math.round(safeExpenses * 0.6),
      forecast: Math.round(safeExpenses * 0.6 * 1.02),
      color: DESIGN_SYSTEM.colors.danger,
      gradient: [DESIGN_SYSTEM.colors.danger, '#dc2626'] as [string, string],
      trend: 'up' as const,
    },
    {
      label: 'Utilities',
      value: Math.round(safeExpenses * 0.25),
      forecast: Math.round(safeExpenses * 0.25 * 1.01),
      color: '#6366f1',
      gradient: ['#6366f1', '#4f46e5'] as [string, string],
      trend: 'stable' as const,
    },
    {
      label: 'Maintenance',
      value: Math.round(safeExpenses * 0.15),
      forecast: Math.round(safeExpenses * 0.15 * 1.03),
      color: '#f59e0b',
      gradient: ['#f59e0b', '#d97706'] as [string, string],
      trend: 'down' as const,
    },
  ];

  // Create meaningful meal consumption data by day of week
  const mealChartData = [
    {
      label: 'Mon',
      value: 45,
      forecast: 48,
      color: DESIGN_SYSTEM.colors.success,
      gradient: [DESIGN_SYSTEM.colors.success, '#059669'] as [string, string],
      trend: 'up' as const,
    },
    {
      label: 'Tue',
      value: 42,
      forecast: 44,
      color: DESIGN_SYSTEM.colors.success,
      gradient: [DESIGN_SYSTEM.colors.success, '#059669'] as [string, string],
      trend: 'stable' as const,
    },
    {
      label: 'Wed',
      value: 48,
      forecast: 50,
      color: DESIGN_SYSTEM.colors.success,
      gradient: [DESIGN_SYSTEM.colors.success, '#059669'] as [string, string],
      trend: 'up' as const,
    },
    {
      label: 'Thu',
      value: 40,
      forecast: 42,
      color: DESIGN_SYSTEM.colors.success,
      gradient: [DESIGN_SYSTEM.colors.success, '#059669'] as [string, string],
      trend: 'down' as const,
    },
    {
      label: 'Fri',
      value: 52,
      forecast: 55,
      color: DESIGN_SYSTEM.colors.success,
      gradient: [DESIGN_SYSTEM.colors.success, '#059669'] as [string, string],
      trend: 'up' as const,
    },
    {
      label: 'Sat',
      value: 38,
      forecast: 40,
      color: DESIGN_SYSTEM.colors.success,
      gradient: [DESIGN_SYSTEM.colors.success, '#059669'] as [string, string],
      trend: 'stable' as const,
    },
    {
      label: 'Sun',
      value: 35,
      forecast: 37,
      color: DESIGN_SYSTEM.colors.success,
      gradient: [DESIGN_SYSTEM.colors.success, '#059669'] as [string, string],
      trend: 'down' as const,
    },
  ];

  return (
    <View style={styles.chartsSection}>
      {/* Revenue Trend Chart */}
      <View style={styles.chartCard}>
        <View style={styles.chartHeader}>
          <View style={styles.chartTitleContainer}>
            <ThemedText style={styles.chartTitle}>Revenue Trend</ThemedText>
            <ThemedText style={styles.chartSubtitle}>
              Monthly revenue performance
            </ThemedText>
          </View>
          <View style={styles.chartActions}>
            <TouchableOpacity
              style={[
                styles.periodButton,
                selectedPeriod === 'current' && styles.periodButtonActive,
              ]}
              onPress={() => setSelectedPeriod('current')}
            >
              <ThemedText
                style={[
                  styles.periodButtonText,
                  selectedPeriod === 'current' && styles.periodButtonTextActive,
                ]}
              >
                Current
              </ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.periodButton,
                selectedPeriod === 'forecast' && styles.periodButtonActive,
              ]}
              onPress={() => setSelectedPeriod('forecast')}
            >
              <ThemedText
                style={[
                  styles.periodButtonText,
                  selectedPeriod === 'forecast' &&
                    styles.periodButtonTextActive,
                ]}
              >
                Forecast
              </ThemedText>
            </TouchableOpacity>
          </View>
        </View>
        <SwappableLineChart
          monthlyRevenue={(monthlyRevenue || []).slice(-6)}
          title=''
          color={DESIGN_SYSTEM.colors.primary}
          showForecast={selectedPeriod === 'forecast'}
          showTrend={true}
        />
      </View>

      {/* Charts - Stack vertically on mobile, side-by-side on tablet */}
      <View
        style={[
          styles.chartsRow,
          isTablet ? styles.chartsRowTablet : styles.chartsRowMobile,
        ]}
      >
        {/* Expenses Chart */}
        <View
          style={[
            styles.chartCard,
            isTablet ? styles.halfWidth : styles.fullWidth,
          ]}
        >
          <View style={styles.chartTitleContainer}>
            <ThemedText style={styles.chartTitle}>Expense Breakdown</ThemedText>
            <ThemedText style={styles.chartSubtitle}>
              This month&apos;s spending
            </ThemedText>
          </View>
          <BarChart
            data={expenseChartData}
            title=''
            height={isTablet ? 220 : 160}
            showForecast={true}
            showTrend={true}
          />
        </View>

        {/* Meals Chart */}
        <View
          style={[
            styles.chartCard,
            isTablet ? styles.halfWidth : styles.fullWidth,
          ]}
        >
          <View style={styles.chartTitleContainer}>
            <ThemedText style={styles.chartTitle}>Weekly Meals</ThemedText>
            <ThemedText style={styles.chartSubtitle}>
              Daily meal consumption
            </ThemedText>
          </View>
          <BarChart
            data={mealChartData}
            title=''
            height={isTablet ? 220 : 160}
            showForecast={true}
            showTrend={true}
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  chartsSection: {
    marginBottom: DESIGN_SYSTEM.spacing.xl,
  },
  chartCard: {
    backgroundColor: '#fff',
    borderRadius: DESIGN_SYSTEM.borderRadius.lg,
    padding: DESIGN_SYSTEM.spacing.lg,
    ...DESIGN_SYSTEM.shadows.medium,
    borderWidth: 1,
    borderColor: DESIGN_SYSTEM.colors.gray[100],
    marginBottom: DESIGN_SYSTEM.spacing.lg,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: DESIGN_SYSTEM.spacing.lg,
  },
  chartTitleContainer: {
    flex: 1,
  },
  chartTitle: {
    fontSize: DESIGN_SYSTEM.fontSize.lg,
    fontWeight: 'bold',
    color: DESIGN_SYSTEM.colors.dark,
    marginBottom: DESIGN_SYSTEM.spacing.xs,
  },
  chartSubtitle: {
    fontSize: DESIGN_SYSTEM.fontSize.sm,
    color: DESIGN_SYSTEM.colors.gray[500],
  },
  chartActions: {
    flexDirection: 'row',
    gap: DESIGN_SYSTEM.spacing.xs,
  },
  periodButton: {
    paddingHorizontal: DESIGN_SYSTEM.spacing.md,
    paddingVertical: DESIGN_SYSTEM.spacing.sm,
    borderRadius: DESIGN_SYSTEM.borderRadius.xs,
    backgroundColor: DESIGN_SYSTEM.colors.gray[100],
    borderWidth: 1,
    borderColor: DESIGN_SYSTEM.colors.gray[200],
  },
  periodButtonActive: {
    backgroundColor: DESIGN_SYSTEM.colors.primary,
    borderColor: DESIGN_SYSTEM.colors.primary,
  },
  periodButtonText: {
    fontSize: DESIGN_SYSTEM.fontSize.sm,
    color: DESIGN_SYSTEM.colors.gray[600],
    fontWeight: '600',
  },
  periodButtonTextActive: {
    color: '#fff',
  },
  chartsRow: {
    gap: DESIGN_SYSTEM.spacing.lg,
  },
  chartsRowMobile: {
    flexDirection: 'column',
  },
  chartsRowTablet: {
    flexDirection: 'row',
  },
  halfWidth: {
    flex: 1,
  },
  fullWidth: {
    width: '100%',
  },
});
