import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { ThemedText } from '../ThemedText';
import { MealEntry } from '../../services/mealService';
import mealService from '../../services/mealService';

interface MealDetailsViewProps {
  meal: MealEntry;
}

export const MealDetailsView: React.FC<MealDetailsViewProps> = ({ meal }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return '#10b981';
      case 'rejected':
        return '#ef4444';
      default:
        return '#f59e0b';
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.detailCard}>
        <ThemedText style={styles.detailTitle}>Date</ThemedText>
        <ThemedText style={styles.detailValue}>
          {mealService.formatMealDate(meal.date)}
        </ThemedText>
      </View>

      <View style={styles.detailCard}>
        <ThemedText style={styles.detailTitle}>Meals</ThemedText>
        <View style={styles.mealTypesContainer}>
          {meal.breakfast && (
            <View style={styles.mealTypeBadge}>
              <ThemedText style={styles.mealTypeText}>Breakfast</ThemedText>
            </View>
          )}
          {meal.lunch && (
            <View style={styles.mealTypeBadge}>
              <ThemedText style={styles.mealTypeText}>Lunch</ThemedText>
            </View>
          )}
          {meal.dinner && (
            <View style={styles.mealTypeBadge}>
              <ThemedText style={styles.mealTypeText}>Dinner</ThemedText>
            </View>
          )}
        </View>
      </View>

      <View style={styles.detailCard}>
        <ThemedText style={styles.detailTitle}>Status</ThemedText>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(meal.status) },
          ]}
        >
          <ThemedText style={styles.statusText}>
            {meal.status.charAt(0).toUpperCase() + meal.status.slice(1)}
          </ThemedText>
        </View>
      </View>

      {meal.notes && (
        <View style={styles.detailCard}>
          <ThemedText style={styles.detailTitle}>Notes</ThemedText>
          <ThemedText style={styles.detailValue}>{meal.notes}</ThemedText>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  detailCard: {
    backgroundColor: '#f9fafb',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  detailTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 8,
  },
  detailValue: {
    fontSize: 16,
    color: '#1f2937',
  },
  mealTypesContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  mealTypeBadge: {
    backgroundColor: '#059669',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  mealTypeText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#fff',
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#fff',
  },
});
