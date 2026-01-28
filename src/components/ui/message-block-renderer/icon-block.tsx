import React from "react";
import { View, StyleSheet } from "react-native";
import { useTheme } from "@/lib/theme";
import { spacing } from "@/constants/design-system";
import * as TablerIcons from "@tabler/icons-react-native";
import type { IconBlock } from "./types";

interface IconBlockProps {
  block: IconBlock;
}

/**
 * Converts Tailwind color class to actual color value
 */
function getTailwindColor(colorClass: string | undefined, themeColors: any): string {
  if (!colorClass) return themeColors.foreground;

  // Map Tailwind color classes to actual colors
  const colorMap: Record<string, string> = {
    "text-foreground": themeColors.foreground,
    "text-primary": themeColors.primary,
    "text-secondary": themeColors.secondary,
    "text-muted-foreground": themeColors.mutedForeground,
    "text-green-600": "#16a34a",
    "text-blue-600": "#2563eb",
    "text-yellow-600": "#ca8a04",
    "text-red-600": "#dc2626",
    "text-purple-600": "#9333ea",
    "text-orange-600": "#ea580c",
    "text-pink-600": "#db2777",
  };

  return colorMap[colorClass] || themeColors.foreground;
}

/**
 * Renders an icon block using Tabler icons
 * Matches web behavior with size presets and alignment
 */
export function IconBlockComponent({ block }: IconBlockProps) {
  const { colors } = useTheme();
  const { icon, size = "md", color, alignment = "center" } = block;

  // Dynamically get the icon component
  const IconComponent = icon ? (TablerIcons as any)[icon] : null;

  if (!IconComponent) {
    return null;
  }

  const sizes = {
    sm: 16,
    md: 24,
    lg: 32,
    xl: 48,
  };

  const getAlignmentStyle = () => {
    switch (alignment) {
      case "left":
        return "flex-start" as const;
      case "right":
        return "flex-end" as const;
      case "center":
      default:
        return "center" as const;
    }
  };

  const styles = StyleSheet.create({
    container: {
      alignItems: getAlignmentStyle(),
      marginVertical: spacing.xs,
    },
  });

  // Convert Tailwind color class to actual color value
  const iconColor = getTailwindColor(color, colors);

  return (
    <View style={styles.container} accessibilityElementsHidden>
      <IconComponent size={sizes[size]} color={iconColor} />
    </View>
  );
}
