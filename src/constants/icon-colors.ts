import { ThemeColors } from "@/types/theme";

/**
 * Standardized icon colors that work with both light and dark themes
 */

export const getIconColors = (colors: ThemeColors) =>
  ({
    // Primary icon colors
    primary: colors.primary, // Main brand color
    secondary: colors.secondary, // Secondary actions
    accent: colors.accent, // Accent/highlight color

    // Semantic colors
    success: "#16a34a", // Green - success states
    warning: "#d97706", // Orange - warning states
    error: colors.destructive, // Red - error/destructive states
    info: "#2563eb", // Blue - informational states

    // Text-based colors (theme-aware)
    default: colors.foreground, // Default icon color (matches text)
    muted: colors.mutedForeground, // Muted/secondary icons
    subtle: colors.mutedForeground, // Subtle icons (alias for muted)

    // Surface-based colors
    onBackground: colors.foreground, // Icons on background surface
    onCard: colors.cardForeground, // Icons on card surface
    onPrimary: colors.primaryForeground, // Icons on primary color
    onError: colors.destructiveForeground, // Icons on error color

    // Status-specific colors
    active: colors.primary, // Active/selected state
    inactive: colors.mutedForeground, // Inactive/unselected state
    disabled: colors.mutedForeground, // Disabled state (with opacity)

    // Navigation colors
    navigation: colors.foreground, // Navigation icons
    navigationActive: colors.primary, // Active navigation icons
    navigationInactive: colors.mutedForeground, // Inactive navigation icons

    // Interactive states
    hover: colors.accent, // Hover state (for web compatibility)
    pressed: colors.primary, // Pressed/active state
    focus: colors.ring, // Focus state

    // Utility colors
    border: colors.border, // Border-colored icons
    background: colors.background, // Background-colored icons (rare use)
  }) as const;

/**
 * Icon color variants for different contexts
 */
export const ICON_COLOR_VARIANTS = {
  // Button variants
  button: {
    primary: "onPrimary",
    secondary: "default",
    ghost: "default",
    outline: "default",
    destructive: "onError",
  },

  // Status variants
  status: {
    pending: "warning",
    inProgress: "info",
    completed: "success",
    cancelled: "error",
    onHold: "muted",
  },

  // Priority variants
  priority: {
    low: "muted",
    medium: "default",
    high: "warning",
    critical: "error",
  },

  // Navigation variants
  navigation: {
    default: "navigation",
    active: "navigationActive",
    inactive: "navigationInactive",
  },
} as const;

/**
 * Helper function to get icon color based on variant and theme
 */
export const getIconColor = (colors: ThemeColors, variant: keyof ReturnType<typeof getIconColors> | string = "default"): string => {
  const iconColors = getIconColors(colors);
  return iconColors[variant as keyof typeof iconColors] || iconColors.default;
};

/**
 * Opacity values for different icon states
 */
export const ICON_OPACITY = {
  default: 1.0, // Normal state
  disabled: 0.4, // Disabled state
  muted: 0.6, // Muted/secondary
  subtle: 0.5, // Very subtle
  pressed: 0.8, // Pressed state
  loading: 0.7, // Loading state
} as const;
