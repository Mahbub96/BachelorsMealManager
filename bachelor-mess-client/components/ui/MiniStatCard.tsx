import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ThemedText } from '../ThemedText';
import { useTheme } from '@/context/ThemeContext';
import { DESIGN_SYSTEM } from '@/components/dashboard/DesignSystem';

/**
 * Compact stat card for mobile 2x2 grids. Label + value, no gradient.
 */
export interface MiniStatCardProps {
  label: string;
  value: string | number;
  valuePrefix?: string;
  valueSuffix?: string;
  tintColor?: string;
}

function safeDisplayValue(value: string | number): string {
  if (typeof value === 'number' && Number.isFinite(value)) return value.toLocaleString();
  if (typeof value === 'string') return value;
  return '0';
}

export const MiniStatCard: React.FC<MiniStatCardProps> = ({
  label,
  value,
  valuePrefix = '',
  valueSuffix = '',
  tintColor,
}) => {
  const { theme } = useTheme();
  const tint = tintColor ?? theme.primary;
  const displayValue = safeDisplayValue(value);
  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.cardBackground,
          borderColor: theme.cardBorder ?? theme.border?.secondary,
        },
      ]}
    >
      <ThemedText style={[styles.label, { color: theme.text?.secondary }]} numberOfLines={1}>
        {label}
      </ThemedText>
      <ThemedText
        style={[styles.value, { color: tint }]}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.6}
      >
        {valuePrefix}{displayValue}{valueSuffix}
      </ThemedText>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: DESIGN_SYSTEM.borderRadius.md,
    borderWidth: 1,
    paddingVertical: DESIGN_SYSTEM.spacing.md,
    paddingHorizontal: DESIGN_SYSTEM.spacing.sm,
    minHeight: 64,
    justifyContent: 'center',
  },
  label: {
    fontSize: DESIGN_SYSTEM.typography.sizes.xs,
    fontWeight: DESIGN_SYSTEM.typography.weights.medium,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 2,
  },
  value: {
    fontSize: DESIGN_SYSTEM.typography.sizes.lg,
    fontWeight: DESIGN_SYSTEM.typography.weights.bold,
    maxWidth: '100%',
  },
});
