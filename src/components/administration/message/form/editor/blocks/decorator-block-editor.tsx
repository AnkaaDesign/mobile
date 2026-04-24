import React, { useState } from 'react';
import { View, Image, Modal, TouchableOpacity, ScrollView, StyleSheet, Text } from 'react-native';
import { useTheme } from '@/lib/theme';
import { borderRadius, spacing, fontSize } from '@/constants/design-system';
import { ThemedText } from '@/components/ui/themed-text';
import type { DecoratorBlock, DecoratorVariant } from '../types';

interface DecoratorBlockEditorProps {
  block: DecoratorBlock;
  onUpdate: (updates: Partial<DecoratorBlock>) => void;
  disabled?: boolean;
}

const DECORATOR_IMAGES: Record<DecoratorVariant, ReturnType<typeof require>> = {
  'header-logo': require('../../../../../../../assets/header-logo.webp'),
  'header-logo-stripes': require('../../../../../../../assets/header-logo-stripes.webp'),
  'footer-wave-dark': require('../../../../../../../assets/footer-wave-dark.webp'),
  'footer-wave-logo': require('../../../../../../../assets/footer-wave-logo.webp'),
  'footer-diagonal-stripes': require('../../../../../../../assets/footer-diagonal-stripes.webp'),
  'footer-wave-gold': require('../../../../../../../assets/footer-wave-gold.webp'),
  'footer-geometric': require('../../../../../../../assets/footer-geometric.webp'),
};

const VARIANT_LABELS: Record<DecoratorVariant, string> = {
  'header-logo': 'Logo',
  'header-logo-stripes': 'Logo + Listras',
  'footer-wave-dark': 'Onda Escura',
  'footer-wave-logo': 'Onda + Logo',
  'footer-diagonal-stripes': 'Listras Diagonais',
  'footer-wave-gold': 'Onda Dourada',
  'footer-geometric': 'Geométrico',
};

const VARIANT_ASPECTS: Record<DecoratorVariant, number> = {
  'header-logo': 2481 / 458,
  'header-logo-stripes': 2481 / 252,
  'footer-wave-dark': 2488 / 412,
  'footer-wave-logo': 2480 / 502,
  'footer-diagonal-stripes': 2481 / 252,
  'footer-wave-gold': 2481 / 550,
  'footer-geometric': 2480 / 545,
};

const HEADER_VARIANTS: DecoratorVariant[] = ['header-logo', 'header-logo-stripes'];
const FOOTER_VARIANTS: DecoratorVariant[] = [
  'footer-wave-dark',
  'footer-wave-logo',
  'footer-diagonal-stripes',
  'footer-wave-gold',
  'footer-geometric',
];

export function DecoratorBlockEditor({ block, onUpdate, disabled }: DecoratorBlockEditorProps) {
  const { colors } = useTheme();
  const [showModal, setShowModal] = useState(false);

  const source = DECORATOR_IMAGES[block.variant] ?? DECORATOR_IMAGES['footer-wave-dark'];
  const isHeader = block.variant.startsWith('header-');
  const variants = isHeader ? HEADER_VARIANTS : FOOTER_VARIANTS;
  const groupLabel = isHeader ? 'Cabeçalho' : 'Rodapé';

  return (
    <View style={styles.container}>
      {/* Current preview (non-interactive) */}
      <View pointerEvents="none">
        <Image source={source} style={styles.preview} resizeMode="cover" />
      </View>

      {/* Change button */}
      <TouchableOpacity
        style={[styles.changeButton, { borderColor: colors.border }]}
        onPress={() => setShowModal(true)}
        disabled={disabled}
      >
        <ThemedText style={[styles.changeButtonText, { color: colors.foreground }]}>
          Alterar {groupLabel}
        </ThemedText>
      </TouchableOpacity>

      {/* Picker Modal */}
      <Modal
        visible={showModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowModal(false)}
      >
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={() => setShowModal(false)}
        >
          <View
            style={[styles.modalContent, { backgroundColor: colors.card, borderColor: colors.border }]}
            onStartShouldSetResponder={() => true}
          >
            <ThemedText style={[styles.modalTitle, { color: colors.foreground }]}>
              Selecionar {groupLabel}
            </ThemedText>

            <ScrollView showsVerticalScrollIndicator={false}>
              {variants.map((v) => {
                const isSelected = block.variant === v;
                return (
                  <TouchableOpacity
                    key={v}
                    style={[
                      styles.option,
                      {
                        borderColor: isSelected ? colors.primary : colors.border,
                        borderWidth: isSelected ? 2 : 1,
                        marginBottom: spacing.sm,
                      },
                    ]}
                    onPress={() => { onUpdate({ variant: v }); setShowModal(false); }}
                  >
                    <Image
                      source={DECORATOR_IMAGES[v]}
                      style={[styles.optionImage, { aspectRatio: VARIANT_ASPECTS[v] }]}
                      resizeMode="contain"
                    />
                    <Text
                      style={[
                        styles.optionLabel,
                        { color: isSelected ? colors.primary : colors.mutedForeground },
                        isSelected && styles.optionLabelSelected,
                      ]}
                      numberOfLines={1}
                    >
                      {VARIANT_LABELS[v]}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    gap: spacing.sm,
  },
  preview: {
    width: '100%',
    height: 80,
  },
  changeButton: {
    borderWidth: 1,
    borderRadius: borderRadius.md,
    paddingVertical: 10,
    alignItems: 'center',
  },
  changeButtonText: {
    fontSize: fontSize.sm,
    fontWeight: '500',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  modalContent: {
    width: '100%',
    maxWidth: 380,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    padding: spacing.lg,
    gap: spacing.md,
  },
  modalTitle: {
    fontSize: fontSize.base,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  grid: {
    gap: spacing.sm,
  },
  option: {
    flex: 1,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
  },
  optionImage: {
    width: '100%',
  },
  optionLabel: {
    fontSize: 11,
    textAlign: 'center',
    paddingVertical: 5,
    paddingHorizontal: 4,
  },
  optionLabelSelected: {
    fontWeight: '600',
  },
});
