import React from "react";
import { View, StyleSheet } from "react-native";
import { Card, CardContent } from "@/components/ui/card";
import { ThemedText } from "@/components/ui/themed-text";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize, fontWeight, borderRadius } from "@/constants/design-system";
import { IconCurrencyDollar, IconUser } from "@tabler/icons-react-native";

interface Commission {
  id: string;
  status: string;
  reason?: string;
  user?: {
    id: string;
    name: string;
  };
}

interface ObservationCommissionsCardProps {
  commissions: Commission[];
}

const COMMISSION_STATUS_LABELS: Record<string, string> = {
  PENDING: "Pendente",
  APPROVED: "Aprovado",
  PAID: "Pago",
  SUSPENDED_COMMISSION: "Suspenso",
  NO_COMMISSION: "Sem Comissão",
};

export function ObservationCommissionsCard({ commissions }: ObservationCommissionsCardProps) {
  const { colors } = useTheme();

  const getCommissionStatusBadgeVariant = (status: string): "default" | "secondary" | "success" | "destructive" | "warning" | "outline" => {
    switch (status) {
      case "PENDING":
        return "secondary";
      case "APPROVED":
      case "PAID":
        return "success";
      case "SUSPENDED_COMMISSION":
        return "destructive";
      case "NO_COMMISSION":
        return "secondary";
      default:
        return "secondary";
    }
  };

  if (!commissions || commissions.length === 0) {
    return null;
  }

  return (
    <Card style={styles.card}>
      {/* Header */}
      <View style={[styles.sectionHeader, { borderBottomColor: colors.border }]}>
        <IconCurrencyDollar size={20} color={colors.primary} />
        <ThemedText style={styles.sectionTitle}>Comissões Afetadas</ThemedText>
        <Badge variant="secondary" style={{ marginLeft: spacing.sm }}>
          {commissions.length}
        </Badge>
      </View>

      <CardContent style={styles.cardContent}>
        <View style={styles.commissionsContainer}>
          {commissions.map((commission) => (
            <View
              key={commission.id}
              style={[styles.commissionItem, { backgroundColor: colors.muted }]}
            >
              <View style={styles.commissionHeader}>
                <View style={styles.userContainer}>
                  <IconUser size={16} color={colors.mutedForeground} />
                  <ThemedText style={[styles.userName, { color: colors.foreground }]}>
                    {commission.user?.name || "Usuário"}
                  </ThemedText>
                </View>
                <Badge variant={getCommissionStatusBadgeVariant(commission.status)}>
                  {COMMISSION_STATUS_LABELS[commission.status] || commission.status}
                </Badge>
              </View>
              {commission.reason && (
                <ThemedText style={[styles.commissionReason, { color: colors.mutedForeground }]}>
                  {commission.reason}
                </ThemedText>
              )}
            </View>
          ))}
        </View>
      </CardContent>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 0,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    marginLeft: spacing.sm,
    flex: 1,
  },
  cardContent: {
    padding: spacing.md,
  },
  commissionsContainer: {
    gap: spacing.sm,
  },
  commissionItem: {
    borderRadius: borderRadius.md,
    padding: spacing.md,
  },
  commissionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.xs,
  },
  userContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    flex: 1,
  },
  userName: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  commissionReason: {
    fontSize: fontSize.xs,
    marginTop: spacing.xs,
    lineHeight: fontSize.xs * 1.5,
  },
});
