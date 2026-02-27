import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '@/lib/theme';
import { spacing, borderRadius } from '@/constants/design-system';
import { Combobox, type ComboboxOption } from '@/components/ui/combobox';
import { ThemedText } from '@/components/ui/themed-text';
import { IconPickerSheet, getIconComponent } from './icon-picker-sheet';
import type { IconBlock } from '../types';

interface IconBlockEditorProps {
  block: IconBlock;
  onUpdate: (updates: Partial<IconBlock>) => void;
  disabled?: boolean;
}

const SIZE_OPTIONS: ComboboxOption[] = [
  { value: 'sm', label: 'Pequeno (16px)' },
  { value: 'md', label: 'Médio (24px)' },
  { value: 'lg', label: 'Grande (32px)' },
  { value: 'xl', label: 'Extra Grande (48px)' },
];

const COLOR_OPTIONS: ComboboxOption[] = [
  { value: 'text-foreground', label: 'Padrão' },
  { value: 'text-primary', label: 'Primária' },
  { value: 'text-red-500', label: 'Vermelho' },
  { value: 'text-green-500', label: 'Verde' },
  { value: 'text-blue-500', label: 'Azul' },
  { value: 'text-yellow-500', label: 'Amarelo' },
  { value: 'text-purple-500', label: 'Roxo' },
  { value: 'text-orange-500', label: 'Laranja' },
];

const ALIGNMENT_OPTIONS: ComboboxOption[] = [
  { value: 'left', label: 'Esquerda' },
  { value: 'center', label: 'Centro' },
  { value: 'right', label: 'Direita' },
];

const ICON_SIZE_PX: Record<string, number> = {
  sm: 16,
  md: 24,
  lg: 32,
  xl: 48,
};

const COLOR_MAP: Record<string, string> = {
  'text-foreground': '#000000',
  'text-primary': '#3B82F6',
  'text-red-500': '#EF4444',
  'text-green-500': '#22C55E',
  'text-blue-500': '#3B82F6',
  'text-yellow-500': '#EAB308',
  'text-purple-500': '#A855F7',
  'text-orange-500': '#F97316',
};

export function IconBlockEditor({ block, onUpdate, disabled }: IconBlockEditorProps) {
  const { colors } = useTheme();
  const [showPicker, setShowPicker] = useState(false);

  const IconComp = getIconComponent(block.icon);
  const iconSize = ICON_SIZE_PX[block.size || 'md'] || 24;
  const iconColor = COLOR_MAP[block.color || 'text-foreground'] || colors.foreground;

  return (
    <View style={styles.container}>
      {/* Icon Preview + Select */}
      <TouchableOpacity
        style={[styles.iconPreview, { borderColor: colors.border }]}
        onPress={() => setShowPicker(true)}
        disabled={disabled}
      >
        {IconComp ? (
          <IconComp size={iconSize} color={iconColor} />
        ) : (
          <ThemedText style={{ color: colors.mutedForeground }}>?</ThemedText>
        )}
        <ThemedText style={[styles.selectText, { color: colors.primary }]}>
          {block.icon ? 'Alterar ícone' : 'Selecionar ícone'}
        </ThemedText>
      </TouchableOpacity>

      {/* Settings */}
      <View style={styles.row}>
        <View style={styles.thirdField}>
          <ThemedText style={[styles.label, { color: colors.mutedForeground }]}>Tamanho</ThemedText>
          <Combobox
            options={SIZE_OPTIONS}
            value={block.size || 'md'}
            onValueChange={(val) => onUpdate({ size: val as IconBlock['size'] })}
            placeholder="Tamanho"
            disabled={disabled}
            searchable={false}
            clearable={false}
          />
        </View>
        <View style={styles.thirdField}>
          <ThemedText style={[styles.label, { color: colors.mutedForeground }]}>Cor</ThemedText>
          <Combobox
            options={COLOR_OPTIONS}
            value={block.color || 'text-foreground'}
            onValueChange={(val) => onUpdate({ color: val as string })}
            placeholder="Cor"
            disabled={disabled}
            searchable={false}
            clearable={false}
          />
        </View>
        <View style={styles.thirdField}>
          <ThemedText style={[styles.label, { color: colors.mutedForeground }]}>Alinhar</ThemedText>
          <Combobox
            options={ALIGNMENT_OPTIONS}
            value={block.alignment || 'center'}
            onValueChange={(val) => onUpdate({ alignment: val as IconBlock['alignment'] })}
            placeholder="Alinhar"
            disabled={disabled}
            searchable={false}
            clearable={false}
          />
        </View>
      </View>

      <IconPickerSheet
        open={showPicker}
        onClose={() => setShowPicker(false)}
        onSelect={(iconName) => onUpdate({ icon: iconName })}
        selectedIcon={block.icon}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  iconPreview: {
    borderWidth: 1,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    gap: spacing.xs,
  },
  selectText: {
    fontSize: 13,
    fontWeight: '500',
  },
  row: {
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
});
