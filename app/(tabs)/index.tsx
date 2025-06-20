import { HelloWave } from "@/components/HelloWave";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { Pressable, StyleSheet } from "react-native";
import HomePage from "../HomePage";

WebBrowser.maybeCompleteAuthSession();

export function WelcomeMessage() {
  const router = useRouter();
  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Welcome to Bachelor Mess Manager!</ThemedText>
        <HelloWave />
      </ThemedView>
      <ThemedText type="default" style={styles.subtitle}>
        Manage your mess, meals, and expenses with ease. Join or create a mess,
        track daily meals, and stay organized effortlessly.
      </ThemedText>
      <ThemedView style={styles.buttonRow}>
        <Pressable
          style={styles.button}
          onPress={() => router.push("/(tabs)/meals")}
        >
          <ThemedText style={styles.buttonText}>Get Started</ThemedText>
        </Pressable>
        <Pressable
          style={styles.buttonSecondary}
          onPress={() => router.push("/(tabs)/explore")}
        >
          <ThemedText style={styles.buttonTextSecondary}>Explore</ThemedText>
        </Pressable>
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    backgroundColor: "transparent",
  },
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  subtitle: {
    textAlign: "center",
    marginBottom: 32,
    color: "#888",
    fontSize: 16,
    maxWidth: 320,
  },
  buttonRow: {
    flexDirection: "row",
    gap: 16,
  },
  button: {
    backgroundColor: "#007AFF",
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  buttonSecondary: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#007AFF",
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8,
  },
  buttonTextSecondary: {
    color: "#007AFF",
    fontWeight: "bold",
    fontSize: 16,
  },
  homeContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    backgroundColor: "transparent",
  },
  dashboardRow: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 16,
  },
  dashboardCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingVertical: 32,
    paddingHorizontal: 32,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    minWidth: 120,
  },
  dashboardCardTitle: {
    color: "#007AFF",
    fontWeight: "bold",
    fontSize: 18,
  },
});

export default function HomeScreen() {
  return <HomePage />;
}
