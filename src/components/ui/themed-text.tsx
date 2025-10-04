import React from "react";
import { Text, TextProps, StyleSheet} from "react-native";
import { useTheme } from "@/lib/theme";

interface ThemedTextProps extends TextProps {
  variant?: "default" | "muted" | "primary" | "secondary" | "destructive";
  size?: "xs" | "sm" | "base" | "lg" | "xl" | "2xl";
  weight?: "normal" | "medium" | "semibold" | "bold";
}

export function ThemedText({ style, variant = "default", size = "base", weight = "normal", ...props }: ThemedTextProps) {
  const { isDark, colors } = useTheme();

  const textColors = {
    default: colors.foreground,
    muted: colors.mutedForeground,
    primary: colors.primary,
    secondary: colors.secondary,
    destructive: colors.destructive,
  };

  const textSizes = {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    "2xl": 24,
  };

  const fontWeights = {
    normal: "400" as const,
    medium: "500" as const,
    semibold: "600" as const,
    bold: "700" as const,
  };

  return (
    <Text
      style={StyleSheet.flatten([
        {
          color: textColors[variant],
          fontSize: textSizes[size],
          fontWeight: fontWeights[weight],
        },
        style,
      ])}
      {...props}
    />
  );
}

ThemedText.displayName = "ThemedText";

const styles = StyleSheet.create({
  // Additional styles can be added here if needed
});
