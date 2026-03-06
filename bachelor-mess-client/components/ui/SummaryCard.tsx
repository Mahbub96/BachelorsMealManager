import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ThemeCard } from './ThemeCard';
import { ThemedText } from '../ThemedText';
import { useTheme } from '@/context/ThemeContext';
import { DESIGN_SYSTEM } from '@/components/dashboard/DesignSystem';

/**
 * Generic summary card: title, optional subtitle, and a highlighted value.
 * Use for: due amount, total bazar, meals count, balance, etc.
 */
export interface SummaryCardProps {
  title: string;
  subtitle?: string;
  value: string | number;
  valuePrefix?: string;
  valueSuffix?: string;
  tintColor?: string;
}

export const SummaryCard: React.FC<SummaryCardProps> = ({
  title,
  subtitle,
  value,
  valuePrefix = '',
  valueSuffix = '',
  tintColor,
}) => {
  const { theme } = useTheme();
  const tint = tintColor ?? theme.status?.warning ?? theme.primary;
  const displayValue = typeof value === 'number' ? value.toLocaleString() : value;
  return (
    <ThemeCard
      title={title}
      subtitle={subtitle}
      style={[styles.card, { borderColor: tint + '60' }]}
      contentStyle={[styles.contentStyle, { backgroundColor: tint + '12' }]}
    >
      <View style={styles.valueRow}>
        <ThemedText
          style={[styles.value, { color: theme.text.primary }]}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.5}
        >
          {valuePrefix}{displayValue}{valueSuffix}
        </ThemedText>
      </View>
    </ThemeCard>
  );
};

const styles = StyleSheet.create({
  card: { marginBottom: DESIGN_SYSTEM.spacing.lg },
  contentStyle: { overflow: 'hidden' },
  valueRow: { marginTop: DESIGN_SYSTEM.spacing.xs, minWidth: 0 },
  value: { fontSize: 22, fontWeight: '700', maxWidth: '100%' },
});
