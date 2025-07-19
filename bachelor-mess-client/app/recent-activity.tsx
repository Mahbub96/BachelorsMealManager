import { ThemedText } from "@/components/ThemedText";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";

interface Activity {
  id: string;
  type: "meal" | "payment" | "bazar" | "member" | "approval";
  title: string;
  description: string;
  time: string;
  priority: "low" | "medium" | "high";
  amount?: number;
  user?: string;
  icon?: string;
  status?: "pending" | "approved" | "rejected";
}

export default function RecentActivityScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<
    "all" | "meals" | "bazar" | "payments" | "members"
  >("all");

  // Mock data - replace with real API data
  const activities: Activity[] = [
    {
      id: "1",
      type: "meal",
      title: "Lunch added",
      description: "Mahbub Alam recorded lunch meal for today",
      time: "2 hours ago",
      priority: "medium",
      user: "Mahbub Alam",
      icon: "restaurant",
    },
    {
      id: "2",
      type: "bazar",
      title: "Bazar uploaded",
      description: "Karim uploaded bazar list for this week",
      time: "4 hours ago",
      priority: "high",
      amount: 2500,
      user: "Karim",
      icon: "cart",
      status: "pending",
    },
    {
      id: "3",
      type: "payment",
      title: "Payment received",
      description: "Rahim paid monthly contribution",
      time: "1 day ago",
      priority: "low",
      amount: 500,
      user: "Rahim",
      icon: "card",
    },
    {
      id: "4",
      type: "member",
      title: "New member joined",
      description: "Salam joined the mess",
      time: "2 days ago",
      priority: "medium",
      user: "Salam",
      icon: "person-add",
    },
    {
      id: "5",
      type: "approval",
      title: "Meal approval",
      description: "Breakfast approval for yesterday",
      time: "3 days ago",
      priority: "medium",
      user: "Admin",
      icon: "checkmark-circle",
      status: "approved",
    },
    {
      id: "6",
      type: "bazar",
      title: "Bazar approved",
      description: "Weekly bazar list approved",
      time: "4 days ago",
      priority: "high",
      amount: 3200,
      user: "Admin",
      icon: "checkmark-circle",
      status: "approved",
    },
  ];

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

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "approved":
        return "#10b981";
      case "rejected":
        return "#ef4444";
      case "pending":
        return "#f59e0b";
      default:
        return "#6b7280";
    }
  };

  const formatCurrency = (amount: number) => {
    return `৳${amount.toLocaleString()}`;
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

  const filteredActivities = activities.filter((activity) => {
    const matchesSearch =
      activity.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      activity.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      activity.user?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFilter =
      selectedFilter === "all" || activity.type === selectedFilter;

    return matchesSearch && matchesFilter;
  });

  const filters = [
    { key: "all", label: "All", icon: "apps" },
    { key: "meals", label: "Meals", icon: "restaurant" },
    { key: "bazar", label: "Bazar", icon: "cart" },
    { key: "payments", label: "Payments", icon: "card" },
    { key: "members", label: "Members", icon: "people" },
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={["#667eea", "#764ba2"]}
        style={styles.headerGradient}
      >
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </Pressable>
          <View style={styles.headerContent}>
            <ThemedText style={styles.headerTitle}>
              Recent Activities
            </ThemedText>
            <ThemedText style={styles.headerSubtitle}>
              All recent activities and updates
            </ThemedText>
          </View>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Ionicons
              name="search"
              size={20}
              color="#9ca3af"
              style={styles.searchIcon}
            />
            <TextInput
              style={styles.searchInput}
              placeholder="Search activities..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="#9ca3af"
            />
          </View>
        </View>

        {/* Filter Tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterContainer}
        >
          {filters.map((filter) => (
            <Pressable
              key={filter.key}
              style={[
                styles.filterTab,
                selectedFilter === filter.key && styles.activeFilterTab,
              ]}
              onPress={() => setSelectedFilter(filter.key as any)}
            >
              <Ionicons
                name={filter.icon as any}
                size={16}
                color={selectedFilter === filter.key ? "#667eea" : "#9ca3af"}
              />
              <ThemedText
                style={[
                  styles.filterText,
                  selectedFilter === filter.key && styles.activeFilterText,
                ]}
              >
                {filter.label}
              </ThemedText>
            </Pressable>
          ))}
        </ScrollView>

        {/* Activities List */}
        <View style={styles.activitiesContainer}>
          {filteredActivities.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="search" size={48} color="#9ca3af" />
              <ThemedText style={styles.emptyStateTitle}>
                No activities found
              </ThemedText>
              <ThemedText style={styles.emptyStateSubtitle}>
                Try adjusting your search or filter criteria
              </ThemedText>
            </View>
          ) : (
            filteredActivities.map((activity) => (
              <View key={activity.id} style={styles.activityCard}>
                <View style={styles.activityHeader}>
                  <View style={styles.activityIconContainer}>
                    <Ionicons
                      name={getActivityIcon(activity.type) as any}
                      size={20}
                      color="#fff"
                    />
                  </View>
                  <View style={styles.activityContent}>
                    <View style={styles.activityTitleRow}>
                      <ThemedText style={styles.activityTitle}>
                        {activity.title}
                      </ThemedText>
                      <View
                        style={[
                          styles.priorityIndicator,
                          {
                            backgroundColor: getPriorityColor(
                              activity.priority
                            ),
                          },
                        ]}
                      />
                    </View>
                    <ThemedText style={styles.activityDescription}>
                      {activity.description}
                    </ThemedText>
                    <View style={styles.activityMeta}>
                      <ThemedText style={styles.activityUser}>
                        by {activity.user}
                      </ThemedText>
                      <ThemedText style={styles.activityTime}>
                        {activity.time}
                      </ThemedText>
                    </View>
                  </View>
                  <View style={styles.activityAmount}>
                    {activity.amount && (
                      <ThemedText style={styles.amountText}>
                        {formatCurrency(activity.amount)}
                      </ThemedText>
                    )}
                    {activity.status && (
                      <View
                        style={[
                          styles.statusBadge,
                          {
                            backgroundColor:
                              getStatusColor(activity.status) + "20",
                          },
                        ]}
                      >
                        <ThemedText
                          style={[
                            styles.statusText,
                            { color: getStatusColor(activity.status) },
                          ]}
                        >
                          {activity.status.charAt(0).toUpperCase() +
                            activity.status.slice(1)}
                        </ThemedText>
                      </View>
                    )}
                  </View>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </View>
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
    alignItems: "center",
  },
  backButton: {
    marginRight: 16,
    padding: 8,
    borderRadius: 8,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.9)",
  },
  content: {
    flex: 1,
  },
  searchContainer: {
    padding: 20,
    paddingBottom: 12,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#1f2937",
  },
  filterContainer: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  filterTab: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 12,
    borderRadius: 20,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  activeFilterTab: {
    backgroundColor: "#eef2ff",
    borderColor: "#667eea",
  },
  filterText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#9ca3af",
    marginLeft: 6,
  },
  activeFilterText: {
    color: "#667eea",
  },
  activitiesContainer: {
    padding: 20,
  },
  activityCard: {
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
  activityHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  activityIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#667eea",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
    marginRight: 12,
  },
  activityTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1f2937",
    flex: 1,
  },
  priorityIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 8,
  },
  activityDescription: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 8,
  },
  activityMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  activityUser: {
    fontSize: 12,
    color: "#9ca3af",
  },
  activityTime: {
    fontSize: 12,
    color: "#9ca3af",
  },
  activityAmount: {
    alignItems: "flex-end",
  },
  amountText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#10b981",
    marginBottom: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    fontWeight: "bold",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1f2937",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtitle: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
  },
});
