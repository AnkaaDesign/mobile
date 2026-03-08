import { View, StyleSheet } from "react-native";
import { ThemedText } from "@/components/ui/themed-text";
import { Badge } from "@/components/ui/badge";
import { DetailCard, DetailField } from "@/components/ui/detail-page-layout";
import type { Borrow } from "@/types";
import { getBadgeVariant } from "@/constants/badge-colors";
import { formatQuantity } from "@/utils";
import { BORROW_STATUS_LABELS } from "@/constants/enum-labels";
import { fontSize, fontWeight } from "@/constants/design-system";

interface BorrowCardProps {
  borrow: Borrow;
}

export function BorrowCard({ borrow }: BorrowCardProps) {
  const statusVariant = getBadgeVariant(borrow.status, "BORROW");

  return (
    <DetailCard title="Informações do Empréstimo" icon="package">
      <View style={styles.content}>
        <DetailField
          label="Status"
          value={
            <Badge
              variant={statusVariant}
              textStyle={styles.badgeText}
            >
              {BORROW_STATUS_LABELS[borrow.status as keyof typeof BORROW_STATUS_LABELS]}
            </Badge>
          }
        />

        <DetailField
          label="Quantidade Emprestada"
          value={formatQuantity(borrow.quantity)}
        />
      </View>
    </DetailCard>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 16,
  },
  badgeText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
});
