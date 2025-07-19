import React from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { ThemedText } from '../ThemedText';
import { MealFilters } from '../../services/mealService';

interface MealFilterProps {
  filters: MealFilters;
  onFilterChange: (filters: MealFilters) => void;
}

export const MealFilter: React.FC<MealFilterProps> = ({
  filters,
  onFilterChange,
}) => {
  const filterOptions = [
    { key: 'all', label: 'All', status: undefined },
    { key: 'pending', label: 'Pending', status: 'pending' as const },
    { key: 'approved', label: 'Approved', status: 'approved' as const },
    { key: 'rejected', label: 'Rejected', status: 'rejected' as const },
  ];

  return (
    <View style={styles.container}>
      <ThemedText style={styles.title}>Filter by Status</ThemedText>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {filterOptions.map(filter => (
          <TouchableOpacity
            key={filter.key}
            style={[
              styles.filterButton,
              filters.status === filter.status && styles.filterButtonActive,
            ]}
            onPress={() =>
              onFilterChange({ ...filters, status: filter.status })
            }
          >
            <ThemedText
              style={[
                styles.filterButtonText,
                filters.status === filter.status &&
                  styles.filterButtonTextActive,
              ]}
            >
              {filter.label}
            </ThemedText>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 16,
  },
  scrollContent: {
    paddingRight: 20,
  },
  filterButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#fff',
    alignItems: 'center',
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  filterButtonActive: {
    backgroundColor: '#667eea',
    borderColor: '#667eea',
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  filterButtonTextActive: {
    color: '#fff',
  },
});
