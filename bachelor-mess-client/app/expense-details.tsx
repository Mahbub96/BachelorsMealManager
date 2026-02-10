import { DetailCard, MetricCard } from '@/components/DetailCard';
import { DetailPageTemplate } from '@/components/DetailPageTemplate';
import { SwappableLineChart } from '@/components/ModernCharts';
import { ThemedText } from '@/components/ThemedText';
import { Ionicons } from '@expo/vector-icons';
import type { IconName } from '@/constants/IconTypes';
import { useLocalSearchParams } from 'expo-router';
import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from 'react-native';
import statisticsService from '@/services/statisticsService';
import { useTheme } from '@/context/ThemeContext';

interface ExpenseDetailsData {
  monthlyExpenses?: number;
  monthlyData?: { month?: string; expenses?: number; revenue?: number; totalMeals?: number; budget?: number; savings?: number; meals?: number }[];
  dailyData?: { date?: string; expenses?: number; meals?: number }[];
  bazarStats?: { totalAmount?: number; totalEntries?: number };
  recentBazarEntries?: { items?: unknown[]; totalAmount?: number }[];
  budgetStatus?: string;
  averageDailyExpense?: number;
  highestExpenseDay?: string;
  lastUpdated?: string;
}

export default function ExpenseDetailsPage() {
  const params = useLocalSearchParams();
  const { theme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expenseData, setExpenseData] = useState<ExpenseDetailsData | null>(null);

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    loadExpenseData();
  }, []);

  const loadExpenseData = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔍 Loading expense data...');

      // Fetch statistics data
      const statsResponse = await statisticsService.getCompleteStatistics();
      console.log('📊 Statistics response:', statsResponse);

      if (statsResponse.success && statsResponse.data) {
        setExpenseData(statsResponse.data as unknown as ExpenseDetailsData);
        console.log('✅ Expense data loaded successfully');
      } else {
        console.error('❌ Failed to load expense data:', statsResponse.error);
        setError(statsResponse.error || 'Failed to load expense data');
      }
    } catch (error) {
      console.error('❌ Error loading expense data:', error);
      setError('Network error. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  // Parse the data from params
  const monthlyExpensesNum = Number(expenseData?.monthlyExpenses) || 0;
  const data = {
    title: (params.title as string) || 'Monthly Expenses',
    value: parseInt(params.value as string, 10) || monthlyExpensesNum,
    type: (params.type as string) || 'monthly',
    color: (params.color as string) || theme.primary,
    gradient: [(params.color as string) || theme.primary, theme.secondary] as [
      string,
      string
    ],
    details: {
      description:
        (params.description as string) ||
        'Comprehensive breakdown of all monthly expenses including groceries, utilities, and maintenance costs.',
      notes:
        (params.notes as string) ||
        'This data is updated daily and reflects current market conditions.',
    },
  };

  const monthlyData = expenseData?.monthlyData?.slice(-6) ?? [];
  const expenseTrendData = monthlyData.map((item) => ({
    month: item.month ?? '',
    expenses: Number(item.expenses) || 0,
    budget: Number(item.revenue) || 0,
    savings: (Number(item.revenue) || 0) - (Number(item.expenses) || 0),
    meals: Number(item.totalMeals) || 0,
  }));

  const dailyData = expenseData?.dailyData?.slice(-7) ?? [];
  const dailyExpenseData = dailyData.map((item) => ({
    day: item.date ? new Date(item.date).toLocaleDateString('en-US', { weekday: 'short' }) : '',
    amount: Number(item.expenses) || 0,
    meals: Number(item.meals) || 0,
  }));

  const bazarTotal = Number(expenseData?.bazarStats?.totalAmount) || 0;
  const recentBazar = expenseData?.recentBazarEntries?.slice(-5) ?? [];
  const expenseBreakdown = [
    {
      category: 'Groceries',
      amount: bazarTotal,
      percentage: 60,
      color: theme.status.success,
      icon: 'fast-food',
      subItems: recentBazar.map((bazar) => {
        const amt = Number(bazar.totalAmount) || 0;
        const itemsLabel = Array.isArray(bazar.items) ? bazar.items.slice(0, 3).join(', ') : 'Unknown items';
        return {
          name: itemsLabel,
          amount: amt,
          percentage: bazarTotal > 0 ? Math.round((amt / bazarTotal) * 100) : 0,
        };
      }),
    },
    {
      category: 'Utilities',
      amount: Math.round(monthlyExpensesNum * 0.25),
      percentage: 25,
      color: theme.status.info,
      icon: 'flash',
      subItems: [
        { name: 'Electricity', amount: Math.round(monthlyExpensesNum * 0.15), percentage: 60 },
        { name: 'Gas', amount: Math.round(monthlyExpensesNum * 0.06), percentage: 24 },
        { name: 'Water', amount: Math.round(monthlyExpensesNum * 0.04), percentage: 16 },
      ],
    },
    {
      category: 'Maintenance',
      amount: Math.round(monthlyExpensesNum * 0.15),
      percentage: 15,
      color: theme.status.warning,
      icon: 'construct',
      subItems: [
        { name: 'Repairs', amount: Math.round(monthlyExpensesNum * 0.09), percentage: 60 },
        { name: 'Cleaning', amount: Math.round(monthlyExpensesNum * 0.04), percentage: 27 },
        { name: 'Supplies', amount: Math.round(monthlyExpensesNum * 0.02), percentage: 13 },
      ],
    },
  ];

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
        <ThemedText style={[styles.loadingText, { color: theme.text.secondary }]}>
          Loading expense details...
        </ThemedText>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: theme.background }]}>
        <Ionicons name='alert-circle-outline' size={64} color={theme.status.error} />
        <ThemedText style={[styles.errorTitle, { color: theme.text.primary }]}>
          Error Loading Expenses
        </ThemedText>
        <ThemedText style={[styles.errorText, { color: theme.text.secondary }]}>
          {error}
        </ThemedText>
        <TouchableOpacity
          style={[styles.retryButton, { backgroundColor: theme.primary }]}
          onPress={loadExpenseData}
        >
          <ThemedText style={[styles.retryButtonText, { color: theme.text.inverse }]}>
            Try Again
          </ThemedText>
        </TouchableOpacity>
      </View>
    );
  }

  const formatCurrency = (amount: number) => {
    return `৳${amount.toLocaleString()}`;
  };

  const getBudgetStatusColor = (status: string) => {
    switch (status) {
      case 'under':
        return theme.status.success;
      case 'over':
        return theme.status.error;
      case 'at':
        return theme.status.warning;
      default:
        return theme.status.info;
    }
  };

  const handleCategoryPress = (category: string) => {
    console.log('📊 Category pressed:', category);
    setSelectedCategory(category);
  };

      return (
      <DetailPageTemplate
        title={data.title}
        gradientColors={data.gradient}
      >
      {/* Main Content */}
      <View style={styles.content}>
        {/* Summary Cards */}
        <View style={styles.summarySection}>
          <MetricCard
            icon="wallet"
            value={formatCurrency(data.value)}
            label="Total Expenses"
            color={data.color}
          />
          <MetricCard
            icon="checkmark-circle"
            value={String(expenseData?.budgetStatus ?? 'Under Budget')}
            label="Budget Status"
            color={getBudgetStatusColor(expenseData?.budgetStatus || 'under')}
          />
        </View>

        {/* Expense Trend Chart */}
        <DetailCard
          title="Expense Trend"
          value="Last 6 months"
          subtitle="Last 6 months expense pattern"
          icon="trending-up"
        >
          <SwappableLineChart
            monthlyRevenue={expenseTrendData.map((item) => ({
              month: item.month,
              revenue: item.expenses,
              value: item.expenses,
              details: {
                budget: item.budget,
                savings: item.savings,
                meals: item.meals,
              },
            }))}
            color={data.color}
            onPointPress={(point) => {
              console.log('📈 Chart point pressed:', point);
            }}
          />
        </DetailCard>

        {/* Daily Breakdown */}
        <DetailCard
          title="Daily Breakdown"
          value="This week"
          subtitle="This week's daily expenses"
          icon="calendar"
        >
          <View style={styles.dailyBreakdown}>
            {dailyExpenseData.map((day, index) => (
              <View key={index} style={styles.dailyItem}>
                <ThemedText style={[styles.dailyDay, { color: theme.text.primary }]}>
                  {day.day}
                </ThemedText>
                <ThemedText style={[styles.dailyAmount, { color: theme.status.success }]}>
                  {formatCurrency(day.amount)}
                </ThemedText>
                <ThemedText style={[styles.dailyMeals, { color: theme.text.secondary }]}>
                  {day.meals} meals
                </ThemedText>
              </View>
            ))}
          </View>
        </DetailCard>

        {/* Expense Categories */}
        <DetailCard
          title="Expense Categories"
          value={`${expenseBreakdown.length} categories`}
          subtitle="Breakdown by category"
          icon="pie-chart"
        >
          <View style={styles.categoriesSection}>
            {expenseBreakdown.map((category, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.categoryItem,
                  {
                    backgroundColor: theme.cardBackground,
                    borderColor: theme.border.primary,
                  },
                  selectedCategory === category.category && {
                    borderColor: category.color,
                    backgroundColor: `${category.color}10`,
                  },
                ]}
                onPress={() => handleCategoryPress(category.category)}
              >
                <View style={styles.categoryHeader}>
                  <View style={[styles.categoryIcon, { backgroundColor: category.color }]}>
                    <Ionicons name={category.icon as IconName} size={16} color="#fff" />
                  </View>
                  <View style={styles.categoryInfo}>
                    <ThemedText style={[styles.categoryName, { color: theme.text.primary }]}>
                      {category.category}
                    </ThemedText>
                    <ThemedText style={[styles.categoryAmount, { color: theme.status.success }]}>
                      {formatCurrency(category.amount)}
                    </ThemedText>
                  </View>
                  <ThemedText style={[styles.categoryPercentage, { color: theme.text.secondary }]}>
                    {category.percentage}%
                  </ThemedText>
                </View>
                {category.subItems.length > 0 && (
                  <View style={styles.subItems}>
                    {category.subItems.slice(0, 3).map((item, subIndex) => (
                      <View key={subIndex} style={styles.subItem}>
                        <ThemedText style={[styles.subItemName, { color: theme.text.secondary }]}>
                          {item.name}
                        </ThemedText>
                        <ThemedText style={[styles.subItemAmount, { color: theme.text.primary }]}>
                          {formatCurrency(Number(item.amount) || 0)}
                        </ThemedText>
                      </View>
                    ))}
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </DetailCard>

        {/* Additional Details */}
        <DetailCard
          title="Additional Details"
          value="More info"
          subtitle="More information about expenses"
          icon="information-circle"
        >
          <View style={styles.detailsSection}>
            <View style={styles.detailRow}>
              <ThemedText style={[styles.detailLabel, { color: theme.text.secondary }]}>
                Average Daily Expense
              </ThemedText>
              <ThemedText style={[styles.detailValue, { color: theme.text.primary }]}>
                {formatCurrency(Number(expenseData?.averageDailyExpense) || 0)}
              </ThemedText>
            </View>
            <View style={styles.detailRow}>
              <ThemedText style={[styles.detailLabel, { color: theme.text.secondary }]}>
                Highest Expense Day
              </ThemedText>
              <ThemedText style={[styles.detailValue, { color: theme.text.primary }]}>
                {expenseData?.highestExpenseDay ?? 'N/A'}
              </ThemedText>
            </View>
            <View style={styles.detailRow}>
              <ThemedText style={[styles.detailLabel, { color: theme.text.secondary }]}>
                Total Bazar Entries
              </ThemedText>
              <ThemedText style={[styles.detailValue, { color: theme.text.primary }]}>
                {expenseData?.bazarStats?.totalEntries ?? 0}
              </ThemedText>
            </View>
            <View style={styles.detailRow}>
              <ThemedText style={[styles.detailLabel, { color: theme.text.secondary }]}>
                Last Updated
              </ThemedText>
              <ThemedText style={[styles.detailValue, { color: theme.text.primary }]}>
                {expenseData?.lastUpdated ?? 'N/A'}
              </ThemedText>
            </View>
          </View>
        </DetailCard>
      </View>
    </DetailPageTemplate>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  summarySection: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  dailyBreakdown: {
    gap: 12,
  },
  dailyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  dailyDay: {
    fontSize: 14,
    fontWeight: '600',
  },
  dailyAmount: {
    fontSize: 14,
    fontWeight: '600',
  },
  dailyMeals: {
    fontSize: 12,
  },
  categoriesSection: {
    gap: 12,
  },
  categoryItem: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
  },
  categoryAmount: {
    fontSize: 14,
    fontWeight: '600',
  },
  categoryPercentage: {
    fontSize: 14,
    fontWeight: '600',
  },
  subItems: {
    marginTop: 8,
    gap: 4,
  },
  subItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 2,
  },
  subItemName: {
    fontSize: 12,
  },
  subItemAmount: {
    fontSize: 12,
    fontWeight: '600',
  },
  detailsSection: {
    gap: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  detailLabel: {
    fontSize: 14,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
  },
});
