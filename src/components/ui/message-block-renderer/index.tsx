import React from "react";
import { View, StyleSheet, Linking, Alert } from "react-native";
import { useRouter } from "expo-router";
import { useTheme } from "@/lib/theme";
import { spacing } from "@/constants/design-system";
import { HeadingBlockComponent } from "./heading-block";
import { ParagraphBlockComponent } from "./paragraph-block";
import { ImageBlockComponent } from "./image-block";
import { ButtonBlockComponent } from "./button-block";
import { DividerBlockComponent } from "./divider-block";
import { ListBlockComponent } from "./list-block";
import { QuoteBlockComponent } from "./quote-block";
import { SpacerBlockComponent } from "./spacer-block";
import { IconBlockComponent } from "./icon-block";
import { RowBlockComponent } from "./row-block";
import { DecoratorBlockComponent } from "./decorator-block";
import { CompanyAssetBlockComponent } from "./company-asset-block";
import type { MessageBlock, MessageBlockRendererProps } from "./types";

/**
 * Main MessageBlockRenderer Component
 *
 * Renders a list of message content blocks with support for:
 * - Headings (h1-h6) with fontSize and fontWeight options
 * - Paragraphs with inline formatting (bold, italic, links) and fontSize/fontWeight
 * - Images with size presets, alignment, and captions (matching web behavior)
 * - Interactive buttons with multiple variants
 * - Dividers with style options
 * - Spacers with configurable height
 * - Ordered and unordered lists (with nesting)
 * - Blockquotes with author attribution and fontSize/fontWeight
 * - Icons using Tabler icons with size and color options
 * - Row layouts for side-by-side blocks
 *
 * Features:
 * - Fully typed with TypeScript
 * - Responsive design that adapts to screen sizes
 * - Theme-aware styling (supports light/dark modes)
 * - Proper link handling (internal navigation and external URLs)
 * - Accessible components with proper ARIA labels
 * - Beautiful styling following the app's design system
 * - Feature parity with web message rendering
 *
 * @example
 * ```tsx
 * const blocks: MessageBlock[] = [
 *   {
 *     type: "heading",
 *     level: 1,
 *     content: [{ text: "Welcome!" }]
 *   },
 *   {
 *     type: "paragraph",
 *     content: [
 *       { text: "This is " },
 *       { text: "bold text", styles: ["bold"] },
 *       { text: " and " },
 *       { text: "a link", href: "https://example.com" }
 *     ]
 *   }
 * ];
 *
 * <MessageBlockRenderer blocks={blocks} />
 * ```
 */
