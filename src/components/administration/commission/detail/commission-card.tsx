
import { View, StyleSheet } from "react-native";
import { Card } from "@/components/ui/card";
import { ThemedText } from "@/components/ui/themed-text";
import { Badge } from "@/components/ui/badge";
import { IconCash, IconCalendar, IconAlertCircle } from "@tabler/icons-react-native";
import type { Commission } from '../../../../types';
import { COMMISSION_STATUS_LABELS, getBadgeVariant } from '../../../../constants';
import { formatDate } from '../../../../utils';
import { useTheme } from "@/lib/theme";
import { spacing, borderRadius, fontSize, fontWeight } from "@/constants/design-system";

interface CommissionCardProps {
  commission: Commission;
}

export function CommissionCard({ commission }: CommissionCardProps) {
  const { colors } = useTheme();

  return (
    <Card style={styles.card}>
      <View style={[styles.sectionHeader, { borderBottomColor: colors.border }]}>
        <View style={styles.titleRow}>
          <View style={StyleSheet.flatten([styles.titleIcon, { backgroundColor: colors.primary + "10" }])}>
            <IconCash size={18} color={colors.primary} />
          </View>
          <ThemedText style={StyleSheet.flatten([styles.titleText, { color: colors.foreground }])}>Informações da Comissão</ThemedText>
        </View>
      </View>
      <View style={styles.content}>
        {/* Status */}
        <View style={StyleSheet.flatten([styles.infoItem, { backgroundColor: colors.muted + "30" }])}>
          <ThemedText style={StyleSheet.flatten([styles.infoLabel, { color: colors.mutedForeground }])}>Status</ThemedText>
          <Badge variant={getBadgeVariant(commission.status, "COMMISSION_STATUS")}>
            <ThemedText style={StyleSheet.flatten([styles.badgeText, { color: colors.primaryForeground }])}>
              {COMMISSION_STATUS_LABELS[commission.status]}
            </ThemedText>
          </Badge>
        </View>

        {/* Creation Date */}
        <View style={StyleSheet.flatten([styles.infoItem, { backgroundColor: colors.muted + "30" }])}>
          <View style={styles.infoLabelRow}>
            <IconCalendar size={16} color={colors.mutedForeground} />
            <ThemedText style={StyleSheet.flatten([styles.infoLabel, { color: colors.mutedForeground }])}>Data de Criação</ThemedText>
          </View>
          <ThemedText style={StyleSheet.flatten([styles.infoValue, { color: colors.foreground }])}>{formatDate(commission.createdAt)}</ThemedText>
        </View>

        {/* Last Update */}
        <View style={StyleSheet.flatten([styles.infoItem, { backgroundColor: colors.muted + "30" }])}>
          <View style={styles.infoLabelRow}>
            <IconCalendar size={16} color={colors.mutedForeground} />
            <ThemedText style={StyleSheet.flatten([styles.infoLabel, { color: colors.mutedForeground }])}>Última Atualização</ThemedText>
          </View>
          <ThemedText style={StyleSheet.flatten([styles.infoValue, { color: colors.foreground }])}>{formatDate(commission.updatedAt)}</ThemedText>
        </View>

        {/* Reason (if exists) */}
        {commission.reason && (
          <View style={StyleSheet.flatten([styles.reasonContainer, { backgroundColor: colors.muted + "20", borderColor: colors.border }])}>
            <View style={styles.reasonHeader}>
              <IconAlertCircle size={16} color={colors.mutedForeground} />
              <ThemedText style={StyleSheet.flatten([styles.reasonLabel, { color: colors.mutedForeground }])}>Observação</ThemedText>
            </View>
            <ThemedText style={StyleSheet.flatten([styles.reasonText, { color: colors.foreground }])}>{commission.reason}</ThemedText>
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
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  titleIcon: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  titleText: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
  },
  content: {
    gap: spacing.md,
  },
  infoItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
  },
  infoLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    flex: 1,
  },
  infoLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  infoValue: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    textAlign: "right",
  },
  badgeText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },
  reasonContainer: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    gap: spacing.sm,
  },
  reasonHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  reasonLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  reasonText: {
    fontSize: fontSize.sm,
    lineHeight: fontSize.sm * 1.5,
  },
});
