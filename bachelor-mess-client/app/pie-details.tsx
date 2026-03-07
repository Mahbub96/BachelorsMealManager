import { ThemedText } from "@/components/ThemedText";
import { ScreenLayout } from "@/components/layout";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter, useFocusEffect } from "expo-router";
import React, { useState, useCallback } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import dashboardService from "@/services/dashboardService";

interface CategoryItem {
  label?: string;
  value?: number;
  color?: string;
}

const formatValue = (value: number) => `৳${value.toLocaleString()}`;

export default function PieDetailsPage() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [relatedCategories, setRelatedCategories] = useState<{ name: string; value: number; percentage: number; color: string }[]>([]);
  const [loading, setLoading] = useState(true);

  const value = parseInt(params.value as string, 10) || 0;
  const pctParam = parseFloat(params.percentage as string);
  const totalParam = parseInt(params.total as string, 10) || 0;
  const total = totalParam > 0 ? totalParam : pctParam > 0 && value > 0 ? Math.round(value / (pctParam / 100)) : value;

  const data = {
    label: (params.label as string) || "",
    value,
    total,
    color: (params.color as string) || "#f093fb",
    description: (params.description as string) || "",
    notes: (params.notes as string) || "",
  };

  const totalForPct = data.total > 0 ? data.total : data.value || 1;
  const percentage = totalForPct > 0 ? (data.value / totalForPct) * 100 : 0;

  const loadRelated = useCallback(async () => {
    setLoading(true);
    try {
      const res = await dashboardService.getCombinedData({ timeframe: "month" });
      const charts = res.data?.charts as { expenseBreakdown?: CategoryItem[] } | undefined;
      const analytics = res.data?.analytics as { categoryBreakdown?: CategoryItem[] } | undefined;
      const raw = analytics?.categoryBreakdown ?? charts?.expenseBreakdown;
      if (Array.isArray(raw) && raw.length > 0) {
        const sum = raw.reduce((s, x) => s + (Number(x?.value) || 0), 0);
        setRelatedCategories(
          raw.map((item, i) => {
            const val = Number(item?.value) || 0;
            const pct = sum > 0 ? (val / sum) * 100 : 0;
            const colors = ["#667eea", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];
            return {
              name: String(item?.label ?? `Item ${i + 1}`),
              value: val,
              percentage: Math.round(pct * 10) / 10,
              color: (item?.color as string) || colors[i % colors.length],
            };
          })
        );
      } else {
        setRelatedCategories([]);
      }
    } catch {
      setRelatedCategories([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadRelated();
    }, [loadRelated])
  );

  if (!data.label) {
    return (
      <ScreenLayout title="Category" showBack onBackPress={() => router.back()}>
        <View style={styles.content}>
          <ThemedText style={styles.emptyText}>No category data. Open from dashboard chart.</ThemedText>
        </View>
      </ScreenLayout>
    );
  }

  return (
    <ScreenLayout title={data.label} showBack onBackPress={() => router.back()}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.categoryOverview}>
          <View style={styles.categoryHeader}>
            <View style={[styles.categoryColorIndicator, { backgroundColor: data.color }]} />
            <View style={styles.categoryContent}>
              <ThemedText style={styles.categoryTitle}>{data.label}</ThemedText>
              <ThemedText style={styles.categoryPercentage}>{percentage.toFixed(1)}%</ThemedText>
            </View>
          </View>
          <View style={styles.categoryStats}>
            <View style={styles.categoryStat}>
              <ThemedText style={styles.categoryStatValue}>{formatValue(data.value)}</ThemedText>
              <ThemedText style={styles.categoryStatLabel}>Current value</ThemedText>
            </View>
            {data.total > 0 && (
              <View style={styles.categoryStat}>
                <ThemedText style={styles.categoryStatValue}>{formatValue(data.total)}</ThemedText>
                <ThemedText style={styles.categoryStatLabel}>Total</ThemedText>
              </View>
            )}
          </View>
        </View>

        {relatedCategories.length > 0 && (
          <View style={styles.relatedCard}>
            <View style={styles.relatedHeader}>
              <Ionicons name="layers" size={20} color="#6b7280" />
              <ThemedText style={styles.relatedTitle}>Related (from API)</ThemedText>
            </View>
            {relatedCategories.map((category, index) => (
              <View key={index} style={styles.relatedItem}>
                <View style={styles.relatedInfo}>
                  <View style={[styles.relatedColorIndicator, { backgroundColor: category.color }]} />
                  <View style={styles.relatedDetails}>
                    <ThemedText style={styles.relatedName}>{category.name}</ThemedText>
                    <ThemedText style={styles.relatedValue}>{formatValue(category.value)}</ThemedText>
                  </View>
                  <ThemedText style={styles.relatedPercentage}>{category.percentage}%</ThemedText>
                </View>
                <View style={[styles.relatedBar, { width: `${Math.min(100, category.percentage)}%` }]} />
              </View>
            ))}
          </View>
        )}

        {loading && relatedCategories.length === 0 && (
          <ThemedText style={styles.emptyText}>Loading…</ThemedText>
        )}

        {data.description ? (
          <View style={styles.infoCard}>
            <View style={styles.infoCardHeader}>
              <Ionicons name="document-text" size={20} color="#6b7280" />
              <ThemedText style={styles.infoCardLabel}>Description</ThemedText>
            </View>
            <ThemedText style={styles.infoCardText}>{data.description}</ThemedText>
          </View>
        ) : null}

        {data.notes ? (
          <View style={styles.infoCard}>
            <View style={styles.infoCardHeader}>
              <Ionicons name="chatbubble" size={20} color="#6b7280" />
              <ThemedText style={styles.infoCardLabel}>Notes</ThemedText>
            </View>
            <ThemedText style={styles.infoCardText}>{data.notes}</ThemedText>
          </View>
        ) : null}
      </ScrollView>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1, padding: 16 },
  emptyText: { fontSize: 14, color: "#6b7280", textAlign: "center", paddingVertical: 16 },
  categoryOverview: {
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
  categoryHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 },
  categoryColorIndicator: { width: 20, height: 20, borderRadius: 10 },
  categoryContent: { flex: 1 },
  categoryTitle: { fontSize: 16, fontWeight: "bold", color: "#1f2937" },
  categoryPercentage: { fontSize: 12, color: "#6b7280", marginTop: 4 },
  categoryStats: { flexDirection: "row", justifyContent: "space-around" },
  categoryStat: { alignItems: "center" },
  categoryStatValue: { fontSize: 16, fontWeight: "bold", color: "#1f2937" },
  categoryStatLabel: { fontSize: 11, color: "#6b7280", marginTop: 2 },
  relatedCard: {
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
  relatedHeader: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  relatedTitle: { fontSize: 14, fontWeight: "bold", color: "#1f2937", marginLeft: 4 },
  relatedItem: { marginBottom: 12 },
  relatedInfo: { flexDirection: "row", alignItems: "center", marginBottom: 4 },
  relatedColorIndicator: { width: 12, height: 12, borderRadius: 6, marginRight: 8 },
  relatedDetails: { flex: 1 },
  relatedName: { fontSize: 13, color: "#6b7280" },
  relatedValue: { fontSize: 12, fontWeight: "bold", color: "#1f2937" },
  relatedPercentage: { fontSize: 12, fontWeight: "bold", color: "#1f2937" },
  relatedBar: { height: 4, backgroundColor: "#e5e7eb", borderRadius: 2 },
  infoCard: {
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
  infoCardHeader: { flexDirection: "row", alignItems: "center", marginBottom: 4 },
  infoCardLabel: { fontSize: 12, color: "#6b7280", marginLeft: 4 },
  infoCardText: { fontSize: 13, color: "#4b5563", lineHeight: 20 },
});
