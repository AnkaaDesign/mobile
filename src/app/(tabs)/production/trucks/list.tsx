import React, { useState, useCallback } from "react";
import { View, Alert, Pressable , StyleSheet} from "react-native";
import { useRouter } from "expo-router";
import { IconPlus, IconFilter, IconList } from "@tabler/icons-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTruckMutations } from '../../../../hooks';
import { useTrucksInfiniteMobile } from "@/hooks";
import type { TruckGetManyFormData } from '../../../../schemas';

// Define SortConfig type
export interface SortConfig {
  columnKey: string;
  direction: "asc" | "desc";
}
import { ThemedView, ThemedText, FAB, ErrorScreen, EmptyState, SearchBar, Badge } from "@/components/ui";
import { TruckTable } from "@/components/production/truck/list/truck-table";
import { TruckFilterModal } from "@/components/production/truck/list/truck-filter-modal";
import { TruckFilterTags } from "@/components/production/truck/list/truck-filter-tags";
import { ColumnVisibilityManager } from "@/components/production/truck/list/column-visibility-manager";
import { TableErrorBoundary } from "@/components/ui/table-error-boundary";
import { ItemsCountDisplay } from "@/components/ui/items-count-display";
import { TruckListSkeleton } from "@/components/production/truck/skeleton/truck-list-skeleton";
import { useTheme } from "@/lib/theme";
import { routes } from '../../../../constants';
import { routeToMobilePath } from "@/lib/route-mapper";

