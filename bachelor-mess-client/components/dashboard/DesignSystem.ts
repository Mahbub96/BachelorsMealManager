/**
 * Unified Design System – colors derived from Theme.ts (single source of truth).
 * For theme-aware UI, prefer useTheme() / theme from ThemeContext in components.
 */

import { LightTheme } from '@/constants/Theme';

export const DESIGN_SYSTEM = {
  colors: {
    primary: LightTheme.primary,
    primaryDark: LightTheme.secondary,
    secondary: LightTheme.accent,
    success: LightTheme.status.success,
    warning: LightTheme.status.warning,
    error: LightTheme.status.error,
    info: LightTheme.status.info,
    background: {
      primary: LightTheme.surface,
      secondary: LightTheme.background,
      card: LightTheme.cardBackground,
    },
    text: {
      primary: LightTheme.text.primary,
      secondary: LightTheme.text.secondary,
      tertiary: LightTheme.text.tertiary,
      inverse: LightTheme.text.inverse,
    },
    light: LightTheme.surface,
    dark: LightTheme.background,
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    xxxl: 32,
  },
  borderRadius: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    full: 9999,
  },
  shadows: {
    sm: { elevation: 2 },
    md: { elevation: 4 },
    lg: { elevation: 8 },
  },
  typography: {
    sizes: { xs: 12, sm: 14, base: 16, lg: 18, xl: 20, xxl: 24, xxxl: 32 },
    weights: { normal: '400' as const, medium: '500' as const, semibold: '600' as const, bold: '700' as const },
  },
  fontSize: { xs: 12, sm: 14, md: 16, lg: 18, xl: 20, xxl: 24, xxxl: 32 },
  components: {
    card: { padding: 16, borderRadius: 16, marginBottom: 24 },
    button: { paddingVertical: 12, paddingHorizontal: 16, borderRadius: 12 },
  },
};

export const GRADIENTS = {
  primary: LightTheme.gradient.primary as readonly [string, string],
  secondary: LightTheme.gradient.secondary as readonly [string, string],
  success: LightTheme.gradient.success as readonly [string, string],
  warning: LightTheme.gradient.warning as readonly [string, string],
  info: LightTheme.gradient.info as readonly [string, string],
};
