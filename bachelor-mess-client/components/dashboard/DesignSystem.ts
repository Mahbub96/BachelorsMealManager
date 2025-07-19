// Unified Design System for Dashboard Components
export const DESIGN_SYSTEM = {
  // Colors
  colors: {
    primary: "#667eea",
    primaryDark: "#5a67d8",
    secondary: "#f093fb",
    secondaryDark: "#e91e63",
    success: "#10b981",
    successDark: "#059669",
    warning: "#f59e0b",
    warningDark: "#d97706",
    error: "#ef4444",
    errorDark: "#dc2626",
    info: "#3b82f6",
    infoDark: "#2563eb",

    // Neutral colors
    gray: {
      50: "#f9fafb",
      100: "#f3f4f6",
      200: "#e5e7eb",
      300: "#d1d5db",
      400: "#9ca3af",
      500: "#6b7280",
      600: "#4b5563",
      700: "#374151",
      800: "#1f2937",
      900: "#111827",
    },

    // Background colors
    background: {
      primary: "#f8fafc",
      secondary: "#ffffff",
      card: "#ffffff",
    },

    // Text colors
    text: {
      primary: "#1f2937",
      secondary: "#6b7280",
      tertiary: "#9ca3af",
      inverse: "#ffffff",
    },
  },

  // Spacing
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    xxxl: 32,
  },

  // Border radius
  borderRadius: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    full: 9999,
  },

  // Shadows
  shadows: {
    sm: {
      boxShadow: "0px 1px 2px rgba(0, 0, 0, 0.05)",
      elevation: 2,
    },
    md: {
      boxShadow: "0px 2px 8px rgba(0, 0, 0, 0.1)",
      elevation: 4,
    },
    lg: {
      boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.15)",
      elevation: 8,
    },
  },

  // Typography
  typography: {
    sizes: {
      xs: 12,
      sm: 14,
      base: 16,
      lg: 18,
      xl: 20,
      xxl: 24,
      xxxl: 32,
    },
    weights: {
      normal: "400" as const,
      medium: "500" as const,
      semibold: "600" as const,
      bold: "700" as const,
    },
  },

  // Component specific
  components: {
    card: {
      padding: 16,
      borderRadius: 16,
      marginBottom: 24,
    },
    button: {
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 12,
    },
  },
};

// Gradient presets
export const GRADIENTS = {
  primary: ["#667eea", "#764ba2"] as const,
  secondary: ["#f093fb", "#f5576c"] as const,
  success: ["#43e97b", "#38f9d7"] as const,
  warning: ["#fa709a", "#fee140"] as const,
  info: ["#4facfe", "#00f2fe"] as const,
  purple: ["#8b5cf6", "#a855f7"] as const,
  orange: ["#f97316", "#ea580c"] as const,
  teal: ["#14b8a6", "#0d9488"] as const,
};
