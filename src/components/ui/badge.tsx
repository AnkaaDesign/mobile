import * as React from "react";
import { View, Text, ViewStyle, TextStyle, StyleSheet} from "react-native";
import { useTheme } from "@/lib/theme";
import { borderRadius, fontSize, fontWeight } from "@/constants/design-system";
import { getBadgeVariant as getCentralizedBadgeVariant } from "@/constants/badge-colors";
import { extendedColors } from "@/lib/theme/extended-colors";

export interface BadgeProps {
  children?: React.ReactNode;
  variant?:
    // Neutral variants
    | "default"
    | "secondary"
    | "muted"
    | "outline"
    | "inactive"
    // Core semantic variants (common across entities)
    | "completed"
    | "cancelled"
    | "pending"
    | "created"
    | "active"
    | "inProgress"
    | "processing"
    | "approved"
    | "rejected"
    | "received"
    | "delivered"
    | "sent"
    | "verified"
    | "expired"
    | "failed"
    | "onHold"
    | "blocked"
    | "suspended"
    | "returned"
    | "lost"
    | "bounced"
    // Color utilities (for entity-specific or non-status use)
    | "red"
    | "purple"
    | "teal"
    | "indigo"
    | "pink"
    | "yellow"
    | "amber"
    | "blue"
    | "orange"
    | "green"
    // Deprecated (keep for backward compatibility)
    | "success"
    | "destructive"
    | "primary"
    | "error"
    | "info"
    | "warning";
  size?: "default" | "sm" | "md" | "lg";
  style?: ViewStyle;
  textStyle?: TextStyle;
  className?: string;
}

const getBadgeStyles = (variant: BadgeProps["variant"] = "default", size: BadgeProps["size"] = "default", colors: any, isDark: boolean): ViewStyle => {
  // Size-based padding - increased for better visual appearance
  const sizePadding: Record<string, { paddingHorizontal: number; paddingVertical: number }> = {
    sm: { paddingHorizontal: 8, paddingVertical: 6 },       // Increased to 6
    default: { paddingHorizontal: 10, paddingVertical: 7 }, // Increased to 7
    md: { paddingHorizontal: 10, paddingVertical: 7 },      // Increased to 7
    lg: { paddingHorizontal: 12, paddingVertical: 8 },      // Increased to 8
  };

  const padding = sizePadding[size || "default"] || sizePadding.default;

  const baseStyles: ViewStyle = {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "flex-start", // Prevent horizontal stretching
    flexGrow: 0,             // Prevent growing to fill container
    flexShrink: 0,           // Prevent shrinking
    borderRadius: borderRadius.DEFAULT,
    paddingHorizontal: padding.paddingHorizontal,
    paddingVertical: padding.paddingVertical,
  };

  // Safe border color with fallback
  const borderColor = colors?.border || "#d4d4d4";

  const variantStyles: Record<string, ViewStyle> = {
    // ===== NEUTRAL VARIANTS =====
    default: {
      backgroundColor: extendedColors.neutral[500],
      borderColor: "transparent",
    },
    secondary: {
      backgroundColor: isDark ? extendedColors.neutral[700] : extendedColors.neutral[200],
      borderColor: "transparent",
    },
    muted: {
      backgroundColor: extendedColors.gray[500],
      borderColor: "transparent",
    },
    outline: {
      backgroundColor: "transparent",
      borderWidth: 1,
      borderColor: borderColor,
    },
    inactive: {
      backgroundColor: extendedColors.gray[500],
      borderColor: "transparent",
    },

    // ===== CORE SEMANTIC VARIANTS =====
    // Green status variants (use green-700)
    completed: {
      backgroundColor: extendedColors.green[700],
      borderColor: "transparent",
    },
    received: {
      backgroundColor: extendedColors.green[700],
      borderColor: "transparent",
    },
    approved: {
      backgroundColor: extendedColors.green[700],
      borderColor: "transparent",
    },
    returned: {
      backgroundColor: extendedColors.green[700],
      borderColor: "transparent",
    },
    delivered: {
      backgroundColor: extendedColors.green[700],
      borderColor: "transparent",
    },
    active: {
      backgroundColor: extendedColors.green[700],
      borderColor: "transparent",
    },
    verified: {
      backgroundColor: extendedColors.green[700],
      borderColor: "transparent",
    },
    sent: {
      backgroundColor: extendedColors.green[700],
      borderColor: "transparent",
    },

    // Red status variants (use red-700)
    cancelled: {
      backgroundColor: extendedColors.red[700],
      borderColor: "transparent",
    },
    rejected: {
      backgroundColor: extendedColors.red[700],
      borderColor: "transparent",
    },
    lost: {
      backgroundColor: extendedColors.red[700],
      borderColor: "transparent",
    },
    failed: {
      backgroundColor: extendedColors.red[700],
      borderColor: "transparent",
    },
    bounced: {
      backgroundColor: extendedColors.red[700],
      borderColor: "transparent",
    },
    blocked: {
      backgroundColor: extendedColors.red[700],
      borderColor: "transparent",
    },
    suspended: {
      backgroundColor: extendedColors.red[700],
      borderColor: "transparent",
    },

    // Blue status variants (use blue-700)
    created: {
      backgroundColor: extendedColors.blue[700],
      borderColor: "transparent",
    },
    inProgress: {
      backgroundColor: extendedColors.blue[700],
      borderColor: "transparent",
    },
    processing: {
      backgroundColor: extendedColors.blue[700],
      borderColor: "transparent",
    },

    // Amber status variants (use amber-600)
    pending: {
      backgroundColor: extendedColors.amber[600],
      borderColor: "transparent",
    },
    expired: {
      backgroundColor: extendedColors.amber[600],
      borderColor: "transparent",
    },

    // Orange status variants (use orange-600)
    onHold: {
      backgroundColor: extendedColors.orange[600],
      borderColor: "transparent",
    },

    // ===== COLOR UTILITIES =====
    red: {
      backgroundColor: extendedColors.red[700],
      borderColor: "transparent",
    },
    purple: {
      backgroundColor: extendedColors.purple[600],
      borderColor: "transparent",
    },
    teal: {
      backgroundColor: extendedColors.teal[500],
      borderColor: "transparent",
    },
    indigo: {
      backgroundColor: extendedColors.indigo[600],
      borderColor: "transparent",
    },
    pink: {
      backgroundColor: extendedColors.pink[600],
      borderColor: "transparent",
    },
    yellow: {
      backgroundColor: extendedColors.yellow[500],
      borderColor: "transparent",
    },
    amber: {
      backgroundColor: extendedColors.amber[500],
      borderColor: "transparent",
    },
    blue: {
      backgroundColor: extendedColors.blue[600],
      borderColor: "transparent",
    },
    orange: {
      backgroundColor: extendedColors.orange[500],
      borderColor: "transparent",
    },
    green: {
      backgroundColor: extendedColors.green[700],
      borderColor: "transparent",
    },

    // ===== DEPRECATED - Keep for backward compatibility =====
    success: {
      backgroundColor: extendedColors.green[700], // Standardized to green-700
      borderColor: "transparent",
    },
    destructive: {
      backgroundColor: extendedColors.red[700], // Standardized to red-700
      borderColor: "transparent",
    },
    primary: {
      backgroundColor: extendedColors.blue[700], // Standardized to blue-700
      borderColor: "transparent",
    },
    error: {
      backgroundColor: extendedColors.red[700], // Standardized to red-700
      borderColor: "transparent",
    },
    info: {
      backgroundColor: extendedColors.blue[700], // Standardized to blue-700
      borderColor: "transparent",
    },
    warning: {
      backgroundColor: extendedColors.orange[600], // Standardized to orange-600
      borderColor: "transparent",
    },
  };

  // Safely get variant style with fallback to default
  const selectedVariantStyle = variantStyles[variant || "default"] || variantStyles.default;

  return {
    ...baseStyles,
    ...selectedVariantStyle,
  };
};

