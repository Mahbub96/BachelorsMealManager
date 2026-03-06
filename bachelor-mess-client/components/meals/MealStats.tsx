import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/context/ThemeContext';
import { ThemedText } from '../ThemedText';
import { MealStats as MealStatsType } from '../../services/mealService';

interface MealStatsProps {
  stats: MealStatsType;
}

export const MealStats: React.FC<MealStatsProps> = ({ stats }) => {
  const { theme } = useTheme();
  const onPrimaryText = theme.onPrimary?.text ?? theme.text.inverse;

  const statCards = [
    {
      title: 'Total Meals',
      value: stats.totalMeals,
      icon: 'fast-food' as const,
      colors: theme.gradient.primary as unknown as readonly [string, string],
    },
    {
      title: 'Approved',
      value: stats.approvedCount,
      icon: 'trending-up' as const,
      colors: theme.gradient.success as unknown as readonly [string, string],
    },
    {
      title: 'Pending',
      value: stats.pendingCount,
      icon: 'time' as const,
      colors: theme.gradient.warning as unknown as readonly [string, string],
    },
  ];

  return (
    <View style={styles.container}>
      {statCards.map((card, index) => (
        <View key={index} style={[styles.statCard, { shadowColor: theme.shadow.light }]}>
          <LinearGradient colors={card.colors} style={styles.statGradient}>
            <Ionicons name={card.icon} size={24} color={onPrimaryText} />
            <ThemedText style={[styles.statValue, { color: onPrimaryText }]}>{card.value}</ThemedText>
            <ThemedText style={[styles.statLabel, { color: onPrimaryText }]}>{card.title}</ThemedText>
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
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
});
