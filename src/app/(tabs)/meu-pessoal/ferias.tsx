import React, { useState, useMemo, useCallback } from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { PrivilegeGuard } from "@/components/privilege-guard";
import { SECTOR_PRIVILEGES } from "@/constants";
import { ThemedView } from "@/components/ui/themed-view";
import { ThemedText } from "@/components/ui/themed-text";
import { IconFilter, IconLayoutGrid, IconList, IconUsers } from "@tabler/icons-react-native";
import { useTheme } from "@/lib/theme";
import { spacing } from "@/constants/design-system";
import { useVacationsInfiniteMobile, useCurrentUser, useUsers } from "@/hooks";
import { TeamVacationTable } from "@/components/my-team/vacation/team-vacation-table";
import { TeamVacationCalendar } from "@/components/my-team/vacation/team-vacation-calendar";
import { TeamVacationFilterDrawerContent } from "@/components/my-team/vacation/team-vacation-filter-drawer-content";
import { TeamVacationColumnDrawerContent } from "@/components/my-team/vacation/team-vacation-column-drawer-content";
import { TeamVacationFilterTags } from "@/components/my-team/vacation/team-vacation-filter-tags";
import { SlideInPanel } from "@/components/ui/slide-in-panel";
import { SearchBar } from "@/components/ui/search-bar";
import { ListActionButton } from "@/components/ui/list-action-button";
import { ItemsCountDisplay } from "@/components/ui/items-count-display";
import { ErrorScreen } from "@/components/ui/error-screen";
import { EmptyState } from "@/components/ui/empty-state";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTableSort } from "@/hooks/useTableSort";
import { useColumnVisibility } from "@/hooks/useColumnVisibility";

type ViewMode = "list" | "calendar";

