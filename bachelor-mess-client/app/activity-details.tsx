import { DetailCard } from "@/components/DetailCard";
import { DetailPageTemplate } from "@/components/DetailPageTemplate";
import { ThemedText } from "@/components/ThemedText";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import { Alert, StyleSheet, TouchableOpacity, View } from "react-native";

const DESIGN_SYSTEM = {
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    xxxl: 32,
  },
  borderRadius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
  },
  shadows: {
    small: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
    },
  },
};

export default function ActivityDetailsPage() {
  const router = useRouter();
  const params = useLocalSearchParams();

  // Parse the data from params
  const activity = {
    id: (params.id as string) || "1",
    type: (params.type as string) || "meal",
    title: (params.title as string) || "Activity Details",
    description: (params.description as string) || "Activity description",
    time: (params.time as string) || "2 hours ago",
    user: (params.user as string) || "User",
    amount: parseInt(params.amount as string) || 0,
    priority: (params.priority as string) || "medium",
    status: (params.status as string) || "completed",
  };

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
        return "#667eea";
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
        return "person";
      case "approval":
        return "checkmark-circle";
      default:
        return "information-circle";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "#ef4444";
      case "medium":
        return "#f59e0b";
      case "low":
        return "#10b981";
      default:
        return "#6b7280";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "#10b981";
      case "rejected":
        return "#ef4444";
      case "pending":
        return "#f59e0b";
      case "completed":
        return "#10b981";
      default:
        return "#6b7280";
    }
  };

  const formatCurrency = (amount: number) => {
    return `৳${amount.toLocaleString()}`;
  };

  const formatTime = (timeString: string) => {
    // Convert relative time to more detailed format
    if (timeString.includes("ago")) {
      return timeString;
    }
    return timeString;
  };

  const actionButtons = [
    {
      icon: "share",
      label: "Share Activity",
      onPress: () => Alert.alert("Share", "Activity shared successfully!"),
      color: "#667eea",
    },
    {
      icon: "create",
      label: "Edit Activity",
      onPress: () =>
        Alert.alert("Edit", "Edit activity functionality coming soon!"),
      color: "#667eea",
    },
    {
      icon: "trash",
      label: "Delete Activity",
      onPress: () => Alert.alert("Delete", "Activity deleted successfully!"),
      color: "#ef4444",
    },
  ];

  return (
    <DetailPageTemplate
      title={activity.title}
      gradientColors={[getActivityColor(activity.type), "#764ba2"]}
      actionButtons={actionButtons}
    >
      {/* Activity Overview */}
      <DetailCard
        title="Activity Overview"
        value={activity.type.toUpperCase()}
        icon={getActivityIcon(activity.type)}
        iconColor={getActivityColor(activity.type)}
      >
        <View style={styles.overviewContainer}>
          <View style={styles.overviewItem}>
            <ThemedText style={styles.overviewLabel}>Type</ThemedText>
            <ThemedText style={styles.overviewValue}>
              {activity.type}
            </ThemedText>
          </View>
          <View style={styles.overviewItem}>
            <ThemedText style={styles.overviewLabel}>Status</ThemedText>
            <View style={styles.statusContainer}>
              <View
                style={[
                  styles.statusIndicator,
                  { backgroundColor: getStatusColor(activity.status) },
                ]}
              />
              <ThemedText style={styles.overviewValue}>
                {activity.status}
              </ThemedText>
            </View>
          </View>
          <View style={styles.overviewItem}>
            <ThemedText style={styles.overviewLabel}>Priority</ThemedText>
            <View style={styles.priorityContainer}>
              <View
                style={[
                  styles.priorityIndicator,
                  { backgroundColor: getPriorityColor(activity.priority) },
                ]}
              />
              <ThemedText style={styles.overviewValue}>
                {activity.priority}
              </ThemedText>
            </View>
          </View>
          <View style={styles.overviewItem}>
            <ThemedText style={styles.overviewLabel}>User</ThemedText>
            <ThemedText style={styles.overviewValue}>
              {activity.user}
            </ThemedText>
          </View>
        </View>
      </DetailCard>

      {/* Activity Details */}
      <DetailCard
        title="Activity Details"
        value="Information"
        icon="document-text"
        iconColor="#667eea"
      >
        <View style={styles.detailsContainer}>
          <View style={styles.detailItem}>
            <ThemedText style={styles.detailLabel}>Description</ThemedText>
            <ThemedText style={styles.detailValue}>
              {activity.description}
            </ThemedText>
          </View>
          <View style={styles.detailItem}>
            <ThemedText style={styles.detailLabel}>Time</ThemedText>
            <ThemedText style={styles.detailValue}>
              {formatTime(activity.time)}
            </ThemedText>
          </View>
          {activity.amount > 0 && (
            <View style={styles.detailItem}>
              <ThemedText style={styles.detailLabel}>Amount</ThemedText>
              <ThemedText style={styles.detailValue}>
                {formatCurrency(activity.amount)}
              </ThemedText>
            </View>
          )}
        </View>
      </DetailCard>

      {/* Related Activities */}
      <DetailCard
        title="Related Activities"
        value="Similar"
        icon="list"
        iconColor="#667eea"
      >
        <View style={styles.relatedContainer}>
          <TouchableOpacity
            style={styles.relatedItem}
            onPress={() =>
              Alert.alert("Related Activity", "Viewing related activity")
            }
          >
            <View
              style={[
                styles.relatedIcon,
                { backgroundColor: getActivityColor(activity.type) + "20" },
              ]}
            >
              <Ionicons
                name={getActivityIcon(activity.type) as any}
                size={16}
                color={getActivityColor(activity.type)}
              />
            </View>
            <View style={styles.relatedContent}>
              <ThemedText style={styles.relatedTitle}>
                Similar {activity.type} activity
              </ThemedText>
              <ThemedText style={styles.relatedTime}>1 day ago</ThemedText>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#9ca3af" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.relatedItem}
            onPress={() =>
              Alert.alert("Related Activity", "Viewing related activity")
            }
          >
            <View
              style={[styles.relatedIcon, { backgroundColor: "#f59e0b20" }]}
            >
              <Ionicons name="time" size={16} color="#f59e0b" />
            </View>
            <View style={styles.relatedContent}>
              <ThemedText style={styles.relatedTitle}>
                Recent activity by {activity.user}
              </ThemedText>
              <ThemedText style={styles.relatedTime}>3 days ago</ThemedText>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#9ca3af" />
          </TouchableOpacity>
        </View>
      </DetailCard>

      {/* Activity Timeline */}
      <DetailCard
        title="Activity Timeline"
        value="History"
        icon="time"
        iconColor="#667eea"
      >
        <View style={styles.timelineContainer}>
          <View style={styles.timelineItem}>
            <View
              style={[
                styles.timelineDot,
                { backgroundColor: getStatusColor(activity.status) },
              ]}
            />
            <View style={styles.timelineContent}>
              <ThemedText style={styles.timelineTitle}>
                Activity {activity.status}
              </ThemedText>
              <ThemedText style={styles.timelineTime}>
                {activity.time}
              </ThemedText>
            </View>
          </View>
          <View style={styles.timelineItem}>
            <View
              style={[styles.timelineDot, { backgroundColor: "#6b7280" }]}
            />
            <View style={styles.timelineContent}>
              <ThemedText style={styles.timelineTitle}>
                Activity created
              </ThemedText>
              <ThemedText style={styles.timelineTime}>1 hour ago</ThemedText>
            </View>
          </View>
        </View>
      </DetailCard>
    </DetailPageTemplate>
  );
}

