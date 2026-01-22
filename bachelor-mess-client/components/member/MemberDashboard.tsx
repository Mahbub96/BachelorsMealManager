import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ThemedView } from '../ThemedView';
import { ThemedText } from '../ThemedText';
import { useAuth } from '../../context/AuthContext';
import { EnhancedMealManagement } from '../meals/EnhancedMealManagement';
import { mealService } from '../../services/mealService';

interface MemberDashboardProps {
  onNavigate?: (screen: string) => void;
}

interface MemberStats {
  totalMeals: number;
  thisWeek: number;
  thisMonth: number;
  pendingMeals: number;
  approvedMeals: number;
  averagePerDay: number;
}

const { width } = Dimensions.get('window');

export const MemberDashboard: React.FC<MemberDashboardProps> = ({
  onNavigate,
}) => {
  const { user } = useAuth();
  const [memberStats, setMemberStats] = useState<MemberStats>({
    totalMeals: 0,
    thisWeek: 0,
    thisMonth: 0,
    pendingMeals: 0,
    approvedMeals: 0,
    averagePerDay: 0,
  });
  const [activeTab, setActiveTab] = useState<'overview' | 'meals' | 'history'>(
    'overview'
  );
  const [refreshing, setRefreshing] = useState(false);

  const loadMemberStats = async () => {
    try {
      // Fetch real meal statistics from API
      const response = await mealService.getUserMealStats();
      
      if (response.success && response.data) {
        const data = response.data;
        // Calculate average per day (assuming last 30 days, or use totalEntries)
        const totalEntries = data.totalEntries || 0;
        const averagePerDay = totalEntries > 0 ? (data.totalMeals || 0) / 30 : 0;
        
        const stats: MemberStats = {
          totalMeals: data.totalMeals || 0,
          thisWeek: 0, // TODO: Calculate from date range if needed
          thisMonth: data.approvedCount || 0, // Using approved count as this month
          pendingMeals: data.pendingCount || 0,
          approvedMeals: data.approvedCount || 0,
          averagePerDay: averagePerDay,
        };
        setMemberStats(stats);
      } else {
        console.error('Failed to load member stats:', response.error);
        // Set defaults on error
        setMemberStats({
          totalMeals: 0,
          thisWeek: 0,
          thisMonth: 0,
          pendingMeals: 0,
          approvedMeals: 0,
          averagePerDay: 0,
        });
      }
    } catch (error) {
      console.error('Error loading member stats:', error);
      // Set defaults on error
      setMemberStats({
        totalMeals: 0,
        thisWeek: 0,
        thisMonth: 0,
        pendingMeals: 0,
        approvedMeals: 0,
        averagePerDay: 0,
      });
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadMemberStats();
    setRefreshing(false);
  };

  useEffect(() => {
    if (user?.role === 'member') {
      loadMemberStats();
    }
  }, [user?.role]);

  // Access control - only members can see this
  if (user?.role !== 'member') {
    return (
      <ThemedView style={styles.accessDeniedContainer}>
        <LinearGradient
          colors={['#10b981', '#059669']}
          style={styles.accessDeniedGradient}
        >
          <Ionicons name='person' size={80} color='#fff' />
          <ThemedText style={styles.accessDeniedTitle}>
            Access Denied
          </ThemedText>
          <ThemedText style={styles.accessDeniedText}>
            This area is restricted to Members only.
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
      <LinearGradient colors={['#10b981', '#059669']} style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerIconContainer}>
            <Ionicons name='person' size={40} color='#fff' />
          </View>
          <View style={styles.headerText}>
            <ThemedText style={styles.headerTitle}>My Dashboard</ThemedText>
            <ThemedText style={styles.headerSubtitle}>
              Welcome back, {user?.name}!
            </ThemedText>
          </View>
        </View>
      </LinearGradient>

      {/* Quick Stats */}
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <LinearGradient
            colors={['#3b82f6', '#1d4ed8']}
            style={styles.statGradient}
          >
            <Ionicons name='fast-food' size={28} color='#fff' />
            <ThemedText style={styles.statValue}>
              {memberStats.totalMeals}
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
              {memberStats.pendingMeals}
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
              {memberStats.approvedMeals}
            </ThemedText>
            <ThemedText style={styles.statLabel}>Approved</ThemedText>
          </LinearGradient>
        </View>

        <View style={styles.statCard}>
          <LinearGradient
            colors={['#06b6d4', '#0891b2']}
            style={styles.statGradient}
          >
            <Ionicons name='calendar' size={28} color='#fff' />
            <ThemedText style={styles.statValue}>
              {memberStats.thisWeek}
            </ThemedText>
            <ThemedText style={styles.statLabel}>This Week</ThemedText>
          </LinearGradient>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <ThemedText style={styles.sectionTitle}>Quick Actions</ThemedText>
        <View style={styles.actionsGrid}>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => setActiveTab('meals')}
          >
            <LinearGradient
              colors={['#10b981', '#059669']}
              style={styles.actionGradient}
            >
              <Ionicons name='add-circle' size={36} color='#fff' />
              <ThemedText style={styles.actionTitle}>Add Meal</ThemedText>
              <ThemedText style={styles.actionSubtitle}>
                Submit new meal
              </ThemedText>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => setActiveTab('history')}
          >
            <LinearGradient
              colors={['#f59e0b', '#d97706']}
              style={styles.actionGradient}
            >
              <Ionicons name='time' size={36} color='#fff' />
              <ThemedText style={styles.actionTitle}>Meal History</ThemedText>
              <ThemedText style={styles.actionSubtitle}>
                View past meals
              </ThemedText>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => onNavigate?.('profile')}
          >
            <LinearGradient
              colors={['#8b5cf6', '#7c3aed']}
              style={styles.actionGradient}
            >
              <Ionicons name='person' size={36} color='#fff' />
              <ThemedText style={styles.actionTitle}>My Profile</ThemedText>
              <ThemedText style={styles.actionSubtitle}>
                Update profile
              </ThemedText>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => onNavigate?.('settings')}
          >
            <LinearGradient
              colors={['#ec4899', '#be185d']}
              style={styles.actionGradient}
            >
              <Ionicons name='settings' size={36} color='#fff' />
              <ThemedText style={styles.actionTitle}>Settings</ThemedText>
              <ThemedText style={styles.actionSubtitle}>
                App preferences
              </ThemedText>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>

      {/* This Week&apos;s Summary */}
      <View style={styles.section}>
        <ThemedText style={styles.sectionTitle}>
          This Week&apos;s Summary
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
                <ThemedText style={styles.summaryValue}>3 meals</ThemedText>
              </View>
              <View style={styles.summaryItem}>
                <Ionicons name='partly-sunny' size={24} color='#f97316' />
                <ThemedText style={styles.summaryLabel}>Lunch</ThemedText>
                <ThemedText style={styles.summaryValue}>5 meals</ThemedText>
              </View>
              <View style={styles.summaryItem}>
                <Ionicons name='moon' size={24} color='#8b5cf6' />
                <ThemedText style={styles.summaryLabel}>Dinner</ThemedText>
                <ThemedText style={styles.summaryValue}>4 meals</ThemedText>
              </View>
            </View>
            <View style={styles.summaryTotal}>
              <ThemedText style={styles.summaryTotalLabel}>
                Weekly Total
              </ThemedText>
              <ThemedText style={styles.summaryTotalValue}>
                {memberStats.thisWeek} meals
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
                Meal approved for today
              </ThemedText>
              <ThemedText style={styles.activityTime}>2 hours ago</ThemedText>
            </View>
          </View>

          <View style={styles.activityItem}>
            <View style={styles.activityIcon}>
              <Ionicons name='add-circle' size={20} color='#3b82f6' />
            </View>
            <View style={styles.activityContent}>
              <ThemedText style={styles.activityTitle}>
                New meal submitted
              </ThemedText>
              <ThemedText style={styles.activityTime}>Yesterday</ThemedText>
            </View>
          </View>

          <View style={styles.activityItem}>
            <View style={styles.activityIcon}>
              <Ionicons name='calendar' size={20} color='#8b5cf6' />
            </View>
            <View style={styles.activityContent}>
              <ThemedText style={styles.activityTitle}>
                Weekly summary available
              </ThemedText>
              <ThemedText style={styles.activityTime}>3 days ago</ThemedText>
            </View>
          </View>
        </View>
      </View>

      {/* Tips Section */}
      <View style={styles.section}>
        <ThemedText style={styles.sectionTitle}>
          Tips &amp; Reminders
        </ThemedText>
        <View style={styles.tipsCard}>
          <LinearGradient
            colors={['#fef3c7', '#fde68a']}
            style={styles.tipsGradient}
          >
            <View style={styles.tipContent}>
              <Ionicons name='bulb' size={24} color='#d97706' />
              <View style={styles.tipText}>
                <ThemedText style={styles.tipTitle}>Pro Tip</ThemedText>
                <ThemedText style={styles.tipDescription}>
                  Submit your meals early to ensure they get approved on time!
                </ThemedText>
              </View>
            </View>
          </LinearGradient>
        </View>
      </View>
    </ScrollView>
  );

  const renderMeals = () => (
    <View style={styles.tabContent}>
      <ThemedText style={styles.tabTitle}>Meal Management</ThemedText>
      <ThemedText style={styles.tabSubtitle}>
        Add and manage your meal submissions
      </ThemedText>
      <EnhancedMealManagement />
    </View>
  );

  const renderHistory = () => (
    <View style={styles.tabContent}>
      <ThemedText style={styles.tabTitle}>Meal History</ThemedText>
      <ThemedText style={styles.tabSubtitle}>
        View your past meal submissions and statistics
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
            color={activeTab === 'overview' ? '#10b981' : '#6b7280'}
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
            color={activeTab === 'meals' ? '#10b981' : '#6b7280'}
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
            activeTab === 'history' && styles.activeTab,
          ]}
          onPress={() => setActiveTab('history')}
        >
          <Ionicons
            name='time'
            size={20}
            color={activeTab === 'history' ? '#10b981' : '#6b7280'}
          />
          <ThemedText
            style={[
              styles.tabText,
              activeTab === 'history' && styles.activeTabText,
            ]}
          >
            History
          </ThemedText>
        </TouchableOpacity>
      </View>

      {/* Tab Content */}
      {activeTab === 'overview' && renderOverview()}
      {activeTab === 'meals' && renderMeals()}
      {activeTab === 'history' && renderHistory()}
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
    color: '#10b981',
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
    color: '#10b981',
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
  tipsCard: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  tipsGradient: {
    padding: 20,
  },
  tipContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tipText: {
    flex: 1,
    marginLeft: 15,
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#d97706',
    marginBottom: 4,
  },
  tipDescription: {
    fontSize: 14,
    color: '#92400e',
    lineHeight: 20,
  },
});
