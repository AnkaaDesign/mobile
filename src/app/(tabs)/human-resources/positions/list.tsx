import React, { useState, useCallback } from "react";
import { View, ActivityIndicator, Pressable, Alert, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { IconPlus, IconFilter, IconList } from "@tabler/icons-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { usePositionMutations } from '../../../../hooks';
import { usePositionsInfiniteMobile } from "@/hooks";
import type { PositionGetManyFormData } from '../../../../schemas';
import { ThemedView, ThemedText, FAB, ErrorScreen, EmptyState, SearchBar, ListActionButton } from "@/components/ui";
import { PositionTable } from "@/components/human-resources/position/list/position-table";
import type { SortConfig } from "@/components/human-resources/position/list/position-table";
import { PositionFilterModal } from "@/components/human-resources/position/list/position-filter-modal";
import { PositionFilterTags } from "@/components/human-resources/position/list/position-filter-tags";
import { TableErrorBoundary } from "@/components/ui/table-error-boundary";
import { ItemsCountDisplay } from "@/components/ui/items-count-display";
import { PositionListSkeleton } from "@/components/human-resources/position/skeleton/position-list-skeleton";
import { useTheme } from "@/lib/theme";
import { routes } from '../../../../constants';
import { routeToMobilePath } from "@/lib/route-mapper";

export default function PositionListScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [displaySearchText, setDisplaySearchText] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<Partial<PositionGetManyFormData>>({});
  const [sortConfigs, setSortConfigs] = useState<SortConfig[]>([{ columnKey: "hierarchy", direction: "asc" }]);
  const [showColumnManager, setShowColumnManager] = useState(false);
  const [visibleColumnKeys, setVisibleColumnKeys] = useState<string[]>(["name", "hierarchy", "remuneration", "users"]);

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

  const { items: positions, isLoading, error, refetch, isRefetching, loadMore, canLoadMore, isFetchingNextPage, totalItemsLoaded, totalCount, refresh } = usePositionsInfiniteMobile(queryParams);
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
  const activeFiltersCount = Object.entries(filters).filter(([key, value]) => value !== undefined && value !== null && (Array.isArray(value) ? value.length > 0 : true)).length;

  if (isLoading && !isRefetching) {
    return <PositionListSkeleton />;
  }

  if (error) {
    return (
      <ThemedView style={styles.container}>
        <ErrorScreen message="Erro ao carregar cargos" detail={error.message} onRetry={handleRefresh} />
      </ThemedView>
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

      {/* Filter Modal */}
      <PositionFilterModal visible={showFilters} onClose={() => setShowFilters(false)} onApply={handleApplyFilters} currentFilters={filters} />
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
