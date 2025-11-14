import { useState, useMemo } from "react";
import { View, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { router } from "expo-router";
import { Card } from "@/components/ui/card";
import { ThemedText } from "@/components/ui/themed-text";

import { Button } from "@/components/ui/button";
import { useTheme } from "@/lib/theme";
import { spacing, borderRadius, fontSize, fontWeight } from "@/constants/design-system";
import { IconClipboardList, IconAlertCircle, IconChevronRight, IconChevronLeft } from "@tabler/icons-react-native";
import type { User } from '../../../../types';
import { routes, TASK_STATUS } from "@/constants";
import { routeToMobilePath } from "@/lib/route-mapper";
import { extendedColors } from "@/lib/theme/extended-colors";
import { TaskStatusBadge } from "@/components/production/task/list/task-status-badge";

interface UserTasksTableProps {
  user: User;
  maxHeight?: number;
}

export function UserTasksTable({ user, maxHeight = 500 }: UserTasksTableProps) {
  const { colors, isDark } = useTheme();
  const [currentPage, setCurrentPage] = useState(0);
  const pageSize = 10;

  const tasks = user.tasks || [];
  const totalTasks = user._count?.tasks || tasks.length;

  // Sort tasks by status priority (active first) and date
  const sortedTasks = useMemo(() => {
    return [...tasks].sort((a, b) => {
      // Priority for active statuses
      const statusPriority: Record<string, number> = {
        [TASK_STATUS.IN_PRODUCTION]: 1,
        [TASK_STATUS.ON_HOLD]: 2,
        [TASK_STATUS.PENDING]: 3,
        [TASK_STATUS.COMPLETED]: 4,
        [TASK_STATUS.CANCELLED]: 5,
      };

      const aPriority = statusPriority[a.status] ?? 6;
      const bPriority = statusPriority[b.status] ?? 6;

      if (aPriority !== bPriority) return aPriority - bPriority;

      // Then sort by date (newest first)
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [tasks]);

  // Paginate tasks
  const paginatedTasks = useMemo(() => {
    const start = currentPage * pageSize;
    return sortedTasks.slice(start, start + pageSize);
  }, [sortedTasks, currentPage]);

  const totalPages = Math.ceil(sortedTasks.length / pageSize);

  // Calculate statistics
  const statistics = useMemo(() => {
    const activeTasks = tasks.filter(
      (task) => task.status !== TASK_STATUS.CANCELLED && task.status !== TASK_STATUS.COMPLETED
    ).length;
    const completedTasks = tasks.filter((task) => task.status === TASK_STATUS.COMPLETED).length;
    const totalValue = tasks.reduce((sum, task) => sum + (task.price || 0), 0);

    return {
      totalTasks: tasks.length,
      activeTasks,
      completedTasks,
      totalValue,
    };
  }, [tasks]);

  const handleTaskPress = (taskId: string) => {
    router.push(routeToMobilePath(routes.production.schedule.details(taskId)) as any);
  };

  const handleViewAllTasks = () => {
    const path = routeToMobilePath(
      `${routes.production.schedule.list}?userId=${user.id}&userName=${encodeURIComponent(
        user.name || ""
      )}`
    );
    router.push(path as any);
  };

  if (totalTasks === 0) {
    return (
      <Card style={styles.card}>
        <View style={[styles.sectionHeader, { borderBottomColor: colors.border }]}>
          <View style={styles.headerRow}>
            <View style={StyleSheet.flatten([styles.titleIcon, { backgroundColor: colors.primary + "10" }])}>
              <IconClipboardList size={18} color={colors.primary} />
            </View>
            <ThemedText style={StyleSheet.flatten([styles.titleText, { color: colors.foreground }])}>
              Tarefas Atribuídas
            </ThemedText>
          </View>
        </View>
        <View style={styles.content}>
          <View style={StyleSheet.flatten([styles.emptyState, { backgroundColor: colors.muted + "20" }])}>
            <IconAlertCircle size={48} color={colors.mutedForeground} />
            <ThemedText style={StyleSheet.flatten([styles.emptyText, { color: colors.mutedForeground }])}>
              Nenhuma tarefa atribuída a este usuário.
            </ThemedText>
          </View>
        </View>
      </Card>
    );
  }

  return (
    <Card style={styles.card}>
      <View style={[styles.sectionHeader, { borderBottomColor: colors.border }]}>
        <View style={styles.headerRowWithActions}>
          <View style={styles.headerRow}>
            <View style={StyleSheet.flatten([styles.titleIcon, { backgroundColor: colors.primary + "10" }])}>
              <IconClipboardList size={18} color={colors.primary} />
            </View>
            <ThemedText style={StyleSheet.flatten([styles.titleText, { color: colors.foreground }])}>
              Tarefas Atribuídas
            </ThemedText>
          </View>
          <Button
            variant="outline"
            size="sm"
            onPress={handleViewAllTasks}
            style={styles.viewAllButton}
          >
            <ThemedText style={StyleSheet.flatten([styles.viewAllText, { color: colors.primary }])}>
              Ver todas
            </ThemedText>
          </Button>
        </View>
      </View>

      <View style={styles.content}>
        {/* Statistics Summary */}
        <View style={styles.statsContainer}>
          <View style={[styles.statItem, { backgroundColor: colors.muted + "20", borderColor: colors.border }]}>
            <ThemedText style={[styles.statLabel, { color: colors.mutedForeground }]}>Total</ThemedText>
            <ThemedText style={[styles.statValue, { color: colors.foreground }]}>{statistics.totalTasks}</ThemedText>
          </View>

          <View
            style={[
              styles.statItem,
              {
                backgroundColor: isDark ? extendedColors.blue[900] + "20" : extendedColors.blue[50] + "80",
                borderColor: isDark ? extendedColors.blue[700] + "40" : extendedColors.blue[200] + "40",
              },
            ]}
          >
            <ThemedText
              style={[
                styles.statLabel,
                { color: isDark ? extendedColors.blue[200] : extendedColors.blue[800] },
              ]}
            >
              Ativas
            </ThemedText>
            <ThemedText
              style={[
                styles.statValue,
                { color: isDark ? extendedColors.blue[200] : extendedColors.blue[800] },
              ]}
            >
              {statistics.activeTasks}
            </ThemedText>
          </View>

          <View
            style={[
              styles.statItem,
              {
                backgroundColor: isDark ? extendedColors.green[900] + "20" : extendedColors.green[50] + "80",
                borderColor: isDark ? extendedColors.green[700] + "40" : extendedColors.green[200] + "40",
              },
            ]}
          >
            <ThemedText
              style={[
                styles.statLabel,
                { color: isDark ? extendedColors.green[200] : extendedColors.green[800] },
              ]}
            >
              Concluídas
            </ThemedText>
            <ThemedText
              style={[
                styles.statValue,
                { color: isDark ? extendedColors.green[200] : extendedColors.green[800] },
              ]}
            >
              {statistics.completedTasks}
            </ThemedText>
          </View>
        </View>

        {/* Tasks Table */}
        <ScrollView
          style={[styles.tableContainer, maxHeight ? { maxHeight } : undefined]}
          showsVerticalScrollIndicator={false}
          nestedScrollEnabled
        >
          {/* Table Header */}
          <View
            style={[
              styles.tableHeader,
              {
                backgroundColor: isDark ? extendedColors.neutral[800] : extendedColors.neutral[100],
                borderBottomColor: isDark ? extendedColors.neutral[700] : extendedColors.neutral[200],
              },
            ]}
          >
            <ThemedText style={[styles.headerCell, styles.nameColumn, { color: colors.foreground }]}>
              NOME
            </ThemedText>
            <ThemedText style={[styles.headerCell, styles.customerColumn, { color: colors.foreground }]}>
              CLIENTE
            </ThemedText>
            <ThemedText style={[styles.headerCell, styles.statusColumn, { color: colors.foreground }]}>
              STATUS
            </ThemedText>
          </View>

          {/* Table Rows */}
          {paginatedTasks.map((task, index) => (
            <TouchableOpacity
              key={task.id}
              onPress={() => handleTaskPress(task.id)}
              style={[
                styles.tableRow,
                {
                  backgroundColor:
                    index % 2 === 0
                      ? colors.background
                      : isDark
                      ? extendedColors.neutral[900]
                      : extendedColors.neutral[50],
                  borderBottomColor: isDark ? extendedColors.neutral[700] : extendedColors.neutral[200],
                },
              ]}
              activeOpacity={0.7}
            >
              {/* Name Column */}
              <View style={styles.nameColumn}>
                <ThemedText
                  style={[styles.taskName, { color: colors.foreground }]}
                  numberOfLines={2}
                >
                  {task.name || "Sem nome"}
                </ThemedText>
                {task.serialNumber && (
                  <ThemedText
                    style={[styles.taskSubtext, { color: colors.mutedForeground }]}
                    numberOfLines={1}
                  >
                    SN: {task.serialNumber}
                  </ThemedText>
                )}
                {task.sector && (
                  <ThemedText
                    style={[styles.taskSubtext, { color: colors.mutedForeground }]}
                    numberOfLines={1}
                  >
                    {task.sector.name}
                  </ThemedText>
                )}
              </View>

              {/* Customer Column */}
              <View style={styles.customerColumn}>
                <ThemedText style={[styles.cellText, { color: colors.foreground }]} numberOfLines={2}>
                  {task.customer?.fantasyName || "-"}
                </ThemedText>
              </View>

              {/* Status Column */}
              <View style={styles.statusColumn}>
                <TaskStatusBadge status={task.status} />
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Pagination */}
        {totalPages > 1 && (
          <View
            style={[
              styles.pagination,
              {
                backgroundColor: colors.muted + "20",
                borderTopColor: colors.border,
              },
            ]}
          >
            <TouchableOpacity
              onPress={() => setCurrentPage(Math.max(0, currentPage - 1))}
              disabled={currentPage === 0}
              style={[
                styles.paginationButton,
                { backgroundColor: colors.background, borderColor: colors.border },
              ]}
              activeOpacity={0.7}
            >
              <IconChevronLeft
                size={16}
                color={currentPage === 0 ? colors.mutedForeground : colors.foreground}
              />
            </TouchableOpacity>

            <ThemedText style={[styles.paginationText, { color: colors.foreground }]}>
              {`Página ${currentPage + 1} de ${totalPages}`}
            </ThemedText>

            <TouchableOpacity
              onPress={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
              disabled={currentPage === totalPages - 1}
              style={[
                styles.paginationButton,
                { backgroundColor: colors.background, borderColor: colors.border },
              ]}
              activeOpacity={0.7}
            >
              <IconChevronRight
                size={16}
                color={currentPage === totalPages - 1 ? colors.mutedForeground : colors.foreground}
              />
            </TouchableOpacity>

            <ThemedText style={[styles.paginationInfo, { color: colors.mutedForeground }]}>
              {`${currentPage * pageSize + 1}-${Math.min((currentPage + 1) * pageSize, sortedTasks.length)} de ${sortedTasks.length}`}
            </ThemedText>
          </View>
        )}
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
  headerRowWithActions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
  },
  headerRow: {
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
  viewAllButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  viewAllText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
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
  statsContainer: {
    flexDirection: "row",
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  statItem: {
    flex: 1,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    alignItems: "center",
  },
  statLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    marginBottom: spacing.xs,
  },
  statValue: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
  },
  tableContainer: {
    flex: 1,
  },
  tableHeader: {
    flexDirection: "row",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 2,
  },
  headerCell: {
    fontSize: 10,
    fontWeight: fontWeight.bold,
    textTransform: "uppercase",
  },
  tableRow: {
    flexDirection: "row",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    minHeight: 60,
  },
  nameColumn: {
    flex: 2,
    justifyContent: "center",
    paddingRight: spacing.sm,
  },
  customerColumn: {
    flex: 1.5,
    justifyContent: "center",
    paddingRight: spacing.sm,
  },
  statusColumn: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  taskName: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    marginBottom: spacing.xs / 2,
  },
  taskSubtext: {
    fontSize: fontSize.xs,
    marginTop: spacing.xs / 2,
  },
  cellText: {
    fontSize: fontSize.sm,
  },
  pagination: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderTopWidth: 1,
    gap: spacing.sm,
  },
  paginationButton: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  paginationText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    marginHorizontal: spacing.sm,
  },
  paginationInfo: {
    fontSize: fontSize.xs,
    marginLeft: spacing.sm,
  },
});
