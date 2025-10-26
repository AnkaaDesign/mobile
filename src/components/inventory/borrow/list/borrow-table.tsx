import React, { useState, useCallback, useMemo, useRef } from "react";
import { FlatList, View, TouchableOpacity, Pressable, RefreshControl, ActivityIndicator, Dimensions, ScrollView, StyleSheet } from "react-native";
import { Icon } from "@/components/ui/icon";
import { IconSelector } from "@tabler/icons-react-native";
import type { Borrow } from '../../../../types';
import { ThemedText } from "@/components/ui/themed-text";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/lib/theme";
import { useSwipeRow } from "@/contexts/swipe-row-context";
import { spacing, fontSize, fontWeight } from "@/constants/design-system";
import { BorrowTableRowSwipe } from "./borrow-table-row-swipe";
import { getDefaultVisibleColumns } from "./borrow-column-visibility-manager";
import { BORROW_STATUS, BORROW_STATUS_LABELS } from '../../../../constants';
import { formatDate, formatRelativeTime } from '../../../../utils';
import { extendedColors, badgeColors } from "@/lib/theme/extended-colors";

export interface TableColumn {
  key: string;
  header: string;
  accessor: (borrow: Borrow) => React.ReactNode;
  width: number;
  align?: "left" | "center" | "right";
  sortable?: boolean;
}

export interface SortConfig {
  columnKey: string;
  direction: "asc" | "desc";
}

interface BorrowTableProps {
  borrows: Borrow[];
  onBorrowPress?: (borrowId: string) => void;
  onBorrowEdit?: (borrowId: string) => void;
  onBorrowDelete?: (borrowId: string) => void;
  onReturn?: (borrowId: string) => void;
  onMarkAsLost?: (borrowId: string) => void;
  onRefresh?: () => Promise<void>;
  onEndReached?: () => void;
  refreshing?: boolean;
  loading?: boolean;
  loadingMore?: boolean;
  showSelection?: boolean;
  selectedBorrows?: Set<string>;
  onSelectionChange?: (selectedBorrows: Set<string>) => void;
  sortConfigs?: SortConfig[];
  onSort?: (configs: SortConfig[]) => void;
  enableSwipeActions?: boolean;
  visibleColumnKeys?: string[];
}

// Get screen width for responsive design
const { width: screenWidth } = Dimensions.get("window");
const availableWidth = screenWidth - 32; // Account for padding

// Helper function to format date with relative time
const formatDateWithRelative = (date: Date | string) => {
  const dateObj = typeof date === "string" ? new Date(date) : date;

  // If less than 24 hours ago, show relative time
  const now = new Date();
  const diffMs = now.getTime() - dateObj.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);

  if (diffHours < 24 && diffHours >= 0) {
    return formatRelativeTime(dateObj);
  }

  // Otherwise show date
  return formatDate(dateObj);
};

// Get status color (matches web version)
const getStatusColor = (status: string) => {
  switch (status) {
    case BORROW_STATUS.ACTIVE:
      return badgeColors.info.background;
    case BORROW_STATUS.RETURNED:
      return badgeColors.success.background;
    case BORROW_STATUS.LOST:
      return badgeColors.error.background;
    default:
      return badgeColors.muted.background;
  }
};

const getStatusTextColor = (status: string) => {
  switch (status) {
    case BORROW_STATUS.ACTIVE:
      return badgeColors.info.text;
    case BORROW_STATUS.RETURNED:
      return badgeColors.success.text;
    case BORROW_STATUS.LOST:
      return badgeColors.error.text;
    default:
      return badgeColors.muted.text;
  }
};

