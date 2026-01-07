/**
 * Type definitions for Message Block Renderer
 * Defines all supported block types and their properties
 */

export type InlineStyle = "bold" | "italic" | "code";

export interface InlineText {
  text: string;
  styles?: InlineStyle[];
  href?: string;
}

export interface HeadingBlock {
  type: "heading";
  level: 1 | 2 | 3 | 4 | 5 | 6;
  content: InlineText[];
}

export interface ParagraphBlock {
  type: "paragraph";
  content: InlineText[];
}

export interface ImageBlock {
  type: "image";
  url: string;
  alt?: string;
  caption?: string;
  width?: number;
  height?: number;
}

export interface ButtonBlock {
  type: "button";
  text: string;
  url?: string;
  action?: string;
  variant?: "default" | "outline" | "secondary";
}

export interface DividerBlock {
  type: "divider";
  style?: "solid" | "dashed" | "dotted";
}

export interface ListItemBlock {
  content: InlineText[];
  items?: ListItemBlock[];
}

export interface ListBlock {
  type: "list";
  ordered: boolean;
  items: ListItemBlock[];
}

export interface QuoteBlock {
  type: "quote";
  content: InlineText[];
  author?: string;
}

export type MessageBlock =
  | HeadingBlock
  | ParagraphBlock
  | ImageBlock
  | ButtonBlock
  | DividerBlock
  | ListBlock
  | QuoteBlock;

export interface MessageBlockRendererProps {
  blocks: MessageBlock[];
  onLinkPress?: (url: string) => void;
  onButtonPress?: (action: string, url?: string) => void;
  style?: any;
}
