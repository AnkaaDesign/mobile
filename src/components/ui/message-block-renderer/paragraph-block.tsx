import React from "react";
import { View, StyleSheet } from "react-native";
import { useTheme } from "@/lib/theme";
import { fontSize, fontWeight, lineHeight, spacing } from "@/constants/design-system";
import { InlineTextRenderer } from "./inline-text-renderer";
import type { ParagraphBlock } from "./types";

interface ParagraphBlockProps {
  block: ParagraphBlock;
  onLinkPress?: (url: string) => void;
}

const fontSizeMap: Record<string, number> = {
  xs: fontSize.xs,
  sm: fontSize.sm,
  base: fontSize.base,
  lg: fontSize.lg,
  xl: fontSize.xl,
  "2xl": fontSize["2xl"],
  "3xl": fontSize["3xl"],
};

const fontWeightMap: Record<string, string> = {
  normal: fontWeight.normal,
  medium: fontWeight.medium,
  semibold: fontWeight.semibold,
  bold: fontWeight.bold,
};

/**
 * Renders paragraph blocks with inline formatting
 */
export function ParagraphBlockComponent({
  block,
  onLinkPress,
}: ParagraphBlockProps) {
  const { colors } = useTheme();

  // Default paragraph size matches web preview: 15px
  const resolvedFontSize = block.fontSize
    ? fontSizeMap[block.fontSize] ?? 15
    : 15;
  const resolvedFontWeight = block.fontWeight
    ? fontWeightMap[block.fontWeight] ?? fontWeight.normal
    : fontWeight.normal;

  const styles = StyleSheet.create({
    container: {
      marginBottom: 0,
    },
  });

  return (
    <View style={styles.container}>
      <InlineTextRenderer
        content={block.content}
        onLinkPress={onLinkPress}
        baseStyle={{
          fontSize: resolvedFontSize,
          lineHeight: lineHeight.base,
          fontWeight: resolvedFontWeight as any,
          color: colors.foreground,
        }}
      />
    </View>
  );
}
