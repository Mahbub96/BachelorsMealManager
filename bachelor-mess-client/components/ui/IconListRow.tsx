import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { ThemedText } from '../ThemedText';
import { useTheme } from '@/context/ThemeContext';
import { DESIGN_SYSTEM } from '@/components/dashboard/DesignSystem';

/** Reusable: list row with icon, title, subtitle, optional right node. Use for settings, menus, payments, bazar, etc. */
export interface IconListRowProps {
  icon: React.ReactNode;
  iconBackgroundColor?: string;
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  borderBottomColor?: string;
  backgroundColor?: string;
  onPress?: () => void;
}

export const IconListRow: React.FC<IconListRowProps> = ({
  icon,
  iconBackgroundColor,
  title,
  subtitle,
  right,
  borderBottomColor,
  backgroundColor,
  onPress,
}) => {
  const { theme } = useTheme();
  const bg = backgroundColor ?? theme.cardBackground;
  const borderColor = borderBottomColor ?? theme.border?.secondary;
  const iconBg = iconBackgroundColor ?? theme.primary + '18';

  return (
    <TouchableOpacity
      style={[styles.row, { backgroundColor: bg, borderBottomColor: borderColor }]}
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.iconWrap, { backgroundColor: iconBg }]}>
        {icon}
      </View>
      <View style={styles.content}>
        <ThemedText style={[styles.title, { color: theme.text.primary }]} numberOfLines={1}>
          {title}
        </ThemedText>
        {subtitle != null && subtitle !== '' && (
          <ThemedText style={[styles.subtitle, { color: theme.text.secondary }]} numberOfLines={1}>
            {subtitle}
          </ThemedText>
        )}
      </View>
      {right != null ? <View style={styles.right}>{right}</View> : null}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: DESIGN_SYSTEM.spacing.md,
    paddingHorizontal: DESIGN_SYSTEM.spacing.sm,
    borderBottomWidth: 1,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: DESIGN_SYSTEM.spacing.md,
  },
  content: { flex: 1 },
  title: { fontSize: 16, fontWeight: '600', marginBottom: 2 },
  subtitle: { fontSize: 14 },
  right: {},
});
