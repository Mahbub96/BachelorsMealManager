import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';
import mealService, { MealEntry, MealFilters } from '../services/mealService';

interface MealListProps {
  filters?: MealFilters;
  showUserInfo?: boolean;
  onMealPress?: (meal: MealEntry) => void;
  onRefresh?: () => void;
  isAdmin?: boolean;
}

export const MealList: React.FC<MealListProps> = ({
  filters = {},
  showUserInfo = false,
  onMealPress,
  onRefresh,
  isAdmin = false,
}) => {
  const [meals, setMeals] = useState<MealEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });

  const loadMeals = async (page = 1, isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const response = await mealService.getUserMeals({
        ...filters,
        page,
        limit: pagination.limit,
      });

      if (response.success && response.data) {
        if (page === 1 || isRefresh) {
          setMeals(response.data.meals);
        } else {
          setMeals(prev => [...prev, ...response.data!.meals]);
        }
        setPagination(response.data.pagination);
      } else {
        setError(response.error || 'Failed to load meals');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    await loadMeals(1, true);
    onRefresh?.();
  };

  const handleLoadMore = () => {
    if (pagination.page < pagination.pages && !loading) {
      loadMeals(pagination.page + 1);
    }
  };

  const handleMealStatusUpdate = async (
    mealId: string,
    status: 'approved' | 'rejected'
  ) => {
    try {
      const response = await mealService.updateMealStatus(mealId, { status });

      if (response.success) {
        // Update the meal in the list
        setMeals(prev =>
          prev.map(meal =>
            meal.id === mealId
              ? { ...meal, status, approvedAt: new Date().toISOString() }
              : meal
          )
        );
        Alert.alert('Success', `Meal ${status} successfully`);
      } else {
        Alert.alert('Error', response.error || 'Failed to update meal status');
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred');
    }
  };

  const handleDeleteMeal = async (mealId: string) => {
    Alert.alert(
      'Delete Meal',
      'Are you sure you want to delete this meal entry?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await mealService.deleteMeal(mealId);

              if (response.success) {
                setMeals(prev => prev.filter(meal => meal.id !== mealId));
                Alert.alert('Success', 'Meal deleted successfully');
              } else {
                Alert.alert('Error', response.error || 'Failed to delete meal');
              }
            } catch (error) {
              Alert.alert('Error', 'An unexpected error occurred');
            }
          },
        },
      ]
    );
  };

  useEffect(() => {
    loadMeals();
  }, [filters]);

  const renderMealItem = ({ item: meal }: { item: MealEntry }) => {
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

    const mealTypes = [];
    if (meal.breakfast) mealTypes.push('Breakfast');
    if (meal.lunch) mealTypes.push('Lunch');
    if (meal.dinner) mealTypes.push('Dinner');

    return (
      <TouchableOpacity
        style={styles.mealCard}
        onPress={() => onMealPress?.(meal)}
        activeOpacity={0.7}
      >
        <LinearGradient
          colors={['#fff', '#f8fafc']}
          style={styles.mealCardGradient}
        >
          <View style={styles.mealHeader}>
            <View style={styles.mealInfo}>
              <ThemedText style={styles.mealDate}>
                {mealService.formatMealDate(meal.date)}
              </ThemedText>
              <ThemedText style={styles.mealTypes}>
                {mealTypes.join(', ') || 'No meals selected'}
              </ThemedText>
              {showUserInfo && (
                <ThemedText style={styles.mealUser}>
                  by{' '}
                  {typeof meal.userId === 'object'
                    ? meal.userId.name
                    : meal.userId}
                </ThemedText>
              )}
            </View>
            <View style={styles.mealStatus}>
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: getStatusColor(meal.status) },
                ]}
              >
                <Ionicons
                  name={getStatusIcon(meal.status) as any}
                  size={12}
                  color='#fff'
                />
                <ThemedText style={styles.statusText}>
                  {meal.status.charAt(0).toUpperCase() + meal.status.slice(1)}
                </ThemedText>
              </View>
            </View>
          </View>

          {meal.notes && (
            <View style={styles.mealNotes}>
              <Ionicons name='chatbubble-outline' size={16} color='#6b7280' />
              <ThemedText style={styles.notesText}>{meal.notes}</ThemedText>
            </View>
          )}

          <View style={styles.mealActions}>
            {isAdmin && meal.status === 'pending' && (
              <>
                <TouchableOpacity
                  style={[styles.actionButton, styles.approveButton]}
                  onPress={() => handleMealStatusUpdate(meal.id, 'approved')}
                >
                  <Ionicons name='checkmark' size={16} color='#fff' />
                  <ThemedText style={styles.actionButtonText}>
                    Approve
                  </ThemedText>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, styles.rejectButton]}
                  onPress={() => handleMealStatusUpdate(meal.id, 'rejected')}
                >
                  <Ionicons name='close' size={16} color='#fff' />
                  <ThemedText style={styles.actionButtonText}>
                    Reject
                  </ThemedText>
                </TouchableOpacity>
              </>
            )}
            <TouchableOpacity
              style={[styles.actionButton, styles.deleteButton]}
              onPress={() => handleDeleteMeal(meal.id)}
            >
              <Ionicons name='trash' size={16} color='#fff' />
              <ThemedText style={styles.actionButtonText}>Delete</ThemedText>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name='fast-food-outline' size={64} color='#9ca3af' />
      <ThemedText style={styles.emptyStateTitle}>No meals found</ThemedText>
      <ThemedText style={styles.emptyStateSubtitle}>
        {error || 'No meal entries match your current filters'}
      </ThemedText>
    </View>
  );

  const renderFooter = () => {
    if (!loading) return null;
    return (
      <View style={styles.loadingFooter}>
        <ActivityIndicator size='small' color='#667eea' />
        <ThemedText style={styles.loadingText}>
          Loading more meals...
        </ThemedText>
      </View>
    );
  };

  return (
    <FlatList
      data={meals}
      renderItem={renderMealItem}
      keyExtractor={item => item.id}
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
      onEndReached={handleLoadMore}
      onEndReachedThreshold={0.1}
      ListEmptyComponent={renderEmptyState}
      ListFooterComponent={renderFooter}
      showsVerticalScrollIndicator={false}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  mealCard: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  mealCardGradient: {
    padding: 20,
  },
  mealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  mealInfo: {
    flex: 1,
  },
  mealDate: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  mealTypes: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  mealUser: {
    fontSize: 12,
    color: '#9ca3af',
  },
  mealStatus: {
    marginLeft: 12,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  mealNotes: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    gap: 8,
  },
  notesText: {
    fontSize: 14,
    color: '#6b7280',
    flex: 1,
  },
  mealActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  approveButton: {
    backgroundColor: '#10b981',
  },
  rejectButton: {
    backgroundColor: '#ef4444',
  },
  deleteButton: {
    backgroundColor: '#6b7280',
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#6b7280',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtitle: {
    fontSize: 16,
    color: '#9ca3af',
    textAlign: 'center',
  },
  loadingFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    gap: 8,
  },
  loadingText: {
    fontSize: 14,
    color: '#6b7280',
  },
});
