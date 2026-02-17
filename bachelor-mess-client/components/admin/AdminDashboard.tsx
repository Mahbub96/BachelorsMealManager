import { useFocusEffect } from 'expo-router';
import React, {
  useState,
  useEffect,
  useMemo,
  useRef,
  useCallback,
} from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Dimensions,
  Modal,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ModernLoader } from '../ui/ModernLoader';
import { ThemedView } from '../ThemedView';
import { ThemedText } from '../ThemedText';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { EnhancedMealManagement } from '../meals/EnhancedMealManagement';
import dashboardService from '../../services/dashboardService';
import statisticsService from '../../services/statisticsService';
import { useUsers } from '../../hooks/useUsers';
import userService, {
  User,
  CreateUserData,
  UpdateUserData,
} from '../../services/userService';
import { MemberFormModal } from './MemberFormModal';
import { MemberViewModal } from './MemberViewModal';

type AdminDashboardProps = Record<string, never>;

interface AdminStats {
  totalMeals: number;
  pendingApprovals: number;
  approvedMeals: number;
  totalMembers: number;
  todayMeals: number;
  mealRate: number;
  totalBazarAmount: number;
}

const { width } = Dimensions.get('window');

export const AdminDashboard: React.FC<AdminDashboardProps> = () => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [adminStats, setAdminStats] = useState<AdminStats>({
    totalMeals: 0,
    pendingApprovals: 0,
    approvedMeals: 0,
    totalMembers: 0,
    todayMeals: 0,
    mealRate: 0,
    totalBazarAmount: 0,
  });
  const [activeTab, setActiveTab] = useState<'overview' | 'meals' | 'members'>(
    'overview'
  );
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [editingMember, setEditingMember] = useState<User | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewingMember, setViewingMember] = useState<User | null>(null);
  const [members, setMembers] = useState<User[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [submittingMember, setSubmittingMember] = useState(false);
  const [deletingMemberId, setDeletingMemberId] = useState<string | null>(null);
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
  const [resettingPasswordFor, setResettingPasswordFor] = useState<
    string | null
  >(null);
  const [newPassword, setNewPassword] = useState('');
  const [resettingPassword, setResettingPassword] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const { createUser } = useUsers();
  const isMountedRef = useRef(true);

  const loadAdminStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch dashboard stats and complete statistics in parallel
      const [dashboardResponse, statisticsResponse] = await Promise.all([
        dashboardService.getStats(),
        statisticsService.getCompleteStatistics(),
      ]);

      if (!dashboardResponse.success || !dashboardResponse.data) {
        throw new Error(
          dashboardResponse.error || 'Failed to load dashboard stats'
        );
      }

      const stats = dashboardResponse.data;
      const completeStats = statisticsResponse.success
        ? statisticsResponse.data
        : null;

      // Calculate meal rate: totalBazarAmount / totalMeals
      const mealRate =
        stats.totalMeals > 0 && stats.totalBazarAmount > 0
          ? stats.totalBazarAmount / stats.totalMeals
          : 0;

      // Get today's meals count from monthly statistics
      const todayMeals =
        completeStats?.monthly?.currentMonth?.meals?.total || 0;

      // Get approved meals from statistics
      const approvedMeals =
        completeStats?.meals?.approvedMeals ||
        stats.totalMeals - stats.pendingMeals;

      setAdminStats({
        totalMeals: stats.totalMeals || 0,
        pendingApprovals: stats.pendingMeals || 0,
        approvedMeals: approvedMeals,
        totalMembers: stats.totalMembers || 0,
        todayMeals: todayMeals,
        mealRate: mealRate,
        totalBazarAmount: stats.totalBazarAmount || 0,
      });
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to load admin statistics';
      setError(errorMessage);
      // Error loading stats - non-critical
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, []);

  const loadMembers = useCallback(async (forceRefresh = false) => {
    try {
      setLoadingMembers(true);
      setError(null); // Clear previous errors

      // Clear cache if force refresh is requested
      if (forceRefresh) {
        try {
          await userService.clearUserCache();
        } catch {
          // Continue even if cache clear fails
        }
      }

      const response = await userService.getAllUsers({ role: 'member' });

      if (response.success && response.data) {
        const membersList = Array.isArray(response.data) ? response.data : [];
        if (isMountedRef.current) setMembers(membersList);
      } else {
        const errorMsg = response.error || 'Failed to load members';
        if (isMountedRef.current) {
          setError(errorMsg);
          setMembers([]);
        }
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to load members';
      console.error('AdminDashboard - Error loading members:', err);
      if (isMountedRef.current) {
        setError(errorMessage);
        setMembers([]);
      }
    } finally {
      if (isMountedRef.current) setLoadingMembers(false);
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (user?.role === 'admin' || user?.role === 'super_admin') {
        const loadData = async () => {
          if (activeTab === 'overview') {
            await loadAdminStats();
          } else if (activeTab === 'members') {
            await loadMembers(true);
          }
        };
        loadData();
      }
    }, [user?.role, activeTab, loadAdminStats, loadMembers])
  );

  // Memoized stat cards (must be before any conditional return to satisfy rules-of-hooks)
  const statCards = useMemo(
    () => [
      {
        icon: 'fast-food' as const,
        value: adminStats.totalMeals,
        label: 'Total Meals',
        colors: theme.gradient.success as [string, string],
      },
      {
        icon: 'time' as const,
        value: adminStats.pendingApprovals,
        label: 'Pending',
        colors: theme.gradient.warning as [string, string],
      },
      {
        icon: 'checkmark-circle' as const,
        value: adminStats.approvedMeals,
        label: 'Approved',
        colors: theme.gradient.secondary as [string, string],
      },
      {
        icon: 'people' as const,
        value: adminStats.totalMembers,
        label: 'Members',
        colors: theme.gradient.info as [string, string],
      },
      {
        icon: 'calculator' as const,
        value:
          adminStats.mealRate > 0
            ? `৳${adminStats.mealRate.toFixed(2)}`
            : 'N/A',
        label: 'Meal Rate',
        colors: theme.gradient.warning as [string, string],
      },
      {
        icon: 'calendar' as const,
        value: adminStats.todayMeals,
        label: 'Today Meals',
        colors: theme.gradient.success as [string, string],
      },
    ],
    [adminStats, theme]
  );

  // Access control
  if (user?.role !== 'admin' && user?.role !== 'super_admin') {
    return (
      <ThemedView style={styles.accessDeniedContainer}>
        <LinearGradient
          colors={theme.gradient.info as [string, string]}
          style={styles.accessDeniedGradient}
        >
          <Ionicons name='shield' size={80} color='#fff' />
          <ThemedText style={styles.accessDeniedTitle}>
            Access Denied
          </ThemedText>
          <ThemedText style={styles.accessDeniedText}>
            This area is restricted to Administrators only.
          </ThemedText>
        </LinearGradient>
      </ThemedView>
    );
  }

  const handleRefresh = async () => {
    setRefreshing(true);
    // Clear cache before refreshing to get latest data
    try {
      await userService.clearUserCache();
    } catch {
      // Continue even if cache clear fails
    }
    await Promise.all([loadAdminStats(), loadMembers()]);
    setRefreshing(false);
  };

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'approve-all':
        Alert.alert(
          'Approve All',
          'Are you sure you want to approve all pending meals?',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Approve All',
              onPress: () => {},
            },
          ]
        );
        break;
      case 'export-data':
        Alert.alert('Export Data', 'Exporting meal data...', [
          { text: 'OK', onPress: () => {} },
        ]);
        break;
      case 'send-notification':
        Alert.alert('Send Notification', 'Send notification to all members?', [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Send', onPress: () => {} },
        ]);
        break;
    }
  };

  const renderOverview = () => (
    <ScrollView
      style={styles.scrollView}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
    >
      {/* Header */}
      <LinearGradient
        colors={theme.gradient.info as [string, string]}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerIconContainer}>
            <Ionicons name='shield' size={40} color='#fff' />
          </View>
          <View style={styles.headerText}>
            <ThemedText style={styles.headerTitle}>Admin Dashboard</ThemedText>
            <ThemedText style={styles.headerSubtitle}>
              Meal Management Center
            </ThemedText>
          </View>
        </View>
      </LinearGradient>

      {/* Loading State */}
      {loading && (
        <View style={{ height: 200 }}>
           <ModernLoader visible={true} text="Loading statistics..." overlay={false} />
        </View>
      )}

      {/* Error State */}
      {error && !loading && (
        <View style={styles.errorContainer}>
          <Ionicons name='alert-circle' size={48} color={theme.status.error} />
          <ThemedText style={[styles.errorText, { color: theme.status.error }]}>
            {error}
          </ThemedText>
          <TouchableOpacity
            style={[
              styles.retryButton,
              { backgroundColor: theme.button.primary.background },
            ]}
            onPress={loadAdminStats}
          >
            <ThemedText
              style={[
                styles.retryButtonText,
                { color: theme.button.primary.text },
              ]}
            >
              Retry
            </ThemedText>
          </TouchableOpacity>
        </View>
      )}

      {/* Stats Grid */}
      {!loading && !error && (
        <>
          <View style={styles.statsGrid}>
            {statCards.map((card, index) => (
              <View key={index} style={styles.statCard}>
                <LinearGradient
                  colors={card.colors}
                  style={styles.statGradient}
                >
                  <Ionicons name={card.icon} size={28} color='#fff' />
                  <ThemedText style={styles.statValue}>{card.value}</ThemedText>
                  <ThemedText style={styles.statLabel}>{card.label}</ThemedText>
                </LinearGradient>
              </View>
            ))}
          </View>

          {/* Quick Actions */}
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Quick Actions</ThemedText>
            <View style={styles.actionsGrid}>
              <TouchableOpacity
                style={styles.actionCard}
                onPress={() => handleQuickAction('approve-all')}
              >
                <LinearGradient
                  colors={theme.gradient.success as [string, string]}
                  style={styles.actionGradient}
                >
                  <Ionicons name='checkmark-circle' size={36} color='#fff' />
                  <ThemedText style={styles.actionTitle}>
                    Approve All
                  </ThemedText>
                  <ThemedText style={styles.actionSubtitle}>
                    Approve pending meals
                  </ThemedText>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionCard}
                onPress={() => handleQuickAction('export-data')}
              >
                <LinearGradient
                  colors={theme.gradient.warning as [string, string]}
                  style={styles.actionGradient}
                >
                  <Ionicons name='download' size={36} color='#fff' />
                  <ThemedText style={styles.actionTitle}>
                    Export Data
                  </ThemedText>
                  <ThemedText style={styles.actionSubtitle}>
                    Export meal reports
                  </ThemedText>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionCard}
                onPress={() => handleQuickAction('send-notification')}
              >
                <LinearGradient
                  colors={theme.gradient.primary as [string, string]}
                  style={styles.actionGradient}
                >
                  <Ionicons name='notifications' size={36} color='#fff' />
                  <ThemedText style={styles.actionTitle}>
                    Send Notification
                  </ThemedText>
                  <ThemedText style={styles.actionSubtitle}>
                    Notify all members
                  </ThemedText>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionCard}
                onPress={() => setActiveTab('meals')}
              >
                <LinearGradient
                  colors={theme.gradient.secondary as [string, string]}
                  style={styles.actionGradient}
                >
                  <Ionicons name='fast-food' size={36} color='#fff' />
                  <ThemedText style={styles.actionTitle}>
                    Manage Meals
                  </ThemedText>
                  <ThemedText style={styles.actionSubtitle}>
                    View all meals
                  </ThemedText>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>

          {/* Today's Summary */}
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>
              Today&apos;s Summary
            </ThemedText>
            <View
              style={[
                styles.summaryCard,
                {
                  backgroundColor: theme.cardBackground,
                  borderColor: theme.cardBorder,
                  borderWidth: 1,
                },
              ]}
            >
              <View style={styles.summaryGradient}>
                <View style={styles.summaryRow}>
                  <View style={styles.summaryItem}>
                    <Ionicons
                      name='sunny'
                      size={24}
                      color={theme.status.warning}
                    />
                    <ThemedText
                      style={[
                        styles.summaryLabel,
                        { color: theme.text.secondary },
                      ]}
                    >
                      Breakfast
                    </ThemedText>
                    <ThemedText style={styles.summaryValue}>-</ThemedText>
                  </View>
                  <View style={styles.summaryItem}>
                    <Ionicons
                      name='partly-sunny'
                      size={24}
                      color={theme.status.warning}
                    />
                    <ThemedText
                      style={[
                        styles.summaryLabel,
                        { color: theme.text.secondary },
                      ]}
                    >
                      Lunch
                    </ThemedText>
                    <ThemedText style={styles.summaryValue}>-</ThemedText>
                  </View>
                  <View style={styles.summaryItem}>
                    <Ionicons name='moon' size={24} color={theme.primary} />
                    <ThemedText
                      style={[
                        styles.summaryLabel,
                        { color: theme.text.secondary },
                      ]}
                    >
                      Dinner
                    </ThemedText>
                    <ThemedText style={styles.summaryValue}>-</ThemedText>
                  </View>
                </View>
                <View
                  style={[
                    styles.summaryTotal,
                    { borderTopColor: theme.border.secondary },
                  ]}
                >
                  <ThemedText style={styles.summaryTotalLabel}>
                    Total Today
                  </ThemedText>
                  <ThemedText
                    style={[styles.summaryTotalValue, { color: theme.primary }]}
                  >
                    {adminStats.todayMeals} meals
                  </ThemedText>
                </View>
              </View>
            </View>
          </View>
        </>
      )}
    </ScrollView>
  );

  const renderMeals = () => (
    <View style={styles.tabContent}>
      <ThemedText style={styles.tabTitle}>Meal Management</ThemedText>
      <ThemedText style={styles.tabSubtitle}>
        Manage and approve meal submissions
      </ThemedText>
      <EnhancedMealManagement />
    </View>
  );

  const handleOpenAddModal = () => {
    setModalMode('add');
    setEditingMember(null);
    setShowMemberModal(true);
  };

  const handleOpenEditModal = (member: User) => {
    setModalMode('edit');
    setEditingMember(member);
    setShowMemberModal(true);
  };

  const handleOpenViewModal = (member: User) => {
    setViewingMember(member);
    setShowViewModal(true);
  };

  const handleCloseViewModal = () => {
    setShowViewModal(false);
    setViewingMember(null);
  };

  const handleEditFromView = () => {
    if (viewingMember) {
      setShowViewModal(false);
      handleOpenEditModal(viewingMember);
    }
  };

  const handleCloseModal = () => {
    if (!submittingMember) {
      setShowMemberModal(false);
      setEditingMember(null);
    }
  };

  const handleSubmitMember = async (data: CreateUserData | UpdateUserData) => {
    if (!isMountedRef.current) return;

    setSubmittingMember(true);
    try {
      if (modalMode === 'add') {
        // Clean data - remove empty phone
        const cleanedData: CreateUserData = {
          name: data.name!.trim(),
          email: data.email!.trim().toLowerCase(),
          password: (data as CreateUserData).password!,
          role: 'member',
          ...(data.phone?.trim() && { phone: data.phone.trim() }),
        };

        const success = await createUser(cleanedData);

        if (!isMountedRef.current) return;

        if (success) {
          setShowMemberModal(false);
          setEditingMember(null);

          // Refresh data
          setTimeout(async () => {
            if (isMountedRef.current) {
              try {
                await Promise.all([loadMembers(true), loadAdminStats()]);
              } catch {
                // Don't show error to user
              }
            }
          }, 100);
        }
      } else {
        // Edit mode
        if (!editingMember) return;

        const response = await userService.updateUser(
          editingMember.id,
          data as UpdateUserData
        );

        if (response.success) {
          Alert.alert('Success', 'Member updated successfully');
          setShowMemberModal(false);
          setEditingMember(null);

          // Refresh members list
          setTimeout(() => {
            if (isMountedRef.current) {
              loadMembers(true);
            }
          }, 100);
        } else {
          Alert.alert('Error', response.error || 'Failed to update member');
        }
      }
    } catch (err) {
      if (!isMountedRef.current) return;

      const errorMessage =
        err instanceof Error
          ? err.message
          : `Failed to ${modalMode === 'add' ? 'create' : 'update'} member. Please try again.`;
      Alert.alert('Error', errorMessage);
    } finally {
      setSubmittingMember(false);
    }
  };

  const handleDeleteMember = (memberId: string) => {
    Alert.alert(
      'Delete Member',
      'Are you sure you want to delete this member? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            if (!isMountedRef.current) return;

            setDeletingMemberId(memberId);
            try {
              const response = await userService.deleteUser(memberId);

              if (response.success) {
                Alert.alert('Success', 'Member deleted successfully');

                // Refresh members list immediately
                if (isMountedRef.current) {
                  loadMembers(true);
                }
              } else {
                // Handle specific error cases
                if (
                  response.error?.includes('not found') ||
                  response.error?.includes('404')
                ) {
                  // User already deleted or doesn't exist - refresh list to sync
                  Alert.alert('Info', 'Member not found. Refreshing list...');
                  if (isMountedRef.current) {
                    loadMembers(true);
                  }
                } else {
                  Alert.alert(
                    'Error',
                    response.error || 'Failed to delete member'
                  );
                }
              }
            } catch (err) {
              const errorMessage =
                err instanceof Error
                  ? err.message
                  : 'Failed to delete member. Please try again.';

              // If it's a "not found" error, refresh the list
              if (
                errorMessage.includes('not found') ||
                errorMessage.includes('404')
              ) {
                Alert.alert('Info', 'Member not found. Refreshing list...');
                if (isMountedRef.current) {
                  loadMembers(true);
                }
              } else {
                Alert.alert('Error', errorMessage);
              }
            } finally {
              setDeletingMemberId(null);
            }
          },
        },
      ]
    );
  };

  const handleResetPassword = (memberId: string) => {
    setResettingPasswordFor(memberId);
    setNewPassword('');
    setShowResetPassword(false);
    setShowResetPasswordModal(true);
  };

  const handleConfirmResetPassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long');
      return;
    }

    if (!resettingPasswordFor || !isMountedRef.current) return;

    setResettingPassword(true);
    try {
      const response = await userService.resetUserPassword(
        resettingPasswordFor,
        newPassword
      );

      if (response.success) {
        Alert.alert('Success', 'Password reset successfully');
        setShowResetPasswordModal(false);
        setNewPassword('');
        setResettingPasswordFor(null);
        setShowResetPassword(false);
      } else {
        Alert.alert('Error', response.error || 'Failed to reset password');
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : 'Failed to reset password. Please try again.';
      Alert.alert('Error', errorMessage);
    } finally {
      setResettingPassword(false);
    }
  };

  const handleCancelResetPassword = () => {
    setShowResetPasswordModal(false);
    setNewPassword('');
    setResettingPasswordFor(null);
    setShowResetPassword(false);
  };

  const renderMembers = () => (
    <View style={styles.tabContent}>
      <View style={styles.membersHeader}>
        <View>
          <ThemedText style={styles.tabTitle}>Member Management</ThemedText>
          <ThemedText
            style={[styles.tabSubtitle, { color: theme.text.secondary }]}
          >
            {user?.role === 'super_admin'
              ? 'View and manage all members'
              : 'View and manage your members'}
          </ThemedText>
        </View>
        <TouchableOpacity style={styles.addButton} onPress={handleOpenAddModal}>
          <LinearGradient
            colors={theme.gradient.success as [string, string]}
            style={styles.addButtonGradient}
          >
            <Ionicons name='add' size={24} color='#fff' />
            <ThemedText style={styles.addButtonText}>Add Member</ThemedText>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {loadingMembers ? (
        <View style={styles.loadingContainer}>
          <ModernLoader size='large' overlay={false} />
          <ThemedText
            style={[styles.loadingText, { color: theme.text.secondary }]}
          >
            Loading members...
          </ThemedText>
        </View>
      ) : members.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons
            name='people-outline'
            size={64}
            color={theme.icon.secondary}
          />
          <ThemedText
            style={[styles.emptyText, { color: theme.text.secondary }]}
          >
            No members found
          </ThemedText>
          <ThemedText
            style={[styles.emptySubtext, { color: theme.text.tertiary }]}
          >
            Click &quot;Add Member&quot; to create your first member
          </ThemedText>
        </View>
      ) : (
        <ScrollView
          style={styles.membersList}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={loadMembers} />
          }
        >
          {members.map(member => (
            <TouchableOpacity
              key={member.id}
              style={[
                styles.memberCard,
                {
                  backgroundColor: theme.cardBackground,
                  borderColor: theme.cardBorder,
                },
              ]}
              onPress={() => handleOpenViewModal(member)}
              activeOpacity={0.7}
              disabled={submittingMember || deletingMemberId !== null}
            >
              <View style={styles.memberInfo}>
                <View
                  style={[
                    styles.memberAvatar,
                    { backgroundColor: theme.primary + '20' },
                  ]}
                >
                  <Ionicons name='person' size={24} color={theme.primary} />
                </View>
                <View style={styles.memberDetails}>
                  <ThemedText style={styles.memberName}>
                    {member.name}
                  </ThemedText>
                  <ThemedText
                    style={[
                      styles.memberEmail,
                      { color: theme.text.secondary },
                    ]}
                  >
                    {member.email}
                  </ThemedText>
                  {member.phone && (
                    <ThemedText
                      style={[
                        styles.memberPhone,
                        { color: theme.text.tertiary },
                      ]}
                    >
                      {member.phone}
                    </ThemedText>
                  )}
                  <View style={styles.memberStatus}>
                    <View
                      style={[
                        styles.statusDot,
                        member.status === 'active'
                          ? { backgroundColor: theme.status.success }
                          : { backgroundColor: theme.status.error },
                      ]}
                    />
                    <ThemedText
                      style={[
                        styles.statusText,
                        { color: theme.text.secondary },
                      ]}
                    >
                      {member.status}
                    </ThemedText>
                  </View>
                </View>
                <View style={styles.memberActions}>
                  <TouchableOpacity
                    onPress={() => handleOpenEditModal(member)}
                    style={[
                      styles.actionButton,
                      styles.editButton,
                      { backgroundColor: theme.primary + '20' },
                    ]}
                    disabled={submittingMember || deletingMemberId !== null}
                  >
                    <Ionicons name='pencil' size={18} color={theme.primary} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleDeleteMember(member.id)}
                    style={[
                      styles.actionButton,
                      styles.deleteButton,
                      { backgroundColor: theme.status.error + '20' },
                    ]}
                    disabled={
                      submittingMember ||
                      deletingMemberId !== null ||
                      deletingMemberId === member.id
                    }
                  >
                    {deletingMemberId === member.id ? (
                      <ModernLoader size='small' overlay={false} />
                    ) : (
                      <Ionicons
                        name='trash'
                        size={18}
                        color={theme.status.error}
                      />
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Unified Member Form Modal */}
      <MemberFormModal
        visible={showMemberModal}
        mode={modalMode}
        member={editingMember}
        onClose={handleCloseModal}
        onSubmit={handleSubmitMember}
        loading={submittingMember}
      />

      {/* Member View Modal */}
      <MemberViewModal
        visible={showViewModal}
        member={viewingMember}
        onClose={handleCloseViewModal}
        onEdit={handleEditFromView}
        onResetPassword={handleResetPassword}
      />

      {/* Reset Password Modal */}
      <Modal
        visible={showResetPasswordModal}
        animationType='slide'
        transparent={true}
        onRequestClose={handleCancelResetPassword}
      >
        <View style={styles.resetPasswordModalOverlay}>
          <View
            style={[
              styles.resetPasswordModalContent,
              { backgroundColor: theme.modal },
            ]}
          >
            <View
              style={[
                styles.resetPasswordModalHeader,
                { borderBottomColor: theme.border.secondary },
              ]}
            >
              <ThemedText style={styles.resetPasswordModalTitle}>
                Reset Password
              </ThemedText>
              <TouchableOpacity onPress={handleCancelResetPassword}>
                <Ionicons name='close' size={24} color={theme.icon.secondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.resetPasswordModalBody}>
              <ThemedText
                style={[
                  styles.resetPasswordModalText,
                  { color: theme.text.secondary },
                ]}
              >
                Enter a new password for this member (minimum 6 characters):
              </ThemedText>
              <View style={styles.resetPasswordInputContainer}>
                <TextInput
                  style={[
                    styles.resetPasswordInput,
                    {
                      backgroundColor: theme.input.background,
                      borderColor: theme.input.border,
                      color: theme.input.text,
                    },
                  ]}
                  placeholder='New password (min 6 characters)'
                  placeholderTextColor={theme.text.tertiary}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry={!showResetPassword}
                  autoFocus
                  maxLength={128}
                  autoCapitalize='none'
                  autoCorrect={false}
                />
                <TouchableOpacity
                  style={styles.resetPasswordEyeButton}
                  onPress={() => setShowResetPassword(!showResetPassword)}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={showResetPassword ? 'eye-off' : 'eye'}
                    size={20}
                    color={theme.text.secondary}
                  />
                </TouchableOpacity>
              </View>
              {newPassword.length > 0 && newPassword.length < 6 && (
                <ThemedText
                  style={[
                    styles.passwordErrorText,
                    { color: theme.status.error },
                  ]}
                >
                  Password must be at least 6 characters
                </ThemedText>
              )}
            </View>

            <View
              style={[
                styles.resetPasswordModalFooter,
                { borderTopColor: theme.border.secondary },
              ]}
            >
              <TouchableOpacity
                style={[
                  styles.resetPasswordCancelButton,
                  { borderColor: theme.border.secondary },
                ]}
                onPress={handleCancelResetPassword}
                disabled={resettingPassword}
              >
                <ThemedText
                  style={[
                    styles.resetPasswordCancelText,
                    { color: theme.text.secondary },
                  ]}
                >
                  Cancel
                </ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.resetPasswordConfirmButton,
                  { backgroundColor: theme.status.warning },
                ]}
                onPress={handleConfirmResetPassword}
                disabled={
                  resettingPassword || !newPassword || newPassword.length < 6
                }
              >
                {resettingPassword ? (
                  <ModernLoader size='small' overlay={false} />
                ) : (
                  <ThemedText style={styles.resetPasswordConfirmText}>
                    Reset Password
                  </ThemedText>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );

  return (
    <ThemedView style={styles.container}>
      {/* Tab Navigation */}
      <View
        style={[
          styles.tabNavigation,
          {
            backgroundColor: theme.tab.background,
            borderBottomColor: theme.tab.border,
          },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === 'overview' && [
              styles.activeTab,
              { backgroundColor: theme.surface },
            ],
          ]}
          onPress={() => setActiveTab('overview')}
        >
          <Ionicons
            name='grid'
            size={20}
            color={
              activeTab === 'overview' ? theme.tab.active : theme.tab.inactive
            }
          />
          <ThemedText
            style={[
              styles.tabText,
              {
                color:
                  activeTab === 'overview'
                    ? theme.tab.active
                    : theme.tab.inactive,
              },
              activeTab === 'overview' && styles.activeTabText,
            ]}
          >
            Overview
          </ThemedText>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === 'meals' && [
              styles.activeTab,
              { backgroundColor: theme.surface },
            ],
          ]}
          onPress={() => setActiveTab('meals')}
        >
          <Ionicons
            name='fast-food'
            size={20}
            color={
              activeTab === 'meals' ? theme.tab.active : theme.tab.inactive
            }
          />
          <ThemedText
            style={[
              styles.tabText,
              {
                color:
                  activeTab === 'meals' ? theme.tab.active : theme.tab.inactive,
              },
              activeTab === 'meals' && styles.activeTabText,
            ]}
          >
            Meals
          </ThemedText>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === 'members' && [
              styles.activeTab,
              { backgroundColor: theme.surface },
            ],
          ]}
          onPress={() => setActiveTab('members')}
        >
          <Ionicons
            name='people'
            size={20}
            color={
              activeTab === 'members' ? theme.tab.active : theme.tab.inactive
            }
          />
          <ThemedText
            style={[
              styles.tabText,
              {
                color:
                  activeTab === 'members'
                    ? theme.tab.active
                    : theme.tab.inactive,
              },
              activeTab === 'members' && styles.activeTabText,
            ]}
          >
            Members
          </ThemedText>
        </TouchableOpacity>
      </View>

      {/* Tab Content */}
      {activeTab === 'overview' && renderOverview()}
      {activeTab === 'meals' && renderMeals()}
      {activeTab === 'members' && renderMembers()}
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  accessDeniedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  accessDeniedGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  accessDeniedTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 20,
    marginBottom: 10,
  },
  accessDeniedText: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    paddingHorizontal: 40,
    opacity: 0.9,
  },
  tabNavigation: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
  },
  activeTab: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tabText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
  },
  activeTabText: {
    fontWeight: '600',
  },
  tabContent: {
    flex: 1,
    padding: 20,
  },
  tabTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  tabSubtitle: {
    fontSize: 16,
    marginBottom: 20,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 30,
    marginBottom: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.9,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  errorContainer: {
    padding: 40,
    alignItems: 'center',
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 20,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  statCard: {
    width: (width - 60) / 2,
    marginBottom: 15,
    borderRadius: 16,
    overflow: 'hidden',
  },
  statGradient: {
    padding: 20,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#fff',
    opacity: 0.9,
    textAlign: 'center',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  actionCard: {
    width: (width - 60) / 2,
    marginBottom: 15,
    borderRadius: 16,
    overflow: 'hidden',
  },
  actionGradient: {
    padding: 20,
    alignItems: 'center',
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 8,
    marginBottom: 4,
  },
  actionSubtitle: {
    fontSize: 12,
    color: '#fff',
    opacity: 0.9,
    textAlign: 'center',
  },
  summaryCard: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  summaryGradient: {
    padding: 20,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 14,
    marginTop: 8,
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  summaryTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 15,
    borderTopWidth: 1,
  },
  summaryTotalLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  summaryTotalValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  membersHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  addButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  addButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  membersList: {
    flex: 1,
  },
  memberCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  memberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  memberActions: {
    flexDirection: 'row',
    gap: 8,
    marginLeft: 12,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editButton: {
    // Styled via backgroundColor in component
  },
  deleteButton: {
    // Styled via backgroundColor in component
  },
  memberAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  memberDetails: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  memberEmail: {
    fontSize: 14,
    marginBottom: 2,
  },
  memberPhone: {
    fontSize: 12,
    marginBottom: 4,
  },
  memberStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    textTransform: 'capitalize',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  resetPasswordModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  resetPasswordModalContent: {
    width: '90%',
    maxWidth: 400,
    borderRadius: 16,
    overflow: 'hidden',
  },
  resetPasswordModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
  },
  resetPasswordModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  resetPasswordModalBody: {
    padding: 20,
  },
  resetPasswordModalText: {
    fontSize: 14,
    marginBottom: 16,
  },
  resetPasswordInputContainer: {
    position: 'relative',
    marginTop: 8,
  },
  resetPasswordInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    paddingRight: 45,
    fontSize: 16,
  },
  resetPasswordEyeButton: {
    position: 'absolute',
    right: 12,
    top: 12,
    padding: 4,
    zIndex: 1,
  },
  passwordErrorText: {
    fontSize: 12,
    marginTop: 8,
  },
  resetPasswordModalFooter: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    gap: 12,
  },
  resetPasswordCancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  resetPasswordCancelText: {
    fontSize: 16,
    fontWeight: '600',
  },
  resetPasswordConfirmButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resetPasswordConfirmText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
