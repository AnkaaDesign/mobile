import React, { useState, useCallback } from "react";
import { View, ActivityIndicator, Pressable, Alert, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { IconPlus, IconFilter } from "@tabler/icons-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { usePositionMutations } from '../../../../hooks';
import { usePositionsInfiniteMobile } from "@/hooks";
import type { PositionGetManyFormData } from '../../../../schemas';
import { ThemedView, ThemedText, FAB, ErrorScreen, EmptyState, SearchBar, Badge } from "@/components/ui";
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
  const [sortConfigs, setSortConfigs] = useState<SortConfig[]>([{ columnKey: "name", direction: "asc" }]);

  // Build query parameters with sorting
  const buildOrderBy = () => {
    if (!sortConfigs || sortConfigs.length === 0) return { name: "asc" };

    // If only one sort, return as object
    if (sortConfigs.length === 1) {
      const config = sortConfigs[0];
      switch (config.columnKey) {
        case "name":
          return { name: config.direction };
        case "bonifiable":
          return { bonifiable: config.direction };
        case "remuneration":
          return { remuneration: config.direction };
        default:
          return { name: "asc" };
      }
    }

    // Multiple sorts, return as array
    return sortConfigs.map((config) => {
      switch (config.columnKey) {
        case "name":
          return { name: config.direction };
        case "bonifiable":
          return { bonifiable: config.direction };
        case "remuneration":
          return { remuneration: config.direction };
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
      _count: {
        select: {
          users: true,
          remunerations: true,
        },
      },
    },
  };

  const { items: positions, isLoading, error, refetch, isRefetching, loadMore, canLoadMore, isFetchingNextPage, totalItemsLoaded, refresh } = usePositionsInfiniteMobile(queryParams);
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
      try {
        await deletePosition(positionId);
      } catch (error) {
        Alert.alert("Erro", "Não foi possível excluir o cargo. Tente novamente.");
      }
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
      {hasPositions && <ItemsCountDisplay loadedCount={totalItemsLoaded} totalCount={undefined} isLoading={isFetchingNextPage} />}

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
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  actionButtonPressed: {
    opacity: 0.8,
  },
});
