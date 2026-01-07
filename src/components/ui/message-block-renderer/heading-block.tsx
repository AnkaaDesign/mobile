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
    const headingStyles = {
      1: {
        fontSize: fontSize["3xl"],
        lineHeight: lineHeight["3xl"],
        fontWeight: fontWeight.bold,
        marginTop: spacing.lg,
        marginBottom: spacing.md,
      },
      2: {
        fontSize: fontSize["2xl"],
        lineHeight: lineHeight["2xl"],
        fontWeight: fontWeight.bold,
        marginTop: spacing.lg,
        marginBottom: spacing.sm,
      },
      3: {
        fontSize: fontSize.xl,
        lineHeight: lineHeight.xl,
        fontWeight: fontWeight.semibold,
        marginTop: spacing.md,
        marginBottom: spacing.sm,
      },
      4: {
        fontSize: fontSize.lg,
        lineHeight: lineHeight.lg,
        fontWeight: fontWeight.semibold,
        marginTop: spacing.md,
        marginBottom: spacing.xs,
      },
      5: {
        fontSize: fontSize.base,
        lineHeight: lineHeight.base,
        fontWeight: fontWeight.semibold,
        marginTop: spacing.sm,
        marginBottom: spacing.xs,
      },
      6: {
        fontSize: fontSize.sm,
        lineHeight: lineHeight.sm,
        fontWeight: fontWeight.semibold,
        marginTop: spacing.sm,
        marginBottom: spacing.xs,
      },
    };

    return headingStyles[level as keyof typeof headingStyles];
  };

  const headingStyle = getHeadingStyle(block.level);

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
          fontSize: headingStyle.fontSize,
          lineHeight: headingStyle.lineHeight,
          fontWeight: headingStyle.fontWeight as any,
          color: colors.foreground,
        }}
      />
    </View>
  );
}
