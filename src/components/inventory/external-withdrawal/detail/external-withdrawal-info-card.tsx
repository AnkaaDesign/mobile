import { View, StyleSheet } from "react-native";
import { ThemedText } from "@/components/ui/themed-text";
import { Badge } from "@/components/ui/badge";
import { DetailCard, DetailField, DetailSection } from "@/components/ui/detail-page-layout";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize, fontWeight } from "@/constants/design-system";
import type { ExternalWithdrawal } from "@/types";
import {
  EXTERNAL_WITHDRAWAL_STATUS,
  EXTERNAL_WITHDRAWAL_TYPE,
  EXTERNAL_WITHDRAWAL_TYPE_LABELS,
  EXTERNAL_WITHDRAWAL_STATUS_LABELS,
  getBadgeVariant,
} from "@/constants";
import { formatDateTime, formatCurrency } from "@/utils";

interface ExternalWithdrawalInfoCardProps {
  withdrawal: ExternalWithdrawal;
}

export function ExternalWithdrawalInfoCard({ withdrawal }: ExternalWithdrawalInfoCardProps) {
  const { colors } = useTheme();

  // Get badge variant from centralized configuration
  const statusBadgeVariant = getBadgeVariant(withdrawal.status, "EXTERNAL_WITHDRAWAL");
  const statusLabel = EXTERNAL_WITHDRAWAL_STATUS_LABELS[withdrawal.status] || withdrawal.status;

  // Calculate total price if chargeable
  const totalPrice =
    withdrawal.type === EXTERNAL_WITHDRAWAL_TYPE.CHARGEABLE
      ? withdrawal.items?.reduce(
          (sum, item) => sum + item.withdrawedQuantity * (item.price || 0),
          0
        ) || 0
      : 0;

  return (
    <DetailCard
      title="Informações da Retirada Externa"
      icon="package"
      badge={
        <Badge variant={statusBadgeVariant}>
          {statusLabel}
        </Badge>
      }
    >
      {/* Withdrawer Information Section */}
      <DetailSection title="Informações do Retirador">
        <DetailField label="Nome" icon="user" value={withdrawal.withdrawerName} />
      </DetailSection>

      {/* Withdrawal Details Section */}
      <View style={[styles.sectionDivider, { borderTopColor: colors.border + "50" }]} />
      <DetailSection title="Detalhes da Retirada">
        <DetailField
          label="Tipo de Retirada"
          icon="arrow-back"
          value={
            <Badge
              variant={
                withdrawal.type === EXTERNAL_WITHDRAWAL_TYPE.RETURNABLE
                  ? "default"
                  : withdrawal.type === EXTERNAL_WITHDRAWAL_TYPE.CHARGEABLE
                  ? "destructive"
                  : "secondary"
              }
            >
              {EXTERNAL_WITHDRAWAL_TYPE_LABELS[withdrawal.type]}
            </Badge>
          }
        />

        {withdrawal.type === EXTERNAL_WITHDRAWAL_TYPE.CHARGEABLE && (
          <DetailField
            label="Valor Total"
            icon="currency-real"
            value={formatCurrency(totalPrice)}
          />
        )}

        <DetailField
          label="Data de Criação"
          icon="calendar"
          value={formatDateTime(withdrawal.createdAt)}
        />

        {withdrawal.updatedAt && withdrawal.updatedAt !== withdrawal.createdAt && (
          <DetailField
            label="Última Atualização"
            icon="calendar"
            value={formatDateTime(withdrawal.updatedAt)}
          />
        )}
      </DetailSection>

      {/* Notes Section */}
      {withdrawal.notes && (
        <>
          <View style={[styles.sectionDivider, { borderTopColor: colors.border + "50" }]} />
          <DetailField label="Observações" icon="notes" value={withdrawal.notes} />
        </>
      )}
    </DetailCard>
  );
}

const styles = StyleSheet.create({
  sectionDivider: {
    borderTopWidth: 1,
    paddingTop: spacing.md,
  },
});
