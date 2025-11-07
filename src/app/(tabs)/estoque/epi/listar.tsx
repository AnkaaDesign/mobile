import { useState, useCallback, useMemo } from "react";
import { View, ActivityIndicator, Alert, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { IconFilter, IconList } from "@tabler/icons-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useItemMutations } from '../../../../hooks';
import { useItemsInfiniteMobile } from "@/hooks";
import type { ItemGetManyFormData } from '../../../../schemas';
import { ThemedView, ThemedText, FAB, ErrorScreen, EmptyState, SearchBar, ListActionButton } from "@/components/ui";
import { PpeTable, createColumnDefinitions } from "@/components/inventory/ppe/list/ppe-table";
import type { SortConfig } from "@/components/inventory/ppe/list/ppe-table";

import { PpeFilterTags } from "@/components/inventory/ppe/list/ppe-filter-tags";

import { TableErrorBoundary } from "@/components/ui/table-error-boundary";
import { ItemsCountDisplay } from "@/components/ui/items-count-display";
import { useTheme } from "@/lib/theme";
import { routes } from '../../../../constants';
import { routeToMobilePath } from "@/lib/route-mapper";
import { ITEM_CATEGORY_TYPE } from '../../../../constants';

import { SlideInPanel } from "@/components/ui/slide-in-panel";
import { ColumnVisibilitySlidePanel } from "@/components/ui/column-visibility-slide-panel";
import { PpeFilterDrawerContent } from "@/components/inventory/ppe/list/ppe-filter-drawer-content";

export default function PPEListScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [displaySearchText, setDisplaySearchText] = useState("");
  const [filters, setFilters] = useState<Partial<ItemGetManyFormData>>({});
  const [sortConfigs, setSortConfigs] = useState<SortConfig[]>([{ columnKey: "name", direction: "asc" }]);
  const [selectedPpes, setSelectedPpes] = useState<Set<string>>(new Set());
  const [showSelection, setShowSelection] = useState(false);
  const [visibleColumnKeys, setVisibleColumnKeys] = useState<string[]>(["name", "ppeType", "ppeSize"]);

  // Slide panel state
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [isColumnPanelOpen, setIsColumnPanelOpen] = useState(false);

  // Build query parameters with sorting - filter for PPE items only
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
        case "brand.name":
          return { brand: { name: config.direction } };
        case "category.name":
          return { category: { name: config.direction } };
        case "price":
          return { prices: { value: config.direction } };
        case "totalPrice":
          return { totalPrice: config.direction };
        case "reorderPoint":
          return { reorderPoint: config.direction };
        case "reorderQuantity":
          return { reorderQuantity: config.direction };
        case "supplier.fantasyName":
          return { supplier: { fantasyName: config.direction } };
        case "shouldAssignToUser":
          return { shouldAssignToUser: config.direction };
        case "isActive":
          return { isActive: config.direction };
        case "createdAt":
          return { createdAt: config.direction };
        case "updatedAt":
          return { updatedAt: config.direction };
        case "ppeCA":
          return { ppeCA: config.direction };
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
        case "brand.name":
          return { brand: { name: config.direction } };
        case "category.name":
          return { category: { name: config.direction } };
        case "price":
          return { prices: { value: config.direction } };
        case "totalPrice":
          return { totalPrice: config.direction };
        case "reorderPoint":
          return { reorderPoint: config.direction };
        case "reorderQuantity":
          return { reorderQuantity: config.direction };
        case "supplier.fantasyName":
          return { supplier: { fantasyName: config.direction } };
        case "shouldAssignToUser":
          return { shouldAssignToUser: config.direction };
        case "isActive":
          return { isActive: config.direction };
        case "createdAt":
          return { createdAt: config.direction };
        case "updatedAt":
          return { updatedAt: config.direction };
        case "ppeCA":
          return { ppeCA: config.direction };
        default:
          return { name: "asc" };
      }
    });
  };

  const queryParams = {
    orderBy: buildOrderBy(),
    ...(searchText ? { searchingFor: searchText } : {}),
    ...filters,
    where: {
      ...filters.where,
      category: {
        type: ITEM_CATEGORY_TYPE.PPE,
      },
    },
    include: {
      brand: true,
      category: true,
      supplier: true,
      measures: true,
      prices: {
        where: {
          isActive: true,
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 1,
      },
    },
  };

  const { items, isLoading, error, isRefetching, loadMore, canLoadMore, isFetchingNextPage, totalItemsLoaded, totalCount, refresh } = useItemsInfiniteMobile(queryParams);
  const { delete: deletePpe } = useItemMutations();

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refresh();
    } finally {
      setRefreshing(false);
    }
  }, [refresh]);

  const handleCreatePpe = () => {
    router.push(routeToMobilePath(routes.inventory.ppe.create) as any);
  };

  const handlePpePress = (ppeId: string) => {
    router.push(routeToMobilePath(routes.inventory.ppe.details(ppeId)) as any);
  };

  const handleEditPpe = (ppeId: string) => {
    router.push(routeToMobilePath(routes.inventory.ppe.edit(ppeId)) as any);
  };

  const handleDeletePpe = useCallback(
    async (ppeId: string) => {
      try {
        await deletePpe(ppeId);
        // Clear selection if the deleted item was selected
        if (selectedPpes.has(ppeId)) {
          const newSelection = new Set(selectedPpes);
          newSelection.delete(ppeId);
          setSelectedPpes(newSelection);
        }
      } catch (error) {
        Alert.alert("Erro", "Não foi possível excluir o EPI. Tente novamente.");
      }
    },
    [deletePpe, selectedPpes],
  );

  const handleSort = useCallback((configs: SortConfig[]) => {
    setSortConfigs(configs);
  }, []);

  const handleSelectionChange = useCallback((newSelection: Set<string>) => {
    setSelectedPpes(newSelection);
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
    setSelectedPpes(new Set());
    setShowSelection(false);
  }, []);

  const handleRemoveFilter = useCallback((key: keyof ItemGetManyFormData) => {
    const newFilters = { ...filters };
    delete (newFilters as any)[key];
    setFilters(newFilters);
  }, [filters]);

  const handleColumnsChange = useCallback((newColumns: Set<string>) => {
    setVisibleColumnKeys(Array.from(newColumns));
  }, []);

  // Get all column definitions
  const allColumns = useMemo(() => createColumnDefinitions(), []);

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
    return (
      <ThemedView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <ThemedText style={styles.loadingText}>Carregando EPIs...</ThemedText>
        </View>
      </ThemedView>
    );
  }

  if (error && items.length === 0) {
    return (
      <ThemedView style={styles.container}>
        <ErrorScreen message="Erro ao carregar EPIs" detail={error.message} onRetry={handleRefresh} />
      </ThemedView>
    );
  }

  const hasPpes = Array.isArray(items) && items.length > 0;

  return (
    <>
      <ThemedView style={[styles.container, { backgroundColor: colors.background, paddingBottom: insets.bottom }]}>
      {/* Search, Filter and Sort */}
      <View style={[styles.searchContainer]}>
        <SearchBar
          value={displaySearchText}
          onChangeText={handleDisplaySearchChange}
          onSearch={handleSearch}
          placeholder="Buscar EPIs..."
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
      <PpeFilterTags
        filters={filters}
        searchText={searchText}
        onRemoveFilter={handleRemoveFilter}
        onClearSearch={() => {
          setSearchText("");
          setDisplaySearchText("");
        }}
        onClearAll={handleClearFilters}
      />

      {hasPpes ? (
        <TableErrorBoundary onRetry={handleRefresh}>
          <PpeTable
            ppes={items}
            onPpePress={handlePpePress}
            onPpeEdit={handleEditPpe}
            onPpeDelete={handleDeletePpe}
            onRefresh={handleRefresh}
            onEndReached={canLoadMore ? loadMore : undefined}
            refreshing={refreshing || isRefetching}
            loading={false}
            loadingMore={isFetchingNextPage}
            showSelection={showSelection}
            selectedPpes={selectedPpes}
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
            icon={searchText ? "search" : "shield"}
            title={searchText ? "Nenhum EPI encontrado" : "Nenhum EPI cadastrado"}
            description={searchText ? `Nenhum resultado para "${searchText}"` : "Comece cadastrando seu primeiro EPI no estoque"}
            actionLabel={searchText ? undefined : "Cadastrar EPI"}
            onAction={searchText ? undefined : handleCreatePpe}
          />
        </View>
      )}

      {/* Items count */}
      {hasPpes && <ItemsCountDisplay loadedCount={totalItemsLoaded} totalCount={totalCount} isLoading={isFetchingNextPage} />}

      {hasPpes && <FAB icon="plus" onPress={handleCreatePpe} />}
    </ThemedView>

    <SlideInPanel isOpen={isFilterPanelOpen} onClose={handleCloseFilters}>
      <PpeFilterDrawerContent
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
        visibleColumns={new Set(visibleColumnKeys)}
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
