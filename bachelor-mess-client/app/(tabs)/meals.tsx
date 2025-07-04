import React, { useEffect, useState } from "react";
import { ThemedText } from "@/components/ThemedText";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  View,
  RefreshControl,
} from "react-native";
import { useAuth } from "@/context/AuthContext";
import DataService from "@/services/dataService";
import { MessLoadingSpinner } from "@/components/MessLoadingSpinner";
import ErrorBoundary from "@/components/ErrorBoundary";

interface MealEntry {
  _id: string;
  userId: string;
  date: string;
  breakfast: boolean;
  lunch: boolean;
  dinner: boolean;
  status: "pending" | "approved" | "rejected";
  approvedBy?: string;
  approvedAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export default function MealsScreen() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [todayMeals, setTodayMeals] = useState({
    breakfast: false,
    lunch: false,
    dinner: false,
  });
  const [recentMeals, setRecentMeals] = useState<MealEntry[]>([]);
  const [allMeals, setAllMeals] = useState<MealEntry[]>([]); // For admin to see all meals
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch user's meals from backend
  const fetchUserMeals = async () => {
    try {
      setLoading(true);
      setError(null);

      if (isAdmin) {
        // Admin fetches all meals
        const response = await DataService.getAllMeals({ limit: 50 });
        const mealsData = DataService.normalizeResponse(response);
        if (mealsData && Array.isArray(mealsData)) {
          setAllMeals(mealsData);
          setRecentMeals(mealsData.slice(0, 10)); // Show recent 10 for stats
        }
      } else {
        // Member fetches only their meals
        const response = await DataService.getUserMeals({ limit: 10 });
        const mealsData = DataService.normalizeResponse(response);
        if (mealsData && Array.isArray(mealsData)) {
          setRecentMeals(mealsData);
        }
      }
    } catch (error) {
      console.error("Error fetching meals:", error);
      setError("Failed to load meals. Please try again.");
      setRecentMeals([]);
      setAllMeals([]);
    } finally {
      setLoading(false);
    }
  };

  // Check if today's meals are already submitted
  const checkTodayMeals = () => {
    if (!recentMeals || recentMeals.length === 0) {
      setTodayMeals({
        breakfast: false,
        lunch: false,
        dinner: false,
      });
      return;
    }

    const today = new Date().toISOString().split("T")[0];
    const todayMeal = recentMeals.find((meal) => meal && meal.date === today);

    if (todayMeal) {
      setTodayMeals({
        breakfast: todayMeal.breakfast || false,
        lunch: todayMeal.lunch || false,
        dinner: todayMeal.dinner || false,
      });
    } else {
      setTodayMeals({
        breakfast: false,
        lunch: false,
        dinner: false,
      });
    }
  };

  useEffect(() => {
    fetchUserMeals();
  }, []);

  useEffect(() => {
    checkTodayMeals();
  }, [recentMeals]);

  const handleMealToggle = (mealType: keyof typeof todayMeals) => {
    setTodayMeals((prev) => ({
      ...prev,
      [mealType]: !prev[mealType],
    }));
  };

