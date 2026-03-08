import { View, StyleSheet } from "react-native";
import { router } from "expo-router";
import { DetailCard, DetailField } from "@/components/ui/detail-page-layout";
import { ThemedText } from "@/components/ui/themed-text";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/lib/theme";
import { spacing, borderRadius, fontSize, fontWeight } from "@/constants/design-system";
import { IconPaint, IconCurrencyDollar, IconWeight, IconFlask } from "@tabler/icons-react-native";
import type { PaintProduction } from '../../../../types';
import { PAINT_FINISH_LABELS, routes, SECTOR_PRIVILEGES } from "@/constants";
import { routeToMobilePath } from '@/utils/route-mapper';
import { formatCurrency } from "@/utils";
import { useAuth } from '@/contexts/auth-context';

interface PaintFormulaCardProps {
  production: PaintProduction;
}

export function PaintFormulaCard({ production }: PaintFormulaCardProps) {
  const { colors } = useTheme();
  const { user } = useAuth();
  const isWarehouseUser = user?.sector?.privileges === SECTOR_PRIVILEGES.WAREHOUSE;
  const formula = production.formula;
  const paint = formula?.paint;

  const handleViewFormula = () => {
    if (paint && formula) {
      router.push(routeToMobilePath(routes.painting.catalog.formulaDetails(paint.id, formula.id)) as any);
    }
  };

  return (
    <DetailCard title="Tinta e Fórmula" icon="paint">
      {paint ? (
        <>
          {/* Paint Display */}
          <View style={[styles.paintDisplay, { backgroundColor: colors.muted + "30" }]}>
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
                <ThemedText style={[styles.paintName, { color: colors.foreground }]}>
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
            <>
              <DetailField
                label="Descrição"
                icon="file-text"
                value={formula.description}
              />

              {/* Metrics Grid */}
              <View style={styles.metricsGrid}>
                {/* Price per Liter - Hidden for warehouse users */}
                {!isWarehouseUser && (
                  <View style={[styles.metricItem, { backgroundColor: colors.muted + "50" }]}>
                    <View style={styles.metricHeader}>
                      <IconCurrencyDollar size={14} color={colors.mutedForeground} />
                      <ThemedText style={[styles.metricLabel, { color: colors.mutedForeground }]} numberOfLines={1} ellipsizeMode="tail">
                        Preco/L
                      </ThemedText>
                    </View>
                    <ThemedText style={[styles.metricValue, { color: colors.foreground }]} numberOfLines={1} ellipsizeMode="tail">
                      {formatCurrency(formula.pricePerLiter)}/L
                    </ThemedText>
                  </View>
                )}

                {/* Density */}
                <View style={[styles.metricItem, { backgroundColor: colors.muted + "50" }]}>
                  <View style={styles.metricHeader}>
                    <IconWeight size={14} color={colors.mutedForeground} />
                    <ThemedText style={[styles.metricLabel, { color: colors.mutedForeground }]} numberOfLines={1} ellipsizeMode="tail">
                      Densidade
                    </ThemedText>
                  </View>
                  <ThemedText style={[styles.metricValue, { color: colors.foreground }]} numberOfLines={1} ellipsizeMode="tail">
                    {Number(formula.density).toFixed(3)} g/ml
                  </ThemedText>
                </View>

                {/* Components Count */}
                <View style={[styles.metricItem, { backgroundColor: colors.muted + "50" }]}>
                  <View style={styles.metricHeader}>
                    <IconFlask size={14} color={colors.mutedForeground} />
                    <ThemedText style={[styles.metricLabel, { color: colors.mutedForeground }]} numberOfLines={1} ellipsizeMode="tail">
                      Componentes
                    </ThemedText>
                  </View>
                  <ThemedText style={[styles.metricValue, { color: colors.foreground }]} numberOfLines={1} ellipsizeMode="tail">
                    {formula.components?.length || 0}
                  </ThemedText>
                </View>
              </View>

              <Button onPress={handleViewFormula} variant="outline">
                <ThemedText style={{ color: colors.foreground }}>Ver detalhes da formula</ThemedText>
              </Button>
            </>
          )}
        </>
      ) : (
        /* Empty State */
        <View style={styles.emptyState}>
          <View style={[styles.emptyIcon, { backgroundColor: colors.muted + "30" }]}>
            <IconPaint size={32} color={colors.mutedForeground} />
          </View>
          <ThemedText style={[styles.emptyTitle, { color: colors.foreground }]}>
            Tinta nao disponivel
          </ThemedText>
          <ThemedText style={[styles.emptyDescription, { color: colors.mutedForeground }]}>
            Esta producao nao possui informacoes de tinta associadas.
          </ThemedText>
        </View>
      )}
    </DetailCard>
  );
}

const styles = StyleSheet.create({
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
});
