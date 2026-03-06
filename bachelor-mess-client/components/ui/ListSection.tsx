import React from 'react';
import { View } from 'react-native';
import { ThemedText } from '../ThemedText';
import { useTheme } from '@/context/ThemeContext';
import { Section } from './Section';
import { ListCard } from './ListCard';
import { ModernLoader } from './ModernLoader';
import { DESIGN_SYSTEM } from '@/components/dashboard/DesignSystem';

/**
 * Generic section with a list or empty/loading state. Reuse on any screen (payments, bazar, meals, etc.).
 * Name is "ListSection" not feature-specific.
 */
export interface ListSectionProps<T> {
  title?: string;
  rightElement?: React.ReactNode;
  items: T[];
  renderItem: (item: T) => React.ReactNode;
  keyExtractor: (item: T, index: number) => string;
  emptyHint?: string;
  loading?: boolean;
}

export function ListSection<T>({
  title,
  rightElement,
  items,
  renderItem,
  keyExtractor,
  emptyHint = '',
  loading = false,
}: ListSectionProps<T>): React.ReactElement {
  const { theme } = useTheme();
  const isEmpty = items.length === 0;
  return (
    <Section title={title} rightElement={rightElement}>
      {loading && isEmpty ? (
        <View style={{ padding: DESIGN_SYSTEM.spacing.xl, alignItems: 'center' }}>
          <ModernLoader visible overlay={false} size="small" />
        </View>
      ) : isEmpty ? (
        <ThemedText style={{ paddingVertical: 16, fontSize: 14, color: theme.text?.secondary }}>
          {emptyHint}
        </ThemedText>
      ) : (
        <ListCard>
          {items.map((item, index) => (
            <React.Fragment key={keyExtractor(item, index)}>{renderItem(item)}</React.Fragment>
          ))}
        </ListCard>
      )}
    </Section>
  );
}
