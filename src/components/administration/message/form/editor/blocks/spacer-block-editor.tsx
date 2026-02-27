import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '@/lib/theme';
import { spacing } from '@/constants/design-system';
import { Combobox, type ComboboxOption } from '@/components/ui/combobox';
import { ThemedText } from '@/components/ui/themed-text';
import type { SpacerBlock } from '../types';

interface SpacerBlockEditorProps {
  block: SpacerBlock;
  onUpdate: (updates: Partial<SpacerBlock>) => void;
  disabled?: boolean;
}

const HEIGHT_OPTIONS: ComboboxOption[] = [
  { value: 'sm', label: 'Pequeno (1rem)' },
  { value: 'md', label: 'Médio (2rem)' },
  { value: 'lg', label: 'Grande (3rem)' },
  { value: 'xl', label: 'Extra Grande (4rem)' },
];

const HEIGHT_VALUES: Record<string, number> = {
  sm: 16,
  md: 32,
  lg: 48,
  xl: 64,
};

export function SpacerBlockEditor({ block, onUpdate, disabled }: SpacerBlockEditorProps) {
  const { colors } = useTheme();
  const heightValue = HEIGHT_VALUES[block.height || 'md'] || 32;

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <ThemedText style={[styles.label, { color: colors.mutedForeground }]}>Altura</ThemedText>
        <View style={styles.comboboxWrapper}>
          <Combobox
            options={HEIGHT_OPTIONS}
            value={block.height || 'md'}
            onValueChange={(val) => onUpdate({ height: val as SpacerBlock['height'] })}
            placeholder="Altura"
            disabled={disabled}
            searchable={false}
            clearable={false}
          />
        </View>
      </View>
      <View style={[styles.preview, { backgroundColor: colors.muted, height: heightValue }]}>
        <ThemedText style={[styles.previewText, { color: colors.mutedForeground }]}>
          {heightValue}px
        </ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    minWidth: 50,
  },
  comboboxWrapper: {
    flex: 1,
  },
  preview: {
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewText: {
    fontSize: 11,
  },
});
