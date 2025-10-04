import React from "react";
import { View, StyleSheet} from "react-native";
import { Card } from "@/components/ui/card";
import { ThemedText } from "@/components/ui/themed-text";
import { OrderStatusBadge } from "../list/order-status-badge";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize } from "@/constants/design-system";
import { formatDate, formatDateTime } from '../../../../utils';
import type { Order } from '../../../../types';

interface OrderInfoCardProps {
  order: Order;
}

export const OrderInfoCard: React.FC<OrderInfoCardProps> = ({ order }) => {
  const { colors } = useTheme();

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <ThemedText style={styles.title}>Informações do Pedido</ThemedText>
        <OrderStatusBadge status={order.status} size="md" />
      </View>

      <View style={styles.content}>
        <View style={styles.row}>
          <ThemedText style={styles.label}>Código:</ThemedText>
          <ThemedText style={styles.value}>#{order.id.slice(-8).toUpperCase()}</ThemedText>
        </View>

        {order.description && (
          <View style={styles.row}>
            <ThemedText style={styles.label}>Descrição:</ThemedText>
            <ThemedText style={StyleSheet.flatten([styles.value, styles.flexWrap])}>{order.description}</ThemedText>
          </View>
        )}

        <View style={styles.row}>
          <ThemedText style={styles.label}>Criado em:</ThemedText>
          <ThemedText style={styles.value}>{formatDateTime(order.createdAt)}</ThemedText>
        </View>

        {order.forecast && (
          <View style={styles.row}>
            <ThemedText style={styles.label}>Previsão de Entrega:</ThemedText>
            <ThemedText style={styles.value}>{formatDate(order.forecast)}</ThemedText>
          </View>
        )}

        {order.updatedAt && (
          <View style={styles.row}>
            <ThemedText style={styles.label}>Entregue em:</ThemedText>
            <ThemedText style={StyleSheet.flatten([styles.value, { color: colors.primary }])}>
              {formatDateTime(order.updatedAt)}
            </ThemedText>
          </View>
        )}

        {order.notes && (
          <View style={StyleSheet.flatten([styles.row, styles.notesRow])}>
            <ThemedText style={styles.label}>Observações:</ThemedText>
            <ThemedText style={StyleSheet.flatten([styles.value, styles.notes])}>{order.notes}</ThemedText>
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
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
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
    alignItems: "flex-start",
  },
  notesRow: {
    flexDirection: "column",
    gap: spacing.xs,
  },
  label: {
    fontSize: fontSize.sm,
    opacity: 0.7,
    minWidth: 120,
  },
  value: {
    fontSize: fontSize.sm,
    fontWeight: "500",
    flex: 1,
    textAlign: "right",
  },
  flexWrap: {
    textAlign: "left",
  },
  notes: {
    textAlign: "left",
    fontWeight: "400",
    opacity: 0.9,
  },
});