import { MealEntry } from '../services/mealService';
import { formatMealDate as formatMealDateFromUtils } from './dateUtils';
import { getStatusColor, getStatusText as getStatusTextFromUtils } from './statusUtils';

export const mealUtils = {
  /** Format meal date for display (e.g. "Fri, Feb 21") */
  formatMealDate: formatMealDateFromUtils,

  /** Get meal status color (reuses statusUtils) */
  getStatusColor,

  /** Get meal status text */
  getStatusText: getStatusTextFromUtils,

  /**
   * Get meal types as array
   */
  getMealTypes: (meal: MealEntry): string[] => {
    const types = [];
    if (meal.breakfast) types.push('Breakfast');
    if (meal.lunch) types.push('Lunch');
    if (meal.dinner) types.push('Dinner');
    return types;
  },

  /**
   * Filter meals by search query
   */
  filterMealsBySearch: (
    meals: MealEntry[],
    searchQuery: string
  ): MealEntry[] => {
    if (!searchQuery) return meals;

    const query = searchQuery.toLowerCase();
    return meals.filter(meal => {
      const mealTypes = mealUtils.getMealTypes(meal);
      return (
        mealTypes.some(type => type.toLowerCase().includes(query)) ||
        meal.notes?.toLowerCase().includes(query) ||
        meal.status.toLowerCase().includes(query) ||
        mealUtils.formatMealDate(meal.date).toLowerCase().includes(query)
      );
    });
  },

  /**
   * Filter meals by status
   */
  filterMealsByStatus: (meals: MealEntry[], status?: string): MealEntry[] => {
    if (!status) return meals;
    return meals.filter(meal => meal.status === status);
  },

  /**
   * Sort meals by date (newest first)
   */
  sortMealsByDate: (meals: MealEntry[]): MealEntry[] => {
    return [...meals].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  },

  /**
   * Get meal statistics
   */
  getMealStats: (meals: MealEntry[]) => {
    const total = meals.length;
    const approved = meals.filter(m => m.status === 'approved').length;
    const rejected = meals.filter(m => m.status === 'rejected').length;
    const pending = meals.filter(m => m.status === 'pending').length;

    return {
      total,
      approved,
      rejected,
      pending,
      approvalRate: total > 0 ? (approved / total) * 100 : 0,
    };
  },

  /**
   * Validate meal data
   */
  validateMealData: (
    data: Partial<MealEntry>
  ): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (!data.date) {
      errors.push('Date is required');
    }

    if (!data.breakfast && !data.lunch && !data.dinner) {
      errors.push('At least one meal type must be selected');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  },
};
