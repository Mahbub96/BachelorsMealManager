import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ThemedText } from '../ThemedText';
import { useTheme } from '@/context/ThemeContext';
import { Section } from './Section';
import { ThemeButton } from './ThemeButton';
import { DESIGN_SYSTEM } from '@/components/dashboard/DesignSystem';

/** Generic section: title + optional hint + one action button. Reuse for any single-action block. */
export interface ActionSectionProps {
  title: string;
  hint?: string;
  buttonTitle: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
}

export const ActionSection: React.FC<ActionSectionProps> = ({
  title,
  hint,
  buttonTitle,
  onPress,
  variant = 'secondary',
}) => {
  const { theme } = useTheme();
  return (
    <Section title={title}>
      {hint != null && hint !== '' && (
        <ThemedText style={[styles.hint, { color: theme.text?.secondary }]}>{hint}</ThemedText>
      )}
      <ThemeButton title={buttonTitle} onPress={onPress} variant={variant} />
    </Section>
  );
};

const styles = StyleSheet.create({
  hint: { fontSize: 14, marginBottom: DESIGN_SYSTEM.spacing.sm },
});
