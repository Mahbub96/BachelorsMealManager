import React, { useState, useCallback } from 'react';
import {
  View,
  ScrollView,
  Pressable,
  RefreshControl,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { ScreenLayout } from '@/components/layout';
import { useTheme } from '@/context/ThemeContext';
import { useActivity } from '@/hooks/useActivity';

interface MealStats {
  totalMeals: number;
  totalBreakfast: number;
  totalLunch: number;
  totalDinner: number;
  pendingMeals: number;
  approvedMeals: number;
  rejectedMeals: number;
  efficiency: number;
  averageMealsPerDay: number;
}

interface StatusFilter {
  key: string;
  label: string;
  status?: string;
  color: string;
}

const statusFilters: StatusFilter[] = [
  { key: 'all', label: 'All', color: '#6b7280' },
  { key: 'pending', label: 'Pending', status: 'pending', color: '#f59e0b' },
  { key: 'approved', label: 'Approved', status: 'approved', color: '#10b981' },
  { key: 'rejected', label: 'Rejected', status: 'rejected', color: '#ef4444' },
];

export default function MealsScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [, setCurrentPage] = useState(1);

  // Activity hook for meals
  const {
    currentMonthMeals,
    loadingMeals,
    errorMeals,
    mealsPagination,
    fetchCurrentMonthMeals,
    refreshMeals,
    clearErrorMeals,
  } = useActivity({
    autoFetch: true,
    // Removed refreshInterval to prevent excessive API calls
  });

  // Handle status filter
  const handleStatusFilter = useCallback(
    (statusKey: string) => {
      setSelectedStatus(statusKey);
      setCurrentPage(1);

      const filter = statusFilters.find(f => f.key === statusKey);
      fetchCurrentMonthMeals(filter?.status, 1, 50);
    },
    [fetchCurrentMonthMeals]
  );

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    await refreshMeals();
  }, [refreshMeals]);

  // Handle meal press
  const handleMealPress = useCallback(
    (meal: { id: string }) => {
      router.push({
        pathname: '/activity-details',
        params: {
          id: meal.id,
          type: 'meal',
          title: 'Meal Details',
        },
      });
    },
    [router]
  );

  // Handle add meal
  const handleAddMeal = useCallback(() => {
    router.push('/activity-details');
  }, [router]);

  // Calculate meal statistics
  const calculateStats = useCallback((): MealStats => {
    if (!currentMonthMeals) {
      return {
        totalMeals: 0,
        totalBreakfast: 0,
        totalLunch: 0,
        totalDinner: 0,
        pendingMeals: 0,
        approvedMeals: 0,
        rejectedMeals: 0,
        efficiency: 0,
        averageMealsPerDay: 0,
      };
    }

    const stats = currentMonthMeals.reduce(
      (acc, meal) => {
        // Count individual meals (breakfast + lunch + dinner), not just entries
        const mealsInEntry = (meal.breakfast ? 1 : 0) + (meal.lunch ? 1 : 0) + (meal.dinner ? 1 : 0);
        acc.totalMeals += mealsInEntry;
        
        if (meal.breakfast) acc.totalBreakfast++;
        if (meal.lunch) acc.totalLunch++;
        if (meal.dinner) acc.totalDinner++;

        switch (meal.status) {
          case 'pending':
            acc.pendingMeals++;
            break;
          case 'approved':
            acc.approvedMeals++;
            break;
          case 'rejected':
            acc.rejectedMeals++;
            break;
        }

        return acc;
      },
      {
        totalMeals: 0,
        totalBreakfast: 0,
        totalLunch: 0,
        totalDinner: 0,
        pendingMeals: 0,
        approvedMeals: 0,
        rejectedMeals: 0,
      }
    );

    return {
      ...stats,
      efficiency:
        stats.totalMeals > 0
          ? Math.round((stats.approvedMeals / stats.totalMeals) * 100)
          : 0,
      averageMealsPerDay: stats.totalMeals / 30, // Assuming 30 days
    };
  }, [currentMonthMeals]);

  const stats = calculateStats();

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return '#10b981';
      case 'rejected':
        return '#ef4444';
      case 'pending':
        return '#f59e0b';
      default:
        return '#6b7280';
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  // Get meal types text
  const getMealTypesText = (meal: { breakfast?: boolean; lunch?: boolean; dinner?: boolean }) => {
    const types = [];
    if (meal.breakfast) types.push('Breakfast');
    if (meal.lunch) types.push('Lunch');
    if (meal.dinner) types.push('Dinner');
    return types.join(', ');
  };

  // Filter meals by status
  const filteredMeals =
    currentMonthMeals?.filter(meal => {
      if (selectedStatus === 'all') return true;
      return meal.status === selectedStatus;
    }) || [];

  return (
    <ScreenLayout
      title="Current Month Meals"
      subtitle="Manage and track your meals"
      showBack
      onBackPress={() => router.back()}
      rightElement={
        <Pressable onPress={handleAddMeal} style={{ padding: 8 }}>
          <Ionicons name="add" size={24} color={theme?.text?.primary ?? '#11181C'} />
        </Pressable>
      }
    >
      <View style={styles.container}>
        <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={loadingMeals} onRefresh={handleRefresh} />
        }
      >
        {/* Statistics Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <ThemedText style={styles.statValue}>
                {stats.totalMeals}
              </ThemedText>
              <ThemedText style={styles.statLabel}>Total Meals</ThemedText>
            </View>
            <View style={styles.statCard}>
              <ThemedText style={styles.statValue}>
                {stats.efficiency}%
              </ThemedText>
              <ThemedText style={styles.statLabel}>Efficiency</ThemedText>
            </View>
            <View style={styles.statCard}>
              <ThemedText style={styles.statValue}>
                {stats.averageMealsPerDay.toFixed(1)}
              </ThemedText>
              <ThemedText style={styles.statLabel}>Avg/Day</ThemedText>
            </View>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <ThemedText style={styles.statValue}>
                {stats.totalBreakfast}
              </ThemedText>
              <ThemedText style={styles.statLabel}>Breakfast</ThemedText>
            </View>
            <View style={styles.statCard}>
              <ThemedText style={styles.statValue}>
                {stats.totalLunch}
              </ThemedText>
              <ThemedText style={styles.statLabel}>Lunch</ThemedText>
            </View>
            <View style={styles.statCard}>
              <ThemedText style={styles.statValue}>
                {stats.totalDinner}
              </ThemedText>
              <ThemedText style={styles.statLabel}>Dinner</ThemedText>
            </View>
          </View>
        </View>

        {/* Status Filters */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterContainer}
        >
          {statusFilters.map(filter => (
            <Pressable
              key={filter.key}
              style={[
                styles.filterTab,
                selectedStatus === filter.key && styles.activeFilterTab,
                { borderColor: filter.color },
              ]}
              onPress={() => handleStatusFilter(filter.key)}
            >
              <ThemedText
                style={[
                  styles.filterText,
                  selectedStatus === filter.key && styles.activeFilterText,
                  {
                    color:
                      selectedStatus === filter.key ? '#fff' : filter.color,
                  },
                ]}
              >
                {filter.label}
              </ThemedText>
            </Pressable>
          ))}
        </ScrollView>

        {/* Error Message */}
        {errorMeals && (
          <View style={styles.errorContainer}>
            <Ionicons name='alert-circle' size={20} color='#ef4444' />
            <ThemedText style={styles.errorText}>{errorMeals}</ThemedText>
            <Pressable style={styles.retryButton} onPress={clearErrorMeals}>
              <ThemedText style={styles.retryButtonText}>Retry</ThemedText>
            </Pressable>
          </View>
        )}

        {/* Meals List */}
        <View style={styles.mealsContainer}>
          {filteredMeals.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name='restaurant' size={48} color='#9ca3af' />
              <ThemedText style={styles.emptyStateTitle}>
                {loadingMeals ? 'Loading meals...' : 'No meals found'}
              </ThemedText>
              <ThemedText style={styles.emptyStateSubtitle}>
                {loadingMeals
                  ? 'Please wait while we fetch your meals'
                  : 'Add your first meal for this month'}
              </ThemedText>
              {!loadingMeals && (
                <Pressable style={styles.addMealButton} onPress={handleAddMeal}>
                  <ThemedText style={styles.addMealButtonText}>
                    Add Meal
                  </ThemedText>
                </Pressable>
              )}
            </View>
          ) : (
            filteredMeals.map((meal, index) => (
              <Pressable
                key={`${meal.id}-${index}`}
                style={styles.mealCard}
                onPress={() => handleMealPress(meal)}
              >
                <View style={styles.mealHeader}>
                  <View style={styles.mealIcon}>
                    <Ionicons name='restaurant' size={20} color='#667eea' />
                  </View>
                  <View style={styles.mealInfo}>
                    <ThemedText style={styles.mealDate}>
                      {formatDate(meal.date)}
                    </ThemedText>
                    <ThemedText style={styles.mealTypes} numberOfLines={1}>
                      {getMealTypesText(meal)}
                    </ThemedText>
                    {meal.notes && (
                      <ThemedText style={styles.mealNotes} numberOfLines={2}>
                        {meal.notes}
                      </ThemedText>
                    )}
                  </View>
                  <View style={styles.mealActions}>
                    <View
                      style={[
                        styles.statusBadge,
                        { backgroundColor: getStatusColor(meal.status) },
                      ]}
                    >
                      <ThemedText style={styles.statusText}>
                        {meal.status}
                      </ThemedText>
                    </View>
                    {meal.approvedBy && (
                      <ThemedText style={styles.approvedBy}>
                        by {meal.approvedBy.name}
                      </ThemedText>
                    )}
                  </View>
                </View>
              </Pressable>
            ))
          )}
        </View>

        {/* Pagination Info */}
        {mealsPagination && mealsPagination.total > 0 && (
          <View style={styles.paginationInfo}>
            <ThemedText style={styles.paginationText}>
              Showing{' '}
              {mealsPagination.page * mealsPagination.limit -
                mealsPagination.limit +
                1}{' '}
              to{' '}
              {Math.min(
                mealsPagination.page * mealsPagination.limit,
                mealsPagination.total
              )}{' '}
              of {mealsPagination.total} meals
            </ThemedText>
          </View>
        )}
        </ScrollView>
      </View>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  content: {
    flex: 1,
  },
  statsContainer: {
    padding: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 4,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
  filterContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 12,
    borderRadius: 20,
    borderWidth: 1,
    backgroundColor: '#fff',
  },
  activeFilterTab: {
    backgroundColor: '#667eea',
    borderColor: '#667eea',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
  },
  activeFilterText: {
    color: '#fff',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    margin: 16,
    backgroundColor: '#fef2f2',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  errorText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: '#dc2626',
  },
  retryButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#dc2626',
    borderRadius: 6,
  },
  retryButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  mealsContainer: {
    padding: 16,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6b7280',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtitle: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    marginBottom: 24,
  },
  addMealButton: {
    backgroundColor: '#667eea',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  addMealButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  mealCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  mealHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  mealIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f9ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  mealInfo: {
    flex: 1,
  },
  mealDate: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  mealTypes: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  mealNotes: {
    fontSize: 12,
    color: '#9ca3af',
    fontStyle: 'italic',
  },
  mealActions: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#fff',
    textTransform: 'uppercase',
  },
  approvedBy: {
    fontSize: 10,
    color: '#9ca3af',
  },
  paginationInfo: {
    padding: 16,
    alignItems: 'center',
  },
  paginationText: {
    fontSize: 12,
    color: '#9ca3af',
  },
});
