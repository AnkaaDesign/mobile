import React from "react";
import { Text, StyleSheet, Pressable, TextStyle } from "react-native";
import { useTheme } from "@/lib/theme";
import { fontSize, fontWeight } from "@/constants/design-system";
import type { InlineText } from "./types";

interface InlineTextRendererProps {
  content: InlineText[];
  onLinkPress?: (url: string) => void;
  baseStyle?: TextStyle;
}

/**
 * Renders inline text with formatting (bold, italic, links)
 */
export function InlineTextRenderer({
  content,
  onLinkPress,
  baseStyle,
}: InlineTextRendererProps) {
  const { colors } = useTheme();

  const styles = StyleSheet.create({
    base: {
      fontSize: fontSize.base,
      color: colors.foreground,
      ...baseStyle,
    },
    bold: {
      fontWeight: fontWeight.bold as any,
    },
    italic: {
      fontStyle: "italic",
    },
    code: {
      fontFamily: "monospace",
      backgroundColor: colors.muted,
      paddingHorizontal: 4,
      paddingVertical: 2,
      borderRadius: 4,
      fontSize: fontSize.sm,
    },
    link: {
      color: colors.primary,
      textDecorationLine: "underline",
    },
  });

  return (
    <Text style={styles.base}>
      {content.map((inline, index) => {
        const textStyles: TextStyle[] = [styles.base];

        // Apply inline styles
        if (inline.styles) {
          inline.styles.forEach((style) => {
            if (style === "bold") textStyles.push(styles.bold);
            if (style === "italic") textStyles.push(styles.italic);
            if (style === "code") textStyles.push(styles.code);
          });
        }

        // Apply link style
        if (inline.href) {
          textStyles.push(styles.link);
        }

        // If it's a link, make it pressable
        if (inline.href && onLinkPress) {
          return (
            <Pressable
              key={index}
              onPress={() => onLinkPress(inline.href!)}
              style={({ pressed }) => ({
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <Text style={StyleSheet.flatten(textStyles)}>{inline.text}</Text>
            </Pressable>
          );
        }

        return (
          <Text key={index} style={StyleSheet.flatten(textStyles)}>
            {inline.text}
          </Text>
        );
      })}
    </Text>
  );
}
