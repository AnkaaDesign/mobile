import React, { useState, useCallback } from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { IconPlus, IconFilter } from "@tabler/icons-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useVacationMutations } from '../../../../hooks';
import { useVacationsInfiniteMobile } from "@/hooks";
import type { VacationGetManyFormData } from '../../../../schemas';
import { ThemedView, ThemedText, FAB, ErrorScreen, EmptyState, SearchBar, Badge } from "@/components/ui";
import { VacationTable } from "@/components/human-resources/vacation/list/vacation-table";
import { VacationFilterModal } from "@/components/human-resources/vacation/list/vacation-filter-modal";
import { VacationFilterTags } from "@/components/human-resources/vacation/list/vacation-filter-tags";
import { ItemsCountDisplay } from "@/components/ui/items-count-display";
import { VacationListSkeleton } from "@/components/human-resources/vacation/skeleton/vacation-list-skeleton";
import { useTheme } from "@/lib/theme";
import { routes } from '../../../../constants';
import { routeToMobilePath } from "@/lib/route-mapper";

export default function VacationListScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [displaySearchText, setDisplaySearchText] = useState("");
  const [showFilters, setShowFilters] = useState(false);
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

  const { items: vacations, isLoading, error, refetch, isRefetching, loadMore, canLoadMore, isFetchingNextPage, totalItemsLoaded, refresh } = useVacationsInfiniteMobile(queryParams);

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
    if ((filters.where?.status as any)?.in?.length > 0) count++;
    if ((filters.where?.type as any)?.in?.length > 0) count++;
    if (filters.where?.userId) count++;
    if (filters.where?.startAt) count++;
    if (filters.where?.endAt) count++;
    return count;
  })();

  if (isLoading && !isRefetching) {
    return <VacationListSkeleton />;
  }

  if (error) {
    return (
      <ThemedView style={styles.container}>
        <ErrorScreen message="Erro ao carregar férias" detail={error.message} onRetry={handleRefresh} />
      </ThemedView>
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
          <Pressable
            style={({ pressed }) => [styles.actionButton, { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }, pressed && styles.actionButtonPressed]}
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
          <ItemsCountDisplay loadedCount={totalItemsLoaded} totalCount={undefined} isLoading={isFetchingNextPage} />
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

      {/* Filter Modal */}
      <VacationFilterModal visible={showFilters} onClose={() => setShowFilters(false)} onApply={handleApplyFilters} currentFilters={filters} />
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
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  actionButtonPressed: {
    opacity: 0.8,
  },
});
