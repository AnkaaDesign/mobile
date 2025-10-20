import React, { useState, useCallback, useMemo } from "react";
import { View, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { IconFilter, IconList } from "@tabler/icons-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useOrderScheduleMutations } from '../../../../../hooks';
import { useOrderSchedulesInfiniteMobile } from "@/hooks";
import type { OrderScheduleGetManyFormData } from '../../../../../schemas';
import { ThemedView, FAB, ErrorScreen, EmptyState, ListActionButton, SearchBar } from "@/components/ui";
import { OrderScheduleTable, createColumnDefinitions } from "@/components/inventory/order/schedule/order-schedule-table";
import type { SortConfig } from "@/components/inventory/order/schedule/order-schedule-table";
import { OrderScheduleFilterTags } from "@/components/inventory/order/schedule/order-schedule-filter-tags";
import { TableErrorBoundary } from "@/components/ui/table-error-boundary";
import { ItemsCountDisplay } from "@/components/ui/items-count-display";
import { OrderScheduleListSkeleton } from "@/components/inventory/order/schedule/skeleton/order-schedule-list-skeleton";
import { useTheme } from "@/lib/theme";
import { routes } from '../../../../../constants';
import { routeToMobilePath } from "@/lib/route-mapper";

// New hooks and components
import { useTableSort } from "@/hooks/useTableSort";
import { useColumnVisibility } from "@/hooks/useColumnVisibility";
import { BaseFilterDrawer, BooleanFilter, SelectFilter } from "@/components/common/filters";
import { SCHEDULE_FREQUENCY_LABELS } from '../../../../../constants';
import { Input } from "@/components/ui/input";
import { Text } from "@/components/ui/text";

export default function InventoryOrderSchedulesListScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [displaySearchText, setDisplaySearchText] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedSchedules, setSelectedSchedules] = useState<Set<string>>(new Set());
  const [showSelection, setShowSelection] = useState(false);
  const [showColumnManager, setShowColumnManager] = useState(false);

  // Filter state
  const [filters, setFilters] = useState<{
    frequency?: string[];
    isActive?: boolean;
    supplierIds?: string[];
  }>({});

  const { sortConfigs, handleSort, buildOrderBy } = useTableSort(
    [{ column: "createdAt", direction: "desc", order: 0 }],
    3,
    false
  );

  const {
    visibleColumns,
    setVisibleColumns,
    isLoading: isColumnsLoading,
  } = useColumnVisibility(
    "orderSchedules",
    ["supplier", "frequency", "specificDate", "isActive"],
    ["supplier", "frequency", "specificDate", "isActive", "createdAt"]
  );

  // Build API query
  const buildWhereClause = useCallback(() => {
    const where: any = {};

    if (filters.frequency?.length) {
      where.frequency = { in: filters.frequency };
    }

    if (typeof filters.isActive === 'boolean') {
      where.isActive = filters.isActive;
    }

    if (filters.supplierIds?.length) {
      where.supplierId = { in: filters.supplierIds };
    }

    return Object.keys(where).length > 0 ? where : undefined;
  }, [filters]);

  const queryParams = useMemo(() => ({
    orderBy: buildOrderBy(
      {
        frequency: "frequency",
        specificDate: "specificDate",
        isActive: "isActive",
        createdAt: "createdAt",
        updatedAt: "updatedAt",
      },
      { createdAt: "desc" }
    ),
    ...(searchText ? { searchingFor: searchText } : {}),
    ...(buildWhereClause() ? { where: buildWhereClause() } : {}),
    include: {
      supplier: true,
      order: false,
      weeklyConfig: false,
      monthlyConfig: false,
      yearlyConfig: false,
    },
  }), [searchText, buildWhereClause, buildOrderBy]);

  const {
    items: schedules,
    isLoading,
    error,
    refetch,
    isRefetching,
    loadMore,
    canLoadMore,
    isFetchingNextPage,
    totalItemsLoaded,
    totalCount,
    refresh,
  } = useOrderSchedulesInfiniteMobile(queryParams);

  const { delete: deleteSchedule } = useOrderScheduleMutations();

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refresh();
    } finally {
      setRefreshing(false);
    }
  }, [refresh]);

  const handleCreateSchedule = () => {
    router.push(routeToMobilePath(routes.inventory.orders.schedules.create) as any);
  };

  const handleSchedulePress = (scheduleId: string) => {
    router.push(routeToMobilePath(routes.inventory.orders.schedules.details(scheduleId)) as any);
  };

  const handleEditSchedule = (scheduleId: string) => {
    router.push(routeToMobilePath(routes.inventory.orders.schedules.edit(scheduleId)) as any);
  };

  const handleDeleteSchedule = useCallback(
    async (scheduleId: string) => {
      await deleteSchedule(scheduleId);
      if (selectedSchedules.has(scheduleId)) {
        const newSelection = new Set(selectedSchedules);
        newSelection.delete(scheduleId);
        setSelectedSchedules(newSelection);
      }
    },
    [deleteSchedule, selectedSchedules],
  );

  const handleSelectionChange = useCallback((newSelection: Set<string>) => {
    setSelectedSchedules(newSelection);
  }, []);

  const handleSearch = useCallback((text: string) => {
    setSearchText(text);
  }, []);

  const handleDisplaySearchChange = useCallback((text: string) => {
    setDisplaySearchText(text);
  }, []);

  const handleApplyFilters = useCallback(() => {
    setShowFilters(false);
  }, []);

  const handleClearFilters = useCallback(() => {
    setFilters({});
    setSearchText("");
    setDisplaySearchText("");
    setSelectedSchedules(new Set());
    setShowSelection(false);
  }, []);

  const handleColumnsChange = useCallback((newColumns: Set<string>) => {
    setVisibleColumns(Array.from(newColumns));
  }, [setVisibleColumns]);

  // Get all column definitions
  const allColumns = useMemo(() => createColumnDefinitions(), []);

  // Count active filters
  const activeFiltersCount = Object.values(filters).filter(
    (value) => value !== undefined && value !== null && (Array.isArray(value) ? value.length > 0 : value === true)
  ).length;

  // Frequency options for filter
  const frequencyOptions = useMemo(() =>
    Object.entries(SCHEDULE_FREQUENCY_LABELS).map(([value, label]) => ({
      value,
      label,
    })),
    []
  );

  // Filter sections for BaseFilterDrawer
  const filterSections = useMemo(() => [
    {
      id: "status",
      title: "Status",
      defaultOpen: true,
      badge: typeof filters.isActive === 'boolean' ? 1 : 0,
      content: (
        <BooleanFilter
          label="Apenas agendamentos ativos"
          description="Mostrar apenas agendamentos ativos"
          value={!!filters.isActive}
          onChange={(value) => setFilters(prev => ({ ...prev, isActive: value || undefined }))}
        />
      ),
    },
    {
      id: "frequency",
      title: "Frequência",
      defaultOpen: false,
      badge: filters.frequency?.length || 0,
      content: (
        <View style={{ gap: 8 }}>
          <Text style={{ fontSize: 14, fontWeight: '600', color: colors.foreground }}>Frequências</Text>
          <Input
            value={filters.frequency?.join(", ") || ""}
            onChangeText={(value) => setFilters(prev => ({
              ...prev,
              frequency: value ? value.split(",").map(f => f.trim()).filter(Boolean) : undefined
            }))}
            placeholder="Ex: DAILY, WEEKLY, MONTHLY"
          />
        </View>
      ),
    },
  ], [filters, colors]);

  // Only show skeleton on initial load, not on refetch/sort
  const isInitialLoad = isLoading && !isRefetching && schedules.length === 0;

  if (isInitialLoad) {
    return <OrderScheduleListSkeleton />;
  }

  if (error && schedules.length === 0) {
    return (
      <ThemedView style={styles.container}>
        <ErrorScreen message="Erro ao carregar agendamentos" detail={error.message} onRetry={handleRefresh} />
      </ThemedView>
    );
  }

  const hasSchedules = Array.isArray(schedules) && schedules.length > 0;

  return (
    <ThemedView style={[styles.container, { backgroundColor: colors.background, paddingBottom: insets.bottom }]}>
      {/* Search and Filter */}
      <View style={[styles.searchContainer]}>
        <SearchBar
          value={displaySearchText}
          onChangeText={handleDisplaySearchChange}
          onSearch={handleSearch}
          placeholder="Buscar agendamentos..."
          style={styles.searchBar}
          debounceMs={300}
        />
        <View style={styles.buttonContainer}>
          <ListActionButton
            icon={<IconList size={20} color={colors.foreground} />}
            onPress={() => setShowColumnManager(true)}
            badgeCount={visibleColumns.length}
            badgeVariant="primary"
          />
          <ListActionButton
            icon={<IconFilter size={20} color={colors.foreground} />}
            onPress={() => setShowFilters(true)}
            badgeCount={activeFiltersCount}
            badgeVariant="destructive"
            showBadge={activeFiltersCount > 0}
          />
        </View>
      </View>

      {/* Individual filter tags */}
      <OrderScheduleFilterTags
        filters={filters}
        searchText={searchText}
        onFilterChange={setFilters}
        onSearchChange={(text) => {
          setSearchText(text);
          setDisplaySearchText(text);
        }}
        onClearAll={handleClearFilters}
      />

      {hasSchedules ? (
        <TableErrorBoundary onRetry={handleRefresh}>
          <OrderScheduleTable
            schedules={schedules}
            onSchedulePress={handleSchedulePress}
            onScheduleEdit={handleEditSchedule}
            onScheduleDelete={handleDeleteSchedule}
            onRefresh={handleRefresh}
            onEndReached={canLoadMore ? loadMore : undefined}
            refreshing={refreshing || isRefetching}
            loading={false}
            loadingMore={isFetchingNextPage}
            showSelection={showSelection}
            selectedSchedules={selectedSchedules}
            onSelectionChange={handleSelectionChange}
            sortConfigs={sortConfigs as SortConfig[]}
            onSort={(configs) => handleSort(configs[0]?.columnKey || "createdAt")}
            visibleColumnKeys={visibleColumns}
            enableSwipeActions={true}
          />
        </TableErrorBoundary>
      ) : (
        <View style={styles.emptyContainer}>
          <EmptyState
            icon={searchText ? "search" : "calendar"}
            title={searchText ? "Nenhum agendamento encontrado" : "Nenhum agendamento cadastrado"}
            description={
              searchText ? `Nenhum resultado para "${searchText}"` : "Comece cadastrando o primeiro agendamento de pedido"
            }
            actionLabel={searchText ? undefined : "Cadastrar Agendamento"}
            onAction={searchText ? undefined : handleCreateSchedule}
          />
        </View>
      )}

      {/* Items count */}
      {hasSchedules && <ItemsCountDisplay loadedCount={totalItemsLoaded} totalCount={totalCount} isLoading={isFetchingNextPage} />}

      {hasSchedules && <FAB icon="plus" onPress={handleCreateSchedule} />}

      {/* Filter Drawer */}
      <BaseFilterDrawer
        open={showFilters}
        onOpenChange={setShowFilters}
        sections={filterSections}
        onApply={handleApplyFilters}
        onClear={handleClearFilters}
        activeFiltersCount={activeFiltersCount}
        title="Filtros de Agendamentos"
        description="Configure os filtros para refinar sua busca"
      />

      {/* Column Visibility Drawer - Simplified version without the full drawer */}
      {/* TODO: Implement OrderScheduleColumnVisibilityDrawer if needed */}
    </ThemedView>
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
