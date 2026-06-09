import { View, StyleSheet } from "react-native";
import { useLocalSearchParams } from "expo-router";
import {
  IconPackage,
  IconCalendar,
  IconCurrency,
} from "@tabler/icons-react-native";

import { ThemedText } from "@/components/ui/themed-text";
import { Card } from "@/components/ui/card";
import { DetailScreen } from "@/components/screens/detail-screen";
import { useTheme } from "@/lib/theme";
import { useOrderItem, useOrderItemMutations, useCanViewPrices } from "@/hooks";
import { mobileRoute } from "@/constants/routes.types";
import { routes, SECTOR_PRIVILEGES } from "@/constants";
import { spacing, fontSize, fontWeight } from "@/constants/design-system";
import { formatCurrency, formatDate, formatQuantity } from "@/utils";
import type { OrderItem } from "@/types";

export default function OrderItemDetailScreen() {
  const { orderId, id } = useLocalSearchParams<{
    orderId: string;
    id: string;
  }>();
  const { colors } = useTheme();
  const canViewPrices = useCanViewPrices();
  const { deleteMutation } = useOrderItemMutations();

  const query = useOrderItem(id as string, {
    include: {
      item: {
        include: {
          brands: { select: { id: true, name: true } },
          category: { select: { id: true, name: true } },
          measures: true,
        },
      },
      order: {
        select: {
          id: true,
          description: true,
          supplier: { select: { id: true, name: true } },
          status: true,
        },
      },
    },
    enabled: !!id,
  });

  return (
    <DetailScreen<OrderItem>
      query={query as any}
      icon={IconPackage}
      title={(oi) => oi.item?.name ?? "Item do Pedido"}
      subtitle={(oi) =>
        oi.order?.description ?? `Pedido #${oi.order?.id ?? orderId}`
      }
      privilege={{
        any: [SECTOR_PRIVILEGES.WAREHOUSE, SECTOR_PRIVILEGES.ADMIN],
      }}
      editRoute={(oi) =>
        mobileRoute(routes.inventory.orders.items.edit(orderId as string, oi.id))
      }
      deleteAction={{
        mutation: deleteMutation,
        confirmText: "Tem certeza que deseja remover este item do pedido?",
      }}
      notFoundFallback={mobileRoute(
        routes.inventory.orders.items.list(orderId as string),
      )}
    >
      {(orderItem) => {
        const item = orderItem.item;
        const order = orderItem.order;
        const totalPrice =
          (orderItem.price ?? 0) * (orderItem.orderedQuantity ?? 0);
        const pendingQuantity = Math.max(
          0,
          (orderItem.orderedQuantity ?? 0) -
            (orderItem.receivedQuantity ?? 0),
        );

        const statusInfo =
          (orderItem.receivedQuantity ?? 0) >=
          (orderItem.orderedQuantity ?? 0)
            ? { color: colors.primary, label: "Recebido" }
            : (orderItem.receivedQuantity ?? 0) > 0
              ? { color: colors.warning, label: "Parcial" }
              : { color: colors.muted, label: "Pendente" };

        return (
          <View style={styles.body}>
            {order && (
              <Card style={styles.card}>
                <View
                  style={[styles.header, { borderBottomColor: colors.border }]}
                >
                  <View style={styles.headerLeft}>
                    <IconPackage size={20} color={colors.mutedForeground} />
                    <ThemedText style={styles.title}>Pedido</ThemedText>
                  </View>
                </View>
                <View style={styles.content}>
                  <ThemedText style={styles.subTitle}>
                    {order.description || `Pedido #${order.id}`}
                  </ThemedText>
                  {order.supplier?.fantasyName && (
                    <ThemedText style={styles.muted}>
                      {order.supplier.fantasyName}
                    </ThemedText>
                  )}
                </View>
              </Card>
            )}

            <Card style={styles.card}>
              <View
                style={[styles.header, { borderBottomColor: colors.border }]}
              >
                <View style={styles.headerLeft}>
                  <IconPackage size={20} color={colors.mutedForeground} />
                  <ThemedText style={styles.title}>
                    Informações do Item
                  </ThemedText>
                </View>
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: statusInfo.color + "20" },
                  ]}
                >
                  <ThemedText
                    style={[styles.statusText, { color: statusInfo.color }]}
                  >
                    {statusInfo.label}
                  </ThemedText>
                </View>
              </View>
              <View style={styles.content}>
                <ThemedText style={styles.itemName}>
                  {item?.name ?? "Item desconhecido"}
                </ThemedText>
                {item?.uniCode && (
                  <DetailRow label="Código" value={item.uniCode} />
                )}
                {item?.brands && item.brands.length > 0 && (
                  <DetailRow label="Marca" value={item.brands.map((b) => b.name).join(", ")} />
                )}
                {item?.category?.name && (
                  <DetailRow label="Categoria" value={item.category.name} />
                )}
              </View>
            </Card>

            <Card style={styles.card}>
              <View
                style={[styles.header, { borderBottomColor: colors.border }]}
              >
                <View style={styles.headerLeft}>
                  <IconCurrency size={20} color={colors.mutedForeground} />
                  <ThemedText style={styles.title}>Quantidades</ThemedText>
                </View>
              </View>
              <View style={styles.content}>
                <View style={styles.quantityGrid}>
                  <QuantityCell
                    label="Pedido"
                    value={formatQuantity(orderItem.orderedQuantity ?? 0)}
                    color={colors.primary}
                  />
                  <QuantityCell
                    label="Recebido"
                    value={formatQuantity(orderItem.receivedQuantity ?? 0)}
                    color={colors.primary}
                  />
                  {pendingQuantity > 0 && (
                    <QuantityCell
                      label="Pendente"
                      value={formatQuantity(pendingQuantity)}
                      color={colors.destructive}
                    />
                  )}
                </View>
              </View>
            </Card>

            {canViewPrices && (
              <Card style={styles.card}>
                <View
                  style={[styles.header, { borderBottomColor: colors.border }]}
                >
                  <View style={styles.headerLeft}>
                    <IconCurrency size={20} color={colors.mutedForeground} />
                    <ThemedText style={styles.title}>Preços</ThemedText>
                  </View>
                </View>
                <View style={styles.content}>
                  <PriceRow
                    label="Preço Unitário"
                    value={formatCurrency(orderItem.price ?? 0)}
                  />
                  <PriceRow
                    label="Quantidade"
                    value={formatQuantity(orderItem.orderedQuantity ?? 0)}
                  />
                  <View style={[styles.priceRow, styles.totalRow]}>
                    <ThemedText style={[styles.priceLabel, styles.totalLabel]}>
                      Total
                    </ThemedText>
                    <ThemedText
                      style={[
                        styles.priceValue,
                        styles.totalValue,
                        { color: colors.primary },
                      ]}
                    >
                      {formatCurrency(totalPrice)}
                    </ThemedText>
                  </View>
                </View>
              </Card>
            )}

            <Card style={styles.card}>
              <View
                style={[styles.header, { borderBottomColor: colors.border }]}
              >
                <View style={styles.headerLeft}>
                  <IconCalendar size={20} color={colors.mutedForeground} />
                  <ThemedText style={styles.title}>
                    Informações de Auditoria
                  </ThemedText>
                </View>
              </View>
              <View style={styles.content}>
                <DetailRow
                  label="Criado em"
                  value={formatDate(orderItem.createdAt ?? new Date())}
                />
                <DetailRow
                  label="Atualizado em"
                  value={formatDate(orderItem.updatedAt ?? new Date())}
                />
              </View>
            </Card>
          </View>
        );
      }}
    </DetailScreen>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <ThemedText style={styles.detailLabel}>{label}:</ThemedText>
      <ThemedText style={styles.detailValue}>{value}</ThemedText>
    </View>
  );
}

