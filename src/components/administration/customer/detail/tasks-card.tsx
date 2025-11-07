
import { View, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { router } from "expo-router";
import { Card } from "@/components/ui/card";
import { ThemedText } from "@/components/ui/themed-text";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/lib/theme";
import { spacing, borderRadius, fontSize, fontWeight } from "@/constants/design-system";
import { IconClipboardList, IconChevronRight, IconCalendar } from "@tabler/icons-react-native";
import type { Customer } from '../../../../types';
import { routes, TASK_STATUS_LABELS } from '../../../../constants';
import { formatDate } from '../../../../utils';
import { routeToMobilePath } from "@/lib/route-mapper";
import { extendedColors } from "@/lib/theme/extended-colors";

interface TasksCardProps {
  customer: Customer;
  maxHeight?: number;
}

export function TasksCard({ customer, maxHeight = 400 }: TasksCardProps) {
  const { colors, isDark } = useTheme();

  const tasks = customer.tasks || [];
  const totalTasks = customer._count?.tasks || tasks.length;

  const getTaskStatusColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return isDark ? extendedColors.yellow[400] : extendedColors.yellow[600];
      case "IN_PRODUCTION":
        return isDark ? extendedColors.blue[400] : extendedColors.blue[600];
      case "ON_HOLD":
        return isDark ? extendedColors.orange[400] : extendedColors.orange[600];
      case "COMPLETED":
        return isDark ? extendedColors.green[400] : extendedColors.green[600];
      case "CANCELLED":
        return isDark ? extendedColors.red[400] : extendedColors.red[600];
      default:
        return colors.mutedForeground;
    }
  };

  const handleTaskPress = (taskId: string) => {
    router.push(routeToMobilePath(routes.production.schedule.details(taskId)) as any);
  };

  if (totalTasks === 0) {
    return (
      <Card style={styles.card}>
        <View style={[styles.sectionHeader, { borderBottomColor: colors.border }]}>
          <View style={styles.titleRow}>
            <View style={StyleSheet.flatten([styles.titleIcon, { backgroundColor: colors.primary + "10" }])}>
              <IconClipboardList size={18} color={colors.primary} />
            </View>
            <ThemedText style={StyleSheet.flatten([styles.titleText, { color: colors.foreground }])}>
              Tarefas Relacionadas
            </ThemedText>
          </View>
        </View>
        <View style={styles.content}>
          <View style={StyleSheet.flatten([styles.emptyState, { backgroundColor: colors.muted + "20" }])}>
            <IconClipboardList size={32} color={colors.mutedForeground} />
            <ThemedText style={StyleSheet.flatten([styles.emptyText, { color: colors.mutedForeground }])}>
              Nenhuma tarefa encontrada para este cliente
            </ThemedText>
          </View>
        </View>
      </Card>
    );
  }

  return (
    <Card style={styles.card}>
      <View style={[styles.sectionHeader, { borderBottomColor: colors.border }]}>
        <View style={styles.titleRow}>
          <View style={StyleSheet.flatten([styles.titleIcon, { backgroundColor: colors.primary + "10" }])}>
            <IconClipboardList size={18} color={colors.primary} />
          </View>
          <ThemedText style={StyleSheet.flatten([styles.titleText, { color: colors.foreground }])}>
            Tarefas Relacionadas
          </ThemedText>
          <Badge variant="secondary" style={styles.countBadge}>
            <ThemedText style={StyleSheet.flatten([styles.countText, { color: colors.foreground }])}>
              {totalTasks}
            </ThemedText>
          </Badge>
        </View>
      </View>
      <View style={{ paddingHorizontal: 0 }}>
        <ScrollView
          style={[styles.tasksList, maxHeight ? { maxHeight } : undefined]}
          showsVerticalScrollIndicator={false}
          nestedScrollEnabled
        >
          {tasks.map((task, index) => (
            <TouchableOpacity
              key={task.id}
              onPress={() => handleTaskPress(task.id)}
              style={StyleSheet.flatten([
                styles.taskItem,
                {
                  backgroundColor: colors.muted + "10",
                  borderBottomColor: colors.border,
                },
                index === tasks.length - 1 && styles.lastTaskItem,
              ])}
              activeOpacity={0.7}
            >
              <View style={styles.taskContent}>
                {/* Task Info */}
                <View style={styles.taskInfo}>
                  <View style={styles.taskHeader}>
                    <ThemedText
                      style={StyleSheet.flatten([styles.taskName, { color: colors.foreground }])}
                      numberOfLines={2}
                    >
                      {task.name || "Sem nome"}
                    </ThemedText>
                    <Badge
                      variant="secondary"
                      style={StyleSheet.flatten([
                        styles.statusBadge,
                        { backgroundColor: getTaskStatusColor(task.status) + "20" },
                      ])}
                    >
                      <ThemedText
                        style={StyleSheet.flatten([
                          styles.statusText,
                          { color: getTaskStatusColor(task.status) },
                        ])}
                      >
                        {TASK_STATUS_LABELS[task.status as keyof typeof TASK_STATUS_LABELS]}
                      </ThemedText>
                    </Badge>
                  </View>

                  {/* Task Metadata */}
                  <View style={styles.taskMetadata}>
                    {task.finishedAt && (
                      <View style={styles.metadataItem}>
                        <IconCalendar size={14} color={colors.mutedForeground} />
                        <ThemedText style={StyleSheet.flatten([styles.metadataText, { color: colors.mutedForeground }])}>
                          {formatDate(task.finishedAt)}
                        </ThemedText>
                      </View>
                    )}
                  </View>
                </View>

                {/* Chevron */}
                <IconChevronRight size={20} color={colors.mutedForeground} />
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: spacing.md,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
  },
  content: {
    gap: spacing.md,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  titleIcon: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  titleText: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
  },
  countBadge: {
    marginLeft: "auto",
  },
  countText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  emptyState: {
    padding: spacing.xl,
    borderRadius: borderRadius.md,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
  },
  emptyText: {
    fontSize: fontSize.sm,
    textAlign: "center",
  },
  tasksList: {
    flex: 1,
  },
  taskItem: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  lastTaskItem: {
    borderBottomWidth: 0,
  },
  taskContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  taskInfo: {
    flex: 1,
    gap: spacing.sm,
  },
  taskHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
  },
  taskName: {
    flex: 1,
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs / 2,
  },
  statusText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },
  taskMetadata: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
  },
  metadataItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  metadataText: {
    fontSize: fontSize.xs,
  },
});
