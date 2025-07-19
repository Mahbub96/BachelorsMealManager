import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, View } from "react-native";

export default function NotificationsScreen() {
  const notifications = [
    {
      id: "1",
      title: "New meal entry submitted",
      message: "Mahbub Alam submitted today's meal entry",
      time: "2 hours ago",
      type: "meal",
    },
    {
      id: "2",
      title: "Bazar list uploaded",
      message: "New bazar list uploaded by Karim",
      time: "1 day ago",
      type: "bazar",
    },
    {
      id: "3",
      title: "Monthly summary ready",
      message: "December monthly summary is now available",
      time: "3 days ago",
      type: "summary",
    },
  ];

  const getIcon = (type: string) => {
    switch (type) {
      case "meal":
        return "fast-food";
      case "bazar":
        return "cart";
      case "summary":
        return "stats-chart";
      default:
        return "notifications";
    }
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemedText style={styles.title}>Notifications</ThemedText>
        <ThemedText style={styles.subtitle}>
          Stay updated with mess activities
        </ThemedText>
      </View>

      <View style={styles.notificationsList}>
        {notifications.map((notification) => (
          <View key={notification.id} style={styles.notificationItem}>
            <View style={styles.iconContainer}>
              <Ionicons
                name={getIcon(notification.type) as any}
                size={24}
                color="#667eea"
              />
            </View>
            <View style={styles.content}>
              <ThemedText style={styles.notificationTitle}>
                {notification.title}
              </ThemedText>
              <ThemedText style={styles.notificationMessage}>
                {notification.message}
              </ThemedText>
              <ThemedText style={styles.notificationTime}>
                {notification.time}
              </ThemedText>
            </View>
          </View>
        ))}
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  header: {
    padding: 20,
    paddingTop: 40,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: "#6b7280",
  },
  notificationsList: {
    flex: 1,
    padding: 16,
  },
  notificationItem: {
    flexDirection: "row",
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#f3f4f6",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  content: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 4,
  },
  notificationMessage: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 8,
  },
  notificationTime: {
    fontSize: 12,
    color: "#9ca3af",
  },
});
