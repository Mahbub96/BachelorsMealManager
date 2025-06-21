import React, { useEffect, useState } from "react";
import { ThemedText } from "@/components/ThemedText";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  RefreshControl,
  Dimensions,
} from "react-native";
import { useAuth } from "@/context/AuthContext";
import DataService from "@/services/dataService";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import ErrorBoundary from "@/components/ErrorBoundary";

const { width } = Dimensions.get("window");

interface DashboardData {
  users: any[];
  mealStats: any;
  bazarStats: any;
  recentActivity: any[];
}

export default function HomePage() {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch dashboard data from backend
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await DataService.getDashboardData();
      setDashboardData(data);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      setError("Failed to load dashboard data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardData();
    setRefreshing(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "#10b981";
      case "pending":
        return "#f59e0b";
      case "inactive":
        return "#ef4444";
      default:
        return "#6b7280";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return "checkmark-circle";
      case "pending":
        return "time";
      case "inactive":
        return "close-circle";
      default:
        return "help-circle";
    }
  };

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={64} color="#ef4444" />
        <ThemedText style={styles.errorText}>{error}</ThemedText>
        <Pressable style={styles.retryButton} onPress={fetchDashboardData}>
          <ThemedText style={styles.retryButtonText}>Retry</ThemedText>
        </Pressable>
      </View>
    );
  }

  return (
    <ErrorBoundary>
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <LinearGradient
          colors={["#667eea", "#764ba2"]}
          style={styles.headerGradient}
        >
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <ThemedText style={styles.headerTitle}>Dashboard</ThemedText>
              <ThemedText style={styles.headerSubtitle}>
                Welcome back, {user?.name || "User"}!
              </ThemedText>
            </View>
            <View style={styles.headerIcon}>
              <Ionicons name="home" size={32} color="#fff" />
            </View>
          </View>
        </LinearGradient>

        <View style={styles.content}>
          {loading ? (
            <LoadingSpinner
              size="large"
              text="Loading dashboard..."
              type="spinner"
              color="#667eea"
            />
          ) : (
            dashboardData && (
              <>
                {/* Stats Cards */}
                <View style={styles.statsContainer}>
                  <View style={styles.statCard}>
                    <LinearGradient
                      colors={["#f093fb", "#f5576c"]}
                      style={styles.statGradient}
                    >
                      <Ionicons name="people" size={32} color="#fff" />
                      <ThemedText style={styles.statValue}>
                        {dashboardData.mealStats.totalMembers}
                      </ThemedText>
                      <ThemedText style={styles.statLabel}>
                        Total Members
                      </ThemedText>
                    </LinearGradient>
                  </View>

                  <View style={styles.statCard}>
                    <LinearGradient
                      colors={["#4facfe", "#00f2fe"]}
                      style={styles.statGradient}
                    >
                      <Ionicons name="restaurant" size={32} color="#fff" />
                      <ThemedText style={styles.statValue}>
                        {dashboardData.mealStats.totalMeals}
                      </ThemedText>
                      <ThemedText style={styles.statLabel}>
                        Total Meals
                      </ThemedText>
                    </LinearGradient>
                  </View>

                  <View style={styles.statCard}>
                    <LinearGradient
                      colors={["#43e97b", "#38f9d7"]}
                      style={styles.statGradient}
                    >
                      <Ionicons name="wallet" size={32} color="#fff" />
                      <ThemedText style={styles.statValue}>
                        ৳{dashboardData.bazarStats.totalBazar}
                      </ThemedText>
                      <ThemedText style={styles.statLabel}>
                        Total Bazar
                      </ThemedText>
                    </LinearGradient>
                  </View>

                  <View style={styles.statCard}>
                    <LinearGradient
                      colors={["#fa709a", "#fee140"]}
                      style={styles.statGradient}
                    >
                      <Ionicons name="trending-up" size={32} color="#fff" />
                      <ThemedText style={styles.statValue}>
                        ৳{dashboardData.mealStats.currentMonthRevenue}
                      </ThemedText>
                      <ThemedText style={styles.statLabel}>
                        Monthly Revenue
                      </ThemedText>
                    </LinearGradient>
                  </View>
                </View>

                {/* Quick Actions */}
                <View style={styles.quickActionsSection}>
                  <ThemedText style={styles.sectionTitle}>
                    Quick Actions
                  </ThemedText>
                  <View style={styles.quickActionsGrid}>
                    <Pressable style={styles.actionCard}>
                      <LinearGradient
                        colors={["#667eea", "#764ba2"]}
                        style={styles.actionGradient}
                      >
                        <Ionicons name="restaurant" size={24} color="#fff" />
                        <ThemedText style={styles.actionTitle}>
                          Submit Meals
                        </ThemedText>
                      </LinearGradient>
                    </Pressable>

                    <Pressable style={styles.actionCard}>
                      <LinearGradient
                        colors={["#f093fb", "#f5576c"]}
                        style={styles.actionGradient}
                      >
                        <Ionicons name="cart" size={24} color="#fff" />
                        <ThemedText style={styles.actionTitle}>
                          Add Bazar
                        </ThemedText>
                      </LinearGradient>
                    </Pressable>

                    <Pressable style={styles.actionCard}>
                      <LinearGradient
                        colors={["#4facfe", "#00f2fe"]}
                        style={styles.actionGradient}
                      >
                        <Ionicons name="people" size={24} color="#fff" />
                        <ThemedText style={styles.actionTitle}>
                          Members
                        </ThemedText>
                      </LinearGradient>
                    </Pressable>

                    <Pressable style={styles.actionCard}>
                      <LinearGradient
                        colors={["#43e97b", "#38f9d7"]}
                        style={styles.actionGradient}
                      >
                        <Ionicons name="stats-chart" size={24} color="#fff" />
                        <ThemedText style={styles.actionTitle}>
                          Reports
                        </ThemedText>
                      </LinearGradient>
                    </Pressable>
                  </View>
                </View>

                {/* Recent Activity */}
                <View style={styles.activitySection}>
                  <ThemedText style={styles.sectionTitle}>
                    Recent Activity
                  </ThemedText>
                  <View style={styles.activityList}>
                    {dashboardData.recentActivity.map((activity, index) => (
                      <View key={index} style={styles.activityItem}>
                        <View
                          style={[
                            styles.activityIcon,
                            { backgroundColor: activity.color },
                          ]}
                        >
                          <Ionicons
                            name={activity.icon}
                            size={20}
                            color="#fff"
                          />
                        </View>
                        <View style={styles.activityContent}>
                          <ThemedText style={styles.activityLabel}>
                            {activity.label}
                          </ThemedText>
                          <ThemedText style={styles.activityValue}>
                            {activity.value}
                          </ThemedText>
                          <ThemedText style={styles.activityTime}>
                            {activity.time}
                          </ThemedText>
                        </View>
                      </View>
                    ))}
                  </View>
                </View>

                {/* Members List */}
                <View style={styles.membersSection}>
                  <ThemedText style={styles.sectionTitle}>
                    Active Members
                  </ThemedText>
                  <View style={styles.membersList}>
                    {dashboardData.users.slice(0, 5).map((member) => (
                      <View key={member._id} style={styles.memberItem}>
                        <View style={styles.memberAvatar}>
                          <Ionicons name="person" size={24} color="#667eea" />
                        </View>
                        <View style={styles.memberInfo}>
                          <ThemedText style={styles.memberName}>
                            {member.name}
                          </ThemedText>
                          <ThemedText style={styles.memberEmail}>
                            {member.email}
                          </ThemedText>
                          <View style={styles.memberStats}>
                            <ThemedText style={styles.memberStat}>
                              {member.totalMeals} meals
                            </ThemedText>
                            <ThemedText style={styles.memberStat}>
                              ৳{member.totalContribution}
                            </ThemedText>
                          </View>
                        </View>
                        <View style={styles.memberStatus}>
                          <Ionicons
                            name={getStatusIcon(member.status)}
                            size={20}
                            color={getStatusColor(member.status)}
                          />
                        </View>
                      </View>
                    ))}
                  </View>
                </View>
              </>
            )
          )}
        </View>
      </ScrollView>
    </ErrorBoundary>
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
  statsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  statCard: {
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
  statGradient: {
    padding: 20,
    alignItems: "center",
    minHeight: 120,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.9)",
    textAlign: "center",
  },
  quickActionsSection: {
    marginBottom: 24,
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
    justifyContent: "space-between",
  },
  actionCard: {
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
  actionGradient: {
    padding: 20,
    alignItems: "center",
    minHeight: 100,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
    marginTop: 8,
    textAlign: "center",
  },
  activitySection: {
    marginBottom: 24,
  },
  activityList: {
    gap: 12,
  },
  activityItem: {
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
  activityLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 2,
  },
  activityValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: 2,
  },
  activityTime: {
    fontSize: 12,
    color: "#6b7280",
  },
  membersSection: {
    marginBottom: 24,
  },
  membersList: {
    gap: 12,
  },
  memberItem: {
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
  memberAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#f3f4f6",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: 2,
  },
  memberEmail: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 4,
  },
  memberStats: {
    flexDirection: "row",
    gap: 12,
  },
  memberStat: {
    fontSize: 12,
    color: "#6b7280",
  },
  memberStatus: {
    marginLeft: 12,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#ef4444",
    marginTop: 16,
    marginBottom: 24,
    textAlign: "center",
  },
  retryButton: {
    padding: 16,
    borderRadius: 16,
    backgroundColor: "#667eea",
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
  },
});
