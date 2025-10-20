import React, { useState, useCallback, useMemo } from "react";
import { View, Alert, StyleSheet} from "react-native";
import { useRouter } from "expo-router";
import { IconPlus, IconFilter, IconList } from "@tabler/icons-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTruckMutations } from '../../../../hooks';
import { useTrucksInfiniteMobile } from "@/hooks";
import type { TruckGetManyFormData } from '../../../../schemas';

// Define SortConfig type
export interface SortConfig {
  columnKey: string;
  direction: "asc" | "desc";
}
import { ThemedView, ThemedText, FAB, ErrorScreen, EmptyState, SearchBar, ListActionButton } from "@/components/ui";
import { TruckTable, createColumnDefinitions, getDefaultVisibleColumns } from "@/components/production/truck/list/truck-table";
import { TruckFilterModal } from "@/components/production/truck/list/truck-filter-modal";
import { TruckFilterTags } from "@/components/production/truck/list/truck-filter-tags";
import { ColumnVisibilityDrawerV2 } from "@/components/inventory/item/list/column-visibility-drawer-v2";
import { TableErrorBoundary } from "@/components/ui/table-error-boundary";
import { ItemsCountDisplay } from "@/components/ui/items-count-display";
import { TruckListSkeleton } from "@/components/production/truck/skeleton/truck-list-skeleton";
import { useTheme } from "@/lib/theme";
import { routes } from '../../../../constants';
import { routeToMobilePath } from "@/lib/route-mapper";

