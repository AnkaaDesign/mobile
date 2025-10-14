import React, { useState, useCallback } from "react";
import { View, Pressable, Alert, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { IconFilter } from "@tabler/icons-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useUserMutations } from '../../../../hooks';
import { useUsersInfiniteMobile } from "@/hooks";
import type { UserGetManyFormData } from '../../../../schemas';
import { ThemedView, ThemedText, FAB, ErrorScreen, EmptyState, SearchBar, Badge } from "@/components/ui";
import { UserTable } from "@/components/administration/user/list/user-table";
import type { SortConfig } from "@/components/administration/user/list/user-table";
import { UserFilterModal } from "@/components/administration/user/list/user-filter-modal";
import { UserFilterTags } from "@/components/administration/user/list/user-filter-tags";
import { TableErrorBoundary } from "@/components/ui/table-error-boundary";
import { ItemsCountDisplay } from "@/components/ui/items-count-display";
import { UserListSkeleton } from "@/components/administration/user/skeleton/user-list-skeleton";
import { useTheme } from "@/lib/theme";
import { routes } from '../../../../constants';
import { routeToMobilePath } from "@/lib/route-mapper";

export default function AdministrationUsersListScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [displaySearchText, setDisplaySearchText] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<Partial<UserGetManyFormData>>({});
  const [sortConfigs, setSortConfigs] = useState<SortConfig[]>([{ columnKey: "name", direction: "asc" }]);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [showSelection, setShowSelection] = useState(false);

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
      managedSector: true,
    },
  };

  const { items: users, isLoading, error, refetch, isRefetching, loadMore, canLoadMore, isFetchingNextPage, totalItemsLoaded, refresh } = useUsersInfiniteMobile(queryParams);
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
      try {
        await deleteUser(userId);
        // Clear selection if the deleted user was selected
        if (selectedUsers.has(userId)) {
          const newSelection = new Set(selectedUsers);
          newSelection.delete(userId);
          setSelectedUsers(newSelection);
        }
      } catch (error) {
        Alert.alert("Erro", "Não foi possível excluir o usuário. Tente novamente.");
      }
    },
    [deleteUser, selectedUsers],
  );

  const handleSort = useCallback((configs: SortConfig[]) => {
    setSortConfigs(configs);
  }, []);

  const handleSelectionChange = useCallback((newSelection: Set<string>) => {
    setSelectedUsers(newSelection);
  }, []);

  const handleSearch = useCallback((text: string) => {
    setSearchText(text);
  }, []);

  const handleDisplaySearchChange = useCallback((text: string) => {
    setDisplaySearchText(text);
  }, []);

  const handleApplyFilters = useCallback((newFilters: Partial<UserGetManyFormData>) => {
    setFilters(newFilters);
    setShowFilters(false);
  }, []);

  const handleClearFilters = useCallback(() => {
    setFilters({});
    setSearchText("");
    setDisplaySearchText("");
    setSelectedUsers(new Set());
    setShowSelection(false);
  }, []);

  // Count active filters
  const activeFiltersCount = Object.entries(filters).filter(([key, value]) => value !== undefined && value !== null && (Array.isArray(value) ? value.length > 0 : true)).length;

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
        <SearchBar value={displaySearchText} onChangeText={handleDisplaySearchChange} onSearch={handleSearch} placeholder="Buscar usuários..." style={styles.searchBar} debounceMs={300} />
        <View style={styles.buttonContainer}>
          <Pressable
            style={({ pressed }) => [styles.actionButton, { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }, pressed && styles.actionButtonPressed]}
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
      <UserFilterTags
        filters={filters}
        searchText={searchText}
        onFilterChange={handleApplyFilters}
        onSearchChange={(text) => {
          setSearchText(text);
          setDisplaySearchText(text);
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
            sortConfigs={sortConfigs}
            onSort={handleSort}
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
      {hasUsers && <ItemsCountDisplay loadedCount={totalItemsLoaded} totalCount={undefined} isLoading={isFetchingNextPage} />}

      {hasUsers && <FAB icon="plus" onPress={handleCreateUser} />}

      {/* Filter Modal */}
      <UserFilterModal visible={showFilters} onClose={() => setShowFilters(false)} onApply={handleApplyFilters} currentFilters={filters} />
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
