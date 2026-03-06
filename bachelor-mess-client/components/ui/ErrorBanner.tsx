import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { ThemedText } from '../ThemedText';
import { useTheme } from '@/context/ThemeContext';
import { DESIGN_SYSTEM } from '@/components/dashboard/DesignSystem';

/** Reusable: error message + optional retry. Use on any screen that can fail and retry. */
export interface ErrorBannerProps {
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
}

export const ErrorBanner: React.FC<ErrorBannerProps> = ({
  message,
  onRetry,
  retryLabel = 'Retry',
}) => {
  const { theme } = useTheme();
  const errorColor = theme.status?.error ?? '#ef4444';
  return (
    <View
      style={[
        styles.banner,
        { backgroundColor: errorColor + '18', marginBottom: DESIGN_SYSTEM.spacing.lg },
      ]}
    >
      <ThemedText style={[styles.message, { color: errorColor }]}>{message}</ThemedText>
      {onRetry != null && (
        <TouchableOpacity onPress={onRetry}>
          <ThemedText style={[styles.action, { color: theme.primary }]}>
            {retryLabel}
          </ThemedText>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: DESIGN_SYSTEM.spacing.md,
    borderRadius: DESIGN_SYSTEM.borderRadius.sm,
  },
  message: { flex: 1, fontSize: 14 },
  action: { fontWeight: '600', fontSize: 14 },
});
