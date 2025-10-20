import React, { useState, useCallback, useMemo } from "react";
import { View, Pressable, Alert, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { IconFilter, IconList } from "@tabler/icons-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useUserMutations } from '../../../../hooks';
import { useUsersInfiniteMobile } from "@/hooks";
import type { UserGetManyFormData } from '../../../../schemas';
import { ThemedView, ThemedText, FAB, ErrorScreen, EmptyState, ListActionButton } from "@/components/ui";
import { UserTable } from "@/components/administration/user/list/user-table";
import type { SortConfig } from "@/components/administration/user/list/user-table";
import { UserFilterTags } from "@/components/administration/user/list/user-filter-tags";
import { TableErrorBoundary } from "@/components/ui/table-error-boundary";
import { ItemsCountDisplay } from "@/components/ui/items-count-display";
import { UserListSkeleton } from "@/components/administration/user/skeleton/user-list-skeleton";
import { useTheme } from "@/lib/theme";
import { routes } from '../../../../constants';
import { routeToMobilePath } from "@/lib/route-mapper";

// New hooks and components
import { useDebouncedSearch } from "@/hooks/useDebouncedSearch";
import { useTableSort } from "@/hooks/useTableSort";
import { useColumnVisibility } from "@/hooks/useColumnVisibility";
import { BaseFilterDrawer, BooleanFilter, MultiSelectFilter } from "@/components/common/filters";
import { usePositions, useSectors } from '../../../../hooks';
import { USER_STATUS, USER_STATUS_LABELS } from '../../../../constants';
import { Input } from "@/components/ui/input";
import { UserColumnVisibilityDrawer } from "@/components/administration/user/list/user-column-visibility-drawer";

export default function AdministrationUsersListScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showColumnManager, setShowColumnManager] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [showSelection, setShowSelection] = useState(false);

  // Filter state
  const [filters, setFilters] = useState<{
    statuses?: string[];
    positionIds?: string[];
    sectorIds?: string[];
    managedSectorIds?: string[];
    verified?: boolean;
    hasManagedSector?: boolean;
  }>({});

  // Use new hooks
  const { displayText, searchText, setDisplayText } = useDebouncedSearch("", 300);

  const { sortConfigs, handleSort, buildOrderBy } = useTableSort(
    [{ column: "name", direction: "asc", order: 0 }],
    3,
    false
  );

  const {
    visibleColumns,
    setVisibleColumns,
    isLoading: isColumnsLoading,
  } = useColumnVisibility(
    "users",
    ["name", "email"],
    ["name", "email", "cpf", "status", "position", "sector", "createdAt", "updatedAt"]
  );

  // Load filter options
  const { data: positionsData } = usePositions({ limit: 100, orderBy: { name: "asc" } });
  const { data: sectorsData } = useSectors({ limit: 100, orderBy: { name: "asc" } });

  const positions = positionsData?.data || [];
  const sectors = sectorsData?.data || [];

  // Build API query
  const buildWhereClause = useCallback(() => {
    const where: any = {};

    if (filters.statuses?.length) {
      where.status = { in: filters.statuses };
    }

    if (filters.positionIds?.length) {
      where.positionId = { in: filters.positionIds };
    }

    if (filters.sectorIds?.length) {
      where.sectorId = { in: filters.sectorIds };
    }

    if (filters.managedSectorIds?.length) {
      where.managedSectorId = { in: filters.managedSectorIds };
    }

    if (filters.verified !== undefined) {
      where.verified = filters.verified;
    }

    if (filters.hasManagedSector !== undefined) {
      where.hasManagedSector = filters.hasManagedSector;
    }

    return Object.keys(where).length > 0 ? where : undefined;
  }, [filters]);

  const queryParams = useMemo(() => ({
    orderBy: buildOrderBy(
      {
        name: "name",
        email: "email",
        cpf: "cpf",
        status: "statusOrder",
        position: { position: { name: "name" } },
        sector: { sector: { name: "name" } },
        createdAt: "createdAt",
        updatedAt: "updatedAt",
      },
      { name: "asc" }
    ),
    ...(searchText ? { searchingFor: searchText } : {}),
    ...(buildWhereClause() ? { where: buildWhereClause() } : {}),
    include: {
      avatar: true,
      position: true,
      sector: true,
      managedSector: true,
    },
  }), [searchText, buildWhereClause, buildOrderBy]);

  const { items: users, isLoading, error, refetch, isRefetching, loadMore, canLoadMore, isFetchingNextPage, totalItemsLoaded, totalCount, refresh } = useUsersInfiniteMobile(queryParams);
  const { delete: deleteUser } = useUserMutations();

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refresh();
    } finally {
      setRefreshing(false);
    }
  }, [refresh]);

  const handleCreateUser = () => {
    router.push(routeToMobilePath(routes.administration.collaborators.create) as any);
  };

  const handleUserPress = (userId: string) => {
    router.push(routeToMobilePath(routes.administration.users.details(userId)) as any);
  };

  const handleEditUser = (userId: string) => {
    router.push(routeToMobilePath(routes.administration.collaborators.edit(userId)) as any);
  };

  const handleDeleteUser = useCallback(
    async (userId: string) => {
      await deleteUser(userId);
      // Clear selection if the deleted user was selected
      if (selectedUsers.has(userId)) {
        const newSelection = new Set(selectedUsers);
        newSelection.delete(userId);
        setSelectedUsers(newSelection);
      }
    },
    [deleteUser, selectedUsers],
  );

  const handleSelectionChange = useCallback((newSelection: Set<string>) => {
    setSelectedUsers(newSelection);
  }, []);

  const handleApplyFilters = useCallback(() => {
    setShowFilters(false);
  }, []);

  const handleClearFilters = useCallback(() => {
    setFilters({});
    setDisplayText("");
    setSelectedUsers(new Set());
    setShowSelection(false);
  }, [setDisplayText]);

  const handleColumnsChange = useCallback((newColumns: Set<string>) => {
    setVisibleColumns(Array.from(newColumns));
  }, [setVisibleColumns]);

  // Count active filters
  const activeFiltersCount = Object.values(filters).filter(
    (value) => value !== undefined && value !== null && (Array.isArray(value) ? value.length > 0 : value === true)
  ).length;

  // Status options for multi-select
  const statusOptions = useMemo(() =>
    Object.values(USER_STATUS).map((status) => ({
      value: status,
      label: USER_STATUS_LABELS[status],
    })),
    []
  );

  // Position options
  const positionOptions = useMemo(() =>
    positions.map((position) => ({
      value: position.id,
      label: position.name,
    })),
    [positions]
  );

  // Sector options
  const sectorOptions = useMemo(() =>
    sectors.map((sector) => ({
      value: sector.id,
      label: sector.name,
    })),
    [sectors]
  );

  // Filter sections for BaseFilterDrawer
  const filterSections = useMemo(() => [
    {
      id: "status",
      title: "Status",
      defaultOpen: true,
      badge: filters.statuses?.length || 0,
      content: (
        <MultiSelectFilter
          label="Status do Usuário"
          value={filters.statuses || []}
          onChange={(value) => setFilters(prev => ({ ...prev, statuses: value.length > 0 ? value : undefined }))}
          options={statusOptions}
          placeholder="Selecione status..."
        />
      ),
    },
    {
      id: "entities",
      title: "Cargo e Setor",
      defaultOpen: false,
      badge: (filters.positionIds?.length || 0) + (filters.sectorIds?.length || 0) + (filters.managedSectorIds?.length || 0),
      content: (
        <>
          <MultiSelectFilter
            label="Cargos"
            value={filters.positionIds || []}
            onChange={(value) => setFilters(prev => ({ ...prev, positionIds: value.length > 0 ? value : undefined }))}
            options={positionOptions}
            placeholder="Selecione cargos..."
          />
          <MultiSelectFilter
            label="Setores"
            value={filters.sectorIds || []}
            onChange={(value) => setFilters(prev => ({ ...prev, sectorIds: value.length > 0 ? value : undefined }))}
            options={sectorOptions}
            placeholder="Selecione setores..."
          />
          <MultiSelectFilter
            label="Setores Gerenciados"
            value={filters.managedSectorIds || []}
            onChange={(value) => setFilters(prev => ({ ...prev, managedSectorIds: value.length > 0 ? value : undefined }))}
            options={sectorOptions}
            placeholder="Selecione setores gerenciados..."
          />
        </>
      ),
    },
    {
      id: "verification",
      title: "Verificação e Permissões",
      defaultOpen: false,
      badge: (filters.verified ? 1 : 0) + (filters.hasManagedSector ? 1 : 0),
      content: (
        <>
          <BooleanFilter
            label="Usuário Verificado"
            description="Filtrar por usuários com email verificado"
            value={!!filters.verified}
            onChange={(value) => setFilters(prev => ({ ...prev, verified: value || undefined }))}
          />
          <BooleanFilter
            label="Gerencia Setor"
            description="Filtrar por usuários que gerenciam setores"
            value={!!filters.hasManagedSector}
            onChange={(value) => setFilters(prev => ({ ...prev, hasManagedSector: value || undefined }))}
          />
        </>
      ),
    },
  ], [filters, statusOptions, positionOptions, sectorOptions]);

  if (isLoading && !isRefetching) {
    return <UserListSkeleton />;
  }

  if (error) {
    return (
      <ThemedView style={styles.container}>
        <ErrorScreen message="Erro ao carregar usuários" detail={error.message} onRetry={handleRefresh} />
      </ThemedView>
    );
  }

  const hasUsers = Array.isArray(users) && users.length > 0;

  return (
    <ThemedView style={[styles.container, { backgroundColor: colors.background, paddingBottom: insets.bottom }]}>
      {/* Search and Filter */}
      <View style={[styles.searchContainer]}>
        <Input
          value={displayText}
          onChangeText={setDisplayText}
          placeholder="Buscar usuários..."
          style={styles.searchBar}
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
      <UserFilterTags
        filters={{ where: buildWhereClause() }}
        searchText={searchText}
        onFilterChange={(newFilters) => {
          const where = newFilters.where as any;
          if (where) {
            const extracted: typeof filters = {};
            if (where.status?.in) extracted.statuses = where.status.in;
            if (where.positionId?.in) extracted.positionIds = where.positionId.in;
            if (where.sectorId?.in) extracted.sectorIds = where.sectorId.in;
            if (where.managedSectorId?.in) extracted.managedSectorIds = where.managedSectorId.in;
            if (where.verified !== undefined) extracted.verified = where.verified;
            if (where.hasManagedSector !== undefined) extracted.hasManagedSector = where.hasManagedSector;
            setFilters(extracted);
          } else {
            setFilters({});
          }
        }}
        onSearchChange={(text) => {
          setDisplayText(text);
        }}
        onClearAll={handleClearFilters}
      />

      {hasUsers ? (
        <TableErrorBoundary onRetry={handleRefresh}>
          <UserTable
            users={users}
            onUserPress={handleUserPress}
            onUserEdit={handleEditUser}
            onUserDelete={handleDeleteUser}
            onUserView={handleUserPress}
            onRefresh={handleRefresh}
            onEndReached={canLoadMore ? loadMore : undefined}
            refreshing={refreshing}
            loading={isLoading && !isRefetching}
            loadingMore={isFetchingNextPage}
            showSelection={showSelection}
            selectedUsers={selectedUsers}
            onSelectionChange={handleSelectionChange}
            sortConfigs={sortConfigs as SortConfig[]}
            onSort={(configs) => handleSort(configs[0]?.columnKey || "name")}
            visibleColumnKeys={visibleColumns}
            enableSwipeActions={true}
          />
        </TableErrorBoundary>
      ) : (
        <View style={styles.emptyContainer}>
          <EmptyState
            icon={searchText ? "search" : "users-group"}
            title={searchText ? "Nenhum usuário encontrado" : "Nenhum usuário cadastrado"}
            description={searchText ? `Nenhum resultado para "${searchText}"` : "Comece cadastrando seu primeiro usuário"}
            actionLabel={searchText ? undefined : "Cadastrar Usuário"}
            onAction={searchText ? undefined : handleCreateUser}
          />
        </View>
      )}

      {/* Items count */}
      {hasUsers && <ItemsCountDisplay loadedCount={totalItemsLoaded} totalCount={totalCount} isLoading={isFetchingNextPage} />}

      {hasUsers && <FAB icon="plus" onPress={handleCreateUser} />}

      {/* New BaseFilterDrawer */}
      <BaseFilterDrawer
        open={showFilters}
        onOpenChange={setShowFilters}
        sections={filterSections}
        onApply={handleApplyFilters}
        onClear={handleClearFilters}
        activeFiltersCount={activeFiltersCount}
        title="Filtros de Usuários"
        description="Configure os filtros para refinar sua busca"
      />

      {/* Column Visibility Drawer */}
      <UserColumnVisibilityDrawer
        open={showColumnManager}
        onOpenChange={setShowColumnManager}
        visibleColumns={new Set(visibleColumns)}
        onVisibilityChange={handleColumnsChange}
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
