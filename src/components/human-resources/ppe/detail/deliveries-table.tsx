import { useState, useMemo, useCallback } from "react";
import { View, StyleSheet, ActivityIndicator, TouchableOpacity, FlatList } from "react-native";
import { router } from "expo-router";
import { Card } from "@/components/ui/card";
import { ThemedText } from "@/components/ui/themed-text";
import { SearchBar } from "@/components/ui/search-bar";
import { ListActionButton } from "@/components/ui/list-action-button";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize } from "@/constants/design-system";
import { IconPackage, IconAlertCircle, IconList, IconUser, IconCircleCheck, IconClock, IconX } from "@tabler/icons-react-native";
import type { Item, PpeDelivery } from "@/types";
import { routes } from "@/constants";
import { routeToMobilePath } from "@/utils/route-mapper";
import { SlideInPanel } from "@/components/ui/slide-in-panel";
import { ColumnVisibilitySlidePanel } from "@/components/ui/column-visibility-slide-panel";
import { useDebounce } from "@/hooks/useDebouncedSearch";
import { usePpeDeliveriesInfiniteMobile } from "@/hooks";
import { PPE_DELIVERY_STATUS, PPE_DELIVERY_STATUS_LABELS } from "@/constants";
import { formatDate } from "@/utils";

interface DeliveriesTableProps {
  item: Item;
  maxHeight?: number;
}

// Column definitions for PPE deliveries
const createColumnDefinitions = (): Array<{ key: string; header: string; width: number }> => [
  {
    key: "user",
    header: "Usuário",
    width: 150,
  },
  {
    key: "quantity",
    header: "Quantidade",
    width: 100,
  },
  {
    key: "status",
    header: "Status",
    width: 120,
  },
];

