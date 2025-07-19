import React from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { ThemedText } from "../ThemedText";

interface MonthSelectorProps {
  months: string[];
  selectedMonth: string;
  onSelectMonth: (month: string) => void;
}

export const MonthSelector: React.FC<MonthSelectorProps> = ({
  months,
  selectedMonth,
  onSelectMonth,
}) => (
  <View style={styles.container}>
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
    >
      {months.map((month) => (
        <Pressable
          key={month}
          style={[styles.button, selectedMonth === month && styles.selected]}
          onPress={() => onSelectMonth(month)}
        >
          <ThemedText
            style={[
              styles.buttonText,
              selectedMonth === month && styles.selectedText,
            ]}
          >
            {month}
          </ThemedText>
        </Pressable>
      ))}
    </ScrollView>
  </View>
);

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  scrollContent: {
    alignItems: "center",
    paddingVertical: 4,
  },
  button: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: "#f3f4f6",
    marginHorizontal: 4,
  },
  selected: {
    backgroundColor: "#667eea",
  },
  buttonText: {
    fontSize: 14,
    color: "#6b7280",
    fontWeight: "500",
  },
  selectedText: {
    color: "#fff",
    fontWeight: "bold",
  },
});
