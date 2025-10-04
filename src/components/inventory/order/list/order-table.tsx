import React, { useState, useCallback, useMemo, useRef } from "react";
import { FlatList, View, TouchableOpacity, Pressable, RefreshControl, ActivityIndicator, Dimensions, ScrollView , StyleSheet} from "react-native";
import { Icon } from "@/components/ui/icon";
import { IconButton } from "@/components/ui/icon-button";
import type { Order } from '../../../../types';
import { ThemedText } from "@/components/ui/themed-text";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/lib/theme";
import { useSwipeRow } from "@/contexts/swipe-row-context";
import { spacing, fontSize, fontWeight } from "@/constants/design-system";
import { OrderTableRowSwipe } from "./order-table-row-swipe";
import { OrderStatusBadge } from "./order-status-badge";
import { formatCurrency, formatDate } from '../../../../utils';
import { ORDER_STATUS, ORDER_STATUS_LABELS } from '../../../../constants';

export interface TableColumn {
  key: string;
  title: string;
  width: number;
  align?: "left" | "center" | "right";
  sortable?: boolean;
  render?: (order: Order) => React.ReactNode;
}

export interface SortConfig {
  columnKey: string;
  direction: "asc" | "desc";
}

interface OrderTableProps {
  orders: Order[];
  onOrderPress?: (orderId: string) => void;
  onOrderEdit?: (orderId: string) => void;
  onOrderDelete?: (orderId: string) => void;
  onOrderDuplicate?: (orderId: string) => void;
  onRefresh?: () => Promise<void>;
  onEndReached?: () => void;
  refreshing?: boolean;
  loading?: boolean;
  loadingMore?: boolean;
  showSelection?: boolean;
  selectedOrders?: Set<string>;
  onSelectionChange?: (selectedOrders: Set<string>) => void;
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
  description: {
    key: "description",
    title: "Descrição",
    align: "left",
    sortable: true,
  },
  supplier: {
    key: "supplier",
    title: "Fornecedor",
    align: "left",
    sortable: true,
  },
  status: {
    key: "status",
    title: "Status",
    align: "center",
    sortable: true,
  },
  itemsCount: {
    key: "itemsCount",
    title: "Itens",
    align: "center",
    sortable: true,
  },
  totalPrice: {
    key: "totalPrice",
    title: "Total",
    align: "right",
    sortable: true,
  },
  createdAt: {
    key: "createdAt",
    title: "Criado",
    align: "left",
    sortable: true,
  },
  expectedDelivery: {
    key: "expectedDelivery",
    title: "Entrega",
    align: "left",
    sortable: true,
  },
};

const DEFAULT_COLUMN_KEYS = ["description", "supplier", "status", "totalPrice"];

