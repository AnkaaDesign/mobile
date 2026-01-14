import React from "react";
import { View, StyleSheet, useWindowDimensions } from "react-native";
import { spacing } from "@/constants/design-system";
import type { RowBlock, MessageBlock } from "./types";

// Import individual block components to avoid circular dependency
import { HeadingBlockComponent } from "./heading-block";
import { ParagraphBlockComponent } from "./paragraph-block";
import { ImageBlockComponent } from "./image-block";
import { ButtonBlockComponent } from "./button-block";
import { DividerBlockComponent } from "./divider-block";
import { ListBlockComponent } from "./list-block";
import { QuoteBlockComponent } from "./quote-block";
import { SpacerBlockComponent } from "./spacer-block";
import { IconBlockComponent } from "./icon-block";

interface RowBlockProps {
  block: RowBlock;
  onLinkPress?: (url: string) => void;
  onButtonPress?: (action: string, url?: string) => void;
}

/**
 * Renders a row of blocks side-by-side
 * Stacks vertically on narrow screens, horizontal on wider screens
 */
export function RowBlockComponent({
  block,
  onLinkPress,
  onButtonPress,
}: RowBlockProps) {
  const { width: screenWidth } = useWindowDimensions();
  const { blocks = [], columns, gap = "md", verticalAlign = "top" } = block;

  // Stack vertically on narrow screens (< 500px)
  const isHorizontal = screenWidth >= 500;

  const gaps = {
    none: 0,
    sm: spacing.sm,
    md: spacing.md,
    lg: spacing.lg,
  };

  const getVerticalAlignment = () => {
    switch (verticalAlign) {
      case "top":
        return "flex-start" as const;
      case "center":
        return "center" as const;
      case "bottom":
        return "flex-end" as const;
      default:
        return "flex-start" as const;
    }
  };

  const styles = StyleSheet.create({
    container: {
      flexDirection: isHorizontal ? "row" : "column",
      gap: gaps[gap],
      alignItems: isHorizontal ? getVerticalAlignment() : "stretch",
      marginVertical: spacing.sm,
    },
    blockWrapper: {
      flex: isHorizontal ? 1 : undefined,
      minWidth: 0,
    },
    iconWrapper: {
      flex: undefined,
      alignSelf: isHorizontal ? getVerticalAlignment() : "flex-start",
    },
    buttonWrapper: {
      flex: undefined,
      alignSelf: isHorizontal ? getVerticalAlignment() : "flex-start",
    },
  });

  /**
   * Renders individual nested block
   */
  const renderNestedBlock = (nestedBlock: MessageBlock, index: number) => {
    const isIconBlock = nestedBlock.type === "icon";
    const isButtonBlock = nestedBlock.type === "button";

    const wrapperStyle = isIconBlock
      ? styles.iconWrapper
      : isButtonBlock
        ? styles.buttonWrapper
        : styles.blockWrapper;

    return (
      <View
        key={nestedBlock.id || `row-block-${index}`}
        style={wrapperStyle}
      >
        {renderBlockContent(nestedBlock, index)}
      </View>
    );
  };

  /**
   * Renders block content by type
   */
  const renderBlockContent = (nestedBlock: MessageBlock, index: number) => {
    switch (nestedBlock.type) {
      case "heading":
        return (
          <HeadingBlockComponent
            block={nestedBlock}
            onLinkPress={onLinkPress}
          />
        );
      case "paragraph":
        return (
          <ParagraphBlockComponent
            block={nestedBlock}
            onLinkPress={onLinkPress}
          />
        );
      case "image":
        return <ImageBlockComponent block={nestedBlock} />;
      case "button":
        return (
          <ButtonBlockComponent
            block={nestedBlock}
            onButtonPress={onButtonPress}
          />
        );
      case "divider":
        return <DividerBlockComponent block={nestedBlock} />;
      case "list":
        return (
          <ListBlockComponent block={nestedBlock} onLinkPress={onLinkPress} />
        );
      case "quote":
        return (
          <QuoteBlockComponent block={nestedBlock} onLinkPress={onLinkPress} />
        );
      case "spacer":
        return <SpacerBlockComponent block={nestedBlock} />;
      case "icon":
        return <IconBlockComponent block={nestedBlock} />;
      case "row":
        // Recursive rendering for nested rows
        return (
          <RowBlockComponent
            block={nestedBlock}
            onLinkPress={onLinkPress}
            onButtonPress={onButtonPress}
          />
        );
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      {blocks.map((nestedBlock, index) => renderNestedBlock(nestedBlock, index))}
    </View>
  );
}
