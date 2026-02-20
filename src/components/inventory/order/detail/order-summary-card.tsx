import React from "react";
import { View, StyleSheet} from "react-native";
import { Card } from "@/components/ui/card";
import { ThemedText } from "@/components/ui/themed-text";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize } from "@/constants/design-system";
import { formatCurrency, formatQuantity } from "@/utils";
import type { Order } from '../../../../types';
import { IconReceipt, IconCoin } from "@tabler/icons-react-native";

interface OrderSummaryCardProps {
  order: Order;
}

export const OrderSummaryCard: React.FC<OrderSummaryCardProps> = ({ order }) => {
  const { colors } = useTheme();

  // Calculate values from order items
  const subtotal = order.items?.reduce((sum, item) => sum + (item.price || 0), 0) || 0;
  const total = subtotal;

  return (
    <Card style={styles.card}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <IconReceipt size={20} color={colors.primary} />
        <ThemedText style={styles.title}>Resumo Financeiro</ThemedText>
      </View>

      <View style={styles.content}>
        <View style={styles.row}>
          <View style={styles.labelContainer}>
            <IconCoin size={14} color={colors.foreground} />
            <ThemedText style={styles.label}>Subtotal:</ThemedText>
          </View>
          <ThemedText style={styles.value}>{formatCurrency(subtotal)}</ThemedText>
        </View>

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
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: spacing.md,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: "600",
  },
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
  icon: {
    opacity: 0.6,
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