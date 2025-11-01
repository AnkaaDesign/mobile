import { useState, useCallback } from "react";
import { View, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { IconFilter, IconList } from "@tabler/icons-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHolidaysInfiniteMobile } from "@/hooks";
import type { HolidayGetManyFormData } from '../../../../schemas';
import { ThemedView, FAB, ErrorScreen, EmptyState, SearchBar, ListActionButton } from "@/components/ui";
import { HolidayTable } from "@/components/human-resources/holiday/list/holiday-table";

import { HolidayFilterModal } from "@/components/human-resources/holiday/list/holiday-filter-modal";
import { HolidayFilterTags } from "@/components/human-resources/holiday/list/holiday-filter-tags";
import { TableErrorBoundary } from "@/components/ui/table-error-boundary";
import { ItemsCountDisplay } from "@/components/ui/items-count-display";
import { HolidayListSkeleton } from "@/components/human-resources/holiday/skeleton/holiday-list-skeleton";
import { useTheme } from "@/lib/theme";
import { routes } from '../../../../constants';
import { routeToMobilePath } from "@/lib/route-mapper";

export default function HolidayListScreen() {
  const router = useRouter();
  const { colors, } = useTheme();
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [displaySearchText, setDisplaySearchText] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<Partial<HolidayGetManyFormData>>({});
  const [_showColumnManager, setShowColumnManager] = useState(false);
  const [visibleColumnKeys, ] = useState<string[]>(["name", "date", "type"]);

  // Build query parameters with default sort by date (upcoming first)
  const queryParams = {
    orderBy: { date: "asc" as const },
    ...(searchText ? { searchingFor: searchText } : {}),
    ...filters,
    include: {},
  };

  const { items: holidays, isLoading, error, isRefetching, loadMore, canLoadMore, isFetchingNextPage, totalItemsLoaded, totalCount, refresh } = useHolidaysInfiniteMobile(queryParams);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refresh();
    } finally {
      setRefreshing(false);
    }
  }, [refresh]);

  const handleCreateHoliday = () => {
    router.push(routeToMobilePath(routes.humanResources.holidays.create) as any);
  };

  const handleHolidayPress = (holidayId: string) => {
    router.push(routeToMobilePath(routes.humanResources.holidays.details(holidayId)) as any);
  };

  const handleSearch = useCallback((text: string) => {
    setSearchText(text);
  }, []);

  const handleDisplaySearchChange = useCallback((text: string) => {
    setDisplaySearchText(text);
  }, []);

  const handleApplyFilters = useCallback((newFilters: Partial<HolidayGetManyFormData>) => {
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
    ([_key, value]) => value !== undefined && value !== null && (Array.isArray(value) ? value.length > 0 : true),
  ).length;

  if (isLoading && !isRefetching) {
    return <HolidayListSkeleton />;
  }

  if (error) {
    return (
      <ThemedView style={styles.container}>
        <ErrorScreen message="Erro ao carregar feriados" detail={error.message} onRetry={handleRefresh} />
      </ThemedView>
    );
  }

  const hasHolidays = Array.isArray(holidays) && holidays.length > 0;

  return (
    <ThemedView style={[styles.container, { backgroundColor: colors.background, paddingBottom: insets.bottom }]}>
      {/* Search and Filter */}
      <View style={styles.searchContainer}>
        <SearchBar
          value={displaySearchText}
          onChangeText={handleDisplaySearchChange}
          onSearch={handleSearch}
          placeholder="Buscar feriados..."
          style={styles.searchBar}
          debounceMs={300}
        />
        <View style={styles.buttonContainer}>
          <ListActionButton
            icon={<IconList size={20} color={colors.foreground} />}
            onPress={() => setShowColumnManager(true)}
            badgeCount={visibleColumnKeys.length}
            badgeVariant="primary"
          />
          <ListActionButton
            icon={<IconFilter size={20} color={colors.foreground} />}
            onPress={() => setShowFilters(true)}
            badgeCount={activeFiltersCount}
            badgeVariant="destructive"
            showBadge={activeFiltersCount > 0}
          />
        </View>
      </View>

      {/* Individual filter tags */}
      <HolidayFilterTags
        filters={filters}
        searchText={searchText}
        onFilterChange={handleApplyFilters}
        onSearchChange={(text) => {
          setSearchText(text);
          setDisplaySearchText(text);
        }}
        onClearAll={handleClearFilters}
      />

      {hasHolidays ? (
        <TableErrorBoundary onRetry={handleRefresh}>
          <HolidayTable
            holidays={holidays}
            onHolidayPress={handleHolidayPress}
            onRefresh={handleRefresh}
            onEndReached={canLoadMore ? loadMore : undefined}
            refreshing={refreshing}
            loading={isLoading && !isRefetching}
            loadingMore={isFetchingNextPage}
          />
        </TableErrorBoundary>
      ) : (
        <View style={styles.emptyContainer}>
          <EmptyState
            icon={searchText ? "search" : "calendar"}
            title={searchText ? "Nenhum feriado encontrado" : "Nenhum feriado cadastrado"}
            description={searchText ? `Nenhum resultado para "${searchText}"` : "Comece cadastrando feriados para o calendário"}
            actionLabel={searchText ? undefined : "Cadastrar Feriado"}
            onAction={searchText ? undefined : handleCreateHoliday}
          />
        </View>
      )}

      {/* Items count */}
      {hasHolidays && <ItemsCountDisplay loadedCount={totalItemsLoaded} totalCount={totalCount} isLoading={isFetchingNextPage} />}

      {hasHolidays && <FAB icon="plus" onPress={handleCreateHoliday} />}

      {/* Filter Modal */}
      <HolidayFilterModal visible={showFilters} onClose={() => setShowFilters(false)} onApply={handleApplyFilters} currentFilters={filters} />
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
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
