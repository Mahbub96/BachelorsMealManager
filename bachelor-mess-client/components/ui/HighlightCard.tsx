import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ThemedText } from '../ThemedText';
import { useTheme } from '@/context/ThemeContext';
import { DESIGN_SYSTEM } from '@/components/dashboard/DesignSystem';

/**
 * Generic hero/overview card: one prominent value with label. Reuse for balance, total, main KPI.
 */
export interface HighlightCardProps {
  label: string;
  value: string | number;
  valuePrefix?: string;
  valueSuffix?: string;
  subtitle?: string;
  tintColor?: string;
  /** Smaller padding and font for mobile */
  compact?: boolean;
}

function safeDisplayValue(value: string | number): string {
  if (typeof value === 'number' && Number.isFinite(value)) return value.toLocaleString();
  if (typeof value === 'string') return value;
  return '0';
}

export const HighlightCard: React.FC<HighlightCardProps> = ({
  label,
  value,
  valuePrefix = '',
  valueSuffix = '',
  subtitle,
  tintColor,
  compact = false,
}) => {
  const { theme } = useTheme();
  const tint = tintColor ?? theme.primary;
  const displayValue = safeDisplayValue(value);
  return (
    <View
      style={[
        styles.card,
        compact && styles.cardCompact,
        {
          backgroundColor: theme.cardBackground,
          borderColor: theme.cardBorder ?? theme.border?.secondary,
          shadowColor: theme.cardShadow ?? theme.background,
        },
      ]}
    >
      <ThemedText
        style={[styles.label, compact && styles.labelCompact, { color: theme.text?.secondary }]}
        numberOfLines={2}
      >
        {label}
      </ThemedText>
      <ThemedText
        style={[styles.value, compact && styles.valueCompact, { color: tint }]}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.5}
      >
        {valuePrefix}
        {displayValue}
        {valueSuffix}
      </ThemedText>
      {subtitle != null && subtitle !== '' && (
        <ThemedText
          style={[
            styles.subtitle,
            { color: theme.text?.tertiary ?? theme.text?.secondary },
          ]}
          numberOfLines={2}
        >
          {subtitle}
        </ThemedText>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: DESIGN_SYSTEM.borderRadius.lg,
    borderWidth: 1,
    padding: DESIGN_SYSTEM.spacing.xl,
    marginBottom: DESIGN_SYSTEM.spacing.xl,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
  },
  cardCompact: {
    padding: DESIGN_SYSTEM.spacing.md,
    marginBottom: DESIGN_SYSTEM.spacing.md,
    shadowRadius: 4,
    elevation: 2,
  },
  label: {
    fontSize: DESIGN_SYSTEM.typography.sizes.sm,
    fontWeight: DESIGN_SYSTEM.typography.weights.medium,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  labelCompact: { fontSize: DESIGN_SYSTEM.typography.sizes.xs, marginBottom: 2 },
  value: {
    fontSize: DESIGN_SYSTEM.typography.sizes.xxl,
    fontWeight: DESIGN_SYSTEM.typography.weights.bold,
    maxWidth: '100%',
  },
  valueCompact: { fontSize: DESIGN_SYSTEM.typography.sizes.xl },
  subtitle: {
    fontSize: DESIGN_SYSTEM.typography.sizes.xs,
    marginTop: 4,
  },
});
