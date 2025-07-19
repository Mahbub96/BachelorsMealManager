import { DetailCard, MetricCard } from "@/components/DetailCard";
import { DetailPageTemplate } from "@/components/DetailPageTemplate";
import { SwappableLineChart } from "@/components/ModernCharts";
import { ThemedText } from "@/components/ThemedText";
import { useMessData } from "@/context/MessDataContext";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Dimensions,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

const { width: screenWidth } = Dimensions.get("window");

const DESIGN_SYSTEM = {
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    xxxl: 32,
  },
  borderRadius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
  },
  shadows: {
    small: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
    },
  },
};

export default function ExpenseDetailsPage() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const {
    monthlyRevenue,
    currentMonthRevenue,
    members,
    mealEntries,
    bazarEntries,
    quickStats,
  } = useMessData();

  const [selectedPeriod, setSelectedPeriod] = useState("current");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Parse the data from params
  const data = {
    title: (params.title as string) || "Monthly Expenses",
    value: parseInt(params.value as string) || currentMonthRevenue.expenses,
    type: (params.type as string) || "monthly",
    color: (params.color as string) || "#667eea",
    gradient: [(params.color as string) || "#667eea", "#764ba2"] as [
      string,
      string
    ],
    details: {
      description:
        (params.description as string) ||
        "Comprehensive breakdown of all monthly expenses including groceries, utilities, and maintenance costs.",
      notes:
        (params.notes as string) ||
        "This data is updated daily and reflects current market conditions.",
    },
  };

  // Generate chart data from context
  const expenseTrendData = monthlyRevenue.slice(-6).map((item) => ({
    month: item.month,
    expenses: item.expenses,
    budget: item.revenue,
    savings: item.revenue - item.expenses,
    meals: Math.round(item.averageMeals * item.memberCount * 30),
  }));

  // Generate daily expense data from meal entries
  const dailyExpenseData = (mealEntries || []).slice(-7).map((meal, index) => ({
    day: new Date(meal.date).toLocaleDateString("en-US", { weekday: "short" }),
    amount: meal.cost,
    meals:
      (meal.breakfast ? 1 : 0) + (meal.lunch ? 1 : 0) + (meal.dinner ? 1 : 0),
  }));

  // Generate expense breakdown from bazar entries
  const expenseBreakdown = [
    {
      category: "Groceries",
      amount: (bazarEntries || []).reduce(
        (sum, bazar) => sum + bazar.totalAmount,
        0
      ),
      percentage: 60,
      color: "#10b981",
      icon: "fast-food",
      subItems: (bazarEntries || []).slice(-5).map((bazar) => ({
        name: bazar.items.slice(0, 3).join(", "),
        amount: bazar.totalAmount,
        percentage: Math.round(
          (bazar.totalAmount /
            (bazarEntries || []).reduce((sum, b) => sum + b.totalAmount, 0)) *
            100
        ),
      })),
    },
    {
      category: "Utilities",
      amount: Math.round(currentMonthRevenue.expenses * 0.25),
      percentage: 25,
      color: "#6366f1",
      icon: "flash",
      subItems: [
        {
          name: "Electricity",
          amount: Math.round(currentMonthRevenue.expenses * 0.15),
          percentage: 60,
        },
        {
          name: "Gas",
          amount: Math.round(currentMonthRevenue.expenses * 0.06),
          percentage: 24,
        },
        {
          name: "Water",
          amount: Math.round(currentMonthRevenue.expenses * 0.04),
          percentage: 16,
        },
      ],
    },
    {
      category: "Maintenance",
      amount: Math.round(currentMonthRevenue.expenses * 0.15),
      percentage: 15,
      color: "#f59e0b",
      icon: "construct",
      subItems: [
        {
          name: "Kitchen Equipment",
          amount: Math.round(currentMonthRevenue.expenses * 0.08),
          percentage: 53,
        },
        {
          name: "Cleaning Supplies",
          amount: Math.round(currentMonthRevenue.expenses * 0.04),
          percentage: 27,
        },
        {
          name: "Repairs",
          amount: Math.round(currentMonthRevenue.expenses * 0.03),
          percentage: 20,
        },
      ],
    },
  ];

  // Generate member contributions from context
  const memberContributions = members.map((member) => {
    const totalMeals = 30; // Assuming 30 days
    const mealsTaken = member.totalMeals;
    const mealEfficiency = Math.round((mealsTaken / totalMeals) * 100);
    const avgCostPerMeal = Math.round(
      currentMonthRevenue.expenses / (members.length * totalMeals)
    );
    const costSavings = Math.round(
      avgCostPerMeal * totalMeals - member.monthlyContribution
    );

    return {
      name: member.name,
      contributed: member.monthlyContribution,
      status: member.lastPaymentDate ? "paid" : "pending",
      lastPayment: member.lastPaymentDate,
      mealsTaken,
      totalMeals,
      mealEfficiency,
      avgCostPerMeal,
      paymentHistory: [
        {
          date: member.lastPaymentDate,
          amount: member.monthlyContribution,
          status: "paid",
        },
      ],
      performance:
        mealEfficiency >= 90
          ? "excellent"
          : mealEfficiency >= 80
          ? "good"
          : "needs_improvement",
      attendance: mealEfficiency,
      costSavings,
    };
  });

  // Generate historical data from context
  const historicalData = monthlyRevenue.slice(-6).map((item) => ({
    month: item.month,
    amount: item.expenses,
    trend: item.expenses > item.revenue * 0.85 ? "up" : "down",
    savings: item.revenue - item.expenses,
    efficiency: Math.round((item.profit / item.revenue) * 100),
  }));

  // Generate expense trends from context
  const expenseTrends = {
    changePercentage: Math.round(
      ((currentMonthRevenue.expenses -
        monthlyRevenue[monthlyRevenue.length - 2]?.expenses || 0) /
        (monthlyRevenue[monthlyRevenue.length - 2]?.expenses || 1)) *
        100
    ),
    trend:
      currentMonthRevenue.expenses >
      (monthlyRevenue[monthlyRevenue.length - 2]?.expenses || 0)
        ? "up"
        : "down",
    efficiencyScore: Math.round(
      (currentMonthRevenue.profit / currentMonthRevenue.revenue) * 100
    ),
    budgetLimit: currentMonthRevenue.revenue,
    savingsRate: Math.round(
      (currentMonthRevenue.profit / currentMonthRevenue.revenue) * 100
    ),
  };

  // Budget vs Actual comparison
  const budgetComparison = {
    groceries: {
      budget: Math.round(currentMonthRevenue.revenue * 0.6),
      actual: expenseBreakdown[0].amount,
      variance:
        expenseBreakdown[0].amount -
        Math.round(currentMonthRevenue.revenue * 0.6),
      status:
        expenseBreakdown[0].amount >
        Math.round(currentMonthRevenue.revenue * 0.6)
          ? "over"
          : "under",
    },
    utilities: {
      budget: Math.round(currentMonthRevenue.revenue * 0.25),
      actual: expenseBreakdown[1].amount,
      variance:
        expenseBreakdown[1].amount -
        Math.round(currentMonthRevenue.revenue * 0.25),
      status:
        expenseBreakdown[1].amount >
        Math.round(currentMonthRevenue.revenue * 0.25)
          ? "over"
          : "under",
    },
    maintenance: {
      budget: Math.round(currentMonthRevenue.revenue * 0.15),
      actual: expenseBreakdown[2].amount,
      variance:
        expenseBreakdown[2].amount -
        Math.round(currentMonthRevenue.revenue * 0.15),
      status:
        expenseBreakdown[2].amount >
        Math.round(currentMonthRevenue.revenue * 0.15)
          ? "over"
          : "under",
    },
  };

  const periods = [
    { key: "current", label: "Current Month" },
    { key: "previous", label: "Previous Month" },
    { key: "quarter", label: "This Quarter" },
    { key: "year", label: "This Year" },
  ];

  const formatCurrency = (amount: number) => {
    return `৳${amount.toLocaleString()}`;
  };

  const getTrendColor = (trend: string) => {
    return trend === "up" ? "#10b981" : "#ef4444";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "#10b981";
      case "pending":
        return "#f59e0b";
      case "overdue":
        return "#ef4444";
      default:
        return "#6b7280";
    }
  };

  const getBudgetStatusColor = (status: string) => {
    switch (status) {
      case "under":
        return "#10b981";
      case "over":
        return "#ef4444";
      case "on":
        return "#f59e0b";
      default:
        return "#6b7280";
    }
  };

  const handleCategoryPress = (category: string) => {
    setSelectedCategory(selectedCategory === category ? null : category);
  };

  const handleMemberPress = (member: any) => {
    const performanceEmoji =
      member.performance === "excellent"
        ? "🟢"
        : member.performance === "good"
        ? "🟡"
        : "🔴";
    const attendanceEmoji =
      member.attendance >= 90 ? "🟢" : member.attendance >= 80 ? "🟡" : "🔴";
    const costSavingsEmoji = member.costSavings > 0 ? "💰" : "⚠️";
    const statusEmoji =
      member.status === "paid"
        ? "✅"
        : member.status === "pending"
        ? "⏳"
        : "❌";

    const performanceText =
      member.performance === "excellent"
        ? "Excellent Performance"
        : member.performance === "good"
        ? "Good Performance"
        : "Needs Improvement";

    const attendanceText =
      member.attendance >= 90
        ? "Excellent Attendance"
        : member.attendance >= 80
        ? "Good Attendance"
        : "Low Attendance";

    const costSavingsText =
      member.costSavings > 0
        ? `Cost Efficient (+${formatCurrency(member.costSavings)})`
        : `Above Average Cost (${formatCurrency(
            Math.abs(member.costSavings)
          )})`;

    Alert.alert(
      `${member.name} - Performance Overview`,
      `${performanceEmoji} ${performanceText}\n` +
        `${attendanceEmoji} ${attendanceText} (${member.attendance}%)\n` +
        `${costSavingsEmoji} ${costSavingsText}\n\n` +
        `📊 Meal Efficiency: ${member.mealEfficiency}% (${member.mealsTaken}/${member.totalMeals})\n` +
        `💵 Avg Cost/Meal: ${formatCurrency(member.avgCostPerMeal)}\n` +
        `💰 Total Contributed: ${formatCurrency(member.contributed)}\n` +
        `${statusEmoji} Payment Status: ${member.status.toUpperCase()}\n` +
        `📅 Last Payment: ${member.lastPayment}\n\n` +
        `📈 Payment History:\n` +
        `${member.paymentHistory
          .map(
            (p: any) => `  ${p.date}: ${formatCurrency(p.amount)} (${p.status})`
          )
          .join("\n")}\n\n` +
        `💡 Recommendations:\n` +
        `${
          member.performance === "excellent"
            ? "• Keep up the excellent work!"
            : member.performance === "good"
            ? "• Consider increasing meal attendance"
            : "• Focus on improving meal attendance and cost efficiency"
        }`
    );
  };

  const actionButtons = [
    {
      icon: "download",
      label: "Export Report",
      onPress: () => Alert.alert("Export", "Report exported successfully!"),
      color: "#667eea",
    },
    {
      icon: "create",
      label: "Edit Expenses",
      onPress: () =>
        Alert.alert("Edit", "Edit expenses functionality coming soon!"),
      color: "#667eea",
    },
    {
      icon: "share",
      label: "Share Report",
      onPress: () => Alert.alert("Share", "Report shared successfully!"),
      color: "#667eea",
    },
  ];

  return (
    <DetailPageTemplate
      title={data.title}
      gradientColors={data.gradient}
      actionButtons={actionButtons}
    >
      {/* Quick Stats Row */}
      <View style={styles.quickStatsRow}>
        <MetricCard
          icon="trending-up"
          value={`+${expenseTrends.changePercentage}%`}
          label="vs Last Month"
          color={getTrendColor(expenseTrends.trend)}
        />
        <MetricCard
          icon="calendar"
          value={formatCurrency(Math.round(currentMonthRevenue.expenses / 30))}
          label="Daily Average"
          color="#667eea"
        />
        <MetricCard
          icon="analytics"
          value={formatCurrency(
            Math.round(currentMonthRevenue.expenses * 1.05)
          )}
          label="Projected"
          color="#f59e0b"
        />
      </View>

      {/* Main Expense Card */}
      <DetailCard
        title="Total Expenses"
        value={formatCurrency(data.value)}
        subtitle={`${expenseTrends.changePercentage > 0 ? "+" : ""}${
          expenseTrends.changePercentage
        }% vs last month`}
        icon="cash"
        iconColor="#667eea"
      >
        <View style={styles.expenseComparison}>
          <ThemedText style={styles.comparisonText}>
            vs{" "}
            {formatCurrency(
              monthlyRevenue[monthlyRevenue.length - 2]?.expenses || 0
            )}{" "}
            last month
          </ThemedText>
          <ThemedText
            style={[
              styles.comparisonChange,
              { color: getTrendColor(expenseTrends.trend) },
            ]}
          >
            {expenseTrends.changePercentage > 0 ? "+" : ""}
            {expenseTrends.changePercentage}%
          </ThemedText>
        </View>
      </DetailCard>

      {/* Monthly Expense Trend Chart */}
      <DetailCard
        title="Monthly Expense Trend"
        value="6 months"
        icon="trending-up"
        iconColor="#667eea"
      >
        <View style={styles.chartContainer}>
          <SwappableLineChart
            monthlyRevenue={[
              {
                month: "Jan",
                revenue: 28500,
                details: { budget: 30000, savings: 1500, meals: 180 },
              },
              {
                month: "Feb",
                revenue: 29800,
                details: { budget: 30000, savings: 200, meals: 175 },
              },
              {
                month: "Mar",
                revenue: 31200,
                details: { budget: 30000, savings: -1200, meals: 190 },
              },
              {
                month: "Apr",
                revenue: 29500,
                details: { budget: 30000, savings: 500, meals: 185 },
              },
              {
                month: "May",
                revenue: 32400,
                details: { budget: 30000, savings: -2400, meals: 200 },
              },
              {
                month: "Jun",
                revenue: 31800,
                details: { budget: 30000, savings: -1800, meals: 195 },
              },
            ]}
            title="Monthly Expenses (৳)"
            color="#667eea"
            onPointPress={(item) => {
              const details = item.details || {};
              const savingsText =
                details.savings >= 0
                  ? `+${details.savings}`
                  : `${details.savings}`;
              const savingsColor = details.savings >= 0 ? "🟢" : "🔴";

              Alert.alert(
                `${item.date} - Monthly Overview`,
                `💰 Total Expenses: ${formatCurrency(item.value)}\n` +
                  `📊 Budget: ${formatCurrency(details.budget || 0)}\n` +
                  `💵 Savings: ${savingsColor} ${formatCurrency(
                    Math.abs(details.savings || 0)
                  )}\n` +
                  `🍽️ Meals Served: ${details.meals || 0}\n` +
                  `📈 Performance: ${
                    details.savings >= 0 ? "Under Budget" : "Over Budget"
                  }`
              );
            }}
          />
        </View>
      </DetailCard>

      {/* Daily Expense Chart */}
      <DetailCard
        title="Daily Expense Tracking"
        value="This Week"
        icon="calendar"
        iconColor="#667eea"
      >
        <View style={styles.chartContainer}>
          <SwappableLineChart
            monthlyRevenue={[
              {
                month: "Mon",
                revenue: 1080,
                details: { meals: 12, avgCost: 90, efficiency: 85 },
              },
              {
                month: "Tue",
                revenue: 1120,
                details: { meals: 15, avgCost: 75, efficiency: 88 },
              },
              {
                month: "Wed",
                revenue: 1050,
                details: { meals: 18, avgCost: 58, efficiency: 92 },
              },
              {
                month: "Thu",
                revenue: 1150,
                details: { meals: 14, avgCost: 82, efficiency: 87 },
              },
              {
                month: "Fri",
                revenue: 1200,
                details: { meals: 16, avgCost: 75, efficiency: 89 },
              },
              {
                month: "Sat",
                revenue: 1350,
                details: { meals: 20, avgCost: 68, efficiency: 94 },
              },
              {
                month: "Sun",
                revenue: 980,
                details: { meals: 13, avgCost: 75, efficiency: 86 },
              },
            ]}
            title="Daily Expenses (৳)"
            color="#f59e0b"
            onPointPress={(item) => {
              const details = item.details || {};
              const efficiencyEmoji =
                details.efficiency >= 90
                  ? "🟢"
                  : details.efficiency >= 80
                  ? "🟡"
                  : "🔴";

              Alert.alert(
                `${item.date} - Daily Summary`,
                `💰 Daily Expenses: ${formatCurrency(item.value)}\n` +
                  `🍽️ Meals Served: ${details.meals || 0}\n` +
                  `💵 Avg Cost/Meal: ${formatCurrency(
                    details.avgCost || 0
                  )}\n` +
                  `📊 Efficiency: ${efficiencyEmoji} ${
                    details.efficiency || 0
                  }%\n` +
                  `📈 Status: ${
                    details.efficiency >= 90
                      ? "Excellent"
                      : details.efficiency >= 80
                      ? "Good"
                      : "Needs Improvement"
                  }`
              );
            }}
          />
        </View>
      </DetailCard>

      {/* Budget vs Actual */}
      <DetailCard
        title="Budget vs Actual"
        value={`${
          Object.values(budgetComparison).filter((b) => b.status === "under")
            .length
        }/${Object.keys(budgetComparison).length} under budget`}
        icon="wallet"
        iconColor="#667eea"
      >
        <View style={styles.budgetContainer}>
          {Object.entries(budgetComparison).map(([category, data]) => (
            <View key={category} style={styles.budgetItem}>
              <View style={styles.budgetHeader}>
                <ThemedText style={styles.budgetCategory}>
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </ThemedText>
                <View
                  style={[
                    styles.budgetStatus,
                    { backgroundColor: getBudgetStatusColor(data.status) },
                  ]}
                />
              </View>
              <View style={styles.budgetDetails}>
                <ThemedText style={styles.budgetAmount}>
                  {formatCurrency(data.actual)} / {formatCurrency(data.budget)}
                </ThemedText>
                <ThemedText
                  style={[
                    styles.budgetVariance,
                    { color: getBudgetStatusColor(data.status) },
                  ]}
                >
                  {data.variance > 0 ? "+" : ""}
                  {formatCurrency(data.variance)}
                </ThemedText>
              </View>
            </View>
          ))}
        </View>
      </DetailCard>

      {/* Period Selector */}
      <View style={styles.periodSelector}>
        {periods.map((period) => (
          <TouchableOpacity
            key={period.key}
            style={[
              styles.periodButton,
              selectedPeriod === period.key && styles.periodButtonActive,
            ]}
            onPress={() => setSelectedPeriod(period.key)}
          >
            <ThemedText
              style={[
                styles.periodButtonText,
                selectedPeriod === period.key && styles.periodButtonTextActive,
              ]}
            >
              {period.label}
            </ThemedText>
          </TouchableOpacity>
        ))}
      </View>

      {/* Enhanced Expense Breakdown */}
      <DetailCard
        title="Expense Breakdown"
        value={`${expenseBreakdown.length} categories`}
        icon="pie-chart"
        iconColor="#667eea"
      >
        <View style={styles.breakdownContainer}>
          {expenseBreakdown.map((item, index) => (
            <View key={index}>
              <TouchableOpacity
                style={styles.breakdownItem}
                onPress={() => handleCategoryPress(item.category)}
              >
                <View style={styles.breakdownHeader}>
                  <View style={styles.breakdownIconContainer}>
                    <Ionicons
                      name={item.icon as any}
                      size={16}
                      color={item.color}
                    />
                  </View>
                  <View style={styles.breakdownInfo}>
                    <ThemedText style={styles.breakdownCategory}>
                      {item.category}
                    </ThemedText>
                    <ThemedText style={styles.breakdownPercentage}>
                      {item.percentage}%
                    </ThemedText>
                  </View>
                  <ThemedText style={styles.breakdownAmount}>
                    {formatCurrency(item.amount)}
                  </ThemedText>
                  <Ionicons
                    name={
                      selectedCategory === item.category
                        ? "chevron-up"
                        : "chevron-down"
                    }
                    size={16}
                    color="#6b7280"
                  />
                </View>
                <View style={styles.progressBar}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${item.percentage}%`,
                        backgroundColor: item.color,
                      },
                    ]}
                  />
                </View>
              </TouchableOpacity>

              {/* Sub-items */}
              {selectedCategory === item.category && (
                <View style={styles.subItemsContainer}>
                  {item.subItems.map((subItem, subIndex) => (
                    <View key={subIndex} style={styles.subItem}>
                      <View style={styles.subItemInfo}>
                        <ThemedText style={styles.subItemName}>
                          {subItem.name}
                        </ThemedText>
                        <ThemedText style={styles.subItemPercentage}>
                          {subItem.percentage}%
                        </ThemedText>
                      </View>
                      <ThemedText style={styles.subItemAmount}>
                        {formatCurrency(subItem.amount)}
                      </ThemedText>
                    </View>
                  ))}
                </View>
              )}
            </View>
          ))}
        </View>
      </DetailCard>

      {/* Enhanced Historical Trend */}
      <DetailCard
        title="Historical Trend"
        value="6 months"
        icon="trending-up"
        iconColor="#667eea"
      >
        <View style={styles.historicalContainer}>
          {historicalData.map((item, index) => (
            <View key={index} style={styles.historicalItem}>
              <View style={styles.historicalMonth}>
                <ThemedText style={styles.historicalMonthText}>
                  {item.month}
                </ThemedText>
                <ThemedText style={styles.historicalEfficiency}>
                  {item.efficiency}% efficiency
                </ThemedText>
              </View>
              <View style={styles.historicalAmount}>
                <ThemedText style={styles.historicalAmountText}>
                  {formatCurrency(item.amount)}
                </ThemedText>
                <ThemedText style={styles.historicalSavings}>
                  Saved {formatCurrency(item.savings)}
                </ThemedText>
              </View>
              <Ionicons
                name={item.trend === "up" ? "trending-up" : "trending-down"}
                size={16}
                color={getTrendColor(item.trend)}
              />
            </View>
          ))}
        </View>
      </DetailCard>

      {/* Enhanced Member Contributions */}
      <DetailCard
        title="Member Performance (Total Meals)"
        value={`${
          memberContributions.filter((m) => m.status === "paid").length
        }/${memberContributions.length} paid`}
        icon="people"
        iconColor="#667eea"
      >
        <View style={styles.contributionsContainer}>
          {memberContributions.map((member, index) => (
            <TouchableOpacity
              key={index}
              style={styles.contributionItem}
              onPress={() => handleMemberPress(member)}
            >
              <View style={styles.memberInfo}>
                <View style={styles.memberHeader}>
                  <ThemedText style={styles.memberName}>
                    {member.name}
                  </ThemedText>
                  <View style={styles.performanceIndicator}>
                    {member.performance === "excellent" && (
                      <ThemedText style={styles.excellentIndicator}>
                        ⭐
                      </ThemedText>
                    )}
                    {member.performance === "good" && (
                      <ThemedText style={styles.goodIndicator}>✨</ThemedText>
                    )}
                    {member.performance === "needs_improvement" && (
                      <ThemedText style={styles.improvementIndicator}>
                        ⚠️
                      </ThemedText>
                    )}
                  </View>
                </View>
                <View style={styles.memberDetails}>
                  <View
                    style={[
                      styles.statusIndicator,
                      { backgroundColor: getStatusColor(member.status) },
                    ]}
                  />
                  <ThemedText style={styles.memberMeals}>
                    {member.mealsTaken}/{member.totalMeals} meals (
                    {member.mealEfficiency}%)
                  </ThemedText>
                  <ThemedText style={styles.avgCost}>
                    Avg: {formatCurrency(member.avgCostPerMeal)}
                  </ThemedText>
                </View>
                <View style={styles.attendanceBar}>
                  <View
                    style={[
                      styles.attendanceFill,
                      {
                        width: `${member.attendance}%`,
                        backgroundColor:
                          member.attendance >= 90
                            ? "#10b981"
                            : member.attendance >= 80
                            ? "#f59e0b"
                            : "#ef4444",
                      },
                    ]}
                  />
                </View>
              </View>
              <View style={styles.contributionDetails}>
                <ThemedText style={styles.contributionAmount}>
                  {formatCurrency(member.contributed)}
                </ThemedText>
                <ThemedText style={styles.lastPayment}>
                  {member.lastPayment}
                </ThemedText>
                {member.costSavings > 0 && (
                  <ThemedText style={styles.savingsIndicator}>
                    +{formatCurrency(member.costSavings)}
                  </ThemedText>
                )}
                {member.costSavings <= 0 && (
                  <ThemedText style={styles.costIndicator}>
                    {formatCurrency(Math.abs(member.costSavings))}
                  </ThemedText>
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </DetailCard>

      {/* Efficiency Metrics */}
      <DetailCard
        title="Efficiency Metrics"
        value={`${expenseTrends.efficiencyScore}% efficiency`}
        icon="speedometer"
        iconColor="#667eea"
      >
        <View style={styles.efficiencyContainer}>
          <View style={styles.efficiencyItem}>
            <ThemedText style={styles.efficiencyLabel}>
              Budget Utilization
            </ThemedText>
            <ThemedText style={styles.efficiencyValue}>
              {Math.round((data.value / expenseTrends.budgetLimit) * 100)}%
            </ThemedText>
          </View>
          <View style={styles.efficiencyItem}>
            <ThemedText style={styles.efficiencyLabel}>Savings Rate</ThemedText>
            <ThemedText style={styles.efficiencyValue}>
              {expenseTrends.savingsRate}%
            </ThemedText>
          </View>
          <View style={styles.efficiencyItem}>
            <ThemedText style={styles.efficiencyLabel}>
              Cost per Meal
            </ThemedText>
            <ThemedText style={styles.efficiencyValue}>
              {formatCurrency(Math.round(data.value / 360))}
            </ThemedText>
          </View>
        </View>
      </DetailCard>

      {/* Description */}
      <DetailCard
        title="Description"
        value={data.details.description}
        icon="document-text"
        iconColor="#6b7280"
      />

      {/* Notes */}
      <DetailCard
        title="Notes"
        value={data.details.notes}
        icon="chatbubble"
        iconColor="#6b7280"
      />
    </DetailPageTemplate>
  );
}

const styles = StyleSheet.create({
  quickStatsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: DESIGN_SYSTEM.spacing.lg,
  },
  expenseComparison: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: DESIGN_SYSTEM.spacing.sm,
  },
  comparisonText: {
    fontSize: 12,
    color: "#6b7280",
  },
  comparisonChange: {
    fontSize: 14,
    fontWeight: "bold",
  },
  periodSelector: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: DESIGN_SYSTEM.borderRadius.md,
    padding: 4,
    marginBottom: DESIGN_SYSTEM.spacing.lg,
    ...DESIGN_SYSTEM.shadows.small,
  },
  periodButton: {
    flex: 1,
    paddingVertical: DESIGN_SYSTEM.spacing.sm,
    paddingHorizontal: DESIGN_SYSTEM.spacing.md,
    borderRadius: DESIGN_SYSTEM.borderRadius.sm,
    alignItems: "center",
  },
  periodButtonActive: {
    backgroundColor: "#667eea",
  },
  periodButtonText: {
    fontSize: 12,
    color: "#6b7280",
    fontWeight: "500",
  },
  periodButtonTextActive: {
    color: "#fff",
    fontWeight: "bold",
  },
  breakdownContainer: {
    marginTop: DESIGN_SYSTEM.spacing.md,
  },
  breakdownItem: {
    marginBottom: DESIGN_SYSTEM.spacing.md,
  },
  breakdownHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: DESIGN_SYSTEM.spacing.xs,
  },
  breakdownIconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#f3f4f6",
    alignItems: "center",
    justifyContent: "center",
    marginRight: DESIGN_SYSTEM.spacing.sm,
  },
  breakdownInfo: {
    flex: 1,
  },
  breakdownCategory: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1f2937",
  },
  breakdownPercentage: {
    fontSize: 12,
    color: "#6b7280",
  },
  breakdownAmount: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#1f2937",
  },
  progressBar: {
    height: 4,
    backgroundColor: "#f3f4f6",
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 2,
  },
  subItemsContainer: {
    marginTop: DESIGN_SYSTEM.spacing.xs,
    paddingLeft: DESIGN_SYSTEM.spacing.lg,
  },
  subItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: DESIGN_SYSTEM.spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  subItemInfo: {
    flex: 1,
  },
  subItemName: {
    fontSize: 13,
    color: "#4b5563",
  },
  subItemPercentage: {
    fontSize: 11,
    color: "#6b7280",
  },
  subItemAmount: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1f2937",
  },
  historicalContainer: {
    marginTop: DESIGN_SYSTEM.spacing.md,
  },
  historicalItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: DESIGN_SYSTEM.spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  historicalMonth: {
    flexDirection: "column",
    alignItems: "flex-start",
  },
  historicalMonthText: {
    fontSize: 14,
    color: "#6b7280",
  },
  historicalEfficiency: {
    fontSize: 12,
    color: "#6b7280",
  },
  historicalAmount: {
    flexDirection: "column",
    alignItems: "flex-end",
  },
  historicalAmountText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1f2937",
  },
  historicalSavings: {
    fontSize: 12,
    color: "#10b981",
    marginTop: DESIGN_SYSTEM.spacing.xs,
  },
  contributionsContainer: {
    marginTop: DESIGN_SYSTEM.spacing.md,
  },
  contributionItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: DESIGN_SYSTEM.spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  memberInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  memberHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  memberName: {
    fontSize: 14,
    color: "#1f2937",
    marginRight: DESIGN_SYSTEM.spacing.sm,
  },
  performanceIndicator: {
    flexDirection: "row",
    alignItems: "center",
  },
  excellentIndicator: {
    fontSize: 16,
    color: "#10b981",
  },
  goodIndicator: {
    fontSize: 16,
    color: "#f59e0b",
  },
  improvementIndicator: {
    fontSize: 16,
    color: "#ef4444",
  },
  memberDetails: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: DESIGN_SYSTEM.spacing.xs,
  },
  memberMeals: {
    fontSize: 12,
    color: "#6b7280",
  },
  avgCost: {
    fontSize: 12,
    color: "#6b7280",
    marginLeft: DESIGN_SYSTEM.spacing.sm,
  },
  attendanceBar: {
    height: 4,
    backgroundColor: "#f3f4f6",
    borderRadius: 2,
    overflow: "hidden",
    marginTop: DESIGN_SYSTEM.spacing.xs,
  },
  attendanceFill: {
    height: "100%",
    borderRadius: 2,
  },
  contributionDetails: {
    alignItems: "flex-end",
  },
  contributionAmount: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1f2937",
  },
  lastPayment: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: DESIGN_SYSTEM.spacing.xs,
  },
  savingsIndicator: {
    fontSize: 12,
    color: "#10b981",
    marginTop: DESIGN_SYSTEM.spacing.xs,
  },
  costIndicator: {
    fontSize: 12,
    color: "#ef4444",
    marginTop: DESIGN_SYSTEM.spacing.xs,
  },
  budgetContainer: {
    marginTop: DESIGN_SYSTEM.spacing.md,
  },
  budgetItem: {
    marginBottom: DESIGN_SYSTEM.spacing.md,
  },
  budgetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: DESIGN_SYSTEM.spacing.xs,
  },
  budgetCategory: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1f2937",
  },
  budgetStatus: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  budgetDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  budgetAmount: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1f2937",
  },
  budgetVariance: {
    fontSize: 12,
    fontWeight: "bold",
  },
  efficiencyContainer: {
    marginTop: DESIGN_SYSTEM.spacing.md,
    flexDirection: "row",
    justifyContent: "space-around",
  },
  efficiencyItem: {
    alignItems: "center",
  },
  efficiencyLabel: {
    fontSize: 12,
    color: "#6b7280",
    marginBottom: DESIGN_SYSTEM.spacing.xs,
  },
  efficiencyValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1f2937",
  },
  chartContainer: {
    marginTop: DESIGN_SYSTEM.spacing.md,
    padding: DESIGN_SYSTEM.spacing.md,
    backgroundColor: "#fff",
    borderRadius: DESIGN_SYSTEM.borderRadius.md,
    ...DESIGN_SYSTEM.shadows.small,
  },
});
