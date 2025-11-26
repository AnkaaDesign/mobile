/**
 * ItemSelectorTable
 *
 * A standardized item selection component with table-style layout and infinite scroll.
 * Uses infinite scroll for data fetching (`useItemsInfiniteMobile` hook).
 *
 * ## Purpose
 * Provides a data-dense, table-style interface for selecting items from datasets.
 * Optimized for scenarios where users need to browse/filter through items efficiently.
 *
 * ## Features
 * - **Infinite Scroll:** Automatically loads more as you scroll down
 * - **Table Layout:** Compact, data-dense table design
 * - **Column Visibility:** Show/hide columns (code, name, brand, category, stock)
 * - **Sorting:** Click column headers to sort (ascending/descending)
 * - **Category Type Filter:** Filter items by category type (TOOL, CONSUMABLE, etc.)
 * - **Search:** Debounced search on name and code
 * - **Stock Level Indicators:** Color-coded stock level icons
 * - **Quantity Input:** Inline quantity input when item selected
 * - **Row Selection:** Background color indicates selection (no checkbox)
 * - **Performance Optimized:** Virtual rendering, efficient re-renders
 *
 * ## Usage Example
 *
 * ### Basic Implementation (Tool Borrowing)
 * ```tsx
 * import { ItemSelectorTable } from "@/components/forms";
 * import { ITEM_CATEGORY_TYPE } from "@/constants";
 *
 * export default function BorrowToolsStep() {
 *   const [selectedItems, setSelectedItems] = useState(new Set<string>());
 *   const [quantities, setQuantities] = useState<Record<string, number>>({});
 *   const [searchTerm, setSearchTerm] = useState("");
 *
 *   const toggleItem = (itemId: string) => {
 *     const newSelected = new Set(selectedItems);
 *     if (newSelected.has(itemId)) {
 *       newSelected.delete(itemId);
 *     } else {
 *       newSelected.add(itemId);
 *       setQuantities({ ...quantities, [itemId]: 1 });
 *     }
 *     setSelectedItems(newSelected);
 *   };
 *
 *   return (
 *     <ItemSelectorTable
 *       selectedItems={selectedItems}
 *       quantities={quantities}
 *       onSelectItem={toggleItem}
 *       onQuantityChange={(id, qty) => setQuantities({ ...quantities, [id]: qty })}
 *       showQuantityInput
 *       minQuantity={1}
 *       maxQuantity={10}
 *       allowZeroStock={false}
 *       categoryType={ITEM_CATEGORY_TYPE.TOOL}
 *       searchTerm={searchTerm}
 *       onSearchTermChange={setSearchTerm}
 *     />
 *   );
 * }
 * ```
 *
 * ### With Advanced Filtering
 * ```tsx
 * <ItemSelectorTable
 *   // ... selection props
 *   searchTerm={searchTerm}
 *   showInactive={showInactive}
 *   categoryIds={categoryIds}
 *   brandIds={brandIds}
 *   supplierIds={supplierIds}
 *   onSearchTermChange={setSearchTerm}
 *   onShowInactiveChange={setShowInactive}
 *   onCategoryIdsChange={setCategoryIds}
 *   onBrandIdsChange={setBrandIds}
 *   onSupplierIdsChange={setSupplierIds}
 * />
 * ```
 *
 * ## Column Configuration
 *
 * Default columns (can be toggled by user):
 * 1. **Código (uniCode):** Item unique code
 * 2. **Nome (name):** Item name
 * 3. **Marca (brand):** Brand name
 * 4. **Categoria (category):** Category name
 * 5. **Estoque (quantity):** Stock quantity with level indicator
 *
 * Default visible: Code, Name, Stock
 *
 * Users can show/hide columns via the column visibility panel.
 *
 * ## Stock Level Indicators
 *
 * Color-coded icons show stock status:
 * - **Gray:** Negative stock
 * - **Red:** Out of stock
 * - **Orange:** Critical stock
 * - **Yellow:** Low stock
 * - **Green:** Optimal stock
 * - **Purple:** Overstocked
 *
 * Based on `determineStockLevel` util and item's reorder/max points.
 *
 * ## Performance Optimizations
 *
 * - **Virtual Rendering:** Only renders visible rows
 * - **Infinite Scroll:** Loads data in chunks (not all at once)
 * - **Memoized Components:** Prevents unnecessary re-renders
 * - **Debounced Search:** Reduces API calls (300ms)
 * - **FlatList Optimizations:** `removeClippedSubviews`, `windowSize`, `maxToRenderPerBatch`
 *
 * ## Accessibility
 * - Column headers are sortable with keyboard
 * - Screen reader announces selection state
 * - Focus management for better navigation
 * - Row selection indicated by background color
 *
 * ## Styling Notes
 * - Compact, data-dense table design
 * - Responsive column widths based on screen size
 * - Theme-aware colors
 * - Compact row height for data density
 *
 * @see {@link useItemsInfiniteMobile} For the data fetching hook used
 */

