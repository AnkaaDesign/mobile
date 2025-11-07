// apps/mobile/src/app/(tabs)/human-resources/ppe/schedules/list.tsx

import { useState, useCallback, useMemo } from "react";
import { View, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { IconFilter } from "@tabler/icons-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { usePpeSchedulesInfiniteMobile } from "@/hooks";
import type { PpeDeliveryScheduleGetManyFormData } from '../../../../../schemas';
import { ThemedView, ThemedText, FAB, ErrorScreen, EmptyState, SearchBar, ListActionButton, Badge } from "@/components/ui";
import { PpeScheduleTable } from "@/components/human-resources/ppe/schedule/list/ppe-schedule-table";
import type { SortConfig } from "@/components/human-resources/ppe/schedule/list/ppe-schedule-table";
import { PpeScheduleFilterTags } from "@/components/human-resources/ppe/schedule/list/ppe-schedule-filter-tags";
import { TableErrorBoundary } from "@/components/ui/table-error-boundary";
import { ItemsCountDisplay } from "@/components/ui/items-count-display";
import { PpeScheduleListSkeleton } from "@/components/human-resources/ppe/schedule/skeleton/ppe-schedule-list-skeleton";
import { useTheme } from "@/lib/theme";
import { routes } from '../../../../../constants';
import { routeToMobilePath } from "@/lib/route-mapper";
import { SlideInPanel } from "@/components/ui/slide-in-panel";
import { PpeScheduleFilterDrawerContent } from "@/components/human-resources/ppe/schedule/list/ppe-schedule-filter-drawer-content";

export default function PpeScheduleListScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [displaySearchText, setDisplaySearchText] = useState("");
  const [filters, setFilters] = useState<Partial<PpeDeliveryScheduleGetManyFormData>>({});
  const [sortConfigs, setSortConfigs] = useState<SortConfig[]>([{ columnKey: "nextRun", direction: "asc" }]);
  const [_visibleColumnKeys] = useState<string[]>(["nextRun", "frequency", "isActive"]);

  // Slide panel state
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);

  // Build query parameters with sorting
  const buildOrderBy = () => {
    if (!sortConfigs || sortConfigs.length === 0) return { nextRun: "asc" };

    // If only one sort, return as object
    if (sortConfigs.length === 1) {
      const config = sortConfigs[0];
      switch (config.columnKey) {
        case "nextRun":
          return { nextRun: config.direction };
        case "lastRun":
          return { lastRun: config.direction };
        case "frequency":
          return { frequency: config.direction };
        case "isActive":
          return { isActive: config.direction };
        case "createdAt":
          return { createdAt: config.direction };
        default:
          return { nextRun: "asc" };
      }
    }

    // Multiple sorts, return as array
    return sortConfigs.map((config) => {
      switch (config.columnKey) {
        case "nextRun":
          return { nextRun: config.direction };
        case "lastRun":
          return { lastRun: config.direction };
        case "frequency":
          return { frequency: config.direction };
        case "isActive":
          return { isActive: config.direction };
        case "createdAt":
          return { createdAt: config.direction };
        default:
          return { nextRun: "asc" };
      }
    });
  };

  const queryParams = {
    orderBy: buildOrderBy(),
    ...(searchText ? { searchingFor: searchText } : {}),
    ...filters,
    include: {
      user: true,
      category: true,
    },
  };

  const { schedules, isLoading, error, isRefetching, loadMore, canLoadMore, isFetchingNextPage, totalItemsLoaded, totalCount, refresh } = usePpeSchedulesInfiniteMobile(queryParams);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refresh();
    } finally {
      setRefreshing(false);
    }
  }, [refresh]);

  const handleCreateSchedule = () => {
    router.push(routeToMobilePath(routes.humanResources.ppe.schedules.create) as any);
  };

  const handleSchedulePress = (scheduleId: string) => {
    router.push(routeToMobilePath(routes.humanResources.ppe.schedules.details(scheduleId)) as any);
  };

  const handleSort = useCallback((configs: SortConfig[]) => {
    setSortConfigs(configs);
  }, []);

  const handleSearch = useCallback((text: string) => {
    setSearchText(text);
  }, []);

  const handleDisplaySearchChange = useCallback((text: string) => {
    setDisplaySearchText(text);
  }, []);

  const handleApplyFilters = useCallback((newFilters: Partial<PpeDeliveryScheduleGetManyFormData>) => {
    setFilters(newFilters);
  }, []);

  const handleClearFilters = useCallback(() => {
    setFilters({});
    setSearchText("");
    setDisplaySearchText("");
  }, []);

  // Count active filters
  const activeFiltersCount = Object.entries(filters).filter(
    ([_key, value]) => value !== undefined && value !== null && (Array.isArray(value) ? value.length > 0 : true),
  ).length;

  const handleOpenFilters = useCallback(() => {
    setIsFilterPanelOpen(true);
  }, []);

  const handleCloseFilters = useCallback(() => {
    setIsFilterPanelOpen(false);
  }, []);

  // Calculate overdue and upcoming counts
  const overdueCount = useMemo(() => {
    return schedules.filter((s) => s.isActive && s.nextRun && new Date(s.nextRun) < new Date()).length;
  }, [schedules]);

  const upcomingCount = useMemo(() => {
    const now = new Date();
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    return schedules.filter((s) => s.isActive && s.nextRun && new Date(s.nextRun) >= now && new Date(s.nextRun) <= nextWeek).length;
  }, [schedules]);

  if (isLoading && !isRefetching) {
    return <PpeScheduleListSkeleton />;
  }

  if (error) {
    return (
      <ThemedView style={styles.container}>
        <ErrorScreen message="Erro ao carregar agendamentos de EPI" detail={error.message} onRetry={handleRefresh} />
      </ThemedView>
    );
  }

  const hasSchedules = Array.isArray(schedules) && schedules.length > 0;

  return (
    <>
      <ThemedView style={[styles.container, { backgroundColor: colors.background, paddingBottom: insets.bottom }]}>
        {/* Search and Filter */}
        <View style={styles.searchContainer}>
          <SearchBar
            value={displaySearchText}
            onChangeText={handleDisplaySearchChange}
            onSearch={handleSearch}
            placeholder="Buscar agendamentos..."
            style={styles.searchBar}
            debounceMs={300}
          />
          <View style={styles.buttonContainer}>
            <ListActionButton
              icon={<IconFilter size={20} color={colors.foreground} />}
              onPress={handleOpenFilters}
              badgeCount={activeFiltersCount}
              badgeVariant="destructive"
              showBadge={activeFiltersCount > 0}
            />
          </View>
        </View>

        {/* Summary badges */}
        {hasSchedules && (
          <View style={styles.summaryContainer}>
            {overdueCount > 0 && (
              <Badge variant="destructive" size="sm">
                <ThemedText style={styles.summaryText}>{overdueCount} Atrasado(s)</ThemedText>
              </Badge>
            )}
            {upcomingCount > 0 && (
              <Badge variant="default" size="sm" style={{ backgroundColor: "#eab308" }}>
                <ThemedText style={StyleSheet.flatten([styles.summaryText, { color: "#000" }])}>{upcomingCount} Em Breve</ThemedText>
              </Badge>
            )}
          </View>
        )}

        {/* Individual filter tags */}
        <PpeScheduleFilterTags
          filters={filters}
          searchText={searchText}
          onFilterChange={handleApplyFilters}
          onSearchChange={(text) => {
            setSearchText(text);
            setDisplaySearchText(text);
          }}
          onClearAll={handleClearFilters}
        />

        {hasSchedules ? (
          <TableErrorBoundary onRetry={handleRefresh}>
            <PpeScheduleTable
              schedules={schedules}
              onSchedulePress={handleSchedulePress}
              onRefresh={handleRefresh}
              onEndReached={canLoadMore ? loadMore : undefined}
              refreshing={refreshing}
              loading={isLoading && !isRefetching}
              loadingMore={isFetchingNextPage}
              sortConfigs={sortConfigs}
              onSort={handleSort}
            />
          </TableErrorBoundary>
        ) : (
          <View style={styles.emptyContainer}>
            <EmptyState
              icon={searchText ? "search" : "calendar"}
              title={searchText ? "Nenhum agendamento encontrado" : "Nenhum agendamento cadastrado"}
              description={searchText ? `Nenhum resultado para "${searchText}"` : "Comece cadastrando o primeiro agendamento de entrega de EPI"}
              actionLabel={searchText ? undefined : "Cadastrar Agendamento"}
              onAction={searchText ? undefined : handleCreateSchedule}
            />
          </View>
        )}

        {/* Items count */}
        {hasSchedules && <ItemsCountDisplay loadedCount={totalItemsLoaded} totalCount={totalCount} isLoading={isFetchingNextPage} />}

        {hasSchedules && <FAB icon="plus" onPress={handleCreateSchedule} />}
      </ThemedView>

      <SlideInPanel isOpen={isFilterPanelOpen} onClose={handleCloseFilters}>
        <PpeScheduleFilterDrawerContent
          filters={filters}
          onFiltersChange={setFilters}
          onClear={handleClearFilters}
          activeFiltersCount={activeFiltersCount}
          onClose={handleCloseFilters}
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
  summaryContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingBottom: 8,
    gap: 8,
  },
  summaryText: {
    fontSize: 12,
    fontWeight: "600",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
