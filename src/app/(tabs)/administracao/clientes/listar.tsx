import React, { useState, useCallback, useMemo } from "react";
import { View, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { IconFilter, IconList } from "@tabler/icons-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useCustomerMutations } from '../../../../hooks';
import { useCustomersInfiniteMobile } from "@/hooks";

import { ThemedView, FAB, ErrorScreen, EmptyState, ListActionButton, SearchBar } from "@/components/ui";
import { CustomerTable, createColumnDefinitions } from "@/components/administration/customer/list/customer-table";

import { CustomerFilterTags } from "@/components/administration/customer/list/customer-filter-tags";
import { TableErrorBoundary } from "@/components/ui/table-error-boundary";
import { ItemsCountDisplay } from "@/components/ui/items-count-display";
import { CustomerListSkeleton } from "@/components/administration/customer/skeleton/customer-list-skeleton";
import { useTheme } from "@/lib/theme";
import { routes } from '../../../../constants';
import { routeToMobilePath } from "@/lib/route-mapper";
import { UtilityDrawerWrapper } from "@/components/ui/utility-drawer";
import { useUtilityDrawer } from "@/contexts/utility-drawer-context";

// New hooks and components
import { useTableSort } from "@/hooks/useTableSort";
import { useColumnVisibility } from "@/hooks/useColumnVisibility";
import { StringFilter, BooleanFilter } from "@/components/common/filters";
import { BRAZILIAN_STATES, BRAZILIAN_STATE_NAMES } from '../../../../constants';
import { Input } from "@/components/ui/input";
import { Text } from "@/components/ui/text";

// Import drawer content components
import { CustomerFilterDrawerContent } from "@/components/administration/customer/list/customer-filter-drawer-content";
import { CustomerColumnDrawerContent } from "@/components/administration/customer/list/customer-column-drawer-content";

export default function CustomerListScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { openFilterDrawer, openColumnDrawer } = useUtilityDrawer();
  const [refreshing, setRefreshing] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [displaySearchText, setDisplaySearchText] = useState("");
  const [selectedCustomers, setSelectedCustomers] = useState<Set<string>>(new Set());
  const [showSelection, setShowSelection] = useState(false);
  const searchInputRef = React.useRef<any>(null);

  // Filter state
  const [filters, setFilters] = useState<{
    states?: string[];
    city?: string;
    tags?: string[];
    hasCNPJ?: boolean;
    hasCPF?: boolean;
    hasTasks?: boolean;
    taskCount?: { min?: number; max?: number };
    createdAt?: { gte?: Date; lte?: Date };
  }>({});

  const { sortConfigs, handleSort, buildOrderBy } = useTableSort(
    [{ columnKey: "fantasyName", direction: "asc", order: 0 }],
    1, // Single column sort only
    false
  );

  const {
    visibleColumns,
    setVisibleColumns,
  } = useColumnVisibility(
    "customers",
    ["fantasyName", "document"],
    ["fantasyName", "corporateName", "document", "email", "city", "state", "createdAt", "updatedAt"]
  );

  // Build API query
  const buildWhereClause = useCallback(() => {
    const where: any = {};

    if (filters.states?.length) {
      where.state = { in: filters.states };
    }

    if (filters.city) {
      where.city = { contains: filters.city, mode: "insensitive" };
    }

    if (filters.tags?.length) {
      where.tags = { hasSome: filters.tags };
    }

    if (filters.hasCNPJ) {
      where.cnpj = { not: null };
    }

    if (filters.hasCPF) {
      where.cpf = { not: null };
    }

    if (filters.hasTasks) {
      where.tasks = { some: {} };
    }

    if (filters.taskCount?.min !== undefined || filters.taskCount?.max !== undefined) {
      where._count = { tasks: {} };
      if (filters.taskCount.min !== undefined) {
        where._count.tasks.gte = filters.taskCount.min;
      }
      if (filters.taskCount.max !== undefined) {
        where._count.tasks.lte = filters.taskCount.max;
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

    return Object.keys(where).length > 0 ? where : undefined;
  }, [filters]);

  const queryParams = useMemo(() => ({
    orderBy: buildOrderBy(
      {
        fantasyName: "fantasyName",
        corporateName: "corporateName",
        email: "email",
        city: "city",
        createdAt: "createdAt",
        updatedAt: "updatedAt",
      },
      { fantasyName: "asc" }
    ),
    ...(searchText ? { searchingFor: searchText } : {}),
    ...(buildWhereClause() ? { where: buildWhereClause() } : {}),
    include: {
      logo: true,
      economicActivity: true,
      _count: {
        tasks: true,
        serviceOrders: true,
        services: true,
      },
    },
  }), [searchText, buildWhereClause, buildOrderBy]);

  const {
    customers,
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
      await deleteCustomer(customerId);
      if (selectedCustomers.has(customerId)) {
        const newSelection = new Set(selectedCustomers);
        newSelection.delete(customerId);
        setSelectedCustomers(newSelection);
      }
    },
    [deleteCustomer, selectedCustomers],
  );

  const handleSelectionChange = useCallback((newSelection: Set<string>) => {
    setSelectedCustomers(newSelection);
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
    setSelectedCustomers(new Set());
    setShowSelection(false);
  }, []);

  const handleColumnsChange = useCallback((newColumns: Set<string>) => {
    setVisibleColumns(newColumns);
  }, [setVisibleColumns]);

  const handleOpenFilters = useCallback(() => {
    openFilterDrawer(() => (
      <CustomerFilterDrawerContent
        filters={filters}
        onFiltersChange={setFilters}
        onClear={handleClearFilters}
        activeFiltersCount={activeFiltersCount}
      />
    ));
  }, [openFilterDrawer, filters, handleClearFilters, activeFiltersCount]);

  const handleOpenColumns = useCallback(() => {
    openColumnDrawer(() => (
      <CustomerColumnDrawerContent
        columns={allColumns}
        visibleColumns={visibleColumns}
        onVisibilityChange={handleColumnsChange}
      />
    ));
  }, [openColumnDrawer, allColumns, visibleColumns, handleColumnsChange]);

  // Get all column definitions
  const allColumns = useMemo(() => createColumnDefinitions(), []);

  // Count active filters
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.states?.length) count++;
    if (filters.city) count++;
    if (filters.tags?.length) count++;
    if (filters.hasCNPJ) count++;
    if (filters.hasCPF) count++;
    if (filters.hasTasks) count++;
    if (filters.taskCount?.min !== undefined || filters.taskCount?.max !== undefined) count++;
    if (filters.createdAt?.gte || filters.createdAt?.lte) count++;
    return count;
  }, [filters]);

  // Only show skeleton on initial load, not on refetch/sort/search
  // This prevents the entire page from remounting during search
  const isInitialLoad = isLoading && customers.length === 0;

  if (isInitialLoad) {
    return <CustomerListSkeleton />;
  }

  if (error && customers.length === 0) {
    return (
      <ThemedView style={styles.container}>
        <ErrorScreen message="Erro ao carregar clientes" detail={error.message} onRetry={handleRefresh} />
      </ThemedView>
    );
  }

  const hasCustomers = Array.isArray(customers) && customers.length > 0;

  return (
    <UtilityDrawerWrapper>
      <ThemedView style={[styles.container, { backgroundColor: colors.background, paddingBottom: insets.bottom }]}>
      {/* Search and Filter */}
      <View style={[styles.searchContainer]}>
        <SearchBar
          ref={searchInputRef}
          value={displaySearchText}
          onChangeText={handleDisplaySearchChange}
          onSearch={handleSearch}
          placeholder="Buscar clientes..."
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
      <CustomerFilterTags
        filters={{ where: buildWhereClause() }}
        searchText={searchText}
        onFilterChange={(newFilters) => {
          const where = newFilters.where as any;
          if (where) {
            const extracted: typeof filters = {};
            if (where.state?.in) extracted.states = where.state.in;
            if (where.city?.contains) extracted.city = where.city.contains;
            if (where.tags?.hasSome) extracted.tags = where.tags.hasSome;
            if (where.cnpj?.not === null) extracted.hasCNPJ = true;
            if (where.cpf?.not === null) extracted.hasCPF = true;
            if (where.tasks?.some) extracted.hasTasks = true;
            if (where._count?.tasks) {
              extracted.taskCount = {};
              if (where._count.tasks.gte !== undefined) extracted.taskCount.min = where._count.tasks.gte;
              if (where._count.tasks.lte !== undefined) extracted.taskCount.max = where._count.tasks.lte;
            }
            if (where.createdAt) {
              extracted.createdAt = {};
              if (where.createdAt.gte) extracted.createdAt.gte = where.createdAt.gte;
              if (where.createdAt.lte) extracted.createdAt.lte = where.createdAt.lte;
            }
            setFilters(extracted);
          } else {
            setFilters({});
          }
        }}
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
            onPrefetch={shouldPrefetch ? prefetchNext : undefined}
            refreshing={refreshing || isRefetching}
            loading={false}
            loadingMore={isFetchingNextPage}
            showSelection={showSelection}
            selectedCustomers={selectedCustomers}
            onSelectionChange={handleSelectionChange}
            sortConfigs={sortConfigs}
            onSort={(configs) => {
              // Handle empty array (clear sort)
              if (configs.length === 0) {
                handleSort("fantasyName"); // Reset to default
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
      {hasCustomers && <ItemsCountDisplay loadedCount={totalItemsLoaded} totalCount={totalCount} isLoading={isFetchingNextPage} />}

      {hasCustomers && <FAB icon="plus" onPress={handleCreateCustomer} />}
    </ThemedView>
    </UtilityDrawerWrapper>
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
