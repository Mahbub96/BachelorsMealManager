import { useMessData } from "@/context/MessDataContext";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Dimensions,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { BarChart, StatsGrid, SwappableLineChart } from "./ModernCharts";
import { ThemedText } from "./ThemedText";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

// Enhanced Design System
const DESIGN_SYSTEM = {
  spacing: {
    xs: 6,
    sm: 12,
    md: 16,
    lg: 20,
    xl: 24,
    xxl: 32,
    xxxl: 40,
  },
  borderRadius: {
    sm: 12,
    md: 16,
    lg: 20,
    xl: 24,
  },
  fontSize: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    xxxl: 28,
  },
  shadows: {
    small: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
      elevation: 4,
    },
    medium: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.12,
      shadowRadius: 12,
      elevation: 8,
    },
    large: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.16,
      shadowRadius: 16,
      elevation: 12,
    },
  },
  colors: {
    primary: "#667eea",
    secondary: "#764ba2",
    success: "#10b981",
    warning: "#f59e0b",
    danger: "#ef4444",
    info: "#3b82f6",
    light: "#f8fafc",
    dark: "#1f2937",
    gray: {
      50: "#f9fafb",
      100: "#f3f4f6",
      200: "#e5e7eb",
      300: "#d1d5db",
      400: "#9ca3af",
      500: "#6b7280",
      600: "#4b5563",
      700: "#374151",
      800: "#1f2937",
      900: "#111827",
    },
  },
};

