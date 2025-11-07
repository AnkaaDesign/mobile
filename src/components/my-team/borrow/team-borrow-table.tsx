import React, { useCallback, useMemo } from "react";
import { FlatList, View, TouchableOpacity, Pressable, RefreshControl, ActivityIndicator, Dimensions, ScrollView, StyleSheet, Image } from "react-native";
import { Icon } from "@/components/ui/icon";
import type { Borrow } from '../../../types';
import { ThemedText } from "@/components/ui/themed-text";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/lib/theme";
import { useSwipeRow } from "@/contexts/swipe-row-context";
import { spacing, fontSize, fontWeight } from "@/constants/design-system";
import { BORROW_STATUS, BORROW_STATUS_LABELS } from '../../../constants';
import { formatDate, formatDateTime } from '../../../utils';
import { extendedColors, badgeColors } from "@/lib/theme/extended-colors";
import { TeamBorrowTableRowSwipe } from "./team-borrow-table-row-swipe";

export interface TableColumn {
  key: string;
  header: string;
  accessor: (borrow: Borrow) => React.ReactNode;
  width: number;
  align?: "left" | "center" | "right";
  sortable?: boolean;
}

import type { SortConfig } from '@/lib/sort-utils';

interface TeamBorrowTableProps {
  borrows: Borrow[];
  onBorrowPress?: (borrowId: string) => void;
  onBorrowEdit?: (borrowId: string) => void;
  onBorrowDelete?: (borrowId: string) => void;
  onRefresh?: () => Promise<void>;
  onEndReached?: () => void;
  onPrefetch?: () => void;
  refreshing?: boolean;
  loading?: boolean;
  loadingMore?: boolean;
  showSelection?: boolean;
  selectedBorrows?: Set<string>;
  onSelectionChange?: (selectedBorrows: Set<string>) => void;
  sortConfigs?: SortConfig[];
  onSort?: (configs: SortConfig[]) => void;
  visibleColumnKeys?: string[];
  enableSwipeActions?: boolean;
}

// Get screen width for responsive design
const { width: screenWidth } = Dimensions.get("window");
const availableWidth = screenWidth - 32; // Account for padding

// Helper function to get status colors
const getStatusColor = (status: string) => {
  switch (status) {
    case BORROW_STATUS.ACTIVE:
      return { background: badgeColors.info.background, text: badgeColors.info.text };
    case BORROW_STATUS.RETURNED:
      return { background: badgeColors.success.background, text: badgeColors.success.text };
    case BORROW_STATUS.LOST:
      return { background: badgeColors.error.background, text: badgeColors.error.text };
    default:
      return { background: badgeColors.muted.background, text: badgeColors.muted.text };
  }
};

