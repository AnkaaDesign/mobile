import { useState, useMemo, useCallback } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  Pressable,
  ScrollView,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { Card } from "@/components/ui/card";
import { ThemedText } from "@/components/ui/themed-text";
import { SearchBar } from "@/components/ui/search-bar";
import { ListActionButton } from "@/components/ui/list-action-button";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize, fontWeight } from "@/constants/design-system";
import { IconBuildingFactory, IconAlertCircle, IconList } from "@tabler/icons-react-native";
import type { PaintFormula, PaintProduction } from "@/types";
import { SlideInPanel } from "@/components/ui/slide-in-panel";
import { ColumnVisibilitySlidePanel } from "@/components/ui/column-visibility-slide-panel";
import { useDebounce } from "@/hooks/useDebouncedSearch";
import { usePaintProductionsInfiniteMobile } from "@/hooks";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface FormulaProductionsTableProps {
  formula: PaintFormula;
  maxHeight?: number;
}

// Get screen width for responsive design
const { width: screenWidth } = Dimensions.get("window");
const availableWidth = screenWidth - 32;

// Column definitions for productions table
interface ProductionColumn {
  key: string;
  header: string;
  accessor: (production: PaintProduction) => React.ReactNode;
  width: number;
  align?: "left" | "center" | "right";
}

