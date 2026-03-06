import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ThemedText } from '../ThemedText';
import { useTheme } from '@/context/ThemeContext';
import { DESIGN_SYSTEM } from '@/components/dashboard/DesignSystem';

/** Reusable: small status label with colored background. Use for paid/pending/approved/overdue, etc. */
export interface StatusBadgeProps {
  label: string;
  color: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  label,
  color,
}) => {
  return (
    <View style={[styles.badge, { backgroundColor: color + '20' }]}>
      <ThemedText style={[styles.text, { color }]}>{label}</ThemedText>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: DESIGN_SYSTEM.spacing.sm,
    paddingVertical: 4,
    borderRadius: DESIGN_SYSTEM.borderRadius.xs,
  },
  text: { fontSize: 12, fontWeight: '600' },
});
