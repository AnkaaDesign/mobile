import React, { useState, useCallback, useMemo } from "react";
import { View, StyleSheet, Alert } from "react-native";
import { useRouter } from "expo-router";
import { IconFilter, IconList } from "@tabler/icons-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/contexts/auth-context";
import { usePpeDeliveriesInfiniteMobile } from "@/hooks";
import { deletePpeDelivery } from "@/api-client";
// import { showToast } from "@/components/ui/toast";

import { ThemedView, ErrorScreen, EmptyState, ListActionButton, SearchBar } from "@/components/ui";
import { TeamPpeDeliveryTable, createColumnDefinitions } from "@/components/my-team/ppe-delivery/list/team-ppe-delivery-table";
import { TeamPpeDeliveryFilterTags } from "@/components/my-team/ppe-delivery/list/team-ppe-delivery-filter-tags";
import { TableErrorBoundary } from "@/components/ui/table-error-boundary";
import { ItemsCountDisplay } from "@/components/ui/items-count-display";
import { useTheme } from "@/lib/theme";
import { Card } from "@/components/ui/card";
import { ThemedText } from "@/components/ui/themed-text";
import { spacing, fontSize } from "@/constants/design-system";
import { IconShieldCheck } from "@tabler/icons-react-native";
import { isTeamLeader } from "@/utils/user";

// Import hooks and components
import { useTableSort } from "@/hooks/useTableSort";
import { useColumnVisibility } from "@/hooks/useColumnVisibility";

// Import slide panel components
import { SlideInPanel } from "@/components/ui/slide-in-panel";
import { TeamPpeDeliveryFilterDrawerContent } from "@/components/my-team/ppe-delivery/list/team-ppe-delivery-filter-drawer-content";
import { TeamPpeDeliveryColumnDrawerContent } from "@/components/my-team/ppe-delivery/list/team-ppe-delivery-column-drawer-content";

