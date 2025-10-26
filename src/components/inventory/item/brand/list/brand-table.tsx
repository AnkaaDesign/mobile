import React, { useCallback, useMemo, useRef } from "react";
import { FlatList, View, TouchableOpacity, Pressable, RefreshControl, ActivityIndicator, Dimensions, ScrollView , StyleSheet} from "react-native";
import type { ItemBrand } from '../../../../../types';
import { ThemedText } from "@/components/ui/themed-text";
import { Checkbox } from "@/components/ui/checkbox";
import { useTheme } from "@/lib/theme";
import { useSwipeRow } from "@/contexts/swipe-row-context";
import { spacing, fontSize, fontWeight } from "@/constants/design-system";
import { BrandTableRowSwipe } from "./brand-table-row-swipe";
import { extendedColors } from "@/lib/theme/extended-colors";
import { IconChevronUp } from "@tabler/icons-react-native";
import { IconChevronDown } from "@tabler/icons-react-native";
import type { SortConfig } from "@/lib/sort-utils";

export interface TableColumn {
  key: string;
  title: string;
  width: number;
  align?: "left" | "center" | "right";
  sortable?: boolean;
  render?: (brand: ItemBrand) => React.ReactNode;
}


interface BrandTableProps {
  brands: ItemBrand[];
  onBrandPress?: (brandId: string) => void;
  onBrandEdit?: (brandId: string) => void;
  onBrandDelete?: (brandId: string) => void;
  onBrandDuplicate?: (brandId: string) => void;
  onRefresh?: () => Promise<void>;
  onEndReached?: () => void;
  refreshing?: boolean;
  loading?: boolean;
  loadingMore?: boolean;
  showSelection?: boolean;
  selectedBrands?: Set<string>;
  onSelectionChange?: (selectedBrands: Set<string>) => void;
  sortConfigs?: SortConfig[];
  onSort?: (configs: SortConfig[]) => void;
  columns?: TableColumn[];
  visibleColumnKeys?: string[];
  enableSwipeActions?: boolean;
  onColumnsManage?: () => void;
}

// Get screen width for responsive design
const { width: screenWidth } = Dimensions.get("window");
const availableWidth = screenWidth - 32; // Account for padding

// Define all available columns with their renderers
const ALL_COLUMN_DEFINITIONS: Record<string, Omit<TableColumn, "width">> = {
  name: {
    key: "name",
    title: "Nome",
    align: "left",
    sortable: true,
  },
  itemCount: {
    key: "itemCount",
    title: "Produtos",
    align: "left",
    sortable: true,
  },
  createdAt: {
    key: "createdAt",
    title: "Criado em",
    align: "left",
    sortable: true,
  },
};

// Default columns for brand table (simplified for mobile)
const DEFAULT_COLUMNS = ["name", "itemCount", "createdAt"];

function calculateColumnWidths(columnKeys: string[]): TableColumn[] {
  // Define width ratios for each column type (similar to item table approach)
  const columnWidthRatios: Record<string, number> = {
    name: 2.0, // Main column - needs more space
    itemCount: 1.2, // Slightly increased - numeric count
    createdAt: 1.1, // Slightly decreased - date display
  };

  // Calculate total ratio
  const totalRatio = columnKeys.reduce((sum, key) => {
    return sum + (columnWidthRatios[key] || 1.0);
  }, 0);

  // Calculate actual widths based on ratios
  return columnKeys
    .map((key) => {
      const definition = ALL_COLUMN_DEFINITIONS[key as keyof typeof ALL_COLUMN_DEFINITIONS];
      if (!definition) return null;

      const ratio = columnWidthRatios[key] || 1.0;
      const width = Math.floor((availableWidth * ratio) / totalRatio);

      return {
        ...definition,
        width,
      };
    })
    .filter(Boolean) as TableColumn[];
}

