import React, { useCallback, useMemo, useRef } from "react";
import { FlatList, View, TouchableOpacity, Pressable, RefreshControl, ActivityIndicator, Dimensions, ScrollView, StyleSheet } from "react-native";
import { Icon } from "@/components/ui/icon";
import { IconSelector } from "@tabler/icons-react-native";
import type { Cut } from '../../../../types';
import { ThemedText } from "@/components/ui/themed-text";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/lib/theme";
import { useSwipeRow } from "@/contexts/swipe-row-context";
import { spacing, fontSize, fontWeight } from "@/constants/design-system";
import { CuttingPlanTableRowSwipe } from "./cutting-plan-table-row-swipe";
import { getBadgeVariant } from "../../../../constants/badge-colors";
import { CUT_STATUS_LABELS, CUT_TYPE_LABELS, CUT_ORIGIN_LABELS } from "../../../../constants";
import { extendedColors } from "@/lib/theme/extended-colors";
import { CUT_STATUS } from '../../../../constants';
import type { SortConfig } from "@/lib/sort-utils";

export interface TableColumn {
  key: string;
  header: string;
  accessor: (cut: Cut) => React.ReactNode;
  width: number;
  align?: "left" | "center" | "right";
  sortable?: boolean;
}

// Export for backward compatibility with existing code
export interface ColumnDefinition {
  key: string;
  label: string;
  sortable?: boolean;
  width?: number;
}

