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

  // Use provided color or default to foreground
  const iconColor = color || colors.foreground;

  return (
    <View style={styles.container} accessibilityElementsHidden>
      <IconComponent size={sizes[size]} color={iconColor} />
    </View>
  );
}
