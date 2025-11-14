import React, { useCallback, useMemo, useRef} from "react";
import { FlatList, View, TouchableOpacity, Pressable, RefreshControl, ActivityIndicator, Dimensions, ScrollView , StyleSheet} from "react-native";
import { IconChevronUp, IconChevronDown, IconArrowsVertical } from "@tabler/icons-react-native";
import type { ItemCategory } from '../../../../../types';
import { ITEM_CATEGORY_TYPE, ITEM_CATEGORY_TYPE_LABELS } from "@/constants";
import { ThemedText } from "@/components/ui/themed-text";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/lib/theme";
import { useSwipeRow } from "@/contexts/swipe-row-context";
import { spacing, fontSize, fontWeight } from "@/constants/design-system";
import { CategoryTableRowSwipe } from "./category-table-row-swipe";
import { extendedColors, badgeColors } from "@/lib/theme/extended-colors";
import type { SortConfig } from "@/lib/sort-utils";

export interface TableColumn {
  key: string;
  title: string;
  width: number;
  align?: "left" | "center" | "right";
  sortable?: boolean;
  render?: (category: ItemCategory) => React.ReactNode;
}

interface CategoryTableProps {
  categories: ItemCategory[];
  onCategoryPress?: (categoryId: string) => void;
  onCategoryEdit?: (categoryId: string) => void;
  onCategoryDelete?: (categoryId: string) => void;
  onCategoryDuplicate?: (categoryId: string) => void;
  onRefresh?: () => Promise<void>;
  onEndReached?: () => void;
  refreshing?: boolean;
  loading?: boolean;
  loadingMore?: boolean;
  showSelection?: boolean;
  selectedCategories?: Set<string>;
  onSelectionChange?: (selectedCategories: Set<string>) => void;
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
  type: {
    key: "type",
    title: "Tipo",
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

// Default columns for category table (simplified for mobile)
const DEFAULT_COLUMNS = ["name", "type", "itemCount", "createdAt"];

function calculateColumnWidths(columnKeys: string[]): TableColumn[] {
  // Define width ratios for each column type (similar to item table approach)
  const columnWidthRatios: Record<string, number> = {
    name: 2.0, // Main column - needs more space (matches brand table)
    type: 1.3, // Type display - needs reasonable space
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

export function CategoryTable({
  categories,
  onCategoryPress,
  onCategoryEdit,
  onCategoryDelete,
  onCategoryDuplicate,
  onRefresh,
  onEndReached,
  refreshing = false,
  loading = false,
  loadingMore = false,
  showSelection = false,
  selectedCategories = new Set(),
  onSelectionChange,
  sortConfigs = [],
  onSort,
  visibleColumnKeys = DEFAULT_COLUMNS,
  enableSwipeActions = true,
  // onColumnsManage removed
}: CategoryTableProps) {
  const theme = useTheme();
  const { closeOpenRow } = useSwipeRow();
  const flatListRef = useRef<FlatList>(null);

  // Calculate columns based on visible keys
  const columns = useMemo(() => calculateColumnWidths(visibleColumnKeys), [visibleColumnKeys]);

  // Handle category selection
  const handleCategorySelect = useCallback(
    (categoryId: string) => {
      if (!onSelectionChange) return;

      const newSelection = new Set(selectedCategories);
      if (newSelection.has(categoryId)) {
        newSelection.delete(categoryId);
      } else {
        newSelection.add(categoryId);
      }
      onSelectionChange(newSelection);
    },
    [selectedCategories, onSelectionChange],
  );

  // Handle select all
  const handleSelectAll = useCallback(() => {
    if (!onSelectionChange) return;

    const allSelected = categories.every((cat) => selectedCategories.has(cat.id));
    if (allSelected) {
      onSelectionChange(new Set());
    } else {
      onSelectionChange(new Set(categories.map((cat) => cat.id)));
    }
  }, [categories, selectedCategories, onSelectionChange]);

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
    (column: TableColumn, _index: number) => {
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
                    {sortConfig.direction === "asc" ? (
                      <IconChevronUp size={14} color={theme.isDark ? extendedColors.neutral[100] : extendedColors.neutral[900]} />
                    ) : (
                      <IconChevronDown size={14} color={theme.isDark ? extendedColors.neutral[100] : extendedColors.neutral[900]} />
                    )}
                    {sortConfigs.length > 1 && (
                      <ThemedText style={StyleSheet.flatten([styles.sortIndex, { color: theme.isDark ? extendedColors.neutral[300] : extendedColors.neutral[700] }])}>{sortIndex + 1}</ThemedText>
                    )}
                  </>
                ) : (
                  <IconArrowsVertical size={14} color={theme.isDark ? extendedColors.neutral[400] : extendedColors.neutral[600]} />
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
  const renderCell = useCallback((category: ItemCategory, column: TableColumn) => {
    switch (column.key) {
      case "name":
        return (
          <View style={styles.nameCell}>
            <ThemedText style={StyleSheet.flatten([styles.cellText, styles.nameText])} numberOfLines={2}>
              {category.name}
            </ThemedText>
          </View>
        );

      case "type":
        const getBadgeStyle = (type: string) => {
          switch (type) {
            case ITEM_CATEGORY_TYPE.PPE:
              return { background: badgeColors.success.background, text: badgeColors.success.text };
            case ITEM_CATEGORY_TYPE.TOOL:
              return { background: badgeColors.warning.background, text: badgeColors.warning.text };
            default:
              return { background: badgeColors.muted.background, text: badgeColors.muted.text };
          }
        };

        const badgeStyle = getBadgeStyle(category.type);

        return (
          <View style={styles.typeBadgeContainer}>
            <Badge
              variant="secondary"
              size="sm"
              style={{
                backgroundColor: badgeStyle.background,
                borderWidth: 0,
              }}
            >
              <ThemedText
                style={{
                  color: badgeStyle.text,
                  fontSize: fontSize.xs,
                  fontWeight: fontWeight.medium,
                }}
              >
                {ITEM_CATEGORY_TYPE_LABELS[category.type as keyof typeof ITEM_CATEGORY_TYPE_LABELS]}
              </ThemedText>
            </Badge>
          </View>
        );

      case "itemCount":
        return <ThemedText style={StyleSheet.flatten([styles.cellText, styles.numberText])}>{category.items?.length || 0}</ThemedText>;

      case "createdAt":
        return (
          <ThemedText style={StyleSheet.flatten([styles.cellText, styles.dateText])}>
            {new Date(category.createdAt).toLocaleDateString("pt-BR", {
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

  // Render category row
  const renderCategoryRow = useCallback(
    ({ item: category, index }: { item: ItemCategory; index: number }) => {
      const isSelected = selectedCategories.has(category.id);
      const isEven = index % 2 === 0;

      const row = (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          scrollEnabled={tableWidth > availableWidth}
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
            onPress={() => onCategoryPress?.(category.id)}
            onLongPress={() => showSelection && handleCategorySelect(category.id)}
            android_ripple={{ color: theme.colors.primary + "20" }}
          >
            {showSelection && (
              <View style={StyleSheet.flatten([styles.cell, styles.checkboxCell])}>
                <Checkbox checked={isSelected} onCheckedChange={() => handleCategorySelect(category.id)} />
              </View>
            )}
            {columns.map((column) => (
              <View key={column.key} style={StyleSheet.flatten([styles.cell, { width: column.width }])}>
                {renderCell(category, column)}
              </View>
            ))}
          </Pressable>
        </ScrollView>
      );

      // Wrap with swipe actions if enabled
      if (enableSwipeActions) {
        return (
          <CategoryTableRowSwipe
            key={category.id}
            category={category}
            onEdit={() => onCategoryEdit?.(category.id)}
            onDelete={() => onCategoryDelete?.(category.id)}
            onDuplicate={() => onCategoryDuplicate?.(category.id)}
          >
            {row}
          </CategoryTableRowSwipe>
        );
      }

      return row;
    },
    [
      categories,
      selectedCategories,
      showSelection,
      theme,
      columns,
      enableSwipeActions,
      onCategoryPress,
      onCategoryEdit,
      onCategoryDelete,
      onCategoryDuplicate,
      handleCategorySelect,
      renderCell,
      closeOpenRow,
    ],
  );

  // Calculate table width (consistent checkbox width of 50px)
  const checkboxWidth = 50;
  const tableWidth = columns.reduce((sum, col) => sum + col.width, 0) + (showSelection ? checkboxWidth : 0);

  if (loading && categories.length === 0) {
    return (
      <View style={StyleSheet.flatten([styles.loadingContainer, { backgroundColor: theme.colors.surface }])}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <ThemedText style={styles.loadingText}>Carregando categorias...</ThemedText>
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
            scrollEnabled={tableWidth > availableWidth}
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
                  <Checkbox checked={categories.length > 0 && categories.every((cat) => selectedCategories.has(cat.id))} onCheckedChange={handleSelectAll} />
                </View>
              )}

              {/* Column headers */}
              {columns.map((column, index) => renderColumnHeader(column, index))}
            </View>
          </ScrollView>
        </View>

        {/* Category list */}
        <FlatList
          ref={flatListRef}
          data={categories}
          renderItem={renderCategoryRow}
          keyExtractor={(category) => category.id}
          showsVerticalScrollIndicator={false}
          refreshControl={onRefresh ? <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.colors.primary]} tintColor={theme.colors.primary} /> : undefined}
          onEndReached={onEndReached}
          onEndReachedThreshold={0.1}
          ListFooterComponent={
            loadingMore ? (
              <View style={styles.loadingMore}>
                <ActivityIndicator size="small" color={theme.colors.primary} />
              </View>
            ) : null
          }
          style={styles.list}
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
    justifyContent: "center",
    minHeight: 60,
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
    flex: 1,
  },
  nameCell: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
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
  typeBadgeContainer: {
    alignItems: "flex-start",
    justifyContent: "center",
  },
  loadingMore: {
    padding: spacing.md,
    alignItems: "center",
  },
});
// Re-export SortConfig for consumer components
export type { SortConfig } from "@/lib/sort-utils";
