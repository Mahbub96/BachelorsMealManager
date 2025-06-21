import {
  BarChart,
  LineChart,
  PieChart,
  ProgressChart,
  StatsGrid,
} from "@/components/ModernCharts";
import { ThemedText } from "@/components/ThemedText";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useState, useEffect } from "react";
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  TextInput,
  View,
  RefreshControl,
} from "react-native";
import { useAuth } from "@/context/AuthContext";
import DataService from "@/services/dataService";
import { MessLoadingSpinner } from "@/components/MessLoadingSpinner";
import ErrorBoundary from "@/components/ErrorBoundary";

interface Member {
  _id: string;
  name: string;
  email: string;
  phone: string;
  role: "admin" | "member";
  joinDate: string;
  status: "active" | "inactive";
  totalMeals?: number;
  totalContribution?: number;
}

interface PendingApproval {
  _id: string;
  type: "meal" | "bazar";
  memberName: string;
  description: string;
  amount?: number;
  date: string;
  status: "pending" | "approved" | "rejected";
}

interface DashboardStats {
  mealStats: any;
  bazarStats: any;
  users: any[];
}

export default function AdminScreen() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [activeTab, setActiveTab] = useState<
    "overview" | "members" | "approvals" | "reports" | "statistics"
  >("overview");
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [newMember, setNewMember] = useState({
    name: "",
    email: "",
    phone: "",
    role: "member" as "admin" | "member",
  });

  // Real data state
  const [dashboardData, setDashboardData] = useState<DashboardStats | null>(
    null
  );
  const [members, setMembers] = useState<Member[]>([]);
  const [pendingApprovals, setPendingApprovals] = useState<PendingApproval[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch dashboard data
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await DataService.getDashboardData();
      setDashboardData(data);
      setMembers(data.users || []);

      // Fetch pending approvals
      const [pendingMeals, pendingBazar] = await Promise.all([
        DataService.getAllMeals({ status: "pending", limit: 10 }),
        DataService.getAllBazar({ status: "pending", limit: 10 }),
      ]);

      const approvals: PendingApproval[] = [];

      // Add pending meals
      if (pendingMeals && Array.isArray(pendingMeals)) {
        pendingMeals.forEach((meal: any) => {
          approvals.push({
            _id: meal._id,
            type: "meal",
            memberName: meal.userId?.name || "Unknown",
            description: `Meals for ${new Date(
              meal.date
            ).toLocaleDateString()}`,
            date: meal.date,
            status: meal.status,
          });
        });
      }

      // Add pending bazar entries
      if (pendingBazar && Array.isArray(pendingBazar)) {
        pendingBazar.forEach((bazar: any) => {
          approvals.push({
            _id: bazar._id,
            type: "bazar",
            memberName: bazar.userId?.name || "Unknown",
            description: bazar.description || "Bazar entry",
            amount: bazar.totalAmount,
            date: bazar.date,
            status: bazar.status,
          });
        });
      }

      setPendingApprovals(approvals);
    } catch (error) {
      console.error("Error fetching admin dashboard data:", error);
      setError("Failed to load admin dashboard data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchDashboardData();
    }
  }, [isAdmin]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardData();
    setRefreshing(false);
  };

  // Comprehensive Statistics Calculations
  const calculateStatistics = () => {
    if (!dashboardData)
      return {
        totalMembers: 0,
        activeMembers: 0,
        totalMeals: 0,
        totalRevenue: 0,
        avgMealsPerMember: "0",
        avgContributionPerMember: "0",
        avgContributionPerMeal: "0",
        pendingApprovalsCount: 0,
        approvalRate: "0",
        monthlyRevenue: 0,
        monthlyMeals: 0,
        newMembersThisMonth: 0,
        totalProfit: 0,
        costPerMeal: 0,
        topPerformer: null,
        mealStats: {},
        bazarStats: {},
        profitMargin: 15,
      };

    const activeMembers = members.filter((m) => m.status === "active");
    const totalMembers = members.length;
    const totalMeals = dashboardData.mealStats?.totalMeals || 0;
    const totalRevenue = dashboardData.bazarStats?.totalAmount || 0;
    const avgMealsPerMember =
      totalMembers > 0 ? (totalMeals / totalMembers).toFixed(1) : "0";
    const avgContributionPerMember =
      totalMembers > 0 ? (totalRevenue / totalMembers).toFixed(0) : "0";
    const avgContributionPerMeal =
      totalMeals > 0 ? (totalRevenue / totalMeals).toFixed(0) : "0";
    const pendingApprovalsCount = pendingApprovals.filter(
      (a) => a.status === "pending"
    ).length;
    const approvalRate =
      pendingApprovals.length > 0
        ? (
            (pendingApprovals.filter((a) => a.status === "approved").length /
              pendingApprovals.length) *
            100
          ).toFixed(1)
        : "0";

    // Monthly calculations (assuming current month data)
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const monthlyRevenue = totalRevenue * 0.25; // Simplified calculation
    const monthlyMeals = totalMeals * 0.25; // Simplified calculation

    // Member growth rate
    const newMembersThisMonth = members.filter((m) => {
      const joinDate = new Date(m.joinDate);
      return (
        joinDate.getMonth() === currentMonth &&
        joinDate.getFullYear() === currentYear
      );
    }).length;

    // Financial metrics
    const profitMargin = 15; // Assuming 15% profit margin
    const totalProfit = (totalRevenue * profitMargin) / 100;
    const costPerMeal =
      totalMeals > 0
        ? (totalRevenue * (100 - profitMargin)) / 100 / totalMeals
        : 0;

    // Performance metrics
    const topPerformer = members.reduce(
      (max, member) =>
        (member.totalMeals || 0) > (max.totalMeals || 0) ? member : max,
      members[0] || { totalMeals: 0 }
    );

    return {
      totalMembers,
      activeMembers: activeMembers.length,
      totalMeals,
      totalRevenue,
      avgMealsPerMember,
      avgContributionPerMember,
      avgContributionPerMeal,
      pendingApprovalsCount,
      approvalRate,
      monthlyRevenue,
      monthlyMeals,
      newMembersThisMonth,
      totalProfit,
      costPerMeal,
      topPerformer,
      mealStats: dashboardData.mealStats,
      bazarStats: dashboardData.bazarStats,
      profitMargin,
    };
  };

  const handleApprove = async (id: string, type: "meal" | "bazar") => {
    try {
      if (type === "meal") {
        await DataService.approveMeal(id);
      } else {
        await DataService.approveBazar(id);
      }

      Alert.alert("Success", `${type} approved successfully!`);
      fetchDashboardData(); // Refresh data
    } catch (error) {
      console.error("Error approving:", error);
      Alert.alert("Error", `Failed to approve ${type}. Please try again.`);
    }
  };

  const handleReject = async (id: string, type: "meal" | "bazar") => {
    try {
      if (type === "meal") {
        await DataService.rejectMeal(id);
      } else {
        await DataService.rejectBazar(id);
      }

      Alert.alert("Success", `${type} rejected successfully!`);
      fetchDashboardData(); // Refresh data
    } catch (error) {
      console.error("Error rejecting:", error);
      Alert.alert("Error", `Failed to reject ${type}. Please try again.`);
    }
  };

  const handleMemberStatusToggle = async (memberId: string) => {
    try {
      const member = members.find((m) => m._id === memberId);
      if (!member) return;

      const newStatus = member.status === "active" ? "inactive" : "active";

      // Update member status via API
      await DataService.updateUser(memberId, { status: newStatus });

      Alert.alert("Success", `Member status updated to ${newStatus}!`);
      fetchDashboardData(); // Refresh data
    } catch (error) {
      console.error("Error updating member status:", error);
      Alert.alert("Error", "Failed to update member status. Please try again.");
    }
  };

  const handleAddMember = async () => {
    if (!newMember.name || !newMember.email) {
      Alert.alert("Error", "Please fill in all required fields.");
      return;
    }

    try {
      await DataService.createUser({
        ...newMember,
        password: "defaultPassword123", // You might want to generate this
      });

      Alert.alert("Success", "Member added successfully!");
      setShowAddMemberModal(false);
      setNewMember({ name: "", email: "", phone: "", role: "member" });
      fetchDashboardData(); // Refresh data
    } catch (error) {
      console.error("Error adding member:", error);
      Alert.alert("Error", "Failed to add member. Please try again.");
    }
  };

  const handleDeleteMember = async (memberId: string) => {
    Alert.alert(
      "Delete Member",
      "Are you sure you want to delete this member? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await DataService.deleteUser(memberId);
              Alert.alert("Success", "Member deleted successfully!");
              fetchDashboardData(); // Refresh data
            } catch (error) {
              console.error("Error deleting member:", error);
              Alert.alert(
                "Error",
                "Failed to delete member. Please try again."
              );
            }
          },
        },
      ]
    );
  };

  if (!isAdmin) {
    return (
      <View style={styles.unauthorizedContainer}>
        <Ionicons name="shield-checkmark" size={64} color="#ef4444" />
        <ThemedText style={styles.unauthorizedText}>Access Denied</ThemedText>
        <ThemedText style={styles.unauthorizedSubtext}>
          You need admin privileges to access this page.
        </ThemedText>
      </View>
    );
  }

  if (loading) {
    return (
      <MessLoadingSpinner
        type="dashboard"
        size="large"
        message="Loading admin dashboard..."
      />
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={64} color="#ef4444" />
        <ThemedText style={styles.errorText}>{error}</ThemedText>
        <Pressable style={styles.retryButton} onPress={fetchDashboardData}>
          <ThemedText style={styles.retryButtonText}>Retry</ThemedText>
        </Pressable>
      </View>
    );
  }

  const stats = calculateStatistics();

  // Chart data
  const memberPerformanceData = members.slice(0, 5).map((member) => ({
    label: member.name.split(" ")[0],
    value: member.totalMeals,
    color: member.role === "admin" ? "#667eea" : "#f093fb",
    gradient:
      member.role === "admin"
        ? (["#667eea", "#764ba2"] as const)
        : (["#f093fb", "#f5576c"] as const),
  }));

  const monthlyRevenueData = [
    { date: "Week 1", value: 8500 },
    { date: "Week 2", value: 9200 },
    { date: "Week 3", value: 7800 },
    { date: "Week 4", value: 10500 },
  ];

  const expenseBreakdownData = [
    {
      label: "Groceries",
      value: 45,
      color: "#10b981",
      gradient: ["#34d399", "#10b981"] as const,
    },
    {
      label: "Utilities",
      value: 25,
      color: "#6366f1",
      gradient: ["#818cf8", "#6366f1"] as const,
    },
    {
      label: "Maintenance",
      value: 20,
      color: "#f59e0b",
      gradient: ["#fbbf24", "#f59e0b"] as const,
    },
    {
      label: "Others",
      value: 10,
      color: "#f093fb",
      gradient: ["#f093fb", "#f5576c"] as const,
    },
  ];

  const quickStats = [
    {
      title: "Total Members",
      value: members.length.toString(),
      icon: "people",
      gradient: ["#667eea", "#764ba2"] as const,
    },
    {
      title: "Pending Approvals",
      value: pendingApprovals
        .filter((a) => a.status === "pending")
        .length.toString(),
      icon: "time",
      gradient: ["#f093fb", "#f5576c"] as const,
    },
    {
      title: "Total Revenue",
      value: `৳${members.reduce((sum, m) => sum + m.totalContribution, 0)}`,
      icon: "cash",
      gradient: ["#43e97b", "#38f9d7"] as const,
    },
  ];

  const filteredMembers = members.filter(
    (member) =>
      member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredApprovals = pendingApprovals.filter(
    (approval) =>
      approval.memberName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      approval.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderOverview = () => (
    <View>
      {/* Quick Stats */}
      <StatsGrid stats={quickStats} />

      {/* Member Performance Chart */}
      <BarChart
        data={memberPerformanceData}
        title="Member Performance (Total Meals)"
        height={200}
      />

      {/* Monthly Revenue Trend */}
      <LineChart
        data={monthlyRevenueData}
        title="Monthly Revenue Trend (৳)"
        color="#667eea"
      />

      {/* Progress Charts */}
      <View style={styles.progressSection}>
        <ThemedText style={styles.sectionTitle}>Monthly Goals</ThemedText>
        <ProgressChart
          title="Revenue Target"
          current={members.reduce((sum, m) => sum + m.totalContribution, 0)}
          target={50000}
          gradient={["#667eea", "#764ba2"]}
        />
        <ProgressChart
          title="Member Participation"
          current={members.filter((m) => m.status === "active").length}
          target={members.length}
          gradient={["#f093fb", "#f5576c"]}
        />
        <ProgressChart
          title="Approval Rate"
          current={
            pendingApprovals.filter((a) => a.status === "approved").length
          }
          target={pendingApprovals.length}
          gradient={["#43e97b", "#38f9d7"]}
        />
      </View>

      {/* Expense Breakdown */}
      <PieChart data={expenseBreakdownData} title="Expense Breakdown (%)" />

      {/* Recent Activity */}
      <View style={styles.activityContainer}>
        <ThemedText style={styles.sectionTitle}>Recent Activity</ThemedText>
        <View style={styles.activityCards}>
          {pendingApprovals
            .filter((a) => a.status === "pending")
            .slice(0, 3)
            .map((approval) => (
              <View key={approval._id} style={styles.activityCard}>
                <View
                  style={[
                    styles.activityIcon,
                    {
                      backgroundColor:
                        approval.type === "meal" ? "#667eea" : "#f093fb",
                    },
                  ]}
                >
                  <Ionicons
                    name={approval.type === "meal" ? "restaurant" : "cart"}
                    size={16}
                    color="#fff"
                  />
                </View>
                <View style={styles.activityContent}>
                  <ThemedText style={styles.activityValue}>
                    {approval.memberName}
                  </ThemedText>
                  <ThemedText style={styles.activityLabel}>
                    {approval.description}
                  </ThemedText>
                  <ThemedText style={styles.activityTime}>
                    {approval.date}
                  </ThemedText>
                </View>
                <View style={styles.activityStatus}>
                  <View
                    style={[styles.statusBadge, { backgroundColor: "#fffbeb" }]}
                  >
                    <ThemedText
                      style={[styles.statusText, { color: "#f59e0b" }]}
                    >
                      Pending
                    </ThemedText>
                  </View>
                </View>
              </View>
            ))}
        </View>
      </View>
    </View>
  );

  const renderMembers = () => (
    <View>
      {/* Search and Add Member */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons
            name="search"
            size={20}
            color="#9ca3af"
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search members..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#9ca3af"
          />
        </View>
        <Pressable
          style={styles.addMemberButton}
          onPress={() => setShowAddMemberModal(true)}
        >
          <LinearGradient
            colors={["#667eea", "#764ba2"]}
            style={styles.addMemberButtonGradient}
          >
            <Ionicons name="add" size={20} color="#fff" />
            <ThemedText style={styles.addMemberButtonText}>
              Add Member
            </ThemedText>
          </LinearGradient>
        </Pressable>
      </View>

      {/* Members List */}
      <View style={styles.membersContainer}>
        {filteredMembers.map((member) => (
          <View key={member._id} style={styles.memberCard}>
            <View style={styles.memberHeader}>
              <View style={styles.memberInfo}>
                <ThemedText style={styles.memberName}>{member.name}</ThemedText>
                <ThemedText style={styles.memberEmail}>
                  {member.email}
                </ThemedText>
                <ThemedText style={styles.memberPhone}>
                  {member.phone}
                </ThemedText>
              </View>
              <View style={styles.memberActions}>
                <View
                  style={[
                    styles.roleBadge,
                    {
                      backgroundColor:
                        member.role === "admin" ? "#eef2ff" : "#f0fdf4",
                    },
                  ]}
                >
                  <ThemedText
                    style={[
                      styles.roleText,
                      {
                        color: member.role === "admin" ? "#6366f1" : "#10b981",
                      },
                    ]}
                  >
                    {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                  </ThemedText>
                </View>
                <Switch
                  value={member.status === "active"}
                  onValueChange={() => handleMemberStatusToggle(member._id)}
                  trackColor={{ false: "#e5e7eb", true: "#10b981" }}
                  thumbColor={member.status === "active" ? "#fff" : "#9ca3af"}
                />
                <Pressable
                  style={styles.deleteButton}
                  onPress={() => handleDeleteMember(member._id)}
                >
                  <Ionicons name="trash" size={16} color="#ef4444" />
                </Pressable>
              </View>
            </View>

            <View style={styles.memberStats}>
              <View style={styles.memberStat}>
                <ThemedText style={styles.memberStatLabel}>
                  Total Meals
                </ThemedText>
                <ThemedText style={styles.memberStatValue}>
                  {member.totalMeals}
                </ThemedText>
              </View>
              <View style={styles.memberStat}>
                <ThemedText style={styles.memberStatLabel}>
                  Contribution
                </ThemedText>
                <ThemedText style={styles.memberStatValue}>
                  {member.totalContribution}৳
                </ThemedText>
              </View>
              <View style={styles.memberStat}>
                <ThemedText style={styles.memberStatLabel}>
                  Join Date
                </ThemedText>
                <ThemedText style={styles.memberStatValue}>
                  {member.joinDate}
                </ThemedText>
              </View>
            </View>
          </View>
        ))}
      </View>

      {/* Add Member Modal */}
      <Modal
        visible={showAddMemberModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddMemberModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>Add New Member</ThemedText>
              <Pressable onPress={() => setShowAddMemberModal(false)}>
                <Ionicons name="close" size={24} color="#6b7280" />
              </Pressable>
            </View>

            <View style={styles.modalBody}>
              <TextInput
                style={styles.modalInput}
                placeholder="Full Name"
                value={newMember.name}
                onChangeText={(text) =>
                  setNewMember((prev) => ({ ...prev, name: text }))
                }
                placeholderTextColor="#9ca3af"
              />
              <TextInput
                style={styles.modalInput}
                placeholder="Email"
                value={newMember.email}
                onChangeText={(text) =>
                  setNewMember((prev) => ({ ...prev, email: text }))
                }
                placeholderTextColor="#9ca3af"
                keyboardType="email-address"
              />
              <TextInput
                style={styles.modalInput}
                placeholder="Phone Number"
                value={newMember.phone}
                onChangeText={(text) =>
                  setNewMember((prev) => ({ ...prev, phone: text }))
                }
                placeholderTextColor="#9ca3af"
                keyboardType="phone-pad"
              />

              <View style={styles.roleSelector}>
                <ThemedText style={styles.roleSelectorLabel}>Role:</ThemedText>
                <View style={styles.roleOptions}>
                  <Pressable
                    style={[
                      styles.roleOption,
                      newMember.role === "member" && styles.roleOptionActive,
                    ]}
                    onPress={() =>
                      setNewMember((prev) => ({ ...prev, role: "member" }))
                    }
                  >
                    <ThemedText
                      style={[
                        styles.roleOptionText,
                        newMember.role === "member" &&
                          styles.roleOptionTextActive,
                      ]}
                    >
                      Member
                    </ThemedText>
                  </Pressable>
                  <Pressable
                    style={[
                      styles.roleOption,
                      newMember.role === "admin" && styles.roleOptionActive,
                    ]}
                    onPress={() =>
                      setNewMember((prev) => ({ ...prev, role: "admin" }))
                    }
                  >
                    <ThemedText
                      style={[
                        styles.roleOptionText,
                        newMember.role === "admin" &&
                          styles.roleOptionTextActive,
                      ]}
                    >
                      Admin
                    </ThemedText>
                  </Pressable>
                </View>
              </View>
            </View>

            <View style={styles.modalActions}>
              <Pressable
                style={styles.modalButtonSecondary}
                onPress={() => setShowAddMemberModal(false)}
              >
                <ThemedText style={styles.modalButtonSecondaryText}>
                  Cancel
                </ThemedText>
              </Pressable>
              <Pressable
                style={styles.modalButtonPrimary}
                onPress={handleAddMember}
              >
                <LinearGradient
                  colors={["#667eea", "#764ba2"]}
                  style={styles.modalButtonGradient}
                >
                  <ThemedText style={styles.modalButtonPrimaryText}>
                    Add Member
                  </ThemedText>
                </LinearGradient>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );

  const renderApprovals = () => (
    <View>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons
            name="search"
            size={20}
            color="#9ca3af"
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search approvals..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#9ca3af"
          />
        </View>
      </View>

      {/* Approvals List */}
      <View style={styles.approvalsContainer}>
        {filteredApprovals.map((approval) => (
          <View key={approval._id} style={styles.approvalCard}>
            <View style={styles.approvalHeader}>
              <View style={styles.approvalInfo}>
                <ThemedText style={styles.approvalType}>
                  {approval.type.charAt(0).toUpperCase() +
                    approval.type.slice(1)}{" "}
                  Submission
                </ThemedText>
                <ThemedText style={styles.approvalMember}>
                  {approval.memberName}
                </ThemedText>
                <ThemedText style={styles.approvalDescription}>
                  {approval.description}
                </ThemedText>
                {approval.amount && (
                  <ThemedText style={styles.approvalAmount}>
                    Amount: {approval.amount}৳
                  </ThemedText>
                )}
                <ThemedText style={styles.approvalDate}>
                  {approval.date}
                </ThemedText>
              </View>
              {approval.status === "pending" && (
                <View style={styles.approvalActions}>
                  <Pressable
                    style={[styles.actionButton, styles.approveButton]}
                    onPress={() => handleApprove(approval._id, approval.type)}
                  >
                    <Ionicons name="checkmark" size={16} color="#fff" />
                    <ThemedText style={styles.actionButtonText}>
                      Approve
                    </ThemedText>
                  </Pressable>
                  <Pressable
                    style={[styles.actionButton, styles.rejectButton]}
                    onPress={() => handleReject(approval._id, approval.type)}
                  >
                    <Ionicons name="close" size={16} color="#fff" />
                    <ThemedText style={styles.actionButtonText}>
                      Reject
                    </ThemedText>
                  </Pressable>
                </View>
              )}
              {approval.status !== "pending" && (
                <View
                  style={[
                    styles.statusBadge,
                    {
                      backgroundColor:
                        approval.status === "approved" ? "#ecfdf5" : "#fef2f2",
                    },
                  ]}
                >
                  <ThemedText
                    style={[
                      styles.statusText,
                      {
                        color:
                          approval.status === "approved"
                            ? "#10b981"
                            : "#ef4444",
                      },
                    ]}
                  >
                    {approval.status.charAt(0).toUpperCase() +
                      approval.status.slice(1)}
                  </ThemedText>
                </View>
              )}
            </View>
          </View>
        ))}
      </View>
    </View>
  );

  const renderReports = () => (
    <View>
      <ThemedText style={styles.sectionTitle}>Reports & Analytics</ThemedText>

      {/* Monthly Summary */}
      <View style={styles.reportCard}>
        <ThemedText style={styles.reportTitle}>
          Monthly Summary - January 2024
        </ThemedText>
        <View style={styles.reportStats}>
          <View style={styles.reportStat}>
            <ThemedText style={styles.reportStatLabel}>Total Meals</ThemedText>
            <ThemedText style={styles.reportStatValue}>290</ThemedText>
          </View>
          <View style={styles.reportStat}>
            <ThemedText style={styles.reportStatLabel}>
              Total Revenue
            </ThemedText>
            <ThemedText style={styles.reportStatValue}>10,900৳</ThemedText>
          </View>
          <View style={styles.reportStat}>
            <ThemedText style={styles.reportStatLabel}>
              Average per Member
            </ThemedText>
            <ThemedText style={styles.reportStatValue}>2,725৳</ThemedText>
          </View>
        </View>
      </View>

      {/* Export Options */}
      <View style={styles.exportContainer}>
        <ThemedText style={styles.sectionTitle}>Export Reports</ThemedText>
        <View style={styles.exportButtons}>
          <Pressable style={styles.exportButton}>
            <LinearGradient
              colors={["#667eea", "#764ba2"]}
              style={styles.exportButtonGradient}
            >
              <Ionicons name="document-text" size={24} color="#fff" />
              <ThemedText style={styles.exportButtonText}>
                Export PDF
              </ThemedText>
            </LinearGradient>
          </Pressable>
          <Pressable style={styles.exportButton}>
            <LinearGradient
              colors={["#f093fb", "#f5576c"]}
              style={styles.exportButtonGradient}
            >
              <Ionicons name="tablet-portrait" size={24} color="#fff" />
              <ThemedText style={styles.exportButtonText}>
                Export Excel
              </ThemedText>
            </LinearGradient>
          </Pressable>
        </View>
      </View>
    </View>
  );

  const renderStatistics = () => (
    <View>
      <ThemedText style={styles.sectionTitle}>
        Comprehensive Statistics
      </ThemedText>

      {/* Key Performance Indicators */}
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <LinearGradient
            colors={["#667eea", "#764ba2"]}
            style={styles.statGradient}
          >
            <Ionicons name="people" size={24} color="#fff" />
            <ThemedText style={styles.statValue}>
              {stats.totalMembers}
            </ThemedText>
            <ThemedText style={styles.statLabel}>Total Members</ThemedText>
            <ThemedText style={styles.statSubtext}>
              {stats.activeMembers} Active •{" "}
              {stats.totalMembers - stats.activeMembers} Inactive
            </ThemedText>
          </LinearGradient>
        </View>

        <View style={styles.statCard}>
          <LinearGradient
            colors={["#f093fb", "#f5576c"]}
            style={styles.statGradient}
          >
            <Ionicons name="restaurant" size={24} color="#fff" />
            <ThemedText style={styles.statValue}>{stats.totalMeals}</ThemedText>
            <ThemedText style={styles.statLabel}>Total Meals</ThemedText>
            <ThemedText style={styles.statSubtext}>
              Avg: {stats.avgMealsPerMember} per member
            </ThemedText>
          </LinearGradient>
        </View>

        <View style={styles.statCard}>
          <LinearGradient
            colors={["#43e97b", "#38f9d7"]}
            style={styles.statGradient}
          >
            <Ionicons name="cash" size={24} color="#fff" />
            <ThemedText style={styles.statValue}>
              ৳{stats.totalRevenue}
            </ThemedText>
            <ThemedText style={styles.statLabel}>Total Revenue</ThemedText>
            <ThemedText style={styles.statSubtext}>
              Avg: ৳{stats.avgContributionPerMember} per member
            </ThemedText>
          </LinearGradient>
        </View>

        <View style={styles.statCard}>
          <LinearGradient
            colors={["#fa709a", "#fee140"]}
            style={styles.statGradient}
          >
            <Ionicons name="trending-up" size={24} color="#fff" />
            <ThemedText style={styles.statValue}>
              ৳{stats.totalProfit}
            </ThemedText>
            <ThemedText style={styles.statLabel}>Total Profit</ThemedText>
            <ThemedText style={styles.statSubtext}>
              {stats.profitMargin}% margin
            </ThemedText>
          </LinearGradient>
        </View>
      </View>

      {/* Financial Analytics */}
      <View style={styles.analyticsSection}>
        <ThemedText style={styles.sectionTitle}>Financial Analytics</ThemedText>

        <View style={styles.analyticsGrid}>
          <View style={styles.analyticsCard}>
            <ThemedText style={styles.analyticsTitle}>
              Revenue per Meal
            </ThemedText>
            <ThemedText style={styles.analyticsValue}>
              ৳{stats.avgContributionPerMeal}
            </ThemedText>
            <ThemedText style={styles.analyticsDescription}>
              Average contribution per meal consumed
            </ThemedText>
          </View>

          <View style={styles.analyticsCard}>
            <ThemedText style={styles.analyticsTitle}>Cost per Meal</ThemedText>
            <ThemedText style={styles.analyticsValue}>
              ৳{stats.costPerMeal}
            </ThemedText>
            <ThemedText style={styles.analyticsDescription}>
              Average cost to prepare one meal
            </ThemedText>
          </View>

          <View style={styles.analyticsCard}>
            <ThemedText style={styles.analyticsTitle}>
              Monthly Revenue
            </ThemedText>
            <ThemedText style={styles.analyticsValue}>
              ৳{stats.monthlyRevenue}
            </ThemedText>
            <ThemedText style={styles.analyticsDescription}>
              Projected revenue for current month
            </ThemedText>
          </View>

          <View style={styles.analyticsCard}>
            <ThemedText style={styles.analyticsTitle}>Monthly Meals</ThemedText>
            <ThemedText style={styles.analyticsValue}>
              {stats.monthlyMeals}
            </ThemedText>
            <ThemedText style={styles.analyticsDescription}>
              Projected meals for current month
            </ThemedText>
          </View>
        </View>
      </View>

      {/* Member Performance */}
      <View style={styles.performanceSection}>
        <ThemedText style={styles.sectionTitle}>Member Performance</ThemedText>

        <View style={styles.performanceCard}>
          <ThemedText style={styles.performanceTitle}>Top Performer</ThemedText>
          <View style={styles.topPerformer}>
            <Ionicons name="trophy" size={24} color="#f59e0b" />
            <View style={styles.performerInfo}>
              <ThemedText style={styles.performerName}>
                {stats.topPerformer.name}
              </ThemedText>
              <ThemedText style={styles.performerStats}>
                {stats.topPerformer.totalMeals} meals • ৳
                {stats.topPerformer.totalContribution || 0}
              </ThemedText>
            </View>
          </View>
        </View>

        <View style={styles.memberEfficiencyList}>
          <ThemedText style={styles.efficiencyTitle}>
            Member Efficiency (৳/meal)
          </ThemedText>
          {members
            .sort(
              (a, b) => (b.totalContribution || 0) - (a.totalContribution || 0)
            )
            .slice(0, 5)
            .map((member, index) => (
              <View key={member._id} style={styles.efficiencyItem}>
                <View style={styles.efficiencyRank}>
                  <ThemedText style={styles.rankNumber}>{index + 1}</ThemedText>
                </View>
                <View style={styles.efficiencyInfo}>
                  <ThemedText style={styles.efficiencyName}>
                    {member.name}
                  </ThemedText>
                  <ThemedText style={styles.efficiencyValue}>
                    ৳{member.totalContribution || 0}
                  </ThemedText>
                </View>
              </View>
            ))}
        </View>

        {/* Revenue Chart */}
        <View style={styles.chartContainer}>
          <ThemedText style={styles.chartTitle}>Revenue Overview</ThemedText>
          <BarChart
            data={[
              {
                label: "Total Revenue",
                value: stats.totalRevenue || 0,
                color: "#667eea",
                gradient: ["#667eea", "#764ba2"] as const,
              },
              {
                label: "Monthly Revenue",
                value: stats.monthlyRevenue || 0,
                color: "#f093fb",
                gradient: ["#f093fb", "#f5576c"] as const,
              },
            ]}
            height={200}
          />
        </View>

        {/* Member Contributions */}
        <View style={styles.chartContainer}>
          <ThemedText style={styles.chartTitle}>
            Member Contributions
          </ThemedText>
          {members
            .sort(
              (a, b) => (b.totalContribution || 0) - (a.totalContribution || 0)
            )
            .slice(0, 5)
            .map((member) => (
              <View key={member._id} style={styles.contributionItem}>
                <ThemedText style={styles.contributionName}>
                  {member.name}
                </ThemedText>
                <ThemedText style={styles.contributionAmount}>
                  ৳{member.totalContribution || 0}
                </ThemedText>
              </View>
            ))}
        </View>
      </View>

      {/* Growth Metrics */}
      <View style={styles.growthSection}>
        <ThemedText style={styles.sectionTitle}>Growth Metrics</ThemedText>

        <View style={styles.growthGrid}>
          <View style={styles.growthCard}>
            <Ionicons name="person-add" size={24} color="#10b981" />
            <ThemedText style={styles.growthValue}>
              {stats.newMembersThisMonth}
            </ThemedText>
            <ThemedText style={styles.growthLabel}>
              New Members This Month
            </ThemedText>
          </View>

          <View style={styles.growthCard}>
            <Ionicons name="trending-up" size={24} color="#6366f1" />
            <ThemedText style={styles.growthValue}>
              {stats.approvalRate}%
            </ThemedText>
            <ThemedText style={styles.growthLabel}>Approval Rate</ThemedText>
          </View>

          <View style={styles.growthCard}>
            <Ionicons name="checkmark-circle" size={24} color="#f59e0b" />
            <ThemedText style={styles.growthValue}>
              {stats.pendingApprovalsCount}
            </ThemedText>
            <ThemedText style={styles.growthLabel}>
              Pending Approvals
            </ThemedText>
          </View>

          <View style={styles.growthCard}>
            <Ionicons name="time" size={24} color="#ef4444" />
            <ThemedText style={styles.growthValue}>
              {stats.totalMembers}
            </ThemedText>
            <ThemedText style={styles.growthLabel}>Total Members</ThemedText>
          </View>
        </View>
      </View>

      {/* Export Statistics */}
      <View style={styles.exportContainer}>
        <ThemedText style={styles.sectionTitle}>Export Statistics</ThemedText>
        <View style={styles.exportButtons}>
          <Pressable style={styles.exportButton}>
            <LinearGradient
              colors={["#667eea", "#764ba2"]}
              style={styles.exportButtonGradient}
            >
              <Ionicons name="document-text" size={24} color="#fff" />
              <ThemedText style={styles.exportButtonText}>
                Export PDF Report
              </ThemedText>
            </LinearGradient>
          </Pressable>
          <Pressable style={styles.exportButton}>
            <LinearGradient
              colors={["#f093fb", "#f5576c"]}
              style={styles.exportButtonGradient}
            >
              <Ionicons name="tablet-portrait" size={24} color="#fff" />
              <ThemedText style={styles.exportButtonText}>
                Export Excel Data
              </ThemedText>
            </LinearGradient>
          </Pressable>
        </View>
      </View>
    </View>
  );

  return (
    <ErrorBoundary>
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <LinearGradient
          colors={["#667eea", "#764ba2"]}
          style={styles.headerGradient}
        >
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <ThemedText style={styles.headerTitle}>
                Admin Dashboard
              </ThemedText>
              <ThemedText style={styles.headerSubtitle}>
                Welcome back, {user?.name || "Admin"}!
              </ThemedText>
            </View>
            <View style={styles.headerIcon}>
              <Ionicons name="shield-checkmark" size={32} color="#fff" />
            </View>
          </View>
        </LinearGradient>

        <View style={styles.content}>
          {/* Tab Navigation */}
          <View style={styles.tabContainer}>
            {[
              { key: "overview", label: "Overview", icon: "grid" },
              { key: "members", label: "Members", icon: "people" },
              {
                key: "approvals",
                label: "Approvals",
                icon: "checkmark-circle",
              },
              { key: "reports", label: "Reports", icon: "document-text" },
              { key: "statistics", label: "Statistics", icon: "bar-chart" },
            ].map((tab) => (
              <Pressable
                key={tab.key}
                style={[
                  styles.tabButton,
                  activeTab === tab.key && styles.activeTabButton,
                ]}
                onPress={() => setActiveTab(tab.key as any)}
              >
                <Ionicons
                  name={tab.icon as any}
                  size={20}
                  color={activeTab === tab.key ? "#667eea" : "#6b7280"}
                />
                <ThemedText
                  style={[
                    styles.tabLabel,
                    activeTab === tab.key && styles.activeTabLabel,
                  ]}
                >
                  {tab.label}
                </ThemedText>
              </Pressable>
            ))}
          </View>

          {/* Tab Content */}
          {activeTab === "overview" && renderOverview()}
          {activeTab === "members" && renderMembers()}
          {activeTab === "approvals" && renderApprovals()}
          {activeTab === "reports" && renderReports()}
          {activeTab === "statistics" && renderStatistics()}
        </View>
      </ScrollView>

      {/* Add Member Modal */}
      <Modal
        visible={showAddMemberModal}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ThemedText style={styles.modalTitle}>Add New Member</ThemedText>

            <TextInput
              style={styles.modalInput}
              placeholder="Full Name"
              value={newMember.name}
              onChangeText={(text) =>
                setNewMember((prev) => ({ ...prev, name: text }))
              }
            />

            <TextInput
              style={styles.modalInput}
              placeholder="Email"
              keyboardType="email-address"
              autoCapitalize="none"
              value={newMember.email}
              onChangeText={(text) =>
                setNewMember((prev) => ({ ...prev, email: text }))
              }
            />

            <TextInput
              style={styles.modalInput}
              placeholder="Phone (optional)"
              keyboardType="phone-pad"
              value={newMember.phone}
              onChangeText={(text) =>
                setNewMember((prev) => ({ ...prev, phone: text }))
              }
            />

            <View style={styles.modalButtons}>
              <Pressable
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowAddMemberModal(false)}
              >
                <ThemedText style={styles.cancelButtonText}>Cancel</ThemedText>
              </Pressable>
              <Pressable
                style={[styles.modalButton, styles.addButton]}
                onPress={handleAddMember}
              >
                <ThemedText style={styles.addButtonText}>Add Member</ThemedText>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  headerGradient: {
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.9)",
  },
  headerIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  tabContainer: {
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
    paddingHorizontal: 20,
  },
  tabButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginRight: 8,
    borderRadius: 12,
  },
  activeTabButton: {
    backgroundColor: "#eef2ff",
  },
  tabLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#9ca3af",
    marginLeft: 8,
  },
  activeTabLabel: {
    color: "#667eea",
  },
  content: {
    padding: 20,
  },
  progressSection: {
    marginBottom: 24,
  },
  activityContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: 16,
  },
  activityCards: {
    gap: 12,
  },
  activityCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: 2,
  },
  activityLabel: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 2,
  },
  activityTime: {
    fontSize: 12,
    color: "#9ca3af",
  },
  activityStatus: {
    marginLeft: 12,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "bold",
  },
  searchContainer: {
    marginBottom: 24,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 12,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#1f2937",
  },
  addMemberButton: {
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  addMemberButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  addMemberButtonText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#fff",
    marginLeft: 8,
  },
  membersContainer: {
    marginBottom: 24,
  },
  memberCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  memberHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: 4,
  },
  memberEmail: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 2,
  },
  memberPhone: {
    fontSize: 14,
    color: "#6b7280",
  },
  memberActions: {
    alignItems: "flex-end",
    gap: 8,
  },
  roleBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  roleText: {
    fontSize: 12,
    fontWeight: "bold",
  },
  deleteButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#fef2f2",
  },
  memberStats: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  memberStat: {
    alignItems: "center",
  },
  memberStatLabel: {
    fontSize: 12,
    color: "#6b7280",
    marginBottom: 2,
  },
  memberStatValue: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#1f2937",
  },
  approvalsContainer: {
    marginBottom: 24,
  },
  approvalCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  approvalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  approvalInfo: {
    flex: 1,
  },
  approvalType: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: 4,
  },
  approvalMember: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 4,
  },
  approvalDescription: {
    fontSize: 14,
    color: "#374151",
    marginBottom: 4,
  },
  approvalAmount: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#10b981",
    marginBottom: 4,
  },
  approvalDate: {
    fontSize: 12,
    color: "#9ca3af",
  },
  approvalActions: {
    flexDirection: "row",
    gap: 8,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  approveButton: {
    backgroundColor: "#10b981",
  },
  rejectButton: {
    backgroundColor: "#ef4444",
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#fff",
    marginLeft: 4,
  },
  reportCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  reportTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: 16,
  },
  reportStats: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  reportStat: {
    alignItems: "center",
  },
  reportStatLabel: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 4,
  },
  reportStatValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1f2937",
  },
  exportContainer: {
    marginBottom: 24,
  },
  exportButtons: {
    flexDirection: "row",
    gap: 12,
  },
  exportButton: {
    flex: 1,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  exportButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  exportButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
    marginLeft: 8,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    width: "90%",
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: 20,
    textAlign: "center",
  },
  modalBody: {
    marginBottom: 20,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
  },
  roleSelector: {
    marginTop: 8,
  },
  roleSelectorLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  roleOptions: {
    flexDirection: "row",
    gap: 12,
  },
  roleOption: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    alignItems: "center",
  },
  roleOptionActive: {
    backgroundColor: "#667eea",
    borderColor: "#667eea",
  },
  roleOptionText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6b7280",
  },
  roleOptionTextActive: {
    color: "#fff",
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
  },
  modalButtonSecondary: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    alignItems: "center",
  },
  modalButtonSecondaryText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#6b7280",
  },
  modalButtonPrimary: {
    flex: 1,
    borderRadius: 8,
    overflow: "hidden",
  },
  modalButtonGradient: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: "center",
  },
  modalButtonPrimaryText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    minWidth: 150,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 12,
  },
  statGradient: {
    padding: 16,
    alignItems: "center",
  },
  statValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.9)",
    fontWeight: "600",
    marginBottom: 4,
  },
  statSubtext: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.7)",
    textAlign: "center",
  },
  analyticsSection: {
    marginBottom: 24,
  },
  analyticsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  analyticsCard: {
    flex: 1,
    minWidth: 150,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 12,
  },
  analyticsTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: 8,
  },
  analyticsValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#667eea",
    marginBottom: 4,
  },
  analyticsDescription: {
    fontSize: 12,
    color: "#6b7280",
    lineHeight: 16,
  },
  performanceSection: {
    marginBottom: 24,
  },
  performanceCard: {
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
  performanceTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: 16,
  },
  topPerformer: {
    flexDirection: "row",
    alignItems: "center",
  },
  performerInfo: {
    marginLeft: 12,
    flex: 1,
  },
  performerName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: 4,
  },
  performerStats: {
    fontSize: 14,
    color: "#6b7280",
  },
  memberEfficiencyList: {
    marginTop: 16,
  },
  efficiencyTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: 12,
  },
  efficiencyItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  efficiencyRank: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#f3f4f6",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  rankNumber: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#1f2937",
  },
  efficiencyInfo: {
    flex: 1,
  },
  efficiencyName: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: 2,
  },
  efficiencyValue: {
    fontSize: 12,
    color: "#6b7280",
  },
  chartContainer: {
    marginBottom: 24,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: 16,
  },
  contributionItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 8,
  },
  contributionName: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#1f2937",
  },
  contributionAmount: {
    fontSize: 12,
    color: "#6b7280",
  },
  growthSection: {
    marginBottom: 24,
  },
  growthGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  growthCard: {
    flex: 1,
    minWidth: 150,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 12,
  },
  growthValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1f2937",
    marginTop: 8,
    marginBottom: 4,
  },
  growthLabel: {
    fontSize: 12,
    color: "#6b7280",
    textAlign: "center",
    lineHeight: 16,
  },
  unauthorizedContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  unauthorizedText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#ef4444",
    marginBottom: 16,
  },
  unauthorizedSubtext: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.9)",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#ef4444",
    marginBottom: 16,
  },
  retryButton: {
    padding: 16,
    borderRadius: 8,
    backgroundColor: "#667eea",
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    width: "90%",
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: 20,
    textAlign: "center",
  },
  modalInput: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    marginHorizontal: 8,
  },
  cancelButton: {
    backgroundColor: "#f3f4f6",
  },
  addButton: {
    backgroundColor: "#667eea",
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#6b7280",
    textAlign: "center",
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
    textAlign: "center",
  },
});
