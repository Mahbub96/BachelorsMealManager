import { MealEntry } from '../services/mealService';

export const mealUtils = {
  /**
   * Format meal date for display
   */
  formatMealDate: (date: string): string => {
    const mealDate = new Date(date);
    return mealDate.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  },

  /**
   * Get meal status color
   */
  getStatusColor: (status: string): string => {
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
  },

  /**
   * Get meal status text
   */
  getStatusText: (status: string): string => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  },

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
