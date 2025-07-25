import {
  BreakdownCard,
  ChartCard,
  DetailCard,
  MetricCard,
} from "@/components/DetailCard";
import { DetailPageTemplate } from "@/components/DetailPageTemplate";
import { ThemedText } from "@/components/ThemedText";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import { Dimensions, StyleSheet, TouchableOpacity, View } from "react-native";

const { width: screenWidth } = Dimensions.get("window");



export default function BarDetailsPage() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [selectedTimeframe, setSelectedTimeframe] = useState("month");

  // Parse the data from params (in real app, you'd fetch this from API)
  const data = {
    label: (params.label as string) || "Sample Bar",
    value: parseInt(params.value as string) || 0,
    forecast: parseInt(params.forecast as string) || 0,
    trend: (params.trend as string) || "up",
    color: (params.color as string) || "#667eea",
    gradient: [(params.color as string) || "#667eea", "#764ba2"] as const,
    details: {
      description:
        (params.description as string) ||
        "This represents the current value for this category.",
      breakdown: [
        { label: "Direct Sales", value: 12000, percentage: 50 },
        { label: "Online Sales", value: 8000, percentage: 33 },
        { label: "Partnerships", value: 4000, percentage: 17 },
      ],
      notes:
        (params.notes as string) ||
        "This data is updated daily and reflects current market conditions.",
    },
  };

  // Mock historical data
  const historicalData = [
    { month: "Jan", value: 18000, target: 20000 },
    { month: "Feb", value: 22000, target: 20000 },
    { month: "Mar", value: 19000, target: 20000 },
    { month: "Apr", value: 24000, target: 20000 },
    { month: "May", value: 21000, target: 20000 },
    { month: "Jun", value: 26000, target: 20000 },
  ];

  // Mock performance metrics
  const performanceMetrics = {
    growthRate: 15.2,
    marketShare: 23.5,
    customerSatisfaction: 4.6,
    efficiency: 87.3,
    roi: 156.8,
    conversionRate: 12.4,
  };

  // Mock comparison data
  const comparisonData = {
    previousPeriod: 21000,
    yearOverYear: 18.5,
    industryAverage: 19500,
    competitors: [
      { name: "Competitor A", value: 22000 },
      { name: "Competitor B", value: 18000 },
      { name: "Competitor C", value: 25000 },
    ],
  };

  const formatValue = (value: number) => {
    return `৳${value.toLocaleString()}`;
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

  const timeframes = [
    { key: "week", label: "Week" },
    { key: "month", label: "Month" },
    { key: "quarter", label: "Quarter" },
    { key: "year", label: "Year" },
  ];

  const handleCardPress = (type: string, data: any) => {
    switch (type) {
      case "performance":
        router.push({
          pathname: "/bar-details" as any,
          params: { type: "performance", data: JSON.stringify(data) },
        });
        break;
      case "competitor":
        router.push({
          pathname: "/bar-details" as any,
          params: { competitor: data.name, value: data.value.toString() },
        });
        break;
      case "market":
        router.push({
          pathname: "/bar-details" as any,
          params: {
            industryGrowth: comparisonData.yearOverYear.toString(),
            marketSize: comparisonData.industryAverage.toString(),
          },
        });
        break;
      case "forecast":
        router.push({
          pathname: "/bar-details" as any,
          params: {
            current: data.value.toString(),
            forecast: data.forecast.toString(),
            trend: data.trend,
          },
        });
        break;
    }
  };

  const actionButtons = [
    {
      icon: "download",
      label: "Export Data",
      onPress: () => console.log("Export Data"),
      color: "#667eea",
    },
    {
      icon: "create",
      label: "Edit",
      onPress: () => console.log("Edit"),
      color: "#667eea",
    },
    {
      icon: "share",
      label: "Share",
      onPress: () => console.log("Share"),
      color: "#667eea",
    },
  ];

  return (
    <DetailPageTemplate
      title={data.label}
      gradientColors={data.gradient as [string, string]}
      actionButtons={actionButtons}
    >
      {/* Quick Stats Row */}
      <View style={styles.quickStatsRow}>
        <MetricCard
          icon="trending-up"
          value={`${performanceMetrics.growthRate}%`}
          label="Growth"
          color={getTrendColor(data.trend)}
          onPress={() =>
            handleCardPress("performance", {
              type: "growth",
              value: performanceMetrics.growthRate,
            })
          }
        />
        <MetricCard
          icon="pie-chart"
          value={`${performanceMetrics.marketShare}%`}
          label="Market Share"
          color="#667eea"
          onPress={() =>
            handleCardPress("performance", {
              type: "marketShare",
              value: performanceMetrics.marketShare,
            })
          }
        />
        <MetricCard
          icon="star"
          value={performanceMetrics.customerSatisfaction}
          label="Satisfaction"
          color="#f59e0b"
          onPress={() =>
            handleCardPress("performance", {
              type: "satisfaction",
              value: performanceMetrics.customerSatisfaction,
            })
          }
        />
      </View>

      {/* Main Value Card */}
      <DetailCard
        title="Current Value"
        value={formatValue(data.value)}
        subtitle={`vs ${formatValue(
          comparisonData.previousPeriod
        )} last period`}
        icon="analytics"
        iconColor="#667eea"
        onPress={() =>
          handleCardPress("performance", { type: "value", value: data.value })
        }
      >
        <View style={styles.valueComparison}>
          <ThemedText style={styles.comparisonText}>
            vs {formatValue(comparisonData.previousPeriod)} last period
          </ThemedText>
          <ThemedText
            style={[
              styles.comparisonChange,
              { color: getTrendColor(data.trend) },
            ]}
          >
            {data.trend === "up" ? "+" : ""}
            {comparisonData.yearOverYear}%
          </ThemedText>
        </View>
      </DetailCard>

      {/* Timeframe Selector */}
      <View style={styles.timeframeSelector}>
        {timeframes.map((timeframe) => (
          <TouchableOpacity
            key={timeframe.key}
            style={[
              styles.timeframeButton,
              selectedTimeframe === timeframe.key &&
                styles.timeframeButtonActive,
            ]}
            onPress={() => setSelectedTimeframe(timeframe.key)}
          >
            <ThemedText
              style={[
                styles.timeframeButtonText,
                selectedTimeframe === timeframe.key &&
                  styles.timeframeButtonTextActive,
              ]}
            >
              {timeframe.label}
            </ThemedText>
          </TouchableOpacity>
        ))}
      </View>

      {/* Historical Performance Chart */}
      <ChartCard
        title="Historical Performance"
        icon="bar-chart"
        onPress={() =>
          handleCardPress("performance", {
            type: "historical",
            data: historicalData,
          })
        }
      >
        <View style={styles.chartContainer}>
          {historicalData.map((item, index) => (
            <View key={index} style={styles.chartBar}>
              <View style={styles.barContainer}>
                <View
                  style={[styles.bar, { height: (item.value / 30000) * 100 }]}
                />
                <View
                  style={[
                    styles.targetBar,
                    { height: (item.target / 30000) * 100 },
                  ]}
                />
              </View>
              <ThemedText style={styles.barLabel}>{item.month}</ThemedText>
              <ThemedText style={styles.barValue}>
                {formatValue(item.value)}
              </ThemedText>
            </View>
          ))}
        </View>
      </ChartCard>

      {/* Performance Metrics Grid */}
      <View style={styles.metricsGrid}>
        <MetricCard
          icon="speedometer"
          value={`${performanceMetrics.efficiency}%`}
          label="Efficiency"
          color="#10b981"
          onPress={() =>
            handleCardPress("performance", {
              type: "efficiency",
              value: performanceMetrics.efficiency,
            })
          }
        />
        <MetricCard
          icon="trending-up"
          value={`${performanceMetrics.roi}%`}
          label="ROI"
          color="#f59e0b"
          onPress={() =>
            handleCardPress("performance", {
              type: "roi",
              value: performanceMetrics.roi,
            })
          }
        />
        <MetricCard
          icon="people"
          value={`${performanceMetrics.conversionRate}%`}
          label="Conversion"
          color="#667eea"
          onPress={() =>
            handleCardPress("performance", {
              type: "conversion",
              value: performanceMetrics.conversionRate,
            })
          }
        />
        <MetricCard
          icon="time"
          value="2.3s"
          label="Avg Time"
          color="#ef4444"
          onPress={() =>
            handleCardPress("performance", { type: "avgTime", value: "2.3s" })
          }
        />
      </View>

      {/* Competitor Analysis */}
      <BreakdownCard
        title="Competitor Analysis"
        icon="people-circle"
        items={comparisonData.competitors.map((comp) => ({
          label: comp.name,
          value: formatValue(comp.value),
          percentage: Math.round((comp.value / 30000) * 100),
          color: "#e5e7eb",
        }))}
        onPress={() =>
          handleCardPress("competitor", comparisonData.competitors)
        }
      />

      {/* Detailed Breakdown */}
      <BreakdownCard
        title="Detailed Breakdown"
        icon="list"
        items={data.details.breakdown.map((item) => ({
          label: item.label,
          value: formatValue(item.value),
          percentage: item.percentage,
        }))}
        onPress={() =>
          handleCardPress("performance", {
            type: "breakdown",
            data: data.details.breakdown,
          })
        }
      />

      {/* Forecast Information */}
      <DetailCard
        title="Forecast & Predictions"
        value={formatValue(data.forecast)}
        subtitle="Predicted for next period based on current trends"
        icon="time"
        iconColor="#f59e0b"
        onPress={() =>
          handleCardPress("forecast", {
            current: data.value,
            forecast: data.forecast,
            trend: data.trend,
          })
        }
      >
        <View style={styles.forecastFactors}>
          <ThemedText style={styles.factorTitle}>Key Factors:</ThemedText>
          <ThemedText style={styles.factorItem}>
            • Market growth rate: +12%
          </ThemedText>
          <ThemedText style={styles.factorItem}>
            • Seasonal adjustments: +5%
          </ThemedText>
          <ThemedText style={styles.factorItem}>
            • New product launch: +8%
          </ThemedText>
        </View>
      </DetailCard>

      {/* Market Analysis */}
      <DetailCard
        title="Market Analysis"
        value={`৳${comparisonData.industryAverage.toLocaleString()}`}
        subtitle="Industry Average"
        icon="globe"
        iconColor="#6b7280"
        onPress={() =>
          handleCardPress("market", {
            industryAverage: comparisonData.industryAverage,
            yearOverYear: comparisonData.yearOverYear,
          })
        }
      >
        <View style={styles.marketStats}>
          <View style={styles.marketStat}>
            <ThemedText style={styles.marketStatValue}>
              ৳{comparisonData.industryAverage.toLocaleString()}
            </ThemedText>
            <ThemedText style={styles.marketStatLabel}>
              Industry Average
            </ThemedText>
          </View>
          <View style={styles.marketStat}>
            <ThemedText style={styles.marketStatValue}>
              +{comparisonData.yearOverYear}%
            </ThemedText>
            <ThemedText style={styles.marketStatLabel}>YoY Growth</ThemedText>
          </View>
        </View>
      </DetailCard>

      {/* Description */}
      <DetailCard
        title="Description"
        value={data.details.description}
        icon="document-text"
        iconColor="#6b7280"
      />

      {/* Notes */}
      <DetailCard
        title="Notes"
        value={data.details.notes}
        icon="chatbubble"
        iconColor="#6b7280"
      />
    </DetailPageTemplate>
  );
}