  const handleSubmitMeals = async () => {
    const selectedMeals = Object.values(todayMeals).filter(Boolean).length;

    if (selectedMeals === 0) {
      Alert.alert(
        "No Meals Selected",
        "Please select at least one meal for today."
      );
      return;
    }

    try {
      setSubmitting(true);

      const mealData = {
        date: new Date().toISOString().split("T")[0],
        breakfast: todayMeals.breakfast,
        lunch: todayMeals.lunch,
        dinner: todayMeals.dinner,
        notes: "",
      };

      console.log(
        "🔍 CLIENT DEBUG - Submitting meal data:",
        JSON.stringify(mealData, null, 2)
      );
      console.log(
        "🔍 CLIENT DEBUG - Today's date:",
        new Date().toISOString().split("T")[0]
      );
      console.log("🔍 CLIENT DEBUG - Selected meals:", {
        breakfast: todayMeals.breakfast,
        lunch: todayMeals.lunch,
        dinner: todayMeals.dinner,
      });

      await DataService.submitMeals(mealData);

      // Refresh meals data
      await fetchUserMeals();

      // Reset today's meals
      setTodayMeals({
        breakfast: false,
        lunch: false,
        dinner: false,
      });

      Alert.alert("Success!", `Submitted ${selectedMeals} meal(s) for today.`);
    } catch (error: any) {
      console.error("Error submitting meals:", error);
      let errorMessage = "Failed to submit meals. Please try again.";
      if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error?.message) {
        errorMessage = error.message;
      }
      Alert.alert("Error", errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleApproveMeal = async (mealId: string) => {
    try {
      await DataService.approveMeal(mealId);
      await fetchUserMeals();
      Alert.alert("Success!", "Meal approved successfully.");
    } catch (error) {
      console.error("Error approving meal:", error);
      Alert.alert("Error", "Failed to approve meal. Please try again.");
    }
  };

  const handleRejectMeal = async (mealId: string) => {
    try {
      await DataService.rejectMeal(mealId);
      await fetchUserMeals();
      Alert.alert("Success!", "Meal rejected successfully.");
    } catch (error) {
      console.error("Error rejecting meal:", error);
      Alert.alert("Error", "Failed to reject meal. Please try again.");
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchUserMeals();
    setRefreshing(false);
  };

  const getMealIcon = (mealType: string) => {
    if (!mealType) return "fast-food";

    switch (mealType) {
      case "breakfast":
        return "sunny";
      case "lunch":
        return "restaurant";
      case "dinner":
        return "moon";
      default:
        return "fast-food";
    }
  };

  const getMealColor = (mealType: string) => {
    if (!mealType) return "#6b7280";

    switch (mealType) {
      case "breakfast":
        return "#f59e0b";
      case "lunch":
        return "#10b981";
      case "dinner":
        return "#6366f1";
      default:
        return "#6b7280";
    }
  };

  const getMealGradient = (mealType: string): readonly [string, string] => {
    if (!mealType) return ["#9ca3af", "#6b7280"] as const;

    switch (mealType) {
      case "breakfast":
        return ["#fbbf24", "#f59e0b"] as const;
      case "lunch":
        return ["#34d399", "#10b981"] as const;
      case "dinner":
        return ["#818cf8", "#6366f1"] as const;
      default:
        return ["#9ca3af", "#6b7280"] as const;
    }
  };

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={64} color="#ef4444" />
        <ThemedText style={styles.errorText}>{error}</ThemedText>
        <Pressable style={styles.retryButton} onPress={fetchUserMeals}>
          <ThemedText style={styles.retryButtonText}>Retry</ThemedText>
        </Pressable>
      </View>
    );
  }

  if (loading) {
    return (
      <MessLoadingSpinner
        type="meals"
        size="large"
        message="Loading your meals..."
      />
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
          colors={["#f093fb", "#f5576c"]}
          style={styles.headerGradient}
        >
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <ThemedText style={styles.headerTitle}>
                {isAdmin ? "Manage Meals" : "Daily Meals"}
              </ThemedText>
              <ThemedText style={styles.headerSubtitle}>
                {isAdmin
                  ? "Approve and manage all member meals"
                  : "Track your daily meal consumption"}
              </ThemedText>
            </View>
            <View style={styles.headerIcon}>
              <Ionicons
                name={isAdmin ? "shield-checkmark" : "restaurant"}
                size={32}
                color="#fff"
              />
            </View>
          </View>
        </LinearGradient>

        <View style={styles.content}>
          {/* Today's Meals Section - Only for Members */}
          {!isAdmin && (
            <View style={styles.todaySection}>
              <ThemedText style={styles.sectionTitle}>
                Today&apos;s Meals
              </ThemedText>

              <View style={styles.mealsContainer}>
                {Object.entries(todayMeals).map(([mealType, isSelected]) => (
                  <Pressable
                    key={mealType}
                    style={styles.mealCard}
                    onPress={() =>
                      handleMealToggle(mealType as keyof typeof todayMeals)
                    }
                  >
                    <LinearGradient
                      colors={
                        isSelected
                          ? getMealGradient(mealType)
                          : (["#f3f4f6", "#e5e7eb"] as const)
                      }
                      style={styles.mealGradient}
                    >
                      <Ionicons
                        name={getMealIcon(mealType)}
                        size={32}
                        color={isSelected ? "#fff" : "#9ca3af"}
                      />
                      <ThemedText
                        style={[
                          styles.mealTitle,
                          { color: isSelected ? "#fff" : "#6b7280" },
                        ]}
                      >
                        {mealType && mealType.length > 0
                          ? mealType.charAt(0).toUpperCase() + mealType.slice(1)
                          : "Unknown"}
                      </ThemedText>
                      <View style={styles.mealToggle}>
                        <Switch
                          value={isSelected}
                          onValueChange={() =>
                            handleMealToggle(
                              mealType as keyof typeof todayMeals
                            )
                          }
                          trackColor={{
                            false: "rgba(255,255,255,0.3)",
                            true: "rgba(255,255,255,0.5)",
                          }}
                          thumbColor={isSelected ? "#fff" : "#9ca3af"}
                        />
                      </View>
                    </LinearGradient>
                  </Pressable>
                ))}
              </View>

              {/* Submit Button */}
              <Pressable
                style={[
                  styles.submitButton,
                  submitting && styles.submitButtonDisabled,
                ]}
                onPress={handleSubmitMeals}
                disabled={submitting}
              >
                <LinearGradient
                  colors={["#667eea", "#764ba2"]}
                  style={styles.submitButtonGradient}
                >
                  {submitting ? (
                    <MessLoadingSpinner size="small" type="meals" />
                  ) : (
                    <Ionicons name="checkmark-circle" size={24} color="#fff" />
                  )}
                  <ThemedText style={styles.submitButtonText}>
                    {submitting ? "Submitting..." : "Submit Today&apos;s Meals"}
                  </ThemedText>
                </LinearGradient>
              </Pressable>
            </View>
          )}

          {/* Quick Stats - Different for Admin and Member */}
          <View style={styles.statsContainer}>
            {isAdmin ? (
              // Admin stats
              <>
                <View style={styles.statCard}>
                  <LinearGradient
                    colors={["#667eea", "#764ba2"]}
                    style={styles.statGradient}
                  >
                    <Ionicons name="people" size={24} color="#fff" />
                    <ThemedText style={styles.statValue}>
                      {allMeals.length > 0
                        ? new Set(allMeals.map((meal) => meal.userId)).size
                        : 0}
                    </ThemedText>
                    <ThemedText style={styles.statLabel}>
                      Active Members
                    </ThemedText>
                  </LinearGradient>
                </View>

                <View style={styles.statCard}>
                  <LinearGradient
                    colors={["#f093fb", "#f5576c"]}
                    style={styles.statGradient}
                  >
                    <Ionicons name="time" size={24} color="#fff" />
                    <ThemedText style={styles.statValue}>
                      {
                        allMeals.filter((meal) => meal.status === "pending")
                          .length
                      }
                    </ThemedText>
                    <ThemedText style={styles.statLabel}>
                      Pending Approval
                    </ThemedText>
                  </LinearGradient>
                </View>

                <View style={styles.statCard}>
                  <LinearGradient
                    colors={["#43e97b", "#38f9d7"]}
                    style={styles.statGradient}
                  >
                    <Ionicons name="checkmark-circle" size={24} color="#fff" />
                    <ThemedText style={styles.statValue}>
                      {
                        allMeals.filter((meal) => meal.status === "approved")
                          .length
                      }
                    </ThemedText>
                    <ThemedText style={styles.statLabel}>
                      Approved Today
                    </ThemedText>
                  </LinearGradient>
                </View>
              </>
            ) : (
              // Member stats
              <>
                <View style={styles.statCard}>
                  <LinearGradient
                    colors={["#667eea", "#764ba2"]}
                    style={styles.statGradient}
                  >
                    <Ionicons name="calendar" size={24} color="#fff" />
                    <ThemedText style={styles.statValue}>
                      {Object.values(todayMeals).filter(Boolean).length}
                    </ThemedText>
                    <ThemedText style={styles.statLabel}>Today</ThemedText>
                  </LinearGradient>
                </View>

                <View style={styles.statCard}>
                  <LinearGradient
                    colors={["#f093fb", "#f5576c"]}
                    style={styles.statGradient}
                  >
                    <Ionicons name="stats-chart" size={24} color="#fff" />
                    <ThemedText style={styles.statValue}>
                      {recentMeals.length > 0
                        ? recentMeals.reduce(
                            (sum, meal) =>
                              sum +
                              (meal.breakfast ? 1 : 0) +
                              (meal.lunch ? 1 : 0) +
                              (meal.dinner ? 1 : 0),
                            0
                          )
                        : 0}
                    </ThemedText>
                    <ThemedText style={styles.statLabel}>This Week</ThemedText>
                  </LinearGradient>
                </View>

                <View style={styles.statCard}>
                  <LinearGradient
                    colors={["#43e97b", "#38f9d7"]}
                    style={styles.statGradient}
                  >
                    <Ionicons name="trending-up" size={24} color="#fff" />
                    <ThemedText style={styles.statValue}>
                      {recentMeals.length > 0
                        ? Math.round(
                            (recentMeals.reduce(
                              (sum, meal) =>
                                sum +
                                (meal.breakfast ? 1 : 0) +
                                (meal.lunch ? 1 : 0) +
                                (meal.dinner ? 1 : 0),
                              0
                            ) /
                              recentMeals.length) *
                              10
                          ) / 10
                        : 0}
                    </ThemedText>
                    <ThemedText style={styles.statLabel}>Avg/Day</ThemedText>
                  </LinearGradient>
                </View>
              </>
            )}
          </View>

          {/* Recent Meals History */}
          <View style={styles.historySection}>
            <ThemedText style={styles.sectionTitle}>
              {isAdmin ? "All Meals" : "My Recent History"}
            </ThemedText>

            {(isAdmin ? allMeals : recentMeals)
              .filter((meal) => meal && meal._id)
              .slice(0, isAdmin ? 20 : 10)
              .map((meal) => (
                <View key={meal._id} style={styles.historyCard}>
                  <View style={styles.historyHeader}>
                    <ThemedText style={styles.historyDate}>
                      {meal.date}
                    </ThemedText>
                    <ThemedText style={styles.historyTime}>
                      {meal.createdAt && meal.createdAt.includes("T")
                        ? meal.createdAt.split("T")[1]?.split(".")[0] || "N/A"
                        : "N/A"}
                    </ThemedText>
                    {isAdmin && (
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          marginLeft: 8,
                        }}
                      >
                        <Pressable
                          onPress={() =>
                            Alert.alert(
                              "Edit",
                              "Edit meal functionality coming soon"
                            )
                          }
                          style={{ marginRight: 8 }}
                        >
                          <Ionicons
                            name="create-outline"
                            size={20}
                            color="#6366f1"
                          />
                        </Pressable>
                        <Pressable
                          onPress={() =>
                            Alert.alert(
                              "Delete",
                              "Delete meal functionality coming soon"
                            )
                          }
                        >
                          <Ionicons
                            name="trash-outline"
                            size={20}
                            color="#ef4444"
                          />
                        </Pressable>
                      </View>
                    )}
                  </View>

                  <View style={styles.historyMeals}>
                    {Object.entries({
                      breakfast: meal.breakfast || false,
                      lunch: meal.lunch || false,
                      dinner: meal.dinner || false,
                    }).map(([mealType, isSelected]) => (
                      <View key={mealType} style={styles.historyMealItem}>
                        <View
                          style={[
                            styles.historyMealIcon,
                            {
                              backgroundColor: isSelected
                                ? getMealColor(mealType)
                                : "#f3f4f6",
                            },
                          ]}
                        >
                          <Ionicons
                            name={getMealIcon(mealType)}
                            size={16}
                            color={isSelected ? "#fff" : "#9ca3af"}
                          />
                        </View>
                        <ThemedText
                          style={[
                            styles.historyMealText,
                            { color: isSelected ? "#1f2937" : "#9ca3af" },
                          ]}
                        >
                          {mealType && mealType.length > 0
                            ? mealType.charAt(0).toUpperCase() +
                              mealType.slice(1)
                            : "Unknown"}
                        </ThemedText>
                      </View>
                    ))}
                  </View>

                  {/* Status indicator */}
                  <View style={styles.statusContainer}>
                    <View
                      style={[
                        styles.statusBadge,
                        {
                          backgroundColor:
                            meal.status === "approved"
                              ? "#10b981"
                              : meal.status === "rejected"
                              ? "#ef4444"
                              : "#f59e0b",
                        },
                      ]}
                    >
                      <ThemedText style={styles.statusText}>
                        {meal.status?.charAt(0).toUpperCase() +
                          meal.status?.slice(1)}
                      </ThemedText>
                    </View>
                  </View>

                  {/* Admin approval actions */}
                  {isAdmin && meal.status === "pending" && (
                    <View style={styles.adminActions}>
                      <Pressable
                        style={styles.approveButton}
                        onPress={() => handleApproveMeal(meal._id)}
                      >
                        <Ionicons
                          name="checkmark-circle"
                          size={18}
                          color="#fff"
                        />
                        <ThemedText style={styles.actionButtonText}>
                          Approve
                        </ThemedText>
                      </Pressable>
                      <Pressable
                        style={styles.rejectButton}
                        onPress={() => handleRejectMeal(meal._id)}
                      >
                        <Ionicons name="close-circle" size={18} color="#fff" />
                        <ThemedText style={styles.actionButtonText}>
                          Reject
                        </ThemedText>
                      </Pressable>
                    </View>
                  )}
                </View>
              ))}
          </View>
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
  todaySection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: 16,
  },
  mealsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  mealCard: {
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
  mealGradient: {
    padding: 20,
    alignItems: "center",
    minHeight: 120,
  },
  mealTitle: {
    fontSize: 14,
    fontWeight: "bold",
    marginTop: 8,
    marginBottom: 8,
  },
  mealToggle: {
    marginTop: 4,
  },
  submitButton: {
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  submitButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
    marginLeft: 8,
  },
  submitButtonDisabled: {
    backgroundColor: "rgba(102, 126, 234, 0.5)",
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  statCard: {
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
  statGradient: {
    padding: 16,
    alignItems: "center",
  },
  statValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.9)",
  },
  historySection: {
    marginBottom: 24,
  },
  historyCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  historyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  historyDate: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1f2937",
  },
  historyTime: {
    fontSize: 14,
    color: "#6b7280",
  },
  historyMeals: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  historyMealItem: {
    alignItems: "center",
  },
  historyMealIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
  },
  historyMealText: {
    fontSize: 12,
    fontWeight: "bold",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#ef4444",
    marginTop: 16,
    marginBottom: 24,
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
  statusContainer: {
    alignItems: "center",
    marginTop: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#fff",
  },
  adminActions: {
    flexDirection: "row",
    marginTop: 12,
    justifyContent: "center",
    gap: 12,
  },
  approveButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#10b981",
    borderRadius: 8,
  },
  rejectButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#ef4444",
    borderRadius: 8,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#fff",
    marginLeft: 4,
  },
});
