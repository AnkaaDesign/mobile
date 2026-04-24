import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "@/lib/theme";
import { fontSize, fontWeight, lineHeight, spacing, borderRadius } from "@/constants/design-system";
import { InlineTextRenderer } from "./inline-text-renderer";
import type { QuoteBlock } from "./types";

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

interface QuoteBlockProps {
  block: QuoteBlock;
  onLinkPress?: (url: string) => void;
}

/**
 * Renders quote/blockquote blocks with optional author attribution
 */
export function QuoteBlockComponent({ block, onLinkPress }: QuoteBlockProps) {
  const { colors, isDark } = useTheme();

  // Default quote size matches web preview: 15px italic
  const resolvedFontSize = block.fontSize
    ? fontSizeMap[block.fontSize] ?? 15
    : 15;
  const resolvedFontWeight = block.fontWeight
    ? fontWeightMap[block.fontWeight] ?? fontWeight.normal
    : fontWeight.normal;

  const styles = StyleSheet.create({
    container: {
      marginVertical: 0,
    },
    quoteContainer: {
      borderLeftWidth: 4,
      borderLeftColor: colors.primary,
      backgroundColor: isDark
        ? `${colors.muted}40`
        : `${colors.muted}80`,
      paddingLeft: spacing.md,
      paddingRight: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: borderRadius.md,
    },
    quoteContent: {
      fontStyle: "italic",
    },
    author: {
      marginTop: spacing.xs,
      fontSize: fontSize.sm,
      lineHeight: lineHeight.sm,
      color: colors.mutedForeground,
      fontStyle: "normal",
      textAlign: "right",
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.quoteContainer}>
        <InlineTextRenderer
          content={block.content}
          onLinkPress={onLinkPress}
          baseStyle={{
            fontSize: resolvedFontSize,
            lineHeight: lineHeight.base,
            fontWeight: resolvedFontWeight as any,
            color: colors.foreground,
            fontStyle: "italic",
          }}
        />
        {block.author && (
          <Text style={styles.author}>— {block.author}</Text>
        )}
      </View>
    </View>
  );
}
