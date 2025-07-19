import { useRouter } from "expo-router";
import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { ThemedText } from "../ThemedText";

interface Stat {
  label: string;
  value: string | number;
}

interface SummaryStatsProps {
  stats: Stat[];
}

export const SummaryStats: React.FC<SummaryStatsProps> = ({ stats }) => {
  const router = useRouter();

  const handleStatPress = (stat: Stat) => {
    // Handle expense-related stats
    if (
      stat.label.toLowerCase().includes("expense") ||
      stat.label.toLowerCase().includes("cost") ||
      stat.label.toLowerCase().includes("balance") ||
      stat.label.toLowerCase().includes("revenue")
    ) {
      // Navigate to expense details
      router.push({
        pathname: "/expense-details",
        params: {
          title: stat.label,
          value: stat.value.toString(),
          type: stat.label.toLowerCase().includes("expense")
            ? "monthly"
            : "balance",
          color: "#667eea",
          description: `Detailed breakdown of ${stat.label.toLowerCase()} including all related costs and expenses.`,
          notes: `This data is updated daily and reflects current market conditions for ${stat.label.toLowerCase()}.`,
        },
      });
    }
  };

  return (
    <View style={styles.row}>
      {stats.map((stat) => (
        <Pressable
          key={stat.label}
          style={styles.statBox}
          onPress={() => handleStatPress(stat)}
        >
          <ThemedText style={styles.value}>{stat.value}</ThemedText>
          <ThemedText style={styles.label}>{stat.label}</ThemedText>
        </Pressable>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
    gap: 12,
  },
  statBox: {
    flex: 1,
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    padding: 10,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  value: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: 2,
  },
  label: {
    fontSize: 12,
    color: "#6b7280",
  },
});
