import React from 'react';
import { View, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ThemedText } from '../ThemedText';

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
  iconColor = '#fff',
  iconBackgroundColor = '#667eea',
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
  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'success':
        return '#10b981';
      case 'warning':
        return '#f59e0b';
      case 'error':
        return '#ef4444';
      default:
        return '#667eea';
    }
  };

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
      ]}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View style={styles.compactContent}>
        {showIcon && icon && (
          <View
            style={[
              styles.iconContainer,
              { backgroundColor: iconBackgroundColor },
            ]}
          >
            <Ionicons
              name={icon as any}
              size={isSmallScreen ? 16 : 18}
              color={iconColor}
            />
          </View>
        )}
        <View style={styles.compactInfo}>
          <ThemedText
            style={[
              styles.compactTitle,
              isSmallScreen && styles.compactTitleSmall,
            ]}
          >
            {title}
          </ThemedText>
          {description && (
            <ThemedText
              style={[
                styles.compactDescription,
                isSmallScreen && styles.compactDescriptionSmall,
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
                { backgroundColor: iconBackgroundColor },
              ]}
            >
              <Ionicons
                name={icon as any}
                size={isSmallScreen ? 20 : 24}
                color={iconColor}
              />
            </View>
          )}
          <View style={styles.detailedInfo}>
            <ThemedText
              style={[
                styles.detailedTitle,
                isSmallScreen && styles.detailedTitleSmall,
              ]}
            >
              {title}
            </ThemedText>
            {description && (
              <ThemedText
                style={[
                  styles.detailedDescription,
                  isSmallScreen && styles.detailedDescriptionSmall,
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
                name={getStatusIcon(status) as any}
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
                { backgroundColor: iconBackgroundColor },
              ]}
            >
              <Ionicons
                name={icon as any}
                size={isSmallScreen ? 20 : 24}
                color={iconColor}
              />
            </View>
          )}
          <View style={styles.defaultInfo}>
            <ThemedText
              style={[
                styles.defaultTitle,
                isSmallScreen && styles.defaultTitleSmall,
              ]}
            >
              {title}
            </ThemedText>
            {description && (
              <ThemedText
                style={[
                  styles.defaultDescription,
                  isSmallScreen && styles.defaultDescriptionSmall,
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
                name={getStatusIcon(status) as any}
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
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    shadowColor: '#000',
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
    color: '#1f2937',
    marginBottom: 2,
  },
  compactTitleSmall: {
    fontSize: 12,
  },
  compactDescription: {
    fontSize: 12,
    color: '#6b7280',
    lineHeight: 16,
  },
  compactDescriptionSmall: {
    fontSize: 10,
    lineHeight: 14,
  },
  compactTimestamp: {
    fontSize: 10,
    color: '#9ca3af',
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
    color: '#1f2937',
    marginBottom: 4,
  },
  defaultTitleSmall: {
    fontSize: 14,
  },
  defaultDescription: {
    fontSize: 14,
    color: '#6b7280',
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
    color: '#9ca3af',
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
    color: '#1f2937',
    marginBottom: 4,
  },
  detailedTitleSmall: {
    fontSize: 14,
  },
  detailedDescription: {
    fontSize: 14,
    color: '#6b7280',
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
    color: '#9ca3af',
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
    color: '#10b981',
  },
  amountTextSmall: {
    fontSize: 12,
  },
});
