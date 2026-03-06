import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '../ThemedText';
import { useTheme } from '@/context/ThemeContext';
import { DESIGN_SYSTEM } from '@/components/dashboard/DesignSystem';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export interface MonthYearSelectorProps {
  month: number; // 1–12
  year: number;
  onPrev: () => void;
  onNext: () => void;
  subtitle?: string;
}

export const MonthYearSelector: React.FC<MonthYearSelectorProps> = ({
  month,
  year,
  onPrev,
  onNext,
  subtitle,
}) => {
  const { theme } = useTheme();
  const label = `${MONTH_NAMES[month - 1]} ${year}`;
  return (
    <View style={[styles.wrap, { backgroundColor: theme.cardBackground ?? theme.surface }]}>
      <TouchableOpacity
        onPress={onPrev}
        style={[styles.arrowBtn, { backgroundColor: theme.cardBackground, borderColor: theme.border?.secondary }]}
        accessibilityLabel="Previous month"
      >
        <Ionicons name="chevron-back" size={24} color={theme.text?.primary} />
      </TouchableOpacity>
      <View style={styles.center}>
        <ThemedText style={styles.label}>{label}</ThemedText>
        {subtitle != null && subtitle !== '' && (
          <ThemedText style={[styles.subtitle, { color: theme.text?.secondary }]}>{subtitle}</ThemedText>
        )}
      </View>
      <TouchableOpacity
        onPress={onNext}
        style={[styles.arrowBtn, { backgroundColor: theme.cardBackground, borderColor: theme.border?.secondary }]}
        accessibilityLabel="Next month"
      >
        <Ionicons name="chevron-forward" size={24} color={theme.text?.primary} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: DESIGN_SYSTEM.spacing.sm,
    paddingHorizontal: DESIGN_SYSTEM.spacing.md,
    borderRadius: 12,
    marginBottom: DESIGN_SYSTEM.spacing.lg,
  },
  arrowBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: { alignItems: 'center' },
  label: { fontSize: 16, fontWeight: '600' },
  subtitle: { fontSize: 12, marginTop: 2 },
});
