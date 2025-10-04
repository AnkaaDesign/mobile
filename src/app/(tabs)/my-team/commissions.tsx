import React, { useState, useMemo } from "react";
import { View, StyleSheet } from "react-native";
import { router } from "expo-router";
import { PrivilegeGuard } from "@/components/privilege-guard";
import { COMMISSION_STATUS, SECTOR_PRIVILEGES } from '../../../constants';
import { ThemedView } from "@/components/ui/themed-view";
import { ThemedText } from "@/components/ui/themed-text";
import { Button } from "@/components/ui/button";
import { Loading } from "@/components/ui/loading";
import { EmptyState } from "@/components/ui/empty-state";
import { TeamCommissionStatsCard } from "@/components/my-team/commission/team-commission-stats-card";
import { TeamCommissionTable } from "@/components/my-team/commission/team-commission-table";
import { TeamCommissionFilterModal, type TeamCommissionFilters } from "@/components/my-team/commission/team-commission-filter-modal";
import { useTasks } from '../../../hooks';
import { useCurrentUser } from '../../../hooks';
import { IconCurrencyDollar, IconFilter } from "@tabler/icons-react-native";
import { useTheme } from "@/lib/theme";

export default function MyTeamCommissionsScreen() {
  const { colors } = useTheme();
  const { data: currentUser, isLoading: isLoadingUser } = useCurrentUser();
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [filters, setFilters] = useState<TeamCommissionFilters>({});

  // Build query params for tasks
  const queryParams = useMemo(() => {
    const params: any = {
      include: {
        createdBy: true,
        customer: true,
      },
      where: {
        // Only show tasks from team members in the same sector
        createdBy: {
          sectorId: currentUser?.sectorId,
        },
        // Exclude NO_COMMISSION tasks by default
        commission: {
          not: COMMISSION_STATUS.NO_COMMISSION,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    };

    // Apply filters
    if (filters.userId) {
      params.where.createdById = filters.userId;
    }

    if (filters.commissionStatus) {
      params.where.commission = filters.commissionStatus;
    }

    if (filters.taskStatus) {
      params.where.status = filters.taskStatus;
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

  // Fetch tasks with commissions
  const {
    data: tasksResponse,
    isLoading: isLoadingTasks,
    error: tasksError,
    refresh: refreshTasks,
  } = useTasks({
    ...queryParams,
    enabled: !!currentUser?.sectorId,
  });

  const tasks = tasksResponse?.data || [];

  // Get unique team members for filter
  const teamMembers = useMemo(() => {
    const members = new Map();
    tasks.forEach((task) => {
      if (task.createdBy && !members.has(task.createdBy.id)) {
        members.set(task.createdBy.id, task.createdBy);
      }
    });
    return Array.from(members.values());
  }, [tasks]);

  const handleApplyFilters = (newFilters: TeamCommissionFilters) => {
    setFilters(newFilters);
  };

  const handleTaskPress = (taskId: string) => {
    router.push(`/production/schedule/details/${taskId}`);
  };

  const handleRefresh = async () => {
    await refreshTasks();
  };

  const isLoading = isLoadingUser || isLoadingTasks;

  if (isLoading) {
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
          <EmptyState
            icon="alert-circle"
            title="Setor não encontrado"
            description="Você precisa estar associado a um setor para visualizar as comissões da equipe"
          />
        </ThemedView>
      </PrivilegeGuard>
    );
  }

  const activeFilterCount = Object.values(filters).filter((v) => v !== undefined && v !== "").length;

  return (
    <PrivilegeGuard requiredPrivilege={SECTOR_PRIVILEGES.LEADER}>
      <ThemedView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <IconCurrencyDollar size={24} color={colors.primary} />
            <ThemedText style={styles.title}>Comissões da Equipe</ThemedText>
          </View>
          <Button
            variant="outline"
            size="sm"
            onPress={() => setFilterModalVisible(true)}
            style={styles.filterButton}
          >
            <IconFilter size={18} color={colors.text} />
            {activeFilterCount > 0 && (
              <View style={[styles.filterBadge, { backgroundColor: colors.primary }]}>
                <ThemedText style={styles.filterBadgeText}>{activeFilterCount}</ThemedText>
              </View>
            )}
          </Button>
        </View>

        <ThemedText style={styles.description}>
          Acompanhe as comissões dos serviços realizados pela sua equipe
        </ThemedText>

        {/* Stats Card */}
        {tasks.length > 0 && <TeamCommissionStatsCard tasks={tasks} />}

        {/* Commission Table */}
        {tasks.length > 0 ? (
          <TeamCommissionTable
            tasks={tasks}
            onTaskPress={handleTaskPress}
            onRefresh={handleRefresh}
            refreshing={isLoadingTasks}
            loading={isLoadingTasks}
          />
        ) : (
          <EmptyState
            icon="currency-dollar"
            title="Nenhuma comissão encontrada"
            description={
              activeFilterCount > 0
                ? "Tente ajustar os filtros para ver mais resultados"
                : "Os serviços com comissão da sua equipe aparecerão aqui"
            }
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
        <TeamCommissionFilterModal
          visible={filterModalVisible}
          onClose={() => setFilterModalVisible(false)}
          onApply={handleApplyFilters}
          currentFilters={filters}
          teamMembers={teamMembers}
        />
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
