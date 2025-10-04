import React, { useState, useCallback } from "react";
import { View, ActivityIndicator, Pressable, Alert , StyleSheet} from "react-native";
import { useRouter } from "expo-router";
import { IconPlus, IconFilter, IconList } from "@tabler/icons-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useItemMutations } from '../../../../hooks';
import { useItemsInfiniteMobile } from "@/hooks";
import type { ItemGetManyFormData } from '../../../../schemas';
import { ThemedView, ThemedText, FAB, ErrorScreen, EmptyState, SearchBar, Badge } from "@/components/ui";
import { ItemTable } from "@/components/inventory/item/list/item-table";
import type { SortConfig } from "@/components/inventory/item/list/item-table";
import { ItemFilterModal } from "@/components/inventory/item/list/item-filter-modal";
import { ItemFilterTags } from "@/components/inventory/item/list/item-filter-tags";
import { ColumnVisibilityManager } from "@/components/inventory/item/list/column-visibility-manager";
import { TableErrorBoundary } from "@/components/ui/table-error-boundary";
import { ItemsCountDisplay } from "@/components/ui/items-count-display";
import { ItemListSkeleton } from "@/components/inventory/item/skeleton/item-list-skeleton";
import { useTheme } from "@/lib/theme";
import { routes } from '../../../../constants';
import { routeToMobilePath } from "@/lib/route-mapper";

export default function ItemListScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [displaySearchText, setDisplaySearchText] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<Partial<ItemGetManyFormData>>({});
  const [sortConfigs, setSortConfigs] = useState<SortConfig[]>([{ columnKey: "name", direction: "asc" }]);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [showSelection, setShowSelection] = useState(false);
  const [showColumnManager, setShowColumnManager] = useState(false);
  const [visibleColumnKeys, setVisibleColumnKeys] = useState<string[]>(["uniCode", "name", "quantity"]);

  // Build query parameters with sorting
  const buildOrderBy = () => {
    if (!sortConfigs || sortConfigs.length === 0) return { name: "asc" };

    // If only one sort, return as object
    if (sortConfigs.length === 1) {
      const config = sortConfigs[0 as keyof typeof sortConfigs];
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
        case "minQuantity":
          return { minQuantity: config.direction };
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
        case "minQuantity":
          return { minQuantity: config.direction };
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

  const { items, isLoading, error, refetch, isRefetching, loadMore, canLoadMore, isFetchingNextPage, totalItemsLoaded, refresh } = useItemsInfiniteMobile(queryParams);
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
      try {
        await deleteItem(productId);
        // Clear selection if the deleted item was selected
        if (selectedItems.has(productId)) {
          const newSelection = new Set(selectedItems);
          newSelection.delete(productId);
          setSelectedItems(newSelection);
        }
      } catch (error) {
        Alert.alert("Erro", "Não foi possível excluir o produto. Tente novamente.");
      }
    },
    [deleteItem, selectedItems],
  );

  const handleDuplicateProduct = useCallback(
    (productId: string) => {
      const item = items.find((item) => item.id === productId);
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
    setShowFilters(false);
  }, []);

  const handleClearFilters = useCallback(() => {
    setFilters({});
    setSearchText("");
    setDisplaySearchText("");
    setSelectedItems(new Set());
    setShowSelection(false);
  }, []);

  const handleColumnsChange = useCallback((newColumns: string[]) => {
    setVisibleColumnKeys(newColumns);
  }, []);

  // Count active filters
  const activeFiltersCount = Object.entries(filters).filter(
    ([key, value]) => value !== undefined && value !== null && (Array.isArray(value) ? value.length > 0 : true),
  ).length;

  if (isLoading && !isRefetching) {
    return <ItemListSkeleton />;
  }

  if (error) {
    return (
      <ThemedView style={styles.container}>
        <ErrorScreen message="Erro ao carregar produtos" detail={error.message} onRetry={handleRefresh} />
      </ThemedView>
    );
  }

  const hasProducts = Array.isArray(items) && items.length > 0;

  return (
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
          <Pressable
            style={({ pressed }) => [styles.actionButton, { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }, pressed && styles.actionButtonPressed]}
            onPress={() => setShowColumnManager(true)}
          >
            <IconList size={24} color={colors.foreground} />
            <Badge style={{ ...styles.actionBadge, backgroundColor: colors.primary }} size="sm">
              <ThemedText style={{ ...styles.actionBadgeText, color: colors.primaryForeground }}>{visibleColumnKeys.length}</ThemedText>
            </Badge>
          </Pressable>
          <Pressable
            style={({ pressed }) => [
              styles.actionButton,
              {
                backgroundColor: colors.card,
                borderWidth: 1,
                borderColor: colors.border,
              },
              pressed && styles.actionButtonPressed,
            ]}
            onPress={() => setShowFilters(true)}
          >
            <IconFilter size={24} color={colors.foreground} />
            {activeFiltersCount > 0 && (
              <Badge style={styles.actionBadge} variant="destructive" size="sm">
                <ThemedText style={StyleSheet.flatten([styles.actionBadgeText, { color: "white" }])}>{activeFiltersCount}</ThemedText>
              </Badge>
            )}
          </Pressable>
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
            refreshing={refreshing}
            loading={isLoading && !isRefetching}
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
      {hasProducts && <ItemsCountDisplay loadedCount={totalItemsLoaded} totalCount={undefined} isLoading={isFetchingNextPage} />}

      {hasProducts && <FAB icon="plus" onPress={handleCreateProduct} />}

      {/* Filter Modal */}
      <ItemFilterModal visible={showFilters} onClose={() => setShowFilters(false)} onApply={handleApplyFilters} currentFilters={filters} />

      {/* Column Visibility Manager Modal */}
      <ColumnVisibilityManager visible={showColumnManager} onClose={() => setShowColumnManager(false)} onColumnsChange={handleColumnsChange} currentColumns={visibleColumnKeys} />
    </ThemedView>
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
  actionButton: {
    height: 48,
    width: 48,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  actionBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 3,
  },
  actionBadgeText: {
    fontSize: 9,
    fontWeight: "600",
  },
  filterButton: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 10,
    height: 44,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
    gap: 6,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  filterBadge: {
    position: "absolute",
    top: -6,
    right: -6,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  filterBadgeText: {
    fontSize: 10,
    fontWeight: "600",
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
  actionButtonPressed: {
    opacity: 0.8,
  },
});
