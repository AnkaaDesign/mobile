import React from "react";
import { View, StyleSheet} from "react-native";
import { Card } from "@/components/ui/card";
import { ThemedText } from "@/components/ui/themed-text";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize } from "@/constants/design-system";
import { formatCurrency } from "@/utils";
import { COMMISSION_STATUS, COMMISSION_STATUS_LABELS } from "@/constants";
// Local type definition
interface Commission {
  id: string;
  status: COMMISSION_STATUS;
  value: number;
  percentage?: number;
  user?: {
    name: string;
  };
}
import { IconCoin } from "@tabler/icons-react-native";

interface TaskCommissionsCardProps {
  commissions: Commission[];
}

export const TaskCommissionsCard: React.FC<TaskCommissionsCardProps> = ({ commissions }) => {
  const { colors } = useTheme();

  const getStatusColor = (status: COMMISSION_STATUS) => {
    switch (status) {
      case COMMISSION_STATUS.NO_COMMISSION:
        return { bg: "#fef3c7", text: "#92400e" };
      case COMMISSION_STATUS.PARTIAL_COMMISSION:
        return { bg: "#d1fae5", text: "#065f46" };
      case COMMISSION_STATUS.FULL_COMMISSION:
        return { bg: "#dbeafe", text: "#1e40af" };
      case COMMISSION_STATUS.SUSPENDED_COMMISSION:
        return { bg: "#fee2e2", text: "#991b1b" };
      default:
        return { bg: colors.muted, text: colors.mutedForeground };
    }
  };

  const totalValue = commissions.reduce((sum, c) => sum + (c.value || 0), 0);

  return (
    <Card style={styles.card}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <IconCoin size={20} color={colors.primary} />
        <ThemedText style={styles.title}>Comissões</ThemedText>
        <Badge variant="secondary" style={styles.countBadge}>
          {commissions.length}
        </Badge>
      </View>

      <View style={styles.content}>
        {commissions.map((commission, index) => {
          const statusColors = getStatusColor(commission.status);
          return (
            <View
              key={commission.id}
              style={StyleSheet.flatten([
                styles.commissionItem,
                index < commissions.length - 1 && styles.commissionItemBorder,
              ])}
            >
              <View style={styles.commissionInfo}>
                <ThemedText style={styles.userName}>
                  {commission.user?.name || "Usuário não definido"}
                </ThemedText>
                <View style={styles.commissionDetails}>
                  <ThemedText style={styles.commissionValue}>
                    {formatCurrency(commission.value)}
                  </ThemedText>
                  {commission.percentage && (
                    <ThemedText style={styles.commissionPercentage}>
                      ({commission.percentage}%)
                    </ThemedText>
                  )}
                </View>
              </View>
              <Badge
                variant="outline"
                style={StyleSheet.flatten([
                  styles.statusBadge,
                  {
                    backgroundColor: statusColors.bg,
                    borderColor: statusColors.text,
                  },
                ])}
                textStyle={{ color: statusColors.text }}
              >
                {COMMISSION_STATUS_LABELS[commission.status]}
              </Badge>
            </View>
          );
        })}

        {commissions.length > 1 && (
          <View style={StyleSheet.flatten([styles.totalRow, { borderTopColor: colors.border }])}>
            <ThemedText style={styles.totalLabel}>Total:</ThemedText>
            <ThemedText style={styles.totalValue}>
              {formatCurrency(totalValue)}
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
    gap: spacing.sm,
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: "600",
    flex: 1,
  },
  countBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  content: {
    gap: spacing.xs,
  },
  commissionItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing.sm,
  },
  commissionItemBorder: {
    borderBottomWidth: 1,
  },
  commissionInfo: {
    flex: 1,
    marginRight: spacing.sm,
  },
  userName: {
    fontSize: fontSize.md,
    fontWeight: "500",
  },
  commissionDetails: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    marginTop: 2,
  },
  commissionValue: {
    fontSize: fontSize.sm,
    fontWeight: "600",
    color: "#10b981",
  },
  commissionPercentage: {
    fontSize: fontSize.xs,
    opacity: 0.6,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
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