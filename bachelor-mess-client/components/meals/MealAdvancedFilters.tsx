import React from 'react';
import { View, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '../ThemedText';
import { ThemedView } from '../ThemedView';
import { useTheme } from '../../context/ThemeContext';

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
  const { theme } = useTheme();

  return (
    <ThemedView
      style={[
        styles.container,
        {
          backgroundColor: theme.cardBackground || theme.surface,
          borderBottomColor: theme.border?.secondary || theme.border?.primary,
        },
      ]}
    >
      <TouchableOpacity style={styles.filterToggle} onPress={onToggle}>
        <Ionicons
          name='filter'
          size={20}
          color={theme.text.secondary || '#6b7280'}
        />
        <ThemedText
          style={[
            styles.filterToggleText,
            { color: theme.text.primary || '#374151' },
          ]}
        >
          Advanced Filters
        </ThemedText>
        <Ionicons
          name={isExpanded ? 'chevron-up' : 'chevron-down'}
          size={20}
          color={theme.text.secondary || '#6b7280'}
        />
      </TouchableOpacity>

      {isExpanded && (
        <View style={styles.advancedFilters}>
          <TextInput
            style={[
              styles.filterInput,
              {
                backgroundColor: theme.input?.background || theme.surface,
                borderColor: theme.input?.border || theme.border?.secondary,
                color: theme.input?.text || theme.text.primary,
              },
            ]}
            placeholder='Search by user or notes...'
            placeholderTextColor={theme.input?.placeholder || theme.text.secondary}
            value={searchQuery}
            onChangeText={onSearchChange}
          />
          <View style={styles.dateRangeContainer}>
            <TextInput
              style={[
                styles.dateInput,
                {
                  backgroundColor: theme.input?.background || theme.surface,
                  borderColor: theme.input?.border || theme.border?.secondary,
                  color: theme.input?.text || theme.text.primary,
                },
              ]}
              placeholder='Start date'
              placeholderTextColor={theme.input?.placeholder || theme.text.secondary}
              value={dateRange.start}
              onChangeText={text => onDateRangeChange('start', text)}
            />
            <TextInput
              style={[
                styles.dateInput,
                {
                  backgroundColor: theme.input?.background || theme.surface,
                  borderColor: theme.input?.border || theme.border?.secondary,
                  color: theme.input?.text || theme.text.primary,
                },
              ]}
              placeholder='End date'
              placeholderTextColor={theme.input?.placeholder || theme.text.secondary}
              value={dateRange.end}
              onChangeText={text => onDateRangeChange('end', text)}
            />
          </View>
        </View>
      )}
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderBottomWidth: 1,
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
    flex: 1,
    marginLeft: 8,
  },
  advancedFilters: {
    marginTop: 12,
  },
  filterInput: {
    borderWidth: 1,
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
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
});
