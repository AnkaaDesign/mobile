import { useState, useCallback, useMemo } from "react";
import { View, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { IconFilter, IconList } from "@tabler/icons-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useUserMutations } from '../../../../hooks';
import { useUsersInfiniteMobile } from "@/hooks";
import type { UserGetManyFormData } from '../../../../schemas';
import { ThemedView, FAB, ErrorScreen, EmptyState, SearchBar, ListActionButton } from "@/components/ui";
import { EmployeeTable, createColumnDefinitions, getDefaultVisibleColumns } from "@/components/administration/employee/list/employee-table";
import type { SortConfig } from "@/components/administration/employee/list/employee-table";
import { EmployeeFilterDrawer } from "@/components/administration/employee/list/employee-filter-drawer";
import { EmployeeFilterTags } from "@/components/administration/employee/list/employee-filter-tags";

import { TableErrorBoundary } from "@/components/ui/table-error-boundary";
import { ItemsCountDisplay } from "@/components/ui/items-count-display";
import { EmployeeListSkeleton } from "@/components/administration/employee/skeleton/employee-list-skeleton";
import { useTheme } from "@/lib/theme";
import { routes } from '../../../../constants';
import { routeToMobilePath } from "@/lib/route-mapper";

import { UtilityDrawerWrapper } from "@/components/ui/utility-drawer";
import { useUtilityDrawer } from "@/contexts/utility-drawer-context";
import { GenericColumnDrawerContent } from "@/components/ui/generic-column-drawer-content";
import { EmployeeFilterDrawerContent } from "@/components/administration/employee/list/employee-filter-drawer-content";

export default function AdministrationEmployeesListScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { openFilterDrawer, openColumnDrawer } = useUtilityDrawer();
  const [refreshing, setRefreshing] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [displaySearchText, setDisplaySearchText] = useState("");
  const [filters, setFilters] = useState<Partial<UserGetManyFormData>>({});
  const [sortConfigs, setSortConfigs] = useState<SortConfig[]>([{ columnKey: "name", direction: "asc" }]);
  const [selectedEmployees, setSelectedEmployees] = useState<Set<string>>(new Set());
  const [showSelection, setShowSelection] = useState(false);
  const [visibleColumnKeys, setVisibleColumnKeys] = useState<string[]>(Array.from(getDefaultVisibleColumns()));

  // Build query parameters with sorting
  const buildOrderBy = () => {
    if (!sortConfigs || sortConfigs.length === 0) return { name: "asc" };

    // If only one sort, return as object
    if (sortConfigs.length === 1) {
      const config = sortConfigs[0];
      switch (config.columnKey) {
        case "name":
          return { name: config.direction };
        case "email":
          return { email: config.direction };
        case "cpf":
          return { cpf: config.direction };
        case "status":
          return { statusOrder: config.direction };
        case "position":
          return { position: { name: config.direction } };
        case "sector":
          return { sector: { name: config.direction } };
        default:
          return { name: "asc" };
      }
    }

    // Multiple sorts, return as array
    return sortConfigs.map((config) => {
      switch (config.columnKey) {
        case "name":
          return { name: config.direction };
        case "email":
          return { email: config.direction };
        case "cpf":
          return { cpf: config.direction };
        case "status":
          return { statusOrder: config.direction };
        case "position":
          return { position: { name: config.direction } };
        case "sector":
          return { sector: { name: config.direction } };
        default:
          return { name: "asc" };
      }
    });
  };

  const queryParams = {
    orderBy: buildOrderBy(),
    ...(searchText ? { searchingFor: searchText } : {}),
    ...filters,
    include: {
      position: true,
      sector: true,
    },
  };

  const { items: employees, isLoading, error, isRefetching, loadMore, canLoadMore, isFetchingNextPage, totalItemsLoaded, totalCount, refresh } = useUsersInfiniteMobile(queryParams);
  const { delete: deleteEmployee } = useUserMutations();

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refresh();
    } finally {
      setRefreshing(false);
    }
  }, [refresh]);

  const handleCreateEmployee = () => {
    router.push(routeToMobilePath(routes.administration.collaborators.create) as any);
  };

  const handleEmployeePress = (employeeId: string) => {
    router.push(routeToMobilePath(routes.administration.collaborators.details(employeeId)) as any);
  };

  const handleEditEmployee = (employeeId: string) => {
    router.push(routeToMobilePath(routes.administration.collaborators.edit(employeeId)) as any);
  };

  const handleDeleteEmployee = useCallback(
    async (employeeId: string) => {
      await deleteEmployee(employeeId);
      // Clear selection if the deleted employee was selected
      if (selectedEmployees.has(employeeId)) {
        const newSelection = new Set(selectedEmployees);
        newSelection.delete(employeeId);
        setSelectedEmployees(newSelection);
      }
    },
    [deleteEmployee, selectedEmployees],
  );

  const handleSort = useCallback((configs: SortConfig[]) => {
    setSortConfigs(configs);
  }, []);

  const handleSelectionChange = useCallback((newSelection: Set<string>) => {
    setSelectedEmployees(newSelection);
  }, []);

  const handleSearch = useCallback((text: string) => {
    setSearchText(text);
  }, []);

  const handleDisplaySearchChange = useCallback((text: string) => {
    setDisplaySearchText(text);
  }, []);

  const handleApplyFilters = useCallback((newFilters: Partial<UserGetManyFormData>) => {
    setFilters(newFilters);
  }, []);

  const handleClearFilters = useCallback(() => {
    setFilters({});
    setSearchText("");
    setDisplaySearchText("");
    setSelectedEmployees(new Set());
    setShowSelection(false);
  }, []);

  const handleColumnsChange = useCallback((newColumns: Set<string>) => {
    setVisibleColumnKeys(Array.from(newColumns));
  }, []);

  // Get all column definitions
  const allColumns = useMemo(() => createColumnDefinitions(), []);

  // Count active filters
  const activeFiltersCount = Object.entries(filters).filter(([_key, value]) => value !== undefined && value !== null && (Array.isArray(value) ? value.length > 0 : true)).length;

  const handleOpenFilters = useCallback(() => {
    openFilterDrawer(() => (
      <EmployeeFilterDrawerContent
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
    return <EmployeeListSkeleton />;
  }

  if (error) {
    return (
    <UtilityDrawerWrapper>

          <ThemedView style={styles.container}>
            <ErrorScreen message="Erro ao carregar colaboradores" detail={error.message} onRetry={handleRefresh} />
          </ThemedView>
    
    </UtilityDrawerWrapper>
  );
  }

  const hasEmployees = Array.isArray(employees) && employees.length > 0;

  return (
    <ThemedView style={[styles.container, { backgroundColor: colors.background, paddingBottom: insets.bottom }]}>
      {/* Search and Filter */}
      <View style={[styles.searchContainer]}>
        <SearchBar value={displaySearchText} onChangeText={handleDisplaySearchChange} onSearch={handleSearch} placeholder="Buscar colaboradores..." style={styles.searchBar} debounceMs={300} />
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
      <EmployeeFilterTags
        filters={filters}
        searchText={searchText}
        onFilterChange={handleApplyFilters}
        onSearchChange={(text) => {
          setSearchText(text);
          setDisplaySearchText(text);
        }}
        onClearAll={handleClearFilters}
      />

      {hasEmployees ? (
        <TableErrorBoundary onRetry={handleRefresh}>
          <EmployeeTable
            employees={employees}
            onEmployeePress={handleEmployeePress}
            onEmployeeEdit={handleEditEmployee}
            onEmployeeDelete={handleDeleteEmployee}
            onEmployeeView={handleEmployeePress}
            onRefresh={handleRefresh}
            onEndReached={canLoadMore ? loadMore : undefined}
            refreshing={refreshing}
            loading={isLoading && !isRefetching}
            loadingMore={isFetchingNextPage}
            showSelection={showSelection}
            selectedEmployees={selectedEmployees}
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
            icon={searchText ? "search" : "users-group"}
            title={searchText ? "Nenhum colaborador encontrado" : "Nenhum colaborador cadastrado"}
            description={searchText ? `Nenhum resultado para "${searchText}"` : "Comece cadastrando seu primeiro colaborador"}
            actionLabel={searchText ? undefined : "Cadastrar Colaborador"}
            onAction={searchText ? undefined : handleCreateEmployee}
          />
        </View>
      )}

      {/* Items count */}
      {hasEmployees && <ItemsCountDisplay loadedCount={totalItemsLoaded} totalCount={totalCount} isLoading={isFetchingNextPage} />}

      {hasEmployees && <FAB icon="plus" onPress={handleCreateEmployee} />}
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
