import React, { useState } from 'react';
import { View, Image, TouchableOpacity, StyleSheet, Text, type ImageSourcePropType } from 'react-native';
import { useTheme } from '@/lib/theme';
import { borderRadius, spacing, fontSize } from '@/constants/design-system';
import { ThemedText } from '@/components/ui/themed-text';
import { StandardModal } from '@/components/ui/standard-modal';
import type { DecoratorBlock, DecoratorVariant } from '../types';

interface DecoratorBlockEditorProps {
  block: DecoratorBlock;
  onUpdate: (updates: Partial<DecoratorBlock>) => void;
  disabled?: boolean;
}

const DECORATOR_IMAGES: Record<DecoratorVariant, ImageSourcePropType> = {
  'header-logo': require('../../../../../../../assets/header-logo.png'),
  'header-logo-stripes': require('../../../../../../../assets/header-logo-stripes.png'),
  'footer-wave-dark': require('../../../../../../../assets/footer-wave-dark.png'),
  'footer-wave-logo': require('../../../../../../../assets/footer-wave-logo.png'),
  'footer-diagonal-stripes': require('../../../../../../../assets/footer-diagonal-stripes.png'),
  'footer-wave-gold': require('../../../../../../../assets/footer-wave-gold.png'),
  'footer-geometric': require('../../../../../../../assets/footer-geometric.png'),
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
      <StandardModal
        visible={showModal}
        onClose={() => setShowModal(false)}
        title={`Selecionar ${groupLabel}`}
      >
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
      </StandardModal>
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
