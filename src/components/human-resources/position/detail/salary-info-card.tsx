import React from "react";
import { View, StyleSheet } from "react-native";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ThemedText } from "@/components/ui/themed-text";
import { IconCurrencyDollar } from "@tabler/icons-react-native";
import type { Position } from '../../../../types';
import { formatCurrency } from '../../../../utils';
import { useTheme } from "@/lib/theme";
import { spacing, borderRadius, fontSize, fontWeight } from "@/constants/design-system";
import { extendedColors } from "@/lib/theme/extended-colors";

interface SalaryInfoCardProps {
  position: Position;
}

export function SalaryInfoCard({ position }: SalaryInfoCardProps) {
  const { colors, isDark } = useTheme();

  // Get current remuneration (latest)
  const currentRemuneration = position.remunerations?.[0]?.value || position.remuneration || 0;

  // Show card only if there's remuneration data
  if (!currentRemuneration && (!position.remunerations || position.remunerations.length === 0)) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle style={styles.sectionTitle}>
          <View style={styles.titleRow}>
            <View style={StyleSheet.flatten([styles.titleIcon, { backgroundColor: colors.primary + "10" }])}>
              <IconCurrencyDollar size={18} color={colors.primary} />
            </View>
            <ThemedText style={StyleSheet.flatten([styles.titleText, { color: colors.foreground }])}>Remuneração</ThemedText>
          </View>
        </CardTitle>
      </CardHeader>
      <CardContent>
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
              <IconCurrencyDollar size={24} color={isDark ? extendedColors.green[400] : extendedColors.green[600 as keyof typeof green]} />
              <ThemedText style={StyleSheet.flatten([styles.remunerationLabel, { color: isDark ? extendedColors.green[300] : extendedColors.green[700 as keyof typeof green] }])}>
                Remuneração Atual
              </ThemedText>
            </View>
            <ThemedText style={StyleSheet.flatten([styles.remunerationValue, { color: isDark ? extendedColors.green[200] : extendedColors.green[800 as keyof typeof green] }])}>
              {formatCurrency(currentRemuneration)}
            </ThemedText>
            <ThemedText style={StyleSheet.flatten([styles.remunerationSubtext, { color: isDark ? extendedColors.green[400] : extendedColors.green[600 as keyof typeof green] }])}>
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
      </CardContent>
    </Card>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    flexDirection: "row",
    alignItems: "center",
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
