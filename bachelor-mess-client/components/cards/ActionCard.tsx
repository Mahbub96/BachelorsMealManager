import React from 'react';
import { View, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import type { IconName } from '@/constants/IconTypes';
import { LinearGradient } from 'expo-linear-gradient';
import { ThemedText } from '../ThemedText';

const { width: screenWidth } = Dimensions.get('window');

export interface ActionCardProps {
  title: string;
  subtitle?: string;
  icon: string;
  iconColor?: string;
  gradientColors?: [string, string, ...string[]];
  onPress?: () => void;
  isSmallScreen?: boolean;
  variant?: 'default' | 'compact' | 'detailed';
  disabled?: boolean;
  badge?: string;
  badgeColor?: string;
}

export const ActionCard: React.FC<ActionCardProps> = ({
  title,
  subtitle,
  icon,
  iconColor,
  gradientColors,
  onPress,
  isSmallScreen = screenWidth < 375,
  variant = 'default',
  disabled = false,
  badge,
  badgeColor,
}) => {
  const { theme } = useTheme();
  const onPrimaryText = theme.onPrimary?.text ?? theme.text.inverse;
  const onPrimaryOverlay = theme.onPrimary?.overlay ?? theme.text.tertiary;
  const iconColorResolved = iconColor ?? onPrimaryText;
  const gradientColorsResolved = gradientColors ?? (theme.gradient.primary as [string, string, ...string[]]);
  const badgeColorResolved = badgeColor ?? theme.status.error;

  const cardStyle = [styles.card, { shadowColor: theme.shadow.light }];
  const iconContainerStyle = [styles.iconContainer, { backgroundColor: onPrimaryOverlay }];
  const titleStyle = (s: object) => [s, { color: onPrimaryText }];
  const subtitleStyle = (s: object) => [s, { color: onPrimaryOverlay ?? onPrimaryText }];
  const badgeTextStyle = [styles.badgeText, { color: onPrimaryText }];

  const renderCompactCard = () => (
    <TouchableOpacity
      style={[
        ...cardStyle,
        styles.compactCard,
        isSmallScreen && styles.compactCardSmall,
        disabled && styles.disabledCard,
      ]}
      onPress={onPress}
      activeOpacity={onPress && !disabled ? 0.7 : 1}
      disabled={disabled}
    >
      <LinearGradient colors={gradientColorsResolved} style={styles.cardGradient}>
        <View style={styles.compactContent}>
          <View style={iconContainerStyle}>
            <Ionicons
              name={icon as IconName}
              size={isSmallScreen ? 32 : 36}
              color={iconColorResolved}
            />
          </View>
          <ThemedText style={titleStyle([styles.compactTitle, isSmallScreen && styles.compactTitleSmall])}>
            {title}
          </ThemedText>
          {subtitle && (
            <ThemedText style={subtitleStyle([styles.compactSubtitle, isSmallScreen && styles.compactSubtitleSmall])}>
              {subtitle}
            </ThemedText>
          )}
          {badge && (
            <View style={[styles.badge, { backgroundColor: badgeColorResolved }]}>
              <ThemedText style={badgeTextStyle}>{badge}</ThemedText>
            </View>
          )}
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );

  const renderDetailedCard = () => (
    <TouchableOpacity
      style={[
        ...cardStyle,
        styles.detailedCard,
        isSmallScreen && styles.detailedCardSmall,
        disabled && styles.disabledCard,
      ]}
      onPress={onPress}
      activeOpacity={onPress && !disabled ? 0.7 : 1}
      disabled={disabled}
    >
      <LinearGradient colors={gradientColorsResolved} style={styles.cardGradient}>
        <View style={styles.detailedHeader}>
          <View style={iconContainerStyle}>
            <Ionicons
              name={icon as IconName}
              size={isSmallScreen ? 28 : 32}
              color={iconColorResolved}
            />
          </View>
          {badge && (
            <View style={[styles.badge, { backgroundColor: badgeColorResolved }]}>
              <ThemedText style={badgeTextStyle}>{badge}</ThemedText>
            </View>
          )}
        </View>

        <View style={styles.detailedContent}>
          <ThemedText style={titleStyle([styles.detailedTitle, isSmallScreen && styles.detailedTitleSmall])}>
            {title}
          </ThemedText>
          {subtitle && (
            <ThemedText style={subtitleStyle([styles.detailedSubtitle, isSmallScreen && styles.detailedSubtitleSmall])}>
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
        ...cardStyle,
        styles.defaultCard,
        isSmallScreen && styles.defaultCardSmall,
        disabled && styles.disabledCard,
      ]}
      onPress={onPress}
      activeOpacity={onPress && !disabled ? 0.7 : 1}
      disabled={disabled}
    >
      <LinearGradient colors={gradientColorsResolved} style={styles.cardGradient}>
        <View style={styles.defaultHeader}>
          <View style={iconContainerStyle}>
            <Ionicons
              name={icon as IconName}
              size={isSmallScreen ? 28 : 32}
              color={iconColorResolved}
            />
          </View>
          {badge && (
            <View style={[styles.badge, { backgroundColor: badgeColorResolved }]}>
              <ThemedText style={badgeTextStyle}>{badge}</ThemedText>
            </View>
          )}
        </View>

        <View style={styles.defaultContent}>
          <ThemedText style={titleStyle([styles.defaultTitle, isSmallScreen && styles.defaultTitleSmall])}>
            {title}
          </ThemedText>
          {subtitle && (
            <ThemedText style={subtitleStyle([styles.defaultSubtitle, isSmallScreen && styles.defaultSubtitleSmall])}>
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
  disabledCard: {
    opacity: 0.5,
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
  compactTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 6,
  },
  compactTitleSmall: {
    fontSize: 18,
  },
  compactSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 18,
  },
  compactSubtitleSmall: {
    fontSize: 14,
    lineHeight: 16,
  },
  defaultCard: {
    aspectRatio: 1.2,
    borderRadius: 16,
    width: '100%',
    minWidth: 120,
  },
  defaultCardSmall: {
    aspectRatio: 1.1,
    borderRadius: 12,
    width: '100%',
    minWidth: 100,
  },
  defaultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  defaultContent: {
    flex: 1,
    justifyContent: 'flex-end',
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
    lineHeight: 16,
  },
  defaultSubtitleSmall: {
    fontSize: 10,
    lineHeight: 14,
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
    lineHeight: 16,
  },
  detailedSubtitleSmall: {
    fontSize: 10,
    lineHeight: 14,
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    minWidth: 16,
    alignItems: 'center',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
});
