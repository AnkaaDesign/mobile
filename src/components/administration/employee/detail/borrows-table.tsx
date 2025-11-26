import { useState, useMemo, useCallback } from "react";
import { View, StyleSheet, ActivityIndicator, FlatList } from "react-native";
import { Card } from "@/components/ui/card";
import { ThemedText } from "@/components/ui/themed-text";
import { SearchBar } from "@/components/ui/search-bar";
import { ListActionButton } from "@/components/ui/list-action-button";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize } from "@/constants/design-system";
import { IconPackage, IconAlertCircle, IconList } from "@tabler/icons-react-native";
import type { User } from "@/types";
import { SlideInPanel } from "@/components/ui/slide-in-panel";
import { ColumnVisibilitySlidePanel } from "@/components/ui/column-visibility-slide-panel";
import { useDebounce } from "@/hooks/useDebouncedSearch";
import { useBorrowsInfiniteMobile } from "@/hooks";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { BORROW_STATUS } from "@/constants";

interface BorrowsTableProps {
  employee: User;
  maxHeight?: number;
}

// Column definitions for borrows table
const createColumnDefinitions = () => {
  return [
    {
      key: "item",
      label: "Item",
      sortable: false,
    },
    {
      key: "quantity",
      label: "Quantidade",
      sortable: true,
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
    },
  ];
};

// Helper function to get status color
const getStatusColor = (status: string, colors: any) => {
  switch (status) {
    case BORROW_STATUS.ACTIVE:
      return colors.warning;
    case BORROW_STATUS.RETURNED:
      return colors.success;
    case BORROW_STATUS.OVERDUE:
      return colors.destructive;
    case BORROW_STATUS.LOST:
      return colors.destructive;
    default:
      return colors.mutedForeground;
  }
};

// Helper function to get status label
const getStatusLabel = (status: string) => {
  const statusLabels: Record<string, string> = {
    [BORROW_STATUS.ACTIVE]: "Ativo",
    [BORROW_STATUS.RETURNED]: "Devolvido",
    [BORROW_STATUS.OVERDUE]: "Atrasado",
    [BORROW_STATUS.LOST]: "Perdido",
  };
  return statusLabels[status] || status;
};

export function BorrowsTable({ employee, maxHeight = 500 }: BorrowsTableProps) {
  const { colors } = useTheme();

  // Column panel state
  const [isColumnPanelOpen, setIsColumnPanelOpen] = useState(false);

  // Default visible columns: item, quantity
  const [visibleColumnKeys, setVisibleColumnKeys] = useState<string[]>(() => {
    return ["item", "quantity"];
  });

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 300);

  // Fetch borrows for this specific employee
  const {
    items: borrows,
    isLoading,
    error,
    loadMore,
    canLoadMore,
    isFetchingNextPage,
    totalCount,
  } = useBorrowsInfiniteMobile({
    where: {
      userId: employee.id,
    },
    orderBy: { createdAt: "desc" },
  });

  // Filter borrows by search query
  const filteredBorrows = useMemo(() => {
    if (!debouncedSearch) return borrows;

    const searchLower = debouncedSearch.toLowerCase();
    return borrows.filter((borrow) => {
      const itemName = borrow.item?.name?.toLowerCase() || "";
      const statusLabel = getStatusLabel(borrow.status).toLowerCase();

      return itemName.includes(searchLower) || statusLabel.includes(searchLower);
    });
  }, [borrows, debouncedSearch]);

  // Get all column definitions
  const allColumns = useMemo(() => createColumnDefinitions(), []);

  // Handle columns change
  const handleColumnsChange = useCallback((newColumns: Set<string>) => {
    const newColumnsArray = Array.from(newColumns);
    setVisibleColumnKeys(newColumnsArray);
  }, []);

  // Get default visible columns
  const getDefaultVisibleColumns = useCallback(() => {
    return ["item", "quantity"];
  }, []);

  // Handle opening column panel
  const handleOpenColumns = useCallback(() => {
    setIsColumnPanelOpen(true);
  }, []);

  const handleCloseColumns = useCallback(() => {
    setIsColumnPanelOpen(false);
  }, []);

  // Render borrow row
  const renderBorrowRow = useCallback(({ item: borrow, index }: { item: any; index: number }) => {
    const isEven = index % 2 === 0;
    const backgroundColor = isEven ? colors.background : colors.card;

    return (
      <View style={[styles.row, { backgroundColor }]}>
        {visibleColumnKeys.includes("item") && (
          <View style={styles.cell}>
            <ThemedText style={[styles.cellText, { color: colors.foreground }]}>
              {borrow.item?.name || "Item não informado"}
            </ThemedText>
          </View>
        )}
        {visibleColumnKeys.includes("quantity") && (
          <View style={styles.cell}>
            <ThemedText style={[styles.cellText, { color: colors.foreground }]}>
              {borrow.quantity}
            </ThemedText>
          </View>
        )}
        {visibleColumnKeys.includes("status") && (
          <View style={styles.cell}>
            <Badge
              variant="secondary"
              style={{
                backgroundColor: getStatusColor(borrow.status, colors) + "20",
              }}
            >
              <ThemedText
                style={[
                  styles.statusText,
                  { color: getStatusColor(borrow.status, colors) },
                ]}
              >
                {getStatusLabel(borrow.status)}
              </ThemedText>
            </Badge>
          </View>
        )}
      </View>
    );
  }, [colors, visibleColumnKeys]);

  // Don't show if no borrows and not loading
  if (!isLoading && filteredBorrows.length === 0 && !searchQuery) {
    return null;
  }

  return (
    <>
      <Card style={styles.card}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <View style={styles.headerLeft}>
            <IconPackage size={20} color={colors.mutedForeground} />
            <ThemedText style={styles.title}>
              Empréstimos {borrows.length > 0 && `(${borrows.length}${totalCount ? `/${totalCount}` : ""})`}
            </ThemedText>
          </View>
        </View>

        <View style={styles.content}>
          {/* Search and Column Visibility Controls */}
          <View style={styles.controlsContainer}>
            <SearchBar
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Buscar empréstimos..."
              style={styles.searchBar}
            />
            <ListActionButton
              icon={<IconList size={20} color={colors.foreground} />}
              onPress={handleOpenColumns}
              badgeCount={visibleColumnKeys.length}
              badgeVariant="primary"
            />
          </View>

          {/* Borrow Table */}
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <ThemedText style={styles.loadingText}>Carregando empréstimos...</ThemedText>
            </View>
          ) : error ? (
            <View style={[styles.emptyState, { backgroundColor: colors.muted + "20" }]}>
              <IconAlertCircle size={48} color={colors.mutedForeground} />
              <ThemedText style={[styles.emptyText, { color: colors.mutedForeground }]}>
                Erro ao carregar empréstimos.
              </ThemedText>
            </View>
          ) : filteredBorrows.length === 0 ? (
            <View style={[styles.emptyState, { backgroundColor: colors.muted + "20" }]}>
              <IconAlertCircle size={48} color={colors.mutedForeground} />
              <ThemedText style={[styles.emptyText, { color: colors.mutedForeground }]}>
                {searchQuery
                  ? `Nenhum empréstimo encontrado para "${searchQuery}".`
                  : "Nenhum empréstimo registrado."}
              </ThemedText>
            </View>
          ) : (
            <View style={[styles.tableContainer, { height: maxHeight, maxHeight: maxHeight }]}>
              <FlatList
                data={filteredBorrows}
                renderItem={renderBorrowRow}
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
