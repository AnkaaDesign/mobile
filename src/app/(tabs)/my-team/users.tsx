import React, { useState, useMemo, useCallback } from "react";
import { View, StyleSheet } from "react-native";
import { router } from "expo-router";
import { PrivilegeGuard } from "@/components/privilege-guard";
import { SECTOR_PRIVILEGES } from '../../../constants';
import { ThemedView } from "@/components/ui/themed-view";
import { ThemedText } from "@/components/ui/themed-text";
import { Button } from "@/components/ui/button";
import { Loading } from "@/components/ui/loading";
import { EmptyState } from "@/components/ui/empty-state";
import { TeamUserTable } from "@/components/my-team/user/team-user-table";
import { TeamUserFilterModal, type TeamUserFilters } from "@/components/my-team/user/team-user-filter-modal";
import { useTeamUsersInfiniteMobile } from "@/hooks/use-team-users-infinite-mobile";
import { useAuth } from '../../../hooks';
import { IconUsers, IconFilter } from "@tabler/icons-react-native";
import { useTheme } from "@/lib/theme";

export default function MyTeamUsersScreen() {
  const { colors } = useTheme();
  const { user: currentUser, isLoading: isLoadingAuth } = useAuth();
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [filters, setFilters] = useState<TeamUserFilters>({});

  // Build query params for users
  const queryParams = useMemo(() => {
    const params: any = {
      include: {
        position: true,
        sector: true,
        ppeSize: true,
      },
      where: {
        // Only show users from the same sector
        sectorId: currentUser?.sectorId,
      },
      orderBy: {
        name: "asc",
      },
    };

    // Apply filters
    if (filters.statuses && filters.statuses.length > 0) {
      params.where.status = {
        in: filters.statuses,
      };
    }

    if (filters.positionIds && filters.positionIds.length > 0) {
      params.where.positionId = {
        in: filters.positionIds,
      };
    }

    return params;
  }, [currentUser?.sectorId, filters]);

  // Fetch users with infinite scroll
  const {
    data: users,
    isLoading: isLoadingUsers,
    error: usersError,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
    refetch: refetchUsers,
  } = useTeamUsersInfiniteMobile({
    ...queryParams,
    enabled: !!currentUser?.sectorId,
  });

  // Get unique positions for filter
  const positions = useMemo(() => {
    const positionsMap = new Map<string, { id: string; name: string }>();
    users.forEach((user) => {
      if (user.position && !positionsMap.has(user.position.id)) {
        positionsMap.set(user.position.id, {
          id: user.position.id,
          name: user.position.name,
        });
      }
    });
    return Array.from(positionsMap.values());
  }, [users]);

  const handleApplyFilters = useCallback((newFilters: TeamUserFilters) => {
    setFilters(newFilters);
    setFilterModalVisible(false);
  }, []);

  const handleUserPress = useCallback((userId: string) => {
    // Navigate to user details if needed
    // router.push(`/human-resources/user/details/${userId}` as any);
  }, []);

  const handleRefresh = async () => {
    await refetchUsers();
  };

  const handleLoadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const isLoading = isLoadingAuth || isLoadingUsers;

  if (isLoading && users.length === 0) {
    return (
      <PrivilegeGuard requiredPrivilege={SECTOR_PRIVILEGES.LEADER}>
        <ThemedView style={styles.container}>
          <Loading />
        </ThemedView>
      </PrivilegeGuard>
    );
  }

  if (!currentUser?.sectorId) {
    return (
      <PrivilegeGuard requiredPrivilege={SECTOR_PRIVILEGES.LEADER}>
        <ThemedView style={styles.container}>
          <EmptyState icon="alert-circle" title="Setor não encontrado" description="Você precisa estar associado a um setor para visualizar os usuários da equipe" />
        </ThemedView>
      </PrivilegeGuard>
    );
  }

  const activeFilterCount = Object.values(filters).filter((v) => {
    if (Array.isArray(v)) return v.length > 0;
    return v !== undefined && v !== "";
  }).length;

  return (
    <PrivilegeGuard requiredPrivilege={SECTOR_PRIVILEGES.LEADER}>
      <ThemedView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <IconUsers size={24} color={colors.primary} />
            <ThemedText style={styles.title}>Usuários da Equipe</ThemedText>
          </View>
          <Button variant="outline" size="sm" onPress={() => setFilterModalVisible(true)} style={styles.filterButton}>
            <IconFilter size={18} color={colors.text} />
            {activeFilterCount > 0 && (
              <View style={[styles.filterBadge, { backgroundColor: colors.primary }]}>
                <ThemedText style={styles.filterBadgeText}>{activeFilterCount}</ThemedText>
              </View>
            )}
          </Button>
        </View>

        <ThemedText style={styles.description}>Visualize os colaboradores do seu setor (somente leitura)</ThemedText>

        {/* User Table */}
        {users.length > 0 ? (
          <TeamUserTable users={users} onUserPress={handleUserPress} onRefresh={handleRefresh} refreshing={isLoadingUsers} loading={isLoadingUsers} />
        ) : (
          <EmptyState
            icon="users"
            title="Nenhum usuário encontrado"
            description={activeFilterCount > 0 ? "Tente ajustar os filtros para ver mais resultados" : "Os colaboradores do seu setor aparecerão aqui"}
            action={
              activeFilterCount > 0
                ? {
                    label: "Limpar Filtros",
                    onPress: () => setFilters({}),
                  }
                : undefined
            }
          />
        )}

        {/* Filter Modal */}
        <TeamUserFilterModal visible={filterModalVisible} onClose={() => setFilterModalVisible(false)} onApply={handleApplyFilters} currentFilters={filters} positions={positions} />
      </ThemedView>
    </PrivilegeGuard>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    marginLeft: 8,
  },
  filterButton: {
    position: "relative",
  },
  filterBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: "center",
    alignItems: "center",
  },
  filterBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#fff",
  },
  description: {
    fontSize: 14,
    opacity: 0.7,
    marginBottom: 16,
    lineHeight: 20,
  },
});
