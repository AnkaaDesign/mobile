import React, { useCallback, useMemo, useRef } from "react";
import { FlatList, View, TouchableOpacity, Pressable, RefreshControl, ActivityIndicator, Dimensions, ScrollView, StyleSheet } from "react-native";
import { Icon } from "@/components/ui/icon";
import { IconSelector } from "@tabler/icons-react-native";
import type { ServiceOrder } from '../../../../types';
import { ThemedText } from "@/components/ui/themed-text";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/lib/theme";
import { useSwipeRow } from "@/contexts/swipe-row-context";
import { spacing, fontSize, fontWeight } from "@/constants/design-system";
import { ServiceOrderTableRowSwipe } from "./service-order-table-row-swipe";
import { formatDate, formatDateTime } from "@/utils";
import { SERVICE_ORDER_STATUS, SERVICE_ORDER_STATUS_LABELS } from "@/constants";
import { extendedColors, badgeColors } from "@/lib/theme/extended-colors";
import type { SortConfig } from "@/lib/sort-utils";

export interface TableColumn {
  key: string;
  header: string;
  accessor: (serviceOrder: ServiceOrder) => React.ReactNode;
  width: number;
  align?: "left" | "center" | "right";
  sortable?: boolean;
}


interface ServiceOrderTableProps {
  serviceOrders: ServiceOrder[];
  onServiceOrderPress?: (serviceOrderId: string) => void;
  onServiceOrderEdit?: (serviceOrderId: string) => void;
  onServiceOrderDelete?: (serviceOrderId: string) => void;
  onRefresh?: () => Promise<void>;
  onEndReached?: () => void;
  refreshing?: boolean;
  loading?: boolean;
  loadingMore?: boolean;
  showSelection?: boolean;
  selectedServiceOrders?: Set<string>;
  onSelectionChange?: (selectedServiceOrders: Set<string>) => void;
  sortConfigs?: SortConfig[];
  onSort?: (configs: SortConfig[]) => void;
  enableSwipeActions?: boolean;
  visibleColumnKeys?: string[];
}

// Get screen width for responsive design
const { width: screenWidth } = Dimensions.get("window");
const availableWidth = screenWidth - 32; // Account for padding

const getStatusBadgeVariant = (status: string) => {
  switch (status) {
    case SERVICE_ORDER_STATUS.PENDING:
      return { bg: badgeColors.warning.background, text: badgeColors.warning.text };
    case SERVICE_ORDER_STATUS.IN_PROGRESS:
      return { bg: badgeColors.info.background, text: badgeColors.info.text };
    case SERVICE_ORDER_STATUS.COMPLETED:
      return { bg: badgeColors.success.background, text: badgeColors.success.text };
    case SERVICE_ORDER_STATUS.CANCELLED:
      return { bg: badgeColors.muted.background, text: badgeColors.muted.text };
    default:
      return { bg: badgeColors.muted.background, text: badgeColors.muted.text };
  }
};

