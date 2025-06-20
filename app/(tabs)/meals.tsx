import { ThemedText } from "@/components/ThemedText";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  View,
} from "react-native";

interface MealEntry {
  id: string;
  date: string;
  breakfast: boolean;
  lunch: boolean;
  dinner: boolean;
  submittedAt: string;
}

export default function MealsScreen() {
  const [todayMeals, setTodayMeals] = useState({
    breakfast: false,
    lunch: false,
    dinner: false,
  });

  // Mock data - replace with real API data
  const [recentMeals, setRecentMeals] = useState<MealEntry[]>([
    {
      id: "1",
      date: "2024-01-15",
      breakfast: true,
      lunch: true,
      dinner: false,
      submittedAt: "2024-01-15 08:30",
    },
    {
      id: "2",
      date: "2024-01-14",
      breakfast: false,
      lunch: true,
      dinner: true,
      submittedAt: "2024-01-14 12:15",
    },
    {
      id: "3",
      date: "2024-01-13",
      breakfast: true,
      lunch: true,
      dinner: true,
      submittedAt: "2024-01-13 07:45",
    },
  ]);

  const handleMealToggle = (mealType: keyof typeof todayMeals) => {
    setTodayMeals((prev) => ({
      ...prev,
      [mealType]: !prev[mealType],
    }));
  };

  const handleSubmitMeals = () => {
    const selectedMeals = Object.values(todayMeals).filter(Boolean).length;

    if (selectedMeals === 0) {
      Alert.alert(
        "No Meals Selected",
        "Please select at least one meal for today."
      );
      return;
    }

    const newMealEntry: MealEntry = {
      id: Date.now().toString(),
      date: new Date().toISOString().split("T")[0],
      breakfast: todayMeals.breakfast,
      lunch: todayMeals.lunch,
      dinner: todayMeals.dinner,
      submittedAt: new Date().toLocaleString(),
    };

    setRecentMeals((prev) => [newMealEntry, ...prev.slice(0, 6)]);

    // Reset today's meals
    setTodayMeals({
      breakfast: false,
      lunch: false,
      dinner: false,
    });

    Alert.alert("Success!", `Submitted ${selectedMeals} meal(s) for today.`, [
      { text: "OK" },
    ]);
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

  const getMealGradient = (mealType: string): readonly [string, string] => {
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

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <LinearGradient
        colors={["#f093fb", "#f5576c"]}
        style={styles.headerGradient}
      >
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <ThemedText style={styles.headerTitle}>Daily Meals</ThemedText>
            <ThemedText style={styles.headerSubtitle}>
              Track your daily meal consumption
            </ThemedText>
          </View>
          <View style={styles.headerIcon}>
            <Ionicons name="restaurant" size={32} color="#fff" />
          </View>
        </View>
      </LinearGradient>

      <View style={styles.content}>
        {/* Today's Meals Section */}
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
                    {mealType.charAt(0).toUpperCase() + mealType.slice(1)}
                  </ThemedText>
                  <View style={styles.mealToggle}>
                    <Switch
                      value={isSelected}
                      onValueChange={() =>
                        handleMealToggle(mealType as keyof typeof todayMeals)
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
          <Pressable style={styles.submitButton} onPress={handleSubmitMeals}>
            <LinearGradient
              colors={["#667eea", "#764ba2"]}
              style={styles.submitButtonGradient}
            >
              <Ionicons name="checkmark-circle" size={24} color="#fff" />
              <ThemedText style={styles.submitButtonText}>
                Submit Today&apos;s Meals
              </ThemedText>
            </LinearGradient>
          </Pressable>
        </View>

        {/* Quick Stats */}
        <View style={styles.statsContainer}>
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
                {recentMeals.reduce(
                  (sum, meal) =>
                    sum +
                    (meal.breakfast ? 1 : 0) +
                    (meal.lunch ? 1 : 0) +
                    (meal.dinner ? 1 : 0),
                  0
                )}
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
                {Math.round(
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
                ) / 10}
              </ThemedText>
              <ThemedText style={styles.statLabel}>Avg/Day</ThemedText>
            </LinearGradient>
          </View>
        </View>

        {/* Recent Meals History */}
        <View style={styles.historySection}>
          <ThemedText style={styles.sectionTitle}>Recent History</ThemedText>

          {recentMeals.map((meal) => (
            <View key={meal.id} style={styles.historyCard}>
              <View style={styles.historyHeader}>
                <ThemedText style={styles.historyDate}>{meal.date}</ThemedText>
                <ThemedText style={styles.historyTime}>
                  {meal.submittedAt.split(" ")[1]}
                </ThemedText>
              </View>

              <View style={styles.historyMeals}>
                {Object.entries({
                  breakfast: meal.breakfast,
                  lunch: meal.lunch,
                  dinner: meal.dinner,
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
                      {mealType.charAt(0).toUpperCase() + mealType.slice(1)}
                    </ThemedText>
                  </View>
                ))}
              </View>
            </View>
          ))}
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
});
