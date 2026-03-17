import React, { useState } from "react";
import { View, TouchableOpacity, ActivityIndicator, StyleSheet } from "react-native";
import { DetailCard, DetailField } from "@/components/ui/detail-page-layout";
import { ThemedText } from "@/components/ui/themed-text";
import { Icon } from "@/components/ui/icon";
import { useTheme } from "@/lib/theme";
import { fontSize, spacing } from "@/constants/design-system";
import { formatDate, formatDateTime } from "@/utils";
import { useForecastHistory } from "@/hooks/useTask";
import type { Task } from '../../../../types';
import type { TaskForecastHistory } from '@/types/task';

interface TaskDatesCardProps {
  task: Task & {
    entryDate?: Date | string;
    term?: Date | string;
    forecastDate?: Date | string | null;
    createdBy?: {
      name: string;
    };
  };
  canViewRestrictedFields?: boolean;
}

function formatRelativeTime(date: Date | string): string {
  const now = new Date();
  const d = new Date(date);
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "agora";
  if (diffMins < 60) return `${diffMins}min atrás`;
  if (diffHours < 24) return `${diffHours}h atrás`;
  if (diffDays < 7) return `${diffDays}d atrás`;
  return formatDateTime(date);
}

function HistoryEntry({ entry }: { entry: TaskForecastHistory }) {
  const { colors } = useTheme();

  return (
    <View style={styles.entryContainer}>
      {/* Name + relative time */}
      <View style={styles.entryHeader}>
        <ThemedText style={[styles.entryName, { color: colors.foreground }]}>
          {entry.changedBy?.name || "Sistema"}
        </ThemedText>
        <ThemedText style={[styles.entryTime, { color: colors.mutedForeground }]}>
          {formatRelativeTime(entry.createdAt)}
        </ThemedText>
      </View>

      {/* Date range + reason inline */}
      <View style={styles.entryDates}>
        <ThemedText style={[styles.entryDateMuted, { color: colors.mutedForeground }]}>
          {entry.previousDate ? formatDateTime(entry.previousDate) : "—"}
        </ThemedText>
        <Icon name="arrow-right" size={12} color={colors.mutedForeground} />
        <ThemedText style={[styles.entryDateBold, { color: colors.foreground }]}>
          {entry.newDate ? formatDateTime(entry.newDate) : "—"}
        </ThemedText>
        {entry.reason && (
          <>
            <ThemedText style={[styles.entryReasonDash, { color: colors.mutedForeground }]}>—</ThemedText>
            <ThemedText style={[styles.entryReason, { color: colors.foreground }]} numberOfLines={1}>
              {entry.reason}
            </ThemedText>
          </>
        )}
      </View>
    </View>
  );
}

function ForecastHistory({ taskId }: { taskId: string }) {
  const { colors } = useTheme();
  const [expanded, setExpanded] = useState(false);
  const { data, isLoading } = useForecastHistory(taskId, expanded);

  const entries: TaskForecastHistory[] = data?.data ?? [];

  return (
    <View style={styles.historyWrapper}>
      <TouchableOpacity onPress={() => setExpanded(!expanded)} activeOpacity={0.7}>
        <ThemedText style={[styles.toggleText, { color: colors.mutedForeground }]}>
          {expanded ? "Ocultar histórico" : "Ver histórico de reagendamentos"}
        </ThemedText>
      </TouchableOpacity>

      {expanded && (
        <View style={styles.historyContent}>
          {isLoading && (
            <View style={styles.loadingRow}>
              <ActivityIndicator size="small" color={colors.primary} />
              <ThemedText style={[styles.loadingText, { color: colors.mutedForeground }]}>
                Carregando histórico...
              </ThemedText>
            </View>
          )}

          {!isLoading && entries.length === 0 && (
            <ThemedText style={[styles.emptyText, { color: colors.mutedForeground }]}>
              Nenhum reagendamento registrado.
            </ThemedText>
          )}

          {!isLoading && entries.length > 0 && (
            <View style={styles.timeline}>
              <View style={styles.timelineHeader}>
                <Icon name="history" size={14} color={colors.foreground} />
                <ThemedText style={[styles.timelineTitle, { color: colors.foreground }]}>
                  Histórico de Reagendamentos ({entries.length})
                </ThemedText>
              </View>
              {entries.map((entry) => (
                <View key={entry.id} style={[styles.timelineEntry, { borderLeftColor: colors.border }]}>
                  <HistoryEntry entry={entry} />
                </View>
              ))}
            </View>
          )}
        </View>
      )}
    </View>
  );
}

