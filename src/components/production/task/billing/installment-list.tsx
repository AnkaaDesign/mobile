import React from "react";
import { View, StyleSheet } from "react-native";
import { ThemedText } from "@/components/ui/themed-text";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize, fontWeight } from "@/constants/design-system";
import { formatCurrency, formatDate } from "@/utils/formatters";
import { InstallmentStatusBadge } from "./installment-status-badge";
import { BankSlipStatusBadge } from "./bank-slip-status-badge";
import type { Installment } from "@/types/invoice";
import {
  INSTALLMENT_STATUS,
  BANK_SLIP_STATUS,
} from "@/constants/enums";

interface InstallmentListProps {
  installments: Installment[];
}

/**
 * When the installment itself is already PAID and the bank slip is also PAID
 * (or the installment is CANCELLED and the slip is CANCELLED), the bank-slip
 * badge just repeats the installment state. Suppress it to reduce noise; keep
 * it when it carries different information (OVERDUE, REJECTED, ERROR, ACTIVE
 * while installment still pending, etc.).
 */
function shouldShowBankSlipBadge(
  installmentStatus: string,
  bankSlipStatus: string,
): boolean {
  if (
    installmentStatus === INSTALLMENT_STATUS.PAID &&
    bankSlipStatus === BANK_SLIP_STATUS.PAID
  ) {
    return false;
  }
  if (
    installmentStatus === INSTALLMENT_STATUS.CANCELLED &&
    bankSlipStatus === BANK_SLIP_STATUS.CANCELLED
  ) {
    return false;
  }
  return true;
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
      {installments.map((installment, index) => {
        const installmentStatus = installment.status as string;
        const bankSlipStatus = installment.bankSlip?.status as string | undefined;

        // Paid/cancelled installments are the happy path — the invoice-level
        // badge already communicates the overall state, so don't repeat the
        // same signal on every row. Only surface a badge when it carries
        // actionable information (pending/overdue/processing/etc).
        const showInstallmentBadge =
          installmentStatus !== INSTALLMENT_STATUS.PAID &&
          installmentStatus !== INSTALLMENT_STATUS.CANCELLED;

        const showBankSlipBadge =
          bankSlipStatus !== undefined &&
          shouldShowBankSlipBadge(installmentStatus, bankSlipStatus);

        const hasAnyBadge = showInstallmentBadge || showBankSlipBadge;
        const paidColor = "#15803d";
        const amountColor =
          installmentStatus === INSTALLMENT_STATUS.PAID
            ? paidColor
            : colors.foreground;

        return (
          <View
            key={installment.id}
            style={[
              styles.row,
              { borderBottomColor: colors.border },
              index === installments.length - 1 && styles.lastRow,
            ]}
          >
            <View style={styles.topRow}>
              <ThemedText
                style={[styles.installmentNumber, { color: colors.mutedForeground }]}
              >
                #{installment.number}
              </ThemedText>
              <ThemedText
                style={[styles.dueDate, { color: colors.mutedForeground }]}
              >
                {formatDate(installment.dueDate)}
              </ThemedText>
              <ThemedText
                style={[styles.amount, { color: amountColor }]}
                numberOfLines={1}
              >
                {formatCurrency(installment.amount)}
              </ThemedText>
            </View>

            {hasAnyBadge && (
              <View style={styles.badgesRow}>
                {showInstallmentBadge && (
                  <InstallmentStatusBadge
                    status={installmentStatus as INSTALLMENT_STATUS}
                  />
                )}
                {showBankSlipBadge && (
                  <BankSlipStatusBadge
                    status={bankSlipStatus as BANK_SLIP_STATUS}
                  />
                )}
              </View>
            )}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 0,
  },
  row: {
    paddingVertical: spacing.sm + 2,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: spacing.xs,
  },
  lastRow: {
    borderBottomWidth: 0,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  installmentNumber: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    width: 32,
  },
  dueDate: {
    fontSize: fontSize.sm,
    flex: 1,
  },
  amount: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  badgesRow: {
    flexDirection: "row",
    gap: spacing.xs,
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
