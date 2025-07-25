import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ThemedText } from '../ThemedText';
import { useTheme } from '@/context/ThemeContext';

const { width: screenWidth } = Dimensions.get('window');

interface StatItem {
  title: string;
  value: string | number;
  icon: string;
  color: string;
  gradient: readonly [string, string];
  trend?: 'up' | 'down' | 'stable';
  change?: string;
  period?: string;
}

interface SwappableStatsProps {
  stats: StatItem[];
  onStatPress?: (stat: StatItem) => void;
}

export const SwappableStats: React.FC<SwappableStatsProps> = ({
  stats,
  onStatPress,
}) => {
  const { theme } = useTheme();
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [slideAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % stats.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [stats.length]);

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: currentIndex,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [currentIndex, slideAnim]);

  const handleStatPress = (stat: StatItem) => {
    if (onStatPress) {
      onStatPress(stat);
    } else {
      router.push({
        pathname: '/stat-details',
        params: {
          title: stat.title,
          value: stat.value.toString(),
          icon: stat.icon,
          color: stat.color,
        },
      });
    }
  };

  const getTrendIcon = (trend?: string) => {
    switch (trend) {
      case 'up':
        return 'trending-up';
      case 'down':
        return 'trending-down';
      case 'stable':
        return 'remove';
      default:
        return null;
    }
  };

  const getTrendColor = (trend?: string) => {
    switch (trend) {
      case 'up':
        return theme.status.success;
      case 'down':
        return theme.status.error;
      case 'stable':
        return theme.text.tertiary;
      default:
        return theme.text.tertiary;
    }
  };

  if (!stats || stats.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <ThemedText style={styles.emptyText}>No statistics available</ThemedText>
      </View>
    );
  }

  const currentStat = stats[currentIndex];

  return (
    <View style={styles.container}>
      {/* Navigation Dots */}
      <View style={styles.dotsContainer}>
        {stats.map((_, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.dot,
              {
                backgroundColor:
                  index === currentIndex ? theme.primary : theme.border.secondary,
              },
            ]}
            onPress={() => setCurrentIndex(index)}
          />
        ))}
      </View>

      {/* Current Stat Card */}
      <TouchableOpacity
        style={[
          styles.statCard,
          {
            backgroundColor: theme.cardBackground,
            borderColor: theme.cardBorder,
            shadowColor: theme.cardShadow,
          },
        ]}
        onPress={() => handleStatPress(currentStat)}
      >
        <LinearGradient
          colors={currentStat.gradient}
          style={styles.cardGradient}
        >
          <View style={styles.cardContent}>
            <View style={styles.iconContainer}>
              <Ionicons
                name={currentStat.icon as any}
                size={32}
                color={theme.text.inverse}
              />
            </View>
            <View style={styles.textContainer}>
              <ThemedText style={styles.statTitle}>{currentStat.title}</ThemedText>
              <ThemedText style={styles.statValue}>
                {currentStat.value}
              </ThemedText>
              {currentStat.trend && (
                <View style={styles.trendContainer}>
                  <Ionicons
                    name={getTrendIcon(currentStat.trend) as any}
                    size={16}
                    color={getTrendColor(currentStat.trend)}
                  />
                  <ThemedText style={styles.trendText}>
                    {currentStat.trend === 'up' ? 'Rising' : 
                     currentStat.trend === 'down' ? 'Falling' : 'Stable'}
                  </ThemedText>
                </View>
              )}
            </View>
          </View>
        </LinearGradient>
      </TouchableOpacity>

      {/* Quick Stats */}
      <View style={styles.quickStatsContainer}>
        {stats.slice(0, 3).map((stat, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.quickStatCard,
              {
                backgroundColor: theme.surface,
                borderColor: theme.border.primary,
              },
            ]}
            onPress={() => {
              setCurrentIndex(index);
              handleStatPress(stat);
            }}
          >
            <View style={styles.quickStatContent}>
              <Ionicons
                name={stat.icon as any}
                size={20}
                color={stat.color}
              />
              <View style={styles.quickStatText}>
                <ThemedText style={styles.quickStatValue}>
                  {stat.value}
                </ThemedText>
                <ThemedText style={styles.quickStatTitle}>
                  {stat.title}
                </ThemedText>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 16,
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statCard: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
  },
  cardGradient: {
    padding: 16,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  textContainer: {
    flex: 1,
  },
  statTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  trendText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  quickStatsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  quickStatCard: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  quickStatContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  quickStatText: {
    flex: 1,
  },
  quickStatValue: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  quickStatTitle: {
    fontSize: 10,
    opacity: 0.7,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
  },
});
