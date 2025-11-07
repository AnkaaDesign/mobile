import { useState, useMemo, useCallback } from "react";
import { View, StyleSheet } from "react-native";

import { PrivilegeGuard } from "@/components/privilege-guard";
import { SECTOR_PRIVILEGES } from '../../../constants';
import { ThemedView } from "@/components/ui/themed-view";
import { ThemedText } from "@/components/ui/themed-text";
import { Button } from "@/components/ui/button";
import { Loading } from "@/components/ui/loading";
import { EmptyState } from "@/components/ui/empty-state";
import { TeamBorrowStatsCard } from "@/components/my-team/borrow/team-borrow-stats-card";
import { TeamBorrowTable } from "@/components/my-team/borrow/team-borrow-table";
import { TeamBorrowFilterTags } from "@/components/my-team/borrow/team-borrow-filter-tags";
import { useBorrowsInfiniteMobile } from "@/hooks";
import { useAuth } from '../../../contexts/auth-context';
import { IconPackage, IconFilter } from "@tabler/icons-react-native";
import { useTheme } from "@/lib/theme";
import type { User } from '../../../types';
import { SlideInPanel } from "@/components/ui/slide-in-panel";
import { TeamBorrowFilterDrawerContent } from "@/components/my-team/borrow/team-borrow-filter-drawer-content";

export type TeamBorrowFilters = {
  userIds?: string[];
  statuses?: string[];
  startDate?: Date;
  endDate?: Date;
  returnStartDate?: Date;
  returnEndDate?: Date;
};

export default function MyTeamLoansScreen() {
  const { colors } = useTheme();
  const { user: currentUser, isLoading: isLoadingAuth } = useAuth();
  const [filters, setFilters] = useState<TeamBorrowFilters>({});
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);

  // Build query params for borrows
  const queryParams = useMemo(() => {
    const params: any = {
      include: {
        item: {
          include: {
            brand: true,
            category: true,
            supplier: true,
          },
        },
        user: {
          include: {
            position: true,
            sector: true,
          },
        },
      },
      where: {
        // Only show borrows for users in the same sector
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

    if (filters.startDate || filters.endDate) {
      params.where.createdAt = {};
      if (filters.startDate) {
        params.where.createdAt.gte = filters.startDate;
      }
      if (filters.endDate) {
        params.where.createdAt.lte = filters.endDate;
      }
    }

    if (filters.returnStartDate || filters.returnEndDate) {
      params.where.returnedAt = {};
      if (filters.returnStartDate) {
        params.where.returnedAt.gte = filters.returnStartDate;
      }
      if (filters.returnEndDate) {
        params.where.returnedAt.lte = filters.returnEndDate;
      }
    }

    return params;
  }, [currentUser?.sectorId, filters]);

  // Fetch borrows with infinite scroll
  const {
    items: borrows,
    isLoading: isLoadingBorrows,
    error: _error,
    refetch: refetchBorrows,
  } = useBorrowsInfiniteMobile({
    ...queryParams,
    enabled: !!currentUser?.sectorId,
  });

  // Get unique team members for filter
  const teamMembers = useMemo(() => {
    const members = new Map<string, User>();
    borrows.forEach((borrow: any /* TODO: Add proper type */) => {
      if (borrow.user && !members.has(borrow.user.id)) {
        members.set(borrow.user.id, borrow.user);
      }
    });
    return Array.from(members.values());
  }, [borrows]);

  const handleApplyFilters = useCallback((newFilters: TeamBorrowFilters) => {
    setFilters(newFilters);
  }, []);

  const handleClearFilters = useCallback(() => {
    setFilters({});
  }, []);

  const handleRemoveFilter = useCallback((filterKey: keyof TeamBorrowFilters, value?: string) => {
    setFilters((prev) => {
      const newFilters = { ...prev };

      if (value && (filterKey === "userIds" || filterKey === "statuses")) {
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

  const handleBorrowPress = useCallback((_borrowId: string) => {
    // Navigate to borrow details if needed
    // router.push(`/inventory/borrows/details/${_borrowId}`);
  }, []);

  const handleRefresh = async () => {
    await refetchBorrows();
  };


  const isLoading = isLoadingAuth || isLoadingBorrows;

  if (isLoading && borrows.length === 0) {
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
          <EmptyState icon="alert-circle" title="Setor não encontrado" description="Você precisa estar associado a um setor para visualizar os empréstimos da equipe" />
        </ThemedView>
      </PrivilegeGuard>
    );
  }

  const activeFilterCount = Object.values(filters).filter((v) => {
    if (Array.isArray(v)) return v.length > 0;
    return v !== undefined && v !== "";
  }).length;

  const handleOpenFilters = useCallback(() => {
    setIsFilterPanelOpen(true);
  }, []);

  const handleCloseFilters = useCallback(() => {
    setIsFilterPanelOpen(false);
  }, []);

  return (
    <PrivilegeGuard requiredPrivilege={SECTOR_PRIVILEGES.LEADER}>
      <>
        <ThemedView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <IconPackage size={24} color={colors.primary} />
            <ThemedText style={styles.title}>Empréstimos da Equipe</ThemedText>
          </View>
          <Button variant="outline" size="sm" onPress={handleOpenFilters} style={styles.filterButton}>
            <IconFilter size={18} color={colors.text} />
            {activeFilterCount > 0 && (
              <View style={[styles.filterBadge, { backgroundColor: colors.primary }]}>
                <ThemedText style={styles.filterBadgeText}>{activeFilterCount}</ThemedText>
              </View>
            )}
          </Button>
        </View>

        <ThemedText style={styles.description}>Visualize e gerencie os empréstimos dos colaboradores do seu setor</ThemedText>

        {/* Filter Tags */}
        {activeFilterCount > 0 && <TeamBorrowFilterTags filters={filters} onRemoveFilter={handleRemoveFilter} teamMembers={teamMembers} />}

        {/* Stats Card */}
        {borrows.length > 0 && <TeamBorrowStatsCard borrows={borrows} />}

        {/* Borrow Table */}
        {borrows.length > 0 ? (
          <TeamBorrowTable borrows={borrows} onBorrowPress={handleBorrowPress} onRefresh={handleRefresh} refreshing={isLoadingBorrows} loading={isLoadingBorrows} />
        ) : (
          <EmptyState
            icon="package"
            title="Nenhum empréstimo encontrado"
            description={activeFilterCount > 0 ? "Tente ajustar os filtros para ver mais resultados" : "Os empréstimos da sua equipe aparecerão aqui"}
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
      </ThemedView>

      <SlideInPanel isOpen={isFilterPanelOpen} onClose={handleCloseFilters}>
        <TeamBorrowFilterDrawerContent
          filters={filters}
          onFiltersChange={handleApplyFilters}
          onClear={handleClearFilters}
          activeFiltersCount={activeFilterCount}
          teamMembers={teamMembers}
        />
      </SlideInPanel>
      </>
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
