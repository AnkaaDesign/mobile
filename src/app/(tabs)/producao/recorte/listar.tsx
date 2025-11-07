import React, { useState, useMemo, useCallback } from "react";
import { View, StyleSheet } from "react-native";
import { router } from "expo-router";
import { IconFilter, IconList } from "@tabler/icons-react-native";
import { ThemedText } from "@/components/ui/themed-text";
import { SearchBar } from "@/components/ui/search-bar";
import { FAB } from "@/components/ui/fab";
import { ListActionButton } from "@/components/ui";
import { useTheme } from "@/lib/theme";
import { useAuth } from "@/contexts/auth-context";
import { useCutsInfiniteMobile } from "@/hooks/use-cuts-infinite-mobile";
import { spacing } from "@/constants/design-system";
import { SECTOR_PRIVILEGES, CUT_STATUS, routes } from '@/constants';
import { hasPrivilege } from '@/utils';
import { showToast } from "@/components/ui/toast";
import { useDebounce } from "@/hooks/use-debounce";
import type { Cut } from '@/types';
import { Icon } from "@/components/ui/icon";
import { CutsTable, createColumnDefinitions } from "@/components/production/cuts/list/cuts-table";
import { CutsFilterDrawerContent } from "@/components/production/cuts/list/cuts-filter-drawer-content";
import { CutsColumnDrawerContent, getDefaultVisibleColumns } from "@/components/production/cuts/list/cuts-column-drawer-content";
// import { useUtilityDrawer } from "@/contexts/utility-drawer-context";
// import { UtilityDrawerWrapper } from "@/components/ui/utility-drawer";
import { SlideInPanel } from "@/components/ui/slide-in-panel";
import type { SortConfig } from "@/lib/sort-utils";
import { applyMultiSort } from "@/lib/sort-utils";

