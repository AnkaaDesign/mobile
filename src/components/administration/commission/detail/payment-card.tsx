
import { View, StyleSheet } from "react-native";
import { Card } from "@/components/ui/card";
import { ThemedText } from "@/components/ui/themed-text";
import { Badge } from "@/components/ui/badge";
import { IconCreditCard, IconCalendar, IconFileText, IconCheck } from "@tabler/icons-react-native";
import type { Commission } from '../../../../types';
import { COMMISSION_STATUS } from '../../../../constants';
import { formatCurrency, formatDate } from '../../../../utils';
import { useTheme } from "@/lib/theme";
import { spacing, borderRadius, fontSize, fontWeight } from "@/constants/design-system";
import { extendedColors } from "@/lib/theme/extended-colors";

interface PaymentCardProps {
  commission: Commission;
}

export function PaymentCard({ commission }: PaymentCardProps) {
  const { colors, isDark } = useTheme();

  // Mock payment data - will be replaced with actual payment entity when available
  const isPaid = commission.status === COMMISSION_STATUS.FULL_COMMISSION;
  const paymentDate = isPaid ? commission.updatedAt : null;
  const paymentMethod = "Transferência Bancária"; // Mock data
  const transactionId = isPaid ? `TRX-${commission.id.substring(0, 8).toUpperCase()}` : null;

  // Only show if commission is paid or has payment information
  if (!isPaid && commission.status !== COMMISSION_STATUS.PARTIAL_COMMISSION) {
    return null;
  }

  const baseValue = commission.task?.price || 0;
  const commissionRate = commission.user?.position?.commissionRate || 0;
  const calculatedAmount = baseValue * (commissionRate / 100);
  const multiplier = commission.status === COMMISSION_STATUS.PARTIAL_COMMISSION ? 0.5 : 1.0;
  const paidAmount = calculatedAmount * multiplier;

  return (
    <Card style={styles.card}>
      <View style={[styles.sectionHeader, { borderBottomColor: colors.border }]}>
        <View style={styles.titleRow}>
          <View style={StyleSheet.flatten([styles.titleIcon, { backgroundColor: colors.primary + "10" }])}>
            <IconCreditCard size={18} color={colors.primary} />
          </View>
          <ThemedText style={StyleSheet.flatten([styles.titleText, { color: colors.foreground }])}>Informações de Pagamento</ThemedText>
        </View>
      </View>
      <View style={styles.content}>
        <View style={styles.content}>
          {/* Payment Status */}
          <View
            style={[
              styles.statusContainer,
              {
                backgroundColor: isPaid ? (isDark ? extendedColors.green[900] + "20" : extendedColors.green[100]) : isDark ? extendedColors.yellow[900] + "20" : extendedColors.yellow[100],
                borderColor: isPaid ? (isDark ? extendedColors.green[500] : extendedColors.green[600]) : isDark ? extendedColors.yellow[500] : extendedColors.yellow[600],
              },
            ]}
          >
            <View style={styles.statusHeader}>
              <View style={styles.statusLabelRow}>
                {isPaid && <IconCheck size={20} color={isDark ? extendedColors.green[400] : extendedColors.green[700]} />}
                <ThemedText
                  style={[styles.statusLabel, { color: isPaid ? (isDark ? extendedColors.green[400] : extendedColors.green[700]) : isDark ? extendedColors.yellow[400] : extendedColors.yellow[700] }]}
                >
                  {isPaid ? "Pagamento Realizado" : "Pagamento Parcial"}
                </ThemedText>
              </View>
              <Badge variant={isPaid ? "success" : "warning"}>
                <ThemedText style={StyleSheet.flatten([styles.badgeText, { color: colors.primaryForeground }])}>{formatCurrency(paidAmount)}</ThemedText>
              </Badge>
            </View>
          </View>

          {/* Payment Details */}
          {isPaid && (
            <>
              {/* Payment Date */}
              {paymentDate && (
                <View style={StyleSheet.flatten([styles.infoItem, { backgroundColor: colors.muted + "30" }])}>
                  <View style={styles.infoLabelRow}>
                    <IconCalendar size={16} color={colors.mutedForeground} />
                    <ThemedText style={StyleSheet.flatten([styles.infoLabel, { color: colors.mutedForeground }])}>Data do Pagamento</ThemedText>
                  </View>
                  <ThemedText style={StyleSheet.flatten([styles.infoValue, { color: colors.foreground }])}>{formatDate(paymentDate)}</ThemedText>
                </View>
              )}

              {/* Payment Method */}
              <View style={StyleSheet.flatten([styles.infoItem, { backgroundColor: colors.muted + "30" }])}>
                <View style={styles.infoLabelRow}>
                  <IconCreditCard size={16} color={colors.mutedForeground} />
                  <ThemedText style={StyleSheet.flatten([styles.infoLabel, { color: colors.mutedForeground }])}>Método de Pagamento</ThemedText>
                </View>
                <ThemedText style={StyleSheet.flatten([styles.infoValue, { color: colors.foreground }])}>{paymentMethod}</ThemedText>
              </View>

              {/* Transaction ID */}
              {transactionId && (
                <View style={StyleSheet.flatten([styles.infoItem, { backgroundColor: colors.muted + "30" }])}>
                  <View style={styles.infoLabelRow}>
                    <IconFileText size={16} color={colors.mutedForeground} />
                    <ThemedText style={StyleSheet.flatten([styles.infoLabel, { color: colors.mutedForeground }])}>ID da Transação</ThemedText>
                  </View>
                  <ThemedText style={StyleSheet.flatten([styles.infoValue, { color: colors.foreground, fontFamily: "monospace" }])}>{transactionId}</ThemedText>
                </View>
              )}
            </>
          )}

          {/* Pending Payment Message */}
          {!isPaid && commission.status === COMMISSION_STATUS.PARTIAL_COMMISSION && (
            <View style={StyleSheet.flatten([styles.pendingContainer, { backgroundColor: colors.muted + "20", borderColor: colors.border }])}>
              <ThemedText style={StyleSheet.flatten([styles.pendingText, { color: colors.mutedForeground }])}>
                Esta comissão foi marcada como parcial. O saldo restante será processado conforme as políticas da empresa.
              </ThemedText>
            </View>
          )}
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: spacing.md,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  content: {
    gap: spacing.md,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  titleIcon: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  titleText: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
  },
  statusContainer: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
  },
  statusHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statusLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  statusLabel: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
  },
  infoItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
  },
  infoLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    flex: 1,
  },
  infoLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  infoValue: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    textAlign: "right",
  },
  pendingContainer: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
  },
  pendingText: {
    fontSize: fontSize.sm,
    lineHeight: fontSize.sm * 1.5,
    textAlign: "center",
  },
  badgeText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },
});
