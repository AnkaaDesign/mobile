import React, { useState, useCallback, useMemo } from "react";
import { View, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { IconFilter, IconList } from "@tabler/icons-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { usePaintTypeMutations } from "../../../../hooks";
import { usePaintTypesInfiniteMobile } from "@/hooks/use-paint-types-infinite-mobile";
import type { PaintTypeGetManyFormData } from "../../../../schemas";
import { ThemedView, FAB, ErrorScreen, EmptyState, ListActionButton, SearchBar } from "@/components/ui";
import { PaintTypeTable, createColumnDefinitions } from "@/components/painting/paint-type/list/paint-type-table";
import type { SortConfig } from "@/components/painting/paint-type/list/paint-type-table";
import { PaintTypeFilterTags } from "@/components/painting/paint-type/list/paint-type-filter-tags";
import { PaintTypeFilterDrawer } from "@/components/painting/paint-type/list/paint-type-filter-drawer";
import { PaintTypeColumnVisibilityDrawer } from "@/components/painting/paint-type/list/paint-type-column-visibility-drawer";
import { TableErrorBoundary } from "@/components/ui/table-error-boundary";
import { ItemsCountDisplay } from "@/components/ui/items-count-display";
import { PaintTypeListSkeleton } from "@/components/painting/paint-type/skeleton/paint-type-list-skeleton";
import { useTheme } from "@/lib/theme";
import { routes } from "../../../../constants";
import { routeToMobilePath } from "@/lib/route-mapper";
import { useTableSort } from "@/hooks/useTableSort";
import { useColumnVisibility } from "@/hooks/useColumnVisibility";

export default function PaintTypeListScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [displaySearchText, setDisplaySearchText] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedPaintTypes, setSelectedPaintTypes] = useState<Set<string>>(new Set());
  const [showSelection, setShowSelection] = useState(false);
  const [showColumnManager, setShowColumnManager] = useState(false);

  // Filter state
  const [filters, setFilters] = useState<{
    needGround?: boolean;
  }>({});

  const { sortConfigs, handleSort, buildOrderBy } = useTableSort(
    [{ column: "name", direction: "asc", order: 0 }],
    3,
    false
  );

  const {
    visibleColumns,
    setVisibleColumns,
    isLoading: isColumnsLoading,
  } = useColumnVisibility(
    "paint-types",
    ["name", "needGround"],
    ["name", "needGround", "_count.paints", "createdAt"]
  );

  // Build API query
  const buildWhereClause = useCallback(() => {
    const where: any = {};

    if (filters.needGround !== undefined) {
      where.needGround = { equals: filters.needGround };
    }

    return Object.keys(where).length > 0 ? where : undefined;
  }, [filters]);

  const queryParams = useMemo(
    () => ({
      orderBy: buildOrderBy(
        {
          name: "name",
          needGround: "needGround",
          createdAt: "createdAt",
        },
        { name: "asc" }
      ),
      ...(searchText ? { searchingFor: searchText } : {}),
      ...(buildWhereClause() ? { where: buildWhereClause() } : {}),
      include: {
        _count: {
          select: {
            paints: true,
            componentItems: true,
          },
        },
      },
    }),
    [searchText, buildWhereClause, buildOrderBy]
  );

  const {
    paintTypes,
    isLoading,
    error,
    refetch,
    isRefetching,
    loadMore,
    canLoadMore,
    isFetchingNextPage,
    totalItemsLoaded,
    totalCount,
    refresh,
  } = usePaintTypesInfiniteMobile(queryParams);

  const { delete: deletePaintType } = usePaintTypeMutations();

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refresh();
    } finally {
      setRefreshing(false);
    }
  }, [refresh]);

  const handleCreatePaintType = () => {
    router.push(routeToMobilePath(routes.painting.paintTypes.create) as any);
  };

  const handlePaintTypePress = (paintTypeId: string) => {
    router.push(routeToMobilePath(routes.painting.paintTypes.details(paintTypeId)) as any);
  };

  const handleEditPaintType = (paintTypeId: string) => {
    router.push(routeToMobilePath(routes.painting.paintTypes.edit(paintTypeId)) as any);
  };

  const handleDeletePaintType = useCallback(
    async (paintTypeId: string) => {
      await deletePaintType(paintTypeId);
      if (selectedPaintTypes.has(paintTypeId)) {
        const newSelection = new Set(selectedPaintTypes);
        newSelection.delete(paintTypeId);
        setSelectedPaintTypes(newSelection);
      }
    },
    [deletePaintType, selectedPaintTypes]
  );

  const handleSelectionChange = useCallback((newSelection: Set<string>) => {
    setSelectedPaintTypes(newSelection);
  }, []);

  const handleSearch = useCallback((text: string) => {
    setSearchText(text);
  }, []);

  const handleDisplaySearchChange = useCallback((text: string) => {
    setDisplaySearchText(text);
  }, []);

  const handleApplyFilters = useCallback(() => {
    setShowFilters(false);
  }, []);

  const handleClearFilters = useCallback(() => {
    setFilters({});
    setSearchText("");
    setDisplaySearchText("");
    setSelectedPaintTypes(new Set());
    setShowSelection(false);
  }, []);

  const handleColumnsChange = useCallback(
    (newColumns: Set<string>) => {
      setVisibleColumns(Array.from(newColumns));
    },
    [setVisibleColumns]
  );

  // Get all column definitions
  const allColumns = useMemo(() => createColumnDefinitions(), []);

  // Count active filters
  const activeFiltersCount = Object.values(filters).filter(
    (value) => value !== undefined && value !== null
  ).length;

  // Only show skeleton on initial load, not on refetch/sort
  const isInitialLoad = isLoading && !isRefetching && paintTypes.length === 0;

  if (isInitialLoad) {
    return <PaintTypeListSkeleton />;
  }

  if (error && paintTypes.length === 0) {
    return (
      <ThemedView style={styles.container}>
        <ErrorScreen
          message="Erro ao carregar tipos de tinta"
          detail={error.message}
          onRetry={handleRefresh}
        />
      </ThemedView>
    );
  }

  const hasPaintTypes = Array.isArray(paintTypes) && paintTypes.length > 0;

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
          placeholder="Buscar tipos de tinta..."
          style={styles.searchBar}
          debounceMs={300}
        />
        <View style={styles.buttonContainer}>
          <ListActionButton
            icon={<IconList size={20} color={colors.foreground} />}
            onPress={() => setShowColumnManager(true)}
            badgeCount={visibleColumns.length}
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
      <PaintTypeFilterTags
        filters={filters}
        searchText={searchText}
        onFilterChange={setFilters}
        onSearchChange={(text) => {
          setSearchText(text);
          setDisplaySearchText(text);
        }}
        onClearAll={handleClearFilters}
      />

      {hasPaintTypes ? (
        <TableErrorBoundary onRetry={handleRefresh}>
          <PaintTypeTable
            paintTypes={paintTypes}
            onPaintTypePress={handlePaintTypePress}
            onPaintTypeEdit={handleEditPaintType}
            onPaintTypeDelete={handleDeletePaintType}
            onRefresh={handleRefresh}
            onEndReached={canLoadMore ? loadMore : undefined}
            refreshing={refreshing || isRefetching}
            loading={false}
            loadingMore={isFetchingNextPage}
            showSelection={showSelection}
            selectedPaintTypes={selectedPaintTypes}
            onSelectionChange={handleSelectionChange}
            sortConfigs={sortConfigs as SortConfig[]}
            onSort={(configs) => handleSort(configs[0]?.columnKey || "name")}
            visibleColumnKeys={visibleColumns}
            enableSwipeActions={true}
          />
        </TableErrorBoundary>
      ) : (
        <View style={styles.emptyContainer}>
          <EmptyState
            icon={searchText ? "search" : "brush"}
            title={searchText ? "Nenhum tipo encontrado" : "Nenhum tipo de tinta cadastrado"}
            description={
              searchText
                ? `Nenhum resultado para "${searchText}"`
                : "Comece cadastrando o primeiro tipo de tinta"
            }
            actionLabel={searchText ? undefined : "Cadastrar Tipo"}
            onAction={searchText ? undefined : handleCreatePaintType}
          />
        </View>
      )}

      {/* Items count */}
      {hasPaintTypes && (
        <ItemsCountDisplay
          loadedCount={totalItemsLoaded}
          totalCount={totalCount}
          isLoading={isFetchingNextPage}
        />
      )}

      {hasPaintTypes && <FAB icon="plus" onPress={handleCreatePaintType} />}

      {/* Filter Drawer */}
      <PaintTypeFilterDrawer
        open={showFilters}
        onOpenChange={setShowFilters}
        filters={filters}
        onFiltersChange={setFilters}
        onApply={handleApplyFilters}
        onClear={handleClearFilters}
        activeFiltersCount={activeFiltersCount}
      />

      {/* Column Visibility Drawer */}
      <PaintTypeColumnVisibilityDrawer
        columns={allColumns}
        visibleColumns={new Set(visibleColumns)}
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
