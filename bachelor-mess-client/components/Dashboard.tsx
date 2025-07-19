import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Dimensions,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import {
  BarChart,
  LineChart,
  PieChart,
  ProgressChart,
  StatsGrid,
} from "./ModernCharts";
import { ThemedText } from "./ThemedText";

const { width } = Dimensions.get("window");

interface DashboardProps {
  onRefresh?: () => void;
  refreshing?: boolean;
}

interface QuickAction {
  id: string;
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  gradient: [string, string];
  onPress: () => void;
}

interface ActivityItem {
  id: string;
  type: "meal" | "bazar" | "payment" | "notification";
  title: string;
  subtitle: string;
  time: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}

export const Dashboard: React.FC<DashboardProps> = ({
  onRefresh,
  refreshing = false,
}) => {
  const router = useRouter();
  const [selectedTimeframe, setSelectedTimeframe] = useState<
    "week" | "month" | "year"
  >("week");

  // Mock data - replace with real API data
  const stats = [
    {
      title: "Total Members",
      value: "12",
      icon: "people",
      gradient: ["#667eea", "#764ba2"] as const,
    },
    {
      title: "This Month",
      value: "৳32,400",
      icon: "cash",
      gradient: ["#f093fb", "#f5576c"] as const,
    },
    {
      title: "Avg. Meals",
      value: "2.4",
      icon: "restaurant",
      gradient: ["#43e97b", "#38f9d7"] as const,
    },
    {
      title: "Balance",
      value: "৳1,200",
      icon: "wallet",
      gradient: ["#fa709a", "#fee140"] as const,
    },
  ];

  const quickActions: QuickAction[] = [
    {
      id: "add-meal",
      title: "Add Meal",
      subtitle: "Record today's meal",
      icon: "fast-food",
      gradient: ["#667eea", "#764ba2"],
      onPress: () => router.push("/(tabs)/meals"),
    },
    {
      id: "add-bazar",
      title: "Add Bazar",
      subtitle: "Upload bazar list",
      icon: "cart",
      gradient: ["#f093fb", "#f5576c"],
      onPress: () => router.push("/(tabs)/explore"),
    },
    {
      id: "view-reports",
      title: "Reports",
      subtitle: "View analytics",
      icon: "analytics",
      gradient: ["#43e97b", "#38f9d7"],
      onPress: () => Alert.alert("Reports", "Reports feature coming soon!"),
    },
    {
      id: "settings",
      title: "Settings",
      subtitle: "Manage preferences",
      icon: "settings",
      gradient: ["#fa709a", "#fee140"],
      onPress: () => router.push("/settings"),
    },
  ];

  const recentActivity: ActivityItem[] = [
    {
      id: "1",
      type: "meal",
      title: "Lunch added",
      subtitle: "Mahbub Alam recorded lunch meal",
      time: "2 hours ago",
      icon: "fast-food",
      color: "#10b981",
    },
    {
      id: "2",
      type: "bazar",
      title: "Bazar uploaded",
      subtitle: "Karim uploaded bazar list",
      time: "4 hours ago",
      icon: "cart",
      color: "#6366f1",
    },
    {
      id: "3",
      type: "payment",
      title: "Payment received",
      subtitle: "Rahim paid ৳500",
      time: "1 day ago",
      icon: "card",
      color: "#f59e0b",
    },
    {
      id: "4",
      type: "notification",
      title: "New member joined",
      subtitle: "Salam joined the mess",
      time: "2 days ago",
      icon: "person-add",
      color: "#8b5cf6",
    },
  ];

  const weeklyMealsData = [
    {
      label: "Mon",
      value: 12,
      forecast: 14,
      color: "#f59e0b",
      gradient: ["#fbbf24", "#f59e0b"] as const,
      trend: "up" as const,
    },
    {
      label: "Tue",
      value: 15,
      forecast: 16,
      color: "#10b981",
      gradient: ["#34d399", "#10b981"] as const,
      trend: "up" as const,
    },
    {
      label: "Wed",
      value: 18,
      forecast: 17,
      color: "#6366f1",
      gradient: ["#818cf8", "#6366f1"] as const,
      trend: "down" as const,
    },
    {
      label: "Thu",
      value: 14,
      forecast: 15,
      color: "#f093fb",
      gradient: ["#f093fb", "#f5576c"] as const,
      trend: "up" as const,
    },
    {
      label: "Fri",
      value: 16,
      forecast: 18,
      color: "#43e97b",
      gradient: ["#43e97b", "#38f9d7"] as const,
      trend: "up" as const,
    },
    {
      label: "Sat",
      value: 20,
      forecast: 22,
      color: "#667eea",
      gradient: ["#667eea", "#764ba2"] as const,
      trend: "up" as const,
    },
    {
      label: "Sun",
      value: 13,
      forecast: 15,
      color: "#f97316",
      gradient: ["#fb923c", "#f97316"] as const,
      trend: "up" as const,
    },
  ];

  const expenseBreakdownData = [
    {
      label: "Groceries",
      value: 45,
      forecast: 48,
      color: "#10b981",
      gradient: ["#34d399", "#10b981"] as const,
    },
    {
      label: "Utilities",
      value: 25,
      forecast: 26,
      color: "#6366f1",
      gradient: ["#818cf8", "#6366f1"] as const,
    },
    {
      label: "Maintenance",
      value: 20,
      forecast: 18,
      color: "#f59e0b",
      gradient: ["#fbbf24", "#f59e0b"] as const,
    },
    {
      label: "Others",
      value: 10,
      forecast: 12,
      color: "#f093fb",
      gradient: ["#f093fb", "#f5576c"] as const,
    },
  ];

  const monthlyRevenueData = [
    { date: "Week 1", value: 8500, forecast: 9000 },
    { date: "Week 2", value: 9200, forecast: 9500 },
    { date: "Week 3", value: 7800, forecast: 8200 },
    { date: "Week 4", value: 10500, forecast: 11000 },
  ];

  const getActivityIcon = (type: ActivityItem["type"]) => {
    switch (type) {
      case "meal":
        return "fast-food";
      case "bazar":
        return "cart";
      case "payment":
        return "card";
      case "notification":
        return "notifications";
      default:
        return "information-circle";
    }
  };

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <ThemedText style={styles.greeting}>Good morning! 👋</ThemedText>
          <ThemedText style={styles.subtitle}>
            Here&apos;s what&apos;s happening in your mess
          </ThemedText>
        </View>
        <Pressable
          style={styles.profileButton}
          onPress={() => router.push("/profile")}
        >
          <Ionicons name="person-circle" size={32} color="#667eea" />
        </Pressable>
      </View>

      {/* Stats Grid */}
      <View style={styles.section}>
        <StatsGrid stats={stats} />
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <ThemedText style={styles.sectionTitle}>Quick Actions</ThemedText>
        <View style={styles.quickActionsGrid}>
          {quickActions.map((action) => (
            <Pressable
              key={action.id}
              style={styles.quickActionCard}
              onPress={action.onPress}
            >
              <LinearGradient
                colors={action.gradient}
                style={styles.quickActionGradient}
              >
                <Ionicons name={action.icon} size={24} color="#fff" />
              </LinearGradient>
              <View style={styles.quickActionContent}>
                <ThemedText style={styles.quickActionTitle}>
                  {action.title}
                </ThemedText>
                <ThemedText style={styles.quickActionSubtitle}>
                  {action.subtitle}
                </ThemedText>
              </View>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Charts Section */}
      <View style={styles.section}>
        <View style={styles.chartHeader}>
          <ThemedText style={styles.sectionTitle}>Analytics</ThemedText>
          <View style={styles.timeframeSelector}>
            {(["week", "month", "year"] as const).map((timeframe) => (
              <Pressable
                key={timeframe}
                style={[
                  styles.timeframeButton,
                  selectedTimeframe === timeframe &&
                    styles.timeframeButtonActive,
                ]}
                onPress={() => setSelectedTimeframe(timeframe)}
              >
                <ThemedText
                  style={[
                    styles.timeframeText,
                    selectedTimeframe === timeframe &&
                      styles.timeframeTextActive,
                  ]}
                >
                  {timeframe.charAt(0).toUpperCase() + timeframe.slice(1)}
                </ThemedText>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Weekly Meals Chart */}
        <View style={styles.chartContainer}>
          <BarChart
            data={weeklyMealsData}
            title="Weekly Meals"
            height={200}
            showForecast={true}
            showTrend={true}
          />
        </View>

        {/* Revenue Chart */}
        <View style={styles.chartContainer}>
          <LineChart
            data={monthlyRevenueData}
            title="Monthly Revenue (৳)"
            color="#667eea"
            showForecast={true}
          />
        </View>

        {/* Expense Breakdown */}
        <View style={styles.chartContainer}>
          <PieChart
            data={expenseBreakdownData}
            title="Expense Breakdown"
            showForecast={true}
          />
        </View>
      </View>

      {/* Recent Activity */}
      <View style={styles.section}>
        <View style={styles.activityHeader}>
          <ThemedText style={styles.sectionTitle}>Recent Activity</ThemedText>
          <Pressable onPress={() => router.push("/notifications")}>
            <ThemedText style={styles.viewAllText}>View All</ThemedText>
          </Pressable>
        </View>
        <View style={styles.activityList}>
          {recentActivity.map((activity) => (
            <Pressable
              key={activity.id}
              style={styles.activityItem}
              onPress={() => {
                // Navigate to activity detail page
                router.push({
                  pathname: "/activity-details",
                  params: {
                    id: activity.id,
                    type: activity.type,
                    title: activity.title,
                    description: activity.subtitle,
                    time: activity.time,
                    user: "User",
                    amount: "0",
                    priority: "medium",
                    status: "completed",
                  },
                });
              }}
            >
              <View
                style={[
                  styles.activityIcon,
                  { backgroundColor: activity.color + "20" },
                ]}
              >
                <Ionicons
                  name={getActivityIcon(activity.type)}
                  size={20}
                  color={activity.color}
                />
              </View>
              <View style={styles.activityContent}>
                <ThemedText style={styles.activityTitle}>
                  {activity.title}
                </ThemedText>
                <ThemedText style={styles.activitySubtitle}>
                  {activity.subtitle}
                </ThemedText>
                <ThemedText style={styles.activityTime}>
                  {activity.time}
                </ThemedText>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#9ca3af" />
            </Pressable>
          ))}
        </View>
      </View>

      {/* Progress Section */}
      <View style={styles.section}>
        <ThemedText style={styles.sectionTitle}>Monthly Goals</ThemedText>
        <View style={styles.progressContainer}>
          <ProgressChart
            title="Meal Target"
            current={87}
            target={100}
            color="#10b981"
            gradient={["#34d399", "#10b981"]}
          />
          <ProgressChart
            title="Revenue Target"
            current={32400}
            target={40000}
            color="#6366f1"
            gradient={["#818cf8", "#6366f1"]}
          />
        </View>
      </View>

      {/* Bottom Spacing */}
      <View style={styles.bottomSpacing} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  greeting: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1f2937",
  },
  subtitle: {
    fontSize: 16,
    color: "#6b7280",
    marginTop: 4,
  },
  profileButton: {
    padding: 8,
  },
  section: {
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: 16,
  },
  quickActionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  quickActionCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    width: (width - 52) / 2,
  },
  quickActionGradient: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  quickActionContent: {
    flex: 1,
  },
  quickActionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 2,
  },
  quickActionSubtitle: {
    fontSize: 12,
    color: "#6b7280",
  },
  chartHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  timeframeSelector: {
    flexDirection: "row",
    backgroundColor: "#f3f4f6",
    borderRadius: 8,
    padding: 4,
  },
  timeframeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  timeframeButtonActive: {
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  timeframeText: {
    fontSize: 12,
    color: "#6b7280",
    fontWeight: "500",
  },
  timeframeTextActive: {
    color: "#1f2937",
    fontWeight: "600",
  },
  chartContainer: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  activityHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  viewAllText: {
    fontSize: 14,
    color: "#667eea",
    fontWeight: "600",
  },
  activityList: {
    backgroundColor: "#fff",
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  activityItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 2,
  },
  activitySubtitle: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 4,
  },
  activityTime: {
    fontSize: 12,
    color: "#9ca3af",
  },
  progressContainer: {
    gap: 16,
  },
  bottomSpacing: {
    height: 100,
  },
});

export default Dashboard;
