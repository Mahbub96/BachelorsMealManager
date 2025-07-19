import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Switch, View } from "react-native";

export default function SettingsScreen() {
  const settings = [
    {
      id: "notifications",
      title: "Push Notifications",
      subtitle: "Receive alerts for meals and bazar",
      icon: "notifications",
      type: "toggle",
      value: true,
    },
    {
      id: "darkMode",
      title: "Dark Mode",
      subtitle: "Switch to dark theme",
      icon: "moon",
      type: "toggle",
      value: false,
    },
    {
      id: "language",
      title: "Language",
      subtitle: "English",
      icon: "language",
      type: "select",
    },
    {
      id: "privacy",
      title: "Privacy Settings",
      subtitle: "Manage your data and privacy",
      icon: "shield-checkmark",
      type: "navigate",
    },
    {
      id: "about",
      title: "About App",
      subtitle: "Version 1.0.0",
      icon: "information-circle",
      type: "navigate",
    },
  ];

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemedText style={styles.title}>Settings</ThemedText>
        <ThemedText style={styles.subtitle}>
          Customize your app experience
        </ThemedText>
      </View>

      <View style={styles.settingsList}>
        {settings.map((setting) => (
          <View key={setting.id} style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <View style={styles.iconContainer}>
                <Ionicons
                  name={setting.icon as any}
                  size={24}
                  color="#667eea"
                />
              </View>
              <View style={styles.settingContent}>
                <ThemedText style={styles.settingTitle}>
                  {setting.title}
                </ThemedText>
                <ThemedText style={styles.settingSubtitle}>
                  {setting.subtitle}
                </ThemedText>
              </View>
            </View>
            <View style={styles.settingRight}>
              {setting.type === "toggle" && (
                <Switch
                  value={setting.value}
                  onValueChange={() => {}}
                  trackColor={{ false: "#e5e7eb", true: "#667eea" }}
                  thumbColor={setting.value ? "#fff" : "#fff"}
                />
              )}
              {setting.type === "select" && (
                <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
              )}
              {setting.type === "navigate" && (
                <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
              )}
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
  settingsList: {
    flex: 1,
    padding: 16,
  },
  settingItem: {
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
  settingLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
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
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 4,
  },
  settingSubtitle: {
    fontSize: 14,
    color: "#6b7280",
  },
  settingRight: {
    marginLeft: 16,
  },
});
