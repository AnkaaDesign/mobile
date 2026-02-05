import React, { useCallback, useMemo, useRef } from "react";
import { FlatList, View, TouchableOpacity, Pressable, RefreshControl, ActivityIndicator, Dimensions, ScrollView, StyleSheet } from "react-native";
import { Icon } from "@/components/ui/icon";
import { IconSelector } from "@tabler/icons-react-native";
import type { Order } from '../../../../types';
import { ThemedText } from "@/components/ui/themed-text";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/lib/theme";
import { useSwipeRow } from "@/contexts/swipe-row-context";
import { spacing, fontSize, fontWeight } from "@/constants/design-system";
import { OrderTableRowSwipe } from "./order-table-row-swipe";
import { OrderStatusBadge } from "./order-status-badge";
import { formatCurrency, formatDate } from "@/utils";
import { extendedColors, badgeColors } from "@/lib/theme/extended-colors";

// Import default visible columns function
import { getDefaultVisibleColumns } from "./column-visibility-manager";
import type { SortConfig } from "@/lib/sort-utils";

export interface TableColumn {
  key: string;
  header: string;
  accessor: (order: Order) => React.ReactNode;
  width: number;
  align?: "left" | "center" | "right";
  sortable?: boolean;
}


interface OrderTableProps {
  orders: Order[];
  onOrderPress?: (orderId: string) => void;
  onOrderEdit?: (orderId: string) => void;
  onOrderDelete?: (orderId: string) => void;
  onOrderDuplicate?: (orderId: string) => void;
  onRefresh?: () => Promise<void>;
  onEndReached?: () => void;
  onEndReachedThreshold?: number;
  refreshing?: boolean;
  loading?: boolean;
  loadingMore?: boolean;
  showSelection?: boolean;
  selectedOrders?: Set<string>;
  onSelectionChange?: (selectedOrders: Set<string>) => void;
  sortConfigs?: SortConfig[];
  onSort?: (configs: SortConfig[]) => void;
  enableSwipeActions?: boolean;
  visibleColumnKeys?: string[];
  disableVirtualization?: boolean;
  ListFooterComponent?: React.ReactElement | null;
}

// Get screen width for responsive design
const { width: screenWidth } = Dimensions.get("window");
const availableWidth = screenWidth - 32; // Account for padding

// Format date as dd/mm/yy and time as hh:mm (two separate values)
function formatOrderDate(date: Date | string | null | undefined): { date: string; time: string } {
  if (!date) return { date: "-", time: "" };

  const d = typeof date === "string" ? new Date(date) : date;
  if (!d || !(d instanceof Date) || isNaN(d.getTime())) return { date: "-", time: "" };

  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = String(d.getFullYear()).slice(-2);
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");

  return { date: `${day}/${month}/${year}`, time: `${hours}:${minutes}` };
}

