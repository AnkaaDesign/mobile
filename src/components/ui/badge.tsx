import * as React from "react";
import { View, Text, ViewStyle, TextStyle, StyleSheet} from "react-native";
import { useTheme } from "@/lib/theme";
import { borderRadius, fontSize, fontWeight } from "@/constants/design-system";
import { getBadgeVariant as getCentralizedBadgeVariant } from "@/constants/badge-colors";
import { extendedColors } from "@/lib/theme/extended-colors";

export interface BadgeProps {
  children?: React.ReactNode;
  variant?:
    | "default"
    | "primary"
    | "secondary"
    | "destructive"
    | "outline"
    | "success"
    | "warning"
    | "error"
    | "info"
    | "muted"
    | "pending"
    | "active"
    | "inactive"
    | "completed"
    | "cancelled"
    | "onHold"
    | "inProgress"
    | "purple"
    | "blue"
    | "orange"
    | "green"
    | "teal"
    | "indigo"
    | "pink";
  size?: "default" | "sm" | "md" | "lg";
  style?: ViewStyle;
  textStyle?: TextStyle;
  className?: string;
}

const getBadgeStyles = (variant: BadgeProps["variant"] = "default", size: BadgeProps["size"] = "default", colors: any, isDark: boolean): ViewStyle => {
  // Size-based padding matching web (increased vertical padding for better height)
  const sizePadding: Record<string, { paddingHorizontal: number; paddingVertical: number }> = {
    sm: { paddingHorizontal: 8, paddingVertical: 5 },
    default: { paddingHorizontal: 10, paddingVertical: 7 },
    md: { paddingHorizontal: 10, paddingVertical: 5 },
    lg: { paddingHorizontal: 12, paddingVertical: 8 },
  };

  const baseStyles: ViewStyle = {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start", // Changed from center to flex-start for left alignment
    borderRadius: borderRadius.DEFAULT,
    borderWidth: 1,
    ...(sizePadding[size || "default"] || sizePadding.default),
  };

  // Safe border color with fallback
  const borderColor = colors?.border || "#d4d4d4";

  const variantStyles: Record<string, ViewStyle> = {
    // Neutral variants
    default: {
      backgroundColor: extendedColors.neutral[500],
      borderColor: "transparent",
    },
    secondary: {
      backgroundColor: isDark ? extendedColors.neutral[700] : extendedColors.neutral[200],
      borderColor: "transparent",
    },
    muted: {
      backgroundColor: extendedColors.neutral[500],
      borderColor: "transparent",
    },
    outline: {
      backgroundColor: "transparent",
      borderColor: borderColor,
    },

    // Primary/Info variants (Blue tones)
    primary: {
      backgroundColor: extendedColors.blue[700],
      borderColor: "transparent",
    },
    info: {
      backgroundColor: extendedColors.blue[700],
      borderColor: "transparent",
    },
    inProgress: {
      backgroundColor: extendedColors.blue[700],
      borderColor: "transparent",
    },

    // Success variants (Green tones)
    success: {
      backgroundColor: extendedColors.green[700],
      borderColor: "transparent",
    },
    completed: {
      backgroundColor: extendedColors.green[700],
      borderColor: "transparent",
    },
    active: {
      backgroundColor: extendedColors.green[700],
      borderColor: "transparent",
    },

    // Warning variants (Orange/Amber tones)
    warning: {
      backgroundColor: extendedColors.orange[600],
      borderColor: "transparent",
    },
    pending: {
      backgroundColor: extendedColors.amber[600],
      borderColor: "transparent",
    },
    onHold: {
      backgroundColor: extendedColors.orange[600],
      borderColor: "transparent",
    },

    // Error/Destructive variants (Red tones)
    error: {
      backgroundColor: extendedColors.red[700],
      borderColor: "transparent",
    },
    destructive: {
      backgroundColor: extendedColors.red[700],
      borderColor: "transparent",
    },
    cancelled: {
      backgroundColor: extendedColors.red[700],
      borderColor: "transparent",
    },

    // Inactive variant (Gray - disabled/inactive states)
    inactive: {
      backgroundColor: extendedColors.neutral[500],
      borderColor: "transparent",
    },

    // Additional color variants
    purple: {
      backgroundColor: extendedColors.purple[600],
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
      backgroundColor: extendedColors.green[600],
      borderColor: "transparent",
    },
    teal: {
      backgroundColor: extendedColors.teal[600],
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
  };

  // Safely get variant style with fallback to default
  const selectedVariantStyle = variantStyles[variant || "default"] || variantStyles.default;

  return {
    ...baseStyles,
    ...selectedVariantStyle,
  };
};

const getBadgeTextStyles = (variant: BadgeProps["variant"] = "default", size: BadgeProps["size"] = "default", colors: any, _isDark: boolean): TextStyle => {
  // Size-based font sizes matching web
  const sizeFont: Record<string, { fontSize: number }> = {
    sm: { fontSize: 10 },
    default: { fontSize: fontSize.xs },
    md: { fontSize: fontSize.xs },
    lg: { fontSize: fontSize.sm },
  };

  const baseStyles: TextStyle = {
    fontWeight: fontWeight.semibold,
    textAlign: "left", // Changed from center to left
    ...(sizeFont[size || "default"] || sizeFont.default),
  };

  const white = "#ffffff";

  // Safe color access with fallbacks
  const primaryForeground = colors?.primaryForeground || white;
  const secondaryForeground = colors?.secondaryForeground || "#171717";
  const foreground = colors?.foreground || "#171717";

  const variantStyles: Record<string, TextStyle> = {
    default: {
      color: white,
    },
    primary: {
      color: primaryForeground,
    },
    secondary: {
      color: secondaryForeground,
    },
    destructive: {
      color: white,
    },
    outline: {
      color: foreground,
    },
    success: {
      color: white,
    },
    warning: {
      color: white,
    },
    error: {
      color: white,
    },
    info: {
      color: white,
    },
    muted: {
      color: white,
    },
    pending: {
      color: white,
    },
    active: {
      color: white,
    },
    inactive: {
      color: white,
    },
    completed: {
      color: white,
    },
    cancelled: {
      color: white,
    },
    onHold: {
      color: white,
    },
    inProgress: {
      color: white,
    },
    purple: {
      color: white,
    },
    blue: {
      color: white,
    },
    orange: {
      color: white,
    },
    green: {
      color: white,
    },
    teal: {
      color: white,
    },
    indigo: {
      color: white,
    },
    pink: {
      color: white,
    },
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
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 4,
      backgroundColor: "#6b7280",
      borderWidth: 1,
      borderColor: "transparent",
    };
    badgeTextStyles = {
      fontSize: 12,
      fontWeight: "500",
      color: "#ffffff",
    };
  }

  const renderChildren = () => {
    if (typeof children === "string" || typeof children === "number") {
      return <Text style={StyleSheet.flatten([badgeTextStyles, textStyle].filter(Boolean))} numberOfLines={1} ellipsizeMode="tail">{children}</Text>;
    }

    // For non-text children, wrap Text components with styles
    return React.Children.map(children, (child) => {
      if (React.isValidElement(child) && child.type === Text) {
        const element = child as React.ReactElement<{ style?: TextStyle; numberOfLines?: number; ellipsizeMode?: "head" | "middle" | "tail" | "clip" }>;
        return React.cloneElement(element, {
          style: StyleSheet.flatten([badgeTextStyles, element.props?.style, textStyle].filter(Boolean)),
          numberOfLines: 1,
          ellipsizeMode: "tail" as const,
        });
      }
      return child;
    });
  };

  // Filter out undefined props to avoid spread issues
  const safeProps = restProps && typeof restProps === 'object' ? restProps : {};

  return (
    <View style={StyleSheet.flatten([badgeStyles, style].filter(Boolean))} {...safeProps}>
      {renderChildren()}
    </View>
  );
}

Badge.displayName = "Badge";

export { Badge };
