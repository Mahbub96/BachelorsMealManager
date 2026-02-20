import { useTheme } from '@/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import type { IconName } from '@/constants/IconTypes';
import React from 'react';
import { Dimensions, StyleSheet, TouchableOpacity, View, type ViewStyle } from 'react-native';
import { ThemedText } from '../ThemedText';

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
  onPress?: () => void;
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
  const padding = 16;
  const gap = 12;
  const availableWidth = screenWidth - padding * 2 - gap * (columns - 1);
  const cardWidth = availableWidth / columns;

  const cardStyle: ViewStyle[] = [
    styles.card,
    {
      width: cardWidth,
      backgroundColor: theme.cardBackground ?? theme.surface,
      borderWidth: 1,
      borderColor: theme.border?.secondary ?? theme.cardBorder ?? 'transparent',
      shadowColor: theme.shadow?.light ?? theme.cardShadow,
    },
  ];

  return (
    <View style={[styles.wrap, { paddingHorizontal: padding, marginBottom: 24 }]}>
      <View style={styles.grid}>
        {stats.map((stat, index) => {
          const content = (
            <View>
              <View style={[styles.iconWrap, { backgroundColor: (stat.colors[0] ?? theme.primary) + '18' }]}>
                <Ionicons
                  name={stat.icon as IconName}
                  size={isSmallScreen ? 20 : 22}
                  color={stat.colors[0] ?? theme.primary}
                />
              </View>
              <ThemedText style={[styles.value, { color: theme.text?.primary }]} numberOfLines={1}>
                {stat.value}
              </ThemedText>
              <ThemedText
                style={[styles.label, { color: theme.text?.secondary }]}
                numberOfLines={1}
              >
                {stat.title}
              </ThemedText>
              {(stat.change || stat.period) && (
                <View style={styles.meta}>
                  {stat.change && (
                    <ThemedText
                      style={[
                        styles.change,
                        {
                          color:
                            stat.trend === 'up'
                              ? theme.status?.success
                              : stat.trend === 'down'
                                ? theme.status?.error
                                : theme.text?.tertiary,
                        },
                      ]}
                      numberOfLines={1}
                    >
                      {stat.change}
                    </ThemedText>
                  )}
                  {stat.period && (
                    <ThemedText
                      style={[styles.period, { color: theme.text?.tertiary }]}
                      numberOfLines={1}
                    >
                      {stat.period}
                    </ThemedText>
                  )}
                </View>
              )}
            </View>
          );
          if (stat.onPress) {
            return (
              <TouchableOpacity
                key={index}
                style={cardStyle}
                onPress={stat.onPress}
                activeOpacity={0.7}
              >
                {content}
              </TouchableOpacity>
            );
          }
          return (
            <View key={index} style={cardStyle}>
              {content}
            </View>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {},
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  card: {
    borderRadius: 16,
    padding: 14,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  value: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 2,
    letterSpacing: 0.2,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  meta: {
    marginTop: 2,
  },
  change: {
    fontSize: 10,
    fontWeight: '600',
  },
  period: {
    fontSize: 10,
    marginTop: 1,
  },
});
