import React, { useState, useCallback } from "react";
import { View, StyleSheet, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { ThemedView, ThemedText, FAB, SearchBar, ErrorScreen, EmptyState, ItemsCountDisplay } from "@/components/ui";
import { ErrorBoundary } from "@/components/error-boundary";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize, fontWeight } from "@/constants/design-system";
import { CategoryTable, type SortConfig } from "@/components/inventory/item/category/list/category-table";
import { useItemCategoriesInfiniteMobile } from "@/hooks";
import { routes } from '../../../../../constants';
import { routeToMobilePath } from "@/lib/route-mapper";
import { IconPlus } from "@tabler/icons-react-native";

export default function ListarCategoriasScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  // State
  const [refreshing, setRefreshing] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [displaySearchText, setDisplaySearchText] = useState("");
  const [sortConfigs, setSortConfigs] = useState<SortConfig[]>([{ columnKey: "name", direction: "asc" }]);
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());

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

  // Fetch categories with infinite scroll
  const { items: categories, isLoading, error, refetch, refresh, loadMore, canLoadMore, isFetchingNextPage, totalItemsLoaded } = useItemCategoriesInfiniteMobile(queryParams);

  // Handlers
  const handleCategoryPress = useCallback(
    (categoryId: string) => {
      router.push(routeToMobilePath(routes.inventory.products.categories.details(categoryId)) as any);
    },
    [router],
  );

  const handleCategoryEdit = useCallback(
    (categoryId: string) => {
      router.push(routeToMobilePath(routes.inventory.products.categories.edit(categoryId)) as any);
    },
    [router],
  );

  const handleCategoryDelete = useCallback((categoryId: string) => {
    // Delete handled by table component
  }, []);

  const handleCreateCategory = useCallback(() => {
    router.push(routeToMobilePath(routes.inventory.products.categories.create) as any);
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
    return <ErrorScreen error={error} message="Erro ao carregar categorias" detail="Não foi possível carregar as categorias. Tente novamente." onRetry={refetch} />;
  }

  return (
    <ErrorBoundary>
      <ThemedView style={[styles.container, { backgroundColor: colors.background, paddingBottom: insets.bottom }]}>
        {/* Search */}
        <View style={styles.searchContainer}>
          <SearchBar value={displaySearchText} onChangeText={handleDisplaySearchChange} onSearch={handleSearch} placeholder="Buscar categorias..." style={styles.searchBar} />
        </View>

        {/* Categories Table */}
        {categories.length > 0 ? (
          <CategoryTable
            categories={categories}
            onCategoryPress={handleCategoryPress}
            onCategoryEdit={handleCategoryEdit}
            onCategoryDelete={handleCategoryDelete}
            onRefresh={handleRefresh}
            onEndReached={canLoadMore ? loadMore : undefined}
            refreshing={refreshing}
            loading={isLoading}
            loadingMore={isFetchingNextPage}
            sortConfigs={sortConfigs}
            onSort={setSortConfigs}
            selectedCategories={selectedCategories}
            onSelectionChange={setSelectedCategories}
            showSelection={false}
            enableSwipeActions={true}
          />
        ) : (
          <View style={styles.emptyContainer}>
            <EmptyState
              icon={searchText ? "search" : "clipboard-list"}
              title={searchText ? "Nenhuma categoria encontrada" : "Nenhuma categoria cadastrada"}
              description={searchText ? `Nenhum resultado para "${searchText}"` : "Comece cadastrando sua primeira categoria de produtos"}
              actionLabel={searchText ? undefined : "Cadastrar Categoria"}
              onAction={searchText ? undefined : handleCreateCategory}
            />
          </View>
        )}

        {/* Categories count */}
        {categories.length > 0 && (
          <ItemsCountDisplay loadedCount={totalItemsLoaded} totalCount={totalCount} isLoading={isFetchingNextPage} itemType="categoria" itemTypePlural="categorias" />
        )}

        {/* FAB */}
        <FAB icon="plus" onPress={handleCreateCategory} />
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
