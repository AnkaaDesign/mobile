export type BlockType =
  | 'heading1'
  | 'heading2'
  | 'heading3'
  | 'paragraph'
  | 'image'
  | 'button'
  | 'divider'
  | 'list'
  | 'quote'
  | 'spacer'
  | 'icon'
  | 'row';

export interface TextStyle {
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  link?: string;
}

export interface BaseBlock {
  id: string;
  type: BlockType;
}

export interface TextBlock extends BaseBlock {
  type: 'heading1' | 'heading2' | 'heading3' | 'paragraph' | 'quote';
  content: string;
  styles?: TextStyle[];
  fontSize?: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl';
  fontWeight?: 'normal' | 'medium' | 'semibold' | 'bold';
}

export type ImageSizePreset =
  | '64px' | '128px' | '256px' | '384px'
  | '25%' | '50%' | '75%' | '100%';

export interface ImageBlock extends BaseBlock {
  type: 'image';
  url: string;
  alt?: string;
  caption?: string;
  size?: ImageSizePreset;
  customWidth?: string;
  alignment?: 'left' | 'center' | 'right';
}

export interface ButtonBlock extends BaseBlock {
  type: 'button';
  text: string;
  url: string;
  variant?: 'default' | 'outline' | 'secondary';
  alignment?: 'left' | 'center' | 'right';
}

export interface DividerBlock extends BaseBlock {
  type: 'divider';
}

export interface SpacerBlock extends BaseBlock {
  type: 'spacer';
  height?: 'sm' | 'md' | 'lg' | 'xl';
}

export interface ListBlock extends BaseBlock {
  type: 'list';
  items: string[];
  ordered?: boolean;
}

export interface IconBlock extends BaseBlock {
  type: 'icon';
  icon: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: string;
  alignment?: 'left' | 'center' | 'right';
}

export interface RowBlock extends BaseBlock {
  type: 'row';
  blocks: ContentBlock[];
  columns?: 2 | 3 | 4;
  gap?: 'none' | 'sm' | 'md' | 'lg';
  verticalAlign?: 'top' | 'center' | 'bottom';
}

export type ContentBlock = TextBlock | ImageBlock | ButtonBlock | DividerBlock | SpacerBlock | ListBlock | IconBlock | RowBlock;
