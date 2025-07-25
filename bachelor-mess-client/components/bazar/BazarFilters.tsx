import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '../ThemedText';
import { useTheme } from '../../context/ThemeContext';

interface BazarFiltersProps {
  filters: {
    status?: 'all' | 'pending' | 'approved' | 'rejected';
    dateRange?: 'all' | 'today' | 'week' | 'month';
    sortBy?: 'date' | 'amount' | 'status';
  };
  onFilterChange: (filters: any) => void;
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
  const [localFilters, setLocalFilters] = useState(filters);

  const statusOptions = [
    { key: 'all', label: 'All', icon: 'list' },
    { key: 'pending', label: 'Pending', icon: 'time' },
    { key: 'approved', label: 'Approved', icon: 'checkmark-circle' },
    { key: 'rejected', label: 'Rejected', icon: 'close-circle' },
  ];

  const dateRangeOptions = [
    { key: 'all', label: 'All Time', icon: 'calendar' },
    { key: 'today', label: 'Today', icon: 'today' },
    { key: 'week', label: 'This Week', icon: 'calendar-outline' },
    { key: 'month', label: 'This Month', icon: 'calendar-clear' },
  ];

  const sortOptions = [
    { key: 'date', label: 'Date', icon: 'calendar' },
    { key: 'amount', label: 'Amount', icon: 'wallet' },
    { key: 'status', label: 'Status', icon: 'flag' },
  ];

  const handleFilterChange = (type: string, value: string) => {
    const newFilters = { ...localFilters, [type]: value };
    setLocalFilters(newFilters);
    onFilterChange(newFilters);
  };

  const renderFilterChip = (
    options: Array<{ key: string; label: string; icon: string }>,
    currentValue: string,
    type: string
  ) => (
    <View style={styles.filterRow}>
      {options.map(option => (
        <TouchableOpacity
          key={option.key}
          style={[
            styles.filterChip,
            {
              backgroundColor:
                currentValue === option.key
                  ? theme.primary
                  : theme.cardBackground,
              borderColor: theme.cardBorder,
            },
          ]}
          onPress={() => handleFilterChange(type, option.key)}
          activeOpacity={0.7}
        >
          <Ionicons
            name={option.icon as any}
            size={14}
            color={
              currentValue === option.key
                ? theme.text.inverse
                : theme.text.secondary
            }
          />
          <ThemedText
            style={[
              styles.filterChipText,
              {
                color:
                  currentValue === option.key
                    ? theme.text.inverse
                    : theme.text.secondary,
              },
            ]}
          >
            {option.label}
          </ThemedText>
        </TouchableOpacity>
      ))}
    </View>
  );

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
          <Ionicons name='filter' size={20} color={theme.text.secondary} />
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
        <View
          style={[
            styles.filtersContainer,
            {
              backgroundColor: theme.cardBackground,
              borderColor: theme.cardBorder,
            },
          ]}
        >
          <View style={styles.filterSection}>
            <ThemedText
              style={[styles.filterSectionTitle, { color: theme.text.primary }]}
            >
              Status
            </ThemedText>
            {renderFilterChip(
              statusOptions,
              localFilters.status || 'all',
              'status'
            )}
          </View>

          <View style={styles.filterSection}>
            <ThemedText
              style={[styles.filterSectionTitle, { color: theme.text.primary }]}
            >
              Date Range
            </ThemedText>
            {renderFilterChip(
              dateRangeOptions,
              localFilters.dateRange || 'all',
              'dateRange'
            )}
          </View>

          <View style={styles.filterSection}>
            <ThemedText
              style={[styles.filterSectionTitle, { color: theme.text.primary }]}
            >
              Sort By
            </ThemedText>
            {renderFilterChip(
              sortOptions,
              localFilters.sortBy || 'date',
              'sortBy'
            )}
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 0, // Remove bottom margin for row layout
  },
  filterToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6, // Reduced from 8
    paddingHorizontal: 10, // Reduced from 12
    borderRadius: 6, // Reduced from 8
    alignSelf: 'flex-start',
    borderWidth: 1,
  },
  filterToggleText: {
    fontSize: 13, // Reduced from 14
    fontWeight: '500',
    marginLeft: 4, // Reduced from 6
    marginRight: 3, // Reduced from 4
  },
  filtersContainer: {
    marginTop: 6, // Reduced from 8
    padding: 12, // Reduced from 16
    borderRadius: 10, // Reduced from 12
    borderWidth: 1,
  },
  filterSection: {
    marginBottom: 12, // Reduced from 16
  },
  filterSectionTitle: {
    fontSize: 13, // Reduced from 14
    fontWeight: '600',
    marginBottom: 6, // Reduced from 8
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6, // Reduced from 8
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10, // Reduced from 12
    paddingVertical: 4, // Reduced from 6
    borderRadius: 12, // Reduced from 16
    borderWidth: 1,
  },
  filterChipText: {
    fontSize: 11, // Reduced from 12
    fontWeight: '500',
    marginLeft: 3, // Reduced from 4
  },
});
