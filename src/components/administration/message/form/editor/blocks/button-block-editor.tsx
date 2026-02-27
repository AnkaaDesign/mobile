import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '@/lib/theme';
import { spacing, borderRadius } from '@/constants/design-system';
import { Input } from '@/components/ui/input';
import { Combobox, type ComboboxOption } from '@/components/ui/combobox';
import { ThemedText } from '@/components/ui/themed-text';
import type { ButtonBlock } from '../types';

interface ButtonBlockEditorProps {
  block: ButtonBlock;
  onUpdate: (updates: Partial<ButtonBlock>) => void;
  disabled?: boolean;
}

const VARIANT_OPTIONS: ComboboxOption[] = [
  { value: 'default', label: 'Padrão' },
  { value: 'outline', label: 'Contorno' },
  { value: 'secondary', label: 'Secundário' },
];

const ALIGNMENT_OPTIONS: ComboboxOption[] = [
  { value: 'left', label: 'Esquerda' },
  { value: 'center', label: 'Centro' },
  { value: 'right', label: 'Direita' },
];

export function ButtonBlockEditor({ block, onUpdate, disabled }: ButtonBlockEditorProps) {
  const { colors } = useTheme();

  const getButtonStyle = () => {
    const base: any = {
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: borderRadius.md,
      alignSelf: block.alignment === 'left' ? 'flex-start' : block.alignment === 'right' ? 'flex-end' : 'center',
    };

    switch (block.variant) {
      case 'outline':
        return { ...base, borderWidth: 1, borderColor: colors.primary, backgroundColor: 'transparent' };
      case 'secondary':
        return { ...base, backgroundColor: colors.muted };
      default:
        return { ...base, backgroundColor: colors.primary };
    }
  };

  const getButtonTextColor = () => {
    switch (block.variant) {
      case 'outline':
        return colors.primary;
      case 'secondary':
        return colors.foreground;
      default:
        return '#FFFFFF';
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.field}>
        <ThemedText style={[styles.label, { color: colors.mutedForeground }]}>Texto</ThemedText>
        <Input
          value={block.text}
          onChangeText={(val) => onUpdate({ text: val })}
          placeholder="Texto do botão"
          editable={!disabled}
        />
      </View>

      <View style={styles.field}>
        <ThemedText style={[styles.label, { color: colors.mutedForeground }]}>URL</ThemedText>
        <Input
          value={block.url}
          onChangeText={(val) => {
            const url = val && !val.startsWith('http') && val.length > 0 ? `https://${val}` : val;
            onUpdate({ url });
          }}
          placeholder="https://exemplo.com"
          editable={!disabled}
          autoCapitalize="none"
          keyboardType="url"
        />
      </View>

      <View style={styles.row}>
        <View style={styles.halfField}>
          <ThemedText style={[styles.label, { color: colors.mutedForeground }]}>Variante</ThemedText>
          <Combobox
            options={VARIANT_OPTIONS}
            value={block.variant || 'default'}
            onValueChange={(val) => onUpdate({ variant: val as ButtonBlock['variant'] })}
            placeholder="Variante"
            disabled={disabled}
            searchable={false}
            clearable={false}
          />
        </View>
        <View style={styles.halfField}>
          <ThemedText style={[styles.label, { color: colors.mutedForeground }]}>Alinhamento</ThemedText>
          <Combobox
            options={ALIGNMENT_OPTIONS}
            value={block.alignment || 'center'}
            onValueChange={(val) => onUpdate({ alignment: val as ButtonBlock['alignment'] })}
            placeholder="Alinhamento"
            disabled={disabled}
            searchable={false}
            clearable={false}
          />
        </View>
      </View>

      {/* Live Preview */}
      {block.text ? (
        <View style={styles.previewContainer}>
          <ThemedText style={[styles.previewLabel, { color: colors.mutedForeground }]}>Prévia</ThemedText>
          <TouchableOpacity style={getButtonStyle()} disabled>
            <ThemedText style={{ color: getButtonTextColor(), fontWeight: '600', fontSize: 14 }}>
              {block.text}
            </ThemedText>
          </TouchableOpacity>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  field: {
    gap: 4,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  halfField: {
    flex: 1,
    gap: 4,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
  },
  previewContainer: {
    gap: 4,
    paddingTop: spacing.xs,
  },
  previewLabel: {
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
