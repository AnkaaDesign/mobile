import { useState, useCallback, useMemo } from "react";
import { View, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { IconFilter, IconList } from "@tabler/icons-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useItemMutations } from '../../../../hooks';
import { useItemsInfiniteMobile } from "@/hooks";
import type { ItemGetManyFormData } from '../../../../schemas';
import type { Item } from '../../../../types';
import { ThemedView, FAB, ErrorScreen, EmptyState, SearchBar, ListActionButton } from "@/components/ui";
import { ItemTable, createColumnDefinitions } from "@/components/inventory/item/list/item-table";
import type { SortConfig } from "@/components/inventory/item/list/item-table";
import { ItemFilterTags } from "@/components/inventory/item/list/item-filter-tags";

import { TableErrorBoundary } from "@/components/ui/table-error-boundary";
import { ItemsCountDisplay } from "@/components/ui/items-count-display";
import { ItemListSkeleton } from "@/components/inventory/item/skeleton/item-list-skeleton";
import { useTheme } from "@/lib/theme";
import { routes } from '../../../../constants';
import { routeToMobilePath } from "@/lib/route-mapper";

import { SlideInPanel } from "@/components/ui/slide-in-panel";
import { ColumnVisibilitySlidePanel } from "@/components/ui/column-visibility-slide-panel";
import { ItemFilterDrawerContent } from "@/components/inventory/item/list/item-filter-drawer-content";

export default function ItemListScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [displaySearchText, setDisplaySearchText] = useState("");
  const [filters, setFilters] = useState<Partial<ItemGetManyFormData>>({});
  const [sortConfigs, setSortConfigs] = useState<SortConfig[]>([{ columnKey: "name", direction: "asc" }]);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [showSelection, setShowSelection] = useState(false);
  const [visibleColumnKeys, setVisibleColumnKeys] = useState<string[]>(["uniCode", "name", "quantity"]);

  // Slide panel state
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [isColumnPanelOpen, setIsColumnPanelOpen] = useState(false);

  // Build query parameters with sorting
  const buildOrderBy = () => {
    if (!sortConfigs || sortConfigs.length === 0) return { name: "asc" };

    // If only one sort, return as object
    if (sortConfigs.length === 1) {
      const config = sortConfigs[0];
      switch (config.columnKey) {
        case "name":
          return { name: config.direction };
        case "uniCode":
          return { uniCode: config.direction };
        case "quantity":
          return { quantity: config.direction };
        case "totalPrice":
          return { totalPrice: config.direction };
        case "monthlyConsumption":
          return { monthlyConsumption: config.direction };
        case "createdAt":
          return { createdAt: config.direction };
        case "updatedAt":
          return { updatedAt: config.direction };
        case "maxQuantity":
          return { maxQuantity: config.direction };
        case "reorderPoint":
          return { reorderPoint: config.direction };
        default:
          return { name: "asc" };
      }
    }

    // Multiple sorts, return as array
    return sortConfigs.map((config) => {
      switch (config.columnKey) {
        case "name":
          return { name: config.direction };
        case "uniCode":
          return { uniCode: config.direction };
        case "quantity":
          return { quantity: config.direction };
        case "totalPrice":
          return { totalPrice: config.direction };
        case "monthlyConsumption":
          return { monthlyConsumption: config.direction };
        case "createdAt":
          return { createdAt: config.direction };
        case "updatedAt":
          return { updatedAt: config.direction };
        case "maxQuantity":
          return { maxQuantity: config.direction };
        case "reorderPoint":
          return { reorderPoint: config.direction };
        default:
          return { name: "asc" };
      }
    });
  };

  const queryParams = {
    orderBy: buildOrderBy(),
    ...(searchText ? { searchingFor: searchText } : {}),
    ...filters,
    include: {
      // Minimal includes for simplified table display
    },
  };

  const { items, isLoading, error, isRefetching, loadMore, canLoadMore, isFetchingNextPage, totalItemsLoaded, totalCount, refresh } = useItemsInfiniteMobile(queryParams);
  const { delete: deleteItem } = useItemMutations();

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refresh();
    } finally {
      setRefreshing(false);
    }
  }, [refresh]);

  const handleCreateProduct = () => {
    router.push(routeToMobilePath(routes.inventory.products.create) as any);
  };

  const handleProductPress = (productId: string) => {
    router.push(routeToMobilePath(routes.inventory.products.details(productId)) as any);
  };

  const handleEditProduct = (productId: string) => {
    router.push(routeToMobilePath(routes.inventory.products.edit(productId)) as any);
  };

  const handleDeleteProduct = useCallback(
    async (productId: string) => {
      await deleteItem(productId);
      // Clear selection if the deleted item was selected
      if (selectedItems.has(productId)) {
        const newSelection = new Set(selectedItems);
        newSelection.delete(productId);
        setSelectedItems(newSelection);
      }
    },
    [deleteItem, selectedItems],
  );

  const handleDuplicateProduct = useCallback(
    (productId: string) => {
      const item = items.find((item: Item) => item.id === productId);
      if (item) {
        // Navigate to create page with pre-filled data
        router.push({
          pathname: routeToMobilePath(routes.inventory.products.create) as any,
          params: { duplicateFrom: productId },
        });
      }
    },
    [items, router],
  );

  const handleSort = useCallback((configs: SortConfig[]) => {
    setSortConfigs(configs);
  }, []);

  const handleSelectionChange = useCallback((newSelection: Set<string>) => {
    setSelectedItems(newSelection);
  }, []);

  const handleSearch = useCallback((text: string) => {
    setSearchText(text);
  }, []);

  const handleDisplaySearchChange = useCallback((text: string) => {
    setDisplaySearchText(text);
  }, []);

  const handleApplyFilters = useCallback((newFilters: Partial<ItemGetManyFormData>) => {
    setFilters(newFilters);
  }, []);

  const handleClearFilters = useCallback(() => {
    setFilters({});
    setSearchText("");
    setDisplaySearchText("");
    setSelectedItems(new Set());
    setShowSelection(false);
  }, []);

  // Get all column definitions
  const allColumns = useMemo(() => createColumnDefinitions(), []);

  // Convert visibleColumnKeys array to Set for GenericColumnDrawerContent
  const visibleColumns = useMemo(() => new Set(visibleColumnKeys), [visibleColumnKeys]);

  // Handle column visibility changes
  const handleColumnsChange = useCallback((newColumns: Set<string>) => {
    setVisibleColumnKeys(Array.from(newColumns));
  }, []);

  // Count active filters
  const activeFiltersCount = Object.entries(filters).filter(
    ([_key, value]) => value !== undefined && value !== null && (Array.isArray(value) ? value.length > 0 : true),
  ).length;

  const handleOpenFilters = useCallback(() => {
    setIsFilterPanelOpen(true);
  }, []);

  const handleCloseFilters = useCallback(() => {
    setIsFilterPanelOpen(false);
  }, []);

  const handleOpenColumns = useCallback(() => {
    setIsColumnPanelOpen(true);
  }, []);

  const handleCloseColumns = useCallback(() => {
    setIsColumnPanelOpen(false);
  }, []);

  // Only show skeleton on initial load, not on refetch/sort
  const isInitialLoad = isLoading && !isRefetching && items.length === 0;

  if (isInitialLoad) {
    return <ItemListSkeleton />;
  }

  if (error && items.length === 0) {
    return (
      <ThemedView style={styles.container}>
        <ErrorScreen message="Erro ao carregar produtos" detail={error.message} onRetry={handleRefresh} />
      </ThemedView>
    );
  }

  const hasProducts = Array.isArray(items) && items.length > 0;

  return (
    <>
      <ThemedView style={[styles.container, { backgroundColor: colors.background, paddingBottom: insets.bottom }]}>
        {/* Search, Filter and Sort */}
        <View style={[styles.searchContainer]}>
          <SearchBar
            value={displaySearchText}
            onChangeText={handleDisplaySearchChange}
            onSearch={handleSearch}
            placeholder="Buscar produtos..."
            style={styles.searchBar}
            debounceMs={300}
          />
          <View style={styles.buttonContainer}>
            <ListActionButton
              icon={<IconList size={20} color={colors.foreground} />}
              onPress={handleOpenColumns}
              badgeCount={visibleColumnKeys.length}
              badgeVariant="primary"
            />
            <ListActionButton
              icon={<IconFilter size={20} color={colors.foreground} />}
              onPress={handleOpenFilters}
              badgeCount={activeFiltersCount}
              badgeVariant="destructive"
              showBadge={activeFiltersCount > 0}
            />
          </View>
        </View>

        {/* Individual filter tags */}
        <ItemFilterTags
          filters={filters}
          searchText={searchText}
          onFilterChange={handleApplyFilters}
          onSearchChange={(text) => {
            setSearchText(text);
            setDisplaySearchText(text);
          }}
          onClearAll={handleClearFilters}
        />

        {hasProducts ? (
          <TableErrorBoundary onRetry={handleRefresh}>
            <ItemTable
              items={items}
              onItemPress={handleProductPress}
              onItemEdit={handleEditProduct}
              onItemDelete={handleDeleteProduct}
              onItemDuplicate={handleDuplicateProduct}
              onRefresh={handleRefresh}
              onEndReached={canLoadMore ? loadMore : undefined}
              refreshing={refreshing || isRefetching}
              loading={false}
              loadingMore={isFetchingNextPage}
              showSelection={showSelection}
              selectedItems={selectedItems}
              onSelectionChange={handleSelectionChange}
              sortConfigs={sortConfigs}
              onSort={handleSort}
              visibleColumnKeys={visibleColumnKeys}
              enableSwipeActions={true}
            />
          </TableErrorBoundary>
        ) : (
          <View style={styles.emptyContainer}>
            <EmptyState
              icon={searchText ? "search" : "package"}
              title={searchText ? "Nenhum produto encontrado" : "Nenhum produto cadastrado"}
              description={searchText ? `Nenhum resultado para "${searchText}"` : "Comece cadastrando seu primeiro produto no estoque"}
              actionLabel={searchText ? undefined : "Cadastrar Produto"}
              onAction={searchText ? undefined : handleCreateProduct}
            />
          </View>
        )}

        {/* Items count */}
        {hasProducts && <ItemsCountDisplay loadedCount={totalItemsLoaded} totalCount={totalCount} isLoading={isFetchingNextPage} />}

        {hasProducts && <FAB icon="plus" onPress={handleCreateProduct} />}
      </ThemedView>

      <SlideInPanel isOpen={isFilterPanelOpen} onClose={handleCloseFilters}>
        <ItemFilterDrawerContent
          filters={filters}
          onFiltersChange={setFilters}
          onClear={handleClearFilters}
          activeFiltersCount={activeFiltersCount}
          onClose={handleCloseFilters}
        />
      </SlideInPanel>

      <SlideInPanel isOpen={isColumnPanelOpen} onClose={handleCloseColumns}>
        <ColumnVisibilitySlidePanel
          columns={allColumns}
          visibleColumns={visibleColumns}
          onVisibilityChange={handleColumnsChange}
          onClose={handleCloseColumns}
        />
      </SlideInPanel>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    flexDirection: "row",
    paddingHorizontal: 8,
    paddingVertical: 8,
    gap: 8,
    alignItems: "center",
  },
  searchBar: {
    flex: 1,
  },
  buttonContainer: {
    flexDirection: "row",
    gap: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    opacity: 0.7,
  },
});