export default function TruckListScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [displaySearchText, setDisplaySearchText] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<Partial<TruckGetManyFormData>>({});
  const [sortConfigs, setSortConfigs] = useState<SortConfig[]>([{ columnKey: "plate", direction: "asc" }]);
  const [selectedTrucks, setSelectedTrucks] = useState<Set<string>>(new Set());
  const [showSelection, setShowSelection] = useState(false);
  const [showColumnManager, setShowColumnManager] = useState(false);
  const [visibleColumnKeys, setVisibleColumnKeys] = useState<string[]>(Array.from(getDefaultVisibleColumns()));

  // Build query parameters with sorting
  const buildOrderBy = () => {
    if (!sortConfigs || sortConfigs.length === 0) return { plate: "asc" };

    // Helper function to convert column key to orderBy object
    const convertColumnKeyToOrderBy = (columnKey: string, direction: "asc" | "desc") => {
      // Split column key by dots to handle nested fields
      const parts = columnKey.split(".");

      if (parts.length === 1) {
        // Direct field
        return { [columnKey]: direction };
      } else if (parts.length === 2) {
        // One level nested (e.g., "garage.name")
        return { [parts[0]]: { [parts[1]]: direction } };
      } else if (parts.length === 3) {
        // Two levels nested (e.g., "task.customer.fantasyName")
        return { [parts[0]]: { [parts[1]]: { [parts[2]]: direction } } };
      } else {
        // Fallback for unknown structure
        return { [columnKey]: direction };
      }
    };

    // If only one sort, return as object
    if (sortConfigs.length === 1) {
      const config = sortConfigs[0 as keyof typeof sortConfigs];
      return convertColumnKeyToOrderBy(config.columnKey, config.direction);
    }

    // Multiple sorts, return as array
    return sortConfigs.map((config) => convertColumnKeyToOrderBy(config.columnKey, config.direction));
  };

  const queryParams = {
    orderBy: buildOrderBy(),
    ...(searchText ? { searchingFor: searchText } : {}),
    ...filters,
    include: {
      task: {
        include: {
          customer: true,
          sector: true,
        },
      },
      garage: true,
      _count: {
        select: {
          task: true,
        },
      },
    },
  };

  const { trucks, isLoading, error, refetch, isRefetching, loadMore, canLoadMore, isFetchingNextPage, totalItemsLoaded, totalCount, refresh } = useTrucksInfiniteMobile(queryParams);
  const { delete: deleteTruck } = useTruckMutations();

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refresh();
    } finally {
      setRefreshing(false);
    }
  }, [refresh]);

  const handleCreateTruck = () => {
    router.push(routeToMobilePath(routes.production.trucks.create) as any);
  };

  const handleTruckPress = (truckId: string) => {
    router.push(routeToMobilePath(routes.production.trucks.details(truckId)) as any);
  };

  const handleEditTruck = (truckId: string) => {
    router.push(routeToMobilePath(routes.production.trucks.edit(truckId)) as any);
  };

  const handleDeleteTruck = useCallback(
    async (truckId: string) => {
      await deleteTruck(truckId);
      // Clear selection if the deleted truck was selected
      if (selectedTrucks.has(truckId)) {
        const newSelection = new Set(selectedTrucks);
        newSelection.delete(truckId);
        setSelectedTrucks(newSelection);
      }
    },
    [deleteTruck, selectedTrucks],
  );

  const handleDuplicateTruck = useCallback(
    (truckId: string) => {
      const truck = trucks.find((truck) => truck.id === truckId);
      if (truck) {
        // Navigate to create page with pre-filled data
        router.push({
          pathname: routeToMobilePath(routes.production.trucks.create) as any,
          params: { duplicateFrom: truckId },
        });
      }
    },
    [trucks, router],
  );

  const handleSort = useCallback((configs: SortConfig[]) => {
    setSortConfigs(configs);
  }, []);

  const handleSelectionChange = useCallback((newSelection: Set<string>) => {
    setSelectedTrucks(newSelection);
  }, []);

  const handleSearch = useCallback((text: string) => {
    setSearchText(text);
  }, []);

  const handleDisplaySearchChange = useCallback((text: string) => {
    setDisplaySearchText(text);
  }, []);

  const handleApplyFilters = useCallback((newFilters: Partial<TruckGetManyFormData>) => {
    setFilters(newFilters);
    setShowFilters(false);
  }, []);

  const handleClearFilters = useCallback(() => {
    setFilters({});
    setSearchText("");
    setDisplaySearchText("");
    setSelectedTrucks(new Set());
    setShowSelection(false);
  }, []);

  // Get all column definitions
  const allColumns = useMemo(() => createColumnDefinitions(), []);

  const handleColumnsChange = useCallback((newColumns: Set<string>) => {
    setVisibleColumnKeys(Array.from(newColumns));
  }, []);

  // Count active filters
  const activeFiltersCount = Object.entries(filters).filter(
    ([key, value]) => value !== undefined && value !== null && (Array.isArray(value) ? value.length > 0 : true),
  ).length;

  if (isLoading && !isRefetching) {
    return <TruckListSkeleton />;
  }

  if (error) {
    return (
      <ThemedView style={styles.container}>
        <ErrorScreen message="Erro ao carregar caminhões" detail={error.message} onRetry={handleRefresh} />
      </ThemedView>
    );
  }

  const hasTrucks = Array.isArray(trucks) && trucks.length > 0;

  return (
    <ThemedView style={[styles.container, { backgroundColor: colors.background, paddingBottom: insets.bottom }]}>
      {/* Search, Filter and Sort */}
      <View style={[styles.searchContainer]}>
        <SearchBar
          value={displaySearchText}
          onChangeText={handleDisplaySearchChange}
          onSearch={handleSearch}
          placeholder="Buscar caminhões..."
          style={styles.searchBar}
          debounceMs={300}
        />
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
      <TruckFilterTags
        filters={filters}
        searchText={searchText}
        onFilterChange={handleApplyFilters}
        onSearchChange={(text) => {
          setSearchText(text);
          setDisplaySearchText(text);
        }}
        onClearAll={handleClearFilters}
      />

      {hasTrucks ? (
        <TableErrorBoundary onRetry={handleRefresh}>
          <TruckTable
            data={trucks}
            isLoading={isLoading && !isRefetching}
            error={error}
            onRefresh={handleRefresh}
            onTruckPress={handleTruckPress}
            onTruckEdit={handleEditTruck}
            onTruckDelete={handleDeleteTruck}
            onTruckDuplicate={handleDuplicateTruck}
            onEndReached={canLoadMore ? loadMore : undefined}
            refreshing={refreshing}
            loading={isLoading && !isRefetching}
            loadingMore={isFetchingNextPage}
            showSelection={showSelection}
            selectedTrucks={selectedTrucks}
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
            icon={searchText ? "search" : "truck"}
            title={searchText ? "Nenhum caminhão encontrado" : "Nenhum caminhão cadastrado"}
            description={searchText ? `Nenhum resultado para "${searchText}"` : "Comece cadastrando seu primeiro caminhão na frota"}
            actionLabel={searchText ? undefined : "Cadastrar Caminhão"}
            onAction={searchText ? undefined : handleCreateTruck}
          />
        </View>
      )}

      {/* Items count */}
      {hasTrucks && <ItemsCountDisplay loadedCount={totalItemsLoaded} totalCount={totalCount} isLoading={isFetchingNextPage} />}

      {hasTrucks && <FAB icon="plus" onPress={handleCreateTruck} />}

      {/* Filter Modal */}
      <TruckFilterModal visible={showFilters} onClose={() => setShowFilters(false)} onApply={handleApplyFilters} currentFilters={filters} />

      {/* Column Visibility Drawer */}
      <ColumnVisibilityDrawerV2
        columns={allColumns}
        visibleColumns={new Set(visibleColumnKeys)}
        onVisibilityChange={handleColumnsChange}
        open={showColumnManager}
        onOpenChange={setShowColumnManager}
      />
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
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});