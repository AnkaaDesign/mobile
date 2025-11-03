import { useState, useCallback } from "react";
import { View, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { IconFilter } from "@tabler/icons-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useVacationsInfiniteMobile } from "@/hooks";
import type { VacationGetManyFormData } from '../../../../schemas';
import { ThemedView, FAB, ErrorScreen, EmptyState, SearchBar, ListActionButton } from "@/components/ui";
import { VacationTable } from "@/components/human-resources/vacation/list/vacation-table";

import { VacationFilterTags } from "@/components/human-resources/vacation/list/vacation-filter-tags";
import { ItemsCountDisplay } from "@/components/ui/items-count-display";
import { VacationListSkeleton } from "@/components/human-resources/vacation/skeleton/vacation-list-skeleton";
import { useTheme } from "@/lib/theme";
import { routes } from '../../../../constants';
import { routeToMobilePath } from "@/lib/route-mapper";

import { UtilityDrawerWrapper } from "@/components/ui/utility-drawer";
import { useUtilityDrawer } from "@/contexts/utility-drawer-context";
import { GenericColumnDrawerContent } from "@/components/ui/generic-column-drawer-content";
import { VacationFilterDrawerContent } from "@/components/human-resources/vacation/list/vacation-filter-drawer-content";

export default function VacationListScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { openFilterDrawer, openColumnDrawer } = useUtilityDrawer();
  const [refreshing, setRefreshing] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [displaySearchText, setDisplaySearchText] = useState("");
  const [filters, setFilters] = useState<Partial<VacationGetManyFormData>>({});

  // Build query parameters
  const queryParams = {
    orderBy: { startAt: "desc" as const },
    ...(searchText ? { searchingFor: searchText } : {}),
    ...filters,
    include: {
      user: true,
    },
  };

  const { items: vacations, isLoading, error, isRefetching, loadMore, canLoadMore, isFetchingNextPage, totalItemsLoaded, totalCount, refresh } = useVacationsInfiniteMobile(queryParams);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refresh();
    } finally {
      setRefreshing(false);
    }
  }, [refresh]);

  const handleCreateVacation = () => {
    router.push(routeToMobilePath(routes.humanResources.vacations.create) as any);
  };

  const handleVacationPress = (vacationId: string) => {
    router.push(routeToMobilePath(routes.humanResources.vacations.details(vacationId)) as any);
  };

  const handleSearch = useCallback((text: string) => {
    setSearchText(text);
  }, []);

  const handleDisplaySearchChange = useCallback((text: string) => {
    setDisplaySearchText(text);
  }, []);

  const handleApplyFilters = useCallback((newFilters: Partial<VacationGetManyFormData>) => {
    setFilters(newFilters);
    setShowFilters(false);
  }, []);

  const handleClearFilters = useCallback(() => {
    setFilters({});
    setSearchText("");
    setDisplaySearchText("");
  }, []);

  // Count active filters
  const activeFiltersCount = (() => {
    let count = 0;

  const handleOpenFilters = useCallback(() => {
    openFilterDrawer(() => (
      <VacationFilterDrawerContent
        filters={filters}
        onFiltersChange={setFilters}
        onClear={handleClearFilters}
        activeFiltersCount={activeFiltersCount}
      />
    ));
  }, [openFilterDrawer, filters, handleClearFilters, activeFiltersCount]);

  const handleOpenColumns = useCallback(() => {
    openColumnDrawer(() => (
      <GenericColumnDrawerContent
        columns={allColumns}
        visibleColumns={visibleColumns}
        onVisibilityChange={handleColumnsChange}
      />
    ));
  }, [openColumnDrawer, allColumns, visibleColumns, handleColumnsChange]);
    if (filters.statuses && filters.statuses.length > 0) count++;
    if (filters.types && filters.types.length > 0) count++;
    if (filters.userIds && filters.userIds.length > 0) count++;
    if (filters.startAtRange?.gte) count++;
    if (filters.endAtRange?.lte) count++;
    return count;
  })();

  if (isLoading && !isRefetching) {
    return <VacationListSkeleton />;
  }

  if (error) {
    return (
    <UtilityDrawerWrapper>

          <ThemedView style={styles.container}>
            <ErrorScreen message="Erro ao carregar férias" detail={error.message} onRetry={handleRefresh} />
          </ThemedView>
    
    </UtilityDrawerWrapper>
  );
  }

  const hasVacations = Array.isArray(vacations) && vacations.length > 0;

  return (
    <ThemedView style={[styles.container, { backgroundColor: colors.background, paddingBottom: insets.bottom }]}>
      {/* Search and Filter */}
      <View style={styles.searchContainer}>
        <SearchBar
          value={displaySearchText}
          onChangeText={handleDisplaySearchChange}
          onSearch={handleSearch}
          placeholder="Buscar férias..."
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

      {/* Filter tags */}
      <VacationFilterTags
        filters={filters}
        searchText={searchText}
        onFilterChange={handleApplyFilters}
        onSearchChange={(text) => {
          setSearchText(text);
          setDisplaySearchText(text);
        }}
        onClearAll={handleClearFilters}
      />

      {hasVacations ? (
        <>
          <VacationTable
            vacations={vacations}
            isLoading={isLoading && !isRefetching}
            error={error}
            onVacationPress={handleVacationPress}
            onRefresh={handleRefresh}
            refreshing={refreshing}
            onEndReach={loadMore}
            canLoadMore={canLoadMore}
            loadingMore={isFetchingNextPage}
          />
          <ItemsCountDisplay loadedCount={totalItemsLoaded} totalCount={totalCount} isLoading={isFetchingNextPage} />
        </>
      ) : (
        <View style={styles.emptyContainer}>
          <EmptyState
            icon={searchText ? "search" : "calendar"}
            title={searchText ? "Nenhuma férias encontrada" : "Nenhuma férias cadastrada"}
            description={searchText ? `Nenhum resultado para "${searchText}"` : "Comece cadastrando as primeiras férias"}
            actionLabel={searchText ? undefined : "Cadastrar Férias"}
            onAction={searchText ? undefined : handleCreateVacation}
          />
        </View>
      )}

      {hasVacations && <FAB icon="plus" onPress={handleCreateVacation} />}
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
