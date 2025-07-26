import React, { useState } from 'react';
import { Dimensions, StyleSheet, TouchableOpacity, View } from 'react-native';
import { BarChart, SwappableLineChart } from '../ModernCharts';
import { ThemedText } from '../ThemedText';
import { useTheme } from '@/context/ThemeContext';

const { width: screenWidth } = Dimensions.get('window');

interface ChartsSectionProps {
  monthlyRevenue: any[];
  currentMonthRevenue: any;
  expenseBreakdown: any[];
  weeklyMeals: any[];
  isTablet?: boolean;
}

export const ChartsSection: React.FC<ChartsSectionProps> = ({
  monthlyRevenue,
  currentMonthRevenue,
  expenseBreakdown,
  weeklyMeals,
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

  // Create expense breakdown data from API with theme colors
  const expenseChartData = (expenseBreakdown || []).map((item, index) => {
    const colors = [
      theme.status.error,
      theme.status.info,
      theme.status.warning,
      theme.status.success,
    ];
    const gradients = [
      theme.gradient.error,
      theme.gradient.info,
      theme.gradient.warning,
      theme.gradient.success,
    ];

    return {
      label: item.label || `Category ${index + 1}`,
      value: item.value || 0,
      forecast: item.forecast || 0,
      color: colors[index % colors.length],
      gradient: gradients[index % gradients.length] as [string, string],
      trend: item.trend || 'stable',
    };
  });

  // Create meal chart data from API with theme colors
  const mealChartData = (weeklyMeals || []).map((item, index) => {
    const colors = [
      theme.status.success,
      theme.status.info,
      theme.status.warning,
      theme.status.error,
      theme.primary,
      theme.secondary,
      theme.accent,
    ];
    const gradients = [
      theme.gradient.success,
      theme.gradient.info,
      theme.gradient.warning,
      theme.gradient.error,
      theme.gradient.primary,
      theme.gradient.secondary,
      theme.gradient.accent,
    ];

    return {
      label: item.label || `Day ${index + 1}`,
      value: item.value || 0,
      forecast: item.forecast || 0,
      color: colors[index % colors.length],
      gradient: gradients[index % gradients.length] as [string, string],
      trend: item.trend || 'stable',
    };
  });

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
