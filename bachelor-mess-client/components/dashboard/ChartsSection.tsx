import React, { useState } from 'react';
import { Dimensions, StyleSheet, TouchableOpacity, View } from 'react-native';
import { BarChart, SwappableLineChart } from '../ModernCharts';
import { ThemedText } from '../ThemedText';
import { useTheme } from '@/context/ThemeContext';

const { width: screenWidth } = Dimensions.get('window');

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
  const { theme } = useTheme();
  const [selectedPeriod, setSelectedPeriod] = useState('current');

  console.log('📈 ChartsSection received data:', {
    monthlyRevenueCount: monthlyRevenue?.length || 0,
    monthlyRevenueData: monthlyRevenue,
    currentMonthRevenue,
  });

  // Generate meaningful chart data with safety checks
  const revenueChartData = ((monthlyRevenue || []).slice(-6) || []).map(
    item => ({
      date: item?.date || item?.month || 'Unknown',
      value: item?.value || item?.revenue || 0,
      forecast:
        item?.forecast ||
        Math.round((item?.value || item?.revenue || 0) * 1.05),
      details: {
        expenses: item?.expenses || 0,
        profit: item?.profit || 0,
        memberCount: item?.memberCount || 0,
      },
    })
  );

  console.log('📊 Processed revenue chart data:', revenueChartData);

  // Create meaningful expense breakdown data with safety checks
  const safeExpenses = currentMonthRevenue?.expenses || 0;
  const expenseChartData = [
    {
      label: 'Groceries',
      value: Math.round(safeExpenses * 0.6),
      forecast: Math.round(safeExpenses * 0.6 * 1.02),
      color: theme.status.error,
      gradient: theme.gradient.error as [string, string],
      trend: 'up' as const,
    },
    {
      label: 'Utilities',
      value: Math.round(safeExpenses * 0.25),
      forecast: Math.round(safeExpenses * 0.25 * 1.01),
      color: theme.status.info,
      gradient: theme.gradient.info as [string, string],
      trend: 'stable' as const,
    },
    {
      label: 'Maintenance',
      value: Math.round(safeExpenses * 0.15),
      forecast: Math.round(safeExpenses * 0.15 * 1.03),
      color: theme.status.warning,
      gradient: theme.gradient.warning as [string, string],
      trend: 'down' as const,
    },
  ];

  // Generate meal consumption data from API data or show empty state
  const mealChartData =
    monthlyRevenue && monthlyRevenue.length > 0
      ? monthlyRevenue.slice(-7).map((item, index) => {
          const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
          const value = item?.meals?.total || 0;
          const forecast = Math.round(value * 1.05); // Simple forecast
          const trend =
            value > (monthlyRevenue[index - 1]?.meals?.total || 0)
              ? 'up'
              : value < (monthlyRevenue[index - 1]?.meals?.total || 0)
              ? 'down'
              : 'stable';

          return {
            label: days[index] || `Day ${index + 1}`,
            value,
            forecast,
            color: theme.status.success,
            gradient: theme.gradient.success as [string, string],
            trend: trend as const,
          };
        })
      : [
          {
            label: 'No Data',
            value: 0,
            color: theme.text.tertiary,
            gradient: [theme.text.tertiary, theme.text.tertiary] as [
              string,
              string
            ],
            trend: 'stable' as 'up' | 'down' | 'stable',
          },
        ];

  const handlePeriodChange = (period: string) => {
    setSelectedPeriod(period);
  };

  return (
    <View style={styles.container}>
      {/* Period Selector */}
      <View style={styles.periodSelector}>
        <TouchableOpacity
          style={[
            styles.periodButton,
            {
              backgroundColor:
                selectedPeriod === 'current' ? theme.primary : theme.surface,
              borderColor: theme.border.primary,
            },
          ]}
          onPress={() => handlePeriodChange('current')}
        >
          <ThemedText
            style={[
              styles.periodButtonText,
              {
                color:
                  selectedPeriod === 'current'
                    ? theme.text.inverse
                    : theme.text.primary,
              },
            ]}
          >
            Current Month
          </ThemedText>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.periodButton,
            {
              backgroundColor:
                selectedPeriod === 'previous' ? theme.primary : theme.surface,
              borderColor: theme.border.primary,
            },
          ]}
          onPress={() => handlePeriodChange('previous')}
        >
          <ThemedText
            style={[
              styles.periodButtonText,
              {
                color:
                  selectedPeriod === 'previous'
                    ? theme.text.inverse
                    : theme.text.primary,
              },
            ]}
          >
            Previous Month
          </ThemedText>
        </TouchableOpacity>
      </View>

      {/* Charts Grid */}
      <View style={styles.chartsGrid}>
        {/* Revenue Chart */}
        <View style={styles.chartContainer}>
          <SwappableLineChart
            monthlyRevenue={revenueChartData}
            title='Monthly Revenue'
            color={theme.primary}
            showForecast={true}
            showTrend={true}
          />
        </View>

        {/* Expense Breakdown */}
        <View style={styles.chartContainer}>
          <BarChart
            data={expenseChartData}
            title='Expense Breakdown'
            height={200}
            showForecast={true}
            showTrend={true}
          />
        </View>

        {/* Meal Consumption */}
        <View style={styles.chartContainer}>
          <BarChart
            data={mealChartData}
            title='Weekly Meal Consumption'
            height={200}
            showForecast={false}
            showTrend={true}
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  periodSelector: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 8,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  periodButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  chartsGrid: {
    gap: 16,
  },
  chartContainer: {
    marginBottom: 16,
  },
});
