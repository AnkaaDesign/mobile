import { View, StyleSheet } from "react-native";
import { Card } from "@/components/ui/card";
import { ThemedText } from "@/components/ui/themed-text";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize, fontWeight, borderRadius } from "@/constants/design-system";
import { IconPackage, IconHash, IconCurrencyReal, IconArrowBack } from "@tabler/icons-react-native";
import type { ExternalWithdrawalItem } from "@/types";
import { formatCurrency } from "@/utils";

interface ExternalWithdrawalItemsCardProps {
  items: ExternalWithdrawalItem[];
}

export function ExternalWithdrawalItemsCard({ items }: ExternalWithdrawalItemsCardProps) {
  const { colors } = useTheme();

  if (!items || items.length === 0) {
    return (
      <Card style={styles.card}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <View style={[styles.iconContainer, { backgroundColor: colors.primary + "20" }]}>
            <IconPackage size={20} color={colors.primary} />
          </View>
          <ThemedText style={styles.headerTitle}>Itens Retirados</ThemedText>
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
        <View style={[styles.iconContainer, { backgroundColor: colors.primary + "20" }]}>
          <IconPackage size={20} color={colors.primary} />
        </View>
        <ThemedText style={styles.headerTitle}>Itens Retirados</ThemedText>
        <Badge variant="secondary">{items.length}</Badge>
      </View>

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

                {/* Returned Quantity */}
                {hasReturned && (
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

                {/* Still Out */}
                {stillOut > 0 && (
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
    padding: 0,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.semibold,
    flex: 1,
    marginLeft: spacing.sm,
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
    fontSize: fontSize.xs,
  },
});
