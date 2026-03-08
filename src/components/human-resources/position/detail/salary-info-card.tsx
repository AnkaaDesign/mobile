
import { View, StyleSheet } from "react-native";
import { ThemedText } from "@/components/ui/themed-text";
import { IconCurrencyDollar } from "@tabler/icons-react-native";
import type { Position } from '../../../../types';
import { formatCurrency } from "@/utils";
import { useTheme } from "@/lib/theme";
import { spacing, borderRadius, fontSize, fontWeight } from "@/constants/design-system";
import { extendedColors } from "@/lib/theme/extended-colors";
import { DetailCard } from "@/components/ui/detail-page-layout";

interface SalaryInfoCardProps {
  position: Position;
}

export function SalaryInfoCard({ position }: SalaryInfoCardProps) {
  const { colors, isDark } = useTheme();

  // Get current remuneration from remunerations relation (PositionRemuneration entities)
  const currentRemuneration = position.remunerations?.[0]?.value || position.remuneration || 0;

  // Show card only if there's remuneration data
  if (!currentRemuneration && (!position.remunerations || position.remunerations.length === 0)) {
    return null;
  }

  return (
    <DetailCard title="Remuneração" icon="currency-dollar">
      <View style={styles.salaryContent}>
        {/* Current Remuneration */}
        <View
          style={StyleSheet.flatten([
            styles.remunerationCard,
            {
              backgroundColor: isDark ? extendedColors.green[900] + "20" : extendedColors.green[50],
              borderColor: isDark ? extendedColors.green[700] : extendedColors.green[200],
            },
          ])}
        >
          <View style={styles.remunerationHeader}>
            <IconCurrencyDollar size={24} color={isDark ? extendedColors.green[400] : extendedColors.green[600]} />
            <ThemedText style={StyleSheet.flatten([styles.remunerationLabel, { color: isDark ? extendedColors.green[300] : extendedColors.green[700] }])}>
              Remuneração Atual
            </ThemedText>
          </View>
          <ThemedText style={StyleSheet.flatten([styles.remunerationValue, { color: isDark ? extendedColors.green[200] : extendedColors.green[800] }])}>
            {formatCurrency(currentRemuneration)}
          </ThemedText>
          <ThemedText style={StyleSheet.flatten([styles.remunerationSubtext, { color: isDark ? extendedColors.green[400] : extendedColors.green[600] }])}>
            Salário base mensal
          </ThemedText>
        </View>

        {/* Bonification Note */}
        {position.bonifiable && (
          <View style={StyleSheet.flatten([styles.noteContainer, { backgroundColor: colors.muted + "30" }])}>
            <ThemedText style={StyleSheet.flatten([styles.noteText, { color: colors.mutedForeground }])}>
              Este cargo é elegível para bonificações. A remuneração total pode variar de acordo com o desempenho e metas alcançadas.
            </ThemedText>
          </View>
        )}
      </View>
    </DetailCard>
  );
}

const styles = StyleSheet.create({
  salaryContent: {
    gap: spacing.lg,
  },
  remunerationCard: {
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    gap: spacing.sm,
    alignItems: "center",
  },
  remunerationHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  remunerationLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  remunerationValue: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    marginTop: spacing.xs,
  },
  remunerationSubtext: {
    fontSize: fontSize.sm,
  },
  noteContainer: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
  },
  noteText: {
    fontSize: fontSize.sm,
    lineHeight: fontSize.sm * 1.5,
    textAlign: "center",
  },
});
