import * as React from "react";
import { View, Text, ViewStyle, TextStyle, StyleSheet} from "react-native";
import { useTheme } from "@/contexts/theme-context";
import { borderRadius, fontSize, spacing, fontWeight } from "@/constants/design-system";
import { getBadgeVariant as getCentralizedBadgeVariant, type BadgeVariant } from '../../constants';

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
    | "inProgress";
  size?: "default" | "sm" | "lg";
  style?: ViewStyle;
  textStyle?: TextStyle;
}

const getBadgeStyles = (variant: BadgeProps["variant"] = "default", size: BadgeProps["size"] = "default", colors: any, isDark: boolean): ViewStyle => {
  // Size-based padding matching web (increased vertical padding for better height)
  const sizePadding = {
    sm: { paddingHorizontal: 8, paddingVertical: 4 },
    default: { paddingHorizontal: 10, paddingVertical: 5 },
    lg: { paddingHorizontal: 12, paddingVertical: 6 },
  };

  const baseStyles: ViewStyle = {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start", // Changed from center to flex-start for left alignment
    borderRadius: borderRadius.DEFAULT,
    borderWidth: 1,
    ...sizePadding[size],
  };

  const variantStyles: Record<string, ViewStyle> = {
    // Neutral variants
    default: {
      backgroundColor: "#6b7280", // neutral-500
      borderColor: "transparent",
    },
    secondary: {
      backgroundColor: isDark ? "#404040" : "#e5e5e5", // neutral-700/200
      borderColor: "transparent",
    },
    muted: {
      backgroundColor: "#6b7280", // gray-500 (changed to match web)
      borderColor: "transparent",
    },
    outline: {
      backgroundColor: "transparent",
      borderColor: colors.border,
    },

    // Primary/Info variants (Blue tones) - Matching web EXACTLY
    primary: {
      backgroundColor: "#1d4ed8", // blue-700 (web line 19: bg-blue-700)
      borderColor: "transparent",
    },
    info: {
      backgroundColor: "#1d4ed8", // blue-700 (web line 20: bg-blue-700)
      borderColor: "transparent",
    },
    inProgress: {
      backgroundColor: "#1d4ed8", // blue-700 (web line 21: bg-blue-700)
      borderColor: "transparent",
    },

    // Success variants (Green tones) - Matching web EXACTLY
    success: {
      backgroundColor: "#15803d", // green-700 (web line 25: bg-green-700)
      borderColor: "transparent",
    },
    completed: {
      backgroundColor: "#15803d", // green-700 (web line 26: bg-green-700)
      borderColor: "transparent",
    },
    active: {
      backgroundColor: "#15803d", // green-700 (web line 27: bg-green-700)
      borderColor: "transparent",
    },

    // Warning variants (Orange/Amber tones) - Matching web EXACTLY
    warning: {
      backgroundColor: "#ea580c", // orange-600 (web line 31: bg-orange-600)
      borderColor: "transparent",
    },
    pending: {
      backgroundColor: "#d97706", // amber-600 (web line 32: bg-amber-600) NOT yellow-600!
      borderColor: "transparent",
    },
    onHold: {
      backgroundColor: "#ea580c", // orange-600 (web line 33: bg-orange-600)
      borderColor: "transparent",
    },

    // Error/Destructive variants (Red tones) - Matching web EXACTLY
    error: {
      backgroundColor: "#b91c1c", // red-700 (web line 37: bg-red-700)
      borderColor: "transparent",
    },
    destructive: {
      backgroundColor: "#b91c1c", // red-700 (web line 38: bg-red-700)
      borderColor: "transparent",
    },
    cancelled: {
      backgroundColor: "#b91c1c", // red-700 (web line 39: bg-red-700)
      borderColor: "transparent",
    },

    // Inactive variant (Gray - disabled/inactive states)
    inactive: {
      backgroundColor: "#6b7280", // gray-500
      borderColor: "transparent",
    },
  };

  return {
    ...baseStyles,
    ...variantStyles[variant],
  };
};

const getBadgeTextStyles = (variant: BadgeProps["variant"] = "default", size: BadgeProps["size"] = "default", colors: any, isDark: boolean): TextStyle => {
  // Size-based font sizes matching web
  const sizeFont = {
    sm: { fontSize: 11 }, // 0.688rem
    default: { fontSize: fontSize.xs },
    lg: { fontSize: fontSize.sm },
  };

  const baseStyles: TextStyle = {
    fontWeight: fontWeight.medium,
    textAlign: "left", // Changed from center to left
    ...sizeFont[size],
  };

  const variantStyles: Record<string, TextStyle> = {
    default: {
      color: "#ffffff", // white
    },
    primary: {
      color: colors.primaryForeground,
    },
    secondary: {
      color: colors.secondaryForeground,
    },
    destructive: {
      color: "#ffffff", // white
    },
    outline: {
      color: colors.foreground,
    },
    success: {
      color: "#ffffff", // white
    },
    warning: {
      color: "#ffffff", // white
    },
    error: {
      color: "#ffffff", // white
    },
    info: {
      color: "#ffffff", // white
    },
    muted: {
      color: "#ffffff", // white
    },
    pending: {
      color: "#ffffff", // white
    },
    active: {
      color: "#ffffff", // white
    },
    inactive: {
      color: "#ffffff", // white
    },
    completed: {
      color: "#ffffff", // white
    },
    cancelled: {
      color: "#ffffff", // white
    },
    onHold: {
      color: "#ffffff", // white
    },
    inProgress: {
      color: "#ffffff", // white
    },
  };

  return {
    ...baseStyles,
    ...variantStyles[variant],
  };
};

// Helper function to get badge variant from status enums
// Uses centralized badge configuration from @ankaa/constants
export function getBadgeVariantFromStatus(status: string, entity?: string): BadgeProps["variant"] {
  return getCentralizedBadgeVariant(status, entity as any) as BadgeProps["variant"];
}

function Badge({ children, variant = "default", size = "default", style, textStyle, ...props }: BadgeProps) {
  const { colors, isDark } = useTheme();
  const badgeStyles = getBadgeStyles(variant, size, colors, isDark);
  const badgeTextStyles = getBadgeTextStyles(variant, size, colors, isDark);

  const renderChildren = () => {
    if (typeof children === "string" || typeof children === "number") {
      return <Text style={StyleSheet.flatten([badgeTextStyles, textStyle])} numberOfLines={1} ellipsizeMode="tail">{children}</Text>;
    }

    // For non-text children, wrap Text components with styles
    return React.Children.map(children, (child) => {
      if (React.isValidElement(child) && child.type === Text) {
        return React.cloneElement(child as React.ReactElement<any>, {
          style: [badgeTextStyles, child.props.style, textStyle],
          numberOfLines: 1,
          ellipsizeMode: "tail",
        });
      }
      return child;
    });
  };

  return (
    <View style={StyleSheet.flatten([badgeStyles, style])} {...props}>
      {renderChildren()}
    </View>
  );
}

Badge.displayName = "Badge";

export { Badge };
