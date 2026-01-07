import React from "react";
import { View, StyleSheet } from "react-native";
import { useTheme } from "@/lib/theme";
import { spacing } from "@/constants/design-system";
import type { DividerBlock } from "./types";

interface DividerBlockProps {
  block: DividerBlock;
}

/**
 * Renders divider/separator blocks
 */
export function DividerBlockComponent({ block }: DividerBlockProps) {
  const { colors } = useTheme();

  const getBorderStyle = (style?: string) => {
    switch (style) {
      case "dashed":
        return "dashed";
      case "dotted":
        return "dotted";
      default:
        return "solid";
    }
  };

  const styles = StyleSheet.create({
    container: {
      marginVertical: spacing.md,
    },
    divider: {
      height: 1,
      backgroundColor: colors.border,
      borderStyle: getBorderStyle(block.style) as any,
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.divider} />
    </View>
  );
}
