import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "@/lib/theme";
import { fontSize, lineHeight, spacing, borderRadius } from "@/constants/design-system";
import { InlineTextRenderer } from "./inline-text-renderer";
import type { QuoteBlock } from "./types";

interface QuoteBlockProps {
  block: QuoteBlock;
  onLinkPress?: (url: string) => void;
}

/**
 * Renders quote/blockquote blocks with optional author attribution
 */
export function QuoteBlockComponent({ block, onLinkPress }: QuoteBlockProps) {
  const { colors, isDark } = useTheme();

  const styles = StyleSheet.create({
    container: {
      marginVertical: spacing.md,
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
            fontSize: fontSize.base,
            lineHeight: lineHeight.base,
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
