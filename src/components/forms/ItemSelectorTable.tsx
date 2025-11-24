import React, { useCallback, useMemo, useState, useEffect } from "react";
import {
  View,
  FlatList,
  StyleSheet,
  RefreshControl,
  useWindowDimensions,
  Pressable,
} from "react-native";
import { IconSearch, IconFilter } from "@tabler/icons-react-native";

import { useTheme } from "@/lib/theme";
import { spacing, borderRadius } from "@/constants/design-system";
import { useItems } from "@/hooks";
import type { Item } from "@/types";

import { Text } from "@/components/ui/text";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { Switch } from "@/components/ui/switch";
import { CurrencyInput } from "@/components/ui/currency-input";
import { NumberInput } from "@/components/ui/number-input";
import { Pagination } from "@/components/ui/pagination";

import { ItemSelectorFilters } from "./ItemSelectorFilters";

/**
 * ItemSelectorTable
 *
 * A standardized, responsive item selection component for multi-step forms.
 * Used across Borrow, Activity, Order, and External Withdrawal forms.
 *
 * Features:
 * - Checkbox-based multi-select
 * - Search with debouncing (300ms)
 * - Advanced filtering (categories, brands, suppliers, inactive)
 * - Pagination support
 * - Quantity and price inputs (configurable)
 * - Show selected only toggle
 * - Select all current page
 * - Responsive: Card layout on mobile, denser table on tablet
 *
 * Usage:
 * ```tsx
 * <ItemSelectorTable
 *   selectedItems={selectedItems}
 *   quantities={quantities}
 *   prices={prices}
 *   onSelectItem={toggleItemSelection}
 *   onQuantityChange={setItemQuantity}
 *   onPriceChange={setItemPrice}
 *   showQuantityInput
 *   showPriceInput={withdrawalType === "CHARGEABLE"}
 * />
 * ```
 */

export interface ItemSelectorTableProps {
  /** Set of selected item IDs */
  selectedItems: Set<string>;
  /** Quantity per item (itemId -> quantity) */
  quantities: Record<string, number>;
  /** Price per item (itemId -> price) */
  prices?: Record<string, number>;
  /** Called when an item is selected/deselected */
  onSelectItem: (itemId: string, quantity?: number, price?: number) => void;
  /** Called when quantity changes */
  onQuantityChange?: (itemId: string, quantity: number) => void;
  /** Called when price changes */
  onPriceChange?: (itemId: string, price: number) => void;
  /** Whether to show quantity input */
  showQuantityInput?: boolean;
  /** Whether to show price input */
  showPriceInput?: boolean;
  /** Minimum quantity allowed */
  minQuantity?: number;
  /** Maximum quantity allowed */
  maxQuantity?: number;
  /** Decimal places for quantity */
  quantityDecimals?: number;

  // Filter state (controlled)
  showSelectedOnly?: boolean;
  searchTerm?: string;
  showInactive?: boolean;
  categoryIds?: string[];
  brandIds?: string[];
  supplierIds?: string[];

  // Filter callbacks
  onShowSelectedOnlyChange?: (value: boolean) => void;
  onSearchTermChange?: (term: string) => void;
  onShowInactiveChange?: (value: boolean) => void;
  onCategoryIdsChange?: (ids: string[]) => void;
  onBrandIdsChange?: (ids: string[]) => void;
  onSupplierIdsChange?: (ids: string[]) => void;

  // Pagination state (controlled)
  page?: number;
  pageSize?: number;
  totalRecords?: number;

  // Pagination callbacks
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  onTotalRecordsChange?: (total: number) => void;

  // Additional options
  /** Additional query parameters for items */
  additionalQueryParams?: Record<string, unknown>;
  /** Empty state message */
  emptyMessage?: string;
  /** Loading state message */
  loadingMessage?: string;
  /** Whether to allow selecting items with zero stock */
  allowZeroStock?: boolean;
  /** Custom item renderer */
  renderItemExtra?: (item: Item, isSelected: boolean) => React.ReactNode;
  /** Custom stock display */
  renderStock?: (item: Item) => React.ReactNode;
  /** Style override for container */
  style?: object;
}

