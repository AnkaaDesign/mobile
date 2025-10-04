import React, { useState, useCallback } from "react";
import { View, StyleSheet, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { ThemedView, ThemedText, FAB, SearchBar, ErrorScreen, EmptyState, ItemsCountDisplay } from "@/components/ui";
import { ErrorBoundary } from "@/components/error-boundary";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize, fontWeight } from "@/constants/design-system";
import { BrandTable, type SortConfig } from "@/components/inventory/item/brand/list/brand-table";
import { useItemBrandsInfiniteMobile } from "@/hooks";
import { routes } from '../../../../../constants';
import { routeToMobilePath } from "@/lib/route-mapper";
import { IconPlus } from "@tabler/icons-react-native";

export default function ListarMarcasScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  // State
  const [refreshing, setRefreshing] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [displaySearchText, setDisplaySearchText] = useState("");
  const [sortConfigs, setSortConfigs] = useState<SortConfig[]>([{ columnKey: "name", direction: "asc" }]);
  const [selectedBrands, setSelectedBrands] = useState<Set<string>>(new Set());

  // Build orderBy from sort configs
  const buildOrderBy = () => {
    if (!sortConfigs || sortConfigs.length === 0) return { name: "asc" };

    // If only one sort, return as object
    if (sortConfigs.length === 1) {
      const config = sortConfigs[0 as keyof typeof sortConfigs];
      return { [config.columnKey]: config.direction };
    }

    // Multiple sorts, return as array
    return sortConfigs.map((config) => ({ [config.columnKey]: config.direction }));
  };

  // Query parameters
  const queryParams = {
    ...(searchText.trim() && { searchingFor: searchText.trim() }),
    orderBy: buildOrderBy(),
    include: {
      items: true,
    },
  };

  // Fetch brands with infinite scroll
  const { items: brands, isLoading, error, refetch, refresh, loadMore, canLoadMore, isFetchingNextPage, totalItemsLoaded } = useItemBrandsInfiniteMobile(queryParams);

  // Handlers
  const handleBrandPress = useCallback(
    (brandId: string) => {
      router.push(routeToMobilePath(routes.inventory.products.brands.details(brandId)) as any);
    },
    [router],
  );

  const handleBrandEdit = useCallback(
    (brandId: string) => {
      router.push(routeToMobilePath(routes.inventory.products.brands.edit(brandId)) as any);
    },
    [router],
  );

  const handleBrandDelete = useCallback((brandId: string) => {
    // Delete handled by table component
  }, []);

  const handleCreateBrand = useCallback(() => {
    router.push(routeToMobilePath(routes.inventory.products.brands.create) as any);
  }, [router]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refresh();
    } finally {
      setRefreshing(false);
    }
  }, [refresh]);

  const handleDisplaySearchChange = useCallback((text: string) => {
    setDisplaySearchText(text);
  }, []);

  const handleSearch = useCallback((text: string) => {
    setSearchText(text);
  }, []);

  if (error) {
    return <ErrorScreen error={error} message="Erro ao carregar marcas" detail="Não foi possível carregar as marcas. Tente novamente." onRetry={refetch} />;
  }

  return (
    <ErrorBoundary>
      <ThemedView style={[styles.container, { backgroundColor: colors.background, paddingBottom: insets.bottom }]}>
        {/* Search */}
        <View style={styles.searchContainer}>
          <SearchBar value={displaySearchText} onChangeText={handleDisplaySearchChange} onSearch={handleSearch} placeholder="Buscar marcas..." style={styles.searchBar} />
        </View>

        {/* Brands Table */}
        {brands.length > 0 ? (
          <BrandTable
            brands={brands}
            onBrandPress={handleBrandPress}
            onBrandEdit={handleBrandEdit}
            onBrandDelete={handleBrandDelete}
            onRefresh={handleRefresh}
            onEndReached={canLoadMore ? loadMore : undefined}
            refreshing={refreshing}
            loading={isLoading}
            loadingMore={isFetchingNextPage}
            sortConfigs={sortConfigs}
            onSort={setSortConfigs}
            selectedBrands={selectedBrands}
            onSelectionChange={setSelectedBrands}
            showSelection={false}
            enableSwipeActions={true}
          />
        ) : (
          <View style={styles.emptyContainer}>
            <EmptyState
            icon={searchText ? "search" : "package"}
              title={searchText ? "Nenhuma marca encontrada" : "Nenhuma marca cadastrada"}
              description={searchText ? `Nenhum resultado para "${searchText}"` : "Comece cadastrando sua primeira marca de produtos"}
              actionLabel={searchText ? undefined : "Cadastrar Marca"}
              onAction={searchText ? undefined : handleCreateBrand}
            />
          </View>
        )}

        {/* Brands count */}
        {brands.length > 0 && <ItemsCountDisplay loadedCount={totalItemsLoaded} totalCount={undefined} isLoading={isFetchingNextPage} itemType="marca" itemTypePlural="marcas" />}

        {/* FAB */}
        <FAB icon="plus" onPress={handleCreateBrand} />
      </ThemedView>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    paddingHorizontal: 8,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  searchBar: {
    // SearchBar styles handled by component
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: spacing.xxl,
    gap: spacing.md,
  },
});