export const OrderTable = React.memo<OrderTableProps>(
  ({
    orders,
    onOrderPress,
    onOrderEdit,
    onOrderDelete,
    onOrderDuplicate,
    onRefresh,
    onEndReached,
    refreshing = false,
    loading = false,
    loadingMore = false,
    showSelection = false,
    selectedOrders = new Set(),
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
        description: 2.5, // Largest - description needs more space
        supplier: 2.0, // Large - supplier name
        status: 1.0, // Medium - status badge
        itemsCount: 0.8, // Small - count
        totalPrice: 1.2, // Medium - currency
        createdAt: 1.2, // Medium - date
        expectedDelivery: 1.2, // Medium - date
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

    const handleToggleAll = useCallback(() => {
      if (!onSelectionChange) return;
      if (selectedOrders.size === orders.length) {
        onSelectionChange(new Set());
      } else {
        onSelectionChange(new Set(orders.map(o => o.id)));
      }
    }, [orders, selectedOrders, onSelectionChange]);

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

    const renderColumnContent = useCallback(
      (column: TableColumn, order: Order) => {
        switch (column.key) {
          case "description":
            return (
              <ThemedText style={styles.cellText} numberOfLines={2} ellipsizeMode="tail">
                {order.description || "Sem descrição"}
              </ThemedText>
            );
          case "supplier":
            return (
              <ThemedText style={styles.cellText} numberOfLines={1} ellipsizeMode="tail">
                {order.supplier?.name || "-"}
              </ThemedText>
            );
          case "status":
            return <OrderStatusBadge status={order.status} />;
          case "itemsCount":
            return (
              <ThemedText style={StyleSheet.flatten([styles.cellText, styles.centerText])}>
                {order.items?.length || 0}
              </ThemedText>
            );
          case "totalPrice":
            return (
              <ThemedText style={StyleSheet.flatten([styles.cellText, styles.rightText])}>
                {formatCurrency(order.items?.reduce((sum, item) => sum + item.price, 0) || 0)}
              </ThemedText>
            );
          case "createdAt":
            return (
              <ThemedText style={styles.cellText}>
                {formatDate(order.createdAt)}
              </ThemedText>
            );
          case "expectedDelivery":
            return (
              <ThemedText style={styles.cellText}>
                {order.forecast ? formatDate(order.forecast) : "-"}
              </ThemedText>
            );
          default:
            if (column.render) {
              return column.render(order);
            }
            return <ThemedText style={styles.cellText}>-</ThemedText>;
        }
      },
      [],
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
                  <Checkbox checked={selectedOrders.size === orders.length && orders.length > 0} onCheckedChange={handleToggleAll} />
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
    }, [visibleColumns, showSelection, selectedOrders, orders, handleToggleAll, handleSort, getSortIndicator, colors]);

    const renderOrder = useCallback(
      ({ item: order }: { item: Order }) => {
        const isSelected = selectedOrders.has(order.id);

        const rowContent = (
          <Pressable
            onPress={() => onOrderPress?.(order.id)}
            style={({ pressed }) => [
              styles.row,
              { backgroundColor: colors.card },
              pressed && { opacity: 0.7 },
              isSelected && { backgroundColor: colors.accent },
            ]}
          >
            <ScrollView horizontal showsHorizontalScrollIndicator={false} bounces={false}>
              <View style={styles.rowContent}>
                {showSelection && (
                  <View style={StyleSheet.flatten([styles.checkboxColumn, { borderRightColor: colors.border }])}>
                    <Checkbox checked={isSelected} onCheckedChange={() => handleToggleSelection(order.id)} />
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
                    {renderColumnContent(column, order)}
                  </View>
                ))}
              </View>
            </ScrollView>
          </Pressable>
        );

        if (enableSwipeActions && !showSelection) {
          return (
            <OrderTableRowSwipe
              orderId={order.id}
              onEdit={() => onOrderEdit?.(order.id)}
              onDelete={() => onOrderDelete?.(order.id)}
              onDuplicate={() => onOrderDuplicate?.(order.id)}
            >
              {rowContent}
            </OrderTableRowSwipe>
          );
        }

        return rowContent;
      },
      [visibleColumns, showSelection, selectedOrders, handleToggleSelection, renderColumnContent, enableSwipeActions, onOrderPress, onOrderEdit, onOrderDelete, onOrderDuplicate, colors],
    );

    const renderEmpty = useCallback(() => {
      if (loading) return null;
      return (
        <View style={styles.emptyContainer}>
          <ThemedText style={styles.emptyText}>Nenhum pedido encontrado</ThemedText>
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
          data={orders}
          renderItem={renderOrder}
          keyExtractor={(order) => order.id}
          ListEmptyComponent={renderEmpty}
          ListFooterComponent={renderFooter}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} colors={[colors.primary]} />}
          onEndReached={onEndReached}
          onEndReachedThreshold={0.2}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          removeClippedSubviews={true}
          maxToRenderPerBatch={10}
          windowSize={5}
          initialNumToRender={15}
          updateCellsBatchingPeriod={50}
          getItemLayout={(data, index) => {
            // Calculate row height based on content
            const baseHeight = 60; // Base row height
            return {
              length: baseHeight,
              offset: baseHeight * index,
              index,
            };
          }}
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
  centerText: {
    textAlign: "center",
  },
  rightText: {
    textAlign: "right",
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