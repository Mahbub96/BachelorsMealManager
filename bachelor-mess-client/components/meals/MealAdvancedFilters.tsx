import React from 'react';
import { View, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '../ThemedText';

interface MealAdvancedFiltersProps {
  isExpanded: boolean;
  onToggle: () => void;
  searchQuery: string;
  onSearchChange: (text: string) => void;
  dateRange: { start: string; end: string };
  onDateRangeChange: (field: 'start' | 'end', value: string) => void;
}

export const MealAdvancedFilters: React.FC<MealAdvancedFiltersProps> = ({
  isExpanded,
  onToggle,
  searchQuery,
  onSearchChange,
  dateRange,
  onDateRangeChange,
}) => {
  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.filterToggle} onPress={onToggle}>
        <Ionicons name='filter' size={20} color='#6b7280' />
        <ThemedText style={styles.filterToggleText}>
          Advanced Filters
        </ThemedText>
        <Ionicons
          name={isExpanded ? 'chevron-up' : 'chevron-down'}
          size={20}
          color='#6b7280'
        />
      </TouchableOpacity>

      {isExpanded && (
        <View style={styles.advancedFilters}>
          <TextInput
            style={styles.filterInput}
            placeholder='Search by user or notes...'
            value={searchQuery}
            onChangeText={onSearchChange}
          />
          <View style={styles.dateRangeContainer}>
            <TextInput
              style={styles.dateInput}
              placeholder='Start date'
              value={dateRange.start}
              onChangeText={text => onDateRangeChange('start', text)}
            />
            <TextInput
              style={styles.dateInput}
              placeholder='End date'
              value={dateRange.end}
              onChangeText={text => onDateRangeChange('end', text)}
            />
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  filterToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  filterToggleText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    flex: 1,
    marginLeft: 8,
  },
  advancedFilters: {
    marginTop: 12,
  },
  filterInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 12,
  },
  dateRangeContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  dateInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
});
