import { useAnalytics } from '@/hooks/useAnalytics';
import { useRouter } from 'expo-router';
import React from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '../ThemedText';
import { useTheme } from '@/context/ThemeContext';

interface StatsCardsProps {
  fadeAnim: Animated.Value;
  slideAnim: Animated.Value;
}

export const StatsCards: React.FC<StatsCardsProps> = ({
  fadeAnim,
  slideAnim,
}) => {
  const { data, loading, error } = useAnalytics();
  const { theme } = useTheme();
  const router = useRouter();

  const formatCurrency = (amount: number) => {
    return `৳${amount.toLocaleString()}`;
  };

  const stats = [
    {
      title: 'Total Members',
      value: data?.stats?.totalMembers || 0,
      unit: 'members',
      color: theme.status.info,
      icon: 'people',
      gradient: theme.gradient.info,
    },
    {
      title: 'Monthly Expense',
      value: data?.stats?.monthlyExpense || 0,
      unit: 'BDT',
      color: theme.status.warning,
      icon: 'wallet',
      formatter: formatCurrency,
      gradient: theme.gradient.warning,
    },
    {
      title: 'Average Meals',
      value: data?.stats?.averageMeals || 0,
      unit: 'per day',
      color: theme.status.success,
      icon: 'fast-food',
      gradient: theme.gradient.success,
    },
    {
      title: 'Balance',
      value: data?.stats?.balance || 0,
      unit: 'BDT',
      color: theme.primary,
      icon: 'card',
      formatter: formatCurrency,
      gradient: theme.gradient.primary,
    },
  ];

  const handleStatPress = (stat: any) => {
    // Handle expense-related stats
    if (
      stat.title.toLowerCase().includes('expense') ||
      stat.title.toLowerCase().includes('balance') ||
      stat.title.toLowerCase().includes('cost')
    ) {
      // Navigate to expense details
      router.push({
        pathname: '/expense-details',
        params: {
          title: stat.title,
          value: stat.value.toString(),
          type: stat.title.toLowerCase().includes('expense')
            ? 'monthly'
            : 'balance',
          color: stat.color,
          description: `Detailed breakdown of ${stat.title.toLowerCase()} including all related costs and expenses.`,
          notes: `This data is updated daily and reflects current market conditions for ${stat.title.toLowerCase()}.`,
        },
      });
    }
  };

  if (loading) {
    return (
      <Animated.View
        style={[
          styles.container,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <View style={styles.loadingContainer}>
          <ThemedText style={styles.loadingText}>Loading stats...</ThemedText>
        </View>
      </Animated.View>
    );
  }

  if (error || !data) {
    return (
      <Animated.View
        style={[
          styles.container,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <View style={styles.errorContainer}>
          <ThemedText style={styles.errorText}>
            {error || 'Failed to load statistics'}
          </ThemedText>
        </View>
      </Animated.View>
    );
  }

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      {stats.map((stat, index) => (
        <Pressable
          key={index}
          style={[
            styles.card,
            {
              backgroundColor: theme.cardBackground,
              borderColor: theme.cardBorder,
              shadowColor: theme.cardShadow,
            },
          ]}
          onPress={() => handleStatPress(stat)}
        >
          <View style={styles.cardHeader}>
            <View
              style={[
                styles.iconContainer,
                {
                  backgroundColor: stat.color + '20', // 20% opacity
                },
              ]}
            >
              <Ionicons name={stat.icon as any} size={24} color={stat.color} />
            </View>
            <View style={styles.cardContent}>
              <ThemedText style={styles.cardTitle}>{stat.title}</ThemedText>
              <ThemedText style={styles.cardValue}>
                {stat.formatter ? stat.formatter(stat.value) : stat.value}
              </ThemedText>
              <ThemedText style={styles.cardUnit}>{stat.unit}</ThemedText>
            </View>
          </View>
        </Pressable>
      ))}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  card: {
    flex: 1,
    minWidth: 150,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  cardValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  cardUnit: {
    fontSize: 10,
    opacity: 0.7,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  loadingText: {
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
  },
});
