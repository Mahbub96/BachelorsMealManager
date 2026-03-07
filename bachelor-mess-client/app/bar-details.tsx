import {
  ChartCard,
  DetailCard,
} from "@/components/DetailCard";
import { DetailPageTemplate } from "@/components/DetailPageTemplate";
import { ThemedText } from "@/components/ThemedText";
import { useLocalSearchParams, useRouter, useFocusEffect } from "expo-router";
import React, { useState, useCallback } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import dashboardService from "@/services/dashboardService";

type Trend = "up" | "down" | "stable";

interface ExpenseTrendItem {
  date?: string;
  value?: number;
  month?: string;
}

export default function BarDetailsPage() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [selectedTimeframe, setSelectedTimeframe] = useState("month");
  const [historicalData, setHistoricalData] = useState<{ month: string; value: number; target: number }[]>([]);
  const [loading, setLoading] = useState(true);

  const data = {
    label: (params.label as string) || "",
    value: parseInt(params.value as string, 10) || 0,
    forecast: parseInt(params.forecast as string, 10) || 0,
    trend: ((params.trend as string) || "stable") as Trend,
    color: (params.color as string) || "#667eea",
    gradient: [(params.color as string) || "#667eea", "#764ba2"] as const,
    description: (params.description as string) || "Value from dashboard.",
    notes: (params.notes as string) || "",
  };

  const loadHistorical = useCallback(async () => {
    setLoading(true);
    try {
      const res = await dashboardService.getCombinedData({
        timeframe: selectedTimeframe === "week" ? "week" : selectedTimeframe === "year" ? "year" : "month",
      });
      const charts = res.data?.charts as { monthlyRevenue?: ExpenseTrendItem[] } | undefined;
      const trend = (res.data?.analytics as { expenseTrend?: ExpenseTrendItem[] } | undefined)?.expenseTrend;
      const raw = trend && trend.length > 0 ? trend : charts?.monthlyRevenue;
      if (Array.isArray(raw) && raw.length > 0) {
        const maxVal = Math.max(...raw.map((x) => Number(x?.value ?? 0)), 1);
        setHistoricalData(
          raw.slice(-6).map((item) => ({
            month: String(item?.date ?? item?.month ?? "").slice(0, 3) || "—",
            value: Number(item?.value) || 0,
            target: Math.round(maxVal * 1.05),
          }))
        );
      } else {
        setHistoricalData([]);
      }
    } catch {
      setHistoricalData([]);
    } finally {
      setLoading(false);
    }
  }, [selectedTimeframe]);

  useFocusEffect(
    useCallback(() => {
      loadHistorical();
    }, [loadHistorical])
  );

  const formatValue = (value: number) => `৳${value.toLocaleString()}`;

  const timeframes = [
    { key: "week", label: "Week" },
    { key: "month", label: "Month" },
    { key: "year", label: "Year" },
  ];

  const actionButtons = [
    { icon: "arrow-back", label: "Back", onPress: () => router.back(), color: "#667eea" },
  ];

  if (!data.label) {
    return (
      <DetailPageTemplate title="Chart detail" gradientColors={data.gradient} actionButtons={actionButtons}>
        <ThemedText style={styles.emptyText}>No chart data. Open from dashboard.</ThemedText>
      </DetailPageTemplate>
    );
  }

  return (
    <DetailPageTemplate
      title={data.label}
      gradientColors={data.gradient}
      actionButtons={actionButtons}
    >
      <DetailCard
        title="Current value"
        value={formatValue(data.value)}
        subtitle={data.forecast > 0 ? `Forecast: ${formatValue(data.forecast)}` : undefined}
        icon="analytics"
        iconColor={data.color}
      />

      <View style={styles.timeframeSelector}>
        {timeframes.map((tf) => (
          <TouchableOpacity
            key={tf.key}
            style={[styles.timeframeButton, selectedTimeframe === tf.key && styles.timeframeButtonActive]}
            onPress={() => setSelectedTimeframe(tf.key)}
          >
            <ThemedText style={[styles.timeframeButtonText, selectedTimeframe === tf.key && styles.timeframeButtonTextActive]}>
              {tf.label}
            </ThemedText>
          </TouchableOpacity>
        ))}
      </View>

      <ChartCard title="Trend (from API)" icon="bar-chart">
        {loading ? (
          <ThemedText style={styles.emptyText}>Loading…</ThemedText>
        ) : historicalData.length === 0 ? (
          <ThemedText style={styles.emptyText}>No trend data for this period.</ThemedText>
        ) : (
          <View style={styles.chartContainer}>
            {historicalData.map((item, index) => (
              <View key={index} style={styles.chartBar}>
                <View style={styles.barContainer}>
                  <View style={[styles.bar, { height: Math.max(4, (item.value / (item.target || 1)) * 80) }]} />
                  <View style={[styles.targetBar, { height: Math.max(2, (item.target / (item.target || 1)) * 80 * 0.9) }]} />
                </View>
                <ThemedText style={styles.barLabel}>{item.month}</ThemedText>
                <ThemedText style={styles.barValue}>{formatValue(item.value)}</ThemedText>
              </View>
            ))}
          </View>
        )}
      </ChartCard>

      {data.description ? (
        <DetailCard title="Description" value={data.description} icon="document-text" iconColor="#6b7280" />
      ) : null}
      {data.notes ? (
        <DetailCard title="Notes" value={data.notes} icon="chatbubble" iconColor="#6b7280" />
      ) : null}
    </DetailPageTemplate>
  );
}

const styles = StyleSheet.create({
  emptyText: { fontSize: 14, color: "#6b7280", textAlign: "center", paddingVertical: 16 },
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
  timeframeButton: { flex: 1, paddingVertical: 8, alignItems: "center", borderRadius: 8 },
  timeframeButtonActive: { backgroundColor: "#667eea" },
  timeframeButtonText: { fontSize: 12, color: "#6b7280", fontWeight: "500" },
  timeframeButtonTextActive: { color: "#fff", fontWeight: "bold" },
  chartContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    height: 120,
  },
  chartBar: { alignItems: "center", flex: 1 },
  barContainer: { height: 80, justifyContent: "flex-end", marginBottom: 8 },
  bar: { backgroundColor: "#667eea", borderRadius: 4, minHeight: 4, width: "80%" },
  targetBar: { backgroundColor: "#f59e0b", borderRadius: 4, minHeight: 2, opacity: 0.6, marginTop: 2, width: "80%" },
  barLabel: { fontSize: 10, color: "#6b7280" },
  barValue: { fontSize: 10, color: "#1f2937", fontWeight: "bold" },
});
