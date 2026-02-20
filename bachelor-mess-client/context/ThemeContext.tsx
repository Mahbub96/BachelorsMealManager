import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Appearance } from 'react-native';
import {
  ThemeColors,
  LightTheme,
  DarkTheme,
  getTheme,
  ThemeMode,
  ThemeContextType,
} from '@/constants/Theme';
import logger from '@/utils/logger';

// Create the theme context
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Stable fallback theme object to prevent re-renders
const FALLBACK_THEME: ThemeContextType = {
  theme: LightTheme,
  isDark: false,
  toggleTheme: () => {},
  setTheme: () => {},
};

// Theme provider component
export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  // Initialize state based on Appearance API (more stable than useColorScheme hook)
  const [isDark, setIsDark] = useState(() => {
    try {
      return Appearance.getColorScheme() === 'dark';
    } catch {
      return false;
    }
  });
  
  // Listen to appearance changes (but only after initial mount to prevent loops)
  const isInitialMount = useRef(true);
  
  useEffect(() => {
    // Skip on initial mount
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    
    // Only listen to changes after initial mount
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      if (colorScheme === 'dark') {
        setIsDark(true);
      } else {
        setIsDark(false);
      }
    });
    
    return () => subscription.remove();
  }, []); // Empty deps - only set up listener once

  // Get the current theme - memoized to prevent unnecessary re-renders
  const theme = useMemo(() => {
    try {
      return getTheme(isDark);
    } catch (error) {
      logger.error('Error getting theme', error);
      return LightTheme;
    }
  }, [isDark]);

  // Toggle between light and dark themes
  const toggleTheme = useCallback(() => {
    setIsDark(prev => !prev);
  }, []);

  // Set specific theme mode
  const setTheme = useCallback((mode: ThemeMode) => {
    setIsDark(mode === 'dark');
  }, []);

  // Memoize the context value to prevent unnecessary re-renders
  // Only recreate if theme, isDark, or functions actually change
  const value: ThemeContextType = useMemo(
    () => {
      if (!theme) {
        logger.error('Theme undefined, using LightTheme fallback');
        return {
          theme: LightTheme,
          isDark: false,
          toggleTheme,
          setTheme,
        };
      }
      return {
        theme,
        isDark,
        toggleTheme,
        setTheme,
      };
    },
    [theme, isDark, toggleTheme, setTheme]
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};

// Custom hook to use theme
export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  // Don't throw error - return stable fallback instead to prevent render loops
  if (context === undefined) {
    logger.warn('useTheme called outside ThemeProvider');
    return FALLBACK_THEME;
  }
  if (!context.theme) {
    logger.warn('Theme undefined in context');
    return {
      ...context,
      theme: LightTheme,
      isDark: false,
    };
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
