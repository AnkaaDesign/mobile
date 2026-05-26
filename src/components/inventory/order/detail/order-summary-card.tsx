import React from "react";
import { View, StyleSheet} from "react-native";
import { ThemedText } from "@/components/ui/themed-text";
import { DetailCard } from "@/components/ui/detail-page-layout";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize } from "@/constants/design-system";
import { formatCurrency, formatQuantity } from "@/utils";
import type { Order } from '../../../../types';
import { IconCoin } from "@tabler/icons-react-native";
import { useCanViewPrices } from "@/hooks";

interface OrderSummaryCardProps {
  order: Order;
}

export const OrderSummaryCard: React.FC<OrderSummaryCardProps> = ({ order }) => {
  const { colors } = useTheme();
  const canViewPrices = useCanViewPrices();

  // Calculate values from order items
  // Mirror order-items-card.tsx / list config: per item, (orderedQuantity × price) + ICMS + IPI
  const subtotal =
    order.items?.reduce((sum, item) => {
      const lineSubtotal = (item.orderedQuantity || 0) * (item.price || 0);
      const icmsAmount = lineSubtotal * ((item.icms || 0) / 100);
      const ipiAmount = lineSubtotal * ((item.ipi || 0) / 100);
      return sum + lineSubtotal + icmsAmount + ipiAmount;
    }, 0) || 0;
  // Goods subtotal (before taxes) — discount percentage applies to this base only
  const goodsSubtotal =
    order.items?.reduce((sum, item) => {
      return sum + (item.orderedQuantity || 0) * (item.price || 0);
    }, 0) || 0;
  const discountAmount = goodsSubtotal * ((order.discount || 0) / 100);
  const total = subtotal + (order.freight || 0) - discountAmount;

  if (!canViewPrices) return null;

  return (
    <DetailCard title="Resumo Financeiro" icon="receipt">
      <View style={styles.content}>
        <View style={styles.row}>
          <View style={styles.labelContainer}>
            <IconCoin size={14} color={colors.foreground} />
            <ThemedText style={styles.label}>Subtotal:</ThemedText>
          </View>
          <ThemedText style={styles.value}>{formatCurrency(subtotal)}</ThemedText>
        </View>

        {(order.freight || 0) > 0 && (
          <View style={styles.row}>
            <View style={styles.labelContainer}>
              <IconCoin size={14} color={colors.foreground} />
              <ThemedText style={styles.label}>Frete:</ThemedText>
            </View>
            <ThemedText style={styles.value}>{formatCurrency(order.freight || 0)}</ThemedText>
          </View>
        )}

        {(order.discount || 0) > 0 && (
          <View style={styles.row}>
            <View style={styles.labelContainer}>
              <IconCoin size={14} color={colors.foreground} />
              <ThemedText style={styles.label}>Desconto ({order.discount}%):</ThemedText>
            </View>
            <ThemedText style={styles.value}>- {formatCurrency(discountAmount)}</ThemedText>
          </View>
        )}

        <View style={StyleSheet.flatten([styles.row, styles.totalRow])}>
          <ThemedText style={styles.totalLabel}>Total:</ThemedText>
          <ThemedText style={styles.totalValue}>{formatCurrency(total)}</ThemedText>
        </View>

        {order.items && order.items.length > 0 && (
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <ThemedText style={styles.statValue}>{order.items.length}</ThemedText>
              <ThemedText style={styles.statLabel}>Itens</ThemedText>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <ThemedText style={styles.statValue}>
                {formatQuantity(order.items.reduce((sum, item) => sum + item.orderedQuantity, 0))}
              </ThemedText>
              <ThemedText style={styles.statLabel}>Unidades</ThemedText>
            </View>
          </View>
        )}
      </View>
    </DetailCard>
  );
};

const styles = StyleSheet.create({
  content: {
    gap: spacing.sm,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  labelContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  label: {
    fontSize: fontSize.sm,
    opacity: 0.7,
  },
  value: {
    fontSize: fontSize.sm,
    fontWeight: "500",
  },
  totalRow: {
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  totalLabel: {
    fontSize: fontSize.md,
    fontWeight: "600",
  },
  totalValue: {
    fontSize: fontSize.lg,
    fontWeight: "700",
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  statItem: {
    alignItems: "center",
  },
  statValue: {
    fontSize: fontSize.xl,
    fontWeight: "700",
  },
  statLabel: {
    fontSize: fontSize.xs,
    opacity: 0.6,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: "#00000015",
  },
});
