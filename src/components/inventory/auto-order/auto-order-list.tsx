import { useCallback, useMemo, useState } from "react";
import {
  View,
  ScrollView,
  RefreshControl,
  StyleSheet,
  Pressable,
  ActivityIndicator,
} from "react-native";
import {
  IconRefresh,
  IconPackage,
  IconChevronDown,
  IconChevronUp,
  IconTrendingUp,
  IconTrendingDown,
  IconMinus,
  IconClock,
  IconRobot,
  IconAlertTriangle,
} from "@tabler/icons-react-native";
import { ThemedText } from "@/components/ui/themed-text";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { useTheme } from "@/lib/theme";
import {
  spacing,
  fontSize,
  fontWeight,
  borderRadius,
} from "@/constants/design-system";
import { formatCurrency, formatQuantity } from "@/utils";
import {
  useAutoOrderAnalysis,
  type AutoOrderRecommendation,
  type AutoOrderSupplierGroup,
} from "@/hooks/use-auto-order-analysis";

const URGENCY_ORDER: Record<AutoOrderRecommendation["urgency"], number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

const URGENCY_VARIANT: Record<
  AutoOrderRecommendation["urgency"],
  { variant: any; label: string; color: string }
> = {
  critical: { variant: "destructive", label: "CRÍTICO", color: "#dc2626" },
  high: { variant: "default", label: "ALTO", color: "#f97316" },
  medium: { variant: "secondary", label: "MÉDIO", color: "#eab308" },
  low: { variant: "outline", label: "BAIXO", color: "#737373" },
};

