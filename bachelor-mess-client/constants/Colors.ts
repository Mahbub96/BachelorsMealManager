/**
 * Legacy color map – derived from Theme.ts (single source of truth).
 * Prefer useTheme() / useThemeColor() in components.
 */

import { LightTheme, DarkTheme } from './Theme';

export const Colors = {
  light: {
    text: LightTheme.text.primary,
    background: LightTheme.background,
    tint: LightTheme.primary,
    icon: LightTheme.icon.primary,
    tabIconDefault: LightTheme.icon.primary,
    tabIconSelected: LightTheme.primary,
  },
  dark: {
    text: DarkTheme.text.primary,
    background: DarkTheme.background,
    tint: DarkTheme.text.inverse,
    icon: DarkTheme.icon.primary,
    tabIconDefault: DarkTheme.icon.primary,
    tabIconSelected: DarkTheme.text.inverse,
  },
};
