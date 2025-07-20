import React, { useState, useEffect } from 'react';
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
import { ThemedView } from '../ThemedView';
import { ThemedText } from '../ThemedText';
import { useAuth } from '../../context/AuthContext';
import { useMealManagement } from '../../hooks/useMealManagement';
import { EnhancedMealManagement } from '../meals/EnhancedMealManagement';

interface AdminDashboardProps {
  onNavigate?: (screen: string) => void;
}

interface AdminStats {
  totalMeals: number;
  pendingApprovals: number;
  approvedMeals: number;
  totalMembers: number;
  todayMeals: number;
  weeklyAverage: number;
}

const { width } = Dimensions.get('window');

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  onNavigate,
}) => {
  const { user } = useAuth();
  const [adminStats, setAdminStats] = useState<AdminStats>({
    totalMeals: 0,
    pendingApprovals: 0,
    approvedMeals: 0,
    totalMembers: 0,
    todayMeals: 0,
    weeklyAverage: 0,
  });
  const [activeTab, setActiveTab] = useState<'overview' | 'meals' | 'members'>(
    'overview'
  );
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (user?.role === 'admin' || user?.role === 'super_admin') {
      loadAdminStats();
    }
  }, [user?.role]);

  // Access control - only admin and super admin can see this
  if (user?.role !== 'admin' && user?.role !== 'super_admin') {
    return (
      <ThemedView style={styles.accessDeniedContainer}>
        <LinearGradient
          colors={['#3b82f6', '#1d4ed8']}
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

  const loadAdminStats = async () => {
    try {
      // Simulate API call for admin stats
      const stats: AdminStats = {
        totalMeals: 342,
        pendingApprovals: 18,
        approvedMeals: 324,
        totalMembers: 45,
        todayMeals: 12,
        weeklyAverage: 48,
      };
      setAdminStats(stats);
    } catch (error) {
      console.error('Error loading admin stats:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAdminStats();
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
              onPress: () => console.log('Approve all meals'),
            },
          ]
        );
        break;
      case 'export-data':
        Alert.alert('Export Data', 'Exporting meal data...', [
          { text: 'OK', onPress: () => console.log('Export data') },
        ]);
        break;
      case 'send-notification':
        Alert.alert('Send Notification', 'Send notification to all members?', [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Send', onPress: () => console.log('Send notification') },
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
      <LinearGradient colors={['#3b82f6', '#1d4ed8']} style={styles.header}>
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

      {/* Quick Stats */}
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <LinearGradient
            colors={['#10b981', '#059669']}
            style={styles.statGradient}
          >
            <Ionicons name='fast-food' size={28} color='#fff' />
            <ThemedText style={styles.statValue}>
              {adminStats.totalMeals}
            </ThemedText>
            <ThemedText style={styles.statLabel}>Total Meals</ThemedText>
          </LinearGradient>
        </View>

        <View style={styles.statCard}>
          <LinearGradient
            colors={['#f59e0b', '#d97706']}
            style={styles.statGradient}
          >
            <Ionicons name='time' size={28} color='#fff' />
            <ThemedText style={styles.statValue}>
              {adminStats.pendingApprovals}
            </ThemedText>
            <ThemedText style={styles.statLabel}>Pending</ThemedText>
          </LinearGradient>
        </View>

        <View style={styles.statCard}>
          <LinearGradient
            colors={['#8b5cf6', '#7c3aed']}
            style={styles.statGradient}
          >
            <Ionicons name='checkmark-circle' size={28} color='#fff' />
            <ThemedText style={styles.statValue}>
              {adminStats.approvedMeals}
            </ThemedText>
            <ThemedText style={styles.statLabel}>Approved</ThemedText>
          </LinearGradient>
        </View>

        <View style={styles.statCard}>
          <LinearGradient
            colors={['#06b6d4', '#0891b2']}
            style={styles.statGradient}
          >
            <Ionicons name='people' size={28} color='#fff' />
            <ThemedText style={styles.statValue}>
              {adminStats.totalMembers}
            </ThemedText>
            <ThemedText style={styles.statLabel}>Members</ThemedText>
          </LinearGradient>
        </View>
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
              colors={['#10b981', '#059669']}
              style={styles.actionGradient}
            >
              <Ionicons name='checkmark-circle' size={36} color='#fff' />
              <ThemedText style={styles.actionTitle}>Approve All</ThemedText>
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
              colors={['#f59e0b', '#d97706']}
              style={styles.actionGradient}
            >
              <Ionicons name='download' size={36} color='#fff' />
              <ThemedText style={styles.actionTitle}>Export Data</ThemedText>
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
              colors={['#ec4899', '#be185d']}
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
              colors={['#8b5cf6', '#7c3aed']}
              style={styles.actionGradient}
            >
              <Ionicons name='fast-food' size={36} color='#fff' />
              <ThemedText style={styles.actionTitle}>Manage Meals</ThemedText>
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
        <View style={styles.summaryCard}>
          <LinearGradient
            colors={['#f8fafc', '#f1f5f9']}
            style={styles.summaryGradient}
          >
            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <Ionicons name='sunny' size={24} color='#f59e0b' />
                <ThemedText style={styles.summaryLabel}>Breakfast</ThemedText>
                <ThemedText style={styles.summaryValue}>8 meals</ThemedText>
              </View>
              <View style={styles.summaryItem}>
                <Ionicons name='partly-sunny' size={24} color='#f97316' />
                <ThemedText style={styles.summaryLabel}>Lunch</ThemedText>
                <ThemedText style={styles.summaryValue}>12 meals</ThemedText>
              </View>
              <View style={styles.summaryItem}>
                <Ionicons name='moon' size={24} color='#8b5cf6' />
                <ThemedText style={styles.summaryLabel}>Dinner</ThemedText>
                <ThemedText style={styles.summaryValue}>10 meals</ThemedText>
              </View>
            </View>
            <View style={styles.summaryTotal}>
              <ThemedText style={styles.summaryTotalLabel}>
                Total Today
              </ThemedText>
              <ThemedText style={styles.summaryTotalValue}>
                {adminStats.todayMeals} meals
              </ThemedText>
            </View>
          </LinearGradient>
        </View>
      </View>

      {/* Recent Activity */}
      <View style={styles.section}>
        <ThemedText style={styles.sectionTitle}>Recent Activity</ThemedText>
        <View style={styles.activityList}>
          <View style={styles.activityItem}>
            <View style={styles.activityIcon}>
              <Ionicons name='checkmark-circle' size={20} color='#10b981' />
            </View>
            <View style={styles.activityContent}>
              <ThemedText style={styles.activityTitle}>
                Meal approved by John Doe
              </ThemedText>
              <ThemedText style={styles.activityTime}>2 minutes ago</ThemedText>
            </View>
          </View>

          <View style={styles.activityItem}>
            <View style={styles.activityIcon}>
              <Ionicons name='add-circle' size={20} color='#3b82f6' />
            </View>
            <View style={styles.activityContent}>
              <ThemedText style={styles.activityTitle}>
                New meal submitted by Jane Smith
              </ThemedText>
              <ThemedText style={styles.activityTime}>
                15 minutes ago
              </ThemedText>
            </View>
          </View>

          <View style={styles.activityItem}>
            <View style={styles.activityIcon}>
              <Ionicons name='person-add' size={20} color='#8b5cf6' />
            </View>
            <View style={styles.activityContent}>
              <ThemedText style={styles.activityTitle}>
                New member registered: Mike Johnson
              </ThemedText>
              <ThemedText style={styles.activityTime}>1 hour ago</ThemedText>
            </View>
          </View>
        </View>
      </View>
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

  const renderMembers = () => (
    <View style={styles.tabContent}>
      <ThemedText style={styles.tabTitle}>Member Management</ThemedText>
      <ThemedText style={styles.tabSubtitle}>
        View and manage all members
      </ThemedText>
    </View>
  );

  return (
    <ThemedView style={styles.container}>
      {/* Tab Navigation */}
      <View style={styles.tabNavigation}>
        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === 'overview' && styles.activeTab,
          ]}
          onPress={() => setActiveTab('overview')}
        >
          <Ionicons
            name='grid'
            size={20}
            color={activeTab === 'overview' ? '#3b82f6' : '#6b7280'}
          />
          <ThemedText
            style={[
              styles.tabText,
              activeTab === 'overview' && styles.activeTabText,
            ]}
          >
            Overview
          </ThemedText>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'meals' && styles.activeTab]}
          onPress={() => setActiveTab('meals')}
        >
          <Ionicons
            name='fast-food'
            size={20}
            color={activeTab === 'meals' ? '#3b82f6' : '#6b7280'}
          />
          <ThemedText
            style={[
              styles.tabText,
              activeTab === 'meals' && styles.activeTabText,
            ]}
          >
            Meals
          </ThemedText>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === 'members' && styles.activeTab,
          ]}
          onPress={() => setActiveTab('members')}
        >
          <Ionicons
            name='people'
            size={20}
            color={activeTab === 'members' ? '#3b82f6' : '#6b7280'}
          />
          <ThemedText
            style={[
              styles.tabText,
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
    color: '#3b82f6',
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
    color: '#6b7280',
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
    color: '#6b7280',
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
    borderTopColor: '#e5e7eb',
  },
  summaryTotalLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  summaryTotalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#3b82f6',
  },
  activityList: {
    marginTop: 10,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  activityTime: {
    fontSize: 12,
    color: '#6b7280',
  },
});
