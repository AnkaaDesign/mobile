import React from "react";
import { View, StyleSheet } from "react-native";
import { Card } from "@/components/ui/card";
import { ThemedText } from "@/components/ui/themed-text";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize } from "@/constants/design-system";
import { formatCurrency } from '../../../../utils';
import type { OrderItem } from '../../../../types';
import { IconCheck, IconX, IconClock } from "@tabler/icons-react-native";

interface OrderItemsCardProps {
  items: OrderItem[];
}

export const OrderItemsCard: React.FC<OrderItemsCardProps> = ({ items }) => {
  const { colors } = useTheme();

  const getItemStatus = (item: OrderItem) => {
    if (item.receivedQuantity && item.receivedQuantity >= item.orderedQuantity) {
      return { icon: IconCheck, color: colors.primary, label: "Recebido" };
    }
    if (item.receivedQuantity && item.receivedQuantity >= item.orderedQuantity) {
      return { icon: IconClock, color: colors.warning, label: "Pedido" };
    }
    return { icon: IconX, color: colors.destructive, label: "Pendente" };
  };

  if (items.length === 0) {
    return (
      <Card style={styles.card}>
        <ThemedText style={styles.title}>Itens do Pedido</ThemedText>
        <ThemedText style={styles.emptyText}>Nenhum item no pedido</ThemedText>
      </Card>
    );
  }

  return (
    <Card style={styles.card}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <ThemedText style={styles.title}>Itens do Pedido</ThemedText>
        <Badge size="sm">
          <ThemedText style={styles.countText}>{items.length} itens</ThemedText>
        </Badge>
      </View>

      <View style={styles.itemsList}>
        {items.map((orderItem, index) => {
          const status = getItemStatus(orderItem);
          const StatusIcon = status.icon;
          const item = orderItem.item;

          return (
            <View
              key={orderItem.id}
              style={StyleSheet.flatten([
                styles.item,
                index < items.length - 1 && styles.itemBorder,
              ])}
            >
              <View style={styles.itemHeader}>
                <View style={styles.itemInfo}>
                  <ThemedText style={styles.itemName} numberOfLines={2}>
                    {item?.name || "Item desconhecido"}
                  </ThemedText>
                  {item?.uniCode && (
                    <ThemedText style={styles.itemCode}>
                      Código: {item.uniCode}
                    </ThemedText>
                  )}
                </View>
                <View style={StyleSheet.flatten([styles.statusBadge, { backgroundColor: status.color + "20" }])}>
                  <StatusIcon size={16} color={status.color} />
                  <ThemedText style={StyleSheet.flatten([styles.statusText, { color: status.color }])}>
                    {status.label}
                  </ThemedText>
                </View>
              </View>

              <View style={styles.itemDetails}>
                <View style={styles.quantityInfo}>
                  <View style={styles.quantityRow}>
                    <ThemedText style={styles.quantityLabel}>Pedido:</ThemedText>
                    <ThemedText style={styles.quantityValue}>
                      {orderItem.orderedQuantity}
                    </ThemedText>
                  </View>
                  {orderItem.receivedQuantity !== null && (
                    <View style={styles.quantityRow}>
                      <ThemedText style={styles.quantityLabel}>Atendido:</ThemedText>
                      <ThemedText style={styles.quantityValue}>
                        {orderItem.receivedQuantity}
                      </ThemedText>
                    </View>
                  )}
                  {orderItem.receivedQuantity !== null && (
                    <View style={styles.quantityRow}>
                      <ThemedText style={styles.quantityLabel}>Recebido:</ThemedText>
                      <ThemedText style={StyleSheet.flatten([styles.quantityValue, { color: colors.primary }])}>
                        {orderItem.receivedQuantity}
                      </ThemedText>
                    </View>
                  )}
                </View>

                <View style={styles.priceInfo}>
                  <ThemedText style={styles.priceLabel}>Preço Unit:</ThemedText>
                  <ThemedText style={styles.priceValue}>
                    {formatCurrency(orderItem.unitPrice || 0)}
                  </ThemedText>
                  <ThemedText style={styles.priceLabel}>Total:</ThemedText>
                  <ThemedText style={StyleSheet.flatten([styles.priceValue, styles.totalPrice])}>
                    {formatCurrency((orderItem.unitPrice || 0) * orderItem.orderedQuantity)}
                  </ThemedText>
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
    padding: spacing.md,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: "600",
  },
  countText: {
    fontSize: fontSize.xs,
    color: "#fff",
  },
  emptyText: {
    fontSize: fontSize.sm,
    opacity: 0.6,
    textAlign: "center",
    paddingVertical: spacing.lg,
  },
  itemsList: {
    gap: spacing.md,
  },
  item: {
    paddingBottom: spacing.md,
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
    fontSize: fontSize.md,
    fontWeight: "600",
    marginBottom: 2,
  },
  itemCode: {
    fontSize: fontSize.xs,
    opacity: 0.6,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 12,
    gap: spacing.xs,
  },
  statusText: {
    fontSize: fontSize.xs,
    fontWeight: "600",
  },
  itemDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  quantityInfo: {
    flex: 1,
    gap: spacing.xs,
  },
  quantityRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  quantityLabel: {
    fontSize: fontSize.sm,
    opacity: 0.7,
    width: 70,
  },
  quantityValue: {
    fontSize: fontSize.sm,
    fontWeight: "600",
  },
  priceInfo: {
    alignItems: "flex-end",
    gap: spacing.xs,
  },
  priceLabel: {
    fontSize: fontSize.xs,
    opacity: 0.6,
  },
  priceValue: {
    fontSize: fontSize.sm,
    fontWeight: "500",
  },
  totalPrice: {
    fontSize: fontSize.md,
    fontWeight: "600",
  },
  notesContainer: {
    marginTop: spacing.xs,
    paddingTop: spacing.xs,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  notes: {
    fontSize: fontSize.sm,
    opacity: 0.7,
    fontStyle: "italic",
  },
});