import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from '@/hooks/useColorScheme';
import {
  ThemeColors,
  LightTheme,
  DarkTheme,
  getTheme,
  ThemeMode,
  ThemeContextType,
} from '@/constants/Theme';

// Create the theme context
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Theme provider component
export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const colorScheme = useColorScheme();
  const [isDark, setIsDark] = useState(colorScheme === 'dark');

  // Update theme when system color scheme changes
  useEffect(() => {
    setIsDark(colorScheme === 'dark');
  }, [colorScheme]);

  // Get the current theme
  const theme = getTheme(isDark);

  // Toggle between light and dark themes
  const toggleTheme = () => {
    setIsDark(!isDark);
  };

  // Set specific theme mode
  const setTheme = (mode: ThemeMode) => {
    setIsDark(mode === 'dark');
  };

  const value: ThemeContextType = {
    theme,
    isDark,
    toggleTheme,
    setTheme,
  };

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};

// Custom hook to use theme
export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// Utility hook for getting specific theme colors
export const useThemeColors = () => {
  const { theme } = useTheme();

  return {
    // Base colors
    primary: theme.primary,
    secondary: theme.secondary,
    accent: theme.accent,

    // Background colors
    background: theme.background,
    surface: theme.surface,
    modal: theme.modal,

    // Text colors
    textPrimary: theme.text.primary,
    textSecondary: theme.text.secondary,
    textTertiary: theme.text.tertiary,
    textInverse: theme.text.inverse,
    textDisabled: theme.text.disabled,

    // Icon colors
    iconPrimary: theme.icon.primary,
    iconSecondary: theme.icon.secondary,
    iconDisabled: theme.icon.disabled,
    iconInverse: theme.icon.inverse,

    // Border colors
    borderPrimary: theme.border.primary,
    borderSecondary: theme.border.secondary,
    borderDisabled: theme.border.disabled,
    borderFocus: theme.border.focus,

    // Status colors
    success: theme.status.success,
    error: theme.status.error,
    warning: theme.status.warning,
    info: theme.status.info,
    pending: theme.status.pending,

    // Button colors
    buttonPrimary: theme.button.primary,
    buttonSecondary: theme.button.secondary,
    buttonDanger: theme.button.danger,
    buttonDisabled: theme.button.disabled,

    // Input colors
    input: theme.input,

    // Tab colors
    tab: theme.tab,

    // Card colors
    cardBackground: theme.cardBackground,
    cardBorder: theme.cardBorder,
    cardShadow: theme.cardShadow,

    // Gradient colors
    gradients: theme.gradient,

    // Shadow colors
    shadows: theme.shadow,

    // Overlay colors
    overlays: theme.overlay,
  };
};

// Utility hook for getting theme-aware styles
export const useThemeStyles = () => {
  const { theme } = useTheme();

  return {
    // Card styles
    card: {
      backgroundColor: theme.cardBackground,
      borderColor: theme.cardBorder,
      shadowColor: theme.cardShadow,
    },

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

    // Input styles
    input: {
      backgroundColor: theme.input.background,
      borderColor: theme.input.border,
      color: theme.input.text,
    },
    inputFocus: {
      backgroundColor: theme.input.focus.background,
      borderColor: theme.input.focus.border,
    },
    inputDisabled: {
      backgroundColor: theme.input.disabled.background,
      borderColor: theme.input.disabled.border,
      color: theme.input.disabled.text,
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

    // Status styles
    statusSuccess: { color: theme.status.success },
    statusError: { color: theme.status.error },
    statusWarning: { color: theme.status.warning },
    statusInfo: { color: theme.status.info },
    statusPending: { color: theme.status.pending },
  };
};
