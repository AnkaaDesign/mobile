import React, { useState, useMemo, useCallback } from "react";
import { View, StyleSheet } from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PrivilegeGuard } from "@/components/privilege-guard";
import { SECTOR_PRIVILEGES } from '../../../constants';
import { ThemedView, SearchBar, EmptyState, ErrorScreen, ListActionButton } from "@/components/ui";
import { TeamWarningStatsCard } from "@/components/my-team/warning/team-warning-stats-card";
import { TeamWarningTable, createWarningColumnDefinitions } from "@/components/my-team/warning/team-warning-table";
import { TeamWarningFilterDrawerContent } from "@/components/my-team/warning/team-warning-filter-drawer-content";
import { TeamWarningColumnDrawerContent } from "@/components/my-team/warning/team-warning-column-drawer-content";
import { TeamWarningFilterTags } from "@/components/my-team/warning/team-warning-filter-tags";
import { SlideInPanel } from "@/components/ui/slide-in-panel";
import { TableErrorBoundary } from "@/components/ui/table-error-boundary";
import { ItemsCountDisplay } from "@/components/ui/items-count-display";
import { useWarningsInfiniteMobile } from "@/hooks";
import { useAuth } from '../../../contexts/auth-context';
import { IconFilter, IconList } from "@tabler/icons-react-native";
import { useTheme } from "@/lib/theme";
import { useTableSort } from "@/hooks/useTableSort";
import { useColumnVisibility } from "@/hooks/useColumnVisibility";
import type { User } from '../../../types';

type TeamWarningFilters = {
  userIds?: string[];
  categories?: string[];
  severities?: string[];
  isActive?: boolean;
  startDate?: Date;
  endDate?: Date;
};

