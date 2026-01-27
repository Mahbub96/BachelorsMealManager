import { ThemedText } from "@/components/ThemedText";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

export default function PieDetailsPage() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [selectedPeriod, setSelectedPeriod] = useState("current");

  // Parse the data from params
  const data = {
    label: (params.label as string) || "Sample Category",
    value: parseInt(params.value as string) || 0,
    forecast: parseInt(params.forecast as string) || 0,
    color: (params.color as string) || "#f093fb",
    gradient: [(params.color as string) || "#f093fb", "#f5576c"] as const,
    total: parseInt(params.total as string) || 24000,
    details: {
      description:
        (params.description as string) ||
        "This category represents a portion of the total revenue.",
      notes:
        (params.notes as string) ||
        "This data is updated daily and reflects current market conditions.",
    },
  };

  const percentage = data.total > 0 ? (data.value / data.total) * 100 : 0;

  // Mock category performance data
  const categoryPerformance = {
    growthRate: 12.5,
    marketShare: 18.3,
    customerCount: 1250,
    avgOrderValue: 320,
    retentionRate: 85.7,
    satisfactionScore: 4.8,
  };

  // Mock historical data for this category
  const historicalData = [
    { month: "Jan", value: 18000, percentage: 15.2 },
    { month: "Feb", value: 19500, percentage: 16.1 },
    { month: "Mar", value: 21000, percentage: 17.3 },
    { month: "Apr", value: 22500, percentage: 18.1 },
    { month: "May", value: 24000, percentage: 19.2 },
    { month: "Jun", value: 26000, percentage: 20.8 },
  ];

  // Mock related categories
  const relatedCategories = [
    { name: "Category A", value: 28000, percentage: 22.4, color: "#667eea" },
    { name: "Category B", value: 22000, percentage: 17.6, color: "#10b981" },
    { name: "Category C", value: 18000, percentage: 14.4, color: "#f59e0b" },
    { name: "Category D", value: 15000, percentage: 12.0, color: "#ef4444" },
  ];

  // Mock market insights
  const marketInsights = {
    industryGrowth: 8.5,
    competitorShare: 22.1,
    marketSize: 1250000,
    growthPotential: 25.3,
  };

  const periods = [
    { key: "current", label: "Current" },
    { key: "previous", label: "Previous" },
    { key: "forecast", label: "Forecast" },
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={data.gradient} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <ThemedText style={styles.headerTitle}>{data.label}</ThemedText>
          <TouchableOpacity style={styles.shareButton}>
            <Ionicons name="share-outline" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Category Overview */}
        <View style={styles.categoryOverview}>
          <View style={styles.categoryHeader}>
            <View
              style={[
                styles.categoryColorIndicator,
                { backgroundColor: data.color },
              ]}
            />
            <View style={styles.categoryContent}>
              <ThemedText style={styles.categoryTitle}>{data.label}</ThemedText>
              <ThemedText style={styles.categoryPercentage}>
                {percentage.toFixed(1)}%
              </ThemedText>
            </View>
          </View>
          <View style={styles.categoryStats}>
            <View style={styles.categoryStat}>
              <ThemedText style={styles.categoryStatValue}>
                {formatValue(data.value)}
              </ThemedText>
              <ThemedText style={styles.categoryStatLabel}>
                Current Value
              </ThemedText>
            </View>
            <View style={styles.categoryStat}>
              <ThemedText style={styles.categoryStatValue}>
                {formatValue(data.total)}
              </ThemedText>
              <ThemedText style={styles.categoryStatLabel}>
                Total Revenue
              </ThemedText>
            </View>
          </View>
        </View>

        {/* Period Selector */}
        <View style={styles.periodSelector}>
          {periods.map((period) => (
            <TouchableOpacity
              key={period.key}
              style={[
                styles.periodButton,
                selectedPeriod === period.key && styles.periodButtonActive,
              ]}
              onPress={() => setSelectedPeriod(period.key)}
            >
              <ThemedText
                style={[
                  styles.periodButtonText,
                  selectedPeriod === period.key &&
                    styles.periodButtonTextActive,
                ]}
              >
                {period.label}
              </ThemedText>
            </TouchableOpacity>
          ))}
        </View>

        {/* Performance Metrics Grid */}
        <View style={styles.metricsGrid}>
          <View style={styles.metricCard}>
            <Ionicons name="trending-up" size={20} color="#10b981" />
            <ThemedText style={styles.metricValue}>
              {categoryPerformance.growthRate}%
            </ThemedText>
            <ThemedText style={styles.metricLabel}>Growth Rate</ThemedText>
          </View>
          <View style={styles.metricCard}>
            <Ionicons name="pie-chart" size={20} color="#667eea" />
            <ThemedText style={styles.metricValue}>
              {categoryPerformance.marketShare}%
            </ThemedText>
            <ThemedText style={styles.metricLabel}>Market Share</ThemedText>
          </View>
          <View style={styles.metricCard}>
            <Ionicons name="people" size={20} color="#f59e0b" />
            <ThemedText style={styles.metricValue}>
              {categoryPerformance.customerCount}
            </ThemedText>
            <ThemedText style={styles.metricLabel}>Customers</ThemedText>
          </View>
          <View style={styles.metricCard}>
            <Ionicons name="cash" size={20} color="#ef4444" />
            <ThemedText style={styles.metricValue}>
              ৳{categoryPerformance.avgOrderValue}
            </ThemedText>
            <ThemedText style={styles.metricLabel}>Avg Order</ThemedText>
          </View>
          <View style={styles.metricCard}>
            <Ionicons name="refresh" size={20} color="#8b5cf6" />
            <ThemedText style={styles.metricValue}>
              {categoryPerformance.retentionRate}%
            </ThemedText>
            <ThemedText style={styles.metricLabel}>Retention</ThemedText>
          </View>
          <View style={styles.metricCard}>
            <Ionicons name="star" size={20} color="#f59e0b" />
            <ThemedText style={styles.metricValue}>
              {categoryPerformance.satisfactionScore}
            </ThemedText>
            <ThemedText style={styles.metricLabel}>Satisfaction</ThemedText>
          </View>
        </View>

        {/* Historical Trend Chart */}
        <View style={styles.chartCard}>
          <View style={styles.chartHeader}>
            <Ionicons name="analytics" size={20} color="#6b7280" />
            <ThemedText style={styles.chartTitle}>
              Historical Performance
            </ThemedText>
          </View>
          <View style={styles.chartContainer}>
            {historicalData.map((item, index) => (
              <View key={index} style={styles.chartBar}>
                <View style={styles.barContainer}>
                  <View
                    style={[
                      styles.bar,
                      { height: (item.percentage / 25) * 100 },
                    ]}
                  />
                </View>
                <ThemedText style={styles.barLabel}>{item.month}</ThemedText>
                <ThemedText style={styles.barValue}>
                  {item.percentage}%
                </ThemedText>
              </View>
            ))}
          </View>
        </View>

        {/* Related Categories */}
        <View style={styles.relatedCard}>
          <View style={styles.relatedHeader}>
            <Ionicons name="layers" size={20} color="#6b7280" />
            <ThemedText style={styles.relatedTitle}>
              Related Categories
            </ThemedText>
          </View>
          {relatedCategories.map((category, index) => (
            <View key={index} style={styles.relatedItem}>
              <View style={styles.relatedInfo}>
                <View
                  style={[
                    styles.relatedColorIndicator,
                    { backgroundColor: category.color },
                  ]}
                />
                <View style={styles.relatedDetails}>
                  <ThemedText style={styles.relatedName}>
                    {category.name}
                  </ThemedText>
                  <ThemedText style={styles.relatedValue}>
                    {formatValue(category.value)}
                  </ThemedText>
                </View>
                <ThemedText style={styles.relatedPercentage}>
                  {category.percentage}%
                </ThemedText>
              </View>
              <View
                style={[
                  styles.relatedBar,
                  { width: `${category.percentage}%` },
                ]}
              />
            </View>
          ))}
        </View>

        {/* Market Analysis */}
        <View style={styles.marketCard}>
          <View style={styles.marketHeader}>
            <Ionicons name="globe" size={20} color="#6b7280" />
            <ThemedText style={styles.marketTitle}>Market Analysis</ThemedText>
          </View>
          <View style={styles.marketStats}>
            <View style={styles.marketStat}>
              <ThemedText style={styles.marketStatValue}>
                {marketInsights.industryGrowth}%
              </ThemedText>
              <ThemedText style={styles.marketStatLabel}>
                Industry Growth
              </ThemedText>
            </View>
            <View style={styles.marketStat}>
              <ThemedText style={styles.marketStatValue}>
                {marketInsights.competitorShare}%
              </ThemedText>
              <ThemedText style={styles.marketStatLabel}>
                Competitor Share
              </ThemedText>
            </View>
            <View style={styles.marketStat}>
              <ThemedText style={styles.marketStatValue}>
                ৳{(marketInsights.marketSize / 1000000).toFixed(1)}M
              </ThemedText>
              <ThemedText style={styles.marketStatLabel}>
                Market Size
              </ThemedText>
            </View>
            <View style={styles.marketStat}>
              <ThemedText style={styles.marketStatValue}>
                {marketInsights.growthPotential}%
              </ThemedText>
              <ThemedText style={styles.marketStatLabel}>
                Growth Potential
              </ThemedText>
            </View>
          </View>
        </View>

        {/* Category Breakdown */}
        <View style={styles.breakdownCard}>
          <View style={styles.breakdownCardHeader}>
            <Ionicons name="list" size={20} color="#6b7280" />
            <ThemedText style={styles.breakdownCardLabel}>
              Category Breakdown
            </ThemedText>
          </View>
          <View style={styles.breakdownItems}>
            <View style={styles.breakdownItem}>
              <View style={styles.breakdownInfo}>
                <ThemedText style={styles.breakdownLabel}>
                  Direct Sales
                </ThemedText>
                <ThemedText style={styles.breakdownPercentage}>45%</ThemedText>
              </View>
              <ThemedText style={styles.breakdownValue}>
                ৳{Math.round(data.value * 0.45).toLocaleString()}
              </ThemedText>
              <View style={[styles.breakdownBar, { width: "45%" }]} />
            </View>
            <View style={styles.breakdownItem}>
              <View style={styles.breakdownInfo}>
                <ThemedText style={styles.breakdownLabel}>
                  Online Sales
                </ThemedText>
                <ThemedText style={styles.breakdownPercentage}>35%</ThemedText>
              </View>
              <ThemedText style={styles.breakdownValue}>
                ৳{Math.round(data.value * 0.35).toLocaleString()}
              </ThemedText>
              <View style={[styles.breakdownBar, { width: "35%" }]} />
            </View>
            <View style={styles.breakdownItem}>
              <View style={styles.breakdownInfo}>
                <ThemedText style={styles.breakdownLabel}>
                  Partnerships
                </ThemedText>
                <ThemedText style={styles.breakdownPercentage}>20%</ThemedText>
              </View>
              <ThemedText style={styles.breakdownValue}>
                ৳{Math.round(data.value * 0.2).toLocaleString()}
              </ThemedText>
              <View style={[styles.breakdownBar, { width: "20%" }]} />
            </View>
          </View>
        </View>

        {/* Forecast Information */}
        <View style={styles.forecastCard}>
          <View style={styles.forecastCardHeader}>
            <Ionicons name="time" size={20} color="#f59e0b" />
            <ThemedText style={styles.forecastCardLabel}>
              Forecast & Predictions
            </ThemedText>
          </View>
          <ThemedText style={styles.forecastValue}>
            ৳{data.forecast.toLocaleString()}
          </ThemedText>
          <ThemedText style={styles.forecastNote}>
            Predicted for next period based on current trends
          </ThemedText>
          <View style={styles.forecastFactors}>
            <ThemedText style={styles.factorTitle}>Growth Factors:</ThemedText>
            <ThemedText style={styles.factorItem}>
              • Market expansion: +8%
            </ThemedText>
            <ThemedText style={styles.factorItem}>
              • Product innovation: +12%
            </ThemedText>
            <ThemedText style={styles.factorItem}>
              • Customer acquisition: +15%
            </ThemedText>
          </View>
        </View>

        {/* Customer Insights */}
        <View style={styles.insightsCard}>
          <View style={styles.insightsHeader}>
            <Ionicons name="people-circle" size={20} color="#6b7280" />
            <ThemedText style={styles.insightsTitle}>
              Customer Insights
            </ThemedText>
          </View>
          <View style={styles.insightsGrid}>
            <View style={styles.insightItem}>
              <ThemedText style={styles.insightValue}>65%</ThemedText>
              <ThemedText style={styles.insightLabel}>
                Repeat Customers
              </ThemedText>
            </View>
            <View style={styles.insightItem}>
              <ThemedText style={styles.insightValue}>2.3x</ThemedText>
              <ThemedText style={styles.insightLabel}>
                Lifetime Value
              </ThemedText>
            </View>
            <View style={styles.insightItem}>
              <ThemedText style={styles.insightValue}>4.8/5</ThemedText>
              <ThemedText style={styles.insightLabel}>Rating</ThemedText>
            </View>
            <View style={styles.insightItem}>
              <ThemedText style={styles.insightValue}>87%</ThemedText>
              <ThemedText style={styles.insightLabel}>Satisfaction</ThemedText>
            </View>
          </View>
        </View>

        {/* Description */}
        <View style={styles.infoCard}>
          <View style={styles.infoCardHeader}>
            <Ionicons name="document-text" size={20} color="#6b7280" />
            <ThemedText style={styles.infoCardLabel}>Description</ThemedText>
          </View>
          <ThemedText style={styles.infoCardText}>
            {data.details.description}
          </ThemedText>
        </View>

        {/* Notes */}
        <View style={styles.infoCard}>
          <View style={styles.infoCardHeader}>
            <Ionicons name="chatbubble" size={20} color="#6b7280" />
            <ThemedText style={styles.infoCardLabel}>Notes</ThemedText>
          </View>
          <ThemedText style={styles.infoCardText}>
            {data.details.notes}
          </ThemedText>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="download" size={16} color="#667eea" />
            <ThemedText style={styles.actionButtonText}>Export Data</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="create" size={16} color="#667eea" />
            <ThemedText style={styles.actionButtonText}>Edit</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="share" size={16} color="#667eea" />
            <ThemedText style={styles.actionButtonText}>Share</ThemedText>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const formatValue = (value: number) => {
  return `৳${value.toLocaleString()}`;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  header: {
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
    flex: 1,
    textAlign: "center",
  },
  shareButton: {
    padding: 4,
  },
  content: {
    flex: 1,
    padding: 16,
  },
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
  categoryHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  categoryColorIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  categoryContent: {
    flex: 1,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1f2937",
  },
  categoryPercentage: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 4,
  },
  categoryStats: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  categoryStat: {
    alignItems: "center",
  },
  categoryStatValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1f2937",
  },
  categoryStatLabel: {
    fontSize: 11,
    color: "#6b7280",
    marginTop: 2,
  },
  periodSelector: {
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
  periodButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    borderRadius: 8,
  },
  periodButtonActive: {
    backgroundColor: "#667eea",
  },
  periodButtonText: {
    fontSize: 12,
    color: "#6b7280",
    fontWeight: "500",
  },
  periodButtonTextActive: {
    color: "#fff",
    fontWeight: "bold",
  },
  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 16,
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
  barLabel: {
    fontSize: 10,
    color: "#6b7280",
  },
  barValue: {
    fontSize: 10,
    color: "#1f2937",
    fontWeight: "bold",
  },
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
  relatedHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  relatedTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#1f2937",
    marginLeft: 4,
  },
  relatedItem: {
    marginBottom: 12,
  },
  relatedInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  relatedColorIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  relatedDetails: {
    flex: 1,
  },
  relatedName: {
    fontSize: 13,
    color: "#6b7280",
  },
  relatedValue: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#1f2937",
  },
  relatedPercentage: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#1f2937",
  },
  relatedBar: {
    height: 4,
    backgroundColor: "#e5e7eb",
    borderRadius: 2,
  },
  marketCard: {
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
  marketHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  marketTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#1f2937",
    marginLeft: 4,
  },
  marketStats: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  marketStat: {
    alignItems: "center",
    width: "48%",
    marginBottom: 8,
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
  breakdownCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  breakdownCardLabel: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#1f2937",
    marginLeft: 4,
  },
  breakdownItems: {
    gap: 12,
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
  forecastCard: {
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
  forecastCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  forecastCardLabel: {
    fontSize: 12,
    color: "#6b7280",
    marginLeft: 4,
  },
  forecastValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: 4,
  },
  forecastNote: {
    fontSize: 11,
    color: "#6b7280",
    marginBottom: 8,
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
  insightsCard: {
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
  insightsHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  insightsTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#1f2937",
    marginLeft: 4,
  },
  insightsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  insightItem: {
    alignItems: "center",
    width: "48%",
    marginBottom: 8,
  },
  insightValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1f2937",
  },
  insightLabel: {
    fontSize: 11,
    color: "#6b7280",
    marginTop: 2,
  },
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
  infoCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  infoCardLabel: {
    fontSize: 12,
    color: "#6b7280",
    marginLeft: 4,
  },
  infoCardText: {
    fontSize: 13,
    color: "#4b5563",
    lineHeight: 20,
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 16,
    marginBottom: 20,
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
    color: "#667eea",
    fontWeight: "500",
  },
});
