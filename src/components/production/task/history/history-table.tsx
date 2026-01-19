import React, { useCallback, useMemo, useState } from "react";
import { FlatList, View, TouchableOpacity, Pressable, RefreshControl, ActivityIndicator, Dimensions, ScrollView, StyleSheet } from "react-native";
import { Icon } from "@/components/ui/icon";
import type { Task } from '../../../../types';
import { ThemedText } from "@/components/ui/themed-text";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/lib/theme";
import { useSwipeRow } from "@/contexts/swipe-row-context";
import { spacing, fontSize, fontWeight } from "@/constants/design-system";
import { HistoryTableRowSwipe } from "./history-table-row-swipe";
import { formatDate, formatChassis } from "@/utils";
import { extendedColors, badgeColors } from "@/lib/theme/extended-colors";
import { TASK_STATUS, TASK_STATUS_LABELS, COMMISSION_STATUS, COMMISSION_STATUS_LABELS } from "@/constants";
import { getBadgeVariantFromStatus } from "@/components/ui/badge";
import type { SortConfig } from '@/lib/sort-utils';
import { TaskSectorModal, TaskStatusModal } from "../modals";

export interface TableColumn {
  key: string;
  header: string;
  accessor: (task: Task) => React.ReactNode;
  width: number;
  align?: "left" | "center" | "right";
  sortable?: boolean;
}

interface HistoryTableProps {
  tasks: Task[];
  onTaskPress?: (taskId: string) => void;
  onTaskEdit?: (taskId: string) => void;
  onTaskDelete?: (taskId: string) => void;
  onTaskSectorChange?: (taskId: string, sectorId: string) => Promise<void>;
  onTaskStatusChange?: (taskId: string, status: TASK_STATUS) => Promise<void>;
  onRefresh?: () => Promise<void>;
  onEndReached?: () => void;
  refreshing?: boolean;
  loading?: boolean;
  loadingMore?: boolean;
  sortConfigs?: SortConfig[];
  onSort?: (configs: SortConfig[]) => void;
  visibleColumnKeys?: string[];
  enableSwipeActions?: boolean;
}

// Get screen width for responsive design
const { width: screenWidth } = Dimensions.get("window");
const availableWidth = screenWidth - 32; // Account for padding

