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
import { useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  TextInput,
  View,
} from "react-native";

interface Member {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: "admin" | "member";
  joinDate: string;
  status: "active" | "inactive";
  totalMeals: number;
  totalContribution: number;
}

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
  const [activeTab, setActiveTab] = useState<
    "overview" | "members" | "approvals" | "reports"
  >("overview");
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [newMember, setNewMember] = useState({
    name: "",
    email: "",
    phone: "",
    role: "member" as "admin" | "member",
  });

  // Mock data - replace with real API data
  const [members, setMembers] = useState<Member[]>([
    {
      id: "1",
      name: "Mahbub Rahman",
      email: "mahbub@example.com",
      phone: "+880 1712345678",
      role: "admin",
      joinDate: "2024-01-01",
      status: "active",
      totalMeals: 87,
      totalContribution: 3200,
    },
    {
      id: "2",
      name: "Rahim Khan",
      email: "rahim@example.com",
      phone: "+880 1812345678",
      role: "member",
      joinDate: "2024-01-05",
      status: "active",
      totalMeals: 76,
      totalContribution: 2800,
    },
    {
      id: "3",
      name: "Karim Ahmed",
      email: "karim@example.com",
      phone: "+880 1912345678",
      role: "member",
      joinDate: "2024-01-10",
      status: "active",
      totalMeals: 82,
      totalContribution: 3100,
    },
    {
      id: "4",
      name: "Salam Ali",
      email: "salam@example.com",
      phone: "+880 1612345678",
      role: "member",
      joinDate: "2024-01-15",
      status: "inactive",
      totalMeals: 45,
      totalContribution: 1800,
    },
  ]);

  const [pendingApprovals, setPendingApprovals] = useState<PendingApproval[]>([
    {
      id: "1",
      type: "meal",
      memberName: "Rahim Khan",
      description: "Breakfast, Lunch, Dinner for 2024-01-16",
      date: "2024-01-16",
      status: "pending",
    },
    {
      id: "2",
      type: "bazar",
      memberName: "Karim Ahmed",
      description: "Rice, Vegetables, Meat",
      amount: 1200,
      date: "2024-01-15",
      status: "pending",
    },
    {
      id: "3",
      type: "meal",
      memberName: "Mahbub Rahman",
      description: "Lunch, Dinner for 2024-01-16",
      date: "2024-01-16",
      status: "pending",
    },
  ]);

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

  const handleApprove = (id: string) => {
    Alert.alert("Approve", `Approve item ${id}?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Approve",
        onPress: () => {
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
    Alert.alert("Toggle Status", "Change member status?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Toggle",
        onPress: () => {
          setMembers((prev) =>
            prev.map((member) =>
              member.id === memberId
                ? {
                    ...member,
                    status: member.status === "active" ? "inactive" : "active",
                  }
                : member
            )
          );
          Alert.alert("Success", "Member status updated successfully!");
        },
      },
    ]);
  };

  const handleAddMember = () => {
    if (!newMember.name || !newMember.email || !newMember.phone) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    const newMemberData: Member = {
      id: Date.now().toString(),
      name: newMember.name,
      email: newMember.email,
      phone: newMember.phone,
      role: newMember.role,
      joinDate: new Date().toISOString().split("T")[0],
      status: "active",
      totalMeals: 0,
      totalContribution: 0,
    };

    setMembers((prev) => [...prev, newMemberData]);
    setNewMember({ name: "", email: "", phone: "", role: "member" });
    setShowAddMemberModal(false);
    Alert.alert("Success", "Member added successfully!");
  };

  const handleDeleteMember = (memberId: string) => {
    Alert.alert(
      "Delete Member",
      "Are you sure you want to delete this member?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            setMembers((prev) =>
              prev.filter((member) => member.id !== memberId)
            );
            Alert.alert("Success", "Member deleted successfully!");
          },
        },
      ]
    );
  };

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
              <View key={approval.id} style={styles.activityCard}>
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
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <LinearGradient
        colors={["#667eea", "#764ba2"]}
        style={styles.headerGradient}
      >
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <ThemedText style={styles.headerTitle}>Admin Dashboard</ThemedText>
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
});
