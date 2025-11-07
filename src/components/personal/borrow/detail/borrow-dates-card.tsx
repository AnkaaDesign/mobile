import { View, StyleSheet } from "react-native";
import { Card } from "@/components/ui/card";
import { ThemedText } from "@/components/ui/themed-text";
import { useTheme } from "@/lib/theme";
import { spacing, borderRadius, fontSize, fontWeight } from "@/constants/design-system";
import { IconCalendar, IconCalendarCheck, IconCalendarDue } from "@tabler/icons-react-native";
import type { Borrow } from "@/types";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface BorrowDatesCardProps {
  borrow: Borrow;
}

export function BorrowDatesCard({ borrow }: BorrowDatesCardProps) {
  const { colors } = useTheme();

  const formatDate = (date: Date | string | null) => {
    if (!date) return "Não definido";
    try {
      const dateObj = typeof date === "string" ? new Date(date) : date;
      return format(dateObj, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
    } catch {
      return "Data inválida";
    }
  };

  const formatDateOnly = (date: Date | string | null) => {
    if (!date) return "Não definido";
    try {
      const dateObj = typeof date === "string" ? new Date(date) : date;
      return format(dateObj, "dd/MM/yyyy", { locale: ptBR });
    } catch {
      return "Data inválida";
    }
  };

  const calculateDaysOverdue = () => {
    if (!borrow.expectedReturnDate || borrow.status !== "ACTIVE") return null;
    const expected = new Date(borrow.expectedReturnDate);
    const today = new Date();
    const diffTime = today.getTime() - expected.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : null;
  };

  const calculateDaysUntilReturn = () => {
    if (!borrow.expectedReturnDate || borrow.status !== "ACTIVE") return null;
    const expected = new Date(borrow.expectedReturnDate);
    const today = new Date();
    const diffTime = expected.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : null;
  };

  const daysOverdue = calculateDaysOverdue();
  const daysUntilReturn = calculateDaysUntilReturn();

  return (
    <Card style={styles.card}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View style={styles.headerLeft}>
          <IconCalendar size={20} color={colors.mutedForeground} />
          <ThemedText style={styles.title}>Datas</ThemedText>
        </View>
      </View>
      <View style={styles.content}>
        {/* Created Date */}
        <View style={styles.dateItem}>
          <View style={styles.dateHeader}>
            <IconCalendar size={18} color={colors.mutedForeground} />
            <ThemedText style={[styles.dateLabel, { color: colors.mutedForeground }]}>
              Data do Empréstimo
            </ThemedText>
          </View>
          <ThemedText style={[styles.dateValue, { color: colors.foreground }]}>
            {formatDate(borrow.createdAt)}
          </ThemedText>
        </View>

        {/* Expected Return Date */}
        {borrow.expectedReturnDate && (
          <View style={styles.dateItem}>
            <View style={styles.dateHeader}>
              <IconCalendarDue size={18} color={colors.mutedForeground} />
              <ThemedText style={[styles.dateLabel, { color: colors.mutedForeground }]}>
                Devolução Prevista
              </ThemedText>
            </View>
            <View style={styles.dateValueContainer}>
              <ThemedText style={[styles.dateValue, { color: colors.foreground }]}>
                {formatDateOnly(borrow.expectedReturnDate)}
              </ThemedText>
              {daysOverdue !== null && (
                <View style={styles.overdueChip}>
                  <ThemedText style={styles.overdueChipText}>
                    {daysOverdue} {daysOverdue === 1 ? "dia" : "dias"} de atraso
                  </ThemedText>
                </View>
              )}
              {daysUntilReturn !== null && (
                <View style={[styles.overdueChip, { backgroundColor: "#dbeafe" }]}>
                  <ThemedText style={[styles.overdueChipText, { color: "#1e40af" }]}>
                    {daysUntilReturn} {daysUntilReturn === 1 ? "dia" : "dias"} restantes
                  </ThemedText>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Actual Return Date */}
        {borrow.returnedAt && (
          <View style={[styles.dateItem, styles.returnedItem]}>
            <View style={styles.dateHeader}>
              <IconCalendarCheck size={18} color="#15803d" />
              <ThemedText style={[styles.dateLabel, { color: "#15803d" }]}>
                Data de Devolução
              </ThemedText>
            </View>
            <ThemedText style={[styles.dateValue, { color: colors.foreground }]}>
              {formatDate(borrow.returnedAt)}
            </ThemedText>
          </View>
        )}

        {/* Duration Info */}
        {borrow.returnedAt && borrow.createdAt && (
          <View style={[styles.durationSection, { borderTopColor: colors.border + "50" }]}>
            <ThemedText style={[styles.subsectionHeader, { color: colors.foreground }]}>
              Duração do Empréstimo
            </ThemedText>
            <ThemedText style={[styles.durationText, { color: colors.mutedForeground }]}>
              {(() => {
                const start = new Date(borrow.createdAt);
                const end = new Date(borrow.returnedAt);
                const diffTime = end.getTime() - start.getTime();
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                return `${diffDays} ${diffDays === 1 ? "dia" : "dias"}`;
              })()}
            </ThemedText>
          </View>
        )}

        {/* Last Updated */}
        {borrow.updatedAt && (
          <View style={[styles.metaInfo, { borderTopColor: colors.border + "50" }]}>
            <ThemedText style={[styles.metaLabel, { color: colors.mutedForeground }]}>
              Última atualização: {formatDate(borrow.updatedAt)}
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
    gap: spacing.lg,
  },
  dateItem: {
    gap: spacing.sm,
  },
  returnedItem: {
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
  },
  dateHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  dateLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  dateValueContainer: {
    gap: spacing.xs,
  },
  dateValue: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    marginLeft: spacing.md + spacing.sm,
  },
  overdueChip: {
    alignSelf: "flex-start",
    backgroundColor: "#fed7aa",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    marginLeft: spacing.md + spacing.sm,
  },
  overdueChipText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: "#9a3412",
  },
  durationSection: {
    paddingTop: spacing.md,
    borderTopWidth: 1,
    gap: spacing.sm,
  },
  subsectionHeader: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
  },
  durationText: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
  },
  metaInfo: {
    paddingTop: spacing.md,
    borderTopWidth: 1,
  },
  metaLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },
});
