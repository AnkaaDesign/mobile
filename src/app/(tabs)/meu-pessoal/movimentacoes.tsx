import React, { useState, useCallback, useMemo } from "react";
import { View, StyleSheet } from "react-native";
import { useAuth } from "@/contexts/auth-context";
import { useActivitiesInfiniteMobile } from "@/hooks";
import type { Activity } from "@/types";
import { ThemedView } from "@/components/ui/themed-view";
import { ThemedText } from "@/components/ui/themed-text";
import { Card } from "@/components/ui/card";
import { SearchBar } from "@/components/ui/search-bar";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorScreen } from "@/components/ui/error-screen";
import { ItemsCountDisplay } from "@/components/ui/items-count-display";
import { ListActionButton } from "@/components/ui";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize } from "@/constants/design-system";
import { IconFilter, IconList, IconClock } from "@tabler/icons-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { TeamActivityTable, createColumnDefinitions } from "@/components/my-team/activity/list/team-activity-table";
import { TeamActivityFilterTags } from "@/components/my-team/activity/list/team-activity-filter-tags";
import { SlideInPanel } from "@/components/ui/slide-in-panel";
import { TeamActivityFilterDrawerContent } from "@/components/my-team/activity/list/team-activity-filter-drawer-content";
import { TeamActivityColumnDrawerContent } from "@/components/my-team/activity/list/team-activity-column-drawer-content";
import { TableErrorBoundary } from "@/components/ui/table-error-boundary";
import { useTableSort } from "@/hooks/useTableSort";
import { useColumnVisibility } from "@/hooks/useColumnVisibility";

