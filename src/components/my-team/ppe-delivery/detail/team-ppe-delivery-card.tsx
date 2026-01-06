import { View, StyleSheet } from "react-native";
import { Card } from "@/components/ui/card";
import { ThemedText } from "@/components/ui/themed-text";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize, fontWeight, borderRadius } from "@/constants/design-system";
import { IconTruck, IconCalendar, IconClock, IconUser } from "@tabler/icons-react-native";
import type { PpeDelivery } from '@/types';
import { formatDate, formatDateTime } from '@/utils';

interface TeamPpeDeliveryCardProps {
  delivery: PpeDelivery;
}

export function TeamPpeDeliveryCard({ delivery }: TeamPpeDeliveryCardProps) {
  const { colors } = useTheme();

  return (
    <Card style={styles.card}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View style={styles.headerLeft}>
          <IconTruck size={20} color={colors.mutedForeground} />
          <ThemedText style={styles.title}>Informações de Entrega</ThemedText>
        </View>
      </View>
      <View style={styles.content}>
        {/* Scheduled Date */}
        {delivery.scheduledDate && (
          <View style={[styles.fieldRow, { backgroundColor: colors.muted + "50" }]}>
            <View style={styles.fieldLabelWithIcon}>
              <IconCalendar size={16} color={colors.mutedForeground} />
              <ThemedText style={[styles.fieldLabel, { color: colors.mutedForeground }]}>
                Data Programada
              </ThemedText>
            </View>
            <ThemedText style={[styles.fieldValue, { color: colors.foreground }]}>
              {formatDate(new Date(delivery.scheduledDate))}
            </ThemedText>
          </View>
        )}

        {/* Actual Delivery Date */}
        {delivery.actualDeliveryDate && (
          <View style={[styles.fieldRow, { backgroundColor: colors.muted + "50" }]}>
            <View style={styles.fieldLabelWithIcon}>
              <IconCalendar size={16} color={colors.mutedForeground} />
              <ThemedText style={[styles.fieldLabel, { color: colors.mutedForeground }]}>
                Data de Entrega
              </ThemedText>
            </View>
            <ThemedText style={[styles.fieldValue, { color: colors.foreground }]}>
              {formatDate(new Date(delivery.actualDeliveryDate))}
            </ThemedText>
          </View>
        )}

        {/* Reviewed By */}
        {delivery.reviewedByUser && (
          <View style={[styles.fieldRow, { backgroundColor: colors.muted + "50" }]}>
            <View style={styles.fieldLabelWithIcon}>
              <IconUser size={16} color={colors.mutedForeground} />
              <ThemedText style={[styles.fieldLabel, { color: colors.mutedForeground }]}>
                Aprovado Por
              </ThemedText>
            </View>
            <ThemedText style={[styles.fieldValue, { color: colors.foreground }]}>
              {delivery.reviewedByUser.name}
            </ThemedText>
          </View>
        )}

        {/* Created At */}
        <View style={[styles.fieldRow, { backgroundColor: colors.muted + "50" }]}>
          <View style={styles.fieldLabelWithIcon}>
            <IconClock size={16} color={colors.mutedForeground} />
            <ThemedText style={[styles.fieldLabel, { color: colors.mutedForeground }]}>
              Cadastrado Em
            </ThemedText>
          </View>
          <ThemedText style={[styles.fieldValue, { color: colors.foreground }]}>
            {formatDateTime(new Date(delivery.createdAt))}
          </ThemedText>
        </View>

        {/* Reason */}
        {delivery.reason && (
          <View style={[styles.notesContainer, { backgroundColor: colors.muted + "30", borderColor: colors.border }]}>
            <ThemedText style={[styles.notesLabel, { color: colors.mutedForeground }]}>
              Motivo
            </ThemedText>
            <ThemedText style={[styles.notesText, { color: colors.foreground }]}>
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
    gap: spacing.sm,
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
  fieldValue: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    flex: 1,
    textAlign: "right",
  },
  notesContainer: {
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    marginTop: spacing.xs,
  },
  notesLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    textTransform: "uppercase",
    marginBottom: spacing.xs,
  },
  notesText: {
    fontSize: fontSize.sm,
    lineHeight: 20,
  },
});
