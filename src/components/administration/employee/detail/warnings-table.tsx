import { useState, useMemo, useCallback } from "react";
import { View, StyleSheet, ActivityIndicator, FlatList } from "react-native";
import { Card } from "@/components/ui/card";
import { ThemedText } from "@/components/ui/themed-text";
import { SearchBar } from "@/components/ui/search-bar";
import { ListActionButton } from "@/components/ui/list-action-button";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize } from "@/constants/design-system";
import { IconAlertTriangle, IconAlertCircle, IconList } from "@tabler/icons-react-native";
import type { User } from "@/types";
import { SlideInPanel } from "@/components/ui/slide-in-panel";
import { ColumnVisibilitySlidePanel } from "@/components/ui/column-visibility-slide-panel";
import { useDebounce } from "@/hooks/useDebouncedSearch";
import { useWarningsInfiniteMobile } from "@/hooks";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { WARNING_SEVERITY, WARNING_CATEGORY } from "@/constants";

interface WarningsTableProps {
  employee: User;
  maxHeight?: number;
}

// Column definitions for warnings table
const createColumnDefinitions = () => {
  return [
    {
      key: "severity",
      header: "Gravidade",
      sortable: true,
    },
    {
      key: "category",
      header: "Categoria",
      sortable: true,
    },
    {
      key: "createdAt",
      header: "Data",
      sortable: true,
    },
  ];
};

// Helper function to get severity color
const getSeverityColor = (severity: string, colors: any) => {
  switch (severity) {
    case WARNING_SEVERITY.VERBAL:
      return colors.warning;
    case WARNING_SEVERITY.WRITTEN:
      return colors.warning;
    case WARNING_SEVERITY.SUSPENSION:
      return colors.destructive;
    case WARNING_SEVERITY.FINAL_WARNING:
      return colors.destructive;
    default:
      return colors.mutedForeground;
  }
};

// Helper function to get severity label
const getSeverityLabel = (severity: string) => {
  const severityLabels: Record<string, string> = {
    [WARNING_SEVERITY.VERBAL]: "Verbal",
    [WARNING_SEVERITY.WRITTEN]: "Escrita",
    [WARNING_SEVERITY.SUSPENSION]: "Suspensão",
    [WARNING_SEVERITY.FINAL_WARNING]: "Final",
  };
  return severityLabels[severity] || severity;
};

// Helper function to get category label
const getCategoryLabel = (category: string) => {
  const categoryLabels: Record<string, string> = {
    [WARNING_CATEGORY.ATTENDANCE]: "Presença",
    [WARNING_CATEGORY.BEHAVIOR]: "Conduta",
    [WARNING_CATEGORY.MISCONDUCT]: "Má Conduta",
    [WARNING_CATEGORY.INSUBORDINATION]: "Insubordinação",
    [WARNING_CATEGORY.PERFORMANCE]: "Desempenho",
    [WARNING_CATEGORY.SAFETY]: "Segurança",
    [WARNING_CATEGORY.POLICY_VIOLATION]: "Violação de Política",
    [WARNING_CATEGORY.OTHER]: "Outro",
  };
  return categoryLabels[category] || category;
};

