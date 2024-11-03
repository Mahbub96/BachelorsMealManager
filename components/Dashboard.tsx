import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  SafeAreaView,
} from "react-native";

const Dashboard = () => {
  // Sample data - replace with state or props in a real app
  const [userRole] = useState("member"); // "admin" or "member"
  const totalMeals = {
    breakfast: 30,
    lunch: 28,
    dinner: 25,
  };
  const mealRate = 50; // assumed as BDT per meal
  const bazarSummary = 4500; // total bazar expense
  const pendingMealRequests = 3;
  const pendingBazarApprovals = 2;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container}>
        <Text style={styles.header}>Dashboard</Text>

        <View style={styles.dashboardCards}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Total Meals This Month</Text>
            <View style={styles.mealBreakdown}>
              <Text style={styles.mealText}>
                Breakfast: {totalMeals.breakfast}
              </Text>
              <Text style={styles.mealText}>Lunch: {totalMeals.lunch}</Text>
              <Text style={styles.mealText}>Dinner: {totalMeals.dinner}</Text>
            </View>
            <Text style={styles.cardTotal}>
              Total:{" "}
              {totalMeals.breakfast + totalMeals.lunch + totalMeals.dinner}
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Bazar Summary</Text>
            <Text style={styles.cardValue}>৳ {bazarSummary}</Text>
            <TouchableOpacity style={styles.miniButton}>
              <Text style={styles.miniButtonText}>View Details</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Current Meal Rate</Text>
            <Text style={styles.cardValue}>৳ {mealRate}</Text>
            <Text style={styles.rateBreakdown}>Per meal average</Text>
          </View>

          {userRole === "admin" && (
            <View style={styles.adminSection}>
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Admin Controls</Text>
                <Text style={styles.notificationText}>
                  {pendingMealRequests} meal requests pending
                </Text>
                <Text style={styles.notificationText}>
                  {pendingBazarApprovals} bazar approvals needed
                </Text>
                <View style={styles.adminButtons}>
                  <TouchableOpacity style={styles.adminButton}>
                    <Text style={styles.adminButtonText}>Manage Members</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.adminButton}>
                    <Text style={styles.adminButtonText}>Approve Requests</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.button}>
            <Text style={styles.buttonText}>Plan My Meals</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.button}>
            <Text style={styles.buttonText}>Submit Bazar List</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f9f9f9",
  },
  container: {
    flex: 1,
    backgroundColor: "#f9f9f9",
    paddingHorizontal: 20,
  },
  header: {
    fontSize: 24,
    fontWeight: "bold",
    marginVertical: 20,
    textAlign: "center",
    color: "#333",
  },
  dashboardCards: {
    marginBottom: 20,
  },
  card: {
    padding: 20,
    marginVertical: 10,
    borderRadius: 10,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 1,
    elevation: 5,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "500",
    color: "#666",
    marginBottom: 10,
  },
  cardValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginTop: 5,
  },
  mealBreakdown: {
    marginVertical: 10,
  },
  mealText: {
    fontSize: 14,
    color: "#666",
    marginVertical: 2,
  },
  cardTotal: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#eee",
    paddingTop: 10,
  },
  rateBreakdown: {
    fontSize: 12,
    color: "#666",
    marginTop: 5,
  },
  buttonContainer: {
    marginTop: 20,
    gap: 10,
  },
  button: {
    backgroundColor: "#007AFF",
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  miniButton: {
    backgroundColor: "#f0f0f0",
    padding: 8,
    borderRadius: 5,
    marginTop: 10,
    alignItems: "center",
  },
  miniButtonText: {
    color: "#007AFF",
    fontSize: 14,
  },
  adminSection: {
    marginTop: 20,
  },
  adminButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 15,
    gap: 10,
  },
  adminButton: {
    flex: 1,
    backgroundColor: "#5856d6",
    padding: 10,
    borderRadius: 5,
    alignItems: "center",
  },
  adminButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
  },
  notificationText: {
    color: "#ff3b30",
    fontSize: 14,
    marginVertical: 2,
  },
});

export default Dashboard;