export default function CuttingListScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  // const { openFilterDrawer, openColumnDrawer } = useUtilityDrawer();

  // Panel state
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [isColumnPanelOpen, setIsColumnPanelOpen] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [sortConfigs, setSortConfigs] = useState<SortConfig[]>([]);
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(() => getDefaultVisibleColumns());
  const [filters, setFilters] = useState<{
    status?: string[];
    type?: string[];
    origin?: string[];
    taskId?: string;
    dateRange?: { gte?: Date; lte?: Date };
  }>({
    status: [CUT_STATUS.PENDING, CUT_STATUS.CUTTING],
  });

  // Debounced search
  const debouncedSearch = useDebounce(searchQuery, 500);

  // Check permissions
  const canCreate = hasPrivilege(user, SECTOR_PRIVILEGES.PRODUCTION) || hasPrivilege(user, SECTOR_PRIVILEGES.ADMIN);
  const canView = hasPrivilege(user, SECTOR_PRIVILEGES.PRODUCTION) || hasPrivilege(user, SECTOR_PRIVILEGES.LEADER) || hasPrivilege(user, SECTOR_PRIVILEGES.ADMIN);
  const canEdit = hasPrivilege(user, SECTOR_PRIVILEGES.PRODUCTION) || hasPrivilege(user, SECTOR_PRIVILEGES.ADMIN);
  const canDelete = hasPrivilege(user, SECTOR_PRIVILEGES.ADMIN);

  // Count active filters
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.status && filters.status.length > 0) count++;
    if (filters.type && filters.type.length > 0) count++;
    if (filters.origin && filters.origin.length > 0) count++;
    if (filters.taskId) count++;
    if (filters.dateRange?.gte || filters.dateRange?.lte) count++;
    return count;
  }, [filters]);

  // Build query params
  const queryParams = useMemo(() => {
    const params: any = {
      include: {
        file: true,
        task: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    };

    const whereConditions: any[] = [];

    // Status filter
    if (filters.status && filters.status.length > 0) {
      whereConditions.push({ status: { in: filters.status } });
    }

    // Type filter
    if (filters.type && filters.type.length > 0) {
      whereConditions.push({ type: { in: filters.type } });
    }

    // Origin filter
    if (filters.origin && filters.origin.length > 0) {
      whereConditions.push({ origin: { in: filters.origin } });
    }

    // Task filter
    if (filters.taskId) {
      whereConditions.push({ taskId: filters.taskId });
    }

    // Date range filter
    if (filters.dateRange) {
      const dateFilter: any = {};
      if (filters.dateRange.gte) dateFilter.gte = filters.dateRange.gte;
      if (filters.dateRange.lte) dateFilter.lte = filters.dateRange.lte;
      if (Object.keys(dateFilter).length > 0) {
        whereConditions.push({ createdAt: dateFilter });
      }
    }

    // Search filter
    if (debouncedSearch) {
      whereConditions.push({
        OR: [
          { file: { filename: { contains: debouncedSearch, mode: "insensitive" } } },
          { task: { name: { contains: debouncedSearch, mode: "insensitive" } } },
        ],
      });
    }

    if (whereConditions.length > 0) {
      params.where = whereConditions.length === 1 ? whereConditions[0] : { AND: whereConditions };
    }

    return params;
  }, [filters, debouncedSearch]);

  // Fetch cuts
  const {
    items: cuts,
    loadMore: fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error,
    refetch,
    isRefetching,
  } = useCutsInfiniteMobile({ ...queryParams, enabled: canView });

  // Apply client-side sorting
  const sortedCuts = useMemo(() => {
    if (sortConfigs.length === 0) return cuts;
    return applyMultiSort(cuts, sortConfigs);
  }, [cuts, sortConfigs]);

  // Handle refresh
  const handleRefresh = async () => {
    await refetch();
    showToast({ message: "Lista atualizada", type: "success" });
  };

  // Handle cut press
  const handleCutPress = useCallback((cutId: string) => {
    router.push(routes.production.cutting.details(cutId) as any);
  }, []);

  // Handle cut edit
  const handleCutEdit = useCallback((cutId: string) => {
    router.push(routes.production.cutting.edit(cutId) as any);
  }, []);

  // Handle cut delete
  const handleCutDelete = useCallback(async (cutId: string) => {
    // TODO: Implement delete logic
    showToast({ message: "Funcionalidade em desenvolvimento", type: "info" });
  }, []);

  // Handle filter changes
  const handleFiltersChange = useCallback((newFilters: any) => {
    setFilters(newFilters);
  }, []);

  // Handle clear filters
  const handleClearFilters = useCallback(() => {
    setFilters({
      status: [CUT_STATUS.PENDING, CUT_STATUS.CUTTING],
    });
  }, []);

  // Handle sort change
  const handleSortChange = useCallback((configs: SortConfig[]) => {
    setSortConfigs(configs);
  }, []);

  // Handle column visibility change
  const handleVisibilityChange = useCallback((columns: Set<string>) => {
    setVisibleColumns(columns);
  }, []);

  // Open filter drawer
  const handleOpenFilterDrawer = useCallback(() => {
    setIsColumnPanelOpen(false); // Close column panel if open
    setIsFilterPanelOpen(true);
  }, []);

  const handleCloseFilterDrawer = useCallback(() => {
    setIsFilterPanelOpen(false);
  }, []);

  // Open column drawer
  const handleOpenColumnDrawer = useCallback(() => {
    setIsFilterPanelOpen(false); // Close filter panel if open
    setIsColumnPanelOpen(true);
  }, []);

  const handleCloseColumnDrawer = useCallback(() => {
    setIsColumnPanelOpen(false);
  }, []);

  if (!canView) {
    return (
      <View style={StyleSheet.flatten([styles.container, { backgroundColor: colors.background }])}>
        <View style={styles.centerContent}>
          <Icon name="lock" size={48} color={colors.mutedForeground} />
          <ThemedText style={styles.errorTitle}>Acesso Negado</ThemedText>
          <ThemedText style={styles.errorMessage}>
            Você não tem permissão para visualizar cortes.
          </ThemedText>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={StyleSheet.flatten([styles.container, { backgroundColor: colors.background }])}>
        <View style={styles.centerContent}>
          <Icon name="alert-circle" size={48} color={colors.destructive} />
          <ThemedText style={styles.errorTitle}>Erro ao carregar cortes</ThemedText>
          <ThemedText style={styles.errorMessage}>{(error as Error).message}</ThemedText>
        </View>
      </View>
    );
  }

  return (
    <>
      <View style={StyleSheet.flatten([styles.container, { backgroundColor: colors.background }])}>
        {/* Header */}
        <View style={styles.header}>
          <SearchBar
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Buscar cortes..."
            style={styles.searchBar}
          />
          <View style={styles.headerActions}>
            <ListActionButton
              icon={<IconList size={20} color={colors.foreground} />}
              onPress={handleOpenColumnDrawer}
              badgeCount={visibleColumns.size}
              badgeVariant="primary"
            />
            <ListActionButton
              icon={<IconFilter size={20} color={colors.foreground} />}
              onPress={handleOpenFilterDrawer}
              badgeCount={activeFiltersCount}
              badgeVariant="destructive"
              showBadge={activeFiltersCount > 0}
            />
          </View>
        </View>

        {/* Table */}
        <CutsTable
          cuts={sortedCuts}
          onCutPress={handleCutPress}
          onCutEdit={canEdit ? handleCutEdit : undefined}
          onCutDelete={canDelete ? handleCutDelete : undefined}
          onRefresh={handleRefresh}
          onEndReached={() => {
            if (hasNextPage && !isFetchingNextPage) {
              fetchNextPage();
            }
          }}
          onPrefetch={() => {
            if (hasNextPage && !isFetchingNextPage) {
              fetchNextPage();
            }
          }}
          refreshing={isRefetching}
          loading={isLoading}
          loadingMore={isFetchingNextPage}
          sortConfigs={sortConfigs}
          onSort={handleSortChange}
          visibleColumnKeys={Array.from(visibleColumns)}
          enableSwipeActions={true}
        />

        {/* FAB */}
        {canCreate && (
          <FAB
            icon="plus"
            onPress={() => router.push(routes.production.cutting.create as any)}
            style={styles.fab}
          />
        )}
      </View>

      {/* Slide-in panels */}
      <SlideInPanel isOpen={isFilterPanelOpen} onClose={handleCloseFilterDrawer}>
        <CutsFilterDrawerContent
          filters={filters}
          onFiltersChange={handleFiltersChange}
          onClear={handleClearFilters}
          onClose={handleCloseFilterDrawer}
        />
      </SlideInPanel>

      <SlideInPanel isOpen={isColumnPanelOpen} onClose={handleCloseColumnDrawer}>
        <CutsColumnDrawerContent
          allColumns={allColumns}
          visibleColumnKeys={Array.from(visibleColumns)}
          onColumnsChange={handleVisibilityChange}
          onClose={handleCloseColumnDrawer}
          defaultColumns={getDefaultVisibleColumns()}
        />
      </SlideInPanel>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 8,
    gap: 8,
  },
  searchBar: {
    flex: 1,
  },
  headerActions: {
    flexDirection: "row",
    gap: 8,
  },
  centerContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
  },
  errorMessage: {
    fontSize: 14,
    opacity: 0.6,
    textAlign: "center",
  },
  fab: {
    position: "absolute",
    right: spacing.md,
    bottom: spacing.xl,
  },
});
