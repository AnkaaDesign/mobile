import React from "react";
import { View, StyleSheet } from "react-native";
import { Card } from "@/components/ui/card";
import { ThemedText } from "@/components/ui/themed-text";
import { Separator } from "@/components/ui/separator";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize } from "@/constants/design-system";
import { formatDate, formatDateTime } from '../../../../utils';
import type { Task } from '../../../../types';
import {
  IconCalendar,
  IconClock,
  IconCheck,
} from "@tabler/icons-react-native";

interface TaskDatesCardProps {
  task: Task & {
    entryDate?: Date | string;
    term?: Date | string;
    createdBy?: {
      name: string;
    };
  };
}

export const TaskDatesCard: React.FC<TaskDatesCardProps> = ({ task }) => {
  const { colors } = useTheme();

  const isOverdue = task.term && new Date(task.term) < new Date() &&
    task.status !== "COMPLETED" && task.status !== "CANCELLED";

  return (
    <Card style={styles.card}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <IconCalendar size={20} color={colors.mutedForeground} />
        <ThemedText style={styles.title}>Datas</ThemedText>
      </View>

      <View style={styles.content}>
        {/* Entry Date */}
        {task.entryDate && (
          <View style={styles.dateItem}>
            <IconCalendar size={20} color={colors.mutedForeground} />
            <View style={styles.dateText}>
              <ThemedText style={[styles.label, { color: colors.mutedForeground }]}>Entrada</ThemedText>
              <ThemedText style={[styles.value, { color: colors.foreground }]}>
                {formatDate(task.entryDate)}
              </ThemedText>
            </View>
          </View>
        )}

        {/* Term/Deadline */}
        {task.term && (
          <View style={styles.dateItem}>
            <IconCalendar
              size={20}
              color={isOverdue ? colors.destructive : colors.mutedForeground}
            />
            <View style={styles.dateText}>
              <ThemedText style={[styles.label, { color: colors.mutedForeground }]}>Prazo</ThemedText>
              <ThemedText style={[
                styles.value,
                { color: isOverdue ? colors.destructive : colors.foreground },
                isOverdue && styles.overdueText
              ]}>
                {formatDate(task.term)}
                {isOverdue && " (Atrasado)"}
              </ThemedText>
            </View>
          </View>
        )}

        {/* Started At */}
        {task.startedAt && (
          <View style={styles.dateItem}>
            <IconClock size={20} color={colors.mutedForeground} />
            <View style={styles.dateText}>
              <ThemedText style={[styles.label, { color: colors.mutedForeground }]}>Iniciado</ThemedText>
              <ThemedText style={[styles.value, { color: colors.foreground }]}>
                {formatDateTime(task.startedAt)}
              </ThemedText>
            </View>
          </View>
        )}

        {/* Finished At */}
        {task.finishedAt && (
          <View style={styles.dateItem}>
            <IconCheck size={20} color="#10b981" />
            <View style={styles.dateText}>
              <ThemedText style={[styles.label, { color: colors.mutedForeground }]}>Finalizado</ThemedText>
              <ThemedText style={[styles.value, { color: colors.foreground }]}>
                {formatDateTime(task.finishedAt)}
              </ThemedText>
            </View>
          </View>
        )}

        <Separator style={styles.separator} />

        {/* Created At */}
        <View style={styles.dateItem}>
          <IconClock size={20} color={colors.mutedForeground} />
          <View style={styles.dateText}>
            <ThemedText style={[styles.label, { color: colors.mutedForeground }]}>Criado</ThemedText>
            <ThemedText style={[styles.value, { color: colors.foreground }]}>
              {formatDateTime(task.createdAt)}
            </ThemedText>
            {task.createdBy && (
              <ThemedText style={[styles.subtext, { color: colors.mutedForeground }]}>
                por {task.createdBy.name}
              </ThemedText>
            )}
          </View>
        </View>

        {/* Updated At */}
        <View style={styles.dateItem}>
          <IconClock size={20} color={colors.mutedForeground} />
          <View style={styles.dateText}>
            <ThemedText style={[styles.label, { color: colors.mutedForeground }]}>Atualizado</ThemedText>
            <ThemedText style={[styles.value, { color: colors.foreground }]}>
              {formatDateTime(task.updatedAt)}
            </ThemedText>
          </View>
        </View>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: spacing.md,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: "500",
  },
  content: {
    gap: spacing.md,
  },
  dateItem: {
    flexDirection: "row",
    gap: spacing.sm,
    alignItems: "flex-start",
  },
  dateText: {
    flex: 1,
    gap: 2,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: "500",
  },
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
  separator: {
    marginVertical: 0,
  },
});
