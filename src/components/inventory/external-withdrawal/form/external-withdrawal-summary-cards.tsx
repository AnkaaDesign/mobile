import React, { useMemo } from "react";
import { View, ScrollView, StyleSheet } from "react-native";
import { IconUser, IconPackage, IconCurrencyDollar, IconFileText, IconHash, IconBoxMultiple } from "@tabler/icons-react-native";

import { useTheme } from "@/lib/theme";
import { spacing, borderRadius } from "@/constants/design-system";
import { EXTERNAL_WITHDRAWAL_TYPE, EXTERNAL_WITHDRAWAL_TYPE_LABELS } from "@/constants";
import { formatCurrency } from "@/utils";

import { Text } from "@/components/ui/text";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface ExternalWithdrawalSummaryCardsProps {
  withdrawerName: string;
  type: EXTERNAL_WITHDRAWAL_TYPE;
  notes?: string;
  selectedItems: Set<string>;
  quantities: Record<string, number>;
  prices: Record<string, number>;
  totalPrice?: number;
}

export function ExternalWithdrawalSummaryCards({
  withdrawerName,
  type,
  notes,
  selectedItems,
  quantities,
  prices,
  totalPrice = 0,
}: ExternalWithdrawalSummaryCardsProps) {
  const { colors } = useTheme();

  // Calculate totals
  const totalItems = selectedItems.size;
  const totalQuantity = useMemo(() => {
    return Array.from(selectedItems).reduce((sum, itemId) => {
      return sum + (quantities[itemId] || 0);
    }, 0);
  }, [selectedItems, quantities]);

  const calculatedTotalPrice = useMemo(() => {
    if (type !== EXTERNAL_WITHDRAWAL_TYPE.CHARGEABLE) return 0;

    return Array.from(selectedItems).reduce((sum, itemId) => {
      const quantity = quantities[itemId] || 0;
      const price = prices[itemId] || 0;
      return sum + quantity * price;
    }, 0);
  }, [type, selectedItems, quantities, prices]);

  const finalTotalPrice = totalPrice || calculatedTotalPrice;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Basic Info Card */}
      <Card style={styles.card}>
        <CardHeader>
          <View style={styles.cardHeader}>
            <View style={[styles.iconBadge, { backgroundColor: `${colors.primary}20` }]}>
              <IconUser size={20} color={colors.primary} />
            </View>
            <Text style={styles.cardTitle}>Informações da Retirada</Text>
          </View>
        </CardHeader>
        <CardContent style={styles.cardContent}>
          {/* Withdrawer */}
          <View style={[styles.infoRow, { backgroundColor: colors.muted }]}>
            <View style={styles.infoRowIcon}>
              <IconUser size={16} color={colors.mutedForeground} />
            </View>
            <Text style={styles.infoLabel}>Nome do Retirador</Text>
            <Text style={styles.infoValue}>{withdrawerName}</Text>
          </View>

          {/* Type */}
          <View style={[styles.infoRow, { backgroundColor: colors.muted }]}>
            <View style={styles.infoRowIcon}>
              <IconPackage size={16} color={colors.mutedForeground} />
            </View>
            <Text style={styles.infoLabel}>Tipo de Retirada</Text>
            <Badge
              variant={
                type === EXTERNAL_WITHDRAWAL_TYPE.RETURNABLE
                  ? "success"
                  : type === EXTERNAL_WITHDRAWAL_TYPE.CHARGEABLE
                  ? "destructive"
                  : "secondary"
              }
            >
              {EXTERNAL_WITHDRAWAL_TYPE_LABELS[type]}
            </Badge>
          </View>

          {/* Notes */}
          {notes && (
            <View style={[styles.notesRow, { backgroundColor: colors.muted }]}>
              <View style={styles.infoRowIcon}>
                <IconFileText size={16} color={colors.mutedForeground} />
              </View>
              <View style={styles.notesContent}>
                <Text style={styles.infoLabel}>Observações</Text>
                <Text style={styles.notesText}>{notes}</Text>
              </View>
            </View>
          )}
        </CardContent>
      </Card>

      {/* Items Summary Card */}
      <Card style={styles.card}>
        <CardHeader>
          <View style={styles.cardHeader}>
            <View style={[styles.iconBadge, { backgroundColor: `${colors.primary}20` }]}>
              <IconPackage size={20} color={colors.primary} />
            </View>
            <Text style={styles.cardTitle}>Itens da Retirada</Text>
            <Badge variant="secondary">
              {totalItems} {totalItems === 1 ? "item" : "itens"}
            </Badge>
          </View>
        </CardHeader>
        <CardContent style={styles.cardContent}>
          {/* Summary Stats */}
          <View style={styles.statsGrid}>
            <View style={[styles.statCard, { backgroundColor: colors.muted }]}>
              <View style={styles.statIcon}>
                <IconHash size={16} color={colors.mutedForeground} />
              </View>
              <Text style={styles.statLabel}>Total de Itens</Text>
              <Text style={styles.statValue}>{totalItems}</Text>
            </View>

            <View style={[styles.statCard, { backgroundColor: colors.muted }]}>
              <View style={styles.statIcon}>
                <IconBoxMultiple size={16} color={colors.mutedForeground} />
              </View>
              <Text style={styles.statLabel}>Quantidade Total</Text>
              <Text style={styles.statValue}>
                {totalQuantity % 1 === 0
                  ? totalQuantity.toLocaleString("pt-BR")
                  : totalQuantity.toLocaleString("pt-BR", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
              </Text>
            </View>
          </View>

          {selectedItems.size === 0 && (
            <View style={styles.emptyState}>
              <IconPackage size={24} color={colors.mutedForeground} />
              <Text style={styles.emptyText}>Nenhum item selecionado</Text>
            </View>
          )}
        </CardContent>
      </Card>

      {/* Total Calculation Card (for CHARGEABLE only) */}
      {type === EXTERNAL_WITHDRAWAL_TYPE.CHARGEABLE && (
        <Card style={styles.card}>
          <CardHeader>
            <View style={styles.cardHeader}>
              <View style={[styles.iconBadge, { backgroundColor: `${colors.primary}20` }]}>
                <IconCurrencyDollar size={20} color={colors.primary} />
              </View>
              <Text style={styles.cardTitle}>Cálculo do Total</Text>
            </View>
          </CardHeader>
          <CardContent style={styles.cardContent}>
            {/* Stats Grid */}
            <View style={styles.statsGrid}>
              <View style={[styles.statCard, { backgroundColor: colors.muted }]}>
                <Text style={styles.statValue} numberOfLines={1}>
                  {totalItems}
                </Text>
                <Text style={styles.statLabel}>
                  {totalItems === 1 ? "Item" : "Itens"}
                </Text>
              </View>

              <View style={[styles.statCard, { backgroundColor: colors.muted }]}>
                <Text style={styles.statValue} numberOfLines={1}>
                  {totalQuantity % 1 === 0
                    ? totalQuantity.toLocaleString("pt-BR")
                    : totalQuantity.toLocaleString("pt-BR", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                </Text>
                <Text style={styles.statLabel}>Quantidade</Text>
              </View>
            </View>

            <Separator style={styles.separator} />

            {/* Grand Total */}
            <View style={[styles.grandTotal, { backgroundColor: `#10b98120` }]}>
              <Text style={styles.grandTotalLabel}>Total da Retirada:</Text>
              <Text style={[styles.grandTotalValue, { color: "#10b981" }]}>
                {formatCurrency(finalTotalPrice)}
              </Text>
            </View>
          </CardContent>
        </Card>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  card: {
    marginBottom: spacing.md,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  iconBadge: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  cardTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
  },
  cardContent: {
    gap: spacing.md,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
  },
  infoRowIcon: {
    width: 24,
    alignItems: "center",
  },
  infoLabel: {
    flex: 1,
    fontSize: 13,
    fontWeight: "500",
    opacity: 0.7,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: "600",
  },
  notesRow: {
    flexDirection: "row",
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
  },
  notesContent: {
    flex: 1,
    gap: spacing.xs,
  },
  notesText: {
    fontSize: 14,
    lineHeight: 20,
  },
  statsGrid: {
    flexDirection: "row",
    gap: spacing.md,
  },
  statCard: {
    flex: 1,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    gap: spacing.xs,
    alignItems: "center",
  },
  statIcon: {
    marginBottom: spacing.xs,
  },
  statLabel: {
    fontSize: 11,
    textAlign: "center",
    opacity: 0.7,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "700",
  },
  emptyState: {
    alignItems: "center",
    padding: spacing.xl,
    gap: spacing.sm,
  },
  emptyText: {
    fontSize: 14,
    opacity: 0.7,
  },
  separator: {
    marginVertical: spacing.sm,
  },
  grandTotal: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: spacing.md,
    borderRadius: borderRadius.lg,
  },
  grandTotalLabel: {
    fontSize: 15,
    fontWeight: "600",
  },
  grandTotalValue: {
    fontSize: 22,
    fontWeight: "700",
  },
});
