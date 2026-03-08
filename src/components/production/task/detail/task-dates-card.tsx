import React from "react";
import { View, StyleSheet } from "react-native";
import { DetailCard, DetailField } from "@/components/ui/detail-page-layout";
import { ThemedText } from "@/components/ui/themed-text";
import { useTheme } from "@/lib/theme";
import { fontSize } from "@/constants/design-system";
import { formatDate, formatDateTime } from "@/utils";
import type { Task } from '../../../../types';

interface TaskDatesCardProps {
  task: Task & {
    entryDate?: Date | string;
    term?: Date | string;
    forecastDate?: Date | string | null;
    createdBy?: {
      name: string;
    };
  };
  /** Whether user can view restricted fields (forecastDate). Only ADMIN, FINANCIAL, COMMERCIAL, LOGISTIC, DESIGNER. Defaults to false for safety. */
  canViewRestrictedFields?: boolean;
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

      {/* Forecast Date */}
      {canViewRestrictedFields && task.forecastDate && (
        <DetailField
          label="Previsão"
          icon="calendar-stats"
          value={formatDate(task.forecastDate)}
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
});
