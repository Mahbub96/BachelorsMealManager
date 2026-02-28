import React from 'react';
import { View, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { IconName } from '@/constants/IconTypes';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/context/ThemeContext';
import { ThemedText } from '../ThemedText';

const { width: screenWidth } = Dimensions.get('window');

export interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: string;
  iconColor?: string;
  gradientColors?: [string, string, ...string[]];
  trend?: {
    value: number;
    isPositive: boolean;
  };
  onPress?: () => void;
  isSmallScreen?: boolean;
  variant?: 'default' | 'compact' | 'detailed';
  showIcon?: boolean;
  showTrend?: boolean;
  backgroundColor?: string;
  textColor?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  iconColor,
  gradientColors,
  trend,
  onPress,
  isSmallScreen = screenWidth < 375,
  variant = 'default',
  showIcon = true,
  showTrend = true,
  backgroundColor,
  textColor,
}) => {
  const { theme } = useTheme();
  const onPrimaryText = theme.onPrimary?.text ?? theme.text.inverse;
  const onPrimaryOverlay = theme.onPrimary?.overlay;
  const iconColorResolved = iconColor ?? onPrimaryText;
  const gradientColorsResolved = gradientColors ?? (theme.gradient.primary as [string, string, ...string[]]);
  const trendBg = trend?.isPositive ? theme.status.success : theme.status.error;

  const renderCompactCard = () => (
    <TouchableOpacity
      style={[
        styles.card,
        styles.compactCard,
        isSmallScreen && styles.compactCardSmall,
      ]}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <LinearGradient colors={gradientColorsResolved} style={styles.cardGradient}>
        <View style={styles.compactContent}>
          {showIcon && icon && (
            <Ionicons
              name={icon as IconName}
              size={isSmallScreen ? 28 : 32}
              color={iconColorResolved}
            />
          )}
          <ThemedText
            style={[
              styles.compactValue,
              isSmallScreen && styles.compactValueSmall,
              { color: onPrimaryText },
            ]}
          >
            {value}
          </ThemedText>
          <ThemedText
            style={[
              styles.compactTitle,
              isSmallScreen && styles.compactTitleSmall,
              { color: onPrimaryText },
            ]}
          >
            {title}
          </ThemedText>
          {subtitle && (
            <ThemedText
              style={[
                styles.compactSubtitle,
                isSmallScreen && styles.compactSubtitleSmall,
                { color: onPrimaryText },
              ]}
            >
              {subtitle}
            </ThemedText>
          )}
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );

  const renderDetailedCard = () => (
    <TouchableOpacity
      style={[
        styles.card,
        styles.detailedCard,
        isSmallScreen && styles.detailedCardSmall,
      ]}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <LinearGradient colors={gradientColorsResolved} style={styles.cardGradient}>
        <View style={styles.detailedHeader}>
          {showIcon && icon && (
            <View style={[styles.iconContainer, { backgroundColor: onPrimaryOverlay }]}>
              <Ionicons
                name={icon as IconName}
                size={isSmallScreen ? 24 : 28}
                color={iconColorResolved}
              />
            </View>
          )}
          {showTrend && trend && (
            <View
              style={[
                styles.trendBadge,
                { backgroundColor: trendBg },
              ]}
            >
              <Ionicons
                name={trend.isPositive ? 'trending-up' : 'trending-down'}
                size={12}
                color={onPrimaryText}
              />
              <ThemedText style={[styles.trendText, { color: onPrimaryText }]}>
                {trend.isPositive ? '+' : ''}
                {trend.value}%
              </ThemedText>
            </View>
          )}
        </View>

        <View style={styles.detailedContent}>
          <ThemedText
            style={[
              styles.detailedValue,
              isSmallScreen && styles.detailedValueSmall,
              { color: onPrimaryText },
            ]}
          >
            {value}
          </ThemedText>
          <ThemedText
            style={[
              styles.detailedTitle,
              isSmallScreen && styles.detailedTitleSmall,
              { color: onPrimaryText },
            ]}
          >
            {title}
          </ThemedText>
          {subtitle && (
            <ThemedText
              style={[
                styles.detailedSubtitle,
                isSmallScreen && styles.detailedSubtitleSmall,
                { color: onPrimaryText },
              ]}
            >
              {subtitle}
            </ThemedText>
          )}
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );

  const renderDefaultCard = () => (
    <TouchableOpacity
      style={[
        styles.card,
        styles.defaultCard,
        isSmallScreen && styles.defaultCardSmall,
      ]}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <LinearGradient colors={gradientColorsResolved} style={styles.cardGradient}>
        <View style={styles.defaultHeader}>
          {showIcon && icon && (
            <View style={[styles.iconContainer, { backgroundColor: onPrimaryOverlay }]}>
              <Ionicons
                name={icon as IconName}
                size={isSmallScreen ? 24 : 28}
                color={iconColorResolved}
              />
            </View>
          )}
          {showTrend && trend && (
            <View
              style={[
                styles.trendBadge,
                { backgroundColor: trendBg },
              ]}
            >
              <Ionicons
                name={trend.isPositive ? 'trending-up' : 'trending-down'}
                size={12}
                color={onPrimaryText}
              />
              <ThemedText style={[styles.trendText, { color: onPrimaryText }]}>
                {trend.isPositive ? '+' : ''}
                {trend.value}%
              </ThemedText>
            </View>
          )}
        </View>

        <View style={styles.defaultContent}>
          <ThemedText
            style={[
              styles.defaultValue,
              isSmallScreen && styles.defaultValueSmall,
              { color: onPrimaryText },
            ]}
          >
            {value}
          </ThemedText>
          <ThemedText
            style={[
              styles.defaultTitle,
              isSmallScreen && styles.defaultTitleSmall,
              { color: onPrimaryText },
            ]}
          >
            {title}
          </ThemedText>
          {subtitle && (
            <ThemedText
              style={[
                styles.defaultSubtitle,
                isSmallScreen && styles.defaultSubtitleSmall,
                { color: onPrimaryText },
              ]}
            >
              {subtitle}
            </ThemedText>
          )}
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );

  switch (variant) {
    case 'compact':
      return renderCompactCard();
    case 'detailed':
      return renderDetailedCard();
    default:
      return renderDefaultCard();
  }
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  cardGradient: {
    padding: 20,
  },
  compactCard: {
    borderRadius: 16,
    width: '100%',
    height: '100%',
    minWidth: 120,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  compactCardSmall: {
    borderRadius: 14,
    width: '100%',
    height: '100%',
    minWidth: 100,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  compactContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 8,
  },
  compactValue: {
    fontSize: 36,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  compactValueSmall: {
    fontSize: 32,
  },
  compactTitle: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  compactTitleSmall: {
    fontSize: 16,
  },
  compactSubtitle: {
    fontSize: 10,
    textAlign: 'center',
  },
  compactSubtitleSmall: {
    fontSize: 8,
  },
  defaultCard: {
    aspectRatio: 1.2,
    borderRadius: 16,
    width: '100%',
  },
  defaultCardSmall: {
    aspectRatio: 1.1,
    borderRadius: 12,
    width: '100%',
  },
  defaultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    gap: 2,
  },
  trendText: {
    fontSize: 10,
    fontWeight: '600',
  },
  defaultContent: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  defaultValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  defaultValueSmall: {
    fontSize: 20,
  },
  defaultTitle: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 2,
  },
  defaultTitleSmall: {
    fontSize: 10,
  },
  defaultSubtitle: {
    fontSize: 10,
  },
  defaultSubtitleSmall: {
    fontSize: 8,
  },
  detailedCard: {
    aspectRatio: 1.2,
    borderRadius: 16,
  },
  detailedCardSmall: {
    aspectRatio: 1.1,
    borderRadius: 12,
  },
  detailedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  detailedContent: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  detailedValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  detailedValueSmall: {
    fontSize: 20,
  },
  detailedTitle: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 2,
  },
  detailedTitleSmall: {
    fontSize: 10,
  },
  detailedSubtitle: {
    fontSize: 10,
  },
  detailedSubtitleSmall: {
    fontSize: 8,
  },
});
