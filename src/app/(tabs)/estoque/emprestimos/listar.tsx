import { useState, useCallback, useMemo } from "react";
import { View, ActivityIndicator, Alert, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { IconFilter, IconList } from "@tabler/icons-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useBorrowMutations } from '../../../../hooks';
import { useBorrowsInfiniteMobile } from "@/hooks/use-borrows-infinite-mobile";
import type { BorrowGetManyFormData } from '../../../../schemas';
import { ThemedView, ThemedText, FAB, ErrorScreen, EmptyState, SearchBar, ListActionButton } from "@/components/ui";
import { BorrowTable, createColumnDefinitions } from "@/components/inventory/borrow/list/borrow-table";
import type { SortConfig } from "@/components/inventory/borrow/list/borrow-table";

import { BorrowFilterTags } from "@/components/inventory/borrow/list/borrow-filter-tags";

import { TableErrorBoundary } from "@/components/ui/table-error-boundary";
import { ItemsCountDisplay } from "@/components/ui/items-count-display";
import { useTheme } from "@/lib/theme";
import { routes } from '../../../../constants';
import { routeToMobilePath } from "@/lib/route-mapper";
import { BORROW_STATUS } from '../../../../constants';

import { UtilityDrawerWrapper } from "@/components/ui/utility-drawer";
import { useUtilityDrawer } from "@/contexts/utility-drawer-context";
import { GenericColumnDrawerContent } from "@/components/ui/generic-column-drawer-content";
import { BorrowFilterDrawerContent } from "@/components/inventory/borrow/list/borrow-filter-drawer-content";

export default function BorrowListScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { openFilterDrawer, openColumnDrawer } = useUtilityDrawer();
  const [refreshing, setRefreshing] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [displaySearchText, setDisplaySearchText] = useState("");
  const [filters, setFilters] = useState<Partial<BorrowGetManyFormData>>({
    // Default to showing only active borrows
    statusIds: [BORROW_STATUS.ACTIVE],
  });
  const [sortConfigs, setSortConfigs] = useState<SortConfig[]>([{ columnKey: "createdAt", direction: "desc" }]);
  const [selectedBorrows, setSelectedBorrows] = useState<Set<string>>(new Set());
  const [showSelection, setShowSelection] = useState(false);
  const [visibleColumnKeys, setVisibleColumnKeys] = useState<string[]>(["item.name", "user.name", "status"]);

  // Build query parameters with sorting
  const buildOrderBy = () => {
    if (!sortConfigs || sortConfigs.length === 0) return { createdAt: "desc" };

    // If only one sort, return as object
    if (sortConfigs.length === 1) {
      const config = sortConfigs[0];
      switch (config.columnKey) {
        case "item.uniCode":
          return { item: { uniCode: config.direction } };
        case "item.name":
          return { item: { name: config.direction } };
        case "item.category.name":
          return { item: { category: { name: config.direction } } };
        case "item.brand.name":
          return { item: { brand: { name: config.direction } } };
        case "user.name":
          return { user: { name: config.direction } };
        case "quantity":
          return { quantity: config.direction };
        case "status":
          return { status: config.direction };
        case "createdAt":
          return { createdAt: config.direction };
        case "returnedAt":
          return { returnedAt: config.direction };
        case "updatedAt":
          return { updatedAt: config.direction };
        default:
          return { createdAt: "desc" };
      }
    }

    // Multiple sorts, return as array
    return sortConfigs.map((config) => {
      switch (config.columnKey) {
        case "item.uniCode":
          return { item: { uniCode: config.direction } };
        case "item.name":
          return { item: { name: config.direction } };
        case "item.category.name":
          return { item: { category: { name: config.direction } } };
        case "item.brand.name":
          return { item: { brand: { name: config.direction } } };
        case "user.name":
          return { user: { name: config.direction } };
        case "quantity":
          return { quantity: config.direction };
        case "status":
          return { status: config.direction };
        case "createdAt":
          return { createdAt: config.direction };
        case "returnedAt":
          return { returnedAt: config.direction };
        case "updatedAt":
          return { updatedAt: config.direction };
        default:
          return { createdAt: "desc" };
      }
    });
  };

  const queryParams = {
    orderBy: buildOrderBy(),
    ...(searchText ? { searchingFor: searchText } : {}),
    ...filters,
  };

  const { items, isLoading, error, isRefetching, loadMore, canLoadMore, isFetchingNextPage, totalItemsLoaded, totalCount, refresh } = useBorrowsInfiniteMobile(queryParams);
  const { deleteAsync: deleteBorrow, update } = useBorrowMutations();

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refresh();
    } finally {
      setRefreshing(false);
    }
  }, [refresh]);

  const handleCreateBorrow = () => {
    router.push(routeToMobilePath(routes.inventory.borrows.create) as any);
  };

  const handleBorrowPress = (borrowId: string) => {
    router.push(routeToMobilePath(routes.inventory.borrows.details(borrowId)) as any);
  };

  const handleEditBorrow = (borrowId: string) => {
    router.push(routeToMobilePath(routes.inventory.borrows.edit(borrowId)) as any);
  };

  const handleDeleteBorrow = useCallback(
    async (borrowId: string) => {
      try {
        await deleteBorrow(borrowId);
        // Clear selection if the deleted item was selected
        if (selectedBorrows.has(borrowId)) {
          const newSelection = new Set(selectedBorrows);
          newSelection.delete(borrowId);
          setSelectedBorrows(newSelection);
        }
      } catch (error) {
        Alert.alert("Erro", "Não foi possível excluir o empréstimo. Tente novamente.");
      }
    },
    [deleteBorrow, selectedBorrows],
  );

  const handleReturnBorrow = useCallback(
    async (borrowId: string) => {
      Alert.alert("Devolver Item", "Confirma a devolução deste item?", [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Devolver",
          style: "default",
          onPress: async () => {
            try {
              await update({
                id: borrowId,
                data: {
                  status: BORROW_STATUS.RETURNED,
                  returnedAt: new Date(),
                },
              });
            } catch (error) {
              Alert.alert("Erro", "Não foi possível devolver o item");
            }
          },
        },
      ]);
    },
    [update],
  );

  const handleMarkAsLost = useCallback(
    async (borrowId: string) => {
      Alert.alert("Marcar como Perdido", "Tem certeza que deseja marcar este item como perdido? Esta ação é irreversível.", [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Marcar como Perdido",
          style: "destructive",
          onPress: async () => {
            try {
              await update({
                id: borrowId,
                data: { status: BORROW_STATUS.LOST },
              });
            } catch (error) {
              Alert.alert("Erro", "Não foi possível marcar o item como perdido");
            }
          },
        },
      ]);
    },
    [update],
  );

  const handleSort = useCallback((configs: SortConfig[]) => {
    setSortConfigs(configs);
  }, []);

  const handleSelectionChange = useCallback((newSelection: Set<string>) => {
    setSelectedBorrows(newSelection);
  }, []);

  const handleSearch = useCallback((text: string) => {
    setSearchText(text);
  }, []);

  const handleDisplaySearchChange = useCallback((text: string) => {
    setDisplaySearchText(text);
  }, []);

  const handleApplyFilters = useCallback((newFilters: Partial<BorrowGetManyFormData>) => {
    setFilters(newFilters);
  }, []);

  const handleClearFilters = useCallback(() => {
    setFilters({ statusIds: [BORROW_STATUS.ACTIVE] });
    setSearchText("");
    setDisplaySearchText("");
    setSelectedBorrows(new Set());
    setShowSelection(false);
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
    ([_key, value]) => value !== undefined && value !== null && (Array.isArray(value) ? value.length > 0 : true),
  ).length;

  const handleOpenFilters = useCallback(() => {
    openFilterDrawer(() => (
      <BorrowFilterDrawerContent
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
  const isInitialLoad = isLoading && !isRefetching && items.length === 0;

  if (isInitialLoad) {
    return (
    <UtilityDrawerWrapper>

          <ThemedView style={styles.container}>
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <ThemedText style={styles.loadingText}>Carregando empréstimos...</ThemedText>
            </View>
          </ThemedView>
    
    </UtilityDrawerWrapper>
  );
  }

  if (error && items.length === 0) {
    return (
      <ThemedView style={styles.container}>
        <ErrorScreen message="Erro ao carregar empréstimos" detail={error.message} onRetry={handleRefresh} />
      </ThemedView>
    );
  }

  const hasBorrows = Array.isArray(items) && items.length > 0;

  return (
    <ThemedView style={[styles.container, { backgroundColor: colors.background, paddingBottom: insets.bottom }]}>
      {/* Search, Filter and Sort */}
      <View style={[styles.searchContainer]}>
        <SearchBar
          value={displaySearchText}
          onChangeText={handleDisplaySearchChange}
          onSearch={handleSearch}
          placeholder="Buscar por item ou usuário..."
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

      {/* Individual filter tags */}
      <BorrowFilterTags
        filters={filters}
        searchText={searchText}
        onClearAll={handleClearFilters}
        onRemoveFilter={(key: string) => {
          const newFilters = { ...filters };
          delete (newFilters as any)[key];
          setFilters(newFilters);
        }}
        onClearSearch={() => {
          setSearchText("");
          setDisplaySearchText("");
        }}
      />

      {hasBorrows ? (
        <TableErrorBoundary onRetry={handleRefresh}>
          <BorrowTable
            borrows={items}
            onBorrowPress={handleBorrowPress}
            onBorrowEdit={handleEditBorrow}
            onBorrowDelete={handleDeleteBorrow}
            onReturn={handleReturnBorrow}
            onMarkAsLost={handleMarkAsLost}
            onRefresh={handleRefresh}
            onEndReached={canLoadMore ? loadMore : undefined}
            refreshing={refreshing || isRefetching}
            loading={false}
            loadingMore={isFetchingNextPage}
            showSelection={showSelection}
            selectedBorrows={selectedBorrows}
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
            icon={searchText ? "search" : "package"}
            title={searchText ? "Nenhum empréstimo encontrado" : "Nenhum empréstimo cadastrado"}
            description={searchText ? `Nenhum resultado para "${searchText}"` : "Comece cadastrando seu primeiro empréstimo"}
            actionLabel={searchText ? undefined : "Cadastrar Empréstimo"}
            onAction={searchText ? undefined : handleCreateBorrow}
          />
        </View>
      )}

      {/* Items count */}
      {hasBorrows && <ItemsCountDisplay loadedCount={totalItemsLoaded} totalCount={totalCount} isLoading={isFetchingNextPage} />}

      {hasBorrows && <FAB icon="plus" onPress={handleCreateBorrow} />}
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
});
