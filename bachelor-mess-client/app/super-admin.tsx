import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { useAuth } from '@/context/AuthContext';
import httpClient from '@/services/httpClient';

const { width } = Dimensions.get('window');

interface SystemOverview {
  users: {
    totalUsers: number;
    activeUsers: number;
    adminUsers: number;
    memberUsers: number;
    superAdminUsers: number;
  };
  meals: {
    totalMeals: number;
    totalCost: number;
    avgCost: number;
    pendingMeals: number;
    approvedMeals: number;
  };
  bazar: {
    totalBazar: number;
    totalAmount: number;
    avgAmount: number;
    pendingBazar: number;
    approvedBazar: number;
  };
  superAdmins: {
    totalSuperAdmins: number;
    activeSuperAdmins: number;
    avgPermissions: number;
    lastActionDate: string | null;
  };
  systemHealth: {
    uptime: number;
    memoryUsage: any;
    nodeVersion: string;
    platform: string;
  };
}

interface User {
  _id: string;
  name: string;
  email: string;
  role: 'super_admin' | 'admin' | 'member';
  status: 'active' | 'inactive';
  joinDate: string;
  lastLogin: string;
}

const SuperAdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const [overview, setOverview] = useState<SystemOverview | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<
    'overview' | 'users' | 'analytics' | 'system'
  >('overview');

  useEffect(() => {
    if (user && user.role === 'super_admin') {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [overviewRes, usersRes] = await Promise.all([
        httpClient.get('/api/super-admin/overview'),
        httpClient.get('/api/super-admin/users'),
      ]);

      if (overviewRes.success) {
        setOverview(overviewRes.data as SystemOverview);
      }

      if (usersRes.success) {
        setUsers((usersRes.data as any).users || []);
      }
    } catch (error) {
      console.error('Error loading super admin data:', error);
      Alert.alert('Error', 'Failed to load super admin data');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleUserAction = async (
    userId: string,
    action: 'activate' | 'deactivate' | 'delete'
  ) => {
    try {
      let message = '';
      let endpoint = '';

      switch (action) {
        case 'activate':
          endpoint = `/api/super-admin/users/${userId}`;
          await httpClient.put(endpoint, { status: 'active' });
          message = 'User activated successfully';
          break;
        case 'deactivate':
          endpoint = `/api/super-admin/users/${userId}`;
          await httpClient.put(endpoint, { status: 'inactive' });
          message = 'User deactivated successfully';
          break;
        case 'delete':
          endpoint = `/api/super-admin/users/${userId}`;
          await httpClient.delete(endpoint);
          message = 'User deleted successfully';
          break;
      }

      Alert.alert('Success', message);
      loadData(); // Reload data
    } catch (error) {
      console.error('Error performing user action:', error);
      Alert.alert('Error', 'Failed to perform user action');
    }
  };

  const confirmUserAction = (
    user: User,
    action: 'activate' | 'deactivate' | 'delete'
  ) => {
    const actionText =
      action === 'delete'
        ? 'delete'
        : action === 'activate'
        ? 'activate'
        : 'deactivate';
    const actionTitle =
      action === 'delete'
        ? 'Delete User'
        : `${action.charAt(0).toUpperCase() + action.slice(1)} User`;

    Alert.alert(
      actionTitle,
      `Are you sure you want to ${actionText} ${user.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: actionText.charAt(0).toUpperCase() + actionText.slice(1),
          style: action === 'delete' ? 'destructive' : 'default',
          onPress: () => handleUserAction(user._id, action),
        },
      ]
    );
  };

  const StatCard: React.FC<{
    title: string;
    value: string | number;
    icon: string;
    color: string;
  }> = ({ title, value, icon, color }) => (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <View style={styles.statHeader}>
        <Ionicons name={icon as any} size={24} color={color} />
        <Text style={styles.statTitle}>{title}</Text>
      </View>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
    </View>
  );

  const UserCard: React.FC<{ user: User }> = ({ user }) => (
    <View style={styles.userCard}>
      <View style={styles.userInfo}>
        <View style={styles.userAvatar}>
          <Text style={styles.userInitial}>
            {user.name.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.userDetails}>
          <Text style={styles.userName}>{user.name}</Text>
          <Text style={styles.userEmail}>{user.email}</Text>
          <View style={styles.userMeta}>
            <View
              style={[
                styles.roleBadge,
                { backgroundColor: getRoleColor(user.role) },
              ]}
            >
              <Text style={styles.roleText}>
                {user.role.replace('_', ' ').toUpperCase()}
              </Text>
            </View>
            <View
              style={[
                styles.statusBadge,
                {
                  backgroundColor:
                    user.status === 'active' ? '#10b981' : '#ef4444',
                },
              ]}
            >
              <Text style={styles.statusText}>{user.status.toUpperCase()}</Text>
            </View>
          </View>
        </View>
      </View>
      <View style={styles.userActions}>
        {user.status === 'active' ? (
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: '#f59e0b' }]}
            onPress={() => confirmUserAction(user, 'deactivate')}
          >
            <Ionicons name='pause' size={16} color='white' />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: '#10b981' }]}
            onPress={() => confirmUserAction(user, 'activate')}
          >
            <Ionicons name='play' size={16} color='white' />
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: '#ef4444' }]}
          onPress={() => confirmUserAction(user, 'delete')}
        >
          <Ionicons name='trash' size={16} color='white' />
        </TouchableOpacity>
      </View>
    </View>
  );

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'super_admin':
        return '#7c3aed';
      case 'admin':
        return '#059669';
      case 'member':
        return '#3b82f6';
      default:
        return '#6b7280';
    }
  };

  if (!user || (user.role as string) !== 'super_admin') {
    return (
      <ThemedView style={styles.container}>
        <Text style={styles.errorText}>
          Access Denied. Super Admin privileges required.
        </Text>
      </ThemedView>
    );
  }

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <Text style={styles.loadingText}>Loading Super Admin Dashboard...</Text>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Super Admin Dashboard</Text>
        <Text style={styles.headerSubtitle}>System Overview & Management</Text>
      </View>

      <View style={styles.tabContainer}>
        {['overview', 'users', 'analytics', 'system'].map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.activeTab]}
            onPress={() => setActiveTab(tab as any)}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === tab && styles.activeTabText,
              ]}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {activeTab === 'overview' && overview && (
          <View>
            <Text style={styles.sectionTitle}>System Overview</Text>

            <View style={styles.statsGrid}>
              <StatCard
                title='Total Users'
                value={overview.users.totalUsers}
                icon='people'
                color='#3b82f6'
              />
              <StatCard
                title='Active Users'
                value={overview.users.activeUsers}
                icon='checkmark-circle'
                color='#10b981'
              />
              <StatCard
                title='Total Meals'
                value={overview.meals.totalMeals}
                icon='fast-food'
                color='#f59e0b'
              />
              <StatCard
                title='Total Bazar'
                value={overview.bazar.totalBazar}
                icon='cart'
                color='#8b5cf6'
              />
            </View>

            <Text style={styles.sectionTitle}>System Health</Text>
            <View style={styles.healthCard}>
              <View style={styles.healthItem}>
                <Text style={styles.healthLabel}>Uptime</Text>
                <Text style={styles.healthValue}>
                  {Math.floor(overview.systemHealth.uptime / 3600)}h
                </Text>
              </View>
              <View style={styles.healthItem}>
                <Text style={styles.healthLabel}>Memory Usage</Text>
                <Text style={styles.healthValue}>
                  {Math.round(
                    overview.systemHealth.memoryUsage.heapUsed / 1024 / 1024
                  )}
                  MB
                </Text>
              </View>
              <View style={styles.healthItem}>
                <Text style={styles.healthLabel}>Node Version</Text>
                <Text style={styles.healthValue}>
                  {overview.systemHealth.nodeVersion}
                </Text>
              </View>
            </View>
          </View>
        )}

        {activeTab === 'users' && (
          <View>
            <Text style={styles.sectionTitle}>User Management</Text>
            <Text style={styles.sectionSubtitle}>
              {users.length} total users
            </Text>

            {users.map(user => (
              <UserCard key={user._id} user={user} />
            ))}
          </View>
        )}

        {activeTab === 'analytics' && (
          <View>
            <Text style={styles.sectionTitle}>Analytics</Text>
            <Text style={styles.comingSoon}>
              Analytics dashboard coming soon...
            </Text>
          </View>
        )}

        {activeTab === 'system' && (
          <View>
            <Text style={styles.sectionTitle}>System Settings</Text>
            <Text style={styles.comingSoon}>
              System settings coming soon...
            </Text>
          </View>
        )}
      </ScrollView>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: 40,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#6b7280',
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#667eea',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  activeTabText: {
    color: '#667eea',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 16,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statCard: {
    width: (width - 60) / 2,
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statTitle: {
    fontSize: 12,
    color: '#6b7280',
    marginLeft: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  healthCard: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  healthItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  healthLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  healthValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  userCard: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
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
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  userInitial: {
    fontSize: 16,
    fontWeight: '600',
    color: '#667eea',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  userMeta: {
    flexDirection: 'row',
    gap: 8,
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  roleText: {
    fontSize: 10,
    color: 'white',
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 10,
    color: 'white',
    fontWeight: '600',
  },
  userActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#ef4444',
    textAlign: 'center',
    marginTop: 50,
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 50,
  },
  comingSoon: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 50,
    fontStyle: 'italic',
  },
});

export default SuperAdminDashboard;
