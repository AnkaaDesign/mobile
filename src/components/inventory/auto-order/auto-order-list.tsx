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
  IconShoppingCartPlus,
} from "@tabler/icons-react-native";
import { ThemedText } from "@/components/ui/themed-text";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { NumberInput } from "@/components/ui/number-input";
import { EmptyState } from "@/components/ui/empty-state";
import { useTheme } from "@/lib/theme";
import {
  spacing,
  fontSize,
  fontWeight,
  borderRadius,
} from "@/constants/design-system";
import { formatCurrency, formatQuantity } from "@/utils";
import { useCanViewPrices } from "@/hooks";
import { ITEM_CATEGORY_TYPE, STOCK_MODEL } from "@/constants/enums";
import { ITEM_CATEGORY_TYPE_LABELS, STOCK_MODEL_LABELS } from "@/constants/enum-labels";
import {
  useAutoOrderAnalysis,
  useCreateOrdersFromAutoOrder,
  type AutoOrderRecommendation,
  type AutoOrderSupplierGroup,
  type AutoOrderCreatePayload,
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
  high: { variant: "orange", label: "ALTO", color: "#f97316" },
  medium: { variant: "secondary", label: "MÉDIO", color: "#eab308" },
  low: { variant: "outline", label: "BAIXO", color: "#737373" },
};

/** How to split the "no supplier" group into orders on creation. */
type NoSupplierStrategy = "combined" | "per-item" | "by-category";

const NO_SUPPLIER_STRATEGY_OPTIONS: { value: NoSupplierStrategy; label: string }[] = [
  { value: "combined", label: "Único" },
  { value: "per-item", label: "Por item" },
  { value: "by-category", label: "Por categoria" },
];


const groupKey = (supplierId: string | null) => supplierId || "no-supplier";

export function AutoOrderList() {
  const { colors } = useTheme();
  const canViewPrices = useCanViewPrices();
  const { data, isLoading, isRefetching, refetch, isError } =
    useAutoOrderAnalysis({ minStockCriteria: "all" });

  const { mutateAsync: createOrders, isPending: isCreating } =
    useCreateOrdersFromAutoOrder();

  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [noSupplierStrategy, setNoSupplierStrategy] =
    useState<NoSupplierStrategy>("combined");
  const [creatingKey, setCreatingKey] = useState<string | null>(null);

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

  // ---- Selection + quantity helpers ----

  const getQty = useCallback(
    (item: AutoOrderRecommendation) =>
      quantities[item.itemId] ?? item.recommendedOrderQuantity,
    [quantities],
  );

  const setItemQty = useCallback((itemId: string, value: number) => {
    setQuantities((prev) => ({ ...prev, [itemId]: value }));
  }, []);

  const toggleItem = useCallback((itemId: string) => {
    setSelectedItems((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) next.delete(itemId);
      else next.add(itemId);
      return next;
    });
  }, []);

  const toggleGroupAll = useCallback(
    (group: AutoOrderSupplierGroup, checked: boolean) => {
      setSelectedItems((prev) => {
        const next = new Set(prev);
        group.items.forEach((item) => {
          if (checked) next.add(item.itemId);
          else next.delete(item.itemId);
        });
        return next;
      });
    },
    [],
  );

  const buildOrdersForGroup = useCallback(
    (group: AutoOrderSupplierGroup): AutoOrderCreatePayload["orders"] => {
      const selected = group.items.filter((item) =>
        selectedItems.has(item.itemId),
      );
      if (selected.length === 0) return [];

      const toLine = (item: AutoOrderRecommendation) => ({
        itemId: item.itemId,
        quantity: getQty(item),
      });

      if (group.supplierId) {
        return [{ supplierId: group.supplierId, items: selected.map(toLine) }];
      }

      if (noSupplierStrategy === "per-item") {
        return selected.map((item) => ({ supplierId: null, items: [toLine(item)] }));
      }
      if (noSupplierStrategy === "by-category") {
        const byCategory = new Map<string, AutoOrderRecommendation[]>();
        selected.forEach((item) => {
          const key = item.categoryId ?? "no-category";
          const arr = byCategory.get(key) ?? [];
          arr.push(item);
          byCategory.set(key, arr);
        });
        return Array.from(byCategory.values()).map((items) => ({
          supplierId: null,
          items: items.map(toLine),
        }));
      }
      return [{ supplierId: null, items: selected.map(toLine) }];
    },
    [selectedItems, getQty, noSupplierStrategy],
  );

  const handleCreate = useCallback(
    async (orders: AutoOrderCreatePayload["orders"], key: string) => {
      if (orders.length === 0) return;
      setCreatingKey(key);
      try {
        await createOrders({ orders });
        const orderedIds = orders.flatMap((o) => o.items.map((i) => i.itemId));
        setSelectedItems((prev) => {
          const next = new Set(prev);
          orderedIds.forEach((id) => next.delete(id));
          return next;
        });
        setQuantities((prev) => {
          const next = { ...prev };
          orderedIds.forEach((id) => delete next[id]);
          return next;
        });
      } catch {
        // api-client interceptor surfaces the error toast; keep selection.
      } finally {
        setCreatingKey(null);
      }
    },
    [createOrders],
  );

  const totalSelected = selectedItems.size;

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
                Selecione itens e gere pedidos com a quantidade recomendada
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

        <Button
          variant="default"
          onPress={() =>
            handleCreate(sortedGroups.flatMap(buildOrdersForGroup), "all")
          }
          disabled={totalSelected === 0 || isCreating}
          loading={isCreating && creatingKey === "all"}
          icon={<IconShoppingCartPlus size={18} color="#fff" />}
          style={styles.createAllBtn}
        >
          {totalSelected > 0 ? `Criar pedidos (${totalSelected})` : "Criar pedidos"}
        </Button>
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
          {canViewPrices && (
            <SummaryStat
              label="Custo Est."
              value={formatCurrency(data.data.summary.totalEstimatedCost ?? 0)}
              colors={colors}
            />
          )}
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
          key={groupKey(group.supplierId)}
          group={group}
          selectedItems={selectedItems}
          getQty={getQty}
          onToggleItem={toggleItem}
          onToggleGroupAll={toggleGroupAll}
          onQtyChange={setItemQty}
          noSupplierStrategy={noSupplierStrategy}
          onStrategyChange={setNoSupplierStrategy}
          onCreate={() =>
            handleCreate(buildOrdersForGroup(group), groupKey(group.supplierId))
          }
          isCreating={isCreating}
          creatingKey={creatingKey}
        />
      ))}
    </ScrollView>
  );
}

