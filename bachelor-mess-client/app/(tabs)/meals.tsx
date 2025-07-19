import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Modal,
  ScrollView,
  SafeAreaView,
  StatusBar,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { MealForm } from '@/components/MealForm';
import { useMealManagement } from '@/hooks/useMealManagement';
import {
  MealStats as MealStatsComponent,
  MealFilter,
  AddMealButton,
  MealListContainer,
} from '@/components/meals';

export default function MealsScreen() {
  const [showAddMealModal, setShowAddMealModal] = useState(false);

  const {
    meals,
    mealStats,
    filters,
    loading,
    refreshing,
    error,
    updateFilters,
    handleMealPress,
    handleStatusUpdate,
    handleDeleteMeal,
    handleEditMeal,
    handleMealSubmitted,
    refreshMeals,
    isAdmin,
    hasMeals,
    pendingMealsCount,
  } = useMealManagement();

  const handleMealSubmittedAndClose = async () => {
    await handleMealSubmitted();
    setShowAddMealModal(false);
  };

  const handleViewAll = () => {
    Alert.alert('View All', 'Detailed meal list view coming soon');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle='light-content' backgroundColor='#667eea' />
      <ThemedView style={styles.container}>
        {/* Header */}
        <LinearGradient
          colors={['#667eea', '#764ba2']}
          style={styles.headerGradient}
        >
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <ThemedText style={styles.headerTitle}>
                Meal Management
              </ThemedText>
              <ThemedText style={styles.headerSubtitle}>
                Track and manage your meal entries
              </ThemedText>
            </View>
            <View style={styles.headerIcon}>
              <Ionicons name='fast-food' size={32} color='#fff' />
            </View>
          </View>
        </LinearGradient>

        {/* Main Content with Enhanced Scrollability */}
        <View style={styles.content}>
          {/* Quick Stats */}
          {mealStats && <MealStatsComponent stats={mealStats} />}

          {/* Filter Buttons */}
          <MealFilter filters={filters} onFilterChange={updateFilters} />

          {/* Add Meal Button */}
          <AddMealButton onPress={() => setShowAddMealModal(true)} />

          {/* Enhanced Meal List Section */}
          <MealListContainer
            title='Recent Meals'
            filters={filters}
            onMealPress={handleMealPress}
            onRefresh={refreshMeals}
            isAdmin={isAdmin}
            onViewAll={handleViewAll}
            meals={meals}
            loading={loading}
            error={error}
            onStatusUpdate={handleStatusUpdate}
            onDelete={handleDeleteMeal}
            onEdit={handleEditMeal}
          />

          {/* Bottom Spacing for Better UX */}
          <View style={styles.bottomSpacing} />
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
              onSuccess={handleMealSubmittedAndClose}
              onCancel={() => setShowAddMealModal(false)}
              showCancel={false}
            />
          </View>
        </Modal>
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#667eea',
  },
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  headerGradient: {
    paddingTop: 20,
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  content: {
    flex: 1,
    paddingBottom: 20,
  },
  bottomSpacing: {
    height: 20,
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