const styles = StyleSheet.create({
  overviewContainer: {
    gap: DESIGN_SYSTEM.spacing.md,
  },
  overviewItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: DESIGN_SYSTEM.spacing.sm,
  },
  overviewLabel: {
    fontSize: 14,
    color: "#6b7280",
    fontWeight: "500",
  },
  overviewValue: {
    fontSize: 14,
    color: "#1f2937",
    fontWeight: "600",
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: DESIGN_SYSTEM.spacing.xs,
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  priorityContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: DESIGN_SYSTEM.spacing.xs,
  },
  priorityIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  detailsContainer: {
    gap: DESIGN_SYSTEM.spacing.md,
  },
  detailItem: {
    marginBottom: DESIGN_SYSTEM.spacing.md,
  },
  detailLabel: {
    fontSize: 14,
    color: "#6b7280",
    fontWeight: "500",
    marginBottom: DESIGN_SYSTEM.spacing.xs,
  },
  detailValue: {
    fontSize: 16,
    color: "#1f2937",
    fontWeight: "600",
  },
  relatedContainer: {
    gap: DESIGN_SYSTEM.spacing.md,
  },
  relatedItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: DESIGN_SYSTEM.spacing.md,
    backgroundColor: "#f8fafc",
    borderRadius: DESIGN_SYSTEM.borderRadius.md,
  },
  relatedIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginRight: DESIGN_SYSTEM.spacing.md,
  },
  relatedContent: {
    flex: 1,
  },
  relatedTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 2,
  },
  relatedTime: {
    fontSize: 12,
    color: "#6b7280",
  },
  timelineContainer: {
    gap: DESIGN_SYSTEM.spacing.md,
  },
  timelineItem: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: DESIGN_SYSTEM.spacing.md,
    marginTop: 4,
  },
  timelineContent: {
    flex: 1,
  },
  timelineTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 2,
  },
  timelineTime: {
    fontSize: 12,
    color: "#6b7280",
  },
});
