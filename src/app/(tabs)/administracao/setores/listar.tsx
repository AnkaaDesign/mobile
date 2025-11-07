import React, { useState, useCallback, useMemo } from "react";
import { View, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { IconFilter, IconList } from "@tabler/icons-react-native";
import { useSectorMutations } from '../../../../hooks';
import { useSectorsInfiniteMobile } from "@/hooks";
import type { SectorGetManyFormData } from '../../../../types';
import { ThemedView, FAB, ErrorScreen, EmptyState, ListActionButton, SearchBar } from "@/components/ui";
import { SectorTable, createColumnDefinitions } from "@/components/administration/sector/list/sector-table";
import { SectorFilterTags } from "@/components/administration/sector/list/sector-filter-tags";
import { ItemsCountDisplay } from "@/components/ui/items-count-display";
import { SectorListSkeleton } from "@/components/administration/sector/skeleton/sector-list-skeleton";
import { useTheme } from "@/lib/theme";
import { routes } from '../../../../constants';
import { routeToMobilePath } from "@/lib/route-mapper";


// New hooks and components
import { useTableSort } from "@/hooks/useTableSort";
import { useColumnVisibility } from "@/hooks/useColumnVisibility";

import { SECTOR_PRIVILEGES, SECTOR_PRIVILEGES_LABELS } from '../../../../constants';

import { SlideInPanel } from "@/components/ui/slide-in-panel";
import { GenericColumnDrawerContent } from "@/components/ui/generic-column-drawer-content";
import { SectorFilterDrawerContent } from "@/components/administration/sector/list/sector-filter-drawer-content";

export default function SectorListScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [displaySearchText, setDisplaySearchText] = useState("");

  // Slide panel state
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [isColumnPanelOpen, setIsColumnPanelOpen] = useState(false);

  // Filter state
  const [filters, setFilters] = useState<{
    privileges?: string[];
    hasUsers?: boolean;
    createdDateRange?: { from?: Date; to?: Date };
    updatedDateRange?: { from?: Date; to?: Date };
  }>({});

  const { buildOrderBy } = useTableSort(
    [{ columnKey: "name", direction: "asc", order: 0 }],
    3,
    false
  );

  const {
    visibleColumns,
    setVisibleColumns,
  } = useColumnVisibility(
    "sectors",
    ["name", "privileges"],
    ["name", "privileges", "createdAt", "updatedAt"]
  );

  // Build API query
  const buildWhereClause = useCallback(() => {
    const where: any = {};

    if (filters.privileges?.length) {
      where.privileges = { in: filters.privileges };
    }

    return Object.keys(where).length > 0 ? where : undefined;
  }, [filters]);

  // Build query parameters
  const queryParams = useMemo<SectorGetManyFormData>(() => {
    const orderByResult = buildOrderBy(
      {
        name: "name",
        privileges: "privileges",
        createdAt: "createdAt",
        updatedAt: "updatedAt",
      },
      { name: "asc" }
    );

    return {
      orderBy: orderByResult,
      ...(searchText ? { searchingFor: searchText } : {}),
      ...(buildWhereClause() ? { where: buildWhereClause() } : {}),
      ...(filters.hasUsers !== undefined ? { hasUsers: filters.hasUsers } : {}),
      ...(filters.createdDateRange?.from || filters.createdDateRange?.to ? {
        createdAt: {
          ...(filters.createdDateRange.from && { gte: filters.createdDateRange.from }),
          ...(filters.createdDateRange.to && { lte: filters.createdDateRange.to }),
        },
      } : {}),
      ...(filters.updatedDateRange?.from || filters.updatedDateRange?.to ? {
        updatedAt: {
          ...(filters.updatedDateRange.from && { gte: filters.updatedDateRange.from }),
          ...(filters.updatedDateRange.to && { lte: filters.updatedDateRange.to }),
        },
      } : {}),
      include: {
        _count: {
          select: {
            users: true,
            tasks: true,
          },
        },
      },
    };
  }, [searchText, buildWhereClause, buildOrderBy, filters]);

  const { items: sectors, isLoading, error, isRefetching, loadMore, canLoadMore, isFetchingNextPage, totalItemsLoaded, totalCount, refresh } = useSectorsInfiniteMobile(queryParams);
  const { delete: deleteSector } = useSectorMutations();

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refresh();
    } finally {
      setRefreshing(false);
    }
  }, [refresh]);

  const handleCreateSector = () => {
    router.push(routeToMobilePath(routes.administration.sectors.create) as any);
  };

  const handleSectorPress = (sectorId: string) => {
    router.push(routeToMobilePath(routes.administration.sectors.details(sectorId)) as any);
  };

  const handleEditSector = (sectorId: string) => {
    router.push(routeToMobilePath(routes.administration.sectors.edit(sectorId)) as any);
  };

  const handleDeleteSector = useCallback(
    async (sectorId: string) => {
      await deleteSector(sectorId);
    },
    [deleteSector],
  );

  const handleSearch = useCallback((text: string) => {
    setSearchText(text);
  }, []);

  const handleDisplaySearchChange = useCallback((text: string) => {
    setDisplaySearchText(text);
  }, []);

  const handleApplyFilters = useCallback(() => {
    // Filters are applied immediately through state
  }, []);

  const handleClearFilters = useCallback(() => {
    setFilters({});
    setSearchText("");
    setDisplaySearchText("");
  }, []);

  const handleColumnsChange = useCallback((newColumns: Set<string>) => {
    setVisibleColumns(newColumns);
  }, [setVisibleColumns]);

  // Get all column definitions
  const allColumns = useMemo(() => createColumnDefinitions(), []);

  // Count active filters
  const activeFiltersCount = Object.values(filters).filter(
    (value) => {
      if (value === undefined || value === null) return false;
      if (Array.isArray(value)) return value.length > 0;
      if (typeof value === "object") {
        // Check date ranges
        return Object.values(value).some(v => v !== undefined && v !== null);
      }
      return value === true;
    }
  ).length;

  const handleOpenFilters = useCallback(() => {
    setIsColumnPanelOpen(false); // Close column panel if open
    setIsFilterPanelOpen(true);
  }, []);

  const handleCloseFilters = useCallback(() => {
    setIsFilterPanelOpen(false);
  }, []);

  const handleOpenColumns = useCallback(() => {
    setIsFilterPanelOpen(false); // Close filter panel if open
    setIsColumnPanelOpen(true);
  }, []);

  const handleCloseColumns = useCallback(() => {
    setIsColumnPanelOpen(false);
  }, []);

  // Only show skeleton on initial load, not on refetch/sort
  const isInitialLoad = isLoading && !isRefetching && sectors.length === 0;

  if (isInitialLoad) {
    return <SectorListSkeleton />;
  }

  if (error && sectors.length === 0) {
    return (
      <ThemedView style={styles.container}>
        <ErrorScreen message="Erro ao carregar setores" detail={error.message} onRetry={handleRefresh} />
      </ThemedView>
    );
  }

  const hasSectors = Array.isArray(sectors) && sectors.length > 0;

  return (
    <>
      <ThemedView style={[styles.container, { backgroundColor: colors.background, paddingBottom: insets.bottom }]}>
      {/* Search and Filter */}
      <View style={styles.searchContainer}>
        <SearchBar
          value={displaySearchText}
          onChangeText={handleDisplaySearchChange}
          onSearch={handleSearch}
          placeholder="Buscar setores..."
          style={styles.searchBar}
          debounceMs={300}
        />
        <View style={styles.buttonContainer}>
          <ListActionButton
            icon={<IconList size={20} color={colors.foreground} />}
            onPress={handleOpenColumns}
            badgeCount={visibleColumns.size}
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

      {/* Filter tags */}
      <SectorFilterTags
        filters={queryParams}
        searchText={searchText}
        onFilterChange={(newFilters) => {
          // Extract filter state from query params
          const where = newFilters.where as any;
          if (where?.privileges?.in) {
            setFilters(prev => ({ ...prev, privileges: where.privileges.in }));
          }
          if (newFilters.hasUsers !== undefined) {
            setFilters(prev => ({ ...prev, hasUsers: newFilters.hasUsers }));
          }
          if (newFilters.createdAt) {
            setFilters(prev => ({ ...prev, createdDateRange: {
              from: newFilters.createdAt?.gte,
              to: newFilters.createdAt?.lte
            }}));
          }
          if (newFilters.updatedAt) {
            setFilters(prev => ({ ...prev, updatedDateRange: {
              from: newFilters.updatedAt?.gte,
              to: newFilters.updatedAt?.lte
            }}));
          }
        }}
        onSearchChange={(text) => {
          setSearchText(text);
          setDisplaySearchText(text);
        }}
        onClearAll={handleClearFilters}
      />

      {hasSectors ? (
        <SectorTable
          sectors={sectors}
          onSectorPress={handleSectorPress}
          onSectorEdit={handleEditSector}
          onSectorDelete={handleDeleteSector}
          onRefresh={handleRefresh}
          onEndReached={canLoadMore ? loadMore : undefined}
          refreshing={refreshing || isRefetching}
          loading={false}
          loadingMore={isFetchingNextPage}
          enableSwipeActions={true}
          visibleColumnKeys={Array.from(visibleColumns) as string[]}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <EmptyState
            icon={searchText ? "search" : "building"}
            title={searchText ? "Nenhum setor encontrado" : "Nenhum setor cadastrado"}
            description={searchText ? `Nenhum resultado para "${searchText}"` : "Comece cadastrando seu primeiro setor"}
            actionLabel={searchText ? undefined : "Cadastrar Setor"}
            onAction={searchText ? undefined : handleCreateSector}
          />
        </View>
      )}

      {/* Items count */}
      {hasSectors && <ItemsCountDisplay loadedCount={totalItemsLoaded} totalCount={totalCount} isLoading={isFetchingNextPage} />}

      {hasSectors && <FAB icon="plus" onPress={handleCreateSector} />}
    </ThemedView>

      {/* Slide-in panels */}
      <SlideInPanel isOpen={isFilterPanelOpen} onClose={handleCloseFilters}>
        <SectorFilterDrawerContent
          filters={filters}
          onFiltersChange={setFilters}
          onClear={handleClearFilters}
          activeFiltersCount={activeFiltersCount}
        />
      </SlideInPanel>

      <SlideInPanel isOpen={isColumnPanelOpen} onClose={handleCloseColumns}>
        <GenericColumnDrawerContent
          columns={allColumns}
          visibleColumns={visibleColumns}
          onVisibilityChange={handleColumnsChange}
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
