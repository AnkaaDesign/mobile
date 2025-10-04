import React, { useState, useCallback } from "react";
import { View, ActivityIndicator, Pressable, Alert, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { IconPlus, IconFilter, IconList } from "@tabler/icons-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useWarningMutations } from '../../../../hooks';
import { useWarningsInfiniteMobile } from "@/hooks";
import type { WarningGetManyFormData } from '../../../../schemas';
import { ThemedView, ThemedText, FAB, ErrorScreen, EmptyState, SearchBar, Badge } from "@/components/ui";
import { WarningTable } from "@/components/human-resources/warning/list/warning-table";
import type { SortConfig } from "@/components/human-resources/warning/list/warning-table";
import { WarningFilterModal } from "@/components/human-resources/warning/list/warning-filter-modal";
import { WarningFilterTags } from "@/components/human-resources/warning/list/warning-filter-tags";
import { TableErrorBoundary } from "@/components/ui/table-error-boundary";
import { ItemsCountDisplay } from "@/components/ui/items-count-display";
import { WarningListSkeleton } from "@/components/human-resources/warning/skeleton/warning-list-skeleton";
import { useTheme } from "@/lib/theme";
import { routes } from '../../../../constants';
import { routeToMobilePath } from "@/lib/route-mapper";

export default function WarningListScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [displaySearchText, setDisplaySearchText] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<Partial<WarningGetManyFormData>>({});
  const [sortConfigs, setSortConfigs] = useState<SortConfig[]>([{ columnKey: "createdAt", direction: "desc" }]);
  const [selectedWarnings, setSelectedWarnings] = useState<Set<string>>(new Set());
  const [showSelection, setShowSelection] = useState(false);
  const [visibleColumnKeys, setVisibleColumnKeys] = useState<string[]>(["collaborator", "category", "severity", "createdAt"]);

  // Build query parameters with sorting
  const buildOrderBy = () => {
    if (!sortConfigs || sortConfigs.length === 0) return { createdAt: "desc" };

    // If only one sort, return as object
    if (sortConfigs.length === 1) {
      const config = sortConfigs[0 as keyof typeof sortConfigs];
      switch (config.columnKey) {
        case "collaborator":
          return { collaborator: { name: config.direction } };
        case "category":
          return { category: config.direction };
        case "severity":
          return { severityOrder: config.direction };
        case "reason":
          return { reason: config.direction };
        case "followUpDate":
          return { followUpDate: config.direction };
        case "createdAt":
          return { createdAt: config.direction };
        case "isActive":
          return { isActive: config.direction };
        default:
          return { createdAt: "desc" };
      }
    }

    // Multiple sorts, return as array
    return sortConfigs.map((config) => {
      switch (config.columnKey) {
        case "collaborator":
          return { collaborator: { name: config.direction } };
        case "category":
          return { category: config.direction };
        case "severity":
          return { severityOrder: config.direction };
        case "reason":
          return { reason: config.direction };
        case "followUpDate":
          return { followUpDate: config.direction };
        case "createdAt":
          return { createdAt: config.direction };
        case "isActive":
          return { isActive: config.direction };
        default:
          return { createdAt: "desc" };
      }
    });
  };

  const queryParams = {
    orderBy: buildOrderBy(),
    ...(searchText ? { searchingFor: searchText } : {}),
    ...filters,
    include: {
      collaborator: true,
      supervisor: true,
    },
  };

  const { items: warnings, isLoading, error, refetch, isRefetching, loadMore, canLoadMore, isFetchingNextPage, totalItemsLoaded, refresh } = useWarningsInfiniteMobile(queryParams);
  const { delete: deleteWarning } = useWarningMutations();

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refresh();
    } finally {
      setRefreshing(false);
    }
  }, [refresh]);

  const handleCreateWarning = () => {
    router.push(routeToMobilePath(routes.humanResources.warnings.create) as any);
  };

  const handleWarningPress = (warningId: string) => {
    router.push(routeToMobilePath(routes.humanResources.warnings.details(warningId)) as any);
  };

  const handleEditWarning = (warningId: string) => {
    router.push(routeToMobilePath(routes.humanResources.warnings.edit(warningId)) as any);
  };

  const handleDeleteWarning = useCallback(
    async (warningId: string) => {
      try {
        await deleteWarning(warningId);
        // Clear selection if the deleted warning was selected
        if (selectedWarnings.has(warningId)) {
          const newSelection = new Set(selectedWarnings);
          newSelection.delete(warningId);
          setSelectedWarnings(newSelection);
        }
      } catch (error) {
        Alert.alert("Erro", "Não foi possível excluir a advertência. Tente novamente.");
      }
    },
    [deleteWarning, selectedWarnings],
  );

  const handleSort = useCallback((configs: SortConfig[]) => {
    setSortConfigs(configs);
  }, []);

  const handleSelectionChange = useCallback((newSelection: Set<string>) => {
    setSelectedWarnings(newSelection);
  }, []);

  const handleSearch = useCallback((text: string) => {
    setSearchText(text);
  }, []);

  const handleDisplaySearchChange = useCallback((text: string) => {
    setDisplaySearchText(text);
  }, []);

  const handleApplyFilters = useCallback((newFilters: Partial<WarningGetManyFormData>) => {
    setFilters(newFilters);
    setShowFilters(false);
  }, []);

  const handleClearFilters = useCallback(() => {
    setFilters({});
    setSearchText("");
    setDisplaySearchText("");
    setSelectedWarnings(new Set());
    setShowSelection(false);
  }, []);

  // Count active filters
  const activeFiltersCount = Object.entries(filters).filter(([key, value]) => value !== undefined && value !== null && (Array.isArray(value) ? value.length > 0 : true)).length;

  if (isLoading && !isRefetching) {
    return <WarningListSkeleton />;
  }

  if (error) {
    return (
      <ThemedView style={styles.container}>
        <ErrorScreen message="Erro ao carregar advertências" detail={error.message} onRetry={handleRefresh} />
      </ThemedView>
    );
  }

  const hasWarnings = Array.isArray(warnings) && warnings.length > 0;

  return (
    <ThemedView style={[styles.container, { backgroundColor: colors.background, paddingBottom: insets.bottom }]}>
      {/* Search, Filter and Sort */}
      <View style={[styles.searchContainer]}>
        <SearchBar value={displaySearchText} onChangeText={handleDisplaySearchChange} onSearch={handleSearch} placeholder="Buscar advertências..." style={styles.searchBar} debounceMs={300} />
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
                <ThemedText style={StyleSheet.flatten([styles.actionBadgeText, { color: "white" }])}>{activeFiltersCount}</ThemedText>
              </Badge>
            )}
          </Pressable>
        </View>
      </View>

      {/* Individual filter tags */}
      <WarningFilterTags
        filters={filters}
        searchText={searchText}
        onFilterChange={handleApplyFilters}
        onSearchChange={(text) => {
          setSearchText(text);
          setDisplaySearchText(text);
        }}
        onClearAll={handleClearFilters}
      />

      {hasWarnings ? (
        <TableErrorBoundary onRetry={handleRefresh}>
          <WarningTable
            warnings={warnings}
            onWarningPress={handleWarningPress}
            onWarningEdit={handleEditWarning}
            onWarningDelete={handleDeleteWarning}
            onRefresh={handleRefresh}
            onEndReached={canLoadMore ? loadMore : undefined}
            refreshing={refreshing}
            loading={isLoading && !isRefetching}
            loadingMore={isFetchingNextPage}
            showSelection={showSelection}
            selectedWarnings={selectedWarnings}
            onSelectionChange={handleSelectionChange}
            sortConfigs={sortConfigs}
            onSort={handleSort}
            visibleColumnKeys={visibleColumnKeys}
            enableSwipeActions={true}
          />
        </TableErrorBoundary>
      ) : (
        <View style={styles.emptyContainer}>
          <EmptyState
            icon={searchText ? "search" : "alert-circle"}
            title={searchText ? "Nenhuma advertência encontrada" : "Nenhuma advertência cadastrada"}
            description={searchText ? `Nenhum resultado para "${searchText}"` : "Comece cadastrando a primeira advertência"}
            actionLabel={searchText ? undefined : "Cadastrar Advertência"}
            onAction={searchText ? undefined : handleCreateWarning}
          />
        </View>
      )}

      {/* Items count */}
      {hasWarnings && <ItemsCountDisplay loadedCount={totalItemsLoaded} totalCount={undefined} isLoading={isFetchingNextPage} />}

      {hasWarnings && <FAB icon="plus" onPress={handleCreateWarning} />}

      {/* Filter Modal */}
      <WarningFilterModal visible={showFilters} onClose={() => setShowFilters(false)} onApply={handleApplyFilters} currentFilters={filters} />
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    opacity: 0.7,
  },
  actionButtonPressed: {
    opacity: 0.8,
  },
});
