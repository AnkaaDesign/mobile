import { useState, useCallback, useMemo } from "react";
import { View, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { IconFilter, IconList } from "@tabler/icons-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useObservationMutations, useTasks } from "@/hooks";
import { useObservationsInfiniteMobile } from "@/hooks/use-observations-infinite-mobile";
import type { ObservationGetManyFormData } from "@/schemas";
import {
  ThemedView,
  FAB,
  ErrorScreen,
  EmptyState,
  ListActionButton,
  SearchBar,
} from "@/components/ui";
import {
  ObservationTable,
  createColumnDefinitions,
} from "@/components/production/observation/list/observation-table";
import type { SortConfig } from "@/components/production/observation/list/observation-table";
import { ObservationFilterDrawer } from "@/components/production/observation/list/observation-filter-drawer";
import { ObservationFilterTags } from "@/components/production/observation/list/observation-filter-tags";
import { ObservationColumnVisibilityDrawer } from "@/components/production/observation/list/observation-column-visibility-drawer";
import { TableErrorBoundary } from "@/components/ui/table-error-boundary";
import { ItemsCountDisplay } from "@/components/ui/items-count-display";
import { ObservationListSkeleton } from "@/components/production/observation/skeleton/observation-list-skeleton";
import { useTheme } from "@/lib/theme";
import { routes } from "@/constants";
import { routeToMobilePath } from "@/lib/route-mapper";

export default function ObservationListScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [displaySearchText, setDisplaySearchText] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<Partial<ObservationGetManyFormData>>({});
  const [sortConfigs, setSortConfigs] = useState<SortConfig[]>([
    { columnKey: "createdAt", direction: "desc" },
  ]);
  const [selectedObservations, setSelectedObservations] = useState<Set<string>>(new Set());
  const [showSelection, setShowSelection] = useState(false);
  const [showColumnManager, setShowColumnManager] = useState(false);
  const [visibleColumnKeys, setVisibleColumnKeys] = useState<string[]>([
    "task.name",
    "description",
    "filesCount",
    "createdAt",
  ]);

  // Fetch tasks for filter dropdown
  const { data: tasksData } = useTasks({
    limit: 1000,
    orderBy: { name: "asc" },
  });
  const tasks = tasksData?.data || [];

  // Build query parameters with sorting
  const buildOrderBy = () => {
    if (!sortConfigs || sortConfigs.length === 0) {
      return { createdAt: "desc" };
    }

    // If only one sort, return as object
    if (sortConfigs.length === 1) {
      const config = sortConfigs[0];
      switch (config.columnKey) {
        case "task.name":
          return { task: { name: config.direction } };
        case "description":
          return { description: config.direction };
        case "createdAt":
          return { createdAt: config.direction };
        case "updatedAt":
          return { updatedAt: config.direction };
        default:
          return { createdAt: "desc" };
      }
    }

    // Multiple sorts, return as array
    return sortConfigs.map((config) => {
      switch (config.columnKey) {
        case "task.name":
          return { task: { name: config.direction } };
        case "description":
          return { description: config.direction };
        case "createdAt":
          return { createdAt: config.direction };
        case "updatedAt":
          return { updatedAt: config.direction };
        default:
          return { createdAt: "desc" };
      }
    });
  };

  const queryParams = useMemo(
    () => ({
      orderBy: buildOrderBy(),
      ...(searchText ? { searchingFor: searchText } : {}),
      ...filters,
      include: {
        task: true,
        files: true,
      },
    }),
    [searchText, filters, sortConfigs]
  );

  const {
    items: observations,
    isLoading,
    error,
    
    isRefetching,
    loadMore,
    canLoadMore,
    isFetchingNextPage,
    totalItemsLoaded,
    totalCount,
    refresh,
  } = useObservationsInfiniteMobile(queryParams);

  const { delete: deleteObservation } = useObservationMutations();

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refresh();
    } finally {
      setRefreshing(false);
    }
  }, [refresh]);

  const handleCreateObservation = () => {
    router.push(routeToMobilePath(routes.production.observations.create) as any);
  };

  const handleObservationPress = (observationId: string) => {
    router.push(
      routeToMobilePath(routes.production.observations.details(observationId)) as any
    );
  };

  const handleEditObservation = (observationId: string) => {
    router.push(
      routeToMobilePath(routes.production.observations.edit(observationId)) as any
    );
  };

  const handleDeleteObservation = useCallback(
    async (observationId: string) => {
      await deleteObservation(observationId);
      // Clear selection if the deleted item was selected
      if (selectedObservations.has(observationId)) {
        const newSelection = new Set(selectedObservations);
        newSelection.delete(observationId);
        setSelectedObservations(newSelection);
      }
    },
    [deleteObservation, selectedObservations]
  );

  const handleSort = useCallback((configs: SortConfig[]) => {
    setSortConfigs(configs);
  }, []);

  const handleSelectionChange = useCallback((newSelection: Set<string>) => {
    setSelectedObservations(newSelection);
  }, []);

  const handleSearch = useCallback((text: string) => {
    setSearchText(text);
  }, []);

  const handleDisplaySearchChange = useCallback((text: string) => {
    setDisplaySearchText(text);
  }, []);

  const handleApplyFilters = useCallback(
    (newFilters: Partial<ObservationGetManyFormData>) => {
      setFilters(newFilters);
      setShowFilters(false);
    },
    []
  );

  const handleClearFilters = useCallback(() => {
    setFilters({});
    setSearchText("");
    setDisplaySearchText("");
    setSelectedObservations(new Set());
    setShowSelection(false);
  }, []);

  const handleColumnsChange = useCallback((newColumns: Set<string>) => {
    setVisibleColumnKeys(Array.from(newColumns));
  }, []);

  // Get all column definitions
  const allColumns = useMemo(() => createColumnDefinitions(), []);

  // Count active filters
  const activeFiltersCount = [
    filters.taskIds && filters.taskIds.length > 0,
    filters.hasFiles !== undefined,
    filters.createdAt?.gte || filters.createdAt?.lte,
  ].filter(Boolean).length;

  // Only show skeleton on initial load, not on refetch/sort
  const isInitialLoad = isLoading && !isRefetching && observations.length === 0;

  if (isInitialLoad) {
    return <ObservationListSkeleton />;
  }

  if (error && observations.length === 0) {
    return (
      <ThemedView style={styles.container}>
        <ErrorScreen
          message="Erro ao carregar observações"
          detail={error.message}
          onRetry={handleRefresh}
        />
      </ThemedView>
    );
  }

  const hasObservations = Array.isArray(observations) && observations.length > 0;

  return (
    <ThemedView
      style={[
        styles.container,
        { backgroundColor: colors.background, paddingBottom: insets.bottom },
      ]}
    >
      {/* Search and Filter */}
      <View style={styles.searchContainer}>
        <SearchBar
          value={displaySearchText}
          onChangeText={handleDisplaySearchChange}
          onSearch={handleSearch}
          placeholder="Buscar observações..."
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
      <ObservationFilterTags
        filters={filters}
        searchText={searchText}
        onFilterChange={handleApplyFilters}
        onSearchChange={(text) => {
          setSearchText(text);
          setDisplaySearchText(text);
        }}
        onClearAll={handleClearFilters}
        tasks={tasks}
      />

      {hasObservations ? (
        <TableErrorBoundary onRetry={handleRefresh}>
          <ObservationTable
            observations={observations}
            onObservationPress={handleObservationPress}
            onObservationEdit={handleEditObservation}
            onObservationDelete={handleDeleteObservation}
            onRefresh={handleRefresh}
            onEndReached={canLoadMore ? loadMore : undefined}
            refreshing={refreshing || isRefetching}
            loading={false}
            loadingMore={isFetchingNextPage}
            showSelection={showSelection}
            selectedObservations={selectedObservations}
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
            icon={searchText ? "search" : "eye"}
            title={
              searchText
                ? "Nenhuma observação encontrada"
                : "Nenhuma observação cadastrada"
            }
            description={
              searchText
                ? `Nenhum resultado para "${searchText}"`
                : "Comece cadastrando a primeira observação"
            }
            actionLabel={searchText ? undefined : "Cadastrar Observação"}
            onAction={searchText ? undefined : handleCreateObservation}
          />
        </View>
      )}

      {/* Items count */}
      {hasObservations && (
        <ItemsCountDisplay
          loadedCount={totalItemsLoaded}
          totalCount={totalCount}
          isLoading={isFetchingNextPage}
        />
      )}

      {hasObservations && <FAB icon="plus" onPress={handleCreateObservation} />}

      {/* Filter Drawer */}
      <ObservationFilterDrawer
        open={showFilters}
        onOpenChange={setShowFilters}
        currentFilters={filters}
        onApply={handleApplyFilters}
        onClear={handleClearFilters}
        tasks={tasks}
      />

      {/* Column Visibility Drawer */}
      <ObservationColumnVisibilityDrawer
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