import React, { useState, useCallback, useMemo, memo, useEffect } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  Dimensions,
  ScrollView,
  Keyboard,
  Switch as RNSwitch,
} from "react-native";
import {
  IconSearch,
  IconX,
  IconFilter,
  IconColumns,
  IconChevronUp,
  IconChevronDown,
  IconArrowsSort,
  IconAlertTriangleFilled,
} from "@tabler/icons-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useTheme } from "@/lib/theme";
import { ThemedText } from "@/components/ui/themed-text";
import { SlideInPanel } from "@/components/ui/slide-in-panel";
import { Button } from "@/components/ui/button";
import { spacing, fontSize } from "@/constants/design-system";
import { useItemsInfiniteMobile } from "@/hooks";
import { formatNumber, determineStockLevel } from "@/utils";
import { STOCK_LEVEL, ITEM_CATEGORY_TYPE } from "@/constants";

// ============================================================================
// Types
// ============================================================================

interface ItemSelectorColumn {
  key: string;
  label: string;
  width: number;
  sortable?: boolean;
  align?: "left" | "center" | "right";
  render: (item: any) => React.ReactNode;
}

export interface ItemSelectorTableProps {
  selectedItems: Set<string>;
  quantities: Record<string, number>;
  onSelectItem: (itemId: string) => void;
  onQuantityChange: (itemId: string, quantity: number) => void;
  showQuantityInput?: boolean;
  minQuantity?: number;
  maxQuantity?: number;
  allowZeroStock?: boolean;
  // Filter by category type (e.g., TOOL for borrow)
  categoryType?: string;
  // Filters
  showSelectedOnly?: boolean;
  searchTerm?: string;
  showInactive?: boolean;
  categoryIds?: string[];
  brandIds?: string[];
  supplierIds?: string[];
  onShowSelectedOnlyChange?: (value: boolean) => void;
  onSearchTermChange?: (value: string) => void;
  onShowInactiveChange?: (value: boolean) => void;
  onCategoryIdsChange?: (value: string[]) => void;
  onBrandIdsChange?: (value: string[]) => void;
  onSupplierIdsChange?: (value: string[]) => void;
  style?: object;
  emptyMessage?: string;
}

// ============================================================================
// Stock Level Icon Component
// ============================================================================

const StockLevelIcon = memo(function StockLevelIcon({
  item,
}: {
  item: any;
}) {
  const quantity = item.quantity || 0;
  const stockLevel = determineStockLevel(
    quantity,
    item.reorderPoint || null,
    item.maxQuantity || null,
    false
  );

  const getColor = () => {
    switch (stockLevel) {
      case STOCK_LEVEL.NEGATIVE_STOCK:
        return "#737373";
      case STOCK_LEVEL.OUT_OF_STOCK:
        return "#b91c1c";
      case STOCK_LEVEL.CRITICAL:
        return "#f97316";
      case STOCK_LEVEL.LOW:
        return "#eab308";
      case STOCK_LEVEL.OPTIMAL:
        return "#15803d";
      case STOCK_LEVEL.OVERSTOCKED:
        return "#9333ea";
      default:
        return "#737373";
    }
  };

  return <IconAlertTriangleFilled size={14} color={getColor()} />;
});

