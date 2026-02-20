import { View, StyleSheet } from "react-native";
import { Card } from "@/components/ui/card";
import { ThemedText } from "@/components/ui/themed-text";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@/components/ui/icon";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize, fontWeight, borderRadius } from "@/constants/design-system";
import type { PpeDelivery } from "@/types";
import { PPE_DELIVERY_STATUS_LABELS, PPE_DELIVERY_STATUS } from "@/constants";
import { BADGE_COLORS, ENTITY_BADGE_CONFIG } from "@/constants/badge-colors";
import { formatDate, formatQuantity } from "@/utils";

interface PpeDeliveryCardProps {
  delivery: PpeDelivery;
}

export function PpeDeliveryCard({ delivery }: PpeDeliveryCardProps) {
  const { colors } = useTheme();

  // Get badge colors from centralized configuration
  const variant = ENTITY_BADGE_CONFIG.PPE_DELIVERY[delivery.status as PPE_DELIVERY_STATUS] || "gray";
  const badgeColor = BADGE_COLORS[variant];

  return (
    <Card style={styles.card}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View style={styles.headerLeft}>
          <Icon name="package" size={20} color={colors.mutedForeground} />
          <ThemedText style={styles.title}>Informações da Entrega</ThemedText>
        </View>
      </View>

      <View style={styles.content}>
        {/* Status */}
        <View style={[styles.fieldRow, { backgroundColor: colors.muted + "50" }]}>
          <View style={styles.fieldLabelWithIcon}>
            <Icon name="info-circle" size={16} color={colors.mutedForeground} />
            <ThemedText style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Status</ThemedText>
          </View>
          <Badge
            variant="secondary"
            style={{ backgroundColor: badgeColor.bg, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs }}
          >
            <ThemedText style={{ color: badgeColor.text, fontSize: fontSize.sm, fontWeight: fontWeight.medium }}>
              {PPE_DELIVERY_STATUS_LABELS[delivery.status as PPE_DELIVERY_STATUS] || delivery.status}
            </ThemedText>
          </Badge>
        </View>

        {/* Quantity */}
        <View style={[styles.fieldRow, { backgroundColor: colors.background }]}>
          <View style={styles.fieldLabelWithIcon}>
            <Icon name="hash" size={16} color={colors.mutedForeground} />
            <ThemedText style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Quantidade</ThemedText>
          </View>
          <ThemedText style={[styles.fieldValue, { color: colors.foreground }]}>{formatQuantity(delivery.quantity || 1)}</ThemedText>
        </View>

        {/* Scheduled Date */}
        {delivery.scheduledDate && (
          <View style={[styles.fieldRow, { backgroundColor: colors.muted + "50" }]}>
            <View style={styles.fieldLabelWithIcon}>
              <Icon name="calendar" size={16} color={colors.mutedForeground} />
              <ThemedText style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Data Programada</ThemedText>
            </View>
            <ThemedText style={[styles.fieldValue, { color: colors.foreground }]}>{formatDate(new Date(delivery.scheduledDate))}</ThemedText>
          </View>
        )}

        {/* Actual Delivery Date */}
        {delivery.actualDeliveryDate && (
          <View style={[styles.fieldRow, { backgroundColor: colors.background }]}>
            <View style={styles.fieldLabelWithIcon}>
              <Icon name="calendar-check" size={16} color={colors.mutedForeground} />
              <ThemedText style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Data de Entrega</ThemedText>
            </View>
            <ThemedText style={[styles.fieldValue, { color: colors.foreground }]}>{formatDate(new Date(delivery.actualDeliveryDate))}</ThemedText>
          </View>
        )}

        {/* Reviewed By */}
        {delivery.reviewedByUser && (
          <View style={[styles.fieldRow, { backgroundColor: colors.muted + "50" }]}>
            <View style={styles.fieldLabelWithIcon}>
              <Icon name="user-check" size={16} color={colors.mutedForeground} />
              <ThemedText style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Revisado Por</ThemedText>
            </View>
            <ThemedText style={[styles.fieldValue, { color: colors.foreground }]}>{delivery.reviewedByUser.name}</ThemedText>
          </View>
        )}

        {/* Created At */}
        <View style={[styles.fieldRow, { backgroundColor: colors.background }]}>
          <View style={styles.fieldLabelWithIcon}>
            <Icon name="clock" size={16} color={colors.mutedForeground} />
            <ThemedText style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Solicitado Em</ThemedText>
          </View>
          <ThemedText style={[styles.fieldValue, { color: colors.foreground }]}>{formatDate(new Date(delivery.createdAt))}</ThemedText>
        </View>

        {/* Updated At */}
        <View style={[styles.fieldRow, { backgroundColor: colors.muted + "50" }]}>
          <View style={styles.fieldLabelWithIcon}>
            <Icon name="clock" size={16} color={colors.mutedForeground} />
            <ThemedText style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Atualizado Em</ThemedText>
          </View>
          <ThemedText style={[styles.fieldValue, { color: colors.foreground }]}>{formatDate(new Date(delivery.updatedAt))}</ThemedText>
        </View>
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
    gap: spacing.xs,
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
    gap: spacing.sm,
  },
  fieldLabel: {
    fontSize: fontSize.sm,
  },
  fieldValue: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    flex: 1,
    textAlign: "right",
  },
});
