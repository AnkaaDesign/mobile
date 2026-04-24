import React from "react";
import { View, StyleSheet } from "react-native";
import { useTheme } from "@/lib/theme";
import { fontSize, fontWeight, lineHeight, spacing } from "@/constants/design-system";
import { InlineTextRenderer } from "./inline-text-renderer";
import type { HeadingBlock } from "./types";

interface HeadingBlockProps {
  block: HeadingBlock;
  onLinkPress?: (url: string) => void;
}

/**
 * Renders heading blocks (h1-h6)
 */
export function HeadingBlockComponent({ block, onLinkPress }: HeadingBlockProps) {
  const { colors } = useTheme();

  const getHeadingStyle = (level: number) => {
    // Font sizes match the web preview dialog:
    //   heading1 → 28px bold, heading2 → 22px semibold, heading3 → 18px medium
    const headingStyles = {
      1: {
        fontSize: 28,
        lineHeight: 36,
        fontWeight: fontWeight.bold,
        marginTop: 0,
        marginBottom: 0,
      },
      2: {
        fontSize: 22,
        lineHeight: 30,
        fontWeight: fontWeight.semibold,
        marginTop: 0,
        marginBottom: 0,
      },
      3: {
        fontSize: 18,
        lineHeight: 26,
        fontWeight: fontWeight.medium,
        marginTop: 0,
        marginBottom: 0,
      },
      4: {
        fontSize: fontSize.lg,
        lineHeight: lineHeight.lg,
        fontWeight: fontWeight.semibold,
        marginTop: 0,
        marginBottom: 0,
      },
      5: {
        fontSize: fontSize.base,
        lineHeight: lineHeight.base,
        fontWeight: fontWeight.semibold,
        marginTop: 0,
        marginBottom: 0,
      },
      6: {
        fontSize: fontSize.sm,
        lineHeight: lineHeight.sm,
        fontWeight: fontWeight.semibold,
        marginTop: 0,
        marginBottom: 0,
      },
    };

    return headingStyles[level as keyof typeof headingStyles];
  };

  const headingStyle = getHeadingStyle(block.level);

  // Allow per-block fontSize/fontWeight overrides (set in editor)
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

  const resolvedFontSize = block.fontSize
    ? fontSizeMap[block.fontSize] ?? headingStyle.fontSize
    : headingStyle.fontSize;
  const resolvedFontWeight = block.fontWeight
    ? fontWeightMap[block.fontWeight] ?? headingStyle.fontWeight
    : headingStyle.fontWeight;

  const styles = StyleSheet.create({
    container: {
      marginTop: headingStyle.marginTop,
      marginBottom: headingStyle.marginBottom,
    },
  });

  return (
    <View style={styles.container}>
      <InlineTextRenderer
        content={block.content}
        onLinkPress={onLinkPress}
        baseStyle={{
          fontSize: resolvedFontSize,
          lineHeight: headingStyle.lineHeight,
          fontWeight: resolvedFontWeight as any,
          color: colors.foreground,
        }}
      />
    </View>
  );
}
