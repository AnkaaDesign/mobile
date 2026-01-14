import React from "react";
import { View, StyleSheet } from "react-native";
import { spacing } from "@/constants/design-system";
import type { SpacerBlock } from "./types";

interface SpacerBlockProps {
  block: SpacerBlock;
}

/**
 * Renders a vertical spacer with configurable height
 * Matches web behavior with sm/md/lg/xl presets
 */
export function SpacerBlockComponent({ block }: SpacerBlockProps) {
  const { height = "md" } = block;

  const heights = {
    sm: spacing.md, // 16px
    md: spacing.xl, // 32px
    lg: spacing.xl * 1.5, // 48px
    xl: spacing.xl * 2, // 64px
  };

  const styles = StyleSheet.create({
    spacer: {
      height: heights[height],
    },
  });

  return <View style={styles.spacer} accessibilityElementsHidden />;
}