// Define all available columns with their renderers
export const createColumnDefinitions = (): TableColumn[] => [
  {
    key: "item.uniCode",
    header: "CÓDIGO",
    align: "left",
    sortable: true,
    width: 0,
    accessor: (borrow: Borrow) => (
      <ThemedText style={styles.cellText} numberOfLines={1}>
        {borrow.item?.uniCode || "-"}
      </ThemedText>
    ),
  },
  {
    key: "item.name",
    header: "ITEM",
    align: "left",
    sortable: true,
    width: 0,
    accessor: (borrow: Borrow) => (
      <ThemedText style={StyleSheet.flatten([styles.cellText, styles.nameText])} numberOfLines={2}>
        {borrow.item?.name || "Item não encontrado"}
      </ThemedText>
    ),
  },
  {
    key: "item.category.name",
    header: "CATEGORIA",
    align: "left",
    sortable: true,
    width: 0,
    accessor: (borrow: Borrow) => (
      <ThemedText style={styles.cellText} numberOfLines={1}>
        {borrow.item?.category?.name || "-"}
      </ThemedText>
    ),
  },
  {
    key: "item.brand.name",
    header: "MARCA",
    align: "left",
    sortable: true,
    width: 0,
    accessor: (borrow: Borrow) => (
      <ThemedText style={styles.cellText} numberOfLines={1}>
        {borrow.item?.brand?.name || "-"}
      </ThemedText>
    ),
  },
  {
    key: "user.name",
    header: "USUÁRIO",
    align: "left",
    sortable: true,
    width: 0,
    accessor: (borrow: Borrow) => (
      <ThemedText style={styles.cellText} numberOfLines={1}>
        {borrow.user?.name || "Usuário"}
      </ThemedText>
    ),
  },
  {
    key: "quantity",
    header: "QUANTIDADE",
    align: "center",
    sortable: true,
    width: 0,
    accessor: (borrow: Borrow) => (
      <ThemedText style={StyleSheet.flatten([styles.cellText, styles.numberText])} numberOfLines={1}>
        {borrow.quantity} un
      </ThemedText>
    ),
  },
  {
    key: "status",
    header: "STATUS",
    align: "center",
    sortable: true,
    width: 0,
    accessor: (borrow: Borrow) => (
      <View style={styles.centerAlign}>
        <Badge
          variant="secondary"
          size="sm"
          style={{
            backgroundColor: getStatusColor(borrow.status),
            borderWidth: 0,
          }}
        >
          <ThemedText
            style={{
              color: getStatusTextColor(borrow.status),
              fontSize: fontSize.xs,
              fontWeight: fontWeight.medium,
            }}
          >
            {BORROW_STATUS_LABELS[borrow.status]}
          </ThemedText>
        </Badge>
      </View>
    ),
  },
  {
    key: "createdAt",
    header: "EMPRESTADO EM",
    align: "left",
    sortable: true,
    width: 0,
    accessor: (borrow: Borrow) => (
      <ThemedText style={StyleSheet.flatten([styles.cellText, { fontSize: fontSize.sm }])} numberOfLines={1}>
        {formatDateWithRelative(borrow.createdAt)}
      </ThemedText>
    ),
  },
  {
    key: "returnedAt",
    header: "DEVOLVIDO EM",
    align: "left",
    sortable: true,
    width: 0,
    accessor: (borrow: Borrow) => (
      <ThemedText style={StyleSheet.flatten([styles.cellText, { fontSize: fontSize.sm }])} numberOfLines={1}>
        {borrow.returnedAt ? formatDateWithRelative(borrow.returnedAt) : "-"}
      </ThemedText>
    ),
  },
  {
    key: "updatedAt",
    header: "ATUALIZADO EM",
    align: "left",
    sortable: true,
    width: 0,
    accessor: (borrow: Borrow) => (
      <ThemedText style={StyleSheet.flatten([styles.cellText, { fontSize: fontSize.sm }])} numberOfLines={1}>
        {formatDateWithRelative(borrow.updatedAt)}
      </ThemedText>
    ),
  },
];

export const BorrowTable = React.memo<BorrowTableProps>(
  ({
    borrows,
    onBorrowPress,
    onBorrowEdit,
    onBorrowDelete,
    onReturn,
    onMarkAsLost,
    onRefresh,
    onEndReached,
    refreshing = false,
    loading = false,
    loadingMore = false,
    showSelection = false,
    selectedBorrows = new Set(),
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
        "item.uniCode": 1.2,
        "item.name": 2.0,
        "item.category.name": 1.2,
        "item.brand.name": 1.2,
        "user.name": 1.5,
        quantity: 1.0,
        status: 1.0,
        createdAt: 1.3,
        returnedAt: 1.3,
        updatedAt: 1.3,
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
    const renderColumnValue = useCallback((borrow: Borrow, column: TableColumn) => {
      return column.accessor(borrow);
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
                  <Checkbox checked={borrows.length > 0 && borrows.every((borrow) => selectedBorrows.has(borrow.id))} onCheckedChange={handleSelectAll} disabled={borrows.length === 0} />
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
      [colors, isDark, tableWidth, displayColumns, showSelection, selectedBorrows, borrows.length, sortConfigs, handleSelectAll, handleSort],
    );

    // Row component
    const renderRow = useCallback(
      ({ item, index }: { item: Borrow; index: number }) => {
        const isSelected = selectedBorrows.has(item.id);
        const isEven = index % 2 === 0;

        if (enableSwipeActions && (onBorrowEdit || onBorrowDelete || onReturn || onMarkAsLost)) {
          return (
            <BorrowTableRowSwipe
              key={item.id}
              borrowId={item.id}
              borrowDescription={`${item.item?.name || "Item"} - ${item.quantity} un`}
              status={item.status}
              onEdit={onBorrowEdit}
              onDelete={onBorrowDelete}
              onReturn={onReturn}
              onMarkAsLost={onMarkAsLost}
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
                        style={StyleSheet.flatten([styles.cell, { width: column.width }, column.align === "center" && styles.centerAlign, column.align === "right" && styles.rightAlign])}
                      >
                        {renderColumnValue(item, column)}
                      </View>
                    ))}
                  </Pressable>
                </ScrollView>
              )}
            </BorrowTableRowSwipe>
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
        selectedBorrows,
        onBorrowPress,
        handleSelectBorrow,
        renderColumnValue,
        enableSwipeActions,
        onBorrowEdit,
        onBorrowDelete,
        onReturn,
        onMarkAsLost,
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
          <ThemedText style={styles.emptyTitle}>Nenhum empréstimo encontrado</ThemedText>
          <ThemedText style={styles.emptySubtitle}>Tente ajustar os filtros ou adicionar novos empréstimos</ThemedText>
        </View>
      ),
      [colors.mutedForeground],
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
        <Pressable style={StyleSheet.flatten([styles.container, { backgroundColor: colors.background }])} onPress={handleContainerPress}>
          {renderHeader()}
          <FlatList
            ref={flatListRef}
            data={borrows}
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
    alignItems: "stretch", // Changed from 'center' to 'stretch' to ensure all cells have same height
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
  nameText: {
    fontWeight: fontWeight.medium,
    fontSize: fontSize.xs,
  },
  numberText: {
    fontWeight: fontWeight.normal,
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

BorrowTable.displayName = "BorrowTable";
