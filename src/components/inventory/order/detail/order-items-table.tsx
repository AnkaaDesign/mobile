import { useMemo } from "react";
import {
  View,
  StyleSheet,
  Pressable,
} from "react-native";
import { ThemedText } from "@/components/ui/themed-text";
import { DetailCard } from "@/components/ui/detail-page-layout";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize, fontWeight, borderRadius } from "@/constants/design-system";
import { formatCurrency, formatQuantity } from "@/utils";
import { StockStatusIndicator } from "@/components/inventory/item/list/stock-status-indicator";
import type { Order, Item } from "@/types";
import {
  IconBoxMultiple,
} from "@tabler/icons-react-native";

interface OrderItemsTableProps {
  order: Order;
  onItemPress?: (itemId: string) => void;
}

export function OrderItemsTable({ order, onItemPress }: OrderItemsTableProps) {
  const { colors, isDark } = useTheme();
  const items = order?.items || [];

  // Calculate summary statistics
  const summary = useMemo(() => {
    if (!items.length) return { totalOrdered: 0, totalReceived: 0, totalValue: 0, percentComplete: 0 };

    let totalOrdered = 0;
    let totalReceived = 0;
    let totalValue = 0;

    items.forEach((item) => {
      totalOrdered += item.orderedQuantity;
      totalReceived += item.receivedQuantity || 0;

      const subtotal = item.orderedQuantity * item.price;
      const icmsAmount = subtotal * ((item.icms || 0) / 100);
      const ipiAmount = subtotal * ((item.ipi || 0) / 100);
      totalValue += subtotal + icmsAmount + ipiAmount;
    });

    const percentComplete = totalOrdered > 0 ? Math.round((totalReceived / totalOrdered) * 100) : 0;

    return { totalOrdered, totalReceived, totalValue, percentComplete };
  }, [items]);


  if (items.length === 0) {
    return (
      <DetailCard title="Itens do Pedido" icon="shopping-cart">
        <View style={styles.emptyContainer}>
          <View style={[styles.emptyIconContainer, { backgroundColor: colors.muted + "30" }]}>
            <IconBoxMultiple size={32} color={colors.mutedForeground} />
          </View>
          <ThemedText style={[styles.emptyTitle, { color: colors.foreground }]}>
            Nenhum item no pedido
          </ThemedText>
          <ThemedText style={[styles.emptyDescription, { color: colors.mutedForeground }]}>
            Este pedido não possui itens cadastrados.
          </ThemedText>
        </View>
      </DetailCard>
    );
  }

  return (
    <DetailCard
      title={`Itens do Pedido ${items.length > 0 ? `(${items.length})` : ""}`}
      icon="shopping-cart"
    >
      {/* Summary Statistics */}
      <View style={[styles.summaryContainer, { backgroundColor: colors.muted + "30" }]}>
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <ThemedText style={[styles.summaryLabel, { color: colors.mutedForeground }]}>
              Qtd. Pedida
            </ThemedText>
            <ThemedText style={[styles.summaryValue, { color: colors.foreground }]}>
              {formatQuantity(summary.totalOrdered)}
            </ThemedText>
          </View>
          <View style={styles.summaryItem}>
            <ThemedText style={[styles.summaryLabel, { color: colors.mutedForeground }]}>
              Qtd. Recebida
            </ThemedText>
            <ThemedText style={[styles.summaryValue, { color: colors.primary }]}>
              {formatQuantity(summary.totalReceived)}
            </ThemedText>
          </View>
          <View style={styles.summaryItem}>
            <ThemedText style={[styles.summaryLabel, { color: colors.mutedForeground }]}>
              Valor Total
            </ThemedText>
            <ThemedText style={[styles.summaryValue, { color: colors.foreground }]}>
              {formatCurrency(summary.totalValue)}
            </ThemedText>
          </View>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressSeparator} />
        <View style={styles.progressContainer}>
          <View style={styles.progressHeader}>
            <ThemedText style={[styles.progressLabel, { color: colors.mutedForeground }]}>
              Progresso
            </ThemedText>
            <ThemedText style={[styles.progressValue, { color: colors.foreground }]}>
              {summary.percentComplete}%
            </ThemedText>
          </View>
          <View style={[styles.progressBar, { backgroundColor: colors.muted }]}>
            <View
              style={[
                styles.progressFill,
                {
                  backgroundColor: summary.percentComplete >= 100 ? colors.primary : "#3b82f6",
                  width: `${Math.min(summary.percentComplete, 100)}%`,
                },
              ]}
            />
          </View>
        </View>
      </View>

      {/* Table */}
      <View style={styles.tableWrapper}>
        <View style={[styles.tableContainer, { borderColor: colors.border }]}>
          {/* Table Header */}
          <View style={[styles.tableHeader, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
            <View style={[styles.headerCell, styles.productColumn]}>
              <ThemedText style={[styles.headerCellText, { color: isDark ? "#e5e5e5" : "#000" }]}>
                Produto
              </ThemedText>
            </View>
            <View style={[styles.headerCell, styles.stockColumn]}>
              <ThemedText style={[styles.headerCellText, { color: isDark ? "#e5e5e5" : "#000" }]}>
                Estoque
              </ThemedText>
            </View>
            <View style={[styles.headerCell, styles.quantityColumn]}>
              <ThemedText style={[styles.headerCellText, { color: isDark ? "#e5e5e5" : "#000" }]}>
                Qnt
              </ThemedText>
            </View>
          </View>

          {/* Table Body */}
          <View style={styles.tableBody}>
            {items.map((orderItem, index) => {
              const item = orderItem.item;
              const isLast = index === items.length - 1;
              const isEven = index % 2 === 0;
              const received = orderItem.receivedQuantity || 0;
              const ordered = orderItem.orderedQuantity || 0;

              // Format item display: use !itemId as definitive temp item check
              const isTemporaryItem = !orderItem.itemId;
              const itemDisplay = isTemporaryItem
                ? (orderItem.temporaryItemDescription || order.description || "Item temporário")
                : item?.uniCode
                  ? `${item.uniCode} - ${item?.name || "Item desconhecido"}`
                  : (item?.name || "Item desconhecido");

              return (
                <Pressable
                  key={orderItem.id}
                  style={[
                    styles.tableRow,
                    { backgroundColor: isEven ? colors.background : colors.card },
                    !isLast && { borderBottomWidth: 1, borderBottomColor: colors.border },
                  ]}
                  onPress={() => item && onItemPress?.(item.id)}
                >
                  {/* Item Column */}
                  <View style={[styles.cell, styles.productColumn]}>
                    <ThemedText style={styles.itemName} numberOfLines={2}>
                      {itemDisplay}
                    </ThemedText>
                  </View>

                  {/* Stock Column */}
                  <View style={[styles.cell, styles.stockColumn]}>
                    {!isTemporaryItem && item ? (
                      <View style={styles.stockCell}>
                        <StockStatusIndicator item={item as Item} />
                        <ThemedText style={styles.stockText}>
                          {formatQuantity(item.quantity ?? 0)}
                        </ThemedText>
                      </View>
                    ) : (
                      <ThemedText style={[styles.cellText, { color: colors.mutedForeground }]}>
                        {isTemporaryItem ? "N/A" : "-"}
                      </ThemedText>
                    )}
                  </View>

                  {/* Quantity Column - received/ordered */}
                  <View style={[styles.cell, styles.quantityColumn]}>
                    <ThemedText style={[styles.quantityText, { color: received >= ordered && ordered > 0 ? colors.primary : colors.foreground }]}>
                      {formatQuantity(received)}/{formatQuantity(ordered)}
                    </ThemedText>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>
    </DetailCard>
  );
}

const styles = StyleSheet.create({
  emptyContainer: {
    alignItems: "center",
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.md,
  },
  emptyIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  emptyTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    marginBottom: spacing.xs,
  },
  emptyDescription: {
    fontSize: fontSize.sm,
    textAlign: "center",
  },
  summaryContainer: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  summaryItem: {
    alignItems: "center",
    flex: 1,
  },
  summaryLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    marginBottom: 2,
  },
  summaryValue: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
  },
  progressSeparator: {
    height: spacing.md,
  },
  progressContainer: {
    gap: spacing.xs,
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  progressLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  progressValue: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 4,
  },
  tableWrapper: {
    paddingTop: spacing.md,
  },
  tableContainer: {
    borderRadius: 8,
    borderWidth: 1,
    overflow: "hidden",
  },
  tableHeader: {
    flexDirection: "row",
    borderBottomWidth: 2,
    paddingHorizontal: spacing.sm,
  },
  headerCell: {
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.sm,
    justifyContent: "center",
    minHeight: 40,
  },
  productColumn: {
    flex: 0.6,
  },
  stockColumn: {
    flex: 0.25,
  },
  quantityColumn: {
    flex: 0.15,
  },
  headerCellText: {
    fontSize: 10,
    fontWeight: fontWeight.bold,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  tableBody: {},
  tableRow: {
    flexDirection: "row",
    alignItems: "stretch",
    minHeight: 44,
    paddingHorizontal: spacing.sm,
  },
  cell: {
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xs,
    justifyContent: "center",
  },
  cellText: {
    fontSize: fontSize.xs,
  },
  itemName: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    lineHeight: 16,
  },
  stockCell: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  stockText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },
  quantityText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
  },
});
