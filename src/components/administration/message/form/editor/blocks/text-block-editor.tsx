import React, { useState, useCallback } from 'react';
import { View, TextInput, StyleSheet, type NativeSyntheticEvent, type TextInputSelectionChangeEventData } from 'react-native';
import { useTheme } from '@/lib/theme';
import { spacing, fontSize as fontSizeTokens, borderRadius } from '@/constants/design-system';
import { Combobox, type ComboboxOption } from '@/components/ui/combobox';
import { ThemedText } from '@/components/ui/themed-text';
import { InlineFormattingToolbar } from '../inline-formatting-toolbar';
import type { TextBlock } from '../types';

interface TextBlockEditorProps {
  block: TextBlock;
  onUpdate: (updates: Partial<TextBlock>) => void;
  disabled?: boolean;
}

const FONT_SIZE_OPTIONS: ComboboxOption[] = [
  { value: 'xs', label: 'Extra Pequeno' },
  { value: 'sm', label: 'Pequeno' },
  { value: 'base', label: 'Normal' },
  { value: 'lg', label: 'Grande' },
  { value: 'xl', label: 'Extra Grande' },
  { value: '2xl', label: '2x Grande' },
  { value: '3xl', label: '3x Grande' },
];

const FONT_WEIGHT_OPTIONS: ComboboxOption[] = [
  { value: 'normal', label: 'Normal' },
  { value: 'medium', label: 'Médio' },
  { value: 'semibold', label: 'Semi-Negrito' },
  { value: 'bold', label: 'Negrito' },
];

const PLACEHOLDERS: Record<string, string> = {
  heading1: 'Título principal...',
  heading2: 'Subtítulo...',
  heading3: 'Título menor...',
  paragraph: 'Digite o texto...',
  quote: 'Digite a citação...',
};

const INPUT_FONT_SIZES: Record<string, number> = {
  xs: 12,
  sm: 13,
  base: 15,
  lg: 17,
  xl: 20,
  '2xl': 24,
  '3xl': 30,
};

const INPUT_FONT_WEIGHTS: Record<string, '400' | '500' | '600' | '700'> = {
  normal: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
};

export function TextBlockEditor({ block, onUpdate, disabled }: TextBlockEditorProps) {
  const { colors } = useTheme();
  const [selection, setSelection] = useState<{ start: number; end: number }>({ start: 0, end: 0 });
  const [isFocused, setIsFocused] = useState(false);

  const isQuote = block.type === 'quote';
  const hasSelection = selection.start !== selection.end;
  const showToolbar = isFocused;

  const handleSelectionChange = useCallback(
    (e: NativeSyntheticEvent<TextInputSelectionChangeEventData>) => {
      setSelection(e.nativeEvent.selection);
    },
    []
  );

  const handleContentChange = useCallback(
    (text: string) => {
      onUpdate({ content: text });
    },
    [onUpdate]
  );

  const handleFormatApply = useCallback(
    (newText: string, newSelection: { start: number; end: number }) => {
      onUpdate({ content: newText });
      setSelection(newSelection);
    },
    [onUpdate]
  );

  return (
    <View style={styles.container}>
      {/* Text Input */}
      <View
        style={[
          styles.inputContainer,
          isQuote && { borderLeftWidth: 4, borderLeftColor: colors.primary, paddingLeft: 12 },
        ]}
      >
        <TextInput
          multiline
          style={[
            styles.input,
            {
              color: colors.foreground,
              fontSize: INPUT_FONT_SIZES[block.fontSize || 'base'] || 15,
              fontWeight: INPUT_FONT_WEIGHTS[block.fontWeight || 'normal'] || '400',
              fontStyle: isQuote ? 'italic' : 'normal',
            },
          ]}
          placeholderTextColor={colors.mutedForeground}
          placeholder={PLACEHOLDERS[block.type] || 'Digite...'}
          value={block.content}
          onChangeText={handleContentChange}
          onSelectionChange={handleSelectionChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          editable={!disabled}
        />
      </View>

      {/* Formatting Toolbar */}
      {showToolbar && (
        <InlineFormattingToolbar
          text={block.content}
          selection={selection}
          onApply={handleFormatApply}
          hasSelection={hasSelection}
        />
      )}

      {/* Font Size and Weight Pickers */}
      <View style={styles.row}>
        <View style={styles.halfField}>
          <ThemedText style={[styles.label, { color: colors.mutedForeground }]}>Tamanho</ThemedText>
          <Combobox
            options={FONT_SIZE_OPTIONS}
            value={block.fontSize || 'base'}
            onValueChange={(val) => onUpdate({ fontSize: val as TextBlock['fontSize'] })}
            placeholder="Tamanho"
            disabled={disabled}
            searchable={false}
            clearable={false}
          />
        </View>
        <View style={styles.halfField}>
          <ThemedText style={[styles.label, { color: colors.mutedForeground }]}>Peso</ThemedText>
          <Combobox
            options={FONT_WEIGHT_OPTIONS}
            value={block.fontWeight || 'normal'}
            onValueChange={(val) => onUpdate({ fontWeight: val as TextBlock['fontWeight'] })}
            placeholder="Peso"
            disabled={disabled}
            searchable={false}
            clearable={false}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  inputContainer: {
    minHeight: 44,
  },
  input: {
    minHeight: 40,
    textAlignVertical: 'top',
    paddingVertical: 8,
    paddingHorizontal: 0,
    lineHeight: 22,
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
});
