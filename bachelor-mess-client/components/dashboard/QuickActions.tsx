import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { ThemedText } from "../ThemedText";

const DESIGN_SYSTEM = {
  colors: {
    primary: "#667eea",
    secondary: "#764ba2",
    success: "#10b981",
    warning: "#f59e0b",
    danger: "#ef4444",
    dark: "#1f2937",
    gray: {
      500: "#6b7280",
    },
  },
  spacing: {
    xs: 6,
    sm: 12,
    md: 16,
    lg: 20,
    xl: 24,
  },
  borderRadius: {
    lg: 16,
  },
  fontSize: {
    lg: 18,
    md: 16,
    sm: 14,
    xs: 12,
  },
  shadows: {
    medium: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.12,
      shadowRadius: 12,
      elevation: 8,
    },
  },
};

interface QuickAction {
  title: string;
  subtitle: string;
  icon: string;
  color: string;
  action: string;
}

interface QuickActionsProps {
  onActionPress: (action: string) => void;
}

export const QuickActions: React.FC<QuickActionsProps> = ({
  onActionPress,
}) => {
  const actions: QuickAction[] = [
    {
      title: "Add Meal",
      subtitle: "Record today's meals",
      icon: "restaurant",
      color: DESIGN_SYSTEM.colors.success,
      action: "add-meal",
    },
    {
      title: "Add Bazar",
      subtitle: "Upload shopping list",
      icon: "cart",
      color: DESIGN_SYSTEM.colors.warning,
      action: "add-bazar",
    },
    {
      title: "View Expenses",
      subtitle: "Check spending details",
      icon: "card",
      color: DESIGN_SYSTEM.colors.danger,
      action: "view-expenses",
    },
    {
      title: "View Revenue",
      subtitle: "See income breakdown",
      icon: "trending-up",
      color: DESIGN_SYSTEM.colors.primary,
      action: "view-revenue",
    },
  ];

  return (
    <View style={styles.actionsSection}>
      <View style={styles.sectionHeader}>
        <ThemedText style={styles.sectionTitle}>Quick Actions</ThemedText>
        <ThemedText style={styles.sectionSubtitle}>
          Manage your mess efficiently
        </ThemedText>
      </View>

      {/* First Row */}
      <View style={styles.row}>
        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => onActionPress(actions[0].action)}
        >
          <LinearGradient
            colors={[actions[0].color, `${actions[0].color}dd`]}
            style={styles.actionGradient}
          >
            <View style={styles.actionIconContainer}>
              <Ionicons name={actions[0].icon as any} size={20} color="#fff" />
            </View>
            <View style={styles.actionContent}>
              <ThemedText style={styles.actionTitle}>
                {actions[0].title}
              </ThemedText>
              <ThemedText style={styles.actionSubtitle}>
                {actions[0].subtitle}
              </ThemedText>
            </View>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => onActionPress(actions[1].action)}
        >
          <LinearGradient
            colors={[actions[1].color, `${actions[1].color}dd`]}
            style={styles.actionGradient}
          >
            <View style={styles.actionIconContainer}>
              <Ionicons name={actions[1].icon as any} size={20} color="#fff" />
            </View>
            <View style={styles.actionContent}>
              <ThemedText style={styles.actionTitle}>
                {actions[1].title}
              </ThemedText>
              <ThemedText style={styles.actionSubtitle}>
                {actions[1].subtitle}
              </ThemedText>
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Second Row */}
      <View style={styles.row}>
        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => onActionPress(actions[2].action)}
        >
          <LinearGradient
            colors={[actions[2].color, `${actions[2].color}dd`]}
            style={styles.actionGradient}
          >
            <View style={styles.actionIconContainer}>
              <Ionicons name={actions[2].icon as any} size={20} color="#fff" />
            </View>
            <View style={styles.actionContent}>
              <ThemedText style={styles.actionTitle}>
                {actions[2].title}
              </ThemedText>
              <ThemedText style={styles.actionSubtitle}>
                {actions[2].subtitle}
              </ThemedText>
            </View>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => onActionPress(actions[3].action)}
        >
          <LinearGradient
            colors={[actions[3].color, `${actions[3].color}dd`]}
            style={styles.actionGradient}
          >
            <View style={styles.actionIconContainer}>
              <Ionicons name={actions[3].icon as any} size={20} color="#fff" />
            </View>
            <View style={styles.actionContent}>
              <ThemedText style={styles.actionTitle}>
                {actions[3].title}
              </ThemedText>
              <ThemedText style={styles.actionSubtitle}>
                {actions[3].subtitle}
              </ThemedText>
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  actionsSection: {
    marginBottom: DESIGN_SYSTEM.spacing.xl,
    paddingHorizontal: DESIGN_SYSTEM.spacing.md,
  },
  sectionHeader: {
    marginBottom: DESIGN_SYSTEM.spacing.lg,
  },
  sectionTitle: {
    fontSize: DESIGN_SYSTEM.fontSize.lg,
    fontWeight: "bold",
    color: DESIGN_SYSTEM.colors.dark,
    marginBottom: DESIGN_SYSTEM.spacing.xs,
  },
  sectionSubtitle: {
    fontSize: DESIGN_SYSTEM.fontSize.sm,
    color: DESIGN_SYSTEM.colors.gray[500],
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: DESIGN_SYSTEM.spacing.md,
  },
  actionCard: {
    flex: 1,
    height: 80,
    borderRadius: DESIGN_SYSTEM.borderRadius.lg,
    overflow: "hidden",
    marginHorizontal: DESIGN_SYSTEM.spacing.xs,
    ...DESIGN_SYSTEM.shadows.medium,
  },
  actionGradient: {
    flex: 1,
    padding: DESIGN_SYSTEM.spacing.sm,
    justifyContent: "space-between",
  },
  actionIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: DESIGN_SYSTEM.spacing.xs,
  },
  actionContent: {
    flex: 1,
    justifyContent: "flex-end",
  },
  actionTitle: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: DESIGN_SYSTEM.spacing.xs,
  },
  actionSubtitle: {
    fontSize: 9,
    color: "rgba(255, 255, 255, 0.8)",
    lineHeight: 11,
  },
});
