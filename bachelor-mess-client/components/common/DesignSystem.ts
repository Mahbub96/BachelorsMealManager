// Design System for Bachelor Flat Manager
// This file contains all design tokens and utilities for consistent styling

export const COLORS = {
  // Primary Colors
  primary: {
    50: '#eff6ff',
    100: '#dbeafe',
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#3b82f6',
    600: '#2563eb',
    700: '#1d4ed8',
    800: '#1e40af',
    900: '#1e3a8a',
  },

  // Secondary Colors
  secondary: {
    50: '#fdf4ff',
    100: '#fae8ff',
    200: '#f5d0fe',
    300: '#f0abfc',
    400: '#e879f9',
    500: '#d946ef',
    600: '#c026d3',
    700: '#a21caf',
    800: '#86198f',
    900: '#701a75',
  },

  // Success Colors
  success: {
    50: '#f0fdf4',
    100: '#dcfce7',
    200: '#bbf7d0',
    300: '#86efac',
    400: '#4ade80',
    500: '#22c55e',
    600: '#16a34a',
    700: '#15803d',
    800: '#166534',
    900: '#14532d',
  },

  // Warning Colors
  warning: {
    50: '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#f59e0b',
    600: '#d97706',
    700: '#b45309',
    800: '#92400e',
    900: '#78350f',
  },

  // Error Colors
  error: {
    50: '#fef2f2',
    100: '#fee2e2',
    200: '#fecaca',
    300: '#fca5a5',
    400: '#f87171',
    500: '#ef4444',
    600: '#dc2626',
    700: '#b91c1c',
    800: '#991b1b',
    900: '#7f1d1d',
  },

  // Neutral Colors
  neutral: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
  },

  // Gradients
  gradients: {
    primary: ['#667eea', '#764ba2'],
    secondary: ['#f093fb', '#f5576c'],
    success: ['#4facfe', '#00f2fe'],
    warning: ['#fa709a', '#fee140'],
    error: ['#ff9a9e', '#fecfef'],
  },
} as const;

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  xxxxl: 48,
} as const;

export const BORDER_RADIUS = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  xxl: 20,
  xxxl: 24,
  full: 9999,
} as const;

export const TYPOGRAPHY = {
  sizes: {
    xs: 10,
    sm: 12,
    md: 14,
    lg: 16,
    xl: 18,
    xxl: 20,
    xxxl: 24,
    xxxxl: 32,
  },
  weights: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
  lineHeights: {
    tight: 1.2,
    normal: 1.4,
    relaxed: 1.6,
  },
} as const;

export const SHADOWS = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
} as const;

export const ANIMATIONS = {
  duration: {
    fast: 150,
    normal: 300,
    slow: 500,
  },
  easing: {
    ease: 'ease',
    easeIn: 'ease-in',
    easeOut: 'ease-out',
    easeInOut: 'ease-in-out',
  },
} as const;

// Utility functions for common styling patterns
export const createStyles = {
  // Card styles
  card: (variant: 'default' | 'elevated' | 'outlined' = 'default') => ({
    backgroundColor: '#fff',
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    ...(variant === 'elevated' && SHADOWS.md),
    ...(variant === 'outlined' && {
      borderWidth: 1,
      borderColor: COLORS.neutral[200],
    }),
  }),

  // Button styles
  button: (
    variant: 'primary' | 'secondary' | 'outline' | 'ghost' = 'primary'
  ) => ({
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    ...(variant === 'primary' && {
      backgroundColor: COLORS.primary[600],
    }),
    ...(variant === 'secondary' && {
      backgroundColor: COLORS.secondary[600],
    }),
    ...(variant === 'outline' && {
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: COLORS.primary[600],
    }),
    ...(variant === 'ghost' && {
      backgroundColor: 'transparent',
    }),
  }),

  // Input styles
  input: (hasError = false) => ({
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: hasError ? COLORS.error[500] : COLORS.neutral[300],
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.neutral[800],
  }),

  // Text styles
  text: (variant: 'heading' | 'body' | 'caption' | 'label' = 'body') => ({
    ...(variant === 'heading' && {
      fontSize: TYPOGRAPHY.sizes.xl,
      fontWeight: TYPOGRAPHY.weights.bold,
      color: COLORS.neutral[900],
    }),
    ...(variant === 'body' && {
      fontSize: TYPOGRAPHY.sizes.md,
      fontWeight: TYPOGRAPHY.weights.normal,
      color: COLORS.neutral[700],
    }),
    ...(variant === 'caption' && {
      fontSize: TYPOGRAPHY.sizes.sm,
      fontWeight: TYPOGRAPHY.weights.normal,
      color: COLORS.neutral[500],
    }),
    ...(variant === 'label' && {
      fontSize: TYPOGRAPHY.sizes.sm,
      fontWeight: TYPOGRAPHY.weights.medium,
      color: COLORS.neutral[600],
    }),
  }),
} as const;

// Status colors mapping
export const STATUS_COLORS = {
  pending: COLORS.warning[500],
  approved: COLORS.success[500],
  rejected: COLORS.error[500],
  active: COLORS.success[500],
  inactive: COLORS.neutral[500],
} as const;

// Role colors mapping
export const ROLE_COLORS = {
  super_admin: COLORS.error[600],
  admin: COLORS.warning[600],
  member: COLORS.primary[600],
} as const;

// Meal type colors
export const MEAL_COLORS = {
  breakfast: COLORS.warning[500],
  lunch: COLORS.success[500],
  dinner: COLORS.primary[500],
} as const;

// Export all design tokens
export const DESIGN_SYSTEM = {
  colors: COLORS,
  spacing: SPACING,
  borderRadius: BORDER_RADIUS,
  typography: TYPOGRAPHY,
  shadows: SHADOWS,
  animations: ANIMATIONS,
  createStyles,
  statusColors: STATUS_COLORS,
  roleColors: ROLE_COLORS,
  mealColors: MEAL_COLORS,
} as const;