export const TaskDatesCard: React.FC<TaskDatesCardProps> = React.memo(({ task, canViewRestrictedFields = false }) => {
  const { colors } = useTheme();

  const isOverdue = task.term && new Date(task.term) < new Date() &&
    task.status !== "COMPLETED" && task.status !== "CANCELLED";

  return (
    <DetailCard title="Datas" icon="calendar-week">
      {/* Created At */}
      <DetailField
        label="Criado"
        icon="calendar-plus"
        value={
          <View>
            <ThemedText style={[styles.value, { color: colors.foreground }]}>
              {formatDateTime(task.createdAt)}
            </ThemedText>
            {task.createdBy && (
              <ThemedText style={[styles.subtext, { color: colors.mutedForeground }]}>
                por {task.createdBy.name}
              </ThemedText>
            )}
          </View>
        }
      />

      {/* Forecast Date + History */}
      {canViewRestrictedFields && task.forecastDate && (
        <View>
          <DetailField
            label="Previsão de Liberação"
            icon="calendar-stats"
            value={
              task.cleared ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <ThemedText style={{ fontSize: 13, fontWeight: '600', color: '#3b82f6' }}>Liberado</ThemedText>
                  <ThemedText style={{ fontSize: 13, color: '#3b82f6' }}>{formatDateTime(task.forecastDate)}</ThemedText>
                </View>
              ) : formatDateTime(task.forecastDate)
            }
          />
          <ForecastHistory taskId={task.id} />
        </View>
      )}

      {/* Entry Date */}
      {task.entryDate && (
        <DetailField
          label="Entrada"
          icon="calendar"
          value={formatDate(task.entryDate)}
        />
      )}

      {/* Term/Deadline */}
      {task.term && (
        <DetailField
          label="Prazo"
          icon="calendar-event"
          iconColor={isOverdue ? colors.destructive : undefined}
          value={
            <ThemedText style={[
              styles.value,
              { color: isOverdue ? colors.destructive : colors.foreground },
              isOverdue && styles.overdueText,
            ]}>
              {formatDate(task.term)}
              {isOverdue && " (Atrasado)"}
            </ThemedText>
          }
        />
      )}

      {/* Started At */}
      {task.startedAt && (
        <DetailField
          label="Iniciado"
          icon="calendar-stats"
          value={formatDateTime(task.startedAt)}
        />
      )}

      {/* Finished At */}
      {task.finishedAt && (
        <DetailField
          label="Finalizado"
          icon="calendar-check"
          iconColor="#10b981"
          value={formatDateTime(task.finishedAt)}
        />
      )}
    </DetailCard>
  );
});

const styles = StyleSheet.create({
  value: {
    fontSize: fontSize.sm,
    fontWeight: "600",
  },
  overdueText: {
    fontWeight: "600",
  },
  subtext: {
    fontSize: fontSize.xs,
    marginTop: 2,
  },
  // Toggle
  historyWrapper: {
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  toggleText: {
    fontSize: fontSize.xs,
    fontWeight: "500",
  },
  // History content
  historyContent: {
    marginTop: spacing.sm,
  },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  loadingText: {
    fontSize: fontSize.sm,
  },
  emptyText: {
    fontSize: fontSize.sm,
  },
  // Timeline
  timeline: {
    gap: 0,
  },
  timelineHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  timelineTitle: {
    fontSize: fontSize.sm,
    fontWeight: "600",
  },
  timelineEntry: {
    borderLeftWidth: 2,
    paddingLeft: spacing.md,
    paddingBottom: spacing.sm,
  },
  // Entry
  entryContainer: {
    gap: 2,
  },
  entryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  entryName: {
    fontSize: fontSize.sm,
    fontWeight: "600",
  },
  entryTime: {
    fontSize: fontSize.xs,
  },
  entryDates: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    flexWrap: "wrap",
  },
  entryDateMuted: {
    fontSize: fontSize.sm,
  },
  entryDateBold: {
    fontSize: fontSize.sm,
    fontWeight: "600",
  },
  entryReasonDash: {
    fontSize: fontSize.sm,
  },
  entryReason: {
    fontSize: fontSize.sm,
    fontStyle: "italic",
    flexShrink: 1,
  },
});
