import React, { useState, useCallback, useMemo } from "react";
import { View, StyleSheet } from "react-native";
import { IconFilter, IconList } from "@tabler/icons-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { PrivilegeGuard } from "@/components/privilege-guard";
import { SECTOR_PRIVILEGES } from '../../../constants';
import { ThemedView, ErrorScreen, EmptyState, ListActionButton, SearchBar } from "@/components/ui";
import { TeamBorrowTable, createColumnDefinitions } from "@/components/my-team/borrow/team-borrow-table";
import { TeamBorrowFilterTags } from "@/components/my-team/borrow/team-borrow-filter-tags";
import { TableErrorBoundary } from "@/components/ui/table-error-boundary";
import { ItemsCountDisplay } from "@/components/ui/items-count-display";
import { useTheme } from "@/lib/theme";
import { useBorrowsInfiniteMobile } from "@/hooks";
import { useAuth } from '../../../contexts/auth-context';

// New hooks and components
import { useTableSort } from "@/hooks/useTableSort";
import { useColumnVisibility } from "@/hooks/useColumnVisibility";

// Import slide panel components
import { SlideInPanel } from "@/components/ui/slide-in-panel";
import { TeamBorrowFilterDrawerContent, TeamBorrowFilters } from "@/components/my-team/borrow/team-borrow-filter-drawer-content";
import { TeamBorrowColumnDrawerContent } from "@/components/my-team/borrow/team-borrow-column-drawer-content";
import type { User } from '../../../types';

