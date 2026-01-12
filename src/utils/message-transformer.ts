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
  ListBlock,
  QuoteBlock,
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
  if (!block || !block.type) return null;

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
      } as HeadingBlock;
    }

    case "paragraph": {
      return {
        type: "paragraph",
        content: convertInlineFormatToInlineText(block.content),
      } as ParagraphBlock;
    }

    case "image": {
      return {
        type: "image",
        url: block.url || block.src || "",
        alt: block.alt,
        caption: block.caption,
        width: block.width,
        height: block.height,
      } as ImageBlock;
    }

    case "button": {
      return {
        type: "button",
        text: block.text || "",
        url: block.url,
        action: block.action,
        variant: block.variant || "default",
      } as ButtonBlock;
    }

    case "divider": {
      return {
        type: "divider",
        style: block.style || "solid",
      } as DividerBlock;
    }

    case "list": {
      return {
        type: "list",
        ordered: block.ordered || block.listType === "number" || false,
        items: convertListItems(block.items || []),
      } as ListBlock;
    }

    case "quote": {
      return {
        type: "quote",
        content: convertInlineFormatToInlineText(block.content),
        author: block.author,
      } as QuoteBlock;
    }

    case "spacer":
      // Skip spacer blocks (not supported in mobile renderer)
      return null;

    case "icon":
      // Skip icon blocks (not supported in mobile renderer)
      return null;

    case "row":
      // For row blocks, we flatten the nested blocks
      if (block.blocks && Array.isArray(block.blocks)) {
        // Return null and handle separately to flatten
        return null;
      }
      return null;

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
  if (!content) {
    return [];
  }

  let blocks: any[] = [];

  // Handle different content formats
  if (content.blocks && Array.isArray(content.blocks)) {
    // New format: content is an object with blocks array
    blocks = content.blocks;
  } else if (Array.isArray(content)) {
    // Old format: content is directly an array
    blocks = content;
  } else {
    // Unknown content format
    console.warn("[message-transformer] Unknown content format:", typeof content);
    return [];
  }

  // Transform each block, handling row blocks specially to flatten them
  const result: MessageBlock[] = [];

  for (const block of blocks) {
    if (block.type === "row" && block.blocks && Array.isArray(block.blocks)) {
      // Flatten row blocks - transform nested blocks and add them directly
      for (const nestedBlock of block.blocks) {
        const transformed = transformBlock(nestedBlock);
        if (transformed) {
          result.push(transformed);
        }
      }
    } else {
      const transformed = transformBlock(block);
      if (transformed) {
        result.push(transformed);
      }
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
