import { useState, useCallback } from "react";
import { View, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { IconFilter, IconList } from "@tabler/icons-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { ChangeLogGetManyFormData } from '../../../../schemas';
import { ThemedView, ErrorScreen, EmptyState, SearchBar, ListActionButton } from "@/components/ui";
import { ChangeLogTable } from "@/components/administration/change-log/list/change-log-table";

import { ChangeLogFilterTags } from "@/components/administration/change-log/list/change-log-filter-tags";
import { TableErrorBoundary } from "@/components/ui/table-error-boundary";
import { ItemsCountDisplay } from "@/components/ui/items-count-display";
import { ChangeLogListSkeleton } from "@/components/administration/change-log/skeleton/change-log-list-skeleton";
import { useTheme } from "@/lib/theme";
import { routes } from '../../../../constants';
import { routeToMobilePath } from "@/lib/route-mapper";
import { useChangeLogsInfiniteMobile } from "@/hooks";

import { SlideInPanel } from "@/components/ui/slide-in-panel";
import { GenericColumnDrawerContent } from "@/components/ui/generic-column-drawer-content";
import { ChangeLogFilterDrawerContent } from "@/components/administration/change-log/list/change-log-filter-drawer-content";

export default function AdministrationChangeLogsListScreen() {
  const router = useRouter();
  const { colors, } = useTheme();
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [displaySearchText, setDisplaySearchText] = useState("");
  const [filters, setFilters] = useState<Partial<ChangeLogGetManyFormData>>({});
  const [visibleColumnKeys, ] = useState<string[]>(["action", "entity", "user", "createdAt"]);
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [isColumnPanelOpen, setIsColumnPanelOpen] = useState(false);

  // Build query parameters
  const queryParams = {
    orderBy: { createdAt: "desc" as const },
    ...(searchText ? { searchingFor: searchText } : {}),
    ...filters,
    include: {
      user: true,
    },
  };

  const {
    items: changeLogs,
    isLoading,
    error,
    
    isRefetching,
    loadMore,
    canLoadMore,
    isFetchingNextPage,
    totalItemsLoaded,
    totalCount,
    refresh,
  } = useChangeLogsInfiniteMobile(queryParams);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refresh();
    } finally {
      setRefreshing(false);
    }
  }, [refresh]);

  const handleChangeLogPress = (changeLogId: string) => {
    router.push(routeToMobilePath(routes.administration.changeLogs.details(changeLogId)) as any);
  };

  const handleSearch = useCallback((text: string) => {
    setSearchText(text);
  }, []);

  const handleDisplaySearchChange = useCallback((text: string) => {
    setDisplaySearchText(text);
  }, []);

  const handleApplyFilters = useCallback((newFilters: Partial<ChangeLogGetManyFormData>) => {
    setFilters(newFilters);
  }, []);

  const handleClearFilters = useCallback(() => {
    setFilters({});
    setSearchText("");
    setDisplaySearchText("");
  }, []);

  // Count active filters
  const activeFiltersCount = Object.entries(filters).filter(
    ([_key, value]) => {
      if (value === undefined || value === null) return false;
      if (Array.isArray(value)) return value.length > 0;
      if (typeof value === "object" && !Array.isArray(value)) {
        return Object.values(value).some(v => v !== undefined && v !== null);
      }
      return true;
    }
  ).length;

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

  if (isLoading && !isRefetching) {
    return <ChangeLogListSkeleton />;
  }

  if (error) {
    return (
      <ThemedView style={styles.container}>
        <ErrorScreen message="Erro ao carregar registros" detail={error.message} onRetry={handleRefresh} />
      </ThemedView>
    );
  }

  const hasChangeLogs = Array.isArray(changeLogs) && changeLogs.length > 0;

  return (
    <>
      <ThemedView style={[styles.container, { backgroundColor: colors.background, paddingBottom: insets.bottom }]}>
        {/* Search and Filter */}
        <View style={styles.searchContainer}>
          <SearchBar
            value={displaySearchText}
            onChangeText={handleDisplaySearchChange}
            onSearch={handleSearch}
            placeholder="Buscar registros..."
            style={styles.searchBar}
            debounceMs={300}
          />
          <View style={styles.buttonContainer}>
            <ListActionButton
              icon={<IconList size={20} color={colors.foreground} />}
              onPress={handleOpenColumns}
              badgeCount={visibleColumnKeys.length}
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

        {/* Filter Tags */}
        <ChangeLogFilterTags
          filters={filters}
          searchText={searchText}
          onFilterChange={handleApplyFilters}
          onSearchChange={(text) => {
            setSearchText(text);
            setDisplaySearchText(text);
          }}
          onClearAll={handleClearFilters}
        />

        {hasChangeLogs ? (
          <TableErrorBoundary onRetry={handleRefresh}>
            <ChangeLogTable
              changeLogs={changeLogs}
              onChangeLogPress={handleChangeLogPress}
              onRefresh={handleRefresh}
              onEndReach={canLoadMore ? loadMore : () => {}}
              refreshing={refreshing}
              isLoading={isLoading && !isRefetching}
              loadingMore={isFetchingNextPage}
              canLoadMore={canLoadMore}
              error={error}
            />
          </TableErrorBoundary>
        ) : (
          <View style={styles.emptyContainer}>
            <EmptyState
              icon={searchText ? "search" : "history"}
              title={searchText ? "Nenhum registro encontrado" : "Nenhum registro de alteração"}
              description={searchText ? `Nenhum resultado para "${searchText}"` : "Registros de alterações do sistema aparecerão aqui"}
            />
          </View>
        )}

        {/* Items count */}
        {hasChangeLogs && <ItemsCountDisplay loadedCount={totalItemsLoaded} totalCount={totalCount} isLoading={isFetchingNextPage} />}
      </ThemedView>

      <SlideInPanel isOpen={isFilterPanelOpen} onClose={handleCloseFilters}>
        <ChangeLogFilterDrawerContent
          filters={filters}
          onFiltersChange={setFilters}
          onClear={handleClearFilters}
          activeFiltersCount={activeFiltersCount}
        />
      </SlideInPanel>

      <SlideInPanel isOpen={isColumnPanelOpen} onClose={handleCloseColumns}>
        <GenericColumnDrawerContent
          columns={[]}
          visibleColumns={new Set(visibleColumnKeys)}
          onVisibilityChange={() => {}}
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
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
