import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SectionHeader } from './SectionHeader';
import { DESIGN_SYSTEM } from '@/components/dashboard/DesignSystem';

/** Generic section: optional header + children. Reuse on any screen. */
export interface SectionProps {
  title?: string;
  rightElement?: React.ReactNode;
  /** Section header style: 'label' = compact uppercase; 'default' = normal */
  headerVariant?: 'default' | 'label';
  children: React.ReactNode;
}

export const Section: React.FC<SectionProps> = ({
  title,
  rightElement,
  headerVariant = 'default',
  children,
}) => (
  <View style={styles.section}>
    {(title != null || rightElement != null) && (
      <SectionHeader title={title ?? ''} rightElement={rightElement} variant={headerVariant} />
    )}
    {children}
  </View>
);

const styles = StyleSheet.create({
  section: { marginBottom: DESIGN_SYSTEM.spacing.xxl },
});
