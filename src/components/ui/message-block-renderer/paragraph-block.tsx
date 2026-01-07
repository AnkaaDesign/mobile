import React from "react";
import { View, StyleSheet } from "react-native";
import { useTheme } from "@/lib/theme";
import { fontSize, lineHeight, spacing } from "@/constants/design-system";
import { InlineTextRenderer } from "./inline-text-renderer";
import type { ParagraphBlock } from "./types";

interface ParagraphBlockProps {
  block: ParagraphBlock;
  onLinkPress?: (url: string) => void;
}

/**
 * Renders paragraph blocks with inline formatting
 */
export function ParagraphBlockComponent({
  block,
  onLinkPress,
}: ParagraphBlockProps) {
  const { colors } = useTheme();

  const styles = StyleSheet.create({
    container: {
      marginBottom: spacing.md,
    },
  });

  return (
    <View style={styles.container}>
      <InlineTextRenderer
        content={block.content}
        onLinkPress={onLinkPress}
        baseStyle={{
          fontSize: fontSize.base,
          lineHeight: lineHeight.base,
          color: colors.foreground,
        }}
      />
    </View>
  );
}
