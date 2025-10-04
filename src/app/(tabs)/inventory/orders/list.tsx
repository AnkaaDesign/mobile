import React, { useState, useCallback } from "react";
import { View, Alert, Pressable , StyleSheet} from "react-native";
import { useRouter } from "expo-router";
import { IconPlus, IconFilter, IconList } from "@tabler/icons-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useOrderMutations } from '../../../../hooks';
import { useOrdersInfiniteMobile } from "@/hooks";
import type { OrderGetManyFormData } from '../../../../schemas';
import { ThemedView, ThemedText, FAB, ErrorScreen, EmptyState, SearchBar, Badge } from "@/components/ui";
import { OrderTable } from "@/components/inventory/order/list/order-table";
import type { SortConfig } from "@/components/inventory/order/list/order-table";
import { OrderFilterModal } from "@/components/inventory/order/list/order-filter-modal";
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

export default function OrderListScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [displaySearchText, setDisplaySearchText] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<Partial<OrderGetManyFormData>>({});
  const [sortConfigs, setSortConfigs] = useState<SortConfig[]>([{ columnKey: "createdAt", direction: "desc" }]);
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set());
  const [showSelection, setShowSelection] = useState(false);
  const [visibleColumnKeys, setVisibleColumnKeys] = useState<string[]>(["description", "supplier", "status", "totalPrice"]);

  // Check permissions
  const canCreate = user && hasPrivilege(user as any, SECTOR_PRIVILEGES.WAREHOUSE);
  const canEdit = user && hasPrivilege(user as any, SECTOR_PRIVILEGES.WAREHOUSE);
  const canDelete = user && hasPrivilege(user as any, SECTOR_PRIVILEGES.ADMIN);

  // Build query parameters with sorting
  const buildOrderBy = () => {
    if (!sortConfigs || sortConfigs.length === 0) return { createdAt: "desc" };

    // If only one sort, return as object
    if (sortConfigs.length === 1) {
      const config = sortConfigs[0 as keyof typeof sortConfigs];
      switch (config.columnKey) {
        case "description":
          return { description: config.direction };
        case "supplier":
          return { supplier: { name: config.direction } };
        case "status":
          return { status: config.direction };
        case "totalPrice":
          return { totalPrice: config.direction };
        case "createdAt":
          return { createdAt: config.direction };
        case "expectedDelivery":
          return { expectedDelivery: config.direction };
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
          return { supplier: { name: config.direction } };
        case "status":
          return { status: config.direction };
        case "totalPrice":
          return { totalPrice: config.direction };
        case "createdAt":
          return { createdAt: config.direction };
        case "expectedDelivery":
          return { expectedDelivery: config.direction };
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
      supplier: { select: { id: true, name: true } },
      _count: { select: { items: true } },
    },
  };

  const {
    items: orders,
    isLoading,
    error,
    refetch,
    isRefetching,
    loadMore,
    canLoadMore,
    isFetchingNextPage,
    totalItemsLoaded,
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
      const order = orders.find((o) => o.id === orderId);
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
    setShowFilters(false);
  }, []);

  const handleClearFilters = useCallback(() => {
    setFilters({});
    setSearchText("");
    setDisplaySearchText("");
    setSelectedOrders(new Set());
    setShowSelection(false);
  }, []);

  // Count active filters
  const activeFiltersCount = Object.entries(filters).filter(
    ([key, value]) => value !== undefined && value !== null && (Array.isArray(value) ? value.length > 0 : true),
  ).length;

  if (isLoading && !isRefetching) {
    return <OrderListSkeleton />;
  }

  if (error) {
    return (
      <ThemedView style={styles.container}>
        <ErrorScreen message="Erro ao carregar pedidos" detail={error.message} onRetry={handleRefresh} />
      </ThemedView>
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
          <Pressable
            style={({ pressed }) => [
              styles.actionButton,
              {
                backgroundColor: colors.card,
                borderWidth: 1,
                borderColor: colors.border,
              },
              pressed && styles.actionButtonPressed,
            ]}
            onPress={() => setShowFilters(true)}
          >
            <IconFilter size={24} color={colors.foreground} />
            {activeFiltersCount > 0 && (
              <Badge style={styles.actionBadge} variant="destructive" size="sm">
                <ThemedText style={StyleSheet.flatten([styles.actionBadgeText, { color: "white" }])}>{activeFiltersCount}</ThemedText>
              </Badge>
            )}
          </Pressable>
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
      {hasOrders && <ItemsCountDisplay loadedCount={totalItemsLoaded} totalCount={undefined} isLoading={isFetchingNextPage} />}

      {hasOrders && canCreate && <FAB icon="plus" onPress={handleCreateOrder} />}

      {/* Filter Modal */}
      <OrderFilterModal
        visible={showFilters}
        onClose={() => setShowFilters(false)}
        onApply={handleApplyFilters}
        currentFilters={filters}
      />
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
  actionButton: {
    height: 48,
    width: 48,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  actionBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 3,
  },
  actionBadgeText: {
    fontSize: 9,
    fontWeight: "600",
  },
  actionButtonPressed: {
    opacity: 0.8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});