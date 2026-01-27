import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ThemedText } from '../ThemedText';
import { useTheme } from '../../context/ThemeContext';
import mealService, { MealEntry } from '../../services/mealService';

interface MealDetailsViewProps {
  meal: MealEntry;
}

export const MealDetailsView: React.FC<MealDetailsViewProps> = ({ meal }) => {
  const { theme } = useTheme();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return theme.status?.success || theme.gradient?.success?.[0] || '#10b981';
      case 'rejected':
        return theme.status?.error || theme.gradient?.error?.[0] || '#ef4444';
      default:
        return theme.status?.warning || theme.gradient?.warning?.[0] || '#f59e0b';
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View
        style={[
          styles.detailCard,
          {
            backgroundColor: theme.cardBackground || theme.surface || '#f9fafb',
          },
        ]}
      >
        <ThemedText
          style={[
            styles.detailTitle,
            { color: theme.text.secondary || '#6b7280' },
          ]}
        >
          Date
        </ThemedText>
        <ThemedText
          style={[styles.detailValue, { color: theme.text.primary || '#1f2937' }]}
        >
          {mealService.formatMealDate(meal.date)}
        </ThemedText>
      </View>

      <View
        style={[
          styles.detailCard,
          {
            backgroundColor: theme.cardBackground || theme.surface || '#f9fafb',
          },
        ]}
      >
        <ThemedText
          style={[
            styles.detailTitle,
            { color: theme.text.secondary || '#6b7280' },
          ]}
        >
          Meals
        </ThemedText>
        <View style={styles.mealTypesContainer}>
          {meal.breakfast && (
            <LinearGradient
              colors={
                (theme.gradient?.warning || ['#f59e0b', '#d97706']) as [
                  string,
                  string
                ]
              }
              style={styles.mealTypeBadge}
            >
              <ThemedText style={styles.mealTypeText}>Breakfast</ThemedText>
            </LinearGradient>
          )}
          {meal.lunch && (
            <LinearGradient
              colors={
                (theme.gradient?.success || ['#10b981', '#059669']) as [
                  string,
                  string
                ]
              }
              style={styles.mealTypeBadge}
            >
              <ThemedText style={styles.mealTypeText}>Lunch</ThemedText>
            </LinearGradient>
          )}
          {meal.dinner && (
            <LinearGradient
              colors={
                (theme.gradient?.primary || ['#8b5cf6', '#7c3aed']) as [
                  string,
                  string
                ]
              }
              style={styles.mealTypeBadge}
            >
              <ThemedText style={styles.mealTypeText}>Dinner</ThemedText>
            </LinearGradient>
          )}
        </View>
      </View>

      <View
        style={[
          styles.detailCard,
          {
            backgroundColor: theme.cardBackground || theme.surface || '#f9fafb',
          },
        ]}
      >
        <ThemedText
          style={[
            styles.detailTitle,
            { color: theme.text.secondary || '#6b7280' },
          ]}
        >
          Status
        </ThemedText>
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
        <View
          style={[
            styles.detailCard,
            {
              backgroundColor: theme.cardBackground || theme.surface || '#f9fafb',
            },
          ]}
        >
          <ThemedText
            style={[
              styles.detailTitle,
              { color: theme.text.secondary || '#6b7280' },
            ]}
          >
            Notes
          </ThemedText>
          <ThemedText
            style={[styles.detailValue, { color: theme.text.primary || '#1f2937' }]}
          >
            {meal.notes}
          </ThemedText>
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
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  detailTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  detailValue: {
    fontSize: 16,
  },
  mealTypesContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  mealTypeBadge: {
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