const getBadgeTextStyles = (variant: BadgeProps["variant"] = "default", size: BadgeProps["size"] = "default", colors: any, _isDark: boolean): TextStyle => {
  // Size-based font sizes matching web Tailwind EXACTLY
  // Web: sm=text-[0.688rem]=11px, default=text-xs=12px, lg=text-sm=14px
  // LineHeight kept tight to minimize badge height
  const sizeFont: Record<string, { fontSize: number; lineHeight: number }> = {
    sm: { fontSize: 11, lineHeight: 13 },     // text-[0.688rem] = 11px
    default: { fontSize: 12, lineHeight: 14 }, // text-xs = 12px
    md: { fontSize: 12, lineHeight: 14 },      // text-xs = 12px
    lg: { fontSize: 14, lineHeight: 17 },      // text-sm = 14px
  };

  const baseStyles: TextStyle = {
    fontWeight: fontWeight.semibold,
    textAlign: "center",
    includeFontPadding: false, // Critical for Android - removes extra padding
    textAlignVertical: "center",
    ...(sizeFont[size || "default"] || sizeFont.default),
  };

  const white = "#ffffff";

  // Safe color access with fallbacks
  const primaryForeground = colors?.primaryForeground || white;
  const secondaryForeground = colors?.secondaryForeground || "#171717";
  const foreground = colors?.foreground || "#171717";

  const variantStyles: Record<string, TextStyle> = {
    // Neutral variants
    default: { color: white },
    secondary: { color: secondaryForeground },
    muted: { color: white },
    outline: { color: foreground },
    inactive: { color: white },

    // Core semantic variants - all white text
    completed: { color: white },
    received: { color: white },
    approved: { color: white },
    returned: { color: white },
    delivered: { color: white },
    active: { color: white },
    verified: { color: white },
    sent: { color: white },

    cancelled: { color: white },
    rejected: { color: white },
    lost: { color: white },
    failed: { color: white },
    bounced: { color: white },
    blocked: { color: white },
    suspended: { color: white },

    created: { color: white },
    inProgress: { color: white },
    processing: { color: white },

    pending: { color: white },
    expired: { color: white },

    onHold: { color: white },

    // Color utilities - all white text
    red: { color: white },
    purple: { color: white },
    teal: { color: white },
    indigo: { color: white },
    pink: { color: white },
    yellow: { color: white },
    amber: { color: white },
    blue: { color: white },
    orange: { color: white },
    green: { color: white },

    // Deprecated variants - all white text
    success: { color: white },
    destructive: { color: white },
    primary: { color: white },
    error: { color: white },
    info: { color: white },
    warning: { color: white },
  };

  // Safely get variant style with fallback to default
  const selectedVariantStyle = variantStyles[variant || "default"] || variantStyles.default;

  return {
    ...baseStyles,
    ...selectedVariantStyle,
  };
};

