import React from 'react';
import { View, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { IconName } from '@/constants/IconTypes';
import { ThemedText } from '../ThemedText';
import { useTheme } from '../../context/ThemeContext';

const { width: screenWidth } = Dimensions.get('window');

export interface ActivityCardProps {
  title: string;
  description?: string;
  icon?: string;
  iconColor?: string;
  iconBackgroundColor?: string;
  timestamp?: string;
  amount?: string | number;
  status?: 'success' | 'warning' | 'error' | 'info';
  onPress?: () => void;
  isSmallScreen?: boolean;
  variant?: 'default' | 'compact' | 'detailed';
  showIcon?: boolean;
  showAmount?: boolean;
  showTimestamp?: boolean;
}

export const ActivityCard: React.FC<ActivityCardProps> = ({
  title,
  description,
  icon,
  iconColor,
  iconBackgroundColor,
  timestamp,
  amount,
  status = 'info',
  onPress,
  isSmallScreen = screenWidth < 375,
  variant = 'default',
  showIcon = true,
  showAmount = true,
  showTimestamp = true,
}) => {
  const { theme } = useTheme();

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'success':
        return theme.status?.success || theme.gradient?.success?.[0] || '#10b981';
      case 'warning':
        return theme.status?.warning || theme.gradient?.warning?.[0] || '#f59e0b';
      case 'error':
        return theme.status?.error || theme.gradient?.error?.[0] || '#ef4444';
      default:
        return theme.primary || theme.gradient?.primary?.[0] || '#667eea';
    }
  };

  const defaultIconColor = iconColor || '#fff';
  const defaultIconBg = iconBackgroundColor || theme.primary || theme.gradient?.primary?.[0] || '#667eea';

  const getStatusIcon = (status: string): string => {
    switch (status) {
      case 'success':
        return 'checkmark-circle';
      case 'warning':
        return 'warning';
      case 'error':
        return 'close-circle';
      default:
        return 'information-circle';
    }
  };

  const formatTimestamp = (timestamp: string): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const renderCompactCard = () => (
    <TouchableOpacity
      style={[
        styles.card,
        styles.compactCard,
        isSmallScreen && styles.compactCardSmall,
        {
          backgroundColor: theme.cardBackground || theme.surface || '#fff',
          shadowColor: theme.cardShadow || '#000',
        },
      ]}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View style={styles.compactContent}>
        {showIcon && icon && (
          <View
            style={[
              styles.iconContainer,
              { backgroundColor: defaultIconBg },
            ]}
          >
            <Ionicons
              name={icon as IconName}
              size={isSmallScreen ? 16 : 18}
              color={defaultIconColor}
            />
          </View>
        )}
        <View style={styles.compactInfo}>
          <ThemedText
            style={[
              styles.compactTitle,
              isSmallScreen && styles.compactTitleSmall,
              { color: theme.text.primary || '#1f2937' },
            ]}
          >
            {title}
          </ThemedText>
          {description && (
            <ThemedText
              style={[
                styles.compactDescription,
                isSmallScreen && styles.compactDescriptionSmall,
                { color: theme.text.secondary || '#6b7280' },
              ]}
            >
              {description}
            </ThemedText>
          )}
          {showTimestamp && timestamp && (
            <ThemedText
              style={[
                styles.compactTimestamp,
                isSmallScreen && styles.compactTimestampSmall,
                { color: theme.text.tertiary || '#9ca3af' },
              ]}
            >
              {formatTimestamp(timestamp)}
            </ThemedText>
          )}
        </View>
        {showAmount && amount && (
          <View style={styles.compactAmount}>
            <ThemedText
              style={[
                styles.amountText,
                isSmallScreen && styles.amountTextSmall,
                { color: theme.status?.success || theme.gradient?.success?.[0] || '#10b981' },
              ]}
            >
              {amount}
            </ThemedText>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderDetailedCard = () => (
    <TouchableOpacity
      style={[
        styles.card,
        styles.detailedCard,
        isSmallScreen && styles.detailedCardSmall,
        {
          backgroundColor: theme.cardBackground || theme.surface || '#fff',
          shadowColor: theme.cardShadow || '#000',
        },
      ]}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View style={styles.detailedContent}>
        <View style={styles.detailedHeader}>
          {showIcon && icon && (
            <View
              style={[
                styles.iconContainer,
                { backgroundColor: defaultIconBg },
              ]}
            >
              <Ionicons
                name={icon as IconName}
                size={isSmallScreen ? 20 : 24}
                color={defaultIconColor}
              />
            </View>
          )}
          <View style={styles.detailedInfo}>
            <ThemedText
              style={[
                styles.detailedTitle,
                isSmallScreen && styles.detailedTitleSmall,
                { color: theme.text.primary || '#1f2937' },
              ]}
            >
              {title}
            </ThemedText>
            {description && (
              <ThemedText
                style={[
                  styles.detailedDescription,
                  isSmallScreen && styles.detailedDescriptionSmall,
                  { color: theme.text.secondary || '#6b7280' },
                ]}
              >
                {description}
              </ThemedText>
            )}
          </View>
          <View style={styles.detailedMeta}>
            {showAmount && amount && (
              <ThemedText
                style={[
                  styles.amountText,
                  isSmallScreen && styles.amountTextSmall,
                  { color: theme.status?.success || theme.gradient?.success?.[0] || '#10b981' },
                ]}
              >
                {amount}
              </ThemedText>
            )}
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: getStatusColor(status) },
              ]}
            >
              <Ionicons
                name={getStatusIcon(status) as IconName}
                size={isSmallScreen ? 10 : 12}
                color='#fff'
              />
            </View>
          </View>
        </View>

        {showTimestamp && timestamp && (
          <View style={styles.detailedFooter}>
            <ThemedText
              style={[
                styles.detailedTimestamp,
                isSmallScreen && styles.detailedTimestampSmall,
                { color: theme.text.tertiary || '#9ca3af' },
              ]}
            >
              {formatTimestamp(timestamp)}
            </ThemedText>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderDefaultCard = () => (
    <TouchableOpacity
      style={[
        styles.card,
        styles.defaultCard,
        isSmallScreen && styles.defaultCardSmall,
        {
          backgroundColor: theme.cardBackground || theme.surface || '#fff',
          shadowColor: theme.cardShadow || '#000',
        },
      ]}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View style={styles.defaultContent}>
        <View style={styles.defaultHeader}>
          {showIcon && icon && (
            <View
              style={[
                styles.iconContainer,
                { backgroundColor: defaultIconBg },
              ]}
            >
              <Ionicons
                name={icon as IconName}
                size={isSmallScreen ? 20 : 24}
                color={defaultIconColor}
              />
            </View>
          )}
          <View style={styles.defaultInfo}>
            <ThemedText
              style={[
                styles.defaultTitle,
                isSmallScreen && styles.defaultTitleSmall,
                { color: theme.text.primary || '#1f2937' },
              ]}
            >
              {title}
            </ThemedText>
            {description && (
              <ThemedText
                style={[
                  styles.defaultDescription,
                  isSmallScreen && styles.defaultDescriptionSmall,
                  { color: theme.text.secondary || '#6b7280' },
                ]}
              >
                {description}
              </ThemedText>
            )}
          </View>
          <View style={styles.defaultMeta}>
            {showAmount && amount && (
              <ThemedText
                style={[
                  styles.amountText,
                  isSmallScreen && styles.amountTextSmall,
                  { color: theme.status?.success || theme.gradient?.success?.[0] || '#10b981' },
                ]}
              >
                {amount}
              </ThemedText>
            )}
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: getStatusColor(status) },
              ]}
            >
              <Ionicons
                name={getStatusIcon(status) as IconName}
                size={isSmallScreen ? 10 : 12}
                color='#fff'
              />
            </View>
          </View>
        </View>

        {showTimestamp && timestamp && (
          <View style={styles.defaultFooter}>
            <ThemedText
              style={[
                styles.defaultTimestamp,
                isSmallScreen && styles.defaultTimestampSmall,
                { color: theme.text.tertiary || '#9ca3af' },
              ]}
            >
              {formatTimestamp(timestamp)}
            </ThemedText>
          </View>
        )}
      </View>
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
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },

  // Compact variant
  compactCard: {
    padding: 12,
  },
  compactCardSmall: {
    padding: 10,
  },
  compactContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  compactInfo: {
    flex: 1,
    marginLeft: 12,
  },
  compactTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  compactTitleSmall: {
    fontSize: 12,
  },
  compactDescription: {
    fontSize: 12,
    lineHeight: 16,
  },
  compactDescriptionSmall: {
    fontSize: 10,
    lineHeight: 14,
  },
  compactTimestamp: {
    fontSize: 10,
    marginTop: 2,
  },
  compactTimestampSmall: {
    fontSize: 8,
  },
  compactAmount: {
    alignItems: 'flex-end',
  },

  // Default variant
  defaultCard: {
    padding: 16,
  },
  defaultCardSmall: {
    padding: 12,
  },
  defaultContent: {
    flex: 1,
  },
  defaultHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  defaultInfo: {
    flex: 1,
    marginLeft: 12,
  },
  defaultTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  defaultTitleSmall: {
    fontSize: 14,
  },
  defaultDescription: {
    fontSize: 14,
    lineHeight: 18,
  },
  defaultDescriptionSmall: {
    fontSize: 12,
    lineHeight: 16,
  },
  defaultMeta: {
    alignItems: 'flex-end',
    gap: 4,
  },
  defaultFooter: {
    marginTop: 8,
  },
  defaultTimestamp: {
    fontSize: 12,
  },
  defaultTimestampSmall: {
    fontSize: 10,
  },

  // Detailed variant
  detailedCard: {
    padding: 16,
  },
  detailedCardSmall: {
    padding: 12,
  },
  detailedContent: {
    flex: 1,
  },
  detailedHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  detailedInfo: {
    flex: 1,
    marginLeft: 12,
  },
  detailedTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  detailedTitleSmall: {
    fontSize: 14,
  },
  detailedDescription: {
    fontSize: 14,
    lineHeight: 18,
  },
  detailedDescriptionSmall: {
    fontSize: 12,
    lineHeight: 16,
  },
  detailedMeta: {
    alignItems: 'flex-end',
    gap: 4,
  },
  detailedFooter: {
    marginTop: 8,
  },
  detailedTimestamp: {
    fontSize: 12,
  },
  detailedTimestampSmall: {
    fontSize: 10,
  },

  // Shared styles
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  amountText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  amountTextSmall: {
    fontSize: 12,
  },
});