export default function TruckListScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [displaySearchText, setDisplaySearchText] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<Partial<TruckGetManyFormData>>({});
  const [sortConfigs, setSortConfigs] = useState<SortConfig[]>([{ columnKey: "plate", direction: "asc" }]);
  const [selectedTrucks, setSelectedTrucks] = useState<Set<string>>(new Set());
  const [showSelection, setShowSelection] = useState(false);
  const [showColumnManager, setShowColumnManager] = useState(false);
  const [visibleColumnKeys, setVisibleColumnKeys] = useState<string[]>(["plate", "model", "manufacturer"]);

  // Build query parameters with sorting
  const buildOrderBy = () => {
    if (!sortConfigs || sortConfigs.length === 0) return { plate: "asc" };

    // If only one sort, return as object
    if (sortConfigs.length === 1) {
      const config = sortConfigs[0 as keyof typeof sortConfigs];
      switch (config.columnKey) {
        case "plate":
          return { plate: config.direction };
        case "model":
          return { model: config.direction };
        case "manufacturer":
          return { manufacturer: config.direction };
        case "xPosition":
          return { xPosition: config.direction };
        case "yPosition":
          return { yPosition: config.direction };
        case "createdAt":
          return { createdAt: config.direction };
        case "updatedAt":
          return { updatedAt: config.direction };
        case "taskName":
          return { task: { name: config.direction } };
        case "garageName":
          return { garage: { name: config.direction } };
        default:
          return { plate: "asc" };
      }
    }

    // Multiple sorts, return as array
    return sortConfigs.map((config) => {
      switch (config.columnKey) {
        case "plate":
          return { plate: config.direction };
        case "model":
          return { model: config.direction };
        case "manufacturer":
          return { manufacturer: config.direction };
        case "xPosition":
          return { xPosition: config.direction };
        case "yPosition":
          return { yPosition: config.direction };
        case "createdAt":
          return { createdAt: config.direction };
        case "updatedAt":
          return { updatedAt: config.direction };
        case "taskName":
          return { task: { name: config.direction } };
        case "garageName":
          return { garage: { name: config.direction } };
        default:
          return { plate: "asc" };
      }
    });
  };

  const queryParams = {
    orderBy: buildOrderBy(),
    ...(searchText ? { searchingFor: searchText } : {}),
    ...filters,
    include: {
      task: {
        include: {
          customer: true,
          sector: true,
        },
      },
      garage: true,
      _count: {
        select: {
          task: true,
        },
      },
    },
  };

  const { trucks, isLoading, error, refetch, isRefetching, loadMore, canLoadMore, isFetchingNextPage, totalItemsLoaded, refresh } = useTrucksInfiniteMobile(queryParams);
  const { delete: deleteTruck } = useTruckMutations();

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refresh();
    } finally {
      setRefreshing(false);
    }
  }, [refresh]);

  const handleCreateTruck = () => {
    router.push(routeToMobilePath(routes.production.trucks.create) as any);
  };

  const handleTruckPress = (truckId: string) => {
    router.push(routeToMobilePath(routes.production.trucks.details(truckId)) as any);
  };

  const handleEditTruck = (truckId: string) => {
    router.push(routeToMobilePath(routes.production.trucks.edit(truckId)) as any);
  };

  const handleDeleteTruck = useCallback(
    async (truckId: string) => {
      try {
        await deleteTruck(truckId);
        // Clear selection if the deleted truck was selected
        if (selectedTrucks.has(truckId)) {
          const newSelection = new Set(selectedTrucks);
          newSelection.delete(truckId);
          setSelectedTrucks(newSelection);
        }
      } catch (error) {
        Alert.alert("Erro", "Não foi possível excluir o caminhão. Tente novamente.");
      }
    },
    [deleteTruck, selectedTrucks],
  );

  const handleDuplicateTruck = useCallback(
    (truckId: string) => {
      const truck = trucks.find((truck) => truck.id === truckId);
      if (truck) {
        // Navigate to create page with pre-filled data
        router.push({
          pathname: routeToMobilePath(routes.production.trucks.create) as any,
          params: { duplicateFrom: truckId },
        });
      }
    },
    [trucks, router],
  );

  const handleSort = useCallback((configs: SortConfig[]) => {
    setSortConfigs(configs);
  }, []);

  const handleSelectionChange = useCallback((newSelection: Set<string>) => {
    setSelectedTrucks(newSelection);
  }, []);

  const handleSearch = useCallback((text: string) => {
    setSearchText(text);
  }, []);

  const handleDisplaySearchChange = useCallback((text: string) => {
    setDisplaySearchText(text);
  }, []);

  const handleApplyFilters = useCallback((newFilters: Partial<TruckGetManyFormData>) => {
    setFilters(newFilters);
    setShowFilters(false);
  }, []);

  const handleClearFilters = useCallback(() => {
    setFilters({});
    setSearchText("");
    setDisplaySearchText("");
    setSelectedTrucks(new Set());
    setShowSelection(false);
  }, []);

  const handleColumnsChange = useCallback((newColumns: string[]) => {
    setVisibleColumnKeys(newColumns);
  }, []);

  // Count active filters
  const activeFiltersCount = Object.entries(filters).filter(
    ([key, value]) => value !== undefined && value !== null && (Array.isArray(value) ? value.length > 0 : true),
  ).length;

  if (isLoading && !isRefetching) {
    return <TruckListSkeleton />;
  }

  if (error) {
    return (
      <ThemedView style={styles.container}>
        <ErrorScreen message="Erro ao carregar caminhões" detail={error.message} onRetry={handleRefresh} />
      </ThemedView>
    );
  }

  const hasTrucks = Array.isArray(trucks) && trucks.length > 0;

  return (
    <ThemedView style={[styles.container, { backgroundColor: colors.background, paddingBottom: insets.bottom }]}>
      {/* Search, Filter and Sort */}
      <View style={[styles.searchContainer]}>
        <SearchBar
          value={displaySearchText}
          onChangeText={handleDisplaySearchChange}
          onSearch={handleSearch}
          placeholder="Buscar caminhões..."
          style={styles.searchBar}
          debounceMs={300}
        />
        <View style={styles.buttonContainer}>
          <Pressable
            style={({ pressed }) => [styles.actionButton, { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }, pressed && styles.actionButtonPressed]}
            onPress={() => setShowColumnManager(true)}
          >
            <IconList size={24} color={colors.foreground} />
            <Badge style={{ ...styles.actionBadge, backgroundColor: colors.primary }} size="sm">
              <ThemedText style={{ ...styles.actionBadgeText, color: colors.primaryForeground }}>{visibleColumnKeys.length}</ThemedText>
            </Badge>
          </Pressable>
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
      <TruckFilterTags
        filters={filters}
        searchText={searchText}
        onFilterChange={handleApplyFilters}
        onSearchChange={(text) => {
          setSearchText(text);
          setDisplaySearchText(text);
        }}
        onClearAll={handleClearFilters}
      />

      {hasTrucks ? (
        <TableErrorBoundary onRetry={handleRefresh}>
          <TruckTable
            data={trucks}
            isLoading={isLoading && !isRefetching}
            error={error}
            onRefresh={handleRefresh}
            onTruckPress={handleTruckPress}
            onTruckEdit={handleEditTruck}
            onTruckDelete={handleDeleteTruck}
            onTruckDuplicate={handleDuplicateTruck}
            onEndReached={canLoadMore ? loadMore : undefined}
            refreshing={refreshing}
            loading={isLoading && !isRefetching}
            loadingMore={isFetchingNextPage}
            showSelection={showSelection}
            selectedTrucks={selectedTrucks}
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
            icon={searchText ? "search" : "truck"}
            title={searchText ? "Nenhum caminhão encontrado" : "Nenhum caminhão cadastrado"}
            description={searchText ? `Nenhum resultado para "${searchText}"` : "Comece cadastrando seu primeiro caminhão na frota"}
            actionLabel={searchText ? undefined : "Cadastrar Caminhão"}
            onAction={searchText ? undefined : handleCreateTruck}
          />
        </View>
      )}

      {/* Items count */}
      {hasTrucks && <ItemsCountDisplay loadedCount={totalItemsLoaded} totalCount={undefined} isLoading={isFetchingNextPage} />}

      {hasTrucks && <FAB icon="plus" onPress={handleCreateTruck} />}

      {/* Filter Modal */}
      <TruckFilterModal visible={showFilters} onClose={() => setShowFilters(false)} onApply={handleApplyFilters} currentFilters={filters} />

      {/* Column Visibility Manager Modal */}
      <ColumnVisibilityManager visible={showColumnManager} onClose={() => setShowColumnManager(false)} onColumnsChange={handleColumnsChange} currentColumns={visibleColumnKeys} />
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