export function AutoOrderList() {
  const { colors } = useTheme();
  const { data, isLoading, isRefetching, refetch, isError } =
    useAutoOrderAnalysis({ minStockCriteria: "all" });

  const onRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  // Sort supplier groups by their most critical item, and items within groups by urgency.
  const sortedGroups = useMemo(() => {
    if (!data?.data.supplierGroups) return [] as AutoOrderSupplierGroup[];
    return [...data.data.supplierGroups]
      .map((group) => ({
        ...group,
        items: [...group.items].sort(
          (a, b) =>
            (URGENCY_ORDER[a.urgency] ?? 99) -
            (URGENCY_ORDER[b.urgency] ?? 99),
        ),
      }))
      .sort((a, b) => {
        const aMin = a.items.reduce(
          (min, it) => Math.min(min, URGENCY_ORDER[it.urgency] ?? 99),
          99,
        );
        const bMin = b.items.reduce(
          (min, it) => Math.min(min, URGENCY_ORDER[it.urgency] ?? 99),
          99,
        );
        return aMin - bMin;
      });
  }, [data]);

  if (isLoading) {
    return (
      <View
        style={[styles.center, { backgroundColor: colors.background }]}
      >
        <ActivityIndicator size="large" color={colors.primary} />
        <ThemedText
          style={[styles.loadingText, { color: colors.mutedForeground }]}
        >
          Analisando recomendações...
        </ThemedText>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.scroll, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={isRefetching}
          onRefresh={onRefresh}
          tintColor={colors.primary}
          colors={[colors.primary]}
        />
      }
    >
      {/* Header */}
      <Card style={styles.headerCard}>
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <IconRobot size={24} color={colors.primary} />
            <View style={{ flex: 1 }}>
              <ThemedText style={[styles.title, { color: colors.foreground }]}>
                Recomendações de Pedido Automático
              </ThemedText>
              <ThemedText
                style={[styles.subtitle, { color: colors.mutedForeground }]}
              >
                Análise automática baseada em consumo e tendências
              </ThemedText>
            </View>
          </View>
          <Pressable
            onPress={onRefresh}
            disabled={isRefetching}
            style={({ pressed }) => [
              styles.refreshBtn,
              {
                borderColor: colors.border,
                backgroundColor: pressed ? colors.muted : "transparent",
                opacity: isRefetching ? 0.6 : 1,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Atualizar recomendações"
          >
            <IconRefresh size={18} color={colors.foreground} />
          </Pressable>
        </View>
      </Card>

      {/* Summary */}
      {data?.data.summary && (
        <View style={styles.summaryGrid}>
          <SummaryStat
            label="Itens"
            value={String(data.data.summary.totalItems ?? 0)}
            colors={colors}
          />
          <SummaryStat
            label="Críticos"
            value={String(data.data.summary.criticalItems ?? 0)}
            valueColor="#dc2626"
            colors={colors}
          />
          <SummaryStat
            label="Custo Est."
            value={formatCurrency(data.data.summary.totalEstimatedCost ?? 0)}
            colors={colors}
          />
        </View>
      )}

      {/* Error */}
      {isError && (
        <Card style={styles.errorCard}>
          <View style={styles.errorRow}>
            <IconAlertTriangle size={18} color="#dc2626" />
            <ThemedText style={[styles.errorText, { color: colors.foreground }]}>
              Não foi possível carregar as recomendações.
            </ThemedText>
          </View>
        </Card>
      )}

      {/* Empty */}
      {!isError && sortedGroups.length === 0 && (
        <EmptyState
          title="Nenhuma recomendação no momento"
          description="Todos os itens estão com estoque adequado."
          icon="check"
        />
      )}

      {/* Supplier groups */}
      {sortedGroups.map((group) => (
        <SupplierGroup
          key={group.supplierId ?? "no-supplier"}
          group={group}
        />
      ))}
    </ScrollView>
  );
}

interface SupplierGroupProps {
  group: AutoOrderSupplierGroup;
}

function SupplierGroup({ group }: SupplierGroupProps) {
  const { colors } = useTheme();
  const [open, setOpen] = useState(true);

  const headerCount = group.itemCount;
  const headerCost = formatCurrency(group.totalEstimatedCost ?? 0);

  return (
    <Card style={styles.groupCard}>
      <Pressable
        style={[styles.groupHeader, { borderBottomColor: open ? colors.border : "transparent" }]}
        onPress={() => setOpen((v) => !v)}
        accessibilityRole="button"
      >
        <View style={styles.groupHeaderText}>
          <ThemedText
            style={[styles.groupTitle, { color: colors.foreground }]}
            numberOfLines={1}
          >
            {group.supplierName || "Sem Fornecedor"}
          </ThemedText>
          <ThemedText
            style={[styles.groupMeta, { color: colors.mutedForeground }]}
            numberOfLines={1}
          >
            {headerCount} {headerCount === 1 ? "item" : "itens"} • {headerCost}
          </ThemedText>
        </View>
        {open ? (
          <IconChevronUp size={20} color={colors.mutedForeground} />
        ) : (
          <IconChevronDown size={20} color={colors.mutedForeground} />
        )}
      </Pressable>

      {open && (
        <View style={styles.groupBody}>
          {group.items.map((item, idx) => (
            <RecommendationRow
              key={item.itemId}
              item={item}
              isLast={idx === group.items.length - 1}
            />
          ))}
        </View>
      )}
    </Card>
  );
}

interface RecommendationRowProps {
  item: AutoOrderRecommendation;
  isLast: boolean;
}

function RecommendationRow({ item, isLast }: RecommendationRowProps) {
  const { colors } = useTheme();
  const urgency = URGENCY_VARIANT[item.urgency] ?? URGENCY_VARIANT.low;

  const TrendIcon =
    item.trend === "increasing"
      ? IconTrendingUp
      : item.trend === "decreasing"
        ? IconTrendingDown
        : IconMinus;
  const trendColor =
    item.trend === "increasing"
      ? "#f97316"
      : item.trend === "decreasing"
        ? "#3b82f6"
        : colors.mutedForeground;

  return (
    <View
      style={[
        styles.itemRow,
        !isLast && { borderBottomColor: colors.border + "60", borderBottomWidth: 1 },
      ]}
    >
      <View style={styles.itemHeader}>
        <ThemedText
          style={[styles.itemName, { color: colors.foreground }]}
          numberOfLines={2}
        >
          {item.itemName}
        </ThemedText>
        <Badge variant={urgency.variant}>
          <ThemedText style={styles.badgeText}>{urgency.label}</ThemedText>
        </Badge>
      </View>

      <View style={styles.itemMetrics}>
        <Metric
          label="Estoque atual"
          value={formatQuantity(item.currentStock)}
          colors={colors}
        />
        <Metric
          label="Recomendado"
          value={formatQuantity(item.recommendedOrderQuantity)}
          icon={<IconPackage size={12} color={colors.primary} />}
          valueColor={colors.primary}
          colors={colors}
        />
        <Metric
          label="Dias até zerar"
          value={String(item.daysUntilStockout ?? "—")}
          icon={
            <IconClock
              size={12}
              color={
                item.daysUntilStockout <= 7
                  ? "#dc2626"
                  : colors.mutedForeground
              }
            />
          }
          valueColor={item.daysUntilStockout <= 7 ? "#dc2626" : colors.foreground}
          colors={colors}
        />
      </View>

      <View style={styles.itemFooter}>
        <View style={styles.trendRow}>
          <TrendIcon size={14} color={trendColor} />
          <ThemedText style={[styles.trendText, { color: trendColor }]}>
            {item.trendPercentage > 0 ? "+" : ""}
            {item.trendPercentage?.toFixed?.(0) ?? "0"}%
          </ThemedText>
        </View>
        {item.reason && (
          <ThemedText
            style={[styles.reason, { color: colors.mutedForeground }]}
            numberOfLines={2}
          >
            {item.reason}
          </ThemedText>
        )}
      </View>
    </View>
  );
}

interface MetricProps {
  label: string;
  value: string;
  icon?: React.ReactNode;
  valueColor?: string;
  colors: any;
}

function Metric({ label, value, icon, valueColor, colors }: MetricProps) {
  return (
    <View
      style={[
        styles.metric,
        { backgroundColor: colors.muted + "30" },
      ]}
    >
      <ThemedText
        style={[styles.metricLabel, { color: colors.mutedForeground }]}
        numberOfLines={1}
      >
        {label}
      </ThemedText>
      <View style={styles.metricValueRow}>
        {icon}
        <ThemedText
          style={[
            styles.metricValue,
            { color: valueColor ?? colors.foreground },
          ]}
        >
          {value}
        </ThemedText>
      </View>
    </View>
  );
}

interface SummaryStatProps {
  label: string;
  value: string;
  valueColor?: string;
  colors: any;
}

function SummaryStat({ label, value, valueColor, colors }: SummaryStatProps) {
  return (
    <View
      style={[
        styles.summaryStat,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
    >
      <ThemedText
        style={[styles.summaryLabel, { color: colors.mutedForeground }]}
        numberOfLines={1}
      >
        {label}
      </ThemedText>
      <ThemedText
        style={[
          styles.summaryValue,
          { color: valueColor ?? colors.foreground },
        ]}
        numberOfLines={1}
      >
        {value}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  content: {
    padding: spacing.md,
    gap: spacing.md,
    paddingBottom: spacing.xxl,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
  },
  loadingText: {
    fontSize: fontSize.sm,
  },
  headerCard: {
    padding: spacing.md,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  headerLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
  },
  subtitle: {
    fontSize: fontSize.xs,
    marginTop: 2,
  },
  refreshBtn: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  summaryGrid: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  summaryStat: {
    flex: 1,
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    gap: 2,
  },
  summaryLabel: {
    fontSize: fontSize.xs,
  },
  summaryValue: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
  },
  errorCard: {
    padding: spacing.md,
  },
  errorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  errorText: {
    fontSize: fontSize.sm,
    flex: 1,
  },
  groupCard: {
    overflow: "hidden",
  },
  groupHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: spacing.md,
    borderBottomWidth: 1,
  },
  groupHeaderText: {
    flex: 1,
    paddingRight: spacing.sm,
  },
  groupTitle: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
  },
  groupMeta: {
    fontSize: fontSize.xs,
    marginTop: 2,
  },
  groupBody: {
    padding: spacing.sm,
    gap: spacing.sm,
  },
  itemRow: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    gap: spacing.sm,
  },
  itemHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  itemName: {
    flex: 1,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  badgeText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: "#fff",
  },
  itemMetrics: {
    flexDirection: "row",
    gap: spacing.xs,
  },
  metric: {
    flex: 1,
    padding: spacing.xs,
    borderRadius: borderRadius.sm,
    gap: 2,
  },
  metricLabel: {
    fontSize: 10,
  },
  metricValueRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metricValue: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  itemFooter: {
    gap: 4,
  },
  trendRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  trendText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },
  reason: {
    fontSize: fontSize.xs,
    fontStyle: "italic",
  },
});