export function DeliveriesTable({ item, maxHeight = 500 }: DeliveriesTableProps) {
  const { colors } = useTheme();

  // Column panel state
  const [isColumnPanelOpen, setIsColumnPanelOpen] = useState(false);

  // Default visible columns for PPE item detail view
  const [visibleColumnKeys, setVisibleColumnKeys] = useState<string[]>(() => {
    return ["user", "status"];
  });

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 300);

  // Fetch deliveries for this specific item with infinite scroll
  const {
    items: deliveries,
    isLoading,
    error,
    loadMore,
    canLoadMore,
    isFetchingNextPage,
    totalCount,
  } = usePpeDeliveriesInfiniteMobile({
    where: {
      itemId: item.id,
    },
    include: {
      user: {
        include: {
          position: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    enabled: !!item.id,
  });

  // Filter deliveries based on search (client-side for already loaded items)
  const filteredDeliveries = useMemo(() => {
    if (!debouncedSearch) return deliveries;

    const searchLower = debouncedSearch.toLowerCase();
    return deliveries.filter((delivery: any) =>
      delivery.user?.name?.toLowerCase().includes(searchLower) ||
      delivery.status?.toLowerCase().includes(searchLower)
    );
  }, [deliveries, debouncedSearch]);

  // Get all column definitions
  const allColumns = useMemo(() => createColumnDefinitions(), []);

  // Handle columns change
  const handleColumnsChange = useCallback((newColumns: Set<string>) => {
    setVisibleColumnKeys(Array.from(newColumns));
  }, []);

  // Get default visible columns
  const getDefaultVisibleColumns = useCallback(() => {
    return ["user", "status"];
  }, []);

  // Handle opening column panel
  const handleOpenColumns = useCallback(() => {
    setIsColumnPanelOpen(true);
  }, []);

  const handleCloseColumns = useCallback(() => {
    setIsColumnPanelOpen(false);
  }, []);

  const handleDeliveryPress = (deliveryId: string) => {
    router.push(routeToMobilePath(routes.humanResources.ppe.deliveries.details(deliveryId)) as any);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case PPE_DELIVERY_STATUS.PENDING:
        return "#f59e0b";
      case PPE_DELIVERY_STATUS.APPROVED:
        return "#3b82f6";
      case PPE_DELIVERY_STATUS.DELIVERED:
        return "#10b981";
      case PPE_DELIVERY_STATUS.REPROVED:
        return "#ef4444";
      case PPE_DELIVERY_STATUS.CANCELLED:
        return "#6b7280";
      default:
        return colors.mutedForeground;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case PPE_DELIVERY_STATUS.PENDING:
        return <IconClock size={12} color="white" />;
      case PPE_DELIVERY_STATUS.APPROVED:
        return <IconCircleCheck size={12} color="white" />;
      case PPE_DELIVERY_STATUS.DELIVERED:
        return <IconCircleCheck size={12} color="white" />;
      case PPE_DELIVERY_STATUS.REPROVED:
        return <IconAlertCircle size={12} color="white" />;
      case PPE_DELIVERY_STATUS.CANCELLED:
        return <IconX size={12} color="white" />;
      default:
        return null;
    }
  };

  // Don't show if no deliveries and not loading
  if (!isLoading && deliveries.length === 0 && !searchQuery) {
    return null;
  }

  const showUser = visibleColumnKeys.includes("user");
  const showQuantity = visibleColumnKeys.includes("quantity");
  const showStatus = visibleColumnKeys.includes("status");

  return (
    <>
      <Card style={styles.card}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <View style={styles.headerLeft}>
            <IconPackage size={20} color={colors.mutedForeground} />
            <ThemedText style={styles.title}>
              Entregas de EPI {deliveries.length > 0 && `(${deliveries.length}${totalCount ? `/${totalCount}` : ""})`}
            </ThemedText>
          </View>
        </View>

        <View style={styles.content}>
          {/* Search and Column Visibility Controls */}
          <View style={styles.controlsContainer}>
            <SearchBar
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Buscar entregas..."
              style={styles.searchBar}
            />
            <ListActionButton
              icon={<IconList size={20} color={colors.foreground} />}
              onPress={handleOpenColumns}
              badgeCount={visibleColumnKeys.length}
              badgeVariant="primary"
            />
          </View>

          {/* Deliveries Table */}
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <ThemedText style={styles.loadingText}>Carregando entregas...</ThemedText>
            </View>
          ) : error ? (
            <View style={StyleSheet.flatten([styles.emptyState, { backgroundColor: colors.muted + "20" }])}>
              <IconAlertCircle size={48} color={colors.mutedForeground} />
              <ThemedText style={StyleSheet.flatten([styles.emptyText, { color: colors.mutedForeground }])}>
                Erro ao carregar entregas.
              </ThemedText>
            </View>
          ) : filteredDeliveries.length === 0 ? (
            <View style={StyleSheet.flatten([styles.emptyState, { backgroundColor: colors.muted + "20" }])}>
              <IconAlertCircle size={48} color={colors.mutedForeground} />
              <ThemedText style={StyleSheet.flatten([styles.emptyText, { color: colors.mutedForeground }])}>
                {searchQuery
                  ? `Nenhuma entrega encontrada para "${searchQuery}".`
                  : "Nenhuma entrega registrada para este EPI."}
              </ThemedText>
            </View>
          ) : (
            <View style={[styles.tableContainer, { height: maxHeight, maxHeight: maxHeight }]}>
              <FlatList
                data={filteredDeliveries}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
                onEndReached={() => canLoadMore && loadMore()}
                onEndReachedThreshold={0.5}
                ListFooterComponent={
                  isFetchingNextPage ? (
                    <View style={styles.footerLoader}>
                      <ActivityIndicator size="small" color={colors.primary} />
                    </View>
                  ) : null
                }
                renderItem={({ item: delivery, index }) => {
                  const isEven = index % 2 === 0;
                  return (
                    <TouchableOpacity
                      style={[
                        styles.row,
                        {
                          backgroundColor: isEven ? colors.background : colors.card,
                        },
                      ]}
                      onPress={() => handleDeliveryPress(delivery.id)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.rowContent}>
                        {/* User Section */}
                        {showUser && (
                          <View style={styles.userSection}>
                            <IconUser size={16} color={colors.mutedForeground} />
                            <View style={styles.userInfo}>
                              <ThemedText style={styles.userName} numberOfLines={1}>
                                {delivery.user?.name || "Funcionário"}
                              </ThemedText>
                              <ThemedText style={styles.userPosition} numberOfLines={1}>
                                {delivery.user?.position?.name || "-"}
                              </ThemedText>
                            </View>
                          </View>
                        )}

                        {/* Quantity Section */}
                        {showQuantity && (
                          <View style={styles.quantitySection}>
                            <ThemedText style={styles.quantity}>{delivery.quantity} un</ThemedText>
                          </View>
                        )}

                        {/* Status Section */}
                        {showStatus && (
                          <View style={styles.statusSection}>
                            <Badge
                              variant="default"
                              style={StyleSheet.flatten([
                                styles.statusBadge,
                                { backgroundColor: getStatusColor(delivery.status) },
                              ])}
                            >
                              <View style={styles.badgeContent}>
                                {getStatusIcon(delivery.status)}
                                <ThemedText style={styles.statusText}>
                                  {PPE_DELIVERY_STATUS_LABELS[delivery.status]}
                                </ThemedText>
                              </View>
                            </Badge>
                            <ThemedText style={styles.date}>
                              {delivery.actualDeliveryDate
                                ? formatDate(delivery.actualDeliveryDate)
                                : delivery.scheduledDate
                                ? `Agend: ${formatDate(delivery.scheduledDate)}`
                                : "-"}
                            </ThemedText>
                          </View>
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                }}
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
    minHeight: 200,
    overflow: "hidden",
    marginHorizontal: -8,
  },
  row: {
    minHeight: 70,
    justifyContent: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  rowContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  userSection: {
    flex: 1.5,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 14,
    fontWeight: "600",
  },
  userPosition: {
    fontSize: 11,
    opacity: 0.6,
    marginTop: 2,
  },
  quantitySection: {
    flex: 0.8,
    alignItems: "center",
  },
  quantity: {
    fontSize: 13,
    fontWeight: "600",
  },
  statusSection: {
    flex: 1.2,
    alignItems: "flex-end",
    gap: spacing.xs,
  },
  statusBadge: {
    paddingHorizontal: spacing.xs,
    paddingVertical: 4,
  },
  badgeContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "600",
    color: "white",
  },
  date: {
    fontSize: 11,
    opacity: 0.6,
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
