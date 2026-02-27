import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '@/lib/theme';
import { spacing, fontSize, fontWeight, borderRadius } from '@/constants/design-system';
import { FormCard } from '@/components/ui/form-section';
import { ThemedText } from '@/components/ui/themed-text';
import { BADGE_COLORS } from '@/constants/badge-colors';
import { MessageBlockRenderer } from '@/components/ui/message-block-renderer';
import { transformMessageContent } from '@/utils/message-transformer';
import type { ContentBlock } from './editor/types';

interface MessageOverviewStepProps {
  title: string;
  targetTypeLabel: string;
  targetSummary: string;
  isActive: boolean;
  blocks: ContentBlock[];
}

export function MessageOverviewStep({
  title,
  targetTypeLabel,
  targetSummary,
  isActive,
  blocks,
}: MessageOverviewStepProps) {
  const { colors } = useTheme();

  const rendererBlocks = useMemo(() => {
    if (!blocks || blocks.length === 0) return [];
    return transformMessageContent(blocks);
  }, [blocks]);

  return (
    <View>
      {/* Metadata Card */}
      <FormCard
        title="Revisão da Mensagem"
        subtitle="Verifique os dados antes de confirmar"
      >
        <View style={styles.reviewRow}>
          <ThemedText style={[styles.reviewLabel, { color: colors.mutedForeground }]}>Título</ThemedText>
          <ThemedText style={[styles.reviewValue, { color: colors.foreground }]}>{title || '-'}</ThemedText>
        </View>

        <View style={styles.reviewRow}>
          <ThemedText style={[styles.reviewLabel, { color: colors.mutedForeground }]}>Público Alvo</ThemedText>
          <ThemedText style={[styles.reviewValue, { color: colors.foreground }]}>{targetTypeLabel}</ThemedText>
        </View>

        <View style={styles.reviewRow}>
          <ThemedText style={[styles.reviewLabel, { color: colors.mutedForeground }]}>Destinatários</ThemedText>
          <ThemedText style={[styles.reviewValue, { color: colors.foreground }]}>{targetSummary}</ThemedText>
        </View>

        <View style={styles.reviewRow}>
          <ThemedText style={[styles.reviewLabel, { color: colors.mutedForeground }]}>Publicação</ThemedText>
          <View style={[
            styles.reviewBadge,
            { backgroundColor: isActive ? BADGE_COLORS.active.bg : BADGE_COLORS.secondary.bg }
          ]}>
            <ThemedText style={[
              styles.reviewBadgeText,
              { color: isActive ? BADGE_COLORS.active.text : BADGE_COLORS.secondary.text }
            ]}>
              {isActive ? 'Ativa' : 'Rascunho'}
            </ThemedText>
          </View>
        </View>
      </FormCard>

      {/* Content Preview Card */}
      <FormCard
        title="Prévia do Conteúdo"
        subtitle="Assim que a mensagem será exibida"
      >
        <View style={[styles.contentPreview, { backgroundColor: colors.muted, borderColor: colors.border }]}>
          {rendererBlocks.length > 0 ? (
            <MessageBlockRenderer blocks={rendererBlocks} />
          ) : (
            <ThemedText style={{ color: colors.mutedForeground, fontStyle: 'italic' }}>
              Sem conteúdo
            </ThemedText>
          )}
        </View>
      </FormCard>
    </View>
  );
}

const styles = StyleSheet.create({
  reviewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  reviewLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  reviewValue: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.normal,
    textAlign: 'right',
    flex: 1,
    marginLeft: spacing.md,
  },
  reviewBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 6,
  },
  reviewBadgeText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  contentPreview: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
  },
});
