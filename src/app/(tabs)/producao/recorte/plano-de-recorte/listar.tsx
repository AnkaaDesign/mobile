import { useState, useCallback, useMemo } from "react";
import { View, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { IconFilter, IconList } from "@tabler/icons-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useCutMutations } from "@/hooks";
import { useCutsInfiniteMobile } from "@/hooks/use-cuts-infinite-mobile";
import type { CutGetManyFormData } from "@/schemas";
import { ThemedView, FAB, ErrorScreen, EmptyState, ListActionButton, SearchBar } from "@/components/ui";
import { CuttingPlanTable, createColumnDefinitions } from "@/components/production/cutting/list/cutting-plan-table";
import type { SortConfig } from "@/components/production/cutting/list/cutting-plan-table";
import { CuttingPlanFilterTags } from "@/components/production/cutting/list/cutting-plan-filter-tags";
import { CuttingPlanFilterDrawerContent } from "@/components/production/cutting/list/cutting-plan-filter-drawer-content";
import { ColumnVisibilitySlidePanel } from "@/components/ui/column-visibility-slide-panel";
import { SlideInPanel } from "@/components/ui/slide-in-panel";
import { TableErrorBoundary } from "@/components/ui/table-error-boundary";
import { ItemsCountDisplay } from "@/components/ui/items-count-display";
import { CuttingPlanListSkeleton } from "@/components/production/cutting/skeleton/cutting-plan-list-skeleton";
import { useTheme } from "@/lib/theme";
import { routes } from "@/constants";
import { routeToMobilePath } from "@/lib/route-mapper";

export default function CuttingPlanListScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [isColumnPanelOpen, setIsColumnPanelOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [displaySearchText, setDisplaySearchText] = useState("");
  const [selectedCuts, setSelectedCuts] = useState<Set<string>>(new Set());
  const [showSelection, setShowSelection] = useState(false);
  const [visibleColumnKeys, setVisibleColumnKeys] = useState<string[]>(["status", "type", "task"]);

  // Filter state
  const [filters, setFilters] = useState<Partial<CutGetManyFormData>>({});

  // Sort state
  const [sortConfigs, setSortConfigs] = useState<SortConfig[]>([
    { columnKey: "createdAt", direction: "desc" },
  ]);

  // Build orderBy from sort configs
  const buildOrderBy = useCallback(() => {
    if (!sortConfigs || sortConfigs.length === 0) return { createdAt: "desc" };

    if (sortConfigs.length === 1) {
      const config = sortConfigs[0];
      switch (config.columnKey) {
        case "status":
          return { status: config.direction };
        case "type":
          return { type: config.direction };
        case "origin":
          return { origin: config.direction };
        case "startedAt":
          return { startedAt: config.direction };
        case "completedAt":
          return { completedAt: config.direction };
        case "createdAt":
          return { createdAt: config.direction };
        default:
          return { createdAt: "desc" };
      }
    }

    return sortConfigs.map((config) => {
      switch (config.columnKey) {
        case "status":
          return { status: config.direction };
        case "type":
          return { type: config.direction };
        case "origin":
          return { origin: config.direction };
        case "startedAt":
          return { startedAt: config.direction };
        case "completedAt":
          return { completedAt: config.direction };
        case "createdAt":
          return { createdAt: config.direction };
        default:
          return { createdAt: "desc" };
      }
    });
  }, [sortConfigs]);

  // Build query parameters
  const queryParams = useMemo(
    () => ({
      orderBy: buildOrderBy(),
      ...(searchText ? { searchingFor: searchText } : {}),
      ...filters,
      include: {
        task: {
          include: {
            customer: true,
          },
        },
        file: true,
        parentCut: {
          include: {
            file: true,
          },
        },
      },
    }),
    [searchText, filters, buildOrderBy],
  );

  const {
    items: cuts,
    isLoading,
    error,
    
    isRefetching,
    loadMore,
    canLoadMore,
    isFetchingNextPage,
    totalItemsLoaded,
    totalCount,
    refresh,
  } = useCutsInfiniteMobile(queryParams);

  const { delete: deleteCut } = useCutMutations();

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refresh();
    } finally {
      setRefreshing(false);
    }
  }, [refresh]);

  const handleCreateCut = () => {
    router.push(routeToMobilePath(routes.production.cutting.create) as any);
  };

  const handleCutPress = (cutId: string) => {
    router.push(routeToMobilePath(routes.production.cutting.details(cutId)) as any);
  };

  const handleEditCut = (cutId: string) => {
    router.push(routeToMobilePath(routes.production.cutting.edit(cutId)) as any);
  };

  const handleDeleteCut = useCallback(
    async (cutId: string) => {
      await deleteCut(cutId);
      if (selectedCuts.has(cutId)) {
        const newSelection = new Set(selectedCuts);
        newSelection.delete(cutId);
        setSelectedCuts(newSelection);
      }
    },
    [deleteCut, selectedCuts],
  );

  const handleSort = useCallback((configs: SortConfig[]) => {
    setSortConfigs(configs);
  }, []);

  const handleSelectionChange = useCallback((newSelection: Set<string>) => {
    setSelectedCuts(newSelection);
  }, []);

  const handleSearch = useCallback((text: string) => {
    setSearchText(text);
  }, []);

  const handleDisplaySearchChange = useCallback((text: string) => {
    setDisplaySearchText(text);
  }, []);

  const handleFilterChange = useCallback((newFilters: Partial<CutGetManyFormData>) => {
    setFilters(newFilters);
  }, []);

  const handleClearFilters = useCallback(() => {
    setFilters({});
    setSearchText("");
    setDisplaySearchText("");
    setSelectedCuts(new Set());
    setShowSelection(false);
  }, []);

  const handleColumnsChange = useCallback((newColumns: Set<string>) => {
    setVisibleColumnKeys(Array.from(newColumns));
  }, []);

  // Get all column definitions
  const allColumns = useMemo(() => createColumnDefinitions(), []);

  // Count active filters
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.where?.status) count++;
    if (filters.where?.type) count++;
    if (filters.where?.origin) count++;
    if (filters.where?.startedAt) count++;
    if (filters.where?.completedAt) count++;
    return count;
  }, [filters]);

  // Open filter panel
  const handleOpenFilters = useCallback(() => {
    setIsFilterPanelOpen(true);
  }, []);

  const handleCloseFilters = useCallback(() => {
    setIsFilterPanelOpen(false);
  }, []);

  // Open column panel
  const handleOpenColumns = useCallback(() => {
    setIsColumnPanelOpen(true);
  }, []);

  const handleCloseColumns = useCallback(() => {
    setIsColumnPanelOpen(false);
  }, []);

  // Only show skeleton on initial load, not on refetch/sort
  const isInitialLoad = isLoading && !isRefetching && cuts.length === 0;

  if (isInitialLoad) {
    return <CuttingPlanListSkeleton />;
  }

  if (error && cuts.length === 0) {
    return (
      <ThemedView style={styles.container}>
        <ErrorScreen message="Erro ao carregar cortes" detail={error.message} onRetry={handleRefresh} />
      </ThemedView>
    );
  }

  const hasCuts = Array.isArray(cuts) && cuts.length > 0;

  return (
    <>
      <ThemedView style={[styles.container, { backgroundColor: colors.background, paddingBottom: insets.bottom }]}>
        {/* Search and Filter */}
        <View style={styles.searchContainer}>
          <SearchBar
            value={displaySearchText}
            onChangeText={handleDisplaySearchChange}
            onSearch={handleSearch}
            placeholder="Buscar cortes..."
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
      <CuttingPlanFilterTags
        filters={filters}
        searchText={searchText}
        onFilterChange={handleFilterChange}
        onSearchChange={(text) => {
          setSearchText(text);
          setDisplaySearchText(text);
        }}
        onClearAll={handleClearFilters}
      />

      {hasCuts ? (
        <TableErrorBoundary onRetry={handleRefresh}>
          <CuttingPlanTable
            cuts={cuts}
            onCutPress={handleCutPress}
            onCutEdit={handleEditCut}
            onCutDelete={handleDeleteCut}
            onRefresh={handleRefresh}
            onEndReached={canLoadMore ? loadMore : undefined}
            refreshing={refreshing || isRefetching}
            loading={false}
            loadingMore={isFetchingNextPage}
            showSelection={showSelection}
            selectedCuts={selectedCuts}
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
            icon={searchText ? "search" : "scissors"}
            title={searchText ? "Nenhum corte encontrado" : "Nenhum corte cadastrado"}
            description={
              searchText ? `Nenhum resultado para "${searchText}"` : "Comece criando o primeiro plano de corte"
            }
            actionLabel={searchText ? undefined : "Criar Plano de Corte"}
            onAction={searchText ? undefined : handleCreateCut}
          />
        </View>
      )}

      {/* Items count */}
      {hasCuts && <ItemsCountDisplay loadedCount={totalItemsLoaded} totalCount={totalCount} isLoading={isFetchingNextPage} />}

      {hasCuts && <FAB icon="plus" onPress={handleCreateCut} />}
      </ThemedView>

      <SlideInPanel isOpen={isFilterPanelOpen} onClose={handleCloseFilters}>
        <CuttingPlanFilterDrawerContent
          filters={filters}
          onFilterChange={handleFilterChange}
          onClear={handleClearFilters}
          activeFiltersCount={activeFiltersCount}
          onClose={handleCloseFilters}
        />
      </SlideInPanel>

      <SlideInPanel isOpen={isColumnPanelOpen} onClose={handleCloseColumns}>
        <ColumnVisibilitySlidePanel
          columns={allColumns.map(col => ({
            key: col.key,
            header: col.label,
            sortable: col.sortable,
          }))}
          visibleColumns={new Set(visibleColumnKeys)}
          onVisibilityChange={handleColumnsChange}
          defaultColumns={new Set(["status", "type", "task"])}
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
});
