import React, { useCallback, useMemo, useState } from "react";
import { View, FlatList, StyleSheet, RefreshControl } from "react-native";
import { IconSearch, IconFilter, IconX } from "@tabler/icons-react-native";

import { useTheme } from "@/lib/theme";
import { spacing, borderRadius } from "@/constants/design-system";
import { EXTERNAL_WITHDRAWAL_TYPE } from "@/constants";
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

import { ExternalWithdrawalItemCard } from "./external-withdrawal-item-card";
import { ExternalWithdrawalFormFilters } from "./external-withdrawal-form-filters";

interface ExternalWithdrawalItemSelectorProps {
  selectedItems: Set<string>;
  quantities: Record<string, number>;
  prices: Record<string, number>;
  type: EXTERNAL_WITHDRAWAL_TYPE;
  showSelectedOnly?: boolean;
  searchTerm?: string;
  showInactive?: boolean;
  categoryIds?: string[];
  brandIds?: string[];
  supplierIds?: string[];
  page?: number;
  pageSize?: number;
  totalRecords?: number;
  onSelectItem: (itemId: string, quantity?: number, price?: number) => void;
  onQuantityChange: (itemId: string, quantity: number) => void;
  onPriceChange?: (itemId: string, price: number) => void;
  onShowSelectedOnlyChange?: (value: boolean) => void;
  onSearchTermChange?: (term: string) => void;
  onShowInactiveChange?: (value: boolean) => void;
  onCategoryIdsChange?: (ids: string[]) => void;
  onBrandIdsChange?: (ids: string[]) => void;
  onSupplierIdsChange?: (ids: string[]) => void;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  onTotalRecordsChange?: (total: number) => void;
}

