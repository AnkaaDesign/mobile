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
import { TeamPpeDeliveryTable } from "@/components/my-team/ppe-delivery/team-ppe-delivery-table";
import { TeamPpeDeliveryFilterModal, type TeamPpeDeliveryFilters } from "@/components/my-team/ppe-delivery/team-ppe-delivery-filter-modal";
import { useTeamPpeDeliveriesInfiniteMobile } from "@/hooks/use-team-ppe-deliveries-infinite-mobile";
import { useAuth } from '../../../hooks';
import { IconShieldCheck, IconFilter } from "@tabler/icons-react-native";
import { useTheme } from "@/lib/theme";
import type { User } from '../../../types';

export default function MyTeamPPEDeliveriesScreen() {
  const { colors } = useTheme();
  const { user: currentUser, isLoading: isLoadingAuth } = useAuth();
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [filters, setFilters] = useState<TeamPpeDeliveryFilters>({});

  // Build query params for PPE deliveries
  const queryParams = useMemo(() => {
    const params: any = {
      include: {
        user: {
          include: {
            position: true,
            sector: true,
          },
        },
        item: {
          include: {
            category: true,
            brand: true,
          },
        },
        reviewedByUser: true,
        ppeSchedule: true,
      },
      where: {
        // Only show deliveries for users in the same sector
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

    if (filters.statuses && filters.statuses.length > 0) {
      params.where.status = {
        in: filters.statuses,
      };
    }

    if (filters.hasScheduledDate !== undefined) {
      if (filters.hasScheduledDate) {
        params.where.scheduledDate = {
          not: null,
        };
      } else {
        params.where.scheduledDate = null;
      }
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

  // Fetch deliveries with infinite scroll
  const {
    data: deliveries,
    isLoading: isLoadingDeliveries,
    error: deliveriesError,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
    refetch: refetchDeliveries,
  } = useTeamPpeDeliveriesInfiniteMobile({
    ...queryParams,
    enabled: !!currentUser?.sectorId,
  });

  // Get unique team members for filter
  const teamMembers = useMemo(() => {
    const members = new Map<string, User>();
    deliveries.forEach((delivery) => {
      if (delivery.user && !members.has(delivery.user.id)) {
        members.set(delivery.user.id, delivery.user);
      }
    });
    return Array.from(members.values());
  }, [deliveries]);

  const handleApplyFilters = useCallback((newFilters: TeamPpeDeliveryFilters) => {
    setFilters(newFilters);
    setFilterModalVisible(false);
  }, []);

  const handleDeliveryPress = useCallback((deliveryId: string) => {
    router.push(`/human-resources/ppe/deliveries/details/${deliveryId}` as any);
  }, []);

  const handleRefresh = async () => {
    await refetchDeliveries();
  };

  const handleLoadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const isLoading = isLoadingAuth || isLoadingDeliveries;

  if (isLoading && deliveries.length === 0) {
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
          <EmptyState icon="alert-circle" title="Setor não encontrado" description="Você precisa estar associado a um setor para visualizar as entregas de EPI da equipe" />
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
            <IconShieldCheck size={24} color={colors.primary} />
            <ThemedText style={styles.title}>Entregas de EPI da Equipe</ThemedText>
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

        <ThemedText style={styles.description}>Visualize as entregas de EPIs dos colaboradores do seu setor (somente leitura)</ThemedText>

        {/* Delivery Table */}
        {deliveries.length > 0 ? (
          <TeamPpeDeliveryTable deliveries={deliveries} onDeliveryPress={handleDeliveryPress} onRefresh={handleRefresh} refreshing={isLoadingDeliveries} loading={isLoadingDeliveries} />
        ) : (
          <EmptyState
            icon="shield-check"
            title="Nenhuma entrega encontrada"
            description={activeFilterCount > 0 ? "Tente ajustar os filtros para ver mais resultados" : "As entregas de EPI da sua equipe aparecerão aqui"}
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
        <TeamPpeDeliveryFilterModal visible={filterModalVisible} onClose={() => setFilterModalVisible(false)} onApply={handleApplyFilters} currentFilters={filters} teamMembers={teamMembers} />
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
