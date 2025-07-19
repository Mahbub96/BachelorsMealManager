import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { ThemedText } from "@/components/ThemedText";
import { useMessData } from "@/context/MessDataContext";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useRef, useState } from "react";
import {
  Alert,
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";

export default function MealsScreen() {
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  const [showAllActivities, setShowAllActivities] = useState(false);
  const [mealForm, setMealForm] = useState({
    breakfast: false,
    lunch: false,
    dinner: false,
    date: new Date().toISOString().split("T")[0],
  });

  // Get data from context
  const { recentMeals, monthlyMealStats, addMealEntry, recentActivities } =
    useMessData();

  const handleMealSubmit = () => {
    if (!mealForm.breakfast && !mealForm.lunch && !mealForm.dinner) {
      Alert.alert("Error", "Please select at least one meal");
      return;
    }

    addMealEntry({
      date: mealForm.date,
      breakfast: mealForm.breakfast,
      lunch: mealForm.lunch,
      dinner: mealForm.dinner,
      submittedBy: "Current User", // This would come from auth context
      submittedAt: new Date().toISOString(),
      cost: Math.floor(Math.random() * 10) + 45, // Random cost between 45-55 BDT
    });

    setMealForm({
      breakfast: false,
      lunch: false,
      dinner: false,
      date: new Date().toISOString().split("T")[0],
    });

    Alert.alert("Success", "Meal entry submitted successfully!");
  };

  const handleSeeMoreActivities = () => {
    console.log("Meals: See More Activities button pressed");
    router.push("/recent-activity");
  };

  const getMealIcon = (mealType: string) => {
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

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <LinearGradient
        colors={["#667eea", "#764ba2"]}
        style={styles.headerGradient}
      >
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <ThemedText style={styles.headerTitle}>Meal Management</ThemedText>
            <ThemedText style={styles.headerSubtitle}>
              Record and track daily meals
            </ThemedText>
          </View>
          <View style={styles.headerIcon}>
            <Ionicons name="fast-food" size={32} color="#fff" />
          </View>
        </View>
      </LinearGradient>

      <View style={styles.content}>
        {/* Quick Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <LinearGradient
              colors={["#667eea", "#764ba2"]}
              style={styles.statGradient}
            >
              <Ionicons name="fast-food" size={24} color="#fff" />
              <ThemedText style={styles.statValue}>
                {monthlyMealStats.totalMeals}
              </ThemedText>
              <ThemedText style={styles.statLabel}>Total Meals</ThemedText>
            </LinearGradient>
          </View>

          <View style={styles.statCard}>
            <LinearGradient
              colors={["#f093fb", "#f5576c"]}
              style={styles.statGradient}
            >
              <Ionicons name="trending-up" size={24} color="#fff" />
              <ThemedText style={styles.statValue}>
                {monthlyMealStats.averagePerDay.toFixed(1)}
              </ThemedText>
              <ThemedText style={styles.statLabel}>Avg/Day</ThemedText>
            </LinearGradient>
          </View>

          <View style={styles.statCard}>
            <LinearGradient
              colors={["#43e97b", "#38f9d7"]}
              style={styles.statGradient}
            >
              <Ionicons name="cash" size={24} color="#fff" />
              <ThemedText style={styles.statValue}>
                {monthlyMealStats.totalCost}৳
              </ThemedText>
              <ThemedText style={styles.statLabel}>Total Cost</ThemedText>
            </LinearGradient>
          </View>
        </View>

        {/* Meal Form */}
        <View style={styles.formContainer}>
          <ThemedText style={styles.sectionTitle}>
            Add Today&apos;s Meals
          </ThemedText>

          <View style={styles.dateContainer}>
            <ThemedText style={styles.dateLabel}>Date:</ThemedText>
            <TextInput
              style={styles.dateInput}
              value={mealForm.date}
              onChangeText={(text) => setMealForm({ ...mealForm, date: text })}
              placeholder="YYYY-MM-DD"
            />
          </View>

          <View style={styles.mealOptions}>
            {[
              { key: "breakfast", label: "Breakfast", icon: "sunny" },
              { key: "lunch", label: "Lunch", icon: "restaurant" },
              { key: "dinner", label: "Dinner", icon: "moon" },
            ].map((meal) => (
              <Pressable
                key={meal.key}
                style={[
                  styles.mealOption,
                  mealForm[meal.key as keyof typeof mealForm] &&
                    styles.mealOptionSelected,
                ]}
                onPress={() =>
                  setMealForm({
                    ...mealForm,
                    [meal.key]: !mealForm[meal.key as keyof typeof mealForm],
                  })
                }
              >
                <Ionicons
                  name={meal.icon as any}
                  size={24}
                  color={
                    mealForm[meal.key as keyof typeof mealForm]
                      ? "#fff"
                      : "#6b7280"
                  }
                />
                <ThemedText
                  style={[
                    styles.mealOptionText,
                    mealForm[meal.key as keyof typeof mealForm] &&
                      styles.mealOptionTextSelected,
                  ]}
                >
                  {meal.label}
                </ThemedText>
              </Pressable>
            ))}
          </View>

          <Pressable style={styles.submitButton} onPress={handleMealSubmit}>
            <LinearGradient
              colors={["#667eea", "#764ba2"]}
              style={styles.submitButtonGradient}
            >
              <Ionicons name="checkmark" size={20} color="#fff" />
              <ThemedText style={styles.submitButtonText}>
                Submit Meals
              </ThemedText>
            </LinearGradient>
          </Pressable>
        </View>

        {/* Recent Meals */}
        <View style={styles.recentMealsContainer}>
          <ThemedText style={styles.sectionTitle}>Recent Meals</ThemedText>
          <View style={styles.mealsList}>
            {(recentMeals || []).slice(0, 5).map((meal) => (
              <View key={meal.id} style={styles.recentMealCard}>
                <View style={styles.mealHeader}>
                  <ThemedText style={styles.mealDate}>
                    {new Date(meal.date).toLocaleDateString()}
                  </ThemedText>
                  <ThemedText style={styles.mealSubmittedBy}>
                    by {meal.submittedBy}
                  </ThemedText>
                </View>
                <View style={styles.mealTypes}>
                  {meal.breakfast && (
                    <View
                      style={[styles.mealType, { backgroundColor: "#f59e0b" }]}
                    >
                      <Ionicons name="sunny" size={14} color="#fff" />
                      <ThemedText style={styles.mealTypeText}>
                        Breakfast
                      </ThemedText>
                    </View>
                  )}
                  {meal.lunch && (
                    <View
                      style={[styles.mealType, { backgroundColor: "#10b981" }]}
                    >
                      <Ionicons name="restaurant" size={14} color="#fff" />
                      <ThemedText style={styles.mealTypeText}>Lunch</ThemedText>
                    </View>
                  )}
                  {meal.dinner && (
                    <View
                      style={[styles.mealType, { backgroundColor: "#6366f1" }]}
                    >
                      <Ionicons name="moon" size={14} color="#fff" />
                      <ThemedText style={styles.mealTypeText}>
                        Dinner
                      </ThemedText>
                    </View>
                  )}
                </View>
                <View style={styles.mealFooter}>
                  <ThemedText style={styles.mealCost}>
                    Cost: {meal.cost}৳
                  </ThemedText>
                  <ThemedText style={styles.mealTime}>
                    {new Date(meal.submittedAt).toLocaleTimeString()}
                  </ThemedText>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Recent Activity */}
        <RecentActivity
          activities={recentActivities
            .filter((activity) => activity.type === "meal")
            .map((activity) => ({
              id: activity.id,
              title: activity.title,
              description: activity.description,
              time: activity.time,
              icon: activity.icon || "restaurant",
              amount: activity.amount,
            }))}
          maxItems={showAllActivities ? undefined : 3}
        />

        {/* Meal Statistics */}
        <View style={styles.statsSection}>
          <ThemedText style={styles.sectionTitle}>
            This Month&apos;s Statistics
          </ThemedText>

          <View style={styles.statRow}>
            <View style={styles.statItem}>
              <ThemedText style={styles.statItemLabel}>Breakfast</ThemedText>
              <ThemedText style={styles.statItemValue}>
                {monthlyMealStats.breakfastCount}
              </ThemedText>
            </View>
            <View style={styles.statItem}>
              <ThemedText style={styles.statItemLabel}>Lunch</ThemedText>
              <ThemedText style={styles.statItemValue}>
                {monthlyMealStats.lunchCount}
              </ThemedText>
            </View>
            <View style={styles.statItem}>
              <ThemedText style={styles.statItemLabel}>Dinner</ThemedText>
              <ThemedText style={styles.statItemValue}>
                {monthlyMealStats.dinnerCount}
              </ThemedText>
            </View>
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
  showMoreButton: {
    borderRadius: 12,
    overflow: "hidden",
  },
  showMoreGradient: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  showMoreText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
    marginLeft: 4,
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
  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1f2937",
  },
  closeButton: {
    padding: 8,
  },
  monthStatsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#fff",
    marginBottom: 8,
  },
  monthStatCard: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
  },
  monthStatValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1f2937",
    marginTop: 4,
    marginBottom: 2,
  },
  monthStatLabel: {
    fontSize: 12,
    color: "#6b7280",
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  modalHistoryCard: {
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
  modalHistoryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  modalHistoryDate: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1f2937",
  },
  modalHistoryTime: {
    fontSize: 14,
    color: "#6b7280",
  },
  modalHistoryStats: {
    alignItems: "flex-end",
  },
  modalHistoryMealCount: {
    fontSize: 14,
    fontWeight: "600",
    color: "#667eea",
  },
  modalHistoryMeals: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  modalHistoryMealItem: {
    alignItems: "center",
  },
  modalHistoryMealIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 6,
  },
  modalHistoryMealText: {
    fontSize: 14,
    fontWeight: "bold",
  },
  formContainer: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  dateContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  dateLabel: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1f2937",
    marginRight: 10,
  },
  dateInput: {
    flex: 1,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    paddingVertical: 8,
    fontSize: 16,
    color: "#1f2937",
  },
  mealOptions: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 20,
  },
  mealOption: {
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  mealOptionSelected: {
    borderColor: "#667eea",
    borderWidth: 2,
  },
  mealOptionText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6b7280",
    marginTop: 8,
  },
  mealOptionTextSelected: {
    color: "#667eea",
  },
  recentMealsContainer: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  mealsList: {
    marginTop: 10,
  },
  recentMealCard: {
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  mealHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  mealDate: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1f2937",
  },
  mealSubmittedBy: {
    fontSize: 14,
    color: "#6b7280",
  },
  mealTypes: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 12,
    gap: 8,
  },
  mealType: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  mealTypeText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#fff",
    marginLeft: 6,
  },
  mealFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
  },
  mealCost: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#10b981",
  },
  mealTime: {
    fontSize: 14,
    color: "#6b7280",
  },
  statsSection: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 10,
  },
  statItem: {
    alignItems: "center",
  },
  statItemLabel: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 4,
  },
  statItemValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1f2937",
  },
});
