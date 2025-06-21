import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useState } from "react";
import {
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { ThemedText } from "./ThemedText";

const { width } = Dimensions.get("window");

interface ChartData {
  label: string;
  value: number;
  color: string;
  gradient: readonly [string, string];
  forecast?: number; // For forecasting
  trend?: "up" | "down" | "stable"; // Trend indicator
}

interface BarChartProps {
  data: ChartData[];
  title: string;
  height?: number;
  showForecast?: boolean;
  showTrend?: boolean;
  onBarPress?: (item: ChartData, index: number) => void;
}

interface LineChartProps {
  data: { date: string; value: number; forecast?: number }[];
  title: string;
  color?: string;
  showForecast?: boolean;
  showTrend?: boolean;
  onPointPress?: (item: any, index: number) => void;
}

interface PieChartProps {
  data: ChartData[];
  title: string;
  showForecast?: boolean;
  onSlicePress?: (item: ChartData, index: number) => void;
}

// Enhanced BarChart with forecasting and interactivity
export const BarChart: React.FC<BarChartProps> = ({
  data,
  title,
  height = 200,
  showForecast = true,
  showTrend = true,
  onBarPress,
}) => {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const maxValue = Math.max(
    ...data.map((item) => Math.max(item.value, item.forecast || 0))
  );
  const barWidth = 36;
  const barSpacing = 16;
  const labelArea = 50; // Increased for trend indicators
  const chartWidth = Math.max(
    width - 40,
    data.length * (barWidth + barSpacing)
  );
  const barAreaHeight = height - labelArea;

  const handleBarPress = (item: ChartData, index: number) => {
    setSelectedIndex(selectedIndex === index ? null : index);
    onBarPress?.(item, index);
  };

  const getTrendIcon = (trend?: string) => {
    switch (trend) {
      case "up":
        return "trending-up";
      case "down":
        return "trending-down";
      case "stable":
        return "remove";
      default:
        return null;
    }
  };

  const getTrendColor = (trend?: string) => {
    switch (trend) {
      case "up":
        return "#10b981";
      case "down":
        return "#ef4444";
      case "stable":
        return "#6b7280";
      default:
        return "#6b7280";
    }
  };

  return (
    <View style={[styles.chartContainer, { height }]}>
      <View style={styles.chartHeader}>
        <ThemedText style={styles.chartTitle}>{title}</ThemedText>
        {showForecast && (
          <View style={styles.forecastLegend}>
            <View style={styles.legendItem}>
              <View
                style={[styles.legendDot, { backgroundColor: "#667eea" }]}
              />
              <ThemedText style={styles.legendText}>Actual</ThemedText>
            </View>
            <View style={styles.legendItem}>
              <View
                style={[
                  styles.legendDot,
                  { backgroundColor: "#f59e0b", opacity: 0.6 },
                ]}
              />
              <ThemedText style={styles.legendText}>Forecast</ThemedText>
            </View>
          </View>
        )}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 8 }}
      >
        <View
          style={[
            styles.barChartContainer,
            {
              width: chartWidth,
              height: barAreaHeight,
              alignItems: "flex-end",
            },
          ]}
        >
          {data.map((item, index) => (
            <Pressable
              key={index}
              style={[
                styles.barItem,
                {
                  width: barWidth,
                  marginHorizontal: barSpacing / 2,
                  height: barAreaHeight,
                  justifyContent: "flex-end",
                  opacity:
                    selectedIndex === null || selectedIndex === index ? 1 : 0.6,
                },
              ]}
              onPress={() => handleBarPress(item, index)}
            >
              {/* Forecast bar (if available) */}
              {showForecast && item.forecast && (
                <View
                  style={[
                    styles.forecastBar,
                    {
                      height: (item.forecast / maxValue) * (barAreaHeight - 8),
                      width: barWidth,
                      backgroundColor: "#f59e0b",
                      opacity: 0.6,
                      position: "absolute",
                      bottom: 0,
                    },
                  ]}
                />
              )}

              {/* Actual bar */}
              <LinearGradient
                colors={item.gradient}
                style={[
                  styles.bar,
                  {
                    height: (item.value / maxValue) * (barAreaHeight - 8),
                    width: barWidth,
                    zIndex: 1,
                  },
                ]}
              />

              {/* Value label */}
              <ThemedText
                style={[
                  styles.barValue,
                  { color: selectedIndex === index ? "#667eea" : "#1f2937" },
                ]}
              >
                {item.value}
              </ThemedText>

              {/* Trend indicator */}
              {showTrend && item.trend && (
                <View style={styles.trendContainer}>
                  <Ionicons
                    name={getTrendIcon(item.trend) as any}
                    size={12}
                    color={getTrendColor(item.trend)}
                  />
                </View>
              )}

              <ThemedText style={styles.barLabel}>{item.label}</ThemedText>
            </Pressable>
          ))}
        </View>
      </ScrollView>

      {/* Selected bar details */}
      {selectedIndex !== null && (
        <View style={styles.selectionDetails}>
          <ThemedText style={styles.selectionTitle}>
            {data[selectedIndex].label}
          </ThemedText>
          <ThemedText style={styles.selectionValue}>
            Actual: {data[selectedIndex].value}
          </ThemedText>
          {data[selectedIndex].forecast && (
            <ThemedText style={styles.selectionForecast}>
              Forecast: {data[selectedIndex].forecast}
            </ThemedText>
          )}
        </View>
      )}
    </View>
  );
};