export function MessageBlockRenderer({
  blocks,
  onLinkPress,
  onButtonPress,
  style,
}: MessageBlockRendererProps) {
  const { colors } = useTheme();
  const router = useRouter();

  /**
   * Handles link press events
   * - Internal app links are routed via expo-router
   * - External URLs are opened in the system browser
   */
  const handleLinkPress = React.useCallback(
    async (url: string) => {
      // If custom handler is provided, use it
      if (onLinkPress) {
        onLinkPress(url);
        return;
      }

      try {
        // Check if it's an internal route (starts with /)
        if (url.startsWith("/")) {
          router.push(url as any);
        } else {
          // External URL - check if it can be opened
          const supported = await Linking.canOpenURL(url);

          if (supported) {
            await Linking.openURL(url);
          } else {
            Alert.alert(
              "Cannot open link",
              `The URL ${url} is not supported on this device.`
            );
          }
        }
      } catch (error) {
        console.error("Failed to open link:", error);
        Alert.alert(
          "Error",
          "Failed to open the link. Please try again later."
        );
      }
    },
    [onLinkPress, router]
  );

  /**
   * Handles button press events
   * - Executes custom action handlers
   * - Falls back to link navigation if URL is provided
   */
  const handleButtonPress = React.useCallback(
    (action: string, url?: string) => {
      if (onButtonPress) {
        onButtonPress(action, url);
      } else if (url) {
        handleLinkPress(url);
      }
    },
    [onButtonPress, handleLinkPress]
  );

  /**
   * Renders the inner content for a single block (no wrapper padding).
   */
  const renderBlockInner = (block: MessageBlock, index: number) => {
    switch (block.type) {
      case "heading":
        return (
          <HeadingBlockComponent
            block={block}
            onLinkPress={handleLinkPress}
          />
        );

      case "paragraph":
        return (
          <ParagraphBlockComponent
            block={block}
            onLinkPress={handleLinkPress}
          />
        );

      case "image":
        return <ImageBlockComponent block={block} />;

      case "button":
        return (
          <ButtonBlockComponent
            block={block}
            onButtonPress={handleButtonPress}
          />
        );

      case "divider":
        return <DividerBlockComponent block={block} />;

      case "list":
        return (
          <ListBlockComponent
            block={block}
            onLinkPress={handleLinkPress}
          />
        );

      case "quote":
        return (
          <QuoteBlockComponent
            block={block}
            onLinkPress={handleLinkPress}
          />
        );

      case "spacer":
        return <SpacerBlockComponent block={block} />;

      case "icon":
        return <IconBlockComponent block={block} />;

      case "row":
        return (
          <RowBlockComponent
            block={block}
            onLinkPress={handleLinkPress}
            onButtonPress={handleButtonPress}
          />
        );

      case "decorator":
        return <DecoratorBlockComponent block={block} />;

      case "company-asset":
        return <CompanyAssetBlockComponent block={block} />;

      default:
        // Type guard to ensure all cases are handled
        const _exhaustiveCheck: never = block;
        console.warn("Unknown block type:", _exhaustiveCheck);
        return null;
    }
  };

  /**
   * Wraps each block with appropriate padding:
   * - decorator  → edge-to-edge (no padding)
   * - company-asset → paddingVertical: 20, paddingHorizontal: 14
   * - all others → paddingVertical: 8,  paddingHorizontal: 14
   */
  const renderBlock = (block: MessageBlock, index: number) => {
    const inner = renderBlockInner(block, index);
    if (!inner) return null;

    if (block.type === "decorator") {
      return (
        <View key={index} style={blockStyles.decoratorWrapper}>
          {inner}
        </View>
      );
    }

    if (block.type === "company-asset") {
      return (
        <View key={index} style={blockStyles.companyAssetWrapper}>
          {inner}
        </View>
      );
    }

    if (block.type === "divider") {
      return (
        <View key={index} style={blockStyles.dividerWrapper}>
          {inner}
        </View>
      );
    }

    return (
      <View key={index} style={blockStyles.defaultWrapper}>
        {inner}
      </View>
    );
  };

  const blockStyles = StyleSheet.create({
    decoratorWrapper: {
      width: "100%",
      marginHorizontal: 0,
      paddingHorizontal: 0,
    },
    companyAssetWrapper: {
      paddingVertical: 8,
      paddingHorizontal: 14,
    },
    dividerWrapper: {
      paddingVertical: 2,
      paddingHorizontal: 14,
    },
    defaultWrapper: {
      paddingVertical: 8,
      paddingHorizontal: 14,
    },
  });

  const styles = StyleSheet.create({
    container: {
      paddingVertical: spacing.xs,
    },
  });

  return (
    <View style={[styles.container, style]}>
      {blocks.map((block, index) => renderBlock(block, index))}
    </View>
  );
}

// Export types for external use
export type {
  MessageBlock,
  MessageBlockRendererProps,
  HeadingBlock,
  ParagraphBlock,
  ImageBlock,
  ImageSizePreset,
  ImageAlignment,
  ButtonBlock,
  DividerBlock,
  SpacerBlock,
  ListBlock,
  QuoteBlock,
  IconBlock,
  RowBlock,
  InlineText,
  InlineStyle,
  ListItemBlock,
  FontSize,
  FontWeight,
  DecoratorBlock,
  CompanyAssetBlock,
} from "./types";
