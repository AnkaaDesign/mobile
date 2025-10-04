import React, { useState, useCallback, useMemo } from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { IconFilter } from "@tabler/icons-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useCommissionMutations } from '../../../../hooks';
import { useCommissionsInfiniteMobile } from "@/hooks";
import type { CommissionGetManyFormData } from '../../../../schemas';
import { ThemedView, ThemedText, ErrorScreen, EmptyState, SearchBar, Badge, Card } from "@/components/ui";
import { CommissionTable } from "@/components/administration/commission/list/commission-table";
import { CommissionFilterModal } from "@/components/administration/commission/list/commission-filter-modal";
import { CommissionFilterTags } from "@/components/administration/commission/list/commission-filter-tags";
import { CommissionListSkeleton } from "@/components/administration/commission/skeleton/commission-list-skeleton";
import { TableErrorBoundary } from "@/components/ui/table-error-boundary";
import { ItemsCountDisplay } from "@/components/ui/items-count-display";
import { useTheme } from "@/lib/theme";
import { routes, COMMISSION_STATUS_LABELS } from '../../../../constants';
import { routeToMobilePath } from "@/lib/route-mapper";
import { formatCurrency } from '../../../../utils';

export default function CommissionListScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [displaySearchText, setDisplaySearchText] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<Partial<CommissionGetManyFormData>>({});

  // Build query parameters
  const queryParams = useMemo(
    () => ({
      orderBy: { createdAt: "desc" as const },
      ...(searchText ? { searchingFor: searchText } : {}),
      ...filters,
      include: {
        user: true,
        task: true,
      },
    }),
    [searchText, filters],
  );

  const {
    commissions,
    isLoading,
    error,
    refetch,
    isRefetching,
    loadMore,
    canLoadMore,
    isFetchingNextPage,
    totalItemsLoaded,
    refresh,
  } = useCommissionsInfiniteMobile(queryParams);

  const { delete: deleteCommission } = useCommissionMutations();

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refresh();
    } finally {
      setRefreshing(false);
    }
  }, [refresh]);

  const handleCommissionPress = (commissionId: string) => {
    router.push(routeToMobilePath(routes.administration.commissions.details(commissionId)) as any);
  };

  const handleEditCommission = (commissionId: string) => {
    router.push(routeToMobilePath(routes.administration.commissions.edit(commissionId)) as any);
  };

  const handleDeleteCommission = useCallback(
    async (commissionId: string) => {
      try {
        await deleteCommission(commissionId);
      } catch (error) {
        console.error("Failed to delete commission:", error);
      }
    },
    [deleteCommission],
  );

  const handleSearch = useCallback((text: string) => {
    setSearchText(text);
  }, []);

  const handleDisplaySearchChange = useCallback((text: string) => {
    setDisplaySearchText(text);
  }, []);

  const handleApplyFilters = useCallback((newFilters: Partial<CommissionGetManyFormData>) => {
    setFilters(newFilters);
    setShowFilters(false);
  }, []);

  const handleClearFilters = useCallback(() => {
    setFilters({});
    setSearchText("");
    setDisplaySearchText("");
  }, []);

  // Count active filters
  const activeFiltersCount = Object.entries(filters).filter(
    ([key, value]) => value !== undefined && value !== null && (Array.isArray(value) ? value.length > 0 : true),
  ).length;

  // Calculate statistics
  const statistics = useMemo(() => {
    if (!Array.isArray(commissions) || commissions.length === 0) {
      return {
        totalCommissions: 0,
        fullCommission: 0,
        partialCommission: 0,
        suspendedCommission: 0,
        noCommission: 0,
      };
    }

    return {
      totalCommissions: commissions.length,
      fullCommission: commissions.filter((c) => c.status === "FULL_COMMISSION").length,
      partialCommission: commissions.filter((c) => c.status === "PARTIAL_COMMISSION").length,
      suspendedCommission: commissions.filter((c) => c.status === "SUSPENDED_COMMISSION").length,
      noCommission: commissions.filter((c) => c.status === "NO_COMMISSION").length,
    };
  }, [commissions]);

  if (isLoading && !isRefetching) {
    return <CommissionListSkeleton />;
  }

  if (error) {
    return (
      <ThemedView style={styles.container}>
        <ErrorScreen message="Erro ao carregar comissões" detail={error.message} onRetry={handleRefresh} />
      </ThemedView>
    );
  }

  const hasCommissions = Array.isArray(commissions) && commissions.length > 0;

  return (
    <ThemedView style={[styles.container, { backgroundColor: colors.background, paddingBottom: insets.bottom }]}>
      {/* Search and Filter */}
      <View style={styles.searchContainer}>
        <SearchBar
          value={displaySearchText}
          onChangeText={handleDisplaySearchChange}
          onSearch={handleSearch}
          placeholder="Buscar comissões..."
          style={styles.searchBar}
          debounceMs={300}
        />
        <View style={styles.buttonContainer}>
          <Pressable
            style={({ pressed }) => [
              styles.actionButton,
              {
                backgroundColor: colors.card,
                borderWidth: 1,
                borderColor: colors.border,
              },
              pressed && styles.actionButtonPressed,
            ]}
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

      {/* Filter tags */}
      <CommissionFilterTags
        filters={filters}
        searchText={searchText}
        onFilterChange={handleApplyFilters}
        onSearchChange={(text) => {
          setSearchText(text);
          setDisplaySearchText(text);
        }}
        onClearAll={handleClearFilters}
      />

      {/* Statistics Cards */}
      {hasCommissions && (
        <View style={styles.statsContainer}>
          <Card style={[styles.statCard, { backgroundColor: colors.card }]}>
            <ThemedText style={styles.statValue}>{statistics.totalCommissions}</ThemedText>
            <ThemedText style={styles.statLabel}>Total</ThemedText>
          </Card>
          <Card style={[styles.statCard, { backgroundColor: colors.card }]}>
            <ThemedText style={[styles.statValue, { color: "#10b981" }]}>{statistics.fullCommission}</ThemedText>
            <ThemedText style={styles.statLabel}>Integral</ThemedText>
          </Card>
          <Card style={[styles.statCard, { backgroundColor: colors.card }]}>
            <ThemedText style={[styles.statValue, { color: "#f59e0b" }]}>{statistics.partialCommission}</ThemedText>
            <ThemedText style={styles.statLabel}>Parcial</ThemedText>
          </Card>
          <Card style={[styles.statCard, { backgroundColor: colors.card }]}>
            <ThemedText style={[styles.statValue, { color: "#ef4444" }]}>{statistics.suspendedCommission}</ThemedText>
            <ThemedText style={styles.statLabel}>Suspensa</ThemedText>
          </Card>
        </View>
      )}

      {hasCommissions ? (
        <TableErrorBoundary onRetry={handleRefresh}>
          <CommissionTable
            commissions={commissions}
            onCommissionPress={handleCommissionPress}
            onCommissionEdit={handleEditCommission}
            onCommissionDelete={handleDeleteCommission}
            onRefresh={handleRefresh}
            onEndReached={canLoadMore ? loadMore : undefined}
            refreshing={refreshing}
            loading={isLoading && !isRefetching}
            loadingMore={isFetchingNextPage}
            enableSwipeActions={true}
          />
        </TableErrorBoundary>
      ) : (
        <View style={styles.emptyContainer}>
          <EmptyState
            icon={searchText ? "search" : "cash-multiple"}
            title={searchText ? "Nenhuma comissão encontrada" : "Nenhuma comissão cadastrada"}
            description={searchText ? `Nenhum resultado para "${searchText}"` : "As comissões dos colaboradores aparecerão aqui"}
          />
        </View>
      )}

      {/* Items count */}
      {hasCommissions && <ItemsCountDisplay loadedCount={totalItemsLoaded} totalCount={undefined} isLoading={isFetchingNextPage} />}

      {/* Filter Modal */}
      <CommissionFilterModal visible={showFilters} onClose={() => setShowFilters(false)} onApply={handleApplyFilters} currentFilters={filters} />
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
  actionButtonPressed: {
    opacity: 0.8,
  },
  statsContainer: {
    flexDirection: "row",
    paddingHorizontal: 8,
    paddingBottom: 8,
    gap: 8,
  },
  statCard: {
    flex: 1,
    padding: 12,
    alignItems: "center",
    borderRadius: 12,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    opacity: 0.7,
    textAlign: "center",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
