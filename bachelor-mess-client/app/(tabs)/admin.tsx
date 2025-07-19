import { RecentActivity } from "@/components/dashboard/RecentActivity";
import {
  BarChart,
  LineChart,
  PieChart,
  ProgressChart,
  StatsGrid,
} from "@/components/ModernCharts";
import { ThemedText } from "@/components/ThemedText";
import { useMessData } from "@/context/MessDataContext";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useRef, useState } from "react";
import {
  Alert,
  Animated,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

interface PendingApproval {
  id: string;
  type: "meal" | "bazar";
  memberName: string;
  description: string;
  amount?: number;
  date: string;
  status: "pending" | "approved" | "rejected";
}

export default function AdminScreen() {
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  const [activeTab, setActiveTab] = useState<
    "overview" | "members" | "approvals" | "reports"
  >("overview");
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [showAllActivities, setShowAllActivities] = useState(false);
  const [newMember, setNewMember] = useState({
    name: "",
    email: "",
    phone: "",
    role: "member" as "admin" | "member",
  });

  // Get data from context
  const {
    members,
    activeMembers,
    pendingBazar,
    approvedBazar,
    monthlyRevenueData,
    expenseBreakdownData,
    memberActivityData,
    quickStats,
    addMember,
    updateMemberStatus,
    approveBazar,
  } = useMessData();

  // Convert members to the format expected by the admin screen
  const [pendingApprovals, setPendingApprovals] = useState<PendingApproval[]>(
    pendingBazar.map((bazar) => ({
      id: bazar.id,
      type: "bazar",
      memberName: bazar.submittedBy,
      description: bazar.items.join(", "),
      amount: bazar.totalAmount,
      date: bazar.date,
      status: bazar.status,
    }))
  );

  // Chart data
  const memberPerformanceData = activeMembers.slice(0, 5).map((member) => ({
    label: member.name.split(" ")[0],
    value: member.totalMeals,
    color: member.role === "admin" ? "#667eea" : "#f093fb",
    gradient:
      member.role === "admin"
        ? (["#667eea", "#764ba2"] as const)
        : (["#f093fb", "#f5576c"] as const),
  }));

  const quickStatsForAdmin = [
    {
      title: "Total Members",
      value: activeMembers.length.toString(),
      icon: "people",
      gradient: ["#667eea", "#764ba2"] as const,
    },
    {
      title: "Pending Approvals",
      value: pendingBazar.length.toString(),
      icon: "time",
      gradient: ["#f093fb", "#f5576c"] as const,
    },
    {
      title: "Total Revenue",
      value: `৳${activeMembers
        .reduce((sum, m) => sum + m.totalContribution, 0)
        .toLocaleString()}`,
      icon: "cash",
      gradient: ["#43e97b", "#38f9d7"] as const,
    },
  ];

  const filteredMembers = activeMembers.filter(
    (member) =>
      member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredApprovals = pendingApprovals.filter(
    (approval) =>
      approval.memberName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      approval.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleApprove = (id: string) => {
    Alert.alert("Approve", `Approve item ${id}?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Approve",
        onPress: () => {
          approveBazar(id, "Admin");
          setPendingApprovals((prev) =>
            prev.map((item) =>
              item.id === id ? { ...item, status: "approved" as const } : item
            )
          );
          Alert.alert("Success", "Item approved successfully!");
        },
      },
    ]);
  };

  const handleReject = (id: string) => {
    Alert.alert("Reject", `Reject item ${id}?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Reject",
        onPress: () => {
          setPendingApprovals((prev) =>
            prev.map((item) =>
              item.id === id ? { ...item, status: "rejected" as const } : item
            )
          );
          Alert.alert("Success", "Item rejected successfully!");
        },
      },
    ]);
  };

  const handleMemberStatusToggle = (memberId: string) => {
    const member = activeMembers.find((m) => m.id === memberId);
    if (!member) return;

    const newStatus = member.status === "active" ? "inactive" : "active";
    updateMemberStatus(memberId, newStatus);

    Alert.alert("Status Updated", `${member.name} is now ${newStatus}`, [
      { text: "OK" },
    ]);
  };

  const handleAddMember = () => {
    if (!newMember.name || !newMember.email || !newMember.phone) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    addMember({
      name: newMember.name,
      email: newMember.email,
      phone: newMember.phone,
      role: newMember.role,
      joinDate: new Date().toISOString().split("T")[0],
      status: "active",
      totalMeals: 0,
      totalContribution: 0,
      monthlyContribution: 500,
      lastPaymentDate: new Date().toISOString().split("T")[0],
    });

    setNewMember({ name: "", email: "", phone: "", role: "member" });
    setShowAddMemberModal(false);
    Alert.alert("Success", "Member added successfully!");
  };

  const handleDeleteMember = (memberId: string) => {
    const member = activeMembers.find((m) => m.id === memberId);
    if (!member) return;

    Alert.alert(
      "Delete Member",
      `Are you sure you want to delete ${member.name}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            updateMemberStatus(memberId, "inactive");
            Alert.alert("Success", "Member deleted successfully!");
          },
        },
      ]
    );
  };

  const handleSeeMoreActivities = () => {
    console.log("Admin: See More Activities button pressed");
    router.push("/recent-activity");
  };

  const formatCurrency = (value: number) => {
    return `৳${value.toLocaleString()}`;
  };

  const renderOverview = () => (
    <View>
      {/* Quick Stats */}
      <StatsGrid stats={quickStatsForAdmin} />

      {/* Member Performance Chart */}
      <View style={styles.chartContainer}>
        <BarChart
          data={memberPerformanceData}
          title="Member Performance (Total Meals)"
          height={220}
        />
      </View>

      {/* Monthly Revenue Trend */}
      <View style={styles.chartContainer}>
        {/* Enhanced Header */}
        <View style={styles.chartHeader}>
          <View style={styles.chartTitleContainer}>
            <View style={styles.chartIconContainer}>
              <Ionicons name="trending-up" size={20} color="#fff" />
            </View>
            <View style={styles.chartTitleContent}>
              <ThemedText style={styles.chartTitle}>
                Monthly Revenue Trend
              </ThemedText>
              <ThemedText style={styles.chartSubtitle}>
                Financial performance over time
              </ThemedText>
            </View>
          </View>
          <View style={styles.chartActions}>
            <TouchableOpacity style={styles.chartActionButton}>
              <Ionicons name="download-outline" size={18} color="#667eea" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.chartActionButton}>
              <Ionicons name="share-outline" size={18} color="#667eea" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Revenue Summary Cards */}
        <View style={styles.revenueSummary}>
          <View style={styles.summaryCard}>
            <LinearGradient
              colors={["#667eea", "#764ba2"]}
              style={styles.summaryGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.summaryIconContainer}>
                <Ionicons name="cash-outline" size={16} color="#fff" />
              </View>
              <View style={styles.summaryContent}>
                <ThemedText style={styles.summaryValue}>
                  ৳
                  {monthlyRevenueData
                    .reduce((sum, item) => sum + item.value, 0)
                    .toLocaleString()}
                </ThemedText>
                <ThemedText style={styles.summaryLabel}>
                  Total Revenue
                </ThemedText>
              </View>
            </LinearGradient>
          </View>

          <View style={styles.summaryCard}>
            <LinearGradient
              colors={["#10b981", "#059669"]}
              style={styles.summaryGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.summaryIconContainer}>
                <Ionicons name="trending-up" size={16} color="#fff" />
              </View>
              <View style={styles.summaryContent}>
                <ThemedText style={styles.summaryValue}>
                  +
                  {Math.round(
                    (((monthlyRevenueData[monthlyRevenueData.length - 1]
                      ?.value || 0) -
                      (monthlyRevenueData[0]?.value || 0)) /
                      (monthlyRevenueData[0]?.value || 1)) *
                      100
                  )}
                  %
                </ThemedText>
                <ThemedText style={styles.summaryLabel}>Growth Rate</ThemedText>
              </View>
            </LinearGradient>
          </View>

          <View style={styles.summaryCard}>
            <LinearGradient
              colors={["#f59e0b", "#d97706"]}
              style={styles.summaryGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.summaryIconContainer}>
                <Ionicons name="analytics-outline" size={16} color="#fff" />
              </View>
              <View style={styles.summaryContent}>
                <ThemedText style={styles.summaryValue}>
                  ৳
                  {Math.round(
                    monthlyRevenueData.reduce(
                      (sum, item) => sum + item.value,
                      0
                    ) / monthlyRevenueData.length
                  ).toLocaleString()}
                </ThemedText>
                <ThemedText style={styles.summaryLabel}>Avg/Month</ThemedText>
              </View>
            </LinearGradient>
          </View>
        </View>

        {/* Enhanced Chart */}
        <View style={styles.chartWrapper}>
          <LineChart
            data={monthlyRevenueData.map((item, index) => ({
              date: item.date,
              value: item.value,
              forecast: item.forecast,
              details: {
                month: item.date,
                revenue: item.value,
                expenses: Math.round(item.value * 0.85),
                profit: Math.round(item.value * 0.15),
                memberCount: 6 + Math.floor(Math.random() * 2),
                averageMeals: 2.0 + Math.random() * 0.8,
                efficiency: Math.round(
                  ((item.value * 0.15) / item.value) * 100
                ),
                growthRate:
                  index > 0
                    ? Math.round(
                        ((item.value - monthlyRevenueData[index - 1].value) /
                          monthlyRevenueData[index - 1].value) *
                          100
                      )
                    : 0,
                costPerMeal: Math.round((item.value * 0.85) / (6 * 2.5 * 30)),
                revenuePerMember: Math.round(item.value / 6),
              },
            }))}
            title="Monthly Revenue Trend (৳)"
            color="#667eea"
            onPointPress={(item) => {
              const details = item.details || {};
              const growthEmoji = details.growthRate >= 0 ? "📈" : "📉";
              const efficiencyEmoji =
                details.efficiency >= 80
                  ? "🟢"
                  : details.efficiency >= 60
                  ? "🟡"
                  : "🔴";

              Alert.alert(
                `${item.date} - Revenue Analysis`,
                `${growthEmoji} Revenue: ${formatCurrency(item.value)}\n` +
                  `💰 Expenses: ${formatCurrency(details.expenses || 0)}\n` +
                  `💵 Profit: ${formatCurrency(details.profit || 0)}\n` +
                  `📊 Efficiency: ${efficiencyEmoji} ${
                    details.efficiency || 0
                  }%\n` +
                  `👥 Members: ${details.memberCount || 0}\n` +
                  `🍽️ Avg Meals/Day: ${details.averageMeals || 0}\n` +
                  `💸 Cost/Meal: ${formatCurrency(
                    details.costPerMeal || 0
                  )}\n` +
                  `👤 Revenue/Member: ${formatCurrency(
                    details.revenuePerMember || 0
                  )}\n` +
                  `📈 Growth Rate: ${details.growthRate >= 0 ? "+" : ""}${
                    details.growthRate || 0
                  }%`
              );
            }}
          />
        </View>

        {/* Chart Legend */}
        <View style={styles.chartLegend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: "#667eea" }]} />
            <ThemedText style={styles.legendText}>Actual Revenue</ThemedText>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: "#f59e0b" }]} />
            <ThemedText style={styles.legendText}>Forecast</ThemedText>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: "#10b981" }]} />
            <ThemedText style={styles.legendText}>Target</ThemedText>
          </View>
        </View>
      </View>

      {/* Progress Charts */}
      <View style={styles.progressSection}>
        <ThemedText style={styles.sectionTitle}>Monthly Goals</ThemedText>
        <ProgressChart
          title="Revenue Target"
          current={activeMembers.reduce(
            (sum, m) => sum + m.totalContribution,
            0
          )}
          target={50000}
          gradient={["#667eea", "#764ba2"]}
        />
        <ProgressChart
          title="Member Participation"
          current={activeMembers.filter((m) => m.status === "active").length}
          target={activeMembers.length}
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
      <View style={styles.chartContainer}>
        <PieChart data={expenseBreakdownData} title="Expense Breakdown (%)" />
      </View>

      {/* Recent Activity */}
      <RecentActivity
        activities={pendingApprovals
          .filter((a) => a.status === "pending")
          .map((approval) => ({
            id: approval.id,
            title: `${
              approval.type.charAt(0).toUpperCase() + approval.type.slice(1)
            } Submission`,
            description: approval.description,
            time: approval.date,
            icon: approval.type === "meal" ? "restaurant" : "cart",
            amount: approval.amount,
          }))}
        maxItems={showAllActivities ? undefined : 3}
      />
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
          <View key={member.id} style={styles.memberCard}>
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
                  onValueChange={() => handleMemberStatusToggle(member.id)}
                  trackColor={{ false: "#e5e7eb", true: "#10b981" }}
                  thumbColor={member.status === "active" ? "#fff" : "#9ca3af"}
                />
                <Pressable
                  style={styles.deleteButton}
                  onPress={() => handleDeleteMember(member.id)}
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
          <View key={approval.id} style={styles.approvalCard}>
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
                    onPress={() => handleApprove(approval.id)}
                  >
                    <Ionicons name="checkmark" size={16} color="#fff" />
                    <ThemedText style={styles.actionButtonText}>
                      Approve
                    </ThemedText>
                  </Pressable>
                  <Pressable
                    style={[styles.actionButton, styles.rejectButton]}
                    onPress={() => handleReject(approval.id)}
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

  return (
    <View style={{ flex: 1 }}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
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
                Manage your mess efficiently
              </ThemedText>
            </View>
            <View style={styles.headerIcon}>
              <Ionicons name="settings" size={32} color="#fff" />
            </View>
          </View>
        </LinearGradient>

        {/* Tab Navigation */}
        <View style={styles.tabContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {[
              { key: "overview", title: "Overview", icon: "stats-chart" },
              { key: "members", title: "Members", icon: "people" },
              {
                key: "approvals",
                title: "Approvals",
                icon: "checkmark-done-circle",
              },
              { key: "reports", title: "Reports", icon: "document-text" },
            ].map((tab) => (
              <Pressable
                key={tab.key}
                style={[styles.tab, activeTab === tab.key && styles.activeTab]}
                onPress={() => setActiveTab(tab.key as any)}
              >
                <Ionicons
                  name={tab.icon as any}
                  size={20}
                  color={activeTab === tab.key ? "#667eea" : "#9ca3af"}
                />
                <ThemedText
                  style={[
                    styles.tabText,
                    activeTab === tab.key && styles.activeTabText,
                  ]}
                >
                  {tab.title}
                </ThemedText>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        <View style={styles.content}>
          {activeTab === "overview" && renderOverview()}
          {activeTab === "members" && renderMembers()}
          {activeTab === "approvals" && renderApprovals()}
          {activeTab === "reports" && renderReports()}
        </View>
      </ScrollView>
    </View>
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
  tab: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginRight: 8,
    borderRadius: 12,
  },
  activeTab: {
    backgroundColor: "#eef2ff",
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#9ca3af",
    marginLeft: 8,
  },
  activeTabText: {
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
  activityHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  seeMoreButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  seeMoreText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#667eea",
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
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    width: "100%",
    maxWidth: 400,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
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
  },
  modalBody: {
    marginBottom: 20,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: "#1f2937",
    marginBottom: 12,
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
  chartContainer: {
    marginBottom: 24,
  },
  chartHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  chartTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  chartIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#667eea",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#667eea",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  chartTitleContent: {
    marginLeft: 12,
    flex: 1,
  },
  chartTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1f2937",
    marginBottom: 2,
  },
  chartSubtitle: {
    fontSize: 13,
    color: "#6b7280",
    fontWeight: "500",
  },
  chartActions: {
    flexDirection: "row",
    gap: 12,
  },
  chartActionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f8fafc",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  revenueSummary: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  summaryGradient: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 16,
    minHeight: 80,
  },
  summaryIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  summaryContent: {
    flex: 1,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 11,
    color: "rgba(255, 255, 255, 0.9)",
    fontWeight: "500",
  },
  chartWrapper: {
    height: 300,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  chartLegend: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 20,
    paddingHorizontal: 20,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "#f8fafc",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  legendText: {
    fontSize: 13,
    color: "#374151",
    fontWeight: "500",
  },
});
