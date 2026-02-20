import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { ScreenLayout } from "@/components/layout";
import { Ionicons } from "@expo/vector-icons";
import type { IconName } from "@/constants/IconTypes";
import { useRouter } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";

export default function HelpScreen() {
  const router = useRouter();
  const helpTopics = [
    {
      id: "getting-started",
      title: "Getting Started",
      subtitle: "Learn how to use the app",
      icon: "play-circle",
      description:
        "Basic guide to get you started with the Bachelor Flat Manager app.",
    },
    {
      id: "meals",
      title: "Managing Meals",
      subtitle: "How to submit and track meals",
      icon: "fast-food",
      description:
        "Learn how to submit your daily meals and view meal history.",
    },
    {
      id: "bazar",
      title: "Bazar Management",
      subtitle: "Upload and manage bazar lists",
      icon: "cart",
      description: "Understand how to upload bazar lists and track expenses.",
    },
    {
      id: "payments",
      title: "Payments & Billing",
      subtitle: "Understanding your bills",
      icon: "card",
      description: "Learn about payment methods and billing cycles.",
    },
    {
      id: "troubleshooting",
      title: "Troubleshooting",
      subtitle: "Common issues and solutions",
      icon: "construct",
      description: "Find solutions to common problems you might encounter.",
    },
  ];

  const contactInfo = [
    {
      id: "email",
      title: "Email Support",
      subtitle: "support@mahbub.dev",
      icon: "mail",
      action: "email",
    },
    {
      id: "phone",
      title: "Phone Support",
      subtitle: "+880 1712-345678",
      icon: "call",
      action: "phone",
    },
    {
      id: "whatsapp",
      title: "WhatsApp",
      subtitle: "Get instant help",
      icon: "logo-whatsapp",
      action: "whatsapp",
    },
  ];

  return (
    <ScreenLayout
      title="Help & Support"
      subtitle="Get help when you need it"
      showBack
      onBackPress={() => router.back()}
    >
      <ThemedView style={styles.container}>
        <View style={styles.content}>
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Help Topics</ThemedText>
          {helpTopics.map((topic) => (
            <Pressable key={topic.id} style={styles.topicItem}>
              <View style={styles.topicLeft}>
                <View style={styles.topicIcon}>
                  <Ionicons
                    name={topic.icon as IconName}
                    size={24}
                    color="#667eea"
                  />
                </View>
                <View style={styles.topicContent}>
                  <ThemedText style={styles.topicTitle}>
                    {topic.title}
                  </ThemedText>
                  <ThemedText style={styles.topicSubtitle}>
                    {topic.subtitle}
                  </ThemedText>
                  <ThemedText style={styles.topicDescription}>
                    {topic.description}
                  </ThemedText>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
            </Pressable>
          ))}
        </View>

        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Contact Support</ThemedText>
          {contactInfo.map((contact) => (
            <Pressable key={contact.id} style={styles.contactItem}>
              <View style={styles.contactLeft}>
                <View style={styles.contactIcon}>
                  <Ionicons
                    name={contact.icon as IconName}
                    size={24}
                    color="#667eea"
                  />
                </View>
                <View style={styles.contactContent}>
                  <ThemedText style={styles.contactTitle}>
                    {contact.title}
                  </ThemedText>
                  <ThemedText style={styles.contactSubtitle}>
                    {contact.subtitle}
                  </ThemedText>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
            </Pressable>
          ))}
        </View>
        </View>
      </ThemedView>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: 16,
  },
  topicItem: {
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
  topicLeft: {
    flexDirection: "row",
    alignItems: "flex-start",
    flex: 1,
  },
  topicIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#f3f4f6",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  topicContent: {
    flex: 1,
  },
  topicTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 4,
  },
  topicSubtitle: {
    fontSize: 14,
    color: "#667eea",
    marginBottom: 8,
  },
  topicDescription: {
    fontSize: 12,
    color: "#6b7280",
    lineHeight: 16,
  },
  contactItem: {
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
  contactLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  contactIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#f3f4f6",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  contactContent: {
    flex: 1,
  },
  contactTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 4,
  },
  contactSubtitle: {
    fontSize: 14,
    color: "#6b7280",
  },
});
