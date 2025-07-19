import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Pressable, StyleSheet, View, ViewStyle } from "react-native";
import { ThemedText } from "../ThemedText";

interface AnalyticsCardProps {
  title: string;
  children: React.ReactNode;
  style?: ViewStyle;
  onFullScreen?: () => void;
  actions?: React.ReactNode;
}

export const AnalyticsCard: React.FC<AnalyticsCardProps> = ({
  title,
  children,
  style,
  onFullScreen,
  actions,
}) => {
  return (
    <View style={[styles.card, style]}>
      <View style={styles.header}>
        <ThemedText style={styles.title}>{title}</ThemedText>
        <View style={styles.actions}>
          {actions}
          {onFullScreen && (
            <Pressable onPress={onFullScreen} style={styles.fullScreenBtn}>
              <Ionicons name="expand" size={20} color="#6b7280" />
            </Pressable>
          )}
        </View>
      </View>
      <View style={styles.content}>{children}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 18,
    marginBottom: 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: "#f3f4f6",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1f2937",
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  fullScreenBtn: {
    marginLeft: 8,
    padding: 4,
    borderRadius: 8,
  },
  content: {
    width: "100%",
  },
});
