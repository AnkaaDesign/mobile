// Productivity widget — mobile mirror of web/src/dashboard/widgets/productivity.tsx.
//
// Renders task production stats on the home dashboard. Mobile has no echarts/
// recharts so the chart is a small hand-rolled SVG (react-native-svg) — bars
// + optional goal line + axis labels. A KPI strip below the chart shows
// total / period-average / peak. Same data source as the productivity page
// (`useTaskProductionStats`) so numbers stay in lockstep with web.

import { useCallback, useMemo, useState } from "react";
import { z } from "zod";
import { View, Text, Pressable } from "react-native";
import Svg, { Rect, Line, G, Text as SvgText } from "react-native-svg";
import { useRouter } from "expo-router";
import {
  IconChartBar,
  IconAdjustments,
  IconCalendarStats,
  IconChartLine,
  IconTarget,
  IconFilter,
} from "@tabler/icons-react-native";

import { SECTOR_PRIVILEGES } from "@/constants/enums";
import { useTheme } from "@/lib/theme";
import { spacing, borderRadius, fontSize } from "@/constants/design-system";
import { Input } from "@/components/ui/input";
import { useSectors } from "@/hooks/useSector";
import { useTaskProductionStats } from "@/hooks/use-production-analytics";
import type {
  TaskProductionXAxisMode,
  TaskProductionYAxisMode,
  TaskProductionItem,
} from "@/types/production-analytics";
import type { Sector } from "@/types/sector";

import { WidgetCard } from "../components/widget-card";
import {
  AccentPicker,
  makeAccentSchema,
  resolveAccent,
  type WidgetAccentColor,
  type WidgetAccentIcon,
  type WidgetBorderColor,
  type WidgetAccentShade,
} from "../components/widget-accent";
import {
  Section,
  SectionGroup,
  ToggleRow,
  LabeledField,
  HelpText,
  ConfigTitleInput,
  Combobox,
} from "./_shared";

import type {
  WidgetConfigProps,
  WidgetDefinition,
  WidgetRenderProps,
} from "../types";

// ============================================================
// Period presets — rolling windows, resolved at render time.
// ============================================================

const PERIOD_PRESETS = [
  "current-month",
  "last-3-months",
  "last-6-months",
  "current-year",
  "last-12-months",
  "last-3-years",
] as const;
type PeriodPreset = (typeof PERIOD_PRESETS)[number];

const PERIOD_PRESET_OPTIONS: Array<{ value: PeriodPreset; label: string }> = [
  { value: "current-month",  label: "Mês atual (26 → 25)" },
  { value: "last-3-months",  label: "Últimos 3 meses" },
  { value: "last-6-months",  label: "Últimos 6 meses" },
  { value: "current-year",   label: "Ano atual" },
  { value: "last-12-months", label: "Últimos 12 meses" },
  { value: "last-3-years",   label: "Últimos 3 anos" },
];

function businessMonthOf(date: Date): { year: number; month: number } {
  let y = date.getFullYear();
  let m = date.getMonth() + 1;
  if (date.getDate() > 25) {
    m++;
    if (m > 12) { m = 1; y++; }
  }
  return { year: y, month: m };
}
function businessPeriodStart(year: number, month: number): Date {
  if (month === 1) return new Date(year - 1, 11, 26, 0, 0, 0, 0);
  return new Date(year, month - 2, 26, 0, 0, 0, 0);
}
function businessPeriodEnd(year: number, month: number): Date {
  return new Date(year, month - 1, 25, 23, 59, 59, 999);
}