// Define all available columns with their renderers
export const createColumnDefinitions = (): TableColumn[] => [
  {
    key: "description",
    header: "DESCRIÇÃO",
    align: "left",
    sortable: true,
    width: 0,
    accessor: (order: Order) => (
      <ThemedText style={StyleSheet.flatten([styles.cellText, styles.nameText])} numberOfLines={2} ellipsizeMode="tail">
        {order.description || "Sem descrição"}
      </ThemedText>
    ),
  },
  {
    key: "supplier.fantasyName",
    header: "FORNECEDOR",
    align: "left",
    sortable: true,
    width: 0,
    accessor: (order: Order) => (
      <ThemedText style={styles.cellText} numberOfLines={1}>
        {order.supplier?.fantasyName || "-"}
      </ThemedText>
    ),
  },
  {
    key: "status",
    header: "STATUS",
    align: "left",
    sortable: true,
    width: 0,
    accessor: (order: Order) => (
      <OrderStatusBadge status={order.status} size="sm" />
    ),
  },
  {
    key: "itemsCount",
    header: "ITENS",
    align: "center",
    sortable: true,
    width: 0,
    accessor: (order: Order) => {
      const count = order._count?.items ?? order.items?.length ?? 0;
      return (
        <View style={styles.centerAlign}>
          <Badge
            variant="secondary"
            size="sm"
            style={{
              backgroundColor: badgeColors.muted.background,
              borderWidth: 0,
            }}
          >
            <ThemedText
              style={{
                color: badgeColors.muted.text,
                fontSize: fontSize.xs,
                fontWeight: fontWeight.medium,
              }}
            >
              {count}
            </ThemedText>
          </Badge>
        </View>
      );
    },
  },
  {
    key: "totalPrice",
    header: "VALOR TOTAL",
    align: "right",
    sortable: true,
    width: 0,
    accessor: (order: Order) => {
      const total = order.items?.reduce((sum, item) => {
        const quantity = item.orderedQuantity || 0;
        const price = item.price || 0;
        const icms = item.icms || 0;
        const ipi = item.ipi || 0;
        const subtotal = quantity * price;
        const itemTotal = subtotal + (subtotal * icms / 100) + (subtotal * ipi / 100);
        return sum + itemTotal;
      }, 0) || 0;
      return (
        <ThemedText style={StyleSheet.flatten([styles.cellText, styles.numberText])} numberOfLines={1}>
          {formatCurrency(total)}
        </ThemedText>
      );
    },
  },
  {
    key: "forecast",
    header: "PREVISÃO",
    align: "left",
    sortable: true,
    width: 0,
    accessor: (order: Order) => (
      <ThemedText style={StyleSheet.flatten([styles.cellText, { fontSize: fontSize.sm }])} numberOfLines={1}>
        {order.forecast ? formatDate(order.forecast) : "-"}
      </ThemedText>
    ),
  },
  {
    key: "createdAt",
    header: "CRIADO EM",
    align: "left",
    sortable: true,
    width: 0,
    accessor: (order: Order) => {
      const { date, time } = formatOrderDate(order.createdAt);
      return (
        <View style={styles.dateCell}>
          <ThemedText style={StyleSheet.flatten([styles.cellText, styles.monoText])} numberOfLines={1}>
            {date}
          </ThemedText>
          {time && (
            <ThemedText style={StyleSheet.flatten([styles.cellText, styles.monoText, styles.timeText])} numberOfLines={1}>
              {time}
            </ThemedText>
          )}
        </View>
      );
    },
  },
  {
    key: "updatedAt",
    header: "ATUALIZADO EM",
    align: "left",
    sortable: true,
    width: 0,
    accessor: (order: Order) => {
      const { date, time } = formatOrderDate(order.updatedAt);
      return (
        <View style={styles.dateCell}>
          <ThemedText style={StyleSheet.flatten([styles.cellText, styles.monoText])} numberOfLines={1}>
            {date}
          </ThemedText>
          {time && (
            <ThemedText style={StyleSheet.flatten([styles.cellText, styles.monoText, styles.timeText])} numberOfLines={1}>
              {time}
            </ThemedText>
          )}
        </View>
      );
    },
  },
];

