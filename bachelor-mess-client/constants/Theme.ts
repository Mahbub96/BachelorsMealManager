/**
 * Comprehensive Theme System for Bachelor Flat Manager
 *
 * This theme system covers all possible UI cases including:
 * - Light and Dark modes
 * - Different component states (active, disabled, error, success, warning)
 * - All UI elements (cards, buttons, inputs, text, icons, etc.)
 * - Accessibility considerations
 * - Brand colors and semantic colors
 */

export interface ThemeColors {
  // Base Colors
  primary: string;
  secondary: string;
  accent: string;

  // Background Colors
  background: string;
  surface: string;
  modal: string;

  // Text Colors
  text: {
    primary: string;
    secondary: string;
    tertiary: string;
    inverse: string;
    disabled: string;
  };

  // Icon Colors
  icon: {
    primary: string;
    secondary: string;
    disabled: string;
    inverse: string;
  };

  // Border Colors
  border: {
    primary: string;
    secondary: string;
    disabled: string;
    focus: string;
  };

  // Status Colors
  status: {
    success: string;
    error: string;
    warning: string;
    info: string;
    pending: string;
  };

  // Button Colors
  button: {
    primary: {
      background: string;
      text: string;
      border: string;
    };
    secondary: {
      background: string;
      text: string;
      border: string;
    };
    danger: {
      background: string;
      text: string;
      border: string;
    };
    disabled: {
      background: string;
      text: string;
      border: string;
    };
  };

  // Input Colors
  input: {
    background: string;
    border: string;
    text: string;
    placeholder: string;
    focus: {
      border: string;
      background: string;
    };
    disabled: {
      background: string;
      border: string;
      text: string;
    };
  };

  // Tab Colors
  tab: {
    active: string;
    inactive: string;
    background: string;
    border: string;
  };

  // Card Colors
  cardBackground: string;
  cardBorder: string;
  cardShadow: string;

  // Gradient Colors
  gradient: {
    primary: string[];
    secondary: string[];
    success: string[];
    warning: string[];
    error: string[];
    info: string[];
  };

  // Shadow Colors
  shadow: {
    light: string;
    medium: string;
    heavy: string;
  };

  // Overlay Colors
  overlay: {
    light: string;
    medium: string;
    heavy: string;
  };
}

export const LightTheme: ThemeColors = {
  // Base Colors
  primary: '#667eea',
  secondary: '#764ba2',
  accent: '#10b981',

  // Background Colors
  background: '#ffffff',
  surface: '#f8fafc',
  modal: '#ffffff',

  // Text Colors
  text: {
    primary: '#11181C',
    secondary: '#687076',
    tertiary: '#9BA1A6',
    inverse: '#ffffff',
    disabled: '#9ca3af',
  },

  // Icon Colors
  icon: {
    primary: '#687076',
    secondary: '#9BA1A6',
    disabled: '#9ca3af',
    inverse: '#ffffff',
  },

  // Border Colors
  border: {
    primary: '#e5e7eb',
    secondary: '#f3f4f6',
    disabled: '#f1f5f9',
    focus: '#667eea',
  },

  // Status Colors
  status: {
    success: '#10b981',
    error: '#ef4444',
    warning: '#f59e0b',
    info: '#3b82f6',
    pending: '#8b5cf6',
  },

  // Button Colors
  button: {
    primary: {
      background: '#667eea',
      text: '#ffffff',
      border: '#667eea',
    },
    secondary: {
      background: '#f8fafc',
      text: '#11181C',
      border: '#e5e7eb',
    },
    danger: {
      background: '#ef4444',
      text: '#ffffff',
      border: '#ef4444',
    },
    disabled: {
      background: '#f1f5f9',
      text: '#9ca3af',
      border: '#e5e7eb',
    },
  },

  // Input Colors
  input: {
    background: '#ffffff',
    border: '#e5e7eb',
    text: '#11181C',
    placeholder: '#9ca3af',
    focus: {
      border: '#667eea',
      background: '#ffffff',
    },
    disabled: {
      background: '#f8fafc',
      border: '#e5e7eb',
      text: '#9ca3af',
    },
  },

  // Tab Colors
  tab: {
    active: '#667eea',
    inactive: '#9ca3af',
    background: '#ffffff',
    border: '#f3f4f6',
  },

  // Card Colors
  cardBackground: '#ffffff',
  cardBorder: '#e5e7eb',
  cardShadow: '#000000',

  // Gradient Colors
  gradient: {
    primary: ['#667eea', '#764ba2'],
    secondary: ['#f59e0b', '#d97706'],
    success: ['#10b981', '#059669'],
    warning: ['#f59e0b', '#d97706'],
    error: ['#ef4444', '#dc2626'],
    info: ['#3b82f6', '#1d4ed8'],
  },

  // Shadow Colors
  shadow: {
    light: '#000000',
    medium: '#000000',
    heavy: '#000000',
  },

  // Overlay Colors
  overlay: {
    light: 'rgba(0, 0, 0, 0.1)',
    medium: 'rgba(0, 0, 0, 0.3)',
    heavy: 'rgba(0, 0, 0, 0.7)',
  },
};

