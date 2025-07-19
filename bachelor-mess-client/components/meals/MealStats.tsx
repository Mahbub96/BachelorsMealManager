import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ThemedText } from '../ThemedText';
import { MealStats as MealStatsType } from '../../services/mealService';

interface MealStatsProps {
  stats: MealStatsType;
}

export const MealStats: React.FC<MealStatsProps> = ({ stats }) => {
  const statCards = [
    {
      title: 'Total Meals',
      value: stats.totalMeals,
      icon: 'fast-food' as const,
      colors: ['#667eea', '#764ba2'] as const,
    },
    {
      title: 'Approved',
      value: stats.approvedCount,
      icon: 'trending-up' as const,
      colors: ['#f093fb', '#f5576c'] as const,
    },
    {
      title: 'Pending',
      value: stats.pendingCount,
      icon: 'time' as const,
      colors: ['#43e97b', '#38f9d7'] as const,
    },
  ];

  return (
    <View style={styles.container}>
      {statCards.map((card, index) => (
        <View key={index} style={styles.statCard}>
          <LinearGradient colors={card.colors} style={styles.statGradient}>
            <Ionicons name={card.icon} size={24} color='#fff' />
            <ThemedText style={styles.statValue}>{card.value}</ThemedText>
            <ThemedText style={styles.statLabel}>{card.title}</ThemedText>
          </LinearGradient>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: 20,
    marginBottom: 30,
  },
  statCard: {
    flex: 1,
    marginHorizontal: 4,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  statGradient: {
    padding: 20,
    alignItems: 'center',
    minHeight: 120,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
  },
});
