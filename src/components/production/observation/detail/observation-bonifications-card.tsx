import { View, StyleSheet } from "react-native";
import { DetailCard } from "@/components/ui/detail-page-layout";
import { ThemedText } from "@/components/ui/themed-text";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize, fontWeight, borderRadius } from "@/constants/design-system";
import { IconUser } from "@tabler/icons-react-native";

interface Bonification {
  id: string;
  status: string;
  reason?: string;
  user?: {
    id: string;
    name: string;
  };
}

interface ObservationBonificationsCardProps {
  bonifications: Bonification[];
}

const BONIFICATION_STATUS_LABELS: Record<string, string> = {
  PENDING: "Pendente",
  APPROVED: "Aprovado",
  PAID: "Pago",
  SUSPENDED_BONIFICATION: "Suspenso",
  NO_BONIFICATION: "Sem Bonificação",
};

export function ObservationBonificationsCard({ bonifications }: ObservationBonificationsCardProps) {
  const { colors } = useTheme();

  const getBonificationStatusBadgeVariant = (status: string): "default" | "secondary" | "success" | "destructive" | "warning" | "outline" => {
    switch (status) {
      case "PENDING":
        return "secondary";
      case "APPROVED":
      case "PAID":
        return "success";
      case "SUSPENDED_BONIFICATION":
        return "destructive";
      case "NO_BONIFICATION":
        return "secondary";
      default:
        return "secondary";
    }
  };

  if (!bonifications || bonifications.length === 0) {
    return null;
  }

  return (
    <DetailCard
      title="Bonificações Afetadas"
      icon="currency-dollar"
      badge={<Badge variant="secondary">{bonifications.length}</Badge>}
    >
      <View style={styles.bonificationsContainer}>
        {bonifications.map((bonification) => (
          <View
            key={bonification.id}
            style={[styles.bonificationItem, { backgroundColor: colors.muted }]}
          >
            <View style={styles.bonificationHeader}>
              <View style={styles.userContainer}>
                <IconUser size={16} color={colors.mutedForeground} />
                <ThemedText style={[styles.userName, { color: colors.foreground }]}>
                  {bonification.user?.name || "Usuário"}
                </ThemedText>
              </View>
              <Badge variant={getBonificationStatusBadgeVariant(bonification.status)}>
                {BONIFICATION_STATUS_LABELS[bonification.status] || bonification.status}
              </Badge>
            </View>
            {bonification.reason && (
              <ThemedText style={[styles.bonificationReason, { color: colors.mutedForeground }]}>
                {bonification.reason}
              </ThemedText>
            )}
          </View>
        ))}
      </View>
    </DetailCard>
  );
}

const styles = StyleSheet.create({
  bonificationsContainer: {
    gap: spacing.sm,
  },
  bonificationItem: {
    borderRadius: borderRadius.md,
    padding: spacing.md,
  },
  bonificationHeader: {
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
  bonificationReason: {
    fontSize: fontSize.xs,
    marginTop: spacing.xs,
    lineHeight: fontSize.xs * 1.5,
  },
});
