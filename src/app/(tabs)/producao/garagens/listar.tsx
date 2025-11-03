import { useState, useCallback, useMemo } from "react";
import { View, StyleSheet, Alert } from "react-native";
import { Stack, useRouter } from "expo-router";
import { IconFilter, IconList } from "@tabler/icons-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useGarageMutations } from "../../../../hooks";
import { useGaragesInfiniteMobile } from "@/hooks/use-garages-infinite-mobile";
import type { GarageGetManyFormData } from "../../../../schemas";
import { ThemedView, FAB, ErrorScreen, EmptyState, ListActionButton, SearchBar } from "@/components/ui";
import { GarageTable, createColumnDefinitions } from "@/components/production/garage/list/garage-table";
import type { SortConfig } from "@/components/production/garage/list/garage-table";
import { GarageFilterTags } from "@/components/production/garage/list/garage-filter-tags";
import { TableErrorBoundary } from "@/components/ui/table-error-boundary";
import { ItemsCountDisplay } from "@/components/ui/items-count-display";
import { GarageListSkeleton } from "@/components/production/garage/skeleton/garage-list-skeleton";
import { useTheme } from "@/lib/theme";
import { routes } from "../../../../constants";
import { routeToMobilePath } from "@/lib/route-mapper";

import { UtilityDrawerWrapper } from "@/components/ui/utility-drawer";
import { useUtilityDrawer } from "@/contexts/utility-drawer-context";
import { GenericColumnDrawerContent } from "@/components/ui/generic-column-drawer-content";
import { GarageFilterDrawerContent } from "@/components/production/garage/list/garage-filter-drawer-content";

