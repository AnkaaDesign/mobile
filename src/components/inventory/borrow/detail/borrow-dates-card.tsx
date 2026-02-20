import React from "react";
import { View, StyleSheet } from "react-native";
import { Card } from "@/components/ui/card";
import { ThemedText } from "@/components/ui/themed-text";
import { Badge } from "@/components/ui/badge";
import { DetailField } from "@/components/ui/detail-page-layout";
import { getBadgeVariant } from "@/constants/badge-colors";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize, fontWeight } from "@/constants/design-system";
import { formatDateTime, formatQuantity } from "@/utils";
import { BORROW_STATUS, BORROW_STATUS_LABELS } from "@/constants";
import type { Borrow } from '../../../../types';
import {
  IconCalendar,
  IconCheck,
  IconX,
  IconAlertCircle,
} from "@tabler/icons-react-native";

interface BorrowDatesCardProps {
  borrow: Borrow;
}

export const BorrowDatesCard: React.FC<BorrowDatesCardProps> = ({ borrow }) => {
  const { colors } = useTheme();

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
    <Card style={styles.card}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View style={styles.headerLeft}>
          <IconCalendar size={20} color={colors.mutedForeground} />
          <ThemedText style={styles.title}>Detalhes do Empréstimo</ThemedText>
        </View>
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
      </View>

      <View style={styles.content}>
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
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: spacing.md,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: "500",
  },
  content: {
    gap: spacing.md,
  },
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
