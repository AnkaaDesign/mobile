import React, { useState, useCallback, useMemo, useRef } from "react";
import { FlatList, View, TouchableOpacity, Pressable, RefreshControl, ActivityIndicator, Dimensions, ScrollView, StyleSheet } from "react-native";
import { Icon } from "@/components/ui/icon";
import { IconSelector, IconArrowUp, IconArrowDown } from "@tabler/icons-react-native";
import type { Activity } from '../../../../types';
import { ThemedText } from "@/components/ui/themed-text";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/lib/theme";
import { useSwipeRow } from "@/contexts/swipe-row-context";
import { spacing, fontSize, fontWeight } from "@/constants/design-system";
import { ActivityTableRowSwipe } from "./activity-table-row-swipe";
import { getDefaultVisibleColumns } from "./column-visibility-manager";
import { ACTIVITY_OPERATION, ACTIVITY_OPERATION_LABELS, ACTIVITY_REASON_LABELS } from '../../../../constants';
import { extendedColors, badgeColors } from "@/lib/theme/extended-colors";
import type { SortConfig } from "@/lib/sort-utils";

export interface TableColumn {
  key: string;
  header: string;
  accessor: (activity: Activity) => React.ReactNode;
  width: number;
  align?: "left" | "center" | "right";
  sortable?: boolean;
}


interface ActivityTableProps {
  activities: Activity[];
  onActivityPress?: (activityId: string) => void;
  onActivityEdit?: (activityId: string) => void;
  onActivityDelete?: (activityId: string) => void;
  onRefresh?: () => Promise<void>;
  onEndReached?: () => void;
  refreshing?: boolean;
  loading?: boolean;
  loadingMore?: boolean;
  showSelection?: boolean;
  selectedActivities?: Set<string>;
  onSelectionChange?: (selectedActivities: Set<string>) => void;
  sortConfigs?: SortConfig[];
  onSort?: (configs: SortConfig[]) => void;
  enableSwipeActions?: boolean;
  visibleColumnKeys?: string[];
}

// Get screen width for responsive design
const { width: screenWidth } = Dimensions.get("window");
const availableWidth = screenWidth - 32; // Account for padding

// Format date as hh:mm - dd/mm/yy (matching web version)
function formatActivityDate(date: Date | string | null | undefined): string {
  if (!date) return "-";

  const d = typeof date === "string" ? new Date(date) : date;
  if (!d || !(d instanceof Date) || isNaN(d.getTime())) return "-";

  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = String(d.getFullYear()).slice(-2);

  return `${hours}:${minutes} - ${day}/${month}/${year}`;
}

