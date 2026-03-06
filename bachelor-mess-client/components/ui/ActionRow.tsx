import React from 'react';
import { View, StyleSheet } from 'react-native';
import { IconListRow } from './IconListRow';
import { ThemeButton } from './ThemeButton';
import { DESIGN_SYSTEM } from '@/components/dashboard/DesignSystem';

/**
 * Generic list row with primary + danger actions (e.g. Confirm / Reject).
 * Use for: pending approvals, delete confirmations, etc.
 */
export interface ActionRowProps {
  icon: React.ReactNode;
  iconBackgroundColor?: string;
  title: string;
  subtitle?: string;
  primaryLabel: string;
  onPrimary: () => void;
  dangerLabel: string;
  onDanger: () => void;
  loading?: boolean;
  disabled?: boolean;
  onPress?: () => void;
}

export const ActionRow: React.FC<ActionRowProps> = ({
  icon,
  iconBackgroundColor,
  title,
  subtitle,
  primaryLabel,
  onPrimary,
  dangerLabel,
  onDanger,
  loading = false,
  disabled = false,
  onPress,
}) => {
  const right = (
    <View style={styles.actions}>
      <ThemeButton
        title={primaryLabel}
        onPress={onPrimary}
        disabled={disabled}
        loading={loading}
        size="small"
        variant="primary"
      />
      <ThemeButton
        title={dangerLabel}
        onPress={onDanger}
        disabled={disabled}
        size="small"
        variant="danger"
        style={styles.dangerBtn}
      />
    </View>
  );
  return (
    <IconListRow
      icon={icon}
      iconBackgroundColor={iconBackgroundColor}
      title={title}
      subtitle={subtitle}
      right={right}
      onPress={onPress}
    />
  );
};

const styles = StyleSheet.create({
  actions: { flexDirection: 'row', alignItems: 'center' },
  dangerBtn: { marginLeft: DESIGN_SYSTEM.spacing.sm },
});
