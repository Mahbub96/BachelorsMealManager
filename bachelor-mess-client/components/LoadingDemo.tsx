import React, { useState } from "react";
import { View, StyleSheet, Pressable, ScrollView } from "react-native";
import { ThemedText } from "./ThemedText";
import { ModernLoadingSpinner } from "./ModernLoadingSpinner";
import { LoadingSpinner } from "./LoadingSpinner";

export const LoadingDemo: React.FC = () => {
  const [showDemo, setShowDemo] = useState(false);

  if (!showDemo) {
    return (
      <Pressable style={styles.demoButton} onPress={() => setShowDemo(true)}>
        <ThemedText style={styles.demoButtonText}>Show Loading Demo</ThemedText>
      </Pressable>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <ThemedText style={styles.title}>Modern Loading Spinners</ThemedText>

      {/* Modern Loading Spinner Variants */}
      <View style={styles.section}>
        <ThemedText style={styles.sectionTitle}>
          Modern Loading Spinner
        </ThemedText>

        <View style={styles.variantContainer}>
          <View style={styles.variant}>
            <ModernLoadingSpinner
              size="small"
              variant="default"
              message="Default"
            />
          </View>

          <View style={styles.variant}>
            <ModernLoadingSpinner
              size="medium"
              variant="gradient"
              message="Gradient"
            />
          </View>

          <View style={styles.variant}>
            <ModernLoadingSpinner
              size="large"
              variant="minimal"
              message="Minimal"
            />
          </View>
        </View>
      </View>

      {/* Legacy Loading Spinner Variants */}
      <View style={styles.section}>
        <ThemedText style={styles.sectionTitle}>
          Legacy Loading Spinner
        </ThemedText>

        <View style={styles.variantContainer}>
          <View style={styles.variant}>
            <LoadingSpinner
              size="small"
              type="modern"
              variant="default"
              text="Modern Default"
            />
          </View>

          <View style={styles.variant}>
            <LoadingSpinner
              size="medium"
              type="modern"
              variant="gradient"
              text="Modern Gradient"
            />
          </View>

          <View style={styles.variant}>
            <LoadingSpinner
              size="large"
              type="modern"
              variant="minimal"
              text="Modern Minimal"
            />
          </View>
        </View>
      </View>

      {/* Different Types */}
      <View style={styles.section}>
        <ThemedText style={styles.sectionTitle}>Different Types</ThemedText>

        <View style={styles.variantContainer}>
          <View style={styles.variant}>
            <LoadingSpinner size="medium" type="spinner" text="Spinner" />
          </View>

          <View style={styles.variant}>
            <LoadingSpinner size="medium" type="pulse" text="Pulse" />
          </View>

          <View style={styles.variant}>
            <LoadingSpinner size="medium" type="dots" text="Dots" />
          </View>
        </View>
      </View>

      <Pressable style={styles.closeButton} onPress={() => setShowDemo(false)}>
        <ThemedText style={styles.closeButtonText}>Close Demo</ThemedText>
      </Pressable>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#1f2937",
    textAlign: "center",
    marginBottom: 30,
    marginTop: 20,
  },
  section: {
    marginBottom: 40,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 20,
  },
  variantContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    flexWrap: "wrap",
    gap: 20,
  },
  variant: {
    alignItems: "center",
    padding: 20,
    backgroundColor: "#fff",
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    minWidth: 120,
  },
  demoButton: {
    backgroundColor: "#667eea",
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    margin: 20,
    alignItems: "center",
  },
  demoButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  closeButton: {
    backgroundColor: "#ef4444",
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    marginTop: 20,
    alignItems: "center",
  },
  closeButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
