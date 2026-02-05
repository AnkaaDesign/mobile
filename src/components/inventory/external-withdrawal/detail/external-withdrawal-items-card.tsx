import { View, StyleSheet } from "react-native";
import { Card } from "@/components/ui/card";
import { ThemedText } from "@/components/ui/themed-text";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize, fontWeight } from "@/constants/design-system";
import { IconPackage, IconHash, IconCurrencyReal, IconArrowBack, IconAlertCircle, IconCircleCheck } from "@tabler/icons-react-native";
import type { ExternalWithdrawalItem } from "@/types";
import { formatCurrency } from "@/utils";
import { EXTERNAL_WITHDRAWAL_TYPE, EXTERNAL_WITHDRAWAL_STATUS } from "@/constants";

interface ExternalWithdrawalItemsCardProps {
  items: ExternalWithdrawalItem[];
  withdrawalType?: EXTERNAL_WITHDRAWAL_TYPE;
  withdrawalStatus?: EXTERNAL_WITHDRAWAL_STATUS;
}

export function ExternalWithdrawalItemsCard({ items, withdrawalType, withdrawalStatus }: ExternalWithdrawalItemsCardProps) {
  const { colors } = useTheme();

  const isReturnable = withdrawalType === EXTERNAL_WITHDRAWAL_TYPE.RETURNABLE;
  const isDelivered = withdrawalStatus === EXTERNAL_WITHDRAWAL_STATUS.DELIVERED;
  const isCharged = withdrawalStatus === EXTERNAL_WITHDRAWAL_STATUS.CHARGED;
  const isLiquidated = withdrawalStatus === EXTERNAL_WITHDRAWAL_STATUS.LIQUIDATED;

  // Calculate summary statistics
  const summary = items.reduce(
    (acc, item) => {
      const stillOut = item.withdrawedQuantity - item.returnedQuantity;
      return {
        totalWithdrawn: acc.totalWithdrawn + item.withdrawedQuantity,
        totalReturned: acc.totalReturned + item.returnedQuantity,
        totalPending: acc.totalPending + stillOut,
        totalValue: acc.totalValue + (item.withdrawedQuantity * (item.price || 0)),
      };
    },
    { totalWithdrawn: 0, totalReturned: 0, totalPending: 0, totalValue: 0 }
  );

  if (!items || items.length === 0) {
    return (
      <Card style={styles.card}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <View style={styles.headerLeft}>
            <IconPackage size={20} color={colors.mutedForeground} />
            <ThemedText style={styles.title}>Itens Retirados</ThemedText>
          </View>
          <Badge variant="secondary">0</Badge>
        </View>
        <View style={styles.emptyContainer}>
          <ThemedText style={[styles.emptyText, { color: colors.mutedForeground }]}>
            Nenhum item retirado
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
          <IconPackage size={20} color={colors.mutedForeground} />
          <ThemedText style={styles.title}>Itens Retirados</ThemedText>
        </View>
        <Badge variant="secondary">{items.length}</Badge>
      </View>

      {/* Summary Section */}
      {isReturnable && items.length > 0 && (
        <View style={[styles.summarySection, { borderBottomColor: colors.border, backgroundColor: colors.muted + "20" }]}>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <IconArrowBack size={16} color={colors.mutedForeground} />
              <View>
                <ThemedText style={[styles.summaryLabel, { color: colors.mutedForeground }]}>
                  Retirado
                </ThemedText>
                <ThemedText style={[styles.summaryValue, { color: colors.foreground }]}>
                  {summary.totalWithdrawn}
                </ThemedText>
              </View>
            </View>
            <View style={styles.summaryItem}>
              <IconCircleCheck size={16} color={colors.success} />
              <View>
                <ThemedText style={[styles.summaryLabel, { color: colors.mutedForeground }]}>
                  Devolvido
                </ThemedText>
                <ThemedText style={[styles.summaryValue, { color: colors.success }]}>
                  {summary.totalReturned}
                </ThemedText>
              </View>
            </View>
            <View style={styles.summaryItem}>
              <IconAlertCircle size={16} color={colors.warning} />
              <View>
                <ThemedText style={[styles.summaryLabel, { color: colors.mutedForeground }]}>
                  Pendente
                </ThemedText>
                <ThemedText style={[styles.summaryValue, { color: colors.warning }]}>
                  {summary.totalPending}
                </ThemedText>
              </View>
            </View>
          </View>
        </View>
      )}

      {/* Items List */}
      <View style={styles.content}>
        {items.map((withdrawalItem, index) => {
          const item = withdrawalItem.item;
          const stillOut = withdrawalItem.withdrawedQuantity - withdrawalItem.returnedQuantity;
          const hasReturned = withdrawalItem.returnedQuantity > 0;

          return (
            <View
              key={withdrawalItem.id}
              style={[
                styles.itemContainer,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  borderBottomWidth: index < items.length - 1 ? 1 : 0,
                },
              ]}
            >
              {/* Item Name */}
              <View style={styles.itemHeader}>
                <ThemedText style={[styles.itemName, { color: colors.foreground }]}>
                  {item?.name || "Item Desconhecido"}
                </ThemedText>
                {item?.uniCode && (
                  <ThemedText style={[styles.itemCode, { color: colors.mutedForeground }]}>
                    #{item.uniCode}
                  </ThemedText>
                )}
              </View>

              {/* Item Details */}
              <View style={styles.itemDetails}>
                {/* Withdrawn Quantity */}
                <View style={styles.detailRow}>
                  <View style={styles.detailLeft}>
                    <IconArrowBack size={14} color={colors.mutedForeground} />
                    <ThemedText style={[styles.detailLabel, { color: colors.mutedForeground }]}>
                      Retirado
                    </ThemedText>
                  </View>
                  <ThemedText style={[styles.detailValue, { color: colors.foreground }]}>
                    {withdrawalItem.withdrawedQuantity}
                  </ThemedText>
                </View>

                {/* Returned Quantity - only for returnable types */}
                {isReturnable && hasReturned && (
                  <View style={styles.detailRow}>
                    <View style={styles.detailLeft}>
                      <IconArrowBack size={14} color={colors.success} style={{ transform: [{ rotate: "180deg" }] }} />
                      <ThemedText style={[styles.detailLabel, { color: colors.mutedForeground }]}>
                        Devolvido
                      </ThemedText>
                    </View>
                    <ThemedText style={[styles.detailValue, { color: colors.success }]}>
                      {withdrawalItem.returnedQuantity}
                    </ThemedText>
                  </View>
                )}

                {/* Still Out - only for returnable types */}
                {isReturnable && stillOut > 0 && (
                  <View style={styles.detailRow}>
                    <View style={styles.detailLeft}>
                      <IconHash size={14} color={colors.warning} />
                      <ThemedText style={[styles.detailLabel, { color: colors.mutedForeground }]}>
                        Pendente
                      </ThemedText>
                    </View>
                    <ThemedText style={[styles.detailValue, { color: colors.warning }]}>
                      {stillOut}
                    </ThemedText>
                  </View>
                )}

                {/* Status for non-returnable types */}
                {!isReturnable && (
                  <View style={styles.detailRow}>
                    <View style={styles.detailLeft}>
                      <IconCircleCheck size={14} color={isDelivered || isLiquidated ? colors.success : isCharged ? colors.primary : colors.warning} />
                      <ThemedText style={[styles.detailLabel, { color: colors.mutedForeground }]}>
                        Status
                      </ThemedText>
                    </View>
                    <ThemedText style={[styles.detailValue, { color: isDelivered || isLiquidated ? colors.success : isCharged ? colors.primary : colors.warning }]}>
                      {isDelivered ? "Entregue" : isCharged ? "Cobrado" : isLiquidated ? "Liquidado" : "Pendente"}
                    </ThemedText>
                  </View>
                )}

                {/* Price */}
                {withdrawalItem.price !== null && withdrawalItem.price !== undefined && (
                  <View style={styles.detailRow}>
                    <View style={styles.detailLeft}>
                      <IconCurrencyReal size={14} color={colors.mutedForeground} />
                      <ThemedText style={[styles.detailLabel, { color: colors.mutedForeground }]}>
                        Preço Unit.
                      </ThemedText>
                    </View>
                    <ThemedText style={[styles.detailValue, { color: colors.foreground }]}>
                      {formatCurrency(withdrawalItem.price)}
                    </ThemedText>
                  </View>
                )}

                {/* Total Price */}
                {withdrawalItem.price !== null && withdrawalItem.price !== undefined && (
                  <View style={[styles.detailRow, { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: spacing.xs, marginTop: spacing.xs }]}>
                    <ThemedText style={[styles.detailLabel, { color: colors.mutedForeground, fontWeight: fontWeight.semibold }]}>
                      Total
                    </ThemedText>
                    <ThemedText style={[styles.detailValue, { color: colors.foreground, fontWeight: fontWeight.bold }]}>
                      {formatCurrency(withdrawalItem.withdrawedQuantity * withdrawalItem.price)}
                    </ThemedText>
                  </View>
                )}
              </View>

              {/* Item Brand/Category */}
              {(item?.brand || item?.category) && (
                <View style={styles.itemMeta}>
                  {item.brand && (
                    <Badge variant="outline" style={styles.metaBadge}>
                      {item.brand.name}
                    </Badge>
                  )}
                  {item.category && (
                    <Badge variant="secondary" style={styles.metaBadge}>
                      {item.category.name}
                    </Badge>
                  )}
                </View>
              )}
            </View>
          );
        })}
      </View>
    </Card>
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
    padding: 0,
  },
  emptyContainer: {
    padding: spacing.xl,
    alignItems: "center",
  },
  emptyText: {
    fontSize: fontSize.sm,
  },
  itemContainer: {
    padding: spacing.md,
  },
  itemHeader: {
    marginBottom: spacing.sm,
  },
  itemName: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    marginBottom: spacing.xs,
  },
  itemCode: {
    fontSize: fontSize.xs,
  },
  itemDetails: {
    gap: spacing.xs,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  detailLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  detailLabel: {
    fontSize: fontSize.sm,
  },
  detailValue: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  itemMeta: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  metaBadge: {
    // Badge component handles its own text styling
  },
  summarySection: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    gap: spacing.sm,
  },
  summaryItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  summaryLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },
  summaryValue: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
  },
});
