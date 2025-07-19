import { useMessData } from "@/context/MessDataContext";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React from "react";
import {
  Alert,
  Dimensions,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { ThemedText } from "./ThemedText";

const { width: screenWidth } = Dimensions.get("window");

// Modern Design System
const DESIGN = {
  colors: {
    primary: "#667eea",
    secondary: "#764ba2",
    success: "#10b981",
    warning: "#f59e0b",
    danger: "#ef4444",
    info: "#3b82f6",
    light: "#f8fafc",
    dark: "#1f2937",
    white: "#ffffff",
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
    xxl: 24,
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
  },
};

export const ModernDashboardSimplified: React.FC = () => {
  const router = useRouter();
  const {
    monthlyRevenue,
    currentMonthRevenue,
    members,
    mealEntries,
    bazarEntries,
    monthlyMealStats,
    recentActivities,
  } = useMessData();

  const activeMembers = members.filter((m) => m.status === "active");
  const totalRevenue = monthlyRevenue.reduce(
    (sum, month) => sum + month.revenue,
    0
  );
  const totalExpenses = monthlyRevenue.reduce(
    (sum, month) => sum + month.expenses,
    0
  );
  const currentBalance = totalRevenue - totalExpenses;

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
            color: DESIGN.colors.warning,
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
            color: DESIGN.colors.primary,
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
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* Beautiful Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <ThemedText style={styles.greeting}>Good morning! 👋</ThemedText>
          <ThemedText style={styles.title}>Mess Dashboard</ThemedText>
          <ThemedText style={styles.subtitle}>
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
            colors={[DESIGN.colors.primary, DESIGN.colors.secondary]}
            style={styles.notificationGradient}
          >
            <Ionicons
              name="notifications"
              size={24}
              color={DESIGN.colors.white}
            />
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Key Metrics Cards */}
      <View style={styles.metricsSection}>
        <View style={styles.metricsRow}>
          <View style={styles.metricCard}>
            <LinearGradient
              colors={[DESIGN.colors.primary, DESIGN.colors.secondary]}
              style={styles.metricGradient}
            >
              <View style={styles.metricIcon}>
                <Ionicons
                  name="trending-up"
                  size={24}
                  color={DESIGN.colors.white}
                />
              </View>
              <View style={styles.metricContent}>
                <ThemedText style={styles.metricValue}>
                  ৳{currentMonthRevenue.revenue.toLocaleString()}
                </ThemedText>
                <ThemedText style={styles.metricLabel}>This Month</ThemedText>
              </View>
            </LinearGradient>
          </View>

          <View style={styles.metricCard}>
            <LinearGradient
              colors={[DESIGN.colors.success, "#059669"]}
              style={styles.metricGradient}
            >
              <View style={styles.metricIcon}>
                <Ionicons name="people" size={24} color={DESIGN.colors.white} />
              </View>
              <View style={styles.metricContent}>
                <ThemedText style={styles.metricValue}>
                  {activeMembers.length}
                </ThemedText>
                <ThemedText style={styles.metricLabel}>
                  Active Members
                </ThemedText>
              </View>
            </LinearGradient>
          </View>
        </View>

        <View style={styles.metricsRow}>
          <View style={styles.metricCard}>
            <LinearGradient
              colors={[DESIGN.colors.warning, "#d97706"]}
              style={styles.metricGradient}
            >
              <View style={styles.metricIcon}>
                <Ionicons
                  name="restaurant"
                  size={24}
                  color={DESIGN.colors.white}
                />
              </View>
              <View style={styles.metricContent}>
                <ThemedText style={styles.metricValue}>
                  {monthlyMealStats.totalMeals}
                </ThemedText>
                <ThemedText style={styles.metricLabel}>Total Meals</ThemedText>
              </View>
            </LinearGradient>
          </View>

          <View style={styles.metricCard}>
            <LinearGradient
              colors={[DESIGN.colors.info, "#2563eb"]}
              style={styles.metricGradient}
            >
              <View style={styles.metricIcon}>
                <Ionicons name="wallet" size={24} color={DESIGN.colors.white} />
              </View>
              <View style={styles.metricContent}>
                <ThemedText style={styles.metricValue}>
                  ৳{currentBalance.toLocaleString()}
                </ThemedText>
                <ThemedText style={styles.metricLabel}>Balance</ThemedText>
              </View>
            </LinearGradient>
          </View>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.actionsSection}>
        <ThemedText style={styles.sectionTitle}>Quick Actions</ThemedText>
        <View style={styles.actionsGrid}>
          {[
            {
              title: "Add Meal",
              icon: "restaurant",
              color: DESIGN.colors.success,
              action: "add-meal",
            },
            {
              title: "Add Bazar",
              icon: "cart",
              color: DESIGN.colors.warning,
              action: "add-bazar",
            },
            {
              title: "View Expenses",
              icon: "card",
              color: DESIGN.colors.danger,
              action: "view-expenses",
            },
            {
              title: "View Revenue",
              icon: "trending-up",
              color: DESIGN.colors.primary,
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
                <Ionicons
                  name={action.icon as any}
                  size={28}
                  color={DESIGN.colors.white}
                />
                <ThemedText style={styles.actionTitle}>
                  {action.title}
                </ThemedText>
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Recent Activity */}
      <View style={styles.activitySection}>
        <View style={styles.sectionHeader}>
          <ThemedText style={styles.sectionTitle}>Recent Activity</ThemedText>
          <TouchableOpacity onPress={() => router.push("/recent-activity")}>
            <ThemedText style={styles.viewAllText}>View All</ThemedText>
          </TouchableOpacity>
        </View>
        <View style={styles.activityList}>
          {(recentActivities || []).slice(0, 3).map((activity, index) => (
            <View key={index} style={styles.activityItem}>
              <View style={styles.activityIcon}>
                <LinearGradient
                  colors={[DESIGN.colors.primary, DESIGN.colors.secondary]}
                  style={styles.activityIconGradient}
                >
                  <Ionicons
                    name={activity.icon as any}
                    size={16}
                    color={DESIGN.colors.white}
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
                <ThemedText style={styles.activityTime}>
                  {activity.time}
                </ThemedText>
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
    backgroundColor: DESIGN.colors.light,
  },
  contentContainer: {
    padding: DESIGN.spacing.lg,
    paddingBottom: 100,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: DESIGN.spacing.xxl,
  },
  headerContent: {
    flex: 1,
  },
  greeting: {
    fontSize: 16,
    color: DESIGN.colors.gray[600],
    marginBottom: DESIGN.spacing.xs,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: DESIGN.colors.dark,
    marginBottom: DESIGN.spacing.xs,
  },
  subtitle: {
    fontSize: 14,
    color: DESIGN.colors.gray[500],
  },
  notificationButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: "hidden",
    ...DESIGN.shadows.medium,
  },
  notificationGradient: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  metricsSection: {
    marginBottom: DESIGN.spacing.xxl,
  },
  metricsRow: {
    flexDirection: "row",
    gap: DESIGN.spacing.md,
    marginBottom: DESIGN.spacing.md,
  },
  metricCard: {
    flex: 1,
    borderRadius: DESIGN.borderRadius.lg,
    overflow: "hidden",
    ...DESIGN.shadows.medium,
  },
  metricGradient: {
    padding: DESIGN.spacing.lg,
    flexDirection: "row",
    alignItems: "center",
  },
  metricIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: DESIGN.spacing.md,
  },
  metricContent: {
    flex: 1,
  },
  metricValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: DESIGN.colors.white,
    marginBottom: DESIGN.spacing.xs,
  },
  metricLabel: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.8)",
  },
  actionsSection: {
    marginBottom: DESIGN.spacing.xxl,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: DESIGN.colors.dark,
    marginBottom: DESIGN.spacing.lg,
  },
  actionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: DESIGN.spacing.md,
  },
  actionCard: {
    width: "48%",
    aspectRatio: 1,
    borderRadius: DESIGN.borderRadius.lg,
    overflow: "hidden",
    ...DESIGN.shadows.medium,
  },
  actionGradient: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: DESIGN.spacing.lg,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: DESIGN.colors.white,
    marginTop: DESIGN.spacing.sm,
    textAlign: "center",
  },
  activitySection: {
    marginBottom: DESIGN.spacing.xxl,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: DESIGN.spacing.lg,
  },
  viewAllText: {
    fontSize: 14,
    color: DESIGN.colors.primary,
    fontWeight: "600",
  },
  activityList: {
    backgroundColor: DESIGN.colors.white,
    borderRadius: DESIGN.borderRadius.lg,
    padding: DESIGN.spacing.lg,
    ...DESIGN.shadows.medium,
  },
  activityItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: DESIGN.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: DESIGN.colors.gray[100],
  },
  activityIcon: {
    marginRight: DESIGN.spacing.md,
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
    fontSize: 16,
    fontWeight: "600",
    color: DESIGN.colors.dark,
    marginBottom: DESIGN.spacing.xs,
  },
  activityDescription: {
    fontSize: 14,
    color: DESIGN.colors.gray[600],
    marginBottom: DESIGN.spacing.xs,
    lineHeight: 20,
  },
  activityTime: {
    fontSize: 12,
    color: DESIGN.colors.gray[500],
  },
});
