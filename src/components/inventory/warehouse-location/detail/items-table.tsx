import { useState, useMemo, useCallback } from "react";
import { View, StyleSheet, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import { ThemedText } from "@/components/ui/themed-text";
import { DetailCard } from "@/components/ui/detail-page-layout";
import { SearchBar } from "@/components/ui/search-bar";
import { ListActionButton } from "@/components/ui/list-action-button";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize } from "@/constants/design-system";
import { IconAlertCircle, IconList } from "@tabler/icons-react-native";
import type { WarehouseLocation } from "@/types";
import { routes } from "@/constants";
import { ItemTable, createColumnDefinitions } from "@/components/inventory/item/list/item-table";
import { SlideInPanel } from "@/components/ui/slide-in-panel";
import { ColumnVisibilitySlidePanel } from "@/components/ui/column-visibility-slide-panel";
import { useDebounce } from "@/hooks/useDebouncedSearch";
import { useItemsInfiniteMobile } from "@/hooks";

interface ItemsTableProps {
  location: WarehouseLocation;
  maxHeight?: number;
}

export function ItemsTable({ location, maxHeight = 500 }: ItemsTableProps) {
  const { colors } = useTheme();

  const [isColumnPanelOpen, setIsColumnPanelOpen] = useState(false);
  const [visibleColumnKeys, setVisibleColumnKeys] = useState<string[]>(() => ["name", "quantity"]);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 300);

  const {
    items,
    isLoading,
    error,
    loadMore,
    canLoadMore,
    isFetchingNextPage,
    totalCount,
  } = useItemsInfiniteMobile({
    where: {
      warehouseLocationId: location.id,
    },
    include: {
      brands: true,
      category: true,
    },
    orderBy: { name: "asc" },
    enabled: !!location.id,
  });

  const filteredItems = useMemo(() => {
    if (!debouncedSearch) return items;

    const lowerSearch = debouncedSearch.toLowerCase();
    return items.filter((item) => {
      return (
        item.name?.toLowerCase().includes(lowerSearch) ||
        item.uniCode?.toLowerCase().includes(lowerSearch) ||
        item.brands?.some((b) => b.name.toLowerCase().includes(lowerSearch)) ||
        item.category?.name?.toLowerCase().includes(lowerSearch)
      );
    });
  }, [items, debouncedSearch]);

  const allColumns = useMemo(() => createColumnDefinitions(), []);

  const handleColumnsChange = useCallback((newColumns: Set<string>) => {
    setVisibleColumnKeys(Array.from(newColumns));
  }, []);

  const getDefaultVisibleColumns = useCallback(() => ["name", "quantity"], []);

  const handleOpenColumns = useCallback(() => setIsColumnPanelOpen(true), []);
  const handleCloseColumns = useCallback(() => setIsColumnPanelOpen(false), []);

  const handleItemPress = (itemId: string) => {
    router.push(routes.inventory.products.details(itemId) as any);
  };

  if (!isLoading && items.length === 0 && !searchQuery) {
    return null;
  }

  return (
    <>
      <DetailCard
        title={`Produtos Relacionados ${items.length > 0 ? `(${items.length}${totalCount ? `/${totalCount}` : ""})` : ""}`}
        icon="package"
      >
        <View style={styles.controlsContainer}>
          <SearchBar
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Buscar produtos..."
            style={styles.searchBar}
          />
          <ListActionButton
            icon={<IconList size={20} color={colors.foreground} />}
            onPress={handleOpenColumns}
            badgeCount={visibleColumnKeys.length}
            badgeVariant="primary"
          />
        </View>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <ThemedText style={styles.loadingText}>Carregando produtos...</ThemedText>
          </View>
        ) : error ? (
          <View style={StyleSheet.flatten([styles.emptyState, { backgroundColor: colors.muted + "20" }])}>
            <IconAlertCircle size={48} color={colors.mutedForeground} />
            <ThemedText style={StyleSheet.flatten([styles.emptyText, { color: colors.mutedForeground }])}>
              Erro ao carregar produtos.
            </ThemedText>
          </View>
        ) : filteredItems.length === 0 ? (
          <View style={StyleSheet.flatten([styles.emptyState, { backgroundColor: colors.muted + "20" }])}>
            <IconAlertCircle size={48} color={colors.mutedForeground} />
            <ThemedText style={StyleSheet.flatten([styles.emptyText, { color: colors.mutedForeground }])}>
              {searchQuery
                ? `Nenhum produto encontrado para "${searchQuery}".`
                : "Nenhum produto associado a esta localização."}
            </ThemedText>
          </View>
        ) : (
          <View style={[styles.tableContainer, { height: maxHeight, maxHeight: maxHeight }]}>
            <ItemTable
              items={filteredItems}
              onItemPress={handleItemPress}
              enableSwipeActions={false}
              visibleColumnKeys={visibleColumnKeys}
              onEndReached={() => canLoadMore && loadMore()}
              onEndReachedThreshold={0.5}
              disableVirtualization={true}
              ListFooterComponent={
                isFetchingNextPage ? (
                  <View style={styles.footerLoader}>
                    <ActivityIndicator size="small" color={colors.primary} />
                  </View>
                ) : null
              }
            />
          </View>
        )}
      </DetailCard>

      <SlideInPanel isOpen={isColumnPanelOpen} onClose={handleCloseColumns}>
        <ColumnVisibilitySlidePanel
          columns={allColumns}
          visibleColumns={new Set(visibleColumnKeys)}
          onVisibilityChange={handleColumnsChange}
          onClose={handleCloseColumns}
          defaultColumns={new Set(getDefaultVisibleColumns())}
        />
      </SlideInPanel>
    </>
  );
}

const styles = StyleSheet.create({
  controlsContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  searchBar: {
    flex: 1,
  },
  tableContainer: {
    overflow: "hidden",
    marginHorizontal: -8,
    minHeight: 200,
  },
  loadingContainer: {
    paddingVertical: spacing.xxl,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
  },
  loadingText: {
    fontSize: fontSize.sm,
    opacity: 0.7,
  },
  emptyState: {
    paddingVertical: spacing.xl,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
  },
  emptyText: {
    fontSize: fontSize.sm,
    textAlign: "center",
  },
  footerLoader: {
    paddingVertical: spacing.md,
    alignItems: "center",
  },
});
