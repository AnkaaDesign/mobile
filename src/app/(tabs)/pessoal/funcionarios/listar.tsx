import React, { useState, useCallback, useMemo } from "react";
import { View, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from "react-native";
import { useRouter } from "expo-router";
import { useUsersInfiniteMobile, useSectors, usePositions } from "@/hooks";
import { ThemedView } from "@/components/ui/themed-view";
import { ThemedText } from "@/components/ui/themed-text";
import { Card } from "@/components/ui/card";
import { SearchBar } from "@/components/ui/search-bar";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorScreen } from "@/components/ui/error-screen";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ItemsCountDisplay } from "@/components/ui/items-count-display";
import { ListActionButton } from "@/components/ui/list-action-button";
import { useTheme } from "@/lib/theme";
import { spacing, borderRadius, fontSize } from "@/constants/design-system";
import {
  IconUser,
  IconPhone,
  IconMail,
  IconBriefcase,
  IconChevronRight,
  IconFilter,
  IconBuilding,
} from "@tabler/icons-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { USER_STATUS } from "@/constants";
import { useUtilityDrawer } from "@/contexts/utility-drawer-context";
import { UtilityDrawerWrapper } from "@/components/ui/utility-drawer";

// Helper function to get status label
const getStatusLabel = (status: string) => {
  const statusLabels: Record<string, string> = {
    [USER_STATUS.EXPERIENCE_PERIOD_1]: "Exp. 1",
    [USER_STATUS.EXPERIENCE_PERIOD_2]: "Exp. 2",
    [USER_STATUS.CONTRACTED]: "Contratado",
    [USER_STATUS.DISMISSED]: "Demitido",
  };
  return statusLabels[status] || status;
};

// Helper function to get status color
const getStatusColor = (status: string, colors: any) => {
  const statusColors: Record<string, string> = {
    [USER_STATUS.EXPERIENCE_PERIOD_1]: colors.warning,
    [USER_STATUS.EXPERIENCE_PERIOD_2]: colors.warning,
    [USER_STATUS.CONTRACTED]: colors.success,
    [USER_STATUS.DISMISSED]: colors.destructive,
  };
  return statusColors[status] || colors.mutedForeground;
};

