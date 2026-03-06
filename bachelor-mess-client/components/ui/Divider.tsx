import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { DESIGN_SYSTEM } from '@/components/dashboard/DesignSystem';

/**
 * Generic horizontal divider. Reuse between sections, list items, etc.
 */
export interface DividerProps {
  verticalMargin?: number;
}

export const Divider: React.FC<DividerProps> = ({ verticalMargin = DESIGN_SYSTEM.spacing.lg }) => {
  const { theme } = useTheme();
  return (
    <View
      style={[
        styles.divider,
        {
          backgroundColor: theme.border?.secondary ?? theme.cardBorder,
          marginVertical: verticalMargin,
        },
      ]}
    />
  );
};

const styles = StyleSheet.create({
  divider: {
    height: 1,
    width: '100%',
  },
});
