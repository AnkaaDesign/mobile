import React, { useState, useCallback } from "react";
import { View, Pressable, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { IconFilter } from "@tabler/icons-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { ChangeLogGetManyFormData } from '../../../../schemas';
import { ThemedView, ThemedText, ErrorScreen, EmptyState, SearchBar, Badge } from "@/components/ui";
import { ChangeLogTable } from "@/components/administration/change-log/list/change-log-table";
import { ChangeLogFilterModal } from "@/components/administration/change-log/list/change-log-filter-modal";
import { ChangeLogFilterTags } from "@/components/administration/change-log/list/change-log-filter-tags";
import { TableErrorBoundary } from "@/components/ui/table-error-boundary";
import { ItemsCountDisplay } from "@/components/ui/items-count-display";
import { ChangeLogListSkeleton } from "@/components/administration/change-log/skeleton/change-log-list-skeleton";
import { useTheme } from "@/lib/theme";
import { routes } from '../../../../constants';
import { routeToMobilePath } from "@/lib/route-mapper";
import { useChangeLogsInfiniteMobile } from "@/hooks";

export default function AdministrationChangeLogsListScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [displaySearchText, setDisplaySearchText] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<Partial<ChangeLogGetManyFormData>>({});

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
    refetch,
    isRefetching,
    loadMore,
    canLoadMore,
    isFetchingNextPage,
    totalItemsLoaded,
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
    setShowFilters(false);
  }, []);

  const handleClearFilters = useCallback(() => {
    setFilters({});
    setSearchText("");
    setDisplaySearchText("");
  }, []);

  // Count active filters
  const activeFiltersCount = Object.entries(filters).filter(
    ([key, value]) => {
      if (value === undefined || value === null) return false;
      if (Array.isArray(value)) return value.length > 0;
      if (typeof value === "object" && !Array.isArray(value)) {
        return Object.values(value).some(v => v !== undefined && v !== null);
      }
      return true;
    }
  ).length;

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
          <Pressable
            style={({ pressed }) => [
              styles.actionButton,
              {
                backgroundColor: colors.card,
                borderWidth: 1,
                borderColor: colors.border,
              },
              pressed && styles.actionButtonPressed,
            ]}
            onPress={() => setShowFilters(true)}
          >
            <IconFilter size={24} color={colors.foreground} />
            {activeFiltersCount > 0 && (
              <Badge style={styles.actionBadge} variant="destructive" size="sm">
                <ThemedText style={StyleSheet.flatten([styles.actionBadgeText, { color: "white" }])}>
                  {activeFiltersCount}
                </ThemedText>
              </Badge>
            )}
          </Pressable>
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
      {hasChangeLogs && <ItemsCountDisplay loadedCount={totalItemsLoaded} totalCount={undefined} isLoading={isFetchingNextPage} />}

      {/* Filter Modal */}
      <ChangeLogFilterModal visible={showFilters} onClose={() => setShowFilters(false)} onApply={handleApplyFilters} currentFilters={filters} />
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
