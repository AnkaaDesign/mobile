import React from "react";
import { View, StyleSheet } from "react-native";
import { ThemedText } from "@/components/ui/themed-text";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize, fontWeight, borderRadius } from "@/constants/design-system";
import { formatCurrency, formatDate } from "@/utils/formatters";
import { InstallmentStatusBadge } from "./installment-status-badge";
import { BankSlipStatusBadge } from "./bank-slip-status-badge";
import type { Installment } from "@/types/invoice";
import type { INSTALLMENT_STATUS, BANK_SLIP_STATUS } from "@/constants/enums";

interface InstallmentListProps {
  installments: Installment[];
}

export function InstallmentList({ installments }: InstallmentListProps) {
  const { colors } = useTheme();

  if (!installments || installments.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <ThemedText style={[styles.emptyText, { color: colors.mutedForeground }]}>
          Nenhuma parcela encontrada.
        </ThemedText>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {installments.map((installment, index) => (
        <View
          key={installment.id}
          style={[
            styles.row,
            { borderBottomColor: colors.border },
            index === installments.length - 1 && styles.lastRow,
          ]}
        >
          <View style={styles.rowHeader}>
            <View style={styles.rowLeft}>
              <ThemedText style={[styles.installmentNumber, { color: colors.foreground }]}>
                Parcela {installment.number}
              </ThemedText>
              <ThemedText style={[styles.dueDate, { color: colors.mutedForeground }]}>
                Venc.: {formatDate(installment.dueDate)}
              </ThemedText>
            </View>
            <View style={styles.rowRight}>
              <ThemedText style={[styles.amount, { color: colors.foreground }]}>
                {formatCurrency(installment.amount)}
              </ThemedText>
            </View>
          </View>

          <View style={styles.badgesRow}>
            <InstallmentStatusBadge status={installment.status as INSTALLMENT_STATUS} />
            {installment.bankSlip && (
              <BankSlipStatusBadge status={installment.bankSlip.status as BANK_SLIP_STATUS} />
            )}
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 0,
  },
  row: {
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: spacing.sm,
  },
  lastRow: {
    borderBottomWidth: 0,
  },
  rowHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  rowLeft: {
    flex: 1,
    gap: 2,
  },
  rowRight: {
    alignItems: "flex-end",
  },
  installmentNumber: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  dueDate: {
    fontSize: fontSize.xs,
  },
  amount: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  badgesRow: {
    flexDirection: "row",
    gap: spacing.sm,
    flexWrap: "wrap",
  },
  emptyContainer: {
    paddingVertical: spacing.lg,
    alignItems: "center",
  },
  emptyText: {
    fontSize: fontSize.sm,
  },
});
