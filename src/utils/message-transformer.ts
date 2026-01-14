/**
 * Message Content Transformer for Mobile
 *
 * Transforms message content from API format to renderer format
 * Handles both old format (content.blocks) and new format (content as array)
 */

import type {
  MessageBlock,
  HeadingBlock,
  ParagraphBlock,
  ImageBlock,
  ButtonBlock,
  DividerBlock,
  SpacerBlock,
  ListBlock,
  QuoteBlock,
  IconBlock,
  RowBlock,
  InlineText,
  ListItemBlock,
} from "@/components/ui/message-block-renderer/types";

/**
 * Converts plain text string to InlineText array
 * Handles simple text without formatting
 */
function textToInlineText(text: string | undefined): InlineText[] {
  if (!text) return [];
  return [{ text }];
}

/**
 * Converts InlineFormat (web format) to InlineText (mobile format)
 *
 * Web format: { type: 'text' | 'bold' | 'italic' | 'link', content: string, url?: string }
 * Mobile format: { text: string, styles?: ('bold' | 'italic' | 'code')[], href?: string }
 */
function convertInlineFormatToInlineText(
  content: any[] | string | undefined
): InlineText[] {
  if (!content) return [];

  // If content is a string, return as plain text
  if (typeof content === "string") {
    return [{ text: content }];
  }

  // If not an array, return empty
  if (!Array.isArray(content)) {
    return [];
  }

  return content.map((item): InlineText => {
    // Handle different inline format types from web/API
    if (typeof item === "string") {
      return { text: item };
    }

    // Handle web InlineFormat: { type: 'text' | 'bold' | 'italic' | 'link', content: string }
    if (item.type) {
      switch (item.type) {
        case "text":
          return { text: item.content || "" };
        case "bold":
          return { text: item.content || "", styles: ["bold"] };
        case "italic":
          return { text: item.content || "", styles: ["italic"] };
        case "link":
          return { text: item.content || "", href: item.url };
        default:
          return { text: item.content || item.text || "" };
      }
    }

    // Handle mobile InlineText format (already correct)
    if (item.text !== undefined) {
      return item as InlineText;
    }

    // Fallback
    return { text: String(item) };
  });
}

/**
 * Converts list items from various formats to mobile ListItemBlock format
 */
function convertListItems(items: any[]): ListItemBlock[] {
  if (!items || !Array.isArray(items)) return [];

  return items.map((item): ListItemBlock => {
    // Handle string items
    if (typeof item === "string") {
      return { content: [{ text: item }] };
    }

    // Handle items with content property (InlineFormat[] or string)
    if (item.content) {
      return {
        content: convertInlineFormatToInlineText(item.content),
        items: item.items ? convertListItems(item.items) : undefined,
      };
    }

    // Handle plain text in any other format
    return { content: [{ text: String(item) }] };
  });
}

/**
 * Transforms a single block from API format to mobile renderer format
 */
function transformBlock(block: any): MessageBlock | null {
  console.log('[transformBlock] Processing block:', block?.type, block);
  if (!block || !block.type) {
    console.log('[transformBlock] Block is null or missing type');
    return null;
  }

  switch (block.type) {
    case "heading":
    case "heading1":
    case "heading2":
    case "heading3":
    case "heading4":
    case "heading5":
    case "heading6": {
      // Determine heading level
      let level: 1 | 2 | 3 | 4 | 5 | 6 = 1;
      if (block.level) {
        level = Math.min(6, Math.max(1, block.level)) as 1 | 2 | 3 | 4 | 5 | 6;
      } else if (block.type.startsWith("heading")) {
        const typeLevel = parseInt(block.type.replace("heading", ""), 10);
        if (!isNaN(typeLevel) && typeLevel >= 1 && typeLevel <= 6) {
          level = typeLevel as 1 | 2 | 3 | 4 | 5 | 6;
        }
      }

      return {
        type: "heading",
        level,
        content: convertInlineFormatToInlineText(block.content),
        id: block.id,
        fontSize: block.fontSize,
        fontWeight: block.fontWeight,
      } as HeadingBlock;
    }

    case "paragraph": {
      return {
        type: "paragraph",
        content: convertInlineFormatToInlineText(block.content),
        id: block.id,
        fontSize: block.fontSize,
        fontWeight: block.fontWeight,
      } as ParagraphBlock;
    }

    case "image": {
      return {
        type: "image",
        url: block.url,
        src: block.src,
        alt: block.alt,
        caption: block.caption,
        size: block.size,
        customWidth: block.customWidth,
        width: block.width,
        height: block.height,
        alignment: block.alignment,
        id: block.id,
      } as ImageBlock;
    }

    case "button": {
      return {
        type: "button",
        text: block.text || "",
        url: block.url,
        action: block.action,
        variant: block.variant || "default",
        disabled: block.disabled,
        id: block.id,
      } as ButtonBlock;
    }

    case "divider": {
      return {
        type: "divider",
        style: block.style || "solid",
        id: block.id,
      } as DividerBlock;
    }

    case "list": {
      return {
        type: "list",
        ordered: block.ordered || block.listType === "number" || false,
        items: convertListItems(block.items || []),
        id: block.id,
      } as ListBlock;
    }

    case "quote": {
      return {
        type: "quote",
        content: convertInlineFormatToInlineText(block.content),
        author: block.author,
        id: block.id,
        fontSize: block.fontSize,
        fontWeight: block.fontWeight,
      } as QuoteBlock;
    }

    case "callout": {
      // Convert callout to paragraph (like web does)
      return {
        type: "paragraph",
        content: convertInlineFormatToInlineText(block.content),
      } as ParagraphBlock;
    }

    case "spacer": {
      return {
        type: "spacer",
        height: block.height || "md",
        id: block.id,
      } as SpacerBlock;
    }

    case "icon": {
      return {
        type: "icon",
        icon: block.icon || "",
        size: block.size || "md",
        color: block.color,
        alignment: block.alignment || "center",
        id: block.id,
      } as IconBlock;
    }

    case "row": {
      // Transform nested blocks within the row
      const nestedBlocks: MessageBlock[] = [];
      if (block.blocks && Array.isArray(block.blocks)) {
        for (const nestedBlock of block.blocks) {
          const transformed = transformBlock(nestedBlock);
          if (transformed) {
            nestedBlocks.push(transformed);
          }
        }
      }
      return {
        type: "row",
        blocks: nestedBlocks,
        columns: block.columns,
        gap: block.gap || "md",
        verticalAlign: block.verticalAlign || "top",
        id: block.id,
      } as RowBlock;
    }

    default:
      console.warn("[message-transformer] Unknown block type:", block.type);
      return null;
  }
}