export const ModernDashboard: React.FC = () => {
  const router = useRouter();
  const {
    monthlyRevenue,
    currentMonthRevenue,
    members,
    mealEntries,
    bazarEntries,
    quickStats,
    monthlyMealStats,
    recentActivities,
  } = useMessData();

  const [selectedPeriod, setSelectedPeriod] = useState("current");

  // Responsive layout calculations
  const isTablet = screenWidth >= 768;
  const isDesktop = screenWidth >= 1024;
  const containerPadding = isTablet ? 24 : 16;
  const cardSpacing = isTablet ? 20 : 16;

  // Generate chart data
  const revenueChartData = monthlyRevenue.slice(-6).map((item) => ({
    date: item.month,
    value: item.revenue,
    forecast: Math.round(item.revenue * 1.05),
    details: {
      expenses: item.expenses,
      profit: item.profit,
      memberCount: item.memberCount,
    },
  }));

  const expenseChartData = monthlyRevenue.slice(-6).map((item) => ({
    label: item.month,
    value: item.expenses,
    forecast: Math.round(item.expenses * 1.02),
    color: DESIGN_SYSTEM.colors.danger,
    gradient: [DESIGN_SYSTEM.colors.danger, "#dc2626"] as [string, string],
    trend: (item.expenses > item.revenue * 0.85 ? "up" : "down") as
      | "up"
      | "down",
  }));

  const mealChartData = monthlyRevenue.slice(-6).map((item) => ({
    label: item.month,
    value: Math.round(item.averageMeals * item.memberCount * 30),
    forecast: Math.round(item.averageMeals * item.memberCount * 30 * 1.03),
    color: DESIGN_SYSTEM.colors.success,
    gradient: [DESIGN_SYSTEM.colors.success, "#059669"] as [string, string],
    trend: "up" as const,
  }));

  // Enhanced stats with better visual design
  const stats = [
    {
      title: "Total Revenue",
      value: `৳${currentMonthRevenue.revenue.toLocaleString()}`,
      icon: "trending-up",
      gradient: [
        DESIGN_SYSTEM.colors.primary,
        DESIGN_SYSTEM.colors.secondary,
      ] as [string, string],
      details: {
        change: "+12.5%",
        period: "vs last month",
        trend: "up",
      },
    },
    {
      title: "Monthly Expenses",
      value: `৳${currentMonthRevenue.expenses.toLocaleString()}`,
      icon: "card",
      gradient: [DESIGN_SYSTEM.colors.warning, "#d97706"] as [string, string],
      details: {
        change: "+8.2%",
        period: "vs last month",
        trend: "up",
      },
    },
    {
      title: "Active Members",
      value: `${members.filter((m) => m.status === "active").length}`,
      icon: "people",
      gradient: [DESIGN_SYSTEM.colors.success, "#059669"] as [string, string],
      details: {
        change: "+1",
        period: "this month",
        trend: "up",
      },
    },
    {
      title: "Total Meals",
      value: `${monthlyMealStats.totalMeals}`,
      icon: "restaurant",
      gradient: [DESIGN_SYSTEM.colors.info, "#2563eb"] as [string, string],
      details: {
        change: "+15.3%",
        period: "vs last month",
        trend: "up",
      },
    },
  ];

  const handleQuickAction = (action: string) => {
    switch (action) {
      case "add-meal":
        router.push("/meals");
        break;
      case "add-bazar":
        router.push("/admin");
        break;
      case "view-expenses":
        router.push({
          pathname: "/expense-details",
          params: {
            title: "Monthly Expenses",
            value: currentMonthRevenue.expenses.toString(),
            type: "monthly",
            color: DESIGN_SYSTEM.colors.warning,
          },
        });
        break;
      case "view-revenue":
        router.push({
          pathname: "/expense-details",
          params: {
            title: "Monthly Revenue",
            value: currentMonthRevenue.revenue.toString(),
            type: "monthly",
            color: DESIGN_SYSTEM.colors.primary,
          },
        });
        break;
      default:
        Alert.alert("Coming Soon", "This feature will be available soon!");
    }
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
      {/* Beautiful Header Section */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <ThemedText style={styles.headerTitle}>Dashboard</ThemedText>
          <ThemedText style={styles.headerSubtitle}>
            Welcome back! Here&apos;s your mess overview
          </ThemedText>
          <ThemedText style={styles.headerDate}>
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </ThemedText>
        </View>
        <TouchableOpacity
          style={styles.notificationButton}
          onPress={() => router.push("/notifications")}
        >
          <LinearGradient
            colors={[
              DESIGN_SYSTEM.colors.primary,
              DESIGN_SYSTEM.colors.secondary,
            ]}
            style={styles.notificationGradient}
          >
            <Ionicons name="notifications" size={24} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Enhanced Quick Stats Grid */}
      <View style={[styles.statsContainer, { marginBottom: cardSpacing }]}>
        <StatsGrid stats={stats} />
      </View>

      {/* Main Charts Section */}
      <View style={styles.chartsSection}>
        {/* Revenue Trend Chart */}
        <View style={[styles.chartCard, { marginBottom: cardSpacing }]}>
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
                  selectedPeriod === "current" && styles.periodButtonActive,
                ]}
                onPress={() => setSelectedPeriod("current")}
              >
                <ThemedText
                  style={[
                    styles.periodButtonText,
                    selectedPeriod === "current" &&
                      styles.periodButtonTextActive,
                  ]}
                >
                  Current
                </ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.periodButton,
                  selectedPeriod === "forecast" && styles.periodButtonActive,
                ]}
                onPress={() => setSelectedPeriod("forecast")}
              >
                <ThemedText
                  style={[
                    styles.periodButtonText,
                    selectedPeriod === "forecast" &&
                      styles.periodButtonTextActive,
                  ]}
                >
                  Forecast
                </ThemedText>
              </TouchableOpacity>
            </View>
          </View>
          <SwappableLineChart
            monthlyRevenue={monthlyRevenue.slice(-6)}
            title=""
            color={DESIGN_SYSTEM.colors.primary}
            showForecast={selectedPeriod === "forecast"}
            showTrend={true}
          />
        </View>

        {/* Charts Row */}
        <View style={styles.chartsRow}>
          {/* Expenses Chart */}
          <View style={[styles.chartCard, styles.halfWidth]}>
            <View style={styles.chartTitleContainer}>
              <ThemedText style={styles.chartTitle}>
                Monthly Expenses
              </ThemedText>
              <ThemedText style={styles.chartSubtitle}>
                Track spending patterns
              </ThemedText>
            </View>
            <BarChart
              data={expenseChartData}
              title=""
              height={isTablet ? 200 : 160}
              showForecast={true}
              showTrend={true}
            />
          </View>

          {/* Meals Chart */}
          <View style={[styles.chartCard, styles.halfWidth]}>
            <View style={styles.chartTitleContainer}>
              <ThemedText style={styles.chartTitle}>
                Meal Consumption
              </ThemedText>
              <ThemedText style={styles.chartSubtitle}>
                Daily meal tracking
              </ThemedText>
            </View>
            <BarChart
              data={mealChartData}
              title=""
              height={isTablet ? 200 : 160}
              showForecast={true}
              showTrend={true}
            />
          </View>
        </View>
      </View>

      {/* Enhanced Quick Actions */}
      <View style={[styles.actionsSection, { marginBottom: cardSpacing }]}>
        <View style={styles.sectionHeader}>
          <ThemedText style={styles.sectionTitle}>Quick Actions</ThemedText>
          <ThemedText style={styles.sectionSubtitle}>
            Manage your mess efficiently
          </ThemedText>
        </View>
        <View style={styles.actionsGrid}>
          {[
            {
              title: "Add Meal",
              subtitle: "Record today's meals",
              icon: "restaurant",
              color: DESIGN_SYSTEM.colors.success,
              action: "add-meal",
            },
            {
              title: "Add Bazar",
              subtitle: "Upload shopping list",
              icon: "cart",
              color: DESIGN_SYSTEM.colors.warning,
              action: "add-bazar",
            },
            {
              title: "View Expenses",
              subtitle: "Check spending details",
              icon: "card",
              color: DESIGN_SYSTEM.colors.danger,
              action: "view-expenses",
            },
            {
              title: "View Revenue",
              subtitle: "See income breakdown",
              icon: "trending-up",
              color: DESIGN_SYSTEM.colors.primary,
              action: "view-revenue",
            },
          ].map((action, index) => (
            <TouchableOpacity
              key={index}
              style={styles.actionCard}
              onPress={() => handleQuickAction(action.action)}
            >
              <LinearGradient
                colors={[action.color, `${action.color}dd`]}
                style={styles.actionGradient}
              >
                <View style={styles.actionIconContainer}>
                  <Ionicons name={action.icon as any} size={28} color="#fff" />
                </View>
                <View style={styles.actionContent}>
                  <ThemedText style={styles.actionTitle}>
                    {action.title}
                  </ThemedText>
                  <ThemedText style={styles.actionSubtitle}>
                    {action.subtitle}
                  </ThemedText>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Enhanced Recent Activity */}
      <View style={styles.activitySection}>
        <View style={styles.sectionHeader}>
          <View>
            <ThemedText style={styles.sectionTitle}>Recent Activity</ThemedText>
            <ThemedText style={styles.sectionSubtitle}>
              Latest updates from your mess
            </ThemedText>
          </View>
          <TouchableOpacity
            style={styles.viewAllButton}
            onPress={() => router.push("/recent-activity")}
          >
            <ThemedText style={styles.viewAllText}>View All</ThemedText>
            <Ionicons
              name="arrow-forward"
              size={16}
              color={DESIGN_SYSTEM.colors.primary}
            />
          </TouchableOpacity>
        </View>
        <View style={styles.activityList}>
          {(recentActivities || []).slice(0, 3).map((activity, index) => (
            <View key={index} style={styles.activityItem}>
              <View style={styles.activityIcon}>
                <LinearGradient
                  colors={[
                    DESIGN_SYSTEM.colors.primary,
                    DESIGN_SYSTEM.colors.secondary,
                  ]}
                  style={styles.activityIconGradient}
                >
                  <Ionicons
                    name={activity.icon as any}
                    size={16}
                    color="#fff"
                  />
                </LinearGradient>
              </View>
              <View style={styles.activityContent}>
                <ThemedText style={styles.activityTitle}>
                  {activity.title}
                </ThemedText>
                <ThemedText style={styles.activityDescription}>
                  {activity.description}
                </ThemedText>
                <View style={styles.activityMeta}>
                  <ThemedText style={styles.activityTime}>
                    {activity.time}
                  </ThemedText>
                  {activity.amount && (
                    <ThemedText style={styles.activityAmount}>
                      ৳{activity.amount}
                    </ThemedText>
                  )}
                </View>
              </View>
            </View>
          ))}
        </View>
      </View>
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
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: DESIGN_SYSTEM.spacing.xl,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: DESIGN_SYSTEM.fontSize.xxxl,
    fontWeight: "bold",
    color: DESIGN_SYSTEM.colors.dark,
    marginBottom: DESIGN_SYSTEM.spacing.xs,
  },
  headerSubtitle: {
    fontSize: DESIGN_SYSTEM.fontSize.md,
    color: DESIGN_SYSTEM.colors.gray[600],
    marginBottom: DESIGN_SYSTEM.spacing.xs,
  },
  headerDate: {
    fontSize: DESIGN_SYSTEM.fontSize.sm,
    color: DESIGN_SYSTEM.colors.gray[500],
  },
  notificationButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: "hidden",
    ...DESIGN_SYSTEM.shadows.medium,
  },
  notificationGradient: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  statsContainer: {
    marginBottom: DESIGN_SYSTEM.spacing.xl,
  },
  chartsSection: {
    marginBottom: DESIGN_SYSTEM.spacing.xl,
  },
  chartCard: {
    backgroundColor: "#fff",
    borderRadius: DESIGN_SYSTEM.borderRadius.lg,
    padding: DESIGN_SYSTEM.spacing.lg,
    ...DESIGN_SYSTEM.shadows.medium,
    borderWidth: 1,
    borderColor: DESIGN_SYSTEM.colors.gray[100],
  },
  chartHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: DESIGN_SYSTEM.spacing.lg,
  },
  chartTitleContainer: {
    flex: 1,
  },
  chartTitle: {
    fontSize: DESIGN_SYSTEM.fontSize.lg,
    fontWeight: "bold",
    color: DESIGN_SYSTEM.colors.dark,
    marginBottom: DESIGN_SYSTEM.spacing.xs,
  },
  chartSubtitle: {
    fontSize: DESIGN_SYSTEM.fontSize.sm,
    color: DESIGN_SYSTEM.colors.gray[500],
  },
  chartActions: {
    flexDirection: "row",
    gap: DESIGN_SYSTEM.spacing.xs,
  },
  periodButton: {
    paddingHorizontal: DESIGN_SYSTEM.spacing.md,
    paddingVertical: DESIGN_SYSTEM.spacing.sm,
    borderRadius: DESIGN_SYSTEM.borderRadius.sm,
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
    fontWeight: "600",
  },
  periodButtonTextActive: {
    color: "#fff",
  },
  chartsRow: {
    flexDirection: "row",
    gap: DESIGN_SYSTEM.spacing.lg,
  },
  halfWidth: {
    flex: 1,
  },
  actionsSection: {
    marginBottom: DESIGN_SYSTEM.spacing.xl,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: DESIGN_SYSTEM.spacing.lg,
  },
  sectionTitle: {
    fontSize: DESIGN_SYSTEM.fontSize.lg,
    fontWeight: "bold",
    color: DESIGN_SYSTEM.colors.dark,
    marginBottom: DESIGN_SYSTEM.spacing.xs,
  },
  sectionSubtitle: {
    fontSize: DESIGN_SYSTEM.fontSize.sm,
    color: DESIGN_SYSTEM.colors.gray[500],
  },
  viewAllButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: DESIGN_SYSTEM.spacing.xs,
    paddingVertical: DESIGN_SYSTEM.spacing.xs,
    paddingHorizontal: DESIGN_SYSTEM.spacing.sm,
  },
  viewAllText: {
    fontSize: DESIGN_SYSTEM.fontSize.sm,
    color: DESIGN_SYSTEM.colors.primary,
    fontWeight: "600",
  },
  actionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: DESIGN_SYSTEM.spacing.md,
  },
  actionCard: {
    width: "48%",
    aspectRatio: 1.2,
    borderRadius: DESIGN_SYSTEM.borderRadius.lg,
    overflow: "hidden",
    ...DESIGN_SYSTEM.shadows.medium,
  },
  actionGradient: {
    flex: 1,
    padding: DESIGN_SYSTEM.spacing.lg,
    justifyContent: "space-between",
  },
  actionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: DESIGN_SYSTEM.spacing.sm,
  },
  actionContent: {
    flex: 1,
    justifyContent: "flex-end",
  },
  actionTitle: {
    fontSize: DESIGN_SYSTEM.fontSize.md,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: DESIGN_SYSTEM.spacing.xs,
  },
  actionSubtitle: {
    fontSize: DESIGN_SYSTEM.fontSize.xs,
    color: "rgba(255, 255, 255, 0.8)",
    lineHeight: 16,
  },
  activitySection: {
    marginBottom: DESIGN_SYSTEM.spacing.xl,
  },
  activityList: {
    backgroundColor: "#fff",
    borderRadius: DESIGN_SYSTEM.borderRadius.lg,
    padding: DESIGN_SYSTEM.spacing.lg,
    ...DESIGN_SYSTEM.shadows.medium,
    borderWidth: 1,
    borderColor: DESIGN_SYSTEM.colors.gray[100],
  },
  activityItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: DESIGN_SYSTEM.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: DESIGN_SYSTEM.colors.gray[100],
  },
  activityIcon: {
    marginRight: DESIGN_SYSTEM.spacing.md,
  },
  activityIconGradient: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: DESIGN_SYSTEM.fontSize.md,
    fontWeight: "600",
    color: DESIGN_SYSTEM.colors.dark,
    marginBottom: DESIGN_SYSTEM.spacing.xs,
  },
  activityDescription: {
    fontSize: DESIGN_SYSTEM.fontSize.sm,
    color: DESIGN_SYSTEM.colors.gray[600],
    marginBottom: DESIGN_SYSTEM.spacing.xs,
    lineHeight: 18,
  },
  activityMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  activityTime: {
    fontSize: DESIGN_SYSTEM.fontSize.xs,
    color: DESIGN_SYSTEM.colors.gray[500],
  },
  activityAmount: {
    fontSize: DESIGN_SYSTEM.fontSize.xs,
    color: DESIGN_SYSTEM.colors.primary,
    fontWeight: "600",
  },
});
