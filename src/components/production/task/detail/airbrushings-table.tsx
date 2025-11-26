import { useState, useMemo, useCallback } from "react";
import { View, StyleSheet, ActivityIndicator, FlatList } from "react-native";
import { router } from "expo-router";
import { Card } from "@/components/ui/card";
import { ThemedText } from "@/components/ui/themed-text";
import { SearchBar } from "@/components/ui/search-bar";
import { ListActionButton } from "@/components/ui/list-action-button";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize } from "@/constants/design-system";
import { IconAlertCircle, IconList, IconSpray } from "@tabler/icons-react-native";
import { SlideInPanel } from "@/components/ui/slide-in-panel";
import { ColumnVisibilitySlidePanel } from "@/components/ui/column-visibility-slide-panel";
import { useDebounce } from "@/hooks/useDebouncedSearch";
import { useAirbrushingsInfiniteMobile } from "@/hooks";
import { AirbrushingTable, createColumnDefinitions } from "@/components/production/airbrushing/list/airbrushing-table";
import { routes } from "@/constants";
import { routeToMobilePath } from "@/utils/route-mapper";

interface AirbrushingsTableProps {
  taskId: string;
  maxHeight?: number;
}

export function AirbrushingsTable({ taskId, maxHeight = 400 }: AirbrushingsTableProps) {
  const { colors } = useTheme();

  // Column panel state
  const [isColumnPanelOpen, setIsColumnPanelOpen] = useState(false);

  // Use only status and price columns for task detail view
  const [visibleColumnKeys, setVisibleColumnKeys] = useState<string[]>(() => {
    return ["status", "price"];
  });

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 300);

  // Fetch airbrushings for this specific task with infinite scroll
  const {
    items: airbrushings,
    isLoading,
    error,
    loadMore,
    canLoadMore,
    isFetchingNextPage,
    totalCount,
  } = useAirbrushingsInfiniteMobile({
    where: {
      taskId,
    },
    include: {
      receipts: true,
      invoices: true,
      artworks: true,
    },
    orderBy: { createdAt: "desc" },
    enabled: !!taskId,
  });

  // Filter airbrushings based on search (client-side for already loaded items)
  const filteredAirbrushings = useMemo(() => {
    if (!debouncedSearch) return airbrushings;

    const lowerSearch = debouncedSearch.toLowerCase();
    return airbrushings.filter((ab: any) => {
      const priceStr = ab.price?.toString().toLowerCase() || "";
      return priceStr.includes(lowerSearch);
    });
  }, [airbrushings, debouncedSearch]);

  // Get all column definitions
  const allColumns = useMemo(() => createColumnDefinitions(), []);

  // Handle columns change
  const handleColumnsChange = useCallback((newColumns: Set<string>) => {
    const newColumnsArray = Array.from(newColumns);
    setVisibleColumnKeys(newColumnsArray);
  }, []);

  // Get default visible columns (for the task detail view)
  const getDefaultVisibleColumns = useCallback(() => {
    return ["status", "price"];
  }, []);

  // Handle opening column panel
  const handleOpenColumns = useCallback(() => {
    setIsColumnPanelOpen(true);
  }, []);

  const handleCloseColumns = useCallback(() => {
    setIsColumnPanelOpen(false);
  }, []);

  const handleAirbrushingPress = (airbrushingId: string) => {
    router.push(routeToMobilePath(routes.production.airbrushing.details(airbrushingId)) as any);
  };

  // Don't show if no airbrushings and not loading
  if (!isLoading && airbrushings.length === 0 && !searchQuery) {
    return null;
  }

  return (
    <>
      <Card style={styles.card}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <View style={styles.headerLeft}>
            <IconSpray size={20} color={colors.mutedForeground} />
            <ThemedText style={styles.title}>
              Aerografias {airbrushings.length > 0 && `(${airbrushings.length}${totalCount ? `/${totalCount}` : ""})`}
            </ThemedText>
          </View>
        </View>

        <View style={styles.content}>
          {/* Search and Column Visibility Controls */}
          <View style={styles.controlsContainer}>
            <SearchBar
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Buscar aerografias..."
              style={styles.searchBar}
            />
            <ListActionButton
              icon={<IconList size={20} color={colors.foreground} />}
              onPress={handleOpenColumns}
              badgeCount={visibleColumnKeys.length}
              badgeVariant="primary"
            />
          </View>

          {/* Airbrushings Table */}
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <ThemedText style={styles.loadingText}>Carregando aerografias...</ThemedText>
            </View>
          ) : error ? (
            <View style={StyleSheet.flatten([styles.emptyState, { backgroundColor: colors.muted + "20" }])}>
              <IconAlertCircle size={48} color={colors.mutedForeground} />
              <ThemedText style={StyleSheet.flatten([styles.emptyText, { color: colors.mutedForeground }])}>
                Erro ao carregar aerografias.
              </ThemedText>
            </View>
          ) : filteredAirbrushings.length === 0 ? (
            <View style={StyleSheet.flatten([styles.emptyState, { backgroundColor: colors.muted + "20" }])}>
              <IconAlertCircle size={48} color={colors.mutedForeground} />
              <ThemedText style={StyleSheet.flatten([styles.emptyText, { color: colors.mutedForeground }])}>
                {searchQuery
                  ? `Nenhuma aerografia encontrada para "${searchQuery}".`
                  : "Nenhuma aerografia associada a esta tarefa."}
              </ThemedText>
            </View>
          ) : (
            <View style={[styles.tableContainer, { height: maxHeight, maxHeight: maxHeight }]}>
              <AirbrushingTable
                airbrushings={filteredAirbrushings}
                onAirbrushingPress={handleAirbrushingPress}
                enableSwipeActions={false}
                visibleColumnKeys={visibleColumnKeys}
                onEndReached={() => canLoadMore && loadMore()}
                onEndReachedThreshold={0.5}
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
