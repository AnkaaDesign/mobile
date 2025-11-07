import { useState, useCallback, useMemo } from "react";
import { View, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { IconFilter, IconList } from "@tabler/icons-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useActivityMutations } from '../../../../hooks';
import { useActivitiesInfiniteMobile } from "@/hooks/use-activities-infinite-mobile";
import type { ActivityGetManyFormData } from '../../../../schemas';
import { ThemedView, FAB, ErrorScreen, EmptyState, SearchBar, ListActionButton } from "@/components/ui";
import { ActivityTable, createColumnDefinitions } from "@/components/inventory/activity/list/activity-table";
import type { SortConfig } from "@/components/inventory/activity/list/activity-table";
import { ActivityFilterTags } from "@/components/inventory/activity/list/activity-filter-tags";

import { TableErrorBoundary } from "@/components/ui/table-error-boundary";
import { ItemsCountDisplay } from "@/components/ui/items-count-display";
import { ActivityListSkeleton } from "@/components/inventory/activity/skeleton/activity-list-skeleton";
import { useTheme } from "@/lib/theme";
import { routes } from '../../../../constants';
import { routeToMobilePath } from "@/lib/route-mapper";
import { useAuth } from "@/contexts/auth-context";
import { hasPrivilege } from '../../../../utils';
import { SECTOR_PRIVILEGES, ACTIVITY_OPERATION, ACTIVITY_REASON } from '../../../../constants';

import { SlideInPanel } from "@/components/ui/slide-in-panel";
import { ColumnVisibilitySlidePanel } from "@/components/ui/column-visibility-slide-panel";
import { ActivityFilterDrawerContent } from "@/components/inventory/activity/list/activity-filter-drawer-content";

export default function ActivityListScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [displaySearchText, setDisplaySearchText] = useState("");
  const [filters, setFilters] = useState<Partial<ActivityGetManyFormData>>({});
  const [sortConfigs, setSortConfigs] = useState<SortConfig[]>([{ columnKey: "createdAt", direction: "desc" }]);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [showSelection, setShowSelection] = useState(false);
  const [visibleColumnKeys, setVisibleColumnKeys] = useState<string[]>(["operation", "item.name", "quantity"]);

  // Slide panel state
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [isColumnPanelOpen, setIsColumnPanelOpen] = useState(false);

  // Permission check
  const canManageWarehouse = useMemo(() => {
    if (!user) return false;
    return hasPrivilege(user, SECTOR_PRIVILEGES.WAREHOUSE) || hasPrivilege(user, SECTOR_PRIVILEGES.ADMIN);
  }, [user]);

  // Build query parameters with sorting
  const buildOrderBy = () => {
    if (!sortConfigs || sortConfigs.length === 0) return { createdAt: "desc" };

    // If only one sort, return as object
    if (sortConfigs.length === 1) {
      const config = sortConfigs[0];
      switch (config.columnKey) {
        case "operation":
          return { operation: config.direction };
        case "item.name":
          return { item: { name: config.direction } };
        case "quantity":
          return { quantity: config.direction };
        case "user.name":
          return { user: { name: config.direction } };
        case "reason":
          return { reason: config.direction };
        case "createdAt":
          return { createdAt: config.direction };
        case "updatedAt":
          return { updatedAt: config.direction };
        default:
          return { createdAt: "desc" };
      }
    }

    // Multiple sorts, return as array
    return sortConfigs.map((config) => {
      switch (config.columnKey) {
        case "operation":
          return { operation: config.direction };
        case "item.name":
          return { item: { name: config.direction } };
        case "quantity":
          return { quantity: config.direction };
        case "user.name":
          return { user: { name: config.direction } };
        case "reason":
          return { reason: config.direction };
        case "createdAt":
          return { createdAt: config.direction };
        case "updatedAt":
          return { updatedAt: config.direction };
        default:
          return { createdAt: "desc" };
      }
    });
  };

  const queryParams = {
    orderBy: buildOrderBy(),
    ...(searchText ? { searchingFor: searchText } : {}),
    ...filters,
  };

  const { items, isLoading, error, isRefetching, loadMore, canLoadMore, isFetchingNextPage, totalItemsLoaded, totalCount, refresh } = useActivitiesInfiniteMobile(queryParams);
  const { deleteAsync } = useActivityMutations();

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refresh();
    } finally {
      setRefreshing(false);
    }
  }, [refresh]);

  const handleCreateActivity = () => {
    // Navigate to create page if route exists
    router.push("/(tabs)/estoque/movimentacoes/cadastrar" as any);
  };

  const handleActivityPress = (activityId: string) => {
    router.push(routeToMobilePath(routes.inventory.activities.details(activityId)) as any);
  };

  const handleEditActivity = (activityId: string) => {
    // Navigate to edit page using activities route
    router.push(`/(tabs)/estoque/movimentacoes/editar/${activityId}` as any);
  };

  const handleDeleteActivity = useCallback(
    async (activityId: string) => {
      await deleteAsync(activityId);
      // Clear selection if the deleted item was selected
      if (selectedItems.has(activityId)) {
        const newSelection = new Set(selectedItems);
        newSelection.delete(activityId);
        setSelectedItems(newSelection);
      }
    },
    [deleteAsync, selectedItems],
  );

  const handleSort = useCallback((configs: SortConfig[]) => {
    setSortConfigs(configs);
  }, []);

  const handleSelectionChange = useCallback((newSelection: Set<string>) => {
    setSelectedItems(newSelection);
  }, []);

  const handleSearch = useCallback((text: string) => {
    setSearchText(text);
  }, []);

  const handleDisplaySearchChange = useCallback((text: string) => {
    setDisplaySearchText(text);
  }, []);

  const handleApplyFilters = useCallback((newFilters: Partial<ActivityGetManyFormData>) => {
    setFilters(newFilters);
  }, []);

  const handleClearFilters = useCallback(() => {
    setFilters({});
    setSearchText("");
    setDisplaySearchText("");
    setSelectedItems(new Set());
    setShowSelection(false);
  }, []);

  const handleColumnsChange = useCallback((newColumns: Set<string>) => {
    setVisibleColumnKeys(Array.from(newColumns));
  }, []);

  const handleRemoveFilter = useCallback((key: string) => {
    const newFilters = { ...filters };

    // Handle array filters (operations, reasons, etc.)
    if (key.startsWith("operation_")) {
      const operation = key.replace("operation_", "");
      newFilters.operations = (newFilters.operations || []).filter((op: ACTIVITY_OPERATION) => op !== operation);
      if (newFilters.operations.length === 0) delete newFilters.operations;
    } else if (key.startsWith("reason_")) {
      const reason = key.replace("reason_", "");
      newFilters.reasons = (newFilters.reasons || []).filter((r: ACTIVITY_REASON) => r !== reason);
      if (newFilters.reasons.length === 0) delete newFilters.reasons;
    } else {
      // Handle other filters
      delete (newFilters as any)[key];
    }

    setFilters(newFilters);
  }, [filters]);

  // Get all column definitions
  const allColumns = useMemo(() => createColumnDefinitions(), []);

  // Count active filters
  const activeFiltersCount = Object.entries(filters).filter(
    ([_key, value]) => value !== undefined && value !== null && (Array.isArray(value) ? value.length > 0 : true),
  ).length;

  const handleOpenFilters = useCallback(() => {
    setIsFilterPanelOpen(true);
  }, []);

  const handleCloseFilters = useCallback(() => {
    setIsFilterPanelOpen(false);
  }, []);

  const handleOpenColumns = useCallback(() => {
    setIsColumnPanelOpen(true);
  }, []);

  const handleCloseColumns = useCallback(() => {
    setIsColumnPanelOpen(false);
  }, []);

  // Only show skeleton on initial load, not on refetch/sort
  const isInitialLoad = isLoading && !isRefetching && items.length === 0;

  // Permission gate
  if (!canManageWarehouse) {
    return (
      <ThemedView style={styles.container}>
        <ErrorScreen
          message="Acesso negado"
          detail="Você não tem permissão para acessar esta funcionalidade. É necessário privilégio de Almoxarifado ou Administrador."
        />
      </ThemedView>
    );
  }

  if (isInitialLoad) {
    return <ActivityListSkeleton />;
  }

  if (error && items.length === 0) {
    return (
      <ThemedView style={styles.container}>
        <ErrorScreen message="Erro ao carregar movimentações" detail={error.message} onRetry={handleRefresh} />
      </ThemedView>
    );
  }

  const hasActivities = Array.isArray(items) && items.length > 0;

  return (
    <>
      <ThemedView style={[styles.container, { backgroundColor: colors.background, paddingBottom: insets.bottom }]}>
      {/* Search, Filter and Sort */}
      <View style={[styles.searchContainer]}>
        <SearchBar
          value={displaySearchText}
          onChangeText={handleDisplaySearchChange}
          onSearch={handleSearch}
          placeholder="Buscar movimentações..."
          style={styles.searchBar}
          debounceMs={300}
        />
        <View style={styles.buttonContainer}>
          <ListActionButton
            icon={<IconList size={20} color={colors.foreground} />}
            onPress={handleOpenColumns}
            badgeCount={visibleColumnKeys.length}
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
      <ActivityFilterTags
        filters={filters}
        searchText={searchText}
        onClearAll={handleClearFilters}
        onRemoveFilter={handleRemoveFilter}
        onClearSearch={() => {
          setSearchText("");
          setDisplaySearchText("");
        }}
      />

      {hasActivities ? (
        <TableErrorBoundary onRetry={handleRefresh}>
          <ActivityTable
            activities={items}
            onActivityPress={handleActivityPress}
            onActivityEdit={handleEditActivity}
            onActivityDelete={handleDeleteActivity}
            onRefresh={handleRefresh}
            onEndReached={canLoadMore ? loadMore : undefined}
            refreshing={refreshing || isRefetching}
            loading={false}
            loadingMore={isFetchingNextPage}
            showSelection={showSelection}
            selectedActivities={selectedItems}
            onSelectionChange={handleSelectionChange}
            sortConfigs={sortConfigs}
            onSort={handleSort}
            visibleColumnKeys={visibleColumnKeys}
            enableSwipeActions={true}
          />
        </TableErrorBoundary>
      ) : (
        <View style={styles.emptyContainer}>
          <EmptyState
            icon={searchText ? "search" : "package"}
            title={searchText ? "Nenhuma movimentação encontrada" : "Nenhuma movimentação cadastrada"}
            description={searchText ? `Nenhum resultado para "${searchText}"` : "Comece registrando a primeira movimentação de estoque"}
            actionLabel={searchText ? undefined : "Cadastrar Movimentação"}
            onAction={searchText ? undefined : handleCreateActivity}
          />
        </View>
      )}

      {/* Items count */}
      {hasActivities && <ItemsCountDisplay loadedCount={totalItemsLoaded} totalCount={totalCount} isLoading={isFetchingNextPage} />}

      {hasActivities && hasPrivilege(user, SECTOR_PRIVILEGES.ADMIN) && <FAB icon="plus" onPress={handleCreateActivity} />}
    </ThemedView>

    <SlideInPanel isOpen={isFilterPanelOpen} onClose={handleCloseFilters}>
      <ActivityFilterDrawerContent
        filters={filters}
        onFiltersChange={setFilters}
        onClear={handleClearFilters}
        activeFiltersCount={activeFiltersCount}
        onClose={handleCloseFilters}
      />
    </SlideInPanel>

    <SlideInPanel isOpen={isColumnPanelOpen} onClose={handleCloseColumns}>
      <ColumnVisibilitySlidePanel
        columns={allColumns}
        visibleColumns={new Set(visibleColumnKeys)}
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
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    opacity: 0.7,
  },
});
