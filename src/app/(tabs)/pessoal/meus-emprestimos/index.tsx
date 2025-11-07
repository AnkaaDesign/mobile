import React, { useState, useCallback, useMemo } from "react";
import { View, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { IconFilter, IconList } from "@tabler/icons-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useBorrowsInfiniteMobile } from '@/hooks/use-borrows-infinite-mobile';
import { useBorrowMutations } from '@/hooks';

import { ThemedView, ErrorScreen, EmptyState, ListActionButton, SearchBar } from "@/components/ui";
import { MyBorrowTable, createColumnDefinitions } from "@/components/personal/borrow/list/my-borrow-table";

import { MyBorrowFilterTags } from "@/components/personal/borrow/list/my-borrow-filter-tags";
import { TableErrorBoundary } from "@/components/ui/table-error-boundary";
import { ItemsCountDisplay } from "@/components/ui/items-count-display";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { useTheme } from "@/lib/theme";

// New hooks and components
import { useTableSort } from "@/hooks/useTableSort";
import { useColumnVisibility } from "@/hooks/useColumnVisibility";

// Import slide panel components
import { SlideInPanel } from "@/components/ui/slide-in-panel";
import { MyBorrowFilterDrawerContent } from "@/components/personal/borrow/list/my-borrow-filter-drawer-content";
import { MyBorrowColumnDrawerContent } from "@/components/personal/borrow/list/my-borrow-column-drawer-content";
import { useAuth } from "@/contexts/auth-context";
import { BORROW_STATUS } from '@/constants';

export default function MyBorrowsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [displaySearchText, setDisplaySearchText] = useState("");
  const [selectedBorrows, setSelectedBorrows] = useState<Set<string>>(new Set());
  const [showSelection, setShowSelection] = useState(false);
  const searchInputRef = React.useRef<any>(null);

  // Slide panel state
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [isColumnPanelOpen, setIsColumnPanelOpen] = useState(false);

  // Filter state
  const [filters, setFilters] = useState<{
    status?: string[];
    itemType?: string;
    dateRange?: { start?: Date; end?: Date };
    showOverdueOnly?: boolean;
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
    "myBorrows",
    ["item", "status", "createdAt"],
    ["item", "quantity", "status", "createdAt", "expectedReturnDate", "returnedAt", "user", "category"]
  );

  // Build API query
  const buildWhereClause = useCallback(() => {
    const where: any = {
      userId: user?.id, // Only show current user's borrows
    };

    if (filters.status?.length) {
      where.status = { in: filters.status };
    }

    if (filters.itemType) {
      where.item = {
        category: {
          name: { contains: filters.itemType, mode: "insensitive" }
        }
      };
    }

    if (filters.showOverdueOnly) {
      where.status = BORROW_STATUS.ACTIVE;
      where.expectedReturnDate = { lt: new Date() };
    }

    if (filters.dateRange?.start || filters.dateRange?.end) {
      where.createdAt = {};
      if (filters.dateRange.start) {
        where.createdAt.gte = filters.dateRange.start;
      }
      if (filters.dateRange.end) {
        where.createdAt.lte = filters.dateRange.end;
      }
    }

    return where;
  }, [filters, user?.id]);

  const queryParams = useMemo(() => ({
    orderBy: buildOrderBy(
      {
        item: "item.name",
        quantity: "quantity",
        status: "status",
        createdAt: "createdAt",
        expectedReturnDate: "expectedReturnDate",
        returnedAt: "returnedAt",
      },
      { createdAt: "desc" }
    ),
    ...(searchText ? { searchingFor: searchText } : {}),
    where: buildWhereClause(),
  }), [searchText, buildWhereClause, buildOrderBy]);

  const {
    items: borrows,
    isLoading,
    error,
    isRefetching,
    loadMore,
    canLoadMore,
    isFetchingNextPage,
    totalItemsLoaded,
    totalCount,
    refresh,
    prefetchNext,
    shouldPrefetch,
  } = useBorrowsInfiniteMobile(queryParams);

  const { delete: deleteBorrow } = useBorrowMutations();

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refresh();
    } finally {
      setRefreshing(false);
    }
  }, [refresh]);

  const handleBorrowPress = (borrowId: string) => {
    router.push(`/pessoal/meus-emprestimos/detalhes/${borrowId}` as any);
  };

  const handleEditBorrow = (borrowId: string) => {
    router.push(`/pessoal/meus-emprestimos/editar/${borrowId}` as any);
  };

  const handleDeleteBorrow = useCallback(
    async (borrowId: string) => {
      await deleteBorrow(borrowId);
      if (selectedBorrows.has(borrowId)) {
        const newSelection = new Set(selectedBorrows);
        newSelection.delete(borrowId);
        setSelectedBorrows(newSelection);
      }
    },
    [deleteBorrow, selectedBorrows],
  );

  const handleSelectionChange = useCallback((newSelection: Set<string>) => {
    setSelectedBorrows(newSelection);
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
    setSelectedBorrows(new Set());
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
    if (filters.status?.length) count++;
    if (filters.itemType) count++;
    if (filters.showOverdueOnly) count++;
    if (filters.dateRange?.start) count++;
    if (filters.dateRange?.end) count++;
    return count;
  }, [filters]);

  // Only show skeleton on initial load, not on refetch/sort/search
  // This prevents the entire page from remounting during search
  const isInitialLoad = isLoading && borrows.length === 0;

  if (isInitialLoad) {
    return <LoadingScreen />;
  }

  if (error && borrows.length === 0) {
    return (
      <ThemedView style={styles.container}>
        <ErrorScreen message="Erro ao carregar empréstimos" detail={error.message} onRetry={handleRefresh} />
      </ThemedView>
    );
  }

  const hasBorrows = Array.isArray(borrows) && borrows.length > 0;

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
          placeholder="Buscar empréstimos..."
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
      <MyBorrowFilterTags
        filters={filters}
        searchText={searchText}
        onFilterChange={setFilters}
        onSearchChange={(text) => {
          setSearchText(text);
          setDisplaySearchText(text);
        }}
        onClearAll={handleClearFilters}
      />

      {hasBorrows ? (
        <TableErrorBoundary onRetry={handleRefresh}>
          <MyBorrowTable
            borrows={borrows}
            onBorrowPress={handleBorrowPress}
            onBorrowEdit={handleEditBorrow}
            onBorrowDelete={handleDeleteBorrow}
            onRefresh={handleRefresh}
            onEndReached={canLoadMore ? loadMore : undefined}
            onPrefetch={shouldPrefetch ? prefetchNext : undefined}
            refreshing={refreshing || isRefetching}
            loading={false}
            loadingMore={isFetchingNextPage}
            showSelection={showSelection}
            selectedBorrows={selectedBorrows}
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
            icon={searchText ? "search" : "package"}
            title={searchText ? "Nenhum empréstimo encontrado" : "Nenhum empréstimo cadastrado"}
            description={
              searchText ? `Nenhum resultado para "${searchText}"` : "Você não possui empréstimos registrados"
            }
          />
        </View>
      )}

      {/* Items count */}
      {hasBorrows && <ItemsCountDisplay loadedCount={totalItemsLoaded} totalCount={totalCount} isLoading={isFetchingNextPage} />}
    </ThemedView>

      {/* Slide-in panels */}
      <SlideInPanel isOpen={isFilterPanelOpen} onClose={handleCloseFilters}>
        <MyBorrowFilterDrawerContent
          filters={filters}
          onFiltersChange={setFilters}
          onClear={handleClearFilters}
          activeFiltersCount={activeFiltersCount}
        />
      </SlideInPanel>

      <SlideInPanel isOpen={isColumnPanelOpen} onClose={handleCloseColumns}>
        <MyBorrowColumnDrawerContent
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
