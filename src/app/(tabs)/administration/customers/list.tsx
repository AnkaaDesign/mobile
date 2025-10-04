import React, { useState, useCallback } from "react";
import { View, ActivityIndicator, Pressable, Alert, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { IconFilter, IconList } from "@tabler/icons-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useCustomerMutations } from '../../../../hooks';
import { useCustomersInfiniteMobile } from "@/hooks";
import type { CustomerGetManyFormData } from '../../../../schemas';
import { ThemedView, ThemedText, FAB, ErrorScreen, EmptyState, SearchBar, Badge } from "@/components/ui";
import { CustomerTable } from "@/components/administration/customer/list/customer-table";
import type { SortConfig } from "@/components/administration/customer/list/customer-table";
import { CustomerFilterModal } from "@/components/administration/customer/list/customer-filter-modal";
import { CustomerFilterTags } from "@/components/administration/customer/list/customer-filter-tags";
import { TableErrorBoundary } from "@/components/ui/table-error-boundary";
import { ItemsCountDisplay } from "@/components/ui/items-count-display";
import { CustomerListSkeleton } from "@/components/administration/customer/skeleton/customer-list-skeleton";
import { useTheme } from "@/lib/theme";
import { routes } from '../../../../constants';
import { routeToMobilePath } from "@/lib/route-mapper";

export default function CustomerListScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [displaySearchText, setDisplaySearchText] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<Partial<CustomerGetManyFormData>>({});
  const [sortConfigs, setSortConfigs] = useState<SortConfig[]>([{ columnKey: "fantasyName", direction: "asc" }]);
  const [selectedCustomers, setSelectedCustomers] = useState<Set<string>>(new Set());
  const [showSelection, setShowSelection] = useState(false);
  const [visibleColumnKeys, setVisibleColumnKeys] = useState<string[]>([
    "fantasyName",
    "document",
    "email",
    "phones",
    "city",
    "taskCount",
  ]);

  // Build query parameters with sorting
  const buildOrderBy = () => {
    if (!sortConfigs || sortConfigs.length === 0) return { fantasyName: "asc" };

    // If only one sort, return as object
    if (sortConfigs.length === 1) {
      const config = sortConfigs[0];
      switch (config.columnKey) {
        case "fantasyName":
          return { fantasyName: config.direction };
        case "corporateName":
          return { corporateName: config.direction };
        case "email":
          return { email: config.direction };
        case "city":
          return { city: config.direction };
        case "createdAt":
          return { createdAt: config.direction };
        case "updatedAt":
          return { updatedAt: config.direction };
        default:
          return { fantasyName: "asc" };
      }
    }

    // Multiple sorts, return as array
    return sortConfigs.map((config) => {
      switch (config.columnKey) {
        case "fantasyName":
          return { fantasyName: config.direction };
        case "corporateName":
          return { corporateName: config.direction };
        case "email":
          return { email: config.direction };
        case "city":
          return { city: config.direction };
        case "createdAt":
          return { createdAt: config.direction };
        case "updatedAt":
          return { updatedAt: config.direction };
        default:
          return { fantasyName: "asc" };
      }
    });
  };

  const queryParams = {
    orderBy: buildOrderBy(),
    ...(searchText ? { searchingFor: searchText } : {}),
    ...filters,
    include: {
      logo: true,
      _count: {
        tasks: true,
        serviceOrders: true,
        services: true,
      },
    },
  };

  const {
    customers,
    isLoading,
    error,
    refetch,
    isRefetching,
    loadMore,
    canLoadMore,
    isFetchingNextPage,
    totalItemsLoaded,
    refresh,
  } = useCustomersInfiniteMobile(queryParams);
  const { delete: deleteCustomer } = useCustomerMutations();

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refresh();
    } finally {
      setRefreshing(false);
    }
  }, [refresh]);

  const handleCreateCustomer = () => {
    router.push(routeToMobilePath(routes.administration.customers.create) as any);
  };

  const handleCustomerPress = (customerId: string) => {
    router.push(routeToMobilePath(routes.administration.customers.details(customerId)) as any);
  };

  const handleEditCustomer = (customerId: string) => {
    router.push(routeToMobilePath(routes.administration.customers.edit(customerId)) as any);
  };

  const handleDeleteCustomer = useCallback(
    async (customerId: string) => {
      try {
        await deleteCustomer(customerId);
        // Clear selection if the deleted customer was selected
        if (selectedCustomers.has(customerId)) {
          const newSelection = new Set(selectedCustomers);
          newSelection.delete(customerId);
          setSelectedCustomers(newSelection);
        }
      } catch (error) {
        Alert.alert("Erro", "Não foi possível excluir o cliente. Tente novamente.");
      }
    },
    [deleteCustomer, selectedCustomers],
  );

  const handleSort = useCallback((configs: SortConfig[]) => {
    setSortConfigs(configs);
  }, []);

  const handleSelectionChange = useCallback((newSelection: Set<string>) => {
    setSelectedCustomers(newSelection);
  }, []);

  const handleSearch = useCallback((text: string) => {
    setSearchText(text);
  }, []);

  const handleDisplaySearchChange = useCallback((text: string) => {
    setDisplaySearchText(text);
  }, []);

  const handleApplyFilters = useCallback((newFilters: Partial<CustomerGetManyFormData>) => {
    setFilters(newFilters);
    setShowFilters(false);
  }, []);

  const handleClearFilters = useCallback(() => {
    setFilters({});
    setSearchText("");
    setDisplaySearchText("");
    setSelectedCustomers(new Set());
    setShowSelection(false);
  }, []);

  // Count active filters
  const activeFiltersCount = Object.entries(filters).filter(
    ([key, value]) => value !== undefined && value !== null && (Array.isArray(value) ? value.length > 0 : true),
  ).length;

  if (isLoading && !isRefetching) {
    return <CustomerListSkeleton />;
  }

  if (error) {
    return (
      <ThemedView style={styles.container}>
        <ErrorScreen message="Erro ao carregar clientes" detail={error.message} onRetry={handleRefresh} />
      </ThemedView>
    );
  }

  const hasCustomers = Array.isArray(customers) && customers.length > 0;

  return (
    <ThemedView style={[styles.container, { backgroundColor: colors.background, paddingBottom: insets.bottom }]}>
      {/* Search and Filter */}
      <View style={[styles.searchContainer]}>
        <SearchBar
          value={displaySearchText}
          onChangeText={handleDisplaySearchChange}
          onSearch={handleSearch}
          placeholder="Buscar clientes..."
          style={styles.searchBar}
          debounceMs={300}
        />
        <View style={styles.buttonContainer}>
          <Pressable
            style={({ pressed }) => [
              styles.actionButton,
              { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
              pressed && styles.actionButtonPressed,
            ]}
            onPress={() => setShowFilters(true)}
          >
            <IconFilter size={24} color={colors.foreground} />
            {activeFiltersCount > 0 && (
              <Badge style={styles.actionBadge} variant="destructive" size="sm">
                <ThemedText style={StyleSheet.flatten([styles.actionBadgeText, { color: "white" }])}>
                  {activeFiltersCount}
                </ThemedText>
              </Badge>
            )}
          </Pressable>
        </View>
      </View>

      {/* Individual filter tags */}
      <CustomerFilterTags
        filters={filters}
        searchText={searchText}
        onFilterChange={handleApplyFilters}
        onSearchChange={(text) => {
          setSearchText(text);
          setDisplaySearchText(text);
        }}
        onClearAll={handleClearFilters}
      />

      {hasCustomers ? (
        <TableErrorBoundary onRetry={handleRefresh}>
          <CustomerTable
            customers={customers}
            onCustomerPress={handleCustomerPress}
            onCustomerEdit={handleEditCustomer}
            onCustomerDelete={handleDeleteCustomer}
            onRefresh={handleRefresh}
            onEndReached={canLoadMore ? loadMore : undefined}
            refreshing={refreshing}
            loading={isLoading && !isRefetching}
            loadingMore={isFetchingNextPage}
            showSelection={showSelection}
            selectedCustomers={selectedCustomers}
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
            icon={searchText ? "search" : "users"}
            title={searchText ? "Nenhum cliente encontrado" : "Nenhum cliente cadastrado"}
            description={
              searchText ? `Nenhum resultado para "${searchText}"` : "Comece cadastrando o primeiro cliente"
            }
            actionLabel={searchText ? undefined : "Cadastrar Cliente"}
            onAction={searchText ? undefined : handleCreateCustomer}
          />
        </View>
      )}

      {/* Items count */}
      {hasCustomers && <ItemsCountDisplay loadedCount={totalItemsLoaded} totalCount={undefined} isLoading={isFetchingNextPage} />}

      {hasCustomers && <FAB icon="plus" onPress={handleCreateCustomer} />}

      {/* Filter Modal */}
      <CustomerFilterModal
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
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  actionButtonPressed: {
    opacity: 0.8,
  },
});
