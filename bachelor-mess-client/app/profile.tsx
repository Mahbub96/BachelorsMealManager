import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, View } from "react-native";

export default function ProfileScreen() {
  const profileInfo = {
    name: "Mahbub Alam",
    email: "mahbub@mess.com",
    phone: "+880 1712-345678",
    role: "Member",
    joinDate: "January 2024",
    messName: "Bachelor Mess #1",
  };

  const menuItems = [
    {
      id: "edit",
      title: "Edit Profile",
      subtitle: "Update your information",
      icon: "create",
      action: "navigate",
    },
    {
      id: "mess",
      title: "Mess Information",
      subtitle: "View mess details",
      icon: "home",
      action: "navigate",
    },
    {
      id: "payments",
      title: "Payment History",
      subtitle: "View your payments",
      icon: "card",
      action: "navigate",
    },
    {
      id: "logout",
      title: "Logout",
      subtitle: "Sign out of your account",
      icon: "log-out",
      action: "logout",
    },
  ];

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            <Ionicons name="person" size={48} color="#667eea" />
          </View>
          <View style={styles.profileInfo}>
            <ThemedText style={styles.name}>{profileInfo.name}</ThemedText>
            <ThemedText style={styles.email}>{profileInfo.email}</ThemedText>
            <ThemedText style={styles.role}>{profileInfo.role}</ThemedText>
          </View>
        </View>
      </View>

      <View style={styles.infoSection}>
        <View style={styles.infoItem}>
          <Ionicons name="call" size={20} color="#667eea" />
          <ThemedText style={styles.infoText}>{profileInfo.phone}</ThemedText>
        </View>
        <View style={styles.infoItem}>
          <Ionicons name="calendar" size={20} color="#667eea" />
          <ThemedText style={styles.infoText}>
            Joined {profileInfo.joinDate}
          </ThemedText>
        </View>
        <View style={styles.infoItem}>
          <Ionicons name="home" size={20} color="#667eea" />
          <ThemedText style={styles.infoText}>
            {profileInfo.messName}
          </ThemedText>
        </View>
      </View>

      <View style={styles.menuSection}>
        {menuItems.map((item) => (
          <Pressable key={item.id} style={styles.menuItem}>
            <View style={styles.menuLeft}>
              <View style={styles.menuIcon}>
                <Ionicons name={item.icon as any} size={24} color="#667eea" />
              </View>
              <View style={styles.menuContent}>
                <ThemedText style={styles.menuTitle}>{item.title}</ThemedText>
                <ThemedText style={styles.menuSubtitle}>
                  {item.subtitle}
                </ThemedText>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
          </Pressable>
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
  profileSection: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#f3f4f6",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  profileInfo: {
    flex: 1,
  },
  name: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: 4,
  },
  email: {
    fontSize: 16,
    color: "#6b7280",
    marginBottom: 4,
  },
  role: {
    fontSize: 14,
    color: "#667eea",
    fontWeight: "600",
  },
  infoSection: {
    backgroundColor: "#fff",
    padding: 16,
    marginTop: 12,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
  },
  infoText: {
    fontSize: 14,
    color: "#6b7280",
    marginLeft: 12,
  },
  menuSection: {
    flex: 1,
    padding: 16,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
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
  menuLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  menuIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#f3f4f6",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 4,
  },
  menuSubtitle: {
    fontSize: 14,
    color: "#6b7280",
  },
});
