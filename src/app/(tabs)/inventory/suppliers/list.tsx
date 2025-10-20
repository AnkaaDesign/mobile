import React, { useState, useCallback, useMemo } from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { IconList, IconFilter } from "@tabler/icons-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ThemedView, ThemedText, FAB, SearchBar, ErrorScreen, EmptyState, ItemsCountDisplay, ListActionButton } from "@/components/ui";
import { ErrorBoundary } from "@/components/error-boundary";
import { useTheme } from "@/lib/theme";
import { spacing } from "@/constants/design-system";
import { SupplierTable, createColumnDefinitions, type SortConfig } from "@/components/inventory/supplier/list/supplier-table";
import { SupplierColumnVisibilityDrawerV2 } from "@/components/inventory/supplier/list/supplier-column-visibility-drawer-v2";
import { SupplierFilterDrawerV2 } from "@/components/inventory/supplier/list/supplier-filter-drawer-v2";
import { SupplierFilterTags } from "@/components/inventory/supplier/list/supplier-filter-tags";
import { useSuppliersInfiniteMobile } from "@/hooks";
import { routes } from '../../../../constants';
import { routeToMobilePath } from "@/lib/route-mapper";

export default function SuppliersListScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  // State
  const [refreshing, setRefreshing] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [displaySearchText, setDisplaySearchText] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<Partial<any>>({});
  const [sortConfigs, setSortConfigs] = useState<SortConfig[]>([{ columnKey: "name", direction: "asc" }]);
  const [selectedSuppliers, setSelectedSuppliers] = useState<Set<string>>(new Set());
  const [showColumnManager, setShowColumnManager] = useState(false);
  const [visibleColumnKeys, setVisibleColumnKeys] = useState<string[]>(["fantasyName", "city", "itemsCount"]);

  // Build orderBy from sort configs
  const buildOrderBy = () => {
    if (!sortConfigs || sortConfigs.length === 0) return { name: "asc" };

    if (sortConfigs.length === 1) {
      const config = sortConfigs[0];
      return { [config.columnKey]: config.direction };
    }

    return sortConfigs.map((config) => ({ [config.columnKey]: config.direction }));
  };

  // Query parameters
  const queryParams = {
    ...(searchText.trim() && { searchingFor: searchText.trim() }),
    ...filters,
    orderBy: buildOrderBy(),
    include: {
      items: true,
    },
  };

  // Count active filters
  const activeFiltersCount = Object.entries(filters).filter(
    ([key, value]) => value !== undefined && value !== null && (Array.isArray(value) ? value.length > 0 : true),
  ).length;

  // Fetch suppliers with infinite scroll
  const { items: suppliers, isLoading, error, refetch, refresh, loadMore, canLoadMore, isFetchingNextPage, totalItemsLoaded, totalCount } = useSuppliersInfiniteMobile(queryParams);

  // Handlers
  const handleApplyFilters = useCallback((newFilters: Partial<any>) => {
    setFilters(newFilters);
    setShowFilters(false);
  }, []);

  const handleClearFilters = useCallback(() => {
    setFilters({});
    setSearchText("");
    setDisplaySearchText("");
    setSelectedSuppliers(new Set());
  }, []);

  const handleSupplierPress = useCallback(
    (supplierId: string) => {
      router.push(routeToMobilePath(routes.inventory.suppliers.details(supplierId)) as any);
    },
    [router],
  );

  const handleSupplierEdit = useCallback(
    (supplierId: string) => {
      router.push(routeToMobilePath(routes.inventory.suppliers.edit(supplierId)) as any);
    },
    [router],
  );

  const handleSupplierDelete = useCallback((supplierId: string) => {
    // Delete handled by table component
  }, []);

  const handleCreateSupplier = useCallback(() => {
    router.push(routeToMobilePath(routes.inventory.suppliers.create) as any);
  }, [router]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refresh();
    } finally {
      setRefreshing(false);
    }
  }, [refresh]);

  const handleDisplaySearchChange = useCallback((text: string) => {
    setDisplaySearchText(text);
  }, []);

  const handleSearch = useCallback((text: string) => {
    setSearchText(text);
  }, []);

  const handleColumnsChange = useCallback((newColumns: Set<string>) => {
    setVisibleColumnKeys(Array.from(newColumns));
  }, []);

  // Get all column definitions
  const allColumns = useMemo(() => createColumnDefinitions(), []);

  if (error) {
    return <ErrorScreen error={error} message="Erro ao carregar fornecedores" detail="Não foi possível carregar os fornecedores. Tente novamente." onRetry={refetch} />;
  }

  return (
    <ErrorBoundary>
      <ThemedView style={[styles.container, { backgroundColor: colors.background, paddingBottom: insets.bottom }]}>
        {/* Search and Column Manager */}
        <View style={styles.searchContainer}>
          <SearchBar value={displaySearchText} onChangeText={handleDisplaySearchChange} onSearch={handleSearch} placeholder="Buscar fornecedores..." style={styles.searchBar} />
          <View style={styles.buttonContainer}>
            <ListActionButton
              icon={<IconList size={20} color={colors.foreground} />}
              onPress={() => setShowColumnManager(true)}
              badgeCount={visibleColumnKeys.length}
              badgeVariant="primary"
            />
            <ListActionButton
              icon={<IconFilter size={20} color={colors.foreground} />}
              onPress={() => setShowFilters(true)}
              badgeCount={activeFiltersCount}
              badgeVariant="destructive"
              showBadge={activeFiltersCount > 0}
            />
          </View>
        </View>

        {/* Individual filter tags */}
        <SupplierFilterTags
          filters={filters}
          searchText={searchText}
          onFilterChange={handleApplyFilters}
          onSearchChange={(text) => {
            setSearchText(text);
            setDisplaySearchText(text);
          }}
          onClearAll={handleClearFilters}
        />

        {/* Suppliers Table */}
        {suppliers.length > 0 ? (
          <SupplierTable
            suppliers={suppliers}
            onSupplierPress={handleSupplierPress}
            onSupplierEdit={handleSupplierEdit}
            onSupplierDelete={handleSupplierDelete}
            onRefresh={handleRefresh}
            onEndReached={canLoadMore ? loadMore : undefined}
            refreshing={refreshing}
            loading={isLoading}
            loadingMore={isFetchingNextPage}
            sortConfigs={sortConfigs}
            onSort={setSortConfigs}
            selectedSuppliers={selectedSuppliers}
            onSelectionChange={setSelectedSuppliers}
            showSelection={false}
            enableSwipeActions={true}
            visibleColumnKeys={visibleColumnKeys}
          />
        ) : (
          <View style={styles.emptyContainer}>
            <EmptyState
              icon={searchText ? "search" : "building-store"}
              title={searchText ? "Nenhum fornecedor encontrado" : "Nenhum fornecedor cadastrado"}
              description={searchText ? `Nenhum resultado para "${searchText}"` : "Comece cadastrando seu primeiro fornecedor"}
              actionLabel={searchText ? undefined : "Cadastrar Fornecedor"}
              onAction={searchText ? undefined : handleCreateSupplier}
            />
          </View>
        )}

        {/* Suppliers count */}
        {suppliers.length > 0 && <ItemsCountDisplay loadedCount={totalItemsLoaded} totalCount={totalCount} isLoading={isFetchingNextPage} itemType="fornecedor" itemTypePlural="fornecedores" />}

        {/* FAB */}
        <FAB icon="plus" onPress={handleCreateSupplier} />

        {/* Filter Drawer */}
        <SupplierFilterDrawerV2
          visible={showFilters}
          onClose={() => setShowFilters(false)}
          onApply={handleApplyFilters}
          currentFilters={filters}
        />

        {/* Column Visibility Drawer */}
        <SupplierColumnVisibilityDrawerV2
          columns={allColumns}
          visibleColumns={new Set(visibleColumnKeys)}
          onVisibilityChange={handleColumnsChange}
          open={showColumnManager}
          onOpenChange={setShowColumnManager}
        />
      </ThemedView>
    </ErrorBoundary>
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
    paddingVertical: spacing.xxl,
    gap: spacing.md,
  },
});