export default function EmployeesListScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { openFilterDrawer } = useUtilityDrawer();

  const [refreshing, setRefreshing] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [displaySearchText, setDisplaySearchText] = useState("");
  const [selectedSectorId, setSelectedSectorId] = useState<string | null>(null);
  const [selectedPositionId, setSelectedPositionId] = useState<string | null>(null);
  const [showDismissed, setShowDismissed] = useState(false);

  // Fetch sectors and positions for filtering
  const { data: sectorsResponse } = useSectors({ orderBy: { name: "asc" } });
  const { data: positionsResponse } = usePositions({ orderBy: { name: "asc" } });
  const sectors = sectorsResponse?.data || [];
  const positions = positionsResponse?.data || [];

  // Build query parameters for employees
  const queryParams = useMemo(() => {
    const params: any = {
      where: {},
      include: {
        position: true,
        sector: true,
        _count: {
          select: {
            tasks: true,
            activities: true,
            borrows: true,
            vacations: true,
            warningsCollaborator: true,
          },
        },
      },
      orderBy: { name: "asc" },
    };

    // Exclude dismissed employees by default
    if (!showDismissed) {
      params.where.status = { not: USER_STATUS.DISMISSED };
    }

    // Apply filters
    if (selectedSectorId) {
      params.where.sectorId = selectedSectorId;
    }

    if (selectedPositionId) {
      params.where.positionId = selectedPositionId;
    }

    // Add search filter
    if (searchText) {
      params.searchingFor = searchText;
    }

    return params;
  }, [searchText, selectedSectorId, selectedPositionId, showDismissed]);

  const {
    users,
    isLoading,
    error,
    isRefetching,
    loadMore,
    canLoadMore,
    isFetchingNextPage,
    totalItemsLoaded,
    totalCount,
    refresh,
  } = useUsersInfiniteMobile(queryParams);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refresh();
    } finally {
      setRefreshing(false);
    }
  }, [refresh]);

  const handleEmployeePress = (userId: string) => {
    router.push(`/(tabs)/pessoal/funcionarios/detalhes/${userId}` as any);
  };

  const handleSearch = useCallback((text: string) => {
    setSearchText(text);
  }, []);

  const handleDisplaySearchChange = useCallback((text: string) => {
    setDisplaySearchText(text);
  }, []);

  const handleClearFilters = useCallback(() => {
    setSelectedSectorId(null);
    setSelectedPositionId(null);
    setShowDismissed(false);
    setSearchText("");
    setDisplaySearchText("");
  }, []);

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (selectedSectorId) count++;
    if (selectedPositionId) count++;
    if (showDismissed) count++;
    return count;
  }, [selectedSectorId, selectedPositionId, showDismissed]);

  const renderEmployeeItem = ({ item }: { item: any }) => (
    <TouchableOpacity onPress={() => handleEmployeePress(item.id)} activeOpacity={0.7}>
      <Card style={styles.employeeCard}>
        <View style={styles.employeeContent}>
          <View style={styles.employeeLeft}>
            <Avatar
              source={item.avatar?.url ? { uri: item.avatar.url } : undefined}
              fallback={item.name?.[0]?.toUpperCase() || "U"}
              size={48}
            />
            <View style={styles.employeeInfo}>
              <ThemedText style={[styles.employeeName, { color: colors.foreground }]}>
                {item.name}
              </ThemedText>

              <View style={styles.infoRows}>
                {item.position && (
                  <View style={styles.infoRow}>
                    <IconBriefcase size={12} color={colors.mutedForeground} />
                    <ThemedText style={[styles.employeeDetail, { color: colors.mutedForeground }]}>
                      {item.position.name}
                    </ThemedText>
                  </View>
                )}

                {item.sector && (
                  <View style={styles.infoRow}>
                    <IconBuilding size={12} color={colors.mutedForeground} />
                    <ThemedText style={[styles.employeeDetail, { color: colors.mutedForeground }]}>
                      {item.sector.name}
                    </ThemedText>
                  </View>
                )}

                {item.email && (
                  <View style={styles.infoRow}>
                    <IconMail size={12} color={colors.mutedForeground} />
                    <ThemedText style={[styles.employeeDetail, { color: colors.mutedForeground }]} numberOfLines={1}>
                      {item.email}
                    </ThemedText>
                  </View>
                )}
              </View>
            </View>
          </View>

          <View style={styles.employeeRight}>
            <Badge
              variant="secondary"
              style={{
                backgroundColor: getStatusColor(item.status, colors) + "20",
              }}
            >
              <ThemedText
                style={[
                  styles.statusText,
                  { color: getStatusColor(item.status, colors) },
                ]}
              >
                {getStatusLabel(item.status)}
              </ThemedText>
            </Badge>
            <IconChevronRight size={20} color={colors.mutedForeground} />
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );

  if (isLoading && users.length === 0) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Card style={styles.loadingCard}>
            <ThemedText style={{ color: colors.mutedForeground }}>
              Carregando funcionários...
            </ThemedText>
          </Card>
        </View>
      </ThemedView>
    );
  }

  if (error && users.length === 0) {
    return (
      <ThemedView style={styles.container}>
        <ErrorScreen
          message="Erro ao carregar funcionários"
          detail={error.message}
          onRetry={handleRefresh}
        />
      </ThemedView>
    );
  }

  const hasEmployees = Array.isArray(users) && users.length > 0;

  return (
    <UtilityDrawerWrapper>
      <ThemedView style={[styles.container, { paddingBottom: insets.bottom }]}>
        {/* Search and Filter */}
        <View style={styles.searchContainer}>
          <SearchBar
            value={displaySearchText}
            onChangeText={handleDisplaySearchChange}
            onSearch={handleSearch}
            placeholder="Buscar funcionários..."
            style={styles.searchBar}
            debounceMs={300}
            loading={isRefetching && !isFetchingNextPage}
          />
          <ListActionButton
            icon={<IconFilter size={20} color={colors.foreground} />}
            onPress={() => {
              // Here you would open a filter drawer/modal
              // For now, we'll just clear filters
              if (activeFiltersCount > 0) {
                handleClearFilters();
              }
            }}
            badgeCount={activeFiltersCount}
            badgeVariant="destructive"
            showBadge={activeFiltersCount > 0}
          />
        </View>

        {/* Active Filters Display */}
        {activeFiltersCount > 0 && (
          <View style={styles.activeFiltersContainer}>
            <ThemedText style={[styles.activeFiltersText, { color: colors.mutedForeground }]}>
              {activeFiltersCount} filtro{activeFiltersCount > 1 ? "s" : ""} ativo{activeFiltersCount > 1 ? "s" : ""}
            </ThemedText>
            <TouchableOpacity onPress={handleClearFilters}>
              <ThemedText style={[styles.clearFiltersText, { color: colors.primary }]}>
                Limpar
              </ThemedText>
            </TouchableOpacity>
          </View>
        )}

        {hasEmployees ? (
          <>
            <FlatList
              data={users}
              renderItem={renderEmployeeItem}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing || isRefetching}
                  onRefresh={handleRefresh}
                  colors={[colors.primary]}
                  tintColor={colors.primary}
                />
              }
              onEndReached={canLoadMore ? loadMore : undefined}
              onEndReachedThreshold={0.5}
              ListFooterComponent={
                isFetchingNextPage ? (
                  <View style={styles.loadingMore}>
                    <ThemedText style={{ color: colors.mutedForeground }}>
                      Carregando mais...
                    </ThemedText>
                  </View>
                ) : null
              }
            />
            <ItemsCountDisplay
              loadedCount={totalItemsLoaded}
              totalCount={totalCount}
              isLoading={isFetchingNextPage}
            />
          </>
        ) : (
          <View style={styles.emptyContainer}>
            <EmptyState
              icon={searchText ? "search" : "users"}
              title={searchText ? "Nenhum funcionário encontrado" : "Nenhum funcionário cadastrado"}
              description={
                searchText
                  ? `Nenhum resultado para "${searchText}"`
                  : "Não há funcionários cadastrados no sistema"
              }
            />
          </View>
        )}
      </ThemedView>
    </UtilityDrawerWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    flexDirection: "row",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
    alignItems: "center",
  },
  searchBar: {
    flex: 1,
  },
  activeFiltersContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xs,
  },
  activeFiltersText: {
    fontSize: fontSize.sm,
  },
  clearFiltersText: {
    fontSize: fontSize.sm,
    fontWeight: "600",
  },
  listContent: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xl,
  },
  employeeCard: {
    marginBottom: spacing.sm,
    padding: spacing.md,
  },
  employeeContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  employeeLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  employeeInfo: {
    marginLeft: spacing.md,
    flex: 1,
  },
  employeeName: {
    fontSize: fontSize.base,
    fontWeight: "600",
    marginBottom: spacing.xs,
  },
  infoRows: {
    gap: 2,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  employeeDetail: {
    fontSize: fontSize.xs,
    marginLeft: spacing.xs,
  },
  employeeRight: {
    alignItems: "flex-end",
    gap: spacing.xs,
  },
  statusText: {
    fontSize: fontSize.xs,
    fontWeight: "500",
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
  loadingMore: {
    paddingVertical: spacing.md,
    alignItems: "center",
  },
});