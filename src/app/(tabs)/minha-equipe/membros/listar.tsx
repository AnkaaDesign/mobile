import React, { useState, useCallback, useMemo } from "react";
import { View, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { IconFilter, IconList } from "@tabler/icons-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useUsersInfiniteMobile } from "@/hooks";
import { useAuth } from "@/contexts/auth-context";

import { ThemedView, ErrorScreen, EmptyState, ListActionButton, SearchBar } from "@/components/ui";
import { TeamMemberTable, createColumnDefinitions } from "@/components/my-team/member/list/team-member-table";

import { TeamMemberFilterTags } from "@/components/my-team/member/list/team-member-filter-tags";
import { TableErrorBoundary } from "@/components/ui/table-error-boundary";
import { ItemsCountDisplay } from "@/components/ui/items-count-display";
import { useTheme } from "@/lib/theme";
import { routes } from '../../../../constants';
import { routeToMobilePath } from "@/lib/route-mapper";

// New hooks and components
import { useTableSort } from "@/hooks/useTableSort";
import { useColumnVisibility } from "@/hooks/useColumnVisibility";

// Import slide panel components
import { SlideInPanel } from "@/components/ui/slide-in-panel";
import { TeamMemberFilterDrawerContent } from "@/components/my-team/member/list/team-member-filter-drawer-content";
import { TeamMemberColumnDrawerContent } from "@/components/my-team/member/list/team-member-column-drawer-content";
import { USER_STATUS } from "@/constants";

export default function TeamMembersListScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { user: currentUser } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [displaySearchText, setDisplaySearchText] = useState("");
  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(new Set());
  const [showSelection, setShowSelection] = useState(false);
  const searchInputRef = React.useRef<any>(null);

  // Slide panel state
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [isColumnPanelOpen, setIsColumnPanelOpen] = useState(false);

  // Filter state
  const [filters, setFilters] = useState<{
    statuses?: string[];
    positionIds?: string[];
    sectorIds?: string[];
    admissionalStart?: Date;
    admissionalEnd?: Date;
  }>({});

  const { sortConfigs, handleSort, buildOrderBy } = useTableSort(
    [{ columnKey: "name", direction: "asc", order: 0 }],
    1, // Single column sort only
    false
  );

  const {
    visibleColumns,
    setVisibleColumns,
  } = useColumnVisibility(
    "team-members",
    ["name", "position"],
    ["name", "position", "sector", "email", "phone", "admissional", "status", "tasksCount"]
  );

  // Build API query
  const buildWhereClause = useCallback(() => {
    const where: any = {};

    // Filter by sector (team leader's sector or user's sector)
    if (currentUser?.managedSectorId) {
      where.sectorId = currentUser.managedSectorId;
    } else if (currentUser?.sectorId) {
      where.sectorId = currentUser.sectorId;
    }

    // Exclude dismissed employees by default unless specifically filtered
    if (!filters.statuses?.length) {
      where.status = { not: USER_STATUS.DISMISSED };
    }

    if (filters.statuses?.length) {
      where.status = { in: filters.statuses };
    }

    if (filters.positionIds?.length) {
      where.positionId = { in: filters.positionIds };
    }

    if (filters.sectorIds?.length) {
      where.sectorId = { in: filters.sectorIds };
    }

    if (filters.admissionalStart || filters.admissionalEnd) {
      where.admissional = {};
      if (filters.admissionalStart) {
        where.admissional.gte = filters.admissionalStart;
      }
      if (filters.admissionalEnd) {
        where.admissional.lte = filters.admissionalEnd;
      }
    }

    return Object.keys(where).length > 0 ? where : undefined;
  }, [filters, currentUser]);

  const queryParams = useMemo(() => ({
    orderBy: buildOrderBy(
      {
        name: "name",
        position: "position.name",
        sector: "sector.name",
        email: "email",
        admissional: "admissional",
        status: "status",
      },
      { name: "asc" }
    ),
    ...(searchText ? { searchingFor: searchText } : {}),
    ...(buildWhereClause() ? { where: buildWhereClause() } : {}),
    include: {
      position: true,
      sector: true,
      avatar: true,
      _count: {
        select: {
          tasks: true,
          activities: true,
          borrows: true,
          vacations: true,
        },
      },
    },
  }), [searchText, buildWhereClause, buildOrderBy]);

  const {
    users,
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
  } = useUsersInfiniteMobile(queryParams);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refresh();
    } finally {
      setRefreshing(false);
    }
  }, [refresh]);

  const handleMemberPress = (userId: string) => {
    router.push(`/(tabs)/minha-equipe/membros/detalhes/${userId}` as any);
  };

  const handleEditMember = (userId: string) => {
    router.push(`/(tabs)/minha-equipe/membros/editar/${userId}` as any);
  };

  const handleDeleteMember = useCallback(
    async (userId: string) => {
      // Note: Implement delete logic if needed
      console.log('Delete member:', userId);
      if (selectedMembers.has(userId)) {
        const newSelection = new Set(selectedMembers);
        newSelection.delete(userId);
        setSelectedMembers(newSelection);
      }
    },
    [selectedMembers],
  );

  const handleSelectionChange = useCallback((newSelection: Set<string>) => {
    setSelectedMembers(newSelection);
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
    setSelectedMembers(new Set());
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
    if (filters.statuses?.length) count++;
    if (filters.positionIds?.length) count++;
    if (filters.sectorIds?.length) count++;
    if (filters.admissionalStart) count++;
    if (filters.admissionalEnd) count++;
    return count;
  }, [filters]);

  // Only show skeleton on initial load, not on refetch/sort/search
  const isInitialLoad = isLoading && users.length === 0;

  // Check if user is a team leader
  const isTeamLeader = currentUser?.managedSectorId || false;

  if (!isTeamLeader) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.emptyContainer}>
          <EmptyState
            icon="users"
            title="Acesso Restrito"
            description="Esta área é exclusiva para líderes de equipe."
          />
        </View>
      </ThemedView>
    );
  }

  if (isInitialLoad) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.loadingContainer}>
          <EmptyState
            icon="users"
            title="Carregando membros..."
            description="Por favor, aguarde..."
          />
        </View>
      </ThemedView>
    );
  }

  if (error && users.length === 0) {
    return (
      <ThemedView style={styles.container}>
        <ErrorScreen message="Erro ao carregar membros da equipe" detail={error.message} onRetry={handleRefresh} />
      </ThemedView>
    );
  }

  const hasMembers = Array.isArray(users) && users.length > 0;

  // Get positions and sectors for filter dropdowns
  const positions = useMemo(() => {
    const positionMap = new Map<string, { id: string; name: string }>();
    users.forEach((user) => {
      if (user.position) {
        positionMap.set(user.position.id, user.position);
      }
    });
    return Array.from(positionMap.values());
  }, [users]);

  const sectors = useMemo(() => {
    const sectorMap = new Map<string, { id: string; name: string }>();
    users.forEach((user) => {
      if (user.sector) {
        sectorMap.set(user.sector.id, user.sector);
      }
    });
    return Array.from(sectorMap.values());
  }, [users]);

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
            placeholder="Buscar membros..."
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
        <TeamMemberFilterTags
          filters={filters}
          searchText={searchText}
          onFilterChange={setFilters}
          onSearchChange={(text) => {
            setSearchText(text);
            setDisplaySearchText(text);
          }}
          onClearAll={handleClearFilters}
          positions={positions}
          sectors={sectors}
        />

        {hasMembers ? (
          <TableErrorBoundary onRetry={handleRefresh}>
            <TeamMemberTable
              members={users}
              onMemberPress={handleMemberPress}
              onMemberEdit={handleEditMember}
              onMemberDelete={handleDeleteMember}
              onRefresh={handleRefresh}
              onEndReached={canLoadMore ? loadMore : undefined}
              onPrefetch={shouldPrefetch ? prefetchNext : undefined}
              refreshing={refreshing || isRefetching}
              loading={false}
              loadingMore={isFetchingNextPage}
              showSelection={showSelection}
              selectedMembers={selectedMembers}
              onSelectionChange={handleSelectionChange}
              sortConfigs={sortConfigs}
              onSort={(configs) => {
                // Handle empty array (clear sort)
                if (configs.length === 0) {
                  handleSort("name"); // Reset to default
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
              icon={searchText ? "search" : "users"}
              title={searchText ? "Nenhum membro encontrado" : "Nenhum membro na equipe"}
              description={
                searchText ? `Nenhum resultado para "${searchText}"` : "Não há colaboradores cadastrados neste setor"
              }
            />
          </View>
        )}

        {/* Items count */}
        {hasMembers && <ItemsCountDisplay loadedCount={totalItemsLoaded} totalCount={totalCount} isLoading={isFetchingNextPage} />}
      </ThemedView>

      {/* Slide-in panels */}
      <SlideInPanel isOpen={isFilterPanelOpen} onClose={handleCloseFilters}>
        <TeamMemberFilterDrawerContent
          filters={filters}
          onFiltersChange={setFilters}
          onClear={handleClearFilters}
          activeFiltersCount={activeFiltersCount}
          positions={positions}
          sectors={sectors}
        />
      </SlideInPanel>

      <SlideInPanel isOpen={isColumnPanelOpen} onClose={handleCloseColumns}>
        <TeamMemberColumnDrawerContent
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
