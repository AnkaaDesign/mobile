import { useState, useMemo, useCallback } from "react";
import { View, StyleSheet } from "react-native";
import { router } from "expo-router";
import { IconFilter, IconList } from "@tabler/icons-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { SearchBar } from "@/components/ui/search-bar";
import { HistoryTable, createColumnDefinitions } from "@/components/production/task/history/history-table";
import { getDefaultVisibleColumns } from "@/components/production/task/history/column-visibility-manager";
import { ThemedView } from "@/components/ui/themed-view";
import { ListActionButton } from "@/components/ui/list-action-button";
import { ItemsCountDisplay } from "@/components/ui/items-count-display";
import { useTheme } from "@/lib/theme";
import { useAuth } from "@/contexts/auth-context";
import { useTasksInfiniteMobile } from "@/hooks/use-tasks-infinite-mobile";
import { useTaskMutations } from '../../../../hooks';
import { TASK_STATUS, SECTOR_PRIVILEGES, TASK_STATUS_LABELS } from '../../../../constants';
import { hasPrivilege } from '../../../../utils';
import { showToast } from "@/components/ui/toast";
// Old drawer implementation (kept for reference)
// import { UtilityDrawerWrapper } from "@/components/ui/utility-drawer";
// import { useUtilityDrawer } from "@/contexts/utility-drawer-context";
// import { HistoryFilterDrawerContent } from "@/components/production/task/history/history-filter-drawer-content";
// import { ColumnVisibilityDrawerContent } from "@/components/ui/column-visibility-drawer";
// New slide-in panel implementation
import { SlideInPanel } from "@/components/ui/slide-in-panel";
import { HistoryFilterSlidePanel } from "@/components/production/task/history/history-filter-slide-panel";
import { ColumnVisibilitySlidePanel } from "@/components/ui/column-visibility-slide-panel";

