import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React from "react";
import { ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import { ActionButton } from "./DetailCard";
import { ThemedText } from "./ThemedText";

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

interface DetailPageTemplateProps {
  title: string;
  gradientColors: [string, string];
  children: React.ReactNode;
  showShareButton?: boolean;
  onShare?: () => void;
  actionButtons?: {
    icon: string;
    label: string;
    onPress: () => void;
    color?: string;
  }[];
}

export const DetailPageTemplate: React.FC<DetailPageTemplateProps> = ({
  title,
  gradientColors,
  children,
  showShareButton = true,
  onShare,
  actionButtons = [],
}) => {
  const router = useRouter();

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={gradientColors} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <ThemedText style={styles.headerTitle}>{title}</ThemedText>
          {showShareButton && (
            <TouchableOpacity style={styles.shareButton} onPress={onShare}>
              <Ionicons name="share-outline" size={24} color="#fff" />
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {children}

        {/* Action Buttons */}
        {actionButtons.length > 0 && (
          <View style={styles.actionButtons}>
            {actionButtons.map((button, index) => (
              <ActionButton
                key={index}
                icon={button.icon}
                label={button.label}
                onPress={button.onPress}
                color={button.color}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  header: {
    paddingTop: 50,
    paddingBottom: DESIGN_SYSTEM.spacing.lg,
    paddingHorizontal: DESIGN_SYSTEM.spacing.lg,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backButton: {
    padding: DESIGN_SYSTEM.spacing.xs,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
    flex: 1,
    textAlign: "center",
  },
  shareButton: {
    padding: DESIGN_SYSTEM.spacing.xs,
  },
  content: {
    flex: 1,
    padding: DESIGN_SYSTEM.spacing.lg,
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: DESIGN_SYSTEM.spacing.lg,
    marginBottom: DESIGN_SYSTEM.spacing.xl,
  },
});