// Format quantity with 2 decimals only if needed
function formatQuantity(value: number): string {
  if (value % 1 === 0) {
    return value.toLocaleString("pt-BR");
  }
  return value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// Define all available columns with their renderers
export const createColumnDefinitions = (): TableColumn[] => [
  {
    key: "operation",
    header: "OPERAÇÃO",
    align: "center",
    sortable: true,
    width: 0,
    accessor: (activity: Activity) => (
      <View style={styles.centerAlign}>
        <View
          style={[
            styles.operationBadge,
            {
              backgroundColor:
                activity.operation === ACTIVITY_OPERATION.INBOUND
                  ? badgeColors.success.background
                  : badgeColors.error.background,
            },
          ]}
        >
          {activity.operation === ACTIVITY_OPERATION.INBOUND ? (
            <IconArrowUp size={16} color={badgeColors.success.text} />
          ) : (
            <IconArrowDown size={16} color={badgeColors.error.text} />
          )}
          <ThemedText
            style={{
              color:
                activity.operation === ACTIVITY_OPERATION.INBOUND
                  ? badgeColors.success.text
                  : badgeColors.error.text,
              fontSize: fontSize.xs,
              fontWeight: fontWeight.medium,
            }}
          >
            {ACTIVITY_OPERATION_LABELS[activity.operation] || activity.operation}
          </ThemedText>
        </View>
      </View>
    ),
  },
  {
    key: "item.uniCode",
    header: "CÓDIGO",
    align: "left",
    sortable: true,
    width: 0,
    accessor: (activity: Activity) => (
      <ThemedText style={styles.cellText} numberOfLines={1}>
        {activity.item?.uniCode || "-"}
      </ThemedText>
    ),
  },
  {
    key: "item.name",
    header: "PRODUTO",
    align: "left",
    sortable: true,
    width: 0,
    accessor: (activity: Activity) => (
      <ThemedText style={StyleSheet.flatten([styles.cellText, styles.nameText])} numberOfLines={1} ellipsizeMode="tail">
        {activity.item?.name || "Item não encontrado"}
      </ThemedText>
    ),
  },
  {
    key: "quantity",
    header: "QUANTIDADE",
    align: "right",
    sortable: true,
    width: 0,
    accessor: (activity: Activity) => (
      <ThemedText
        style={StyleSheet.flatten([
          styles.cellText,
          styles.quantityText,
          {
            color:
              activity.operation === ACTIVITY_OPERATION.INBOUND
                ? badgeColors.success.text
                : badgeColors.error.text,
          },
        ])}
        numberOfLines={1}
      >
        {activity.operation === ACTIVITY_OPERATION.INBOUND ? "+" : "-"}
        {formatQuantity(Math.abs(activity.quantity))}
      </ThemedText>
    ),
  },
  {
    key: "reason",
    header: "MOTIVO",
    align: "left",
    sortable: true,
    width: 0,
    accessor: (activity: Activity) => (
      <View style={styles.centerAlign}>
        {activity.reason ? (
          <Badge variant="outline" size="sm">
            <ThemedText style={{ fontSize: fontSize.xs }}>
              {ACTIVITY_REASON_LABELS[activity.reason] || activity.reason}
            </ThemedText>
          </Badge>
        ) : (
          <ThemedText style={styles.cellText} numberOfLines={1}>
            -
          </ThemedText>
        )}
      </View>
    ),
  },
  {
    key: "user.name",
    header: "USUÁRIO",
    align: "left",
    sortable: true,
    width: 0,
    accessor: (activity: Activity) => (
      <ThemedText style={styles.cellText} numberOfLines={1} ellipsizeMode="tail">
        {activity.user?.name || "-"}
      </ThemedText>
    ),
  },
  {
    key: "order.id",
    header: "PEDIDO",
    align: "left",
    sortable: false,
    width: 0,
    accessor: (activity: Activity) => (
      <ThemedText style={StyleSheet.flatten([styles.cellText, styles.monoText])} numberOfLines={1}>
        {activity.orderId ? `#${activity.orderId.slice(-8)}` : "-"}
      </ThemedText>
    ),
  },
  {
    key: "createdAt",
    header: "DATA/HORA",
    align: "left",
    sortable: true,
    width: 0,
    accessor: (activity: Activity) => (
      <ThemedText style={StyleSheet.flatten([styles.cellText, styles.monoText])} numberOfLines={1}>
        {formatActivityDate(activity.createdAt)}
      </ThemedText>
    ),
  },
];

export const ActivityTable = React.memo<ActivityTableProps>(
  ({
    activities,
    onActivityPress,
    onActivityEdit,
    onActivityDelete,
    onRefresh,
    onEndReached,
    refreshing = false,
    loading = false,
    loadingMore = false,
    showSelection = false,
    selectedActivities = new Set(),
    onSelectionChange,
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
        operation: 1.2,
        "item.uniCode": 1.0,
        "item.name": 1.8,
        quantity: 1.0,
        reason: 1.5,
        "user.name": 1.1,
        "order.id": 1.0,
        createdAt: 1.5,
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
      let width = displayColumns.reduce((sum, col) => sum + col.width, 0);
      if (showSelection) width += 50; // Add checkbox column width
      return width;
    }, [displayColumns, showSelection]);

    // Selection handlers
    const handleSelectAll = useCallback(() => {
      if (!onSelectionChange) return;

      const allSelected = activities.every((activity) => selectedActivities.has(activity.id));
      if (allSelected) {
        onSelectionChange(new Set());
      } else {
        onSelectionChange(new Set(activities.map((activity) => activity.id)));
      }
    }, [activities, selectedActivities, onSelectionChange]);

    const handleSelectActivity = useCallback(
      (activityId: string) => {
        if (!onSelectionChange) return;

        const newSelection = new Set(selectedActivities);
        if (newSelection.has(activityId)) {
          newSelection.delete(activityId);
        } else {
          newSelection.add(activityId);
        }
        onSelectionChange(newSelection);
      },
      [selectedActivities, onSelectionChange],
    );

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
    const renderColumnValue = useCallback((activity: Activity, column: TableColumn) => {
      return column.accessor(activity);
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
              {showSelection && (
                <View style={StyleSheet.flatten([styles.headerCell, styles.checkboxCell])}>
                  <Checkbox checked={activities.length > 0 && activities.every((activity) => selectedActivities.has(activity.id))} onCheckedChange={handleSelectAll} disabled={activities.length === 0} />
                </View>
              )}
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
      [colors, isDark, tableWidth, displayColumns, showSelection, selectedActivities, activities.length, sortConfigs, handleSelectAll, handleSort],
    );

    // Row component
    const renderRow = useCallback(
      ({ item, index }: { item: Activity; index: number }) => {
        const isSelected = selectedActivities.has(item.id);
        const isEven = index % 2 === 0;

        if (enableSwipeActions && onActivityDelete) {
          return (
            <ActivityTableRowSwipe
              key={item.id}
              activityId={item.id}
              activityDescription={`${item.item?.name || "Item"} - ${item.quantity} un`}
              onDelete={onActivityDelete}
              disabled={showSelection}
            >
              {(isActive) => (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  scrollEnabled={tableWidth > availableWidth}
                  style={StyleSheet.flatten([
                    styles.row,
                    {
                      backgroundColor: isEven ? colors.background : isDark ? extendedColors.neutral[900] : extendedColors.neutral[50],
                      borderBottomColor: isDark ? extendedColors.neutral[700] : extendedColors.neutral[200],
                    },
                    isSelected && { backgroundColor: colors.primary + "20" },
                  ])}
                  contentContainerStyle={{ paddingHorizontal: 16 }}
                >
                  <Pressable
                    style={StyleSheet.flatten([styles.rowContent, { width: tableWidth }])}
                    onPress={() => onActivityPress?.(item.id)}
                    onLongPress={() => showSelection && handleSelectActivity(item.id)}
                    android_ripple={{ color: colors.primary + "20" }}
                  >
                    {showSelection && (
                      <View style={StyleSheet.flatten([styles.cell, styles.checkboxCell])}>
                        <Checkbox checked={isSelected} onCheckedChange={() => handleSelectActivity(item.id)} />
                      </View>
                    )}
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
            </ActivityTableRowSwipe>
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
                borderBottomColor: isDark ? extendedColors.neutral[700] : extendedColors.neutral[200],
              },
              isSelected && { backgroundColor: colors.primary + "20" },
            ])}
            contentContainerStyle={{ paddingHorizontal: 16 }}
          >
            <Pressable
              style={StyleSheet.flatten([styles.rowContent, { width: tableWidth }])}
              onPress={() => onActivityPress?.(item.id)}
              onLongPress={() => showSelection && handleSelectActivity(item.id)}
              android_ripple={{ color: colors.primary + "20" }}
            >
              {showSelection && (
                <View style={StyleSheet.flatten([styles.cell, styles.checkboxCell])}>
                  <Checkbox checked={isSelected} onCheckedChange={() => handleSelectActivity(item.id)} />
                </View>
              )}
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
        showSelection,
        selectedActivities,
        onActivityPress,
        handleSelectActivity,
        renderColumnValue,
        enableSwipeActions,
        onActivityDelete,
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
          <Icon name="box" size="xl" variant="muted" />
          <ThemedText style={styles.emptyTitle}>Nenhuma movimentação encontrada</ThemedText>
          <ThemedText style={styles.emptySubtitle}>Tente ajustar os filtros ou adicionar novas movimentações</ThemedText>
        </View>
      ),
      [colors.mutedForeground],
    );

    // Main loading state
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <ThemedText style={styles.loadingText}>Carregando movimentações...</ThemedText>
        </View>
      );
    }

    return (
      <View style={styles.wrapper}>
        <Pressable style={StyleSheet.flatten([styles.container, { backgroundColor: colors.background }])} onPress={handleContainerPress}>
          {renderHeader()}
          <FlatList
            ref={flatListRef}
            data={activities}
            renderItem={renderRow}
            keyExtractor={(item) => item.id}
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
              length: 60, // Fixed row height
              offset: 60 * index,
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
  monoText: {
    fontFamily: "monospace",
    fontSize: fontSize.xs,
  },
  nameText: {
    fontWeight: fontWeight.medium,
    fontSize: fontSize.xs,
  },
  quantityText: {
    fontWeight: fontWeight.bold,
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
  operationBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
});

ActivityTable.displayName = "ActivityTable";
