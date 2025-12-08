import { View, StyleSheet } from "react-native";
import { Card } from "@/components/ui/card";
import { ThemedText } from "@/components/ui/themed-text";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize, fontWeight, borderRadius } from "@/constants/design-system";
import {
  IconPackage,
  IconUser,
  IconCalendar,
  IconCurrencyReal,
  IconNotes,
  IconArrowBack,
} from "@tabler/icons-react-native";
import type { ExternalWithdrawal } from "@/types";
import {
  EXTERNAL_WITHDRAWAL_STATUS,
  EXTERNAL_WITHDRAWAL_TYPE,
  EXTERNAL_WITHDRAWAL_TYPE_LABELS,
  EXTERNAL_WITHDRAWAL_STATUS_LABELS,
  getBadgeVariant,
} from "@/constants";
import { formatDateTime, formatCurrency } from "@/utils";

interface ExternalWithdrawalInfoCardProps {
  withdrawal: ExternalWithdrawal;
}

export function ExternalWithdrawalInfoCard({ withdrawal }: ExternalWithdrawalInfoCardProps) {
  const { colors } = useTheme();

  // Get badge variant from centralized configuration
  const statusBadgeVariant = getBadgeVariant(withdrawal.status, "EXTERNAL_WITHDRAWAL");
  const statusLabel = EXTERNAL_WITHDRAWAL_STATUS_LABELS[withdrawal.status] || withdrawal.status;

  // Calculate total price if chargeable
  const totalPrice =
    withdrawal.type === EXTERNAL_WITHDRAWAL_TYPE.CHARGEABLE
      ? withdrawal.items?.reduce(
          (sum, item) => sum + item.withdrawedQuantity * (item.price || 0),
          0
        ) || 0
      : 0;

  return (
    <Card style={styles.card}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View style={styles.headerTitleRow}>
          <IconPackage size={20} color={colors.mutedForeground} />
          <ThemedText style={styles.title}>Informações da Retirada Externa</ThemedText>
        </View>
        <Badge variant={statusBadgeVariant}>
          {statusLabel}
        </Badge>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Withdrawer Information Section */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Informações do Retirador</ThemedText>
          <View style={styles.infoRow}>
            <View style={[styles.infoItem, { backgroundColor: colors.muted + "50" }]}>
              <View style={styles.infoLeft}>
                <IconUser size={16} color={colors.mutedForeground} />
                <ThemedText style={[styles.infoLabel, { color: colors.mutedForeground }]}>
                  Nome
                </ThemedText>
              </View>
              <ThemedText style={[styles.infoValue, { color: colors.foreground }]}>
                {withdrawal.withdrawerName}
              </ThemedText>
            </View>
          </View>
        </View>

        {/* Withdrawal Details Section */}
        <View style={[styles.section, { borderTopWidth: 1, borderTopColor: colors.border + "50", paddingTop: spacing.md }]}>
          <ThemedText style={styles.sectionTitle}>Detalhes da Retirada</ThemedText>

          <View style={styles.infoRow}>
            <View style={[styles.infoItem, { backgroundColor: colors.muted + "50" }]}>
              <View style={styles.infoLeft}>
                <IconArrowBack size={16} color={colors.mutedForeground} />
                <ThemedText style={[styles.infoLabel, { color: colors.mutedForeground }]}>
                  Tipo de Retirada
                </ThemedText>
              </View>
              <Badge
                variant={
                  withdrawal.type === EXTERNAL_WITHDRAWAL_TYPE.RETURNABLE
                    ? "default"
                    : withdrawal.type === EXTERNAL_WITHDRAWAL_TYPE.CHARGEABLE
                    ? "destructive"
                    : "secondary"
                }
              >
                {EXTERNAL_WITHDRAWAL_TYPE_LABELS[withdrawal.type]}
              </Badge>
            </View>
          </View>

          {withdrawal.type === EXTERNAL_WITHDRAWAL_TYPE.CHARGEABLE && (
            <View style={styles.infoRow}>
              <View style={[styles.infoItem, { backgroundColor: colors.muted + "50" }]}>
                <View style={styles.infoLeft}>
                  <IconCurrencyReal size={16} color={colors.mutedForeground} />
                  <ThemedText style={[styles.infoLabel, { color: colors.mutedForeground }]}>
                    Valor Total
                  </ThemedText>
                </View>
                <ThemedText style={[styles.infoValue, { color: colors.foreground }]}>
                  {formatCurrency(totalPrice)}
                </ThemedText>
              </View>
            </View>
          )}

          <View style={styles.infoRow}>
            <View style={[styles.infoItem, { backgroundColor: colors.muted + "50" }]}>
              <View style={styles.infoLeft}>
                <IconCalendar size={16} color={colors.mutedForeground} />
                <ThemedText style={[styles.infoLabel, { color: colors.mutedForeground }]}>
                  Data de Criação
                </ThemedText>
              </View>
              <ThemedText style={[styles.infoValue, { color: colors.foreground }]}>
                {formatDateTime(withdrawal.createdAt)}
              </ThemedText>
            </View>
          </View>

          {withdrawal.updatedAt && withdrawal.updatedAt !== withdrawal.createdAt && (
            <View style={styles.infoRow}>
              <View style={[styles.infoItem, { backgroundColor: colors.muted + "50" }]}>
                <View style={styles.infoLeft}>
                  <IconCalendar size={16} color={colors.mutedForeground} />
                  <ThemedText style={[styles.infoLabel, { color: colors.mutedForeground }]}>
                    Última Atualização
                  </ThemedText>
                </View>
                <ThemedText style={[styles.infoValue, { color: colors.foreground }]}>
                  {formatDateTime(withdrawal.updatedAt)}
                </ThemedText>
              </View>
            </View>
          )}
        </View>


        {/* Notes Section */}
        {withdrawal.notes && (
          <View style={[styles.section, { borderTopWidth: 1, borderTopColor: colors.border + "50", paddingTop: spacing.md }]}>
            <ThemedText style={styles.sectionTitle}>Observações</ThemedText>
            <View style={[styles.notesContainer, { backgroundColor: colors.muted + "50" }]}>
              <IconNotes size={16} color={colors.mutedForeground} />
              <ThemedText style={[styles.notesText, { color: colors.foreground }]}>
                {withdrawal.notes}
              </ThemedText>
            </View>
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
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    gap: spacing.sm,
  },
  headerTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    flex: 1,
    minWidth: 200,
  },
  title: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    flexShrink: 1,
  },
  content: {
    gap: spacing.sm,
  },
  section: {
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    marginBottom: spacing.md,
  },
  infoRow: {
    marginBottom: spacing.sm,
  },
  infoItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  infoLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    flex: 1,
  },
  infoLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  infoValue: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  notesContainer: {
    flexDirection: "row",
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: borderRadius.md,
  },
  notesText: {
    fontSize: fontSize.sm,
    flex: 1,
  },
});
