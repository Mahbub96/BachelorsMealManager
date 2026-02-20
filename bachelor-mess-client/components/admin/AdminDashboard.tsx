import { useFocusEffect, useRouter } from 'expo-router';
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
  Modal,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ModernLoader } from '../ui/ModernLoader';
import { ThemedView } from '../ThemedView';
import { ThemedText } from '../ThemedText';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import {
  DashboardHeader,
  StatsGrid,
  QuickActions,
  type StatItem,
  type ActionItem,
} from '../dashboard';
import { EnhancedMealManagement } from '../meals/EnhancedMealManagement';
import dashboardService from '../../services/dashboardService';
import { useUsers } from '../../hooks/useUsers';
import userService, {
  User,
  CreateUserData,
  UpdateUserData,
} from '../../services/userService';
import { MemberFormModal } from './MemberFormModal';
import { MemberViewModal } from './MemberViewModal';
import { MonthlyReportDashboard } from './reports/MonthlyReportDashboard';
import { logger } from '../../utils/logger';

type AdminDashboardProps = Record<string, never>;

interface AdminStats {
  totalMeals: number;
  pendingMeals: number;
  pendingBazar: number;
  approvedMeals: number;
  totalMembers: number;
  todayMeals: number;
  todayBreakfast: number;
  todayLunch: number;
  todayDinner: number;
  mealRate: number;
  totalBazarAmount: number;
}


