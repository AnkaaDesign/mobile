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
import { TeamActivityStatsCard } from "@/components/my-team/activity/team-activity-stats-card";
import { TeamActivityTable } from "@/components/my-team/activity/team-activity-table";
import { TeamActivityFilterModal, type TeamActivityFilters } from "@/components/my-team/activity/team-activity-filter-modal";
import { TeamActivityFilterTags } from "@/components/my-team/activity/team-activity-filter-tags";
import { useActivitiesInfiniteMobile } from "@/hooks";
import { useAuth } from '../../../hooks';
import { IconActivity, IconFilter } from "@tabler/icons-react-native";
import { useTheme } from "@/lib/theme";
import type { User } from '../../../types';

export default function MyTeamActivitiesScreen() {
  const { colors } = useTheme();
  const { user: currentUser, isLoading: isLoadingAuth } = useAuth();
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [filters, setFilters] = useState<TeamActivityFilters>({});

  // Build query params for activities
  const queryParams = useMemo(() => {
    const params: any = {
      include: {
        item: {
          include: {
            brand: true,
            category: true,
            supplier: true,
            prices: {
              orderBy: { createdAt: "desc" },
              take: 1,
            },
          },
        },
        user: {
          include: {
            position: true,
            sector: true,
          },
        },
        order: true,
        orderItem: true,
      },
      where: {
        // Only show activities for users in the same sector
        user: {
          sectorId: currentUser?.sectorId,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    };

    // Apply filters
    if (filters.userIds && filters.userIds.length > 0) {
      params.where.userId = {
        in: filters.userIds,
      };
    }

    if (filters.operations && filters.operations.length > 0) {
      params.where.operation = {
        in: filters.operations,
      };
    }

    if (filters.reasons && filters.reasons.length > 0) {
      params.where.reason = {
        in: filters.reasons,
      };
    }

    if (filters.startDate || filters.endDate) {
      params.where.createdAt = {};
      if (filters.startDate) {
        params.where.createdAt.gte = filters.startDate;
      }
      if (filters.endDate) {
        params.where.createdAt.lte = filters.endDate;
      }
    }

    return params;
  }, [currentUser?.sectorId, filters]);

  // Fetch activities with infinite scroll
  const {
    data: activities,
    isLoading: isLoadingActivities,
    error: activitiesError,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
    refetch: refetchActivities,
  } = useActivitiesInfiniteMobile({
    ...queryParams,
    enabled: !!currentUser?.sectorId,
  });

  // Get unique team members for filter
  const teamMembers = useMemo(() => {
    const members = new Map<string, User>();
    activities.forEach((activity) => {
      if (activity.user && !members.has(activity.user.id)) {
        members.set(activity.user.id, activity.user);
      }
    });
    return Array.from(members.values());
  }, [activities]);

  const handleApplyFilters = useCallback((newFilters: TeamActivityFilters) => {
    setFilters(newFilters);
    setFilterModalVisible(false);
  }, []);

  const handleRemoveFilter = useCallback((filterKey: keyof TeamActivityFilters, value?: string) => {
    setFilters((prev) => {
      const newFilters = { ...prev };

      if (value && (filterKey === "userIds" || filterKey === "operations" || filterKey === "reasons")) {
        // Remove specific value from array
        const currentArray = newFilters[filterKey] || [];
        newFilters[filterKey] = currentArray.filter((item) => item !== value) as any;
        if (newFilters[filterKey]?.length === 0) {
          delete newFilters[filterKey];
        }
      } else {
        // Remove entire filter
        delete newFilters[filterKey];
      }

      return newFilters;
    });
  }, []);

  const handleActivityPress = useCallback((activityId: string) => {
    // Navigate to activity details if needed
    // router.push(`/inventory/activities/details/${activityId}`);
  }, []);

  const handleRefresh = async () => {
    await refetchActivities();
  };

  const handleLoadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const isLoading = isLoadingAuth || isLoadingActivities;

  if (isLoading && activities.length === 0) {
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
          <EmptyState icon="alert-circle" title="Setor não encontrado" description="Você precisa estar associado a um setor para visualizar as atividades da equipe" />
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
            <IconActivity size={24} color={colors.primary} />
            <ThemedText style={styles.title}>Atividades da Equipe</ThemedText>
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

        <ThemedText style={styles.description}>Acompanhe as atividades de movimentação de estoque dos colaboradores do seu setor</ThemedText>

        {/* Filter Tags */}
        {activeFilterCount > 0 && <TeamActivityFilterTags filters={filters} onRemoveFilter={handleRemoveFilter} teamMembers={teamMembers} />}

        {/* Stats Card */}
        {activities.length > 0 && <TeamActivityStatsCard activities={activities} />}

        {/* Activity Table */}
        {activities.length > 0 ? (
          <TeamActivityTable activities={activities} onActivityPress={handleActivityPress} onRefresh={handleRefresh} refreshing={isLoadingActivities} loading={isLoadingActivities} />
        ) : (
          <EmptyState
            icon="activity"
            title="Nenhuma atividade encontrada"
            description={activeFilterCount > 0 ? "Tente ajustar os filtros para ver mais resultados" : "As atividades da sua equipe aparecerão aqui"}
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
        <TeamActivityFilterModal visible={filterModalVisible} onClose={() => setFilterModalVisible(false)} onApply={handleApplyFilters} currentFilters={filters} teamMembers={teamMembers} />
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
