import { useMemo } from "react";
import { View, StyleSheet } from "react-native";
import { Card } from "@/components/ui/card";
import { ThemedText } from "@/components/ui/themed-text";
import {
  IconChartLine,
  IconCurrencyDollar,
  IconSquareArrowUpFilled,
  IconSquareArrowDownFilled,
  IconTags,
  IconAlertTriangle,
  IconActivity,
} from "@tabler/icons-react-native";
import type { Item } from "../../../../types";
import { formatCurrency, itemUtils, determineStockLevel, getStockLevelMessage } from "@/utils";
import {
  STOCK_LEVEL,
  STOCK_LEVEL_LABELS,
  ABC_CATEGORY_LABELS,
  XYZ_CATEGORY_LABELS,
  ACTIVITY_OPERATION,
  ORDER_STATUS,
} from "@/constants";
import { useTheme } from "@/lib/theme";
import { spacing, borderRadius, fontSize, fontWeight } from "@/constants/design-system";

interface MetricsCardProps {
  item: Item;
}

export function MetricsCard({ item }: MetricsCardProps) {
  const { colors } = useTheme();

  const metrics = useMemo(() => {
    const activities = item.activities || [];
    const last30Days = new Date();
    last30Days.setDate(last30Days.getDate() - 30);

    const recentActivities = activities.filter((activity) => new Date(activity.createdAt) >= last30Days);

    const totalEntries = recentActivities
      .filter((a) => a.operation === ACTIVITY_OPERATION.INBOUND)
      .reduce((sum, a) => sum + a.quantity, 0);

    const totalExits = recentActivities
      .filter((a) => a.operation === ACTIVITY_OPERATION.OUTBOUND)
      .reduce((sum, a) => sum + Math.abs(a.quantity), 0);

    const currentPrice = item.prices && item.prices.length > 0 ? item.prices[0].value : 0;
    const stockValue = currentPrice * item.quantity;

    // Check if there's an active order (for stock level calculation)
    const hasActiveOrder =
      (item as any).orders?.some(
        (order: any) => order.status !== ORDER_STATUS.CREATED && order.status !== ORDER_STATUS.CANCELLED
      ) || false;

    // Determine stock level using the utility
    const stockLevel = determineStockLevel(
      item.quantity || 0,
      item.reorderPoint || null,
      item.maxQuantity || null,
      hasActiveOrder
    );

    const stockPercentage = item.maxQuantity ? Math.min((item.quantity / item.maxQuantity) * 100, 100) : 0;

    return {
      totalEntries,
      totalExits,
      stockValue,
      currentPrice,
      movementCount: recentActivities.length,
      stockLevel,
      stockPercentage,
      hasActiveOrder,
    };
  }, [item]);

  const getStockStatusColor = () => {
    switch (metrics.stockLevel) {
      case STOCK_LEVEL.NEGATIVE_STOCK:
      case STOCK_LEVEL.OUT_OF_STOCK:
        return "#dc2626"; // red-600
      case STOCK_LEVEL.CRITICAL:
        return "#ea580c"; // orange-600
      case STOCK_LEVEL.LOW:
        return "#ca8a04"; // yellow-600
      case STOCK_LEVEL.OPTIMAL:
        return "#16a34a"; // green-600
      case STOCK_LEVEL.OVERSTOCKED:
        return "#9333ea"; // purple-600
      default:
        return colors.mutedForeground;
    }
  };

  const getStockStatusLabel = () => {
    return STOCK_LEVEL_LABELS[metrics.stockLevel] || "Status Desconhecido";
  };

  const stockStatusColor = getStockStatusColor();

  return (
    <Card style={styles.card}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View style={styles.headerLeft}>
          <IconChartLine size={20} color={colors.mutedForeground} />
          <ThemedText style={styles.title}>Métricas e Análises</ThemedText>
        </View>
      </View>
      <View style={styles.content}>
        {/* Financial Metrics */}
        <View style={styles.section}>
          <ThemedText style={StyleSheet.flatten([styles.sectionTitle, { color: colors.foreground }])}>
            Métricas Financeiras
          </ThemedText>
          <View style={styles.metricsGrid}>
            {/* Current Price - 5/12 width */}
            <View style={StyleSheet.flatten([styles.metricCard, styles.metricCardSmall, { backgroundColor: colors.muted + "50" }])}>
              <View style={styles.metricHeader}>
                <IconCurrencyDollar size={16} color={colors.mutedForeground} />
                <ThemedText style={StyleSheet.flatten([styles.metricLabel, { color: colors.mutedForeground }])}>
                  Preço Atual
                </ThemedText>
              </View>
              <ThemedText style={StyleSheet.flatten([styles.metricValue, { color: colors.foreground }])}>
                {formatCurrency(metrics.currentPrice)}
              </ThemedText>
              <ThemedText style={StyleSheet.flatten([styles.metricSubtext, { color: colors.mutedForeground }])}>
                por unidade
              </ThemedText>
            </View>

            {/* Stock Value - 7/12 width */}
            <View style={StyleSheet.flatten([styles.metricCard, styles.metricCardLarge, { backgroundColor: colors.muted + "50" }])}>
              <View style={styles.metricHeader}>
                <IconCurrencyDollar size={16} color={colors.mutedForeground} />
                <ThemedText style={StyleSheet.flatten([styles.metricLabel, { color: colors.mutedForeground }])}>
                  Valor em Estoque
                </ThemedText>
              </View>
              <ThemedText style={StyleSheet.flatten([styles.metricValue, { color: colors.foreground }])}>
                {formatCurrency(item.totalPrice || metrics.stockValue)}
              </ThemedText>
              <ThemedText style={StyleSheet.flatten([styles.metricSubtext, { color: colors.mutedForeground }])}>
                {itemUtils.formatItemQuantity(item)} × {formatCurrency(metrics.currentPrice)}
              </ThemedText>
            </View>
          </View>
        </View>

        {/* Movement Summary */}
        <View style={[styles.section, styles.sectionBorder, { borderTopColor: colors.border + "50" }]}>
          <View style={styles.sectionTitleRow}>
            <IconActivity size={16} color={colors.mutedForeground} />
            <ThemedText style={StyleSheet.flatten([styles.sectionTitle, { color: colors.foreground }])}>
              Movimentações (30 dias)
            </ThemedText>
          </View>
          <View style={styles.movementsGrid}>
            <View style={StyleSheet.flatten([styles.movementItem, { backgroundColor: colors.muted + "30" }])}>
              <ThemedText style={StyleSheet.flatten([styles.movementLabel, { color: colors.mutedForeground }])}>
                Total
              </ThemedText>
              <ThemedText style={StyleSheet.flatten([styles.movementValue, { color: colors.foreground }])}>
                {metrics.movementCount}
              </ThemedText>
            </View>
            <View style={StyleSheet.flatten([styles.movementItem, { backgroundColor: colors.muted + "30" }])}>
              <View style={styles.movementHeader}>
                <IconSquareArrowUpFilled size={14} color="#16a34a" />
                <ThemedText style={StyleSheet.flatten([styles.movementLabel, { color: colors.mutedForeground }])}>
                  Entradas
                </ThemedText>
              </View>
              <ThemedText style={StyleSheet.flatten([styles.movementValue, { color: colors.foreground }])}>
                {metrics.totalEntries}
              </ThemedText>
            </View>
            <View style={StyleSheet.flatten([styles.movementItem, { backgroundColor: colors.muted + "30" }])}>
              <View style={styles.movementHeader}>
                <IconSquareArrowDownFilled size={14} color="#dc2626" />
                <ThemedText style={StyleSheet.flatten([styles.movementLabel, { color: colors.mutedForeground }])}>
                  Saídas
                </ThemedText>
              </View>
              <ThemedText style={StyleSheet.flatten([styles.movementValue, { color: colors.foreground }])}>
                {metrics.totalExits}
              </ThemedText>
            </View>
          </View>
        </View>

        {/* Stock Status */}
        <View style={[styles.section, styles.sectionBorder, { borderTopColor: colors.border + "50" }]}>
          <View style={styles.sectionTitleRow}>
            <IconAlertTriangle size={16} color={colors.mutedForeground} />
            <ThemedText style={StyleSheet.flatten([styles.sectionTitle, { color: colors.foreground }])}>
              Status do Estoque
            </ThemedText>
          </View>
          <View style={StyleSheet.flatten([styles.stockStatusCard, { backgroundColor: colors.muted + "30" }])}>
            <View style={styles.stockStatusHeader}>
              <View style={StyleSheet.flatten([styles.stockStatusIndicator, { backgroundColor: stockStatusColor }])} />
              <ThemedText style={StyleSheet.flatten([styles.stockStatusText, { color: stockStatusColor }])}>
                {getStockStatusLabel()}
              </ThemedText>
            </View>
            <ThemedText style={StyleSheet.flatten([styles.stockStatusDetail, { color: colors.mutedForeground }])}>
              {getStockLevelMessage(metrics.stockLevel, item.quantity || 0, item.reorderPoint || null)}
            </ThemedText>
          </View>

          {/* Stock Levels */}
          <View style={styles.stockLevelsContainer}>
            <View style={StyleSheet.flatten([styles.stockLevelRow, { backgroundColor: colors.muted + "50" }])}>
              <ThemedText style={StyleSheet.flatten([styles.stockLevelLabel, { color: colors.mutedForeground }])}>
                Quantidade Atual
              </ThemedText>
              <ThemedText style={StyleSheet.flatten([styles.stockLevelValue, { color: colors.foreground }])}>
                {item.quantity}
              </ThemedText>
            </View>
            {item.maxQuantity !== null && (
              <View style={StyleSheet.flatten([styles.stockLevelRow, { backgroundColor: colors.muted + "50" }])}>
                <ThemedText style={StyleSheet.flatten([styles.stockLevelLabel, { color: colors.mutedForeground }])}>
                  Máximo
                </ThemedText>
                <ThemedText style={StyleSheet.flatten([styles.stockLevelValue, { color: colors.foreground }])}>
                  {item.maxQuantity}
                </ThemedText>
              </View>
            )}
            {item.reorderPoint !== null && (
              <View style={StyleSheet.flatten([styles.stockLevelRow, { backgroundColor: colors.muted + "50" }])}>
                <ThemedText style={StyleSheet.flatten([styles.stockLevelLabel, { color: colors.mutedForeground }])}>
                  Ponto de Reposição
                </ThemedText>
                <ThemedText style={StyleSheet.flatten([styles.stockLevelValue, { color: colors.foreground }])}>
                  {item.reorderPoint}
                </ThemedText>
              </View>
            )}
          </View>

          {/* Visual Stock Level Indicator */}
          {item.maxQuantity !== null && (
            <View style={styles.progressContainer}>
              <View style={StyleSheet.flatten([styles.progressTrack, { backgroundColor: colors.muted + "50" }])}>
                <View
                  style={StyleSheet.flatten([
                    styles.progressBar,
                    {
                      backgroundColor: stockStatusColor,
                      width: `${Math.min(100, (item.quantity / item.maxQuantity) * 100)}%`,
                    },
                  ])}
                />
              </View>
              <View style={styles.progressLabels}>
                <ThemedText style={StyleSheet.flatten([styles.progressLabel, { color: colors.mutedForeground }])}>
                  0
                </ThemedText>
                <ThemedText style={StyleSheet.flatten([styles.progressLabel, { color: colors.mutedForeground }])}>
                  {item.maxQuantity}
                </ThemedText>
              </View>
            </View>
          )}
        </View>

        {/* ABC/XYZ Categorization */}
        {(item.abcCategory || item.xyzCategory) && (
          <View style={[styles.section, styles.sectionBorder, { borderTopColor: colors.border + "50" }]}>
            <View style={styles.sectionTitleRow}>
              <IconTags size={16} color={colors.mutedForeground} />
              <ThemedText style={StyleSheet.flatten([styles.sectionTitle, { color: colors.foreground }])}>
                Categorização ABC/XYZ
              </ThemedText>
            </View>
            <View style={styles.categorizationGrid}>
              {item.abcCategory && (
                <View style={StyleSheet.flatten([styles.categorizationCard, { backgroundColor: colors.muted + "30" }])}>
                  <View style={styles.categorizationHeader}>
                    <View style={StyleSheet.flatten([styles.categorizationIndicator, { backgroundColor: "#3b82f6" }])} />
                    <ThemedText style={StyleSheet.flatten([styles.categorizationType, { color: colors.mutedForeground }])}>
                      Análise ABC
                    </ThemedText>
                  </View>
                  <ThemedText style={StyleSheet.flatten([styles.categorizationLabel, { color: colors.foreground }])}>
                    {ABC_CATEGORY_LABELS[item.abcCategory]}
                  </ThemedText>
                </View>
              )}
              {item.xyzCategory && (
                <View style={StyleSheet.flatten([styles.categorizationCard, { backgroundColor: colors.muted + "30" }])}>
                  <View style={styles.categorizationHeader}>
                    <View style={StyleSheet.flatten([styles.categorizationIndicator, { backgroundColor: "#9333ea" }])} />
                    <ThemedText style={StyleSheet.flatten([styles.categorizationType, { color: colors.mutedForeground }])}>
                      Análise XYZ
                    </ThemedText>
                  </View>
                  <ThemedText style={StyleSheet.flatten([styles.categorizationLabel, { color: colors.foreground }])}>
                    {XYZ_CATEGORY_LABELS[item.xyzCategory]}
                  </ThemedText>
                </View>
              )}
            </View>
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
  section: {
    gap: spacing.md,
  },
  sectionBorder: {
    paddingTop: spacing.lg,
    borderTopWidth: 1,
  },
  sectionTitle: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
  },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  metricsGrid: {
    flexDirection: "row",
    gap: spacing.md,
  },
  metricCard: {
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    gap: spacing.xs,
  },
  metricCardSmall: {
    flex: 5, // 5/12
  },
  metricCardLarge: {
    flex: 7, // 7/12
  },
  metricHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  metricLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },
  metricValue: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
  },
  metricSubtext: {
    fontSize: fontSize.xs,
  },
  movementsGrid: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  movementItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    minHeight: 70,
  },
  movementHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  movementLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },
  movementValue: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
  },
  stockStatusCard: {
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    gap: spacing.sm,
  },
  stockStatusHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  stockStatusIndicator: {
    width: 10,
    height: 10,
    borderRadius: borderRadius.full,
  },
  stockStatusText: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
  },
  stockStatusDetail: {
    fontSize: fontSize.sm,
    marginLeft: spacing.sm + 10,
  },
  stockLevelsContainer: {
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  stockLevelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
  },
  stockLevelLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  stockLevelValue: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  progressContainer: {
    marginTop: spacing.md,
  },
  progressTrack: {
    height: 6,
    borderRadius: borderRadius.full,
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    borderRadius: borderRadius.full,
  },
  progressLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: spacing.xs,
  },
  progressLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },
  categorizationGrid: {
    gap: spacing.md,
  },
  categorizationCard: {
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    gap: spacing.xs,
  },
  categorizationHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  categorizationIndicator: {
    width: 10,
    height: 10,
    borderRadius: borderRadius.full,
  },
  categorizationType: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  categorizationLabel: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
    marginLeft: spacing.sm + 10,
  },
});
