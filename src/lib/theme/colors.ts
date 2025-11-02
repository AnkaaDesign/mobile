import type { ThemeColors } from "../../types/theme";

export const themeColors: Record<"light" | "dark", ThemeColors> = {
  light: {
    background: "#e8e8e8", // HSL: 0 0% 91% - matching web background
    foreground: "#404040", // HSL: 0 0% 25% - matching web foreground
    card: "#fafafa", // HSL: 0 0% 98% - matching web card
    cardForeground: "#404040", // HSL: 0 0% 25% - matching web foreground
    popover: "#fafafa", // HSL: 0 0% 98% - matching web card
    popoverForeground: "#404040", // HSL: 0 0% 25% - matching web foreground
    primary: "#15803d", // HSL: 142 72% 29% - green-700 matching web
    primaryForeground: "#ffffff", // white - matching web
    secondary: "#e8e8e8", // HSL: 0 0% 91% - matching web secondary
    secondaryForeground: "#404040", // HSL: 0 0% 25% - matching web foreground
    muted: "#e3e3e3", // HSL: 0 0% 89% - matching web muted
    mutedForeground: "#737373", // neutral-500 - matching web
    accent: "#15803d", // HSL: 142 72% 29% - green-700 matching web primary
    accentForeground: "#ffffff", // white - matching web
    destructive: "#b91c1c", // red-700 - Tailwind red-700 for better visibility
    destructiveForeground: "#ffffff", // white - matching web
    border: "#e3e3e3", // HSL: 0 0% 89% - matching web border
    input: "#f5f5f5", // HSL: 0 0% 96% - slightly darker than white for better contrast
    ring: "#15803d", // HSL: 142 72% 29% - green-700 matching web
    // Additional semantic colors
    error: "#b91c1c", // alias for destructive
    onError: "#ffffff", // alias for destructiveForeground
    onPrimary: "#ffffff", // alias for primaryForeground
    text: "#404040", // alias for foreground
    textSecondary: "#737373", // alias for mutedForeground
    primaryContainer: "#dcfce7", // light green container - green-100
    surface: "#fafafa", // alias for card
    surfaceVariant: "#f5f5f5", // slightly darker surface for alternating rows
    warning: "#f59e0b", // amber-500 - warning color
    success: "#16a34a", // green-600 - success color
  },
  dark: {
    background: "#1c1c1c", // HSL: 0 0% 11% - matching web dark background
    foreground: "#d9d9d9", // HSL: 0 0% 85% - matching web dark foreground
    card: "#262626", // HSL: 0 0% 15% - matching web dark card
    cardForeground: "#d9d9d9", // HSL: 0 0% 85% - matching web dark foreground
    popover: "#262626", // HSL: 0 0% 15% - matching web dark card
    popoverForeground: "#d9d9d9", // HSL: 0 0% 85% - matching web dark foreground
    primary: "#15803d", // HSL: 142 72% 29% - green-700 matching web
    primaryForeground: "#ffffff", // white - matching web
    secondary: "#333333", // HSL: 0 0% 20% - matching web dark secondary
    secondaryForeground: "#d9d9d9", // HSL: 0 0% 85% - matching web dark foreground
    muted: "#3a3a3a", // HSL: 0 0% 23% - matching web dark muted
    mutedForeground: "#a3a3a3", // neutral-400 - matching web
    accent: "#15803d", // HSL: 142 72% 29% - green-700 matching web primary
    accentForeground: "#ffffff", // white - matching web
    destructive: "#ef4444", // red-500 - better visibility in dark mode
    destructiveForeground: "#ffffff", // white - matching web
    border: "#3a3a3a", // HSL: 0 0% 23% - matching web dark border
    input: "#262626", // Same as card - distinct from background for visibility
    ring: "#15803d", // HSL: 142 72% 29% - green-700 matching web
    // Additional semantic colors
    error: "#ef4444", // alias for destructive
    onError: "#ffffff", // alias for destructiveForeground
    onPrimary: "#ffffff", // alias for primaryForeground
    text: "#d9d9d9", // alias for foreground
    textSecondary: "#a3a3a3", // alias for mutedForeground
    primaryContainer: "#166534", // dark green container - green-800
    surface: "#262626", // alias for card
    surfaceVariant: "#333333", // slightly lighter surface for alternating rows
    warning: "#fbbf24", // amber-400 - warning color for dark theme
    success: "#22c55e", // green-500 - success color for dark theme
  },
} as const;
