import React from "react";
import { View, StyleSheet} from "react-native";
import { DetailCard } from "@/components/ui/detail-page-layout";
import { ThemedText } from "@/components/ui/themed-text";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize } from "@/constants/design-system";
import { formatCurrency, formatPercentage } from "@/utils";
import { BONIFICATION_STATUS, BONIFICATION_STATUS_LABELS } from "@/constants";
// Local type definition
interface Bonification {
  id: string;
  status: BONIFICATION_STATUS;
  value: number;
  percentage?: number;
  user?: {
    name: string;
  };
}

interface TaskBonificationsCardProps {
  bonifications: Bonification[];
}

export const TaskBonificationsCard: React.FC<TaskBonificationsCardProps> = ({ bonifications }) => {
  const { colors } = useTheme();

  const getStatusColor = (status: BONIFICATION_STATUS) => {
    switch (status) {
      case BONIFICATION_STATUS.NO_BONIFICATION:
        return { bg: "#fef3c7", text: "#92400e" };
      case BONIFICATION_STATUS.PARTIAL_BONIFICATION:
        return { bg: "#d1fae5", text: "#065f46" };
      case BONIFICATION_STATUS.FULL_BONIFICATION:
        return { bg: "#dbeafe", text: "#1e40af" };
      case BONIFICATION_STATUS.SUSPENDED_BONIFICATION:
        return { bg: "#fee2e2", text: "#991b1b" };
      default:
        return { bg: colors.muted, text: colors.mutedForeground };
    }
  };

  const totalValue = bonifications.reduce((sum, c) => sum + (c.value || 0), 0);

  return (
    <DetailCard
      title="Bonificações"
      icon="coin"
      badge={<Badge variant="secondary">{bonifications.length}</Badge>}
    >
      <View style={styles.content}>
        {bonifications.map((bonification, index) => {
          const statusColors = getStatusColor(bonification.status);
          return (
            <View
              key={bonification.id}
              style={StyleSheet.flatten([
                styles.bonificationItem,
                index < bonifications.length - 1 && styles.bonificationItemBorder,
              ])}
            >
              <View style={styles.bonificationInfo}>
                <ThemedText style={styles.userName}>
                  {bonification.user?.name || "Usuário não definido"}
                </ThemedText>
                <View style={styles.bonificationDetails}>
                  <ThemedText style={styles.bonificationValue}>
                    {formatCurrency(bonification.value)}
                  </ThemedText>
                  {bonification.percentage && (
                    <ThemedText style={styles.bonificationPercentage}>
                      ({formatPercentage(bonification.percentage, 2)})
                    </ThemedText>
                  )}
                </View>
                <ThemedText style={[styles.statusText, { color: statusColors.text }]}>
                  Status: {BONIFICATION_STATUS_LABELS[bonification.status]}
                </ThemedText>
              </View>
            </View>
          );
        })}

        {bonifications.length > 1 && (
          <View style={StyleSheet.flatten([styles.totalRow, { borderTopColor: colors.border }])}>
            <ThemedText style={styles.totalLabel}>Total:</ThemedText>
            <ThemedText style={styles.totalValue}>
              {formatCurrency(totalValue)}
            </ThemedText>
          </View>
        )}
      </View>
    </DetailCard>
  );
};

const styles = StyleSheet.create({
  content: {
    gap: spacing.xs,
  },
  bonificationItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing.sm,
  },
  bonificationItemBorder: {
    borderBottomWidth: 1,
  },
  bonificationInfo: {
    flex: 1,
    marginRight: spacing.sm,
  },
  userName: {
    fontSize: fontSize.md,
    fontWeight: "500",
  },
  bonificationDetails: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    marginTop: 2,
  },
  bonificationValue: {
    fontSize: fontSize.sm,
    fontWeight: "600",
    color: "#10b981",
  },
  bonificationPercentage: {
    fontSize: fontSize.xs,
    opacity: 0.6,
  },
  statusText: {
    fontSize: fontSize.sm,
    marginTop: 4,
    fontWeight: "500",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  totalLabel: {
    fontSize: fontSize.md,
    fontWeight: "600",
  },
  totalValue: {
    fontSize: fontSize.lg,
    fontWeight: "700",
    color: "#10b981",
  },
});