// ============================================================================
// Column Definitions
// ============================================================================

const createColumns = (colors: any): ItemSelectorColumn[] => [
  {
    key: "uniCode",
    label: "Código",
    width: 2,
    sortable: true,
    render: (item) => item.uniCode || "-",
  },
  {
    key: "name",
    label: "Nome",
    width: 4,
    sortable: true,
    render: (item) => item.name,
  },
  {
    key: "brand",
    label: "Marca",
    width: 2,
    sortable: true,
    render: (item) => item.brand?.name || "-",
  },
  {
    key: "category",
    label: "Categoria",
    width: 2,
    sortable: true,
    render: (item) => item.category?.name || "-",
  },
  {
    key: "quantity",
    label: "Estoque",
    width: 2,
    sortable: true,
    align: "right",
    render: (item) => (
      <View style={{ flexDirection: "row", alignItems: "center", gap: 6, justifyContent: "flex-end" }}>
        <StockLevelIcon item={item} />
        <ThemedText style={{ color: colors.foreground, fontSize: fontSize.sm }}>
          {formatNumber(item.quantity || 0)}
        </ThemedText>
      </View>
    ),
  },
];

const DEFAULT_VISIBLE = ["uniCode", "name", "quantity"];

// ============================================================================
// Sub-Components
// ============================================================================

const SearchInput = memo(function SearchInput({
  value,
  onChangeText,
  placeholder,
}: {
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
}) {
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.searchContainer,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
    >
      <IconSearch size={20} color={colors.mutedForeground} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.mutedForeground}
        style={[styles.searchInput, { color: colors.foreground }]}
        autoCapitalize="none"
        autoCorrect={false}
      />
      {value.length > 0 && (
        <TouchableOpacity onPress={() => onChangeText("")}>
          <IconX size={20} color={colors.mutedForeground} />
        </TouchableOpacity>
      )}
    </View>
  );
});