export default function GarageListScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { openFilterDrawer, openColumnDrawer } = useUtilityDrawer();
  const [refreshing, setRefreshing] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [displaySearchText, setDisplaySearchText] = useState("");
  const [selectedGarages, setSelectedGarages] = useState<Set<string>>(new Set());
  const [showSelection, setShowSelection] = useState(false);
  const [visibleColumnKeys, setVisibleColumnKeys] = useState<string[]>(["name", "dimensions", "createdAt"]);

  // Filter state
  const [filters, setFilters] = useState<Partial<GarageGetManyFormData>>({});

  // Sort state
  const [sortConfigs, setSortConfigs] = useState<SortConfig[]>([{ columnKey: "name", direction: "asc" }]);

  // Build order by from sort configs
  const buildOrderBy = useCallback(() => {
    if (!sortConfigs || sortConfigs.length === 0) return { name: "asc" };

    if (sortConfigs.length === 1) {
      const config = sortConfigs[0];
      switch (config.columnKey) {
        case "name":
          return { name: config.direction };
        case "createdAt":
          return { createdAt: config.direction };
        case "updatedAt":
          return { updatedAt: config.direction };
        case "width":
          return { width: config.direction };
        case "length":
          return { length: config.direction };
        default:
          return { name: "asc" };
      }
    }

    // Multiple sorts
    return sortConfigs.map((config) => {
      switch (config.columnKey) {
        case "name":
          return { name: config.direction };
        case "createdAt":
          return { createdAt: config.direction };
        case "updatedAt":
          return { updatedAt: config.direction };
        case "width":
          return { width: config.direction };
        case "length":
          return { length: config.direction };
        default:
          return { name: "asc" };
      }
    });
  }, [sortConfigs]);

  // Build query parameters
  const queryParams = useMemo(
    () => ({
      orderBy: buildOrderBy(),
      ...(searchText ? { searchingFor: searchText } : {}),
      ...filters,
      include: {
        lanes: true,
        trucks: true,
      },
    }),
    [searchText, filters, buildOrderBy]
  );

  const {
    items: garages,
    isLoading,
    error,
    
    isRefetching,
    loadMore,
    canLoadMore,
    isFetchingNextPage,
    totalItemsLoaded,
    totalCount,
    refresh,
  } = useGaragesInfiniteMobile(queryParams);

  const { delete: deleteGarage } = useGarageMutations();

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refresh();
    } finally {
      setRefreshing(false);
    }
  }, [refresh]);

  const handleCreateGarage = () => {
    router.push(routeToMobilePath(routes.production.garages.create) as any);
  };

  const handleGaragePress = (garageId: string) => {
    router.push(routeToMobilePath(routes.production.garages.details(garageId)) as any);
  };

  const handleEditGarage = (garageId: string) => {
    router.push(routeToMobilePath(routes.production.garages.edit(garageId)) as any);
  };

  const handleDeleteGarage = useCallback(
    async (garageId: string) => {
      Alert.alert(
        "Confirmar Exclusão",
        "Tem certeza que deseja excluir esta garagem?",
        [
          {
            text: "Cancelar",
            style: "cancel",
          },
          {
            text: "Excluir",
            style: "destructive",
            onPress: async () => {
              try {
                await deleteGarage(garageId);
                if (selectedGarages.has(garageId)) {
                  const newSelection = new Set(selectedGarages);
                  newSelection.delete(garageId);
                  setSelectedGarages(newSelection);
                }
              } catch (error) {
                Alert.alert("Erro", "Não foi possível excluir a garagem");
              }
            },
          },
        ],
        { cancelable: true }
      );
    },
    [deleteGarage, selectedGarages]
  );

  const handleSelectionChange = useCallback((newSelection: Set<string>) => {
    setSelectedGarages(newSelection);
  }, []);

  const handleSearch = useCallback((text: string) => {
    setSearchText(text);
  }, []);

  const handleDisplaySearchChange = useCallback((text: string) => {
    setDisplaySearchText(text);
  }, []);

  const handleApplyFilters = useCallback((newFilters: Partial<GarageGetManyFormData>) => {
    setFilters(newFilters);
  }, []);

  const handleClearFilters = useCallback(() => {
    setFilters({});
    setSearchText("");
    setDisplaySearchText("");
    setSelectedGarages(new Set());
    setShowSelection(false);
  }, []);

  const handleSort = useCallback((configs: SortConfig[]) => {
    setSortConfigs(configs);
  }, []);

  // Get all column definitions
  const allColumns = useMemo(() => createColumnDefinitions(), []);

  // Convert visibleColumnKeys array to Set for GenericColumnDrawerContent
  const visibleColumns = useMemo(() => new Set(visibleColumnKeys), [visibleColumnKeys]);

  // Handle column visibility changes
  const handleColumnsChange = useCallback((newColumns: Set<string>) => {
    setVisibleColumnKeys(Array.from(newColumns));
  }, []);

  // Count active filters
  const activeFiltersCount = Object.entries(filters).filter(
    ([_key, value]) => value !== undefined && value !== null && (Array.isArray(value) ? value.length > 0 : true)
  ).length;

  const handleOpenFilters = useCallback(() => {
    openFilterDrawer(() => (
      <GarageFilterDrawerContent
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

  // Only show skeleton on initial load, not on refetch/sort
  const isInitialLoad = isLoading && !isRefetching && garages.length === 0;

  if (isInitialLoad) {
    return (
    <UtilityDrawerWrapper>

          <>
            <Stack.Screen
              options={{
                title: "Lista de Garagens",
                headerShown: true,
              }}
            />
            <GarageListSkeleton />
          </>
    
    </UtilityDrawerWrapper>
  );
  }

  if (error && garages.length === 0) {
    return (
      <>
        <Stack.Screen
          options={{
            title: "Lista de Garagens",
            headerShown: true,
          }}
        />
        <ThemedView style={styles.container}>
          <ErrorScreen message="Erro ao carregar garagens" detail={error.message} onRetry={handleRefresh} />
        </ThemedView>
      </>
    );
  }

  const hasGarages = Array.isArray(garages) && garages.length > 0;

  return (
    <>
      <Stack.Screen
        options={{
          title: "Lista de Garagens",
          headerShown: true,
        }}
      />
      <ThemedView style={[styles.container, { backgroundColor: colors.background, paddingBottom: insets.bottom }]}>
        {/* Search and Filter */}
        <View style={styles.searchContainer}>
          <SearchBar
            value={displaySearchText}
            onChangeText={handleDisplaySearchChange}
            onSearch={handleSearch}
            placeholder="Buscar garagens..."
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

        {/* Filter tags */}
        <GarageFilterTags
          filters={filters}
          searchText={searchText}
          onFilterChange={handleApplyFilters}
          onSearchChange={(text) => {
            setSearchText(text);
            setDisplaySearchText(text);
          }}
          onClearAll={handleClearFilters}
        />

        {hasGarages ? (
          <TableErrorBoundary onRetry={handleRefresh}>
            <GarageTable
              garages={garages}
              onGaragePress={handleGaragePress}
              onGarageEdit={handleEditGarage}
              onGarageDelete={handleDeleteGarage}
              onRefresh={handleRefresh}
              onEndReached={canLoadMore ? loadMore : undefined}
              refreshing={refreshing || isRefetching}
              loading={false}
              loadingMore={isFetchingNextPage}
              showSelection={showSelection}
              selectedGarages={selectedGarages}
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
              icon={searchText ? "search" : "building"}
              title={searchText ? "Nenhuma garagem encontrada" : "Nenhuma garagem cadastrada"}
              description={
                searchText ? `Nenhum resultado para "${searchText}"` : "Comece cadastrando a primeira garagem"
              }
              actionLabel={searchText ? undefined : "Cadastrar Garagem"}
              onAction={searchText ? undefined : handleCreateGarage}
            />
          </View>
        )}

        {/* Items count */}
        {hasGarages && (
          <ItemsCountDisplay loadedCount={totalItemsLoaded} totalCount={totalCount} isLoading={isFetchingNextPage} />
        )}

        {hasGarages && <FAB icon="plus" onPress={handleCreateGarage} />}
      </ThemedView>
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
