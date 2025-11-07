import { useState, useCallback, useMemo } from "react";
import { View, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { IconFilter } from "@tabler/icons-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { usePpeSizesInfiniteMobile } from "@/hooks";
import type { PpeSizeGetManyFormData } from '../../../../../schemas';
import { ThemedView, ThemedText, FAB, ErrorScreen, EmptyState, SearchBar, ListActionButton } from "@/components/ui";
import { PpeSizeTable } from "@/components/human-resources/ppe/size/list/ppe-size-table";
import type { SortConfig } from "@/components/human-resources/ppe/size/list/ppe-size-table";
import { PpeSizeFilterTags } from "@/components/human-resources/ppe/size/list/ppe-size-filter-tags";
import { TableErrorBoundary } from "@/components/ui/table-error-boundary";
import { ItemsCountDisplay } from "@/components/ui/items-count-display";
import { PpeSizeListSkeleton } from "@/components/human-resources/ppe/size/skeleton/ppe-size-list-skeleton";
import { useTheme } from "@/lib/theme";
import { routes } from '../../../../../constants';
import { routeToMobilePath } from "@/lib/route-mapper";
import { SlideInPanel } from "@/components/ui/slide-in-panel";
import { PpeSizeFilterDrawerContent } from "@/components/human-resources/ppe/size/list/ppe-size-filter-drawer-content";

export default function PpeSizeListScreen() {
  const router = useRouter();
  const { colors, } = useTheme();
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [displaySearchText, setDisplaySearchText] = useState("");
  const [filters, setFilters] = useState<Partial<PpeSizeGetManyFormData>>({});
  const [sortConfigs, setSortConfigs] = useState<SortConfig[]>([{ columnKey: "employee", direction: "asc" }]);

  // Build query parameters with sorting
  const buildOrderBy = () => {
    if (!sortConfigs || sortConfigs.length === 0) return { user: { name: "asc" } };

    // If only one sort, return as object
    if (sortConfigs.length === 1) {
      const config = sortConfigs[0];
      switch (config.columnKey) {
        case "employee":
          return { user: { name: config.direction } };
        case "shirts":
          return { shirts: config.direction };
        case "pants":
          return { pants: config.direction };
        case "boots":
          return { boots: config.direction };
        case "completeness":
          // Sort by number of missing sizes (calculated field)
          return { user: { name: config.direction } }; // Fallback to name
        default:
          return { user: { name: "asc" } };
      }
    }

    // Multiple sorts, return as array
    return sortConfigs.map((config) => {
      switch (config.columnKey) {
        case "employee":
          return { user: { name: config.direction } };
        case "shirts":
          return { shirts: config.direction };
        case "pants":
          return { pants: config.direction };
        case "boots":
          return { boots: config.direction };
        case "completeness":
          return { user: { name: config.direction } };
        default:
          return { user: { name: "asc" } };
      }
    });
  };

  const queryParams = {
    orderBy: buildOrderBy(),
    ...(searchText ? { searchingFor: searchText } : {}),
    ...filters,
    include: {
      user: true,
    },
  };

  const { ppeSizes, isLoading, error, isRefetching, loadMore, canLoadMore, isFetchingNextPage, totalItemsLoaded, totalCount, refresh } = usePpeSizesInfiniteMobile(queryParams);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refresh();
    } finally {
      setRefreshing(false);
    }
  }, [refresh]);

  const handleCreatePpeSize = () => {
    router.push(routeToMobilePath(routes.humanResources.ppe.sizes.create) as any);
  };

  const handlePpeSizePress = (ppeSizeId: string) => {
    router.push(routeToMobilePath(routes.humanResources.ppe.sizes.details(ppeSizeId)) as any);
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

  const handleApplyFilters = useCallback((newFilters: Partial<PpeSizeGetManyFormData>) => {
    setFilters(newFilters);
  }, []);

  const handleClearFilters = useCallback(() => {
    setFilters({});
    setSearchText("");
    setDisplaySearchText("");
  }, []);

  // Count active filters
  const activeFiltersCount = Object.entries(filters).filter(([_key, value]) => value !== undefined && value !== null && (Array.isArray(value) ? value.length > 0 : true)).length;

  const handleOpenFilters = useCallback(() => {
    setIsFilterPanelOpen(true);
  }, []);

  const handleCloseFilters = useCallback(() => {
    setIsFilterPanelOpen(false);
  }, []);

  // Calculate completion statistics
  const statistics = useMemo(() => {
    if (!ppeSizes || ppeSizes.length === 0) {
      return { total: 0, complete: 0, incomplete: 0, percentage: 0 };
    }

    const complete = ppeSizes.filter((size) => size.shirts && size.pants && size.boots).length;
    const incomplete = ppeSizes.length - complete;
    const percentage = (complete / ppeSizes.length) * 100;

    return {
      total: ppeSizes.length,
      complete,
      incomplete,
      percentage: Math.round(percentage),
    };
  }, [ppeSizes]);

  if (isLoading && !isRefetching) {
    return <PpeSizeListSkeleton />;
  }

  if (error) {
    return (
      <ThemedView style={styles.container}>
        <ErrorScreen message="Erro ao carregar tamanhos de EPI" detail={error.message} onRetry={handleRefresh} />
      </ThemedView>
    );
  }

  const hasPpeSizes = Array.isArray(ppeSizes) && ppeSizes.length > 0;

  return (
    <>
      <ThemedView style={[styles.container, { backgroundColor: colors.background, paddingBottom: insets.bottom }]}>
        {/* Search and Filter */}
        <View style={[styles.searchContainer]}>
          <SearchBar value={displaySearchText} onChangeText={handleDisplaySearchChange} onSearch={handleSearch} placeholder="Buscar por funcionário..." style={styles.searchBar} debounceMs={300} />
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
        <PpeSizeFilterTags
          filters={filters}
          searchText={searchText}
          onFilterChange={handleApplyFilters}
          onSearchChange={(text) => {
            setSearchText(text);
            setDisplaySearchText(text);
          }}
          onClearAll={handleClearFilters}
        />

        {/* Statistics */}
        {hasPpeSizes && !searchText && Object.keys(filters).length === 0 && (
          <View style={[styles.statisticsContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.statisticsRow}>
              <View style={styles.statisticItem}>
                <ThemedText style={styles.statisticValue}>{statistics.complete}</ThemedText>
                <ThemedText style={styles.statisticLabel}>Completos</ThemedText>
              </View>
              <View style={[styles.statisticItem, styles.statisticItemCenter]}>
                <ThemedText style={[styles.statisticValue, { color: statistics.incomplete > 0 ? colors.destructive : colors.foreground }]}>{statistics.incomplete}</ThemedText>
                <ThemedText style={styles.statisticLabel}>Incompletos</ThemedText>
              </View>
              <View style={styles.statisticItem}>
                <ThemedText style={styles.statisticValue}>{statistics.percentage}%</ThemedText>
                <ThemedText style={styles.statisticLabel}>Completude</ThemedText>
              </View>
            </View>
          </View>
        )}

        {hasPpeSizes ? (
          <TableErrorBoundary onRetry={handleRefresh}>
            <PpeSizeTable
              ppeSizes={ppeSizes}
              onSizePress={handlePpeSizePress}
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
              icon={searchText ? "search" : "ruler"}
              title={searchText ? "Nenhum tamanho encontrado" : "Nenhum tamanho cadastrado"}
              description={searchText ? `Nenhum resultado para "${searchText}"` : "Comece cadastrando tamanhos de EPI para os funcionários"}
              actionLabel={searchText ? undefined : "Cadastrar Tamanho"}
              onAction={searchText ? undefined : handleCreatePpeSize}
            />
          </View>
        )}

        {/* Items count */}
        {hasPpeSizes && <ItemsCountDisplay loadedCount={totalItemsLoaded} totalCount={totalCount} isLoading={isFetchingNextPage} />}

        {hasPpeSizes && <FAB icon="plus" onPress={handleCreatePpeSize} />}
      </ThemedView>

      <SlideInPanel isOpen={isFilterPanelOpen} onClose={handleCloseFilters}>
        <PpeSizeFilterDrawerContent
          filters={filters}
          onFiltersChange={setFilters}
          onClear={handleClearFilters}
          activeFiltersCount={activeFiltersCount}
          onClose={handleCloseFilters}
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
  statisticsContainer: {
    marginHorizontal: 8,
    marginVertical: 8,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
  },
  statisticsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  statisticItem: {
    flex: 1,
    alignItems: "flex-start",
  },
  statisticItemCenter: {
    alignItems: "center",
  },
  statisticValue: {
    fontSize: 24,
    fontWeight: "700",
  },
  statisticLabel: {
    fontSize: 12,
    opacity: 0.7,
    marginTop: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
