import React, { useState, useCallback, useMemo, useRef } from "react";
import { FlatList, View, TouchableOpacity, Pressable, RefreshControl, ActivityIndicator, Dimensions, ScrollView, StyleSheet } from "react-native";
import { Icon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import type { Item } from '../../../../types';
import { ThemedText } from "@/components/ui/themed-text";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/lib/theme";
import { useSwipeRow } from "@/contexts/swipe-row-context";
import { spacing, fontSize, fontWeight } from "@/constants/design-system";
import { ItemTableRowSwipe } from "./item-table-row-swipe";
import { StockStatusIndicator } from "./stock-status-indicator";
import { ColumnVisibilityManager, getDefaultVisibleColumns } from "./column-visibility-manager";
import { formatCurrency } from '../../../../utils';
import { extendedColors, badgeColors } from "@/lib/theme/extended-colors";

export interface TableColumn {
  key: string;
  header: string;
  accessor: (item: Item) => React.ReactNode;
  width: number;
  align?: "left" | "center" | "right";
  sortable?: boolean;
}

export interface SortConfig {
  columnKey: string;
  direction: "asc" | "desc";
}

interface ItemTableProps {
  items: Item[];
  onItemPress?: (itemId: string) => void;
  onItemEdit?: (itemId: string) => void;
  onItemDelete?: (itemId: string) => void;
  onItemDuplicate?: (itemId: string) => void;
  onRefresh?: () => Promise<void>;
  onEndReached?: () => void;
  refreshing?: boolean;
  loading?: boolean;
  loadingMore?: boolean;
  showSelection?: boolean;
  selectedItems?: Set<string>;
  onSelectionChange?: (selectedItems: Set<string>) => void;
  sortConfigs?: SortConfig[];
  onSort?: (configs: SortConfig[]) => void;
  enableSwipeActions?: boolean;
}

// Get screen width for responsive design
const { width: screenWidth } = Dimensions.get("window");
const availableWidth = screenWidth - 32; // Account for padding

// Define all available columns with their renderers
const createColumnDefinitions = (): TableColumn[] => [
  {
    key: "uniCode",
    header: "Código",
    align: "left",
    sortable: true,
    width: 0,
    accessor: (item: Item) => (
      <ThemedText style={styles.cellText} numberOfLines={1}>
        {item.uniCode || "-"}
      </ThemedText>
    ),
  },
  {
    key: "name",
    header: "Nome",
    align: "left",
    sortable: true,
    width: 0,
    accessor: (item: Item) => (
      <ThemedText style={StyleSheet.flatten([styles.cellText, styles.nameText])} numberOfLines={2}>
        {item.name}
      </ThemedText>
    ),
  },
  {
    key: "quantity",
    header: "Qnt",
    align: "left",
    sortable: true,
    width: 0,
    accessor: (item: Item) => (
      <View style={styles.quantityCell}>
        <StockStatusIndicator item={item} />
        <ThemedText style={styles.quantityText} numberOfLines={1}>
          {item.quantity || 0}
        </ThemedText>
      </View>
    ),
  },
  {
    key: "maxQuantity",
    header: "Máx",
    align: "center",
    sortable: true,
    width: 0,
    accessor: (item: Item) => (
      <ThemedText style={StyleSheet.flatten([styles.cellText, styles.numberText])} numberOfLines={1}>
        {item.maxQuantity || "-"}
      </ThemedText>
    ),
  },
  {
    key: "reorderPoint",
    header: "Reposição",
    align: "center",
    sortable: true,
    width: 0,
    accessor: (item: Item) => (
      <ThemedText style={StyleSheet.flatten([styles.cellText, styles.numberText])} numberOfLines={1}>
        {item.reorderPoint || "-"}
      </ThemedText>
    ),
  },
  {
    key: "price",
    header: "Preço",
    align: "right",
    sortable: true,
    width: 0,
    accessor: (item: Item) => (
      <ThemedText style={StyleSheet.flatten([styles.cellText, styles.numberText])} numberOfLines={1}>
        {item.prices?.[0]?.value ? formatCurrency(item.prices[0].value) : "-"}
      </ThemedText>
    ),
  },
  {
    key: "totalPrice",
    header: "Total",
    align: "right",
    sortable: true,
    width: 0,
    accessor: (item: Item) => (
      <ThemedText style={StyleSheet.flatten([styles.cellText, styles.numberText])} numberOfLines={1}>
        {item.totalPrice ? formatCurrency(item.totalPrice) : "-"}
      </ThemedText>
    ),
  },
  {
    key: "tax",
    header: "Imposto",
    align: "right",
    sortable: true,
    width: 0,
    accessor: (item: Item) => (
      <ThemedText style={StyleSheet.flatten([styles.cellText, styles.numberText])} numberOfLines={1}>
        {item.tax ? `${item.tax}%` : "-"}
      </ThemedText>
    ),
  },
  {
    key: "abcCategory",
    header: "ABC",
    align: "center",
    sortable: true,
    width: 0,
    accessor: (item: Item) => (
      <View style={StyleSheet.flatten([styles.centerAlign, styles.headerContainer])}>
        <Badge
          variant="secondary"
          size="sm"
          style={{
            backgroundColor: item.abcCategory === "A" ? badgeColors.error.background : item.abcCategory === "B" ? badgeColors.warning.background : badgeColors.success.background,
            borderWidth: 0,
          }}
        >
          <ThemedText
            style={{
              color: item.abcCategory === "A" ? badgeColors.error.text : item.abcCategory === "B" ? badgeColors.warning.text : badgeColors.success.text,
              fontSize: fontSize.xs,
              fontWeight: fontWeight.medium,
            }}
          >
            {item.abcCategory || "C"}
          </ThemedText>
        </Badge>
      </View>
    ),
  },
  {
    key: "xyzCategory",
    header: "XYZ",
    align: "center",
    sortable: true,
    width: 0,
    accessor: (item: Item) => (
      <View style={styles.centerAlign}>
        <Badge
          variant="secondary"
          size="sm"
          style={{
            backgroundColor:
              item.xyzCategory === "X" ? badgeColors.info.background : item.xyzCategory === "Y" ? "rgba(156, 163, 175, 0.15)" : badgeColors.warning.background,
            borderWidth: 0,
          }}
        >
          <ThemedText
            style={{
              color: item.xyzCategory === "X" ? badgeColors.info.text : item.xyzCategory === "Y" ? "#6b7280" : badgeColors.warning.text,
              fontSize: fontSize.xs,
              fontWeight: fontWeight.medium,
            }}
          >
            {item.xyzCategory || "Z"}
          </ThemedText>
        </Badge>
      </View>
    ),
  },
  {
    key: "brand.name",
    header: "Marca",
    align: "left",
    sortable: true,
    width: 0,
    accessor: (item: Item) => (
      <ThemedText style={styles.cellText} numberOfLines={1}>
        {item.brand?.name || "-"}
      </ThemedText>
    ),
  },
  {
    key: "category.name",
    header: "Categoria",
    align: "left",
    sortable: true,
    width: 0,
    accessor: (item: Item) => (
      <ThemedText style={styles.cellText} numberOfLines={1}>
        {item.category?.name || "-"}
      </ThemedText>
    ),
  },
  {
    key: "supplier",
    header: "Fornecedor",
    align: "left",
    sortable: true,
    width: 0,
    accessor: (item: Item) => (
      <ThemedText style={styles.cellText} numberOfLines={1}>
        {item.supplier?.fantasyName || "-"}
      </ThemedText>
    ),
  },
  {
    key: "active",
    header: "Status",
    align: "center",
    sortable: true,
    width: 0,
    accessor: (item: Item) => (
      <View style={styles.centerAlign}>
        <Badge
          variant={item.isActive ? "default" : "secondary"}
          size="sm"
          style={{
            backgroundColor: item.isActive ? badgeColors.success.background : badgeColors.muted.background,
            borderWidth: 0,
          }}
        >
          <ThemedText
            style={{
              color: item.isActive ? badgeColors.success.text : badgeColors.muted.text,
              fontSize: fontSize.xs,
              fontWeight: fontWeight.medium,
            }}
          >
            {item.isActive ? "Ativo" : "Inativo"}
          </ThemedText>
        </Badge>
      </View>
    ),
  },
  {
    key: "barcode",
    header: "Cód. Barras",
    align: "left",
    sortable: false,
    width: 0,
    accessor: (item: Item) => (
      <ThemedText style={styles.cellText} numberOfLines={1}>
        {item.barcodes?.length > 0 ? item.barcodes[0] : "-"}
      </ThemedText>
    ),
  },
];

export const ItemTable = React.memo<ItemTableProps>(
  ({
    items,
    onItemPress,
    onItemEdit,
    onItemDelete,
    onItemDuplicate,
    onRefresh,
    onEndReached,
    refreshing = false,
    loading = false,
    loadingMore = false,
    showSelection = false,
    selectedItems = new Set(),
    onSelectionChange,
    sortConfigs = [],
    onSort,
    enableSwipeActions = true,
  }) => {
    const { colors, isDark } = useTheme();
    const { activeRowId, closeActiveRow } = useSwipeRow();
    const [headerHeight, setHeaderHeight] = useState(50);
    const flatListRef = useRef<FlatList>(null);

    // Column visibility state
    const [visibleColumns, setVisibleColumns] = useState<Set<string>>(getDefaultVisibleColumns());
    const [columnManagerOpen, setColumnManagerOpen] = useState(false);

    // Get all column definitions
    const allColumns = useMemo(() => createColumnDefinitions(), []);

    // Build visible columns with dynamic widths
    const displayColumns = useMemo(() => {
      // Define width ratios for each column type
      const columnWidthRatios: Record<string, number> = {
        name: 2.0,
        uniCode: 1.2,
        quantity: 0.8,
        maxQuantity: 0.8,
        reorderPoint: 1.0,
        price: 1.0,
        totalPrice: 1.2,
        tax: 0.8,
        abcCategory: 0.6,
        xyzCategory: 0.6,
        "brand.name": 1.2,
        "category.name": 1.2,
        supplier: 1.4,
        active: 0.8,
        barcode: 1.4,
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

      const allSelected = items.every((item) => selectedItems.has(item.id));
      if (allSelected) {
        onSelectionChange(new Set());
      } else {
        onSelectionChange(new Set(items.map((item) => item.id)));
      }
    }, [items, selectedItems, onSelectionChange]);

    const handleSelectItem = useCallback(
      (itemId: string) => {
        if (!onSelectionChange) return;

        const newSelection = new Set(selectedItems);
        if (newSelection.has(itemId)) {
          newSelection.delete(itemId);
        } else {
          newSelection.add(itemId);
        }
        onSelectionChange(newSelection);
      },
      [selectedItems, onSelectionChange],
    );

    // Sort handler
    const handleSort = useCallback(
      (columnKey: string) => {
        if (!onSort) return;

        const existingIndex = sortConfigs?.findIndex((config) => config.columnKey === columnKey) ?? -1;

        if (existingIndex !== -1) {
          // Column already sorted, toggle direction or remove
          const newConfigs = [...(sortConfigs || [])];
          if (newConfigs[existingIndex].direction === "asc") {
            newConfigs[existingIndex].direction = "desc";
          } else {
            // Remove from sorts
            newConfigs.splice(existingIndex, 1);
          }
          onSort(newConfigs);
        } else {
          // Add new sort as primary (at the beginning)
          const newConfigs = [{ columnKey, direction: "asc" as const }, ...(sortConfigs || [])];
          // Limit to 3 sorts max
          if (newConfigs.length > 3) {
            newConfigs.pop();
          }
          onSort(newConfigs);
        }
      },
      [sortConfigs, onSort],
    );

    // Column renderer using accessor
    const renderColumnValue = useCallback((item: Item, column: TableColumn) => {
      return column.accessor(item);
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
                  <Checkbox checked={items.length > 0 && items.every((item) => selectedItems.has(item.id))} onCheckedChange={handleSelectAll} disabled={items.length === 0} />
                </View>
              )}
              {displayColumns.map((column) => {
                const sortIndex = sortConfigs?.findIndex((config) => config.columnKey === column.key) ?? -1;
                const sortConfig = sortIndex !== -1 ? sortConfigs[sortIndex] : null;

                return (
                  <TouchableOpacity
                    key={column.key}
                    style={StyleSheet.flatten([styles.headerCell, { width: column.width }])}
                    onPress={() => column.sortable && handleSort(column.key)}
                    onLongPress={() => {
                      if (column.sortable && sortConfig) {
                        // Remove this specific sort
                        const newSorts = sortConfigs.filter((config) => config.columnKey !== column.key);
                        onSort?.(newSorts);
                      }
                    }}
                    disabled={!column.sortable}
                    activeOpacity={column.sortable ? 0.7 : 1}
                  >
                    <View style={styles.headerCellContent}>
                      <ThemedText style={StyleSheet.flatten([styles.headerText, { color: isDark ? extendedColors.neutral[200] : "#000000" }])} numberOfLines={1}>
                        {column.header}
                      </ThemedText>
                      {column.sortable &&
                        (sortConfig ? (
                          <View style={styles.sortIconContainer}>
                            {sortConfig.direction === "asc" ? (
                              <Icon name="chevron-up" size="sm" color={isDark ? extendedColors.neutral[100] : extendedColors.neutral[900 as keyof typeof neutral]} />
                            ) : (
                              <Icon name="chevron-down" size="sm" color={isDark ? extendedColors.neutral[100] : extendedColors.neutral[900 as keyof typeof neutral]} />
                            )}
                            {sortConfigs.length > 1 && (
                              <ThemedText style={StyleSheet.flatten([styles.sortOrder, { color: isDark ? extendedColors.neutral[300] : extendedColors.neutral[700 as keyof typeof neutral] }])}>{sortIndex + 1}</ThemedText>
                            )}
                          </View>
                        ) : (
                          <Icon name="arrows-sort" size="sm" color={isDark ? extendedColors.neutral[400] : extendedColors.neutral[600 as keyof typeof neutral]} />
                        ))}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>
        </View>
      ),
      [colors, isDark, tableWidth, displayColumns, showSelection, selectedItems, items.length, sortConfigs, handleSelectAll, handleSort],
    );

    // Row component
    const renderRow = useCallback(
      ({ item, index }: { item: Item; index: number }) => {
        const isSelected = selectedItems.has(item.id);
        const isEven = index % 2 === 0;

        if (enableSwipeActions && (onItemEdit || onItemDelete)) {
          return (
            <ItemTableRowSwipe key={item.id} itemId={item.id} itemName={item.name} onEdit={onItemEdit} onDelete={onItemDelete} disabled={showSelection}>
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
                    onPress={() => onItemPress?.(item.id)}
                    onLongPress={() => showSelection && handleSelectItem(item.id)}
                    android_ripple={{ color: colors.primary + "20" }}
                  >
                    {showSelection && (
                      <View style={StyleSheet.flatten([styles.cell, styles.checkboxCell])}>
                        <Checkbox checked={isSelected} onCheckedChange={() => handleSelectItem(item.id)} />
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
            </ItemTableRowSwipe>
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
              onPress={() => onItemPress?.(item.id)}
              onLongPress={() => showSelection && handleSelectItem(item.id)}
              android_ripple={{ color: colors.primary + "20" }}
            >
              {showSelection && (
                <View style={StyleSheet.flatten([styles.cell, styles.checkboxCell])}>
                  <Checkbox checked={isSelected} onCheckedChange={() => handleSelectItem(item.id)} />
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
        selectedItems,
        onItemPress,
        handleSelectItem,
        renderColumnValue,
        enableSwipeActions,
        onItemEdit,
        onItemDelete,
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
          <Icon name="archive" size="xl" variant="muted" />
          <ThemedText style={styles.emptyTitle}>Nenhum produto encontrado</ThemedText>
          <ThemedText style={styles.emptySubtitle}>Tente ajustar os filtros ou adicionar novos produtos</ThemedText>
        </View>
      ),
      [colors.mutedForeground],
    );

    // Main loading state
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <ThemedText style={styles.loadingText}>Carregando produtos...</ThemedText>
        </View>
      );
    }

    return (
      <View style={styles.wrapper}>
        {/* Column Manager Button */}
        <View style={styles.toolbarContainer}>
          <Button variant="outline" size="sm" onPress={() => setColumnManagerOpen(true)} style={styles.columnManagerButton}>
            <Icon name="columns-3" size="sm" />
            <ThemedText style={styles.columnManagerButtonText}>
              Colunas ({visibleColumns.size}/{allColumns.length})
            </ThemedText>
          </Button>
        </View>

        <Pressable style={StyleSheet.flatten([styles.container, { backgroundColor: colors.background }])} onPress={handleContainerPress}>
          {renderHeader()}
          <FlatList
            ref={flatListRef}
            data={items}
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

        {/* Column Manager Modal */}
        <ColumnVisibilityManager columns={allColumns} visibleColumns={visibleColumns} onVisibilityChange={setVisibleColumns} open={columnManagerOpen} onOpenChange={setColumnManagerOpen} />
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
  toolbarContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    paddingHorizontal: spacing.xs,
    paddingBottom: spacing.sm,
    gap: spacing.sm,
  },
  columnManagerButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  columnManagerButtonText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
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
    marginTop: 12,
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
    minHeight: 56,
  },
  headerCell: {
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.sm,
    minHeight: 56,
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
  },
  sortIndicator: {
    marginLeft: 4,
  },
  sortIconContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 4,
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
    minHeight: 60,
  },
  cell: {
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.sm,
    justifyContent: "center",
    minHeight: 60, // Changed from 72 to match row minHeight
  },
  centerAlign: {
    alignItems: "center",
  },
  rightAlign: {
    alignItems: "flex-end",
  },
  cellText: {
    fontSize: fontSize.sm,
  },
  monoText: {
    fontFamily: "monospace",
    fontSize: fontSize.xs, // Smaller for codes
  },
  nameText: {
    fontWeight: fontWeight.medium,
    fontSize: fontSize.sm,
  },
  numberText: {
    fontWeight: fontWeight.normal,
    fontSize: fontSize.sm,
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
  quantityCell: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    gap: 6,
    height: "100%", // Ensure it takes full height of parent cell
  },
  quantityText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
});

ItemTable.displayName = "ItemTable";