interface SupplierGroupProps {
  group: AutoOrderSupplierGroup;
  selectedItems: Set<string>;
  getQty: (item: AutoOrderRecommendation) => number;
  onToggleItem: (itemId: string) => void;
  onToggleGroupAll: (group: AutoOrderSupplierGroup, checked: boolean) => void;
  onQtyChange: (itemId: string, value: number) => void;
  noSupplierStrategy: NoSupplierStrategy;
  onStrategyChange: (strategy: NoSupplierStrategy) => void;
  onCreate: () => void;
  isCreating: boolean;
  creatingKey: string | null;
}

function SupplierGroup({
  group,
  selectedItems,
  getQty,
  onToggleItem,
  onToggleGroupAll,
  onQtyChange,
  noSupplierStrategy,
  onStrategyChange,
  onCreate,
  isCreating,
  creatingKey,
}: SupplierGroupProps) {
  const { colors } = useTheme();
  const canViewPrices = useCanViewPrices();
  const [open, setOpen] = useState(true);

  const headerCount = group.itemCount;
  const headerCost = formatCurrency(group.totalEstimatedCost ?? 0);
  const isNoSupplier = !group.supplierId;
  const key = groupKey(group.supplierId);

  const selectedCount = group.items.filter((it) =>
    selectedItems.has(it.itemId),
  ).length;
  const allSelected = group.items.length > 0 && selectedCount === group.items.length;
  const someSelected = selectedCount > 0 && !allSelected;

  return (
    <Card style={styles.groupCard}>
      <Pressable
        style={[styles.groupHeader, { borderBottomColor: open ? colors.border : "transparent" }]}
        onPress={() => setOpen((v) => !v)}
        accessibilityRole="button"
      >
        <Checkbox
          checked={allSelected}
          indeterminate={someSelected}
          onCheckedChange={(checked) => onToggleGroupAll(group, checked)}
          accessibilityLabel="Selecionar todos do grupo"
        />
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
            {headerCount} {headerCount === 1 ? "item" : "itens"}
            {canViewPrices ? ` • ${headerCost}` : ""}
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
          {/* No-supplier split strategy */}
          {isNoSupplier && (
            <View style={styles.strategyRow}>
              <ThemedText
                style={[styles.strategyLabel, { color: colors.mutedForeground }]}
              >
                Criar como:
              </ThemedText>
              <View style={styles.strategyChips}>
                {NO_SUPPLIER_STRATEGY_OPTIONS.map((opt) => {
                  const active = noSupplierStrategy === opt.value;
                  return (
                    <Pressable
                      key={opt.value}
                      onPress={() => onStrategyChange(opt.value)}
                      style={[
                        styles.strategyChip,
                        {
                          borderColor: active ? colors.primary : colors.border,
                          backgroundColor: active ? colors.primary + "20" : "transparent",
                        },
                      ]}
                      accessibilityRole="button"
                    >
                      <ThemedText
                        style={[
                          styles.strategyChipText,
                          { color: active ? colors.primary : colors.mutedForeground },
                        ]}
                      >
                        {opt.label}
                      </ThemedText>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          )}

          {group.items.map((item, idx) => (
            <RecommendationRow
              key={item.itemId}
              item={item}
              isLast={idx === group.items.length - 1}
              selected={selectedItems.has(item.itemId)}
              qty={getQty(item)}
              onToggle={() => onToggleItem(item.itemId)}
              onQtyChange={(v) => onQtyChange(item.itemId, v)}
            />
          ))}

          <Button
            variant="default"
            size="sm"
            onPress={onCreate}
            disabled={selectedCount === 0 || isCreating}
            loading={isCreating && creatingKey === key}
            icon={<IconShoppingCartPlus size={16} color="#fff" />}
            style={styles.groupCreateBtn}
          >
            {selectedCount > 0 ? `Criar pedido (${selectedCount})` : "Criar pedido"}
          </Button>
        </View>
      )}
    </Card>
  );
}

interface RecommendationRowProps {
  item: AutoOrderRecommendation;
  isLast: boolean;
  selected: boolean;
  qty: number;
  onToggle: () => void;
  onQtyChange: (value: number) => void;
}

function RecommendationRow({
  item,
  isLast,
  selected,
  qty,
  onToggle,
  onQtyChange,
}: RecommendationRowProps) {
  const { colors } = useTheme();
  const urgency = URGENCY_VARIANT[item.urgency] ?? URGENCY_VARIANT.low;
  // Capability-fields contract: tool badge keys on the item's stock model,
  // not on category.type (which is display/grouping only).
  const isTool = item.stockModel === "FIXED_TARGET";

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
        selected && { backgroundColor: colors.primary + "10", borderRadius: borderRadius.sm },
        !isLast && { borderBottomColor: colors.border + "60", borderBottomWidth: 1 },
      ]}
    >
      <View style={styles.itemHeader}>
        <Checkbox
          checked={selected}
          onCheckedChange={onToggle}
          accessibilityLabel={`Selecionar ${item.itemName}`}
        />
        <ThemedText
          style={[styles.itemName, { color: colors.foreground }]}
          numberOfLines={2}
        >
          {item.itemName}
        </ThemedText>
        {isTool && (
          <Badge variant="outline">
            <ThemedText style={[styles.toolBadgeText, { color: colors.mutedForeground }]}>
              {item.categoryType === ITEM_CATEGORY_TYPE.TOOL
                ? ITEM_CATEGORY_TYPE_LABELS[ITEM_CATEGORY_TYPE.TOOL]
                : STOCK_MODEL_LABELS[STOCK_MODEL.FIXED_TARGET]}
            </ThemedText>
          </Badge>
        )}
        {item.isEmergencyOverride ? (
          // Top of the urgency hierarchy: the item runs out BEFORE its next
          // scheduled order arrives, so it must be reordered now. Mirrors web,
          // which collapses the redundant CRÍTICO+EMERGENCIAL stack into one
          // badge with the most alarming treatment.
          <Badge variant="red">
            <IconAlertTriangle size={12} color="#ffffff" style={styles.emergencyIcon} />
            <ThemedText style={styles.badgeText}>EMERGENCIAL</ThemedText>
          </Badge>
        ) : (
          <Badge variant={urgency.variant}>
            <ThemedText style={styles.badgeText}>{urgency.label}</ThemedText>
          </Badge>
        )}
      </View>

      <View style={styles.itemMetrics}>
        <Metric
          label="Estoque atual"
          value={formatQuantity(item.currentStock)}
          colors={colors}
        />
        <View style={[styles.metric, { backgroundColor: colors.muted + "30" }]}>
          <ThemedText
            style={[styles.metricLabel, { color: colors.mutedForeground }]}
            numberOfLines={1}
          >
            Qtd. a pedir
          </ThemedText>
          <View style={styles.metricValueRow}>
            <IconPackage size={12} color={colors.primary} />
            <NumberInput
              value={qty}
              onChange={(v) => onQtyChange(v ?? 0)}
              min={0}
              style={styles.qtyInput}
            />
          </View>
        </View>
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
    gap: spacing.sm,
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
  createAllBtn: {
    marginTop: spacing.xs,
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
    gap: spacing.sm,
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
  strategyRow: {
    gap: spacing.xs,
  },
  strategyLabel: {
    fontSize: fontSize.xs,
  },
  strategyChips: {
    flexDirection: "row",
    gap: spacing.xs,
  },
  strategyChip: {
    paddingVertical: 6,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.full,
    borderWidth: 1,
  },
  strategyChipText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },
  groupCreateBtn: {
    marginTop: spacing.xs,
  },
  itemRow: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    gap: spacing.sm,
  },
  itemHeader: {
    flexDirection: "row",
    alignItems: "center",
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
  emergencyIcon: {
    marginRight: 4,
  },
  toolBadgeText: {
    fontSize: 10,
    fontWeight: fontWeight.medium,
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
  qtyInput: {
    flex: 1,
    height: 32,
    paddingVertical: 0,
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