// Helper function to get badge variant from status enums
// Uses centralized badge configuration from @ankaa/constants
export function getBadgeVariantFromStatus(status: string, entity?: string): BadgeProps["variant"] {
  return getCentralizedBadgeVariant(status, entity as any) as BadgeProps["variant"];
}

function Badge(props: BadgeProps) {
  // Safely destructure props with defaults
  const {
    children,
    variant = "default",
    size = "default",
    style,
    textStyle,
    className,
    ...restProps
  } = props || {};

  // Get theme (will return defaults if not in provider)
  const theme = useTheme();
  const colors = theme?.colors || null;
  const isDark = Boolean(theme?.isDark);

  // Ensure variant and size are valid strings
  const safeVariant = (typeof variant === 'string' && variant) ? variant : "default";
  const safeSize = (typeof size === 'string' && size) ? size : "default";

  // Calculate styles with error handling
  let badgeStyles: ViewStyle;
  let badgeTextStyles: TextStyle;

  try {
    badgeStyles = getBadgeStyles(safeVariant as BadgeProps["variant"], safeSize as BadgeProps["size"], colors, isDark);
    badgeTextStyles = getBadgeTextStyles(safeVariant as BadgeProps["variant"], safeSize as BadgeProps["size"], colors, isDark);
  } catch (error) {
    // Fallback styles if something goes wrong
    console.warn('Badge: Error calculating styles', error);
    badgeStyles = {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      alignSelf: "flex-start",
      flexGrow: 0,
      flexShrink: 0,
      paddingHorizontal: 8,
      paddingVertical: 2, // Match sm size
      borderRadius: 4,
      backgroundColor: "#6b7280",
    };
    badgeTextStyles = {
      fontSize: 11,
      lineHeight: 14,
      fontWeight: "500",
      color: "#ffffff",
    };
  }

  const renderChildren = () => {
    if (typeof children === "string" || typeof children === "number") {
      return (
        <Text
          style={StyleSheet.flatten([badgeTextStyles, textStyle].filter(Boolean))}
          numberOfLines={1}
          ellipsizeMode="tail"
          allowFontScaling={false}
        >
          {children}
        </Text>
      );
    }

    // For React element children, apply badge text styles
    // This handles Text, ThemedText, and any other text-like components
    return React.Children.map(children, (child) => {
      if (React.isValidElement(child)) {
        const element = child as React.ReactElement<{ style?: TextStyle; className?: string }>;
        const childStyle = element.props?.style;
        const flatChildStyle = childStyle ? StyleSheet.flatten(childStyle) : {};

        // If child has explicit color, respect it (for custom-styled badges like paint catalog)
        // Otherwise, use badge's text color
        const hasExplicitColor = flatChildStyle && 'color' in flatChildStyle;

        if (hasExplicitColor) {
          // Child has explicit color - only apply non-color badge text styles
          const { color: _badgeColor, ...badgeTextStylesWithoutColor } = badgeTextStyles;
          return React.cloneElement(element, {
            style: StyleSheet.flatten([badgeTextStylesWithoutColor, childStyle, textStyle].filter(Boolean)),
          });
        } else {
          // No explicit color - apply full badge text styles (including color)
          return React.cloneElement(element, {
            style: StyleSheet.flatten([childStyle, badgeTextStyles, textStyle].filter(Boolean)),
          });
        }
      }
      return child;
    });
  };

  // Filter out undefined props to avoid spread issues
  const safeProps = restProps && typeof restProps === 'object' ? restProps : {};

  return (
    <View
      style={StyleSheet.flatten([
        badgeStyles,
        style,
      ].filter(Boolean))}
      {...safeProps}
    >
      {renderChildren()}
    </View>
  );
}

Badge.displayName = "Badge";

export { Badge };