/**
 * Transforms message content from API response to mobile renderer format
 * Handles both old format (content.blocks) and new format (content as array)
 */
export function transformMessageContent(content: any): MessageBlock[] {
  // Debug logging - remove after fixing
  console.log('[transformMessageContent] Input content:', JSON.stringify(content, null, 2));
  console.log('[transformMessageContent] content type:', typeof content);
  console.log('[transformMessageContent] content.blocks:', content?.blocks);
  console.log('[transformMessageContent] Array.isArray(content):', Array.isArray(content));

  if (!content) {
    console.log('[transformMessageContent] Content is null/undefined, returning []');
    return [];
  }

  let blocks: any[] = [];

  // Handle different content formats
  if (content.blocks && Array.isArray(content.blocks)) {
    // New format: content is an object with blocks array
    console.log('[transformMessageContent] Using content.blocks format');
    blocks = content.blocks;
  } else if (Array.isArray(content)) {
    // Old format: content is directly an array
    console.log('[transformMessageContent] Using array format');
    blocks = content;
  } else {
    // Unknown content format
    console.warn("[message-transformer] Unknown content format:", typeof content, content);
    return [];
  }

  console.log('[transformMessageContent] Blocks to transform:', blocks.length, blocks);

  // Transform each block
  const result: MessageBlock[] = [];

  for (const block of blocks) {
    const transformed = transformBlock(block);
    if (transformed) {
      result.push(transformed);
    }
  }

  return result;
}

/**
 * Checks if content has blocks that can be rendered
 */
export function hasRenderableContent(content: any): boolean {
  const blocks = transformMessageContent(content);
  return blocks.length > 0;
}

/**
 * Extracts plain text from content blocks
 * Used as a fallback when blocks can't be rendered
 */
export function extractPlainTextFromContent(content: any): string {
  if (!content) return "";

  let blocks: any[] = [];

  // Handle different content formats
  if (content.blocks && Array.isArray(content.blocks)) {
    blocks = content.blocks;
  } else if (Array.isArray(content)) {
    blocks = content;
  } else {
    return "";
  }

  const textParts: string[] = [];

  for (const block of blocks) {
    if (!block) continue;

    // Extract text from various block types
    if (block.content) {
      if (typeof block.content === "string") {
        textParts.push(block.content);
      } else if (Array.isArray(block.content)) {
        // Handle InlineFormat array
        const inlineText = block.content
          .map((item: any) => {
            if (typeof item === "string") return item;
            if (item.text) return item.text;
            if (item.content) return item.content;
            return "";
          })
          .filter(Boolean)
          .join("");
        if (inlineText) textParts.push(inlineText);
      }
    }

    // Handle list items
    if (block.type === "list" && block.items && Array.isArray(block.items)) {
      for (const item of block.items) {
        if (typeof item === "string") {
          textParts.push(`• ${item}`);
        } else if (item.content) {
          const itemText = Array.isArray(item.content)
            ? item.content.map((c: any) => c.text || c.content || "").join("")
            : item.content;
          if (itemText) textParts.push(`• ${itemText}`);
        }
      }
    }

    // Handle button text
    if (block.type === "button" && block.text) {
      textParts.push(block.text);
    }

    // Handle nested row blocks
    if (block.type === "row" && block.blocks && Array.isArray(block.blocks)) {
      const nestedText = extractPlainTextFromContent({ blocks: block.blocks });
      if (nestedText) textParts.push(nestedText);
    }
  }

  return textParts.join("\n\n");
}