function resolvePeriodRange(
  preset: PeriodPreset,
  now: Date,
): { startDate: Date; endDate: Date } {
  const { year: ny, month: nm } = businessMonthOf(now);
  const back = (months: number): { year: number; month: number } => {
    let y = ny;
    let m = nm - months;
    while (m < 1) { m += 12; y--; }
    return { year: y, month: m };
  };

  switch (preset) {
    case "current-month":
      return {
        startDate: businessPeriodStart(ny, nm),
        endDate:   businessPeriodEnd(ny, nm),
      };
    case "last-3-months": {
      const s = back(2);
      return {
        startDate: businessPeriodStart(s.year, s.month),
        endDate:   businessPeriodEnd(ny, nm),
      };
    }
    case "last-6-months": {
      const s = back(5);
      return {
        startDate: businessPeriodStart(s.year, s.month),
        endDate:   businessPeriodEnd(ny, nm),
      };
    }
    case "current-year":
      return {
        startDate: businessPeriodStart(ny, 1),
        endDate:   businessPeriodEnd(ny, 12),
      };
    case "last-12-months": {
      const s = back(11);
      return {
        startDate: businessPeriodStart(s.year, s.month),
        endDate:   businessPeriodEnd(ny, nm),
      };
    }
    case "last-3-years":
      return {
        startDate: businessPeriodStart(ny - 2, 1),
        endDate:   businessPeriodEnd(ny, 12),
      };
  }
}

// ============================================================
// Config option vocabularies — mirror productivity page semantics.
// ============================================================

const X_AXIS_OPTIONS = [
  { value: "day",   label: "Dias" },
  { value: "month", label: "Meses" },
  { value: "year",  label: "Anos" },
];

const Y_AXIS_OPTIONS = [
  { value: "count",      label: "Quantidade" },
  { value: "avgPerUser", label: "Média/Colaborador" },
];

const CHART_TYPE_OPTIONS = [
  { value: "bar",  label: "Colunas" },
  { value: "line", label: "Linha" },
];

// ============================================================
// Schema
// ============================================================

const configSchema = z.object({
  title: z.string().min(1).max(80).default("Produtividade"),
  accent: makeAccentSchema({ color: "blue", icon: "ChartBar", borderColor: "none" }),
  display: z
    .object({
      showHeader:  z.boolean().default(true),
      showSummary: z.boolean().default(true),
    })
    .default({ showHeader: true, showSummary: true }),
  period: z
    .object({
      preset:    z.enum(PERIOD_PRESETS).default("last-6-months"),
      xAxisMode: z.enum(["day", "month", "year"]).default("month"),
    })
    .default({ preset: "last-6-months", xAxisMode: "month" }),
  metric: z
    .object({
      // Mobile widget keeps "both" off the menu — fitting two series in a
      // small bar chart wouldn't read well at phone density.
      yAxisMode: z.enum(["count", "avgPerUser"]).default("count"),
    })
    .default({ yAxisMode: "count" }),
  chart: z
    .object({
      type: z.enum(["bar", "line"]).default("bar"),
    })
    .default({ type: "bar" }),
  goal: z
    .object({
      override: z.number().nullable().default(null),
    })
    .default({ override: null }),
  filters: z
    .object({
      sectorIds: z.array(z.string().uuid()).default([]),
    })
    .default({ sectorIds: [] }),
});
type Config = z.infer<typeof configSchema>;

const DEFAULT_CONFIG: Config = {
  title: "Produtividade",
  accent: { color: "blue", icon: "ChartBar", borderColor: "none" },
  display: { showHeader: true, showSummary: true },
  period: { preset: "last-6-months", xAxisMode: "month" },
  metric: { yAxisMode: "count" },
  chart: { type: "bar" },
  goal: { override: null },
  filters: { sectorIds: [] },
};

// ============================================================
// Mini chart — SVG bars or polyline (line mode).
// ============================================================

interface MiniChartProps {
  data: Array<{ label: string; value: number }>;
  width: number;
  height: number;
  fillHex: string;
  goalValue?: number | null;
  type: "bar" | "line";
  textHex: string;
  gridHex: string;
  goalHex: string;
}

