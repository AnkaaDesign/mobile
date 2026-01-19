import { useState, useCallback, useEffect, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Pressable, Modal, ActivityIndicator, InteractionManager } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { runOnJS, useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import ColorPicker, { Panel1, HueSlider, Preview } from 'reanimated-color-picker';
import type { returnedResults } from 'reanimated-color-picker';
import { IconCheck, IconX } from '@tabler/icons-react-native';
import { useTheme } from '@/lib/theme';
import { ThemedText } from './themed-text';
import { Button } from './button';
import { Text } from './text';
import { spacing, fontSize, borderRadius } from '@/constants/design-system';
import { formSpacing, formLayout } from '@/constants/form-styles';

interface ColorPickerComponentProps {
  color: string;
  onColorChange: (color: string) => void;
  label?: string;
  disabled?: boolean;
  transparent?: boolean;
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

export function ColorPickerComponent({ color, onColorChange, label, disabled = false, transparent = false }: ColorPickerComponentProps) {
  const { colors } = useTheme();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tempColor, setTempColor] = useState(() => ensureValidColor(color));
  const [pickerMounted, setPickerMounted] = useState(false);
  const [pickerFullyRendered, setPickerFullyRendered] = useState(false);
  const interactionRef = useRef<ReturnType<typeof InteractionManager.runAfterInteractions> | null>(null);

  // Animated opacity for smooth fade-in
  const pickerOpacity = useSharedValue(0);
  const loadingOpacity = useSharedValue(1);

  const pickerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: pickerOpacity.value,
  }));

  const loadingAnimatedStyle = useAnimatedStyle(() => ({
    opacity: loadingOpacity.value,
  }));

  // Handle modal show event - wait for interactions to complete before mounting picker
  const handleModalShow = useCallback(() => {
    // Use InteractionManager to wait for modal animation to complete
    interactionRef.current = InteractionManager.runAfterInteractions(() => {
      setPickerMounted(true);
    });
  }, []);

  // Handle when the picker has fully rendered (called from onLayout of the picker container)
  const handlePickerLayout = useCallback(() => {
    if (pickerMounted && !pickerFullyRendered) {
      // Give an extra delay to ensure the color picker canvas is fully painted
      setTimeout(() => {
        setPickerFullyRendered(true);
        // Fade in the picker and fade out the loading
        pickerOpacity.value = withTiming(1, { duration: 200 });
        loadingOpacity.value = withTiming(0, { duration: 150 });
      }, 350);
    }
  }, [pickerMounted, pickerFullyRendered, pickerOpacity, loadingOpacity]);

  // Reset picker state when modal closes
  useEffect(() => {
    if (!isModalOpen) {
      setPickerMounted(false);
      setPickerFullyRendered(false);
      pickerOpacity.value = 0;
      loadingOpacity.value = 1;
      if (interactionRef.current) {
        interactionRef.current.cancel();
        interactionRef.current = null;
      }
    }
  }, [isModalOpen, pickerOpacity, loadingOpacity]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (interactionRef.current) {
        interactionRef.current.cancel();
      }
    };
  }, []);

  // Helper function to update color on JS thread
  const updateTempColor = useCallback((hexColor: string) => {
    if (isValidHex(hexColor)) {
      setTempColor(hexColor);
    }
  }, []);

  // Worklet callback for color picker - runs on UI thread
  const handleColorSelect = useCallback((result: returnedResults) => {
    'worklet';
    const hexColor = result.hex.toUpperCase();
    // Use runOnJS to update state from UI thread
    runOnJS(updateTempColor)(hexColor);
  }, [updateTempColor]);


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
              backgroundColor: transparent ? 'transparent' : colors.input,
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

      {/* Color Picker Modal - Centered with fade effect */}
      <Modal
        visible={isModalOpen}
        animationType="none"
        transparent={true}
        onRequestClose={handleCancel}
        onShow={handleModalShow}
        statusBarTranslucent
      >
        <GestureHandlerRootView style={styles.gestureRoot}>
          <View style={styles.modalOverlay}>
            <Pressable
              style={StyleSheet.absoluteFill}
              onPress={handleCancel}
            />
            <View
              style={[
                styles.modalContent,
                {
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                },
              ]}
            >
              {/* Header - compact */}
              <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
                <ThemedText style={[styles.modalTitle, { color: colors.foreground }]}>
                  Selecionar Cor
                </ThemedText>
                <TouchableOpacity onPress={handleCancel} style={styles.closeButton}>
                  <IconX size={20} color={colors.foreground} />
                </TouchableOpacity>
              </View>

              {/* Picker content - always mounted, starts invisible */}
              <Animated.View style={pickerAnimatedStyle}>
                <View style={styles.modalBody} onLayout={handlePickerLayout}>
                  {pickerMounted && (
                    <ColorPicker
                      value={tempColor}
                      onComplete={handleColorSelect}
                      style={styles.colorPicker}
                      boundedThumb
                    >
                      <Preview style={styles.preview} hideInitialColor hideText />
                      <Panel1 style={styles.panel} />
                      <HueSlider style={styles.hueSlider} />
                    </ColorPicker>
                  )}
                  {!pickerMounted && <View style={styles.pickerPlaceholder} />}
                </View>

                {/* Action Bar - same style as paint form */}
                <View
                  style={[
                    styles.actionBar,
                    {
                      borderColor: colors.border,
                      backgroundColor: colors.card,
                    },
                  ]}
                >
                  <View style={styles.buttonWrapper}>
                    <Button variant="outline" onPress={handleCancel}>
                      <IconX size={18} color={colors.mutedForeground} />
                      <Text style={styles.buttonText}>Cancelar</Text>
                    </Button>
                  </View>

                  <View style={styles.buttonWrapper}>
                    <Button
                      variant="default"
                      onPress={handleApply}
                      disabled={!isValidHex(tempColor)}
                    >
                      <IconCheck size={18} color={colors.primaryForeground} />
                      <Text style={[styles.buttonText, { color: colors.primaryForeground }]}>
                        Aplicar
                      </Text>
                    </Button>
                  </View>
                </View>
              </Animated.View>

              {/* Loading overlay - fades out when picker is ready */}
              {!pickerFullyRendered && (
                <Animated.View
                  style={[styles.loadingOverlay, loadingAnimatedStyle, { backgroundColor: colors.background }]}
                  pointerEvents="none"
                >
                  <ActivityIndicator size="large" color={colors.primary} />
                </Animated.View>
              )}
            </View>
          </View>
        </GestureHandlerRootView>
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
  // Centered modal overlay
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  // Centered modal content with rounded corners
  modalContent: {
    borderRadius: formLayout.cardBorderRadius,
    borderWidth: formLayout.borderWidth,
    width: '100%',
    maxWidth: 400,
    maxHeight: '90%',
    overflow: 'hidden',
  },
  // Compact header
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: fontSize.lg,
    fontWeight: '600',
  },
  closeButton: {
    padding: spacing.xs,
  },
  modalBody: {
    padding: spacing.md,
  },
  pickerPlaceholder: {
    height: 312, // preview (50) + panel (200) + hueSlider (30) + gaps (32)
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomLeftRadius: formLayout.cardBorderRadius,
    borderBottomRightRadius: formLayout.cardBorderRadius,
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
  // Action bar - same style as FormActionBar
  actionBar: {
    flexDirection: 'row',
    gap: formSpacing.rowGap,
    padding: formSpacing.actionBarPadding,
    borderTopWidth: formLayout.borderWidth,
  },
  buttonWrapper: {
    flex: 1,
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '600',
  },
});
