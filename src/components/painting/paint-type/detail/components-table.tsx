import { useState, useMemo, useCallback } from "react";
import { View, StyleSheet, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import { Card } from "@/components/ui/card";
import { ThemedText } from "@/components/ui/themed-text";
import { SearchBar } from "@/components/ui/search-bar";
import { ListActionButton } from "@/components/ui/list-action-button";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize } from "@/constants/design-system";
import { IconComponents, IconAlertCircle, IconList } from "@tabler/icons-react-native";
import type { PaintType, Item } from '@/types';
import { routes } from "@/constants";
import { routeToMobilePath } from '@/utils/route-mapper';
import { ItemTable } from "@/components/inventory/item/list/item-table";

import { SlideInPanel } from "@/components/ui/slide-in-panel";
import { ColumnVisibilitySlidePanel } from "@/components/ui/column-visibility-slide-panel";
import { useDebounce } from "@/hooks/useDebouncedSearch";
import { useItemsInfiniteMobile } from "@/hooks";

interface ComponentsTableProps {
  paintType: PaintType;
  maxHeight?: number;
}

// Create column definitions for the item table
const createColumnDefinitions = () => {
  return [
    { key: "name", header: "Nome" },
    { key: "brand.name", header: "Marca" },
    { key: "category.name", header: "Categoria" },
    { key: "code", header: "Código" },
  ];
};

export function ComponentsTable({ paintType, maxHeight = 400 }: ComponentsTableProps) {
  const { colors } = useTheme();

  // Column panel state
  const [isColumnPanelOpen, setIsColumnPanelOpen] = useState(false);

  // Default to name and brand columns
  const [visibleColumnKeys, setVisibleColumnKeys] = useState<string[]>(() => {
    return ["name", "brand.name"];
  });

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 300);

  // Get component item IDs from paint type
  const componentItemIds = useMemo(() => {
    return (paintType.componentItems || []).map((item: Item) => item.id);
  }, [paintType.componentItems]);

  // Fetch items using infinite scroll with ID filter
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
      id: { in: componentItemIds },
    },
    include: {
      brand: true,
      category: true,
    },
    orderBy: { name: "asc" },
    enabled: componentItemIds.length > 0,
  });

  // Filter items based on search (client-side for already loaded items)
  const filteredItems = useMemo(() => {
    if (!debouncedSearch) return items;

    const searchLower = debouncedSearch.toLowerCase();
    return items.filter((item: Item) =>
      item.name?.toLowerCase().includes(searchLower) ||
      item.uniCode?.toLowerCase().includes(searchLower) ||
      (item as any).brand?.name?.toLowerCase().includes(searchLower) ||
      (item as any).category?.name?.toLowerCase().includes(searchLower)
    );
  }, [items, debouncedSearch]);

  // Get all column definitions
  const allColumns = useMemo(() => createColumnDefinitions(), []);

  // Handle columns change
  const handleColumnsChange = useCallback((newColumns: Set<string>) => {
    setVisibleColumnKeys(Array.from(newColumns));
  }, []);

  // Get default visible columns
  const getDefaultVisibleColumns = useCallback(() => {
    return ["name", "brand.name"];
  }, []);

  // Handle opening column panel
  const handleOpenColumns = useCallback(() => {
    setIsColumnPanelOpen(true);
  }, []);

  const handleCloseColumns = useCallback(() => {
    setIsColumnPanelOpen(false);
  }, []);

  const handleItemPress = (itemId: string) => {
    router.push(routeToMobilePath(routes.inventory.items.details(itemId)) as any);
  };

  // Don't show if no component IDs configured and not loading
  if (!isLoading && componentItemIds.length === 0 && !searchQuery) {
    return null;
  }

  return (
    <>
      <Card style={styles.card}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <View style={styles.headerLeft}>
            <IconComponents size={20} color={colors.mutedForeground} />
            <ThemedText style={styles.title}>
              Componentes {items.length > 0 && `(${items.length}${totalCount ? `/${totalCount}` : ""})`}
            </ThemedText>
          </View>
        </View>

        <View style={styles.content}>
          {/* Search and Column Visibility Controls */}
          <View style={styles.controlsContainer}>
            <SearchBar
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Buscar componentes..."
              style={styles.searchBar}
            />
            <ListActionButton
              icon={<IconList size={20} color={colors.foreground} />}
              onPress={handleOpenColumns}
              badgeCount={visibleColumnKeys.length}
              badgeVariant="primary"
            />
          </View>

          {/* Item Table */}
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <ThemedText style={styles.loadingText}>Carregando componentes...</ThemedText>
            </View>
          ) : error ? (
            <View style={StyleSheet.flatten([styles.emptyState, { backgroundColor: colors.muted + "20" }])}>
              <IconAlertCircle size={48} color={colors.mutedForeground} />
              <ThemedText style={StyleSheet.flatten([styles.emptyText, { color: colors.mutedForeground }])}>
                Erro ao carregar componentes.
              </ThemedText>
            </View>
          ) : filteredItems.length === 0 ? (
            <View style={StyleSheet.flatten([styles.emptyState, { backgroundColor: colors.muted + "20" }])}>
              <IconAlertCircle size={48} color={colors.mutedForeground} />
              <ThemedText style={StyleSheet.flatten([styles.emptyText, { color: colors.mutedForeground }])}>
                {searchQuery
                  ? `Nenhum componente encontrado para "${searchQuery}".`
                  : "Nenhum componente configurado."}
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
        </View>
      </Card>

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
  card: {
    padding: spacing.md,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: "500",
  },
  content: {
    gap: spacing.sm,
  },
  controlsContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  searchBar: {
    flex: 1,
  },
  tableContainer: {
    marginHorizontal: -8,
    overflow: 'hidden',
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
