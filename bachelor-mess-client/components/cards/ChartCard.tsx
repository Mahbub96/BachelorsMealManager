import React from 'react';
import { View, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
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
  iconColor = '#fff',
  gradientColors = ['#667eea', '#764ba2'],
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
      <LinearGradient colors={gradientColors} style={styles.cardGradient}>
        {showHeader && (
          <View style={styles.compactHeader}>
            {showIcon && icon && (
              <Ionicons
                name={icon as any}
                size={isSmallScreen ? 16 : 18}
                color={iconColor}
              />
            )}
            <View style={styles.compactHeaderText}>
              <ThemedText
                style={[
                  styles.compactTitle,
                  isSmallScreen && styles.compactTitleSmall,
                ]}
              >
                {title}
              </ThemedText>
              {subtitle && (
                <ThemedText
                  style={[
                    styles.compactSubtitle,
                    isSmallScreen && styles.compactSubtitleSmall,
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
                ]}
                onPress={() => onPeriodChange(p)}
              >
                <ThemedText
                  style={[
                    styles.periodButtonText,
                    period === p && styles.periodButtonTextActive,
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
      ]}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <LinearGradient colors={gradientColors} style={styles.cardGradient}>
        {showHeader && (
          <View style={styles.detailedHeader}>
            <View style={styles.detailedHeaderLeft}>
              {showIcon && icon && (
                <View style={styles.iconContainer}>
                  <Ionicons
                    name={icon as any}
                    size={isSmallScreen ? 20 : 24}
                    color={iconColor}
                  />
                </View>
              )}
              <View style={styles.detailedHeaderText}>
                <ThemedText
                  style={[
                    styles.detailedTitle,
                    isSmallScreen && styles.detailedTitleSmall,
                  ]}
                >
                  {title}
                </ThemedText>
                {subtitle && (
                  <ThemedText
                    style={[
                      styles.detailedSubtitle,
                      isSmallScreen && styles.detailedSubtitleSmall,
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
                    ]}
                    onPress={() => onPeriodChange(p)}
                  >
                    <ThemedText
                      style={[
                        styles.periodButtonText,
                        period === p && styles.periodButtonTextActive,
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
      ]}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <LinearGradient colors={gradientColors} style={styles.cardGradient}>
        {showHeader && (
          <View style={styles.defaultHeader}>
            <View style={styles.defaultHeaderLeft}>
              {showIcon && icon && (
                <View style={styles.iconContainer}>
                  <Ionicons
                    name={icon as any}
                    size={isSmallScreen ? 20 : 24}
                    color={iconColor}
                  />
                </View>
              )}
              <View style={styles.defaultHeaderText}>
                <ThemedText
                  style={[
                    styles.defaultTitle,
                    isSmallScreen && styles.defaultTitleSmall,
                  ]}
                >
                  {title}
                </ThemedText>
                {subtitle && (
                  <ThemedText
                    style={[
                      styles.defaultSubtitle,
                      isSmallScreen && styles.defaultSubtitleSmall,
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
                    ]}
                    onPress={() => onPeriodChange(p)}
                  >
                    <ThemedText
                      style={[
                        styles.periodButtonText,
                        period === p && styles.periodButtonTextActive,
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
  // Base card styles
  card: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cardGradient: {
    padding: 16,
  },

  // Compact variant
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
    color: '#fff',
    marginBottom: 2,
  },
  compactTitleSmall: {
    fontSize: 12,
  },
  compactSubtitle: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.8)',
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
    color: '#fff',
    marginBottom: 4,
  },
  defaultTitleSmall: {
    fontSize: 14,
  },
  defaultSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
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
    color: '#fff',
    marginBottom: 4,
  },
  detailedTitleSmall: {
    fontSize: 14,
  },
  detailedSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
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

  // Shared styles
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  periodButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  periodButtonActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  periodButtonText: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },
  periodButtonTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
});
