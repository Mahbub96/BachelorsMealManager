/**
 * Learn more about light and dark modes:
 * https://docs.expo.dev/guides/color-schemes/
 */

import { useColorScheme } from '../hooks/useColorScheme';
import { Colors } from '../constants/Colors';
import { getTheme, getThemeColor } from '../constants/Theme';

/**
 * Enhanced useThemeColor hook that works with the comprehensive theme system
 *
 * This hook provides backward compatibility with the old Colors system
 * while also supporting the new comprehensive theme system.
 *
 * @param props - Style props (for backward compatibility)
 * @param colorName - Color name from the theme system
 * @returns The appropriate color for the current theme
 */
export function useThemeColor(
  props: { light?: string; dark?: string },
  colorName: string
): string {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  // Get the current theme
  const theme = getTheme(isDark);

  // Try to get color from the comprehensive theme system first
  try {
    const themeColor = getThemeColor(theme, colorName);
    if (themeColor && themeColor !== '#000000') {
      return themeColor;
    }
  } catch (error) {
    // Fall back to old system if theme color not found
  }

  // Fallback to the old Colors system for backward compatibility
  const colorFromProps = isDark ? props.dark : props.light;

  if (colorFromProps) {
    return colorFromProps;
  }

  // Final fallback to Colors constant
  const colorSchemeColors = Colors[colorScheme as keyof typeof Colors];
  return (
    colorSchemeColors?.[colorName as keyof typeof colorSchemeColors] ||
    colorSchemeColors?.text ||
    '#000000'
  );
}

/**
 * Hook to get the current theme object
 * @returns The current theme object
 */
export function useCurrentTheme() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  return getTheme(isDark);
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
    try {
      colors[name] = getThemeColor(theme, name);
    } catch (error) {
      console.warn(`Theme color "${name}" not found`);
      colors[name] = '#000000'; // fallback
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
