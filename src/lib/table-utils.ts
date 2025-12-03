import { Dimensions } from "react-native";

// Tablet width threshold for showing additional columns
export const TABLET_WIDTH_THRESHOLD = 624;

/**
 * Get screen width - can be used to determine if device is in tablet mode
 */
export function getScreenWidth(): number {
  return Dimensions.get("window").width;
}

/**
 * Check if the current screen width is tablet-sized
 */
export function isTabletWidth(screenWidth?: number): boolean {
  const width = screenWidth ?? getScreenWidth();
  return width >= TABLET_WIDTH_THRESHOLD;
}

/**
 * Get visible columns based on screen width
 * @param mobileColumns - Columns to show on mobile (< 624px)
 * @param tabletColumns - Columns to show on tablet (>= 624px)
 * @param screenWidth - Optional screen width (uses current if not provided)
 */
export function getResponsiveColumns(
  mobileColumns: string[],
  tabletColumns: string[],
  screenWidth?: number
): Set<string> {
  if (isTabletWidth(screenWidth)) {
    return new Set(tabletColumns);
  }
  return new Set(mobileColumns);
}

/**
 * Hook-like function to get responsive columns
 * Note: This is not a React hook, just a utility function
 */
export function getDefaultVisibleColumnsWithTablet(
  mobileColumns: string[],
  tabletColumns: string[]
): Set<string> {
  return getResponsiveColumns(mobileColumns, tabletColumns);
}
