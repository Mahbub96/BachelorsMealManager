import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ThemedText } from '../ThemedText';
import { useTheme } from '@/context/ThemeContext';

const { width: screenWidth } = Dimensions.get('window');

export interface StatItem {
  title: string;
  value: string | number;
  icon: string;
  colors: [string, string];
  trend?: 'up' | 'down' | 'neutral';
  change?: string;
  period?: string;
  isSmallScreen?: boolean;
}

interface StatsGridProps {
  stats: StatItem[];
  columns?: 2 | 3 | 4;
  isSmallScreen?: boolean;
}

export const StatsGrid: React.FC<StatsGridProps> = ({
  stats,
  columns = 2,
  isSmallScreen = false,
}) => {
  const { theme } = useTheme();
  const getGridStyle = () => {
    const availableWidth = screenWidth - 32; // Account for container padding
    const gap = isSmallScreen ? 12 : 16;
    const totalGaps = columns - 1;
    const cardWidth = (availableWidth - totalGaps * gap) / columns;

    return { width: cardWidth };
  };

  return (
    <View style={[styles.container, isSmallScreen && styles.containerSmall]}>
      {stats.map((stat, index) => (
        <View
          key={index}
          style={[
            styles.statCard,
            getGridStyle(),
            isSmallScreen && styles.statCardSmall,
          ]}
        >
          <LinearGradient colors={stat.colors} style={styles.statGradient}>
            <View style={styles.statHeader}>
                              <Ionicons
                  name={stat.icon as any}
                  size={isSmallScreen ? 20 : 24}
                  color={theme.text.inverse}
                />
              {stat.trend && (
                <Ionicons
                  name={stat.trend === 'up' ? 'trending-up' : 'trending-down'}
                  size={isSmallScreen ? 12 : 14}
                  color={theme.text.inverse}
                  style={styles.trendIcon}
                />
              )}
            </View>

            <ThemedText
              style={[styles.statValue, isSmallScreen && styles.statValueSmall]}
            >
              {stat.value}
            </ThemedText>

            <ThemedText
              style={[styles.statLabel, isSmallScreen && styles.statLabelSmall]}
            >
              {stat.title}
            </ThemedText>

            {stat.change && (
              <View style={styles.statDetails}>
                <ThemedText
                  style={[
                    styles.statChange,
                    isSmallScreen && styles.statChangeSmall,
                    { color: stat.trend === 'up' ? theme.status.success : theme.status.error },
                  ]}
                >
                  {stat.change}
                </ThemedText>
                {stat.period && (
                  <ThemedText
                    style={[
                      styles.statPeriod,
                      isSmallScreen && styles.statPeriodSmall,
                    ]}
                  >
                    {stat.period}
                  </ThemedText>
                )}
              </View>
            )}
          </LinearGradient>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  containerSmall: {
    gap: 12,
  },
  statCard: {
    aspectRatio: 1.2,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statCardSmall: {
    aspectRatio: 1.1,
    borderRadius: 12,
  },
  statGradient: {
    flex: 1,
    padding: 16,
    justifyContent: 'space-between',
  },
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  trendIcon: {
    opacity: 0.8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginVertical: 8,
  },
  statValueSmall: {
    fontSize: 20,
    marginVertical: 6,
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
  },
  statLabelSmall: {
    fontSize: 11,
  },
  statDetails: {
    marginTop: 4,
  },
  statChange: {
    fontSize: 10,
    fontWeight: '600',
  },
  statChangeSmall: {
    fontSize: 9,
  },
  statPeriod: {
    fontSize: 9,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  statPeriodSmall: {
    fontSize: 8,
  },
});