export default function MyTeamWarningsScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { user: currentUser, isLoading: isLoadingAuth } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [displaySearchText, setDisplaySearchText] = useState("");
  const [filters, setFilters] = useState<TeamWarningFilters>({});
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [isColumnPanelOpen, setIsColumnPanelOpen] = useState(false);
  const searchInputRef = React.useRef<any>(null);

  const { sortConfigs, handleSort, buildOrderBy } = useTableSort(
    [{ columnKey: "createdAt", direction: "desc", order: 0 }],
    1, // Single column sort only
    false
  );

  const {
    visibleColumns,
    setVisibleColumns,
  } = useColumnVisibility(
    "team-warnings",
    ["collaboratorName", "category", "severity", "followUpDate"],
    ["collaboratorName", "category", "severity", "reason", "followUpDate", "isActive", "createdAt"]
  );

  // Build query params for warnings
  const buildWhereClause = useCallback(() => {
    const where: any = {
      // Only show warnings for collaborators in the same sector
      collaborator: {
        sectorId: currentUser?.sectorId,
      },
    };

    // Apply filters
    if (filters.userIds && filters.userIds.length > 0) {
      where.collaboratorId = {
        in: filters.userIds,
      };
    }

    if (filters.categories && filters.categories.length > 0) {
      where.category = {
        in: filters.categories,
      };
    }

    if (filters.severities && filters.severities.length > 0) {
      where.severity = {
        in: filters.severities,
      };
    }

    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive;
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

    return where;
  }, [currentUser?.sectorId, filters]);

  const queryParams = useMemo(() => ({
    orderBy: buildOrderBy(
      {
        collaboratorName: "collaborator.name",
        category: "category",
        severity: "severity",
        followUpDate: "followUpDate",
        createdAt: "createdAt",
      },
      { createdAt: "desc" }
    ),
    ...(searchText ? { searchingFor: searchText } : {}),
    where: buildWhereClause(),
    include: {
      collaborator: {
        include: {
          position: true,
          sector: true,
        },
      },
      supervisor: true,
      attachments: true,
    },
  }), [searchText, buildWhereClause, buildOrderBy]);

  // Fetch warnings with infinite scroll
  const {
    items: warnings,
    isLoading: isLoadingWarnings,
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
  } = useWarningsInfiniteMobile({
    ...queryParams,
    enabled: !!currentUser?.sectorId,
  });

  // Get unique team members for filter
  const teamMembers = useMemo(() => {
    const members = new Map<string, User>();
    warnings.forEach((warning: any /* TODO: Add proper type */) => {
      if (warning.collaborator && !members.has(warning.collaborator.id)) {
        members.set(warning.collaborator.id, warning.collaborator);
      }
    });
    return Array.from(members.values());
  }, [warnings]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refresh();
    } finally {
      setRefreshing(false);
    }
  }, [refresh]);

  const handleWarningPress = useCallback((warningId: string) => {
    router.push(`/meu-pessoal/advertencias/detalhes/${warningId}` as any);
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

  const handleRemoveFilter = useCallback((filterKey: keyof TeamWarningFilters, value?: string) => {
    setFilters((prev) => {
      const newFilters = { ...prev };

      if (value && (filterKey === "userIds" || filterKey === "categories" || filterKey === "severities")) {
        const currentArray = newFilters[filterKey] || [];
        newFilters[filterKey] = currentArray.filter((item) => item !== value) as any;
        if (newFilters[filterKey]?.length === 0) {
          delete newFilters[filterKey];
        }
      } else {
        delete newFilters[filterKey];
      }

      return newFilters;
    });
  }, []);

  // Get all column definitions
  const allColumns = useMemo(() => createWarningColumnDefinitions(), []);

  // Count active filters
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.userIds?.length) count++;
    if (filters.categories?.length) count++;
    if (filters.severities?.length) count++;
    if (filters.isActive !== undefined) count++;
    if (filters.startDate) count++;
    if (filters.endDate) count++;
    return count;
  }, [filters]);

  // Only show skeleton on initial load
  const isInitialLoad = isLoading && warnings.length === 0;

  if (isInitialLoad) {
    return (
      <PrivilegeGuard requiredPrivilege={SECTOR_PRIVILEGES.LEADER}>
        <ThemedView style={styles.container}>
          <EmptyState icon="alert-triangle" title="Carregando advertências..." description="Por favor, aguarde..." />
        </ThemedView>
      </PrivilegeGuard>
    );
  }

  if (error && warnings.length === 0) {
    return (
      <PrivilegeGuard requiredPrivilege={SECTOR_PRIVILEGES.LEADER}>
        <ThemedView style={styles.container}>
          <ErrorScreen message="Erro ao carregar advertências" detail={error.message} onRetry={handleRefresh} />
        </ThemedView>
      </PrivilegeGuard>
    );
  }

  if (!currentUser?.sectorId) {
    return (
      <PrivilegeGuard requiredPrivilege={SECTOR_PRIVILEGES.LEADER}>
        <ThemedView style={styles.container}>
          <EmptyState icon="alert-circle" title="Setor não encontrado" description="Você precisa estar associado a um setor para visualizar as advertências da equipe" />
        </ThemedView>
      </PrivilegeGuard>
    );
  }

  const hasWarnings = Array.isArray(warnings) && warnings.length > 0;

  return (
    <PrivilegeGuard requiredPrivilege={SECTOR_PRIVILEGES.LEADER}>
      <>
        <ThemedView style={[styles.container, { backgroundColor: colors.background, paddingBottom: insets.bottom }]}>
          {/* Search and Filter */}
          <View style={styles.searchContainer}>
            <SearchBar
              ref={searchInputRef}
              value={displaySearchText}
              onChangeText={handleDisplaySearchChange}
              onSearch={handleSearch}
              placeholder="Buscar advertências..."
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

          {/* Filter Tags */}
          <TeamWarningFilterTags
            filters={filters}
            onRemoveFilter={handleRemoveFilter}
            teamMembers={teamMembers}
          />

          {/* Stats Card */}
          {hasWarnings && <TeamWarningStatsCard warnings={warnings} />}

          {/* Warning Table */}
          {hasWarnings ? (
            <TableErrorBoundary onRetry={handleRefresh}>
              <TeamWarningTable
                warnings={warnings}
                onWarningPress={handleWarningPress}
                onRefresh={handleRefresh}
                onEndReached={canLoadMore ? loadMore : undefined}
                onPrefetch={shouldPrefetch ? prefetchNext : undefined}
                refreshing={refreshing || isRefetching}
                loading={false}
                loadingMore={isFetchingNextPage}
                sortConfigs={sortConfigs}
                onSort={(configs) => {
                  if (configs.length === 0) {
                    handleSort("createdAt");
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
                icon={searchText ? "search" : "alert-triangle"}
                title={searchText ? "Nenhuma advertência encontrada" : "Nenhuma advertência registrada"}
                description={
                  searchText ? `Nenhum resultado para "${searchText}"` : "As advertências da sua equipe aparecerão aqui"
                }
                actionLabel={searchText ? undefined : undefined}
                onAction={searchText ? undefined : undefined}
              />
            </View>
          )}

          {/* Items count */}
          {hasWarnings && <ItemsCountDisplay loadedCount={totalItemsLoaded} totalCount={totalCount} isLoading={isFetchingNextPage} />}
        </ThemedView>

        {/* Slide-in panels */}
        <SlideInPanel isOpen={isFilterPanelOpen} onClose={handleCloseFilters}>
          <TeamWarningFilterDrawerContent
            filters={filters}
            onFiltersChange={setFilters}
            onClear={handleClearFilters}
            activeFiltersCount={activeFiltersCount}
            teamMembers={teamMembers}
          />
        </SlideInPanel>

        <SlideInPanel isOpen={isColumnPanelOpen} onClose={handleCloseColumns}>
          <TeamWarningColumnDrawerContent
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
});
