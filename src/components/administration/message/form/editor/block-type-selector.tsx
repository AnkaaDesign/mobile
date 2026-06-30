import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '@/lib/theme';
import { spacing, borderRadius } from '@/constants/design-system';
import { StandardModal } from '@/components/ui/standard-modal';
import { ThemedText } from '@/components/ui/themed-text';
import {
  IconH1, IconH2, IconH3, IconTextSize, IconPhoto, IconClick,
  IconMinus, IconSpacingVertical, IconList, IconQuote, IconStar,
  IconColumns, IconPalette, IconBuilding, IconChevronRight, IconClipboardText,
} from '@tabler/icons-react-native';
import { BLOCK_TYPE_CONFIG } from './block-utils';
import type { BlockType } from './types';

const ICON_MAP: Record<string, React.ComponentType<{ size?: number; color?: string }>> = {
  IconH1, IconH2, IconH3, IconTextSize, IconPhoto, IconClick,
  IconMinus, IconSpacingVertical, IconList, IconQuote, IconStar,
  IconColumns, IconPalette, IconBuilding,
};

// Group block types into the same categories the web editor uses, so the
// flat grid becomes a scannable, sectioned list. (Título 3 removed to match web.)
const CATEGORIES: Array<{ title: string; types: BlockType[] }> = [
  { title: 'Texto', types: ['heading1', 'heading2', 'paragraph', 'quote'] },
  { title: 'Mídia', types: ['image', 'button', 'divider'] },
  { title: 'Layout', types: ['spacer', 'list', 'icon', 'row'] },
  { title: 'Decorativos', types: ['decorator', 'company-asset'] },
];

interface BlockTypeSelectorProps {
  open: boolean;
  onClose: () => void;
  onSelect: (type: BlockType) => void;
  excludeTypes?: BlockType[];
  /** "Simples" flow — paste already-formatted text with auto logo + footer. Omit to hide (e.g. inside rows). */
  onSimple?: () => void;
}

export function BlockTypeSelector({ open, onClose, onSelect, excludeTypes, onSimple }: BlockTypeSelectorProps) {
  const { colors } = useTheme();

  const configByType = React.useMemo(
    () => Object.fromEntries(BLOCK_TYPE_CONFIG.map((c) => [c.type, c])),
    []
  );

  const handleSelect = (type: BlockType) => {
    onSelect(type);
    onClose();
  };

  return (
    <StandardModal
      visible={open}
      onClose={onClose}
      title="Adicionar bloco"
      subtitle="Escolha um tipo de bloco para inserir na mensagem"
      padded={false}
      bodyStyle={styles.scrollContent}
    >
      {onSimple && (
        <View style={styles.section}>
          <ThemedText style={[styles.sectionTitle, { color: colors.mutedForeground }]}>
            Rápido
          </ThemedText>
          <View style={[styles.sectionCard, { backgroundColor: colors.muted, borderColor: colors.primary }]}>
            <TouchableOpacity
              style={styles.row}
              onPress={() => { onSimple(); onClose(); }}
              activeOpacity={0.6}
            >
              <View style={[styles.rowIcon, { backgroundColor: colors.card }]}>
                <IconClipboardText size={20} color={colors.primary} />
              </View>
              <View style={styles.rowText}>
                <ThemedText style={[styles.rowLabel, { color: colors.foreground }]}>
                  Simples
                </ThemedText>
                <ThemedText style={[styles.rowDesc, { color: colors.mutedForeground }]}>
                  Colar texto formatado — logo e rodapé automáticos
                </ThemedText>
              </View>
              <IconChevronRight size={18} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {CATEGORIES.map((category) => {
        const types = category.types.filter(
          (t) => !excludeTypes?.includes(t) && configByType[t]
        );
        if (types.length === 0) return null;

        return (
          <View key={category.title} style={styles.section}>
            <ThemedText style={[styles.sectionTitle, { color: colors.mutedForeground }]}>
              {category.title}
            </ThemedText>

            <View style={[styles.sectionCard, { backgroundColor: colors.muted, borderColor: colors.border }]}>
              {types.map((type, idx) => {
                const item = configByType[type];
                const IconComp = ICON_MAP[item.iconName];
                return (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.row,
                      idx !== types.length - 1 && {
                        borderBottomWidth: StyleSheet.hairlineWidth,
                        borderBottomColor: colors.border,
                      },
                    ]}
                    onPress={() => handleSelect(type)}
                    activeOpacity={0.6}
                  >
                    <View style={[styles.rowIcon, { backgroundColor: colors.card }]}>
                      {IconComp && <IconComp size={20} color={colors.primary} />}
                    </View>
                    <View style={styles.rowText}>
                      <ThemedText style={[styles.rowLabel, { color: colors.foreground }]}>
                        {item.label}
                      </ThemedText>
                      <ThemedText style={[styles.rowDesc, { color: colors.mutedForeground }]}>
                        {item.description}
                      </ThemedText>
                    </View>
                    <IconChevronRight size={18} color={colors.mutedForeground} />
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        );
      })}
    </StandardModal>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: spacing.sm,
    marginLeft: spacing.xs,
  },
  sectionCard: {
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  rowIcon: {
    width: 38,
    height: 38,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowText: {
    flex: 1,
    gap: 2,
  },
  rowLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  rowDesc: {
    fontSize: 12,
  },
});
