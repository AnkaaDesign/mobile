
import { View, StyleSheet } from "react-native";
import { Card } from "@/components/ui/card";
import { ThemedText } from "@/components/ui/themed-text";
import { Badge } from "@/components/ui/badge";
import { IconCalculator, IconPercentage, IconCurrencyDollar } from "@tabler/icons-react-native";
import type { Commission } from '../../../../types';
import { COMMISSION_STATUS } from '../../../../constants';
import { formatCurrency } from '../../../../utils';
import { useTheme } from "@/lib/theme";
import { spacing, borderRadius, fontSize, fontWeight } from "@/constants/design-system";
import { extendedColors } from "@/lib/theme/extended-colors";

interface CalculationCardProps {
  commission: Commission;
}

export function CalculationCard({ commission }: CalculationCardProps) {
  const { colors, isDark } = useTheme();

  // Mock calculation data - will be replaced with actual data when available
  const baseValue = commission.task?.price || 0;
  const commissionRate = commission.user?.position?.commissionRate || 0;
  const calculatedAmount = baseValue * (commissionRate / 100);

  // Determine multipliers based on commission status
  const getMultiplier = () => {
    switch (commission.status) {
      case COMMISSION_STATUS.FULL_COMMISSION:
        return 1.0;
      case COMMISSION_STATUS.PARTIAL_COMMISSION:
        return 0.5;
      case COMMISSION_STATUS.SUSPENDED_COMMISSION:
      case COMMISSION_STATUS.NO_COMMISSION:
        return 0.0;
      default:
        return 1.0;
    }
  };

  const multiplier = getMultiplier();
  const finalAmount = calculatedAmount * multiplier;

  return (
    <Card style={styles.card}>
      <View style={[styles.sectionHeader, { borderBottomColor: colors.border }]}>
        <View style={styles.titleRow}>
          <View style={StyleSheet.flatten([styles.titleIcon, { backgroundColor: colors.primary + "10" }])}>
            <IconCalculator size={18} color={colors.primary} />
          </View>
          <ThemedText style={StyleSheet.flatten([styles.titleText, { color: colors.foreground }])}>Cálculo da Comissão</ThemedText>
        </View>
      </View>
      <View style={styles.content}>
        <View style={styles.content}>
          {/* Base Value */}
          <View style={StyleSheet.flatten([styles.calculationItem, { backgroundColor: colors.muted + "20" }])}>
            <View style={styles.calculationLabel}>
              <IconCurrencyDollar size={16} color={colors.mutedForeground} />
              <ThemedText style={StyleSheet.flatten([styles.labelText, { color: colors.mutedForeground }])}>Valor Base da Tarefa</ThemedText>
            </View>
            <ThemedText style={StyleSheet.flatten([styles.valueText, { color: colors.foreground }])}>{formatCurrency(baseValue)}</ThemedText>
          </View>

          {/* Commission Rate */}
          <View style={StyleSheet.flatten([styles.calculationItem, { backgroundColor: colors.muted + "20" }])}>
            <View style={styles.calculationLabel}>
              <IconPercentage size={16} color={colors.mutedForeground} />
              <ThemedText style={StyleSheet.flatten([styles.labelText, { color: colors.mutedForeground }])}>Taxa de Comissão</ThemedText>
            </View>
            <ThemedText style={StyleSheet.flatten([styles.valueText, { color: colors.foreground }])}>{commissionRate.toFixed(2)}%</ThemedText>
          </View>

          {/* Calculated Amount */}
          <View style={StyleSheet.flatten([styles.calculationItem, { backgroundColor: colors.muted + "20" }])}>
            <View style={styles.calculationLabel}>
              <IconCalculator size={16} color={colors.mutedForeground} />
              <ThemedText style={StyleSheet.flatten([styles.labelText, { color: colors.mutedForeground }])}>Comissão Calculada</ThemedText>
            </View>
            <ThemedText style={StyleSheet.flatten([styles.valueText, { color: colors.foreground }])}>{formatCurrency(calculatedAmount)}</ThemedText>
          </View>

          {/* Multiplier (if not full commission) */}
          {multiplier !== 1.0 && (
            <View
              style={[
                styles.multiplierContainer,
                {
                  backgroundColor: isDark ? extendedColors.yellow[900] + "20" : extendedColors.yellow[100],
                  borderColor: isDark ? extendedColors.yellow[500] : extendedColors.yellow[600],
                },
              ]}
            >
              <View style={styles.multiplierHeader}>
                <ThemedText style={[styles.multiplierLabel, { color: isDark ? extendedColors.yellow[400] : extendedColors.yellow[700] }]}>Multiplicador Aplicado</ThemedText>
                <Badge variant="warning">
                  <ThemedText style={StyleSheet.flatten([styles.badgeText, { color: colors.primaryForeground }])}>{multiplier === 0 ? "0%" : "50%"}</ThemedText>
                </Badge>
              </View>
              <ThemedText style={[styles.multiplierDescription, { color: isDark ? extendedColors.yellow[300] : extendedColors.yellow[800] }]}>
                {multiplier === 0
                  ? "Esta comissão foi suspensa ou cancelada, resultando em valor zero."
                  : "Esta é uma comissão parcial, apenas 50% do valor será pago."}
              </ThemedText>
            </View>
          )}

          {/* Final Amount */}
          <View
            style={[
              styles.finalAmountContainer,
              {
                backgroundColor: isDark ? extendedColors.green[900] + "20" : extendedColors.green[100],
                borderColor: isDark ? extendedColors.green[500] : extendedColors.green[600],
              },
            ]}
          >
            <ThemedText style={[styles.finalAmountLabel, { color: isDark ? extendedColors.green[400] : extendedColors.green[700] }]}>Valor Final a Receber</ThemedText>
            <ThemedText style={[styles.finalAmountValue, { color: isDark ? extendedColors.green[300] : extendedColors.green[800] }]}>
              {formatCurrency(finalAmount)}
            </ThemedText>
          </View>
        </View>
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
  content: {
    gap: spacing.md,
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
  calculationItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
  },
  calculationLabel: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    flex: 1,
  },
  labelText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  valueText: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
  },
  multiplierContainer: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    gap: spacing.sm,
  },
  multiplierHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  multiplierLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  multiplierDescription: {
    fontSize: fontSize.xs,
    lineHeight: fontSize.xs * 1.5,
  },
  finalAmountContainer: {
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    alignItems: "center",
    gap: spacing.xs,
  },
  finalAmountLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  finalAmountValue: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
  },
  badgeText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },
});
