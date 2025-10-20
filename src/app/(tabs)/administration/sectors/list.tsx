import React, { useState, useCallback, useMemo } from "react";
import { View, Alert, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { IconFilter, IconPlus, IconList } from "@tabler/icons-react-native";
import { useSectorMutations } from '../../../../hooks';
import { useSectorsInfiniteMobile } from "@/hooks";
import type { SectorGetManyFormData } from '../../../../types';
import { ThemedView, ThemedText, FAB, ErrorScreen, EmptyState, ListActionButton, SearchBar } from "@/components/ui";
import { SectorTable, createColumnDefinitions } from "@/components/administration/sector/list/sector-table";
import { SectorFilterTags } from "@/components/administration/sector/list/sector-filter-tags";
import { ItemsCountDisplay } from "@/components/ui/items-count-display";
import { SectorListSkeleton } from "@/components/administration/sector/skeleton/sector-list-skeleton";
import { useTheme } from "@/lib/theme";
import { routes } from '../../../../constants';
import { routeToMobilePath } from "@/lib/route-mapper";
import { ColumnVisibilityDrawerV2 } from "@/components/inventory/item/list/column-visibility-drawer-v2";

// New hooks and components
import { useTableSort } from "@/hooks/useTableSort";
import { useColumnVisibility } from "@/hooks/useColumnVisibility";
import { BaseFilterDrawer, BooleanFilter, MultiSelectFilter, DateRangeFilter } from "@/components/common/filters";
import { SECTOR_PRIVILEGES, SECTOR_PRIVILEGES_LABELS } from '../../../../constants';

export default function SectorListScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [displaySearchText, setDisplaySearchText] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [showColumnManager, setShowColumnManager] = useState(false);

  // Filter state
  const [filters, setFilters] = useState<{
    privileges?: string[];
    hasUsers?: boolean;
    createdDateRange?: { from?: Date; to?: Date };
    updatedDateRange?: { from?: Date; to?: Date };
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
  const queryParams = useMemo<SectorGetManyFormData>(() => ({
    orderBy: buildOrderBy(
      {
        name: "name",
        privileges: "privileges",
        createdAt: "createdAt",
        updatedAt: "updatedAt",
      },
      { name: "asc" }
    ),
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
  }), [searchText, buildWhereClause, buildOrderBy, filters]);

  const { items: sectors, isLoading, error, refetch, isRefetching, loadMore, canLoadMore, isFetchingNextPage, totalItemsLoaded, totalCount, refresh } = useSectorsInfiniteMobile(queryParams);
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
    setShowFilters(false);
  }, []);

  const handleClearFilters = useCallback(() => {
    setFilters({});
    setSearchText("");
    setDisplaySearchText("");
  }, []);

  const handleColumnsChange = useCallback((newColumns: Set<string>) => {
    setVisibleColumns(Array.from(newColumns));
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

  // Privilege options for multi-select
  const privilegeOptions = useMemo(() =>
    Object.values(SECTOR_PRIVILEGES).map((privilege) => ({
      value: privilege,
      label: SECTOR_PRIVILEGES_LABELS[privilege],
    })),
    []
  );

  // Filter sections for BaseFilterDrawer
  const filterSections = useMemo(() => [
    {
      id: "privileges",
      title: "Nível de Privilégio",
      defaultOpen: true,
      badge: filters.privileges?.length || 0,
      content: (
        <MultiSelectFilter
          label="Níveis de Privilégio"
          value={filters.privileges || []}
          onChange={(value) => setFilters(prev => ({ ...prev, privileges: value.length > 0 ? value : undefined }))}
          options={privilegeOptions}
          placeholder="Selecione os níveis..."
        />
      ),
    },
    {
      id: "status",
      title: "Status",
      defaultOpen: false,
      badge: filters.hasUsers !== undefined ? 1 : 0,
      content: (
        <BooleanFilter
          label="Apenas com funcionários"
          description="Filtrar por setores que possuem funcionários"
          value={!!filters.hasUsers}
          onChange={(value) => setFilters(prev => ({ ...prev, hasUsers: value || undefined }))}
        />
      ),
    },
    {
      id: "dates",
      title: "Datas",
      defaultOpen: false,
      badge: (filters.createdDateRange?.from || filters.createdDateRange?.to ? 1 : 0) + (filters.updatedDateRange?.from || filters.updatedDateRange?.to ? 1 : 0),
      content: (
        <>
          <DateRangeFilter
            label="Data de Criação"
            value={filters.createdDateRange}
            onChange={(range) => setFilters(prev => ({ ...prev, createdDateRange: range }))}
            showPresets={true}
          />
          <DateRangeFilter
            label="Data de Atualização"
            value={filters.updatedDateRange}
            onChange={(range) => setFilters(prev => ({ ...prev, updatedDateRange: range }))}
            showPresets={true}
          />
        </>
      ),
    },
  ], [filters, privilegeOptions]);

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
          visibleColumnKeys={visibleColumns}
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

      {/* New BaseFilterDrawer */}
      <BaseFilterDrawer
        open={showFilters}
        onOpenChange={setShowFilters}
        sections={filterSections}
        onApply={handleApplyFilters}
        onClear={handleClearFilters}
        activeFiltersCount={activeFiltersCount}
        title="Filtros de Setores"
        description="Configure os filtros para refinar sua busca"
      />

      {/* Column Visibility Drawer */}
      <ColumnVisibilityDrawerV2
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