export default function MyTeamBorrowsScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { user: currentUser, isLoading: isLoadingAuth } = useAuth();
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
  const [filters, setFilters] = useState<TeamBorrowFilters>({});

  const { sortConfigs, handleSort, buildOrderBy } = useTableSort(
    [{ columnKey: "createdAt", direction: "desc", order: 0 }],
    1, // Single column sort only
    false
  );

  const {
    visibleColumns,
    setVisibleColumns,
  } = useColumnVisibility(
    "team-borrows",
    ["user", "item", "status"],
    ["user", "item", "status", "quantity", "borrowDate", "returnDate", "brand", "supplier", "position", "sector", "createdAt"]
  );

  // Build API query
  const buildWhereClause = useCallback(() => {
    const where: any = {
      // Only show borrows for users in the same sector
      user: {
        sectorId: currentUser?.sectorId,
      },
    };

    if (filters.userIds?.length) {
      where.userId = { in: filters.userIds };
    }

    if (filters.statuses?.length) {
      where.status = { in: filters.statuses };
    }

    if (filters.categoryIds?.length) {
      where.item = {
        ...where.item,
        categoryId: { in: filters.categoryIds },
      };
    }

    if (filters.isOverdue) {
      const now = new Date();
      where.AND = [
        { status: "ACTIVE" },
        { expectedReturnDate: { lte: now } },
      ];
    }

    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) {
        where.createdAt.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.createdAt.lte = filters.endDate;
      }
    }

    if (filters.returnStartDate || filters.returnEndDate) {
      where.returnedAt = {};
      if (filters.returnStartDate) {
        where.returnedAt.gte = filters.returnStartDate;
      }
      if (filters.returnEndDate) {
        where.returnedAt.lte = filters.returnEndDate;
      }
    }

    return where;
  }, [currentUser?.sectorId, filters]);

  const queryParams = useMemo(() => ({
    orderBy: buildOrderBy(
      {
        user: "user.name",
        item: "item.name",
        status: "status",
        quantity: "quantity",
        borrowDate: "createdAt",
        returnDate: "returnedAt",
        createdAt: "createdAt",
      },
      { createdAt: "desc" }
    ),
    ...(searchText ? { searchingFor: searchText } : {}),
    where: buildWhereClause(),
    include: {
      item: {
        include: {
          brand: true,
          category: true,
          supplier: true,
        },
      },
      user: {
        include: {
          position: true,
          sector: true,
        },
      },
    },
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

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refresh();
    } finally {
      setRefreshing(false);
    }
  }, [refresh]);

  const handleBorrowPress = (_borrowId: string) => {
    // Navigate to borrow details if needed
  };

  const handleEditBorrow = (_borrowId: string) => {
    // Navigate to edit borrow if needed
  };

  const handleDeleteBorrow = useCallback(
    async (_borrowId: string) => {
      // Implement delete mutation
      if (selectedBorrows.has(_borrowId)) {
        const newSelection = new Set(selectedBorrows);
        newSelection.delete(_borrowId);
        setSelectedBorrows(newSelection);
      }
    },
    [selectedBorrows],
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

  // Get unique team members and categories for filters
  const { teamMembers, categories } = useMemo(() => {
    const membersMap = new Map<string, User>();
    const categoriesMap = new Map<string, { id: string; name: string }>();

    borrows.forEach((borrow: any) => {
      if (borrow.user && !membersMap.has(borrow.user.id)) {
        membersMap.set(borrow.user.id, borrow.user);
      }
      if (borrow.item?.category && !categoriesMap.has(borrow.item.category.id)) {
        categoriesMap.set(borrow.item.category.id, borrow.item.category);
      }
    });

    return {
      teamMembers: Array.from(membersMap.values()),
      categories: Array.from(categoriesMap.values()),
    };
  }, [borrows]);

  // Count active filters
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.userIds?.length) count++;
    if (filters.statuses?.length) count++;
    if (filters.categoryIds?.length) count++;
    if (filters.isOverdue) count++;
    if (filters.startDate || filters.endDate) count++;
    if (filters.returnStartDate || filters.returnEndDate) count++;
    return count;
  }, [filters]);

  // Only show skeleton on initial load
  const isInitialLoad = isLoading && borrows.length === 0;

  if (isInitialLoad || isLoadingAuth) {
    return (
      <PrivilegeGuard requiredPrivilege={SECTOR_PRIVILEGES.LEADER}>
        <ThemedView style={styles.container}>
          <View style={styles.loadingContainer}>
            {/* Could add a skeleton component here */}
          </View>
        </ThemedView>
      </PrivilegeGuard>
    );
  }

  if (!currentUser?.sectorId) {
    return (
      <PrivilegeGuard requiredPrivilege={SECTOR_PRIVILEGES.LEADER}>
        <ThemedView style={styles.container}>
          <EmptyState
            icon="alert-circle"
            title="Setor não encontrado"
            description="Você precisa estar associado a um setor para visualizar os empréstimos da equipe"
          />
        </ThemedView>
      </PrivilegeGuard>
    );
  }

  if (error && borrows.length === 0) {
    return (
      <PrivilegeGuard requiredPrivilege={SECTOR_PRIVILEGES.LEADER}>
        <ThemedView style={styles.container}>
          <ErrorScreen message="Erro ao carregar empréstimos" detail={error.message} onRetry={handleRefresh} />
        </ThemedView>
      </PrivilegeGuard>
    );
  }

  const hasBorrows = Array.isArray(borrows) && borrows.length > 0;

  return (
    <PrivilegeGuard requiredPrivilege={SECTOR_PRIVILEGES.LEADER}>
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
          <TeamBorrowFilterTags
            filters={filters}
            onRemoveFilter={(filterKey, value) => {
              setFilters((prev) => {
                const newFilters = { ...prev };

                if (value && (filterKey === "userIds" || filterKey === "statuses" || filterKey === "categoryIds")) {
                  // Remove specific value from array
                  const currentArray = newFilters[filterKey] || [];
                  newFilters[filterKey] = currentArray.filter((item) => item !== value) as any;
                  if (newFilters[filterKey]?.length === 0) {
                    delete newFilters[filterKey];
                  }
                } else {
                  // Remove entire filter
                  delete newFilters[filterKey];
                }

                return newFilters;
              });
            }}
            teamMembers={teamMembers}
          />

          {hasBorrows ? (
            <TableErrorBoundary onRetry={handleRefresh}>
              <TeamBorrowTable
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
                  searchText ? `Nenhum resultado para "${searchText}"` : "Os empréstimos da sua equipe aparecerão aqui"
                }
              />
            </View>
          )}

          {/* Items count */}
          {hasBorrows && <ItemsCountDisplay loadedCount={totalItemsLoaded} totalCount={totalCount} isLoading={isFetchingNextPage} />}
        </ThemedView>

        {/* Slide-in panels */}
        <SlideInPanel isOpen={isFilterPanelOpen} onClose={handleCloseFilters}>
          <TeamBorrowFilterDrawerContent
            filters={filters}
            onFiltersChange={setFilters}
            onClear={handleClearFilters}
            activeFiltersCount={activeFiltersCount}
            teamMembers={teamMembers}
            categories={categories}
          />
        </SlideInPanel>

        <SlideInPanel isOpen={isColumnPanelOpen} onClose={handleCloseColumns}>
          <TeamBorrowColumnDrawerContent
            columns={allColumns}
            visibleColumns={visibleColumns}
            onVisibilityChange={handleColumnsChange}
          />
        </SlideInPanel>
      </>
    </PrivilegeGuard>
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
});