function MiniChart({
  data,
  width,
  height,
  fillHex,
  goalValue,
  type,
  textHex,
  gridHex,
  goalHex,
}: MiniChartProps) {
  if (data.length === 0 || width <= 0 || height <= 0) {
    return <View style={{ width, height }} />;
  }

  // Pad the plot area for the y-axis labels on the left and x-axis labels at
  // the bottom. These were tuned against the smallest expected widget size
  // (span 2 × rows 2 ≈ 250×220 plot region).
  const padLeft = 28;
  const padRight = 8;
  const padTop = 10;
  const padBottom = 22;

  const plotW = Math.max(0, width - padLeft - padRight);
  const plotH = Math.max(0, height - padTop - padBottom);

  const rawMax = Math.max(
    data.reduce((a, d) => Math.max(a, d.value), 0),
    goalValue ?? 0,
    1,
  );
  const niceMax = niceCeil(rawMax);
  const yScale = (v: number) => padTop + plotH - (v / niceMax) * plotH;

  const n = data.length;
  // Slot width — each datum gets an equal column. Bars use 65% of the slot
  // so adjacent bars don't kiss.
  const slotW = plotW / Math.max(n, 1);
  const barW = Math.max(2, slotW * 0.65);

  // Label-density throttle: show every Nth label so they don't overlap.
  // 6 labels max comfortably for plot widths around 200-280px.
  const labelStride = Math.max(1, Math.ceil(n / 6));

  const goalY = goalValue != null && goalValue >= 0 ? yScale(goalValue) : null;

  // Pre-compute polyline points for line mode.
  const linePoints = type === "line"
    ? data
        .map((d, i) => `${padLeft + i * slotW + slotW / 2},${yScale(d.value)}`)
        .join(" ")
    : "";

  return (
    <Svg width={width} height={height}>
      {/* Y axis baseline */}
      <Line
        x1={padLeft}
        y1={padTop + plotH}
        x2={padLeft + plotW}
        y2={padTop + plotH}
        stroke={gridHex}
        strokeWidth={1}
      />
      {/* Y axis labels — 0, mid, max */}
      <SvgText
        x={padLeft - 4}
        y={padTop + 4}
        fill={textHex}
        fontSize={9}
        textAnchor="end"
      >
        {formatAxisNumber(niceMax)}
      </SvgText>
      <SvgText
        x={padLeft - 4}
        y={padTop + plotH / 2 + 3}
        fill={textHex}
        fontSize={9}
        textAnchor="end"
      >
        {formatAxisNumber(niceMax / 2)}
      </SvgText>
      <SvgText
        x={padLeft - 4}
        y={padTop + plotH + 3}
        fill={textHex}
        fontSize={9}
        textAnchor="end"
      >
        0
      </SvgText>

      {/* Bars OR line */}
      {type === "bar" ? (
        <G>
          {data.map((d, i) => {
            const x = padLeft + i * slotW + (slotW - barW) / 2;
            const y = yScale(d.value);
            const h = padTop + plotH - y;
            return (
              <Rect
                key={i}
                x={x}
                y={y}
                width={barW}
                height={Math.max(0, h)}
                rx={2}
                fill={fillHex}
              />
            );
          })}
        </G>
      ) : (
        <G>
          {/* Polyline rendered as a single line per segment so we can avoid
              <Polyline> (which has different stroke-join semantics on Android). */}
          {data.slice(0, -1).map((_, i) => {
            const x1 = padLeft + i * slotW + slotW / 2;
            const y1 = yScale(data[i].value);
            const x2 = padLeft + (i + 1) * slotW + slotW / 2;
            const y2 = yScale(data[i + 1].value);
            return (
              <Line
                key={i}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={fillHex}
                strokeWidth={2}
                strokeLinecap="round"
              />
            );
          })}
          {data.map((d, i) => (
            <Rect
              key={`dot-${i}`}
              x={padLeft + i * slotW + slotW / 2 - 2}
              y={yScale(d.value) - 2}
              width={4}
              height={4}
              rx={2}
              fill={fillHex}
            />
          ))}
        </G>
      )}

      {/* Goal line — overlays bars/line if configured */}
      {goalY != null && (
        <G>
          <Line
            x1={padLeft}
            y1={goalY}
            x2={padLeft + plotW}
            y2={goalY}
            stroke={goalHex}
            strokeWidth={1}
            strokeDasharray="4 3"
          />
        </G>
      )}

      {/* X axis labels — strided */}
      {data.map((d, i) => {
        if (i % labelStride !== 0 && i !== n - 1) return null;
        return (
          <SvgText
            key={`xl-${i}`}
            x={padLeft + i * slotW + slotW / 2}
            y={padTop + plotH + 14}
            fill={textHex}
            fontSize={9}
            textAnchor="middle"
          >
            {truncate(d.label, 6)}
          </SvgText>
        );
      })}
    </Svg>
  );
}