export default function TeamActivitiesScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { user: currentUser } = useAuth();

  const [refreshing, setRefreshing] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [displaySearchText, setDisplaySearchText] = useState("");
  const searchInputRef = React.useRef<any>(null);

  // Slide panel state
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [isColumnPanelOpen, setIsColumnPanelOpen] = useState(false);

  // Filter state
  const [filters, setFilters] = useState<{
    operations?: string[];
    reasons?: string[];
    userIds?: string[];
    itemIds?: string[];
    quantityRange?: { min?: number; max?: number };
    createdAt?: { gte?: Date; lte?: Date };
  }>({});

  // Check if user is a team leader
  const isTeamLeader = currentUser?.managedSectorId || false;

  const { sortConfigs, handleSort, buildOrderBy } = useTableSort(
    [{ columnKey: "createdAt", direction: "desc", order: 0 }],
    1, // Single column sort only
    false
  );

  const {
    visibleColumns,
    setVisibleColumns,
  } = useColumnVisibility(
    "team-movements",
    ["itemName", "quantity", "userName", "createdAt"],
    ["itemCode", "itemName", "quantity", "userName", "reason", "createdAt"]
  );

  // Build API query
  const buildWhereClause = useCallback(() => {
    if (!isTeamLeader || !currentUser?.managedSectorId) return undefined;

    const where: any = {
      user: {
        sectorId: currentUser.managedSectorId,
      },
    };

    if (filters.operations?.length) {
      where.operation = { in: filters.operations };
    }

    if (filters.reasons?.length) {
      where.reason = { in: filters.reasons };
    }

    if (filters.userIds?.length) {
      where.userId = { in: filters.userIds };
    }

    if (filters.itemIds?.length) {
      where.itemId = { in: filters.itemIds };
    }

    if (filters.quantityRange?.min !== undefined || filters.quantityRange?.max !== undefined) {
      where.quantity = {};
      if (filters.quantityRange.min !== undefined) {
        where.quantity.gte = filters.quantityRange.min;
      }
      if (filters.quantityRange.max !== undefined) {
        where.quantity.lte = filters.quantityRange.max;
      }
    }

    if (filters.createdAt?.gte || filters.createdAt?.lte) {
      where.createdAt = {};
      if (filters.createdAt.gte) {
        where.createdAt.gte = filters.createdAt.gte;
      }
      if (filters.createdAt.lte) {
        where.createdAt.lte = filters.createdAt.lte;
      }
    }

    return where;
  }, [isTeamLeader, currentUser?.managedSectorId, filters]);

  const queryParams = useMemo(() => {
    if (!isTeamLeader || !currentUser?.managedSectorId) return null;

    return {
      orderBy: buildOrderBy(
        {
          itemCode: "item.uniCode",
          itemName: "item.name",
          operation: "operation",
          quantity: "quantity",
          userName: "user.name",
          reason: "reason",
          createdAt: "createdAt",
        },
        { createdAt: "desc" }
      ),
      ...(searchText ? { searchingFor: searchText } : {}),
      where: buildWhereClause(),
      include: {
        user: {
          include: {
            position: true,
          },
        },
        item: true,
      },
    };
  }, [isTeamLeader, currentUser?.managedSectorId, searchText, buildWhereClause, buildOrderBy]);

  const {
    items,
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
  } = useActivitiesInfiniteMobile(queryParams || {});

  // Type alias for activities
  const activities = items as Activity[];

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refresh();
    } finally {
      setRefreshing(false);
    }
  }, [refresh]);

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
  }, []);

  const handleColumnsChange = useCallback((newColumns: Set<string>) => {
    setVisibleColumns(newColumns);
  }, [setVisibleColumns]);

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

  // Get all column definitions
  const allColumns = useMemo(() => createColumnDefinitions(), []);

  // Count active filters
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.operations?.length) count++;
    if (filters.reasons?.length) count++;
    if (filters.userIds?.length) count++;
    if (filters.itemIds?.length) count++;
    if (filters.quantityRange?.min !== undefined || filters.quantityRange?.max !== undefined) count++;
    if (filters.createdAt?.gte || filters.createdAt?.lte) count++;
    return count;
  }, [filters]);

  // Only show skeleton on initial load
  const isInitialLoad = isLoading && activities.length === 0;

  // Show access denied if not a team leader
  if (!isTeamLeader) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.emptyContainer}>
          <Card style={styles.loadingCard}>
            <IconClock size={48} color={colors.mutedForeground} />
            <ThemedText style={[styles.title, { color: colors.foreground, textAlign: "center", marginTop: spacing.md }]}>
              Acesso Restrito
            </ThemedText>
            <ThemedText style={[styles.subtitle, { color: colors.mutedForeground, textAlign: "center" }]}>
              Esta área é exclusiva para líderes de equipe.
            </ThemedText>
          </Card>
        </View>
      </ThemedView>
    );
  }

  if (isInitialLoad) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Card style={styles.loadingCard}>
            <ThemedText style={{ color: colors.mutedForeground }}>
              Carregando movimentações da equipe...
            </ThemedText>
          </Card>
        </View>
      </ThemedView>
    );
  }

  if (error && activities.length === 0) {
    return (
      <ThemedView style={styles.container}>
        <ErrorScreen
          message="Erro ao carregar movimentações"
          detail={error.message}
          onRetry={handleRefresh}
        />
      </ThemedView>
    );
  }

  const hasActivities = Array.isArray(activities) && activities.length > 0;

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
            placeholder="Buscar movimentações..."
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
        <TeamActivityFilterTags
          filters={filters}
          searchText={searchText}
          onFilterChange={setFilters}
          onSearchChange={(text) => {
            setSearchText(text);
            setDisplaySearchText(text);
          }}
          onClearAll={handleClearFilters}
        />

        {hasActivities ? (
          <TableErrorBoundary onRetry={handleRefresh}>
            <TeamActivityTable
              activities={activities}
              onRefresh={handleRefresh}
              onEndReached={canLoadMore ? loadMore : undefined}
              onPrefetch={shouldPrefetch ? prefetchNext : undefined}
              refreshing={refreshing || isRefetching}
              loading={false}
              loadingMore={isFetchingNextPage}
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
              enableSwipeActions={false}
            />
          </TableErrorBoundary>
        ) : (
          <View style={styles.emptyContainer}>
            <EmptyState
              icon={searchText ? "search" : "clock"}
              title={searchText ? "Nenhuma movimentação encontrada" : "Sem movimentações"}
              description={
                searchText
                  ? `Nenhum resultado para "${searchText}"`
                  : "Não há movimentações registradas para a equipe"
              }
            />
          </View>
        )}

        {/* Items count */}
        {hasActivities && <ItemsCountDisplay loadedCount={totalItemsLoaded} totalCount={totalCount} isLoading={isFetchingNextPage} />}
      </ThemedView>

      {/* Slide-in panels */}
      <SlideInPanel isOpen={isFilterPanelOpen} onClose={handleCloseFilters}>
        <TeamActivityFilterDrawerContent
          filters={filters}
          onFiltersChange={setFilters}
          onClear={handleClearFilters}
          activeFiltersCount={activeFiltersCount}
        />
      </SlideInPanel>

      <SlideInPanel isOpen={isColumnPanelOpen} onClose={handleCloseColumns}>
        <TeamActivityColumnDrawerContent
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
  title: {
    fontSize: fontSize.xl,
    fontWeight: "700",
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: fontSize.sm,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingCard: {
    padding: spacing.lg,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});