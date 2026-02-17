import { useFocusEffect } from 'expo-router';
import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ModernLoader } from '../ui/ModernLoader';
import { ThemedView } from '../ThemedView';
import { ThemedText } from '../ThemedText';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import userService, { User } from '../../services/userService';

interface SuperAdminDashboardProps {
  onNavigate?: (screen: string) => void;
}

interface SystemStats {
  totalUsers: number;
  totalAdmins: number;
  totalMembers: number;
  activeUsers: number;
  pendingApprovals: number;
  systemHealth: 'excellent' | 'good' | 'warning' | 'critical';
}

const { width } = Dimensions.get('window');

export const SuperAdminDashboard: React.FC<SuperAdminDashboardProps> = ({
  onNavigate,
}) => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [systemStats, setSystemStats] = useState<SystemStats>({
    totalUsers: 0,
    totalAdmins: 0,
    totalMembers: 0,
    activeUsers: 0,
    pendingApprovals: 0,
    systemHealth: 'excellent',
  });
  const [recentUsers, setRecentUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'system'>(
    'overview'
  );

  const loadSystemStats = async () => {
    try {
      setLoading(true);
      // Simulate API call for system stats
      const stats: SystemStats = {
        totalUsers: 156,
        totalAdmins: 8,
        totalMembers: 148,
        activeUsers: 142,
        pendingApprovals: 12,
        systemHealth: 'excellent',
      };
      setSystemStats(stats);
    } catch (error) {
      console.error('Error loading system stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadRecentUsers = async () => {
    try {
      const response = await userService.getAllUsers({ limit: 5 });
      if (response.success && response.data) {
        const users = Array.isArray(response.data) ? response.data : [];
        setRecentUsers(users);
      }
    } catch (error) {
      console.error('Error loading recent users:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadSystemStats(), loadRecentUsers()]);
    setRefreshing(false);
  };

  useFocusEffect(
    useCallback(() => {
      if (user?.role === 'super_admin') {
        loadSystemStats();
        loadRecentUsers();
      }
    }, [user?.role])
  );

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'excellent':
        return theme.status.success;
      case 'good':
        return theme.status.info;
      case 'warning':
        return theme.status.warning;
      case 'critical':
        return theme.status.error;
      default:
        return theme.text.tertiary;
    }
  };

  const getHealthIcon = (health: string) => {
    switch (health) {
      case 'excellent':
        return 'checkmark-circle';
      case 'good':
        return 'checkmark-circle-outline';
      case 'warning':
        return 'warning';
      case 'critical':
        return 'close-circle';
      default:
        return 'help-circle';
    }
  };

  const handleUserAction = (action: string, userId: string) => {
    Alert.alert(
      'Confirm Action',
      `Are you sure you want to ${action} this user?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          style: action === 'delete' ? 'destructive' : 'default',
          onPress: () => {
            console.log(`${action} user:`, userId);
          },
        },
      ]
    );
  };

  const handleSystemAction = (action: string) => {
    Alert.alert(
      'System Action',
      `Are you sure you want to ${action}? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Proceed',
          style: 'destructive',
          onPress: () => {
            console.log(`System action: ${action}`);
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <ModernLoader visible={true} text="Loading system stats..." />
    );
  }

  // Access control - only super admin can see this
  if (user?.role !== 'super_admin') {
    return (
      <ThemedView style={styles.accessDeniedContainer}>
        <LinearGradient
          colors={theme.gradient.primary as [string, string]}
          style={styles.accessDeniedGradient}
        >
          <Ionicons name='shield-checkmark' size={80} color='#fff' />
          <ThemedText style={styles.accessDeniedTitle}>
            Access Denied
          </ThemedText>
          <ThemedText style={styles.accessDeniedText}>
            This area is restricted to Super Administrators only.
          </ThemedText>
        </LinearGradient>
      </ThemedView>
    );
  }

  const renderOverview = () => (
    <ScrollView
      style={styles.scrollView}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
    >
      {/* Header */}
      <LinearGradient colors={theme.gradient.primary as [string, string]} style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerIconContainer}>
            <Ionicons name='shield-checkmark' size={40} color='#fff' />
          </View>
          <View style={styles.headerText}>
            <ThemedText style={styles.headerTitle}>
              Super Admin Dashboard
            </ThemedText>
            <ThemedText style={styles.headerSubtitle}>
              System Control Center
            </ThemedText>
          </View>
        </View>
      </LinearGradient>

      {/* System Health Status */}
      <View style={styles.healthCard}>
        <LinearGradient
          colors={[
            getHealthColor(systemStats.systemHealth),
            getHealthColor(systemStats.systemHealth) + '80',
          ] as [string, string]}
          style={styles.healthGradient}
        >
          <View style={styles.healthContent}>
            <Ionicons
              name={getHealthIcon(systemStats.systemHealth)}
              size={32}
              color='#fff'
            />
            <View style={styles.healthText}>
              <ThemedText style={styles.healthTitle}>System Health</ThemedText>
              <ThemedText style={styles.healthStatus}>
                {systemStats.systemHealth.toUpperCase()}
              </ThemedText>
            </View>
          </View>
        </LinearGradient>
      </View>

      {/* Quick Stats */}
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <LinearGradient
            colors={theme.gradient.success as [string, string]}
            style={styles.statGradient}
          >
            <Ionicons name='people' size={28} color='#fff' />
            <ThemedText style={styles.statValue}>
              {systemStats.totalUsers}
            </ThemedText>
            <ThemedText style={styles.statLabel}>Total Users</ThemedText>
          </LinearGradient>
        </View>

        <View style={styles.statCard}>
          <LinearGradient
            colors={theme.gradient.info as [string, string]}
            style={styles.statGradient}
          >
            <Ionicons name='shield' size={28} color='#fff' />
            <ThemedText style={styles.statValue}>
              {systemStats.totalAdmins}
            </ThemedText>
            <ThemedText style={styles.statLabel}>Administrators</ThemedText>
          </LinearGradient>
        </View>

        <View style={styles.statCard}>
          <LinearGradient
            colors={theme.gradient.warning as [string, string]}
            style={styles.statGradient}
          >
            <Ionicons name='time' size={28} color='#fff' />
            <ThemedText style={styles.statValue}>
              {systemStats.pendingApprovals}
            </ThemedText>
            <ThemedText style={styles.statLabel}>Pending</ThemedText>
          </LinearGradient>
        </View>

        <View style={styles.statCard}>
          <LinearGradient
            colors={theme.gradient.secondary as [string, string]}
            style={styles.statGradient}
          >
            <Ionicons name='checkmark-circle' size={28} color='#fff' />
            <ThemedText style={styles.statValue}>
              {systemStats.activeUsers}
            </ThemedText>
            <ThemedText style={styles.statLabel}>Active Users</ThemedText>
          </LinearGradient>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <ThemedText style={styles.sectionTitle}>Quick Actions</ThemedText>
        <View style={styles.actionsGrid}>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => setActiveTab('users')}
          >
            <LinearGradient
              colors={theme.gradient.success as [string, string]}
              style={styles.actionGradient}
            >
              <Ionicons name='people-circle' size={36} color='#fff' />
              <ThemedText style={styles.actionTitle}>Manage Users</ThemedText>
              <ThemedText style={styles.actionSubtitle}>
                View and manage all users
              </ThemedText>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => handleSystemAction('backup')}
          >
            <LinearGradient
              colors={theme.gradient.warning as [string, string]}
              style={styles.actionGradient}
            >
              <Ionicons name='cloud-download' size={36} color='#fff' />
              <ThemedText style={styles.actionTitle}>Backup System</ThemedText>
              <ThemedText style={styles.actionSubtitle}>
                Create system backup
              </ThemedText>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => setActiveTab('system')}
          >
            <LinearGradient
              colors={theme.gradient.secondary as [string, string]}
              style={styles.actionGradient}
            >
              <Ionicons name='settings' size={36} color='#fff' />
              <ThemedText style={styles.actionTitle}>
                System Settings
              </ThemedText>
              <ThemedText style={styles.actionSubtitle}>
                Configure system options
              </ThemedText>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => handleSystemAction('analytics')}
          >
            <LinearGradient
              colors={theme.gradient.primary as [string, string]}
              style={styles.actionGradient}
            >
              <Ionicons name='analytics' size={36} color='#fff' />
              <ThemedText style={styles.actionTitle}>Analytics</ThemedText>
              <ThemedText style={styles.actionSubtitle}>
                View system analytics
              </ThemedText>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>

      {/* Recent Users */}
      <View style={styles.section}>
        <ThemedText style={styles.sectionTitle}>Recent Users</ThemedText>
        <View style={styles.usersList}>
          {recentUsers.slice(0, 3).map((user, index) => (
            <View key={user.id || index} style={[styles.userCard, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}>
              <View style={styles.userInfo}>
                <View style={[styles.userAvatar, { backgroundColor: theme.primary + '20' }]}>
                  <Ionicons name='person' size={24} color={theme.icon.secondary} />
                </View>
                <View style={styles.userDetails}>
                  <ThemedText style={styles.userName}>{user.name}</ThemedText>
                  <ThemedText style={[styles.userEmail, { color: theme.text.secondary }]}>{user.email}</ThemedText>
                  <View style={styles.userRole}>
                    <ThemedText style={[styles.roleText, { color: theme.text.tertiary }]}>{user.role}</ThemedText>
                  </View>
                </View>
              </View>
              <View style={styles.userActions}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleUserAction('edit', user.id || '')}
                >
                  <Ionicons name='create' size={20} color={theme.status.info} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, styles.deleteButton]}
                  onPress={() => handleUserAction('delete', user.id || '')}
                >
                  <Ionicons name='trash' size={20} color={theme.status.error} />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* System Actions */}
      <View style={styles.section}>
        <ThemedText style={styles.sectionTitle}>System Actions</ThemedText>
        <View style={styles.systemActions}>
          <TouchableOpacity
            style={styles.systemActionCard}
            onPress={() => handleSystemAction('restart')}
          >
            <LinearGradient
              colors={theme.gradient.warning as [string, string]}
              style={styles.systemActionGradient}
            >
              <Ionicons name='refresh' size={24} color='#fff' />
              <ThemedText style={styles.systemActionTitle}>
                Restart System
              </ThemedText>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.systemActionCard}
            onPress={() => handleSystemAction('maintenance')}
          >
            <LinearGradient
              colors={theme.gradient.secondary as [string, string]}
              style={styles.systemActionGradient}
            >
              <Ionicons name='construct' size={24} color='#fff' />
              <ThemedText style={styles.systemActionTitle}>
                Maintenance Mode
              </ThemedText>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );

  const renderUsers = () => (
    <View style={styles.tabContent}>
      <ThemedText style={styles.tabTitle}>User Management</ThemedText>
      <ThemedText style={styles.tabSubtitle}>
        Manage all system users and their permissions
      </ThemedText>
    </View>
  );

  const renderSystem = () => (
    <View style={styles.tabContent}>
      <ThemedText style={styles.tabTitle}>System Settings</ThemedText>
      <ThemedText style={styles.tabSubtitle}>
        Configure system-wide settings and preferences
      </ThemedText>
    </View>
  );

  return (
    <ThemedView style={styles.container}>
      {/* Tab Navigation */}
      <View style={[styles.tabNavigation, { backgroundColor: theme.tab.background, borderBottomColor: theme.tab.border }]}>
        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === 'overview' && [styles.activeTab, { backgroundColor: theme.surface }],
          ]}
          onPress={() => setActiveTab('overview')}
        >
          <Ionicons
            name='grid'
            size={20}
            color={activeTab === 'overview' ? theme.tab.active : theme.tab.inactive}
          />
          <ThemedText
            style={[
              styles.tabText,
              { color: activeTab === 'overview' ? theme.tab.active : theme.tab.inactive },
              activeTab === 'overview' && styles.activeTabText,
            ]}
          >
            Overview
          </ThemedText>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'users' && [styles.activeTab, { backgroundColor: theme.surface }]]}
          onPress={() => setActiveTab('users')}
        >
          <Ionicons
            name='people'
            size={20}
            color={activeTab === 'users' ? theme.tab.active : theme.tab.inactive}
          />
          <ThemedText
            style={[
              styles.tabText,
              { color: activeTab === 'users' ? theme.tab.active : theme.tab.inactive },
              activeTab === 'users' && styles.activeTabText,
            ]}
          >
            Users
          </ThemedText>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'system' && [styles.activeTab, { backgroundColor: theme.surface }]]}
          onPress={() => setActiveTab('system')}
        >
          <Ionicons
            name='settings'
            size={20}
            color={activeTab === 'system' ? theme.tab.active : theme.tab.inactive}
          />
          <ThemedText
            style={[
              styles.tabText,
              { color: activeTab === 'system' ? theme.tab.active : theme.tab.inactive },
              activeTab === 'system' && styles.activeTabText,
            ]}
          >
            System
          </ThemedText>
        </TouchableOpacity>
      </View>

      {/* Tab Content */}
      {activeTab === 'overview' && renderOverview()}
      {activeTab === 'users' && renderUsers()}
      {activeTab === 'system' && renderSystem()}
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
    backgroundColor: '#f8fafc',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
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
    backgroundColor: '#fff',
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
    color: '#6b7280',
  },
  activeTabText: {
    color: '#667eea',
    fontWeight: '600',
  },
  tabContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  tabTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  tabSubtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
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
  healthCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    overflow: 'hidden',
  },
  healthGradient: {
    padding: 20,
  },
  healthContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  healthText: {
    marginLeft: 15,
    flex: 1,
  },
  healthTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 5,
  },
  healthStatus: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
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
  usersList: {
    marginTop: 10,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
  },
  userInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e5e7eb',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  userRole: {
    backgroundColor: '#e0e7ff',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  roleText: {
    fontSize: 12,
    color: '#3730a3',
    fontWeight: '500',
  },
  userActions: {
    flexDirection: 'row',
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  deleteButton: {
    backgroundColor: '#fef2f2',
  },
  systemActions: {
    flexDirection: 'row',
  },
  systemActionCard: {
    flex: 1,
    marginHorizontal: 5,
    borderRadius: 12,
    overflow: 'hidden',
  },
  systemActionGradient: {
    padding: 15,
    alignItems: 'center',
  },
  systemActionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginTop: 8,
  },
});
