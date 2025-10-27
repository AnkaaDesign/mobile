import React, { useMemo } from "react";
import { View, StyleSheet } from "react-native";
import type { User } from '../../../../types';
import { formatCurrency } from '../../../../utils';
import { Card } from "@/components/ui/card";
import { ThemedText } from "@/components/ui/themed-text";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { useTheme } from "@/lib/theme";
import { spacing, borderRadius, fontSize, fontWeight } from "@/constants/design-system";
import { extendedColors } from "@/lib/theme/extended-colors";
import { IconCurrencyDollar, IconTrendingUp, IconCalendar, IconAward } from "@tabler/icons-react-native";

interface CommissionsCardProps {
  employee: User;
  maxItems?: number;
}

export function CommissionsCard({ employee, maxItems = 5 }: CommissionsCardProps) {
  const { colors, isDark } = useTheme();

  const bonuses = employee.bonuses?.slice(0, maxItems) || [];
  const totalBonuses = employee._count?.bonuses || employee.bonuses?.length || 0;

  // Calculate total earnings from bonuses
  const totalEarnings = useMemo(() => {
    if (!employee.bonuses || employee.bonuses.length === 0) return 0;
    return employee.bonuses.reduce((sum, bonus) => {
      const value = typeof bonus.baseBonus === 'number'
        ? bonus.baseBonus
        : bonus.baseBonus?.toNumber() || 0;
      return sum + value;
    }, 0);
  }, [employee.bonuses]);

  // Calculate average bonus
  const averageBonus = useMemo(() => {
    if (!employee.bonuses || employee.bonuses.length === 0) return 0;
    return totalEarnings / employee.bonuses.length;
  }, [employee.bonuses, totalEarnings]);

  // Get performance level color
  const getPerformanceColor = (level: number) => {
    if (level >= 4) return isDark ? extendedColors.green[400] : extendedColors.green[600];
    if (level >= 3) return isDark ? extendedColors.blue[400] : extendedColors.blue[600];
    if (level >= 2) return isDark ? extendedColors.yellow[400] : extendedColors.yellow[600];
    return isDark ? extendedColors.red[400] : extendedColors.red[600];
  };

  return (
    <Card style={styles.card}>
      <View style={[styles.sectionHeader, { borderBottomColor: colors.border }]}>
        <View style={styles.titleRow}>
          <View style={[styles.titleIcon, { backgroundColor: colors.primary + "10" }]}>
            <IconCurrencyDollar size={18} color={colors.primary} />
          </View>
          <ThemedText style={[styles.titleText, { color: colors.foreground }]}>
            Comissões e Bonificações
          </ThemedText>
        </View>
        {totalBonuses > 0 && (
          <Badge variant="secondary">
            {totalBonuses} {totalBonuses === 1 ? "registro" : "registros"}
          </Badge>
        )}
      </View>
      <View style={styles.content}>
        {bonuses.length === 0 ? (
          <EmptyState
            icon="currency-dollar"
            title="Nenhuma comissão registrada"
            description="Este colaborador ainda não possui comissões ou bonificações registradas."
          />
        ) : (
          <>
            {/* Summary Stats */}
            <View style={styles.summaryGrid}>
              <View style={[styles.summaryCard, { backgroundColor: extendedColors.green[100] }]}>
                <View style={[styles.summaryIcon, { backgroundColor: extendedColors.green[200] }]}>
                  <IconTrendingUp size={20} color={extendedColors.green[700]} />
                </View>
                <View style={styles.summaryInfo}>
                  <ThemedText style={[styles.summaryLabel, { color: extendedColors.green[700] }]}>
                    Total Acumulado
                  </ThemedText>
                  <ThemedText style={[styles.summaryValue, { color: extendedColors.green[800] }]}>
                    {formatCurrency(totalEarnings)}
                  </ThemedText>
                </View>
              </View>

              <View style={[styles.summaryCard, { backgroundColor: extendedColors.blue[100] }]}>
                <View style={[styles.summaryIcon, { backgroundColor: extendedColors.blue[200] }]}>
                  <IconAward size={20} color={extendedColors.blue[700]} />
                </View>
                <View style={styles.summaryInfo}>
                  <ThemedText style={[styles.summaryLabel, { color: extendedColors.blue[700] }]}>
                    Média por Mês
                  </ThemedText>
                  <ThemedText style={[styles.summaryValue, { color: extendedColors.blue[800] }]}>
                    {formatCurrency(averageBonus)}
                  </ThemedText>
                </View>
              </View>
            </View>

            {/* Recent Bonuses List */}
            <View style={styles.bonusList}>
              <ThemedText style={[styles.listHeader, { color: colors.foreground }]}>
                Histórico Recente
              </ThemedText>

              {bonuses.map((bonus, index) => {
                const monthYear = `${bonus.month.toString().padStart(2, "0")}/${bonus.year}`;
                const performanceColor = getPerformanceColor(bonus.performanceLevel);
                const bonusAmount = typeof bonus.baseBonus === 'number'
                  ? bonus.baseBonus
                  : bonus.baseBonus.toNumber();
                const ponderedCount = typeof bonus.ponderedTaskCount === 'number'
                  ? bonus.ponderedTaskCount
                  : bonus.ponderedTaskCount?.toNumber() || 0;

                return (
                  <View
                    key={bonus.id}
                    style={[
                      styles.bonusItem,
                      {
                        backgroundColor: colors.muted + "20",
                        borderColor: colors.border,
                      },
                      index < bonuses.length - 1 && styles.bonusItemWithMargin,
                    ]}
                  >
                    <View style={styles.bonusHeader}>
                      <View style={styles.bonusMonth}>
                        <IconCalendar size={16} color={colors.mutedForeground} />
                        <ThemedText style={[styles.bonusMonthText, { color: colors.foreground }]}>
                          {monthYear}
                        </ThemedText>
                      </View>
                      <ThemedText style={[styles.bonusAmount, { color: extendedColors.green[700] }]}>
                        {formatCurrency(bonusAmount)}
                      </ThemedText>
                    </View>

                    <View style={styles.bonusDetails}>
                      <View style={styles.bonusDetail}>
                        <ThemedText style={[styles.bonusDetailLabel, { color: colors.mutedForeground }]}>
                          Nível de Desempenho:
                        </ThemedText>
                        <Badge
                          variant={
                            bonus.performanceLevel >= 4 ? "success" :
                            bonus.performanceLevel >= 3 ? "info" :
                            bonus.performanceLevel >= 2 ? "warning" :
                            "destructive"
                          }
                        >
                          Nível {bonus.performanceLevel}
                        </Badge>
                      </View>

                      {ponderedCount > 0 && (
                        <View style={styles.bonusDetail}>
                          <ThemedText style={[styles.bonusDetailLabel, { color: colors.mutedForeground }]}>
                            Ordens Ponderadas:
                          </ThemedText>
                          <ThemedText style={[styles.bonusDetailValue, { color: colors.foreground }]}>
                            {ponderedCount.toFixed(2)}
                          </ThemedText>
                        </View>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          </>
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
    justifyContent: "space-between",
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
    gap: spacing.lg,
  },
  summaryGrid: {
    flexDirection: "row",
    gap: spacing.md,
  },
  summaryCard: {
    flex: 1,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  summaryIcon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  summaryInfo: {
    flex: 1,
  },
  summaryLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    marginBottom: 2,
  },
  summaryValue: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
  },
  bonusList: {
    gap: spacing.md,
  },
  listHeader: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
  },
  bonusItem: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
  },
  bonusItemWithMargin: {
    marginBottom: spacing.xs,
  },
  bonusHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  bonusMonth: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  bonusMonthText: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
  },
  bonusAmount: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
  },
  bonusDetails: {
    gap: spacing.sm,
  },
  bonusDetail: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  bonusDetailLabel: {
    fontSize: fontSize.sm,
  },
  bonusDetailValue: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
});
