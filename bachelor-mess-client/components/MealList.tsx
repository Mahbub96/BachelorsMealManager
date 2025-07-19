import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { ThemedText } from './ThemedText';
import { MealCard } from './meals/MealCard';
import mealService, { MealEntry, MealFilters } from '../services/mealService';

interface MealListProps {
  filters?: MealFilters;
  showUserInfo?: boolean;
  onMealPress?: (meal: MealEntry) => void;
  onRefresh?: () => void;
  isAdmin?: boolean;
  meals?: MealEntry[];
  loading?: boolean;
  error?: string | null;
  onStatusUpdate?: (mealId: string, status: 'approved' | 'rejected') => void;
  onDelete?: (mealId: string) => void;
  onEdit?: (mealId: string) => void;
}

export const MealList: React.FC<MealListProps> = ({
  filters = {},
  showUserInfo = false,
  onMealPress,
  onRefresh,
  isAdmin = false,
  meals: externalMeals,
  loading: externalLoading,
  error: externalError,
  onStatusUpdate,
  onDelete,
  onEdit,
}) => {
  const [meals, setMeals] = useState<MealEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Use external state if provided, otherwise use internal state
  const displayMeals = externalMeals !== undefined ? externalMeals : meals;
  const displayLoading =
    externalLoading !== undefined ? externalLoading : loading;
  const displayError = externalError !== undefined ? externalError : error;

  const loadMeals = async (isRefresh = false) => {
    // Only load meals if not provided externally
    if (externalMeals !== undefined) return;

    try {
      setLoading(!isRefresh);
      setError(null);

      const response = await mealService.getUserMeals(filters);

      if (response.success && response.data) {
        const mealsData = response.data.meals || response.data;
        setMeals(Array.isArray(mealsData) ? mealsData : []);
      } else {
        setError(response.message || 'Failed to load meals');
      }
    } catch (error) {
      console.error('Error loading meals:', error);
      setError('Failed to load meals. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadMeals(true);
    onRefresh?.();
  };

  const handleStatusUpdate = async (
    mealId: string,
    status: 'approved' | 'rejected'
  ) => {
    if (onStatusUpdate) {
      await onStatusUpdate(mealId, status);
    } else {
      try {
        const response = await mealService.updateMealStatus(mealId, { status });
        if (response.success) {
          setMeals(prevMeals =>
            prevMeals.map(meal =>
              meal.id === mealId ? { ...meal, status } : meal
            )
          );
          Alert.alert('Success', `Meal ${status} successfully`);
        } else {
          Alert.alert(
            'Error',
            response.message || 'Failed to update meal status'
          );
        }
      } catch (error) {
        console.error('Error updating meal status:', error);
        Alert.alert('Error', 'Failed to update meal status');
      }
    }
  };

  const handleDelete = async (mealId: string) => {
    if (onDelete) {
      await onDelete(mealId);
    } else {
      Alert.alert('Delete Meal', 'Are you sure you want to delete this meal?', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await mealService.deleteMeal(mealId);
              if (response.success) {
                setMeals(prevMeals =>
                  prevMeals.filter(meal => meal.id !== mealId)
                );
                Alert.alert('Success', 'Meal deleted successfully');
              } else {
                Alert.alert(
                  'Error',
                  response.message || 'Failed to delete meal'
                );
              }
            } catch (error) {
              console.error('Error deleting meal:', error);
              Alert.alert('Error', 'Failed to delete meal');
            }
          },
        },
      ]);
    }
  };

  const handleEdit = (mealId: string) => {
    if (onEdit) {
      onEdit(mealId);
    } else {
      Alert.alert('Edit Meal', 'Edit functionality coming soon');
    }
  };

  useEffect(() => {
    // Only load on initial mount, not on every filter change
    const initialLoad = async () => {
      await loadMeals();
    };
    initialLoad();
  }, []); // Empty dependency array to run only once

  const renderMealItem = ({ item }: { item: MealEntry }) => (
    <MealCard
      meal={item}
      onPress={onMealPress}
      isAdmin={isAdmin}
      onStatusUpdate={handleStatusUpdate}
      onDelete={handleDelete}
      onEdit={handleEdit}
    />
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <ThemedText style={styles.emptyStateTitle}>No meals found</ThemedText>
      <ThemedText style={styles.emptyStateSubtitle}>
        {filters.status
          ? `No ${filters.status} meals available`
          : 'Try adjusting your filters or add a new meal'}
      </ThemedText>
    </View>
  );

  const renderErrorState = () => (
    <View style={styles.errorState}>
      <ThemedText style={styles.errorStateTitle}>
        Error loading meals
      </ThemedText>
      <ThemedText style={styles.errorStateSubtitle}>{displayError}</ThemedText>
    </View>
  );

  if (displayLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size='large' color='#667eea' />
        <ThemedText style={styles.loadingText}>Loading meals...</ThemedText>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={displayMeals}
        renderItem={renderMealItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#667eea']}
            tintColor='#667eea'
          />
        }
        ListEmptyComponent={displayError ? renderErrorState : renderEmptyState}
        ListFooterComponent={<View style={styles.footerSpacing} />}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6b7280',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  emptyStateSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  errorState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  errorStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ef4444',
    marginBottom: 8,
  },
  errorStateSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  footerSpacing: {
    height: 20,
  },
});
