import type { FilterSectionConfig } from '@/components/shared/FilterChipsPanel';

/**
 * Shared filter configs for the common Search + Filter UI.
 * Used by: Bazar (BazarFilters), Meals (MealListFilters), and later Payment.
 * Add new sections or options here; use FilterChipsPanel + SearchAndFilterRow in screens.
 */

export const BAZAR_FILTER_SECTIONS: FilterSectionConfig[] = [
  {
    key: 'scope',
    label: 'Scope',
    options: [
      { key: 'all', label: "Everyone's Bazar", icon: 'people' },
      { key: 'mine', label: 'My Bazar', icon: 'person' },
    ],
  },
  {
    key: 'status',
    label: 'Status',
    options: [
      { key: 'all', label: 'All', icon: 'list' },
      { key: 'pending', label: 'Pending', icon: 'time' },
      { key: 'approved', label: 'Approved', icon: 'checkmark-circle' },
      { key: 'rejected', label: 'Rejected', icon: 'close-circle' },
    ],
  },
  {
    key: 'dateRange',
    label: 'Date Range',
    options: [
      { key: 'all', label: 'All Time', icon: 'calendar' },
      { key: 'today', label: 'Today', icon: 'today' },
      { key: 'week', label: 'This Week', icon: 'calendar-outline' },
      { key: 'month', label: 'This Month', icon: 'calendar-clear' },
    ],
  },
  {
    key: 'sortBy',
    label: 'Sort By',
    options: [
      { key: 'date', label: 'Date', icon: 'calendar' },
      { key: 'amount', label: 'Amount', icon: 'wallet' },
      { key: 'status', label: 'Status', icon: 'flag' },
    ],
  },
];

export const MEAL_FILTER_SECTIONS: FilterSectionConfig[] = [
  {
    key: 'scope',
    label: 'Scope',
    options: [
      { key: 'all', label: "Everyone's Meals", icon: 'people' },
      { key: 'mine', label: 'My Meals', icon: 'person' },
    ],
  },
  {
    key: 'status',
    label: 'Status',
    options: [
      { key: 'all', label: 'All', icon: 'list' },
      { key: 'pending', label: 'Pending', icon: 'time' },
      { key: 'approved', label: 'Approved', icon: 'checkmark-circle' },
      { key: 'rejected', label: 'Rejected', icon: 'close-circle' },
    ],
  },
  {
    key: 'dateRange',
    label: 'Date Range',
    options: [
      { key: 'all', label: 'All Time', icon: 'calendar' },
      { key: 'today', label: 'Today', icon: 'today' },
      { key: 'week', label: 'This Week', icon: 'calendar-outline' },
      { key: 'month', label: 'This Month', icon: 'calendar-clear' },
    ],
  },
];

/** Placeholder for payment/expense filters (extend when payment feature is added). */
export const PAYMENT_FILTER_SECTIONS: FilterSectionConfig[] = [
  {
    key: 'status',
    label: 'Status',
    options: [
      { key: 'all', label: 'All', icon: 'list' },
      { key: 'pending', label: 'Pending', icon: 'time' },
      { key: 'paid', label: 'Paid', icon: 'checkmark-circle' },
    ],
  },
  {
    key: 'dateRange',
    label: 'Date Range',
    options: [
      { key: 'all', label: 'All Time', icon: 'calendar' },
      { key: 'today', label: 'Today', icon: 'today' },
      { key: 'week', label: 'This Week', icon: 'calendar-outline' },
      { key: 'month', label: 'This Month', icon: 'calendar-clear' },
    ],
  },
];