export const OrderTable = React.memo<OrderTableProps>(
  ({
    orders,
    onOrderPress,
    onOrderEdit,
    onOrderDelete,
    onOrderDuplicate,
    onRefresh,
    onEndReached,
    onEndReachedThreshold = 0.2,
    refreshing = false,
    loading = false,
    loadingMore = false,
    showSelection = false,
    selectedOrders = new Set(),
    onSelectionChange,
    sortConfigs = [],
    onSort,
    enableSwipeActions = true,
    visibleColumnKeys,
    disableVirtualization = false,
    ListFooterComponent,
  }) => {
    const { colors, isDark } = useTheme();
    const { activeRowId, closeActiveRow } = useSwipeRow();
    // headerHeight removed as unused
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
        description: 1.5,
        "supplier.fantasyName": 2.0,
        status: 1.0,
        itemsCount: 0.8,
        totalPrice: 1.2,
        forecast: 1.2,
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
      let width = displayColumns.reduce((sum, col) => sum + col.width, 0);
      if (showSelection) width += 50; // Add checkbox column width
      return width;
    }, [displayColumns, showSelection]);

    // Selection handlers
    const handleSelectAll = useCallback(() => {
      if (!onSelectionChange) return;

      const allSelected = orders.every((order) => selectedOrders.has(order.id));
      if (allSelected) {
        onSelectionChange(new Set());
      } else {
        onSelectionChange(new Set(orders.map((order) => order.id)));
      }
    }, [orders, selectedOrders, onSelectionChange]);

    const handleSelectOrder = useCallback(
      (orderId: string) => {
        if (!onSelectionChange) return;

        const newSelection = new Set(selectedOrders);
        if (newSelection.has(orderId)) {
          newSelection.delete(orderId);
        } else {
          newSelection.add(orderId);
        }
        onSelectionChange(newSelection);
      },
      [selectedOrders, onSelectionChange],
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
    const renderColumnValue = useCallback((order: Order, column: TableColumn) => {
      return column.accessor(order);
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
                backgroundColor: colors.card,
                borderBottomColor: colors.border,
              },
            ])}
            contentContainerStyle={{ paddingHorizontal: 16 }}
          >
            <View style={StyleSheet.flatten([styles.headerRow, { width: tableWidth }])}>
              {showSelection && (
                <View style={StyleSheet.flatten([styles.headerCell, styles.checkboxCell])}>
                  <Checkbox checked={orders.length > 0 && orders.every((order) => selectedOrders.has(order.id))} onCheckedChange={handleSelectAll} disabled={orders.length === 0} />
                </View>
              )}
              {displayColumns.map((column) => {
                const sortConfig = sortConfigs?.find((config) => config.columnKey === column.key);

                return (
                  <TouchableOpacity
                    key={column.key}
                    style={StyleSheet.flatten([
                      styles.headerCell,
                      { width: column.width },
                      column.align === "center" && styles.centerAlign,
                      column.align === "right" && styles.rightAlign,
                    ])}
                    onPress={() => column.sortable && handleSort(column.key)}
                    disabled={!column.sortable}
                    activeOpacity={column.sortable ? 0.7 : 1}
                  >
                    <View style={[
                      styles.headerCellContent,
                      column.align === "center" && { justifyContent: "center" },
                      column.align === "right" && { justifyContent: "flex-end" },
                    ]}>
                      <View style={[
                        styles.headerTextContainer,
                        column.align === "center" && { flex: 0 },
                        column.align === "right" && { flex: 0 },
                      ]}>
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
      [colors, isDark, tableWidth, displayColumns, showSelection, selectedOrders, orders.length, sortConfigs, handleSelectAll, handleSort],
    );

    // Row component
    const renderRow = useCallback(
      ({ item, index }: { item: Order; index: number }) => {
        const isSelected = selectedOrders.has(item.id);
        const isEven = index % 2 === 0;

        if (enableSwipeActions && (onOrderEdit || onOrderDelete)) {
          return (
            <OrderTableRowSwipe key={item.id} orderId={item.id} orderName={item.description} onEdit={onOrderEdit} onDelete={onOrderDelete} onDuplicate={onOrderDuplicate} disabled={showSelection}>
              {() => (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  scrollEnabled={tableWidth > availableWidth}
                  style={StyleSheet.flatten([
                    styles.row,
                    {
                      backgroundColor: isEven ? colors.background : colors.card,
                      borderBottomColor: "rgba(0,0,0,0.05)",
                    },
                    isSelected && { backgroundColor: colors.primary + "20" },
                  ])}
                  contentContainerStyle={{ paddingHorizontal: 16 }}
                >
                  <Pressable
                    style={StyleSheet.flatten([styles.rowContent, { width: tableWidth }])}
                    onPress={() => onOrderPress?.(item.id)}
                    onLongPress={() => showSelection && handleSelectOrder(item.id)}
                    android_ripple={{ color: colors.primary + "20" }}
                  >
                    {showSelection && (
                      <View style={StyleSheet.flatten([styles.cell, styles.checkboxCell])}>
                        <Checkbox checked={isSelected} onCheckedChange={() => handleSelectOrder(item.id)} />
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
            </OrderTableRowSwipe>
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
                backgroundColor: isEven ? colors.background : colors.card,
                borderBottomColor: "rgba(0,0,0,0.05)",
              },
              isSelected && { backgroundColor: colors.primary + "20" },
            ])}
            contentContainerStyle={{ paddingHorizontal: 16 }}
          >
            <Pressable
              style={StyleSheet.flatten([styles.rowContent, { width: tableWidth }])}
              onPress={() => onOrderPress?.(item.id)}
              onLongPress={() => showSelection && handleSelectOrder(item.id)}
              android_ripple={{ color: colors.primary + "20" }}
            >
              {showSelection && (
                <View style={StyleSheet.flatten([styles.cell, styles.checkboxCell])}>
                  <Checkbox checked={isSelected} onCheckedChange={() => handleSelectOrder(item.id)} />
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
        selectedOrders,
        onOrderPress,
        handleSelectOrder,
        renderColumnValue,
        enableSwipeActions,
        onOrderEdit,
        onOrderDelete,
        onOrderDuplicate,
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
          <Icon name="package" size="xl" variant="muted" />
          <ThemedText style={styles.emptyTitle}>Nenhum pedido encontrado</ThemedText>
          <ThemedText style={styles.emptySubtitle}>Tente ajustar os filtros ou adicionar novos pedidos</ThemedText>
        </View>
      ),
      [colors.mutedForeground],
    );

    // Main loading state
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <ThemedText style={styles.loadingText}>Carregando pedidos...</ThemedText>
        </View>
      );
    }

    return (
      <View style={styles.wrapper}>
        <Pressable style={StyleSheet.flatten([styles.container, { backgroundColor: "transparent", borderColor: colors.border }])} onPress={handleContainerPress}>
          {renderHeader()}
          <FlatList
            ref={flatListRef}
            data={orders}
            renderItem={renderRow}
            keyExtractor={(order) => order.id}
            refreshControl={onRefresh ? <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} tintColor={colors.primary} /> : undefined}
            onEndReached={onEndReached}
            onEndReachedThreshold={onEndReachedThreshold}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            ListFooterComponent={ListFooterComponent ?? renderFooter()}
            ListEmptyComponent={renderEmpty}
            removeClippedSubviews={true}
            maxToRenderPerBatch={10}
            windowSize={5}
            initialNumToRender={15}
            updateCellsBatchingPeriod={50}
            getItemLayout={(_data, index) => ({
              length: 48, // Fixed row height (2 rows format)
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
    backgroundColor: "transparent",
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
    minHeight: 48,
  },
  cell: {
    paddingHorizontal: spacing.xs,
    paddingVertical: 6,
    justifyContent: "center",
    minHeight: 48,
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
  nameText: {
    fontWeight: fontWeight.medium,
    fontSize: fontSize.xs,
  },
  numberText: {
    fontWeight: fontWeight.normal,
    fontSize: fontSize.xs,
  },
  monoText: {
    fontFamily: "monospace",
    fontSize: fontSize.xs,
  },
  dateCell: {
    flexDirection: "column",
    alignItems: "flex-start",
    gap: 2,
  },
  timeText: {
    opacity: 0.7,
    fontSize: fontSize.xs - 1,
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

OrderTable.displayName = "OrderTable";
// Re-export SortConfig for consumer components
export type { SortConfig } from "@/lib/sort-utils";
