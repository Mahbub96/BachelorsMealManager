import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Modal,
  ScrollView,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { MealList } from '@/components/MealList';
import { MealDetails } from '@/components/MealDetails';
import mealService, {
  MealFilters,
  MealStats,
  MealEntry,
} from '@/services/mealService';
import { useAuth } from '@/context/AuthContext';

export default function AdminScreen() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [mealStats, setMealStats] = useState<MealStats | null>(null);
  const [filters, setFilters] = useState<MealFilters>({
    status: 'pending',
    limit: 20,
  });
  const [selectedMeal, setSelectedMeal] = useState<MealEntry | null>(null);
  const [showMealDetails, setShowMealDetails] = useState(false);
  const [loading, setLoading] = useState(false);

  const loadMealStats = async () => {
    try {
      setLoading(true);
      const response = await mealService.getMealStats();
      if (response.success && response.data) {
        setMealStats(response.data);
      } else {
        console.error('Failed to load meal stats:', response.error);
      }
    } catch (error) {
      console.error('Error loading meal stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMealPress = (meal: MealEntry) => {
    setSelectedMeal(meal);
    setShowMealDetails(true);
  };

  const handleFilterChange = (newFilters: MealFilters) => {
    setFilters(newFilters);
  };

  const handleBulkApprove = async () => {
    Alert.alert(
      'Bulk Approve',
      'Are you sure you want to approve all pending meals?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve All',
          onPress: async () => {
            try {
              // This would need to be implemented with actual meal IDs
              Alert.alert('Info', 'Bulk approve feature coming soon!');
            } catch (error) {
              Alert.alert('Error', 'Failed to bulk approve meals');
            }
          },
        },
      ]
    );
  };

  const tabs = [
    { key: 'overview', label: 'Overview', icon: 'grid' },
    { key: 'meals', label: 'Meals', icon: 'fast-food' },
    { key: 'users', label: 'Users', icon: 'people' },
    { key: 'reports', label: 'Reports', icon: 'analytics' },
  ];

  useEffect(() => {
    loadMealStats();
  }, []);

  const renderOverview = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      {/* Quick Stats */}
      {mealStats && (
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <LinearGradient
              colors={['#667eea', '#764ba2']}
              style={styles.statGradient}
            >
              <Ionicons name='fast-food' size={24} color='#fff' />
              <ThemedText style={styles.statValue}>
                {mealStats.totalMeals}
              </ThemedText>
              <ThemedText style={styles.statLabel}>Total Meals</ThemedText>
            </LinearGradient>
          </View>

          <View style={styles.statCard}>
            <LinearGradient
              colors={['#f093fb', '#f5576c']}
              style={styles.statGradient}
            >
              <Ionicons name='time' size={24} color='#fff' />
              <ThemedText style={styles.statValue}>
                {mealStats.pendingCount}
              </ThemedText>
              <ThemedText style={styles.statLabel}>Pending</ThemedText>
            </LinearGradient>
          </View>

          <View style={styles.statCard}>
            <LinearGradient
              colors={['#43e97b', '#38f9d7']}
              style={styles.statGradient}
            >
              <Ionicons name='checkmark-circle' size={24} color='#fff' />
              <ThemedText style={styles.statValue}>
                {mealStats.approvedCount}
              </ThemedText>
              <ThemedText style={styles.statLabel}>Approved</ThemedText>
            </LinearGradient>
          </View>

          <View style={styles.statCard}>
            <LinearGradient
              colors={['#fa709a', '#fee140']}
              style={styles.statGradient}
            >
              <Ionicons name='close-circle' size={24} color='#fff' />
              <ThemedText style={styles.statValue}>
                {mealStats.rejectedCount}
              </ThemedText>
              <ThemedText style={styles.statLabel}>Rejected</ThemedText>
            </LinearGradient>
          </View>
        </View>
      )}

      {/* Quick Actions */}
      <View style={styles.quickActionsContainer}>
        <ThemedText style={styles.sectionTitle}>Quick Actions</ThemedText>
        <View style={styles.quickActionsGrid}>
          <TouchableOpacity
            style={styles.quickActionCard}
            onPress={() => setActiveTab('meals')}
          >
            <LinearGradient
              colors={['#667eea', '#764ba2']}
              style={styles.quickActionGradient}
            >
              <Ionicons name='fast-food' size={32} color='#fff' />
              <ThemedText style={styles.quickActionTitle}>
                Manage Meals
              </ThemedText>
              <ThemedText style={styles.quickActionSubtitle}>
                Review and approve meal entries
              </ThemedText>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickActionCard}
            onPress={handleBulkApprove}
          >
            <LinearGradient
              colors={['#10b981', '#059669']}
              style={styles.quickActionGradient}
            >
              <Ionicons name='checkmark-circle' size={32} color='#fff' />
              <ThemedText style={styles.quickActionTitle}>
                Bulk Approve
              </ThemedText>
              <ThemedText style={styles.quickActionSubtitle}>
                Approve all pending meals
              </ThemedText>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickActionCard}
            onPress={() => setActiveTab('users')}
          >
            <LinearGradient
              colors={['#f093fb', '#f5576c']}
              style={styles.quickActionGradient}
            >
              <Ionicons name='people' size={32} color='#fff' />
              <ThemedText style={styles.quickActionTitle}>
                Manage Users
              </ThemedText>
              <ThemedText style={styles.quickActionSubtitle}>
                Add and manage members
              </ThemedText>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickActionCard}
            onPress={() => setActiveTab('reports')}
          >
            <LinearGradient
              colors={['#43e97b', '#38f9d7']}
              style={styles.quickActionGradient}
            >
              <Ionicons name='analytics' size={32} color='#fff' />
              <ThemedText style={styles.quickActionTitle}>Reports</ThemedText>
              <ThemedText style={styles.quickActionSubtitle}>
                View detailed analytics
              </ThemedText>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );

  const renderMeals = () => (
    <View style={styles.tabContent}>
      {/* Filter Buttons */}
      <View style={styles.filterContainer}>
        <ThemedText style={styles.filterTitle}>Filter by Status</ThemedText>
        <View style={styles.filterButtons}>
          {[
            { key: 'all', label: 'All', status: undefined },
            { key: 'pending', label: 'Pending', status: 'pending' as const },
            { key: 'approved', label: 'Approved', status: 'approved' as const },
            { key: 'rejected', label: 'Rejected', status: 'rejected' as const },
          ].map(filter => (
            <TouchableOpacity
              key={filter.key}
              style={[
                styles.filterButton,
                filters.status === filter.status && styles.filterButtonActive,
              ]}
              onPress={() =>
                handleFilterChange({ ...filters, status: filter.status })
              }
            >
              <ThemedText
                style={[
                  styles.filterButtonText,
                  filters.status === filter.status &&
                    styles.filterButtonTextActive,
                ]}
              >
                {filter.label}
              </ThemedText>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Meal List */}
      <MealList
        filters={filters}
        onMealPress={handleMealPress}
        onRefresh={loadMealStats}
        isAdmin={true}
        showUserInfo={true}
      />
    </View>
  );

  const renderUsers = () => (
    <View style={styles.tabContent}>
      <ThemedText style={styles.comingSoon}>
        User Management Coming Soon
      </ThemedText>
    </View>
  );

  const renderReports = () => (
    <View style={styles.tabContent}>
      <ThemedText style={styles.comingSoon}>Reports Coming Soon</ThemedText>
    </View>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverview();
      case 'meals':
        return renderMeals();
      case 'users':
        return renderUsers();
      case 'reports':
        return renderReports();
      default:
        return renderOverview();
    }
  };

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['#667eea', '#764ba2']}
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
            <Ionicons name='settings' size={32} color='#fff' />
          </View>
        </View>
      </LinearGradient>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabScrollContent}
        >
          {tabs.map(tab => (
            <TouchableOpacity
              key={tab.key}
              style={[
                styles.tabButton,
                activeTab === tab.key && styles.tabButtonActive,
              ]}
              onPress={() => setActiveTab(tab.key)}
            >
              <Ionicons
                name={tab.icon as any}
                size={20}
                color={activeTab === tab.key ? '#667eea' : '#6b7280'}
              />
              <ThemedText
                style={[
                  styles.tabButtonText,
                  activeTab === tab.key && styles.tabButtonTextActive,
                ]}
              >
                {tab.label}
              </ThemedText>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Tab Content */}
      {renderTabContent()}

      {/* Meal Details Modal */}
      <Modal
        visible={showMealDetails}
        animationType='slide'
        presentationStyle='pageSheet'
        onRequestClose={() => setShowMealDetails(false)}
      >
        {selectedMeal && (
          <MealDetails
            meal={selectedMeal}
            onClose={() => setShowMealDetails(false)}
            isAdmin={true}
          />
        )}
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  headerGradient: {
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  headerIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabContainer: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  tabScrollContent: {
    paddingHorizontal: 20,
  },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginRight: 8,
    gap: 8,
  },
  tabButtonActive: {
    borderBottomWidth: 2,
    borderBottomColor: '#667eea',
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  tabButtonTextActive: {
    color: '#667eea',
    fontWeight: '600',
  },
  tabContent: {
    flex: 1,
    padding: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statCard: {
    width: '48%',
    marginBottom: 12,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  statGradient: {
    padding: 20,
    alignItems: 'center',
    minHeight: 100,
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
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
  },
  quickActionsContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickActionCard: {
    width: '48%',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  quickActionGradient: {
    padding: 20,
    alignItems: 'center',
    minHeight: 120,
  },
  quickActionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 12,
    marginBottom: 4,
    textAlign: 'center',
  },
  quickActionSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
  },
  filterContainer: {
    marginBottom: 16,
  },
  filterTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  filterButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: '#667eea',
    borderColor: '#667eea',
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  filterButtonTextActive: {
    color: '#fff',
  },
  comingSoon: {
    fontSize: 18,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 100,
  },
});
