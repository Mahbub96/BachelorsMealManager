import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import type { IconName } from '@/constants/IconTypes';
import { useRouter } from 'expo-router';
import { ThemedText } from '../ThemedText';
import { useTheme } from '@/context/ThemeContext';
import { BaseChart, BaseChartProps } from './BaseChart';

export interface StatItem {
  title: string;
  value: string;
  icon: string;
  gradient: readonly [string, string];
  details?: Record<string, unknown>;
}

export interface StatsGridProps extends Omit<BaseChartProps, 'children'> {
  stats: StatItem[];
  columns?: number;
  onStatPress?: (stat: StatItem) => void;
}

export const StatsGrid: React.FC<StatsGridProps> = ({
  stats,
  title,
  columns = 2,
  onStatPress,
  containerStyle,
  showHeader = true,
}) => {
  const { theme } = useTheme();
  const router = useRouter();

  const handleStatPress = (stat: StatItem) => {
    router.push({
      pathname: '/stat-details',
      params: {
        title: stat.title,
        value: stat.value,
        icon: stat.icon,
        details: JSON.stringify(stat.details || {}),
      },
    });

    onStatPress?.(stat);
  };

  const renderStatCard = (stat: StatItem, index: number) => (
    <Pressable
      key={index}
      style={[
        styles.statCard,
        {
          width: `${100 / columns}%`,
          paddingHorizontal: 4,
        },
      ]}
      onPress={() => handleStatPress(stat)}
    >
      <LinearGradient
        colors={stat.gradient}
        style={styles.cardGradient}
      >
        <View style={styles.cardContent}>
          <View style={styles.iconContainer}>
            <Ionicons
              name={stat.icon as IconName}
              size={24}
              color={theme.text.inverse}
            />
          </View>
          <View style={styles.textContainer}>
            <ThemedText style={styles.statValue}>
              {stat.value}
            </ThemedText>
            <ThemedText style={styles.statTitle} numberOfLines={2}>
              {stat.title}
            </ThemedText>
          </View>
        </View>
      </LinearGradient>
    </Pressable>
  );

  return (
    <BaseChart
      title={title}
      containerStyle={containerStyle}
      showHeader={showHeader}
    >
      <View style={styles.gridContainer}>
        {stats.map((stat, index) => renderStatCard(stat, index))}
      </View>
    </BaseChart>
  );
};

const styles = StyleSheet.create({
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  statCard: {
    marginBottom: 8,
  },
  cardGradient: {
    borderRadius: 16,
    padding: 16,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  statTitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 16,
  },
}); 