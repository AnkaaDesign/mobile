import { useMemo } from "react";
import { View, StyleSheet } from "react-native";
import { ThemedText } from "@/components/ui/themed-text";
import { DetailCard, DetailField } from "@/components/ui/detail-page-layout";
import {
  IconCurrencyDollar,
  IconSquareArrowUpFilled,
  IconSquareArrowDownFilled,
  IconTags,
  IconAlertTriangle,
  IconActivity,
  IconCalculator,
  IconClock,
  IconTrendingUp,
  IconTrendingDown,
} from "@tabler/icons-react-native";
import type { Item } from "../../../../types";
import { formatCurrency, formatQuantity, itemUtils, determineStockLevel } from "@/utils";
import {
  STOCK_LEVEL,
  STOCK_LEVEL_LABELS,
  ABC_CATEGORY_LABELS,
  XYZ_CATEGORY_LABELS,
  ACTIVITY_OPERATION,
  ORDER_STATUS,
} from "@/constants";
import { useCanViewPrices } from "@/hooks";
import { useTheme } from "@/lib/theme";
import { spacing, borderRadius, fontSize, fontWeight } from "@/constants/design-system";

interface MetricsCardProps {
  item: Item;
}

const STOCK_STATUS_COLORS: Record<STOCK_LEVEL, string> = {
  [STOCK_LEVEL.NEGATIVE_STOCK]: "#737373", // neutral-500
  [STOCK_LEVEL.OUT_OF_STOCK]: "#dc2626", // red-600
  [STOCK_LEVEL.CRITICAL]: "#f97316", // orange-500
  [STOCK_LEVEL.LOW]: "#eab308", // yellow-500
  [STOCK_LEVEL.OPTIMAL]: "#16a34a", // green-600
  [STOCK_LEVEL.OVERSTOCKED]: "#9333ea", // purple-600
};

