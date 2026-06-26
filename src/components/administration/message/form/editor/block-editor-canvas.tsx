import React, { useState, useCallback } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '@/lib/theme';
import { spacing, borderRadius } from '@/constants/design-system';
import { ThemedText } from '@/components/ui/themed-text';
import { IconPlus, IconLayoutGrid, IconStack2 } from '@tabler/icons-react-native';
import { BlockEditor } from './block-editor';
import { BlockTypeSelector } from './block-type-selector';
import { MessageTemplatesModal } from './message-templates-modal';
import { SimplePasteDialog } from './simple-paste-dialog';
import { createEmptyBlock } from './block-utils';
import { buildSimpleDocument } from '@/utils/message-rich-paste';
import type { ContentBlock, BlockType } from './types';

interface BlockEditorCanvasProps {
  blocks: ContentBlock[];
  onBlocksChange: (blocks: ContentBlock[]) => void;
  disabled?: boolean;
}

export function BlockEditorCanvas({ blocks, onBlocksChange, disabled }: BlockEditorCanvasProps) {
  const { colors } = useTheme();
  const [showSelector, setShowSelector] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showSimplePaste, setShowSimplePaste] = useState(false);

  const handleAddBlock = useCallback(
    (type: BlockType) => {
      const newBlock = createEmptyBlock(type);
      onBlocksChange([...blocks, newBlock]);
      setShowSelector(false);
    },
    [blocks, onBlocksChange]
  );

  // "Simples": append pasted, already-formatted content and ensure the document
  // has a logo header at the top and a wave footer at the bottom.
  const handleSimpleInsert = useCallback(
    (contentBlocks: ContentBlock[]) => {
      const next = [...blocks, ...contentBlocks];
      onBlocksChange(buildSimpleDocument(next, next));
      setShowSimplePaste(false);
    },
    [blocks, onBlocksChange]
  );

  const handleUpdateBlock = useCallback(
    (id: string, updates: Partial<ContentBlock>) => {
      onBlocksChange(
        blocks.map((b) => (b.id === id ? { ...b, ...updates } as ContentBlock : b))
      );
    },
    [blocks, onBlocksChange]
  );

  const handleDeleteBlock = useCallback(
    (id: string) => {
      onBlocksChange(blocks.filter((b) => b.id !== id));
    },
    [blocks, onBlocksChange]
  );

  // Reorder via up/down controls. Drag-and-drop is intentionally avoided here:
  // a draggable VirtualizedList nested inside the form's parent ScrollView
  // breaks vertical scrolling. Up/down buttons are reliable and touch-friendly.
  const handleMove = useCallback(
    (index: number, direction: -1 | 1) => {
      const target = index + direction;
      if (target < 0 || target >= blocks.length) return;
      const next = [...blocks];
      const [moved] = next.splice(index, 1);
      next.splice(target, 0, moved);
      onBlocksChange(next);
    },
    [blocks, onBlocksChange]
  );

  const handleTemplateSelect = useCallback(
    (newBlocks: ContentBlock[]) => {
      onBlocksChange(newBlocks);
      setShowTemplates(false);
    },
    [onBlocksChange]
  );

  // ─── Empty state ──────────────────────────────────────────────────────────
  if (blocks.length === 0) {
    return (
      <View>
        <View style={[styles.emptyState, { borderColor: colors.border }]}>
          <View style={[styles.emptyIconWrap, { backgroundColor: colors.muted }]}>
            <IconStack2 size={26} color={colors.mutedForeground} />
          </View>
          <ThemedText style={[styles.emptyTitle, { color: colors.foreground }]}>
            Comece a montar sua mensagem
          </ThemedText>
          <ThemedText style={[styles.emptyText, { color: colors.mutedForeground }]}>
            Adicione blocos de texto, imagens e botões, ou use um modelo pronto.
          </ThemedText>

          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: colors.primary }]}
            onPress={() => setShowSelector(true)}
            disabled={disabled}
            activeOpacity={0.85}
          >
            <IconPlus size={18} color="#FFFFFF" />
            <ThemedText style={styles.primaryButtonText}>Adicionar Primeiro Bloco</ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.linkButton}
            onPress={() => setShowTemplates(true)}
            disabled={disabled}
            activeOpacity={0.7}
          >
            <IconLayoutGrid size={16} color={colors.primary} />
            <ThemedText style={[styles.linkButtonText, { color: colors.primary }]}>
              Ver Exemplos
            </ThemedText>
          </TouchableOpacity>
        </View>

        <BlockTypeSelector
          open={showSelector}
          onClose={() => setShowSelector(false)}
          onSelect={handleAddBlock}
          onSimple={() => { setShowSelector(false); setShowSimplePaste(true); }}
        />

        <SimplePasteDialog
          open={showSimplePaste}
          onClose={() => setShowSimplePaste(false)}
          onInsert={handleSimpleInsert}
        />

        <MessageTemplatesModal
          visible={showTemplates}
          onClose={() => setShowTemplates(false)}
          onSelect={handleTemplateSelect}
          hasExistingBlocks={blocks.length > 0}
        />
      </View>
    );
  }

  // ─── Populated state ──────────────────────────────────────────────────────
  return (
    <View>
      <View style={styles.blockList}>
        {blocks.map((block, index) => (
          <BlockEditor
            key={block.id}
            block={block}
            index={index}
            total={blocks.length}
            onUpdate={(updates) => handleUpdateBlock(block.id, updates)}
            onDelete={() => handleDeleteBlock(block.id)}
            onMoveUp={() => handleMove(index, -1)}
            onMoveDown={() => handleMove(index, 1)}
            disabled={disabled}
          />
        ))}
      </View>

      <View style={styles.bottomActions}>
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: colors.primary }]}
          onPress={() => setShowSelector(true)}
          disabled={disabled}
          activeOpacity={0.85}
        >
          <IconPlus size={16} color="#FFFFFF" />
          <ThemedText style={[styles.addButtonText, { color: '#FFFFFF' }]}>
            Adicionar Bloco
          </ThemedText>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.templatesButton, { borderColor: colors.border }]}
          onPress={() => setShowTemplates(true)}
          disabled={disabled}
          activeOpacity={0.7}
        >
          <IconLayoutGrid size={16} color={colors.foreground} />
          <ThemedText style={[styles.addButtonText, { color: colors.foreground }]}>
            Exemplos
          </ThemedText>
        </TouchableOpacity>
      </View>

      <BlockTypeSelector
        open={showSelector}
        onClose={() => setShowSelector(false)}
        onSelect={handleAddBlock}
        onSimple={() => { setShowSelector(false); setShowSimplePaste(true); }}
      />

      <SimplePasteDialog
        open={showSimplePaste}
        onClose={() => setShowSimplePaste(false)}
        onInsert={handleSimpleInsert}
      />

      <MessageTemplatesModal
        visible={showTemplates}
        onClose={() => setShowTemplates(false)}
        onSelect={handleTemplateSelect}
        hasExistingBlocks={blocks.length > 0}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  // Empty state
  emptyState: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    gap: spacing.sm,
  },
  emptyIconWrap: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.lg,
    paddingVertical: 12,
    borderRadius: borderRadius.md,
    alignSelf: 'stretch',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: spacing.sm,
  },
  linkButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  // Populated state
  blockList: {
    gap: spacing.sm,
  },
  bottomActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  addButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: 12,
    borderRadius: borderRadius.md,
  },
  templatesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: 12,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderRadius: borderRadius.md,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
