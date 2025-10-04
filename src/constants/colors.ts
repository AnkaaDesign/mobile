// Color palette for React Native based on the design system
// Follows the same color scheme as the web app for consistency

export const Colors = {
  light: {
    // Background colors
    background: "#FFFFFF",
    foreground: "#0A0A0B",

    // Card colors
    card: "#FFFFFF",
    cardForeground: "#0A0A0B",

    // Popover colors
    popover: "#FFFFFF",
    popoverForeground: "#0A0A0B",

    // Primary colors
    primary: "#18181B",
    primaryForeground: "#FAFAFA",

    // Secondary colors
    secondary: "#F4F4F5",
    secondaryForeground: "#18181B",

    // Muted colors
    muted: "#F4F4F5",
    mutedForeground: "#71717A",

    // Accent colors
    accent: "#16a34a", // green-600 to match web
    accentForeground: "#FFFFFF",

    // Destructive colors
    destructive: "#EF4444",
    destructiveForeground: "#FAFAFA",

    // Border colors
    border: "#E4E4E7",

    // Input colors
    input: "#E4E4E7",

    // Ring colors (focus states)
    ring: "#16a34a", // green-600 to match web

    // Chart colors
    chart1: "#E34C26",
    chart2: "#16a34a", // green-600 for consistency
    chart3: "#00B5D8",
    chart4: "#A855F7",
    chart5: "#F59E0B",
  },
  dark: {
    // Background colors
    background: "#0A0A0B",
    foreground: "#FAFAFA",

    // Card colors
    card: "#0A0A0B",
    cardForeground: "#FAFAFA",

    // Popover colors
    popover: "#0A0A0B",
    popoverForeground: "#FAFAFA",

    // Primary colors
    primary: "#FAFAFA",
    primaryForeground: "#18181B",

    // Secondary colors
    secondary: "#27272A",
    secondaryForeground: "#FAFAFA",

    // Muted colors
    muted: "#27272A",
    mutedForeground: "#A1A1AA",

    // Accent colors
    accent: "#16a34a", // green-600 to match web
    accentForeground: "#FFFFFF",

    // Destructive colors
    destructive: "#991B1B",
    destructiveForeground: "#FAFAFA",

    // Border colors
    border: "#27272A",

    // Input colors
    input: "#27272A",

    // Ring colors (focus states)
    ring: "#16a34a", // green-600 to match web

    // Chart colors
    chart1: "#2563EB",
    chart2: "#16a34a", // green-600 for consistency
    chart3: "#F59E0B",
    chart4: "#A855F7",
    chart5: "#EC4899",
  },
} as const;

// Type definitions for type safety
export type ColorScheme = keyof typeof Colors;
export type ThemeColors = typeof Colors.light | typeof Colors.dark;
export type ColorName = keyof ThemeColors;

// Helper function to get colors based on theme
export const getColors = (scheme: ColorScheme): ThemeColors => {
  return Colors[scheme];
};

// Semantic color mappings for common use cases
export const SemanticColors = {
  light: {
    text: Colors.light.foreground,
    textSecondary: Colors.light.mutedForeground,
    textInverse: Colors.light.background,

    surface: Colors.light.card,
    surfaceVariant: Colors.light.muted,

    error: Colors.light.destructive,
    errorText: Colors.light.destructiveForeground,

    success: "#16a34a", // green-600 to match web
    successText: "#FFFFFF",

    warning: "#F59E0B",
    warningText: "#FFFFFF",

    info: "#3B82F6",
    infoText: "#FFFFFF",

    divider: Colors.light.border,
    overlay: "rgba(0, 0, 0, 0.5)",
  },
  dark: {
    text: Colors.dark.foreground,
    textSecondary: Colors.dark.mutedForeground,
    textInverse: Colors.dark.background,

    surface: Colors.dark.card,
    surfaceVariant: Colors.dark.muted,

    error: Colors.dark.destructive,
    errorText: Colors.dark.destructiveForeground,

    success: "#16A34A",
    successText: "#FFFFFF",

    warning: "#D97706",
    warningText: "#FFFFFF",

    info: "#2563EB",
    infoText: "#FFFFFF",

    divider: Colors.dark.border,
    overlay: "rgba(0, 0, 0, 0.7)",
  },
} as const;

// Status colors for different states
export const StatusColors = {
  light: {
    active: "#16a34a", // green-600 to match web
    inactive: "#6B7280",
    pending: "#F59E0B",
    inProgress: "#3B82F6",
    completed: "#16a34a", // green-600 to match web
    cancelled: "#EF4444",
    onHold: "#8B5CF6",
  },
  dark: {
    active: "#16A34A",
    inactive: "#4B5563",
    pending: "#D97706",
    inProgress: "#2563EB",
    completed: "#16A34A",
    cancelled: "#DC2626",
    onHold: "#7C3AED",
  },
} as const;

// Shadow colors for elevation
export const ShadowColors = {
  light: {
    shadowColor: "#000000",
    shadowOpacity: 0.1,
  },
  dark: {
    shadowColor: "#000000",
    shadowOpacity: 0.3,
  },
} as const;
