import React, { useState, useCallback, useMemo } from "react";
import { View, Alert, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { IconFilter, IconPlus, IconList } from "@tabler/icons-react-native";
import { useSectorMutations } from '../../../../hooks';
import { useSectorsInfiniteMobile } from "@/hooks";
import type { SectorGetManyFormData } from '../../../../types';
import { ThemedView, ThemedText, FAB, ErrorScreen, EmptyState, SearchBar, Badge, Button } from "@/components/ui";
import { SectorTable, createColumnDefinitions } from "@/components/administration/sector/list/sector-table";
import { SectorFilterModal } from "@/components/administration/sector/list/sector-filter-modal";
import { SectorFilterTags } from "@/components/administration/sector/list/sector-filter-tags";
import { ItemsCountDisplay } from "@/components/ui/items-count-display";
import { SectorListSkeleton } from "@/components/administration/sector/skeleton/sector-list-skeleton";
import { useTheme } from "@/lib/theme";
import { routes } from '../../../../constants';
import { routeToMobilePath } from "@/lib/route-mapper";
import { ColumnVisibilityDrawerV2 } from "@/components/inventory/item/list/column-visibility-drawer-v2";

export default function SectorListScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [displaySearchText, setDisplaySearchText] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<Partial<SectorGetManyFormData>>({});
  const [showColumnManager, setShowColumnManager] = useState(false);
  const [visibleColumnKeys, setVisibleColumnKeys] = useState<string[]>(["name", "privileges"]);

  // Build query parameters
  const queryParams: SectorGetManyFormData = {
    orderBy: { name: "asc" as const },
    ...(searchText ? { searchingFor: searchText } : {}),
    ...filters,
    include: {
      _count: {
        users: true,
        tasks: true,
      },
    },
  };

  const { items: sectors, isLoading, error, refetch, isRefetching, loadMore, canLoadMore, isFetchingNextPage, totalItemsLoaded, refresh } = useSectorsInfiniteMobile(queryParams);
  const { delete: deleteSector } = useSectorMutations();

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refresh();
    } finally {
      setRefreshing(false);
    }
  }, [refresh]);

  const handleCreateSector = () => {
    router.push(routeToMobilePath(routes.administration.sectors.create) as any);
  };

  const handleSectorPress = (sectorId: string) => {
    router.push(routeToMobilePath(routes.administration.sectors.details(sectorId)) as any);
  };

  const handleEditSector = (sectorId: string) => {
    router.push(routeToMobilePath(routes.administration.sectors.edit(sectorId)) as any);
  };

  const handleDeleteSector = useCallback(
    async (sectorId: string) => {
      try {
        await deleteSector(sectorId);
      } catch (error) {
        Alert.alert("Erro", "Não foi possível excluir o setor. Tente novamente.");
      }
    },
    [deleteSector],
  );

  const handleSearch = useCallback((text: string) => {
    setSearchText(text);
  }, []);

  const handleDisplaySearchChange = useCallback((text: string) => {
    setDisplaySearchText(text);
  }, []);

  const handleApplyFilters = useCallback((newFilters: Partial<SectorGetManyFormData>) => {
    setFilters(newFilters);
    setShowFilters(false);
  }, []);

  const handleClearFilters = useCallback(() => {
    setFilters({});
    setSearchText("");
    setDisplaySearchText("");
  }, []);

  const handleColumnsChange = useCallback((newColumns: Set<string>) => {
    setVisibleColumnKeys(Array.from(newColumns));
  }, []);

  // Get all column definitions
  const allColumns = useMemo(() => createColumnDefinitions(), []);

  // Count active filters
  const activeFiltersCount = Object.entries(filters).filter(
    ([key, value]) => {
      // Skip include and orderBy
      if (key === "include" || key === "orderBy") return false;
      // Count if value is defined and not empty
      if (value === undefined || value === null) return false;
      if (typeof value === "object" && !Array.isArray(value)) {
        // Count nested objects like where
        return Object.keys(value).length > 0;
      }
      return true;
    },
  ).length;

  if (isLoading && !isRefetching) {
    return <SectorListSkeleton />;
  }

  if (error) {
    return (
      <ThemedView style={styles.container}>
        <ErrorScreen message="Erro ao carregar setores" detail={error.message} onRetry={handleRefresh} />
      </ThemedView>
    );
  }

  const hasSectors = Array.isArray(sectors) && sectors.length > 0;

  return (
    <ThemedView style={[styles.container, { backgroundColor: colors.background, paddingBottom: insets.bottom }]}>
      {/* Search and Filter */}
      <View style={styles.searchContainer}>
        <SearchBar
          value={displaySearchText}
          onChangeText={handleDisplaySearchChange}
          onSearch={handleSearch}
          placeholder="Buscar setores..."
          style={styles.searchBar}
          debounceMs={300}
        />
        <View style={styles.buttonContainer}>
          <View style={styles.actionButtonWrapper}>
            <Button
              variant="outline"
              onPress={() => setShowColumnManager(true)}
              style={{ ...styles.actionButton, backgroundColor: colors.input }}
            >
              <IconList size={20} color={colors.foreground} />
            </Button>
            <Badge style={{ ...styles.actionBadge, backgroundColor: colors.primary }} size="sm">
              <ThemedText style={{ ...styles.actionBadgeText, color: colors.primaryForeground }}>{visibleColumnKeys.length}</ThemedText>
            </Badge>
          </View>
          <View style={styles.actionButtonWrapper}>
            <Button
              variant="outline"
              onPress={() => setShowFilters(true)}
              style={{ ...styles.actionButton, backgroundColor: colors.input }}
            >
              <IconFilter size={20} color={colors.foreground} />
            </Button>
            {activeFiltersCount > 0 && (
              <Badge style={styles.actionBadge} variant="destructive" size="sm">
                <ThemedText style={StyleSheet.flatten([styles.actionBadgeText, { color: "white" }])}>{activeFiltersCount}</ThemedText>
              </Badge>
            )}
          </View>
        </View>
      </View>

      {/* Filter tags */}
      <SectorFilterTags
        filters={filters}
        searchText={searchText}
        onFilterChange={handleApplyFilters}
        onSearchChange={(text) => {
          setSearchText(text);
          setDisplaySearchText(text);
        }}
        onClearAll={handleClearFilters}
      />

      {hasSectors ? (
        <SectorTable
          sectors={sectors}
          onSectorPress={handleSectorPress}
          onSectorEdit={handleEditSector}
          onSectorDelete={handleDeleteSector}
          onRefresh={handleRefresh}
          onEndReached={canLoadMore ? loadMore : undefined}
          refreshing={refreshing}
          loading={isLoading && !isRefetching}
          loadingMore={isFetchingNextPage}
          enableSwipeActions={true}
          visibleColumnKeys={visibleColumnKeys}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <EmptyState
            icon={searchText ? "search" : "building"}
            title={searchText ? "Nenhum setor encontrado" : "Nenhum setor cadastrado"}
            description={searchText ? `Nenhum resultado para "${searchText}"` : "Comece cadastrando seu primeiro setor"}
            actionLabel={searchText ? undefined : "Cadastrar Setor"}
            onAction={searchText ? undefined : handleCreateSector}
          />
        </View>
      )}

      {/* Items count */}
      {hasSectors && <ItemsCountDisplay loadedCount={totalItemsLoaded} totalCount={undefined} isLoading={isFetchingNextPage} />}

      {hasSectors && <FAB icon="plus" onPress={handleCreateSector} />}

      {/* Filter Modal */}
      <SectorFilterModal visible={showFilters} onClose={() => setShowFilters(false)} onApply={handleApplyFilters} currentFilters={filters} />

      {/* Column Visibility Drawer */}
      <ColumnVisibilityDrawerV2
        columns={allColumns}
        visibleColumns={new Set(visibleColumnKeys)}
        onVisibilityChange={handleColumnsChange}
        open={showColumnManager}
        onOpenChange={setShowColumnManager}
      />
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
  actionButtonWrapper: {
    position: "relative",
  },
  actionButton: {
    height: 48,
    width: 48,
    borderRadius: 10,
    paddingHorizontal: 0,
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
});