export function BrandTable({
  brands,
  onBrandPress,
  onBrandEdit,
  onBrandDelete,
  onBrandDuplicate,
  onRefresh,
  onEndReached,
  refreshing = false,
  loading = false,
  loadingMore = false,
  showSelection = false,
  selectedBrands = new Set(),
  onSelectionChange,
  sortConfigs = [],
  onSort,
  visibleColumnKeys = DEFAULT_COLUMNS,
  enableSwipeActions = true,
  onColumnsManage,
}: BrandTableProps) {
  const theme = useTheme();
  const { closeActiveRow, closeOpenRow } = useSwipeRow();
  const flatListRef = useRef<FlatList>(null);

  // Calculate columns based on visible keys
  const columns = useMemo(() => calculateColumnWidths(visibleColumnKeys), [visibleColumnKeys]);

  // Handle brand selection
  const handleBrandSelect = useCallback(
    (brandId: string) => {
      if (!onSelectionChange) return;

      const newSelection = new Set(selectedBrands);
      if (newSelection.has(brandId)) {
        newSelection.delete(brandId);
      } else {
        newSelection.add(brandId);
      }
      onSelectionChange(newSelection);
    },
    [selectedBrands, onSelectionChange],
  );

  // Handle select all
  const handleSelectAll = useCallback(() => {
    if (!onSelectionChange) return;

    const allSelected = brands.every((brand) => selectedBrands.has(brand.id));
    if (allSelected) {
      onSelectionChange(new Set());
    } else {
      onSelectionChange(new Set(brands.map((brand) => brand.id)));
    }
  }, [brands, selectedBrands, onSelectionChange]);

  // Handle sort
  const handleSort = useCallback(
    (columnKey: string) => {
      if (!onSort) return;

      const existingSort = sortConfigs.find((config) => config.columnKey === columnKey);
      let newConfigs: SortConfig[];

      if (existingSort) {
        if (existingSort.direction === "asc") {
          newConfigs = sortConfigs.map((config) => (config.columnKey === columnKey ? { ...config, direction: "desc" as const } : config));
        } else {
          newConfigs = sortConfigs.filter((config) => config.columnKey !== columnKey);
        }
      } else {
        newConfigs = [...sortConfigs, { columnKey, direction: "asc" }];
      }

      onSort(newConfigs);
    },
    [sortConfigs, onSort],
  );

  // Render column header
  const renderColumnHeader = useCallback(
    (column: TableColumn, index: number) => {
      const sortConfig = sortConfigs.find((config) => config.columnKey === column.key);
      const sortIndex = sortConfigs.findIndex((config) => config.columnKey === column.key);

      return (
        <TouchableOpacity
          key={column.key}
          style={StyleSheet.flatten([styles.headerCell, { width: column.width }])}
          onPress={() => column.sortable && handleSort(column.key)}
          disabled={!column.sortable}
        >
          <View style={styles.headerCellContent}>
            <ThemedText style={StyleSheet.flatten([styles.headerText, { color: theme.isDark ? extendedColors.neutral[200] : "#000000" }])}>{column.title}</ThemedText>
            {column.sortable && (
              <View style={styles.sortIndicator}>
                {sortConfig ? (
                  <>
                    <IconChevronUp size={14} color={theme.isDark ? extendedColors.neutral[100] : extendedColors.neutral[900]} />
                    {sortConfigs.length > 1 && (
                      <ThemedText style={StyleSheet.flatten([styles.sortIndex, { color: theme.isDark ? extendedColors.neutral[300] : extendedColors.neutral[700] }])}>{sortIndex + 1}</ThemedText>
                    )}
                  </>
                ) : (
                  <IconChevronDown size={14} color={theme.isDark ? extendedColors.neutral[400] : extendedColors.neutral[600]} />
                )}
              </View>
            )}
          </View>
        </TouchableOpacity>
      );
    },
    [theme, sortConfigs, handleSort],
  );

  // Render cell content
  const renderCell = useCallback((brand: ItemBrand, column: TableColumn) => {
    switch (column.key) {
      case "name":
        return (
          <ThemedText style={StyleSheet.flatten([styles.cellText, styles.nameText])} numberOfLines={2}>
            {brand.name}
          </ThemedText>
        );

      case "itemCount":
        return <ThemedText style={StyleSheet.flatten([styles.cellText, styles.numberText])}>{brand.items?.length || 0}</ThemedText>;

      case "createdAt":
        return (
          <ThemedText style={StyleSheet.flatten([styles.cellText, styles.dateText])}>
            {new Date(brand.createdAt).toLocaleDateString("pt-BR", {
              day: "2-digit",
              month: "2-digit",
              year: "2-digit",
            })}
          </ThemedText>
        );

      default:
        return <ThemedText style={styles.cellText}>-</ThemedText>;
    }
  }, []);

  // Render brand row
  const renderBrandRow = useCallback(
    ({ item: brand, index }: { item: ItemBrand; index: number }) => {
      const isSelected = selectedBrands.has(brand.id);
      const isEven = index % 2 === 0;

      const row = (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={StyleSheet.flatten([
            styles.row,
            {
              backgroundColor: isSelected
                ? theme.colors.primary + "20"
                : isEven
                  ? theme.colors.background
                  : theme.isDark
                    ? extendedColors.neutral[900]
                    : extendedColors.neutral[50],
              borderBottomColor: theme.isDark ? extendedColors.neutral[700] : extendedColors.neutral[200],
            },
          ])}
          contentContainerStyle={{ paddingHorizontal: 16 }}
        >
          <Pressable
            style={StyleSheet.flatten([styles.rowContent, { width: tableWidth }])}
            onPress={() => onBrandPress?.(brand.id)}
            onLongPress={() => showSelection && handleBrandSelect(brand.id)}
            android_ripple={{ color: theme.colors.primary + "20" }}
          >
            {showSelection && (
              <View style={StyleSheet.flatten([styles.cell, styles.checkboxCell])}>
                <Checkbox checked={isSelected} onCheckedChange={() => handleBrandSelect(brand.id)} />
              </View>
            )}
            {columns.map((column) => (
              <View key={column.key} style={StyleSheet.flatten([styles.cell, { width: column.width }])}>
                {renderCell(brand, column)}
              </View>
            ))}
          </Pressable>
        </ScrollView>
      );

      // Wrap with swipe actions if enabled
      if (enableSwipeActions) {
        return (
          <BrandTableRowSwipe
            key={brand.id}
            brand={brand}
            onEdit={() => onBrandEdit?.(brand.id)}
            onDelete={() => onBrandDelete?.(brand.id)}
            onDuplicate={() => onBrandDuplicate?.(brand.id)}
          >
            {row}
          </BrandTableRowSwipe>
        );
      }

      return row;
    },
    [
      brands,
      selectedBrands,
      showSelection,
      theme,
      columns,
      enableSwipeActions,
      onBrandPress,
      onBrandEdit,
      onBrandDelete,
      onBrandDuplicate,
      handleBrandSelect,
      renderCell,
      closeOpenRow,
    ],
  );

  // Calculate table width (consistent checkbox width of 50px)
  const checkboxWidth = 50;
  const tableWidth = columns.reduce((sum, col) => sum + col.width, 0) + (showSelection ? checkboxWidth : 0);

  if (loading && brands.length === 0) {
    return (
      <View style={StyleSheet.flatten([styles.loadingContainer, { backgroundColor: theme.colors.surface }])}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <ThemedText style={styles.loadingText}>Carregando marcas...</ThemedText>
      </View>
    );
  }

  return (
    <View style={styles.wrapper}>
      <View style={StyleSheet.flatten([styles.container, { backgroundColor: theme.colors.card || "white" }])}>
        {/* Header */}
        <View style={styles.headerWrapper}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            scrollEventThrottle={16}
            style={StyleSheet.flatten([
              styles.headerContainer,
              {
                backgroundColor: theme.isDark ? extendedColors.neutral[800] : extendedColors.neutral[100],
                borderBottomColor: theme.isDark ? extendedColors.neutral[700] : extendedColors.neutral[200],
              },
            ])}
            contentContainerStyle={{ paddingHorizontal: 16 }}
          >
            <View style={StyleSheet.flatten([styles.headerRow, { width: tableWidth }])}>
              {/* Select all checkbox */}
              {showSelection && (
                <View style={styles.headerCheckbox}>
                  <Checkbox checked={brands.length > 0 && brands.every((brand) => selectedBrands.has(brand.id))} onCheckedChange={handleSelectAll} />
                </View>
              )}

              {/* Column headers */}
              {columns.map((column, index) => renderColumnHeader(column, index))}
            </View>
          </ScrollView>
        </View>

        {/* Brand list */}
        <FlatList
          ref={flatListRef}
          data={brands}
          renderItem={renderBrandRow}
          keyExtractor={(brand) => brand.id}
          showsVerticalScrollIndicator={false}
          refreshControl={onRefresh ? <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.colors.primary]} tintColor={theme.colors.primary} /> : undefined}
          onEndReached={onEndReached}
          onEndReachedThreshold={0.2}
          ListFooterComponent={
            loadingMore ? (
              <View style={styles.loadingMore}>
                <ActivityIndicator size="small" color={theme.colors.primary} />
              </View>
            ) : null
          }
          style={styles.list}
          removeClippedSubviews={true}
          maxToRenderPerBatch={10}
          windowSize={5}
          initialNumToRender={15}
          updateCellsBatchingPeriod={50}
          getItemLayout={(data, index) => ({
            length: 60, // Fixed row height based on styles.rowContent minHeight
            offset: 60 * index,
            index,
          })}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    marginTop: 12,

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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.lg,
  },
  loadingText: {
    fontSize: fontSize.sm,
    opacity: 0.7,
  },
  headerWrapper: {
    flexDirection: "column",
  },
  headerContainer: {
    flexGrow: 0,
    borderBottomWidth: 2,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 56,
  },
  headerCheckbox: {
    width: 50,
    justifyContent: "center",
    alignItems: "center",
  },
  headerCell: {
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.sm,
    minHeight: 56,
    justifyContent: "center",
  },
  headerCellContent: {
    display: "flex",
    alignItems: "flex-start",
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  headerText: {
    fontSize: 10, // Smaller than xs to prevent line breaks
    fontWeight: fontWeight.bold,
    textTransform: "uppercase",
    lineHeight: 12,
    flex: 1,
  },
  sortIndicator: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 4,
  },
  sortIndicatorIcon: {
    marginLeft: 4,
  },
  sortIndex: {
    fontSize: 10,
    fontWeight: "700",
    marginLeft: 2,
  },
  list: {
    flex: 1,
  },
  row: {
    borderBottomWidth: 1,
    borderBottomColor: "#e5e5e5",
  },
  checkboxContainer: {
    width: 50,
    justifyContent: "center",
    alignItems: "center",
  },
  rowContent: {
    flexDirection: "row",
    alignItems: "stretch", // Ensure all cells have same height
    minHeight: 60,
  },
  cell: {
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.sm,
    minHeight: 60,
    justifyContent: "center",
  },
  checkboxCell: {
    width: 50,
    justifyContent: "center",
    alignItems: "center",
  },
  cellText: {
    fontSize: fontSize.sm,
  },
  nameText: {
    fontWeight: fontWeight.medium,
    fontSize: fontSize.sm,
  },
  numberText: {
    fontWeight: fontWeight.normal,
    fontSize: fontSize.sm,
  },
  dateText: {
    fontSize: fontSize.xs,
    opacity: 0.8,
  },
  centerAlign: {
    alignItems: "center",
  },
  rightAlign: {
    alignItems: "flex-end",
  },
  loadingMore: {
    padding: spacing.md,
    alignItems: "center",
  },
});
