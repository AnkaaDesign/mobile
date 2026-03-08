import { StyleSheet } from "react-native";
import { ThemedText } from "@/components/ui/themed-text";
import { Badge } from "@/components/ui/badge";
import { formatDate, formatQuantity } from "@/utils";
import { PPE_DELIVERY_STATUS_LABELS, PPE_DELIVERY_STATUS } from "@/constants";
import { BADGE_COLORS, ENTITY_BADGE_CONFIG } from "@/constants/badge-colors";
import { DetailCard, DetailField } from "@/components/ui/detail-page-layout";
import { fontSize, fontWeight, spacing } from "@/constants/design-system";
import type { PpeDelivery } from '../../../../../types';

interface DeliveryCardProps {
  delivery: PpeDelivery;
}

export function DeliveryCard({ delivery }: DeliveryCardProps) {
  const variant = ENTITY_BADGE_CONFIG.PPE_DELIVERY[delivery.status as PPE_DELIVERY_STATUS] || "gray";
  const badgeColor = BADGE_COLORS[variant];

  return (
    <DetailCard title="Informações da Entrega" icon="package">
      <DetailField
        label="Status"
        icon="info-circle"
        value={
          <Badge
            variant="secondary"
            style={{ backgroundColor: badgeColor.bg, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs }}
          >
            <ThemedText style={[styles.badgeText, { color: badgeColor.text }]}>
              {PPE_DELIVERY_STATUS_LABELS[delivery.status as PPE_DELIVERY_STATUS] || delivery.status}
            </ThemedText>
          </Badge>
        }
      />

      {delivery.scheduledDate && (
        <DetailField
          label="Data Agendada"
          icon="calendar"
          value={formatDate(new Date(delivery.scheduledDate))}
        />
      )}

      {delivery.actualDeliveryDate && (
        <DetailField
          label="Data de Entrega"
          icon="calendar"
          value={formatDate(new Date(delivery.actualDeliveryDate))}
        />
      )}

      <DetailField
        label="Quantidade"
        icon="hash"
        value={formatQuantity(delivery.quantity)}
      />
    </DetailCard>
  );
}

const styles = StyleSheet.create({
  badgeText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },
});
