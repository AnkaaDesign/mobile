import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { ScaleDecorator } from 'react-native-draggable-flatlist';
import { useTheme } from '@/lib/theme';
import { spacing, borderRadius } from '@/constants/design-system';
import { Card, CardContent } from '@/components/ui/card';
import { ThemedText } from '@/components/ui/themed-text';
import { IconGripVertical, IconTrash } from '@tabler/icons-react-native';
import { TextBlockEditor } from './blocks/text-block-editor';
import { ImageBlockEditor } from './blocks/image-block-editor';
import { ButtonBlockEditor } from './blocks/button-block-editor';
import { ListBlockEditor } from './blocks/list-block-editor';
import { DividerBlockEditor } from './blocks/divider-block-editor';
import { SpacerBlockEditor } from './blocks/spacer-block-editor';
import { IconBlockEditor } from './blocks/icon-block-editor';
import { RowBlockEditor } from './blocks/row-block-editor';
import { BLOCK_TYPE_CONFIG } from './block-utils';
import type { ContentBlock } from './types';

interface BlockEditorProps {
  block: ContentBlock;
  onUpdate: (updates: Partial<ContentBlock>) => void;
  onDelete: () => void;
  drag?: () => void;
  isActive?: boolean;
  disabled?: boolean;
}

const BLOCK_TYPE_LABELS: Record<string, string> = Object.fromEntries(
  BLOCK_TYPE_CONFIG.map((c) => [c.type, c.label])
);

export function BlockEditor({ block, onUpdate, onDelete, drag, isActive, disabled }: BlockEditorProps) {
  const { colors } = useTheme();

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
      default:
        return (
          <ThemedText style={{ color: colors.mutedForeground }}>
            Bloco não suportado: {(block as any).type}
          </ThemedText>
        );
    }
  };

  return (
    <ScaleDecorator>
      <Card style={[styles.card, isActive && { elevation: 8, shadowOpacity: 0.3 }]}>
        <View style={styles.header}>
          <TouchableOpacity
            onLongPress={drag}
            delayLongPress={150}
            style={styles.dragHandle}
            disabled={disabled}
          >
            <IconGripVertical size={18} color={colors.mutedForeground} />
          </TouchableOpacity>

          <ThemedText style={[styles.typeLabel, { color: colors.mutedForeground }]}>
            {BLOCK_TYPE_LABELS[block.type] || block.type}
          </ThemedText>

          <TouchableOpacity
            onPress={onDelete}
            style={[styles.deleteButton, { backgroundColor: colors.muted }]}
            disabled={disabled}
          >
            <IconTrash size={14} color={colors.destructive || '#EF4444'} />
          </TouchableOpacity>
        </View>

        <CardContent style={styles.content}>
          {renderBlockContent()}
        </CardContent>
      </Card>
    </ScaleDecorator>
  );
}

const styles = StyleSheet.create({
  card: {
    marginVertical: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.sm,
    gap: spacing.xs,
  },
  dragHandle: {
    padding: 4,
  },
  typeLabel: {
    flex: 1,
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  deleteButton: {
    width: 28,
    height: 28,
    borderRadius: borderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    paddingTop: spacing.xs,
  },
});
