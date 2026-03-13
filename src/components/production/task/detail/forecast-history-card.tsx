import React, { useState } from 'react';
import { View, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { DetailCard } from '@/components/ui/detail-page-layout';
import { ThemedText } from '@/components/ui/themed-text';
import { Icon } from '@/components/ui/icon';
import { useTheme } from '@/lib/theme';
import { spacing, fontSize, borderRadius } from '@/constants/design-system';
import { formatDateTime } from '@/utils';
import { useForecastHistory } from '@/hooks/useTask';
import type { TaskForecastHistory, TaskForecastHistorySource } from '@/types/task';

interface ForecastHistoryCardProps {
  taskId: string;
}

const SOURCE_LABELS: Record<TaskForecastHistorySource, string> = {
  MANUAL: 'Manual',
  AUTO_ENTRY_DATE: 'Auto (data de entrada)',
  AUTO_STARTED_AT: 'Auto (data de início)',
  COPY: 'Cópia',
  INITIAL: 'Inicial',
};

export const ForecastHistoryCard: React.FC<ForecastHistoryCardProps> = React.memo(({ taskId }) => {
  const { colors } = useTheme();
  const [expanded, setExpanded] = useState(false);
  const { data, isLoading } = useForecastHistory(taskId, expanded);

  const entries: TaskForecastHistory[] = data?.data ?? [];

  return (
    <DetailCard title="Histórico de Previsão" icon="calendar-stats">
      <TouchableOpacity
        onPress={() => setExpanded(!expanded)}
        style={[styles.toggleButton, { borderColor: colors.border }]}
        activeOpacity={0.7}
      >
        <View style={styles.toggleContent}>
          <Icon
            name={expanded ? 'chevron-up' : 'chevron-down'}
            size={18}
            color={colors.mutedForeground}
          />
          <ThemedText style={[styles.toggleText, { color: colors.mutedForeground }]}>
            {expanded ? 'Ocultar histórico' : 'Ver histórico de alterações'}
          </ThemedText>
        </View>
      </TouchableOpacity>

      {expanded && (
        <View style={styles.historyContainer}>
          {isLoading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={colors.primary} />
              <ThemedText style={[styles.loadingText, { color: colors.mutedForeground }]}>
                Carregando histórico...
              </ThemedText>
            </View>
          )}

          {!isLoading && entries.length === 0 && (
            <ThemedText style={[styles.emptyText, { color: colors.mutedForeground }]}>
              Nenhuma alteração de previsão registrada.
            </ThemedText>
          )}

          {!isLoading && entries.map((entry, index) => (
            <View
              key={entry.id}
              style={[
                styles.entryCard,
                { backgroundColor: colors.muted, borderColor: colors.border },
                index < entries.length - 1 && styles.entryMarginBottom,
              ]}
            >
              {/* Header: source badge + date */}
              <View style={styles.entryHeader}>
                <View style={[styles.sourceBadge, { backgroundColor: colors.primary + '20' }]}>
                  <ThemedText style={[styles.sourceBadgeText, { color: colors.primary }]}>
                    {SOURCE_LABELS[entry.source] ?? entry.source}
                  </ThemedText>
                </View>
                <ThemedText style={[styles.entryDate, { color: colors.mutedForeground }]}>
                  {formatDateTime(entry.createdAt)}
                </ThemedText>
              </View>

              {/* Date change */}
              <View style={styles.dateChangeRow}>
                <ThemedText style={[styles.dateLabel, { color: colors.mutedForeground }]}>
                  {entry.previousDate ? formatDateTime(entry.previousDate) : 'Sem data'}
                </ThemedText>
                <Icon name="arrow-right" size={14} color={colors.mutedForeground} />
                <ThemedText style={[styles.dateLabel, { color: colors.foreground, fontWeight: '600' }]}>
                  {entry.newDate ? formatDateTime(entry.newDate) : 'Sem data'}
                </ThemedText>
              </View>

              {/* Reason */}
              {entry.reason && (
                <View style={styles.reasonContainer}>
                  <ThemedText style={[styles.reasonLabel, { color: colors.mutedForeground }]}>
                    Motivo:
                  </ThemedText>
                  <ThemedText style={[styles.reasonText, { color: colors.foreground }]}>
                    {entry.reason}
                  </ThemedText>
                </View>
              )}

              {/* Changed by */}
              {entry.changedBy && (
                <ThemedText style={[styles.changedBy, { color: colors.mutedForeground }]}>
                  por {entry.changedBy.name}
                </ThemedText>
              )}
            </View>
          ))}
        </View>
      )}
    </DetailCard>
  );
});

const styles = StyleSheet.create({
  toggleButton: {
    borderWidth: 1,
    borderRadius: borderRadius.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  toggleContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  toggleText: {
    fontSize: fontSize.sm,
    fontWeight: '500',
  },
  historyContainer: {
    marginTop: spacing.md,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.lg,
  },
  loadingText: {
    fontSize: fontSize.sm,
  },
  emptyText: {
    fontSize: fontSize.sm,
    textAlign: 'center',
    paddingVertical: spacing.lg,
  },
  entryCard: {
    borderWidth: 1,
    borderRadius: borderRadius.sm,
    padding: spacing.md,
  },
  entryMarginBottom: {
    marginBottom: spacing.sm,
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  sourceBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  sourceBadgeText: {
    fontSize: fontSize.xs,
    fontWeight: '600',
  },
  entryDate: {
    fontSize: fontSize.xs,
  },
  dateChangeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  dateLabel: {
    fontSize: fontSize.sm,
  },
  reasonContainer: {
    marginBottom: spacing.xs,
  },
  reasonLabel: {
    fontSize: fontSize.xs,
    marginBottom: 2,
  },
  reasonText: {
    fontSize: fontSize.sm,
  },
  changedBy: {
    fontSize: fontSize.xs,
    marginTop: spacing.xs,
  },
});
