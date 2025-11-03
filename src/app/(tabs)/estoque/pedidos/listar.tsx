import { useState, useCallback, useMemo } from "react";
import { View, Alert, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { IconFilter, IconList } from "@tabler/icons-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useOrderMutations } from '../../../../hooks';
import { useOrdersInfiniteMobile } from "@/hooks";
import type { OrderGetManyFormData } from '../../../../schemas';
import { ThemedView, FAB, ErrorScreen, EmptyState, SearchBar, ListActionButton } from "@/components/ui";
import { OrderTable, createColumnDefinitions } from "@/components/inventory/order/list/order-table";
import type { SortConfig } from "@/components/inventory/order/list/order-table";

import { OrderFilterTags } from "@/components/inventory/order/list/order-filter-tags";

import { TableErrorBoundary } from "@/components/ui/table-error-boundary";
import { ItemsCountDisplay } from "@/components/ui/items-count-display";
import { OrderListSkeleton } from "@/components/inventory/order/skeleton/order-list-skeleton";
import { useTheme } from "@/lib/theme";
import { routes } from '../../../../constants';
import { routeToMobilePath } from "@/lib/route-mapper";
import { useAuth } from "@/contexts/auth-context";
import { hasPrivilege } from '../../../../utils';
import { SECTOR_PRIVILEGES } from '../../../../constants';

import { UtilityDrawerWrapper } from "@/components/ui/utility-drawer";
import { useUtilityDrawer } from "@/contexts/utility-drawer-context";
import { GenericColumnDrawerContent } from "@/components/ui/generic-column-drawer-content";
import { OrderFilterDrawerContent } from "@/components/inventory/order/list/order-filter-drawer-content";

export default function OrderListScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { openFilterDrawer, openColumnDrawer } = useUtilityDrawer();
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [displaySearchText, setDisplaySearchText] = useState("");
  const [filters, setFilters] = useState<Partial<OrderGetManyFormData>>({});
  const [sortConfigs, setSortConfigs] = useState<SortConfig[]>([{ columnKey: "status", direction: "asc" }]);
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set());
  const [showSelection, setShowSelection] = useState(false);
  const [visibleColumnKeys, setVisibleColumnKeys] = useState<string[]>(["description", "status", "itemsCount"]);

  // Check permissions
  const canCreate = user && hasPrivilege(user as any, SECTOR_PRIVILEGES.WAREHOUSE);
  const canEdit = user && hasPrivilege(user as any, SECTOR_PRIVILEGES.WAREHOUSE);
  const canDelete = user && hasPrivilege(user as any, SECTOR_PRIVILEGES.ADMIN);

  // Build query parameters with sorting
  const buildOrderBy = () => {
    if (!sortConfigs || sortConfigs.length === 0) return { createdAt: "desc" };

    // If only one sort, return as object
    if (sortConfigs.length === 1) {
      const config = sortConfigs[0];
      switch (config.columnKey) {
        case "description":
          return { description: config.direction };
        case "supplier":
          return { supplier: { fantasyName: config.direction } };
        case "status":
          return { status: config.direction };
        case "totalPrice":
          return { totalPrice: config.direction };
        case "createdAt":
          return { createdAt: config.direction };
        case "forecast":
          return { forecast: config.direction };
        default:
          return { createdAt: "desc" };
      }
    }

    // Multiple sorts, return as array
    return sortConfigs.map((config) => {
      switch (config.columnKey) {
        case "description":
          return { description: config.direction };
        case "supplier":
          return { supplier: { fantasyName: config.direction } };
        case "status":
          return { status: config.direction };
        case "totalPrice":
          return { totalPrice: config.direction };
        case "createdAt":
          return { createdAt: config.direction };
        case "forecast":
          return { forecast: config.direction };
        default:
          return { createdAt: "desc" };
      }
    });
  };

  const queryParams = {
    orderBy: buildOrderBy(),
    ...(searchText ? { searchingFor: searchText } : {}),
    ...filters,
    include: {
      supplier: { select: { id: true, fantasyName: true } },
      _count: { select: { items: true } },
    },
  };

  const {
    items: orders,
    isLoading,
    error,
    
    isRefetching,
    loadMore,
    canLoadMore,
    isFetchingNextPage,
    totalItemsLoaded,
    totalCount,
    refresh
  } = useOrdersInfiniteMobile(queryParams);

  const { delete: deleteOrder } = useOrderMutations();

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refresh();
    } finally {
      setRefreshing(false);
    }
  }, [refresh]);

  const handleCreateOrder = () => {
    router.push(routeToMobilePath(routes.inventory.orders.create) as any);
  };

  const handleOrderPress = (orderId: string) => {
    router.push(routeToMobilePath(routes.inventory.orders.details(orderId)) as any);
  };

  const handleEditOrder = (orderId: string) => {
    if (!canEdit) {
      Alert.alert("Sem permissão", "Você não tem permissão para editar pedidos");
      return;
    }
    router.push(routeToMobilePath(routes.inventory.orders.edit(orderId)) as any);
  };

  const handleDeleteOrder = useCallback(
    async (orderId: string) => {
      if (!canDelete) {
        Alert.alert("Sem permissão", "Você não tem permissão para excluir pedidos");
        return;
      }

      Alert.alert(
        "Confirmar Exclusão",
        "Tem certeza que deseja excluir este pedido?",
        [
          { text: "Cancelar", style: "cancel" },
          {
            text: "Excluir",
            style: "destructive",
            onPress: async () => {
              try {
                await deleteOrder(orderId);
                // Clear selection if the deleted order was selected
                if (selectedOrders.has(orderId)) {
                  const newSelection = new Set(selectedOrders);
                  newSelection.delete(orderId);
                  setSelectedOrders(newSelection);
                }
              } catch (error) {
                Alert.alert("Erro", "Não foi possível excluir o pedido. Tente novamente.");
              }
            },
          },
        ],
      );
    },
    [deleteOrder, selectedOrders, canDelete],
  );

  const handleDuplicateOrder = useCallback(
    (orderId: string) => {
      const order = orders.find((o: any /* TODO: Add proper type */) => o.id === orderId);
      if (order) {
        // Navigate to create page with pre-filled data
        router.push({
          pathname: routeToMobilePath(routes.inventory.orders.create) as any,
          params: { duplicateFrom: orderId },
        });
      }
    },
    [orders, router],
  );

  const handleSort = useCallback((configs: SortConfig[]) => {
    setSortConfigs(configs);
  }, []);

  const handleSelectionChange = useCallback((newSelection: Set<string>) => {
    setSelectedOrders(newSelection);
  }, []);

  const handleSearch = useCallback((text: string) => {
    setSearchText(text);
  }, []);

  const handleDisplaySearchChange = useCallback((text: string) => {
    setDisplaySearchText(text);
  }, []);

  const handleApplyFilters = useCallback((newFilters: Partial<OrderGetManyFormData>) => {
    setFilters(newFilters);
  }, []);

  const handleClearFilters = useCallback(() => {
    setFilters({});
    setSearchText("");
    setDisplaySearchText("");
    setSelectedOrders(new Set());
    setShowSelection(false);
  }, []);

  // Get all column definitions
  const allColumns = useMemo(() => createColumnDefinitions(), []);

  // Convert visibleColumnKeys array to Set for GenericColumnDrawerContent
  const visibleColumns = useMemo(() => new Set(visibleColumnKeys), [visibleColumnKeys]);

  // Handle columns change
  const handleColumnsChange = useCallback((newColumns: Set<string>) => {
    setVisibleColumnKeys(Array.from(newColumns));
  }, []);

  // Count active filters
  const activeFiltersCount = Object.entries(filters).filter(
    ([_key, value]) => value !== undefined && value !== null && (Array.isArray(value) ? value.length > 0 : true),
  ).length;

  const handleOpenFilters = useCallback(() => {
    openFilterDrawer(() => (
      <OrderFilterDrawerContent
        filters={filters}
        onFiltersChange={setFilters}
        onClear={handleClearFilters}
        activeFiltersCount={activeFiltersCount}
      />
    ));
  }, [openFilterDrawer, filters, handleClearFilters, activeFiltersCount]);

  const handleOpenColumns = useCallback(() => {
    openColumnDrawer(() => (
      <GenericColumnDrawerContent
        columns={allColumns}
        visibleColumns={visibleColumns}
        onVisibilityChange={handleColumnsChange}
      />
    ));
  }, [openColumnDrawer, allColumns, visibleColumns, handleColumnsChange]);

  if (isLoading && !isRefetching) {
    return <OrderListSkeleton />;
  }

  if (error) {
    return (
    <UtilityDrawerWrapper>

          <ThemedView style={styles.container}>
            <ErrorScreen message="Erro ao carregar pedidos" detail={error.message} onRetry={handleRefresh} />
          </ThemedView>
    
    </UtilityDrawerWrapper>
  );
  }

  const hasOrders = Array.isArray(orders) && orders.length > 0;

  return (
    <ThemedView style={[styles.container, { backgroundColor: colors.background, paddingBottom: insets.bottom }]}>
      {/* Search, Filter and Sort */}
      <View style={[styles.searchContainer]}>
        <SearchBar
          value={displaySearchText}
          onChangeText={handleDisplaySearchChange}
          onSearch={handleSearch}
          placeholder="Buscar pedidos..."
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
      <OrderFilterTags
        filters={filters}
        searchText={searchText}
        onFilterChange={handleApplyFilters}
        onSearchChange={(text) => {
          setSearchText(text);
          setDisplaySearchText(text);
        }}
        onClearAll={handleClearFilters}
      />

      {hasOrders ? (
        <TableErrorBoundary onRetry={handleRefresh}>
          <OrderTable
            orders={orders}
            onOrderPress={handleOrderPress}
            onOrderEdit={handleEditOrder}
            onOrderDelete={handleDeleteOrder}
            onOrderDuplicate={handleDuplicateOrder}
            onRefresh={handleRefresh}
            onEndReached={canLoadMore ? loadMore : undefined}
            refreshing={refreshing}
            loading={isLoading && !isRefetching}
            loadingMore={isFetchingNextPage}
            showSelection={showSelection}
            selectedOrders={selectedOrders}
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
            title={searchText ? "Nenhum pedido encontrado" : "Nenhum pedido cadastrado"}
            description={searchText ? `Nenhum resultado para "${searchText}"` : "Comece criando seu primeiro pedido"}
            actionLabel={searchText || !canCreate ? undefined : "Criar Pedido"}
            onAction={searchText || !canCreate ? undefined : handleCreateOrder}
          />
        </View>
      )}

      {/* Items count */}
      {hasOrders && <ItemsCountDisplay loadedCount={totalItemsLoaded} totalCount={totalCount} isLoading={isFetchingNextPage} />}

      {hasOrders && canCreate && <FAB icon="plus" onPress={handleCreateOrder} />}
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