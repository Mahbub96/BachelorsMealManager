import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React from "react";
import { Alert, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useAuth } from "@/context/AuthContext";
import APP_CONFIG from "@/config/app";

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          await logout();
          router.replace("/LoginScreen");
        },
      },
    ]);
  };

  const profileOptions = [
    {
      title: "Personal Information",
      icon: "person-outline",
      onPress: () =>
        Alert.alert("Profile", "Edit profile functionality coming soon"),
    },
    {
      title: "Change Password",
      icon: "lock-closed-outline",
      onPress: () =>
        Alert.alert("Password", "Change password functionality coming soon"),
    },
    {
      title: "Notifications",
      icon: "notifications-outline",
      onPress: () =>
        Alert.alert("Notifications", "Notification settings coming soon"),
    },
    {
      title: "Help & Support",
      icon: "help-circle-outline",
      onPress: () => router.push("/help"),
    },
    {
      title: "About",
      icon: "information-circle-outline",
      onPress: () =>
        Alert.alert(
          "About",
          `${APP_CONFIG.APP_NAME} v${APP_CONFIG.APP_VERSION}`
        ),
    },
  ];

  return (
    <LinearGradient colors={["#667eea", "#764ba2"]} style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.profileSection}>
            <View style={styles.avatar}>
              <Ionicons name="person" size={40} color="#fff" />
            </View>
            <View style={styles.userInfo}>
              <ThemedText style={styles.userName}>
                {user?.name || "User"}
              </ThemedText>
              <ThemedText style={styles.userEmail}>
                {user?.email || "user@example.com"}
              </ThemedText>
              <View style={styles.roleBadge}>
                <ThemedText style={styles.roleText}>
                  {user?.role === "admin" ? "Administrator" : "Member"}
                </ThemedText>
              </View>
            </View>
          </View>
        </View>

        {/* Profile Options */}
        <View style={styles.content}>
          <ThemedView style={styles.section}>
            <ThemedText style={styles.sectionTitle}>
              Account Settings
            </ThemedText>
            {profileOptions.map((option, index) => (
              <Pressable
                key={index}
                style={styles.optionItem}
                onPress={option.onPress}
              >
                <View style={styles.optionLeft}>
                  <Ionicons
                    name={option.icon as any}
                    size={24}
                    color={APP_CONFIG.UI.THEME.PRIMARY_COLOR}
                  />
                  <ThemedText style={styles.optionTitle}>
                    {option.title}
                  </ThemedText>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
              </Pressable>
            ))}
          </ThemedView>

          {/* Logout Button */}
          <ThemedView style={styles.section}>
            <Pressable
              style={[
                styles.logoutButton,
                { backgroundColor: APP_CONFIG.UI.THEME.ERROR_COLOR },
              ]}
              onPress={handleLogout}
            >
              <Ionicons name="log-out-outline" size={20} color="#fff" />
              <ThemedText style={styles.logoutText}>Logout</ThemedText>
            </Pressable>
          </ThemedView>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  profileSection: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 20,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.8)",
    marginBottom: 8,
  },
  roleBadge: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  roleText: {
    fontSize: 12,
    color: "#fff",
    fontWeight: "600",
  },
  content: {
    padding: 20,
  },
  section: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: 16,
  },
  optionItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  optionLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  optionTitle: {
    fontSize: 16,
    color: "#374151",
    marginLeft: 12,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 12,
  },
  logoutText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
});
