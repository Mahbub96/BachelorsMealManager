import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { ThemedText } from "../ThemedText";

const DESIGN_SYSTEM = {
  colors: {
    primary: "#667eea",
    secondary: "#764ba2",
    dark: "#1f2937",
    gray: {
      100: "#f3f4f6",
      500: "#6b7280",
      600: "#4b5563",
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
    lg: 20,
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

interface Activity {
  id: string;
  title: string;
  description: string;
  time: string;
  icon?: string;
  amount?: number;
}

interface RecentActivityProps {
  activities: Activity[];
  maxItems?: number;
}

export const RecentActivity: React.FC<RecentActivityProps> = ({
  activities,
  maxItems = 3,
}) => {
  const router = useRouter();

  // Ensure activities is always an array and handle undefined/null
  const safeActivities = Array.isArray(activities) ? activities : [];

  return (
    <View style={styles.activitySection}>
      <View style={styles.sectionHeader}>
        <View>
          <ThemedText style={styles.sectionTitle}>Recent Activity</ThemedText>
          <ThemedText style={styles.sectionSubtitle}>
            Latest updates from your mess
          </ThemedText>
        </View>
        <TouchableOpacity
          style={styles.viewAllButton}
          onPress={() => router.push("/recent-activity")}
        >
          <ThemedText style={styles.viewAllText}>View All</ThemedText>
          <Ionicons
            name="arrow-forward"
            size={16}
            color={DESIGN_SYSTEM.colors.primary}
          />
        </TouchableOpacity>
      </View>
      <View style={styles.activityList}>
        {safeActivities.slice(0, maxItems).map((activity, index) => (
          <View key={index} style={styles.activityItem}>
            <View style={styles.activityIcon}>
              <LinearGradient
                colors={[
                  DESIGN_SYSTEM.colors.primary,
                  DESIGN_SYSTEM.colors.secondary,
                ]}
                style={styles.activityIconGradient}
              >
                <Ionicons
                  name={(activity.icon || "document") as any}
                  size={16}
                  color="#fff"
                />
              </LinearGradient>
            </View>
            <View style={styles.activityContent}>
              <ThemedText style={styles.activityTitle}>
                {activity.title}
              </ThemedText>
              <ThemedText style={styles.activityDescription}>
                {activity.description}
              </ThemedText>
              <View style={styles.activityMeta}>
                <ThemedText style={styles.activityTime}>
                  {activity.time}
                </ThemedText>
                {activity.amount && (
                  <ThemedText style={styles.activityAmount}>
                    ৳{activity.amount}
                  </ThemedText>
                )}
              </View>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  activitySection: {
    marginBottom: DESIGN_SYSTEM.spacing.xl,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
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
  viewAllButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: DESIGN_SYSTEM.spacing.xs,
    paddingVertical: DESIGN_SYSTEM.spacing.xs,
    paddingHorizontal: DESIGN_SYSTEM.spacing.sm,
  },
  viewAllText: {
    fontSize: DESIGN_SYSTEM.fontSize.sm,
    color: DESIGN_SYSTEM.colors.primary,
    fontWeight: "600",
  },
  activityList: {
    backgroundColor: "#fff",
    borderRadius: DESIGN_SYSTEM.borderRadius.lg,
    padding: DESIGN_SYSTEM.spacing.lg,
    ...DESIGN_SYSTEM.shadows.medium,
    borderWidth: 1,
    borderColor: DESIGN_SYSTEM.colors.gray[100],
  },
  activityItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: DESIGN_SYSTEM.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: DESIGN_SYSTEM.colors.gray[100],
  },
  activityIcon: {
    marginRight: DESIGN_SYSTEM.spacing.md,
  },
  activityIconGradient: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: DESIGN_SYSTEM.fontSize.md,
    fontWeight: "600",
    color: DESIGN_SYSTEM.colors.dark,
    marginBottom: DESIGN_SYSTEM.spacing.xs,
  },
  activityDescription: {
    fontSize: DESIGN_SYSTEM.fontSize.sm,
    color: DESIGN_SYSTEM.colors.gray[600],
    marginBottom: DESIGN_SYSTEM.spacing.xs,
    lineHeight: 18,
  },
  activityMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  activityTime: {
    fontSize: DESIGN_SYSTEM.fontSize.xs,
    color: DESIGN_SYSTEM.colors.gray[500],
  },
  activityAmount: {
    fontSize: DESIGN_SYSTEM.fontSize.xs,
    color: DESIGN_SYSTEM.colors.primary,
    fontWeight: "600",
  },
});
