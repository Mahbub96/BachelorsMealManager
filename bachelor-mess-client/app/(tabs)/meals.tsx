import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Modal,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { MealForm } from '@/components/MealForm';
import { MealList } from '@/components/MealList';
import mealService, { MealFilters, MealStats } from '@/services/mealService';
import { useAuth } from '@/context/AuthContext';

export default function MealsScreen() {
  const { user } = useAuth();
  const [showAddMealModal, setShowAddMealModal] = useState(false);
  const [mealStats, setMealStats] = useState<MealStats | null>(null);
  const [filters, setFilters] = useState<MealFilters>({
    status: 'approved',
    limit: 10,
  });
  const [loading, setLoading] = useState(false);

  const loadMealStats = async () => {
    try {
      const response = await mealService.getUserMealStats();
      if (response.success && response.data) {
        setMealStats(response.data);
      }
    } catch (error) {
      console.error('Error loading meal stats:', error);
    }
  };

  const handleMealSubmitted = () => {
    setShowAddMealModal(false);
    loadMealStats();
  };

  const handleMealPress = (meal: any) => {
    Alert.alert(
      'Meal Details',
      `Date: ${mealService.formatMealDate(meal.date)}\nStatus: ${
        meal.status
      }\n${meal.notes ? `Notes: ${meal.notes}` : ''}`
    );
  };

  const handleFilterChange = (newFilters: MealFilters) => {
    setFilters(newFilters);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return '#f59e0b';
      case 'approved':
        return '#10b981';
      case 'rejected':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return 'time';
      case 'approved':
        return 'checkmark-circle';
      case 'rejected':
        return 'close-circle';
      default:
        return 'help-circle';
    }
  };

  useEffect(() => {
    loadMealStats();
  }, []);

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.headerGradient}
      >
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <ThemedText style={styles.headerTitle}>Meal Management</ThemedText>
            <ThemedText style={styles.headerSubtitle}>
              Track and manage your meal entries
            </ThemedText>
          </View>
          <View style={styles.headerIcon}>
            <Ionicons name='fast-food' size={32} color='#fff' />
          </View>
        </View>
      </LinearGradient>

      <View style={styles.content}>
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
                <Ionicons name='trending-up' size={24} color='#fff' />
                <ThemedText style={styles.statValue}>
                  {mealStats.approvedCount}
                </ThemedText>
                <ThemedText style={styles.statLabel}>Approved</ThemedText>
              </LinearGradient>
            </View>

            <View style={styles.statCard}>
              <LinearGradient
                colors={['#43e97b', '#38f9d7']}
                style={styles.statGradient}
              >
                <Ionicons name='time' size={24} color='#fff' />
                <ThemedText style={styles.statValue}>
                  {mealStats.pendingCount}
                </ThemedText>
                <ThemedText style={styles.statLabel}>Pending</ThemedText>
              </LinearGradient>
            </View>
          </View>
        )}

        {/* Filter Buttons */}
        <View style={styles.filterContainer}>
          <ThemedText style={styles.filterTitle}>Filter by Status</ThemedText>
          <View style={styles.filterButtons}>
            {[
              { key: 'all', label: 'All', status: undefined },
              { key: 'pending', label: 'Pending', status: 'pending' as const },
              {
                key: 'approved',
                label: 'Approved',
                status: 'approved' as const,
              },
              {
                key: 'rejected',
                label: 'Rejected',
                status: 'rejected' as const,
              },
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

        {/* Add Meal Button */}
        <TouchableOpacity
          style={styles.addMealButton}
          onPress={() => setShowAddMealModal(true)}
        >
          <LinearGradient
            colors={['#667eea', '#764ba2']}
            style={styles.addMealButtonGradient}
          >
            <Ionicons name='add' size={24} color='#fff' />
            <ThemedText style={styles.addMealButtonText}>
              Add New Meal
            </ThemedText>
          </LinearGradient>
        </TouchableOpacity>

        {/* Meal List */}
        <View style={styles.mealListContainer}>
          <ThemedText style={styles.sectionTitle}>Recent Meals</ThemedText>
          <MealList
            filters={filters}
            onMealPress={handleMealPress}
            onRefresh={loadMealStats}
            isAdmin={user?.role === 'admin'}
          />
        </View>
      </View>

      {/* Add Meal Modal */}
      <Modal
        visible={showAddMealModal}
        animationType='slide'
        presentationStyle='pageSheet'
        onRequestClose={() => setShowAddMealModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowAddMealModal(false)}
            >
              <Ionicons name='close' size={24} color='#6b7280' />
            </TouchableOpacity>
            <ThemedText style={styles.modalTitle}>Add New Meal</ThemedText>
            <View style={styles.placeholder} />
          </View>
          <MealForm
            onSuccess={handleMealSubmitted}
            onCancel={() => setShowAddMealModal(false)}
            showCancel={false}
          />
        </View>
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
  content: {
    flex: 1,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    marginHorizontal: 4,
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
    minHeight: 120,
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
  filterContainer: {
    paddingHorizontal: 20,
    marginBottom: 24,
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
  addMealButton: {
    marginHorizontal: 20,
    marginBottom: 24,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  addMealButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  addMealButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 8,
  },
  mealListContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    backgroundColor: '#fff',
  },
  closeButton: {
    padding: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  placeholder: {
    width: 40,
  },
});
