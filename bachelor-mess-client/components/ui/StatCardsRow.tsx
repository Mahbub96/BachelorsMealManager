import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SummaryCard } from './SummaryCard';
import { useTheme } from '@/context/ThemeContext';
import { DESIGN_SYSTEM } from '@/components/dashboard/DesignSystem';

/**
 * Generic row of stat/summary cards. Reuse for any screen: balances, totals, counts, etc.
 */
export interface StatCardItem {
  title: string;
  subtitle?: string;
  value: string | number;
  valuePrefix?: string;
  valueSuffix?: string;
  tintColor?: string;
}

export interface StatCardsRowProps {
  items: StatCardItem[];
}

export const StatCardsRow: React.FC<StatCardsRowProps> = ({ items }) => {
  const { theme } = useTheme();
  if (items.length === 0) return null;
  return (
    <View style={styles.wrap}>
      {items.map((item, index) => (
        <View key={index} style={styles.cardWrap}>
          <SummaryCard
            title={item.title}
            subtitle={item.subtitle}
            value={item.value}
            valuePrefix={item.valuePrefix}
            valueSuffix={item.valueSuffix}
            tintColor={item.tintColor}
          />
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -DESIGN_SYSTEM.spacing.sm,
    marginBottom: DESIGN_SYSTEM.spacing.md,
  },
  cardWrap: {
    width: '50%',
    minWidth: 0,
    paddingHorizontal: DESIGN_SYSTEM.spacing.sm,
    marginBottom: DESIGN_SYSTEM.spacing.md,
  },
});