// Define all available columns with their renderers
export const createColumnDefinitions = (): TableColumn[] => [
  {
    key: "user",
    header: "Usuário",
    align: "left",
    sortable: true,
    width: 0,
    accessor: (borrow: Borrow) => (
      <View style={styles.nameContainer}>
        <View style={[styles.userAvatar, { backgroundColor: extendedColors.neutral[200] }]}>
          <ThemedText style={[styles.avatarText, { color: extendedColors.neutral[600] }]}>
            {borrow.user?.name?.charAt(0)?.toUpperCase() || "?"}
          </ThemedText>
        </View>
        <ThemedText style={styles.nameText} numberOfLines={1}>
          {borrow.user?.name || "Sem usuário"}
        </ThemedText>
      </View>
    ),
  },
  {
    key: "item",
    header: "Item",
    align: "left",
    sortable: true,
    width: 0,
    accessor: (borrow: Borrow) => (
      <View style={styles.itemContainer}>
        <ThemedText style={styles.cellText} numberOfLines={1}>
          {borrow.item?.name || "Item"}
        </ThemedText>
        {borrow.item?.category && (
          <ThemedText style={styles.mutedText} numberOfLines={1}>
            {borrow.item.category.name}
          </ThemedText>
        )}
      </View>
    ),
  },
  {
    key: "status",
    header: "Status",
    align: "left",
    sortable: true,
    width: 0,
    accessor: (borrow: Borrow) => {
      const statusLabel = BORROW_STATUS_LABELS[borrow.status as keyof typeof BORROW_STATUS_LABELS] || borrow.status;
      const statusColor = getStatusColor(borrow.status);

      return (
        <Badge
          variant="secondary"
          size="sm"
          style={{
            backgroundColor: statusColor.background,
            borderWidth: 0,
          }}
        >
          <ThemedText
            style={{
              color: statusColor.text,
              fontSize: fontSize.xs,
              fontWeight: fontWeight.medium,
            }}
          >
            {statusLabel}
          </ThemedText>
        </Badge>
      );
    },
  },
  {
    key: "quantity",
    header: "Quantidade",
    align: "center",
    sortable: true,
    width: 0,
    accessor: (borrow: Borrow) => (
      <View style={styles.centerAlign}>
        <ThemedText style={styles.cellText}>
          {borrow.quantity} {borrow.item?.measureUnit || 'un'}
        </ThemedText>
      </View>
    ),
  },
  {
    key: "borrowDate",
    header: "Data Empréstimo",
    align: "left",
    sortable: true,
    width: 0,
    accessor: (borrow: Borrow) => (
      <ThemedText style={styles.cellText} numberOfLines={1}>
        {borrow.createdAt ? formatDate(new Date(borrow.createdAt)) : "-"}
      </ThemedText>
    ),
  },
  {
    key: "returnDate",
    header: "Data Devolução",
    align: "left",
    sortable: true,
    width: 0,
    accessor: (borrow: Borrow) => (
      <ThemedText style={styles.cellText} numberOfLines={1}>
        {borrow.returnedAt ? formatDate(new Date(borrow.returnedAt)) : "-"}
      </ThemedText>
    ),
  },
  {
    key: "brand",
    header: "Marca",
    align: "left",
    sortable: false,
    width: 0,
    accessor: (borrow: Borrow) => (
      <ThemedText style={styles.cellText} numberOfLines={1}>
        {borrow.item?.brand?.name || "-"}
      </ThemedText>
    ),
  },
  {
    key: "supplier",
    header: "Fornecedor",
    align: "left",
    sortable: false,
    width: 0,
    accessor: (borrow: Borrow) => (
      <ThemedText style={styles.cellText} numberOfLines={1}>
        {borrow.item?.supplier?.name || "-"}
      </ThemedText>
    ),
  },
  {
    key: "position",
    header: "Cargo",
    align: "left",
    sortable: false,
    width: 0,
    accessor: (borrow: Borrow) => (
      <ThemedText style={styles.cellText} numberOfLines={1}>
        {borrow.user?.position?.name || "-"}
      </ThemedText>
    ),
  },
  {
    key: "sector",
    header: "Setor",
    align: "left",
    sortable: false,
    width: 0,
    accessor: (borrow: Borrow) => (
      <ThemedText style={styles.cellText} numberOfLines={1}>
        {borrow.user?.sector?.name || "-"}
      </ThemedText>
    ),
  },
  {
    key: "createdAt",
    header: "Criado Em",
    align: "left",
    sortable: true,
    width: 0,
    accessor: (borrow: Borrow) => (
      <ThemedText style={styles.cellText} numberOfLines={1}>
        {borrow.createdAt ? formatDateTime(new Date(borrow.createdAt)) : "-"}
      </ThemedText>
    ),
  },
];

