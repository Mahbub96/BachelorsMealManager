import { useMessData } from "@/context/MessDataContext";
import { useRouter } from "expo-router";
import React from "react";
import { Alert, Dimensions, ScrollView, StyleSheet, View } from "react-native";
import { StatsGrid } from "../ModernCharts";
import { ChartsSection } from "./ChartsSection";
import { DashboardHeader } from "./DashboardHeader";
import { QuickActions } from "./QuickActions";
import { RecentActivity } from "./RecentActivity";

const { width: screenWidth } = Dimensions.get("window");

const DESIGN_SYSTEM = {
  colors: {
    light: "#f8fafc",
  },
  spacing: {
    lg: 20,
    xl: 24,
  },
};

export const ModularDashboard: React.FC = () => {
  const router = useRouter();
  const {
    monthlyRevenue,
    currentMonthRevenue,
    members,
    mealEntries,
    bazarEntries,
    monthlyMealStats,
    recentActivities,
  } = useMessData();

  const isTablet = screenWidth >= 768;
  const isMobile = screenWidth < 768;
  const containerPadding = isTablet ? 24 : 16;
  const cardSpacing = isTablet ? 20 : 12; // Reduced spacing for mobile

  // Enhanced stats with better visual design
  const stats = [
    {
      title: "Total Revenue",
      value: `৳${(currentMonthRevenue?.revenue || 0).toLocaleString()}`,
      icon: "trending-up",
      gradient: ["#667eea", "#764ba2"] as [string, string],
      details: {
        change: "+12.5%",
        period: "vs last month",
        trend: "up",
      },
    },
    {
      title: "Monthly Expenses",
      value: `৳${(currentMonthRevenue?.expenses || 0).toLocaleString()}`,
      icon: "card",
      gradient: ["#f59e0b", "#d97706"] as [string, string],
      details: {
        change: "+8.2%",
        period: "vs last month",
        trend: "up",
      },
    },
    {
      title: "Active Members",
      value: `${(members || []).filter((m) => m.status === "active").length}`,
      icon: "people",
      gradient: ["#10b981", "#059669"] as [string, string],
      details: {
        change: "+1",
        period: "this month",
        trend: "up",
      },
    },
    {
      title: "Total Meals",
      value: `${monthlyMealStats?.totalMeals || 0}`,
      icon: "restaurant",
      gradient: ["#8b5cf6", "#7c3aed"] as [string, string],
      details: {
        change: "+15.3%",
        period: "vs last month",
        trend: "up",
      },
    },
  ];

  const handleQuickAction = (action: string) => {
    switch (action) {
      case "add-meal":
        router.push("/meals");
        break;
      case "add-bazar":
        router.push("/admin");
        break;
      case "view-expenses":
        router.push({
          pathname: "/expense-details",
          params: {
            title: "Monthly Expenses",
            value: (currentMonthRevenue?.expenses || 0).toString(),
            type: "monthly",
            color: "#f59e0b",
          },
        });
        break;
      case "view-revenue":
        router.push({
          pathname: "/expense-details",
          params: {
            title: "Monthly Revenue",
            value: (currentMonthRevenue?.revenue || 0).toString(),
            type: "monthly",
            color: "#667eea",
          },
        });
        break;
      default:
        Alert.alert("Coming Soon", "This feature will be available soon!");
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.contentContainer,
        { padding: containerPadding },
      ]}
      showsVerticalScrollIndicator={false}
    >
      {/* Header Section */}
      <DashboardHeader />

      {/* Stats Grid */}
      <View style={[styles.statsContainer, { marginBottom: cardSpacing }]}>
        <StatsGrid stats={stats} />
      </View>

      {/* Charts Section */}
      <ChartsSection
        monthlyRevenue={monthlyRevenue || []}
        currentMonthRevenue={currentMonthRevenue || { revenue: 0, expenses: 0 }}
        isTablet={isTablet}
      />

      {/* Quick Actions */}
      <QuickActions onActionPress={handleQuickAction} />

      {/* Recent Activity */}
      <RecentActivity activities={recentActivities || []} maxItems={3} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DESIGN_SYSTEM.colors.light,
    paddingTop: 60, // Add top padding to match other tabs
  },
  contentContainer: {
    paddingBottom: 100,
  },
  statsContainer: {
    marginBottom: DESIGN_SYSTEM.spacing.xl,
  },
});
