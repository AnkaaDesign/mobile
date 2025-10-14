import React, { useState, useMemo, useCallback } from "react";
import { View, StyleSheet } from "react-native";
import { router } from "expo-router";
import { ThemedView } from "@/components/ui/themed-view";
import { ThemedText } from "@/components/ui/themed-text";
import { Button } from "@/components/ui/button";
import { Loading } from "@/components/ui/loading";
import { EmptyState } from "@/components/ui/empty-state";
import { PersonalWarningStatsCard } from "@/components/personal/warning/personal-warning-stats-card";
import { PersonalWarningTable } from "@/components/personal/warning/personal-warning-table";
import { PersonalWarningFilterModal, type PersonalWarningFilters } from "@/components/personal/warning/personal-warning-filter-modal";
import { PersonalWarningFilterTags } from "@/components/personal/warning/personal-warning-filter-tags";
import { useWarningsInfiniteMobile } from "@/hooks";
import { useAuth } from '../../../hooks';
import { IconAlertTriangle, IconFilter } from "@tabler/icons-react-native";
import { useTheme } from "@/lib/theme";

export default function MyWarningsScreen() {
  const { colors } = useTheme();
  const { user: currentUser, isLoading: isLoadingAuth } = useAuth();
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [filters, setFilters] = useState<PersonalWarningFilters>({});

  // Build query params for warnings filtered by current user as collaborator
  const queryParams = useMemo(() => {
    if (!currentUser?.id) return null;

    const params: any = {
      include: {
        supervisor: true,
        collaborator: {
          include: {
            position: true,
            sector: true,
          },
        },
      },
      where: {
        // Filter to show only warnings where current user is the collaborator
        collaboratorId: currentUser.id,
      },
      orderBy: {
        createdAt: "desc",
      },
    };

    // Apply category filters
    if (filters.categories && filters.categories.length > 0) {
      params.where.category = {
        in: filters.categories,
      };
    }

    // Apply severity filters
    if (filters.severities && filters.severities.length > 0) {
      params.where.severity = {
        in: filters.severities,
      };
    }

    // Apply status filter
    if (filters.isActive !== undefined) {
      params.where.isActive = filters.isActive;
    }

    // Apply date range filters
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
  }, [currentUser?.id, filters]);

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
    enabled: !!currentUser?.id,
  });

  const handleApplyFilters = useCallback((newFilters: PersonalWarningFilters) => {
    setFilters(newFilters);
    setFilterModalVisible(false);
  }, []);

  const handleRemoveFilter = useCallback((filterKey: keyof PersonalWarningFilters, value?: string) => {
    setFilters((prev) => {
      const newFilters = { ...prev };

      if (value && (filterKey === "categories" || filterKey === "severities")) {
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
    router.push(`/human-resources/warning/details/${warningId}`);
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
      <ThemedView style={styles.container}>
        <Loading />
      </ThemedView>
    );
  }

  if (!currentUser?.id) {
    return (
      <ThemedView style={styles.container}>
        <EmptyState icon="alert-circle" title="Usuário não encontrado" description="Não foi possível identificar o usuário atual" />
      </ThemedView>
    );
  }

  if (warningsError) {
    return (
      <ThemedView style={styles.container}>
        <EmptyState
          icon="alert-triangle"
          title="Erro ao carregar advertências"
          description="Ocorreu um erro ao carregar suas advertências. Tente novamente."
          action={{
            label: "Tentar Novamente",
            onPress: handleRefresh,
          }}
        />
      </ThemedView>
    );
  }

  const activeFilterCount = Object.values(filters).filter((v) => {
    if (Array.isArray(v)) return v.length > 0;
    return v !== undefined && v !== "";
  }).length;

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <IconAlertTriangle size={24} color={colors.primary} />
          <ThemedText style={styles.title}>Minhas Advertências</ThemedText>
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

      <ThemedText style={styles.description}>Visualize seu histórico de advertências e acompanhe seu desempenho profissional</ThemedText>

      {/* Filter Tags */}
      {activeFilterCount > 0 && <PersonalWarningFilterTags filters={filters} onRemoveFilter={handleRemoveFilter} />}

      {/* Stats Card */}
      {warnings.length > 0 && <PersonalWarningStatsCard warnings={warnings} />}

      {/* Warning Table */}
      {warnings.length > 0 ? (
        <PersonalWarningTable warnings={warnings} onWarningPress={handleWarningPress} onRefresh={handleRefresh} refreshing={isLoadingWarnings} loading={isLoadingWarnings} />
      ) : (
        <EmptyState
          icon="shield-check"
          title={activeFilterCount > 0 ? "Nenhuma advertência encontrada" : "Nenhuma advertência registrada"}
          description={
            activeFilterCount > 0
              ? "Tente ajustar os filtros para ver mais resultados"
              : "Parabéns! Você não possui advertências em seu histórico. Continue com o excelente trabalho!"
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
      <PersonalWarningFilterModal visible={filterModalVisible} onClose={() => setFilterModalVisible(false)} onApply={handleApplyFilters} currentFilters={filters} />
    </ThemedView>
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
