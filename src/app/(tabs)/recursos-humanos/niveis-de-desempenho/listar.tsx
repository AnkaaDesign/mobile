import { useState, useCallback } from "react";
import { View, StyleSheet } from "react-native";
import { } from "expo-router";
import { IconFilter, IconList } from "@tabler/icons-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useUsersInfiniteMobile } from "@/hooks";
import type { UserGetManyFormData } from '../../../../schemas';
import { ThemedView, ErrorScreen, EmptyState, SearchBar, ListActionButton } from "@/components/ui";
import { PerformanceLevelTable } from "@/components/human-resources/performance-level/list/performance-level-table";
import type { SortConfig } from "@/components/human-resources/performance-level/list/performance-level-table";
import { PerformanceLevelFilterModal } from "@/components/human-resources/performance-level/list/performance-level-filter-modal";
import { PerformanceLevelFilterTags } from "@/components/human-resources/performance-level/list/performance-level-filter-tags";
import { TableErrorBoundary } from "@/components/ui/table-error-boundary";
import { ItemsCountDisplay } from "@/components/ui/items-count-display";
import { PerformanceLevelListSkeleton } from "@/components/human-resources/performance-level/skeleton/performance-level-list-skeleton";
import { useTheme } from "@/lib/theme";

export default function PerformanceLevelsListScreen() {

  const { colors, } = useTheme();
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [displaySearchText, setDisplaySearchText] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<Partial<UserGetManyFormData>>({});
  const [sortConfigs, setSortConfigs] = useState<SortConfig[]>([{ columnKey: "name", direction: "asc" }]);
  const [_showColumnManager, setShowColumnManager] = useState(false);
  const [visibleColumnKeys, ] = useState<string[]>(["name", "position", "performanceLevel"]);

  // Build query parameters with sorting
  const buildOrderBy = () => {
    if (!sortConfigs || sortConfigs.length === 0) return { name: "asc" };

    // If only one sort, return as object
    if (sortConfigs.length === 1) {
      const config = sortConfigs[0];
      switch (config.columnKey) {
        case "name":
          return { name: config.direction };
        case "email":
          return { email: config.direction };
        case "position":
        case "position.name":
          return { position: { name: config.direction } };
        case "sector":
        case "sector.name":
          return { sector: { name: config.direction } };
        case "performanceLevel":
          return { performanceLevel: config.direction };
        default:
          return { name: "asc" };
      }
    }

    // Multiple sorts, return as array
    return sortConfigs.map((config) => {
      switch (config.columnKey) {
        case "name":
          return { name: config.direction };
        case "email":
          return { email: config.direction };
        case "position":
        case "position.name":
          return { position: { name: config.direction } };
        case "sector":
        case "sector.name":
          return { sector: { name: config.direction } };
        case "performanceLevel":
          return { performanceLevel: config.direction };
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
      position: true,
      sector: true,
    },
  };

  const { users, isLoading, error, isRefetching, loadMore, canLoadMore, isFetchingNextPage, totalItemsLoaded, totalCount, refresh } = useUsersInfiniteMobile(queryParams);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refresh();
    } finally {
      setRefreshing(false);
    }
  }, [refresh]);

  const handleUserPress = (_userId: string) => {
    // Navigate to user details page if available
    // router.push(routeToMobilePath(routes.humanResources.users.details(_userId)) as any);
  };

  const handleSort = useCallback((configs: SortConfig[]) => {
    setSortConfigs(configs);
  }, []);

  const handleSearch = useCallback((text: string) => {
    setSearchText(text);
  }, []);

  const handleDisplaySearchChange = useCallback((text: string) => {
    setDisplaySearchText(text);
  }, []);

  const handleApplyFilters = useCallback((newFilters: Partial<UserGetManyFormData>) => {
    setFilters(newFilters);
    setShowFilters(false);
  }, []);

  const handleClearFilters = useCallback(() => {
    setFilters({});
    setSearchText("");
    setDisplaySearchText("");
  }, []);

  // Count active filters
  const activeFiltersCount = Object.entries(filters).filter(
    ([_key, value]) => value !== undefined && value !== null && (Array.isArray(value) ? value.length > 0 : true),
  ).length;

  if (isLoading && !isRefetching) {
    return <PerformanceLevelListSkeleton />;
  }

  if (error) {
    return (
      <ThemedView style={styles.container}>
        <ErrorScreen message="Erro ao carregar níveis de performance" detail={error.message} onRetry={handleRefresh} />
      </ThemedView>
    );
  }

  const hasUsers = Array.isArray(users) && users.length > 0;

  return (
    <ThemedView style={[styles.container, { backgroundColor: colors.background, paddingBottom: insets.bottom }]}>
      {/* Search, Filter and Sort */}
      <View style={styles.searchContainer}>
        <SearchBar
          value={displaySearchText}
          onChangeText={handleDisplaySearchChange}
          onSearch={handleSearch}
          placeholder="Buscar funcionários..."
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
      <PerformanceLevelFilterTags
        filters={filters}
        searchText={searchText}
        onFilterChange={handleApplyFilters}
        onSearchChange={(text) => {
          setSearchText(text);
          setDisplaySearchText(text);
        }}
        onClearAll={handleClearFilters}
      />

      {hasUsers ? (
        <TableErrorBoundary onRetry={handleRefresh}>
          <PerformanceLevelTable
            users={users}
            onUserPress={handleUserPress}
            onRefresh={handleRefresh}
            onEndReached={canLoadMore ? loadMore : undefined}
            refreshing={refreshing}
            loading={isLoading && !isRefetching}
            loadingMore={isFetchingNextPage}
            sortConfigs={sortConfigs}
            onSort={handleSort}
          />
        </TableErrorBoundary>
      ) : (
        <View style={styles.emptyContainer}>
          <EmptyState
            icon={searchText ? "search" : "users"}
            title={searchText ? "Nenhum funcionário encontrado" : "Nenhum funcionário cadastrado"}
            description={searchText ? `Nenhum resultado para "${searchText}"` : "Não há funcionários ativos cadastrados no sistema"}
          />
        </View>
      )}

      {/* Items count */}
      {hasUsers && <ItemsCountDisplay loadedCount={totalItemsLoaded} totalCount={totalCount} isLoading={isFetchingNextPage} />}

      {/* Filter Modal */}
      <PerformanceLevelFilterModal visible={showFilters} onClose={() => setShowFilters(false)} onApply={handleApplyFilters} currentFilters={filters} />
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