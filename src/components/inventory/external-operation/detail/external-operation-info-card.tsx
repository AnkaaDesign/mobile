import { View, StyleSheet } from "react-native";
import { ThemedText } from "@/components/ui/themed-text";
import { Badge } from "@/components/ui/badge";
import { DetailCard, DetailField, DetailSection } from "@/components/ui/detail-page-layout";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize, fontWeight } from "@/constants/design-system";
import type { ExternalOperation } from "@/types";
import {
  EXTERNAL_OPERATION_STATUS,
  EXTERNAL_OPERATION_TYPE,
  EXTERNAL_OPERATION_TYPE_LABELS,
  EXTERNAL_OPERATION_STATUS_LABELS,
  getBadgeVariant,
} from "@/constants";
import { formatDateTime, formatCurrency } from "@/utils";
import { useCanViewPrices } from "@/hooks";

interface ExternalOperationInfoCardProps {
  withdrawal: ExternalOperation;
}

export function ExternalOperationInfoCard({ withdrawal }: ExternalOperationInfoCardProps) {
  const { colors } = useTheme();
  const canViewPrices = useCanViewPrices();

  // Get badge variant from centralized configuration
  const statusBadgeVariant = getBadgeVariant(withdrawal.status, "EXTERNAL_OPERATION");
  const statusLabel = EXTERNAL_OPERATION_STATUS_LABELS[withdrawal.status] || withdrawal.status;

  // Calculate total price if chargeable: Σ(items: unit price × qty) + Σ(services: amount)
  const totalPrice =
    withdrawal.type === EXTERNAL_OPERATION_TYPE.CHARGEABLE
      ? (withdrawal.items?.reduce(
          (sum, item) => sum + item.withdrawedQuantity * (item.price || 0),
          0
        ) || 0) +
        (withdrawal.services?.reduce((sum, service) => sum + (service.amount || 0), 0) || 0)
      : 0;

  return (
    <DetailCard
      title="Informações da Operação Externa"
      icon="package"
      badge={
        <Badge variant={statusBadgeVariant}>
          {statusLabel}
        </Badge>
      }
    >
      {/* Withdrawer Information Section */}
      <DetailSection title="Informações do Responsável">
        <DetailField label="Nome" icon="user" value={withdrawal.withdrawerName} />
        {withdrawal.customer && (
          <DetailField
            label="Cliente"
            icon="building"
            value={withdrawal.customer.fantasyName || withdrawal.customer.corporateName || "-"}
          />
        )}
      </DetailSection>

      {/* Withdrawal Details Section */}
      <View style={[styles.sectionDivider, { borderTopColor: colors.border + "50" }]} />
      <DetailSection title="Detalhes da Operação">
        <DetailField
          label="Tipo de Operação"
          icon="arrow-back"
          value={
            <Badge
              variant={
                withdrawal.type === EXTERNAL_OPERATION_TYPE.RETURNABLE
                  ? "default"
                  : withdrawal.type === EXTERNAL_OPERATION_TYPE.CHARGEABLE
                  ? "destructive"
                  : "secondary"
              }
            >
              {EXTERNAL_OPERATION_TYPE_LABELS[withdrawal.type]}
            </Badge>
          }
        />

        {canViewPrices && withdrawal.type === EXTERNAL_OPERATION_TYPE.CHARGEABLE && (
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