// Tablet breakpoint
const TABLET_BREAKPOINT = 768;

export function ItemSelectorTable({
  selectedItems,
  quantities,
  prices = {},
  onSelectItem,
  onQuantityChange,
  onPriceChange,
  showQuantityInput = true,
  showPriceInput = false,
  minQuantity = 0.01,
  maxQuantity = 999999,
  quantityDecimals = 2,
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
  page = 1,
  pageSize = 20,
  totalRecords = 0,
  onPageChange,
  onPageSizeChange,
  onTotalRecordsChange,
  additionalQueryParams = {},
  emptyMessage = "Nenhum item encontrado",
  loadingMessage = "Carregando...",
  allowZeroStock = true,
  renderItemExtra,
  renderStock,
  style,
}: ItemSelectorTableProps) {
  const { colors, isDark } = useTheme();
  const { width } = useWindowDimensions();
  const isTablet = width >= TABLET_BREAKPOINT;

  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [localSearchTerm, setLocalSearchTerm] = useState(searchTerm);
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);

  // Sync local search with prop
  useEffect(() => {
    setLocalSearchTerm(searchTerm);
  }, [searchTerm]);

  // Build query parameters
  const queryParams = useMemo(
    () => ({
      searchingFor: showSelectedOnly ? undefined : searchTerm || undefined,
      isActive: showSelectedOnly ? undefined : !showInactive,
      where: {
        ...(showSelectedOnly && selectedItems.size > 0
          ? { id: { in: Array.from(selectedItems) } }
          : {
              ...(categoryIds.length > 0 && { categoryId: { in: categoryIds } }),
              ...(brandIds.length > 0 && { brandId: { in: brandIds } }),
              ...(supplierIds.length > 0 && { supplierId: { in: supplierIds } }),
            }),
      },
      page,
      limit: pageSize,
      include: {
        brand: true,
        category: true,
        supplier: true,
        prices: {
          orderBy: { createdAt: "desc" as const },
          take: 1,
        },
      },
      ...additionalQueryParams,
    }),
    [
      searchTerm,
      showInactive,
      categoryIds,
      brandIds,
      supplierIds,
      showSelectedOnly,
      selectedItems,
      page,
      pageSize,
      additionalQueryParams,
    ],
  );

  // Fetch items
  const { data: itemsResponse, isLoading, refetch } = useItems(queryParams);

  const items = useMemo(() => itemsResponse?.data || [], [itemsResponse]);
  const apiTotalRecords = itemsResponse?.meta?.totalRecords || 0;

  // Update total records when it changes
  useEffect(() => {
    if (apiTotalRecords > 0 && onTotalRecordsChange) {
      onTotalRecordsChange(apiTotalRecords);
    }
  }, [apiTotalRecords, onTotalRecordsChange]);

  // Count active filters
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (showInactive) count++;
    if (categoryIds.length > 0) count++;
    if (brandIds.length > 0) count++;
    if (supplierIds.length > 0) count++;
    return count;
  }, [showInactive, categoryIds, brandIds, supplierIds]);

  // Handle search with debouncing
  const handleSearch = useCallback(
    (value: string) => {
      setLocalSearchTerm(value);

      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }

      const timeout = setTimeout(() => {
        onSearchTermChange?.(value);
      }, 300);

      setSearchTimeout(timeout);
    },
    [onSearchTermChange, searchTimeout],
  );

  // Handle select all (current page)
  const handleSelectAll = useCallback(() => {
    const allSelected = items.every((item: Item) => selectedItems.has(item.id));

    if (allSelected) {
      // Deselect all current page items
      items.forEach((item: Item) => onSelectItem(item.id));
    } else {
      // Select all current page items
      items.forEach((item: Item) => {
        if (!selectedItems.has(item.id)) {
          const defaultPrice = item.prices?.[0]?.value || 0;
          onSelectItem(item.id, 1, defaultPrice);
        }
      });
    }
  }, [items, selectedItems, onSelectItem]);

  // Clear all filters
  const handleClearFilters = useCallback(() => {
    setLocalSearchTerm("");
    onSearchTermChange?.("");
    onShowInactiveChange?.(false);
    onCategoryIdsChange?.([]);
    onBrandIdsChange?.([]);
    onSupplierIdsChange?.([]);
    onPageChange?.(1);
  }, [
    onSearchTermChange,
    onShowInactiveChange,
    onCategoryIdsChange,
    onBrandIdsChange,
    onSupplierIdsChange,
    onPageChange,
  ]);

  // Get stock color
  const getStockColor = useCallback(
    (quantity: number) => {
      if (quantity <= 0) return colors.destructive;
      if (quantity < 10) return "#f59e0b"; // Warning color
      return colors.primary;
    },
    [colors],
  );

  // Render item
  const renderItem = useCallback(
    ({ item, index }: { item: Item; index: number }) => {
      const isSelected = selectedItems.has(item.id);
      const quantity = quantities[item.id] || 1;
      const price = prices[item.id] || item.prices?.[0]?.value || 0;
      const canSelect = allowZeroStock || (item.quantity ?? 0) > 0;
      const stockColor = getStockColor(item.quantity ?? 0);

      return (
        <Pressable
          onPress={() => {
            if (canSelect) {
              const defaultPrice = item.prices?.[0]?.value || 0;
              onSelectItem(item.id, 1, defaultPrice);
            }
          }}
          disabled={!canSelect}
          style={({ pressed }) => [
            styles.itemCard,
            {
              backgroundColor: isSelected
                ? isDark
                  ? colors.primary + "20"
                  : colors.primary + "10"
                : index % 2 === 0
                ? colors.background
                : colors.card,
              borderColor: isSelected ? colors.primary : colors.border,
              opacity: canSelect ? (pressed ? 0.7 : 1) : 0.5,
            },
          ]}
        >
          <View style={styles.itemRow}>
            {/* Checkbox */}
            <Checkbox
              checked={isSelected}
              onCheckedChange={() => {
                if (canSelect) {
                  const defaultPrice = item.prices?.[0]?.value || 0;
                  onSelectItem(item.id, 1, defaultPrice);
                }
              }}
              disabled={!canSelect}
            />

            {/* Item Info */}
            <View style={styles.itemInfo}>
              <Text
                style={[styles.itemName, { color: colors.foreground }]}
                numberOfLines={2}
              >
                {item.uniCode ? `${item.uniCode} - ` : ""}
                {item.name}
              </Text>
              <View style={styles.itemMeta}>
                {item.brand && (
                  <Text style={[styles.itemMetaText, { color: colors.mutedForeground }]}>
                    {item.brand.name}
                  </Text>
                )}
                {item.category && (
                  <Text style={[styles.itemMetaText, { color: colors.mutedForeground }]}>
                    {item.category.name}
                  </Text>
                )}
              </View>
              <View style={styles.itemStock}>
                {renderStock ? (
                  renderStock(item)
                ) : (
                  <Text style={[styles.itemStockText, { color: stockColor }]}>
                    Estoque: {item.quantity ?? 0}
                  </Text>
                )}
                {item.prices?.[0]?.value !== undefined && (
                  <Text style={[styles.itemPriceText, { color: colors.primary }]}>
                    R$ {item.prices[0].value.toFixed(2)}
                  </Text>
                )}
              </View>
              {renderItemExtra?.(item, isSelected)}
            </View>
          </View>

          {/* Quantity and Price inputs (when selected) */}
          {isSelected && (showQuantityInput || showPriceInput) && (
            <View
              style={[
                styles.itemInputs,
                { borderTopColor: colors.border },
                isTablet && styles.itemInputsTablet,
              ]}
            >
              {showQuantityInput && (
                <View style={[styles.inputWrapper, isTablet && styles.inputWrapperTablet]}>
                  <Text style={[styles.inputLabel, { color: colors.mutedForeground }]}>
                    Quantidade
                  </Text>
                  <NumberInput
                    value={quantity}
                    onChangeValue={(value) => onQuantityChange?.(item.id, value)}
                    min={minQuantity}
                    max={maxQuantity}
                    decimals={quantityDecimals}
                    style={styles.input}
                  />
                </View>
              )}

              {showPriceInput && onPriceChange && (
                <View style={[styles.inputWrapper, isTablet && styles.inputWrapperTablet]}>
                  <Text style={[styles.inputLabel, { color: colors.mutedForeground }]}>
                    Pre\u00e7o Unit.
                  </Text>
                  <CurrencyInput
                    value={price}
                    onChangeValue={(value) => onPriceChange(item.id, value)}
                    style={styles.input}
                  />
                </View>
              )}
            </View>
          )}
        </Pressable>
      );
    },
    [
      selectedItems,
      quantities,
      prices,
      showQuantityInput,
      showPriceInput,
      minQuantity,
      maxQuantity,
      quantityDecimals,
      onSelectItem,
      onQuantityChange,
      onPriceChange,
      allowZeroStock,
      renderItemExtra,
      renderStock,
      getStockColor,
      colors,
      isDark,
      isTablet,
    ],
  );

  const totalPages = Math.ceil(apiTotalRecords / pageSize);
  const allCurrentPageSelected =
    items.length > 0 && items.every((item: Item) => selectedItems.has(item.id));
  const someCurrentPageSelected =
    items.some((item: Item) => selectedItems.has(item.id)) && !allCurrentPageSelected;

  return (
    <View style={[styles.container, style]}>
      {/* Search and Filters */}
      <View style={[styles.searchContainer, isTablet && styles.searchContainerTablet]}>
        <View style={styles.searchInputContainer}>
          <IconSearch
            size={18}
            color={colors.mutedForeground}
            style={styles.searchIcon}
          />
          <Input
            value={localSearchTerm}
            onChangeText={handleSearch}
            placeholder="Pesquisar itens..."
            style={styles.searchInput}
          />
        </View>

        <Button
          variant="outline"
          size="icon"
          onPress={() => setIsFilterModalOpen(true)}
        >
          <IconFilter size={18} />
          {activeFilterCount > 0 && (
            <Badge variant="destructive" style={styles.filterBadge}>
              {activeFilterCount}
            </Badge>
          )}
        </Button>
      </View>

      {/* Show Selected Toggle */}
      {selectedItems.size > 0 && (
        <View style={styles.toggleContainer}>
          <Text style={[styles.toggleLabel, { color: colors.foreground }]}>
            Mostrar apenas selecionados ({selectedItems.size})
          </Text>
          <Switch
            checked={showSelectedOnly}
            onCheckedChange={onShowSelectedOnlyChange}
          />
        </View>
      )}

      {/* Active Filters */}
      {activeFilterCount > 0 && !showSelectedOnly && (
        <View style={styles.activeFilters}>
          <View style={styles.activeFiltersHeader}>
            <Text style={[styles.activeFiltersTitle, { color: colors.foreground }]}>
              Filtros ativos ({activeFilterCount})
            </Text>
            <Button variant="ghost" size="sm" onPress={handleClearFilters}>
              Limpar todos
            </Button>
          </View>
          <View style={styles.filterChips}>
            {showInactive && (
              <Chip
                label="Desativados"
                onRemove={() => onShowInactiveChange?.(false)}
              />
            )}
            {categoryIds.length > 0 && (
              <Chip
                label={`${categoryIds.length} categoria(s)`}
                onRemove={() => onCategoryIdsChange?.([])}
              />
            )}
            {brandIds.length > 0 && (
              <Chip
                label={`${brandIds.length} marca(s)`}
                onRemove={() => onBrandIdsChange?.([])}
              />
            )}
            {supplierIds.length > 0 && (
              <Chip
                label={`${supplierIds.length} fornecedor(es)`}
                onRemove={() => onSupplierIdsChange?.([])}
              />
            )}
          </View>
        </View>
      )}

      {/* Select All */}
      {items.length > 0 && !showSelectedOnly && (
        <View style={styles.selectAllContainer}>
          <Checkbox
            checked={allCurrentPageSelected}
            indeterminate={someCurrentPageSelected}
            onCheckedChange={handleSelectAll}
          />
          <Text style={[styles.selectAllText, { color: colors.foreground }]}>
            Selecionar todos ({items.length} itens)
          </Text>
        </View>
      )}

      {/* Items List */}
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              {isLoading ? loadingMessage : emptyMessage}
            </Text>
          </View>
        )}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={refetch}
            tintColor={colors.primary}
          />
        }
        contentContainerStyle={[
          styles.listContent,
          isTablet && styles.listContentTablet,
        ]}
        showsVerticalScrollIndicator={false}
        // Performance optimizations
        removeClippedSubviews
        maxToRenderPerBatch={10}
        windowSize={5}
        initialNumToRender={10}
      />

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          onPageChange={onPageChange}
          style={styles.pagination}
        />
      )}

      {/* Filter Modal */}
      <ItemSelectorFilters
        open={isFilterModalOpen}
        onOpenChange={setIsFilterModalOpen}
        showInactive={showInactive}
        categoryIds={categoryIds}
        brandIds={brandIds}
        supplierIds={supplierIds}
        onShowInactiveChange={onShowInactiveChange}
        onCategoryIdsChange={onCategoryIdsChange}
        onBrandIdsChange={onBrandIdsChange}
        onSupplierIdsChange={onSupplierIdsChange}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    flexDirection: "row",
    gap: spacing.sm,
    padding: spacing.md,
    paddingBottom: spacing.sm,
  },
  searchContainerTablet: {
    maxWidth: 600,
  },
  searchInputContainer: {
    flex: 1,
    position: "relative",
  },
  searchIcon: {
    position: "absolute",
    left: spacing.sm,
    top: "50%",
    transform: [{ translateY: -9 }],
    zIndex: 1,
  },
  searchInput: {
    paddingLeft: spacing.xl + spacing.sm,
  },
  toggleContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  toggleLabel: {
    fontSize: 14,
    fontWeight: "500",
  },
  activeFilters: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  activeFiltersHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
  },
  activeFiltersTitle: {
    fontSize: 13,
    fontWeight: "600",
  },
  filterChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
  },
  filterBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: borderRadius.full,
  },
  selectAllContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  selectAllText: {
    fontSize: 14,
    fontWeight: "500",
  },
  listContent: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  listContentTablet: {
    paddingHorizontal: spacing.lg,
  },
  itemCard: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
  },
  itemRow: {
    flexDirection: "row",
    gap: spacing.md,
  },
  itemInfo: {
    flex: 1,
    gap: spacing.xs,
  },
  itemName: {
    fontSize: 15,
    fontWeight: "600",
  },
  itemMeta: {
    flexDirection: "row",
    gap: spacing.md,
    flexWrap: "wrap",
  },
  itemMetaText: {
    fontSize: 13,
  },
  itemStock: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  itemStockText: {
    fontSize: 13,
    fontWeight: "500",
  },
  itemPriceText: {
    fontSize: 13,
    fontWeight: "600",
  },
  itemInputs: {
    flexDirection: "row",
    gap: spacing.md,
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
  },
  itemInputsTablet: {
    maxWidth: 400,
  },
  inputWrapper: {
    flex: 1,
    gap: spacing.xs,
  },
  inputWrapperTablet: {
    maxWidth: 180,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: "500",
  },
  input: {
    height: 36,
  },
  emptyContainer: {
    padding: spacing.xl,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 14,
  },
  pagination: {
    padding: spacing.md,
  },
});

export default ItemSelectorTable;
