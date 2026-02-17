import React from 'react';
import { View, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { IconName } from '@/constants/IconTypes';
import { ThemedText } from '../ThemedText';
import { useTheme } from '@/context/ThemeContext';

const { width: screenWidth } = Dimensions.get('window');

export interface ActionItem {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  color: string;
  onPress: () => void;
}

interface QuickActionsProps {
  actions: ActionItem[];
  title?: string;
  subtitle?: string;
  isSmallScreen?: boolean;
  columns?: 2 | 3 | 4;
}

export const QuickActions: React.FC<QuickActionsProps> = ({
  actions,
  title = 'Quick Actions',
  subtitle = 'Manage your flat efficiently',
  isSmallScreen = false,
  columns = 2,
}) => {
  const { theme } = useTheme();
  const padding = 16;
  const gap = 12;
  const availableWidth = screenWidth - padding * 2 - gap * (columns - 1);
  const cardWidth = availableWidth / columns;

  return (
    <View style={[styles.wrap, { paddingHorizontal: padding, marginBottom: 28 }]}>
      {(title || subtitle) && (
        <View style={styles.sectionHeader}>
          <ThemedText style={[styles.sectionTitle, { color: theme.text?.primary }]}>
            {title}
          </ThemedText>
          {subtitle && (
            <ThemedText style={[styles.sectionSubtitle, { color: theme.text?.secondary }]}>
              {subtitle}
            </ThemedText>
          )}
        </View>
      )}
      <View style={styles.grid}>
        {(actions || []).map((action) => (
          <TouchableOpacity
            key={action.id}
            style={[
              styles.card,
              {
                width: cardWidth,
                backgroundColor: theme.cardBackground ?? theme.surface,
                borderWidth: 1,
                borderColor: theme.border?.secondary ?? theme.cardBorder ?? 'transparent',
                shadowColor: theme.shadow?.light ?? theme.cardShadow,
              },
            ]}
            onPress={action.onPress}
            activeOpacity={0.7}
          >
            <View
              style={[
                styles.iconWrap,
                { backgroundColor: (action.color || theme.primary) + '18' },
              ]}
            >
              <Ionicons
                name={action.icon as IconName}
                size={isSmallScreen ? 24 : 26}
                color={action.color || theme.primary}
              />
            </View>
            <ThemedText
              style={[styles.actionTitle, { color: theme.text?.primary }]}
              numberOfLines={1}
            >
              {action.title}
            </ThemedText>
            <ThemedText
              style={[styles.actionSubtitle, { color: theme.text?.secondary }]}
              numberOfLines={1}
            >
              {action.subtitle}
            </ThemedText>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {},
  sectionHeader: {
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.2,
    marginBottom: 2,
  },
  sectionSubtitle: {
    fontSize: 13,
    fontWeight: '500',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  card: {
    borderRadius: 16,
    padding: 16,
    minHeight: 100,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  actionTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },
  actionSubtitle: {
    fontSize: 12,
    fontWeight: '500',
  },
});
