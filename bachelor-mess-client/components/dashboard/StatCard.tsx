import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ThemedText } from '../ThemedText';
import { useTheme } from '@/context/ThemeContext';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: string;
  gradient?: readonly [string, string];
  onPress?: () => void;
  subtitle?: string;
  trend?: 'up' | 'down' | 'stable';
  trendValue?: string;
  compact?: boolean;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  gradient = ['#667eea', '#764ba2'],
  onPress,
  subtitle,
  trend,
  trendValue,
  compact = false,
}) => {
  const { theme } = useTheme();
  const Container = onPress ? TouchableOpacity : View;

  const getTrendIcon = (trend?: string) => {
    switch (trend) {
      case 'up':
        return 'trending-up';
      case 'down':
        return 'trending-down';
      case 'stable':
        return 'remove';
      default:
        return 'information-circle';
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

  return (
    <Container
      style={[styles.container, compact && styles.compactContainer]}
      onPress={onPress}
      activeOpacity={onPress ? 0.8 : 1}
    >
      <LinearGradient colors={gradient} style={styles.gradient}>
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <Ionicons
              name={icon as any}
              size={compact ? 20 : 24}
              color={theme.text.inverse}
            />
          </View>
          <View style={styles.textContainer}>
            <ThemedText style={[styles.title, compact && styles.compactTitle]}>
              {title}
            </ThemedText>
            <ThemedText style={[styles.value, compact && styles.compactValue]}>
              {value}
            </ThemedText>
            {subtitle && (
              <ThemedText
                style={[styles.subtitle, compact && styles.compactSubtitle]}
              >
                {subtitle}
              </ThemedText>
            )}
          </View>
          {trend && (
            <View style={styles.trendContainer}>
              <Ionicons
                name={getTrendIcon(trend) as any}
                size={compact ? 12 : 16}
                color={getTrendColor(trend)}
              />
              {trendValue && (
                <ThemedText
                  style={[
                    styles.trendValue,
                    compact && styles.compactTrendValue,
                  ]}
                >
                  {trendValue}
                </ThemedText>
              )}
            </View>
          )}
        </View>
      </LinearGradient>
    </Container>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    marginBottom: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  compactContainer: {
    marginBottom: 8,
  },
  gradient: {
    padding: 16,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  compactTitle: {
    fontSize: 12,
  },
  value: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  compactValue: {
    fontSize: 18,
  },
  subtitle: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
  },
  compactSubtitle: {
    fontSize: 10,
  },
  trendContainer: {
    alignItems: 'center',
    marginLeft: 8,
  },
  trendValue: {
    color: '#fff',
    fontSize: 10,
    marginTop: 2,
  },
  compactTrendValue: {
    fontSize: 8,
  },
});