export default function ProductionHistoryScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { deleteAsync: deleteTask, update } = useTaskMutations();
  // Old drawer context (kept for reference)
  // const { openFilterDrawer, openColumnDrawer } = useUtilityDrawer();

  // State
  const [refreshing, setRefreshing] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [displaySearchText, setDisplaySearchText] = useState("");
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(getDefaultVisibleColumns());

  // New slide panel state
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [isColumnPanelOpen, setIsColumnPanelOpen] = useState(false);

  // Filter state - Default to show Finalizado, Faturado, and Quitado
  const [filters, setFilters] = useState<any>({
    status: [TASK_STATUS.COMPLETED, TASK_STATUS.INVOICED, TASK_STATUS.SETTLED],
  });

  // Check user permissions
  const canEdit = hasPrivilege(user, SECTOR_PRIVILEGES.WAREHOUSE);
  const canDelete = hasPrivilege(user, SECTOR_PRIVILEGES.ADMIN);
  const canViewPrice = hasPrivilege(user, SECTOR_PRIVILEGES.ADMIN) || hasPrivilege(user, SECTOR_PRIVILEGES.LEADER);
  const canViewStatusFilter = hasPrivilege(user, SECTOR_PRIVILEGES.ADMIN) || hasPrivilege(user, SECTOR_PRIVILEGES.FINANCIAL);
  const isProduction = user?.sector?.name === "Produção";

  // Build query params
  const buildWhereClause = useCallback(() => {
    const where: any = {};

    // Always show completed and cancelled tasks (no tabs)
    where.status = {
      in: [TASK_STATUS.COMPLETED, TASK_STATUS.CANCELLED],
    };

    // Apply status filter if set
    if (filters.status?.length) {
      where.status = {
        in: filters.status,
      };
    }

    // Apply finished date range filter
    if (filters.finishedDateRange) {
      where.finishedAt = {};
      if (filters.finishedDateRange.from) {
        where.finishedAt.gte = filters.finishedDateRange.from;
      }
      if (filters.finishedDateRange.to) {
        where.finishedAt.lte = filters.finishedDateRange.to;
      }
    }

    // Apply sector filter
    if (filters.sectorIds?.length) {
      where.sectorId = {
        in: filters.sectorIds,
      };
    }

    // Apply customer filter
    if (filters.customerIds?.length) {
      where.customerId = {
        in: filters.customerIds,
      };
    }

    // Apply assignee filter (users who completed the task)
    if (filters.assigneeIds?.length) {
      where.updatedById = {
        in: filters.assigneeIds,
      };
    }

    // Apply price range filter
    if (filters.priceRange) {
      where.price = {};
      if (filters.priceRange.from) {
        where.price.gte = filters.priceRange.from;
      }
      if (filters.priceRange.to) {
        where.price.lte = filters.priceRange.to;
      }
    }

    // Sector-based filtering for production users
    if (isProduction && !hasPrivilege(user, SECTOR_PRIVILEGES.ADMIN)) {
      where.OR = [
        { sectorId: user?.sectorId },
        { sectorId: null },
      ];
    }

    return where;
  }, [filters, isProduction, user]);

  const queryParams = useMemo(() => ({
    include: {
      customer: true,
      sector: true,
      generalPainting: true,
      updatedBy: {
        select: {
          id: true,
          name: true,
        },
      },
      services: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: { finishedAt: "desc" },
    ...(searchText ? { searchingFor: searchText } : {}),
    where: buildWhereClause(),
  }), [searchText, buildWhereClause]);

  // Fetch tasks with infinite scroll
  const {
    items: tasks,
    loadMore,
    hasNextPage: canLoadMore,
    isFetchingNextPage,
    isLoading,
    isRefetching,
    refetch,
    totalItemsLoaded,
    totalCount,
  } = useTasksInfiniteMobile(queryParams);

  // Column definitions
  const allColumns = useMemo(() => createColumnDefinitions(), []);

  // Count active filters
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.status?.length) count++;
    if (filters.finishedDateRange) count++;
    if (filters.sectorIds?.length) count++;
    if (filters.customerIds?.length) count++;
    if (filters.assigneeIds?.length) count++;
    if (filters.priceRange) count++;
    return count;
  }, [filters]);

  // Handlers
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  const handleSearch = useCallback((text: string) => {
    setSearchText(text);
  }, []);

  const handleDisplaySearchChange = useCallback((text: string) => {
    setDisplaySearchText(text);
  }, []);

  const handleTaskPress = (taskId: string) => {
    router.push(`/producao/cronograma/detalhes/${taskId}` as any);
  };

  const handleEditTask = (taskId: string) => {
    if (!canEdit) {
      showToast({ message: "Você não tem permissão para editar tarefas", type: "error" });
      return;
    }
    router.push(`/producao/cronograma/editar/${taskId}`);
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      await deleteTask(taskId);
      showToast({
        message: "Tarefa excluída com sucesso",
        type: "success",
      });
      refetch();
    } catch (error) {
      showToast({
        title: "Erro ao excluir tarefa",
        message: error instanceof Error ? error.message : "Ocorreu um erro desconhecido",
        type: "error",
      });
    }
  };

  const handleSectorChange = async (taskId: string, sectorId: string) => {
    if (!canEdit) {
      showToast({ message: "Você não tem permissão para alterar o setor", type: "error" });
      return;
    }

    try {
      await update({ id: taskId, data: { sectorId } });
      showToast({ message: "Setor alterado com sucesso", type: "success" });
    } catch (error) {
      showToast({ message: "Erro ao alterar setor", type: "error" });
      throw error; // Re-throw to let the modal know there was an error
    }
  };

  const handleStatusChange = async (taskId: string, newStatus: TASK_STATUS) => {
    if (!canEdit) {
      showToast({ message: "Você não tem permissão para alterar o status", type: "error" });
      return;
    }

    try {
      const updateData: any = { status: newStatus };

      // Add timestamps based on status
      if (newStatus === TASK_STATUS.IN_PRODUCTION) {
        updateData.startedAt = new Date();
      } else if (newStatus === TASK_STATUS.COMPLETED) {
        updateData.finishedAt = new Date();
      }

      await update({ id: taskId, data: updateData });
      showToast({ message: `Status alterado para ${TASK_STATUS_LABELS[newStatus as keyof typeof TASK_STATUS_LABELS]}`, type: "success" });
    } catch (error) {
      showToast({ message: "Erro ao alterar status", type: "error" });
      throw error; // Re-throw to let the modal know there was an error
    }
  };

  const handleColumnsChange = useCallback((newColumns: Set<string>) => {
    setVisibleColumns(newColumns);
  }, []);

  const handleClearFilters = useCallback(() => {
    setFilters({
      status: [TASK_STATUS.COMPLETED, TASK_STATUS.INVOICED, TASK_STATUS.SETTLED],
    });
  }, []);

  // Old drawer handlers (kept for reference)
  // const handleOpenFilters = useCallback(() => {
  //   openFilterDrawer(() => (
  //     <HistoryFilterDrawerContent
  //       filters={filters}
  //       onFiltersChange={setFilters}
  //       onClear={handleClearFilters}
  //       activeFiltersCount={activeFiltersCount}
  //       canViewPrice={canViewPrice}
  //       canViewStatusFilter={canViewStatusFilter}
  //     />
  //   ));
  // }, [openFilterDrawer, filters, handleClearFilters, activeFiltersCount, canViewPrice, canViewStatusFilter]);
  //
  // const handleOpenColumns = useCallback(() => {
  //   openColumnDrawer(() => (
  //     <ColumnVisibilityDrawerContent
  //       columns={allColumns}
  //       visibleColumns={visibleColumns}
  //       onVisibilityChange={handleColumnsChange}
  //       defaultColumns={getDefaultVisibleColumns()}
  //     />
  //   ));
  // }, [openColumnDrawer, allColumns, visibleColumns, handleColumnsChange]);

  // New slide panel handlers
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

  // Only show skeleton on initial load
  const isInitialLoad = isLoading && tasks.length === 0;

  const hasTasks = Array.isArray(tasks) && tasks.length > 0;

  return (
    // Old drawer wrapper (kept for reference)
    // <UtilityDrawerWrapper>
    <>
      <ThemedView style={[styles.container, { backgroundColor: colors.background, paddingBottom: insets.bottom }]}>
        {/* Search and Action Buttons */}
        <View style={styles.searchContainer}>
          <SearchBar
            value={displaySearchText}
            onChangeText={handleDisplaySearchChange}
            onSearch={handleSearch}
            placeholder="Buscar por cliente, placa, chassi..."
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

      {/* Table */}
      <HistoryTable
        tasks={tasks}
        visibleColumnKeys={Array.from(visibleColumns)}
        onTaskPress={handleTaskPress}
        onTaskEdit={canEdit ? handleEditTask : undefined}
        onTaskDelete={canDelete ? handleDeleteTask : undefined}
        onTaskSectorChange={canEdit ? handleSectorChange : undefined}
        onTaskStatusChange={canEdit ? handleStatusChange : undefined}
        onRefresh={handleRefresh}
        refreshing={refreshing || isRefetching}
        loading={isInitialLoad}
        loadingMore={isFetchingNextPage}
        onEndReached={canLoadMore ? loadMore : undefined}
        enableSwipeActions={canEdit || canDelete}
      />

      {/* Items count - Pagination display */}
      {hasTasks && (
        <ItemsCountDisplay
          loadedCount={totalItemsLoaded}
          totalCount={totalCount}
          isLoading={isFetchingNextPage}
        />
      )}

      </ThemedView>

      {/* New slide-in panels */}
      <SlideInPanel isOpen={isFilterPanelOpen} onClose={handleCloseFilters}>
        <HistoryFilterSlidePanel
          filters={filters}
          onFiltersChange={setFilters}
          onClear={handleClearFilters}
          onClose={handleCloseFilters}
          activeFiltersCount={activeFiltersCount}
          canViewPrice={canViewPrice}
          canViewStatusFilter={canViewStatusFilter}
        />
      </SlideInPanel>

      <SlideInPanel isOpen={isColumnPanelOpen} onClose={handleCloseColumns}>
        <ColumnVisibilitySlidePanel
          columns={allColumns}
          visibleColumns={visibleColumns}
          onVisibilityChange={handleColumnsChange}
          onClose={handleCloseColumns}
          defaultColumns={getDefaultVisibleColumns()}
        />
      </SlideInPanel>
    </>
    // </UtilityDrawerWrapper>
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
});
