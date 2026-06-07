import { useState, useMemo } from "react";
import { View, StyleSheet, Pressable } from "react-native";
import {
  IconCalculator,
  IconChevronDown,
  IconChevronUp,
  IconTrendingUp,
  IconTrendingDown,
  IconMinus,
} from "@tabler/icons-react-native";
import { ThemedText } from "@/components/ui/themed-text";
import { Card } from "@/components/ui/card";
import { useTheme } from "@/lib/theme";
import {
  spacing,
  fontSize,
  fontWeight,
  borderRadius,
} from "@/constants/design-system";
import { formatQuantity, formatDate } from "@/utils";
import { ABC_CATEGORY_LABELS, XYZ_CATEGORY_LABELS } from "@/constants";
import type { Item } from "../../../../types";

interface ScheduledNextOrder {
  quantity: number;
  scheduleName?: string | null;
  scheduleId?: string;
  nextRun?: Date | string | null;
}

interface CalculationBreakdownCardProps {
  item: Item;
  // When the item belongs to an active order schedule, this is the quantity that
  // schedule will actually order next (gap + one cycle). It replaces the standalone
  // restock-to-max suggestion, which is never used for scheduled items.
  scheduledNextOrder?: ScheduledNextOrder | null;
}

// The API derives reorderPoint/maxQuantity using monthlyConsumption / 30
// (item.service.ts avgDailyConsumption = monthlyConsumption / 30), and the
// formula strings below print "/30". Keep the daily-average display consistent.
const DAYS_PER_MONTH = 30;

const ABC_XYZ_EXPLANATIONS: Record<string, string> = {
  "A-X":
    "Alto valor financeiro com consumo muito previsível: prioridade máxima de reposição, baixo estoque de segurança.",
  "A-Y":
    "Alto valor financeiro com consumo moderadamente variável: monitore tendências e mantenha estoque de segurança.",
  "A-Z":
    "Alto valor financeiro com consumo imprevisível: revisar critérios de compra e considerar fornecimento sob demanda.",
  "B-X":
    "Valor médio com consumo previsível: reposição programada, estoque de segurança baixo.",
  "B-Y":
    "Valor médio com consumo variável: acompanhar mudanças sazonais.",
  "B-Z":
    "Valor médio com consumo imprevisível: estoque de segurança moderado.",
  "C-X":
    "Baixo valor com consumo previsível: estoque alto reduz o número de pedidos.",
  "C-Y":
    "Baixo valor com consumo moderadamente variável: regras simples de reposição.",
  "C-Z":
    "Baixo valor com consumo imprevisível: estoque oportunístico, baixa prioridade.",
};