export default function MyTeamVacationsScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [refreshing, setRefreshing] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [displaySearchText, setDisplaySearchText] = useState("");
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [isColumnPanelOpen, setIsColumnPanelOpen] = useState(false);
  const searchInputRef = React.useRef<any>(null);

  // Filter state
  const [filters, setFilters] = useState<{
    statuses?: string[];
    types?: string[];
    startDateFrom?: Date;
    endDateTo?: Date;
    showCurrentOnly?: boolean;
    showConflictsOnly?: boolean;
  }>({});

  // Get current user to determine their sector
  const { data: currentUser } = useCurrentUser();

  // Get team members (users in the same sector)
  const { data: teamData } = useUsers({
    where: {
      sectorId: currentUser?.sectorId,
    },
    include: {
      position: true,
      sector: true,
    },
  });

  // Extract team member IDs
  const teamMemberIds = useMemo(() => {
    return teamData?.data?.map((user) => user.id) || [];
  }, [teamData]);

  // Sorting
  const { sortConfigs, handleSort, buildOrderBy } = useTableSort(
    [{ columnKey: "startAt", direction: "desc", order: 0 }],
    1, // Single column sort only
    false
  );

  // Column visibility
  const {
    visibleColumns,
    setVisibleColumns,
  } = useColumnVisibility(
    "team-vacations",
    ["userName", "dates", "days", "status"],
    ["userName", "position", "dates", "days", "type", "status"]
  );

  // Build API query
  const buildWhereClause = useCallback(() => {
    const where: any = {
      userId: { in: teamMemberIds },
    };

    if (filters.statuses?.length) {
      where.status = { in: filters.statuses };
    }

    if (filters.types?.length) {
      where.type = { in: filters.types };
    }

    if (filters.startDateFrom) {
      where.startAt = { ...where.startAt, gte: filters.startDateFrom };
    }

    if (filters.endDateTo) {
      where.endAt = { ...where.endAt, lte: filters.endDateTo };
    }

    if (filters.showCurrentOnly) {
      const now = new Date();
      where.startAt = { ...where.startAt, lte: now };
      where.endAt = { ...where.endAt, gte: now };
    }

    return where;
  }, [filters, teamMemberIds]);

  const queryParams = useMemo(() => ({
    orderBy: buildOrderBy(
      {
        startAt: "startAt",
        endAt: "endAt",
        createdAt: "createdAt",
        updatedAt: "updatedAt",
      },
      { startAt: "desc" }
    ),
    ...(searchText ? { searchingFor: searchText } : {}),
    where: buildWhereClause(),
    include: {
      user: {
        include: {
          position: true,
          sector: true,
        },
      },
    },
  }), [searchText, buildWhereClause, buildOrderBy]);

  // Fetch vacations for team members with infinite scroll
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
  } = useVacationsInfiniteMobile({
    ...queryParams,
    enabled: teamMemberIds.length > 0,
  });

  // Type alias for vacations
  const vacations = items;

  // Calculate team coverage metrics
  const coverageMetrics = useMemo(() => {
    const now = new Date();
    const currentlyOnVacation = vacations.filter((v: any) => {
      const start = new Date(v.startAt);
      const end = new Date(v.endAt);
      return now >= start && now <= end;
    });

    const totalTeam = teamMemberIds.length;
    const onVacationCount = currentlyOnVacation.length;
    const availableCount = totalTeam - onVacationCount;
    const coveragePercentage = totalTeam > 0 ? (availableCount / totalTeam) * 100 : 100;

    return {
      totalTeam,
      onVacationCount,
      availableCount,
      coveragePercentage,
    };
  }, [vacations, teamMemberIds]);

  const handleVacationPress = useCallback(
    (vacationId: string) => {
      router.push(`/meu-pessoal/ferias/detalhes/${vacationId}` as any);
    },
    [router],
  );

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

  // Count active filters
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.statuses?.length) count++;
    if (filters.types?.length) count++;
    if (filters.startDateFrom) count++;
    if (filters.endDateTo) count++;
    if (filters.showCurrentOnly) count++;
    if (filters.showConflictsOnly) count++;
    return count;
  }, [filters]);

  const hasVacations = Array.isArray(vacations) && vacations.length > 0;
  const isInitialLoad = isLoading && vacations.length === 0;

  if (isInitialLoad) {
    return (
      <PrivilegeGuard requiredPrivilege={SECTOR_PRIVILEGES.LEADER}>
        <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
          <View style={styles.loadingContainer}>
            <ThemedText>Carregando férias da equipe...</ThemedText>
          </View>
        </ThemedView>
      </PrivilegeGuard>
    );
  }

  if (error && vacations.length === 0) {
    return (
      <PrivilegeGuard requiredPrivilege={SECTOR_PRIVILEGES.LEADER}>
        <ThemedView style={styles.container}>
          <ErrorScreen message="Erro ao carregar férias" detail={error.message} onRetry={handleRefresh} />
        </ThemedView>
      </PrivilegeGuard>
    );
  }

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
              placeholder="Buscar férias..."
              style={styles.searchBar}
              debounceMs={300}
              loading={isRefetching && !isFetchingNextPage}
            />
            <View style={styles.buttonContainer}>
              {viewMode === "list" && (
                <ListActionButton
                  icon={<IconList size={20} color={colors.foreground} />}
                  onPress={handleOpenColumns}
                  badgeCount={visibleColumns.size}
                  badgeVariant="primary"
                />
              )}
              <ListActionButton
                icon={<IconFilter size={20} color={colors.foreground} />}
                onPress={handleOpenFilters}
                badgeCount={activeFiltersCount}
                badgeVariant="destructive"
                showBadge={activeFiltersCount > 0}
              />
              <TouchableOpacity
                style={[styles.viewModeButton, { borderColor: colors.border, backgroundColor: colors.card }]}
                onPress={() => setViewMode(viewMode === "list" ? "calendar" : "list")}
              >
                {viewMode === "list" ? (
                  <IconLayoutGrid size={20} color={colors.foreground} />
                ) : (
                  <IconList size={20} color={colors.foreground} />
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Individual filter tags */}
          <TeamVacationFilterTags
            filters={filters}
            searchText={searchText}
            onFilterChange={setFilters}
            onSearchChange={(text) => {
              setSearchText(text);
              setDisplaySearchText(text);
            }}
            onClearAll={handleClearFilters}
          />

          {/* Team Coverage Metrics */}
          <View style={[styles.metricsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.metricRow}>
              <View style={styles.metricItem}>
                <IconUsers size={20} color={colors.foreground} />
                <ThemedText style={styles.metricLabel}>Total da equipe</ThemedText>
                <ThemedText style={styles.metricValue}>{coverageMetrics.totalTeam}</ThemedText>
              </View>

              <View style={[styles.metricDivider, { backgroundColor: colors.border }]} />

              <View style={styles.metricItem}>
                <ThemedText style={styles.metricLabel}>De férias agora</ThemedText>
                <ThemedText style={[styles.metricValue, { color: colors.primary }]}>
                  {coverageMetrics.onVacationCount}
                </ThemedText>
              </View>

              <View style={[styles.metricDivider, { backgroundColor: colors.border }]} />

              <View style={styles.metricItem}>
                <ThemedText style={styles.metricLabel}>Disponíveis</ThemedText>
                <ThemedText style={[styles.metricValue, { color: colors.success }]}>
                  {coverageMetrics.availableCount}
                </ThemedText>
              </View>
            </View>

            {/* Coverage bar */}
            <View style={styles.coverageBarContainer}>
              <View style={[styles.coverageBarBg, { backgroundColor: colors.muted }]}>
                <View
                  style={[
                    styles.coverageBar,
                    {
                      width: `${coverageMetrics.coveragePercentage}%`,
                      backgroundColor: coverageMetrics.coveragePercentage >= 60 ? colors.success : coverageMetrics.coveragePercentage >= 40 ? "#f59e0b" : colors.destructive,
                    },
                  ]}
                />
              </View>
              <ThemedText style={styles.coverageText}>{Math.round(coverageMetrics.coveragePercentage)}% de cobertura</ThemedText>
            </View>
          </View>

          {/* Content */}
          {viewMode === "list" ? (
            hasVacations ? (
              <TeamVacationTable
                vacations={vacations}
                onVacationPress={handleVacationPress}
                onRefresh={handleRefresh}
                onEndReached={canLoadMore ? loadMore : undefined}
                onPrefetch={shouldPrefetch ? prefetchNext : undefined}
                refreshing={refreshing || isRefetching}
                loading={false}
                loadingMore={isFetchingNextPage}
                sortConfigs={sortConfigs}
                onSort={(configs) => {
                  if (configs.length === 0) {
                    handleSort("startAt"); // Reset to default
                  } else {
                    handleSort(configs[0].columnKey);
                  }
                }}
                visibleColumnKeys={Array.from(visibleColumns) as string[]}
                enableSwipeActions={true}
              />
            ) : (
              <View style={styles.emptyContainer}>
                <EmptyState
                  icon={searchText ? "search" : "calendar"}
                  title={searchText ? "Nenhuma férias encontrada" : "Nenhuma férias registrada"}
                  description={
                    searchText ? `Nenhum resultado para "${searchText}"` : "Não há férias registradas para sua equipe"
                  }
                />
              </View>
            )
          ) : (
            <TeamVacationCalendar vacations={vacations} onVacationPress={handleVacationPress} />
          )}

          {/* Items count */}
          {viewMode === "list" && hasVacations && <ItemsCountDisplay loadedCount={totalItemsLoaded} totalCount={totalCount} isLoading={isFetchingNextPage} />}
        </ThemedView>

        {/* Slide-in panels */}
        <SlideInPanel isOpen={isFilterPanelOpen} onClose={handleCloseFilters}>
          <TeamVacationFilterDrawerContent
            filters={filters}
            onFiltersChange={setFilters}
            onClear={handleClearFilters}
            activeFiltersCount={activeFiltersCount}
            teamMemberIds={teamMemberIds}
          />
        </SlideInPanel>

        <SlideInPanel isOpen={isColumnPanelOpen} onClose={handleCloseColumns}>
          <TeamVacationColumnDrawerContent
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
  viewModeButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  metricsCard: {
    marginHorizontal: 8,
    marginBottom: 8,
    padding: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
  },
  metricRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    marginBottom: spacing.md,
  },
  metricItem: {
    alignItems: "center",
    gap: spacing.xs,
    flex: 1,
  },
  metricDivider: {
    width: 1,
    height: 40,
  },
  metricLabel: {
    fontSize: 12,
    opacity: 0.7,
    textAlign: "center",
  },
  metricValue: {
    fontSize: 20,
    fontWeight: "700",
  },
  coverageBarContainer: {
    gap: spacing.xs,
  },
  coverageBarBg: {
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
  },
  coverageBar: {
    height: "100%",
    borderRadius: 4,
  },
  coverageText: {
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
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
