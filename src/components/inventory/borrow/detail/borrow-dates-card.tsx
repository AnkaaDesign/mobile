import React from "react";
import { View, StyleSheet } from "react-native";
import { ThemedText } from "@/components/ui/themed-text";
import { Badge } from "@/components/ui/badge";
import { DetailCard, DetailField } from "@/components/ui/detail-page-layout";
import { getBadgeVariant } from "@/constants/badge-colors";
import { spacing, fontSize, fontWeight } from "@/constants/design-system";
import { formatDateTime, formatQuantity } from "@/utils";
import { BORROW_STATUS, BORROW_STATUS_LABELS } from "@/constants";
import type { Borrow } from '../../../../types';
import {
  IconCheck,
  IconX,
  IconAlertCircle,
} from "@tabler/icons-react-native";

interface BorrowDatesCardProps {
  borrow: Borrow;
}

export const BorrowDatesCard: React.FC<BorrowDatesCardProps> = ({ borrow }) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case BORROW_STATUS.ACTIVE:
        return <IconX size={14} color="white" />;
      case BORROW_STATUS.RETURNED:
        return <IconCheck size={14} color="white" />;
      case BORROW_STATUS.LOST:
        return <IconAlertCircle size={14} color="white" />;
      default:
        return null;
    }
  };

  return (
    <DetailCard
      title="Detalhes do Empréstimo"
      icon="calendar"
      badge={
        <Badge
          variant={getBadgeVariant(borrow.status, 'BORROW')}
          size="default"
        >
          <View style={styles.badgeContent}>
            {getStatusIcon(borrow.status)}
            <ThemedText style={styles.statusText}>
              {BORROW_STATUS_LABELS[borrow.status]}
            </ThemedText>
          </View>
        </Badge>
      }
    >
      {/* Quantity */}
      <DetailField
        label="Quantidade"
        value={`${formatQuantity(borrow.quantity)} ${borrow.quantity === 1 ? "unidade" : "unidades"}`}
        icon="hash"
      />

      {/* Borrow Date */}
      <DetailField
        label="Data do Empréstimo"
        value={formatDateTime(borrow.createdAt)}
        icon="calendar"
      />

      {/* Return Date */}
      {borrow.returnedAt && borrow.status === BORROW_STATUS.RETURNED && (
        <DetailField
          label="Data de Devolução"
          value={formatDateTime(borrow.returnedAt)}
          icon="check"
          iconColor="#10b981"
        />
      )}
    </DetailCard>
  );
};

const styles = StyleSheet.create({
  badgeContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  statusText: {
    fontSize: fontSize.sm,
    color: "white",
    fontWeight: fontWeight.semibold,
  },
});
