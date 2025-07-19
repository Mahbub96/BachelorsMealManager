import { SwappableStats } from "@/components/dashboard/SwappableStats";
import {
  BarChart,
  PieChart,
  ProgressChart,
  SwappableLineChart,
} from "@/components/ModernCharts";
import { ThemedText } from "@/components/ThemedText";
import { useMessData } from "@/context/MessDataContext";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import {
  Alert,
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";

const { width } = Dimensions.get("window");

export default function HomePage() {
  const router = useRouter();
  const {
    quickStats,
    monthlyMealStats,
    currentMonthRevenue,
    weeklyMealsData,
    monthlyRevenueData,
    monthlyRevenue,
    expenseBreakdownData,
    memberActivityData,
    recentActivities,
  } = useMessData();

  // Chart interaction handlers
  const handleBarPress = (item: any, index: number) => {
    console.log(`Bar pressed: ${item.label} - ${item.value}`);
    // You can add navigation or detailed view here
  };

  const handleLinePointPress = (item: any, index: number) => {
    console.log(`Line point pressed: ${item.date} - ${item.value}`);
    // You can add navigation or detailed view here
  };

  const handlePieSlicePress = (item: any, index: number) => {
    console.log(`Pie slice pressed: ${item.label} - ${item.value}`);
    // You can add navigation or detailed view here
  };

  // Convert quickStats to the format expected by SwappableStats
  const swappableStats = [
    {
      id: "total-members",
      title: "Total Members",
      value: quickStats.totalMembers.toString(),
      icon: "people",
      gradient: ["#667eea", "#764ba2"] as const,
      unit: "members",
    },
    {
      id: "monthly-expense",
      title: "Monthly Expense",
      value: `৳${quickStats.monthlyExpense.toLocaleString()}`,
      icon: "cash",
      gradient: ["#f093fb", "#f5576c"] as const,
      unit: "BDT",
    },
    {
      id: "average-meals",
      title: "Average Meals",
      value: quickStats.averageMeals.toFixed(1),
      icon: "restaurant",
      gradient: ["#43e97b", "#38f9d7"] as const,
      unit: "per day",
    },
    {
      id: "balance",
      title: "Balance",
      value: `৳${quickStats.balance.toLocaleString()}`,
      icon: "wallet",
      gradient: ["#fa709a", "#fee140"] as const,
      unit: "BDT",
    },
  ];

  // Navigation cards
  const cards = [
    {
      key: "add-meal",
      icon: "fast-food" as const,
      title: "Add Meal",
      desc: "Record today's meals",
      onPress: () => router.push("/(tabs)/meals"),
      show: true,
      gradient: ["#667eea", "#764ba2"] as const,
    },
    {
      key: "add-bazar",
      icon: "cart" as const,
      title: "Add Bazar",
      desc: "Upload bazar list",
      onPress: () => router.push("/(tabs)/explore"),
      show: true,
      gradient: ["#f093fb", "#f5576c"] as const,
    },
    {
      key: "view-reports",
      icon: "analytics" as const,
      title: "Reports",
      desc: "View analytics",
      onPress: () => router.push("/(tabs)/admin"),
      show: true,
      gradient: ["#43e97b", "#38f9d7"] as const,
    },
    {
      key: "settings",
      icon: "settings" as const,
      title: "Settings",
      desc: "Manage preferences",
      onPress: () => router.push("/settings"),
      show: true,
      gradient: ["#fa709a", "#fee140"] as const,
    },
    // Admin-only cards
    {
      key: "member-management",
      icon: "people" as const,
      title: "Member Management",
      desc: "Add, edit, or remove members",
      onPress: () => router.push("/(tabs)/admin"),
      show: true,
      gradient: ["#667eea", "#764ba2"] as const,
    },
    {
      key: "approve-meals",
      icon: "checkmark-done-circle" as const,
      title: "Approve Meals",
      desc: "Review and approve daily meal entries",
      onPress: () => router.push("/(tabs)/admin"),
      show: true,
      gradient: ["#f093fb", "#f5576c"] as const,
    },
    {
      key: "bazar-submissions",
      icon: "document-attach" as const,
      title: "Bazar Submissions",
      desc: "Review and approve bazar uploads",
      onPress: () => router.push("/(tabs)/admin"),
      show: true,
      gradient: ["#4facfe", "#00f2fe"] as const,
    },
    {
      key: "monthly-summary",
      icon: "stats-chart" as const,
      title: "Monthly Summary",
      desc: "View monthly summary and stats",
      onPress: () => router.push("/(tabs)/admin"),
      show: true,
      gradient: ["#43e97b", "#38f9d7"] as const,
    },
  ];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header Section */}
      <LinearGradient
        colors={["#667eea", "#764ba2"]}
        style={styles.headerGradient}
      >
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <ThemedText style={styles.headerTitle}>
              Bachelor Mess Manager
            </ThemedText>
            <ThemedText style={styles.headerSubtitle}>
              Welcome back! Here&apos;s your mess overview
            </ThemedText>
          </View>
          <View style={styles.headerIcon}>
            <Ionicons name="restaurant" size={32} color="#fff" />
          </View>
        </View>
      </LinearGradient>

      <View style={styles.content}>
        {/* Quick Stats */}
        <SwappableStats stats={swappableStats} />

        {/* Main Stats Cards */}
        <View style={styles.mainStatsContainer}>
          <Pressable
            style={styles.mainStatCard}
            onPress={() => {
              // Navigate to meal details or show meal statistics
              router.push("/(tabs)/meals");
            }}
          >
            <LinearGradient
              colors={["#667eea", "#764ba2"]}
              style={styles.mainStatGradient}
            >
              <Ionicons name="fast-food" size={24} color="#fff" />
              <ThemedText style={styles.mainStatValue}>
                {monthlyMealStats.totalMeals}
              </ThemedText>
              <ThemedText style={styles.mainStatLabel}>Total Meals</ThemedText>
            </LinearGradient>
          </Pressable>

          <Pressable
            style={styles.mainStatCard}
            onPress={() => {
              // Navigate to expense details
              router.push({
                pathname: "/expense-details",
                params: {
                  title: "Meal Cost Details",
                  value: monthlyMealStats.totalCost.toString(),
                  type: "meal-cost",
                  color: "#f093fb",
                  description:
                    "Detailed breakdown of meal costs including ingredients, preparation, and overhead expenses.",
                  notes:
                    "Meal costs are calculated based on daily consumption and market prices.",
                },
              });
            }}
          >
            <LinearGradient
              colors={["#f093fb", "#f5576c"]}
              style={styles.mainStatGradient}
            >
              <Ionicons name="cash" size={24} color="#fff" />
              <ThemedText style={styles.mainStatValue}>
                {monthlyMealStats.totalCost}৳
              </ThemedText>
              <ThemedText style={styles.mainStatLabel}>Meal Cost</ThemedText>
            </LinearGradient>
          </Pressable>

          <Pressable
            style={styles.mainStatCard}
            onPress={() => {
              // Navigate to expense details
              router.push({
                pathname: "/expense-details",
                params: {
                  title: "Monthly Expenses",
                  value: currentMonthRevenue.expenses.toString(),
                  type: "monthly",
                  color: "#4facfe",
                  description:
                    "Comprehensive breakdown of all monthly expenses including groceries, utilities, and maintenance costs.",
                  notes:
                    "This data is updated daily and reflects current market conditions.",
                },
              });
            }}
          >
            <LinearGradient
              colors={["#4facfe", "#00f2fe"]}
              style={styles.mainStatGradient}
            >
              <Ionicons name="cart" size={24} color="#fff" />
              <ThemedText style={styles.mainStatValue}>
                {currentMonthRevenue.expenses.toLocaleString()}৳
              </ThemedText>
              <ThemedText style={styles.mainStatLabel}>
                Monthly Expense
              </ThemedText>
            </LinearGradient>
          </Pressable>
        </View>

        {/* Recent Activity */}
        <View style={styles.activityContainer}>
          <View style={styles.activityHeader}>
            <ThemedText style={styles.sectionTitle}>Recent Activity</ThemedText>
            <Pressable
              style={styles.seeMoreButton}
              onPress={() => router.push("/recent-activity")}
            >
              <ThemedText style={styles.seeMoreText}>See More</ThemedText>
              <Ionicons name="chevron-forward" size={16} color="#667eea" />
            </Pressable>
          </View>
          <View style={styles.activityCards}>
            {(recentActivities || []).slice(0, 2).map((activity) => (
              <Pressable
                key={activity.id}
                style={styles.activityCard}
                onPress={() => {
                  // Navigate to activity detail page
                  router.push({
                    pathname: "/activity-details",
                    params: {
                      id: activity.id,
                      type: activity.type,
                      title: activity.title,
                      description: activity.description,
                      time: activity.time,
                      user: activity.user || "",
                      amount: activity.amount?.toString() || "",
                      priority: activity.priority,
                      status: activity.status || "",
                    },
                  });
                }}
              >
                <View
                  style={[
                    styles.activityIcon,
                    { backgroundColor: getActivityColor(activity.type) },
                  ]}
                >
                  <Ionicons
                    name={getActivityIcon(activity.type) as any}
                    size={16}
                    color="#fff"
                  />
                </View>
                <View style={styles.activityContent}>
                  <ThemedText style={styles.activityValue}>
                    {activity.title}
                  </ThemedText>
                  <ThemedText style={styles.activityLabel}>
                    {activity.description}
                  </ThemedText>
                  <ThemedText style={styles.activityTime}>
                    {activity.time}
                  </ThemedText>
                </View>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Analytics Section */}
        <View style={styles.analyticsContainer}>
          <View style={styles.analyticsHeader}>
            <ThemedText style={styles.analyticsTitle}>
              Analytics Dashboard
            </ThemedText>
            <ThemedText style={styles.analyticsSubtitle}>
              Key insights and performance metrics
            </ThemedText>
          </View>

          {/* Charts Grid */}
          <View style={styles.chartsGrid}>
            {/* Weekly Meal Chart */}
            <View style={styles.chartCard}>
              <BarChart
                data={weeklyMealsData}
                title="Weekly Meal Consumption"
                height={220}
                onBarPress={handleBarPress}
              />
            </View>

            {/* Monthly Revenue Trend */}
            <View style={styles.chartCard}>
              <SwappableLineChart
                monthlyRevenue={monthlyRevenue.slice(-6).map((item) => ({
                  month: item.month,
                  revenue: item.revenue,
                  details: {
                    expenses: item.expenses,
                    profit: item.profit,
                    memberCount: item.memberCount,
                    averageMeals: item.averageMeals,
                    efficiency: Math.round((item.profit / item.revenue) * 100),
                    growthRate:
                      item.revenue >
                      (monthlyRevenue[monthlyRevenue.length - 2]?.revenue || 0)
                        ? Math.round(
                            ((item.revenue -
                              (monthlyRevenue[monthlyRevenue.length - 2]
                                ?.revenue || 0)) /
                              (monthlyRevenue[monthlyRevenue.length - 2]
                                ?.revenue || 1)) *
                              100
                          )
                        : Math.round(
                            ((item.revenue -
                              (monthlyRevenue[monthlyRevenue.length - 2]
                                ?.revenue || 0)) /
                              (monthlyRevenue[monthlyRevenue.length - 2]
                                ?.revenue || 1)) *
                              100
                          ),
                    costPerMeal: Math.round(
                      item.expenses /
                        (item.memberCount * item.averageMeals * 30)
                    ),
                    revenuePerMember: Math.round(
                      item.revenue / item.memberCount
                    ),
                  },
                }))}
                title="Monthly Revenue Trend (৳)"
                color="#667eea"
                onPointPress={(item) => {
                  const details = item.details || {};
                  const growthEmoji = details.growthRate >= 0 ? "📈" : "📉";
                  const efficiencyEmoji =
                    details.efficiency >= 80
                      ? "🟢"
                      : details.efficiency >= 60
                      ? "🟡"
                      : "🔴";

                  Alert.alert(
                    `${item.date} - Revenue Analysis`,
                    `${growthEmoji} Revenue: ${formatCurrency(item.value)}\n` +
                      `💰 Expenses: ${formatCurrency(
                        details.expenses || 0
                      )}\n` +
                      `💵 Profit: ${formatCurrency(details.profit || 0)}\n` +
                      `📊 Efficiency: ${efficiencyEmoji} ${
                        details.efficiency || 0
                      }%\n` +
                      `👥 Members: ${details.memberCount || 0}\n` +
                      `🍽️ Avg Meals/Day: ${details.averageMeals || 0}\n` +
                      `💸 Cost/Meal: ${formatCurrency(
                        details.costPerMeal || 0
                      )}\n` +
                      `👤 Revenue/Member: ${formatCurrency(
                        details.revenuePerMember || 0
                      )}\n` +
                      `📈 Growth Rate: ${details.growthRate >= 0 ? "+" : ""}${
                        details.growthRate || 0
                      }%`
                  );
                }}
              />
            </View>
          </View>

          {/* Progress Charts Grid */}
          <View style={styles.progressGrid}>
            <View style={styles.progressCard}>
              <ProgressChart
                title="Revenue Target"
                current={currentMonthRevenue.revenue}
                target={40000}
                gradient={["#667eea", "#764ba2"]}
              />
            </View>
            <View style={styles.progressCard}>
              <ProgressChart
                title="Meal Participation"
                current={Math.round(monthlyMealStats.averagePerDay * 100)}
                target={100}
                gradient={["#f093fb", "#f5576c"]}
              />
            </View>
            <View style={styles.progressCard}>
              <ProgressChart
                title="Member Satisfaction"
                current={92}
                target={100}
                gradient={["#43e97b", "#38f9d7"]}
              />
            </View>
          </View>

          {/* Bottom Charts Row */}
          <View style={styles.bottomChartsRow}>
            {/* Expense Breakdown */}
            <View style={styles.bottomChartCard}>
              <PieChart
                data={expenseBreakdownData}
                title="Expense Breakdown (%)"
                onSlicePress={handlePieSlicePress}
              />
            </View>

            {/* Member Activity */}
            <View style={styles.bottomChartCard}>
              <BarChart
                data={memberActivityData}
                title="Member Activity (Total Meals)"
                height={200}
              />
            </View>
          </View>
        </View>

        {/* Navigation Cards */}
        <View style={styles.navigationContainer}>
          <ThemedText style={styles.sectionTitle}>Quick Actions</ThemedText>
          <View style={styles.navigationGrid}>
            {cards
              .filter(
                (card) =>
                  card.show &&
                  ![
                    "member-management",
                    "approve-meals",
                    "bazar-submissions",
                    "monthly-summary",
                  ].includes(card.key)
              )
              .map((card) => (
                <Pressable
                  key={card.key}
                  style={styles.navigationCard}
                  onPress={card.onPress}
                >
                  <LinearGradient
                    colors={card.gradient}
                    style={styles.navigationGradient}
                  >
                    <Ionicons name={card.icon} size={24} color="#fff" />
                    <ThemedText style={styles.navigationTitle}>
                      {card.title}
                    </ThemedText>
                    <ThemedText style={styles.navigationDesc}>
                      {card.desc}
                    </ThemedText>
                  </LinearGradient>
                </Pressable>
              ))}
          </View>
        </View>

        {/* Admin Section */}
        <View style={styles.adminContainer}>
          <ThemedText style={styles.sectionTitle}>Admin Tools</ThemedText>
          <View style={styles.navigationGrid}>
            {cards
              .filter(
                (card) =>
                  card.show &&
                  [
                    "member-management",
                    "approve-meals",
                    "bazar-submissions",
                    "monthly-summary",
                  ].includes(card.key)
              )
              .map((card) => (
                <Pressable
                  key={card.key}
                  style={styles.navigationCard}
                  onPress={card.onPress}
                >
                  <LinearGradient
                    colors={card.gradient}
                    style={styles.navigationGradient}
                  >
                    <Ionicons name={card.icon} size={24} color="#fff" />
                    <ThemedText style={styles.navigationTitle}>
                      {card.title}
                    </ThemedText>
                    <ThemedText style={styles.navigationDesc}>
                      {card.desc}
                    </ThemedText>
                  </LinearGradient>
                </Pressable>
              ))}
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

// Helper functions for activity display
const getActivityColor = (type: string) => {
  switch (type) {
    case "meal":
      return "#10b981";
    case "bazar":
      return "#6366f1";
    case "payment":
      return "#f59e0b";
    case "member":
      return "#8b5cf6";
    case "approval":
      return "#ef4444";
    default:
      return "#6b7280";
  }
};

const getActivityIcon = (type: string) => {
  switch (type) {
    case "meal":
      return "restaurant";
    case "bazar":
      return "cart";
    case "payment":
      return "card";
    case "member":
      return "person-add";
    case "approval":
      return "checkmark-circle";
    default:
      return "information-circle";
  }
};

const formatCurrency = (value: number) => {
  return `৳${value.toLocaleString()}`;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  headerGradient: {
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.9)",
  },
  headerIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    padding: 20,
  },
  mainStatsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  mainStatCard: {
    flex: 1,
    marginHorizontal: 4,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  mainStatGradient: {
    padding: 20,
    alignItems: "center",
  },
  mainStatValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    marginTop: 8,
    marginBottom: 4,
  },
  mainStatLabel: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.9)",
  },
  activityContainer: {
    marginBottom: 24,
  },
  activityHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1f2937",
  },
  seeMoreButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  seeMoreText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#667eea",
  },
  activityCards: {
    gap: 12,
  },
  activityCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: 2,
  },
  activityLabel: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 2,
  },
  activityTime: {
    fontSize: 12,
    color: "#9ca3af",
  },
  analyticsContainer: {
    marginBottom: 32,
    backgroundColor: "#f8fafc",
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  analyticsHeader: {
    marginBottom: 24,
    alignItems: "center",
  },
  analyticsTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: 8,
    textAlign: "center",
  },
  analyticsSubtitle: {
    fontSize: 16,
    color: "#6b7280",
    textAlign: "center",
  },
  chartsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
    gap: 12,
  },
  chartCard: {
    flex: 1,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  progressGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
    gap: 12,
  },
  progressCard: {
    flex: 1,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  bottomChartsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  bottomChartCard: {
    flex: 1,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  navigationContainer: {
    marginBottom: 24,
  },
  navigationGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  navigationCard: {
    width: (width - 60) / 2,
    marginBottom: 16,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  navigationGradient: {
    padding: 20,
    alignItems: "center",
    minHeight: 120,
  },
  navigationTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
    marginTop: 8,
    marginBottom: 4,
    textAlign: "center",
  },
  navigationDesc: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.9)",
    textAlign: "center",
    lineHeight: 16,
  },
  adminContainer: {
    marginBottom: 24,
  },
});
