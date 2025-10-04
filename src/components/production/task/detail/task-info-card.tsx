import React from "react";
import { View, StyleSheet } from "react-native";
import { Card } from "@/components/ui/card";
import { ThemedText } from "@/components/ui/themed-text";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize } from "@/constants/design-system";
import { formatDate, formatDateTime } from '../../../../utils';
import { PRIORITY_TYPE } from '../../../../constants';
import type { Task } from '../../../../types';
import { TaskStatusBadge } from "../list/task-status-badge";
import { TaskPriorityIndicator } from "../list/task-priority-indicator";
import {
  IconCalendar,
  IconClock,
  IconFlag,
  IconHash,
  IconBuildingFactory2,
} from "@tabler/icons-react-native";

interface TaskInfoCardProps {
  task: Task;
}

export const TaskInfoCard: React.FC<TaskInfoCardProps> = ({ task }) => {
  const { colors } = useTheme();

  const isOverdue = task.term && new Date(task.term) < new Date() &&
    task.status !== "COMPLETED" && task.status !== "CANCELLED";

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <ThemedText style={styles.title}>Informações da Tarefa</ThemedText>
        <TaskStatusBadge status={task.status} size="md" />
      </View>

      <View style={styles.content}>
        {/* Serial number */}
        {task.serialNumber && (
          <View style={styles.row}>
            <View style={styles.labelContainer}>
              <IconHash size={16} color={colors.foreground} />
              <ThemedText style={styles.label}>Número de Série:</ThemedText>
            </View>
            <ThemedText style={styles.value}>{task.serialNumber}</ThemedText>
          </View>
        )}

        {/* Priority */}
        <View style={styles.row}>
          <View style={styles.labelContainer}>
            <IconFlag size={16} color={colors.foreground} />
            <ThemedText style={styles.label}>Prioridade:</ThemedText>
          </View>
          <TaskPriorityIndicator priority={task.priority || PRIORITY_TYPE.MEDIUM} showLabel />
        </View>

        {/* Sector */}
        {task.sector && (
          <View style={styles.row}>
            <View style={styles.labelContainer}>
              <IconBuildingFactory2 size={16} color={colors.foreground} />
              <ThemedText style={styles.label}>Setor:</ThemedText>
            </View>
            <View style={styles.sectorBadge}>
              <View
                style={StyleSheet.flatten([styles.sectorDot, { backgroundColor: "#3B82F6" }
                ])}
              />
              <ThemedText style={styles.value}>{task.sector.name}</ThemedText>
            </View>
          </View>
        )}

        {/* Term */}
        {task.term && (
          <View style={styles.row}>
            <View style={styles.labelContainer}>
              <IconCalendar size={16} color={colors.foreground} />
              <ThemedText style={styles.label}>Prazo:</ThemedText>
            </View>
            <ThemedText
              style={[
                styles.value,
                isOverdue && { color: colors.destructive, fontWeight: "600" }
              ]}
            >
              {formatDate(task.term)}
              {isOverdue && " (Atrasado)"}
            </ThemedText>
          </View>
        )}

        {/* Created at */}
        <View style={styles.row}>
          <View style={styles.labelContainer}>
            <IconClock size={16} color={colors.foreground} />
            <ThemedText style={styles.label}>Criado em:</ThemedText>
          </View>
          <ThemedText style={styles.value}>{formatDateTime(task.createdAt)}</ThemedText>
        </View>

        {/* Started at */}
        {task.startedAt && (
          <View style={styles.row}>
            <View style={styles.labelContainer}>
              <IconClock size={16} color={colors.foreground} />
              <ThemedText style={styles.label}>Iniciado em:</ThemedText>
            </View>
            <ThemedText style={styles.value}>{formatDateTime(task.startedAt)}</ThemedText>
          </View>
        )}

        {/* Finished at */}
        {task.finishedAt && (
          <View style={styles.row}>
            <View style={styles.labelContainer}>
              <IconClock size={16} color={colors.foreground} />
              <ThemedText style={styles.label}>Concluído em:</ThemedText>
            </View>
            <ThemedText style={styles.value}>{formatDateTime(task.finishedAt)}</ThemedText>
          </View>
        )}

        {/* Description */}
        {task.observation?.content && (
          <View style={styles.descriptionContainer}>
            <ThemedText style={styles.descriptionLabel}>Descrição:</ThemedText>
            <ThemedText style={styles.descriptionText}>{task.observation?.content}</ThemedText>
          </View>
        )}
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
    justifyContent: "space-between",
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: "600",
  },
  content: {
    gap: spacing.sm,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  labelContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    flex: 1,
  },
  icon: {
    opacity: 0.6,
  },
  label: {
    fontSize: fontSize.sm,
    opacity: 0.7,
  },
  value: {
    fontSize: fontSize.sm,
    fontWeight: "500",
    textAlign: "right",
    flex: 1,
  },
  sectorBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  sectorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  descriptionContainer: {
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  descriptionLabel: {
    fontSize: fontSize.sm,
    opacity: 0.7,
    marginBottom: spacing.xs,
  },
  descriptionText: {
    fontSize: fontSize.sm,
    lineHeight: 20,
  },
});