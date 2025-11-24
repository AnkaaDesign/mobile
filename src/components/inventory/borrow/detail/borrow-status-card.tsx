import React from "react";
import { View, StyleSheet } from "react-native";
import { Card } from "@/components/ui/card";
import { ThemedText } from "@/components/ui/themed-text";
import { Badge } from "@/components/ui/badge";
import { getBadgeVariant } from "@/constants/badge-colors";

import { useTheme } from "@/lib/theme";
import { spacing, fontSize } from "@/constants/design-system";
import { BORROW_STATUS, BORROW_STATUS_LABELS } from "@/constants";
import type { Borrow } from '../../../../types';
import {
  IconInfoCircle,
  IconCheck,
  IconX,
  IconAlertCircle,
} from "@tabler/icons-react-native";

interface BorrowStatusCardProps {
  borrow: Borrow;
}

export const BorrowStatusCard: React.FC<BorrowStatusCardProps> = ({ borrow }) => {
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

  const daysBorrowed = Math.floor(
    (new Date().getTime() - new Date(borrow.createdAt).getTime()) / (1000 * 60 * 60 * 24)
  );

  return (
    <Card style={styles.card}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View style={styles.headerLeft}>
          <IconInfoCircle size={20} color={colors.mutedForeground} />
          <ThemedText style={styles.title}>Status</ThemedText>
        </View>
      </View>

      <View style={styles.content}>
        <View style={styles.statusContainer}>
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

        {borrow.status === BORROW_STATUS.ACTIVE && (
          <View style={[styles.warningBox, { backgroundColor: daysBorrowed > 30 ? colors.destructive + '20' : colors.muted }]}>
            <ThemedText style={[
              styles.warningText,
              { color: daysBorrowed > 30 ? colors.destructive : colors.mutedForeground }
            ]}>
              Emprestado há {daysBorrowed} {daysBorrowed === 1 ? "dia" : "dias"}
            </ThemedText>
          </View>
        )}

        {borrow.status === BORROW_STATUS.LOST && (
          <View style={[styles.warningBox, { backgroundColor: colors.destructive + '20' }]}>
            <IconAlertCircle size={16} color={colors.destructive} />
            <ThemedText style={[styles.warningText, { color: colors.destructive }]}>
              Item marcado como perdido
            </ThemedText>
          </View>
        )}

        {borrow.status === BORROW_STATUS.RETURNED && (
          <View style={[styles.warningBox, { backgroundColor: '#10b981' + '20' }]}>
            <IconCheck size={16} color="#10b981" />
            <ThemedText style={[styles.warningText, { color: '#10b981' }]}>
              Item devolvido com sucesso
            </ThemedText>
          </View>
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
  statusContainer: {
    alignItems: "flex-start",
  },
  badgeContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  statusText: {
    fontSize: fontSize.sm,
    color: "white",
    fontWeight: "600",
  },
  warningBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: 8,
  },
  warningText: {
    fontSize: fontSize.sm,
    fontWeight: "500",
  },
});
