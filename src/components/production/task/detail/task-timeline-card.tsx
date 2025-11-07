import React from "react";
import { View, StyleSheet} from "react-native";
import { Card } from "@/components/ui/card";
import { ThemedText } from "@/components/ui/themed-text";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize } from "@/constants/design-system";
import { formatDateTime } from '../../../../utils';
import { TASK_STATUS, TASK_STATUS_LABELS } from '../../../../constants';
import type { Task, Activity } from '../../../../types';
import {
  IconCircleCheck,
  IconClock,
  IconPlayerPlay,
  IconPlayerPause,
  IconX,
} from "@tabler/icons-react-native";

interface TaskTimelineCardProps {
  task: Task;
  activities?: Activity[];
}

export const TaskTimelineCard: React.FC<TaskTimelineCardProps> = ({ task, activities: _activities = [] }) => {
  const { colors } = useTheme();

  const getStatusIcon = (status: TASK_STATUS) => {
    switch (status) {
      case TASK_STATUS.PENDING:
        return IconClock;
      case TASK_STATUS.IN_PRODUCTION:
        return IconPlayerPlay;
      case TASK_STATUS.ON_HOLD:
        return IconPlayerPause;
      case TASK_STATUS.COMPLETED:
        return IconCircleCheck;
      case TASK_STATUS.CANCELLED:
        return IconX;
      default:
        return IconClock;
    }
  };

  const getStatusColor = (status: TASK_STATUS) => {
    switch (status) {
      case TASK_STATUS.PENDING:
        return "#f59e0b";
      case TASK_STATUS.IN_PRODUCTION:
        return colors.primary;
      case TASK_STATUS.ON_HOLD:
        return "#ef4444";
      case TASK_STATUS.COMPLETED:
        return "#10b981";
      case TASK_STATUS.CANCELLED:
        return colors.destructive;
      default:
        return colors.muted;
    }
  };

  // Build timeline events
  const timelineEvents: Array<{
    id: string;
    title: string;
    description?: string;
    date: Date | string;
    icon: any;
    color: string;
  }> = [];

  // Add creation event
  timelineEvents.push({
    id: "created",
    title: "Tarefa Criada",
    description: task.createdBy?.name ? `Por ${task.createdBy.name}` : undefined,
    date: task.createdAt,
    icon: IconClock,
    color: colors.primary,
  });

  // Add start event
  if (task.startedAt) {
    timelineEvents.push({
      id: "started",
      title: "Produção Iniciada",
      date: task.startedAt,
      icon: IconPlayerPlay,
      color: colors.primary,
    });
  }

  // Add current status if different from created
  if (task.status !== TASK_STATUS.PENDING) {
    const StatusIcon = getStatusIcon(task.status);
    timelineEvents.push({
      id: "current-status",
      title: TASK_STATUS_LABELS[task.status],
      date: task.finishedAt || task.updatedAt,
      icon: StatusIcon,
      color: getStatusColor(task.status),
    });
  }

  // Sort by date (newest first)
  timelineEvents.sort((a, b) => {
    const dateA = new Date(a.date).getTime();
    const dateB = new Date(b.date).getTime();
    return dateB - dateA;
  });

  return (
    <Card style={styles.card}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <ThemedText style={styles.title}>Histórico</ThemedText>
      </View>

      <View style={styles.timeline}>
        {timelineEvents.map((event, index) => {
          const Icon = event.icon;
          const isLast = index === timelineEvents.length - 1;

          return (
            <View key={event.id} style={styles.timelineItem}>
              <View style={styles.timelineLeft}>
                <View
                  style={StyleSheet.flatten([
                    styles.iconContainer,
                    { backgroundColor: event.color + "20" },
                  ])}
                >
                  <Icon size={16} color={event.color} />
                </View>
                {!isLast && <View style={StyleSheet.flatten([styles.line, { backgroundColor: colors.border }])} />}
              </View>

              <View style={styles.timelineContent}>
                <ThemedText style={styles.eventTitle}>{event.title}</ThemedText>
                {event.description && (
                  <ThemedText style={styles.eventDescription}>
                    {event.description}
                  </ThemedText>
                )}
                <ThemedText style={styles.eventDate}>
                  {formatDateTime(event.date)}
                </ThemedText>
              </View>
            </View>
          );
        })}

        {timelineEvents.length === 0 && (
          <ThemedText style={styles.emptyText}>
            Nenhum histórico disponível
          </ThemedText>
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
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: "600",
  },
  timeline: {
    paddingLeft: spacing.xs,
  },
  timelineItem: {
    flexDirection: "row",
    minHeight: 60,
  },
  timelineLeft: {
    width: 32,
    alignItems: "center",
    marginRight: spacing.md,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  line: {
    width: 1,
    flex: 1,
    marginTop: spacing.xs,
  },
  timelineContent: {
    flex: 1,
    paddingBottom: spacing.lg,
  },
  eventTitle: {
    fontSize: fontSize.md,
    fontWeight: "600",
    marginBottom: 2,
  },
  eventDescription: {
    fontSize: fontSize.sm,
    opacity: 0.8,
    marginBottom: spacing.xs,
  },
  eventDate: {
    fontSize: fontSize.xs,
    opacity: 0.6,
  },
  emptyText: {
    fontSize: fontSize.sm,
    opacity: 0.6,
    textAlign: "center",
    paddingVertical: spacing.lg,
  },
});