import React, { useState, useCallback, useMemo } from "react";
import { View, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { IconFilter, IconList } from "@tabler/icons-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAirbrushingMutations } from '../../../../hooks';
import { useAirbrushingsInfinite } from '../../../../hooks';
import { useAuth } from "@/contexts/auth-context";
import { hasPrivilege } from '../../../../utils';
import { SECTOR_PRIVILEGES } from '../../../../constants';

import { ThemedView, FAB, ErrorScreen, EmptyState, ListActionButton, SearchBar } from "@/components/ui";
import { AirbrushingTable, createColumnDefinitions } from "@/components/production/airbrushing/list/airbrushing-table";

import { AirbrushingFilterTags } from "@/components/production/airbrushing/list/airbrushing-filter-tags";
import { TableErrorBoundary } from "@/components/ui/table-error-boundary";
import { ItemsCountDisplay } from "@/components/ui/items-count-display";
import { AirbrushingListSkeleton } from "@/components/production/airbrushing/skeleton/airbrushing-list-skeleton";
import { useTheme } from "@/lib/theme";
import { SlideInPanel } from "@/components/ui/slide-in-panel";

// New hooks
import { useTableSort } from "@/hooks/useTableSort";
import { useColumnVisibility } from "@/hooks/useColumnVisibility";

// Import drawer content components
import { AirbrushingFilterDrawerContent } from "@/components/production/airbrushing/list/airbrushing-filter-drawer-content";
import { AirbrushingColumnDrawerContent } from "@/components/production/airbrushing/list/airbrushing-column-drawer-content";

export default function AirbrushingListScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [displaySearchText, setDisplaySearchText] = useState("");
  const [selectedAirbrushings, setSelectedAirbrushings] = useState<Set<string>>(new Set());
  const [showSelection, setShowSelection] = useState(false);
  const searchInputRef = React.useRef<any>(null);

  // Panel state
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [isColumnPanelOpen, setIsColumnPanelOpen] = useState(false);

  // Permission check
  const canManageAirbrushing = useMemo(() => {
    if (!user) return false;
    return hasPrivilege(user, SECTOR_PRIVILEGES.PRODUCTION) ||
           hasPrivilege(user, SECTOR_PRIVILEGES.LEADER) ||
           hasPrivilege(user, SECTOR_PRIVILEGES.ADMIN);
  }, [user]);

  const isAdmin = useMemo(() => {
    if (!user) return false;
    return hasPrivilege(user, SECTOR_PRIVILEGES.ADMIN);
  }, [user]);

  // Filter state
  const [filters, setFilters] = useState<{
    status?: string[];
    taskId?: string;
    customerId?: string;
    hasPrice?: boolean;
    priceRange?: { min?: number; max?: number };
    dateRange?: { gte?: Date; lte?: Date };
  }>({});

  const { sortConfigs, handleSort, buildOrderBy } = useTableSort(
    [{ columnKey: "createdAt", direction: "desc", order: 0 }],
    1, // Single column sort only
    false
  );

  const {
    visibleColumns,
    setVisibleColumns,
  } = useColumnVisibility(
    "airbrushings",
    ["task", "status", "price"],
    ["task", "status", "price", "startDate", "finishDate", "createdAt"]
  );

  // Build API query
  const buildWhereClause = useCallback(() => {
    const where: any = {};

    if (filters.status?.length) {
      where.status = { in: filters.status };
    }

    if (filters.taskId) {
      where.taskId = filters.taskId;
    }

    if (filters.customerId) {
      where.task = { customerId: filters.customerId };
    }

    if (filters.hasPrice) {
      where.price = { not: null };
    }

    if (filters.priceRange?.min !== undefined || filters.priceRange?.max !== undefined) {
      where.price = {};
      if (filters.priceRange.min !== undefined) {
        where.price.gte = filters.priceRange.min;
      }
      if (filters.priceRange.max !== undefined) {
        where.price.lte = filters.priceRange.max;
      }
    }

    if (filters.dateRange?.gte || filters.dateRange?.lte) {
      where.createdAt = {};
      if (filters.dateRange.gte) {
        where.createdAt.gte = filters.dateRange.gte;
      }
      if (filters.dateRange.lte) {
        where.createdAt.lte = filters.dateRange.lte;
      }
    }

    return Object.keys(where).length > 0 ? where : undefined;
  }, [filters]);

  const queryParams = useMemo(() => ({
    orderBy: buildOrderBy(
      {
        task: "task.name",
        status: "status",
        price: "price",
        startDate: "startDate",
        finishDate: "finishDate",
        createdAt: "createdAt",
      },
      { createdAt: "desc" }
    ),
    ...(searchText ? { searchingFor: searchText } : {}),
    ...(buildWhereClause() ? { where: buildWhereClause() } : {}),
    include: {
      task: {
        include: {
          customer: true,
          truck: true,
        },
      },
    },
  }), [searchText, buildWhereClause, buildOrderBy]);

  const {
    data: airbrushingsResponse,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = useAirbrushingsInfinite(queryParams);

  const { delete: deleteAirbrushing } = useAirbrushingMutations();

  // Flatten paginated data
  const airbrushings = useMemo(() => {
    const pages = (airbrushingsResponse as any)?.pages || [];
    return pages.flatMap((page: { data?: any[] }) => page.data || []);
  }, [airbrushingsResponse]);

  const totalItemsLoaded = airbrushings.length;
  const canLoadMore = hasNextPage;

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  const handleCreateAirbrushing = () => {
    router.push("/producao/aerografia/cadastrar");
  };

  const handleAirbrushingPress = (airbrushingId: string) => {
    router.push(`/producao/aerografia/detalhes/${airbrushingId}`);
  };

  const handleEditAirbrushing = (airbrushingId: string) => {
    router.push(`/producao/aerografia/editar/${airbrushingId}`);
  };

  const handleDeleteAirbrushing = useCallback(
    async (airbrushingId: string) => {
      await deleteAirbrushing(airbrushingId);
      if (selectedAirbrushings.has(airbrushingId)) {
        const newSelection = new Set(selectedAirbrushings);
        newSelection.delete(airbrushingId);
        setSelectedAirbrushings(newSelection);
      }
    },
    [deleteAirbrushing, selectedAirbrushings],
  );

  const handleSelectionChange = useCallback((newSelection: Set<string>) => {
    setSelectedAirbrushings(newSelection);
  }, []);

  const handleSearch = useCallback((text: string) => {
    setSearchText(text);
  }, []);

  const handleDisplaySearchChange = useCallback((text: string) => {
    setDisplaySearchText(text);
  }, []);

  const handleClearFilters = useCallback(() => {
    setFilters({});
    setSearchText("");
    setDisplaySearchText("");
    setSelectedAirbrushings(new Set());
    setShowSelection(false);
  }, []);

  const handleColumnsChange = useCallback((newColumns: Set<string>) => {
    setVisibleColumns(newColumns);
  }, [setVisibleColumns]);

  // Get all column definitions
  const allColumns = useMemo(() => createColumnDefinitions(), []);

  // Count active filters
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.status?.length) count++;
    if (filters.taskId) count++;
    if (filters.customerId) count++;
    if (filters.hasPrice) count++;
    if (filters.priceRange?.min !== undefined || filters.priceRange?.max !== undefined) count++;
    if (filters.dateRange?.gte || filters.dateRange?.lte) count++;
    return count;
  }, [filters]);

  const handleOpenFilters = useCallback(() => {
    setIsColumnPanelOpen(false);
    setIsFilterPanelOpen(true);
  }, []);

  const handleCloseFilters = useCallback(() => {
    setIsFilterPanelOpen(false);
  }, []);

  const handleOpenColumns = useCallback(() => {
    setIsFilterPanelOpen(false);
    setIsColumnPanelOpen(true);
  }, []);

  const handleCloseColumns = useCallback(() => {
    setIsColumnPanelOpen(false);
  }, []);

  const handleLoadMore = useCallback(() => {
    if (canLoadMore && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [canLoadMore, isFetchingNextPage, fetchNextPage]);

  // Only show skeleton on initial load, not on refetch/sort/search
  const isInitialLoad = isLoading && airbrushings.length === 0;

  // Permission gate
  if (!canManageAirbrushing) {
    return (
      <ThemedView style={styles.container}>
        <ErrorScreen
          message="Acesso negado"
          detail="Você não tem permissão para acessar esta funcionalidade. É necessário privilégio de Produção, Líder ou Administrador."
        />
      </ThemedView>
    );
  }

  if (isInitialLoad) {
    return <AirbrushingListSkeleton />;
  }

  if (error && airbrushings.length === 0) {
    return (
      <ThemedView style={styles.container}>
        <ErrorScreen message="Erro ao carregar airbrushings" detail={error.message} onRetry={handleRefresh} />
      </ThemedView>
    );
  }

  const hasAirbrushings = Array.isArray(airbrushings) && airbrushings.length > 0;

  return (
    <>
      <ThemedView style={[styles.container, { backgroundColor: colors.background, paddingBottom: insets.bottom }]}>
        {/* Search and Filter */}
        <View style={[styles.searchContainer]}>
          <SearchBar
            ref={searchInputRef}
            value={displaySearchText}
            onChangeText={handleDisplaySearchChange}
            onSearch={handleSearch}
            placeholder="Buscar por tarefa, cliente ou veículo..."
            style={styles.searchBar}
            debounceMs={300}
            loading={isLoading && !isFetchingNextPage}
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

        {/* Individual filter tags */}
        <AirbrushingFilterTags
          filters={{ where: buildWhereClause() }}
          searchText={searchText}
          onFilterChange={(newFilters) => {
            const where = newFilters.where as any;
            if (where) {
              const extracted: typeof filters = {};
              if (where.status?.in) extracted.status = where.status.in;
              if (where.taskId) extracted.taskId = where.taskId;
              if (where.task?.customerId) extracted.customerId = where.task.customerId;
              if (where.price?.not === null) extracted.hasPrice = true;
              if (where.price && typeof where.price === 'object' && !where.price.not) {
                extracted.priceRange = {};
                if (where.price.gte !== undefined) extracted.priceRange.min = where.price.gte;
                if (where.price.lte !== undefined) extracted.priceRange.max = where.price.lte;
              }
              if (where.createdAt) {
                extracted.dateRange = {};
                if (where.createdAt.gte) extracted.dateRange.gte = where.createdAt.gte;
                if (where.createdAt.lte) extracted.dateRange.lte = where.createdAt.lte;
              }
              setFilters(extracted);
            } else {
              setFilters({});
            }
          }}
          onSearchChange={(text) => {
            setSearchText(text);
            setDisplaySearchText(text);
          }}
          onClearAll={handleClearFilters}
        />

        {hasAirbrushings ? (
          <TableErrorBoundary onRetry={handleRefresh}>
            <AirbrushingTable
              airbrushings={airbrushings}
              onAirbrushingPress={handleAirbrushingPress}
              onAirbrushingEdit={handleEditAirbrushing}
              onAirbrushingDelete={isAdmin ? handleDeleteAirbrushing : undefined}
              onRefresh={handleRefresh}
              onEndReached={canLoadMore ? handleLoadMore : undefined}
              refreshing={refreshing || isLoading}
              loading={false}
              loadingMore={isFetchingNextPage}
              showSelection={showSelection}
              selectedAirbrushings={selectedAirbrushings}
              onSelectionChange={handleSelectionChange}
              sortConfigs={sortConfigs}
              onSort={(configs) => {
                // Handle empty array (clear sort)
                if (configs.length === 0) {
                  handleSort("createdAt"); // Reset to default
                } else {
                  handleSort(configs[0].columnKey);
                }
              }}
              visibleColumnKeys={Array.from(visibleColumns) as string[]}
              enableSwipeActions={true}
            />
          </TableErrorBoundary>
        ) : (
          <View style={styles.emptyContainer}>
            <EmptyState
              icon={searchText ? "search" : "paint"}
              title={searchText ? "Nenhum airbrushing encontrado" : "Nenhum airbrushing cadastrado"}
              description={
                searchText ? `Nenhum resultado para "${searchText}"` : "Comece cadastrando o primeiro airbrushing"
              }
              actionLabel={searchText ? undefined : "Cadastrar Airbrushing"}
              onAction={searchText ? undefined : handleCreateAirbrushing}
            />
          </View>
        )}

        {/* Items count */}
        {hasAirbrushings && <ItemsCountDisplay loadedCount={totalItemsLoaded} totalCount={totalItemsLoaded} isLoading={isFetchingNextPage} />}

        {hasAirbrushings && <FAB icon="plus" onPress={handleCreateAirbrushing} />}
      </ThemedView>

      <SlideInPanel isOpen={isFilterPanelOpen} onClose={handleCloseFilters}>
        <AirbrushingFilterDrawerContent
          filters={filters}
          onFiltersChange={setFilters}
          onClear={handleClearFilters}
          activeFiltersCount={activeFiltersCount}
          onClose={handleCloseFilters}
        />
      </SlideInPanel>

      <SlideInPanel isOpen={isColumnPanelOpen} onClose={handleCloseColumns}>
        <AirbrushingColumnDrawerContent
          columns={allColumns}
          visibleColumns={visibleColumns}
          onVisibilityChange={handleColumnsChange}
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