import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { DESIGN_SYSTEM } from '@/components/dashboard/DesignSystem';

/**
 * Reusable card container for any list (payments, bazar, meals, settings, etc.).
 * Themed background, border, shadow. Use with IconListRow or any row components.
 */
export interface ListCardProps {
  children: React.ReactNode;
}

export const ListCard: React.FC<ListCardProps> = ({ children }) => {
  const { theme } = useTheme();
  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.cardBackground,
          borderColor: theme.cardBorder ?? theme.border?.primary,
          shadowColor: theme.cardShadow,
        },
      ]}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: DESIGN_SYSTEM.borderRadius.md,
    borderWidth: 1,
    padding: DESIGN_SYSTEM.spacing.lg,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    overflow: 'hidden',
  },
});
