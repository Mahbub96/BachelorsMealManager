import React from 'react';
import { View, StyleSheet } from 'react-native';
import { MealListHeader } from './MealListHeader';
import { MealList } from './MealList';
import { MealEntry } from '../../services/mealService';

interface MealListContainerProps {
  title: string;
  filters: any;
  onMealPress?: (meal: MealEntry) => void;
  onRefresh?: () => void;
  isAdmin?: boolean;
  onViewAll?: () => void;
  meals?: MealEntry[];
  loading?: boolean;
  error?: string | null;
  onStatusUpdate?: (mealId: string, status: 'approved' | 'rejected') => void;
  onDelete?: (mealId: string) => void;
  onEdit?: (mealId: string) => void;
}

export const MealListContainer: React.FC<MealListContainerProps> = ({
  title,
  filters,
  onMealPress,
  onRefresh,
  isAdmin = false,
  onViewAll,
  meals,
  loading,
  error,
  onStatusUpdate,
  onDelete,
  onEdit,
}) => {
  return (
    <View style={styles.container}>
      <MealListHeader title={title} onViewAll={onViewAll} />
      <View style={styles.listWrapper}>
        <MealList
          meals={meals || []}
          selectedMeals={[]}
          onMealPress={onMealPress || (() => {})}
          onMealSelect={() => {}}
          onStatusUpdate={onStatusUpdate}
          onDelete={onDelete}
          onEdit={onEdit}
          isAdmin={isAdmin}
          refreshing={false}
          onRefresh={onRefresh}
          loading={loading}
          error={error}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  listWrapper: {
    flex: 1,
    minHeight: 400,
    backgroundColor: '#fff',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'hidden',
  },
});