export function MetricsCard({ item }: MetricsCardProps) {
  const { colors } = useTheme();
  const canViewPrices = useCanViewPrices();

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

    // Check if item has active orders (mirrors web's metrics-card).
    const activeOrderStatuses = [
      ORDER_STATUS.CREATED,
      ORDER_STATUS.PARTIALLY_FULFILLED,
      ORDER_STATUS.FULFILLED,
      ORDER_STATUS.PARTIALLY_RECEIVED,
    ];
    const hasActiveOrder =
      item.orderItems?.some(
        (orderItem) =>
          orderItem.order && activeOrderStatuses.includes(orderItem.order.status),
      ) || false;

    // Unified stock level determination (matches stock-badge + web metrics-card).
    const stockLevel = determineStockLevel(
      item.quantity || 0,
      item.reorderPoint || null,
      item.maxQuantity || null,
      hasActiveOrder,
      item.category?.type ?? null,
    );

    // Borrowed quantity: prefer _count.borrows from include; fall back to filtering live borrows array.
    const countBorrows = (item as any)._count?.borrows as number | undefined;
    const activeBorrowsFromList =
      Array.isArray(item.borrows)
        ? item.borrows.filter((b: any) => b?.returnedAt == null).length
        : 0;
    const borrowedCount = countBorrows ?? activeBorrowsFromList;

    return {
      totalEntries,
      totalExits,
      stockValue,
      currentPrice,
      movementCount: recentActivities.length,
      stockLevel,
      hasActiveOrder,
      borrowedCount,
    };
  }, [item]);

  const stockStatusColor = STOCK_STATUS_COLORS[metrics.stockLevel] ?? colors.mutedForeground;
  const stockStatusLabel = STOCK_LEVEL_LABELS[metrics.stockLevel] ?? "Status Desconhecido";
  const trendPercent = item.monthlyConsumptionTrendPercent;

  return (
    <DetailCard title="Métricas e Análises" icon="chart-line">
      {/* Financial Metrics */}
      {canViewPrices && (
      <View style={styles.section}>
        <ThemedText style={StyleSheet.flatten([styles.sectionTitle, { color: colors.foreground }])}>
          Métricas Financeiras
        </ThemedText>
        <View style={styles.metricsGrid}>
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
      )}

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
              {stockStatusLabel}
            </ThemedText>
            {metrics.hasActiveOrder && (
              <View style={StyleSheet.flatten([styles.pendingBadge, { backgroundColor: "#3b82f6" + "20", borderColor: "#3b82f6" }])}>
                <ThemedText style={StyleSheet.flatten([styles.pendingBadgeText, { color: "#3b82f6" }])}>
                  Pedido em aberto
                </ThemedText>
              </View>
            )}
            {metrics.borrowedCount > 0 && (
              <View style={StyleSheet.flatten([styles.pendingBadge, { backgroundColor: "#9333ea" + "20", borderColor: "#9333ea" }])}>
                <ThemedText style={StyleSheet.flatten([styles.pendingBadgeText, { color: "#9333ea" }])}>
                  Emprestado: {metrics.borrowedCount}
                </ThemedText>
              </View>
            )}
          </View>
        </View>

        {/* Stock Levels */}
        <View style={styles.stockLevelsContainer}>
          <DetailField
            label="Quantidade Atual"
            value={formatQuantity(item.quantity)}
            icon="package"
          />
          {item.maxQuantity !== null && (
            <DetailField
              label="Quantidade Máxima"
              value={formatQuantity(item.maxQuantity)}
              icon="arrow-bar-to-up"
            />
          )}
          {item.reorderPoint !== null && (
            <DetailField
              label="Ponto de Reposição"
              value={formatQuantity(item.reorderPoint)}
              icon="alert-triangle"
            />
          )}
        </View>

        {/* Visual Stock Level Indicator */}
        {item.maxQuantity !== null && item.maxQuantity > 0 && (
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
                {formatQuantity(item.maxQuantity)}
              </ThemedText>
            </View>
          </View>
        )}
      </View>

      {/* Stock Calculation Breakdown */}
      <View style={[styles.section, styles.sectionBorder, { borderTopColor: colors.border + "50" }]}>
        <View style={styles.sectionTitleRow}>
          <IconCalculator size={16} color={colors.mutedForeground} />
          <ThemedText style={StyleSheet.flatten([styles.sectionTitle, { color: colors.foreground }])}>
            Cálculo de Estoque
          </ThemedText>
        </View>
        <View style={styles.breakdownGrid}>
          <BreakdownRow
            label="Consumo Mensal"
            value={`${formatQuantity(item.monthlyConsumption ?? 0)} un/mês`}
            colors={colors}
          />
          {trendPercent !== null && trendPercent !== undefined && (
            <BreakdownRow
              label="Tendência do Consumo"
              value={`${trendPercent > 0 ? "+" : ""}${trendPercent.toFixed(1)}%`}
              valueColor={trendPercent > 0 ? "#dc2626" : trendPercent < 0 ? "#16a34a" : colors.foreground}
              icon={trendPercent > 0 ? IconTrendingUp : trendPercent < 0 ? IconTrendingDown : undefined}
              colors={colors}
            />
          )}
          <BreakdownRow
            label="Prazo de Entrega"
            value={item.estimatedLeadTime !== null ? `${item.estimatedLeadTime} dias` : "—"}
            icon={IconClock}
            colors={colors}
          />
          <BreakdownRow
            label="Ponto de Reposição"
            value={item.reorderPoint !== null ? formatQuantity(item.reorderPoint) : "—"}
            colors={colors}
          />
          <BreakdownRow
            label="Quantidade Máxima"
            value={item.maxQuantity !== null ? formatQuantity(item.maxQuantity) : "—"}
            colors={colors}
          />
          <BreakdownRow
            label="Quantidade de Reposição"
            value={item.reorderQuantity !== null ? formatQuantity(item.reorderQuantity) : "—"}
            colors={colors}
          />
          <BreakdownRow
            label="Categoria ABC"
            value={item.abcCategory ? ABC_CATEGORY_LABELS[item.abcCategory] : "—"}
            colors={colors}
            isLast={!item.xyzCategory}
          />
          {item.xyzCategory && (
            <BreakdownRow
              label="Categoria XYZ"
              value={XYZ_CATEGORY_LABELS[item.xyzCategory]}
              colors={colors}
              isLast
            />
          )}
        </View>
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
    </DetailCard>
  );
}

interface BreakdownRowProps {
  label: string;
  value: string;
  valueColor?: string;
  icon?: React.ComponentType<{ size?: number; color?: string }>;
  colors: any;
  isLast?: boolean;
}

function BreakdownRow({ label, value, valueColor, icon: Icon, colors, isLast }: BreakdownRowProps) {
  return (
    <View
      style={StyleSheet.flatten([
        styles.breakdownRow,
        !isLast && { borderBottomWidth: 1, borderBottomColor: colors.border + "40" },
      ])}
    >
      <View style={styles.breakdownLabelRow}>
        {Icon && <Icon size={14} color={colors.mutedForeground} />}
        <ThemedText style={StyleSheet.flatten([styles.breakdownLabel, { color: colors.mutedForeground }])}>
          {label}
        </ThemedText>
      </View>
      <ThemedText
        style={StyleSheet.flatten([styles.breakdownValue, { color: valueColor ?? colors.foreground }])}
      >
        {value}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
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
    flex: 5,
  },
  metricCardLarge: {
    flex: 7,
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
    flexWrap: "wrap",
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
  pendingBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
    borderWidth: 1,
  },
  pendingBadgeText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },
  stockLevelsContainer: {
    gap: spacing.md,
    marginTop: spacing.sm,
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
  breakdownGrid: {
    gap: 0,
  },
  breakdownRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.sm,
  },
  breakdownLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    flex: 1,
  },
  breakdownLabel: {
    fontSize: fontSize.sm,
  },
  breakdownValue: {
    fontSize: fontSize.sm,
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
