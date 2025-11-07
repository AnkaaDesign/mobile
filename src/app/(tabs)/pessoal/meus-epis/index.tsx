import React, { useState, useCallback, useMemo } from "react";
import { View, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { IconFilter, IconList, IconPlus } from "@tabler/icons-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { usePpeDeliveriesInfiniteMobile } from '@/hooks/use-ppe-deliveries-infinite-mobile';

import { ThemedView, ErrorScreen, EmptyState, ListActionButton, SearchBar } from "@/components/ui";
import { MyPpeDeliveryTable, createColumnDefinitions } from "@/components/personal/ppe-delivery/my-ppe-delivery-table";
import { MyPpeDeliveryFilterTags } from "@/components/personal/ppe-delivery/my-ppe-delivery-filter-tags";
import { TableErrorBoundary } from "@/components/ui/table-error-boundary";
import { ItemsCountDisplay } from "@/components/ui/items-count-display";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { useTheme } from "@/lib/theme";
import { FAB } from "@/components/ui/fab";
import { Card } from "@/components/ui/card";
import { ThemedText } from "@/components/ui/themed-text";
import { Badge } from "@/components/ui/badge";

// New hooks and components
import { useTableSort } from "@/hooks/useTableSort";
import { useColumnVisibility } from "@/hooks/useColumnVisibility";

// Import slide panel components
import { SlideInPanel } from "@/components/ui/slide-in-panel";
import { MyPpeDeliveryFilterDrawerContent } from "@/components/personal/ppe-delivery/my-ppe-delivery-filter-drawer-content";
import { MyPpeDeliveryColumnDrawerContent } from "@/components/personal/ppe-delivery/my-ppe-delivery-column-drawer-content";
import { useAuth } from "@/contexts/auth-context";
import { PPE_DELIVERY_STATUS } from '@/constants';
import { spacing } from "@/constants/design-system";

export default function MyPPEIndexScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [displaySearchText, setDisplaySearchText] = useState("");
  const searchInputRef = React.useRef<any>(null);

  // Slide panel state
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [isColumnPanelOpen, setIsColumnPanelOpen] = useState(false);

  // Filter state
  const [filters, setFilters] = useState<{
    status?: string[];
    ppeTypes?: string[];
    deliveryDateRange?: { start?: Date; end?: Date };
  }>({});

  const { sortConfigs, handleSort, buildOrderBy } = useTableSort(
    [{ columnKey: "actualDeliveryDate", direction: "desc", order: 0 }],
    1, // Single column sort only
    false
  );

  const {
    visibleColumns,
    setVisibleColumns,
  } = useColumnVisibility(
    "myPpeDeliveries",
    ["itemName", "quantity", "deliveryDate", "status"],
    ["itemName", "quantity", "deliveryDate", "reviewedBy", "status", "ca", "validity"]
  );

  // Build API query
  const buildWhereClause = useCallback(() => {
    const where: any = {
      userId: user?.id, // Only show current user's PPE deliveries
    };

    if (filters.status?.length) {
      where.status = { in: filters.status };
    }

    if (filters.ppeTypes?.length) {
      where.item = {
        ppeType: { in: filters.ppeTypes }
      };
    }

    if (filters.deliveryDateRange?.start || filters.deliveryDateRange?.end) {
      where.OR = [];

      if (filters.deliveryDateRange.start || filters.deliveryDateRange.end) {
        const actualDeliveryDate: any = {};
        if (filters.deliveryDateRange.start) {
          actualDeliveryDate.gte = filters.deliveryDateRange.start;
        }
        if (filters.deliveryDateRange.end) {
          actualDeliveryDate.lte = filters.deliveryDateRange.end;
        }
        where.OR.push({ actualDeliveryDate });
      }

      if (filters.deliveryDateRange.start || filters.deliveryDateRange.end) {
        const scheduledDate: any = {};
        if (filters.deliveryDateRange.start) {
          scheduledDate.gte = filters.deliveryDateRange.start;
        }
        if (filters.deliveryDateRange.end) {
          scheduledDate.lte = filters.deliveryDateRange.end;
        }
        where.OR.push({ scheduledDate });
      }
    }

    return where;
  }, [filters, user?.id]);

  const queryParams = useMemo(() => ({
    orderBy: buildOrderBy(
      {
        itemName: "item.name",
        quantity: "quantity",
        deliveryDate: "actualDeliveryDate",
        reviewedBy: "reviewedByUser.name",
        status: "status",
      },
      { actualDeliveryDate: "desc" }
    ),
    ...(searchText ? { searchingFor: searchText } : {}),
    where: buildWhereClause(),
    include: {
      user: true,
      reviewedByUser: true,
      item: {
        include: {
          category: true,
          brand: true,
        }
      },
      ppeSchedule: true,
    },
  }), [searchText, buildWhereClause, buildOrderBy]);

  const {
    deliveries,
    isLoading,
    error,
    isRefetching,
    loadMore,
    canLoadMore,
    isFetchingNextPage,
    totalItemsLoaded,
    totalCount,
    refresh,
  } = usePpeDeliveriesInfiniteMobile(queryParams);

  // Calculate stats
  const stats = useMemo(() => {
    const total = totalCount || 0;
    const pending = deliveries.filter((d) => d.status === PPE_DELIVERY_STATUS.PENDING).length;
    const delivered = deliveries.filter((d) => d.status === PPE_DELIVERY_STATUS.DELIVERED).length;

    return { total, pending, delivered };
  }, [deliveries, totalCount]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refresh();
    } finally {
      setRefreshing(false);
    }
  }, [refresh]);

  const handleDeliveryPress = (deliveryId: string) => {
    router.push(`/pessoal/meus-epis/detalhes/${deliveryId}` as any);
  };

  const handleSearch = useCallback((text: string) => {
    setSearchText(text);
  }, []);

  const handleDisplaySearchChange = useCallback((text: string) => {
    setDisplaySearchText(text);
  }, []);

  const handleClearFilters = useCallback(() => {
    setFilters({});
    setSearchText("");
    setDisplaySearchText("");
  }, []);

  const handleColumnsChange = useCallback((newColumns: Set<string>) => {
    setVisibleColumns(newColumns);
  }, [setVisibleColumns]);

  const handleOpenFilters = useCallback(() => {
    setIsColumnPanelOpen(false); // Close column panel if open
    setIsFilterPanelOpen(true);
  }, []);

  const handleCloseFilters = useCallback(() => {
    setIsFilterPanelOpen(false);
  }, []);

  const handleOpenColumns = useCallback(() => {
    setIsFilterPanelOpen(false); // Close filter panel if open
    setIsColumnPanelOpen(true);
  }, []);

  const handleCloseColumns = useCallback(() => {
    setIsColumnPanelOpen(false);
  }, []);

  const handleRequestPPE = () => {
    router.push("/pessoal/meus-epis/request" as any);
  };

  // Get all column definitions
  const allColumns = useMemo(() => createColumnDefinitions(), []);

  // Count active filters
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.status?.length) count++;
    if (filters.ppeTypes?.length) count++;
    if (filters.deliveryDateRange?.start) count++;
    if (filters.deliveryDateRange?.end) count++;
    return count;
  }, [filters]);

  // Only show skeleton on initial load
  const isInitialLoad = isLoading && deliveries.length === 0;

  if (isInitialLoad) {
    return <LoadingScreen />;
  }

  if (error && deliveries.length === 0) {
    return (
      <ThemedView style={styles.container}>
        <ErrorScreen message="Erro ao carregar entregas de EPI" detail={error.message} onRetry={handleRefresh} />
      </ThemedView>
    );
  }

  const hasDeliveries = Array.isArray(deliveries) && deliveries.length > 0;

  return (
    <>
      <ThemedView style={[styles.container, { backgroundColor: colors.background, paddingBottom: insets.bottom }]}>
        {/* Stats Card */}
        <View style={styles.statsContainer}>
          <Card style={styles.statsCard}>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <ThemedText style={styles.statValue}>{stats.total}</ThemedText>
                <ThemedText style={styles.statLabel}>Total</ThemedText>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Badge variant="warning">
                  <ThemedText style={styles.statValue}>{stats.pending}</ThemedText>
                </Badge>
                <ThemedText style={styles.statLabel}>Pendentes</ThemedText>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Badge variant="success">
                  <ThemedText style={styles.statValue}>{stats.delivered}</ThemedText>
                </Badge>
                <ThemedText style={styles.statLabel}>Entregues</ThemedText>
              </View>
            </View>
          </Card>
        </View>

        {/* Search and Filter */}
        <View style={[styles.searchContainer]}>
          <SearchBar
            ref={searchInputRef}
            value={displaySearchText}
            onChangeText={handleDisplaySearchChange}
            onSearch={handleSearch}
            placeholder="Buscar EPIs..."
            style={styles.searchBar}
            debounceMs={300}
            loading={isRefetching && !isFetchingNextPage}
          />
          <View style={styles.buttonContainer}>
            <ListActionButton
              icon={<IconList size={20} color={colors.foreground} />}
              onPress={handleOpenColumns}
              badgeCount={visibleColumns.size}
              badgeVariant="primary"
            />
            <ListActionButton
              icon={<IconFilter size={20} color={colors.foreground} />}
              onPress={handleOpenFilters}
              badgeCount={activeFiltersCount}
              badgeVariant="destructive"
              showBadge={activeFiltersCount > 0}
            />
          </View>
        </View>

        {/* Individual filter tags */}
        <MyPpeDeliveryFilterTags
          filters={filters}
          searchText={searchText}
          onFilterChange={setFilters}
          onSearchChange={(text) => {
            setSearchText(text);
            setDisplaySearchText(text);
          }}
          onClearAll={handleClearFilters}
        />

        {hasDeliveries ? (
          <TableErrorBoundary onRetry={handleRefresh}>
            <MyPpeDeliveryTable
              deliveries={deliveries}
              onDeliveryPress={handleDeliveryPress}
              onRefresh={handleRefresh}
              onEndReached={canLoadMore ? loadMore : undefined}
              refreshing={refreshing || isRefetching}
              loading={false}
              loadingMore={isFetchingNextPage}
              sortConfigs={sortConfigs}
              onSort={(configs) => {
                if (configs.length === 0) {
                  handleSort("actualDeliveryDate");
                } else {
                  handleSort(configs[0].columnKey);
                }
              }}
              visibleColumnKeys={Array.from(visibleColumns) as string[]}
            />
          </TableErrorBoundary>
        ) : (
          <View style={styles.emptyContainer}>
            <EmptyState
              icon={searchText ? "search" : "package"}
              title={searchText ? "Nenhuma entrega encontrada" : "Nenhuma entrega de EPI"}
              description={
                searchText ? `Nenhum resultado para "${searchText}"` : "Você ainda não possui entregas de EPI registradas"
              }
            />
          </View>
        )}

        {/* Items count */}
        {hasDeliveries && <ItemsCountDisplay loadedCount={totalItemsLoaded} totalCount={totalCount} isLoading={isFetchingNextPage} />}
      </ThemedView>

      {/* FAB for requesting new PPE */}
      <FAB icon={<IconPlus size={24} color={colors.primaryForeground} />} onPress={handleRequestPPE} />

      {/* Slide-in panels */}
      <SlideInPanel isOpen={isFilterPanelOpen} onClose={handleCloseFilters}>
        <MyPpeDeliveryFilterDrawerContent
          filters={filters}
          onFiltersChange={setFilters}
          onClear={handleClearFilters}
          activeFiltersCount={activeFiltersCount}
        />
      </SlideInPanel>

      <SlideInPanel isOpen={isColumnPanelOpen} onClose={handleCloseColumns}>
        <MyPpeDeliveryColumnDrawerContent
          columns={allColumns}
          visibleColumns={visibleColumns}
          onVisibilityChange={handleColumnsChange}
        />
      </SlideInPanel>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  statsContainer: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
  },
  statsCard: {
    padding: spacing.md,
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
  },
  statItem: {
    flex: 1,
    alignItems: "center",
    gap: spacing.xs,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: "#e5e5e5",
  },
  statValue: {
    fontSize: 24,
    fontWeight: "bold",
  },
  statLabel: {
    fontSize: 12,
    color: "#666",
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
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