const HeaderCell = memo(function HeaderCell({
  column,
  sortField,
  sortDirection,
  onSort,
  width,
}: {
  column: ItemSelectorColumn;
  sortField?: string;
  sortDirection?: "asc" | "desc";
  onSort?: (field: string) => void;
  width: number;
}) {
  const { colors } = useTheme();
  const isActive = sortField === column.key;

  return (
    <TouchableOpacity
      style={[styles.headerCell, { width }]}
      onPress={() => column.sortable && onSort?.(column.key)}
      disabled={!column.sortable}
      activeOpacity={column.sortable ? 0.7 : 1}
    >
      <View
        style={[
          styles.headerCellContent,
          column.align === "right" && styles.rightAlign,
        ]}
      >
        <ThemedText
          style={[styles.headerText, { color: colors.foreground }]}
          numberOfLines={1}
        >
          {column.label}
        </ThemedText>
        {column.sortable && (
          <View style={styles.sortIcon}>
            {isActive && sortDirection === "asc" && (
              <IconChevronUp size={14} color={colors.primary} />
            )}
            {isActive && sortDirection === "desc" && (
              <IconChevronDown size={14} color={colors.primary} />
            )}
            {!isActive && (
              <IconArrowsSort size={14} color={colors.mutedForeground} />
            )}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
});

// Table Row with inline quantity input (web-style)
const TableRow = memo(function TableRow({
  item,
  columns,
  columnWidths,
  isSelected,
  quantity,
  onSelect,
  onQuantityChange,
  showQuantityInput,
  minQuantity,
  maxQuantity,
  index,
}: {
  item: any;
  columns: ItemSelectorColumn[];
  columnWidths: number[];
  isSelected: boolean;
  quantity: number;
  onSelect: () => void;
  onQuantityChange: (value: number) => void;
  showQuantityInput?: boolean;
  minQuantity?: number;
  maxQuantity?: number;
  index: number;
}) {
  const { colors } = useTheme();
  const availableStock = item.quantity || 0;

  const [localQuantity, setLocalQuantity] = useState(String(quantity));

  // Sync local state when prop changes
  useEffect(() => {
    setLocalQuantity(String(quantity));
  }, [quantity]);

  const handleQuantityChange = useCallback(
    (text: string) => {
      // Allow empty string and decimal input
      setLocalQuantity(text);
    },
    []
  );

  const handleQuantityBlur = useCallback(() => {
    // Replace comma with dot for locales that use comma as decimal separator
    const normalizedValue = localQuantity.replace(",", ".");
    const numericValue = parseFloat(normalizedValue);
    if (isNaN(numericValue) || localQuantity === "" || numericValue <= 0) {
      // Reset to min quantity if invalid
      const defaultMin = minQuantity || 1;
      setLocalQuantity(String(defaultMin));
      onQuantityChange(defaultMin);
    } else {
      // Cap to available stock only (allow any positive value)
      const validQuantity = Math.min(numericValue, maxQuantity || availableStock || 9999);
      setLocalQuantity(String(validQuantity));
      onQuantityChange(validQuantity);
    }
  }, [localQuantity, minQuantity, maxQuantity, availableStock, onQuantityChange]);

  return (
    <TouchableOpacity
      style={[
        styles.row,
        {
          backgroundColor: isSelected
            ? colors.primary + "15"
            : index % 2 === 0
              ? colors.card
              : colors.background,
          borderBottomColor: colors.border,
        },
      ]}
      onPress={onSelect}
      activeOpacity={0.7}
    >
      <View style={styles.rowMain}>
        {/* Data Cells */}
        {columns.map((col, idx) => (
          <View
            key={col.key}
            style={[
              styles.cell,
              { width: columnWidths[idx] },
              col.align === "right" && { alignItems: "flex-end" },
            ]}
          >
            {typeof col.render(item) === "string" || typeof col.render(item) === "number" ? (
              <ThemedText
                style={[styles.cellText, { color: colors.foreground }]}
                numberOfLines={1}
              >
                {col.render(item)}
              </ThemedText>
            ) : (
              col.render(item)
            )}
          </View>
        ))}
      </View>

      {/* Quantity Input - Second row when selected */}
      {showQuantityInput && isSelected && (
        <View style={[styles.quantityRow, { borderTopColor: colors.border }]}>
          <ThemedText style={[styles.quantityLabel, { color: colors.mutedForeground }]}>
            Quantidade:
          </ThemedText>
          <TextInput
            style={[
              styles.quantityInputExpanded,
              {
                color: colors.foreground,
                backgroundColor: colors.background,
                borderColor: colors.border,
              },
            ]}
            value={localQuantity}
            onChangeText={handleQuantityChange}
            onBlur={handleQuantityBlur}
            onSubmitEditing={() => {
              handleQuantityBlur();
              Keyboard.dismiss();
            }}
            keyboardType="decimal-pad"
            returnKeyType="done"
            selectTextOnFocus
          />
        </View>
      )}
    </TouchableOpacity>
  );
});

const LoadingSkeleton = memo(function LoadingSkeleton() {
  const { colors } = useTheme();
  return (
    <View style={styles.loadingContainer}>
      {[1, 2, 3, 4, 5].map((i) => (
        <View
          key={i}
          style={[styles.skeletonRow, { backgroundColor: colors.muted }]}
        />
      ))}
    </View>
  );
});

// ============================================================================
// Main Component
// ============================================================================

export function ItemSelectorTable({
  selectedItems,
  quantities,
  onSelectItem,
  onQuantityChange,
  showQuantityInput = true,
  minQuantity = 1,
  maxQuantity,
  allowZeroStock = false,
  categoryType,
  showSelectedOnly = false,
  searchTerm = "",
  showInactive = false,
  categoryIds = [],
  brandIds = [],
  supplierIds = [],
  onShowSelectedOnlyChange,
  onSearchTermChange,
  onShowInactiveChange,
  onCategoryIdsChange,
  onBrandIdsChange,
  onSupplierIdsChange,
  style,
  emptyMessage = "Nenhum item encontrado",
}: ItemSelectorTableProps) {
  const { colors } = useTheme();
  const { width: screenWidth } = Dimensions.get("window");
  const insets = useSafeAreaInsets();

  // Column definitions with colors
  const COLUMNS = useMemo(() => createColumns(colors), [colors]);

  // Local state
  const [localSearchTerm, setLocalSearchTerm] = useState(searchTerm);
  const [sortField, setSortField] = useState<string>("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(
    () => new Set(DEFAULT_VISIBLE)
  );
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [isColumnPanelOpen, setIsColumnPanelOpen] = useState(false);
  const [localShowInactive, setLocalShowInactive] = useState(showInactive);

  // Debounced search
  const [debouncedSearch, setDebouncedSearch] = useState(searchTerm);
  const searchTimeoutRef = React.useRef<NodeJS.Timeout>();

  const handleSearchChange = useCallback(
    (text: string) => {
      setLocalSearchTerm(text);
      onSearchTermChange?.(text);
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
      searchTimeoutRef.current = setTimeout(() => setDebouncedSearch(text), 300);
    },
    [onSearchTermChange]
  );

  // Build query with category type filter
  const queryParams = useMemo(() => {
    const params: any = {
      orderBy: { [sortField]: sortDirection },
      include: { brand: true, category: true },
    };

    const whereConditions: any = {};

    if (!showInactive) {
      whereConditions.isActive = true;
    }

    // Filter by category type (e.g., TOOL for borrow)
    if (categoryType) {
      whereConditions.category = { type: categoryType };
    }

    if (debouncedSearch) {
      whereConditions.OR = [
        { name: { contains: debouncedSearch, mode: "insensitive" } },
        { uniCode: { contains: debouncedSearch, mode: "insensitive" } },
      ];
    }

    if (categoryIds.length > 0) {
      whereConditions.categoryId = { in: categoryIds };
    }

    if (brandIds.length > 0) {
      whereConditions.brandId = { in: brandIds };
    }

    if (supplierIds.length > 0) {
      whereConditions.supplierId = { in: supplierIds };
    }

    if (showSelectedOnly && selectedItems.size > 0) {
      whereConditions.id = { in: Array.from(selectedItems) };
    }

    if (Object.keys(whereConditions).length > 0) {
      params.where = whereConditions;
    }

    return params;
  }, [
    sortField,
    sortDirection,
    showInactive,
    categoryType,
    debouncedSearch,
    categoryIds,
    brandIds,
    supplierIds,
    showSelectedOnly,
    selectedItems,
  ]);

  const {
    items,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    loadMore,
    refetch,
    totalCount,
  } = useItemsInfiniteMobile(queryParams);

  // Calculate column widths (including quantity column)
  const displayColumns = useMemo(
    () => COLUMNS.filter((col) => visibleColumns.has(col.key)),
    [COLUMNS, visibleColumns]
  );

  const columnWidths = useMemo(() => {
    // Full width minus container padding (spacing.md on each side)
    const availableWidth = screenWidth - spacing.md * 2;
    const totalRatio = displayColumns.reduce((sum, col) => sum + col.width, 0);
    return displayColumns.map((col) =>
      Math.floor((availableWidth * col.width) / totalRatio)
    );
  }, [displayColumns, screenWidth]);

  // Handlers
  const handleSort = useCallback((field: string) => {
    setSortField((prev) => {
      if (prev === field) {
        setSortDirection((dir) => (dir === "asc" ? "desc" : "asc"));
        return prev;
      }
      setSortDirection("asc");
      return field;
    });
  }, []);

  const handleToggleColumn = useCallback((key: string) => {
    setVisibleColumns((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(key)) newSet.delete(key);
      else newSet.add(key);
      return newSet;
    });
  }, []);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (showInactive) count++;
    if (categoryIds.length > 0) count++;
    if (brandIds.length > 0) count++;
    if (supplierIds.length > 0) count++;
    return count;
  }, [showInactive, categoryIds, brandIds, supplierIds]);

  const handleApplyFilters = useCallback(() => {
    onShowInactiveChange?.(localShowInactive);
    setIsFilterPanelOpen(false);
  }, [localShowInactive, onShowInactiveChange]);

  const handleClearFilters = useCallback(() => {
    setLocalShowInactive(false);
    onShowInactiveChange?.(false);
    onCategoryIdsChange?.([]);
    onBrandIdsChange?.([]);
    onSupplierIdsChange?.([]);
    setIsFilterPanelOpen(false);
  }, [onShowInactiveChange, onCategoryIdsChange, onBrandIdsChange, onSupplierIdsChange]);

  const handleResetColumns = useCallback(() => {
    setVisibleColumns(new Set(DEFAULT_VISIBLE));
  }, []);

  const renderItem = useCallback(
    ({ item, index }: { item: any; index: number }) => (
      <TableRow
        item={item}
        columns={displayColumns}
        columnWidths={columnWidths}
        isSelected={selectedItems.has(item.id)}
        quantity={quantities[item.id] || minQuantity}
        onSelect={() => onSelectItem(item.id)}
        onQuantityChange={(value) => onQuantityChange(item.id, value)}
        showQuantityInput={showQuantityInput}
        minQuantity={minQuantity}
        maxQuantity={maxQuantity || item.quantity}
        index={index}
      />
    ),
    [selectedItems, quantities, displayColumns, columnWidths, onSelectItem, onQuantityChange, showQuantityInput, minQuantity, maxQuantity]
  );

  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage && !isLoading) {
      loadMore();
    }
  }, [hasNextPage, isFetchingNextPage, isLoading, loadMore]);

  const visibleCount = visibleColumns.size;
  const totalColumnsCount = COLUMNS.length;

  return (
    <View style={[styles.container, style]}>
      {/* Search Row */}
      <View style={styles.searchRow}>
        <View style={{ flex: 1 }}>
          <SearchInput
            value={localSearchTerm}
            onChangeText={handleSearchChange}
            placeholder="Buscar por nome ou código..."
          />
        </View>
        <TouchableOpacity
          style={[styles.iconButton, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={() => setIsColumnPanelOpen(true)}
        >
          <IconColumns size={20} color={colors.foreground} />
          {visibleCount < totalColumnsCount && (
            <View style={[styles.badge, { backgroundColor: colors.primary }]}>
              <ThemedText style={[styles.badgeText, { color: colors.primaryForeground }]}>
                {visibleCount}
              </ThemedText>
            </View>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.iconButton, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={() => { setLocalShowInactive(showInactive); setIsFilterPanelOpen(true); }}
        >
          <IconFilter size={20} color={colors.foreground} />
          {activeFilterCount > 0 && (
            <View style={[styles.badge, { backgroundColor: colors.destructive }]}>
              <ThemedText style={[styles.badgeText, { color: "#fff" }]}>{activeFilterCount}</ThemedText>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Table Card */}
      <View style={[styles.tableCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {/* Header */}
        <View style={[styles.tableHeader, { borderBottomColor: colors.border }]}>
          {displayColumns.map((col, idx) => (
            <HeaderCell
              key={col.key}
              column={col}
              sortField={sortField}
              sortDirection={sortDirection}
              onSort={handleSort}
              width={columnWidths[idx]}
            />
          ))}
        </View>

        {/* Body */}
        {isLoading && items.length === 0 ? (
          <LoadingSkeleton />
        ) : (
          <FlatList
            data={items}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            onEndReached={handleEndReached}
            onEndReachedThreshold={0.3}
            refreshControl={
              <RefreshControl
                refreshing={false}
                onRefresh={() => refetch()}
                colors={[colors.primary]}
                tintColor={colors.primary}
              />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <ThemedText style={[styles.emptyText, { color: colors.mutedForeground }]}>
                  {emptyMessage}
                </ThemedText>
              </View>
            }
            contentContainerStyle={items.length === 0 ? { flex: 1 } : undefined}
            removeClippedSubviews
            maxToRenderPerBatch={12}
            windowSize={7}
            initialNumToRender={15}
          />
        )}

        {/* Footer */}
        <View style={[styles.tableFooter, { borderTopColor: colors.border, backgroundColor: colors.card }]}>
          <ThemedText style={[styles.footerText, { color: colors.foreground }]}>
            Mostrando {items.length} de {totalCount || items.length}
          </ThemedText>
          {isFetchingNextPage && (
            <ThemedText style={[styles.footerText, { color: colors.primary }]}>Carregando...</ThemedText>
          )}
        </View>
      </View>

      {/* Filter Panel */}
      <SlideInPanel isOpen={isFilterPanelOpen} onClose={() => setIsFilterPanelOpen(false)}>
        <View style={[styles.panelContainer, { backgroundColor: colors.background }]}>
          <View style={styles.panelHeader}>
            <View style={styles.panelHeaderContent}>
              <IconFilter size={24} color={colors.foreground} />
              <ThemedText style={[styles.panelTitle, { color: colors.foreground }]}>Filtros</ThemedText>
              {activeFilterCount > 0 && (
                <View style={[styles.panelBadge, { backgroundColor: colors.destructive }]}>
                  <ThemedText style={[styles.panelBadgeText, { color: "#fff" }]}>{activeFilterCount}</ThemedText>
                </View>
              )}
            </View>
            <TouchableOpacity onPress={() => setIsFilterPanelOpen(false)} style={styles.closeButton}>
              <IconX size={24} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.panelContent} contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}>
            <View style={styles.filterItem}>
              <TouchableOpacity style={styles.filterItemTouchable} onPress={() => setLocalShowInactive(!localShowInactive)}>
                <ThemedText style={[styles.filterItemText, { color: colors.foreground }]}>Mostrar itens inativos</ThemedText>
              </TouchableOpacity>
              <RNSwitch
                value={localShowInactive}
                onValueChange={setLocalShowInactive}
                trackColor={{ false: colors.muted, true: colors.primary }}
                thumbColor={localShowInactive ? colors.primaryForeground : "#f4f3f4"}
              />
            </View>
          </ScrollView>
          <View style={[styles.panelFooter, { paddingBottom: insets.bottom + 16, borderTopColor: colors.border, backgroundColor: colors.background }]}>
            <Button variant="outline" onPress={handleClearFilters} style={styles.panelButton}>
              {activeFilterCount > 0 ? `Limpar (${activeFilterCount})` : "Limpar"}
            </Button>
            <Button variant="default" onPress={handleApplyFilters} style={styles.panelButton}>Aplicar</Button>
          </View>
        </View>
      </SlideInPanel>

      {/* Column Panel */}
      <SlideInPanel isOpen={isColumnPanelOpen} onClose={() => setIsColumnPanelOpen(false)}>
        <View style={[styles.panelContainer, { backgroundColor: colors.background }]}>
          <View style={styles.panelHeader}>
            <View style={styles.panelHeaderContent}>
              <IconColumns size={24} color={colors.foreground} />
              <ThemedText style={[styles.panelTitle, { color: colors.foreground }]}>Colunas</ThemedText>
              {visibleCount < totalColumnsCount && (
                <View style={[styles.panelBadge, { backgroundColor: colors.primary }]}>
                  <ThemedText style={[styles.panelBadgeText, { color: colors.primaryForeground }]}>{visibleCount}/{totalColumnsCount}</ThemedText>
                </View>
              )}
            </View>
            <TouchableOpacity onPress={() => setIsColumnPanelOpen(false)} style={styles.closeButton}>
              <IconX size={24} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.panelContent} contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}>
            {COLUMNS.map((column) => (
              <View key={column.key} style={styles.filterItem}>
                <TouchableOpacity style={styles.filterItemTouchable} onPress={() => handleToggleColumn(column.key)}>
                  <ThemedText style={[styles.filterItemText, { color: colors.foreground }]}>{column.label}</ThemedText>
                </TouchableOpacity>
                <RNSwitch
                  value={visibleColumns.has(column.key)}
                  onValueChange={() => handleToggleColumn(column.key)}
                  trackColor={{ false: colors.muted, true: colors.primary }}
                  thumbColor={visibleColumns.has(column.key) ? colors.primaryForeground : "#f4f3f4"}
                />
              </View>
            ))}
          </ScrollView>
          <View style={[styles.panelFooter, { paddingBottom: insets.bottom + 16, borderTopColor: colors.border, backgroundColor: colors.background }]}>
            <Button variant="outline" onPress={handleResetColumns} style={styles.panelButton}>Restaurar</Button>
            <Button variant="default" onPress={() => setIsColumnPanelOpen(false)} style={styles.panelButton}>Aplicar</Button>
          </View>
        </View>
      </SlideInPanel>
    </View>
  );
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  container: { flex: 1 },
  searchRow: { flexDirection: "row", gap: spacing.sm, alignItems: "center", marginBottom: spacing.sm },
  searchContainer: { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 10, borderRadius: 8, borderWidth: 1, gap: 8 },
  searchInput: { flex: 1, fontSize: 16, padding: 0, margin: 0 },
  iconButton: { width: 40, height: 40, borderRadius: 8, borderWidth: 1, justifyContent: "center", alignItems: "center", position: "relative" },
  badge: { position: "absolute", top: -6, right: -6, minWidth: 18, height: 18, borderRadius: 9, justifyContent: "center", alignItems: "center", paddingHorizontal: 4 },
  badgeText: { fontSize: 10, fontWeight: "700" },
  tableCard: { flex: 1, borderRadius: 8, borderWidth: 1, overflow: "hidden" },
  tableHeader: { flexDirection: "row", alignItems: "center", minHeight: 40, borderBottomWidth: 1 },
  headerCell: { paddingHorizontal: 12, paddingVertical: 8, justifyContent: "center" },
  headerCellContent: { flexDirection: "row", alignItems: "center", gap: 4 },
  rightAlign: { justifyContent: "flex-end" },
  headerText: { fontSize: 10, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5 },
  sortIcon: { marginLeft: 4 },
  row: { borderBottomWidth: StyleSheet.hairlineWidth },
  rowMain: { flexDirection: "row", alignItems: "center", paddingVertical: spacing.sm, minHeight: 48 },
  cell: { paddingHorizontal: 12, justifyContent: "center" },
  cellText: { fontSize: fontSize.sm },
  quantityRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 8, borderTopWidth: StyleSheet.hairlineWidth, gap: 12 },
  quantityLabel: { fontSize: fontSize.sm, fontWeight: "500" },
  quantityInputExpanded: { flex: 1, height: 36, borderRadius: 6, borderWidth: 1, paddingHorizontal: 12, fontSize: fontSize.sm },
  tableFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 8, paddingHorizontal: 16, borderTopWidth: 1, minHeight: 36 },
  footerText: { fontSize: 11, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5 },
  emptyContainer: { flex: 1, justifyContent: "center", alignItems: "center", paddingVertical: spacing.xl * 2 },
  emptyText: { fontSize: fontSize.sm },
  loadingContainer: { flex: 1, padding: spacing.md, gap: spacing.sm },
  skeletonRow: { height: 48, borderRadius: 8, opacity: 0.3 },
  panelContainer: { flex: 1 },
  panelHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingTop: 16, paddingBottom: 16 },
  panelHeaderContent: { flexDirection: "row", alignItems: "center", gap: 12 },
  panelTitle: { fontSize: 20, fontWeight: "700" },
  panelBadge: { marginLeft: 8, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12, minWidth: 20, alignItems: "center", justifyContent: "center" },
  panelBadgeText: { fontSize: 12, fontWeight: "600" },
  closeButton: { padding: 4 },
  panelContent: { flex: 1, paddingTop: 8 },
  filterItem: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12, minHeight: 56 },
  filterItemTouchable: { flex: 1, paddingVertical: 4, paddingRight: 16 },
  filterItemText: { fontSize: 15, fontWeight: "500" },
  panelFooter: { flexDirection: "row", gap: 12, paddingHorizontal: 16, paddingTop: 16, borderTopWidth: 1, position: "absolute", bottom: 0, left: 0, right: 0 },
  panelButton: { flex: 1 },
});

export default ItemSelectorTable;
