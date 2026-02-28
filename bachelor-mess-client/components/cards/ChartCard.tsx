import React from 'react';
import { View, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { IconName } from '@/constants/IconTypes';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/context/ThemeContext';
import { ThemedText } from '../ThemedText';

const { width: screenWidth } = Dimensions.get('window');

export interface ChartCardProps {
  title: string;
  subtitle?: string;
  icon?: string;
  iconColor?: string;
  gradientColors?: [string, string, ...string[]];
  onPress?: () => void;
  isSmallScreen?: boolean;
  variant?: 'default' | 'compact' | 'detailed';
  showIcon?: boolean;
  showHeader?: boolean;
  showFooter?: boolean;
  children?: React.ReactNode;
  period?: string;
  onPeriodChange?: (period: string) => void;
  periods?: string[];
}

export const ChartCard: React.FC<ChartCardProps> = ({
  title,
  subtitle,
  icon,
  iconColor,
  gradientColors,
  onPress,
  isSmallScreen = screenWidth < 375,
  variant = 'default',
  showIcon = true,
  showHeader = true,
  showFooter = true,
  children,
  period,
  onPeriodChange,
  periods = ['1D', '1W', '1M', '3M', '1Y'],
}) => {
  const { theme } = useTheme();
  const onPrimaryText = theme.onPrimary?.text ?? theme.text.inverse;
  const onPrimaryOverlay = theme.onPrimary?.overlay;
  const iconColorResolved = iconColor ?? onPrimaryText;
  const gradientColorsResolved = gradientColors ?? (theme.gradient.primary as [string, string, ...string[]]);

  const renderCompactCard = () => (
    <TouchableOpacity
      style={[
        styles.card,
        styles.compactCard,
        isSmallScreen && styles.compactCardSmall,
        { shadowColor: theme.shadow.light },
      ]}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <LinearGradient colors={gradientColorsResolved} style={styles.cardGradient}>
        {showHeader && (
          <View style={styles.compactHeader}>
            {showIcon && icon && (
              <Ionicons
                name={icon as IconName}
                size={isSmallScreen ? 16 : 18}
                color={iconColorResolved}
              />
            )}
            <View style={styles.compactHeaderText}>
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
          </View>
        )}

        <View style={styles.compactChartContainer}>{children}</View>

        {showFooter && onPeriodChange && (
          <View style={styles.compactFooter}>
            {periods.map(p => (
              <TouchableOpacity
                key={p}
                style={[
                  styles.periodButton,
                  period === p && styles.periodButtonActive,
                  { backgroundColor: onPrimaryOverlay },
                ]}
                onPress={() => onPeriodChange(p)}
              >
                <ThemedText
                  style={[
                    styles.periodButtonText,
                    period === p && styles.periodButtonTextActive,
                    { color: onPrimaryText },
                  ]}
                >
                  {p}
                </ThemedText>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );

  const renderDetailedCard = () => (
    <TouchableOpacity
      style={[
        styles.card,
        styles.detailedCard,
        isSmallScreen && styles.detailedCardSmall,
        { shadowColor: theme.shadow.light },
      ]}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <LinearGradient colors={gradientColorsResolved} style={styles.cardGradient}>
        {showHeader && (
          <View style={styles.detailedHeader}>
            <View style={styles.detailedHeaderLeft}>
              {showIcon && icon && (
                <View style={[styles.iconContainer, { backgroundColor: onPrimaryOverlay }]}>
                  <Ionicons
                    name={icon as IconName}
                    size={isSmallScreen ? 20 : 24}
                    color={iconColorResolved}
                  />
                </View>
              )}
              <View style={styles.detailedHeaderText}>
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
            </View>

            {showFooter && onPeriodChange && (
              <View style={styles.detailedPeriodSelector}>
                {periods.map(p => (
                  <TouchableOpacity
                    key={p}
                    style={[
                      styles.periodButton,
                      period === p && styles.periodButtonActive,
                      { backgroundColor: onPrimaryOverlay },
                    ]}
                    onPress={() => onPeriodChange(p)}
                  >
                    <ThemedText
                      style={[
                        styles.periodButtonText,
                        period === p && styles.periodButtonTextActive,
                        { color: onPrimaryText },
                      ]}
                    >
                      {p}
                    </ThemedText>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        )}

        <View style={styles.detailedChartContainer}>{children}</View>
      </LinearGradient>
    </TouchableOpacity>
  );

  const renderDefaultCard = () => (
    <TouchableOpacity
      style={[
        styles.card,
        styles.defaultCard,
        isSmallScreen && styles.defaultCardSmall,
        { shadowColor: theme.shadow.light },
      ]}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <LinearGradient colors={gradientColorsResolved} style={styles.cardGradient}>
        {showHeader && (
          <View style={styles.defaultHeader}>
            <View style={styles.defaultHeaderLeft}>
              {showIcon && icon && (
                <View style={[styles.iconContainer, { backgroundColor: onPrimaryOverlay }]}>
                  <Ionicons
                    name={icon as IconName}
                    size={isSmallScreen ? 20 : 24}
                    color={iconColorResolved}
                  />
                </View>
              )}
              <View style={styles.defaultHeaderText}>
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
            </View>

            {showFooter && onPeriodChange && (
              <View style={styles.defaultPeriodSelector}>
                {periods.map(p => (
                  <TouchableOpacity
                    key={p}
                    style={[
                      styles.periodButton,
                      period === p && styles.periodButtonActive,
                      { backgroundColor: onPrimaryOverlay },
                    ]}
                    onPress={() => onPeriodChange(p)}
                  >
                    <ThemedText
                      style={[
                        styles.periodButtonText,
                        period === p && styles.periodButtonTextActive,
                        { color: onPrimaryText },
                      ]}
                    >
                      {p}
                    </ThemedText>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        )}

        <View style={styles.defaultChartContainer}>{children}</View>
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
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cardGradient: {
    padding: 16,
  },
  compactCard: {
    aspectRatio: 1.5,
    borderRadius: 12,
  },
  compactCardSmall: {
    aspectRatio: 1.4,
    borderRadius: 10,
  },
  compactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  compactHeaderText: {
    marginLeft: 8,
    flex: 1,
  },
  compactTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  compactTitleSmall: {
    fontSize: 12,
  },
  compactSubtitle: {
    fontSize: 10,
  },
  compactSubtitleSmall: {
    fontSize: 8,
  },
  compactChartContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  compactFooter: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginTop: 12,
  },

  // Default variant
  defaultCard: {
    aspectRatio: 1.5,
    borderRadius: 16,
  },
  defaultCardSmall: {
    aspectRatio: 1.4,
    borderRadius: 12,
  },
  defaultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  defaultHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  defaultHeaderText: {
    marginLeft: 12,
    flex: 1,
  },
  defaultTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  defaultTitleSmall: {
    fontSize: 14,
  },
  defaultSubtitle: {
    fontSize: 12,
  },
  defaultSubtitleSmall: {
    fontSize: 10,
  },
  defaultPeriodSelector: {
    flexDirection: 'row',
    gap: 4,
  },
  defaultChartContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Detailed variant
  detailedCard: {
    aspectRatio: 1.5,
    borderRadius: 16,
  },
  detailedCardSmall: {
    aspectRatio: 1.4,
    borderRadius: 12,
  },
  detailedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  detailedHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  detailedHeaderText: {
    marginLeft: 12,
    flex: 1,
  },
  detailedTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  detailedTitleSmall: {
    fontSize: 14,
  },
  detailedSubtitle: {
    fontSize: 12,
  },
  detailedSubtitleSmall: {
    fontSize: 10,
  },
  detailedPeriodSelector: {
    flexDirection: 'row',
    gap: 4,
  },
  detailedChartContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  periodButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  periodButtonActive: {},
  periodButtonText: {
    fontSize: 10,
    fontWeight: '500',
  },
  periodButtonTextActive: {
    fontWeight: '600',
  },
});
