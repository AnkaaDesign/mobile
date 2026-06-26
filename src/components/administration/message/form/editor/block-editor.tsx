import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '@/lib/theme';
import { spacing, borderRadius } from '@/constants/design-system';
import { Card, CardContent } from '@/components/ui/card';
import { ThemedText } from '@/components/ui/themed-text';
import {
  IconTrash, IconChevronUp, IconChevronDown,
  IconH1, IconH2, IconH3, IconTextSize, IconPhoto, IconClick,
  IconMinus, IconSpacingVertical, IconList, IconQuote, IconStar,
  IconColumns, IconPalette, IconBuilding,
} from '@tabler/icons-react-native';
import { TextBlockEditor } from './blocks/text-block-editor';
import { ImageBlockEditor } from './blocks/image-block-editor';
import { ButtonBlockEditor } from './blocks/button-block-editor';
import { ListBlockEditor } from './blocks/list-block-editor';
import { DividerBlockEditor } from './blocks/divider-block-editor';
import { SpacerBlockEditor } from './blocks/spacer-block-editor';
import { IconBlockEditor } from './blocks/icon-block-editor';
import { RowBlockEditor } from './blocks/row-block-editor';
import { DecoratorBlockEditor } from './blocks/decorator-block-editor';
import { CompanyAssetBlockEditor } from './blocks/company-asset-block-editor';
import { BLOCK_TYPE_CONFIG } from './block-utils';
import type { ContentBlock } from './types';

interface BlockEditorProps {
  block: ContentBlock;
  index: number;
  total: number;
  onUpdate: (updates: Partial<ContentBlock>) => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  disabled?: boolean;
}

const ICON_MAP: Record<string, React.ComponentType<{ size?: number; color?: string }>> = {
  IconH1, IconH2, IconH3, IconTextSize, IconPhoto, IconClick,
  IconMinus, IconSpacingVertical, IconList, IconQuote, IconStar,
  IconColumns, IconPalette, IconBuilding,
};

const BLOCK_TYPE_LABELS: Record<string, string> = Object.fromEntries(
  BLOCK_TYPE_CONFIG.map((c) => [c.type, c.label])
);

const BLOCK_TYPE_ICONS: Record<string, string> = Object.fromEntries(
  BLOCK_TYPE_CONFIG.map((c) => [c.type, c.iconName])
);

export function BlockEditor({
  block, index, total, onUpdate, onDelete, onMoveUp, onMoveDown, disabled,
}: BlockEditorProps) {
  const { colors } = useTheme();

  const isFirst = index === 0;
  const isLast = index === total - 1;
  const TypeIcon = ICON_MAP[BLOCK_TYPE_ICONS[block.type]] ?? IconTextSize;

  const renderBlockContent = () => {
    switch (block.type) {
      case 'heading1':
      case 'heading2':
      case 'heading3':
      case 'paragraph':
      case 'quote':
        return <TextBlockEditor block={block} onUpdate={onUpdate} disabled={disabled} />;
      case 'image':
        return <ImageBlockEditor block={block} onUpdate={onUpdate} disabled={disabled} />;
      case 'button':
        return <ButtonBlockEditor block={block} onUpdate={onUpdate} disabled={disabled} />;
      case 'list':
        return <ListBlockEditor block={block} onUpdate={onUpdate} disabled={disabled} />;
      case 'divider':
        return <DividerBlockEditor block={block} />;
      case 'spacer':
        return <SpacerBlockEditor block={block} onUpdate={onUpdate} disabled={disabled} />;
      case 'icon':
        return <IconBlockEditor block={block} onUpdate={onUpdate} disabled={disabled} />;
      case 'row':
        return <RowBlockEditor block={block} onUpdate={onUpdate} disabled={disabled} />;
      case 'decorator':
        return <DecoratorBlockEditor block={block} onUpdate={onUpdate} disabled={disabled} />;
      case 'company-asset':
        return <CompanyAssetBlockEditor block={block} onUpdate={onUpdate} disabled={disabled} />;
      default:
        return (
          <ThemedText style={{ color: colors.mutedForeground }}>
            Bloco não suportado: {(block as any).type}
          </ThemedText>
        );
    }
  };

  return (
    <Card style={styles.card}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View style={[styles.typeBadge, { backgroundColor: colors.muted }]}>
          <TypeIcon size={14} color={colors.primary} />
        </View>

        <ThemedText style={[styles.typeLabel, { color: colors.foreground }]} numberOfLines={1}>
          {BLOCK_TYPE_LABELS[block.type] || block.type}
        </ThemedText>

        <View style={styles.headerActions}>
          <TouchableOpacity
            onPress={onMoveUp}
            style={[styles.iconButton, { backgroundColor: colors.muted }]}
            disabled={disabled || isFirst}
            hitSlop={4}
          >
            <IconChevronUp
              size={16}
              color={isFirst ? colors.mutedForeground + '55' : colors.foreground}
            />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={onMoveDown}
            style={[styles.iconButton, { backgroundColor: colors.muted }]}
            disabled={disabled || isLast}
            hitSlop={4}
          >
            <IconChevronDown
              size={16}
              color={isLast ? colors.mutedForeground + '55' : colors.foreground}
            />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={onDelete}
            style={[styles.iconButton, { backgroundColor: colors.muted }]}
            disabled={disabled}
            hitSlop={4}
          >
            <IconTrash size={15} color={colors.destructive || '#EF4444'} />
          </TouchableOpacity>
        </View>
      </View>

      <CardContent style={styles.content}>
        {renderBlockContent()}
      </CardContent>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
    borderBottomWidth: 1,
  },
  typeBadge: {
    width: 26,
    height: 26,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeLabel: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  iconButton: {
    width: 30,
    height: 30,
    borderRadius: borderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    paddingTop: spacing.md,
  },
});
