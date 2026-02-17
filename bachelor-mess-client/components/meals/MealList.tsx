import React from 'react';
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { MealCard } from './MealCard';
import { MealSelectionCheckbox } from './MealSelectionCheckbox';
import { MealEmptyState } from './MealEmptyState';
import { MealLoadingState } from './MealLoadingState';
import { MealErrorState } from './MealErrorState';
import { MealEntry } from '../../services/mealService';

interface MealListProps {
  meals: MealEntry[];
  selectedMeals: string[];
  onMealPress: (meal: MealEntry) => void;
  onMealSelect: (mealId: string) => void;
  onStatusUpdate?: (mealId: string, status: 'approved' | 'rejected') => void;
  onEdit?: (mealId: string) => void;
  onDelete?: (mealId: string) => void;
  isAdmin?: boolean;
  showUserInfo?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  filters?: { status?: string };
}

export const MealList: React.FC<MealListProps> = ({
  meals,
  selectedMeals,
  onMealPress,
  onMealSelect,
  onStatusUpdate,
  onEdit,
  onDelete,
  isAdmin = false,
  showUserInfo = false,
  refreshing = false,
  onRefresh,
  loading = false,
  error = null,
  onRetry,
  filters,
}) => {
  const renderMealItem = ({ item }: { item: MealEntry }) => (
    <View style={styles.mealCardContainer}>
      {isAdmin && (
        <MealSelectionCheckbox
          isSelected={selectedMeals.includes(item.id)}
          onPress={() => onMealSelect(item.id)}
        />
      )}
      <View style={styles.mealCardWrapper}>
        <MealCard
          meal={item}
          onPress={onMealPress}
          isAdmin={isAdmin}
          showUserInfo={showUserInfo}
          onStatusUpdate={onStatusUpdate}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      </View>
    </View>
  );

  if (loading && !refreshing) {
    return <MealLoadingState />;
  }

  if (error) {
    return (
      <MealErrorState
        title='Failed to load meals'
        message={error}
        onRetry={onRetry}
      />
    );
  }

  if (meals.length === 0) {
    // Different messages based on context
    const emptyTitle = isAdmin
      ? filters?.status === 'pending'
        ? 'No Pending Meals'
        : filters?.status === 'approved'
        ? 'No Approved Meals'
        : filters?.status === 'rejected'
        ? 'No Rejected Meals'
        : 'No Meals Found'
      : 'No meals found';
    
    const emptyMessage = isAdmin
      ? filters?.status === 'pending'
        ? 'All meals have been reviewed. No pending approvals at this time.'
        : filters?.status === 'approved'
        ? 'No approved meals match your current filters.'
        : filters?.status === 'rejected'
        ? 'No rejected meals found.'
        : 'There are no meals to display. Try adjusting your filters.'
      : 'There are no meals to display. Add a new meal to get started.';

    return (
      <MealEmptyState
        title={emptyTitle}
        message={emptyMessage}
        icon={isAdmin && filters?.status === 'pending' ? 'checkmark-circle-outline' : 'fast-food-outline'}
      />
    );
  }

  return (
    <FlatList
      data={meals}
      keyExtractor={item => item.id}
      renderItem={renderMealItem}
      refreshControl={
        onRefresh ? <RefreshControl refreshing={refreshing} onRefresh={onRefresh} /> : undefined
      }
      style={styles.mealList}
      contentContainerStyle={styles.listContent}
      showsVerticalScrollIndicator={false}
    />
  );
};

const styles = StyleSheet.create({
  mealList: {
    flex: 1,
  },
  listContent: {
    paddingTop: 12,
    paddingBottom: 28,
    paddingHorizontal: 4,
  },
  mealCardContainer: {
    flexDirection: 'row',
    alignItems: 'stretch',
    paddingHorizontal: 12,
    marginBottom: 16,
    gap: 12,
  },
  mealCardWrapper: {
    flex: 1,
    minWidth: 0,
  },
});
