import { View, StyleSheet } from "react-native";
import { router } from "expo-router";
import { Card } from "@/components/ui/card";
import { ThemedText } from "@/components/ui/themed-text";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/lib/theme";
import { spacing, borderRadius, fontSize, fontWeight } from "@/constants/design-system";
import { IconPaint, IconCurrencyDollar, IconWeight, IconFlask } from "@tabler/icons-react-native";
import type { PaintProduction } from '../../../../types';
import { PAINT_FINISH_LABELS, routes } from "@/constants";
import { routeToMobilePath } from '@/utils/route-mapper';
import { formatCurrency } from "@/utils";

interface PaintFormulaCardProps {
  production: PaintProduction;
}

export function PaintFormulaCard({ production }: PaintFormulaCardProps) {
  const { colors } = useTheme();
  const formula = production.formula;
  const paint = formula?.paint;

  const handleViewFormula = () => {
    if (paint && formula) {
      router.push(routeToMobilePath(routes.painting.catalog.formulaDetails(paint.id, formula.id)) as any);
    }
  };

  return (
    <Card style={styles.card}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View style={styles.headerLeft}>
          <IconPaint size={20} color={colors.mutedForeground} />
          <ThemedText style={styles.title}>Tinta e Fórmula</ThemedText>
        </View>
      </View>
      <View style={styles.content}>
        {paint ? (
          <View style={styles.infoContainer}>
            {/* Paint Display */}
            <View style={StyleSheet.flatten([styles.paintDisplay, { backgroundColor: colors.muted + "30" }])}>
              <View style={styles.paintInfo}>
                <View
                  style={[
                    styles.colorBox,
                    {
                      backgroundColor: paint.hex,
                      borderColor: colors.border,
                    },
                  ]}
                />
                <View style={styles.paintDetails}>
                  <ThemedText style={StyleSheet.flatten([styles.paintName, { color: colors.foreground }])}>
                    {paint.name}
                  </ThemedText>
                  <View style={styles.badgeContainer}>
                    <Badge variant="secondary">
                      <ThemedText style={{ fontSize: fontSize.xs }}>
                        {paint.paintBrand?.name || "N/A"}
                      </ThemedText>
                    </Badge>
                    <Badge variant="outline">
                      <ThemedText style={{ fontSize: fontSize.xs }}>
                        {PAINT_FINISH_LABELS[paint.finish] || paint.finish}
                      </ThemedText>
                    </Badge>
                  </View>
                </View>
              </View>
            </View>

            {/* Formula Info */}
            {formula && (
              <View style={styles.section}>
                <ThemedText style={StyleSheet.flatten([styles.subsectionHeader, { color: colors.foreground }])}>
                  Fórmula Utilizada
                </ThemedText>
                <View style={styles.fieldsContainer}>
                  <View style={StyleSheet.flatten([styles.fieldRow, { backgroundColor: colors.muted + "50" }])}>
                    <ThemedText style={StyleSheet.flatten([styles.fieldLabel, { color: colors.mutedForeground }])}>
                      Descrição
                    </ThemedText>
                    <ThemedText
                      style={StyleSheet.flatten([styles.fieldValue, { color: colors.foreground }])}
                      numberOfLines={1}
                      ellipsizeMode="tail"
                    >
                      {formula.description}
                    </ThemedText>
                  </View>

                  {/* Metrics Grid */}
                  <View style={styles.metricsGrid}>
                    {/* Price per Liter */}
                    <View style={StyleSheet.flatten([styles.metricItem, { backgroundColor: colors.muted + "50" }])}>
                      <View style={styles.metricHeader}>
                        <IconCurrencyDollar size={14} color={colors.mutedForeground} />
                        <ThemedText style={StyleSheet.flatten([styles.metricLabel, { color: colors.mutedForeground }])}>
                          Preço/L
                        </ThemedText>
                      </View>
                      <ThemedText style={StyleSheet.flatten([styles.metricValue, { color: colors.foreground }])}>
                        {formatCurrency(formula.pricePerLiter)}/L
                      </ThemedText>
                    </View>

                    {/* Density */}
                    <View style={StyleSheet.flatten([styles.metricItem, { backgroundColor: colors.muted + "50" }])}>
                      <View style={styles.metricHeader}>
                        <IconWeight size={14} color={colors.mutedForeground} />
                        <ThemedText style={StyleSheet.flatten([styles.metricLabel, { color: colors.mutedForeground }])}>
                          Densidade
                        </ThemedText>
                      </View>
                      <ThemedText style={StyleSheet.flatten([styles.metricValue, { color: colors.foreground }])}>
                        {Number(formula.density).toFixed(3)} g/ml
                      </ThemedText>
                    </View>

                    {/* Components Count */}
                    <View style={StyleSheet.flatten([styles.metricItem, { backgroundColor: colors.muted + "50" }])}>
                      <View style={styles.metricHeader}>
                        <IconFlask size={14} color={colors.mutedForeground} />
                        <ThemedText style={StyleSheet.flatten([styles.metricLabel, { color: colors.mutedForeground }])}>
                          Componentes
                        </ThemedText>
                      </View>
                      <ThemedText style={StyleSheet.flatten([styles.metricValue, { color: colors.foreground }])}>
                        {formula.components?.length || 0}
                      </ThemedText>
                    </View>
                  </View>

                  <Button onPress={handleViewFormula} variant="outline">
                    <ThemedText style={{ color: colors.foreground }}>Ver detalhes da fórmula</ThemedText>
                  </Button>
                </View>
              </View>
            )}
          </View>
        ) : (
          /* Empty State */
          <View style={styles.emptyState}>
            <View style={StyleSheet.flatten([styles.emptyIcon, { backgroundColor: colors.muted + "30" }])}>
              <IconPaint size={32} color={colors.mutedForeground} />
            </View>
            <ThemedText style={StyleSheet.flatten([styles.emptyTitle, { color: colors.foreground }])}>
              Tinta não disponível
            </ThemedText>
            <ThemedText style={StyleSheet.flatten([styles.emptyDescription, { color: colors.mutedForeground }])}>
              Esta produção não possui informações de tinta associadas.
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
  infoContainer: {
    gap: spacing.xl,
  },
  paintDisplay: {
    padding: spacing.md,
    borderRadius: borderRadius.lg,
  },
  paintInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  colorBox: {
    width: 64,
    height: 64,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
  },
  paintDetails: {
    flex: 1,
    gap: spacing.sm,
  },
  paintName: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
  },
  badgeContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  section: {
    gap: spacing.lg,
  },
  subsectionHeader: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
  },
  fieldsContainer: {
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
    flex: 1,
    textAlign: "right",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: spacing.xxl,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: borderRadius.full,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.lg,
  },
  emptyTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    marginBottom: spacing.sm,
    textAlign: "center",
  },
  emptyDescription: {
    fontSize: fontSize.sm,
    textAlign: "center",
  },
  metricsGrid: {
    flexDirection: "row",
    gap: spacing.md,
  },
  metricItem: {
    flex: 1,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    gap: spacing.sm,
  },
  metricHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  metricLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },
  metricValue: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
});