export function CalculationBreakdownCard({ item, scheduledNextOrder }: CalculationBreakdownCardProps) {
  const { colors } = useTheme();
  const [expanded, setExpanded] = useState(false);

  const data = useMemo(() => {
    const monthlyConsumption = item.monthlyConsumption ?? 0;
    const avgDailyConsumption = monthlyConsumption / DAYS_PER_MONTH;
    const estimatedLeadTime = item.estimatedLeadTime ?? null;
    const reorderPoint = item.reorderPoint ?? null;
    const maxQuantity = item.maxQuantity ?? null;
    const trend = item.monthlyConsumptionTrendPercent ?? null;
    // TODO: backend does not yet expose seasonalFactor or safetyFactor on Item;
    // fall back to placeholder display once API includes them.
    const safetyFactor = null as number | null;
    const seasonalFactor = null as number | null;

    const abc = item.abcCategory;
    const xyz = item.xyzCategory;
    const classification = abc && xyz ? `${abc}-${xyz}` : abc || xyz || null;
    const classificationExplanation = classification
      ? ABC_XYZ_EXPLANATIONS[classification] ??
        "Combinação ABC/XYZ — usada para priorizar reposição."
      : null;

    return {
      monthlyConsumption,
      avgDailyConsumption,
      estimatedLeadTime,
      reorderPoint,
      maxQuantity,
      trend,
      safetyFactor,
      seasonalFactor,
      classification,
      classificationExplanation,
      abc,
      xyz,
    };
  }, [item]);

  const reorderPointFormula = (() => {
    const lt = data.estimatedLeadTime ?? 0;
    const sf = data.safetyFactor ?? 0;
    const seasonal = data.seasonalFactor ?? 1;
    const rp = data.reorderPoint;
    return `${formatQuantity(data.monthlyConsumption)}/30 × ${lt} × (1+${sf.toFixed(2)}) × ${seasonal.toFixed(2)} = ${rp !== null ? formatQuantity(rp) : "—"}`;
  })();

  const maxQuantityFormula = (() => {
    const rp = data.reorderPoint ?? 0;
    const seasonal = data.seasonalFactor ?? 1;
    // targetStockDays defaults to ~30 (1 month) when backend doesn't expose it
    const targetStockDays = 30;
    const max = data.maxQuantity;
    return `${formatQuantity(rp)} + (${formatQuantity(data.monthlyConsumption)}/30 × ${targetStockDays} × ${seasonal.toFixed(2)}) = ${max !== null ? formatQuantity(max) : "—"}`;
  })();

  const trendIcon =
    data.trend === null
      ? IconMinus
      : data.trend > 0
        ? IconTrendingUp
        : data.trend < 0
          ? IconTrendingDown
          : IconMinus;
  const trendColor =
    data.trend === null
      ? colors.mutedForeground
      : data.trend > 0
        ? "#dc2626"
        : data.trend < 0
          ? "#16a34a"
          : colors.mutedForeground;
  const trendLabel =
    data.trend === null
      ? "—"
      : `${data.trend > 0 ? "+" : ""}${data.trend.toFixed(1)}%`;

  return (
    <Card style={styles.card}>
      <Pressable
        onPress={() => setExpanded((v) => !v)}
        style={[styles.header, { borderBottomColor: expanded ? colors.border : "transparent" }]}
        accessibilityRole="button"
        accessibilityLabel={
          expanded ? "Recolher detalhes do cálculo" : "Expandir detalhes do cálculo"
        }
      >
        <View style={styles.headerLeft}>
          <IconCalculator size={20} color={colors.primary} />
          <ThemedText style={[styles.title, { color: colors.foreground }]}>
            Detalhes do Cálculo
          </ThemedText>
        </View>
        {expanded ? (
          <IconChevronUp size={20} color={colors.mutedForeground} />
        ) : (
          <IconChevronDown size={20} color={colors.mutedForeground} />
        )}
      </Pressable>

      {expanded && (
        <View style={styles.content}>
          <Row
            label="Consumo Diário Médio"
            value={`${formatQuantity(data.avgDailyConsumption)} un/dia`}
            hint={`(${formatQuantity(data.monthlyConsumption)} un/mês ÷ ${DAYS_PER_MONTH} dias)`}
            colors={colors}
          />
          <Row
            label="Prazo de Entrega Estimado"
            value={data.estimatedLeadTime !== null ? `${data.estimatedLeadTime} dias` : "—"}
            colors={colors}
          />
          <Row
            label="Fator de Segurança"
            value={data.safetyFactor !== null ? data.safetyFactor.toFixed(2) : "—"}
            colors={colors}
          />
          <Row
            label="Fator Sazonal"
            value={data.seasonalFactor !== null ? data.seasonalFactor.toFixed(2) : "—"}
            colors={colors}
          />

          <Row
            label="Tendência de Consumo"
            valueNode={
              <View style={styles.trendValue}>
                {(() => {
                  const TrendIcon = trendIcon;
                  return <TrendIcon size={14} color={trendColor} />;
                })()}
                <ThemedText style={[styles.value, { color: trendColor }]}>
                  {trendLabel}
                </ThemedText>
              </View>
            }
            colors={colors}
          />

          <Row
            label="Classificação ABC/XYZ"
            value={
              data.classification ??
              (data.abc
                ? ABC_CATEGORY_LABELS[data.abc]
                : data.xyz
                  ? XYZ_CATEGORY_LABELS[data.xyz]
                  : "—")
            }
            hint={data.classificationExplanation ?? undefined}
            colors={colors}
          />

          {scheduledNextOrder ? (
            // The item belongs to an active schedule — show the quantity that schedule
            // will actually order next (gap + one cycle) instead of the standalone
            // restock-to-max suggestion, which is never used for scheduled items.
            <View style={[styles.nextOrderBlock, { backgroundColor: colors.primary + "12" }]}>
              <View style={styles.nextOrderMain}>
                <ThemedText style={[styles.nextOrderLabel, { color: colors.foreground }]}>
                  Próximo pedido (agendamento)
                </ThemedText>
                <ThemedText style={[styles.nextOrderValue, { color: colors.primary }]}>
                  {formatQuantity(scheduledNextOrder.quantity)}
                </ThemedText>
              </View>
              <ThemedText style={[styles.nextOrderHint, { color: colors.mutedForeground }]}>
                {scheduledNextOrder.scheduleName || "Agendamento ativo"}
                {scheduledNextOrder.nextRun ? ` · ${formatDate(scheduledNextOrder.nextRun)}` : ""}
              </ThemedText>
            </View>
          ) : (
            <View style={[styles.nextOrderBlock, { backgroundColor: colors.primary + "12" }]}>
              <View style={styles.nextOrderMain}>
                <ThemedText style={[styles.nextOrderLabel, { color: colors.mutedForeground }]}>
                  Quantidade sugerida para o próximo pedido
                </ThemedText>
                <ThemedText style={[styles.nextOrderValue, { color: colors.primary }]}>
                  {item.reorderQuantity !== null && item.reorderQuantity !== undefined
                    ? formatQuantity(item.reorderQuantity)
                    : "—"}
                </ThemedText>
              </View>
            </View>
          )}

          <FormulaBlock
            title="Fórmula do Ponto de Reposição"
            formula="mc/30 × leadTime × (1+sf) × seasonal = rp"
            calculation={reorderPointFormula}
            colors={colors}
          />

          <FormulaBlock
            title="Fórmula da Quantidade Máxima"
            formula="rp + (mc/30 × targetStockDays × seasonal) = max"
            calculation={maxQuantityFormula}
            colors={colors}
            isLast
          />
        </View>
      )}
    </Card>
  );
}

