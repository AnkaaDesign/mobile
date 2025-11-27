import React, { useMemo } from "react";
import { View, StyleSheet } from "react-native";
import { Card } from "@/components/ui/card";
import { ThemedText } from "@/components/ui/themed-text";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize, fontWeight, borderRadius } from "@/constants/design-system";
import { formatCurrency } from "@/utils";
import type { Order, OrderItem } from "../../../../types";
import {
  IconShoppingCart,
  IconCheck,
  IconClock,
  IconAlertTriangle,
  IconBoxMultiple,
} from "@tabler/icons-react-native";

interface OrderItemsCardProps {
  order: Order;
  onOrderUpdate?: () => void;
}

// Item status types
interface ItemStatusInfo {
  label: string;
  color: string;
  icon: typeof IconCheck;
}

export const OrderItemsCard: React.FC<OrderItemsCardProps> = ({ order }) => {
  const { colors } = useTheme();
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

  // Get item status info
  const getItemStatus = (item: OrderItem): ItemStatusInfo => {
    const ordered = item.orderedQuantity || 0;
    const received = item.receivedQuantity || 0;
    const fulfilled = item.fulfilledAt !== null;

    if (received >= ordered && ordered > 0) {
      if (received > ordered) {
        return { label: "Excesso", color: "#3b82f6", icon: IconAlertTriangle }; // blue
      }
      return { label: "Recebido", color: colors.primary, icon: IconCheck }; // green
    }
    if (received > 0 && received < ordered) {
      return { label: "Parcial", color: "#f97316", icon: IconClock }; // orange
    }
    if (fulfilled) {
      return { label: "Feito", color: "#8b5cf6", icon: IconCheck }; // purple
    }
    return { label: "Pendente", color: colors.mutedForeground, icon: IconClock }; // gray
  };

  // Calculate item total with taxes
  const getItemTotal = (item: OrderItem): number => {
    const subtotal = item.orderedQuantity * item.price;
    const icmsAmount = subtotal * ((item.icms || 0) / 100);
    const ipiAmount = subtotal * ((item.ipi || 0) / 100);
    return subtotal + icmsAmount + ipiAmount;
  };

  if (items.length === 0) {
    return (
      <Card style={styles.card}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <View style={styles.headerLeft}>
            <View style={[styles.iconContainer, { backgroundColor: colors.primary + "20" }]}>
              <IconShoppingCart size={20} color={colors.primary} />
            </View>
            <ThemedText style={styles.title}>Itens do Pedido</ThemedText>
          </View>
        </View>
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
      </Card>
    );
  }

  return (
    <Card style={styles.card}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View style={styles.headerLeft}>
          <View style={[styles.iconContainer, { backgroundColor: colors.primary + "20" }]}>
            <IconShoppingCart size={20} color={colors.primary} />
          </View>
          <ThemedText style={styles.title}>Itens do Pedido</ThemedText>
        </View>
        <Badge variant="secondary" size="sm">
          <ThemedText style={styles.countText}>{items.length} itens</ThemedText>
        </Badge>
      </View>

      {/* Summary Statistics */}
      <View style={[styles.summaryContainer, { backgroundColor: colors.muted + "30" }]}>
        <View style={styles.summaryRow}>
          {/* Total Ordered */}
          <View style={styles.summaryItem}>
            <ThemedText style={[styles.summaryLabel, { color: colors.mutedForeground }]}>
              Qtd. Pedida
            </ThemedText>
            <ThemedText style={[styles.summaryValue, { color: colors.foreground }]}>
              {summary.totalOrdered}
            </ThemedText>
          </View>

          {/* Total Received */}
          <View style={styles.summaryItem}>
            <ThemedText style={[styles.summaryLabel, { color: colors.mutedForeground }]}>
              Qtd. Recebida
            </ThemedText>
            <ThemedText style={[styles.summaryValue, { color: colors.primary }]}>
              {summary.totalReceived}
            </ThemedText>
          </View>

          {/* Total Value */}
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

      {/* Items List */}
      <View style={styles.itemsList}>
        {items.map((orderItem, index) => {
          const status = getItemStatus(orderItem);
          const StatusIcon = status.icon;
          const item = orderItem.item;
          const itemTotal = getItemTotal(orderItem);

          return (
            <View
              key={orderItem.id}
              style={[
                styles.item,
                { borderBottomColor: colors.border },
                index < items.length - 1 && styles.itemBorder,
              ]}
            >
              {/* Item Header */}
              <View style={styles.itemHeader}>
                <View style={styles.itemInfo}>
                  <ThemedText style={[styles.itemName, { color: colors.foreground }]} numberOfLines={2}>
                    {orderItem.temporaryItemDescription || item?.name || "Item desconhecido"}
                  </ThemedText>
                  {item?.uniCode && (
                    <ThemedText style={[styles.itemCode, { color: colors.mutedForeground }]}>
                      Código: {item.uniCode}
                    </ThemedText>
                  )}
                  {item?.brand && (
                    <ThemedText style={[styles.itemBrand, { color: colors.mutedForeground }]}>
                      {item.brand.name}
                    </ThemedText>
                  )}
                </View>
                <View style={[styles.statusBadge, { backgroundColor: status.color + "20" }]}>
                  <StatusIcon size={14} color={status.color} />
                  <ThemedText style={[styles.statusText, { color: status.color }]}>
                    {status.label}
                  </ThemedText>
                </View>
              </View>

              {/* Item Details Grid */}
              <View style={styles.itemDetails}>
                {/* Left Column - Quantities */}
                <View style={styles.detailColumn}>
                  <View style={styles.detailRow}>
                    <ThemedText style={[styles.detailLabel, { color: colors.mutedForeground }]}>
                      Pedido:
                    </ThemedText>
                    <ThemedText style={[styles.detailValue, { color: colors.foreground }]}>
                      {orderItem.orderedQuantity}
                    </ThemedText>
                  </View>
                  <View style={styles.detailRow}>
                    <ThemedText style={[styles.detailLabel, { color: colors.mutedForeground }]}>
                      Recebido:
                    </ThemedText>
                    <ThemedText style={[styles.detailValue, { color: colors.primary }]}>
                      {orderItem.receivedQuantity || 0}
                    </ThemedText>
                  </View>
                </View>

                {/* Right Column - Prices */}
                <View style={styles.detailColumn}>
                  <View style={styles.detailRow}>
                    <ThemedText style={[styles.detailLabel, { color: colors.mutedForeground }]}>
                      Preço:
                    </ThemedText>
                    <ThemedText style={[styles.detailValue, { color: colors.foreground }]}>
                      {formatCurrency(orderItem.price)}
                    </ThemedText>
                  </View>
                  {(orderItem.icms > 0 || orderItem.ipi > 0) && (
                    <View style={styles.taxRow}>
                      {orderItem.icms > 0 && (
                        <View style={[styles.taxBadge, { backgroundColor: colors.muted }]}>
                          <ThemedText style={[styles.taxText, { color: colors.mutedForeground }]}>
                            ICMS: {orderItem.icms}%
                          </ThemedText>
                        </View>
                      )}
                      {orderItem.ipi > 0 && (
                        <View style={[styles.taxBadge, { backgroundColor: colors.muted }]}>
                          <ThemedText style={[styles.taxText, { color: colors.mutedForeground }]}>
                            IPI: {orderItem.ipi}%
                          </ThemedText>
                        </View>
                      )}
                    </View>
                  )}
                  <View style={styles.detailRow}>
                    <ThemedText style={[styles.detailLabel, { color: colors.mutedForeground }]}>
                      Total:
                    </ThemedText>
                    <ThemedText style={[styles.totalValue, { color: colors.primary }]}>
                      {formatCurrency(itemTotal)}
                    </ThemedText>
                  </View>
                </View>
              </View>
            </View>
          );
        })}
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: 0,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.semibold,
  },
  countText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },
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
    margin: spacing.md,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.md,
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
    marginBottom: spacing.xs,
  },
  summaryValue: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
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
  itemsList: {
    paddingHorizontal: spacing.md,
  },
  item: {
    paddingVertical: spacing.md,
  },
  itemBorder: {
    borderBottomWidth: 1,
  },
  itemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: spacing.sm,
  },
  itemInfo: {
    flex: 1,
    marginRight: spacing.sm,
  },
  itemName: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    marginBottom: 2,
  },
  itemCode: {
    fontSize: fontSize.xs,
    marginBottom: 2,
  },
  itemBrand: {
    fontSize: fontSize.xs,
    fontStyle: "italic",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 12,
    gap: 4,
  },
  statusText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
  },
  itemDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  detailColumn: {
    flex: 1,
    gap: spacing.xs,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  detailLabel: {
    fontSize: fontSize.sm,
  },
  detailValue: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  totalValue: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
  },
  taxRow: {
    flexDirection: "row",
    gap: spacing.xs,
    justifyContent: "flex-end",
  },
  taxBadge: {
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: 4,
  },
  taxText: {
    fontSize: 10,
    fontWeight: fontWeight.medium,
  },
});
