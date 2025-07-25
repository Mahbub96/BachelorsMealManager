import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Dimensions,
  TextInput,
  FlatList,
} from 'react-native';

const { width } = Dimensions.get('window');
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ThemedText } from '../ThemedText';
import { ThemedView } from '../ThemedView';
import { ActivityCard } from '../cards';
import { MealCard } from '../cards/MealCard';
import { useAuth } from '../../context/AuthContext';
import { useMealManagement } from '../../hooks/useMealManagement';
import mealService from '../../services/mealService';
import { useThemeColor } from '../../hooks/useThemeColor';

const { width: screenWidth } = Dimensions.get('window');

interface MealManagementProps {
  onNavigate?: (screen: string) => void;
}

export const MealManagement: React.FC<MealManagementProps> = ({
  onNavigate,
}) => {
  const { user } = useAuth();

  // Theme colors
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const iconColor = useThemeColor({}, 'icon');
  const borderColor = useThemeColor(
    { light: '#e5e7eb', dark: '#374151' },
    'background'
  );

  const [activeTab, setActiveTab] = useState<'overview' | 'add' | 'history'>(
    'overview'
  );
  const [refreshing, setRefreshing] = useState(false);
  const [selectedMeals, setSelectedMeals] = useState({
    breakfast: false,
    lunch: false,
    dinner: false,
  });
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const isSmallScreen = screenWidth < 375;

  const {
    meals,
    loading,
    error,
    loadMeals,
    refreshMeals,
    handleMealPress,
    handleStatusUpdate,
    handleDeleteMeal,
    handleEditMeal,
  } = useMealManagement();

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshMeals();
    setRefreshing(false);
  };

  const handleAddMeal = () => {
    setActiveTab('add');
  };

  const handleViewHistory = () => {
    setActiveTab('history');
  };

  const toggleMeal = (mealType: 'breakfast' | 'lunch' | 'dinner') => {
    setSelectedMeals(prev => ({
      ...prev,
      [mealType]: !prev[mealType],
    }));
  };

  const handleSubmitMeal = async () => {
    // Validate that at least one meal is selected
    if (
      !selectedMeals.breakfast &&
      !selectedMeals.lunch &&
      !selectedMeals.dinner
    ) {
      Alert.alert('Error', 'Please select at least one meal');
      return;
    }

    setSubmitting(true);
    try {
      const mealData = {
        breakfast: selectedMeals.breakfast,
        lunch: selectedMeals.lunch,
        dinner: selectedMeals.dinner,
        date: new Date().toISOString().split('T')[0],
        notes: notes.trim(),
      };

      const response = await mealService.submitMeal(mealData);

      if (response.success) {
        Alert.alert('Success', 'Meal submitted successfully!');
        // Reset form
        setSelectedMeals({ breakfast: false, lunch: false, dinner: false });
        setNotes('');
        // Refresh meals
        await refreshMeals();
        // Go back to overview
        setActiveTab('overview');
      } else {
        Alert.alert(
          'Error',
          response.message || response.error || 'Failed to submit meal'
        );
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred');
      console.error('Meal submission error:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const getMealSummary = (meal: any) => {
    const meals: string[] = [];
    if (meal?.breakfast) meals.push('Breakfast');
    if (meal?.lunch) meals.push('Lunch');
    if (meal?.dinner) meals.push('Dinner');
    return meals.join(', ') || 'No meals selected';
  };

  const renderOverview = () => {
    return (
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
              <Ionicons name='restaurant' size={40} color='#fff' />
            </View>
            <View style={styles.headerText}>
              <ThemedText style={styles.headerTitle}>
                Meal Management
              </ThemedText>
              <ThemedText style={styles.headerSubtitle}>
                Track and manage your meals
              </ThemedText>
            </View>
          </View>
        </LinearGradient>

        {/* Quick Stats */}
        <View
          style={[styles.statsGrid, isSmallScreen && styles.statsGridSmall]}
        >
          <View style={styles.statCard}>
            <LinearGradient
              colors={['#3b82f6', '#1d4ed8']}
              style={styles.statGradient}
            >
              <Ionicons name='fast-food' size={28} color='#fff' />
              <ThemedText style={styles.statValue}>
                {meals?.length || 0}
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
                {meals?.filter(m => m?.status === 'pending').length || 0}
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
                {meals?.filter(m => m?.status === 'approved').length || 0}
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
                {meals?.filter(m => {
                  if (!m?.date) return false;
                  const today = new Date().toDateString();
                  const mealDate = new Date(m.date).toDateString();
                  return mealDate === today;
                }).length || 0}
              </ThemedText>
              <ThemedText style={styles.statLabel}>Today</ThemedText>
            </LinearGradient>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Quick Actions</ThemedText>
          <View
            style={[
              styles.actionsGrid,
              isSmallScreen && styles.actionsGridSmall,
            ]}
          >
            <TouchableOpacity style={styles.actionCard} onPress={handleAddMeal}>
              <LinearGradient
                colors={['#10b981', '#059669']}
                style={styles.actionGradient}
              >
                <Ionicons name='add-circle' size={36} color='#fff' />
                <ThemedText style={styles.actionTitle}>Add Meal</ThemedText>
                <ThemedText style={styles.actionSubtitle}>
                  Record new meal
                </ThemedText>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={handleViewHistory}
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

        {/* Meal Summary */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Meal Summary</ThemedText>
          <View style={styles.summaryGrid}>
            <View style={styles.summaryCard}>
              <Ionicons name='sunny' size={24} color='#f59e0b' />
              <ThemedText style={styles.summaryValue}>
                {meals?.filter(m => m?.breakfast).length || 0}
              </ThemedText>
              <ThemedText style={styles.summaryLabel}>Breakfast</ThemedText>
            </View>
            <View style={styles.summaryCard}>
              <Ionicons name='partly-sunny' size={24} color='#10b981' />
              <ThemedText style={styles.summaryValue}>
                {meals?.filter(m => m?.lunch).length || 0}
              </ThemedText>
              <ThemedText style={styles.summaryLabel}>Lunch</ThemedText>
            </View>
            <View style={styles.summaryCard}>
              <Ionicons name='moon' size={24} color='#8b5cf6' />
              <ThemedText style={styles.summaryValue}>
                {meals?.filter(m => m?.dinner).length || 0}
              </ThemedText>
              <ThemedText style={styles.summaryLabel}>Dinner</ThemedText>
            </View>
          </View>
        </View>

        {/* Recent Meals */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <ThemedText style={styles.sectionTitle}>Recent Meals</ThemedText>
            <TouchableOpacity
              style={styles.monthFilterButton}
              onPress={() => {
                // Filter for current month
                const currentMonth = new Date().getMonth();
                const currentYear = new Date().getFullYear();
                const filteredMeals = meals?.filter(meal => {
                  const mealDate = new Date(meal.date);
                  return (
                    mealDate.getMonth() === currentMonth &&
                    mealDate.getFullYear() === currentYear
                  );
                });
                // You can implement a state to show filtered meals
                Alert.alert(
                  'Current Month',
                  `Showing ${
                    filteredMeals?.length || 0
                  } meals for current month`
                );
              }}
            >
              <Ionicons name='calendar' size={20} color='#10b981' />
              <ThemedText style={styles.monthFilterText}>
                Current Month
              </ThemedText>
            </TouchableOpacity>
          </View>
          <View style={styles.mealsList}>
            {meals?.slice(0, 5).map((meal, index) => (
              <ActivityCard
                key={meal.id || `meal-${index}`}
                title={`Meal on ${new Date(
                  meal.date || new Date()
                ).toLocaleDateString()}`}
                description={getMealSummary(meal)}
                icon='restaurant'
                iconBackgroundColor='#10b981'
                timestamp={meal.date || new Date().toISOString()}
                amount={`${meal?.breakfast ? 1 : 0}${meal?.lunch ? 1 : 0}${
                  meal?.dinner ? 1 : 0
                } meals`}
                status={
                  meal?.status === 'approved'
                    ? 'success'
                    : meal?.status === 'rejected'
                    ? 'error'
                    : 'warning'
                }
                onPress={() => handleMealPress(meal)}
                variant='compact'
                isSmallScreen={isSmallScreen}
              />
            ))}
            {(!meals || meals.length === 0) && (
              <View style={styles.emptyState}>
                <Ionicons name='restaurant-outline' size={48} color='#9ca3af' />
                <ThemedText style={styles.emptyStateText}>
                  No meals recorded yet
                </ThemedText>
                <ThemedText style={styles.emptyStateSubtext}>
                  Add your first meal to get started
                </ThemedText>
              </View>
            )}
          </View>
        </View>

        {/* Quick Stats */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Quick Stats</ThemedText>
          <View style={styles.quickStatsGrid}>
            <View style={styles.quickStatCard}>
              <ThemedText style={styles.quickStatValue}>
                {meals?.filter(m => m?.status === 'approved').length || 0}
              </ThemedText>
              <ThemedText style={styles.quickStatLabel}>Approved</ThemedText>
            </View>
            <View style={styles.quickStatCard}>
              <ThemedText style={styles.quickStatValue}>
                {meals?.filter(m => m?.status === 'pending').length || 0}
              </ThemedText>
              <ThemedText style={styles.quickStatLabel}>Pending</ThemedText>
            </View>
            <View style={styles.quickStatCard}>
              <ThemedText style={styles.quickStatValue}>
                {meals?.filter(m => m?.status === 'rejected').length || 0}
              </ThemedText>
              <ThemedText style={styles.quickStatLabel}>Rejected</ThemedText>
            </View>
          </View>
        </View>
      </ScrollView>
    );
  };

  const renderAddMeal = () => (
    <ScrollView style={styles.scrollView}>
      <LinearGradient colors={['#10b981', '#059669']} style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerIconContainer}>
            <Ionicons name='add-circle' size={40} color='#fff' />
          </View>
          <View style={styles.headerText}>
            <ThemedText style={styles.headerTitle}>Add New Meal</ThemedText>
            <ThemedText style={styles.headerSubtitle}>
              Record your meal for today
            </ThemedText>
          </View>
        </View>
      </LinearGradient>

      <View style={styles.addMealForm}>
        <View style={styles.formSection}>
          <ThemedText style={styles.formSectionTitle}>Select Meals</ThemedText>
          <View style={styles.mealOptions}>
            <TouchableOpacity
              style={[
                styles.mealOption,
                selectedMeals.breakfast && styles.mealOptionSelected,
              ]}
              onPress={() => toggleMeal('breakfast')}
            >
              <Ionicons
                name='sunny'
                size={24}
                color={selectedMeals.breakfast ? '#fff' : '#f59e0b'}
              />
              <ThemedText
                style={[
                  styles.mealOptionText,
                  selectedMeals.breakfast && styles.mealOptionTextSelected,
                  { color: selectedMeals.breakfast ? '#fff' : textColor },
                ]}
              >
                Breakfast
              </ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.mealOption,
                selectedMeals.lunch && styles.mealOptionSelected,
              ]}
              onPress={() => toggleMeal('lunch')}
            >
              <Ionicons
                name='partly-sunny'
                size={24}
                color={selectedMeals.lunch ? '#fff' : '#10b981'}
              />
              <ThemedText
                style={[
                  styles.mealOptionText,
                  selectedMeals.lunch && styles.mealOptionTextSelected,
                  { color: selectedMeals.lunch ? '#fff' : textColor },
                ]}
              >
                Lunch
              </ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.mealOption,
                selectedMeals.dinner && styles.mealOptionSelected,
              ]}
              onPress={() => toggleMeal('dinner')}
            >
              <Ionicons
                name='moon'
                size={24}
                color={selectedMeals.dinner ? '#fff' : '#8b5cf6'}
              />
              <ThemedText
                style={[
                  styles.mealOptionText,
                  selectedMeals.dinner && styles.mealOptionTextSelected,
                  { color: selectedMeals.dinner ? '#fff' : textColor },
                ]}
              >
                Dinner
              </ThemedText>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.formSection}>
          <ThemedText style={styles.formSectionTitle}>
            Notes (Optional)
          </ThemedText>
          <TextInput
            style={[
              styles.notesInput,
              { backgroundColor, borderColor, color: textColor },
            ]}
            placeholder='Add any special notes about your meal...'
            placeholderTextColor={iconColor}
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={4}
            textAlignVertical='top'
          />
        </View>

        <TouchableOpacity
          style={[
            styles.submitButton,
            submitting && styles.submitButtonDisabled,
          ]}
          onPress={handleSubmitMeal}
          disabled={submitting}
        >
          <ThemedText style={styles.submitButtonText}>
            {submitting ? 'Submitting...' : 'Submit Meal'}
          </ThemedText>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => setActiveTab('overview')}
        >
          <ThemedText style={styles.backButtonText}>
            Back to Overview
          </ThemedText>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  const renderHistory = () => (
    <View style={styles.container}>
      <LinearGradient colors={['#f59e0b', '#d97706']} style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerIconContainer}>
            <Ionicons name='time' size={40} color='#fff' />
          </View>
          <View style={styles.headerText}>
            <ThemedText style={styles.headerTitle}>Meal History</ThemedText>
            <ThemedText style={styles.headerSubtitle}>
              View all your past meals
            </ThemedText>
          </View>
        </View>
      </LinearGradient>

      <View style={styles.historyContent}>
        <View style={styles.historyStats}>
          <View style={[styles.historyStatCard, { backgroundColor }]}>
            <ThemedText style={[styles.historyStatValue, { color: textColor }]}>
              {meals?.length || 0}
            </ThemedText>
            <ThemedText style={[styles.historyStatLabel, { color: iconColor }]}>
              Total Meals
            </ThemedText>
          </View>
          <View style={[styles.historyStatCard, { backgroundColor }]}>
            <ThemedText style={[styles.historyStatValue, { color: textColor }]}>
              {meals?.filter(m => m?.status === 'approved').length || 0}
            </ThemedText>
            <ThemedText style={[styles.historyStatLabel, { color: iconColor }]}>
              Approved
            </ThemedText>
          </View>
        </View>

        <FlatList
          data={meals || []}
          keyExtractor={(item, index) => item.id || `meal-${index}`}
          renderItem={({ item: meal, index }) => (
            <ActivityCard
              title={`Meal on ${new Date(
                meal.date || new Date()
              ).toLocaleDateString()}`}
              description={getMealSummary(meal)}
              icon='restaurant'
              iconBackgroundColor='#10b981'
              timestamp={meal.date || new Date().toISOString()}
              amount={`${meal?.breakfast ? 1 : 0}${meal?.lunch ? 1 : 0}${
                meal?.dinner ? 1 : 0
              } meals`}
              status={
                meal?.status === 'approved'
                  ? 'success'
                  : meal?.status === 'rejected'
                  ? 'error'
                  : 'warning'
              }
              onPress={() => handleMealPress(meal)}
              variant='compact'
              isSmallScreen={isSmallScreen}
            />
          )}
          ListEmptyComponent={() => (
            <View style={styles.emptyState}>
              <Ionicons name='restaurant-outline' size={48} color={iconColor} />
              <ThemedText style={styles.emptyStateText}>
                No meal history found
              </ThemedText>
              <ThemedText style={styles.emptyStateSubtext}>
                Start adding meals to see your history
              </ThemedText>
            </View>
          )}
          contentContainerStyle={styles.historyList}
          showsVerticalScrollIndicator={false}
        />

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => setActiveTab('overview')}
        >
          <ThemedText style={styles.backButtonText}>
            Back to Overview
          </ThemedText>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <ThemedView style={styles.container}>
      {activeTab === 'overview' && renderOverview()}
      {activeTab === 'add' && renderAddMeal()}
      {activeTab === 'history' && renderHistory()}
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 20,
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
    marginRight: 16,
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingHorizontal: 20,
    marginBottom: 24,
    justifyContent: 'space-between',
  },
  statsGridSmall: {
    gap: 12,
    paddingHorizontal: 16,
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
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  monthFilterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#10b981',
  },
  monthFilterText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10b981',
    marginLeft: 6,
  },

  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
  },
  actionsGridSmall: {
    gap: 12,
  },
  summaryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginTop: 8,
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  quickStatsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  quickStatCard: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  quickStatValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  quickStatLabel: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  mealsList: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
    marginTop: 12,
    marginBottom: 4,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#9ca3af',
  },
  addMealForm: {
    padding: 20,
  },
  formSection: {
    marginBottom: 24,
  },
  formSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  mealOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  mealOption: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  mealOptionText: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
  },
  mealOptionSelected: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  mealOptionTextSelected: {
    color: '#fff',
  },
  notesInput: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    minHeight: 100,
    justifyContent: 'center',
  },
  notesPlaceholder: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
  },
  submitButton: {
    backgroundColor: '#10b981',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  historyContent: {
    padding: 20,
  },
  historyStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 24,
  },
  historyStatCard: {
    flex: 1,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  historyStatValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  historyStatLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  historyList: {
    marginBottom: 24,
  },
  backButton: {
    backgroundColor: '#667eea',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