interface CuttingPlanTableProps {
  cuts: Cut[];
  onCutPress?: (cutId: string) => void;
  onCutEdit?: (cutId: string) => void;
  onCutDelete?: (cutId: string) => void;
  onCutStatusChange?: (cutId: string, status: CUT_STATUS) => void;
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

// Format date helper
const formatDate = (date: Date | string | null) => {
  if (!date) return "-";
  const d = new Date(date);
  return d.toLocaleDateString("pt-BR");
};

// Format datetime helper
const formatDateTime = (date: Date | string | null) => {
  if (!date) return "-";
  const d = new Date(date);
  return `${d.toLocaleDateString("pt-BR")} ${d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`;
};

// Define all available columns with their renderers (for backward compatibility)
export const createColumnDefinitions = (): ColumnDefinition[] => [
  { key: "status", label: "Status", sortable: true },
  { key: "type", label: "Tipo", sortable: true },
  { key: "task", label: "Tarefa", sortable: false },
  { key: "customer", label: "Cliente", sortable: false },
  { key: "origin", label: "Origem", sortable: true },
  { key: "startedAt", label: "Início", sortable: true },
  { key: "completedAt", label: "Conclusão", sortable: true },
  { key: "createdAt", label: "Criado em", sortable: true },
  { key: "updatedAt", label: "Atualizado em", sortable: true },
];

// Internal function for full table columns with renderers
const createTableColumns = (): TableColumn[] => [
  {
    key: "status",
    header: "STATUS",
    align: "center",
    sortable: true,
    width: 0,
    accessor: (cut: Cut) => (
      <View style={styles.centerAlign}>
        <Badge variant={getBadgeVariant(cut.status, "CUT")} size="sm">
          <ThemedText style={styles.badgeText}>
            {CUT_STATUS_LABELS[cut.status]}
          </ThemedText>
        </Badge>
      </View>
    ),
  },
  {
    key: "type",
    header: "TIPO",
    align: "left",
    sortable: true,
    width: 0,
    accessor: (cut: Cut) => (
      <ThemedText style={styles.cellText} numberOfLines={1}>
        {CUT_TYPE_LABELS[cut.type]}
      </ThemedText>
    ),
  },
  {
    key: "task",
    header: "TAREFA",
    align: "left",
    sortable: false,
    width: 0,
    accessor: (cut: Cut) => (
      <ThemedText style={styles.cellText} numberOfLines={1}>
        {cut.task?.name || "-"}
      </ThemedText>
    ),
  },
  {
    key: "customer",
    header: "CLIENTE",
    align: "left",
    sortable: false,
    width: 0,
    accessor: (cut: Cut) => (
      <ThemedText style={styles.cellText} numberOfLines={1}>
        {cut.task?.customer?.fantasyName || "-"}
      </ThemedText>
    ),
  },
  {
    key: "origin",
    header: "ORIGEM",
    align: "left",
    sortable: true,
    width: 0,
    accessor: (cut: Cut) => (
      <ThemedText style={styles.cellText} numberOfLines={1}>
        {CUT_ORIGIN_LABELS[cut.origin]}
      </ThemedText>
    ),
  },
  {
    key: "startedAt",
    header: "INÍCIO",
    align: "left",
    sortable: true,
    width: 0,
    accessor: (cut: Cut) => (
      <ThemedText style={styles.cellText} numberOfLines={1}>
        {formatDateTime(cut.startedAt)}
      </ThemedText>
    ),
  },
  {
    key: "completedAt",
    header: "CONCLUSÃO",
    align: "left",
    sortable: true,
    width: 0,
    accessor: (cut: Cut) => (
      <ThemedText style={styles.cellText} numberOfLines={1}>
        {formatDateTime(cut.completedAt)}
      </ThemedText>
    ),
  },
  {
    key: "createdAt",
    header: "CRIADO EM",
    align: "left",
    sortable: true,
    width: 0,
    accessor: (cut: Cut) => (
      <ThemedText style={StyleSheet.flatten([styles.cellText, { fontSize: fontSize.sm }])} numberOfLines={1}>
        {formatDate(cut.createdAt)}
      </ThemedText>
    ),
  },
  {
    key: "updatedAt",
    header: "ATUALIZADO EM",
    align: "left",
    sortable: true,
    width: 0,
    accessor: (cut: Cut) => (
      <ThemedText style={StyleSheet.flatten([styles.cellText, { fontSize: fontSize.sm }])} numberOfLines={1}>
        {formatDate(cut.updatedAt)}
      </ThemedText>
    ),
  },
];

// Default visible columns
const getDefaultVisibleColumns = (): Set<string> => {
  return new Set(["status", "type", "task", "customer", "origin", "startedAt"]);
};

export const CuttingPlanTable = React.memo<CuttingPlanTableProps>(
  ({
    cuts,
    onCutPress,
    onCutEdit,
    onCutDelete,
    onCutStatusChange,
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
    const flatListRef = useRef<FlatList>(null);

    // Column visibility - use prop if provided, otherwise use default
    const visibleColumns = useMemo(() => {
      if (visibleColumnKeys && visibleColumnKeys.length > 0) {
        return new Set(visibleColumnKeys);
      }
      return getDefaultVisibleColumns();
    }, [visibleColumnKeys]);

    // Get all column definitions
    const allColumns = useMemo(() => createTableColumns(), []);

    // Build visible columns with dynamic widths
    const displayColumns = useMemo(() => {
      // Define width ratios for each column type
      const columnWidthRatios: Record<string, number> = {
        status: 1.2,
        type: 1.2,
        task: 2.5,
        customer: 2.0,
        origin: 1.2,
        startedAt: 1.5,
        completedAt: 1.5,
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
    const renderColumnValue = useCallback((cut: Cut, column: TableColumn) => {
      return column.accessor(cut);
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
      ({ item }: { item: Cut; index: number }) => {
        // Default row color
        const rowColor = colors.card;

        if (enableSwipeActions && (onCutEdit || onCutDelete || onCutStatusChange)) {
          return (
            <CuttingPlanTableRowSwipe
              key={item.id}
              cutId={item.id}
              cutStatus={item.status}
              onEdit={onCutEdit}
              onDelete={onCutDelete}
              onStatusChange={onCutStatusChange}
              disabled={false}
            >
              {() => (
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
                    onPress={() => onCutPress?.(item.id)}
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
            </CuttingPlanTableRowSwipe>
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
              onPress={() => onCutPress?.(item.id)}
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
        onCutPress,
        renderColumnValue,
        enableSwipeActions,
        onCutEdit,
        onCutDelete,
        onCutStatusChange,
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
          <Icon name="scissors" size="xl" variant="muted" />
          <ThemedText style={styles.emptyTitle}>Nenhum corte encontrado</ThemedText>
          <ThemedText style={styles.emptySubtitle}>Tente ajustar os filtros ou adicionar novos cortes</ThemedText>
        </View>
      ),
      [colors.mutedForeground],
    );

    // Main loading state
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <ThemedText style={styles.loadingText}>Carregando cortes...</ThemedText>
        </View>
      );
    }

    return (
      <View style={styles.wrapper}>
        <Pressable style={StyleSheet.flatten([styles.container, { backgroundColor: colors.background, borderColor: colors.border }])} onPress={handleContainerPress}>
          {renderHeader()}
          <FlatList
            ref={flatListRef}
            data={cuts}
            renderItem={renderRow}
            keyExtractor={(cut) => cut.id}
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
            getItemLayout={(_data, index) => ({
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
    borderBottomWidth: 2,
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
    gap: 4,
  },
  headerTextContainer: {
    flex: 1,
    minWidth: 0,
  },
  sortIconWrapper: {
    flexShrink: 0,
    justifyContent: "center",
    alignItems: "center",
    width: 16,
  },
  sortIconContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  flatList: {
    flex: 1,
  },
  row: {
    borderBottomWidth: 1,
    borderBottomColor: "#e5e5e5",
  },
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

CuttingPlanTable.displayName = "CuttingPlanTable";