// Enhanced LineChart with forecasting and trend analysis
export const LineChart: React.FC<LineChartProps> = ({
  data,
  title,
  color = "#667eea",
  showForecast = true,
  showTrend = true,
  onPointPress,
}) => {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const allValues = data.flatMap((item) => [item.value, item.forecast || 0]);
  const maxValue = Math.max(...allValues);
  const minValue = Math.min(...allValues);
  const range = maxValue - minValue;

  // Calculate trend
  const calculateTrend = (values: number[]) => {
    if (values.length < 2) return "stable";
    const recent = values.slice(-3);
    const avg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const first = values[0];
    if (avg > first * 1.1) return "up";
    if (avg < first * 0.9) return "down";
    return "stable";
  };

  const trend = calculateTrend(data.map((item) => item.value));

  const handlePointPress = (item: any, index: number) => {
    setSelectedIndex(selectedIndex === index ? null : index);
    onPointPress?.(item, index);
  };

  return (
    <View style={styles.chartContainer}>
      <View style={styles.chartHeader}>
        <ThemedText style={styles.chartTitle}>{title}</ThemedText>
        {showTrend && (
          <View style={styles.trendIndicator}>
            <Ionicons
              name={
                trend === "up"
                  ? "trending-up"
                  : trend === "down"
                  ? "trending-down"
                  : "remove"
              }
              size={16}
              color={
                trend === "up"
                  ? "#10b981"
                  : trend === "down"
                  ? "#ef4444"
                  : "#6b7280"
              }
            />
            <ThemedText
              style={[
                styles.trendText,
                {
                  color:
                    trend === "up"
                      ? "#10b981"
                      : trend === "down"
                      ? "#ef4444"
                      : "#6b7280",
                },
              ]}
            >
              {trend === "up"
                ? "Trending Up"
                : trend === "down"
                ? "Trending Down"
                : "Stable"}
            </ThemedText>
          </View>
        )}
      </View>

      <View style={styles.lineChartContainer}>
        <View style={styles.lineChart}>
          {/* Forecast line */}
          {showForecast && data.some((item) => item.forecast) && (
            <View style={styles.forecastLine}>
              {data.map((item, index) => {
                if (!item.forecast) return null;
                const y = 150 - ((item.forecast - minValue) / range) * 120;
                const x = (index / (data.length - 1)) * (width - 80);

                return (
                  <View
                    key={`forecast-${index}`}
                    style={[styles.linePoint, { left: x, top: y }]}
                  >
                    <View
                      style={[
                        styles.point,
                        { backgroundColor: "#f59e0b", opacity: 0.6 },
                      ]}
                    />
                    {index < data.length - 1 && data[index + 1].forecast && (
                      <View
                        style={[
                          styles.line,
                          { backgroundColor: "#f59e0b", opacity: 0.4 },
                        ]}
                      />
                    )}
                  </View>
                );
              })}
            </View>
          )}

          {/* Actual line */}
          {data.map((item, index) => {
            const y = 150 - ((item.value - minValue) / range) * 120;
            const x = (index / (data.length - 1)) * (width - 80);

            return (
              <Pressable
                key={index}
                style={[styles.linePoint, { left: x, top: y }]}
                onPress={() => handlePointPress(item, index)}
              >
                <View
                  style={[
                    styles.point,
                    {
                      backgroundColor:
                        selectedIndex === index ? "#667eea" : color,
                      transform: [{ scale: selectedIndex === index ? 1.5 : 1 }],
                    },
                  ]}
                />
                {index < data.length - 1 && (
                  <View style={[styles.line, { backgroundColor: color }]} />
                )}
              </Pressable>
            );
          })}
        </View>

        <View style={styles.lineLabels}>
          {data.map((item, index) => (
            <ThemedText key={index} style={styles.lineLabel}>
              {item.date}
            </ThemedText>
          ))}
        </View>
      </View>

      {/* Selected point details */}
      {selectedIndex !== null && (
        <View style={styles.selectionDetails}>
          <ThemedText style={styles.selectionTitle}>
            {data[selectedIndex].date}
          </ThemedText>
          <ThemedText style={styles.selectionValue}>
            Value: {data[selectedIndex].value}
          </ThemedText>
          {data[selectedIndex].forecast && (
            <ThemedText style={styles.selectionForecast}>
              Forecast: {data[selectedIndex].forecast}
            </ThemedText>
          )}
        </View>
      )}
    </View>
  );
};

