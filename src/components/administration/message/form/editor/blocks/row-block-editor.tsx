import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '@/lib/theme';
import { spacing, borderRadius } from '@/constants/design-system';
import { Combobox, type ComboboxOption } from '@/components/ui/combobox';
import { ThemedText } from '@/components/ui/themed-text';
import { IconPlus, IconTrash } from '@tabler/icons-react-native';
import { BlockTypeSelector } from '../block-type-selector';
import { createEmptyBlock } from '../block-utils';
import type { RowBlock, ContentBlock, BlockType } from '../types';

interface RowBlockEditorProps {
  block: RowBlock;
  onUpdate: (updates: Partial<RowBlock>) => void;
  disabled?: boolean;
  renderNestedBlock?: (block: ContentBlock, onUpdate: (updates: Partial<ContentBlock>) => void, onDelete: () => void) => React.ReactNode;
}

const COLUMN_OPTIONS: ComboboxOption[] = [
  { value: '2', label: '2 Colunas' },
  { value: '3', label: '3 Colunas' },
  { value: '4', label: '4 Colunas' },
];

const GAP_OPTIONS: ComboboxOption[] = [
  { value: 'none', label: 'Nenhum' },
  { value: 'sm', label: 'Pequeno' },
  { value: 'md', label: 'Médio' },
  { value: 'lg', label: 'Grande' },
];

const VALIGN_OPTIONS: ComboboxOption[] = [
  { value: 'top', label: 'Topo' },
  { value: 'center', label: 'Centro' },
  { value: 'bottom', label: 'Base' },
];

export function RowBlockEditor({ block, onUpdate, disabled, renderNestedBlock }: RowBlockEditorProps) {
  const { colors } = useTheme();
  const [showSelector, setShowSelector] = useState(false);
  const [targetColumnIndex, setTargetColumnIndex] = useState<number | null>(null);

  const columns = block.columns || 2;
  const nestedBlocks = block.blocks || [];

  const handleAddBlock = (type: BlockType) => {
    const newBlock = createEmptyBlock(type);
    const newBlocks = [...nestedBlocks, newBlock];
    onUpdate({ blocks: newBlocks });
    setShowSelector(false);
    setTargetColumnIndex(null);
  };

  const handleUpdateNestedBlock = (blockId: string, updates: Partial<ContentBlock>) => {
    const newBlocks = nestedBlocks.map((b) =>
      b.id === blockId ? { ...b, ...updates } as ContentBlock : b
    );
    onUpdate({ blocks: newBlocks });
  };

  const handleDeleteNestedBlock = (blockId: string) => {
    const newBlocks = nestedBlocks.filter((b) => b.id !== blockId);
    onUpdate({ blocks: newBlocks });
  };

  const handleOpenSelector = (_columnIndex: number) => {
    setTargetColumnIndex(_columnIndex);
    setShowSelector(true);
  };

  return (
    <View style={styles.container}>
      {/* Settings Row */}
      <View style={styles.settingsRow}>
        <View style={styles.thirdField}>
          <ThemedText style={[styles.label, { color: colors.mutedForeground }]}>Colunas</ThemedText>
          <Combobox
            options={COLUMN_OPTIONS}
            value={String(columns)}
            onValueChange={(val) => onUpdate({ columns: Number(val) as RowBlock['columns'] })}
            placeholder="Colunas"
            disabled={disabled}
            searchable={false}
            clearable={false}
          />
        </View>
        <View style={styles.thirdField}>
          <ThemedText style={[styles.label, { color: colors.mutedForeground }]}>Espaço</ThemedText>
          <Combobox
            options={GAP_OPTIONS}
            value={block.gap || 'md'}
            onValueChange={(val) => onUpdate({ gap: val as RowBlock['gap'] })}
            placeholder="Espaço"
            disabled={disabled}
            searchable={false}
            clearable={false}
          />
        </View>
        <View style={styles.thirdField}>
          <ThemedText style={[styles.label, { color: colors.mutedForeground }]}>V. Alinhar</ThemedText>
          <Combobox
            options={VALIGN_OPTIONS}
            value={block.verticalAlign || 'top'}
            onValueChange={(val) => onUpdate({ verticalAlign: val as RowBlock['verticalAlign'] })}
            placeholder="V. Alinhar"
            disabled={disabled}
            searchable={false}
            clearable={false}
          />
        </View>
      </View>

      {/* Column Slots */}
      <View style={styles.columnsContainer}>
        {Array.from({ length: columns }).map((_, colIndex) => {
          const colBlock = nestedBlocks[colIndex];
          return (
            <View
              key={colIndex}
              style={[styles.columnSlot, { borderColor: colors.border, flex: 1 }]}
            >
              {colBlock ? (
                <View style={styles.filledSlot}>
                  {renderNestedBlock ? (
                    renderNestedBlock(
                      colBlock,
                      (updates) => handleUpdateNestedBlock(colBlock.id, updates),
                      () => handleDeleteNestedBlock(colBlock.id)
                    )
                  ) : (
                    <View style={styles.simplifiedBlock}>
                      <ThemedText style={[styles.blockType, { color: colors.foreground }]}>
                        {colBlock.type}
                      </ThemedText>
                      <TouchableOpacity
                        onPress={() => handleDeleteNestedBlock(colBlock.id)}
                        disabled={disabled}
                      >
                        <IconTrash size={14} color={colors.destructive || '#EF4444'} />
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.emptySlot}
                  onPress={() => handleOpenSelector(colIndex)}
                  disabled={disabled || nestedBlocks.length > colIndex}
                >
                  <IconPlus size={20} color={colors.mutedForeground} />
                  <ThemedText style={[styles.emptyText, { color: colors.mutedForeground }]}>
                    Col {colIndex + 1}
                  </ThemedText>
                </TouchableOpacity>
              )}
            </View>
          );
        })}
      </View>

      {nestedBlocks.length < columns && (
        <TouchableOpacity
          style={[styles.addButton, { borderColor: colors.border }]}
          onPress={() => setShowSelector(true)}
          disabled={disabled}
        >
          <IconPlus size={16} color={colors.primary} />
          <ThemedText style={[styles.addText, { color: colors.primary }]}>Adicionar à coluna</ThemedText>
        </TouchableOpacity>
      )}

      <BlockTypeSelector
        open={showSelector}
        onClose={() => { setShowSelector(false); setTargetColumnIndex(null); }}
        onSelect={handleAddBlock}
        excludeTypes={['row']}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  settingsRow: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  thirdField: {
    flex: 1,
    gap: 4,
  },
  label: {
    fontSize: 12,
    fontWeight: '500',
  },
  columnsContainer: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  columnSlot: {
    borderWidth: 1,
    borderRadius: borderRadius.md,
    minHeight: 60,
    overflow: 'hidden',
  },
  emptySlot: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.sm,
    gap: 4,
  },
  emptyText: {
    fontSize: 11,
  },
  filledSlot: {
    padding: spacing.xs,
  },
  simplifiedBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.xs,
  },
  blockType: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: 8,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: borderRadius.md,
  },
  addText: {
    fontSize: 13,
    fontWeight: '500',
  },
});