// Define all available columns with their renderers
export const createColumnDefinitions = (): TableColumn[] => [
  {
    key: "name",
    header: "Nome",
    align: "left",
    sortable: true,
    width: 0,
    accessor: (task: Task) => (
      <View style={styles.nameContainer}>
        <View style={styles.nameContent}>
          <ThemedText style={styles.nameText} numberOfLines={1}>
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
    header: "Cliente",
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
    key: "generalPainting",
    header: "Pintura",
    align: "left",
    sortable: false,
    width: 0,
    accessor: (task: Task) => {
      if (!task.generalPainting) {
        return (
          <ThemedText style={styles.mutedText} numberOfLines={1}>
            -
          </ThemedText>
        );
      }
      return (
        <ThemedText style={styles.cellText} numberOfLines={1}>
          {task.generalPainting.name || "-"}
        </ThemedText>
      );
    },
  },
  {
    key: "sector.name",
    header: "Setor",
    align: "left",
    sortable: true,
    width: 0,
    accessor: (task: Task) => {
      if (!task.sector) {
        return (
          <ThemedText style={styles.mutedText} numberOfLines={1}>
            -
          </ThemedText>
        );
      }
      return (
        <Badge variant="outline" size="sm">
          <ThemedText style={styles.badgeText}>{task.sector?.name || "-"}</ThemedText>
        </Badge>
      );
    },
  },
  {
    key: "status",
    header: "Status",
    align: "center",
    sortable: true,
    width: 0,
    accessor: (task: Task) => {
      const statusLabel = TASK_STATUS_LABELS[task.status as TASK_STATUS] || task.status;
      const variant = task.status === TASK_STATUS.COMPLETED ? "default" :
                     task.status === TASK_STATUS.CANCELLED ? "destructive" : "secondary";

      return (
        <View style={styles.centerAlign}>
          <Badge variant={variant} size="sm">
            <ThemedText style={styles.badgeText}>{statusLabel}</ThemedText>
          </Badge>
        </View>
      );
    },
  },
  {
    key: "serialNumber",
    header: "Nº Série",
    align: "left",
    sortable: true,
    width: 0,
    accessor: (task: Task) => (
      <ThemedText style={styles.cellText} numberOfLines={1}>
        {task.serialNumber || "-"}
      </ThemedText>
    ),
  },
  {
    key: "plate",
    header: "Placa",
    align: "left",
    sortable: true,
    width: 0,
    accessor: (task: Task) => (
      <ThemedText style={styles.cellText} numberOfLines={1}>
        {task.truck?.plate ? task.truck.plate.toUpperCase() : "-"}
      </ThemedText>
    ),
  },
  {
    key: "chassisNumber",
    header: "Nº Chassi",
    align: "left",
    sortable: true,
    width: 0,
    accessor: (task: Task) => (
      <ThemedText style={styles.cellText} numberOfLines={1}>
        {task.truck?.chassisNumber ? formatChassis(task.truck.chassisNumber) : "-"}
      </ThemedText>
    ),
  },
  {
    key: "entryDate",
    header: "Entrada",
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
    header: "Iniciado",
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
    header: "Finalizado",
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
    key: "term",
    header: "Prazo",
    align: "left",
    sortable: true,
    width: 0,
    accessor: (task: Task) => (
      <ThemedText style={styles.cellText} numberOfLines={1}>
        {task.term ? formatDate(task.term) : "-"}
      </ThemedText>
    ),
  },
  {
    key: "services",
    header: "Serviços",
    align: "center",
    sortable: false,
    width: 0,
    accessor: (task: Task) => {
      const serviceCount = task.services?.length || 0;
      return (
        <View style={styles.centerAlign}>
          <Badge
            variant={serviceCount > 0 ? "default" : "secondary"}
            size="sm"
            style={{
              backgroundColor: serviceCount > 0 ? badgeColors.info.background : badgeColors.muted.background,
              borderWidth: 0,
            }}
          >
            <ThemedText
              style={{
                color: serviceCount > 0 ? badgeColors.info.text : badgeColors.muted.text,
                fontSize: fontSize.xs,
                fontWeight: fontWeight.medium,
              }}
            >
              {serviceCount}
            </ThemedText>
          </Badge>
        </View>
      );
    },
  },
  {
    key: "details",
    header: "Detalhes",
    align: "left",
    sortable: false,
    width: 0,
    accessor: (task: Task) => (
      <ThemedText style={styles.cellText} numberOfLines={2}>
        {task.details || "-"}
      </ThemedText>
    ),
  },
  {
    key: "observation",
    header: "Observação",
    align: "left",
    sortable: false,
    width: 0,
    accessor: (task: Task) => (
      <ThemedText style={styles.cellText} numberOfLines={2}>
        {task.observation?.description || "-"}
      </ThemedText>
    ),
  },
  {
    key: "commission",
    header: "Comissão",
    align: "center",
    sortable: true,
    width: 0,
    accessor: (task: Task) => {
      if (!task.commission) {
        return (
          <ThemedText style={styles.mutedText} numberOfLines={1}>
            -
          </ThemedText>
        );
      }
      const variant = getBadgeVariantFromStatus(task.commission, "COMMISSION_STATUS");
      const label = COMMISSION_STATUS_LABELS[task.commission as COMMISSION_STATUS] || task.commission;
      return (
        <View style={styles.centerAlign}>
          <Badge variant={variant} size="sm">
            <ThemedText style={styles.badgeText}>{label}</ThemedText>
          </Badge>
        </View>
      );
    },
  },
];

export const HistoryTable = React.memo<HistoryTableProps>(
  ({
    tasks,
    onTaskPress,
    onTaskEdit,
    onTaskDelete,
    onTaskSectorChange,
    onTaskStatusChange,
    onRefresh,
    onEndReached,
    refreshing = false,
    loading = false,
    loadingMore = false,
    sortConfigs = [],
    onSort,
    visibleColumnKeys = ["name", "customer.fantasyName", "generalPainting", "sector.name", "serialNumber", "finishedAt"],
    enableSwipeActions = true,
  }) => {
    const { colors, isDark } = useTheme();
    const { activeRowId, closeActiveRow } = useSwipeRow();

    // Modal state
    const [sectorModalVisible, setSectorModalVisible] = useState(false);
    const [statusModalVisible, setStatusModalVisible] = useState(false);
    const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
    const [modalLoading, setModalLoading] = useState(false);

    const selectedTask = useMemo(
      () => tasks.find((task) => task.id === selectedTaskId),
      [tasks, selectedTaskId]
    );

    // Get all column definitions
    const allColumns = useMemo(() => createColumnDefinitions(), []);

    // Build visible columns with dynamic widths
    const displayColumns = useMemo(() => {
      // Define width ratios for each column type
      const columnWidthRatios: Record<string, number> = {
        name: 2.5,
        "customer.fantasyName": 2.0,
        generalPainting: 1.8,
        "sector.name": 1.5,
        status: 1.6,
        serialNumber: 1.5,
        plate: 1.0,
        chassisNumber: 1.5,
        entryDate: 1.2,
        startedAt: 1.2,
        finishedAt: 0.8,
        term: 1.2,
        services: 0.9,
        details: 2.0,
        observation: 2.0,
        commission: 1.4,
      };

      // Filter to visible columns
      const visible = allColumns.filter((col) => visibleColumnKeys.includes(col.key));

      // Calculate total ratio
      const totalRatio = visible.reduce((sum, col) => sum + (columnWidthRatios[col.key] || 1.0), 0);

      // Calculate actual widths
      return visible.map((col) => {
        const ratio = columnWidthRatios[col.key] || 1.0;
        const width = Math.floor((availableWidth * ratio) / totalRatio);
        return { ...col, width };
      });
    }, [allColumns, visibleColumnKeys]);

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

    // Modal handlers
    const handleSetSector = useCallback((taskId: string) => {
      setSelectedTaskId(taskId);
      setSectorModalVisible(true);
    }, []);

    const handleSetStatus = useCallback((taskId: string) => {
      setSelectedTaskId(taskId);
      setStatusModalVisible(true);
    }, []);

    const handleSectorModalClose = useCallback(() => {
      setSectorModalVisible(false);
      setSelectedTaskId(null);
      setModalLoading(false);
    }, []);

    const handleStatusModalClose = useCallback(() => {
      setStatusModalVisible(false);
      setSelectedTaskId(null);
      setModalLoading(false);
    }, []);

    const handleSectorSelect = useCallback(
      async (sectorId: string) => {
        if (!selectedTaskId || !onTaskSectorChange) return;

        try {
          setModalLoading(true);
          await onTaskSectorChange(selectedTaskId, sectorId);
          handleSectorModalClose();
        } catch (error) {
          console.error("Failed to update task sector:", error);
          setModalLoading(false);
        }
      },
      [selectedTaskId, onTaskSectorChange, handleSectorModalClose]
    );

    const handleStatusSelect = useCallback(
      async (status: TASK_STATUS) => {
        if (!selectedTaskId || !onTaskStatusChange) return;

        try {
          setModalLoading(true);
          await onTaskStatusChange(selectedTaskId, status);
          handleStatusModalClose();
        } catch (error) {
          console.error("Failed to update task status:", error);
          setModalLoading(false);
        }
      },
      [selectedTaskId, onTaskStatusChange, handleStatusModalClose]
    );

    // Sort handler - Single column sorting only for mobile
    const handleSort = useCallback(
      (columnKey: string) => {
        if (!onSort) return;

        const currentSort = sortConfigs?.[0];

        // If clicking the same column, toggle direction (asc -> desc -> no sort)
        if (currentSort?.columnKey === columnKey) {
          if (currentSort.direction === "asc") {
            // Change to descending
            onSort([{ columnKey, direction: "desc" }]);
          } else {
            // Remove sort (back to default)
            onSort([]);
          }
        } else {
          // New column clicked, sort ascending
          onSort([{ columnKey, direction: "asc" }]);
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
              },
            ])}
            contentContainerStyle={{ paddingHorizontal: 16 }}
          >
            <View style={StyleSheet.flatten([styles.headerRow, { width: tableWidth }])}>
              {displayColumns.map((column) => {
                // Single column sort - check if this column is currently sorted
                const sortConfig = sortConfigs?.[0]?.columnKey === column.key ? sortConfigs[0] : null;

                return (
                  <TouchableOpacity
                    key={column.key}
                    style={StyleSheet.flatten([styles.headerCell, { width: column.width }])}
                    onPress={() => column.sortable && handleSort(column.key)}
                    disabled={!column.sortable}
                    activeOpacity={column.sortable ? 0.7 : 1}
                  >
                    <View style={styles.headerCellContent}>
                      <ThemedText style={StyleSheet.flatten([styles.headerText, { color: isDark ? extendedColors.neutral[200] : "#000000" }])} numberOfLines={1}>
                        {column.header}
                      </ThemedText>
                      {column.sortable &&
                        (sortConfig ? (
                          sortConfig.direction === "asc" ? (
                            <Icon name="chevron-up" size="sm" color={isDark ? extendedColors.neutral[100] : extendedColors.neutral[900]} />
                          ) : (
                            <Icon name="chevron-down" size="sm" color={isDark ? extendedColors.neutral[100] : extendedColors.neutral[900]} />
                          )
                        ) : (
                          <Icon name="arrows-sort" size="sm" color={isDark ? extendedColors.neutral[400] : extendedColors.neutral[600]} />
                        ))}
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

        if (enableSwipeActions && (onTaskEdit || onTaskDelete || onTaskSectorChange || onTaskStatusChange)) {
          return (
            <HistoryTableRowSwipe
              taskId={item.id}
              taskName={item.name}
              taskStatus={item.status}
              onEdit={onTaskEdit}
              onDelete={onTaskDelete}
              onSetSector={onTaskSectorChange ? handleSetSector : undefined}
              onSetStatus={onTaskStatusChange ? handleSetStatus : undefined}
            >
              {(_isActive) => (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  scrollEnabled={tableWidth > availableWidth}
                  style={StyleSheet.flatten([
                    styles.row,
                    {
                      backgroundColor: isEven ? colors.background : isDark ? extendedColors.neutral[900] : extendedColors.neutral[50],
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
                        style={StyleSheet.flatten([
                          styles.cell,
                          { width: column.width },
                          column.align === "center" && styles.centerAlign,
                          column.align === "right" && styles.rightAlign,
                        ])}
                      >
                        {renderColumnValue(item, column)}
                      </View>
                    ))}
                  </Pressable>
                </ScrollView>
              )}
            </HistoryTableRowSwipe>
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
                backgroundColor: isEven ? colors.background : isDark ? extendedColors.neutral[900] : extendedColors.neutral[50],
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
                  style={StyleSheet.flatten([
                    styles.cell,
                    { width: column.width },
                    column.align === "center" && styles.centerAlign,
                    column.align === "right" && styles.rightAlign,
                  ])}
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
        onTaskSectorChange,
        onTaskStatusChange,
        handleSetSector,
        handleSetStatus,
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
          <Icon name="history" size="xl" variant="muted" />
          <ThemedText style={styles.emptyTitle}>Nenhuma tarefa encontrada</ThemedText>
          <ThemedText style={styles.emptySubtitle}>Tente ajustar os filtros ou adicionar novas tarefas</ThemedText>
        </View>
      ),
      [],
    );

    // Main loading state
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <ThemedText style={styles.loadingText}>Carregando histórico...</ThemedText>
        </View>
      );
    }

    return (
      <View style={styles.wrapper}>
        <Pressable style={StyleSheet.flatten([styles.container, { backgroundColor: colors.background, borderColor: colors.border }])} onPress={handleContainerPress}>
          {renderHeader()}
          <FlatList
            data={tasks}
            renderItem={renderRow}
            keyExtractor={(task) => task.id}
            refreshControl={onRefresh ? <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} tintColor={colors.primary} /> : undefined}
            onEndReached={onEndReached}
            onEndReachedThreshold={0.8}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            ListFooterComponent={renderFooter}
            ListEmptyComponent={renderEmpty}
            removeClippedSubviews={true}
            maxToRenderPerBatch={15}
            windowSize={11}
            initialNumToRender={15}
            updateCellsBatchingPeriod={100}
            style={styles.flatList}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ flexGrow: 1 }}
          />
        </Pressable>

        {/* Sector Selection Modal */}
        <TaskSectorModal
          visible={sectorModalVisible}
          onClose={handleSectorModalClose}
          onSelectSector={handleSectorSelect}
          currentSectorId={selectedTask?.sectorId}
          loading={modalLoading}
        />

        {/* Status Selection Modal */}
        <TaskStatusModal
          visible={statusModalVisible}
          onClose={handleStatusModalClose}
          onSelectStatus={handleStatusSelect}
          currentStatus={selectedTask?.status}
          loading={modalLoading}
        />
      </View>
    );
  },
);

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    paddingHorizontal: 8,
    paddingBottom: 16,
    backgroundColor: "transparent",
  },
  container: {
    flex: 1,
    backgroundColor: "white",
    borderRadius: 8,
    borderWidth: 1,
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
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 40,
  },
  headerCell: {
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.sm,
    minHeight: 40,
    justifyContent: "center",
  },
  headerText: {
    fontSize: 10,
    fontWeight: fontWeight.bold,
    textTransform: "uppercase",
    lineHeight: 12,
    color: "#000000",
  },
  headerCellContent: {
    display: "flex",
    alignItems: "flex-start",
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  flatList: {
    flex: 1,
  },
  row: {},
  rowContent: {
    flexDirection: "row",
    alignItems: "stretch",
    minHeight: 36,
  },
  cell: {
    paddingHorizontal: spacing.xs,
    paddingVertical: 6,
    justifyContent: "center",
    minHeight: 36,
  },
  centerAlign: {
    alignItems: "center",
  },
  rightAlign: {
    alignItems: "flex-end",
  },
  cellText: {
    fontSize: fontSize.xs,
  },
  mutedText: {
    fontSize: fontSize.xs,
    opacity: 0.5,
  },
  nameContainer: {
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
  nameText: {
    fontWeight: fontWeight.medium,
    fontSize: fontSize.xs,
  },
  paintSquare: {
    width: 24,
    height: 24,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.1)",
  },
  badgeText: {
    fontSize: fontSize.xs,
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
});

HistoryTable.displayName = "HistoryTable";