// Define all available columns with their renderers
export const createColumnDefinitions = (): TableColumn[] => [
  {
    key: "description",
    header: "DESCRIÇÃO",
    align: "left",
    sortable: true,
    width: 0,
    accessor: (serviceOrder: ServiceOrder) => (
      <ThemedText style={StyleSheet.flatten([styles.cellText, styles.nameText])} numberOfLines={2}>
        {serviceOrder.description}
      </ThemedText>
    ),
  },
  {
    key: "status",
    header: "STATUS",
    align: "center",
    sortable: true,
    width: 0,
    accessor: (serviceOrder: ServiceOrder) => {
      if (!serviceOrder.status) {
        return <ThemedText style={styles.cellText}>-</ThemedText>;
      }
      const colors = getStatusBadgeVariant(serviceOrder.status);
      return (
        <Badge
          variant="secondary"
          size="sm"
          style={{
            backgroundColor: colors.bg,
            borderWidth: 0,
          }}
        >
          <ThemedText
            style={{
              color: colors.text,
              fontSize: fontSize.xs,
              fontWeight: fontWeight.medium,
            }}
          >
            {SERVICE_ORDER_STATUS_LABELS[serviceOrder.status]}
          </ThemedText>
        </Badge>
      );
    },
  },
  {
    key: "task",
    header: "TAREFA",
    align: "left",
    sortable: false,
    width: 0,
    accessor: (serviceOrder: ServiceOrder) => {
      if (!serviceOrder.task) {
        return <ThemedText style={styles.cellText}>-</ThemedText>;
      }
      const taskName = serviceOrder.task.name || serviceOrder.task.details || `#${serviceOrder.task.id.slice(-8).toUpperCase()}`;
      const customerName = serviceOrder.task.customer
        ? serviceOrder.task.customer.fantasyName || serviceOrder.task.customer.corporateName
        : null;

      return (
        <View>
          <ThemedText style={styles.cellText} numberOfLines={1}>
            {taskName}
          </ThemedText>
          {customerName && (
            <ThemedText style={StyleSheet.flatten([styles.cellText, styles.secondaryText])} numberOfLines={1}>
              {customerName}
            </ThemedText>
          )}
        </View>
      );
    },
  },
  {
    key: "timing",
    header: "CRONOMETRIA",
    align: "left",
    sortable: false,
    width: 0,
    accessor: (serviceOrder: ServiceOrder) => (
      <View>
        {serviceOrder.startedAt && (
          <ThemedText style={styles.cellText} numberOfLines={1}>
            Início: {formatDateTime(serviceOrder.startedAt)}
          </ThemedText>
        )}
        {serviceOrder.finishedAt && (
          <ThemedText style={StyleSheet.flatten([styles.cellText, styles.secondaryText])} numberOfLines={1}>
            Fim: {formatDateTime(serviceOrder.finishedAt)}
          </ThemedText>
        )}
        {!serviceOrder.startedAt && !serviceOrder.finishedAt && (
          <ThemedText style={styles.cellText}>-</ThemedText>
        )}
      </View>
    ),
  },
  {
    key: "createdAt",
    header: "CRIADO EM",
    align: "left",
    sortable: true,
    width: 0,
    accessor: (serviceOrder: ServiceOrder) => (
      <ThemedText style={StyleSheet.flatten([styles.cellText, { fontSize: fontSize.sm }])} numberOfLines={1}>
        {formatDate(serviceOrder.createdAt)}
      </ThemedText>
    ),
  },
  {
    key: "updatedAt",
    header: "ATUALIZADO EM",
    align: "left",
    sortable: true,
    width: 0,
    accessor: (serviceOrder: ServiceOrder) => (
      <ThemedText style={StyleSheet.flatten([styles.cellText, { fontSize: fontSize.sm }])} numberOfLines={1}>
        {formatDate(serviceOrder.updatedAt)}
      </ThemedText>
    ),
  },
];

export const getDefaultVisibleColumns = (): Set<string> => {
  return new Set(["description", "status", "task"]);
};

