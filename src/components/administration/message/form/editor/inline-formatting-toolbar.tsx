import React, { useState, useMemo } from 'react';
import { View, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { useTheme } from '@/lib/theme';
import { spacing, borderRadius } from '@/constants/design-system';
import { IconBold, IconItalic, IconUnderline, IconLink, IconPalette } from '@tabler/icons-react-native';
import { ThemedText } from '@/components/ui/themed-text';
import {
  toggleSelectionFormat,
  insertLink,
  detectActiveFormats,
  applyColorFormat,
  removeColorFormat,
  detectColorAtSelection,
} from '@/utils/markdown-formatting';

const COLOR_PRESETS = [
  '#000000', '#374151', '#ef4444', '#f97316', '#eab308',
  '#22c55e', '#3bc914', '#3b82f6', '#6366f1', '#8b5cf6', '#ec4899',
];

interface InlineFormattingToolbarProps {
  text: string;
  selection: { start: number; end: number };
  onApply: (newText: string, newSelection: { start: number; end: number }) => void;
  hasSelection: boolean;
}

export function InlineFormattingToolbar({
  text,
  selection,
  onApply,
  hasSelection,
}: InlineFormattingToolbarProps) {
  const { colors } = useTheme();
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [showColorPicker, setShowColorPicker] = useState(false);

  const activeFormats = useMemo(
    () => detectActiveFormats(text, selection),
    [text, selection]
  );

  const activeColor = useMemo(
    () => detectColorAtSelection(text, selection),
    [text, selection]
  );

  const handleFormat = (format: 'bold' | 'italic' | 'underline') => {
    const result = toggleSelectionFormat(text, selection, format);
    onApply(result.text, result.selection);
  };

  const handleLinkPress = () => {
    if (hasSelection) {
      setShowLinkInput(true);
    }
  };

  const handleLinkSubmit = () => {
    if (linkUrl.trim()) {
      const url = linkUrl.startsWith('http') ? linkUrl : `https://${linkUrl}`;
      const result = insertLink(text, selection, url);
      onApply(result.text, result.selection);
    }
    setLinkUrl('');
    setShowLinkInput(false);
  };

  const handleLinkCancel = () => {
    setLinkUrl('');
    setShowLinkInput(false);
  };

  const handleColorPress = () => {
    setShowLinkInput(false);
    setShowColorPicker((v) => !v);
  };

  const handleColorSelect = (color: string) => {
    const result = applyColorFormat(text, selection, color);
    onApply(result.text, result.selection);
    setShowColorPicker(false);
  };

  const handleRemoveColor = () => {
    const result = removeColorFormat(text, selection);
    onApply(result.text, result.selection);
    setShowColorPicker(false);
  };

  const formatButtons: Array<{ format: 'bold' | 'italic' | 'underline'; Icon: React.ComponentType<{ size?: number; color?: string }> }> = [
    { format: 'bold', Icon: IconBold },
    { format: 'italic', Icon: IconItalic },
    { format: 'underline', Icon: IconUnderline },
  ];

  return (
    <View style={styles.container}>
      <View style={[styles.toolbar, { backgroundColor: colors.muted, borderColor: colors.border }]}>
        {formatButtons.map(({ format, Icon }) => {
          const isActive = activeFormats.has(format);
          return (
            <TouchableOpacity
              key={format}
              onPress={() => handleFormat(format)}
              style={[
                styles.button,
                isActive && { backgroundColor: colors.primary },
              ]}
            >
              <Icon
                size={18}
                color={isActive ? '#FFFFFF' : colors.foreground}
              />
            </TouchableOpacity>
          );
        })}

        <View style={[styles.separator, { backgroundColor: colors.border }]} />

        <TouchableOpacity
          onPress={handleLinkPress}
          style={[styles.button, !hasSelection && styles.buttonDisabled]}
          disabled={!hasSelection}
        >
          <IconLink
            size={18}
            color={hasSelection ? colors.foreground : colors.mutedForeground}
          />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleColorPress}
          style={[
            styles.button,
            showColorPicker && { backgroundColor: colors.primary },
            activeColor ? { backgroundColor: activeColor + '33' } : undefined,
          ]}
        >
          <IconPalette
            size={18}
            color={showColorPicker ? '#FFFFFF' : (activeColor ?? colors.foreground)}
          />
        </TouchableOpacity>
      </View>

      {showLinkInput && (
        <View style={[styles.linkRow, { backgroundColor: colors.muted, borderColor: colors.border }]}>
          <TextInput
            style={[styles.linkInput, { color: colors.foreground, borderColor: colors.border }]}
            value={linkUrl}
            onChangeText={setLinkUrl}
            placeholder="https://exemplo.com"
            placeholderTextColor={colors.mutedForeground}
            autoCapitalize="none"
            keyboardType="url"
            autoFocus
            onSubmitEditing={handleLinkSubmit}
          />
          <TouchableOpacity onPress={handleLinkSubmit} style={[styles.linkButton, { backgroundColor: colors.primary }]}>
            <ThemedText style={styles.linkButtonText}>OK</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleLinkCancel} style={styles.linkCancelButton}>
            <ThemedText style={[styles.linkCancelText, { color: colors.mutedForeground }]}>Cancelar</ThemedText>
          </TouchableOpacity>
        </View>
      )}

      {showColorPicker && (
        <View style={[styles.colorRow, { backgroundColor: colors.muted, borderColor: colors.border }]}>
          {COLOR_PRESETS.map((color) => (
            <TouchableOpacity
              key={color}
              onPress={() => handleColorSelect(color)}
              style={[
                styles.colorSwatch,
                { backgroundColor: color },
                activeColor === color && styles.colorSwatchActive,
              ]}
            />
          ))}
          {activeColor && (
            <TouchableOpacity
              onPress={handleRemoveColor}
              style={[styles.removeColorButton, { borderColor: colors.border }]}
            >
              <ThemedText style={[styles.removeColorText, { color: colors.mutedForeground }]}>✕</ThemedText>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.xs,
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    padding: 4,
    gap: 2,
  },
  button: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.4,
  },
  separator: {
    width: 1,
    height: 20,
    marginHorizontal: 4,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    padding: 4,
    gap: spacing.xs,
  },
  linkInput: {
    flex: 1,
    height: 32,
    borderWidth: 1,
    borderRadius: borderRadius.sm,
    paddingHorizontal: 8,
    fontSize: 13,
  },
  linkButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: borderRadius.sm,
  },
  linkButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  linkCancelButton: {
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  linkCancelText: {
    fontSize: 13,
  },
  colorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    padding: 6,
    gap: 6,
  },
  colorSwatch: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  colorSwatchActive: {
    borderWidth: 2,
    borderColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 3,
  },
  removeColorButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeColorText: {
    fontSize: 11,
    fontWeight: '700',
  },
});
