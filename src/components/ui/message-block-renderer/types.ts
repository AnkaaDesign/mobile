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

export type FontSize = "xs" | "sm" | "base" | "lg" | "xl" | "2xl" | "3xl";
export type FontWeight = "normal" | "medium" | "semibold" | "bold";

export interface HeadingBlock {
  type: "heading";
  level: 1 | 2 | 3 | 4 | 5 | 6;
  content: InlineText[];
  id?: string;
  fontSize?: FontSize;
  fontWeight?: FontWeight;
}

export interface ParagraphBlock {
  type: "paragraph";
  content: InlineText[];
  id?: string;
  fontSize?: FontSize;
  fontWeight?: FontWeight;
}

export type ImageSizePreset =
  | "64px"
  | "128px"
  | "256px"
  | "384px"
  | "25%"
  | "50%"
  | "75%"
  | "100%";

export type ImageAlignment = "left" | "center" | "right";

export interface ImageBlock {
  type: "image";
  url?: string;
  src?: string; // Support both url and src like web
  alt?: string;
  caption?: string;
  size?: ImageSizePreset;
  customWidth?: string;
  width?: number;
  height?: number;
  alignment?: ImageAlignment;
  id?: string;
}

export interface ButtonBlock {
  type: "button";
  text: string;
  url?: string;
  action?: string;
  variant?: "default" | "outline" | "secondary" | "ghost" | "destructive";
  disabled?: boolean;
  id?: string;
}

export interface DividerBlock {
  type: "divider";
  style?: "solid" | "dashed" | "dotted";
  id?: string;
}

export interface SpacerBlock {
  type: "spacer";
  height?: "sm" | "md" | "lg" | "xl";
  id?: string;
}

export interface ListItemBlock {
  content: InlineText[];
  items?: ListItemBlock[];
}

export interface ListBlock {
  type: "list";
  ordered: boolean;
  items: ListItemBlock[];
  id?: string;
}

export interface QuoteBlock {
  type: "quote";
  content: InlineText[];
  author?: string;
  id?: string;
  fontSize?: FontSize;
  fontWeight?: FontWeight;
}

export interface IconBlock {
  type: "icon";
  icon: string; // Icon name
  size?: "sm" | "md" | "lg" | "xl";
  color?: string;
  alignment?: "left" | "center" | "right";
  id?: string;
}

export interface RowBlock {
  type: "row";
  blocks: MessageBlock[];
  columns?: 2 | 3 | 4;
  gap?: "none" | "sm" | "md" | "lg";
  verticalAlign?: "top" | "center" | "bottom";
  id?: string;
}

export type MessageBlock =
  | HeadingBlock
  | ParagraphBlock
  | ImageBlock
  | ButtonBlock
  | DividerBlock
  | SpacerBlock
  | ListBlock
  | QuoteBlock
  | IconBlock
  | RowBlock;

export interface MessageBlockRendererProps {
  blocks: MessageBlock[];
  onLinkPress?: (url: string) => void;
  onButtonPress?: (action: string, url?: string) => void;
  style?: any;
}
