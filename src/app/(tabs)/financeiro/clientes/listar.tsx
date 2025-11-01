import { useState, useCallback, useMemo } from "react";
import { View, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { IconFilter, IconList } from "@tabler/icons-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useCustomerMutations, useCustomersInfiniteMobile } from '@/hooks';
import type { Customer } from '@/types';
import { ThemedView, FAB, ErrorScreen, EmptyState, ListActionButton, SearchBar } from "@/components/ui";
import { CustomerTable, createColumnDefinitions } from "@/components/administration/customer/list/customer-table";
import { CustomerFilterTags } from "@/components/administration/customer/list/customer-filter-tags";
import { CustomerColumnVisibilityDrawer } from "@/components/administration/customer/list/customer-column-visibility-drawer";
import { TableErrorBoundary } from "@/components/ui/table-error-boundary";
import { ItemsCountDisplay } from "@/components/ui/items-count-display";
import { CustomerListSkeleton } from "@/components/administration/customer/skeleton/customer-list-skeleton";
import { useTheme } from "@/lib/theme";
import { routes } from '@/constants';
import { routeToMobilePath } from "@/lib/route-mapper";
import { useTableSort } from "@/hooks/useTableSort";
import { useColumnVisibility } from "@/hooks/useColumnVisibility";
import { BaseFilterDrawer, BooleanFilter } from "@/components/common/filters";

/**
 * Financial Customer List Screen
 *
 * This screen shows customers from a financial perspective,
 * focusing on invoices, payments, and financial metrics.
 * Reuses customer components but with financial-specific context.
 */
export default function FinancialCustomerListScreen() {
  const router = useRouter();
  const { colors } = useTheme();
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
    hasCNPJ?: boolean;
    hasCPF?: boolean;
    hasInvoices?: boolean;
  }>({});

  const { sortConfigs, handleSort, buildOrderBy } = useTableSort(
    [{ columnKey: "fantasyName", direction: "asc", order: 0 }],
    3,
    false
  );

  const {
    visibleColumns,
    setVisibleColumns,
  } = useColumnVisibility(
    "financial-customers",
    ["fantasyName", "document", "email"],
    ["fantasyName", "corporateName", "document", "email", "city", "state", "createdAt"]
  );

  // Build API query - financial focused
  const buildWhereClause = useCallback(() => {
    const where: any = {};

    if (filters.hasCNPJ) {
      where.cnpj = { not: null };
    }

    if (filters.hasCPF) {
      where.cpf = { not: null };
    }

    // Financial-specific: only show customers with tasks/invoices
    if (filters.hasInvoices) {
      where.tasks = { some: { invoices: { some: {} } } };
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
      },
      { fantasyName: "asc" }
    ),
    ...(searchText ? { searchingFor: searchText } : {}),
    ...(buildWhereClause() ? { where: buildWhereClause() } : {}),
    include: {
      logo: true,
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
    router.push(routeToMobilePath(routes.financial.customers.details(customerId)) as any);
  };

  const handleEditCustomer = (customerId: string) => {
    router.push(routeToMobilePath(routes.financial.customers.edit(customerId)) as any);
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
    setVisibleColumns(newColumns);
  }, [setVisibleColumns]);

  // Get all column definitions
  const allColumns = useMemo(() => createColumnDefinitions(), []);

  // Count active filters
  const activeFiltersCount = Object.values(filters).filter(
    (value) => value === true
  ).length;

  // Filter sections for BaseFilterDrawer
  const filterSections = useMemo(() => [
    {
      id: "documents",
      title: "Documentos Fiscais",
      defaultOpen: true,
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
      id: "financial",
      title: "Dados Financeiros",
      defaultOpen: true,
      badge: filters.hasInvoices ? 1 : 0,
      content: (
        <BooleanFilter
          label="Possui Notas Fiscais"
          description="Mostrar apenas clientes com notas fiscais emitidas"
          value={!!filters.hasInvoices}
          onChange={(value) => setFilters(prev => ({ ...prev, hasInvoices: value || undefined }))}
        />
      ),
    },
  ], [filters, colors]);

  // Only show skeleton on initial load
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
      <View style={styles.searchContainer}>
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
            badgeCount={visibleColumns.size}
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
            if (where.cnpj?.not === null) extracted.hasCNPJ = true;
            if (where.cpf?.not === null) extracted.hasCPF = true;
            if (where.tasks?.some) extracted.hasInvoices = true;
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
            customers={customers as Customer[]}
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
            visibleColumnKeys={Array.from(visibleColumns)}
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

      {/* Filter Drawer */}
      <BaseFilterDrawer
        open={showFilters}
        onOpenChange={setShowFilters}
        sections={filterSections}
        onApply={handleApplyFilters}
        onClear={handleClearFilters}
        activeFiltersCount={activeFiltersCount}
        title="Filtros Financeiros"
        description="Configure os filtros para refinar sua busca"
      />

      {/* Column Visibility Drawer */}
      <CustomerColumnVisibilityDrawer
        columns={allColumns}
        visibleColumns={visibleColumns}
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
