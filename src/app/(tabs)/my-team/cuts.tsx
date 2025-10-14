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
import { TeamCutTable } from "@/components/my-team/cut/team-cut-table";
import { TeamCutFilterModal, type TeamCutFilters } from "@/components/my-team/cut/team-cut-filter-modal";
import { useTeamCutsInfiniteMobile } from "@/hooks/use-team-cuts-infinite-mobile";
import { useAuth } from '../../../hooks';
import { IconScissors, IconFilter, IconPlus } from "@tabler/icons-react-native";
import { useTheme } from "@/lib/theme";

export default function MyTeamCutsScreen() {
  const { colors } = useTheme();
  const { user: currentUser, isLoading: isLoadingAuth } = useAuth();
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [filters, setFilters] = useState<TeamCutFilters>({});

  // Build query params for cuts
  const queryParams = useMemo(() => {
    const params: any = {
      include: {
        file: {
          include: {
            task: {
              include: {
                user: {
                  include: {
                    sector: true,
                  },
                },
              },
            },
          },
        },
        task: {
          include: {
            user: {
              include: {
                sector: true,
              },
            },
          },
        },
        parentCut: true,
        childCuts: true,
      },
      where: {
        // Filter cuts based on tasks associated with users from the same sector
        OR: [
          {
            task: {
              user: {
                sectorId: currentUser?.sectorId,
              },
            },
          },
          {
            file: {
              task: {
                user: {
                  sectorId: currentUser?.sectorId,
                },
              },
            },
          },
        ],
      },
      orderBy: {
        createdAt: "desc",
      },
    };

    // Apply filters
    if (filters.statuses && filters.statuses.length > 0) {
      params.where.status = {
        in: filters.statuses,
      };
    }

    if (filters.types && filters.types.length > 0) {
      params.where.type = {
        in: filters.types,
      };
    }

    if (filters.origins && filters.origins.length > 0) {
      params.where.origin = {
        in: filters.origins,
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

  // Fetch cuts with infinite scroll
  const {
    data: cuts,
    isLoading: isLoadingCuts,
    error: cutsError,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
    refetch: refetchCuts,
  } = useTeamCutsInfiniteMobile({
    ...queryParams,
    enabled: !!currentUser?.sectorId,
  });

  const handleApplyFilters = useCallback((newFilters: TeamCutFilters) => {
    setFilters(newFilters);
    setFilterModalVisible(false);
  }, []);

  const handleCutPress = useCallback((cutId: string) => {
    // Navigate to cut details if available
    // router.push(`/production/cutting/details/${cutId}` as any);
  }, []);

  const handleRequestCut = useCallback(() => {
    // Navigate to cut request form
    router.push(`/production/cutting/cutting-request/create` as any);
  }, []);

  const handleRefresh = async () => {
    await refetchCuts();
  };

  const handleLoadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const isLoading = isLoadingAuth || isLoadingCuts;

  if (isLoading && cuts.length === 0) {
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
          <EmptyState icon="alert-circle" title="Setor não encontrado" description="Você precisa estar associado a um setor para visualizar os recortes da equipe" />
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
            <IconScissors size={24} color={colors.primary} />
            <ThemedText style={styles.title}>Recortes da Equipe</ThemedText>
          </View>
          <View style={styles.headerActions}>
            <Button variant="outline" size="sm" onPress={() => setFilterModalVisible(true)} style={styles.filterButton}>
              <IconFilter size={18} color={colors.text} />
              {activeFilterCount > 0 && (
                <View style={[styles.filterBadge, { backgroundColor: colors.primary }]}>
                  <ThemedText style={styles.filterBadgeText}>{activeFilterCount}</ThemedText>
                </View>
              )}
            </Button>
            <Button size="sm" onPress={handleRequestCut} style={styles.requestButton}>
              <IconPlus size={18} color="#fff" />
            </Button>
          </View>
        </View>

        <ThemedText style={styles.description}>Visualize os recortes da equipe e solicite novos recortes</ThemedText>

        {/* Cut Table */}
        {cuts.length > 0 ? (
          <TeamCutTable cuts={cuts} onCutPress={handleCutPress} onRefresh={handleRefresh} refreshing={isLoadingCuts} loading={isLoadingCuts} />
        ) : (
          <EmptyState
            icon="scissors"
            title="Nenhum recorte encontrado"
            description={activeFilterCount > 0 ? "Tente ajustar os filtros para ver mais resultados" : "Os recortes da sua equipe aparecerão aqui"}
            action={
              activeFilterCount > 0
                ? {
                    label: "Limpar Filtros",
                    onPress: () => setFilters({}),
                  }
                : {
                    label: "Solicitar Recorte",
                    onPress: handleRequestCut,
                  }
            }
          />
        )}

        {/* Filter Modal */}
        <TeamCutFilterModal visible={filterModalVisible} onClose={() => setFilterModalVisible(false)} onApply={handleApplyFilters} currentFilters={filters} />
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
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    marginLeft: 8,
  },
  filterButton: {
    position: "relative",
  },
  requestButton: {
    paddingHorizontal: 12,
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
