import React, { useState, useCallback, useMemo, useRef } from "react";
import { FlatList, View, TouchableOpacity, Pressable, RefreshControl, ActivityIndicator, Dimensions, ScrollView, StyleSheet } from "react-native";
import { Icon } from "@/components/ui/icon";
import { IconSelector } from "@tabler/icons-react-native";
import type { Task } from '../../../../types';
import { ThemedText } from "@/components/ui/themed-text";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/lib/theme";
import { useSwipeRow } from "@/contexts/swipe-row-context";
import { spacing, fontSize, fontWeight } from "@/constants/design-system";
import { TaskTableRowSwipe } from "./task-table-row-swipe";
import { TaskStatusBadge } from "./task-status-badge";
import { TaskPriorityIndicator } from "./task-priority-indicator";
import { DeadlineCountdown } from "./deadline-countdown";
import { getDefaultVisibleColumns } from "./column-visibility-manager";
import { formatDate, formatCurrency } from '../../../../utils';
import { getDaysUntilDeadline, getTaskRowColor } from '../../../../utils/task';
import { extendedColors, badgeColors } from "@/lib/theme/extended-colors";
import { TASK_STATUS } from '../../../../constants';
import type { SortConfig } from "@/lib/sort-utils";

export interface TableColumn {
  key: string;
  header: string;
  accessor: (task: Task) => React.ReactNode;
  width: number;
  align?: "left" | "center" | "right";
  sortable?: boolean;
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
  sortConfigs?: SortConfig[];
  onSort?: (configs: SortConfig[]) => void;
  enableSwipeActions?: boolean;
  visibleColumnKeys?: string[];
}

// Get screen width for responsive design
const { width: screenWidth } = Dimensions.get("window");
const availableWidth = screenWidth - 32; // Account for padding

// Helper to check if task is overdue
const isOverdue = (task: Task) => {
  if (!task.term || task.status === TASK_STATUS.COMPLETED || task.status === TASK_STATUS.CANCELLED) {
    return false;
  }
  return new Date(task.term) < new Date();
};