function niceCeil(n: number): number {
  if (n <= 1) return 1;
  const exp = Math.floor(Math.log10(n));
  const base = Math.pow(10, exp);
  const ratio = n / base;
  const step = ratio <= 2 ? 2 : ratio <= 5 ? 5 : 10;
  return step * base;
}

function formatAxisNumber(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k`;
  if (n >= 10) return Math.round(n).toString();
  if (n >= 1) return n.toFixed(0);
  return n.toFixed(2);
}

function truncate(s: string, max: number): string {
  return s.length <= max ? s : s.slice(0, max);
}

// ============================================================
// KPI summary tiles below the chart
// ============================================================

function SummaryTile({
  label,
  value,
  textHex,
  borderHex,
  bgHex,
  mutedHex,
}: {
  label: string;
  value: string;
  textHex: string;
  borderHex: string;
  bgHex: string;
  mutedHex: string;
}) {
  return (
    <View
      style={{
        flex: 1,
        paddingHorizontal: spacing.xs ?? 6,
        paddingVertical: 4,
        borderWidth: 1,
        borderRadius: borderRadius?.md ?? 6,
        borderColor: borderHex,
        backgroundColor: bgHex,
      }}
    >
      <Text style={{ fontSize: 9, color: mutedHex, fontWeight: "600", textTransform: "uppercase" }}>
        {label}
      </Text>
      <Text style={{ fontSize: 14, color: textHex, fontWeight: "700" }} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

// ============================================================
// Render component
// ============================================================

function Render({ config, size }: WidgetRenderProps<Config>) {
  const { colors } = useTheme();
  const router = useRouter();

  const accent = useMemo(
    () =>
      resolveAccent({
        color: config.accent?.color as WidgetAccentColor,
        icon:  config.accent?.icon  as WidgetAccentIcon,
        shade: config.accent?.shade as WidgetAccentShade | undefined,
      }),
    [config.accent?.color, config.accent?.icon, config.accent?.shade],
  );

  const { startDate, endDate } = useMemo(
    () => resolvePeriodRange(config.period.preset, new Date()),
    [config.period.preset],
  );

  const xAxisMode = config.period.xAxisMode;
  const yAxisMode = config.metric.yAxisMode;
  const sectorIds = config.filters.sectorIds.length > 0 ? config.filters.sectorIds : undefined;

  // Year mode is aggregated client-side from monthly data.
  const apiXAxisMode: "day" | "month" = xAxisMode === "day" ? "day" : "month";

  const { data, isLoading, isError, refetch, isFetching } = useTaskProductionStats({
    startDate,
    endDate,
    sectorIds,
    xAxisMode: apiXAxisMode,
    yAxisMode,
    compareMode: "combined",
  });

  const rawItems: TaskProductionItem[] = data?.data?.items ?? [];
  const summary = data?.data?.summary;

  const items = useMemo<TaskProductionItem[]>(() => {
    if (xAxisMode !== "year") return rawItems;
    const groups = new Map<string, TaskProductionItem[]>();
    for (const item of rawItems) {
      const yearPart = item.period?.split("-")?.[0] ?? "";
      if (!groups.has(yearPart)) groups.set(yearPart, []);
      groups.get(yearPart)!.push(item);
    }
    return Array.from(groups.entries())
      .map(([year, monthItems]) => {
        const totalCount = monthItems.reduce((s, i) => s + i.totalCount, 0);
        const activeUsers = monthItems.length
          ? Math.round(monthItems.reduce((s, i) => s + i.activeUsers, 0) / monthItems.length)
          : 0;
        return {
          period: year,
          periodLabel: year,
          totalCount,
          activeUsers,
          avgPerUser: activeUsers > 0 ? +(totalCount / activeUsers).toFixed(2) : 0,
        };
      })
      .sort((a, b) => a.period.localeCompare(b.period));
  }, [rawItems, xAxisMode]);

  const useAvg = yAxisMode === "avgPerUser";

  const chartData = useMemo(
    () =>
      items.map((item) => ({
        label: stripYear(item.periodLabel),
        value: useAvg ? item.avgPerUser : item.totalCount,
      })),
    [items, useAvg],
  );

  // KPI strip values
  const periodsWithData = useMemo(
    () => items.filter((i) => (i.totalCount ?? 0) > 0),
    [items],
  );
  const avgPerDisplayPeriod = periodsWithData.length
    ? periodsWithData.reduce((s, i) => s + i.totalCount, 0) / periodsWithData.length
    : 0;
  const peakCount = items.length
    ? items.reduce((a, i) => Math.max(a, i.totalCount), 0)
    : 0;

  // The chart's pixel dimensions are measured in ProductivityBody via onLayout
  // — the parent doesn't need to know them.

  if (isError) {
    return (
      <WidgetCard
        title={String(config.title)}
        icon={<accent.Icon size={16} color={accent.hex} />}
        showHeader={config.display.showHeader}
        accentColor={accent.hex}
        borderColor={accent.hex}
        onRefresh={refetch}
      >
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.md ?? 12 }}>
          <Text style={{ color: colors.destructive, fontSize: fontSize?.sm ?? 13 }}>
            Erro ao carregar dados
          </Text>
        </View>
      </WidgetCard>
    );
  }

  return (
    <WidgetCard
      title={String(config.title)}
      icon={<accent.Icon size={16} color={accent.hex} />}
      showHeader={config.display.showHeader}
      accentColor={accent.hex}
      borderColor={accent.hex}
      onRefresh={refetch}
      refreshing={isFetching}
      footerExtra={
        <Pressable
          onPress={() =>
            router.push("/(tabs)/estatisticas/producao/produtividade" as any)
          }
          hitSlop={6}
        >
          <Text style={{ fontSize: 11, color: accent.hex, fontWeight: "600" }}>
            Ver detalhes →
          </Text>
        </Pressable>
      }
    >
      <ProductivityBody
        data={chartData}
        chartType={config.chart.type}
        showSummary={config.display.showSummary}
        summary={summary}
        avgPerDisplayPeriod={avgPerDisplayPeriod}
        peakCount={peakCount}
        useAvg={useAvg}
        xAxisMode={xAxisMode}
        goalValue={config.goal.override}
        accentHex={accent.hex}
        colors={colors}
        isLoading={isLoading}
      />
    </WidgetCard>
  );
}

// The chart body is its own component so we can safely call hooks like
// useState/useCallback after the parent's `isError` early-return without
// triggering hook-order hazards.

function ProductivityBody({
  data,
  chartType,
  showSummary,
  summary,
  avgPerDisplayPeriod,
  peakCount,
  useAvg,
  xAxisMode,
  goalValue,
  accentHex,
  colors,
  isLoading,
}: {
  data: Array<{ label: string; value: number }>;
  chartType: "bar" | "line";
  showSummary: boolean;
  summary: { totalCompleted: number; avgPerUser: number } | undefined;
  avgPerDisplayPeriod: number;
  peakCount: number;
  useAvg: boolean;
  xAxisMode: TaskProductionXAxisMode;
  goalValue: number | null;
  accentHex: string;
  colors: ReturnType<typeof useTheme>["colors"];
  isLoading: boolean;
}) {
  const [plot, setPlot] = useState({ width: 0, height: 0 });
  const onLayout = useCallback(
    (e: { nativeEvent: { layout: { width: number; height: number } } }) => {
      const { width, height } = e.nativeEvent.layout;
      setPlot((prev) =>
        prev.width === width && prev.height === height
          ? prev
          : { width, height },
      );
    },
    [],
  );

  return (
    <View style={{ flex: 1, gap: 6 }}>
      <View style={{ flex: 1, minHeight: 60 }} onLayout={onLayout}>
        {isLoading ? (
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
            <Text style={{ fontSize: 11, color: colors.mutedForeground, fontStyle: "italic" }}>
              Carregando…
            </Text>
          </View>
        ) : data.length === 0 ? (
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
            <Text style={{ fontSize: 11, color: colors.mutedForeground }}>
              Nenhum dado no período
            </Text>
          </View>
        ) : (
          <MiniChart
            data={data}
            width={plot.width}
            height={plot.height}
            fillHex={accentHex}
            goalValue={goalValue}
            type={chartType}
            textHex={colors.mutedForeground}
            gridHex={colors.border}
            goalHex={colors.destructive}
          />
        )}
      </View>

      {showSummary && summary && (
        <View style={{ flexDirection: "row", gap: 4 }}>
          <SummaryTile
            label="Total"
            value={formatCount(summary.totalCompleted)}
            textHex={colors.foreground}
            borderHex={colors.border}
            bgHex={withAlpha(colors.muted ?? colors.background, 0.4)}
            mutedHex={colors.mutedForeground}
          />
          <SummaryTile
            label={
              xAxisMode === "year"
                ? "Média/Ano"
                : xAxisMode === "day"
                  ? "Média/Dia"
                  : "Média/Mês"
            }
            value={formatCount(avgPerDisplayPeriod, 1)}
            textHex={colors.foreground}
            borderHex={colors.border}
            bgHex={withAlpha(colors.muted ?? colors.background, 0.4)}
            mutedHex={colors.mutedForeground}
          />
          <SummaryTile
            label={useAvg ? "Média/Col." : "Pico"}
            value={
              useAvg
                ? (summary.avgPerUser ?? 0).toFixed(2)
                : formatCount(peakCount)
            }
            textHex={colors.foreground}
            borderHex={colors.border}
            bgHex={withAlpha(colors.muted ?? colors.background, 0.4)}
            mutedHex={colors.mutedForeground}
          />
        </View>
      )}
    </View>
  );
}

function formatCount(n: number, decimals = 0): string {
  if (!Number.isFinite(n)) return "0";
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return decimals > 0 ? n.toFixed(decimals) : Math.round(n).toString();
}

function withAlpha(hex: string, alpha: number): string {
  if (!hex || !hex.startsWith("#") || hex.length < 7) return hex;
  const base = hex.slice(0, 7);
  const clamped = Math.max(0, Math.min(1, alpha));
  const byte = Math.round(clamped * 255).toString(16).padStart(2, "0");
  return `${base}${byte}`;
}

function stripYear(label: string): string {
  return label.replace(/\s+\d{4}\s*$/, "").trim();
}

// ============================================================
// Config component (bottom sheet body)
// ============================================================

function ConfigComp({ config, onChange }: WidgetConfigProps<Config>) {
  const accentColor = (config.accent?.color ?? "blue") as WidgetAccentColor;
  const accentIcon  = (config.accent?.icon  ?? "ChartBar") as WidgetAccentIcon;
  const accentShade = (config.accent?.shade ?? "500") as WidgetAccentShade;
  const borderColor = (config.accent?.borderColor ?? "none") as WidgetBorderColor;

  const sectorsQ = useSectors({ take: 200 });
  const sectorOptions = useMemo(
    () =>
      (sectorsQ.data?.data ?? []).map((s: Sector) => ({
        value: s.id,
        label: s.name,
      })),
    [sectorsQ.data],
  );

  return (
    <View style={{ gap: 8 }}>
      <ConfigTitleInput
        value={config.title}
        onChange={(v) => onChange({ ...config, title: v })}
        placeholder="Produtividade"
      />

      <SectionGroup>
        <Section title="Aparência" icon={<IconAdjustments size={14} />} defaultOpen>
          <AccentPicker
            value={{
              color: accentColor,
              icon: accentIcon,
              borderColor,
              shade: accentShade,
            }}
            onChange={(next) =>
              onChange({
                ...config,
                accent: {
                  ...config.accent,
                  color: next.color,
                  icon: next.icon,
                  borderColor: next.borderColor,
                  shade: next.shade,
                },
              })
            }
          />
          <ToggleRow
            label="Cabeçalho visível"
            checked={config.display.showHeader}
            onCheckedChange={(v) =>
              onChange({ ...config, display: { ...config.display, showHeader: v } })
            }
          />
          <ToggleRow
            label="Mostrar resumo"
            checked={config.display.showSummary}
            onCheckedChange={(v) =>
              onChange({ ...config, display: { ...config.display, showSummary: v } })
            }
          />
        </Section>

        <Section title="Período" icon={<IconCalendarStats size={14} />}>
          <LabeledField label="Janela de tempo">
            <Combobox
              value={config.period.preset}
              onValueChange={(v) =>
                onChange({
                  ...config,
                  period: {
                    ...config.period,
                    preset: (v as PeriodPreset) ?? "last-6-months",
                  },
                })
              }
              options={PERIOD_PRESET_OPTIONS}
            />
          </LabeledField>
          <HelpText>Janela móvel — recalculada a cada abertura.</HelpText>
          <LabeledField label="Agrupamento (eixo X)">
            <Combobox
              value={config.period.xAxisMode}
              onValueChange={(v) =>
                onChange({
                  ...config,
                  period: {
                    ...config.period,
                    xAxisMode: (v as TaskProductionXAxisMode) ?? "month",
                  },
                })
              }
              options={X_AXIS_OPTIONS}
            />
          </LabeledField>
        </Section>

        <Section title="Métrica" icon={<IconChartBar size={14} />}>
          <LabeledField label="Métrica do eixo Y">
            <Combobox
              value={config.metric.yAxisMode}
              onValueChange={(v) => {
                // Mobile intentionally doesn't support the "both" series mode
                // (TaskProductionYAxisMode includes it, but the small phone
                // chart can't fit two series). Coerce "both" → "count" so the
                // narrowed schema type ("count" | "avgPerUser") holds.
                const mode = (v as TaskProductionYAxisMode) ?? "count";
                onChange({
                  ...config,
                  metric: {
                    yAxisMode: mode === "avgPerUser" ? "avgPerUser" : "count",
                  },
                });
              }}
              options={Y_AXIS_OPTIONS}
            />
          </LabeledField>
        </Section>

        <Section title="Gráfico" icon={<IconChartLine size={14} />}>
          <LabeledField label="Tipo de gráfico">
            <Combobox
              value={config.chart.type}
              onValueChange={(v) =>
                onChange({
                  ...config,
                  chart: { type: (v as "bar" | "line") ?? "bar" },
                })
              }
              options={CHART_TYPE_OPTIONS}
            />
          </LabeledField>
        </Section>

        <Section title="Meta" icon={<IconTarget size={14} />}>
          <HelpText>
            Defina uma meta numérica para mostrar a linha tracejada sobre o
            gráfico. Deixe em branco para ocultar.
          </HelpText>
        </Section>

        <Section title="Filtros" icon={<IconFilter size={14} />}>
          <LabeledField label="Setores">
            <Combobox
              mode="multiple"
              value={config.filters.sectorIds}
              onValueChange={(v) =>
                onChange({
                  ...config,
                  filters: {
                    sectorIds: Array.isArray(v) ? v : v ? [v] : [],
                  },
                })
              }
              options={sectorOptions}
              placeholder="Todos os setores"
            />
          </LabeledField>
          <HelpText>Vazio = todos os setores de produção.</HelpText>
        </Section>
      </SectionGroup>
    </View>
  );
}

// ============================================================
// Definition
// ============================================================

export const productivityWidget: WidgetDefinition<Config> = {
  id: "production.productivity",
  name: "Produtividade",
  description:
    "Produção de tarefas por período (dia / mês / ano) com indicadores e meta — mesma fonte da página de Produtividade.",
  icon: IconChartBar,
  category: "production",
  allowedSectors: [
    SECTOR_PRIVILEGES.ADMIN,
    SECTOR_PRIVILEGES.PRODUCTION,
    SECTOR_PRIVILEGES.PRODUCTION_MANAGER,
    SECTOR_PRIVILEGES.HUMAN_RESOURCES,
    SECTOR_PRIVILEGES.FINANCIAL,
  ],
  allowedSpans: [2, 3],
  defaultSpan: 3,
  allowedHeights: [2, 3, 4],
  defaultRows: 2,
  configSchema,
  defaultConfig: DEFAULT_CONFIG,
  RenderComponent: Render,
  ConfigComponent: ConfigComp,
};