interface RowProps {
  label: string;
  value?: string;
  valueNode?: React.ReactNode;
  hint?: string;
  colors: any;
}

function Row({ label, value, valueNode, hint, colors }: RowProps) {
  return (
    <View
      style={[
        styles.row,
        { borderBottomColor: colors.border + "40" },
      ]}
    >
      <View style={styles.rowMain}>
        <ThemedText style={[styles.label, { color: colors.mutedForeground }]}>
          {label}
        </ThemedText>
        {valueNode ?? (
          <ThemedText style={[styles.value, { color: colors.foreground }]}>
            {value}
          </ThemedText>
        )}
      </View>
      {hint && (
        <ThemedText style={[styles.hint, { color: colors.mutedForeground }]}>
          {hint}
        </ThemedText>
      )}
    </View>
  );
}

interface FormulaBlockProps {
  title: string;
  formula: string;
  calculation: string;
  colors: any;
  isLast?: boolean;
}

function FormulaBlock({ title, formula, calculation, colors, isLast }: FormulaBlockProps) {
  return (
    <View
      style={[
        styles.formulaBlock,
        { backgroundColor: colors.muted + "40", borderColor: colors.border },
        !isLast && { marginBottom: spacing.xs },
      ]}
    >
      <ThemedText style={[styles.formulaTitle, { color: colors.foreground }]}>
        {title}
      </ThemedText>
      <ThemedText style={[styles.formulaText, { color: colors.mutedForeground }]}>
        {formula}
      </ThemedText>
      <ThemedText style={[styles.formulaText, { color: colors.foreground }]}>
        {calculation}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: spacing.md,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.medium,
  },
  content: {
    padding: spacing.md,
    gap: spacing.xs,
  },
  row: {
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    gap: 2,
  },
  rowMain: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  label: {
    fontSize: fontSize.sm,
    flex: 1,
    paddingRight: spacing.sm,
  },
  value: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  hint: {
    fontSize: fontSize.xs,
    fontStyle: "italic",
  },
  trendValue: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  nextOrderBlock: {
    marginTop: spacing.sm,
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    gap: 2,
  },
  nextOrderMain: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  nextOrderLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    flex: 1,
  },
  nextOrderValue: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
  },
  nextOrderHint: {
    fontSize: fontSize.xs,
  },
  formulaBlock: {
    marginTop: spacing.sm,
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    gap: 4,
  },
  formulaTitle: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    textTransform: "uppercase",
  },
  formulaText: {
    fontSize: fontSize.xs,
    fontFamily: "monospace",
  },
});
