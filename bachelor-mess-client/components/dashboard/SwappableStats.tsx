import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Animated,
  Dimensions,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import { ThemedText } from "../ThemedText";
import { DESIGN_SYSTEM } from "./DesignSystem";

const { width: screenWidth } = Dimensions.get("window");

interface StatItem {
  id: string;
  title: string;
  value: string;
  icon: string;
  gradient: readonly [string, string];
  unit?: string;
}

interface SwappableStatsProps {
  stats: StatItem[];
  onStatsChange?: (newStats: StatItem[]) => void;
  fadeAnim?: Animated.Value;
  slideAnim?: Animated.Value;
}

export const SwappableStats: React.FC<SwappableStatsProps> = ({
  stats,
  onStatsChange,
  fadeAnim,
  slideAnim,
}) => {
  const router = useRouter();
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [currentStats, setCurrentStats] = useState<StatItem[]>(stats);
  const [isEditMode, setIsEditMode] = useState(false);

  const handleSwap = (fromIndex: number, toIndex: number) => {
    if (!isEditMode) return;

    const newStats = [...currentStats];
    const [movedItem] = newStats.splice(fromIndex, 1);
    newStats.splice(toIndex, 0, movedItem);

    setCurrentStats(newStats);
    onStatsChange?.(newStats);
  };

  const toggleEditMode = () => {
    setIsEditMode(!isEditMode);
    if (isEditMode) {
      // Save the current arrangement
      onStatsChange?.(currentStats);
    }
  };

  const resetToDefault = () => {
    Alert.alert(
      "Reset Stats",
      "Are you sure you want to reset the stats to their default order?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset",
          style: "destructive",
          onPress: () => {
            setCurrentStats(stats);
            onStatsChange?.(stats);
          },
        },
      ]
    );
  };

  const renderStatCard = (stat: StatItem, index: number) => {
    const isDragging = draggedIndex === index;
    const scale = isDragging ? 1.05 : 1;

    return (
      <Animated.View
        key={stat.id}
        style={[
          styles.statCard,
          {
            transform: [{ scale }],
            zIndex: isDragging ? 1000 : 1,
          },
        ]}
      >
        <Pressable
          style={styles.statCardPressable}
          onLongPress={() => setIsEditMode(true)}
          onPress={() => {
            if (isEditMode) {
              // Show swap options
              Alert.alert(
                "Move Stat",
                `Where would you like to move "${stat.title}"?`,
                [
                  { text: "Cancel", style: "cancel" },
                  ...currentStats.map((_, i) => ({
                    text: `Position ${i + 1}`,
                    onPress: () => handleSwap(index, i),
                  })),
                ]
              );
            } else {
              // Handle normal press for expense-related stats
              if (
                stat.title.toLowerCase().includes("expense") ||
                stat.title.toLowerCase().includes("cost") ||
                stat.title.toLowerCase().includes("balance")
              ) {
                // Navigate to expense details
                router.push({
                  pathname: "/expense-details",
                  params: {
                    title: stat.title,
                    value: stat.value.replace(/[^\d]/g, ""), // Extract numeric value
                    type: stat.title.toLowerCase().includes("expense")
                      ? "monthly"
                      : "balance",
                    color: stat.gradient[0],
                    description: `Detailed breakdown of ${stat.title.toLowerCase()} including all related costs and expenses.`,
                    notes: `This data is updated daily and reflects current market conditions for ${stat.title.toLowerCase()}.`,
                  },
                });
              }
            }
          }}
        >
          <LinearGradient colors={stat.gradient} style={styles.statGradient}>
            <View style={styles.statHeader}>
              <Ionicons name={stat.icon as any} size={24} color="#fff" />
              {isEditMode && (
                <View style={styles.editIndicator}>
                  <Ionicons name="reorder-three" size={16} color="#fff" />
                </View>
              )}
            </View>
            <ThemedText style={styles.statValue}>{stat.value}</ThemedText>
            <ThemedText style={styles.statTitle}>{stat.title}</ThemedText>
            {stat.unit && (
              <ThemedText style={styles.statUnit}>{stat.unit}</ThemedText>
            )}
          </LinearGradient>
        </Pressable>
      </Animated.View>
    );
  };

  return (
    <Animated.View
      style={[
        styles.container,
        fadeAnim && {
          opacity: fadeAnim,
        },
        slideAnim && {
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <View style={styles.header}>
        <ThemedText style={styles.title}>Quick Stats</ThemedText>
        <View style={styles.headerActions}>
          {isEditMode && (
            <Pressable style={styles.resetButton} onPress={resetToDefault}>
              <Ionicons name="refresh" size={16} color="#667eea" />
              <ThemedText style={styles.resetButtonText}>Reset</ThemedText>
            </Pressable>
          )}
          <Pressable style={styles.editButton} onPress={toggleEditMode}>
            <Ionicons
              name={isEditMode ? "checkmark" : "create"}
              size={16}
              color={isEditMode ? "#10b981" : "#667eea"}
            />
            <ThemedText
              style={[
                styles.editButtonText,
                { color: isEditMode ? "#10b981" : "#667eea" },
              ]}
            >
              {isEditMode ? "Done" : "Edit"}
            </ThemedText>
          </Pressable>
        </View>
      </View>

      <View style={styles.statsGrid}>
        {currentStats.map((stat, index) => renderStatCard(stat, index))}
      </View>

      {isEditMode && (
        <View style={styles.editHint}>
          <Ionicons name="information-circle" size={16} color="#6b7280" />
          <ThemedText style={styles.editHintText}>
            Long press to enter edit mode, tap cards to rearrange
          </ThemedText>
        </View>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: DESIGN_SYSTEM.spacing.lg,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: DESIGN_SYSTEM.spacing.md,
  },
  title: {
    fontSize: DESIGN_SYSTEM.typography.sizes.lg,
    fontWeight: DESIGN_SYSTEM.typography.weights.bold,
    color: DESIGN_SYSTEM.colors.text.primary,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: DESIGN_SYSTEM.spacing.sm,
  },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: DESIGN_SYSTEM.spacing.xs,
    paddingHorizontal: DESIGN_SYSTEM.spacing.sm,
    borderRadius: DESIGN_SYSTEM.borderRadius.sm,
    backgroundColor: DESIGN_SYSTEM.colors.background.secondary,
    gap: DESIGN_SYSTEM.spacing.xs,
  },
  editButtonText: {
    fontSize: DESIGN_SYSTEM.typography.sizes.sm,
    fontWeight: DESIGN_SYSTEM.typography.weights.medium,
  },
  resetButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: DESIGN_SYSTEM.spacing.xs,
    paddingHorizontal: DESIGN_SYSTEM.spacing.sm,
    borderRadius: DESIGN_SYSTEM.borderRadius.sm,
    backgroundColor: DESIGN_SYSTEM.colors.background.secondary,
    gap: DESIGN_SYSTEM.spacing.xs,
  },
  resetButtonText: {
    fontSize: DESIGN_SYSTEM.typography.sizes.sm,
    fontWeight: DESIGN_SYSTEM.typography.weights.medium,
    color: "#667eea",
  },
  statsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: DESIGN_SYSTEM.spacing.sm,
  },
  statCard: {
    flex: 1,
    borderRadius: DESIGN_SYSTEM.borderRadius.lg,
    overflow: "hidden",
    height: 120,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statCardPressable: {
    height: "100%",
  },
  statGradient: {
    padding: DESIGN_SYSTEM.spacing.lg,
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
  },
  statHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: DESIGN_SYSTEM.spacing.sm,
    position: "relative",
  },
  editIndicator: {
    position: "absolute",
    right: -8,
    top: -8,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    borderRadius: 8,
    padding: 2,
  },
  statValue: {
    fontSize: DESIGN_SYSTEM.typography.sizes.xl,
    fontWeight: DESIGN_SYSTEM.typography.weights.bold,
    color: "#fff",
    marginBottom: DESIGN_SYSTEM.spacing.xs,
    textAlign: "center",
  },
  statTitle: {
    fontSize: DESIGN_SYSTEM.typography.sizes.sm,
    color: "rgba(255, 255, 255, 0.9)",
    textAlign: "center",
    marginBottom: DESIGN_SYSTEM.spacing.xs,
  },
  statUnit: {
    fontSize: DESIGN_SYSTEM.typography.sizes.xs,
    color: "rgba(255, 255, 255, 0.8)",
    textAlign: "center",
  },
  editHint: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: DESIGN_SYSTEM.spacing.xs,
    marginTop: DESIGN_SYSTEM.spacing.sm,
    padding: DESIGN_SYSTEM.spacing.sm,
    backgroundColor: DESIGN_SYSTEM.colors.background.secondary,
    borderRadius: DESIGN_SYSTEM.borderRadius.sm,
  },
  editHintText: {
    fontSize: DESIGN_SYSTEM.typography.sizes.xs,
    color: DESIGN_SYSTEM.colors.text.secondary,
    textAlign: "center",
  },
});
