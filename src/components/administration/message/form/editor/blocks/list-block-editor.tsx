import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '@/lib/theme';
import { spacing, borderRadius } from '@/constants/design-system';
import { Input } from '@/components/ui/input';
import { ThemedText } from '@/components/ui/themed-text';
import { Switch } from '@/components/ui/switch';
import { IconPlus, IconX } from '@tabler/icons-react-native';
import type { ListBlock } from '../types';

interface ListBlockEditorProps {
  block: ListBlock;
  onUpdate: (updates: Partial<ListBlock>) => void;
  disabled?: boolean;
}

export function ListBlockEditor({ block, onUpdate, disabled }: ListBlockEditorProps) {
  const { colors } = useTheme();
  const items = block.items || [''];

  const handleItemChange = (index: number, text: string) => {
    const newItems = [...items];
    newItems[index] = text;
    onUpdate({ items: newItems });
  };

  const handleAddItem = () => {
    onUpdate({ items: [...items, ''] });
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) return;
    const newItems = items.filter((_, i) => i !== index);
    onUpdate({ items: newItems });
  };

  return (
    <View style={styles.container}>
      <View style={styles.switchRow}>
        <ThemedText style={[styles.label, { color: colors.mutedForeground }]}>Lista ordenada</ThemedText>
        <Switch
          checked={block.ordered || false}
          onCheckedChange={(val) => onUpdate({ ordered: val })}
          disabled={disabled}
        />
      </View>

      <View style={styles.itemsList}>
        {items.map((item, index) => (
          <View key={index} style={styles.itemRow}>
            <ThemedText style={[styles.prefix, { color: colors.mutedForeground }]}>
              {block.ordered ? `${index + 1}.` : '•'}
            </ThemedText>
            <View style={styles.inputWrapper}>
              <Input
                value={item}
                onChangeText={(val) => handleItemChange(index, val)}
                placeholder={`Item ${index + 1}`}
                editable={!disabled}
              />
            </View>
            {items.length > 1 && (
              <TouchableOpacity
                onPress={() => handleRemoveItem(index)}
                style={[styles.removeButton, { backgroundColor: colors.muted }]}
                disabled={disabled}
              >
                <IconX size={14} color={colors.mutedForeground} />
              </TouchableOpacity>
            )}
          </View>
        ))}
      </View>

      <TouchableOpacity
        onPress={handleAddItem}
        style={[styles.addButton, { borderColor: colors.border }]}
        disabled={disabled}
      >
        <IconPlus size={16} color={colors.primary} />
        <ThemedText style={[styles.addText, { color: colors.primary }]}>Adicionar item</ThemedText>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
  },
  itemsList: {
    gap: spacing.xs,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  prefix: {
    fontSize: 14,
    fontWeight: '500',
    width: 20,
    textAlign: 'center',
  },
  inputWrapper: {
    flex: 1,
  },
  removeButton: {
    width: 28,
    height: 28,
    borderRadius: borderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
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
