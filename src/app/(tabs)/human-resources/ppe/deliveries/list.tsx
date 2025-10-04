import React, { useState, useCallback, useMemo } from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { IconPlus, IconFilter, IconPackage } from "@tabler/icons-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { usePpeDeliveryMutations } from '../../../../../hooks';
import { usePpeDeliveriesInfiniteMobile } from "@/hooks";
import type { PpeDeliveryGetManyFormData } from '../../../../../schemas';
import { ThemedView, ThemedText, FAB, ErrorScreen, EmptyState, SearchBar, Badge } from "@/components/ui";
import { PpeDeliveryTable } from "@/components/human-resources/ppe/delivery/list/ppe-delivery-table";
import { PpeDeliveryFilterModal } from "@/components/human-resources/ppe/delivery/list/ppe-delivery-filter-modal";
import { PpeDeliveryFilterTags } from "@/components/human-resources/ppe/delivery/list/ppe-delivery-filter-tags";
import { PpeDeliveryListSkeleton } from "@/components/human-resources/ppe/delivery/skeleton/ppe-delivery-list-skeleton";
import { TableErrorBoundary } from "@/components/ui/table-error-boundary";
import { ItemsCountDisplay } from "@/components/ui/items-count-display";
import { useTheme } from "@/lib/theme";
import { routes } from '../../../../../constants';
import { routeToMobilePath } from "@/lib/route-mapper";
import { PPE_DELIVERY_STATUS } from '../../../../../constants';