// Enhanced PieChart with forecasting
export const PieChart: React.FC<PieChartProps> = ({
  data,
  title,
  showForecast = true,
  onSlicePress,
}) => {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const total = data.reduce((sum, item) => sum + item.value, 0);

  const handleSlicePress = (item: ChartData, index: number) => {
    setSelectedIndex(selectedIndex === index ? null : index);
    onSlicePress?.(item, index);
  };

  return (
    <View style={styles.chartContainer}>
      <ThemedText style={styles.chartTitle}>{title}</ThemedText>
      <View style={styles.pieChartContainer}>
        <View style={styles.pieChart}>
          {data.map((item, index) => {
            const percentage = (item.value / total) * 100;
            const angle = (percentage / 100) * 360;

            return (
              <Pressable
                key={index}
                style={[
                  styles.pieSlice,
                  {
                    opacity:
                      selectedIndex === null || selectedIndex === index
                        ? 1
                        : 0.6,
                  },
                ]}
                onPress={() => handleSlicePress(item, index)}
              >
                <LinearGradient
                  colors={item.gradient}
                  style={[
                    styles.slice,
                    {
                      transform: [{ rotate: `${index * 45}deg` }],
                      opacity: 0.8,
                    },
                  ]}
                />
              </Pressable>
            );
          })}
        </View>
        <View style={styles.pieLegend}>
          {data.map((item, index) => (
            <Pressable
              key={index}
              style={[
                styles.legendItem,
                {
                  opacity:
                    selectedIndex === null || selectedIndex === index ? 1 : 0.6,
                },
              ]}
              onPress={() => handleSlicePress(item, index)}
            >
              <View
                style={[styles.legendColor, { backgroundColor: item.color }]}
              />
              <ThemedText style={styles.legendText}>{item.label}</ThemedText>
              <ThemedText style={styles.legendValue}>{item.value}</ThemedText>
              {showForecast && item.forecast && (
                <ThemedText style={styles.legendForecast}>
                  ({item.forecast})
                </ThemedText>
              )}
            </Pressable>
          ))}
        </View>
      </View>

      {/* Selected slice details */}
      {selectedIndex !== null && (
        <View style={styles.selectionDetails}>
          <ThemedText style={styles.selectionTitle}>
            {data[selectedIndex].label}
          </ThemedText>
          <ThemedText style={styles.selectionValue}>
            Current: {data[selectedIndex].value} (
            {((data[selectedIndex].value / total) * 100).toFixed(1)}%)
          </ThemedText>
          {data[selectedIndex].forecast && (
            <ThemedText style={styles.selectionForecast}>
              Forecast: {data[selectedIndex].forecast}
            </ThemedText>
          )}
        </View>
      )}
    </View>
  );
};

