import React, { useState, useCallback, useMemo, useRef } from "react";
import { FlatList, StyleSheet, View, TouchableOpacity, Pressable, RefreshControl, ActivityIndicator, Dimensions, ScrollView } from "react-native";
import { Icon } from "@/components/ui/icon";
import { IconButton } from "@/components/ui/icon-button";
import type { Task } from '../../../../types';
import { ThemedText } from "@/components/ui/themed-text";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/lib/theme";
import { useSwipeRow } from "@/contexts/swipe-row-context";
import { spacing, fontSize, fontWeight } from "@/constants/design-system";
import { TaskTableRowSwipe } from "./task-table-row-swipe";
import { TaskStatusBadge } from "./task-status-badge";
import { TaskPriorityIndicator } from "./task-priority-indicator";
import { formatDate, formatCurrency } from '../../../../utils';
import { TASK_STATUS } from '../../../../constants';

export interface TableColumn {
  key: string;
  title: string;
  width: number;
  align?: "left" | "center" | "right";
  sortable?: boolean;
  render?: (task: Task) => React.ReactNode;
}

export interface SortConfig {
  columnKey: string;
  direction: "asc" | "desc";
}

interface TaskTableProps {
  tasks: Task[];
  onTaskPress?: (taskId: string) => void;
  onTaskEdit?: (taskId: string) => void;
  onTaskDelete?: (taskId: string) => void;
  onTaskDuplicate?: (taskId: string) => void;
  onTaskStatusChange?: (taskId: string, status: TASK_STATUS) => void;
  onRefresh?: () => Promise<void>;
  onEndReached?: () => void;
  refreshing?: boolean;
  loading?: boolean;
  loadingMore?: boolean;
  showSelection?: boolean;
  selectedTasks?: Set<string>;
  onSelectionChange?: (selectedTasks: Set<string>) => void;
  sortConfigs?: SortConfig[];
  onSort?: (configs: SortConfig[]) => void;
  columns?: TableColumn[];
  visibleColumnKeys?: string[];
  enableSwipeActions?: boolean;
}

// Get screen width for responsive design
const { width: screenWidth } = Dimensions.get("window");
const availableWidth = screenWidth - 32; // Account for padding

// Define all available columns with their renderers
const ALL_COLUMN_DEFINITIONS: Record<string, Omit<TableColumn, "width">> = {
  name: {
    key: "name",
    title: "Nome",
    align: "left",
    sortable: true,
  },
  customer: {
    key: "customer",
    title: "Cliente",
    align: "left",
    sortable: true,
  },
  sector: {
    key: "sector",
    title: "Setor",
    align: "left",
    sortable: true,
  },
  status: {
    key: "status",
    title: "Status",
    align: "center",
    sortable: true,
  },
  priority: {
    key: "priority",
    title: "Prioridade",
    align: "center",
    sortable: true,
  },
  term: {
    key: "term",
    title: "Prazo",
    align: "left",
    sortable: true,
  },
  price: {
    key: "price",
    title: "Valor",
    align: "right",
    sortable: true,
  },
  createdAt: {
    key: "createdAt",
    title: "Criado",
    align: "left",
    sortable: true,
  },
};

const DEFAULT_COLUMN_KEYS = ["name", "customer", "status", "term"];

