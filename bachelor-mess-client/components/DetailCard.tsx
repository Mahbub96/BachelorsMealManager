import { Ionicons } from "@expo/vector-icons";
import type { IconName } from "@/constants/IconTypes";
import React from "react";
import { StyleSheet, StyleProp, ViewStyle, TouchableOpacity, View } from "react-native";
import { ThemedText } from "./ThemedText";

interface DetailCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: string;
  iconColor?: string;
  onPress?: () => void;
  gradient?: boolean;
  gradientColors?: [string, string];
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export const DetailCard: React.FC<DetailCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  iconColor = "#667eea",
  onPress,
  gradient = false,
  gradientColors = ["#667eea", "#764ba2"],
  children,
  style,
}) => {
  const CardWrapper = onPress ? TouchableOpacity : View;
  const cardStyle = [styles.card, gradient && styles.gradientCard, style];

  return (
    <CardWrapper style={cardStyle} onPress={onPress}>
      <View style={styles.cardHeader}>
        {icon && <Ionicons name={icon as IconName} size={20} color={iconColor} />}
        <ThemedText style={styles.cardTitle}>{title}</ThemedText>
      </View>

      <View style={styles.cardContent}>
        <ThemedText style={styles.cardValue}>{value}</ThemedText>
        {subtitle && (
          <ThemedText style={styles.cardSubtitle}>{subtitle}</ThemedText>
        )}
      </View>

      {children}
    </CardWrapper>
  );
};

export const MetricCard: React.FC<{
  icon: string;
  value: string | number;
  label: string;
  color?: string;
  onPress?: () => void;
}> = ({ icon, value, label, color = "#667eea", onPress }) => {
  const CardWrapper = onPress ? TouchableOpacity : View;

  return (
    <CardWrapper style={styles.metricCard} onPress={onPress}>
      <Ionicons name={icon as IconName} size={20} color={color} />
      <ThemedText style={styles.metricValue}>{value}</ThemedText>
      <ThemedText style={styles.metricLabel}>{label}</ThemedText>
    </CardWrapper>
  );
};

export const ChartCard: React.FC<{
  title: string;
  icon?: string;
  children: React.ReactNode;
  onPress?: () => void;
}> = ({ title, icon, children, onPress }) => {
  const CardWrapper = onPress ? TouchableOpacity : View;

  return (
    <CardWrapper style={styles.chartCard} onPress={onPress}>
      <View style={styles.chartHeader}>
        {icon && <Ionicons name={icon as IconName} size={20} color="#6b7280" />}
        <ThemedText style={styles.chartTitle}>{title}</ThemedText>
      </View>
      {children}
    </CardWrapper>
  );
};

export const BreakdownCard: React.FC<{
  title: string;
  icon?: string;
  items: {
    label: string;
    value: string | number;
    percentage?: number;
    color?: string;
  }[];
  onPress?: () => void;
}> = ({ title, icon, items, onPress }) => {
  const CardWrapper = onPress ? TouchableOpacity : View;

  return (
    <CardWrapper style={styles.breakdownCard} onPress={onPress}>
      <View style={styles.breakdownHeader}>
        {icon && <Ionicons name={icon as IconName} size={20} color="#6b7280" />}
        <ThemedText style={styles.breakdownTitle}>{title}</ThemedText>
      </View>

      {items.map((item, index) => (
        <View key={index} style={styles.breakdownItem}>
          <View style={styles.breakdownInfo}>
            <ThemedText style={styles.breakdownLabel}>{item.label}</ThemedText>
            {item.percentage && (
              <ThemedText style={styles.breakdownPercentage}>
                {item.percentage}%
              </ThemedText>
            )}
          </View>
          <ThemedText style={styles.breakdownValue}>{item.value}</ThemedText>
          {item.percentage && (
            <View
              style={[
                styles.breakdownBar,
                { width: `${item.percentage}%` },
                item.color && { backgroundColor: item.color },
              ]}
            />
          )}
        </View>
      ))}
    </CardWrapper>
  );
};

export const ActionButton: React.FC<{
  icon: string;
  label: string;
  onPress: () => void;
  color?: string;
}> = ({ icon, label, onPress, color = "#667eea" }) => {
  return (
    <TouchableOpacity style={styles.actionButton} onPress={onPress}>
      <Ionicons name={icon as IconName} size={16} color={color} />
      <ThemedText style={[styles.actionButtonText, { color }]}>
        {label}
      </ThemedText>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  gradientCard: {
    backgroundColor: "transparent",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 12,
    color: "#6b7280",
    marginLeft: 4,
  },
  cardContent: {
    alignItems: "center",
  },
  cardValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1f2937",
  },
  cardSubtitle: {
    fontSize: 11,
    color: "#6b7280",
    marginTop: 4,
  },
  metricCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
    width: "48%",
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1f2937",
    marginTop: 4,
  },
  metricLabel: {
    fontSize: 11,
    color: "#6b7280",
    marginTop: 2,
  },
  chartCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  chartHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  chartTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#1f2937",
    marginLeft: 4,
  },
  breakdownCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  breakdownHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  breakdownTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#1f2937",
    marginLeft: 4,
  },
  breakdownItem: {
    marginBottom: 12,
  },
  breakdownInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  breakdownLabel: {
    fontSize: 13,
    color: "#6b7280",
  },
  breakdownPercentage: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#1f2937",
  },
  breakdownValue: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: 4,
  },
  breakdownBar: {
    height: 6,
    backgroundColor: "#667eea",
    borderRadius: 3,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "#fff",
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: "500",
  },
});