export const StatsGrid: React.FC<{
  stats: {
    title: string;
    value: string;
    icon: string;
    gradient: readonly [string, string];
  }[];
}> = ({ stats }) => {
  return (
    <View style={styles.statsGrid}>
      {stats.map((stat, index) => (
        <View key={index} style={styles.statCard}>
          <LinearGradient colors={stat.gradient} style={styles.statGradient}>
            <Ionicons name={stat.icon as any} size={24} color="#fff" />
            <ThemedText style={styles.statValue}>{stat.value}</ThemedText>
            <ThemedText style={styles.statTitle}>{stat.title}</ThemedText>
          </LinearGradient>
        </View>
      ))}
    </View>
  );
};

export const ProgressChart: React.FC<{
  title: string;
  current: number;
  target: number;
  color?: string;
  gradient?: readonly [string, string];
}> = ({
  title,
  current,
  target,
  color = "#667eea",
  gradient = ["#667eea", "#764ba2"],
}) => {
  const percentage = Math.min((current / target) * 100, 100);

  return (
    <View style={styles.progressContainer}>
      <View style={styles.progressHeader}>
        <ThemedText style={styles.progressTitle}>{title}</ThemedText>
        <ThemedText style={styles.progressValue}>
          {current}/{target}
        </ThemedText>
      </View>
      <View style={styles.progressBar}>
        <LinearGradient
          colors={gradient}
          style={[styles.progressFill, { width: `${percentage}%` }]}
        />
      </View>
      <ThemedText style={styles.progressPercentage}>
        {percentage.toFixed(1)}%
      </ThemedText>
    </View>
  );
};

const styles = StyleSheet.create({
  chartContainer: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: 16,
  },
  barChartContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    height: 120,
  },
  barItem: {
    alignItems: "center",
    flex: 1,
  },
  barContainer: {
    justifyContent: "flex-end",
    height: 80,
    marginBottom: 8,
  },
  bar: {
    width: 20,
    borderRadius: 10,
    minHeight: 4,
  },
  barLabel: {
    fontSize: 12,
    color: "#6b7280",
    fontWeight: "bold",
    textAlign: "center",
  },
  barValue: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#1f2937",
    marginTop: 4,
  },
  lineChartContainer: {
    height: 200,
  },
  lineChart: {
    flex: 1,
    position: "relative",
  },
  linePoint: {
    position: "absolute",
    width: 8,
    height: 8,
  },
  point: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  line: {
    position: "absolute",
    width: 2,
    height: 40,
    top: 4,
    left: 3,
  },
  lineLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  lineLabel: {
    fontSize: 12,
    color: "#6b7280",
  },
  pieChartContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  pieChart: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#f3f4f6",
    position: "relative",
    marginRight: 20,
  },
  pieSlice: {
    position: "absolute",
    width: "100%",
    height: "100%",
  },
  slice: {
    width: "50%",
    height: "50%",
    borderRadius: 60,
  },
  pieLegend: {
    flex: 1,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  legendText: {
    fontSize: 14,
    color: "#374151",
    flex: 1,
  },
  legendValue: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#1f2937",
  },
  statsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    marginHorizontal: 4,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  statGradient: {
    padding: 16,
    alignItems: "center",
  },
  statValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
    marginTop: 8,
    marginBottom: 4,
  },
  statTitle: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.9)",
  },
  progressContainer: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1f2937",
  },
  progressValue: {
    fontSize: 14,
    color: "#6b7280",
  },
  progressBar: {
    height: 8,
    backgroundColor: "#f3f4f6",
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 8,
  },
  progressFill: {
    height: "100%",
    borderRadius: 4,
  },
  progressPercentage: {
    fontSize: 12,
    color: "#6b7280",
    textAlign: "right",
  },
  chartHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  forecastLegend: {
    flexDirection: "row",
    alignItems: "center",
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 4,
  },
  trendIndicator: {
    flexDirection: "row",
    alignItems: "center",
  },
  trendText: {
    fontSize: 12,
    color: "#6b7280",
    marginLeft: 4,
  },
  forecastLine: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  selectionDetails: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginTop: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  selectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: 8,
  },
  selectionValue: {
    fontSize: 14,
    color: "#6b7280",
  },
  selectionForecast: {
    fontSize: 12,
    color: "#6b7280",
  },
  forecastBar: {
    borderRadius: 10,
    minHeight: 4,
  },
  trendContainer: {
    position: "absolute",
    top: -8,
    right: -8,
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  legendForecast: {
    fontSize: 12,
    color: "#f59e0b",
    fontStyle: "italic",
  },
});
