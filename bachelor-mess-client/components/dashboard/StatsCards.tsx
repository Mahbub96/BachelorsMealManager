import { useAnalytics } from "@/hooks/useAnalytics";
import { useRouter } from "expo-router";
import React from "react";
import { Animated, Pressable, StyleSheet, View } from "react-native";
import { ThemedText } from "../ThemedText";
import { DESIGN_SYSTEM } from "./DesignSystem";

interface StatsCardsProps {
  fadeAnim: Animated.Value;
  slideAnim: Animated.Value;
}

export const StatsCards: React.FC<StatsCardsProps> = ({
  fadeAnim,
  slideAnim,
}) => {
  const { data, loading, error } = useAnalytics();
  const router = useRouter();

  const formatCurrency = (amount: number) => {
    return `৳${amount.toLocaleString()}`;
  };

  const stats = [
    {
      title: "Total Members",
      value: data?.stats?.totalMembers || 0,
      unit: "members",
      color: DESIGN_SYSTEM.colors.primary,
      icon: "👥",
    },
    {
      title: "Monthly Expense",
      value: data?.stats?.monthlyExpense || 0,
      unit: "BDT",
      color: DESIGN_SYSTEM.colors.secondary,
      icon: "💰",
      formatter: formatCurrency,
    },
    {
      title: "Average Meals",
      value: data?.stats?.averageMeals || 0,
      unit: "per day",
      color: DESIGN_SYSTEM.colors.success,
      icon: "🍽️",
    },
    {
      title: "Balance",
      value: data?.stats?.balance || 0,
      unit: "BDT",
      color: DESIGN_SYSTEM.colors.info,
      icon: "💳",
      formatter: formatCurrency,
    },
  ];

  const handleStatPress = (stat: any) => {
    // Handle expense-related stats
    if (
      stat.title.toLowerCase().includes("expense") ||
      stat.title.toLowerCase().includes("balance") ||
      stat.title.toLowerCase().includes("cost")
    ) {
      // Navigate to expense details
      router.push({
        pathname: "/expense-details",
        params: {
          title: stat.title,
          value: stat.value.toString(),
          type: stat.title.toLowerCase().includes("expense")
            ? "monthly"
            : "balance",
          color: stat.color,
          description: `Detailed breakdown of ${stat.title.toLowerCase()} including all related costs and expenses.`,
          notes: `This data is updated daily and reflects current market conditions for ${stat.title.toLowerCase()}.`,
        },
      });
    }
  };

  if (loading) {
    return (
      <Animated.View
        style={[
          styles.container,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <View style={styles.loadingContainer}>
          <ThemedText style={styles.loadingText}>Loading stats...</ThemedText>
        </View>
      </Animated.View>
    );
  }

  if (error || !data) {
    return (
      <Animated.View
        style={[
          styles.container,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <View style={styles.errorContainer}>
          <ThemedText style={styles.errorText}>
            {error || "Failed to load stats"}
          </ThemedText>
        </View>
      </Animated.View>
    );
  }

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <View style={styles.statsGrid}>
        {stats.map((stat, index) => (
          <Pressable
            key={index}
            style={styles.statCard}
            onPress={() => handleStatPress(stat)}
          >
            <View style={styles.statHeader}>
              <ThemedText style={styles.statIcon}>{stat.icon}</ThemedText>
              <View
                style={[
                  styles.statColorIndicator,
                  { backgroundColor: stat.color },
                ]}
              />
            </View>
            <View style={styles.statContent}>
              <ThemedText style={styles.statValue}>
                {stat.formatter ? stat.formatter(stat.value) : stat.value}
              </ThemedText>
              <ThemedText style={styles.statTitle}>{stat.title}</ThemedText>
              <ThemedText style={styles.statUnit}>{stat.unit}</ThemedText>
            </View>
          </Pressable>
        ))}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: DESIGN_SYSTEM.spacing.md,
    marginBottom: DESIGN_SYSTEM.spacing.xxl,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: DESIGN_SYSTEM.spacing.md,
  },
  statCard: {
    flex: 1,
    minWidth: 150,
    borderRadius: DESIGN_SYSTEM.borderRadius.lg,
    overflow: "hidden",
    ...DESIGN_SYSTEM.shadows.lg,
  },
  statHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: DESIGN_SYSTEM.spacing.sm,
    padding: DESIGN_SYSTEM.spacing.lg,
    backgroundColor: DESIGN_SYSTEM.colors.background.secondary,
  },
  statIcon: {
    fontSize: DESIGN_SYSTEM.typography.sizes.xl,
    color: DESIGN_SYSTEM.colors.text.primary,
  },
  statColorIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  statContent: {
    padding: DESIGN_SYSTEM.spacing.lg,
    backgroundColor: DESIGN_SYSTEM.colors.background.secondary,
  },
  statValue: {
    color: DESIGN_SYSTEM.colors.text.primary,
    fontSize: DESIGN_SYSTEM.typography.sizes.xxl,
    fontWeight: DESIGN_SYSTEM.typography.weights.bold,
    marginBottom: DESIGN_SYSTEM.spacing.xs,
  },
  statTitle: {
    color: DESIGN_SYSTEM.colors.text.primary,
    fontSize: DESIGN_SYSTEM.typography.sizes.sm,
    fontWeight: DESIGN_SYSTEM.typography.weights.semibold,
    opacity: 0.9,
  },
  statUnit: {
    color: DESIGN_SYSTEM.colors.text.secondary,
    fontSize: DESIGN_SYSTEM.typography.sizes.xs,
    opacity: 0.8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: DESIGN_SYSTEM.spacing.lg,
  },
  loadingText: {
    fontSize: DESIGN_SYSTEM.typography.sizes.lg,
    color: DESIGN_SYSTEM.colors.text.primary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: DESIGN_SYSTEM.spacing.lg,
  },
  errorText: {
    fontSize: DESIGN_SYSTEM.typography.sizes.lg,
    color: DESIGN_SYSTEM.colors.error,
  },
});