const styles = StyleSheet.create({
  quickStatsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  valueComparison: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
  },
  comparisonText: {
    fontSize: 12,
    color: "#6b7280",
  },
  comparisonChange: {
    fontSize: 14,
    fontWeight: "bold",
  },
  timeframeSelector: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  timeframeButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    borderRadius: 8,
  },
  timeframeButtonActive: {
    backgroundColor: "#667eea",
  },
  timeframeButtonText: {
    fontSize: 12,
    color: "#6b7280",
    fontWeight: "500",
  },
  timeframeButtonTextActive: {
    color: "#fff",
    fontWeight: "bold",
  },
  chartContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    height: 120,
  },
  chartBar: {
    alignItems: "center",
    flex: 1,
  },
  barContainer: {
    height: 80,
    justifyContent: "flex-end",
    marginBottom: 8,
  },
  bar: {
    backgroundColor: "#667eea",
    borderRadius: 4,
    minHeight: 4,
  },
  targetBar: {
    backgroundColor: "#f59e0b",
    borderRadius: 4,
    minHeight: 2,
    opacity: 0.6,
    marginTop: 2,
  },
  barLabel: {
    fontSize: 10,
    color: "#6b7280",
  },
  barValue: {
    fontSize: 10,
    color: "#1f2937",
    fontWeight: "bold",
  },
  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  forecastFactors: {
    backgroundColor: "#f9fafb",
    borderRadius: 8,
    padding: 8,
  },
  factorTitle: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: 4,
  },
  factorItem: {
    fontSize: 11,
    color: "#6b7280",
    marginBottom: 2,
  },
  marketStats: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  marketStat: {
    alignItems: "center",
  },
  marketStatValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1f2937",
  },
  marketStatLabel: {
    fontSize: 11,
    color: "#6b7280",
    marginTop: 2,
  },
});
