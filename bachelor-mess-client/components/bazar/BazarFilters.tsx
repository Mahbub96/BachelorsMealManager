import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '../ThemedText';
import { useTheme } from '../../context/ThemeContext';
import { FilterChipsPanel } from '../shared/FilterChipsPanel';
import { BAZAR_FILTER_SECTIONS } from '../../constants/filterConfigs';

export type BazarFiltersState = {
  scope?: 'mine' | 'all';
  status?: 'all' | 'pending' | 'approved' | 'rejected';
  dateRange?: 'all' | 'today' | 'week' | 'month';
  sortBy?: 'date' | 'amount' | 'status';
};

interface BazarFiltersProps {
  filters: BazarFiltersState;
  onFilterChange: (filters: BazarFiltersState) => void;
  showFilters?: boolean;
  onToggleFilters?: () => void;
}

export const BazarFilters: React.FC<BazarFiltersProps> = ({
  filters,
  onFilterChange,
  showFilters = false,
  onToggleFilters,
}) => {
  const { theme } = useTheme();

  const values: Record<string, string> = {
    scope: filters.scope ?? 'all',
    status: filters.status ?? 'all',
    dateRange: filters.dateRange ?? 'all',
    sortBy: filters.sortBy ?? 'date',
  };

  const handleChange = (sectionKey: string, optionKey: string) => {
    onFilterChange({ ...filters, [sectionKey]: optionKey });
  };

  return (
    <View style={styles.container}>
      {onToggleFilters && (
        <TouchableOpacity
          style={[
            styles.filterToggle,
            {
              backgroundColor: theme.cardBackground,
              borderColor: theme.cardBorder,
            },
          ]}
          onPress={onToggleFilters}
          activeOpacity={0.7}
        >
          <Ionicons name="filter" size={20} color={theme.text.secondary} />
          <ThemedText
            style={[styles.filterToggleText, { color: theme.text.secondary }]}
          >
            Filters
          </ThemedText>
          <Ionicons
            name={showFilters ? 'chevron-up' : 'chevron-down'}
            size={16}
            color={theme.text.secondary}
          />
        </TouchableOpacity>
      )}

      {showFilters && (
        <View style={styles.panelWrapper}>
          <FilterChipsPanel
            sections={BAZAR_FILTER_SECTIONS}
            values={values}
            onChange={handleChange}
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 0,
  },
  filterToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    alignSelf: 'flex-start',
    borderWidth: 1,
  },
  filterToggleText: {
    fontSize: 13,
    fontWeight: '500',
    marginLeft: 4,
    marginRight: 3,
  },
  panelWrapper: {
    marginTop: 8,
  },
});
