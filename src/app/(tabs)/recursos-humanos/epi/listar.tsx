import { useState, useCallback } from "react";
import { View, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { IconFilter, IconList } from "@tabler/icons-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { usePpeInfiniteMobile } from "@/hooks";
import type { ItemGetManyFormData } from '../../../../schemas';
import { ThemedView, FAB, ErrorScreen, EmptyState, SearchBar, ListActionButton } from "@/components/ui";
import { PpeTable } from "@/components/human-resources/ppe/list/ppe-table";
import type { SortConfig } from "@/components/human-resources/ppe/list/ppe-table";

import { PpeFilterTags } from "@/components/human-resources/ppe/list/ppe-filter-tags";
import { TableErrorBoundary } from "@/components/ui/table-error-boundary";
import { ItemsCountDisplay } from "@/components/ui/items-count-display";
import { PpeListSkeleton } from "@/components/human-resources/ppe/skeleton/ppe-list-skeleton";
import { useTheme } from "@/lib/theme";
import { routes } from '../../../../constants';
import { routeToMobilePath } from "@/lib/route-mapper";

import { UtilityDrawerWrapper } from "@/components/ui/utility-drawer";
import { useUtilityDrawer } from "@/contexts/utility-drawer-context";
import { GenericColumnDrawerContent } from "@/components/ui/generic-column-drawer-content";
import { PpeFilterDrawerContent } from "@/components/human-resources/ppe/list/ppe-filter-drawer-content";

export default function PpeListScreen() {
  const router = useRouter();
  const { colors, } = useTheme();
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [displaySearchText, setDisplaySearchText] = useState("");
  const [filters, setFilters] = useState<Partial<ItemGetManyFormData>>({
    where: {
      ppeType: { not: null }, // Only show items that are PPE
    },
  });
  const [sortConfigs, setSortConfigs] = useState<SortConfig[]>([{ columnKey: "name", direction: "asc" }]);
  const [_showColumnManager, setShowColumnManager] = useState(false);
  const [visibleColumnKeys, ] = useState<string[]>(["name", "ppeType", "ppeCA", "quantity"]);

  // Build query parameters with sorting
  const buildOrderBy = () => {
    if (!sortConfigs || sortConfigs.length === 0) return { name: "asc" };

    // If only one sort, return as object
    if (sortConfigs.length === 1) {
      const config = sortConfigs[0];
      switch (config.columnKey) {
        case "name":
          return { name: config.direction };
        case "ppeType":
          return { ppeType: config.direction };
        case "ppeCA":
          return { ppeCA: config.direction };
        case "quantity":
          return { quantity: config.direction };
        case "createdAt":
          return { createdAt: config.direction };
        default:
          return { name: "asc" };
      }
    }

    // Multiple sorts, return as array
    return sortConfigs.map((config) => {
      switch (config.columnKey) {
        case "name":
          return { name: config.direction };
        case "ppeType":
          return { ppeType: config.direction };
        case "ppeCA":
          return { ppeCA: config.direction };
        case "quantity":
          return { quantity: config.direction };
        case "createdAt":
          return { createdAt: config.direction };
        default:
          return { name: "asc" };
      }
    });
  };

  const queryParams = {
    orderBy: buildOrderBy(),
    ...(searchText ? { searchingFor: searchText } : {}),
    ...filters,
    where: {
      ...filters.where,
      ppeType: { not: null }, // Always filter for PPE items
    },
    include: {
      category: true,
      brand: true,
      _count: {
        select: {
          ppeDeliveries: true,
          ppeSchedules: true,
        },
      },
    },
  };

  const { items, isLoading, error, isRefetching, loadMore, canLoadMore, isFetchingNextPage, totalItemsLoaded, totalCount, refresh } = usePpeInfiniteMobile(queryParams);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refresh();
    } finally {
      setRefreshing(false);
    }
  }, [refresh]);

  const handleCreatePpe = () => {
    router.push(routeToMobilePath(routes.humanResources.ppe.create) as any);
  };

  const handlePpePress = (ppeId: string) => {
    router.push(routeToMobilePath(routes.humanResources.ppe.details(ppeId)) as any);
  };

  const handleEditPpe = (ppeId: string) => {
    router.push(routeToMobilePath(routes.humanResources.ppe.edit(ppeId)) as any);
  };

  const handleViewDeliveries = (_epiId: string) => {
    router.push(routeToMobilePath(routes.humanResources.ppe.deliveries.root) as any);
  };

  const handleViewSchedules = (_epiId: string) => {
    router.push(routeToMobilePath(routes.humanResources.ppe.schedules.root) as any);
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

  const handleApplyFilters = useCallback((newFilters: Partial<ItemGetManyFormData>) => {
    setFilters({
      ...newFilters,
      where: {
        ...newFilters.where,
        ppeType: { not: null }, // Ensure PPE filter is always applied
      },
    });
    setShowFilters(false);
  }, []);

  const handleClearFilters = useCallback(() => {
    setFilters({
      where: {
        ppeType: { not: null },
      },
    });
    setSearchText("");
    setDisplaySearchText("");
  }, []);

  // Count active filters (excluding the ppeType filter)
  const activeFiltersCount = Object.entries(filters).filter(([key, value]) => {
    if (key === "where") {
      const whereFilters = Object.entries(value || {}).filter(([k, v]) => k !== "ppeType" && v !== undefined && v !== null);

  const handleOpenFilters = useCallback(() => {
    openFilterDrawer(() => (
      <PpeFilterDrawerContent
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
      return whereFilters.length > 0;
    }
    return value !== undefined && value !== null && (Array.isArray(value) ? value.length > 0 : true);
  }).length;

  if (isLoading && !isRefetching) {
    return <PpeListSkeleton />;
  }

  if (error) {
    return (
    <UtilityDrawerWrapper>

          <ThemedView style={styles.container}>
            <ErrorScreen message="Erro ao carregar EPIs" detail={error.message} onRetry={handleRefresh} />
          </ThemedView>
    
    </UtilityDrawerWrapper>
  );
  }

  const hasPpes = Array.isArray(items) && items.length > 0;

  return (
    <ThemedView style={[styles.container, { backgroundColor: colors.background, paddingBottom: insets.bottom }]}>
      {/* Search and Filter */}
      <View style={styles.searchContainer}>
        <SearchBar value={displaySearchText} onChangeText={handleDisplaySearchChange} onSearch={handleSearch} placeholder="Buscar EPIs..." style={styles.searchBar} debounceMs={300} />
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
      <PpeFilterTags
        filters={filters}
        searchText={searchText}
        onFilterChange={handleApplyFilters}
        onSearchChange={(text) => {
          setSearchText(text);
          setDisplaySearchText(text);
        }}
        onClearAll={handleClearFilters}
      />

      {hasPpes ? (
        <TableErrorBoundary onRetry={handleRefresh}>
          <PpeTable
            items={items}
            onItemPress={handlePpePress}
            onItemEdit={handleEditPpe}
            onViewDeliveries={handleViewDeliveries}
            onViewSchedules={handleViewSchedules}
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
            icon={searchText ? "search" : "shield"}
            title={searchText ? "Nenhum EPI encontrado" : "Nenhum EPI cadastrado"}
            description={searchText ? `Nenhum resultado para "${searchText}"` : "Comece cadastrando o primeiro EPI"}
            actionLabel={searchText ? undefined : "Cadastrar EPI"}
            onAction={searchText ? undefined : handleCreatePpe}
          />
        </View>
      )}

      {/* Items count */}
      {hasPpes && <ItemsCountDisplay loadedCount={totalItemsLoaded} totalCount={totalCount} isLoading={isFetchingNextPage} />}

      {hasPpes && <FAB icon="plus" onPress={handleCreatePpe} />}
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
