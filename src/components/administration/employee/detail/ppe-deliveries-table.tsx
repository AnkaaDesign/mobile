import { useState, useMemo, useCallback } from "react";
import { View, StyleSheet, ActivityIndicator, FlatList } from "react-native";
import { Card } from "@/components/ui/card";
import { ThemedText } from "@/components/ui/themed-text";
import { SearchBar } from "@/components/ui/search-bar";
import { ListActionButton } from "@/components/ui/list-action-button";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize } from "@/constants/design-system";
import { IconShield, IconAlertCircle, IconList } from "@tabler/icons-react-native";
import type { User } from "@/types";
import { SlideInPanel } from "@/components/ui/slide-in-panel";
import { ColumnVisibilitySlidePanel } from "@/components/ui/column-visibility-slide-panel";
import { useDebounce } from "@/hooks/useDebouncedSearch";
import { usePpeDeliveriesInfiniteMobile } from "@/hooks";
import { PPE_DELIVERY_STATUS } from "@/constants";

interface PpeDeliveriesTableProps {
  employee: User;
  maxHeight?: number;
}

// Column definitions for PPE deliveries table
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
    case PPE_DELIVERY_STATUS.PENDING:
      return colors.warning;
    case PPE_DELIVERY_STATUS.APPROVED:
      return colors.success;
    case PPE_DELIVERY_STATUS.REJECTED:
      return colors.destructive;
    case PPE_DELIVERY_STATUS.DELIVERED:
      return colors.success;
    case PPE_DELIVERY_STATUS.CANCELLED:
      return colors.mutedForeground;
    default:
      return colors.mutedForeground;
  }
};

// Helper function to get status label
const getStatusLabel = (status: string) => {
  const statusLabels: Record<string, string> = {
    [PPE_DELIVERY_STATUS.PENDING]: "Pendente",
    [PPE_DELIVERY_STATUS.APPROVED]: "Aprovado",
    [PPE_DELIVERY_STATUS.REJECTED]: "Rejeitado",
    [PPE_DELIVERY_STATUS.DELIVERED]: "Entregue",
    [PPE_DELIVERY_STATUS.CANCELLED]: "Cancelado",
  };
  return statusLabels[status] || status;
};

export function PpeDeliveriesTable({ employee, maxHeight = 500 }: PpeDeliveriesTableProps) {
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

  // Fetch PPE deliveries for this specific employee
  const {
    items: ppeDeliveries,
    isLoading,
    error,
    loadMore,
    canLoadMore,
    isFetchingNextPage,
    totalCount,
  } = usePpeDeliveriesInfiniteMobile({
    where: {
      userId: employee.id,
    },
    orderBy: { actualDeliveryDate: "desc" },
  });

  // Filter PPE deliveries by search query
  const filteredPpeDeliveries = useMemo(() => {
    if (!debouncedSearch) return ppeDeliveries;

    const searchLower = debouncedSearch.toLowerCase();
    return ppeDeliveries.filter((delivery) => {
      const itemName = delivery.item?.name?.toLowerCase() || "";
      const statusLabel = getStatusLabel(delivery.status).toLowerCase();

      return itemName.includes(searchLower) || statusLabel.includes(searchLower);
    });
  }, [ppeDeliveries, debouncedSearch]);

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

  // Render PPE delivery row
  const renderPpeDeliveryRow = useCallback(({ item: delivery, index }: { item: any; index: number }) => {
    const isEven = index % 2 === 0;
    const backgroundColor = isEven ? colors.background : colors.card;

    return (
      <View style={[styles.row, { backgroundColor }]}>
        {visibleColumnKeys.includes("item") && (
          <View style={styles.cell}>
            <ThemedText style={[styles.cellText, { color: colors.foreground }]}>
              {delivery.item?.name || "Item não informado"}
            </ThemedText>
          </View>
        )}
        {visibleColumnKeys.includes("quantity") && (
          <View style={styles.cell}>
            <ThemedText style={[styles.cellText, { color: colors.foreground }]}>
              {delivery.quantity}
            </ThemedText>
          </View>
        )}
        {visibleColumnKeys.includes("status") && (
          <View style={styles.cell}>
            <Badge
              variant="secondary"
              style={{
                backgroundColor: getStatusColor(delivery.status, colors) + "20",
              }}
            >
              <ThemedText
                style={[
                  styles.statusText,
                  { color: getStatusColor(delivery.status, colors) },
                ]}
              >
                {getStatusLabel(delivery.status)}
              </ThemedText>
            </Badge>
          </View>
        )}
      </View>
    );
  }, [colors, visibleColumnKeys]);

  // Don't show if no PPE deliveries and not loading
  if (!isLoading && filteredPpeDeliveries.length === 0 && !searchQuery) {
    return null;
  }

  return (
    <>
      <Card style={styles.card}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <View style={styles.headerLeft}>
            <IconShield size={20} color={colors.mutedForeground} />
            <ThemedText style={styles.title}>
              Entregas de EPI {ppeDeliveries.length > 0 && `(${ppeDeliveries.length}${totalCount ? `/${totalCount}` : ""})`}
            </ThemedText>
          </View>
        </View>

        <View style={styles.content}>
          {/* Search and Column Visibility Controls */}
          <View style={styles.controlsContainer}>
            <SearchBar
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Buscar entregas de EPI..."
              style={styles.searchBar}
            />
            <ListActionButton
              icon={<IconList size={20} color={colors.foreground} />}
              onPress={handleOpenColumns}
              badgeCount={visibleColumnKeys.length}
              badgeVariant="primary"
            />
          </View>

          {/* PPE Delivery Table */}
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <ThemedText style={styles.loadingText}>Carregando entregas de EPI...</ThemedText>
            </View>
          ) : error ? (
            <View style={[styles.emptyState, { backgroundColor: colors.muted + "20" }]}>
              <IconAlertCircle size={48} color={colors.mutedForeground} />
              <ThemedText style={[styles.emptyText, { color: colors.mutedForeground }]}>
                Erro ao carregar entregas de EPI.
              </ThemedText>
            </View>
          ) : filteredPpeDeliveries.length === 0 ? (
            <View style={[styles.emptyState, { backgroundColor: colors.muted + "20" }]}>
              <IconAlertCircle size={48} color={colors.mutedForeground} />
              <ThemedText style={[styles.emptyText, { color: colors.mutedForeground }]}>
                {searchQuery
                  ? `Nenhuma entrega de EPI encontrada para "${searchQuery}".`
                  : "Nenhuma entrega de EPI registrada."}
              </ThemedText>
            </View>
          ) : (
            <View style={[styles.tableContainer, { height: maxHeight, maxHeight: maxHeight }]}>
              <FlatList
                data={filteredPpeDeliveries}
                renderItem={renderPpeDeliveryRow}
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