export const AdminDashboard: React.FC<AdminDashboardProps> = () => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const router = useRouter();
  const [adminStats, setAdminStats] = useState<AdminStats>({
    totalMeals: 0,
    pendingMeals: 0,
    pendingBazar: 0,
    approvedMeals: 0,
    totalMembers: 0,
    todayMeals: 0,
    todayBreakfast: 0,
    todayLunch: 0,
    todayDinner: 0,
    mealRate: 0,
    totalBazarAmount: 0,
  });
  const [activeTab, setActiveTab] = useState<'overview' | 'meals' | 'members' | 'reports'>(
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
  const [openPendingFor, setOpenPendingFor] = useState<'meals' | 'bazar' | null>(null);
  const { createUser } = useUsers();
  const isMountedRef = useRef(true);

  const resetPasswordMember = useMemo(
    () => (resettingPasswordFor ? members.find((m) => m.id === resettingPasswordFor) : null),
    [resettingPasswordFor, members],
  );

  const loadAdminStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const dashboardResponse = await dashboardService.getStats();

      if (!dashboardResponse.success || !dashboardResponse.data) {
        throw new Error(
          dashboardResponse.error || 'Failed to load dashboard stats'
        );
      }

      const stats = dashboardResponse.data;

      const mealRate =
        stats.totalMeals > 0 && stats.totalBazarAmount > 0
          ? stats.totalBazarAmount / stats.totalMeals
          : 0;

      setAdminStats({
        totalMeals: stats.totalMeals ?? 0,
        pendingMeals: stats.pendingMeals ?? 0,
        pendingBazar: stats.pendingBazar ?? 0,
        approvedMeals: stats.approvedMeals ?? Math.max(0, (stats.totalMeals ?? 0) - (stats.pendingMeals ?? 0)),
        totalMembers: stats.totalMembers ?? 0,
        todayMeals: stats.todayMeals ?? 0,
        todayBreakfast: stats.todayBreakfast ?? 0,
        todayLunch: stats.todayLunch ?? 0,
        todayDinner: stats.todayDinner ?? 0,
        mealRate,
        totalBazarAmount: stats.totalBazarAmount ?? 0,
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
      logger.error('AdminDashboard - Error loading members', err);
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

  const handlePendingCardPress = useCallback(() => {
    const total = adminStats.pendingMeals + adminStats.pendingBazar;
    if (total === 0) {
      setOpenPendingFor('meals');
      setActiveTab('meals');
      return;
    }
    if (adminStats.pendingMeals > 0 && adminStats.pendingBazar > 0) {
      Alert.alert(
        'Pending approvals',
        'Open pending meals or bazar?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: `Meals (${adminStats.pendingMeals})`,
            onPress: () => {
              setOpenPendingFor('meals');
              setActiveTab('meals');
            },
          },
          {
            text: `Bazar (${adminStats.pendingBazar})`,
            onPress: () => router.push({ pathname: '/(tabs)/explore', params: { status: 'pending' } }),
          },
        ]
      );
      return;
    }
    if (adminStats.pendingMeals > 0) {
      setOpenPendingFor('meals');
      setActiveTab('meals');
    } else {
      router.push({ pathname: '/(tabs)/explore', params: { status: 'pending' } });
    }
  }, [adminStats.pendingMeals, adminStats.pendingBazar, router]);

  // Admin stats for shared StatsGrid (aligned with user dashboard)
  const adminStatsForGrid: StatItem[] = useMemo(
    () => [
      {
        title: 'Total Meals',
        value: adminStats.totalMeals,
        icon: 'fast-food',
        colors: theme.gradient.success as [string, string],
        trend: adminStats.totalMeals > 0 ? 'up' : 'neutral',
        period: 'this month',
      },
      {
        title: 'Pending approvals',
        value: adminStats.pendingMeals + adminStats.pendingBazar,
        icon: 'time',
        colors: theme.gradient.warning as [string, string],
        trend: 'neutral',
        period: 'meals & bazar this month',
        onPress: handlePendingCardPress,
      },
      {
        title: 'Approved',
        value: adminStats.approvedMeals,
        icon: 'checkmark-circle',
        colors: theme.gradient.secondary as [string, string],
        trend: 'up',
        period: 'meals',
      },
      {
        title: 'Members',
        value: adminStats.totalMembers,
        icon: 'people',
        colors: theme.gradient.info as [string, string],
        trend: 'neutral',
        period: 'total',
      },
      {
        title: 'Meal Rate',
        value:
          adminStats.mealRate > 0
            ? `৳${adminStats.mealRate.toFixed(2)}`
            : 'N/A',
        icon: 'calculator',
        colors: theme.gradient.warning as [string, string],
        period: 'this month',
      },
      {
        title: 'Today Meals',
        value: adminStats.todayMeals,
        icon: 'calendar',
        colors: theme.gradient.success as [string, string],
        trend: adminStats.todayMeals > 0 ? 'up' : 'neutral',
        period: 'today',
      },
    ],
    [adminStats, theme, handlePendingCardPress]
  );

  useEffect(() => {
    if (activeTab === 'meals' && openPendingFor === 'meals') {
      const id = setTimeout(() => setOpenPendingFor(null), 150);
      return () => clearTimeout(id);
    }
  }, [activeTab, openPendingFor]);

  const handleQuickAction = useCallback((action: string) => {
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
  }, []);

  const adminQuickActions: ActionItem[] = useMemo(
    () => [
      {
        id: 'reports',
        title: 'Reports',
        subtitle: 'Monthly summaries',
        icon: 'stats-chart',
        color: theme.gradient.info[0],
        onPress: () => setActiveTab('reports'),
      },
      {
        id: 'approve-all',
        title: 'Approve All',
        subtitle: 'Approve pending meals',
        icon: 'checkmark-circle',
        color: theme.gradient.success[0],
        onPress: () => handleQuickAction('approve-all'),
      },
      {
        id: 'export-data',
        title: 'Export Data',
        subtitle: 'Export meal reports',
        icon: 'download',
        color: theme.gradient.warning[0],
        onPress: () => handleQuickAction('export-data'),
      },
      {
        id: 'send-notification',
        title: 'Send Notification',
        subtitle: 'Notify all members',
        icon: 'notifications',
        color: theme.gradient.primary[0],
        onPress: () => handleQuickAction('send-notification'),
      },
      {
        id: 'manage-meals',
        title: 'Manage Meals',
        subtitle: 'View all meals',
        icon: 'fast-food',
        color: theme.gradient.secondary[0],
        onPress: () => setActiveTab('meals'),
      },
    ],
    [theme, handleQuickAction]
  );

  // Access control
  if (user?.role !== 'admin' && user?.role !== 'super_admin') {
    return (
      <ThemedView style={styles.accessDeniedContainer}>
        <LinearGradient
          colors={theme.gradient.info as [string, string]}
          style={styles.accessDeniedGradient}
        >
          <Ionicons name='shield' size={80} color={theme.onPrimary?.text ?? theme.text?.inverse} />
          <ThemedText style={[styles.accessDeniedTitle, { color: theme.onPrimary?.text ?? theme.text?.inverse }]}>
            Access Denied
          </ThemedText>
          <ThemedText style={[styles.accessDeniedText, { color: theme.onPrimary?.text ?? theme.text?.inverse }]}>
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

  const renderOverview = () => (
    <>
      {/* Loading State */}
      {loading && (
        <View style={styles.overviewLoader}>
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

      {!loading && !error && (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.overviewScrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          nestedScrollEnabled
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
        >
          <DashboardHeader
            title="Admin Dashboard"
            subtitle="Meal Management Center"
            icon="shield"
          />
          <StatsGrid stats={adminStatsForGrid} columns={2} isSmallScreen={false} />
          <QuickActions
            actions={adminQuickActions}
            title="Quick Actions"
            subtitle="Manage meals and members"
            columns={2}
            isSmallScreen={false}
          />
          {/* Today's Summary - same card style as dashboard */}
          <View style={[styles.section, { paddingHorizontal: 16, marginBottom: 28 }]}>
            <ThemedText style={[styles.sectionTitle, { color: theme.text?.primary }]}>
              Today&apos;s Summary
            </ThemedText>
            <View
              style={[
                styles.summaryCard,
                {
                  backgroundColor: theme.cardBackground ?? theme.surface,
                  borderColor: theme.border?.secondary ?? theme.cardBorder,
                  borderWidth: 1,
                  shadowColor: theme.shadow?.light ?? theme.cardShadow,
                },
              ]}
            >
              <View style={styles.summaryGradient}>
                <View style={styles.summaryRow}>
                  <View style={styles.summaryItem}>
                    <Ionicons name='sunny' size={24} color={theme.status.warning} />
                    <ThemedText style={[styles.summaryLabel, { color: theme.text.secondary }]}>
                      Breakfast
                    </ThemedText>
                    <ThemedText style={[styles.summaryValue, { color: theme.text?.primary }]}>
                      {adminStats.todayBreakfast}
                    </ThemedText>
                  </View>
                  <View style={styles.summaryItem}>
                    <Ionicons name='partly-sunny' size={24} color={theme.status.warning} />
                    <ThemedText style={[styles.summaryLabel, { color: theme.text.secondary }]}>
                      Lunch
                    </ThemedText>
                    <ThemedText style={[styles.summaryValue, { color: theme.text?.primary }]}>
                      {adminStats.todayLunch}
                    </ThemedText>
                  </View>
                  <View style={styles.summaryItem}>
                    <Ionicons name='moon' size={24} color={theme.primary} />
                    <ThemedText style={[styles.summaryLabel, { color: theme.text.secondary }]}>
                      Dinner
                    </ThemedText>
                    <ThemedText style={[styles.summaryValue, { color: theme.text?.primary }]}>
                      {adminStats.todayDinner}
                    </ThemedText>
                  </View>
                </View>
                <View
                  style={[
                    styles.summaryTotal,
                    { borderTopColor: theme.border?.secondary ?? theme.cardBorder },
                  ]}
                >
                  <ThemedText style={[styles.summaryTotalLabel, { color: theme.text?.primary }]}>
                    Total Today
                  </ThemedText>
                  <ThemedText style={[styles.summaryTotalValue, { color: theme.primary }]}>
                    {adminStats.todayMeals} meals
                  </ThemedText>
                </View>
              </View>
            </View>
          </View>
        </ScrollView>
      )}
    </>
  );

  const renderMeals = () => (
    <View style={styles.tabContent}>
      <ThemedText style={styles.tabTitle}>Meal Management</ThemedText>
      <ThemedText style={styles.tabSubtitle}>
        Manage and approve meal submissions
      </ThemedText>
      <EnhancedMealManagement initialStatus={openPendingFor === 'meals' ? 'pending' : undefined} />
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
      <View style={[styles.membersHeader, { borderBottomColor: theme.border.secondary }]}>
        <View style={styles.membersHeaderLeft}>
          <ThemedText style={styles.tabTitle}>Member Management</ThemedText>
          <ThemedText
            style={[styles.tabSubtitle, { color: theme.text.secondary }]}
          >
            {user?.role === 'super_admin'
              ? 'View and manage all members'
              : 'View and manage your members'}
            {!loadingMembers && !error && members.length >= 0 && (
              <ThemedText style={[styles.memberCountBadge, { color: theme.text.secondary }]}>
                {' '}· {members.length} {members.length === 1 ? 'member' : 'members'}
              </ThemedText>
            )}
          </ThemedText>
        </View>
        <TouchableOpacity
          style={[
            styles.addMemberButton,
            { backgroundColor: theme.button.primary.background },
          ]}
          onPress={handleOpenAddModal}
        >
          <Ionicons name='add' size={22} color={theme.button.primary.text} />
          <ThemedText
            style={[
              styles.addMemberButtonText,
              { color: theme.button.primary.text },
            ]}
          >
            Add Member
          </ThemedText>
        </TouchableOpacity>
      </View>

      {loadingMembers && (
        <View style={styles.membersLoaderWrap}>
          <ModernLoader visible={true} text="Loading members..." overlay={false} />
        </View>
      )}

      {error && !loadingMembers && (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={40} color={theme.status.error} />
          <ThemedText style={[styles.errorText, { color: theme.status.error }]}>
            {error}
          </ThemedText>
          <TouchableOpacity
            style={[
              styles.retryButton,
              { backgroundColor: theme.button.primary.background },
            ]}
            onPress={() => loadMembers(true)}
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

      {!loadingMembers && !error && (
        <ScrollView
          style={styles.membersScrollView}
          contentContainerStyle={styles.membersScrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                loadMembers(true).finally(() => setRefreshing(false));
              }}
              colors={[theme.primary]}
            />
          }
        >
          {members.length === 0 ? (
            <View style={styles.emptyContainer}>
              <View style={[styles.emptyIconWrap, { backgroundColor: theme.primary + '18' }]}>
                <Ionicons name="people-outline" size={48} color={theme.primary} />
              </View>
              <ThemedText style={styles.emptyText}>No members yet</ThemedText>
              <ThemedText style={[styles.emptySubtext, { color: theme.text.secondary }]}>
                Add your first member to get started
              </ThemedText>
              <TouchableOpacity
                style={[styles.emptyAddButton, { backgroundColor: theme.button.primary.background }]}
                onPress={handleOpenAddModal}
              >
                <Ionicons name="add" size={20} color={theme.button.primary.text} />
                <ThemedText style={[styles.emptyAddButtonText, { color: theme.button.primary.text }]}>
                  Add Member
                </ThemedText>
              </TouchableOpacity>
            </View>
          ) : (
            members.map((member) => {
              const isDeleting = deletingMemberId === member.id;
              return (
                <TouchableOpacity
                  key={member.id}
                  activeOpacity={0.7}
                  style={[
                    styles.memberCard,
                    {
                      backgroundColor: theme.cardBackground,
                      borderColor: theme.border.secondary,
                      shadowColor: theme.shadow?.light ?? theme.cardShadow,
                      opacity: isDeleting ? 0.6 : 1,
                    },
                  ]}
                  onPress={() => !isDeleting && handleOpenViewModal(member)}
                  disabled={isDeleting}
                >
                  <View style={styles.memberCardInner}>
                    <View
                      style={[
                        styles.memberAvatar,
                        {
                          backgroundColor: theme.primary,
                          borderColor: theme.cardBackground,
                        },
                      ]}
                    >
                      <ThemedText style={[styles.memberAvatarText, { color: theme.onPrimary?.text ?? theme.text?.inverse }]}>
                        {member.name.trim().charAt(0).toUpperCase() || '?'}
                      </ThemedText>
                    </View>
                    <View style={styles.memberMain}>
                      <ThemedText style={styles.memberName} numberOfLines={1}>
                        {member.name}
                      </ThemedText>
                      <ThemedText
                        style={[styles.memberEmail, { color: theme.text.secondary }]}
                        numberOfLines={1}
                      >
                        {member.email}
                      </ThemedText>
                      {member.phone ? (
                        <ThemedText
                          style={[styles.memberPhone, { color: theme.text.secondary }]}
                          numberOfLines={1}
                        >
                          {member.phone}
                        </ThemedText>
                      ) : null}
                      <View style={styles.roleContainer}>
                        <View
                          style={[
                            styles.roleBadge,
                            {
                              backgroundColor:
                                member.role === 'admin'
                                  ? theme.status.info + '22'
                                  : theme.status.success + '22',
                            },
                          ]}
                        >
                          <ThemedText
                            style={[
                              styles.roleText,
                              {
                                color:
                                  member.role === 'admin'
                                    ? theme.status.info
                                    : theme.status.success,
                              },
                            ]}
                          >
                            {member.role}
                          </ThemedText>
                        </View>
                        <View
                          style={[
                            styles.statusBadge,
                            {
                              backgroundColor:
                                member.status === 'active'
                                  ? theme.status.success + '22'
                                  : theme.status.error + '22',
                            },
                          ]}
                        >
                          <ThemedText
                            style={[
                              styles.statusText,
                              {
                                color:
                                  member.status === 'active'
                                    ? theme.status.success
                                    : theme.status.error,
                              },
                            ]}
                          >
                            {member.status}
                          </ThemedText>
                        </View>
                      </View>
                    </View>
                    <View style={[styles.memberActions, { borderLeftColor: theme.border.secondary }]}>
                      <TouchableOpacity
                        style={[styles.memberActionBtn, { backgroundColor: theme.button.secondary.background + '99' }]}
                        onPress={(e) => {
                          e.stopPropagation();
                          handleOpenViewModal(member);
                        }}
                      >
                        <Ionicons name="eye-outline" size={22} color={theme.button.secondary.text} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.memberActionBtn, { backgroundColor: theme.button.secondary.background + '99' }]}
                        onPress={(e) => {
                          e.stopPropagation();
                          handleOpenEditModal(member);
                        }}
                      >
                        <Ionicons name="create-outline" size={22} color={theme.button.secondary.text} />
                      </TouchableOpacity>
                      {user?.role === 'super_admin' && (
                        <TouchableOpacity
                          style={[styles.memberActionBtn, styles.memberActionBtnDanger, { backgroundColor: theme.status.error + '22' }]}
                          onPress={(e) => {
                            e.stopPropagation();
                            handleDeleteMember(member.id);
                          }}
                        >
                          <Ionicons name="trash-outline" size={22} color={theme.status.error} />
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                  {isDeleting && (
                    <View style={[styles.memberCardOverlay, { backgroundColor: theme.cardBackground + 'ee' }]}>
                      <ThemedText style={[styles.memberCardOverlayText, { color: theme.text.secondary }]}>
                        Deleting...
                      </ThemedText>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })
          )}
        </ScrollView>
      )}
    </View>
  );

  const renderReports = () => (
    <View style={styles.tabContent}>
      <ThemedText style={styles.tabTitle}>Monthly Reports</ThemedText>
      <ThemedText style={styles.tabSubtitle}>
        View month-wise meal and expense reports
      </ThemedText>
      <MonthlyReportDashboard />
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
              { backgroundColor: theme.surface, shadowColor: theme.shadow?.light ?? theme.cardShadow },
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
              { backgroundColor: theme.surface, shadowColor: theme.shadow?.light ?? theme.cardShadow },
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
              { backgroundColor: theme.surface, shadowColor: theme.shadow?.light ?? theme.cardShadow },
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

        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === 'reports' && [
              styles.activeTab,
              { backgroundColor: theme.surface, shadowColor: theme.shadow?.light ?? theme.cardShadow },
            ],
          ]}
          onPress={() => setActiveTab('reports')}
        >
          <Ionicons
            name='stats-chart'
            size={20}
            color={
              activeTab === 'reports' ? theme.tab.active : theme.tab.inactive
            }
          />
          <ThemedText
            style={[
              styles.tabText,
              {
                color:
                  activeTab === 'reports'
                    ? theme.tab.active
                    : theme.tab.inactive,
              },
              activeTab === 'reports' && styles.activeTabText,
            ]}
          >
            Reports
          </ThemedText>
        </TouchableOpacity>
      </View>

      {/* Tab Content */}
      {activeTab === 'overview' && renderOverview()}
      {activeTab === 'meals' && renderMeals()}
      {activeTab === 'members' && renderMembers()}
      {activeTab === 'reports' && renderReports()}

      {/* Member View Modal */}
      <MemberViewModal
        visible={showViewModal}
        member={viewingMember}
        onClose={handleCloseViewModal}
        onEdit={handleEditFromView}
        onResetPassword={handleResetPassword}
      />

      {/* Member Add/Edit Modal */}
      <MemberFormModal
        visible={showMemberModal}
        mode={modalMode}
        member={editingMember}
        onClose={handleCloseModal}
        onSubmit={handleSubmitMember}
        loading={submittingMember}
      />

      {/* Reset Password Modal */}
      <Modal
        visible={showResetPasswordModal}
        transparent
        animationType="fade"
        onRequestClose={handleCancelResetPassword}
      >
        <View style={[styles.resetPasswordModalOverlay, { backgroundColor: theme.overlay?.medium }]}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={handleCancelResetPassword}
          />
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.resetPasswordModalContentWrap}
          >
            <View
              style={[
                styles.resetPasswordModalContent,
                {
                  backgroundColor: theme.modal || theme.cardBackground,
                  borderColor: theme.border.secondary,
                },
              ]}
            >
              <View
                style={[
                  styles.resetPasswordModalHeader,
                  { borderBottomColor: theme.border.secondary },
                ]}
              >
                <ThemedText style={styles.resetPasswordModalTitle}>
                  {resetPasswordMember ? `Reset password for ${resetPasswordMember.name}` : 'Reset Password'}
                </ThemedText>
                <TouchableOpacity
                  onPress={handleCancelResetPassword}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                >
                  <Ionicons name="close" size={24} color={theme.icon?.secondary || theme.text.secondary} />
                </TouchableOpacity>
              </View>
              <View style={styles.resetPasswordModalBody}>
                <ThemedText style={[styles.resetPasswordModalText, { color: theme.text.secondary }]}>
                  Enter a new password (at least 6 characters). The member will use this to sign in.
                </ThemedText>
                <View style={styles.resetPasswordInputContainer}>
                  <TextInput
                    style={[
                      styles.resetPasswordInput,
                      {
                        backgroundColor: theme.surface || theme.cardBackground,
                        borderColor: theme.border.secondary,
                        color: theme.text.primary,
                      },
                    ]}
                    placeholder="New password"
                    placeholderTextColor={theme.text.secondary}
                    value={newPassword}
                    onChangeText={setNewPassword}
                    secureTextEntry={!showResetPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!resettingPassword}
                  />
                  <TouchableOpacity
                    style={[styles.resetPasswordEyeButton, { right: 12, top: 14 }]}
                    onPress={() => setShowResetPassword((prev) => !prev)}
                  >
                    <Ionicons
                      name={showResetPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={22}
                      color={theme.text.secondary}
                    />
                  </TouchableOpacity>
                </View>
                {newPassword.length > 0 && newPassword.length < 6 && (
                  <ThemedText style={[styles.passwordErrorText, { color: theme.status.error }]}>
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
                  <ThemedText style={[styles.resetPasswordCancelText, { color: theme.text.primary }]}>
                    Cancel
                  </ThemedText>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.resetPasswordConfirmButton,
                    {
                      backgroundColor: resettingPassword || newPassword.length < 6
                        ? theme.text.secondary + '60'
                        : theme.button.primary.background,
                    },
                  ]}
                  onPress={handleConfirmResetPassword}
                  disabled={resettingPassword || newPassword.length < 6}
                >
                  {resettingPassword ? (
                    <ActivityIndicator size="small" color={theme.onPrimary?.text ?? theme.button?.primary?.text} />
                  ) : (
                    <ThemedText style={[styles.resetPasswordConfirmText, { color: theme.onPrimary?.text ?? theme.button?.primary?.text }]}>
                      Reset Password
                    </ThemedText>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
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
    marginTop: 20,
    marginBottom: 10,
  },
  accessDeniedText: {
    fontSize: 16,
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
  overviewScrollContent: {
    paddingBottom: 28,
  },
  overviewLoader: {
    flex: 1,
    minHeight: 200,
    justifyContent: 'center',
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
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 14,
    letterSpacing: 0.2,
  },
  summaryCard: {
    borderRadius: 16,
    overflow: 'hidden',
    padding: 20,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
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
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  membersHeaderLeft: {
    flex: 1,
  },
  memberCountBadge: {
    fontSize: 14,
    marginTop: 2,
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
    fontWeight: '600',
    fontSize: 14,
  },
  membersLoaderWrap: {
    minHeight: 200,
    justifyContent: 'center',
  },
  membersScrollView: {
    flex: 1,
  },
  membersScrollContent: {
    paddingBottom: 24,
  },
  memberCard: {
    borderRadius: 16,
    padding: 0,
    marginBottom: 14,
    borderWidth: 1,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  memberCardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  memberCardOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  memberCardOverlayText: {
    fontSize: 14,
    fontWeight: '600',
  },
  memberAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
    borderWidth: 2,
  },
  memberMain: {
    flex: 1,
    minWidth: 0,
  },
  memberName: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 2,
  },
  memberEmail: {
    fontSize: 13,
    marginBottom: 1,
  },
  memberPhone: {
    fontSize: 12,
    marginBottom: 6,
  },
  memberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  memberActions: {
    flexDirection: 'column',
    gap: 10,
    marginLeft: 12,
    paddingLeft: 12,
    borderLeftWidth: 1,
  },
  memberActionBtn: {
    width: 42,
    height: 42,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  memberActionBtnDanger: {},
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  memberDetails: {
    flex: 1,
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
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  emptyIconWrap: {
    width: 88,
    height: 88,
    borderRadius: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyAddButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  emptyAddButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  resetPasswordModalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resetPasswordModalContentWrap: {
    width: '90%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  resetPasswordModalContent: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
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
    fontSize: 16,
    fontWeight: '600',
  },
  addMemberButton: {
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  addMemberButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  memberAvatarText: {
    fontSize: 22,
    fontWeight: '700',
  },
  roleContainer: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  roleText: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
});
