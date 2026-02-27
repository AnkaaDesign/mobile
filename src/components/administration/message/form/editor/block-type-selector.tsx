import React from 'react';
import { View, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { useTheme } from '@/lib/theme';
import { spacing, borderRadius } from '@/constants/design-system';
import { Sheet, SheetContent, SheetHeader } from '@/components/ui/sheet';
import { ThemedText } from '@/components/ui/themed-text';
import {
  IconH1, IconH2, IconH3, IconTextSize, IconPhoto, IconClick,
  IconMinus, IconSpacingVertical, IconList, IconQuote, IconStar, IconColumns,
} from '@tabler/icons-react-native';
import { BLOCK_TYPE_CONFIG } from './block-utils';
import type { BlockType } from './types';

const ICON_MAP: Record<string, React.ComponentType<{ size?: number; color?: string }>> = {
  IconH1, IconH2, IconH3, IconTextSize, IconPhoto, IconClick,
  IconMinus, IconSpacingVertical, IconList, IconQuote, IconStar, IconColumns,
};

interface BlockTypeSelectorProps {
  open: boolean;
  onClose: () => void;
  onSelect: (type: BlockType) => void;
  excludeTypes?: BlockType[];
}

export function BlockTypeSelector({ open, onClose, onSelect, excludeTypes }: BlockTypeSelectorProps) {
  const { colors } = useTheme();

  const filteredTypes = excludeTypes
    ? BLOCK_TYPE_CONFIG.filter((c) => !excludeTypes.includes(c.type))
    : BLOCK_TYPE_CONFIG;

  const handleSelect = (type: BlockType) => {
    onSelect(type);
    onClose();
  };

  return (
    <Sheet open={open} onOpenChange={onClose} snapPoints={[55]}>
      <SheetContent>
        <SheetHeader>
          <ThemedText style={[styles.title, { color: colors.foreground }]}>
            Selecione o tipo de bloco
          </ThemedText>
        </SheetHeader>

        <FlatList
          data={filteredTypes}
          numColumns={3}
          keyExtractor={(item) => item.type}
          contentContainerStyle={styles.grid}
          renderItem={({ item }) => {
            const IconComp = ICON_MAP[item.iconName];
            return (
              <TouchableOpacity
                style={[styles.cell, { borderColor: colors.border }]}
                onPress={() => handleSelect(item.type)}
              >
                {IconComp && <IconComp size={24} color={colors.primary} />}
                <ThemedText style={[styles.cellLabel, { color: colors.foreground }]} numberOfLines={1}>
                  {item.label}
                </ThemedText>
                <ThemedText style={[styles.cellDesc, { color: colors.mutedForeground }]} numberOfLines={2}>
                  {item.description}
                </ThemedText>
              </TouchableOpacity>
            );
          }}
        />
      </SheetContent>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  grid: {
    paddingHorizontal: spacing.sm,
    paddingBottom: spacing.xl,
  },
  cell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    margin: 4,
    gap: 4,
    minHeight: 90,
    maxWidth: '33.33%',
  },
  cellLabel: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  cellDesc: {
    fontSize: 10,
    textAlign: 'center',
  },
});
