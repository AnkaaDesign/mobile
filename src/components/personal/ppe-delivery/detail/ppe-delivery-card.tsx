import React from "react";
import { Badge } from "@/components/ui/badge";
import { ThemedText } from "@/components/ui/themed-text";
import { DetailCard, DetailField } from "@/components/ui/detail-page-layout";
import { fontSize, fontWeight, spacing } from "@/constants/design-system";
import type { PpeDelivery } from "@/types";
import { PPE_DELIVERY_STATUS_LABELS, PPE_DELIVERY_STATUS } from "@/constants";
import { BADGE_COLORS, ENTITY_BADGE_CONFIG } from "@/constants/badge-colors";
import { formatDate, formatQuantity } from "@/utils";

interface PpeDeliveryCardProps {
  delivery: PpeDelivery;
}

export function PpeDeliveryCard({ delivery }: PpeDeliveryCardProps) {
  const variant = ENTITY_BADGE_CONFIG.PPE_DELIVERY[delivery.status as PPE_DELIVERY_STATUS] || "gray";
  const badgeColor = BADGE_COLORS[variant];

  return (
    <DetailCard title="Informações da Entrega" icon="package">
      {/* Status */}
      <DetailField
        label="Status"
        icon="info-circle"
        value={
          <Badge
            variant="secondary"
            style={{ backgroundColor: badgeColor.bg, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, alignSelf: "flex-start" }}
          >
            <ThemedText style={{ color: badgeColor.text, fontSize: fontSize.sm, fontWeight: fontWeight.semibold }}>
              {PPE_DELIVERY_STATUS_LABELS[delivery.status as PPE_DELIVERY_STATUS] || delivery.status}
            </ThemedText>
          </Badge>
        }
      />

      {/* Quantity */}
      <DetailField
        label="Quantidade"
        icon="hash"
        value={formatQuantity(delivery.quantity || 1)}
      />

      {/* Scheduled Date */}
      {delivery.scheduledDate && (
        <DetailField
          label="Data Programada"
          icon="calendar"
          value={formatDate(new Date(delivery.scheduledDate))}
        />
      )}

      {/* Actual Delivery Date */}
      {delivery.actualDeliveryDate && (
        <DetailField
          label="Data de Entrega"
          icon="calendar-event"
          value={formatDate(new Date(delivery.actualDeliveryDate))}
        />
      )}

      {/* Reviewed By */}
      {delivery.reviewedByUser && (
        <DetailField
          label="Revisado Por"
          icon="user-check"
          value={delivery.reviewedByUser.name}
        />
      )}

      {/* Created At */}
      <DetailField
        label="Solicitado Em"
        icon="clock"
        value={formatDate(new Date(delivery.createdAt))}
      />
    </DetailCard>
  );
}