export const TeamBorrowTable = React.memo<TeamBorrowTableProps>(
  ({
    borrows,
    onBorrowPress,
    onBorrowEdit,
    onBorrowDelete,
    onRefresh,
    onEndReached,
    onPrefetch,
    refreshing = false,
    loading = false,
    loadingMore = false,
    showSelection = false,
    selectedBorrows = new Set(),
    onSelectionChange,
    sortConfigs = [],
    onSort,
    visibleColumnKeys = ["user", "item", "status"],
    enableSwipeActions = true,
  }) => {
    const { colors, isDark } = useTheme();
    const { activeRowId, closeActiveRow } = useSwipeRow();
    const prefetchTriggeredRef = React.useRef(false);

    // Get all column definitions
    const allColumns = useMemo(() => createColumnDefinitions(), []);

    // Build visible columns with dynamic widths
    const displayColumns = useMemo(() => {
      // Define width ratios for each column type
      const columnWidthRatios: Record<string, number> = {
        user: 2.0,
        item: 2.5,
        status: 1.2,
        quantity: 1.3,
        borrowDate: 1.5,
        returnDate: 1.5,
        brand: 1.3,
        supplier: 1.5,
        position: 1.3,
        sector: 1.3,
        createdAt: 1.8,
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
      let width = displayColumns.reduce((sum, col) => sum + col.width, 0);
      if (showSelection) width += 50; // Add checkbox column width
      return width;
    }, [displayColumns, showSelection]);

    // Selection handlers
    const handleSelectAll = useCallback(() => {
      if (!onSelectionChange) return;

      const allSelected = borrows.every((borrow) => selectedBorrows.has(borrow.id));
      if (allSelected) {
        onSelectionChange(new Set());
      } else {
        onSelectionChange(new Set(borrows.map((borrow) => borrow.id)));
      }
    }, [borrows, selectedBorrows, onSelectionChange]);

    const handleSelectBorrow = useCallback(
      (borrowId: string) => {
        if (!onSelectionChange) return;

        const newSelection = new Set(selectedBorrows);
        if (newSelection.has(borrowId)) {
          newSelection.delete(borrowId);
        } else {
          newSelection.add(borrowId);
        }
        onSelectionChange(newSelection);
      },
      [selectedBorrows, onSelectionChange],
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
            onSort([{ columnKey, direction: "desc", order: 0 }]);
          } else {
            // Remove sort (back to default)
            onSort([]);
          }
        } else {
          // New column clicked, sort ascending
          onSort([{ columnKey, direction: "asc", order: 0 }]);
        }
      },
      [sortConfigs, onSort],
    );

    // Column renderer using accessor
    const renderColumnValue = useCallback((borrow: Borrow, column: TableColumn) => {
      return column.accessor(borrow);
    }, []);

    // Viewability callback for aggressive prefetching
    // Triggers prefetch when user scrolls to 70% of loaded items
    // Must be stable reference (can't change nullability)
    const handleViewableItemsChanged = React.useMemo(
      () => ({
        onViewableItemsChanged: ({ viewableItems }: any) => {
          if (!onPrefetch || prefetchTriggeredRef.current) return;

          const lastViewableIndex = viewableItems[viewableItems.length - 1]?.index;
          if (lastViewableIndex !== undefined && lastViewableIndex !== null) {
            const totalItems = borrows.length;
            const viewabilityThreshold = totalItems * 0.7;

            if (lastViewableIndex >= viewabilityThreshold) {
              prefetchTriggeredRef.current = true;
              onPrefetch();
            }
          }
        },
      }),
      [onPrefetch, borrows.length],
    );

    const viewabilityConfig = React.useMemo(
      () => ({
        itemVisiblePercentThreshold: 50,
        minimumViewTime: 100,
      }),
      [],
    );

    // Reset prefetch flag when data changes (new page loaded)
    React.useEffect(() => {
      prefetchTriggeredRef.current = false;
    }, [borrows.length]);

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
              {showSelection && (
                <View style={StyleSheet.flatten([styles.headerCell, styles.checkboxCell])}>
                  <Checkbox
                    checked={borrows.length > 0 && borrows.every((borrow) => selectedBorrows.has(borrow.id))}
                    onCheckedChange={handleSelectAll}
                    disabled={borrows.length === 0}
                  />
                </View>
              )}
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
      [colors, isDark, tableWidth, displayColumns, showSelection, selectedBorrows, borrows.length, sortConfigs, handleSelectAll, handleSort],
    );

    // Row component
    const renderRow = useCallback(
      ({ item, index }: { item: Borrow; index: number }) => {
        const isSelected = selectedBorrows.has(item.id);
        const isEven = index % 2 === 0;

        if (enableSwipeActions && (onBorrowEdit || onBorrowDelete)) {
          return (
            <TeamBorrowTableRowSwipe
              key={item.id}
              borrowId={item.id}
              borrowName={item.item?.name || "Item"}
              onEdit={onBorrowEdit}
              onDelete={onBorrowDelete}
              disabled={showSelection}
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
                    isSelected && { backgroundColor: colors.primary + "20" },
                  ])}
                  contentContainerStyle={{ paddingHorizontal: 16 }}
                >
                  <Pressable
                    style={StyleSheet.flatten([styles.rowContent, { width: tableWidth }])}
                    onPress={() => onBorrowPress?.(item.id)}
                    onLongPress={() => showSelection && handleSelectBorrow(item.id)}
                    android_ripple={{ color: colors.primary + "20" }}
                  >
                    {showSelection && (
                      <View style={StyleSheet.flatten([styles.cell, styles.checkboxCell])}>
                        <Checkbox checked={isSelected} onCheckedChange={() => handleSelectBorrow(item.id)} />
                      </View>
                    )}
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
            </TeamBorrowTableRowSwipe>
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
              isSelected && { backgroundColor: colors.primary + "20" },
            ])}
            contentContainerStyle={{ paddingHorizontal: 16 }}
          >
            <Pressable
              style={StyleSheet.flatten([styles.rowContent, { width: tableWidth }])}
              onPress={() => onBorrowPress?.(item.id)}
              onLongPress={() => showSelection && handleSelectBorrow(item.id)}
              android_ripple={{ color: colors.primary + "20" }}
            >
              {showSelection && (
                <View style={StyleSheet.flatten([styles.cell, styles.checkboxCell])}>
                  <Checkbox checked={isSelected} onCheckedChange={() => handleSelectBorrow(item.id)} />
                </View>
              )}
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
        showSelection,
        selectedBorrows,
        onBorrowPress,
        handleSelectBorrow,
        renderColumnValue,
        enableSwipeActions,
        onBorrowEdit,
        onBorrowDelete,
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
          <ThemedText style={styles.emptyTitle}>Nenhum empréstimo encontrado</ThemedText>
          <ThemedText style={styles.emptySubtitle}>Tente ajustar os filtros ou adicionar novos empréstimos</ThemedText>
        </View>
      ),
      [],
    );

    // Main loading state
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <ThemedText style={styles.loadingText}>Carregando empréstimos...</ThemedText>
        </View>
      );
    }

    return (
      <View style={styles.wrapper}>
        <Pressable style={StyleSheet.flatten([styles.container, { backgroundColor: colors.background, borderColor: colors.border }])} onPress={handleContainerPress}>
          {renderHeader()}
          <FlatList
            data={borrows}
            renderItem={renderRow}
            keyExtractor={(borrow) => borrow.id}
            refreshControl={onRefresh ? <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} tintColor={colors.primary} /> : undefined}
            onEndReached={onEndReached}
            onEndReachedThreshold={0.8}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            onViewableItemsChanged={handleViewableItemsChanged.onViewableItemsChanged}
            viewabilityConfig={viewabilityConfig}
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
  checkboxCell: {
    width: 50,
    justifyContent: "center",
    alignItems: "center",
  },
  flatList: {
    flex: 1,
  },
  row: {
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
  mutedText: {
    fontSize: fontSize.xs,
    opacity: 0.5,
  },
  nameContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  itemContainer: {
    flexDirection: "column",
    gap: 2,
  },
  userAvatar: {
    width: 32,
    height: 32,
    borderRadius: 6,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
  },
  nameText: {
    flex: 1,
    fontWeight: fontWeight.medium,
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

TeamBorrowTable.displayName = "TeamBorrowTable";
