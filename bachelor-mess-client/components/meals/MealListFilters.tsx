import React from 'react';
import { FilterChipsPanel } from '../shared/FilterChipsPanel';
import { MEAL_FILTER_SECTIONS } from '../../constants/filterConfigs';

export type MealListFilterStatus = 'all' | 'pending' | 'approved' | 'rejected';
export type MealListFilterDateRange = 'all' | 'today' | 'week' | 'month';
export type MealListFilterScope = 'mine' | 'all';

export interface MealListFiltersState {
  scope?: MealListFilterScope;
  status?: MealListFilterStatus;
  dateRange?: MealListFilterDateRange;
}

interface MealListFiltersProps {
  filters: MealListFiltersState;
  onFilterChange: (filters: MealListFiltersState) => void;
}

export const MealListFilters: React.FC<MealListFiltersProps> = ({
  filters,
  onFilterChange,
}) => {
  const values: Record<string, string> = {
    scope: filters.scope ?? 'mine',
    status: filters.status ?? 'all',
    dateRange: filters.dateRange ?? 'month',
  };

  const handleChange = (sectionKey: string, optionKey: string) => {
    onFilterChange({
      ...filters,
      [sectionKey]: optionKey as MealListFilterScope & MealListFilterStatus & MealListFilterDateRange,
    });
  };

  return (
    <FilterChipsPanel
      sections={MEAL_FILTER_SECTIONS}
      values={values}
      onChange={handleChange}
    />
  );
};