export const TaskTable = React.memo<TaskTableProps>(
  ({
    tasks,
    onTaskPress,
    onTaskEdit,
    onTaskDelete,
    onTaskDuplicate,
    onTaskStatusChange,
    onRefresh,
    onEndReached,
    refreshing = false,
    loading = false,
    loadingMore = false,
    showSelection = false,
    selectedTasks = new Set(),
    onSelectionChange,
    sortConfigs = [],
    onSort,
    columns,
    visibleColumnKeys = DEFAULT_COLUMN_KEYS,
    enableSwipeActions = true,
  }) => {
    const { colors, isDark } = useTheme();
    const { activeRowId, closeActiveRow } = useSwipeRow();
    const [headerHeight, setHeaderHeight] = useState(50);
    const flatListRef = useRef<FlatList>(null);

    // Build visible columns based on selection
    const visibleColumns = useMemo(() => {
      if (columns) return columns; // Use provided columns if any

      // Define width ratios for each column type
      const columnWidthRatios: Record<string, number> = {
        name: 2.5, // Largest - task name needs more space
        customer: 2.0, // Large - customer name
        sector: 1.2, // Medium - sector name
        status: 1.0, // Medium - status badge
        priority: 0.8, // Small - priority icon
        term: 1.2, // Medium - date
        price: 1.2, // Medium - currency
        createdAt: 1.2, // Medium - date
      };

      // Limit visible columns on mobile to 3 max (plus selection if enabled)
      const limitedKeys = visibleColumnKeys.slice(0, 3);

      // Calculate total ratio
      const totalRatio = limitedKeys.reduce((sum, key) => sum + (columnWidthRatios[key] || 1), 0);

      // Calculate actual column widths based on available space
      return limitedKeys.map((key) => {
        const definition = ALL_COLUMN_DEFINITIONS[key as keyof typeof ALL_COLUMN_DEFINITIONS];
        const ratio = columnWidthRatios[key] || 1;
        const width = Math.floor((availableWidth * ratio) / totalRatio);

        return {
          ...definition,
          width,
        } as TableColumn;
      });
    }, [visibleColumnKeys, columns, availableWidth]);

    const handleToggleSelection = useCallback(
      (taskId: string) => {
        if (!onSelectionChange) return;
        const newSelection = new Set(selectedTasks);
        if (newSelection.has(taskId)) {
          newSelection.delete(taskId);
        } else {
          newSelection.add(taskId);
        }
        onSelectionChange(newSelection);
      },
      [selectedTasks, onSelectionChange],
    );

    const handleToggleAll = useCallback(() => {
      if (!onSelectionChange) return;
      if (selectedTasks.size === tasks.length) {
        onSelectionChange(new Set());
      } else {
        onSelectionChange(new Set(tasks.map(t => t.id)));
      }
    }, [tasks, selectedTasks, onSelectionChange]);

    const handleSort = useCallback(
      (columnKey: string) => {
        if (!onSort) return;

        const existingConfig = sortConfigs.find(c => c.columnKey === columnKey);

        if (!existingConfig) {
          // Add new sort
          onSort([...sortConfigs, { columnKey, direction: "asc" }]);
        } else if (existingConfig.direction === "asc") {
          // Change to desc
          onSort(sortConfigs.map(c =>
            c.columnKey === columnKey
              ? { ...c, direction: "desc" }
              : c
          ));
        } else {
          // Remove sort
          onSort(sortConfigs.filter(c => c.columnKey !== columnKey));
        }
      },
      [sortConfigs, onSort],
    );

    const getSortIndicator = useCallback(
      (columnKey: string) => {
        const config = sortConfigs.find(c => c.columnKey === columnKey);
        if (!config) return null;

        const index = sortConfigs.indexOf(config);
        return (
          <View style={styles.sortIndicator}>
            <Icon name={config.direction === "asc" ? "chevron-up" : "chevron-down"} size={14} color={colors.primary} />
            {sortConfigs.length > 1 && (
              <ThemedText style={StyleSheet.flatten([styles.sortIndex, { color: colors.primary }])}>{index + 1}</ThemedText>
            )}
          </View>
        );
      },
      [sortConfigs, colors],
    );

    const isOverdue = (task: Task) => {
      if (!task.term || task.status === TASK_STATUS.COMPLETED || task.status === TASK_STATUS.CANCELLED) {
        return false;
      }
      return new Date(task.term) < new Date();
    };

    const renderColumnContent = useCallback(
      (column: TableColumn, task: Task) => {
        switch (column.key) {
          case "name":
            return (
              <View>
                <ThemedText style={styles.cellText} numberOfLines={2} ellipsizeMode="tail">
                  {task.name}
                </ThemedText>
                {task.serialNumber && (
                  <ThemedText style={styles.cellSubtext} numberOfLines={1}>
                    NS: {task.serialNumber}
                  </ThemedText>
                )}
              </View>
            );
          case "customer":
            return (
              <ThemedText style={styles.cellText} numberOfLines={1} ellipsizeMode="tail">
                {task.customer?.name || "-"}
              </ThemedText>
            );
          case "sector":
            return (
              <View style={styles.sectorBadge}>
                <View
                  style={StyleSheet.flatten([
                    styles.sectorDot,
                    { backgroundColor: task.sector?.color || colors.muted }
                  ])}
                />
                <ThemedText style={styles.cellText} numberOfLines={1}>
                  {task.sector?.name || "Não definido"}
                </ThemedText>
              </View>
            );
          case "status":
            return <TaskStatusBadge status={task.status} />;
          case "priority":
            return <TaskPriorityIndicator priority={task.priority} />;
          case "term":
            return (
              <ThemedText
                style={StyleSheet.flatten([
                  styles.cellText,
                  isOverdue(task) && { color: colors.destructive }
                ])}
              >
                {task.term ? formatDate(task.term) : "-"}
              </ThemedText>
            );
          case "price":
            return (
              <ThemedText style={StyleSheet.flatten([styles.cellText, styles.rightText])}>
                {task.price ? formatCurrency(task.price) : "-"}
              </ThemedText>
            );
          case "createdAt":
            return (
              <ThemedText style={styles.cellText}>
                {formatDate(task.createdAt)}
              </ThemedText>
            );
          default:
            if (column.render) {
              return column.render(task);
            }
            return <ThemedText style={styles.cellText}>-</ThemedText>;
        }
      },
      [colors, isOverdue],
    );

    const renderHeader = useCallback(() => {
      return (
        <View
          style={StyleSheet.flatten([styles.headerContainer, { backgroundColor: colors.card, borderBottomColor: colors.border }])}
          onLayout={(e) => setHeaderHeight(e.nativeEvent.layout.height)}
        >
          <ScrollView horizontal showsHorizontalScrollIndicator={false} bounces={false}>
            <View style={styles.header}>
              {showSelection && (
                <View style={StyleSheet.flatten([styles.checkboxColumn, { borderRightColor: colors.border }])}>
                  <Checkbox checked={selectedTasks.size === tasks.length && tasks.length > 0} onCheckedChange={handleToggleAll} />
                </View>
              )}
              {visibleColumns.map((column, index) => (
                <TouchableOpacity
                  key={column.key}
                  style={StyleSheet.flatten([
                    styles.headerCell,
                    { width: column.width },
                    index < visibleColumns.length - 1 && { borderRightColor: colors.border, borderRightWidth: 1 },
                  ])}
                  onPress={() => column.sortable && handleSort(column.key)}
                  disabled={!column.sortable}
                >
                  <View style={styles.headerContent}>
                    <ThemedText style={StyleSheet.flatten([styles.headerText, { textAlign: column.align || "left" }])}>
                      {column.title}
                    </ThemedText>
                    {column.sortable && getSortIndicator(column.key)}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>
      );
    }, [visibleColumns, showSelection, selectedTasks, tasks, handleToggleAll, handleSort, getSortIndicator, colors]);

    const renderTask = useCallback(
      ({ item: task }: { item: Task }) => {
        const isSelected = selectedTasks.has(task.id);
        const overdue = isOverdue(task);

        const rowContent = (
          <Pressable
            onPress={() => onTaskPress?.(task.id)}
            style={({ pressed }) => [
              styles.row,
              { backgroundColor: colors.card },
              pressed && { opacity: 0.7 },
              isSelected && { backgroundColor: colors.accent },
              overdue && { backgroundColor: colors.destructive + "10" },
            ]}
          >
            <ScrollView horizontal showsHorizontalScrollIndicator={false} bounces={false}>
              <View style={styles.rowContent}>
                {showSelection && (
                  <View style={StyleSheet.flatten([styles.checkboxColumn, { borderRightColor: colors.border }])}>
                    <Checkbox checked={isSelected} onCheckedChange={() => handleToggleSelection(task.id)} />
                  </View>
                )}
                {visibleColumns.map((column, index) => (
                  <View
                    key={column.key}
                    style={StyleSheet.flatten([
                      styles.cell,
                      { width: column.width },
                      index < visibleColumns.length - 1 && { borderRightColor: colors.border, borderRightWidth: 1 },
                    ])}
                  >
                    {renderColumnContent(column, task)}
                  </View>
                ))}
              </View>
            </ScrollView>
          </Pressable>
        );

        if (enableSwipeActions && !showSelection) {
          return (
            <TaskTableRowSwipe
              taskId={task.id}
              taskStatus={task.status}
              onEdit={() => onTaskEdit?.(task.id)}
              onDelete={() => onTaskDelete?.(task.id)}
              onStatusChange={(status) => onTaskStatusChange?.(task.id, status)}
            >
              {rowContent}
            </TaskTableRowSwipe>
          );
        }

        return rowContent;
      },
      [visibleColumns, showSelection, selectedTasks, handleToggleSelection, renderColumnContent, enableSwipeActions, onTaskPress, onTaskEdit, onTaskDelete, onTaskStatusChange, colors, isOverdue],
    );

    const renderEmpty = useCallback(() => {
      if (loading) return null;
      return (
        <View style={styles.emptyContainer}>
          <ThemedText style={styles.emptyText}>Nenhuma tarefa encontrada</ThemedText>
        </View>
      );
    }, [loading]);

    const renderFooter = useCallback(() => {
      if (loadingMore) {
        return (
          <View style={styles.loadingMore}>
            <ActivityIndicator size="small" color={colors.primary} />
          </View>
        );
      }
      return null;
    }, [loadingMore, colors]);

    return (
      <View style={styles.container}>
        {renderHeader()}
        <FlatList
          ref={flatListRef}
          data={tasks}
          renderItem={renderTask}
          keyExtractor={(task) => task.id}
          ListEmptyComponent={renderEmpty}
          ListFooterComponent={renderFooter}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
          onEndReached={onEndReached}
          onEndReachedThreshold={0.1}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
        />
      </View>
    );
  },
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContainer: {
    borderBottomWidth: 1,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  header: {
    flexDirection: "row",
    paddingHorizontal: spacing.md,
  },
  headerCell: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    justifyContent: "center",
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  headerText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  sortIndicator: {
    flexDirection: "row",
    alignItems: "center",
  },
  sortIndex: {
    fontSize: fontSize.xs,
    marginLeft: 2,
  },
  row: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowContent: {
    flexDirection: "row",
    paddingHorizontal: spacing.md,
  },
  checkboxColumn: {
    width: 48,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: spacing.md,
    borderRightWidth: 1,
  },
  cell: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xs,
    justifyContent: "center",
  },
  cellText: {
    fontSize: fontSize.sm,
  },
  cellSubtext: {
    fontSize: fontSize.xs,
    opacity: 0.6,
    marginTop: 2,
  },
  rightText: {
    textAlign: "right",
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
  emptyContainer: {
    padding: spacing.xl,
    alignItems: "center",
  },
  emptyText: {
    fontSize: fontSize.md,
    opacity: 0.6,
  },
  loadingMore: {
    padding: spacing.md,
    alignItems: "center",
  },
  listContent: {
    flexGrow: 1,
  },
});