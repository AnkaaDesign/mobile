import React, { useState, useCallback, useMemo } from "react";
import { View, ActivityIndicator, Pressable, Alert, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { IconFilter, IconList } from "@tabler/icons-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useCustomerMutations } from '../../../../hooks';
import { useCustomersInfiniteMobile } from "@/hooks";
import type { CustomerGetManyFormData } from '../../../../schemas';
import { ThemedView, ThemedText, FAB, ErrorScreen, EmptyState, ListActionButton, SearchBar } from "@/components/ui";
import { CustomerTable, createColumnDefinitions } from "@/components/administration/customer/list/customer-table";
import type { SortConfig } from "@/lib/sort-utils";
import { CustomerFilterTags } from "@/components/administration/customer/list/customer-filter-tags";
import { CustomerColumnVisibilityDrawer } from "@/components/administration/customer/list/customer-column-visibility-drawer";
import { TableErrorBoundary } from "@/components/ui/table-error-boundary";
import { ItemsCountDisplay } from "@/components/ui/items-count-display";
import { CustomerListSkeleton } from "@/components/administration/customer/skeleton/customer-list-skeleton";
import { useTheme } from "@/lib/theme";
import { routes } from '../../../../constants';
import { routeToMobilePath } from "@/lib/route-mapper";

// New hooks and components
import { useTableSort } from "@/hooks/useTableSort";
import { useColumnVisibility } from "@/hooks/useColumnVisibility";
import { BaseFilterDrawer, FilterSection, StringFilter, BooleanFilter, SelectFilter, MultiSelectFilter } from "@/components/common/filters";
import { BRAZILIAN_STATES, BRAZILIAN_STATE_NAMES } from '../../../../constants';
import { Input } from "@/components/ui/input";
import { Text } from "@/components/ui/text";

export default function CustomerListScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [displaySearchText, setDisplaySearchText] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCustomers, setSelectedCustomers] = useState<Set<string>>(new Set());
  const [showSelection, setShowSelection] = useState(false);
  const [showColumnManager, setShowColumnManager] = useState(false);

  // Filter state
  const [filters, setFilters] = useState<{
    states?: string[];
    city?: string;
    tags?: string[];
    hasCNPJ?: boolean;
    hasCPF?: boolean;
  }>({});

  const { sortConfigs, handleSort, buildOrderBy } = useTableSort(
    [{ columnKey: "fantasyName", direction: "asc", order: 0 }],
    3,
    false
  );

  const {
    visibleColumns,
    setVisibleColumns,
    isLoading: isColumnsLoading,
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
    refetch,
    isRefetching,
    loadMore,
    canLoadMore,
    isFetchingNextPage,
    totalItemsLoaded,
    totalCount,
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

  const handleApplyFilters = useCallback(() => {
    setShowFilters(false);
  }, []);

  const handleClearFilters = useCallback(() => {
    setFilters({});
    setSearchText("");
    setDisplaySearchText("");
    setSelectedCustomers(new Set());
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

  // State options for multi-select
  const stateOptions = useMemo(() =>
    BRAZILIAN_STATES.map((state) => ({
      value: state,
      label: BRAZILIAN_STATE_NAMES[state] || state,
    })),
    []
  );

  // Filter sections for BaseFilterDrawer
  const filterSections = useMemo(() => [
    {
      id: "location",
      title: "Localização",
      defaultOpen: true,
      badge: (filters.states?.length || 0) + (filters.city ? 1 : 0),
      content: (
        <>
          <View style={{ gap: 8 }}>
            <Text style={{ fontSize: 14, fontWeight: '600', color: colors.foreground }}>Estados</Text>
            <Input
              value={filters.states?.join(", ") || ""}
              onChangeText={(value) => setFilters(prev => ({
                ...prev,
                states: value ? value.split(",").map(s => s.trim()).filter(Boolean) : undefined
              }))}
              placeholder="Ex: SP, RJ, MG"
            />
          </View>
          <StringFilter
            label="Cidade"
            value={filters.city}
            onChange={(value) => setFilters(prev => ({ ...prev, city: value as string | undefined }))}
            placeholder="Digite o nome da cidade"
          />
        </>
      ),
    },
    {
      id: "documents",
      title: "Documentos",
      defaultOpen: false,
      badge: (filters.hasCNPJ ? 1 : 0) + (filters.hasCPF ? 1 : 0),
      content: (
        <>
          <BooleanFilter
            label="Possui CNPJ"
            description="Mostrar apenas clientes com CNPJ cadastrado"
            value={!!filters.hasCNPJ}
            onChange={(value) => setFilters(prev => ({ ...prev, hasCNPJ: value || undefined }))}
          />
          <BooleanFilter
            label="Possui CPF"
            description="Mostrar apenas clientes com CPF cadastrado"
            value={!!filters.hasCPF}
            onChange={(value) => setFilters(prev => ({ ...prev, hasCPF: value || undefined }))}
          />
        </>
      ),
    },
    {
      id: "tags",
      title: "Tags",
      defaultOpen: false,
      badge: filters.tags?.length || 0,
      content: (
        <View style={{ gap: 8 }}>
          <Text style={{ fontSize: 14, fontWeight: '600', color: colors.foreground }}>Tags</Text>
          <Input
            value={filters.tags?.join(", ") || ""}
            onChangeText={(value) => setFilters(prev => ({
              ...prev,
              tags: value ? value.split(",").map(t => t.trim()).filter(Boolean) : undefined
            }))}
            placeholder="Ex: importante, vip, premium"
          />
        </View>
      ),
    },
  ], [filters, colors, stateOptions]);

  // Only show skeleton on initial load, not on refetch/sort
  const isInitialLoad = isLoading && !isRefetching && customers.length === 0;

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
            refreshing={refreshing || isRefetching}
            loading={false}
            loadingMore={isFetchingNextPage}
            showSelection={showSelection}
            selectedCustomers={selectedCustomers}
            onSelectionChange={handleSelectionChange}
            sortConfigs={sortConfigs}
            onSort={(configs) => handleSort(configs[0]?.columnKey || "fantasyName")}
            visibleColumnKeys={visibleColumns}
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

      {/* New BaseFilterDrawer */}
      <BaseFilterDrawer
        open={showFilters}
        onOpenChange={setShowFilters}
        sections={filterSections}
        onApply={handleApplyFilters}
        onClear={handleClearFilters}
        activeFiltersCount={activeFiltersCount}
        title="Filtros de Clientes"
        description="Configure os filtros para refinar sua busca"
      />

      {/* Column Visibility Drawer */}
      <CustomerColumnVisibilityDrawer
        columns={allColumns}
        visibleColumns={new Set(visibleColumns)}
        onVisibilityChange={handleColumnsChange}
        open={showColumnManager}
        onOpenChange={setShowColumnManager}
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
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