export default function TeamEPIsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { user: currentUser } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [displaySearchText, setDisplaySearchText] = useState("");
  const searchInputRef = React.useRef<any>(null);

  // Slide panel state
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [isColumnPanelOpen, setIsColumnPanelOpen] = useState(false);

  // Check if user is a team leader
  const userIsTeamLeader = currentUser ? isTeamLeader(currentUser) : false;
  const managedSectorId = currentUser?.managedSector?.id;

  // Filter state
  const [filters, setFilters] = useState<{
    status?: string[];
    itemName?: string;
    userName?: string;
    deliveryDateStart?: Date;
    deliveryDateEnd?: Date;
    hasReviewer?: boolean;
  }>({});

  const { sortConfigs, handleSort, buildOrderBy } = useTableSort(
    [{ columnKey: "createdAt", direction: "desc", order: 0 }],
    1, // Single column sort only
    false
  );

  const {
    visibleColumns,
    setVisibleColumns,
  } = useColumnVisibility(
    "team-ppe-deliveries",
    ["userName", "itemName", "status"],
    ["userName", "itemName", "quantity", "status", "deliveryDate", "scheduledDate", "reviewedBy", "createdAt"]
  );

  // Build API query with filters
  const buildWhereClause = useCallback(() => {
    const where: any = {
      user: {
        sectorId: managedSectorId,
      },
    };

    if (filters.status?.length) {
      where.status = { in: filters.status };
    }

    if (filters.itemName) {
      where.item = { name: { contains: filters.itemName, mode: "insensitive" } };
    }

    if (filters.userName) {
      where.user = {
        ...where.user,
        name: { contains: filters.userName, mode: "insensitive" },
      };
    }

    if (filters.deliveryDateStart || filters.deliveryDateEnd) {
      where.actualDeliveryDate = {};
      if (filters.deliveryDateStart) {
        where.actualDeliveryDate.gte = filters.deliveryDateStart;
      }
      if (filters.deliveryDateEnd) {
        where.actualDeliveryDate.lte = filters.deliveryDateEnd;
      }
    }

    if (filters.hasReviewer) {
      where.reviewedBy = { not: null };
    }

    return where;
  }, [filters, managedSectorId]);

  const queryParams = useMemo(() => {
    if (!userIsTeamLeader || !managedSectorId) return null;

    return {
      orderBy: buildOrderBy(
        {
          userName: "user.name",
          itemName: "item.name",
          quantity: "quantity",
          status: "status",
          deliveryDate: "actualDeliveryDate",
          scheduledDate: "scheduledDate",
          reviewedBy: "reviewedByUser.name",
          createdAt: "createdAt",
        },
        { createdAt: "desc" }
      ),
      ...(searchText ? { searchingFor: searchText } : {}),
      where: buildWhereClause(),
      include: {
        user: {
          include: {
            position: true,
          },
        },
        item: true,
        reviewedByUser: true,
      },
    };
  }, [userIsTeamLeader, managedSectorId, searchText, buildWhereClause, buildOrderBy]);

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
  } = usePpeDeliveriesInfiniteMobile(queryParams || {});

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refresh();
    } finally {
      setRefreshing(false);
    }
  }, [refresh]);

  const handleDeliveryPress = useCallback((deliveryId: string) => {
    router.push(`/meu-pessoal/epis/detalhes/${deliveryId}` as any);
  }, [router]);

  const handleEditDelivery = useCallback(() => {
    // TODO: Navigate to edit page when implemented
    Alert.alert("Informação", "Edição ainda não implementada");
  }, []);

  const handleDeleteDelivery = useCallback(
    async (deliveryId: string) => {
      const delivery = deliveries.find((d) => d.id === deliveryId);
      if (!delivery) return;

      Alert.alert(
        "Excluir Entrega",
        `Tem certeza que deseja excluir a entrega de ${delivery.item?.name || "item"} para ${delivery.user?.name || "usuário"}?`,
        [
          {
            text: "Cancelar",
            style: "cancel",
          },
          {
            text: "Excluir",
            style: "destructive",
            onPress: async () => {
              try {
                await deletePpeDelivery(deliveryId);
                // API client already shows success alert
                refresh();
              } catch (error) {
                // API client already shows error alert
                console.error("Error deleting delivery:", error);
              }
            },
          },
        ]
      );
    },
    [deliveries, refresh],
  );

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
    setIsColumnPanelOpen(false);
    setIsFilterPanelOpen(true);
  }, []);

  const handleCloseFilters = useCallback(() => {
    setIsFilterPanelOpen(false);
  }, []);

  const handleOpenColumns = useCallback(() => {
    setIsFilterPanelOpen(false);
    setIsColumnPanelOpen(true);
  }, []);

  const handleCloseColumns = useCallback(() => {
    setIsColumnPanelOpen(false);
  }, []);

  // Get all column definitions
  const allColumns = useMemo(() => createColumnDefinitions(), []);

  // Count active filters
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.status?.length) count++;
    if (filters.itemName) count++;
    if (filters.userName) count++;
    if (filters.deliveryDateStart) count++;
    if (filters.deliveryDateEnd) count++;
    if (filters.hasReviewer) count++;
    return count;
  }, [filters]);

  // Show access denied if not a team leader
  if (!isTeamLeader) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.emptyContainer}>
          <Card style={styles.loadingCard}>
            <IconShieldCheck size={48} color={colors.mutedForeground} />
            <ThemedText style={[styles.title, { color: colors.foreground, textAlign: "center", marginTop: spacing.md }]}>
              Acesso Restrito
            </ThemedText>
            <ThemedText style={[styles.subtitle, { color: colors.mutedForeground, textAlign: "center" }]}>
              Esta área é exclusiva para líderes de equipe.
            </ThemedText>
          </Card>
        </View>
      </ThemedView>
    );
  }

  // Only show skeleton on initial load
  const isInitialLoad = isLoading && deliveries.length === 0;

  if (isInitialLoad) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Card style={styles.loadingCard}>
            <ThemedText style={{ color: colors.mutedForeground }}>
              Carregando EPIs da equipe...
            </ThemedText>
          </Card>
        </View>
      </ThemedView>
    );
  }

  if (error && deliveries.length === 0) {
    return (
      <ThemedView style={styles.container}>
        <ErrorScreen
          message="Erro ao carregar EPIs"
          detail={error.message}
          onRetry={handleRefresh}
        />
      </ThemedView>
    );
  }

  const hasDeliveries = Array.isArray(deliveries) && deliveries.length > 0;

  return (
    <>
      <ThemedView style={[styles.container, { backgroundColor: colors.background, paddingBottom: insets.bottom }]}>
        {/* Search and Filter */}
        <View style={styles.searchContainer}>
          <SearchBar
            ref={searchInputRef}
            value={displaySearchText}
            onChangeText={handleDisplaySearchChange}
            onSearch={handleSearch}
            placeholder="Buscar entregas de EPIs..."
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
        <TeamPpeDeliveryFilterTags
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
            <TeamPpeDeliveryTable
              deliveries={deliveries}
              onDeliveryPress={handleDeliveryPress}
              onDeliveryEdit={handleEditDelivery}
              onDeliveryDelete={handleDeleteDelivery}
              onRefresh={handleRefresh}
              onEndReached={canLoadMore ? loadMore : undefined}
              refreshing={refreshing || isRefetching}
              loading={false}
              loadingMore={isFetchingNextPage}
              sortConfigs={sortConfigs}
              onSort={(configs) => {
                // Handle empty array (clear sort)
                if (configs.length === 0) {
                  handleSort("createdAt"); // Reset to default
                } else {
                  handleSort(configs[0].columnKey);
                }
              }}
              visibleColumnKeys={Array.from(visibleColumns) as string[]}
              enableSwipeActions={true}
            />
          </TableErrorBoundary>
        ) : (
          <View style={styles.emptyContainer}>
            <EmptyState
              icon={searchText ? "search" : "package"}
              title={searchText ? "Nenhuma entrega encontrada" : "Sem entregas de EPIs"}
              description={
                searchText
                  ? `Nenhum resultado para "${searchText}"`
                  : "Não há entregas de EPIs registradas para a equipe"
              }
            />
          </View>
        )}

        {/* Items count */}
        {hasDeliveries && <ItemsCountDisplay loadedCount={totalItemsLoaded} totalCount={totalCount} isLoading={isFetchingNextPage} />}
      </ThemedView>

      {/* Slide-in panels */}
      <SlideInPanel isOpen={isFilterPanelOpen} onClose={handleCloseFilters}>
        <TeamPpeDeliveryFilterDrawerContent
          filters={filters}
          onFiltersChange={setFilters}
          onClear={handleClearFilters}
          activeFiltersCount={activeFiltersCount}
        />
      </SlideInPanel>

      <SlideInPanel isOpen={isColumnPanelOpen} onClose={handleCloseColumns}>
        <TeamPpeDeliveryColumnDrawerContent
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
  title: {
    fontSize: fontSize.xl,
    fontWeight: "700",
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: fontSize.sm,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingCard: {
    padding: spacing.lg,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});