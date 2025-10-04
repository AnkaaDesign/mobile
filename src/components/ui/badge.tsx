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
  // Size-based padding matching web
  const sizePadding = {
    sm: { paddingHorizontal: 8, paddingVertical: 1 },
    default: { paddingHorizontal: 10, paddingVertical: 2 },
    lg: { paddingHorizontal: 12, paddingVertical: 4 },
  };

  const baseStyles: ViewStyle = {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
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

    // Primary/Info variants (Blue tones)
    primary: {
      backgroundColor: "#2563eb", // blue-600
      borderColor: "transparent",
    },
    info: {
      backgroundColor: "#0ea5e9", // sky-500
      borderColor: "transparent",
    },
    inProgress: {
      backgroundColor: "#3b82f6", // blue-500 (changed to match web)
      borderColor: "transparent",
    },

    // Success variants (Green tones - positive actions)
    success: {
      backgroundColor: "#16a34a", // green-600
      borderColor: "transparent",
    },
    completed: {
      backgroundColor: "#16a34a", // green-600 (changed to match success)
      borderColor: "transparent",
    },
    active: {
      backgroundColor: "#16a34a", // green-600 (changed to match success for consistency)
      borderColor: "transparent",
    },

    // Warning variants (Orange/Amber tones - attention needed)
    warning: {
      backgroundColor: "#f97316", // orange-500 (changed to match web)
      borderColor: "transparent",
    },
    pending: {
      backgroundColor: "#f59e0b", // amber-500
      borderColor: "transparent",
    },
    onHold: {
      backgroundColor: "#eab308", // yellow-500
      borderColor: "transparent",
    },

    // Error/Destructive variants (Red tones - negative actions)
    error: {
      backgroundColor: "#dc2626", // red-600
      borderColor: "transparent",
    },
    destructive: {
      backgroundColor: "#dc2626", // red-600 (changed to match error)
      borderColor: "transparent",
    },
    cancelled: {
      backgroundColor: "#dc2626", // red-600 (changed to match error)
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
    textAlign: "center",
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
      return <Text style={StyleSheet.flatten([badgeTextStyles, textStyle])}>{children}</Text>;
    }

    // For non-text children, wrap Text components with styles
    return React.Children.map(children, (child) => {
      if (React.isValidElement(child) && child.type === Text) {
        return React.cloneElement(child as React.ReactElement<any>, {
          style: [badgeTextStyles, child.props.style, textStyle],
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
