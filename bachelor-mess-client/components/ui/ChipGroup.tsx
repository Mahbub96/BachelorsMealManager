import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { ThemedText } from '../ThemedText';
import { useTheme } from '@/context/ThemeContext';
import { DESIGN_SYSTEM } from '@/components/dashboard/DesignSystem';

/** Reusable: single-select chip options. Use for filters, payment method, type (full_due/custom), etc. */
export interface ChipOption<T extends string = string> {
  value: T;
  label: string;
}

export interface ChipGroupProps<T extends string = string> {
  options: ChipOption<T>[];
  value: T;
  onSelect: (value: T) => void;
}

export function ChipGroup<T extends string = string>({
  options,
  value,
  onSelect,
}: ChipGroupProps<T>) {
  const { theme } = useTheme();
  return (
    <View style={styles.row}>
      {options.map((opt) => {
        const selected = opt.value === value;
        return (
          <TouchableOpacity
            key={opt.value}
            onPress={() => onSelect(opt.value)}
            style={[
              styles.chip,
              {
                backgroundColor: selected ? theme.primary + '20' : theme.surface,
                borderColor: selected ? theme.primary : theme.border?.primary,
              },
            ]}
          >
            <ThemedText
              style={{
                color: selected ? theme.primary : theme.text.secondary,
                fontWeight: selected ? '600' : '400',
                fontSize: 14,
              }}
            >
              {opt.label}
            </ThemedText>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 10, marginBottom: DESIGN_SYSTEM.spacing.lg },
  chip: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: DESIGN_SYSTEM.borderRadius.sm,
    borderWidth: 1,
    alignItems: 'center',
  },
});