function QuantityCell({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <View style={styles.quantityCell}>
      <ThemedText style={styles.quantityLabel}>{label}</ThemedText>
      <ThemedText style={[styles.quantityValue, { color }]}>{value}</ThemedText>
    </View>
  );
}

function PriceRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.priceRow}>
      <ThemedText style={styles.priceLabel}>{label}</ThemedText>
      <ThemedText style={styles.priceValue}>{value}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  body: {
    gap: spacing.md,
  },
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
    fontWeight: fontWeight.medium,
  },
  subTitle: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
  },
  muted: {
    fontSize: fontSize.sm,
    opacity: 0.7,
  },
  content: {
    gap: spacing.sm,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
  },
  itemName: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    marginBottom: spacing.xs,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 4,
  },
  detailLabel: {
    fontSize: fontSize.sm,
    opacity: 0.7,
    width: 100,
    fontWeight: fontWeight.medium,
  },
  detailValue: {
    fontSize: fontSize.sm,
    flex: 1,
  },
  quantityGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  quantityCell: {
    flex: 1,
    minWidth: "45%",
    alignItems: "center",
    padding: spacing.sm,
    backgroundColor: "rgba(0,0,0,0.05)",
    borderRadius: 12,
  },
  quantityLabel: {
    fontSize: fontSize.xs,
    opacity: 0.7,
    marginBottom: 4,
  },
  quantityValue: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
  },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing.xs,
  },
  priceLabel: {
    fontSize: fontSize.sm,
    opacity: 0.7,
  },
  priceValue: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.1)",
    marginTop: spacing.xs,
    paddingTop: spacing.sm,
  },
  totalLabel: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    opacity: 1,
  },
  totalValue: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
  },
});