export function ExternalWithdrawalItemSelector({
  selectedItems,
  quantities,
  prices,
  type,
  showSelectedOnly = false,
  searchTerm = "",
  showInactive = false,
  categoryIds = [],
  brandIds = [],
  supplierIds = [],
  page = 1,
  pageSize = 20,
  totalRecords = 0,
  onSelectItem,
  onQuantityChange,
  onPriceChange,
  onShowSelectedOnlyChange,
  onSearchTermChange,
  onShowInactiveChange,
  onCategoryIdsChange,
  onBrandIdsChange,
  onSupplierIdsChange,
  onPageChange,
  onPageSizeChange,
  onTotalRecordsChange,
}: ExternalWithdrawalItemSelectorProps) {
  const { colors } = useTheme();

  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [localSearchTerm, setLocalSearchTerm] = useState(searchTerm);

  // Build query parameters
  const queryParams = useMemo(() => ({
    searchingFor: showSelectedOnly ? undefined : searchTerm,
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
  }), [
    searchTerm,
    showInactive,
    categoryIds,
    brandIds,
    supplierIds,
    showSelectedOnly,
    selectedItems,
    page,
    pageSize,
  ]);

  // Fetch items
  const { data: itemsResponse, isLoading, refetch } = useItems(queryParams);

  const items = itemsResponse?.data || [];
  const apiTotalRecords = itemsResponse?.meta?.totalRecords || 0;

  // Update total records when it changes
  React.useEffect(() => {
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
  const handleSearch = useCallback((value: string) => {
    setLocalSearchTerm(value);
    const timeoutId = setTimeout(() => {
      onSearchTermChange?.(value);
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [onSearchTermChange]);

  // Handle select all (current page)
  const handleSelectAll = useCallback(() => {
    const allSelected = items.every((item: Item) => selectedItems.has(item.id));

    if (allSelected) {
      // Deselect all
      items.forEach((item: Item) => onSelectItem(item.id));
    } else {
      // Select all
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

  // Render item
  const renderItem = useCallback(({ item }: { item: Item }) => {
    const isSelected = selectedItems.has(item.id);
    const quantity = quantities[item.id] || 1;
    const price = prices[item.id] || item.prices?.[0]?.value || 0;

    return (
      <Card
        style={[
          styles.itemCard,
          isSelected && { borderColor: colors.primary, borderWidth: 2 },
        ]}
      >
        <View style={styles.itemRow}>
          {/* Checkbox */}
          <Checkbox
            checked={isSelected}
            onCheckedChange={() => {
              const defaultPrice = item.prices?.[0]?.value || 0;
              onSelectItem(item.id, 1, defaultPrice);
            }}
          />

          {/* Item Info */}
          <View style={styles.itemInfo}>
            <Text style={styles.itemName} numberOfLines={2}>
              {item.uniCode ? `${item.uniCode} - ` : ""}{item.name}
            </Text>
            <View style={styles.itemMeta}>
              {item.brand && (
                <Text style={styles.itemMetaText}>
                  {item.brand.name}
                </Text>
              )}
              {item.category && (
                <Text style={styles.itemMetaText}>
                  {item.category.name}
                </Text>
              )}
            </View>
            <View style={styles.itemStock}>
              <Text style={styles.itemStockText}>
                Estoque: {item.quantity}
              </Text>
              {item.prices?.[0]?.value && (
                <Text style={styles.itemPriceText}>
                  R$ {item.prices[0].value.toFixed(2)}
                </Text>
              )}
            </View>
          </View>
        </View>

        {/* Quantity and Price inputs (when selected) */}
        {isSelected && (
          <View style={styles.itemInputs}>
            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>Quantidade</Text>
              <NumberInput
                value={quantity}
                onChangeValue={(value) => onQuantityChange(item.id, value)}
                min={0.01}
                decimals={2}
                style={styles.input}
              />
            </View>

            {type === EXTERNAL_WITHDRAWAL_TYPE.CHARGEABLE && onPriceChange && (
              <View style={styles.inputWrapper}>
                <Text style={styles.inputLabel}>Preço Unit.</Text>
                <CurrencyInput
                  value={price}
                  onChangeValue={(value) => onPriceChange(item.id, value)}
                  style={styles.input}
                />
              </View>
            )}
          </View>
        )}
      </Card>
    );
  }, [
    selectedItems,
    quantities,
    prices,
    type,
    onSelectItem,
    onQuantityChange,
    onPriceChange,
    colors,
  ]);

  const totalPages = Math.ceil(apiTotalRecords / pageSize);
  const allCurrentPageSelected = items.length > 0 && items.every((item: Item) => selectedItems.has(item.id));
  const someCurrentPageSelected = items.some((item: Item) => selectedItems.has(item.id)) && !allCurrentPageSelected;

  return (
    <View style={styles.container}>
      {/* Search and Filters */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <IconSearch size={18} color={colors.mutedForeground} style={styles.searchIcon} />
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
            <Badge
              variant="destructive"
              style={styles.filterBadge}
            >
              {activeFilterCount}
            </Badge>
          )}
        </Button>
      </View>

      {/* Show Selected Toggle */}
      {selectedItems.size > 0 && (
        <View style={styles.toggleContainer}>
          <Text style={styles.toggleLabel}>
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
            <Text style={styles.activeFiltersTitle}>
              Filtros ativos ({activeFilterCount})
            </Text>
            <Button
              variant="ghost"
              size="sm"
              onPress={handleClearFilters}
            >
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
          <Text style={styles.selectAllText}>
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
            <Text style={styles.emptyText}>
              {isLoading ? "Carregando..." : "Nenhum item encontrado"}
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
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
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
      <ExternalWithdrawalFormFilters
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
  itemCard: {
    padding: spacing.md,
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
  },
  itemMetaText: {
    fontSize: 13,
    opacity: 0.7,
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
    color: "#10b981",
  },
  itemInputs: {
    flexDirection: "row",
    gap: spacing.md,
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
  },
  inputWrapper: {
    flex: 1,
    gap: spacing.xs,
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
    opacity: 0.7,
  },
  pagination: {
    padding: spacing.md,
  },
});
