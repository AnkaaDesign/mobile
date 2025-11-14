import { useMemo } from "react";
import { View, StyleSheet } from "react-native";
import { Card } from "@/components/ui/card";
import { ThemedText } from "@/components/ui/themed-text";

import { IconChartLine, IconCurrencyDollar, IconSquareArrowUpFilled, IconSquareArrowDownFilled, IconTags } from "@tabler/icons-react-native";
import type { Item } from '../../../../types';
import { formatCurrency, itemUtils, determineStockLevel, getStockLevelMessage } from "@/utils";
import { STOCK_LEVEL, STOCK_LEVEL_LABELS, ABC_CATEGORY_LABELS, XYZ_CATEGORY_LABELS, ACTIVITY_OPERATION, ORDER_STATUS } from "@/constants";
import { useTheme } from "@/lib/theme";
import { spacing, borderRadius, fontSize, fontWeight } from "@/constants/design-system";
import { extendedColors } from "@/lib/theme/extended-colors";

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

    const totalEntries = recentActivities.filter((a) => a.operation === ACTIVITY_OPERATION.INBOUND).reduce((sum, a) => sum + a.quantity, 0);

    const totalExits = recentActivities.filter((a) => a.operation === ACTIVITY_OPERATION.OUTBOUND).reduce((sum, a) => sum + Math.abs(a.quantity), 0);

    const currentPrice = item.prices && item.prices.length > 0 ? item.prices[0].value : 0;
    const stockValue = currentPrice * item.quantity;

    // Check if there's an active order (for stock level calculation)
    const hasActiveOrder = (item as any).orders?.some((order: any) => order.status !== ORDER_STATUS.CREATED && order.status !== ORDER_STATUS.CANCELLED) || false;

    // Determine stock level using the utility
    const stockLevel = determineStockLevel(item.quantity || 0, item.reorderPoint || null, item.maxQuantity || null, hasActiveOrder);

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
        return extendedColors.red;
      case STOCK_LEVEL.CRITICAL:
        return extendedColors.orange;
      case STOCK_LEVEL.LOW:
        return extendedColors.yellow;
      case STOCK_LEVEL.OPTIMAL:
        return extendedColors.green;
      case STOCK_LEVEL.OVERSTOCKED:
        return extendedColors.purple;
      default:
        return extendedColors.gray;
    }
  };

  const getStockStatusLabel = () => {
    return STOCK_LEVEL_LABELS[metrics.stockLevel] || "Status Desconhecido";
  };

  const stockStatusColor = getStockStatusColor();

  return (
    <Card style={styles.card}>
      <View style={[styles.sectionHeader, { borderBottomColor: colors.border }]}>
        <View style={styles.titleRow}>
          <View style={StyleSheet.flatten([styles.titleIcon, { backgroundColor: colors.primary + "10" }])}>
            <IconChartLine size={18} color={colors.primary} />
          </View>
          <ThemedText style={StyleSheet.flatten([styles.titleText, { color: colors.foreground }])}>Métricas e Análises</ThemedText>
        </View>
      </View>
      <View style={styles.content}>
        <View style={styles.metricsContent}>
          {/* Financial Metrics */}
          <View style={styles.metricsSection}>
            <ThemedText style={StyleSheet.flatten([styles.metricsSectionTitle, { color: colors.foreground }])}>Métricas Financeiras</ThemedText>
            <View style={styles.metricsGrid}>
              {/* Current Price */}
              <View
                style={StyleSheet.flatten([
                  styles.metricCard,
                  {
                    backgroundColor: extendedColors.green[50],
                    borderColor: extendedColors.green[200],
                  },
                ])}
              >
                <IconCurrencyDollar size={20} color={extendedColors.green[600]} />
                <ThemedText style={StyleSheet.flatten([styles.metricLabel, { color: extendedColors.green[700] }])}>Preço Atual</ThemedText>
                <ThemedText style={StyleSheet.flatten([styles.metricValue, { color: extendedColors.green[800] }])}>{formatCurrency(metrics.currentPrice)}</ThemedText>
                <ThemedText style={StyleSheet.flatten([styles.metricSubtext, { color: extendedColors.green[600] }])}>por unidade</ThemedText>
              </View>

              {/* Stock Value */}
              <View
                style={StyleSheet.flatten([
                  styles.metricCard,
                  {
                    backgroundColor: extendedColors.blue[50],
                    borderColor: extendedColors.blue[200],
                  },
                ])}
              >
                <IconCurrencyDollar size={20} color={extendedColors.blue[600]} />
                <ThemedText style={StyleSheet.flatten([styles.metricLabel, { color: extendedColors.blue[700] }])}>Valor em Estoque</ThemedText>
                <ThemedText style={StyleSheet.flatten([styles.metricValue, { color: extendedColors.blue[800] }])}>{formatCurrency(item.totalPrice || metrics.stockValue)}</ThemedText>
                <ThemedText style={StyleSheet.flatten([styles.metricSubtext, { color: extendedColors.blue[600] }])}>
                  {itemUtils.formatItemQuantity(item)} × {formatCurrency(metrics.currentPrice)}
                </ThemedText>
              </View>
            </View>
          </View>

          {/* Movement Summary */}
          <View
            style={StyleSheet.flatten([
              styles.metricsSection,
              {
                borderTopWidth: 1,
                borderTopColor: colors.border,
                paddingTop: spacing.lg,
              },
            ])}
          >
            <ThemedText style={StyleSheet.flatten([styles.metricsSectionTitle, { color: colors.foreground }])}>Movimentações (30 dias)</ThemedText>
            <View style={styles.stockLevels}>
              <View style={StyleSheet.flatten([styles.stockLevelItem, { backgroundColor: colors.muted + "30" }])}>
                <ThemedText style={StyleSheet.flatten([styles.stockLevelLabel, { color: colors.mutedForeground }])}>Total</ThemedText>
                <ThemedText style={StyleSheet.flatten([styles.stockLevelValue, { color: colors.foreground }])}>{metrics.movementCount}</ThemedText>
              </View>
              <View style={StyleSheet.flatten([styles.stockLevelItem, { backgroundColor: extendedColors.green[50], borderColor: extendedColors.green[200], borderWidth: 1 }])}>
                <View style={styles.stockLevelHeader}>
                  <IconSquareArrowUpFilled size={16} color={extendedColors.green[700]} />
                  <ThemedText style={StyleSheet.flatten([styles.stockLevelLabel, { color: extendedColors.green[700] }])}>Entradas</ThemedText>
                </View>
                <ThemedText style={StyleSheet.flatten([styles.stockLevelValue, { color: extendedColors.green[800] }])}>{metrics.totalEntries}</ThemedText>
              </View>
              <View style={StyleSheet.flatten([styles.stockLevelItem, { backgroundColor: extendedColors.red[50], borderColor: extendedColors.red[200], borderWidth: 1 }])}>
                <View style={styles.stockLevelHeader}>
                  <IconSquareArrowDownFilled size={16} color={extendedColors.red[700]} />
                  <ThemedText style={StyleSheet.flatten([styles.stockLevelLabel, { color: extendedColors.red[700] }])}>Saídas</ThemedText>
                </View>
                <ThemedText style={StyleSheet.flatten([styles.stockLevelValue, { color: extendedColors.red[800] }])}>{metrics.totalExits}</ThemedText>
              </View>
            </View>
          </View>

          {/* Stock Status */}
          <View
            style={StyleSheet.flatten([
              styles.metricsSection,
              {
                borderTopWidth: 1,
                borderTopColor: colors.border,
                paddingTop: spacing.lg,
              },
            ])}
          >
            <ThemedText style={StyleSheet.flatten([styles.metricsSectionTitle, { color: colors.foreground }])}>Status do Estoque</ThemedText>

            <View style={StyleSheet.flatten([styles.stockStatusCard, { backgroundColor: stockStatusColor[50] }])}>
              <View style={styles.stockStatusHeader}>
                <View style={StyleSheet.flatten([styles.stockStatusIndicator, { backgroundColor: stockStatusColor[500] }])} />
                <ThemedText style={StyleSheet.flatten([styles.stockStatusText, { color: stockStatusColor[700] }])}>{getStockStatusLabel()}</ThemedText>
              </View>

              <ThemedText style={StyleSheet.flatten([styles.stockStatusDetail, { color: stockStatusColor[600] }])}>
                {getStockLevelMessage(metrics.stockLevel, item.quantity || 0, item.reorderPoint || null)}
              </ThemedText>
            </View>
          </View>

          {/* ABC/XYZ Categorization */}
          {(item.abcCategory || item.xyzCategory) && (
            <View
              style={StyleSheet.flatten([
                styles.metricsSection,
                {
                  borderTopWidth: 1,
                  borderTopColor: colors.border,
                  paddingTop: spacing.lg,
                },
              ])}
            >
              <View style={styles.titleRow}>
                <View style={StyleSheet.flatten([styles.titleIcon, { backgroundColor: colors.primary + "10" }])}>
                  <IconTags size={18} color={colors.primary} />
                </View>
                <ThemedText style={StyleSheet.flatten([styles.metricsSectionTitle, { color: colors.foreground }])}>Categorização ABC/XYZ</ThemedText>
              </View>

              <View style={styles.categorizationGrid}>
                {item.abcCategory && (
                  <View
                    style={StyleSheet.flatten([
                      styles.categorizationCard,
                      {
                        backgroundColor: extendedColors.blue[50],
                        borderColor: extendedColors.blue[200],
                      },
                    ])}
                  >
                    <View style={styles.categorizationHeader}>
                      <View style={StyleSheet.flatten([styles.categorizationIndicator, { backgroundColor: extendedColors.blue[500] }])} />
                      <ThemedText style={StyleSheet.flatten([styles.categorizationType, { color: extendedColors.blue[700] }])}>Análise ABC</ThemedText>
                    </View>
                    <ThemedText style={StyleSheet.flatten([styles.categorizationLabel, { color: extendedColors.blue[800] }])}>{ABC_CATEGORY_LABELS[item.abcCategory]}</ThemedText>
                  </View>
                )}
                {item.xyzCategory && (
                  <View
                    style={StyleSheet.flatten([
                      styles.categorizationCard,
                      {
                        backgroundColor: extendedColors.purple[50],
                        borderColor: extendedColors.purple[200],
                      },
                    ])}
                  >
                    <View style={styles.categorizationHeader}>
                      <View style={StyleSheet.flatten([styles.categorizationIndicator, { backgroundColor: extendedColors.purple[500] }])} />
                      <ThemedText style={StyleSheet.flatten([styles.categorizationType, { color: extendedColors.purple[700] }])}>Análise XYZ</ThemedText>
                    </View>
                    <ThemedText style={StyleSheet.flatten([styles.categorizationLabel, { color: extendedColors.purple[800] }])}>{XYZ_CATEGORY_LABELS[item.xyzCategory]}</ThemedText>
                  </View>
                )}
              </View>
            </View>
          )}
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
    borderBottomWidth: 1,
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
  metricsContent: {
    gap: spacing.lg,
  },
  metricsSection: {
    gap: spacing.md,
  },
  metricsSectionTitle: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    marginBottom: spacing.sm,
  },
  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
  },
  metricCard: {
    flex: 1,
    minWidth: "47%",
    alignItems: "center",
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    gap: spacing.xs,
  },
  metricLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    textAlign: "center",
  },
  metricValue: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    marginBottom: spacing.xs,
  },
  metricSubtext: {
    fontSize: fontSize.xs,
    textAlign: "center",
  },
  stockStatusCard: {
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
  },
  stockStatusHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  stockStatusIndicator: {
    width: 12,
    height: 12,
    borderRadius: borderRadius.full,
  },
  stockStatusText: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
  },
  stockStatusDetail: {
    fontSize: fontSize.sm,
    marginLeft: spacing.lg + 12,
  },
  stockLevels: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  stockLevelItem: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.md,
    borderRadius: borderRadius.md,
    minHeight: 80,
  },
  stockLevelHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  stockLevelLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  stockLevelValue: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
  },
  categorizationGrid: {
    gap: spacing.md,
  },
  categorizationCard: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    gap: spacing.xs,
  },
  categorizationHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  categorizationIndicator: {
    width: 12,
    height: 12,
    borderRadius: borderRadius.full,
  },
  categorizationType: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  categorizationLabel: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
  },
});
