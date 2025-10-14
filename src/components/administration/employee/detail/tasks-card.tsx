import React from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { router } from "expo-router";
import { User } from '../../../../types';
import { TASK_STATUS_LABELS, routes } from '../../../../constants';
import { formatDate, formatCurrency } from '../../../../utils';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ThemedText } from "@/components/ui/themed-text";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { useTheme } from "@/lib/theme";
import { spacing, borderRadius, fontSize, fontWeight } from "@/constants/design-system";
import { IconClipboardList, IconCalendar, IconCurrencyDollar, IconChevronRight } from "@tabler/icons-react-native";
import { getBadgeVariant } from '../../../../constants';
import { routeToMobilePath } from "@/lib/route-mapper";

interface TasksCardProps {
  employee: User;
  maxItems?: number;
}

export function TasksCard({ employee, maxItems = 5 }: TasksCardProps) {
  const { colors } = useTheme();

  const tasks = employee.createdTasks?.slice(0, maxItems) || [];
  const totalTasks = employee._count?.createdTasks || employee.createdTasks?.length || 0;

  const handleTaskPress = (taskId: string) => {
    router.push(routeToMobilePath(routes.production.schedule.details(taskId)) as any);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle style={styles.sectionTitle}>
          <View style={styles.titleRow}>
            <View style={[styles.titleIcon, { backgroundColor: colors.primary + "10" }]}>
              <IconClipboardList size={18} color={colors.primary} />
            </View>
            <ThemedText style={[styles.titleText, { color: colors.foreground }]}>
              Ordens de Serviço Recentes
            </ThemedText>
          </View>
          {totalTasks > 0 && (
            <Badge variant="secondary">
              {totalTasks} {totalTasks === 1 ? "ordem" : "ordens"}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent style={styles.content}>
        {tasks.length === 0 ? (
          <EmptyState
            icon="clipboard-list"
            title="Nenhuma ordem de serviço"
            description="Este colaborador ainda não possui ordens de serviço atribuídas."
          />
        ) : (
          <View style={styles.taskList}>
            {tasks.map((task, index) => {
              const statusVariant = getBadgeVariant("TASK_STATUS", task.status);

              return (
                <TouchableOpacity
                  key={task.id}
                  style={[
                    styles.taskItem,
                    {
                      backgroundColor: colors.muted + "20",
                      borderColor: colors.border,
                    },
                    index < tasks.length - 1 && styles.taskItemWithBorder,
                  ]}
                  onPress={() => handleTaskPress(task.id)}
                  activeOpacity={0.7}
                >
                  <View style={styles.taskContent}>
                    <View style={styles.taskHeader}>
                      <ThemedText style={[styles.taskTitle, { color: colors.foreground }]} numberOfLines={1}>
                        {task.name || `Ordem #${task.id.slice(0, 8)}`}
                      </ThemedText>
                      <IconChevronRight size={18} color={colors.mutedForeground} />
                    </View>

                    <View style={styles.taskMeta}>
                      <Badge variant={statusVariant} style={styles.taskBadge}>
                        {TASK_STATUS_LABELS[task.status]}
                      </Badge>

                      {task.scheduledDate && (
                        <View style={styles.metaItem}>
                          <IconCalendar size={14} color={colors.mutedForeground} />
                          <ThemedText style={[styles.metaText, { color: colors.mutedForeground }]}>
                            {formatDate(task.scheduledDate)}
                          </ThemedText>
                        </View>
                      )}

                      {task.price && (
                        <View style={styles.metaItem}>
                          <IconCurrencyDollar size={14} color={colors.mutedForeground} />
                          <ThemedText style={[styles.metaText, { color: colors.mutedForeground }]}>
                            {formatCurrency(task.price)}
                          </ThemedText>
                        </View>
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}

            {totalTasks > maxItems && (
              <TouchableOpacity
                style={[styles.viewAllButton, { backgroundColor: colors.primary + "10" }]}
                onPress={() => {
                  // Navigate to tasks list filtered by this user
                  router.push(routeToMobilePath(routes.production.schedule.list) as any);
                }}
                activeOpacity={0.7}
              >
                <ThemedText style={[styles.viewAllText, { color: colors.primary }]}>
                  Ver todas as {totalTasks} ordens
                </ThemedText>
                <IconChevronRight size={18} color={colors.primary} />
              </TouchableOpacity>
            )}
          </View>
        )}
      </CardContent>
    </Card>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
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
  content: {
    paddingHorizontal: 0,
  },
  taskList: {
    gap: spacing.xs,
  },
  taskItem: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
  },
  taskItemWithBorder: {
    marginBottom: spacing.xs,
  },
  taskContent: {
    gap: spacing.sm,
  },
  taskHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  taskTitle: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    flex: 1,
  },
  taskMeta: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    alignItems: "center",
  },
  taskBadge: {
    alignSelf: "flex-start",
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  metaText: {
    fontSize: fontSize.xs,
  },
  viewAllButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    marginTop: spacing.sm,
    marginHorizontal: spacing.md,
  },
  viewAllText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
});
