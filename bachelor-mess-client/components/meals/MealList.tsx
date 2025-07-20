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
}) => {
  const renderMealItem = ({ item }: { item: MealEntry }) => (
    <View style={styles.mealCardContainer}>
      {isAdmin && (
        <MealSelectionCheckbox
          isSelected={selectedMeals.includes(item.id)}
          onPress={() => onMealSelect(item.id)}
        />
      )}
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
    return (
      <MealEmptyState
        title='No meals found'
        message='There are no meals to display. Add a new meal to get started.'
        icon='fast-food-outline'
      />
    );
  }

  return (
    <FlatList
      data={meals}
      keyExtractor={item => item.id}
      renderItem={renderMealItem}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      style={styles.mealList}
      showsVerticalScrollIndicator={false}
    />
  );
};

const styles = StyleSheet.create({
  mealList: {
    flex: 1,
  },
  mealCardContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
});