export function WarningsTable({ employee, maxHeight = 500 }: WarningsTableProps) {
  const { colors } = useTheme();

  // Column panel state
  const [isColumnPanelOpen, setIsColumnPanelOpen] = useState(false);

  // Default visible columns: severity, category
  const [visibleColumnKeys, setVisibleColumnKeys] = useState<string[]>(() => {
    return ["severity", "category"];
  });

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 300);

  // Fetch warnings for this specific employee
  const {
    items: warnings,
    isLoading,
    error,
    loadMore,
    canLoadMore,
    isFetchingNextPage,
    totalCount,
  } = useWarningsInfiniteMobile({
    where: {
      collaboratorId: employee.id,
    },
    orderBy: { createdAt: "desc" },
    enabled: true,
  });

  // Filter warnings by search query
  const filteredWarnings = useMemo(() => {
    if (!debouncedSearch) return warnings;

    const searchLower = debouncedSearch.toLowerCase();
    return warnings.filter((warning) => {
      const severityLabel = getSeverityLabel(warning.severity).toLowerCase();
      const categoryLabel = getCategoryLabel(warning.category).toLowerCase();
      const reason = warning.reason?.toLowerCase() || "";

      return (
        severityLabel.includes(searchLower) ||
        categoryLabel.includes(searchLower) ||
        reason.includes(searchLower)
      );
    });
  }, [warnings, debouncedSearch]);

  // Get all column definitions
  const allColumns = useMemo(() => createColumnDefinitions(), []);

  // Handle columns change
  const handleColumnsChange = useCallback((newColumns: Set<string>) => {
    const newColumnsArray = Array.from(newColumns);
    setVisibleColumnKeys(newColumnsArray);
  }, []);

  // Get default visible columns
  const getDefaultVisibleColumns = useCallback(() => {
    return ["severity", "category"];
  }, []);

  // Handle opening column panel
  const handleOpenColumns = useCallback(() => {
    setIsColumnPanelOpen(true);
  }, []);

  const handleCloseColumns = useCallback(() => {
    setIsColumnPanelOpen(false);
  }, []);

  // Render warning row
  const renderWarningRow = useCallback(({ item: warning, index }: { item: any; index: number }) => {
    const isEven = index % 2 === 0;
    const backgroundColor = isEven ? colors.background : colors.card;

    return (
      <View style={[styles.row, { backgroundColor }]}>
        {visibleColumnKeys.includes("severity") && (
          <View style={styles.cell}>
            <Badge
              variant="secondary"
              style={{
                backgroundColor: getSeverityColor(warning.severity, colors) + "20",
              }}
            >
              <ThemedText
                style={[
                  styles.statusText,
                  { color: getSeverityColor(warning.severity, colors) },
                ]}
              >
                {getSeverityLabel(warning.severity)}
              </ThemedText>
            </Badge>
          </View>
        )}
        {visibleColumnKeys.includes("category") && (
          <View style={styles.cell}>
            <ThemedText style={[styles.cellText, { color: colors.foreground }]}>
              {getCategoryLabel(warning.category)}
            </ThemedText>
          </View>
        )}
        {visibleColumnKeys.includes("createdAt") && (
          <View style={styles.cell}>
            <ThemedText style={[styles.cellText, { color: colors.foreground }]}>
              {format(new Date(warning.createdAt), "dd/MM/yyyy", { locale: ptBR })}
            </ThemedText>
          </View>
        )}
      </View>
    );
  }, [colors, visibleColumnKeys]);

  // Don't show if no warnings and not loading
  if (!isLoading && filteredWarnings.length === 0 && !searchQuery) {
    return null;
  }

  return (
    <>
      <Card style={styles.card}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <View style={styles.headerLeft}>
            <IconAlertTriangle size={20} color={colors.mutedForeground} />
            <ThemedText style={styles.title}>
              Advertências {warnings.length > 0 && `(${warnings.length}${totalCount ? `/${totalCount}` : ""})`}
            </ThemedText>
          </View>
        </View>

        <View style={styles.content}>
          {/* Search and Column Visibility Controls */}
          <View style={styles.controlsContainer}>
            <SearchBar
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Buscar advertências..."
              style={styles.searchBar}
            />
            <ListActionButton
              icon={<IconList size={20} color={colors.foreground} />}
              onPress={handleOpenColumns}
              badgeCount={visibleColumnKeys.length}
              badgeVariant="primary"
            />
          </View>

          {/* Warning Table */}
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <ThemedText style={styles.loadingText}>Carregando advertências...</ThemedText>
            </View>
          ) : error ? (
            <View style={[styles.emptyState, { backgroundColor: colors.muted + "20" }]}>
              <IconAlertCircle size={48} color={colors.mutedForeground} />
              <ThemedText style={[styles.emptyText, { color: colors.mutedForeground }]}>
                Erro ao carregar advertências.
              </ThemedText>
            </View>
          ) : filteredWarnings.length === 0 ? (
            <View style={[styles.emptyState, { backgroundColor: colors.muted + "20" }]}>
              <IconAlertCircle size={48} color={colors.mutedForeground} />
              <ThemedText style={[styles.emptyText, { color: colors.mutedForeground }]}>
                {searchQuery
                  ? `Nenhuma advertência encontrada para "${searchQuery}".`
                  : "Nenhuma advertência registrada."}
              </ThemedText>
            </View>
          ) : (
            <View style={[styles.tableContainer, { height: maxHeight, maxHeight: maxHeight }]}>
              <FlatList
                data={filteredWarnings}
                renderItem={renderWarningRow}
                keyExtractor={(item) => item.id}
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
  row: {
    flexDirection: "row",
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  cell: {
    flex: 1,
    justifyContent: "center",
  },
  cellText: {
    fontSize: fontSize.sm,
  },
  statusText: {
    fontSize: fontSize.xs,
    fontWeight: "500",
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
