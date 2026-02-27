import React, { useState, useCallback } from 'react';
import { View, StyleSheet, TouchableOpacity, Keyboard } from 'react-native';
import DraggableFlatList, { type RenderItemParams } from 'react-native-draggable-flatlist';
import { useTheme } from '@/lib/theme';
import { spacing, borderRadius } from '@/constants/design-system';
import { ThemedText } from '@/components/ui/themed-text';
import { IconPlus } from '@tabler/icons-react-native';
import { BlockEditor } from './block-editor';
import { BlockTypeSelector } from './block-type-selector';
import { createEmptyBlock } from './block-utils';
import type { ContentBlock, BlockType } from './types';

interface BlockEditorCanvasProps {
  blocks: ContentBlock[];
  onBlocksChange: (blocks: ContentBlock[]) => void;
  disabled?: boolean;
}

export function BlockEditorCanvas({ blocks, onBlocksChange, disabled }: BlockEditorCanvasProps) {
  const { colors } = useTheme();
  const [showSelector, setShowSelector] = useState(false);

  const handleAddBlock = useCallback(
    (type: BlockType) => {
      const newBlock = createEmptyBlock(type);
      onBlocksChange([...blocks, newBlock]);
      setShowSelector(false);
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

  const handleDragBegin = useCallback(() => {
    Keyboard.dismiss();
  }, []);

  const handleDragEnd = useCallback(
    ({ data }: { data: ContentBlock[] }) => {
      onBlocksChange(data);
    },
    [onBlocksChange]
  );

  const renderItem = useCallback(
    ({ item, drag, isActive }: RenderItemParams<ContentBlock>) => (
      <BlockEditor
        block={item}
        onUpdate={(updates) => handleUpdateBlock(item.id, updates)}
        onDelete={() => handleDeleteBlock(item.id)}
        drag={drag}
        isActive={isActive}
        disabled={disabled}
      />
    ),
    [handleUpdateBlock, handleDeleteBlock, disabled]
  );

  const keyExtractor = useCallback((item: ContentBlock) => item.id, []);

  if (blocks.length === 0) {
    return (
      <View>
        <TouchableOpacity
          style={[styles.emptyState, { borderColor: colors.border }]}
          onPress={() => setShowSelector(true)}
          disabled={disabled}
        >
          <ThemedText style={[styles.emptyText, { color: colors.mutedForeground }]}>
            Nenhum bloco adicionado ainda
          </ThemedText>
          <View style={[styles.addFirstButton, { backgroundColor: colors.primary }]}>
            <IconPlus size={16} color="#FFFFFF" />
            <ThemedText style={styles.addFirstText}>Adicionar Primeiro Bloco</ThemedText>
          </View>
        </TouchableOpacity>

        <BlockTypeSelector
          open={showSelector}
          onClose={() => setShowSelector(false)}
          onSelect={handleAddBlock}
        />
      </View>
    );
  }

  return (
    <View>
      <DraggableFlatList
        data={blocks}
        scrollEnabled={false}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        onDragBegin={handleDragBegin}
        onDragEnd={handleDragEnd}
      />

      <TouchableOpacity
        style={[styles.addButton, { borderColor: colors.border }]}
        onPress={() => setShowSelector(true)}
        disabled={disabled}
      >
        <IconPlus size={16} color={colors.primary} />
        <ThemedText style={[styles.addButtonText, { color: colors.primary }]}>
          Adicionar Bloco
        </ThemedText>
      </TouchableOpacity>

      <BlockTypeSelector
        open={showSelector}
        onClose={() => setShowSelector(false)}
        onSelect={handleAddBlock}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  emptyState: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    gap: spacing.md,
  },
  emptyText: {
    fontSize: 14,
  },
  addFirstButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: borderRadius.md,
  },
  addFirstText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: borderRadius.md,
    marginTop: spacing.sm,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
