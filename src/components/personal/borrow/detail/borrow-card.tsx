import { View, StyleSheet } from "react-native";
import { Card } from "@/components/ui/card";
import { ThemedText } from "@/components/ui/themed-text";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/lib/theme";
import { spacing, borderRadius, fontSize, fontWeight } from "@/constants/design-system";
import { IconPackage, IconAlertTriangle } from "@tabler/icons-react-native";
import type { Borrow } from "@/types";
import { getBadgeVariant, getBadgeColors } from "@/constants/badge-colors";
import { BORROW_STATUS_LABELS } from "@/constants/enum-labels";

interface BorrowCardProps {
  borrow: Borrow;
}

export function BorrowCard({ borrow }: BorrowCardProps) {
  const { colors } = useTheme();

  // Check if borrow is overdue (active and past expected return date)
  const isOverdue =
    borrow.status === "ACTIVE" &&
    borrow.expectedReturnDate &&
    new Date(borrow.expectedReturnDate) < new Date();

  const statusVariant = getBadgeVariant(borrow.status, "BORROW");
  const statusColors = getBadgeColors(statusVariant);

  return (
    <Card style={styles.card}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View style={styles.headerLeft}>
          <IconPackage size={20} color={colors.mutedForeground} />
          <ThemedText style={styles.title}>Informações do Empréstimo</ThemedText>
        </View>
      </View>
      <View style={styles.content}>
        {/* Status Badge with Overdue Indicator */}
        <View style={styles.statusContainer}>
          <ThemedText style={[styles.label, { color: colors.mutedForeground }]}>
            Status
          </ThemedText>
          <View style={styles.badgeRow}>
            <Badge
              variant={statusVariant}
              style={styles.statusBadge}
              textStyle={styles.badgeText}
            >
              {BORROW_STATUS_LABELS[borrow.status as keyof typeof BORROW_STATUS_LABELS]}
            </Badge>
            {isOverdue && (
              <View style={styles.overdueContainer}>
                <IconAlertTriangle size={16} color="#ea580c" />
                <ThemedText style={styles.overdueText}>Atrasado</ThemedText>
              </View>
            )}
          </View>
        </View>

        {/* Quantity Information */}
        <View style={styles.section}>
          <View style={[styles.fieldRow, { backgroundColor: colors.muted + "50" }]}>
            <ThemedText style={[styles.fieldLabel, { color: colors.mutedForeground }]}>
              Quantidade Emprestada
            </ThemedText>
            <ThemedText style={[styles.fieldValue, { color: colors.foreground }]}>
              {borrow.quantity}
            </ThemedText>
          </View>

          <View style={[styles.fieldRow, { backgroundColor: colors.muted + "50" }]}>
            <ThemedText style={[styles.fieldLabel, { color: colors.mutedForeground }]}>
              Quantidade Devolvida
            </ThemedText>
            <ThemedText style={[styles.fieldValue, { color: colors.foreground }]}>
              {borrow.quantityReturned}
            </ThemedText>
          </View>

          <View style={[styles.fieldRow, { backgroundColor: colors.muted + "50" }]}>
            <ThemedText style={[styles.fieldLabel, { color: colors.mutedForeground }]}>
              Quantidade Pendente
            </ThemedText>
            <ThemedText
              style={[
                styles.fieldValue,
                { color: borrow.quantity - borrow.quantityReturned > 0 ? "#ea580c" : colors.foreground },
              ]}
            >
              {borrow.quantity - borrow.quantityReturned}
            </ThemedText>
          </View>
        </View>

        {/* Notes Section */}
        {(borrow.notes || borrow.reason || borrow.conditionNotes) && (
          <View style={[styles.section, styles.notesSection, { borderTopColor: colors.border + "50" }]}>
            <ThemedText style={[styles.subsectionHeader, { color: colors.foreground }]}>
              Observações
            </ThemedText>

            {borrow.reason && (
              <View style={styles.noteItem}>
                <ThemedText style={[styles.noteLabel, { color: colors.mutedForeground }]}>
                  Motivo
                </ThemedText>
                <ThemedText style={[styles.noteValue, { color: colors.foreground }]}>
                  {borrow.reason}
                </ThemedText>
              </View>
            )}

            {borrow.notes && (
              <View style={styles.noteItem}>
                <ThemedText style={[styles.noteLabel, { color: colors.mutedForeground }]}>
                  Notas
                </ThemedText>
                <ThemedText style={[styles.noteValue, { color: colors.foreground }]}>
                  {borrow.notes}
                </ThemedText>
              </View>
            )}

            {borrow.conditionNotes && (
              <View style={styles.noteItem}>
                <ThemedText style={[styles.noteLabel, { color: colors.mutedForeground }]}>
                  Condição
                </ThemedText>
                <ThemedText style={[styles.noteValue, { color: colors.foreground }]}>
                  {borrow.conditionNotes}
                </ThemedText>
              </View>
            )}
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
    gap: spacing.xl,
  },
  statusContainer: {
    gap: spacing.sm,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  statusBadge: {
    alignSelf: "flex-start",
  },
  badgeText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  overdueContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    backgroundColor: "#fed7aa",
    borderRadius: borderRadius.full,
  },
  overdueText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: "#9a3412",
  },
  section: {
    gap: spacing.md,
  },
  fieldRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
  },
  fieldLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  fieldValue: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    textAlign: "right",
  },
  notesSection: {
    paddingTop: spacing.xl,
    borderTopWidth: 1,
  },
  subsectionHeader: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    marginBottom: spacing.sm,
  },
  noteItem: {
    gap: spacing.xs,
  },
  noteLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  noteValue: {
    fontSize: fontSize.sm,
    lineHeight: fontSize.sm * 1.5,
  },
});