export const DarkTheme: ThemeColors = {
  // Base Colors
  primary: '#667eea',
  secondary: '#764ba2',
  accent: '#10b981',

  // Background Colors
  background: '#151718',
  surface: '#1f2937',
  modal: '#1f2937',

  // Text Colors
  text: {
    primary: '#ECEDEE',
    secondary: '#9BA1A6',
    tertiary: '#687076',
    inverse: '#151718',
    disabled: '#6b7280',
  },

  // Icon Colors
  icon: {
    primary: '#9BA1A6',
    secondary: '#687076',
    disabled: '#6b7280',
    inverse: '#151718',
  },

  // Border Colors
  border: {
    primary: '#374151',
    secondary: '#4b5563',
    disabled: '#374151',
    focus: '#667eea',
  },

  // Status Colors
  status: {
    success: '#10b981',
    error: '#ef4444',
    warning: '#f59e0b',
    info: '#3b82f6',
    pending: '#8b5cf6',
  },

  // Button Colors
  button: {
    primary: {
      background: '#667eea',
      text: '#ffffff',
      border: '#667eea',
    },
    secondary: {
      background: '#374151',
      text: '#ECEDEE',
      border: '#4b5563',
    },
    danger: {
      background: '#ef4444',
      text: '#ffffff',
      border: '#ef4444',
    },
    disabled: {
      background: '#374151',
      text: '#6b7280',
      border: '#4b5563',
    },
  },

  // Input Colors
  input: {
    background: '#1f2937',
    border: '#374151',
    text: '#ECEDEE',
    placeholder: '#6b7280',
    focus: {
      border: '#667eea',
      background: '#1f2937',
    },
    disabled: {
      background: '#374151',
      border: '#4b5563',
      text: '#6b7280',
    },
  },

  // Tab Colors
  tab: {
    active: '#667eea',
    inactive: '#9ca3af',
    background: '#151718',
    border: '#374151',
  },

  // Card Colors
  cardBackground: '#1f2937',
  cardBorder: '#374151',
  cardShadow: '#000000',

  // Gradient Colors
  gradient: {
    primary: ['#667eea', '#764ba2'],
    secondary: ['#f59e0b', '#d97706'],
    success: ['#10b981', '#059669'],
    warning: ['#f59e0b', '#d97706'],
    error: ['#ef4444', '#dc2626'],
    info: ['#3b82f6', '#1d4ed8'],
  },

  // Shadow Colors
  shadow: {
    light: '#000000',
    medium: '#000000',
    heavy: '#000000',
  },

  // Overlay Colors
  overlay: {
    light: 'rgba(255, 255, 255, 0.1)',
    medium: 'rgba(255, 255, 255, 0.3)',
    heavy: 'rgba(255, 255, 255, 0.7)',
  },
};

// Theme selector function
export const getTheme = (isDark: boolean): ThemeColors => {
  return isDark ? DarkTheme : LightTheme;
};

// Utility functions for common theme operations
export const getThemeColor = (theme: ThemeColors, path: string): string => {
  const keys = path.split('.');
  let value: any = theme;

  for (const key of keys) {
    if (value && typeof value === 'object' && key in value) {
      value = value[key];
    } else {
      console.warn(`Theme path "${path}" not found`);
      return '#000000'; // fallback
    }
  }

  return typeof value === 'string' ? value : '#000000';
};

// Common theme patterns
export const ThemePatterns = {
  // Card patterns
  card: {
    light: {
      background: 'cardBackground',
      border: 'border.primary',
      shadow: 'shadow.light',
    },
    dark: {
      background: 'cardBackground',
      border: 'border.primary',
      shadow: 'shadow.light',
    },
  },

  // Button patterns
  button: {
    primary: 'button.primary',
    secondary: 'button.secondary',
    danger: 'button.danger',
    disabled: 'button.disabled',
  },

  // Input patterns
  input: {
    default: 'input',
    focus: 'input.focus',
    disabled: 'input.disabled',
  },

  // Text patterns
  text: {
    primary: 'text.primary',
    secondary: 'text.secondary',
    tertiary: 'text.tertiary',
    inverse: 'text.inverse',
    disabled: 'text.disabled',
  },

  // Status patterns
  status: {
    success: 'status.success',
    error: 'status.error',
    warning: 'status.warning',
    info: 'status.info',
    pending: 'status.pending',
  },
};

// Export theme types for use in components
export type ThemeMode = 'light' | 'dark';
export type ThemeContextType = {
  theme: ThemeColors;
  isDark: boolean;
  toggleTheme: () => void;
  setTheme: (mode: ThemeMode) => void;
};