const createProductionColumnDefinitions = (): ProductionColumn[] => [
  {
    key: "volumeLiters",
    header: "VOLUME",
    align: "left",
    width: 0,
    accessor: (production: PaintProduction) => (
      <Badge variant="secondary">
        <ThemedText style={styles.badgeText}>
          {(production.volumeLiters || 0).toFixed(2)} L
        </ThemedText>
      </Badge>
    ),
  },
  {
    key: "createdAt",
    header: "PRODUZIDO EM",
    align: "left",
    width: 0,
    accessor: (production: PaintProduction) => (
      <ThemedText style={styles.cellText} numberOfLines={1}>
        {format(new Date(production.createdAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}
      </ThemedText>
    ),
  },
];

export function FormulaProductionsTable({
  formula,
  maxHeight = 400,
}: FormulaProductionsTableProps) {
  const { colors, isDark } = useTheme();

  // Column panel state
  const [isColumnPanelOpen, setIsColumnPanelOpen] = useState(false);

  // Default visible columns
  const [visibleColumnKeys, setVisibleColumnKeys] = useState<string[]>(() => {
    return ["volumeLiters", "createdAt"];
  });

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 300);

  // Fetch productions for this specific formula with infinite scroll
  const {
    items: productions,
    isLoading,
    error,
    loadMore,
    canLoadMore,
    isFetchingNextPage,
    totalCount,
  } = usePaintProductionsInfiniteMobile({
    where: {
      paintFormulaId: formula.id,
    },
    orderBy: { createdAt: "desc" },
    enabled: !!formula.id,
  });

  // Filter productions based on search (client-side for already loaded items)
  const filteredProductions = useMemo(() => {
    if (!debouncedSearch) return productions;

    const searchLower = debouncedSearch.toLowerCase();
    return productions.filter((production: PaintProduction) =>
      production.volumeLiters?.toString().includes(searchLower)
    );
  }, [productions, debouncedSearch]);

  // Get all column definitions
  const allColumns = useMemo(() => createProductionColumnDefinitions(), []);

  // Build visible columns with dynamic widths
  const displayColumns = useMemo(() => {
    const columnWidthRatios: Record<string, number> = {
      volumeLiters: 1.2,
      createdAt: 2.0,
    };

    const visible = allColumns.filter((col) => visibleColumnKeys.includes(col.key));
    const totalRatio = visible.reduce((sum, col) => sum + (columnWidthRatios[col.key] || 1.0), 0);

    return visible.map((col) => {
      const ratio = columnWidthRatios[col.key] || 1.0;
      const width = Math.floor((availableWidth * ratio) / totalRatio);
      return { ...col, width };
    });
  }, [allColumns, visibleColumnKeys]);

  // Calculate total table width
  const tableWidth = useMemo(() => {
    return displayColumns.reduce((sum, col) => sum + col.width, 0);
  }, [displayColumns]);

  // Handle columns change
  const handleColumnsChange = useCallback((newColumns: Set<string>) => {
    setVisibleColumnKeys(Array.from(newColumns));
  }, []);

  // Get default visible columns
  const getDefaultVisibleColumns = useCallback(() => {
    return ["volumeLiters", "createdAt"];
  }, []);

  // Handle opening column panel
  const handleOpenColumns = useCallback(() => {
    setIsColumnPanelOpen(true);
  }, []);

  const handleCloseColumns = useCallback(() => {
    setIsColumnPanelOpen(false);
  }, []);

  const handleProductionPress = (productionId: string) => {
    router.push(`/(tabs)/pintura/producoes/detalhes/${productionId}` as any);
  };

  // Render table header
  const renderHeader = useCallback(() => (
    <View style={styles.headerWrapper}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        scrollEnabled={tableWidth > availableWidth}
        contentContainerStyle={{ paddingHorizontal: 16 }}
      >
        <View style={StyleSheet.flatten([styles.tableHeaderRow, { width: tableWidth }])}>
          {displayColumns.map((column) => (
            <View
              key={column.key}
              style={StyleSheet.flatten([
                styles.tableHeaderCell,
                { width: column.width },
                column.align === "center" && styles.centerAlign,
                column.align === "right" && styles.rightAlign,
              ])}
            >
              <ThemedText
                style={StyleSheet.flatten([
                  styles.tableHeaderText,
                  { color: colors.foreground }
                ])}
                numberOfLines={1}
              >
                {column.header}
              </ThemedText>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  ), [displayColumns, tableWidth, colors]);

  // Render table row
  const renderRow = useCallback(({ item: production, index }: { item: PaintProduction; index: number }) => {
    const isEven = index % 2 === 0;
    const rowBgColor = isEven ? colors.background : colors.card;

    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        scrollEnabled={tableWidth > availableWidth}
        style={StyleSheet.flatten([
          styles.tableRow,
          {
            backgroundColor: rowBgColor,
          },
        ])}
        contentContainerStyle={{ paddingHorizontal: 16 }}
      >
        <Pressable
          style={StyleSheet.flatten([styles.tableRowContent, { width: tableWidth }])}
          onPress={() => handleProductionPress(production.id)}
          android_ripple={{ color: colors.primary + "20" }}
        >
          {displayColumns.map((column) => (
            <View
              key={column.key}
              style={StyleSheet.flatten([
                styles.tableCell,
                { width: column.width },
                column.align === "center" && styles.centerAlign,
                column.align === "right" && styles.rightAlign,
              ])}
            >
              {column.accessor(production)}
            </View>
          ))}
        </Pressable>
      </ScrollView>
    );
  }, [displayColumns, tableWidth, colors, isDark]);

  // Prepare columns for slide panel (convert to expected format)
  const columnDefinitionsForPanel = useMemo(() =>
    allColumns.map(col => ({
      key: col.key,
      header: col.header,
      accessor: () => null, // Not used by panel
      width: 0,
    })),
  [allColumns]);

  // Don't show if no productions and not loading
  if (!isLoading && productions.length === 0 && !searchQuery) {
    return null;
  }

  return (
    <>
      <Card style={styles.card}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <View style={styles.headerLeft}>
            <IconBuildingFactory size={20} color={colors.mutedForeground} />
            <ThemedText style={styles.title}>
              Histórico de Produção {productions.length > 0 && `(${productions.length}${totalCount ? `/${totalCount}` : ""})`}
            </ThemedText>
          </View>
        </View>

        <View style={styles.content}>
          {/* Search and Column Visibility Controls */}
          <View style={styles.controlsContainer}>
            <SearchBar
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Buscar produções..."
              style={styles.searchBar}
            />
            <ListActionButton
              icon={<IconList size={20} color={colors.foreground} />}
              onPress={handleOpenColumns}
              badgeCount={visibleColumnKeys.length}
              badgeVariant="primary"
            />
          </View>

          {/* Production Table */}
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <ThemedText style={styles.loadingText}>Carregando produções...</ThemedText>
            </View>
          ) : error ? (
            <View style={StyleSheet.flatten([styles.emptyState, { backgroundColor: colors.muted + "20" }])}>
              <IconAlertCircle size={48} color={colors.mutedForeground} />
              <ThemedText style={StyleSheet.flatten([styles.emptyText, { color: colors.mutedForeground }])}>
                Erro ao carregar produções.
              </ThemedText>
            </View>
          ) : filteredProductions.length === 0 ? (
            <View style={StyleSheet.flatten([styles.emptyState, { backgroundColor: colors.muted + "20" }])}>
              <IconAlertCircle size={48} color={colors.mutedForeground} />
              <ThemedText style={StyleSheet.flatten([styles.emptyText, { color: colors.mutedForeground }])}>
                {searchQuery
                  ? `Nenhuma produção encontrada para "${searchQuery}".`
                  : "Nenhuma produção registrada."}
              </ThemedText>
            </View>
          ) : (
            <View style={[styles.tableContainer, { height: maxHeight, maxHeight: maxHeight }]}>
              {renderHeader()}
              <FlatList
                data={filteredProductions}
                renderItem={renderRow}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={true}
                contentContainerStyle={{ flexGrow: 1 }}
                onEndReached={() => canLoadMore && loadMore()}
                onEndReachedThreshold={0.5}
                nestedScrollEnabled={true}
                removeClippedSubviews={false}
                windowSize={21}
                maxToRenderPerBatch={50}
                initialNumToRender={50}
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
          columns={columnDefinitionsForPanel}
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
    minHeight: 200,
    overflow: "hidden",
    marginHorizontal: -8,
  },
  headerWrapper: {
    // Border is handled by parent container
  },
  tableHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 40,
  },
  tableHeaderCell: {
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.sm,
    minHeight: 40,
    justifyContent: "center",
  },
  tableHeaderText: {
    fontSize: 10,
    fontWeight: fontWeight.bold as any,
    textTransform: "uppercase",
    lineHeight: 12,
  },
  tableRow: {
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  tableRowContent: {
    flexDirection: "row",
    alignItems: "stretch",
    minHeight: 48,
  },
  tableCell: {
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.sm,
    justifyContent: "center",
    minHeight: 48,
  },
  centerAlign: {
    alignItems: "center",
  },
  rightAlign: {
    alignItems: "flex-end",
  },
  cellText: {
    fontSize: fontSize.xs,
  },
  badgeText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium as any,
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
  footerLoader: {
    paddingVertical: spacing.md,
    alignItems: "center",
  },
});
