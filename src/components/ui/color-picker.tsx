import { useState, useCallback, useEffect } from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity, Modal, ActivityIndicator, Platform } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import ColorPicker, { Panel1, HueSlider, Preview } from 'reanimated-color-picker';
import { useTheme } from '@/lib/theme';
import { ThemedText } from './themed-text';
import { Button } from './button';
import { spacing, fontSize, borderRadius } from '@/constants/design-system';
import { IconX } from '@tabler/icons-react-native';

interface ColorPickerComponentProps {
  color: string;
  onColorChange: (color: string) => void;
  label?: string;
  disabled?: boolean;
}

const isValidHex = (hex: string): boolean => {
  return /^#[0-9A-Fa-f]{6}$/.test(hex);
};

const ensureValidColor = (color: string | undefined): string => {
  if (!color) return '#FF0000';
  if (isValidHex(color)) return color;
  // Try to fix common issues
  if (color.length === 4) {
    // Convert #RGB to #RRGGBB
    const r = color[1];
    const g = color[2];
    const b = color[3];
    return `#${r}${r}${g}${g}${b}${b}`.toUpperCase();
  }
  return '#FF0000';
};

export function ColorPickerComponent({ color, onColorChange, label, disabled = false }: ColorPickerComponentProps) {
  const { colors } = useTheme();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tempColor, setTempColor] = useState(() => ensureValidColor(color));
  const [pickerReady, setPickerReady] = useState(false);

  // Handle modal show event - safer than timer
  const handleModalShow = useCallback(() => {
    // Small delay after modal is shown to ensure layout is complete
    const timer = setTimeout(() => {
      setPickerReady(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Reset picker ready state when modal closes
  useEffect(() => {
    if (!isModalOpen) {
      setPickerReady(false);
    }
  }, [isModalOpen]);

  const handleColorSelect = useCallback((result: { hex: string }) => {
    const hexColor = result.hex.toUpperCase();
    // Only update if it's a valid 6-digit hex
    if (isValidHex(hexColor)) {
      setTempColor(hexColor);
    }
  }, []);

  const handleHexInputChange = (inputValue: string) => {
    let hex = inputValue;
    if (!hex.startsWith('#')) {
      hex = '#' + hex;
    }
    hex = hex.slice(0, 7).toUpperCase();
    setTempColor(hex);
  };

  const handleApply = () => {
    if (isValidHex(tempColor)) {
      onColorChange(tempColor);
      setIsModalOpen(false);
    }
  };

  const handleCancel = () => {
    setTempColor(ensureValidColor(color));
    setIsModalOpen(false);
  };

  const handleOpen = () => {
    setTempColor(ensureValidColor(color));
    setIsModalOpen(true);
  };

  const displayColor = ensureValidColor(color);

  return (
    <>
      {/* Trigger Button */}
      <View style={styles.container}>
        {label && (
          <ThemedText style={[styles.label, { color: colors.foreground }]}>
            {label}
          </ThemedText>
        )}
        <TouchableOpacity
          style={[
            styles.trigger,
            {
              backgroundColor: colors.background,
              borderColor: colors.border,
            },
          ]}
          onPress={() => !disabled && handleOpen()}
          disabled={disabled}
          activeOpacity={0.7}
        >
          <View
            style={[
              styles.colorPreview,
              {
                backgroundColor: displayColor,
                borderColor: colors.border,
              },
            ]}
          />
          <ThemedText style={[styles.colorText, { color: colors.foreground }]}>
            {displayColor}
          </ThemedText>
        </TouchableOpacity>
      </View>

      {/* Color Picker Modal */}
      <Modal
        visible={isModalOpen}
        animationType="fade"
        transparent={true}
        onRequestClose={handleCancel}
        onShow={handleModalShow}
        statusBarTranslucent
      >
        <View style={styles.gestureRoot}>
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={handleCancel}
          >
            <TouchableOpacity
              activeOpacity={1}
              onPress={(e) => e.stopPropagation()}
              style={[styles.modalContent, { backgroundColor: colors.background }]}
            >
              {/* Header */}
              <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
                <ThemedText style={[styles.modalTitle, { color: colors.foreground }]}>
                  Selecionar Cor
                </ThemedText>
                <TouchableOpacity onPress={handleCancel} style={styles.closeButton}>
                  <IconX size={24} color={colors.foreground} />
                </TouchableOpacity>
              </View>

              <View style={styles.modalBody}>
                {/* Color Picker - only render when ready, wrapped in its own gesture context */}
                {pickerReady ? (
                  <GestureHandlerRootView style={styles.pickerContainer}>
                    <ColorPicker
                      value={tempColor}
                      onComplete={handleColorSelect}
                      style={styles.colorPicker}
                      boundedThumb
                    >
                      <Preview style={styles.preview} hideInitialColor />
                      <Panel1 style={styles.panel} />
                      <HueSlider style={styles.hueSlider} />
                    </ColorPicker>
                  </GestureHandlerRootView>
                ) : (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                    <ThemedText style={{ color: colors.mutedForeground, marginTop: spacing.md }}>
                      Carregando...
                    </ThemedText>
                  </View>
                )}

                {/* Hex Input */}
                <View style={styles.hexInputSection}>
                  <ThemedText style={[styles.sectionLabel, { color: colors.foreground }]}>
                    Codigo Hexadecimal
                  </ThemedText>
                  <TextInput
                    style={[
                      styles.hexInput,
                      {
                        backgroundColor: colors.background,
                        borderColor: colors.border,
                        color: colors.foreground,
                      },
                    ]}
                    value={tempColor}
                    onChangeText={handleHexInputChange}
                    placeholder="#000000"
                    placeholderTextColor={colors.mutedForeground}
                    maxLength={7}
                    autoCapitalize="characters"
                  />
                  {!isValidHex(tempColor) && (
                    <ThemedText style={[styles.errorText, { color: colors.destructive }]}>
                      Cor invalida. Use o formato #RRGGBB
                    </ThemedText>
                  )}
                </View>
              </View>

              {/* Footer Actions */}
              <View style={[styles.modalFooter, { borderTopColor: colors.border }]}>
                <Button
                  variant="outline"
                  onPress={handleCancel}
                  style={styles.footerButton}
                >
                  <ThemedText style={{ color: colors.foreground }}>Cancelar</ThemedText>
                </Button>
                <Button
                  variant="default"
                  onPress={handleApply}
                  style={styles.footerButton}
                  disabled={!isValidHex(tempColor)}
                >
                  <ThemedText style={{ color: colors.primaryForeground }}>Aplicar</ThemedText>
                </Button>
              </View>
            </TouchableOpacity>
          </TouchableOpacity>
        </View>
      </Modal>
    </>
  );
}

// Re-export with the same name for backwards compatibility
export { ColorPickerComponent as ColorPicker };

const styles = StyleSheet.create({
  gestureRoot: {
    flex: 1,
  },
  container: {
    gap: spacing.sm,
  },
  label: {
    fontSize: fontSize.base,
    fontWeight: '500',
    marginBottom: spacing.xs,
  },
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    gap: spacing.sm,
  },
  colorPreview: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
  },
  colorText: {
    fontSize: fontSize.base,
    fontFamily: 'monospace',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: fontSize.xl,
    fontWeight: '600',
  },
  closeButton: {
    padding: spacing.xs,
  },
  modalBody: {
    padding: spacing.lg,
  },
  loadingContainer: {
    height: 320,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickerContainer: {
    width: '100%',
  },
  colorPicker: {
    width: '100%',
    gap: spacing.md,
  },
  preview: {
    height: 50,
    borderRadius: borderRadius.lg,
  },
  panel: {
    height: 200,
    borderRadius: borderRadius.md,
  },
  hueSlider: {
    height: 30,
    borderRadius: borderRadius.md,
  },
  hexInputSection: {
    marginTop: spacing.lg,
  },
  sectionLabel: {
    fontSize: fontSize.base,
    fontWeight: '500',
    marginBottom: spacing.sm,
  },
  hexInput: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    fontSize: fontSize.base,
    fontFamily: 'monospace',
  },
  errorText: {
    fontSize: fontSize.sm,
    marginTop: spacing.xs,
  },
  modalFooter: {
    flexDirection: 'row',
    padding: spacing.lg,
    gap: spacing.sm,
    borderTopWidth: 1,
  },
  footerButton: {
    flex: 1,
    height: 48,
    minHeight: 48,
  },
});
