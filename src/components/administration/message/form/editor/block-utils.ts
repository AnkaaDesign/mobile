import type { BlockType, ContentBlock } from './types';

export function generateBlockId(): string {
  return `block-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function createEmptyBlock(type: BlockType): ContentBlock {
  const id = generateBlockId();

  switch (type) {
    case 'heading1':
      return { id, type, content: '', fontSize: 'lg', fontWeight: 'semibold' };
    case 'heading2':
      return { id, type, content: '', fontSize: '2xl', fontWeight: 'semibold' };
    case 'heading3':
      return { id, type, content: '', fontSize: 'xl', fontWeight: 'medium' };
    case 'paragraph':
      return { id, type, content: '', fontSize: 'base', fontWeight: 'normal' };
    case 'quote':
      return { id, type, content: '', fontSize: 'lg', fontWeight: 'normal' };
    case 'image':
      return { id, type, url: '', alignment: 'center' };
    case 'button':
      return { id, type, text: '', url: '', variant: 'default', alignment: 'center' };
    case 'divider':
      return { id, type };
    case 'spacer':
      return { id, type, height: 'md' };
    case 'list':
      return { id, type, items: [''], ordered: false };
    case 'icon':
      return { id, type, icon: 'IconCheck', size: 'md', color: 'text-foreground', alignment: 'center' };
    case 'row':
      return { id, type, blocks: [], columns: 2, gap: 'md', verticalAlign: 'top' };
    default:
      return { id, type: 'paragraph', content: '', fontSize: 'base', fontWeight: 'normal' };
  }
}

export const BLOCK_TYPE_CONFIG: Array<{
  type: BlockType;
  label: string;
  iconName: string;
  description: string;
}> = [
  { type: 'heading1', label: 'Título 1', iconName: 'IconH1', description: 'Título principal' },
  { type: 'heading2', label: 'Título 2', iconName: 'IconH2', description: 'Subtítulo' },
  { type: 'heading3', label: 'Título 3', iconName: 'IconH3', description: 'Título menor' },
  { type: 'paragraph', label: 'Parágrafo', iconName: 'IconTextSize', description: 'Texto normal' },
  { type: 'image', label: 'Imagem', iconName: 'IconPhoto', description: 'Adicionar uma imagem' },
  { type: 'button', label: 'Botão', iconName: 'IconClick', description: 'Botão de ação com link' },
  { type: 'divider', label: 'Divisor', iconName: 'IconMinus', description: 'Linha horizontal' },
  { type: 'spacer', label: 'Espaço', iconName: 'IconSpacingVertical', description: 'Espaçamento vertical' },
  { type: 'list', label: 'Lista', iconName: 'IconList', description: 'Lista de itens' },
  { type: 'quote', label: 'Citação', iconName: 'IconQuote', description: 'Bloco de citação' },
  { type: 'icon', label: 'Ícone', iconName: 'IconStar', description: 'Ícone decorativo' },
  { type: 'row', label: 'Linha', iconName: 'IconColumns', description: 'Componentes lado a lado' },
];
