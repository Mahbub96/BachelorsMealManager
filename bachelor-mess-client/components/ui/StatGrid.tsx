import React from 'react';
import { View, StyleSheet } from 'react-native';
import { MiniStatCard } from './MiniStatCard';
import { DESIGN_SYSTEM } from '@/components/dashboard/DesignSystem';

export interface StatGridItem {
  label: string;
  value: number | string;
  valuePrefix?: string;
  valueSuffix?: string;
  tintColor?: string;
}

export interface StatGridProps {
  items: StatGridItem[];
}

/**
 * 2-per-row grid of compact stat cards. Use for mobile overview (e.g. Pool, Flat, Due, Expected).
 */
export const StatGrid: React.FC<StatGridProps> = ({ items }) => {
  if (items.length === 0) return null;
  return (
    <View style={styles.wrap}>
      {items.map((item, index) => (
        <View key={index} style={styles.cell}>
          <MiniStatCard
            label={item.label}
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
    marginHorizontal: -DESIGN_SYSTEM.spacing.xs,
  },
  cell: {
    width: '50%',
    minWidth: 0,
    paddingHorizontal: DESIGN_SYSTEM.spacing.xs,
    marginBottom: DESIGN_SYSTEM.spacing.sm,
  },
});
