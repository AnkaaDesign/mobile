import React from "react";
import { View, StyleSheet } from "react-native";
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

  // Match web spacer heights: sm=h-4(16px), md=h-8(32px), lg=h-12(48px), xl=h-16(64px)
  const heights = {
    sm: 16,
    md: 32,
    lg: 48,
    xl: 64,
  };

  const styles = StyleSheet.create({
    spacer: {
      height: heights[height],
    },
  });

  return <View style={styles.spacer} accessibilityElementsHidden />;
}
