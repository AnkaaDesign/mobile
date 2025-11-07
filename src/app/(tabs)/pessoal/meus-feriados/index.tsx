import { useState, useMemo, useCallback } from "react";
import { View, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { ThemedView } from "@/components/ui/themed-view";
import { ThemedText } from "@/components/ui/themed-text";
import { SearchBar } from "@/components/ui/search-bar";
import { useTheme } from "@/lib/theme";
import { spacing } from "@/constants/design-system";
import { useHolidaysInfiniteMobile } from '../../../../hooks/use-holidays-infinite-mobile';
import { HolidayTable } from "@/components/personal/holiday";
import { CustomerListSkeleton } from "@/components/administration/customer/skeleton/customer-list-skeleton";
import { ErrorScreen } from "@/components/ui/error-screen";
import { useTableSort } from "@/hooks/useTableSort";
import { ItemsCountDisplay } from "@/components/ui/items-count-display";

export default function MyHolidaysScreen() {
  const router = useRouter();
  const [searchText, setSearchText] = useState("");
  const [displaySearchText, setDisplaySearchText] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  // Sort configuration
  const { sortConfigs, handleSort, buildOrderBy } = useTableSort(
    [{ columnKey: "date", direction: "desc", order: 0 }],
    1, // Single column sort only
    false
  );

  // Visible columns configuration
  const [visibleColumns] = useState<string[]>([
    "name",
    "date",
    "dayOfWeek",
    "type",
    "status",
  ]);

  // Build query params
  const queryParams = useMemo(() => ({
    orderBy: buildOrderBy(
      {
        name: "name",
        date: "date",
        type: "type",
        createdAt: "createdAt",
        updatedAt: "updatedAt",
      },
      { date: "desc" }
    ),
    ...(searchText ? { searchingFor: searchText } : {}),
  }), [searchText, buildOrderBy]);

  // Fetch holidays with infinite scroll
  const {
    items: holidays,
    loadMore,
    canLoadMore,
    isFetchingNextPage,
    isLoading,
    isRefetching,
    refetch,
    totalItemsLoaded,
    totalCount,
    prefetchNext,
    error,
  } = useHolidaysInfiniteMobile(queryParams);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  const handleSearch = useCallback((text: string) => {
    setSearchText(text);
  }, []);

  const handleDisplaySearchChange = useCallback((text: string) => {
    setDisplaySearchText(text);
  }, []);

  const handleHolidayPress = useCallback((holidayId: string) => {
    router.push(`/pessoal/meus-feriados/detalhes/${holidayId}` as any);
  }, [router]);

  // Loading state
  if (isLoading && holidays.length === 0) {
    return <CustomerListSkeleton />;
  }

  // Error state
  if (error && holidays.length === 0) {
    return (
      <ErrorScreen
        error={error}
        onRetry={() => refetch()}
        message="Erro ao carregar feriados"
      />
    );
  }

  return (
    <ThemedView style={styles.container}>
      {/* Header with count */}
      <View style={styles.header}>
        <ThemedText style={styles.title}>Feriados</ThemedText>
        <ItemsCountDisplay
          loadedCount={totalItemsLoaded}
          totalCount={totalCount}
          itemType="feriado"
          itemTypePlural="feriados"
        />
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <SearchBar
          value={displaySearchText}
          onChangeText={handleDisplaySearchChange}
          onSearch={handleSearch}
          placeholder="Buscar feriados..."
          style={styles.searchBar}
          debounceMs={300}
          loading={isRefetching && !isFetchingNextPage}
        />
      </View>

      {/* Table */}
      <View style={styles.tableContainer}>
        <HolidayTable
          holidays={holidays as any[]}
          onHolidayPress={handleHolidayPress}
          onRefresh={handleRefresh}
          onEndReached={canLoadMore ? loadMore : undefined}
          onPrefetch={prefetchNext}
          refreshing={refreshing}
          loading={isLoading}
          loadingMore={isFetchingNextPage}
          sortConfigs={sortConfigs}
          onSort={(configs) => {
            if (configs.length > 0) {
              handleSort(configs[0].columnKey);
            }
          }}
          visibleColumnKeys={visibleColumns}
        />
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: spacing.xs,
  },
  searchContainer: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  searchBar: {
    flex: 1,
  },
  tableContainer: {
    flex: 1,
    paddingHorizontal: spacing.md,
  },
});
