import React, { useState } from "react";
import { View, StyleSheet, Pressable, ScrollView } from "react-native";
import { ThemedText } from "./ThemedText";
import { MessLoadingSpinner } from "./MessLoadingSpinner";

export const MessLoadingDemo: React.FC = () => {
  const [showDemo, setShowDemo] = useState(false);
  const [currentType, setCurrentType] = useState<
    "auth" | "meals" | "bazar" | "dashboard" | "general"
  >("auth");

  if (!showDemo) {
    return (
      <Pressable style={styles.demoButton} onPress={() => setShowDemo(true)}>
        <ThemedText style={styles.demoButtonText}>
          Show Mess Loading Demo
        </ThemedText>
      </Pressable>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <ThemedText style={styles.title}>
          Bachelor Mess Loading Spinners
        </ThemedText>

        {/* Type Selector */}
        <View style={styles.typeSelector}>
          <ThemedText style={styles.sectionTitle}>
            Select Loading Type
          </ThemedText>
          <View style={styles.buttonContainer}>
            {(["auth", "meals", "bazar", "dashboard", "general"] as const).map(
              (type) => (
                <Pressable
                  key={type}
                  style={[
                    styles.typeButton,
                    currentType === type && styles.activeTypeButton,
                  ]}
                  onPress={() => setCurrentType(type)}
                >
                  <ThemedText
                    style={[
                      styles.typeButtonText,
                      currentType === type && styles.activeTypeButtonText,
                    ]}
                  >
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </ThemedText>
                </Pressable>
              )
            )}
          </View>
        </View>

        {/* Current Loading Spinner */}
        <View style={styles.spinnerSection}>
          <ThemedText style={styles.sectionTitle}>
            {currentType.charAt(0).toUpperCase() + currentType.slice(1)} Loading
          </ThemedText>
          <View style={styles.spinnerContainer}>
            <MessLoadingSpinner type={currentType} size="large" />
          </View>
        </View>

        {/* Size Variants */}
        <View style={styles.sizeSection}>
          <ThemedText style={styles.sectionTitle}>Size Variants</ThemedText>
          <View style={styles.sizeContainer}>
            <View style={styles.sizeVariant}>
              <ThemedText style={styles.sizeLabel}>Small</ThemedText>
              <MessLoadingSpinner type={currentType} size="small" />
            </View>

            <View style={styles.sizeVariant}>
              <ThemedText style={styles.sizeLabel}>Medium</ThemedText>
              <MessLoadingSpinner type={currentType} size="medium" />
            </View>

            <View style={styles.sizeVariant}>
              <ThemedText style={styles.sizeLabel}>Large</ThemedText>
              <MessLoadingSpinner type={currentType} size="large" />
            </View>
          </View>
        </View>

        {/* Features */}
        <View style={styles.featuresSection}>
          <ThemedText style={styles.sectionTitle}>Features</ThemedText>
          <View style={styles.featureList}>
            <View style={styles.featureItem}>
              <ThemedText style={styles.featureIcon}>🎨</ThemedText>
              <ThemedText style={styles.featureText}>
                Brand-specific design with "BM" logo
              </ThemedText>
            </View>
            <View style={styles.featureItem}>
              <ThemedText style={styles.featureIcon}>🍽️</ThemedText>
              <ThemedText style={styles.featureText}>
                Context-aware icons (restaurant, cart, home, etc.)
              </ThemedText>
            </View>
            <View style={styles.featureItem}>
              <ThemedText style={styles.featureIcon}>🌈</ThemedText>
              <ThemedText style={styles.featureText}>
                Type-specific color schemes
              </ThemedText>
            </View>
            <View style={styles.featureItem}>
              <ThemedText style={styles.featureIcon}>⚡</ThemedText>
              <ThemedText style={styles.featureText}>
                Smooth animations and transitions
              </ThemedText>
            </View>
            <View style={styles.featureItem}>
              <ThemedText style={styles.featureIcon}>📱</ThemedText>
              <ThemedText style={styles.featureText}>
                Responsive design for all screen sizes
              </ThemedText>
            </View>
          </View>
        </View>
      </ScrollView>

      <Pressable style={styles.closeButton} onPress={() => setShowDemo(false)}>
        <ThemedText style={styles.closeButtonText}>Close Demo</ThemedText>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  scrollView: {
    flex: 1,
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
  typeSelector: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 16,
  },
  buttonContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  typeButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: "#e5e7eb",
    borderWidth: 1,
    borderColor: "#d1d5db",
  },
  activeTypeButton: {
    backgroundColor: "#667eea",
    borderColor: "#667eea",
  },
  typeButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#374151",
  },
  activeTypeButtonText: {
    color: "#fff",
  },
  spinnerSection: {
    marginBottom: 30,
    alignItems: "center",
  },
  spinnerContainer: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  sizeSection: {
    marginBottom: 30,
  },
  sizeContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    flexWrap: "wrap",
    gap: 16,
  },
  sizeVariant: {
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    minWidth: 100,
  },
  sizeLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#6b7280",
    marginBottom: 8,
  },
  featuresSection: {
    marginBottom: 30,
  },
  featureList: {
    gap: 12,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  featureIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  featureText: {
    fontSize: 14,
    color: "#374151",
    flex: 1,
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
    margin: 20,
    alignItems: "center",
  },
  closeButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
