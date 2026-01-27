import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { IconName } from '@/constants/IconTypes';
import { ThemedText } from '../ThemedText';
import { useTheme } from '../../context/ThemeContext';

interface BazarEmptyStateProps {
  title?: string;
  subtitle?: string;
  icon?: string;
  actionText?: string;
  onActionPress?: () => void;
  showAction?: boolean;
}

export const BazarEmptyState: React.FC<BazarEmptyStateProps> = ({
  title = 'No Shopping Entries',
  subtitle = 'No shopping entries found matching your criteria',
  icon = 'cart-outline',
  actionText = 'Add First Entry',
  onActionPress,
  showAction = true,
}) => {
  const { theme } = useTheme();

  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Ionicons name={icon as IconName} size={64} color={theme.text.tertiary} />
      </View>

      <ThemedText style={[styles.title, { color: theme.text.primary }]}>
        {title}
      </ThemedText>

      <ThemedText style={[styles.subtitle, { color: theme.text.secondary }]}>
        {subtitle}
      </ThemedText>

      {showAction && onActionPress && (
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: theme.primary }]}
          onPress={onActionPress}
        >
          <Ionicons name='add' size={20} color={theme.text.inverse} />
          <ThemedText
            style={[styles.actionButtonText, { color: theme.text.inverse }]}
          >
            {actionText}
          </ThemedText>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  iconContainer: {
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});
