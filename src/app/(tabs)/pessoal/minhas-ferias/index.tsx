import React, { useState, useCallback, useMemo } from "react";
import { View, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { IconFilter, IconList } from "@tabler/icons-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useVacationMutations } from '../../../../hooks';
import { useVacationsInfiniteMobile } from "@/hooks/use-vacations-infinite-mobile";

import { ThemedView, FAB, ErrorScreen, EmptyState, ListActionButton, SearchBar } from "@/components/ui";
import { MyVacationTable, createColumnDefinitions } from "@/components/personal/vacation/list/my-vacation-table";

import { MyVacationFilterTags } from "@/components/personal/vacation/list/my-vacation-filter-tags";
import { TableErrorBoundary } from "@/components/ui/table-error-boundary";
import { ItemsCountDisplay } from "@/components/ui/items-count-display";
import { useTheme } from "@/lib/theme";
import { useAuth } from "@/contexts/auth-context";

// New hooks and components
import { useTableSort } from "@/hooks/useTableSort";
import { useColumnVisibility } from "@/hooks/useColumnVisibility";

// Import slide panel components
import { SlideInPanel } from "@/components/ui/slide-in-panel";
import { MyVacationFilterDrawerContent } from "@/components/personal/vacation/list/my-vacation-filter-drawer-content";
import { MyVacationColumnDrawerContent } from "@/components/personal/vacation/list/my-vacation-column-drawer-content";

export default function MyVacationsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [displaySearchText, setDisplaySearchText] = useState("");
  const [selectedVacations, setSelectedVacations] = useState<Set<string>>(new Set());
  const [showSelection, setShowSelection] = useState(false);
  const searchInputRef = React.useRef<any>(null);

  // Slide panel state
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [isColumnPanelOpen, setIsColumnPanelOpen] = useState(false);

  // Filter state
  const [filters, setFilters] = useState<{
    status?: string;
    year?: number;
    isCollective?: boolean;
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
    "my-vacations",
    ["period", "daysRequested", "status"],
    ["period", "daysRequested", "status", "type", "isCollective", "observation", "createdAt"]
  );

  // Build API query
  const buildWhereClause = useCallback(() => {
    const where: any = {
      userId: user?.id, // Always filter by current user
    };

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.year) {
      const startOfYear = new Date(filters.year, 0, 1);
      const endOfYear = new Date(filters.year, 11, 31, 23, 59, 59);
      where.startAt = {
        gte: startOfYear,
        lte: endOfYear,
      };
    }

    if (filters.isCollective) {
      where.isCollective = true;
    }

    return where;
  }, [filters, user?.id]);

  const queryParams = useMemo(() => ({
    orderBy: buildOrderBy(
      {
        status: "status",
        daysRequested: "daysRequested",
        type: "type",
        createdAt: "createdAt",
      },
      { createdAt: "desc" }
    ),
    ...(searchText ? { searchingFor: searchText } : {}),
    where: buildWhereClause(),
  }), [searchText, buildWhereClause, buildOrderBy]);

  const {
    items: vacations,
    isLoading,
    error,
    isRefetching,
    loadMore,
    hasNextPage,
    isFetchingNextPage,
    totalItemsLoaded,
    totalCount,
    refetch,
    prefetchNext,
    shouldPrefetch,
  } = useVacationsInfiniteMobile(queryParams);

  const { delete: deleteVacation } = useVacationMutations();

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  const handleVacationPress = (vacationId: string) => {
    router.push(`/pessoal/minhas-ferias/detalhes/${vacationId}` as any);
  };

  const handleEditVacation = (vacationId: string) => {
    router.push(`/pessoal/minhas-ferias/editar/${vacationId}` as any);
  };

  const handleDeleteVacation = useCallback(
    async (vacationId: string) => {
      await deleteVacation(vacationId);
      if (selectedVacations.has(vacationId)) {
        const newSelection = new Set(selectedVacations);
        newSelection.delete(vacationId);
        setSelectedVacations(newSelection);
      }
    },
    [deleteVacation, selectedVacations],
  );

  const handleSelectionChange = useCallback((newSelection: Set<string>) => {
    setSelectedVacations(newSelection);
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
    setSelectedVacations(new Set());
    setShowSelection(false);
  }, []);

  const handleColumnsChange = useCallback((newColumns: Set<string>) => {
    setVisibleColumns(newColumns);
  }, [setVisibleColumns]);

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

  // Get all column definitions
  const allColumns = useMemo(() => createColumnDefinitions(), []);

  // Count active filters
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.status) count++;
    if (filters.year) count++;
    if (filters.isCollective) count++;
    return count;
  }, [filters]);

  // Only show skeleton on initial load, not on refetch/sort/search
  // This prevents the entire page from remounting during search
  const isInitialLoad = isLoading && vacations.length === 0;

  if (isInitialLoad) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ThemedView style={styles.loadingText}>Carregando férias...</ThemedView>
        </View>
      </ThemedView>
    );
  }

  if (error && vacations.length === 0) {
    return (
      <ThemedView style={styles.container}>
        <ErrorScreen message="Erro ao carregar férias" detail={error.message} onRetry={handleRefresh} />
      </ThemedView>
    );
  }

  const hasVacations = Array.isArray(vacations) && vacations.length > 0;

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
          placeholder="Buscar férias..."
          style={styles.searchBar}
          debounceMs={300}
          loading={isRefetching && !isFetchingNextPage}
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
      <MyVacationFilterTags
        filters={filters}
        searchText={searchText}
        onFilterChange={setFilters}
        onSearchChange={(text) => {
          setSearchText(text);
          setDisplaySearchText(text);
        }}
        onClearAll={handleClearFilters}
      />

      {hasVacations ? (
        <TableErrorBoundary onRetry={handleRefresh}>
          <MyVacationTable
            vacations={vacations}
            onVacationPress={handleVacationPress}
            onVacationEdit={handleEditVacation}
            onVacationDelete={handleDeleteVacation}
            onRefresh={handleRefresh}
            onEndReached={hasNextPage ? loadMore : undefined}
            onPrefetch={shouldPrefetch ? prefetchNext : undefined}
            refreshing={refreshing || isRefetching}
            loading={false}
            loadingMore={isFetchingNextPage}
            showSelection={showSelection}
            selectedVacations={selectedVacations}
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
            icon={searchText ? "search" : "beach"}
            title={searchText ? "Nenhuma férias encontrada" : "Nenhuma férias cadastrada"}
            description={
              searchText ? `Nenhum resultado para "${searchText}"` : "Você ainda não possui férias cadastradas"
            }
          />
        </View>
      )}

      {/* Items count */}
      {hasVacations && <ItemsCountDisplay loadedCount={totalItemsLoaded} totalCount={totalCount} isLoading={isFetchingNextPage} />}
    </ThemedView>

      {/* Slide-in panels */}
      <SlideInPanel isOpen={isFilterPanelOpen} onClose={handleCloseFilters}>
        <MyVacationFilterDrawerContent
          filters={filters}
          onFiltersChange={setFilters}
          onClear={handleClearFilters}
          activeFiltersCount={activeFiltersCount}
          onClose={handleCloseFilters}
        />
      </SlideInPanel>

      <SlideInPanel isOpen={isColumnPanelOpen} onClose={handleCloseColumns}>
        <MyVacationColumnDrawerContent
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 16,
    opacity: 0.7,
  },
});