// Define all available columns with their renderers
export const createColumnDefinitions = (): TableColumn[] => [
  {
    key: "name",
    header: "NOME",
    align: "left",
    sortable: true,
    width: 0,
    accessor: (task: Task) => (
      <View style={styles.nameColumn}>
        <View style={styles.nameContent}>
          <ThemedText style={StyleSheet.flatten([styles.cellText, styles.nameText])} numberOfLines={1}>
            {task.name}
          </ThemedText>
        </View>
        {task.generalPainting?.hex && (
          <View style={[styles.paintSquare, { backgroundColor: task.generalPainting.hex }]} />
        )}
      </View>
    ),
  },
  {
    key: "customer.fantasyName",
    header: "CLIENTE",
    align: "left",
    sortable: true,
    width: 0,
    accessor: (task: Task) => (
      <ThemedText style={styles.cellText} numberOfLines={1}>
        {task.customer?.fantasyName || "-"}
      </ThemedText>
    ),
  },
  {
    key: "sector.name",
    header: "SETOR",
    align: "left",
    sortable: true,
    width: 0,
    accessor: (task: Task) => (
      <View style={styles.sectorCell}>
        <View
          style={StyleSheet.flatten([
            styles.sectorDot,
            { backgroundColor: task.sector?.color || extendedColors.neutral[400] }
          ])}
        />
        <ThemedText style={styles.cellText} numberOfLines={1}>
          {task.sector?.name || "Não definido"}
        </ThemedText>
      </View>
    ),
  },
  {
    key: "status",
    header: "STATUS",
    align: "center",
    sortable: true,
    width: 0,
    accessor: (task: Task) => <TaskStatusBadge status={task.status} />,
  },
  {
    key: "priority",
    header: "PRIORIDADE",
    align: "center",
    sortable: true,
    width: 0,
    accessor: (task: Task) => (
      <View style={styles.centerAlign}>
        <TaskPriorityIndicator priority={task.priority} />
      </View>
    ),
  },
  {
    key: "term",
    header: "PRAZO",
    align: "left",
    sortable: true,
    width: 0,
    accessor: (task: Task) => {
      const overdueTask = isOverdue(task);
      return (
        <ThemedText
          style={StyleSheet.flatten([
            styles.cellText,
            overdueTask && { color: "#dc2626", fontWeight: fontWeight.semibold } // Red-600 for overdue
          ])}
          numberOfLines={1}
        >
          {task.term ? formatDate(task.term) : "-"}
        </ThemedText>
      );
    },
  },
  {
    key: "price",
    header: "VALOR",
    align: "right",
    sortable: true,
    width: 0,
    accessor: (task: Task) => {
      const totalValue = task.budget?.reduce((sum, item) => sum + item.valor, 0) || 0;
      return (
        <ThemedText style={StyleSheet.flatten([styles.cellText, styles.numberText])} numberOfLines={1}>
          {totalValue > 0 ? formatCurrency(totalValue) : "-"}
        </ThemedText>
      );
    },
  },
  {
    key: "servicesCount",
    header: "SERVIÇOS",
    align: "center",
    sortable: false,
    width: 0,
    accessor: (task: Task) => {
      const serviceCount = (task as any)._count?.services || task.services?.length || 0;
      return (
        <View style={styles.centerAlign}>
          <Badge variant="outline" size="sm">
            <ThemedText style={styles.monoText}>
              {serviceCount}
            </ThemedText>
          </Badge>
        </View>
      );
    },
  },
  {
    key: "entryDate",
    header: "ENTRADA",
    align: "left",
    sortable: true,
    width: 0,
    accessor: (task: Task) => (
      <ThemedText style={styles.cellText} numberOfLines={1}>
        {task.entryDate ? formatDate(task.entryDate) : "-"}
      </ThemedText>
    ),
  },
  {
    key: "startedAt",
    header: "INICIADO",
    align: "left",
    sortable: true,
    width: 0,
    accessor: (task: Task) => (
      <ThemedText style={styles.cellText} numberOfLines={1}>
        {task.startedAt ? formatDate(task.startedAt) : "-"}
      </ThemedText>
    ),
  },
  {
    key: "finishedAt",
    header: "FINALIZADO",
    align: "left",
    sortable: true,
    width: 0,
    accessor: (task: Task) => (
      <ThemedText style={styles.cellText} numberOfLines={1}>
        {task.finishedAt ? formatDate(task.finishedAt) : "-"}
      </ThemedText>
    ),
  },
  {
    key: "plate",
    header: "PLACA",
    align: "left",
    sortable: true,
    width: 0,
    accessor: (task: Task) => (
      <ThemedText style={StyleSheet.flatten([styles.cellText, styles.monoText])} numberOfLines={1}>
        {task.plate ? task.plate.toUpperCase() : "-"}
      </ThemedText>
    ),
  },
  {
    key: "serialNumber",
    header: "Nº SÉRIE",
    align: "left",
    sortable: true,
    width: 0,
    accessor: (task: Task) => (
      <ThemedText style={StyleSheet.flatten([styles.cellText, styles.monoText])} numberOfLines={1}>
        {task.serialNumber || "-"}
      </ThemedText>
    ),
  },
  {
    key: "remainingTime",
    header: "TEMPO RESTANTE",
    align: "center",
    sortable: false,
    width: 0,
    accessor: (task: Task) => (
      <View style={styles.centerAlign}>
        <DeadlineCountdown task={task} />
      </View>
    ),
  },
  {
    key: "createdBy.name",
    header: "CRIADO POR",
    align: "left",
    sortable: true,
    width: 0,
    accessor: (task: Task) => (
      <ThemedText style={styles.cellText} numberOfLines={1}>
        {task.createdBy?.name || "-"}
      </ThemedText>
    ),
  },
  {
    key: "createdAt",
    header: "CRIADO EM",
    align: "left",
    sortable: true,
    width: 0,
    accessor: (task: Task) => (
      <ThemedText style={StyleSheet.flatten([styles.cellText, { fontSize: fontSize.sm }])} numberOfLines={1}>
        {new Date(task.createdAt).toLocaleDateString("pt-BR")}
      </ThemedText>
    ),
  },
  {
    key: "updatedAt",
    header: "ATUALIZADO EM",
    align: "left",
    sortable: true,
    width: 0,
    accessor: (task: Task) => (
      <ThemedText style={StyleSheet.flatten([styles.cellText, { fontSize: fontSize.sm }])} numberOfLines={1}>
        {new Date(task.updatedAt).toLocaleDateString("pt-BR")}
      </ThemedText>
    ),
  },
];

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
    sortConfigs = [],
    onSort,
    enableSwipeActions = true,
    visibleColumnKeys,
  }) => {
    const { colors, isDark } = useTheme();
    const { activeRowId, closeActiveRow } = useSwipeRow();
    const [headerHeight, setHeaderHeight] = useState(50);
    const flatListRef = useRef<FlatList>(null);

    // Column visibility - use prop if provided, otherwise use default
    const visibleColumns = useMemo(() => {
      if (visibleColumnKeys && visibleColumnKeys.length > 0) {
        return new Set(visibleColumnKeys);
      }
      return getDefaultVisibleColumns();
    }, [visibleColumnKeys]);

    // Get all column definitions
    const allColumns = useMemo(() => createColumnDefinitions(), []);

    // Build visible columns with dynamic widths
    const displayColumns = useMemo(() => {
      // Define width ratios for each column type
      const columnWidthRatios: Record<string, number> = {
        name: 2.5,
        "customer.fantasyName": 2.0,
        "sector.name": 1.5,
        status: 1.2,
        priority: 0.9,
        term: 1.2,
        price: 1.2,
        servicesCount: 0.9,
        entryDate: 1.2,
        startedAt: 1.2,
        finishedAt: 1.2,
        plate: 1.0,
        serialNumber: 1.5,
        remainingTime: 1.3,
        "createdBy.name": 1.5,
        createdAt: 1.2,
        updatedAt: 1.2,
      };

      // Filter to visible columns
      const visible = allColumns.filter((col) => visibleColumns.has(col.key));

      // Calculate total ratio
      const totalRatio = visible.reduce((sum, col) => sum + (columnWidthRatios[col.key] || 1.0), 0);

      // Calculate actual widths
      return visible.map((col) => {
        const ratio = columnWidthRatios[col.key] || 1.0;
        const width = Math.floor((availableWidth * ratio) / totalRatio);
        return { ...col, width };
      });
    }, [allColumns, visibleColumns]);

    // Handle taps outside of active row to close swipe actions
    const handleContainerPress = useCallback(() => {
      if (activeRowId) {
        closeActiveRow();
      }
    }, [activeRowId, closeActiveRow]);

    // Handle scroll events to close active row
    const handleScroll = useCallback(() => {
      if (activeRowId) {
        closeActiveRow();
      }
    }, [activeRowId, closeActiveRow]);

    // Calculate total table width
    const tableWidth = useMemo(() => {
      return displayColumns.reduce((sum, col) => sum + col.width, 0);
    }, [displayColumns]);


    // Sort handler - non-cumulative (only one sort at a time)
    const handleSort = useCallback(
      (columnKey: string) => {
        if (!onSort) return;

        const existingConfig = sortConfigs?.find((config) => config.columnKey === columnKey);

        if (existingConfig) {
          // Column already sorted, toggle direction or remove
          if (existingConfig.direction === "asc") {
            // Toggle to descending
            onSort([{ columnKey, direction: "desc" as const }]);
          } else {
            // Remove sort (back to no sort)
            onSort([]);
          }
        } else {
          // Set new sort (replacing any existing sort)
          onSort([{ columnKey, direction: "asc" as const }]);
        }
      },
      [sortConfigs, onSort],
    );

    // Column renderer using accessor
    const renderColumnValue = useCallback((task: Task, column: TableColumn) => {
      return column.accessor(task);
    }, []);

    // Header component
    const renderHeader = useCallback(
      () => (
        <View style={styles.headerWrapper}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            scrollEnabled={tableWidth > availableWidth}
            style={StyleSheet.flatten([
              styles.headerContainer,
              {
                backgroundColor: isDark ? extendedColors.neutral[800] : extendedColors.neutral[100],
                borderBottomColor: isDark ? extendedColors.neutral[700] : extendedColors.neutral[200],
              },
            ])}
            contentContainerStyle={{ paddingHorizontal: 16 }}
            onLayout={(event) => setHeaderHeight(event.nativeEvent.layout.height)}
          >
            <View style={StyleSheet.flatten([styles.headerRow, { width: tableWidth }])}>
              {displayColumns.map((column) => {
                const sortConfig = sortConfigs?.find((config) => config.columnKey === column.key);

                return (
                  <TouchableOpacity
                    key={column.key}
                    style={StyleSheet.flatten([styles.headerCell, { width: column.width }])}
                    onPress={() => column.sortable && handleSort(column.key)}
                    disabled={!column.sortable}
                    activeOpacity={column.sortable ? 0.7 : 1}
                  >
                    <View style={styles.headerCellContent}>
                      <View style={styles.headerTextContainer}>
                        <ThemedText
                          style={StyleSheet.flatten([styles.headerText, { color: isDark ? extendedColors.neutral[200] : "#000000" }])}
                          numberOfLines={1}
                          ellipsizeMode="tail"
                        >
                          {column.header}
                        </ThemedText>
                      </View>
                      {column.sortable && (
                        <View style={styles.sortIconWrapper}>
                          {sortConfig ? (
                            <View style={styles.sortIconContainer}>
                              {sortConfig.direction === "asc" ? (
                                <Icon name="chevron-up" size="sm" color={isDark ? extendedColors.neutral[100] : extendedColors.neutral[900]} />
                              ) : (
                                <Icon name="chevron-down" size="sm" color={isDark ? extendedColors.neutral[100] : extendedColors.neutral[900]} />
                              )}
                            </View>
                          ) : (
                            <IconSelector size={16} color={isDark ? extendedColors.neutral[400] : extendedColors.neutral[600]} />
                          )}
                        </View>
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>
        </View>
      ),
      [colors, isDark, tableWidth, displayColumns, sortConfigs, handleSort],
    );

    // Row component
    const renderRow = useCallback(
      ({ item, index }: { item: Task; index: number }) => {
        const isEven = index % 2 === 0;
        // Get row color based on task status and deadline (matches web version)
        const rowColor = getTaskRowColor(item, isDark);

        if (enableSwipeActions && (onTaskEdit || onTaskDelete || onTaskStatusChange)) {
          return (
            <TaskTableRowSwipe
              key={item.id}
              taskId={item.id}
              taskName={item.name}
              taskStatus={item.status}
              onEdit={onTaskEdit}
              onDelete={onTaskDelete}
              onStatusChange={onTaskStatusChange}
              disabled={false}
            >
              {(isActive) => (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  scrollEnabled={tableWidth > availableWidth}
                  style={StyleSheet.flatten([
                    styles.row,
                    {
                      backgroundColor: rowColor,
                      borderBottomColor: isDark ? extendedColors.neutral[700] : extendedColors.neutral[200],
                    },
                  ])}
                  contentContainerStyle={{ paddingHorizontal: 16 }}
                >
                  <Pressable
                    style={StyleSheet.flatten([styles.rowContent, { width: tableWidth }])}
                    onPress={() => onTaskPress?.(item.id)}
                    android_ripple={{ color: colors.primary + "20" }}
                  >
                    {displayColumns.map((column) => (
                      <View
                        key={column.key}
                        style={StyleSheet.flatten([styles.cell, { width: column.width }, column.align === "center" && styles.centerAlign, column.align === "right" && styles.rightAlign])}
                      >
                        {renderColumnValue(item, column)}
                      </View>
                    ))}
                  </Pressable>
                </ScrollView>
              )}
            </TaskTableRowSwipe>
          );
        }

        // Non-swipeable version
        return (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            scrollEnabled={tableWidth > availableWidth}
            style={StyleSheet.flatten([
              styles.row,
              {
                backgroundColor: rowColor,
                borderBottomColor: isDark ? extendedColors.neutral[700] : extendedColors.neutral[200],
              },
            ])}
            contentContainerStyle={{ paddingHorizontal: 16 }}
          >
            <Pressable
              style={StyleSheet.flatten([styles.rowContent, { width: tableWidth }])}
              onPress={() => onTaskPress?.(item.id)}
              android_ripple={{ color: colors.primary + "20" }}
            >
              {displayColumns.map((column) => (
                <View
                  key={column.key}
                  style={StyleSheet.flatten([styles.cell, { width: column.width }, column.align === "center" && styles.centerAlign, column.align === "right" && styles.rightAlign])}
                >
                  {renderColumnValue(item, column)}
                </View>
              ))}
            </Pressable>
          </ScrollView>
        );
      },
      [
        colors,
        tableWidth,
        displayColumns,
        onTaskPress,
        renderColumnValue,
        enableSwipeActions,
        onTaskEdit,
        onTaskDelete,
        onTaskStatusChange,
        activeRowId,
        closeActiveRow,
        isDark,
      ],
    );

    // Loading footer component
    const renderFooter = useCallback(() => {
      if (!loadingMore) return null;

      return (
        <View style={styles.loadingFooter}>
          <ActivityIndicator size="small" color={colors.primary} />
          <ThemedText style={styles.loadingText}>Carregando mais...</ThemedText>
        </View>
      );
    }, [loadingMore, colors.primary]);

    // Empty state component
    const renderEmpty = useCallback(
      () => (
        <View style={styles.emptyContainer}>
          <Icon name="clipboard-list" size="xl" variant="muted" />
          <ThemedText style={styles.emptyTitle}>Nenhuma tarefa encontrada</ThemedText>
          <ThemedText style={styles.emptySubtitle}>Tente ajustar os filtros ou adicionar novas tarefas</ThemedText>
        </View>
      ),
      [colors.mutedForeground],
    );

    // Main loading state
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <ThemedText style={styles.loadingText}>Carregando tarefas...</ThemedText>
        </View>
      );
    }

    return (
      <View style={styles.wrapper}>
        <Pressable style={StyleSheet.flatten([styles.container, { backgroundColor: colors.background }])} onPress={handleContainerPress}>
          {renderHeader()}
          <FlatList
            ref={flatListRef}
            data={tasks}
            renderItem={renderRow}
            keyExtractor={(task) => task.id}
            refreshControl={onRefresh ? <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} tintColor={colors.primary} /> : undefined}
            onEndReached={onEndReached}
            onEndReachedThreshold={0.2}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            ListFooterComponent={renderFooter}
            ListEmptyComponent={renderEmpty}
            removeClippedSubviews={true}
            maxToRenderPerBatch={10}
            windowSize={5}
            initialNumToRender={15}
            updateCellsBatchingPeriod={50}
            getItemLayout={(data, index) => ({
              length: 48, // Fixed row height
              offset: 48 * index,
              index,
            })}
            style={styles.flatList}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ flexGrow: 1 }}
          />
        </Pressable>
      </View>
    );
  },
);

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    paddingHorizontal: 8,
    paddingBottom: 24,
    backgroundColor: "transparent",
  },
  container: {
    flex: 1,
    backgroundColor: "white",
    borderRadius: 8,
    overflow: "hidden",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  headerWrapper: {
    flexDirection: "column",
  },
  headerContainer: {
    borderBottomWidth: 2,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 40, // Reduced to match smaller fonts
  },
  headerCell: {
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.sm,
    minHeight: 40, // Reduced to match smaller fonts
    justifyContent: "center",
  },
  headerText: {
    fontSize: 10, // Smaller than xs to prevent line breaks
    fontWeight: fontWeight.bold,
    textTransform: "uppercase",
    lineHeight: 12,
    color: "#000000", // black text like web
  },
  nonSortableHeader: {
    opacity: 1,
  },
  sortIcon: {
    marginLeft: spacing.xs,
  },
  headerCellContent: {
    display: "flex",
    alignItems: "flex-start",
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    gap: 4,
  },
  headerTextContainer: {
    flex: 1,
    minWidth: 0, // Allow text to shrink below content size
  },
  sortIconWrapper: {
    flexShrink: 0, // Prevent icon from shrinking
    justifyContent: "center",
    alignItems: "center",
    width: 16,
  },
  sortIndicator: {
    marginLeft: 4,
  },
  sortIconContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  sortOrder: {
    fontSize: 10,
    fontWeight: fontWeight.bold,
    marginLeft: 2,
  },
  checkboxCell: {
    width: 50,
    justifyContent: "center",
    alignItems: "center",
  },
  flatList: {
    flex: 1,
  },
  row: {
    borderBottomWidth: 1,
    borderBottomColor: "#e5e5e5", // neutral-200
  },
  rowContent: {
    flexDirection: "row",
    alignItems: "stretch", // Changed from 'center' to 'stretch' to ensure all cells have same height
    minHeight: 36, // Reduced to match smaller fonts
  },
  cell: {
    paddingHorizontal: spacing.xs,
    paddingVertical: 6, // Reduced padding
    justifyContent: "center",
    minHeight: 36, // Reduced to match smaller fonts
  },
  centerAlign: {
    alignItems: "center",
  },
  rightAlign: {
    alignItems: "flex-end",
  },
  cellText: {
    fontSize: fontSize.xs, // Match serial number size
    // Color is handled by ThemedText component automatically
  },
  cellSubtext: {
    fontSize: fontSize.xs,
    opacity: 0.6,
    marginTop: 2,
  },
  monoText: {
    fontFamily: "monospace",
    fontSize: fontSize.xs,
  },
  nameText: {
    fontWeight: fontWeight.medium,
    fontSize: fontSize.xs, // Match serial number size
  },
  numberText: {
    fontWeight: fontWeight.normal,
    fontSize: fontSize.xs, // Match serial number size
  },
  sectorCell: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  sectorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: spacing.md,
  },
  loadingFooter: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: spacing.lg,
    gap: spacing.sm,
  },
  loadingText: {
    fontSize: fontSize.sm,
    opacity: 0.7,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: spacing.xxl,
    gap: spacing.md,
  },
  emptyTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
  },
  emptySubtitle: {
    fontSize: fontSize.sm,
    opacity: 0.7,
    textAlign: "center",
    paddingHorizontal: spacing.xl,
  },
  nameColumn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    width: "100%",
  },
  nameContent: {
    flex: 1,
    minWidth: 0,
  },
  paintSquare: {
    width: 24,
    height: 24,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.1)",
  },
});

TaskTable.displayName = "TaskTable";
