import { useState, useCallback } from "react";
import { View, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { IconFilter } from "@tabler/icons-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { usePositionMutations } from '../../../../hooks';
import { usePositionsInfiniteMobile } from "@/hooks";
import type { PositionGetManyFormData } from '../../../../schemas';
import { ThemedView, FAB, ErrorScreen, EmptyState, SearchBar, ListActionButton } from "@/components/ui";
import { PositionTable } from "@/components/human-resources/position/list/position-table";
import type { SortConfig } from "@/components/human-resources/position/list/position-table";

import { PositionFilterTags } from "@/components/human-resources/position/list/position-filter-tags";
import { TableErrorBoundary } from "@/components/ui/table-error-boundary";
import { ItemsCountDisplay } from "@/components/ui/items-count-display";
import { PositionListSkeleton } from "@/components/human-resources/position/skeleton/position-list-skeleton";
import { useTheme } from "@/lib/theme";
import { routes } from '../../../../constants';
import { routeToMobilePath } from "@/lib/route-mapper";

import { UtilityDrawerWrapper } from "@/components/ui/utility-drawer";
import { useUtilityDrawer } from "@/contexts/utility-drawer-context";
import { GenericColumnDrawerContent } from "@/components/ui/generic-column-drawer-content";
import { PositionFilterDrawerContent } from "@/components/human-resources/position/list/position-filter-drawer-content";

export default function PositionListScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { openFilterDrawer, openColumnDrawer } = useUtilityDrawer();
  const [refreshing, setRefreshing] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [displaySearchText, setDisplaySearchText] = useState("");
  const [filters, setFilters] = useState<Partial<PositionGetManyFormData>>({});
  const [sortConfigs, setSortConfigs] = useState<SortConfig[]>([{ columnKey: "hierarchy", direction: "asc" }]);
  const [visibleColumnKeys] = useState<string[]>(["name", "hierarchy", "remuneration", "users"]);

  // Build query parameters with sorting
  const buildOrderBy = () => {
    if (!sortConfigs || sortConfigs.length === 0) return { hierarchy: "asc" };

    // If only one sort, return as object
    if (sortConfigs.length === 1) {
      const config = sortConfigs[0];
      switch (config.columnKey) {
        case "name":
          return { name: config.direction };
        case "hierarchy":
          return { hierarchy: config.direction };
        case "bonifiable":
          return { bonifiable: config.direction };
        case "remuneration":
          return { remuneration: config.direction };
        default:
          return { hierarchy: "asc" };
      }
    }

    // Multiple sorts, return as array
    return sortConfigs.map((config) => {
      switch (config.columnKey) {
        case "name":
          return { name: config.direction };
        case "hierarchy":
          return { hierarchy: config.direction };
        case "bonifiable":
          return { bonifiable: config.direction };
        case "remuneration":
          return { remuneration: config.direction };
        default:
          return { hierarchy: "asc" };
      }
    });
  };

  const queryParams = {
    orderBy: buildOrderBy(),
    ...(searchText ? { searchingFor: searchText } : {}),
    ...filters,
    include: {
      _count: {
        select: {
          users: true,
          monetaryValues: true,
          remunerations: true, // DEPRECATED
        },
      },
      // Fetch monetary values (new approach)
      monetaryValues: {
        orderBy: { createdAt: 'desc' },
        take: 5,
      },
      // Also fetch deprecated remunerations for backwards compatibility
      remunerations: {
        take: 1,
        orderBy: { createdAt: 'desc' },
      },
    },
  };

  const { items: positions, isLoading, error, isRefetching, loadMore, canLoadMore, isFetchingNextPage, totalItemsLoaded, totalCount, refresh } = usePositionsInfiniteMobile(queryParams);
  const { delete: deletePosition } = usePositionMutations();

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refresh();
    } finally {
      setRefreshing(false);
    }
  }, [refresh]);

  const handleCreatePosition = () => {
    router.push(routeToMobilePath(routes.humanResources.positions.create) as any);
  };

  const handlePositionPress = (positionId: string) => {
    router.push(routeToMobilePath(routes.humanResources.positions.details(positionId)) as any);
  };

  const handleEditPosition = (positionId: string) => {
    router.push(routeToMobilePath(routes.humanResources.positions.edit(positionId)) as any);
  };

  const handleDeletePosition = useCallback(
    async (positionId: string) => {
      await deletePosition(positionId);
    },
    [deletePosition],
  );

  const handleSort = useCallback((configs: SortConfig[]) => {
    setSortConfigs(configs);
  }, []);

  const handleSearch = useCallback((text: string) => {
    setSearchText(text);
  }, []);

  const handleDisplaySearchChange = useCallback((text: string) => {
    setDisplaySearchText(text);
  }, []);

  const handleApplyFilters = useCallback((newFilters: Partial<PositionGetManyFormData>) => {
    setFilters(newFilters);
    setShowFilters(false);
  }, []);

  const handleClearFilters = useCallback(() => {
    setFilters({});
    setSearchText("");
    setDisplaySearchText("");
  }, []);

  // Count active filters
  const activeFiltersCount = Object.entries(filters).filter(([_key, value]) => value !== undefined && value !== null && (Array.isArray(value) ? value.length > 0 : true)).length;

  const handleOpenFilters = useCallback(() => {
    openFilterDrawer(() => (
      <PositionFilterDrawerContent
        filters={filters}
        onFiltersChange={setFilters}
        onClear={handleClearFilters}
        activeFiltersCount={activeFiltersCount}
      />
    ));
  }, [openFilterDrawer, filters, handleClearFilters, activeFiltersCount]);

  const handleOpenColumns = useCallback(() => {
    openColumnDrawer(() => (
      <GenericColumnDrawerContent
        columns={allColumns}
        visibleColumns={visibleColumns}
        onVisibilityChange={handleColumnsChange}
      />
    ));
  }, [openColumnDrawer, allColumns, visibleColumns, handleColumnsChange]);

  if (isLoading && !isRefetching) {
    return <PositionListSkeleton />;
  }

  if (error) {
    return (
    <UtilityDrawerWrapper>

          <ThemedView style={styles.container}>
            <ErrorScreen message="Erro ao carregar cargos" detail={error.message} onRetry={handleRefresh} />
          </ThemedView>
    
    </UtilityDrawerWrapper>
  );
  }

  const hasPositions = Array.isArray(positions) && positions.length > 0;

  return (
    <ThemedView style={[styles.container, { backgroundColor: colors.background, paddingBottom: insets.bottom }]}>
      {/* Search and Filter */}
      <View style={[styles.searchContainer]}>
        <SearchBar value={displaySearchText} onChangeText={handleDisplaySearchChange} onSearch={handleSearch} placeholder="Buscar cargos..." style={styles.searchBar} debounceMs={300} />
        <View style={styles.buttonContainer}>
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
      <PositionFilterTags
        filters={filters}
        searchText={searchText}
        onFilterChange={handleApplyFilters}
        onSearchChange={(text) => {
          setSearchText(text);
          setDisplaySearchText(text);
        }}
        onClearAll={handleClearFilters}
      />

      {hasPositions ? (
        <TableErrorBoundary onRetry={handleRefresh}>
          <PositionTable
            positions={positions}
            onPositionPress={handlePositionPress}
            onPositionEdit={handleEditPosition}
            onPositionDelete={handleDeletePosition}
            onRefresh={handleRefresh}
            onEndReached={canLoadMore ? loadMore : undefined}
            refreshing={refreshing}
            loading={isLoading && !isRefetching}
            loadingMore={isFetchingNextPage}
            sortConfigs={sortConfigs}
            onSort={handleSort}
            enableSwipeActions={true}
            visibleColumnKeys={visibleColumnKeys}
          />
        </TableErrorBoundary>
      ) : (
        <View style={styles.emptyContainer}>
          <EmptyState
            icon={searchText ? "search" : "briefcase"}
            title={searchText ? "Nenhum cargo encontrado" : "Nenhum cargo cadastrado"}
            description={searchText ? `Nenhum resultado para "${searchText}"` : "Comece cadastrando seu primeiro cargo"}
            actionLabel={searchText ? undefined : "Cadastrar Cargo"}
            onAction={searchText ? undefined : handleCreatePosition}
          />
        </View>
      )}

      {/* Items count */}
      {hasPositions && <ItemsCountDisplay loadedCount={totalItemsLoaded} totalCount={totalCount} isLoading={isFetchingNextPage} />}

      {hasPositions && <FAB icon="plus" onPress={handleCreatePosition} />}
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
