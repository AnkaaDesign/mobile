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
import { TeamWarningStatsCard } from "@/components/my-team/warning/team-warning-stats-card";
import { TeamWarningTable } from "@/components/my-team/warning/team-warning-table";
import { TeamWarningFilterModal, type TeamWarningFilters } from "@/components/my-team/warning/team-warning-filter-modal";
import { TeamWarningFilterTags } from "@/components/my-team/warning/team-warning-filter-tags";
import { useWarningsInfiniteMobile } from "@/hooks";
import { useAuth } from '../../../hooks';
import { IconAlertTriangle, IconFilter } from "@tabler/icons-react-native";
import { useTheme } from "@/lib/theme";
import type { User } from '../../../types';

export default function MyTeamWarningsScreen() {
  const { colors } = useTheme();
  const { user: currentUser, isLoading: isLoadingAuth } = useAuth();
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [filters, setFilters] = useState<TeamWarningFilters>({});

  // Build query params for warnings
  const queryParams = useMemo(() => {
    const params: any = {
      include: {
        collaborator: {
          include: {
            position: true,
            sector: true,
          },
        },
        supervisor: true,
      },
      where: {
        // Only show warnings for collaborators in the same sector
        collaborator: {
          sectorId: currentUser?.sectorId,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    };

    // Apply filters
    if (filters.userIds && filters.userIds.length > 0) {
      params.where.collaboratorId = {
        in: filters.userIds,
      };
    }

    if (filters.categories && filters.categories.length > 0) {
      params.where.category = {
        in: filters.categories,
      };
    }

    if (filters.severities && filters.severities.length > 0) {
      params.where.severity = {
        in: filters.severities,
      };
    }

    if (filters.isActive !== undefined) {
      params.where.isActive = filters.isActive;
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

  // Fetch warnings with infinite scroll
  const {
    data: warnings,
    isLoading: isLoadingWarnings,
    error: warningsError,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
    refetch: refetchWarnings,
  } = useWarningsInfiniteMobile({
    ...queryParams,
    enabled: !!currentUser?.sectorId,
  });

  // Get unique team members for filter
  const teamMembers = useMemo(() => {
    const members = new Map<string, User>();
    warnings.forEach((warning) => {
      if (warning.collaborator && !members.has(warning.collaborator.id)) {
        members.set(warning.collaborator.id, warning.collaborator);
      }
    });
    return Array.from(members.values());
  }, [warnings]);

  const handleApplyFilters = useCallback((newFilters: TeamWarningFilters) => {
    setFilters(newFilters);
    setFilterModalVisible(false);
  }, []);

  const handleRemoveFilter = useCallback((filterKey: keyof TeamWarningFilters, value?: string) => {
    setFilters((prev) => {
      const newFilters = { ...prev };

      if (value && (filterKey === "userIds" || filterKey === "categories" || filterKey === "severities")) {
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

  const handleWarningPress = useCallback((warningId: string) => {
    router.push(`/meu-pessoal/advertencias/detalhes/${warningId}`);
  }, []);

  const handleRefresh = async () => {
    await refetchWarnings();
  };

  const handleLoadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const isLoading = isLoadingAuth || isLoadingWarnings;

  if (isLoading && warnings.length === 0) {
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
          <EmptyState icon="alert-circle" title="Setor não encontrado" description="Você precisa estar associado a um setor para visualizar as advertências da equipe" />
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
            <IconAlertTriangle size={24} color={colors.primary} />
            <ThemedText style={styles.title}>Advertências da Equipe</ThemedText>
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

        <ThemedText style={styles.description}>Visualize e gerencie as advertências dos colaboradores do seu setor</ThemedText>

        {/* Filter Tags */}
        {activeFilterCount > 0 && <TeamWarningFilterTags filters={filters} onRemoveFilter={handleRemoveFilter} teamMembers={teamMembers} />}

        {/* Stats Card */}
        {warnings.length > 0 && <TeamWarningStatsCard warnings={warnings} />}

        {/* Warning Table */}
        {warnings.length > 0 ? (
          <TeamWarningTable warnings={warnings} onWarningPress={handleWarningPress} onRefresh={handleRefresh} refreshing={isLoadingWarnings} loading={isLoadingWarnings} />
        ) : (
          <EmptyState
            icon="alert-triangle"
            title="Nenhuma advertência encontrada"
            description={activeFilterCount > 0 ? "Tente ajustar os filtros para ver mais resultados" : "As advertências da sua equipe aparecerão aqui"}
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
        <TeamWarningFilterModal visible={filterModalVisible} onClose={() => setFilterModalVisible(false)} onApply={handleApplyFilters} currentFilters={filters} teamMembers={teamMembers} />
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
