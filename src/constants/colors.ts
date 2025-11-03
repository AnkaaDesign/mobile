// Color palette for React Native based on the design system
// FULLY SYNCED with web/src/index.css CSS variables
// Updated to match web's neutral-based color palette exactly

export const Colors = {
  light: {
    // Background colors - matching web neutral palette
    background: "#e5e5e5", // neutral-200 (HSL: 0 0% 91%) - web --background
    foreground: "#404040", // neutral-700 (HSL: 0 0% 25%) - web --foreground

    // Card colors - matching web
    card: "#fafafa", // neutral-50 (HSL: 0 0% 98%) - web --card
    cardForeground: "#404040", // neutral-700 - web --card-foreground
    cardNested: "#f5f5f5", // neutral-100 (HSL: 0 0% 96%) - web --card-nested

    // Popover colors - matching web
    popover: "#fafafa", // neutral-50 - web --popover
    popoverForeground: "#404040", // neutral-700 - web --popover-foreground

    // Primary colors - matching web green-700
    primary: "#15803d", // green-700 (HSL: 142 72% 29%) - web --primary
    primaryForeground: "#fafafa", // neutral-50 - web --primary-foreground

    // Secondary colors - matching web
    secondary: "#e5e5e5", // neutral-150 (HSL: 0 0% 91%) - web --secondary
    secondaryForeground: "#525252", // neutral-600 (HSL: 0 0% 30%) - web --secondary-foreground

    // Muted colors - matching web
    muted: "#e5e5e5", // neutral-200 (HSL: 0 0% 89%) - web --muted
    mutedForeground: "#737373", // neutral-550 (HSL: 0 0% 45%) - web --muted-foreground

    // Accent colors - matching web green-700
    accent: "#15803d", // green-700 (HSL: 142 72% 29%) - web --accent
    accentForeground: "#fafafa", // neutral-50 - web --accent-foreground

    // Destructive colors - matching web
    destructive: "#ef4444", // red-500 - web --destructive (HSL: 0 50% 50%)
    destructiveForeground: "#fafafa", // neutral-50 - web --destructive-foreground

    // Border colors - matching web
    border: "#c5c5c5", // neutral-300 (HSL: 0 0% 77%) - web --border (one tone darker)

    // Input colors - matching web
    input: "#ffffff", // white - web --input

    // Ring colors (focus states) - matching web
    ring: "#15803d", // green-700 - web --ring

    // Navigation/Sidebar colors - matching web sidebar variables
    sidebar: {
      background: "#fafafa", // neutral-50 (HSL: 0 0% 98%) - web --sidebar-background
      foreground: "#525252", // neutral-600 (HSL: 0 0% 30%) - web --sidebar-foreground
      primary: "#737373", // green with reduced saturation (HSL: 142 30% 45%) - web --sidebar-primary
      primaryForeground: "#fafafa", // neutral-50 - web --sidebar-primary-foreground
      accent: "#f5f5f5", // neutral-100 (HSL: 0 0% 95%) - web --sidebar-accent
      accentForeground: "#525252", // neutral-600 - web --sidebar-accent-foreground
      border: "#e5e5e5", // neutral-150 (HSL: 0 0% 91%) - web --sidebar-border
      ring: "#737373", // green (HSL: 142 30% 50%) - web --sidebar-ring
    },

    // Chart colors
    chart1: "#E34C26",
    chart2: "#16a34a", // green-600 for consistency
    chart3: "#00B5D8",
    chart4: "#A855F7",
    chart5: "#F59E0B",
  },
  dark: {
    // Background colors - matching web neutral palette
    background: "#171717", // neutral-875 (HSL: 0 0% 11%) - web --background
    foreground: "#d4d4d4", // neutral-250 (HSL: 0 0% 85%) - web --foreground

    // Card colors - matching web
    card: "#262626", // neutral-825 (HSL: 0 0% 15%) - web --card
    cardForeground: "#d4d4d4", // neutral-250 - web --card-foreground
    cardNested: "#2e2e2e", // neutral-800 (HSL: 0 0% 18%) - web --card-nested

    // Popover colors - matching web
    popover: "#262626", // neutral-825 - web --popover
    popoverForeground: "#d4d4d4", // neutral-250 - web --popover-foreground

    // Primary colors - matching web green-700
    primary: "#15803d", // green-700 (HSL: 142 72% 29%) - web --primary
    primaryForeground: "#fafafa", // neutral-50 - web --primary-foreground

    // Secondary colors - matching web
    secondary: "#333333", // neutral-800 (HSL: 0 0% 20%) - web --secondary
    secondaryForeground: "#cccccc", // neutral-300 (HSL: 0 0% 80%) - web --secondary-foreground

    // Muted colors - matching web
    muted: "#3a3a3a", // neutral-750 (HSL: 0 0% 23%) - web --muted
    mutedForeground: "#8c8c8c", // neutral-450 (HSL: 0 0% 55%) - web --muted-foreground

    // Accent colors - matching web green-700
    accent: "#15803d", // green-700 (HSL: 142 72% 29%) - web --accent
    accentForeground: "#fafafa", // neutral-50 - web --accent-foreground

    // Destructive colors - matching web
    destructive: "#b91c1c", // red-700 - web --destructive (HSL: 0 40% 45%)
    destructiveForeground: "#fafafa", // neutral-50 - web --destructive-foreground

    // Border colors - matching web
    border: "#454545", // neutral-725 (HSL: 0 0% 27%) - web --border

    // Input colors - matching web
    input: "#212121", // slightly darker than card - web --input

    // Ring colors (focus states) - matching web
    ring: "#15803d", // green-700 - web --ring

    // Navigation/Sidebar colors - matching web sidebar variables
    sidebar: {
      background: "#212121", // neutral-850 (HSL: 0 0% 13%) - web --sidebar-background
      foreground: "#cccccc", // neutral-300 (HSL: 0 0% 80%) - web --sidebar-foreground
      primary: "#5a7c5a", // green with reduced saturation (HSL: 142 25% 40%) - web --sidebar-primary
      primaryForeground: "#fafafa", // neutral-50 - web --sidebar-primary-foreground
      accent: "#2e2e2e", // neutral-800 (HSL: 0 0% 18%) - web --sidebar-accent
      accentForeground: "#cccccc", // neutral-300 - web --sidebar-accent-foreground
      border: "#333333", // neutral-800 (HSL: 0 0% 20%) - web --sidebar-border
      ring: "#669966", // green (HSL: 142 25% 45%) - web --sidebar-ring
    },

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

// Semantic color mappings for common use cases - matching web
export const SemanticColors = {
  light: {
    text: Colors.light.foreground, // neutral-700
    textSecondary: Colors.light.mutedForeground, // neutral-550
    textInverse: Colors.light.background, // neutral-200

    surface: Colors.light.card, // neutral-50
    surfaceVariant: Colors.light.muted, // neutral-200

    error: Colors.light.destructive, // red-500
    errorText: Colors.light.destructiveForeground, // neutral-50

    success: "#15803d", // green-700 to match web --success
    successText: "#FFFFFF",

    warning: "#d97706", // amber-600 (HSL: 45 40% 50%) - web --warning
    warningText: "#FFFFFF",

    info: "#3b82f6", // blue-500 (HSL: 210 30% 50%) - web --info
    infoText: "#FFFFFF",

    divider: Colors.light.border, // neutral-250
    overlay: "rgba(0, 0, 0, 0.5)",
  },
  dark: {
    text: Colors.dark.foreground, // neutral-250
    textSecondary: Colors.dark.mutedForeground, // neutral-450
    textInverse: Colors.dark.background, // neutral-875

    surface: Colors.dark.card, // neutral-825
    surfaceVariant: Colors.dark.muted, // neutral-750

    error: Colors.dark.destructive, // red-700
    errorText: Colors.dark.destructiveForeground, // neutral-50

    success: "#15803d", // green-700 to match web --success
    successText: "#FFFFFF",

    warning: "#b45309", // amber-700 (HSL: 45 30% 45%) - web --warning
    warningText: "#FFFFFF",

    info: "#2563eb", // blue-600 (HSL: 210 25% 45%) - web --info
    infoText: "#FFFFFF",

    divider: Colors.dark.border, // neutral-725
    overlay: "rgba(0, 0, 0, 0.7)",
  },
} as const;

// Status colors for different states - matching web semantic colors
export const StatusColors = {
  light: {
    active: "#15803d", // green-700 to match web primary/success
    inactive: "#737373", // neutral-500
    pending: "#d97706", // amber-600 to match web warning
    inProgress: "#3b82f6", // blue-500 to match web info
    completed: "#15803d", // green-700 to match web success
    cancelled: "#ef4444", // red-500 to match web error
    onHold: "#8b5cf6", // purple-500
  },
  dark: {
    active: "#15803d", // green-700 to match web primary/success
    inactive: "#525252", // neutral-600
    pending: "#b45309", // amber-700 to match web warning
    inProgress: "#2563eb", // blue-600 to match web info
    completed: "#15803d", // green-700 to match web success
    cancelled: "#b91c1c", // red-700 to match web error
    onHold: "#7c3aed", // purple-600
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
