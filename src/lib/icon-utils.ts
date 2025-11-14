import { useTheme } from "@/lib/theme";
import { ICON_SIZES, getIconSize} from "@/constants/icon-sizes";
import { getIconColor, ICON_OPACITY } from "@/constants/icon-colors";

/**
 * Icon utility types
 */
export interface IconProps {
  name: string;
  size?: IconSize;
  color?: string;
  opacity?: number;
  testID?: string;
  accessibilityLabel?: string;
}

export interface StandardIconProps extends IconProps {
  variant?: "default" | "primary" | "secondary" | "muted" | "success" | "warning" | "error" | "info";
  state?: "default" | "disabled" | "active" | "pressed" | "loading";
}

/**
 * Hook for consistent icon styling
 */
export const useIconProps = () => {
  const { colors, isDark } = useTheme();

  const getStandardProps = ({ name, size = "md", variant = "default", state = "default", color, opacity, testID, accessibilityLabel, ...props }: StandardIconProps) => {
    // Calculate size
    const iconSize = getIconSize(size);

    // Calculate color (custom color takes precedence)
    const iconColor = color || getIconColor(colors, variant);

    // Calculate opacity based on state
    let iconOpacity = opacity;
    if (!iconOpacity) {
      switch (state) {
        case "disabled":
          iconOpacity = ICON_OPACITY.disabled;
          break;
        case "pressed":
          iconOpacity = ICON_OPACITY.pressed;
          break;
        case "loading":
          iconOpacity = ICON_OPACITY.loading;
          break;
        default:
          iconOpacity = ICON_OPACITY.default;
      }
    }

    // Generate testID if not provided
    const finalTestID = testID || `icon-${name.replace(/[^a-zA-Z0-9]/g, "-").toLowerCase()}`;

    // Generate accessibility label if not provided
    const finalAccessibilityLabel = accessibilityLabel || `${name} icon`;

    return {
      name,
      size: iconSize,
      color: iconColor,
      opacity: iconOpacity,
      testID: finalTestID,
      accessibilityLabel: finalAccessibilityLabel,
      // Accessibility properties
      accessible: true,
      accessibilityRole: "image" as const,
      ...props,
    };
  };

  return {
    getStandardProps,
    colors,
    isDark,
    iconSizes: ICON_SIZES,
  };
};

/**
 * Icon spacing utilities for consistent layout
 */
export const ICON_SPACING = {
  // Margins around icons
  margin: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
  },

  // Padding around touchable icons
  padding: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
  },

  // Gap between icon and text
  gap: {
    xs: 4,
    sm: 6,
    md: 8,
    lg: 12,
    xl: 16,
  },
} as const;

/**
 * Helper to calculate touch target size
 */
export const getTouchTargetStyle = (iconSize: number, minSize: number = 44) => {
  const touchSize = Math.max(iconSize, minSize);
  const padding = (touchSize - iconSize) / 2;

  return {
    width: touchSize,
    height: touchSize,
    padding,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  };
};

/**
 * Common icon button configurations
 */
export const ICON_BUTTON_CONFIGS = {
  sm: {
    iconSize: ICON_SIZES.sm,
    touchTarget: 36,
    borderRadius: 6,
  },
  md: {
    iconSize: ICON_SIZES.md,
    touchTarget: 44,
    borderRadius: 8,
  },
  lg: {
    iconSize: ICON_SIZES.lg,
    touchTarget: 52,
    borderRadius: 12,
  },
} as const;

/**
 * Status icon configurations
 */
export const STATUS_ICON_MAP = {
  // Task status icons
  PENDING: { name: "clock", color: "warning" },
  IN_PROGRESS: { name: "clock-play", color: "info" },
  ON_HOLD: { name: "pause", color: "muted" },
  COMPLETED: { name: "check-circle", color: "success" },
  CANCELLED: { name: "x-circle", color: "error" },

  // Order status icons
  CREATED: { name: "clipboard", color: "info" },
  FULFILLED: { name: "package", color: "warning" },
  RECEIVED: { name: "check-circle", color: "success" },

  // User status icons
  ACTIVE: { name: "user-check", color: "success" },
  INACTIVE: { name: "user-x", color: "error" },

  // Priority icons
  LOW: { name: "arrow-down", color: "muted" },
  MEDIUM: { name: "minus", color: "default" },
  HIGH: { name: "arrow-up", color: "warning" },
  CRITICAL: { name: "alert-triangle", color: "error" },
} as const;

/**
 * Helper to get status icon props
 */
export const getStatusIconProps = (status: keyof typeof STATUS_ICON_MAP, size: IconSize = "sm") => {
  const config = STATUS_ICON_MAP[status];
  if (!config) {
    return { name: "help-circle", variant: "muted" as const, size };
  }

  return {
    name: config.name,
    variant: config.color as "default" | "primary" | "secondary" | "muted" | "success" | "warning" | "error" | "info",
    size,
  };
};
