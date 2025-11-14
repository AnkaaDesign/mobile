import { useMemo } from "react";
import { View, StyleSheet } from "react-native";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ThemedText } from "@/components/ui/themed-text";
import { IconCalendar, IconCircleCheck, IconClock, IconAlertCircle } from "@tabler/icons-react-native";
import { useTheme } from "@/lib/theme";
import { spacing, borderRadius, fontSize, fontWeight } from "@/constants/design-system";
import { calculateVacationBalance } from "@/utils";
import type { Vacation } from '../../../types';

interface MyVacationBalanceProps {
  vacations: Vacation[];
  year?: number;
}

export function MyVacationBalance({ vacations, year = new Date().getFullYear() }: MyVacationBalanceProps) {
  const { colors } = useTheme();

  const balance = useMemo(() => {
    return calculateVacationBalance(vacations, year);
  }, [vacations, year]);

  const balancePercentage = (balance.remainingDays / balance.totalDays) * 100;

  const getBalanceColor = () => {
    if (balancePercentage >= 60) return colors.success;
    if (balancePercentage >= 30) return "#f59e0b"; // Orange
    return colors.destructive;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <View style={styles.titleRow}>
            <View style={StyleSheet.flatten([styles.titleIcon, { backgroundColor: colors.primary + "20" }])}>
              <IconCalendar size={18} color={colors.primary} />
            </View>
            <ThemedText style={styles.titleText}>Saldo de Férias {year}</ThemedText>
          </View>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <View style={styles.content}>
          {/* Balance Cards */}
          <View style={styles.cardsRow}>
            {/* Total Days */}
            <View style={StyleSheet.flatten([styles.balanceCard, { backgroundColor: colors.muted + "30" }])}>
              <View style={StyleSheet.flatten([styles.cardIcon, { backgroundColor: colors.primary + "20" }])}>
                <IconCalendar size={20} color={colors.primary} />
              </View>
              <ThemedText style={styles.cardLabel}>Total</ThemedText>
              <ThemedText style={styles.cardValue}>{balance.totalDays}</ThemedText>
              <ThemedText style={styles.cardUnit}>dias</ThemedText>
            </View>

            {/* Used Days */}
            <View style={StyleSheet.flatten([styles.balanceCard, { backgroundColor: colors.muted + "30" }])}>
              <View style={StyleSheet.flatten([styles.cardIcon, { backgroundColor: colors.success + "20" }])}>
                <IconCircleCheck size={20} color={colors.success} />
              </View>
              <ThemedText style={styles.cardLabel}>Usados</ThemedText>
              <ThemedText style={styles.cardValue}>{balance.usedDays}</ThemedText>
              <ThemedText style={styles.cardUnit}>dias</ThemedText>
            </View>

            {/* Pending Days */}
            <View style={StyleSheet.flatten([styles.balanceCard, { backgroundColor: colors.muted + "30" }])}>
              <View style={StyleSheet.flatten([styles.cardIcon, { backgroundColor: "#f59e0b20" }])}>
                <IconClock size={20} color="#f59e0b" />
              </View>
              <ThemedText style={styles.cardLabel}>Pendentes</ThemedText>
              <ThemedText style={styles.cardValue}>{balance.pendingDays}</ThemedText>
              <ThemedText style={styles.cardUnit}>dias</ThemedText>
            </View>

            {/* Remaining Days */}
            <View style={StyleSheet.flatten([styles.balanceCard, { backgroundColor: colors.muted + "30" }])}>
              <View style={StyleSheet.flatten([styles.cardIcon, { backgroundColor: getBalanceColor() + "20" }])}>
                <IconAlertCircle size={20} color={getBalanceColor()} />
              </View>
              <ThemedText style={styles.cardLabel}>Disponíveis</ThemedText>
              <ThemedText style={StyleSheet.flatten([styles.cardValue, { color: getBalanceColor() }])}>
                {balance.remainingDays}
              </ThemedText>
              <ThemedText style={styles.cardUnit}>dias</ThemedText>
            </View>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressContainer}>
            <View style={styles.progressLabels}>
              <ThemedText style={styles.progressLabel}>Dias usados/agendados</ThemedText>
              <ThemedText style={styles.progressValue}>
                {balance.usedDays + balance.pendingDays} / {balance.totalDays} dias
              </ThemedText>
            </View>
            <View style={StyleSheet.flatten([styles.progressBar, { backgroundColor: colors.muted }])}>
              <View
                style={StyleSheet.flatten([
                  styles.progressFill,
                  {
                    width: `${Math.min(((balance.usedDays + balance.pendingDays) / balance.totalDays) * 100, 100)}%`,
                    backgroundColor: getBalanceColor(),
                  },
                ])}
              />
            </View>
          </View>

          {/* Warning Message */}
          {balance.remainingDays <= 5 && balance.remainingDays > 0 && (
            <View style={StyleSheet.flatten([styles.warningBox, { backgroundColor: "#f59e0b20", borderColor: "#f59e0b" }])}>
              <IconAlertCircle size={16} color="#f59e0b" />
              <ThemedText style={StyleSheet.flatten([styles.warningText, { color: "#f59e0b" }])}>
                Você tem poucos dias disponíveis. Planeje suas férias!
              </ThemedText>
            </View>
          )}

          {balance.remainingDays === 0 && (
            <View style={StyleSheet.flatten([styles.warningBox, { backgroundColor: colors.destructive + "20", borderColor: colors.destructive }])}>
              <IconAlertCircle size={16} color={colors.destructive} />
              <ThemedText style={StyleSheet.flatten([styles.warningText, { color: colors.destructive }])}>
                Você não tem mais dias disponíveis para este ano.
              </ThemedText>
            </View>
          )}
        </View>
      </CardContent>
    </Card>
  );
}

const styles = StyleSheet.create({
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
    gap: spacing.lg,
  },
  cardsRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  balanceCard: {
    flex: 1,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: "center",
    gap: spacing.xs,
  },
  cardIcon: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.full,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.xs,
  },
  cardLabel: {
    fontSize: fontSize.xs,
    opacity: 0.7,
    textAlign: "center",
  },
  cardValue: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
  },
  cardUnit: {
    fontSize: fontSize.xs,
    opacity: 0.6,
  },
  progressContainer: {
    gap: spacing.sm,
  },
  progressLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  progressLabel: {
    fontSize: fontSize.sm,
    opacity: 0.8,
  },
  progressValue: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  progressBar: {
    height: 12,
    borderRadius: borderRadius.full,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: borderRadius.full,
  },
  warningBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
  },
  warningText: {
    flex: 1,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
});