export const ServiceOrderTable = React.memo<ServiceOrderTableProps>(
  ({
    serviceOrders,
    onServiceOrderPress,
    onServiceOrderEdit,
    onServiceOrderDelete,
    onRefresh,
    onEndReached,
    refreshing = false,
    loading = false,
    loadingMore = false,
    showSelection = false,
    selectedServiceOrders = new Set(),
    onSelectionChange,
    sortConfigs = [],
    onSort,
    enableSwipeActions = true,
    visibleColumnKeys,
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
        description: 3.0,
        status: 1.0,
        task: 2.5,
        timing: 2.0,
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

      const allSelected = serviceOrders.every((so) => selectedServiceOrders.has(so.id));
      if (allSelected) {
        onSelectionChange(new Set());
      } else {
        onSelectionChange(new Set(serviceOrders.map((so) => so.id)));
      }
    }, [serviceOrders, selectedServiceOrders, onSelectionChange]);

    const handleSelectServiceOrder = useCallback(
      (serviceOrderId: string) => {
        if (!onSelectionChange) return;

        const newSelection = new Set(selectedServiceOrders);
        if (newSelection.has(serviceOrderId)) {
          newSelection.delete(serviceOrderId);
        } else {
          newSelection.add(serviceOrderId);
        }
        onSelectionChange(newSelection);
      },
      [selectedServiceOrders, onSelectionChange],
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
    const renderColumnValue = useCallback((serviceOrder: ServiceOrder, column: TableColumn) => {
      return column.accessor(serviceOrder);
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
              {showSelection && (
                <View style={StyleSheet.flatten([styles.headerCell, styles.checkboxCell])}>
                  <Checkbox
                    checked={serviceOrders.length > 0 && serviceOrders.every((so) => selectedServiceOrders.has(so.id))}
                    onCheckedChange={handleSelectAll}
                    disabled={serviceOrders.length === 0}
                  />
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
      [colors, isDark, tableWidth, displayColumns, showSelection, selectedServiceOrders, serviceOrders.length, sortConfigs, handleSelectAll, handleSort],
    );

    // Row component
    const renderRow = useCallback(
      ({ item, index }: { item: ServiceOrder; index: number }) => {
        const isSelected = selectedServiceOrders.has(item.id);
        const isEven = index % 2 === 0;

        if (enableSwipeActions && (onServiceOrderEdit || onServiceOrderDelete)) {
          return (
            <ServiceOrderTableRowSwipe
              key={item.id}
              serviceOrderId={item.id}
              serviceOrderDescription={item.description}
              onEdit={onServiceOrderEdit}
              onDelete={onServiceOrderDelete}
              disabled={showSelection}
            >
              {() => (
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
                    onPress={() => onServiceOrderPress?.(item.id)}
                    onLongPress={() => showSelection && handleSelectServiceOrder(item.id)}
                    android_ripple={{ color: colors.primary + "20" }}
                  >
                    {showSelection && (
                      <View style={StyleSheet.flatten([styles.cell, styles.checkboxCell])}>
                        <Checkbox checked={isSelected} onCheckedChange={() => handleSelectServiceOrder(item.id)} />
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
            </ServiceOrderTableRowSwipe>
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
              onPress={() => onServiceOrderPress?.(item.id)}
              onLongPress={() => showSelection && handleSelectServiceOrder(item.id)}
              android_ripple={{ color: colors.primary + "20" }}
            >
              {showSelection && (
                <View style={StyleSheet.flatten([styles.cell, styles.checkboxCell])}>
                  <Checkbox checked={isSelected} onCheckedChange={() => handleSelectServiceOrder(item.id)} />
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
        selectedServiceOrders,
        onServiceOrderPress,
        handleSelectServiceOrder,
        renderColumnValue,
        enableSwipeActions,
        onServiceOrderEdit,
        onServiceOrderDelete,
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
          <ThemedText style={styles.emptyTitle}>Nenhuma ordem de serviço encontrada</ThemedText>
          <ThemedText style={styles.emptySubtitle}>Tente ajustar os filtros ou adicionar novas ordens de serviço</ThemedText>
        </View>
      ),
      [colors.mutedForeground],
    );

    // Main loading state
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <ThemedText style={styles.loadingText}>Carregando ordens de serviço...</ThemedText>
        </View>
      );
    }

    return (
      <View style={styles.wrapper}>
        <Pressable style={StyleSheet.flatten([styles.container, { backgroundColor: colors.background }])} onPress={handleContainerPress}>
          {renderHeader()}
          <FlatList
            ref={flatListRef}
            data={serviceOrders}
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
            getItemLayout={(_data, index) => ({
              length: 36, // Fixed row height
              offset: 36 * index,
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
  sortIconContainer: {
    flexDirection: "row",
    alignItems: "center",
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
  },
  nameText: {
    fontWeight: fontWeight.medium,
    fontSize: fontSize.xs, // Match serial number size
  },
  secondaryText: {
    opacity: 0.6,
    marginTop: 2,
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

ServiceOrderTable.displayName = "ServiceOrderTable";
