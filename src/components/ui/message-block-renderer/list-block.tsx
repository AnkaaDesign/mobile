import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "@/lib/theme";
import { fontSize, lineHeight, spacing } from "@/constants/design-system";
import { InlineTextRenderer } from "./inline-text-renderer";
import type { ListBlock, ListItemBlock } from "./types";

interface ListBlockProps {
  block: ListBlock;
  onLinkPress?: (url: string) => void;
}

interface ListItemProps {
  item: ListItemBlock;
  index: number;
  ordered: boolean;
  depth: number;
  onLinkPress?: (url: string) => void;
}

/**
 * Renders individual list items with support for nesting
 */
function ListItem({ item, index, ordered, depth, onLinkPress }: ListItemProps) {
  const { colors } = useTheme();

  const styles = StyleSheet.create({
    itemContainer: {
      flexDirection: "row",
      marginBottom: spacing.xs,
      paddingLeft: depth * spacing.md,
    },
    bullet: {
      width: 24,
      fontSize: fontSize.base,
      lineHeight: lineHeight.base,
      color: colors.foreground,
      marginRight: spacing.xs,
    },
    content: {
      flex: 1,
    },
    nestedList: {
      marginTop: spacing.xs,
    },
  });

  const getBullet = () => {
    if (ordered) {
      return `${index + 1}.`;
    }
    // Different bullet styles for different nesting levels
    switch (depth % 3) {
      case 0:
        return "•";
      case 1:
        return "◦";
      case 2:
        return "▪";
      default:
        return "•";
    }
  };

  return (
    <View>
      <View style={styles.itemContainer}>
        <Text style={styles.bullet}>{getBullet()}</Text>
        <View style={styles.content}>
          <InlineTextRenderer
            content={item.content}
            onLinkPress={onLinkPress}
            baseStyle={{
              fontSize: fontSize.base,
              lineHeight: lineHeight.base,
              color: colors.foreground,
            }}
          />
        </View>
      </View>
      {item.items && item.items.length > 0 && (
        <View style={styles.nestedList}>
          {item.items.map((nestedItem, nestedIndex) => (
            <ListItem
              key={nestedIndex}
              item={nestedItem}
              index={nestedIndex}
              ordered={ordered}
              depth={depth + 1}
              onLinkPress={onLinkPress}
            />
          ))}
        </View>
      )}
    </View>
  );
}

/**
 * Renders ordered or unordered list blocks
 */
export function ListBlockComponent({ block, onLinkPress }: ListBlockProps) {
  const styles = StyleSheet.create({
    container: {
      marginVertical: spacing.sm,
    },
  });

  return (
    <View style={styles.container}>
      {block.items.map((item, index) => (
        <ListItem
          key={index}
          item={item}
          index={index}
          ordered={block.ordered}
          depth={0}
          onLinkPress={onLinkPress}
        />
      ))}
    </View>
  );
}
