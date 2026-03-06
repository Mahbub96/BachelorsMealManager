import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ThemedText } from '../ThemedText';
import { useTheme } from '@/context/ThemeContext';
import { DESIGN_SYSTEM } from '@/components/dashboard/DesignSystem';

/** Reusable: section title + optional subtitle/right action. Use on any screen with sections. */
export interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  rightElement?: React.ReactNode;
  /** 'label' = compact uppercase label; 'default' = normal title */
  variant?: 'default' | 'label';
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  subtitle,
  rightElement,
  variant = 'default',
}) => {
  const { theme } = useTheme();
  const isLabel = variant === 'label';
  return (
    <View style={[styles.wrap, isLabel && styles.wrapLabel]}>
      <View>
        <ThemedText
          style={[
            styles.title,
            { color: theme.text.primary },
            isLabel && [styles.titleLabel, { color: theme.text?.secondary }],
          ]}
        >
          {title}
        </ThemedText>
        {subtitle != null && subtitle !== '' ? (
          <ThemedText style={[styles.subtitle, { color: theme.text?.secondary }]}>
            {subtitle}
          </ThemedText>
        ) : null}
      </View>
      {rightElement != null ? rightElement : null}
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: DESIGN_SYSTEM.spacing.md,
  },
  wrapLabel: { marginBottom: DESIGN_SYSTEM.spacing.sm },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  titleLabel: {
    fontSize: DESIGN_SYSTEM.typography.sizes.sm,
    fontWeight: DESIGN_SYSTEM.typography.weights.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  subtitle: {
    fontSize: 13,
    marginTop: 2,
  },
});
