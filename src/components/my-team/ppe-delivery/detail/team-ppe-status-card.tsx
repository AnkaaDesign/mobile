import { View, StyleSheet } from "react-native";
import { Card } from "@/components/ui/card";
import { ThemedText } from "@/components/ui/themed-text";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize, fontWeight, borderRadius } from "@/constants/design-system";
import { IconCircleCheck, IconAlertCircle, IconClock, IconX } from "@tabler/icons-react-native";
import type { PpeDelivery } from '@/types';
import { PPE_DELIVERY_STATUS_LABELS } from '@/constants';
import { badgeColors } from "@/lib/theme/extended-colors";

interface TeamPpeStatusCardProps {
  delivery: PpeDelivery;
}

export function TeamPpeStatusCard({ delivery }: TeamPpeStatusCardProps) {
  const { colors } = useTheme();

  const getStatusInfo = () => {
    switch (delivery.status) {
      case "PENDING":
        return {
          icon: <IconClock size={24} color={badgeColors.warning.text} />,
          label: PPE_DELIVERY_STATUS_LABELS.PENDING || "Pendente",
          color: badgeColors.warning,
          description: "Aguardando aprovação do responsável",
        };
      case "APPROVED":
        return {
          icon: <IconCircleCheck size={24} color={badgeColors.info.text} />,
          label: PPE_DELIVERY_STATUS_LABELS.APPROVED || "Aprovado",
          color: badgeColors.info,
          description: "Solicitação aprovada, aguardando entrega",
        };
      case "DELIVERED":
        return {
          icon: <IconCircleCheck size={24} color={badgeColors.success.text} />,
          label: PPE_DELIVERY_STATUS_LABELS.DELIVERED || "Entregue",
          color: badgeColors.success,
          description: "EPI entregue ao colaborador",
        };
      case "REPROVED":
        return {
          icon: <IconX size={24} color={badgeColors.error.text} />,
          label: PPE_DELIVERY_STATUS_LABELS.REPROVED || "Reprovado",
          color: badgeColors.error,
          description: "Solicitação reprovada",
        };
      case "CANCELLED":
        return {
          icon: <IconX size={24} color={badgeColors.muted.text} />,
          label: PPE_DELIVERY_STATUS_LABELS.CANCELLED || "Cancelado",
          color: badgeColors.muted,
          description: "Solicitação cancelada",
        };
      default:
        return {
          icon: <IconAlertCircle size={24} color={badgeColors.muted.text} />,
          label: delivery.status,
          color: badgeColors.muted,
          description: "Status desconhecido",
        };
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <Card style={styles.card}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View style={styles.headerLeft}>
          <IconCircleCheck size={20} color={colors.mutedForeground} />
          <ThemedText style={styles.title}>Status</ThemedText>
        </View>
      </View>
      <View style={styles.content}>
        {/* Status Badge and Info */}
        <View style={[styles.statusContainer, { backgroundColor: statusInfo.color.background, borderColor: statusInfo.color.border || statusInfo.color.background }]}>
          <View style={styles.statusHeader}>
            <View style={[styles.statusIconContainer, { backgroundColor: statusInfo.color.background }]}>
              {statusInfo.icon}
            </View>
            <View style={{ flex: 1 }}>
              <ThemedText style={[styles.statusLabel, { color: statusInfo.color.text }]}>
                {statusInfo.label}
              </ThemedText>
              <ThemedText style={[styles.statusDescription, { color: statusInfo.color.text, opacity: 0.8 }]}>
                {statusInfo.description}
              </ThemedText>
            </View>
          </View>
        </View>

        {/* Status Order (Priority) */}
        {delivery.statusOrder !== undefined && (
          <View style={[styles.fieldRow, { backgroundColor: colors.muted + "50" }]}>
            <View style={styles.fieldLabelWithIcon}>
              <IconAlertCircle size={16} color={colors.mutedForeground} />
              <ThemedText style={[styles.fieldLabel, { color: colors.mutedForeground }]}>
                Prioridade
              </ThemedText>
            </View>
            <Badge variant="secondary" size="sm">
              <ThemedText style={{ fontSize: fontSize.xs, fontWeight: fontWeight.semibold }}>
                {delivery.statusOrder}
              </ThemedText>
            </Badge>
          </View>
        )}

        {/* Review Reason (if reproved) */}
        {delivery.status === "REPROVED" && delivery.reason && (
          <View style={[styles.reasonContainer, { backgroundColor: badgeColors.error.background, borderColor: badgeColors.error.border }]}>
            <ThemedText style={[styles.reasonLabel, { color: badgeColors.error.text }]}>
              Motivo da Reprovação
            </ThemedText>
            <ThemedText style={[styles.reasonText, { color: badgeColors.error.text }]}>
              {delivery.reason}
            </ThemedText>
          </View>
        )}
      </View>
    </Card>
  );
}

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
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
  },
  statusHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  statusIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  statusLabel: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
  },
  statusDescription: {
    fontSize: fontSize.sm,
    marginTop: 2,
  },
  fieldRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
  },
  fieldLabelWithIcon: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  fieldLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  reasonContainer: {
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
  },
  reasonLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    textTransform: "uppercase",
    marginBottom: spacing.xs,
  },
  reasonText: {
    fontSize: fontSize.sm,
    lineHeight: 20,
  },
});
