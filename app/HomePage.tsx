import {
  BarChart,
  LineChart,
  PieChart,
  ProgressChart,
  StatsGrid,
} from "@/components/ModernCharts";
import { ThemedText } from "@/components/ThemedText";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import {
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";

const { width } = Dimensions.get("window");

export default function HomePage() {
  const router = useRouter();
  // Example data (replace with real API data)
  const totalMeals = 87;
  const currentMealRate = 45.5; // BDT
  const totalBazar = 3200; // BDT
  const monthSummary = {
    meals: 87,
    bazar: 3200,
    rate: 45.5,
    balance: 500, // BDT
  };
  const mealData = [3, 2, 4, 3, 5, 2, 4];
  // Modern quick stats
  const quickStats = [
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
  ];
  const lastActivity = [
    {
      label: "Last Meal",
      value: "Lunch",
      icon: "fast-food" as const,
      color: "#6366f1",
      time: "Today, 1:30pm",
    },
    {
      label: "Last Bazar",
      value: "Mahbub",
      icon: "person" as const,
      color: "#10b981",
      time: "Yesterday, 7:00pm",
    },
  ];

  // Mock data for charts with forecasting
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

  const monthlyRevenueData = [
    { date: "Week 1", value: 8500, forecast: 9000 },
    { date: "Week 2", value: 9200, forecast: 9500 },
    { date: "Week 3", value: 7800, forecast: 8200 },
    { date: "Week 4", value: 10500, forecast: 11000 },
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

  const memberActivityData = [
    {
      label: "Mahbub",
      value: 87,
      forecast: 92,
      color: "#667eea",
      gradient: ["#667eea", "#764ba2"] as const,
      trend: "up" as const,
    },
    {
      label: "Rahim",
      value: 76,
      forecast: 78,
      color: "#f093fb",
      gradient: ["#f093fb", "#f5576c"] as const,
      trend: "up" as const,
    },
    {
      label: "Karim",
      value: 82,
      forecast: 85,
      color: "#43e97b",
      gradient: ["#43e97b", "#38f9d7"] as const,
      trend: "up" as const,
    },
    {
      label: "Salam",
      value: 45,
      forecast: 50,
      color: "#f59e0b",
      gradient: ["#fbbf24", "#f59e0b"] as const,
      trend: "up" as const,
    },
  ];

  // Modern navigation cards
  const cards = [
    {
      key: "my-mess",
      icon: "home" as const,
      title: "My Mess",
      desc: "View and manage your mess",
      onPress: () => router.push("/HomePage"),
      show: true,
      gradient: ["#667eea", "#764ba2"] as const,
    },
    {
      key: "meals",
      icon: "fast-food" as const,
      title: "Meals",
      desc: "Submit and track daily meals",
      onPress: () => router.push("/(tabs)/meals"),
      show: true,
      gradient: ["#f093fb", "#f5576c"] as const,
    },
    {
      key: "bazar",
      icon: "cart" as const,
      title: "Bazar",
      desc: "Upload and review bazar lists",
      onPress: () => router.push("/(tabs)/explore"),
      show: true,
      gradient: ["#4facfe", "#00f2fe"] as const,
    },
    {
      key: "notifications",
      icon: "notifications" as const,
      title: "Notifications",
      desc: "View mess notifications",
      onPress: () => router.push("/notifications"),
      show: true,
      gradient: ["#43e97b", "#38f9d7"] as const,
    },
    {
      key: "settings",
      icon: "settings" as const,
      title: "Settings",
      desc: "App and mess settings",
      onPress: () => router.push("/settings"),
      show: true,
      gradient: ["#fa709a", "#fee140"] as const,
    },
    {
      key: "help",
      icon: "help-circle" as const,
      title: "Help",
      desc: "Get help and support",
      onPress: () => router.push("/help"),
      show: true,
      gradient: ["#a8edea", "#fed6e3"] as const,
    },
    {
      key: "profile",
      icon: "person-circle" as const,
      title: "Profile",
      desc: "View and edit your profile",
      onPress: () => router.push("/profile"),
      show: true,
      gradient: ["#ffecd2", "#fcb69f"] as const,
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
        <StatsGrid stats={quickStats} />

        {/* Main Stats Cards */}
        <View style={styles.mainStatsContainer}>
          <View style={styles.mainStatCard}>
            <LinearGradient
              colors={["#667eea", "#764ba2"]}
              style={styles.mainStatGradient}
            >
              <Ionicons name="fast-food" size={24} color="#fff" />
              <ThemedText style={styles.mainStatValue}>{totalMeals}</ThemedText>
              <ThemedText style={styles.mainStatLabel}>Total Meals</ThemedText>
            </LinearGradient>
          </View>

          <View style={styles.mainStatCard}>
            <LinearGradient
              colors={["#f093fb", "#f5576c"]}
              style={styles.mainStatGradient}
            >
              <Ionicons name="cash" size={24} color="#fff" />
              <ThemedText style={styles.mainStatValue}>
                {currentMealRate}৳
              </ThemedText>
              <ThemedText style={styles.mainStatLabel}>Meal Rate</ThemedText>
            </LinearGradient>
          </View>

          <View style={styles.mainStatCard}>
            <LinearGradient
              colors={["#4facfe", "#00f2fe"]}
              style={styles.mainStatGradient}
            >
              <Ionicons name="cart" size={24} color="#fff" />
              <ThemedText style={styles.mainStatValue}>
                {totalBazar}৳
              </ThemedText>
              <ThemedText style={styles.mainStatLabel}>Total Bazar</ThemedText>
            </LinearGradient>
          </View>
        </View>

        {/* Recent Activity */}
        <View style={styles.activityContainer}>
          <ThemedText style={styles.sectionTitle}>Recent Activity</ThemedText>
          <View style={styles.activityCards}>
            {lastActivity.map((item, idx) => (
              <View key={item.label} style={styles.activityCard}>
                <View
                  style={[styles.activityIcon, { backgroundColor: item.color }]}
                >
                  <Ionicons name={item.icon} size={16} color="#fff" />
                </View>
                <View style={styles.activityContent}>
                  <ThemedText style={styles.activityValue}>
                    {item.value}
                  </ThemedText>
                  <ThemedText style={styles.activityLabel}>
                    {item.label}
                  </ThemedText>
                  <ThemedText style={styles.activityTime}>
                    {item.time}
                  </ThemedText>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Weekly Meal Chart */}
        <BarChart
          data={weeklyMealsData}
          title="Weekly Meal Consumption"
          height={200}
          onBarPress={handleBarPress}
        />

        {/* Monthly Revenue Trend */}
        <LineChart
          data={monthlyRevenueData}
          title="Monthly Revenue Trend (৳)"
          color="#667eea"
          onPointPress={handleLinePointPress}
        />

        {/* Progress Charts */}
        <View style={styles.progressSection}>
          <ThemedText style={styles.sectionTitle}>Monthly Goals</ThemedText>
          <ProgressChart
            title="Revenue Target"
            current={32400}
            target={40000}
            gradient={["#667eea", "#764ba2"]}
          />
          <ProgressChart
            title="Meal Participation"
            current={85}
            target={100}
            gradient={["#f093fb", "#f5576c"]}
          />
          <ProgressChart
            title="Member Satisfaction"
            current={92}
            target={100}
            gradient={["#43e97b", "#38f9d7"]}
          />
        </View>

        {/* Expense Breakdown */}
        <PieChart
          data={expenseBreakdownData}
          title="Expense Breakdown (%)"
          onSlicePress={handlePieSlicePress}
        />

        {/* Member Activity */}
        <BarChart
          data={memberActivityData}
          title="Member Activity (Total Meals)"
          height={180}
        />

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
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: 16,
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
  progressSection: {
    marginBottom: 24,
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
