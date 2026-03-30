import React, { useState } from "react";
import { View, TouchableOpacity, ActivityIndicator, StyleSheet } from "react-native";
import { DetailCard, DetailField } from "@/components/ui/detail-page-layout";
import { ThemedText } from "@/components/ui/themed-text";
import { Icon } from "@/components/ui/icon";
import { useTheme } from "@/lib/theme";
import { fontSize, spacing, borderRadius, fontWeight } from "@/constants/design-system";
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

function HistoryEntry({ entry, isLast }: { entry: TaskForecastHistory; isLast: boolean }) {
  const { colors } = useTheme();

  return (
    <View style={[styles.entryContainer, !isLast && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border, paddingBottom: spacing.sm, marginBottom: spacing.sm }]}>
      {/* Name + relative time */}
      <View style={styles.entryHeader}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
          <Icon name="user" size={12} color={colors.mutedForeground} />
          <ThemedText style={[styles.entryName, { color: colors.foreground }]}>
            {entry.changedBy?.name || "Sistema"}
          </ThemedText>
        </View>
        <ThemedText style={[styles.entryTime, { color: colors.mutedForeground }]}>
          {formatRelativeTime(entry.createdAt)}
        </ThemedText>
      </View>

      {/* Date range */}
      <View style={[styles.entryDates, { backgroundColor: colors.muted, borderRadius: borderRadius.sm, padding: spacing.xs, marginTop: spacing.xs }]}>
        <ThemedText style={[styles.entryDateMuted, { color: colors.mutedForeground }]}>
          {entry.previousDate ? formatDate(entry.previousDate) : "—"}
        </ThemedText>
        <Icon name="arrow-right" size={12} color={colors.primary} />
        <ThemedText style={[styles.entryDateBold, { color: colors.primary }]}>
          {entry.newDate ? formatDate(entry.newDate) : "—"}
        </ThemedText>
      </View>

      {/* Reason */}
      {entry.reason && (
        <ThemedText style={[styles.entryReason, { color: colors.mutedForeground }]} numberOfLines={2}>
          {entry.reason}
        </ThemedText>
      )}
    </View>
  );
}

function ForecastHistory({ taskId }: { taskId: string }) {
  const { colors } = useTheme();
  const [expanded, setExpanded] = useState(false);
  // Always fetch to know if there are entries
  const { data, isLoading } = useForecastHistory(taskId, true);

  const entries: TaskForecastHistory[] = data?.data ?? [];

  // Don't show anything if no reschedule history
  if (!isLoading && entries.length === 0) return null;

  // Show loading indicator while fetching (brief)
  if (isLoading) return null;

  return (
    <View style={styles.historyWrapper}>
      <TouchableOpacity
        onPress={() => setExpanded(!expanded)}
        activeOpacity={0.7}
        style={[styles.toggleButton, { backgroundColor: colors.muted, borderColor: colors.border }]}
      >
        <Icon name="history" size={14} color={colors.primary} />
        <ThemedText style={[styles.toggleText, { color: colors.primary }]}>
          {expanded ? "Ocultar histórico" : `Ver histórico de reagendamentos (${entries.length})`}
        </ThemedText>
        <Icon name={expanded ? "chevron-up" : "chevron-down"} size={14} color={colors.primary} />
      </TouchableOpacity>

      {expanded && (
        <View style={[styles.historyContent, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.timelineHeader}>
            <Icon name="calendar-stats" size={14} color={colors.primary} />
            <ThemedText style={[styles.timelineTitle, { color: colors.foreground }]}>
              Reagendamentos
            </ThemedText>
            <View style={[styles.countBadge, { backgroundColor: colors.primary + '15' }]}>
              <ThemedText style={[styles.countText, { color: colors.primary }]}>{entries.length}</ThemedText>
            </View>
          </View>
          {entries.map((entry, index) => (
            <HistoryEntry key={entry.id} entry={entry} isLast={index === entries.length - 1} />
          ))}
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
                  <View style={[styles.clearedBadge, { backgroundColor: '#3b82f615' }]}>
                    <Icon name="check" size={12} color="#3b82f6" />
                    <ThemedText style={{ fontSize: 13, fontWeight: '600', color: '#3b82f6' }}>Liberado</ThemedText>
                  </View>
                  <ThemedText style={{ fontSize: 13, color: colors.mutedForeground }}>{formatDateTime(task.forecastDate)}</ThemedText>
                </View>
              ) : (
                <ThemedText style={[styles.value, { color: colors.foreground }]}>
                  {formatDateTime(task.forecastDate)}
                </ThemedText>
              )
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
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
              <ThemedText style={[
                styles.value,
                { color: isOverdue ? colors.destructive : colors.foreground },
              ]}>
                {formatDate(task.term)}
              </ThemedText>
              {isOverdue && (
                <View style={[styles.overdueBadge, { backgroundColor: colors.destructive + '15' }]}>
                  <Icon name="alert-circle" size={12} color={colors.destructive} />
                  <ThemedText style={{ fontSize: fontSize.xs, fontWeight: '600', color: colors.destructive }}>
                    Atrasado
                  </ThemedText>
                </View>
              )}
            </View>
          }
        />
      )}

      {/* Started At */}
      {task.startedAt && (
        <DetailField
          label="Iniciado"
          icon="player-play"
          value={formatDateTime(task.startedAt)}
        />
      )}

      {/* Finished At */}
      {task.finishedAt && (
        <DetailField
          label="Finalizado"
          icon="calendar-check"
          iconColor="#10b981"
          value={
            <ThemedText style={[styles.value, { color: '#10b981' }]}>
              {formatDateTime(task.finishedAt)}
            </ThemedText>
          }
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
  subtext: {
    fontSize: fontSize.xs,
    marginTop: 2,
  },
  // Cleared badge
  clearedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  // Overdue badge
  overdueBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  // Toggle button
  historyWrapper: {
    paddingHorizontal: spacing.sm,
    marginTop: spacing.xs,
    marginBottom: spacing.xs,
  },
  toggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
    borderWidth: 1,
  },
  toggleText: {
    fontSize: fontSize.xs,
    fontWeight: "600",
    flex: 1,
  },
  // History content
  historyContent: {
    marginTop: spacing.sm,
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
  },
  // Timeline
  timelineHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    marginBottom: spacing.md,
    paddingBottom: spacing.xs,
  },
  timelineTitle: {
    fontSize: fontSize.sm,
    fontWeight: "600",
    flex: 1,
  },
  countBadge: {
    paddingHorizontal: spacing.xs,
    paddingVertical: 1,
    borderRadius: borderRadius.full,
    minWidth: 22,
    alignItems: 'center',
  },
  countText: {
    fontSize: fontSize.xs,
    fontWeight: "700",
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
  },
  entryDateMuted: {
    fontSize: fontSize.sm,
  },
  entryDateBold: {
    fontSize: fontSize.sm,
    fontWeight: "600",
  },
  entryReason: {
    fontSize: fontSize.xs,
    fontStyle: "italic",
    marginTop: spacing.xs,
  },
});