export default function PpeDeliveriesListScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [displaySearchText, setDisplaySearchText] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<Partial<PpeDeliveryGetManyFormData>>({});

  // Build query parameters
  const queryParams = useMemo(() => {
    return {
      orderBy: { actualDeliveryDate: "desc" as const },
      ...(searchText ? { searchingFor: searchText } : {}),
      ...filters,
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
          },
        },
        reviewedByUser: true,
      },
    };
  }, [searchText, filters]);

  const { deliveries, isLoading, error, refetch, isRefetching, loadMore, canLoadMore, isFetchingNextPage, totalItemsLoaded, refresh } = usePpeDeliveriesInfiniteMobile(queryParams);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refresh();
    } finally {
      setRefreshing(false);
    }
  }, [refresh]);

  const handleCreateDelivery = () => {
    router.push(routeToMobilePath(routes.humanResources.ppe.deliveries.create) as any);
  };

  const handleDeliveryPress = (deliveryId: string) => {
    router.push(routeToMobilePath(routes.humanResources.ppe.deliveries.details(deliveryId)) as any);
  };

  const handleSearch = useCallback((text: string) => {
    setSearchText(text);
  }, []);

  const handleDisplaySearchChange = useCallback((text: string) => {
    setDisplaySearchText(text);
  }, []);

  const handleApplyFilters = useCallback((newFilters: Partial<PpeDeliveryGetManyFormData>) => {
    setFilters(newFilters);
    setShowFilters(false);
  }, []);

  const handleClearFilters = useCallback(() => {
    setFilters({});
    setSearchText("");
    setDisplaySearchText("");
  }, []);

  // Count active filters
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.statuses?.length) count++;
    if (filters.userIds?.length) count++;
    if (filters.itemIds?.length) count++;
    if (filters.dateRange?.startDate || filters.dateRange?.endDate) count++;
    if (filters.isSigned !== undefined) count++;
    return count;
  }, [filters]);

  // Calculate statistics
  const statistics = useMemo(() => {
    const total = deliveries.length;
    const signed = deliveries.filter((d) => d.status === PPE_DELIVERY_STATUS.DELIVERED && d.actualDeliveryDate).length;
    const unsigned = deliveries.filter((d) => d.status === PPE_DELIVERY_STATUS.PENDING || d.status === PPE_DELIVERY_STATUS.APPROVED).length;

    return { total, signed, unsigned };
  }, [deliveries]);

  if (isLoading && !isRefetching) {
    return <PpeDeliveryListSkeleton />;
  }

  if (error) {
    return (
      <ThemedView style={styles.container}>
        <ErrorScreen message="Erro ao carregar entregas de EPI" detail={error.message} onRetry={handleRefresh} />
      </ThemedView>
    );
  }

  const hasDeliveries = Array.isArray(deliveries) && deliveries.length > 0;

  return (
    <ThemedView style={[styles.container, { backgroundColor: colors.background, paddingBottom: insets.bottom }]}>
      {/* Search and Filter */}
      <View style={styles.searchContainer}>
        <SearchBar value={displaySearchText} onChangeText={handleDisplaySearchChange} onSearch={handleSearch} placeholder="Buscar entregas..." style={styles.searchBar} debounceMs={300} />
        <Pressable
          style={({ pressed }) => [styles.filterButton, { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }, pressed && styles.filterButtonPressed]}
          onPress={() => setShowFilters(true)}
        >
          <IconFilter size={24} color={colors.foreground} />
          {activeFiltersCount > 0 && (
            <Badge style={styles.filterBadge} variant="destructive" size="sm">
              <ThemedText style={StyleSheet.flatten([styles.filterBadgeText, { color: "white" }])}>{activeFiltersCount}</ThemedText>
            </Badge>
          )}
        </Pressable>
      </View>

      {/* Individual filter tags */}
      <PpeDeliveryFilterTags
        filters={filters}
        searchText={searchText}
        onFilterChange={handleApplyFilters}
        onSearchChange={(text) => {
          setSearchText(text);
          setDisplaySearchText(text);
        }}
        onClearAll={handleClearFilters}
      />

      {/* Statistics */}
      {hasDeliveries && (
        <View style={[styles.statisticsContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.statItem}>
            <ThemedText style={styles.statValue}>{statistics.total}</ThemedText>
            <ThemedText style={styles.statLabel}>Total</ThemedText>
          </View>
          <View style={[styles.statSeparator, { backgroundColor: colors.border }]} />
          <View style={styles.statItem}>
            <ThemedText style={[styles.statValue, { color: "#10b981" }]}>{statistics.signed}</ThemedText>
            <ThemedText style={styles.statLabel}>Assinados</ThemedText>
          </View>
          <View style={[styles.statSeparator, { backgroundColor: colors.border }]} />
          <View style={styles.statItem}>
            <ThemedText style={[styles.statValue, { color: "#f59e0b" }]}>{statistics.unsigned}</ThemedText>
            <ThemedText style={styles.statLabel}>Pendentes</ThemedText>
          </View>
        </View>
      )}

      {hasDeliveries ? (
        <TableErrorBoundary onRetry={handleRefresh}>
          <PpeDeliveryTable
            deliveries={deliveries}
            onDeliveryPress={handleDeliveryPress}
            onRefresh={handleRefresh}
            refreshing={refreshing}
            isLoading={isLoading && !isRefetching}
            error={error}
            onEndReached={canLoadMore ? loadMore : () => {}}
            canLoadMore={canLoadMore}
            loadingMore={isFetchingNextPage}
          />
        </TableErrorBoundary>
      ) : (
        <View style={styles.emptyContainer}>
          <EmptyState
            icon="package"
            title={searchText ? "Nenhuma entrega encontrada" : "Nenhuma entrega registrada"}
            description={searchText ? `Nenhum resultado para "${searchText}"` : "Comece registrando a primeira entrega de EPI"}
            actionLabel={searchText ? undefined : "Registrar Entrega"}
            onAction={searchText ? undefined : handleCreateDelivery}
          />
        </View>
      )}

      {/* Items count */}
      {hasDeliveries && <ItemsCountDisplay loadedCount={totalItemsLoaded} totalCount={undefined} isLoading={isFetchingNextPage} />}

      {hasDeliveries && <FAB icon="plus" onPress={handleCreateDelivery} />}

      {/* Filter Modal */}
      <PpeDeliveryFilterModal visible={showFilters} onClose={() => setShowFilters(false)} onApply={handleApplyFilters} currentFilters={filters} />
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
  filterButton: {
    height: 48,
    width: 48,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  filterBadge: {
    position: "absolute",
    top: -6,
    right: -6,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  filterBadgeText: {
    fontSize: 10,
    fontWeight: "600",
  },
  filterButtonPressed: {
    opacity: 0.8,
  },
  statisticsContainer: {
    flexDirection: "row",
    marginHorizontal: 8,
    marginVertical: 8,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statValue: {
    fontSize: 20,
    fontWeight: "700",
  },
  statLabel: {
    fontSize: 12,
    opacity: 0.6,
    marginTop: 2,
  },
  statSeparator: {
    width: 1,
    marginVertical: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
