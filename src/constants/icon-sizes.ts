/**
 * Standardized icon sizes for consistent design throughout the mobile application
 * Following design system best practices with semantic naming
 */

export const ICON_SIZES = {
  // Primary size system
  xs: 12, // Extra small - for inline text icons, badges
  sm: 16, // Small - for buttons, form elements, list items
  md: 24, // Medium (default) - for navigation, cards, general use
  lg: 32, // Large - for headers, prominent actions
  xl: 48, // Extra large - for avatars, feature highlights
  xxl: 64, // Extra extra large - for splash screens, empty states

  // Semantic aliases for common use cases
  icon: 24, // Default icon size
  button: 16, // Button icons
  navigation: 24, // Navigation/menu icons
  header: 32, // Header icons
  avatar: 48, // Avatar icons
  feature: 64, // Feature/hero icons

  // Context-specific sizes
  listItem: 20, // List item icons
  tableCell: 16, // Table cell icons
  fab: 24, // Floating action button icons
  tab: 24, // Tab bar icons
  badge: 12, // Badge icons
  status: 16, // Status indicator icons

  // Touch target considerations (minimum 44px for accessibility)
  touchTarget: 24, // Icons that are touch targets
} as const;

/**
 * Type for valid icon sizes
 */
export type IconSize = keyof typeof ICON_SIZES | number;

/**
 * Helper function to get icon size value
 */
export const getIconSize = (size: IconSize): number => {
  if (typeof size === "number") {
    return size;
  }
  return ICON_SIZES[size] || ICON_SIZES.md;
};

/**
 * Accessibility guidelines for icon sizes
 */
export const ACCESSIBILITY_GUIDELINES = {
  minTouchTarget: 44, // Minimum touch target size (iOS/Android guideline)
  minIconSize: 16, // Minimum readable icon size
  maxIconSize: 128, // Maximum practical icon size

  // Recommended sizes for different contexts
  mobile: {
    minTouch: 44, // Minimum touch area
    comfortable: 48, // Comfortable touch area
    list: 20, // List item icons
    button: 16, // Button icons
  },
} as const;
