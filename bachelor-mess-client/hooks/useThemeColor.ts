/**
 * Learn more about light and dark modes:
 * https://docs.expo.dev/guides/color-schemes/
 *
 * Uses ThemeContext so in-app theme toggle (light/dark) updates all components.
 */

import { useTheme } from '@/context/ThemeContext';
import { Colors } from '../constants/Colors';
import { getThemeColor } from '../constants/Theme';

// Map shorthand names to theme paths (theme has nested objects)
const THEME_PATH_MAP: Record<string, string> = {
  text: 'text.primary',
  icon: 'icon.primary',
  background: 'background',
  border: 'border.primary',
};

/**
 * Enhanced useThemeColor hook that works with the comprehensive theme system.
 * Uses ThemeContext so it reacts to in-app theme toggle (not just system preference).
 *
 * @param props - Style props (for backward compatibility)
 * @param colorName - Color name from the theme system (e.g. 'text', 'text.primary', 'background')
 * @returns The appropriate color for the current theme
 */
export function useThemeColor(
  props: { light?: string; dark?: string },
  colorName: string
): string {
  const { theme, isDark } = useTheme();

  const path = THEME_PATH_MAP[colorName] ?? colorName;
  try {
    const themeColor = getThemeColor(theme, path);
    if (themeColor) return themeColor;
  } catch {
    // Fall back to props or Colors
  }

  const colorFromProps = isDark ? props.dark : props.light;
  if (colorFromProps) return colorFromProps;

  const colorScheme = isDark ? 'dark' : 'light';
  const colorSchemeColors = Colors[colorScheme as keyof typeof Colors];
  return colorSchemeColors?.[colorName as keyof typeof colorSchemeColors] ?? theme.text.primary;
}

/**
 * Hook to get the current theme object. Uses ThemeContext so it reacts to in-app theme toggle.
 */
export function useCurrentTheme() {
  const { theme } = useTheme();
  return theme;
}

/**
 * Hook to get multiple theme colors at once
 * @param colorNames - Array of color names to get
 * @returns Object with color names as keys and colors as values
 */
export function useThemeColors(colorNames: string[]): Record<string, string> {
  const theme = useCurrentTheme();
  const colors: Record<string, string> = {};

  colorNames.forEach(name => {
    const path = THEME_PATH_MAP[name] ?? name;
    try {
      const value = getThemeColor(theme, path);
      colors[name] = typeof value === 'string' ? value : theme.text.primary;
    } catch {
      colors[name] = theme.text.primary;
    }
  });

  return colors;
}

/**
 * Hook to get theme-aware styles for common components
 * @returns Object with common component styles
 */
export function useThemeStyles() {
  const theme = useCurrentTheme();

  return {
    // Card styles
    card: {
      backgroundColor: theme.cardBackground,
      borderColor: theme.cardBorder,
      shadowColor: theme.cardShadow,
    },

    // Input styles
    input: {
      backgroundColor: theme.input.background,
      borderColor: theme.input.border,
      color: theme.input.text,
    },

    // Text styles
    textPrimary: { color: theme.text.primary },
    textSecondary: { color: theme.text.secondary },
    textTertiary: { color: theme.text.tertiary },
    textInverse: { color: theme.text.inverse },
    textDisabled: { color: theme.text.disabled },

    // Icon styles
    iconPrimary: { color: theme.icon.primary },
    iconSecondary: { color: theme.icon.secondary },
    iconDisabled: { color: theme.icon.disabled },
    iconInverse: { color: theme.icon.inverse },

    // Button styles
    buttonPrimary: {
      backgroundColor: theme.button.primary.background,
      borderColor: theme.button.primary.border,
    },
    buttonSecondary: {
      backgroundColor: theme.button.secondary.background,
      borderColor: theme.button.secondary.border,
    },
    buttonDanger: {
      backgroundColor: theme.button.danger.background,
      borderColor: theme.button.danger.border,
    },
    buttonDisabled: {
      backgroundColor: theme.button.disabled.background,
      borderColor: theme.button.disabled.border,
    },

    // Status styles
    statusSuccess: { color: theme.status.success },
    statusError: { color: theme.status.error },
    statusWarning: { color: theme.status.warning },
    statusInfo: { color: theme.status.info },
    statusPending: { color: theme.status.pending },
  };
}
