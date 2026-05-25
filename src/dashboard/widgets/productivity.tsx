// Productivity widget — mobile mirror of web/src/dashboard/widgets/productivity.tsx.
//
// Renders task production stats on the home dashboard. Mobile has no echarts/
// recharts so the chart is a small hand-rolled SVG (react-native-svg) — bars
// + optional goal line + axis labels. A KPI strip below the chart shows
// total / period-average / peak. Same data source as the productivity page
// (`useTaskProductionStats`) so numbers stay in lockstep with web.

import { useCallback, useMemo, useState } from "react";
import { z } from "zod";
import { View, Text, ScrollView } from "react-native";
import Svg, { Rect, Line, G, Text as SvgText } from "react-native-svg";
import {
  IconChartBar,
  IconAdjustments,
  IconCalendarStats,
  IconChartLine,
  IconFilter,
} from "@tabler/icons-react-native";

import { SECTOR_PRIVILEGES, GOAL_METRIC } from "@/constants/enums";
import { useTheme } from "@/lib/theme";
import { spacing, borderRadius, fontSize } from "@/constants/design-system";
import { useSectors } from "@/hooks/useSector";
import { useTaskProductionStats } from "@/hooks/use-production-analytics";
import { useDefaultGoal, type BusinessPeriod } from "@/hooks/use-default-goal";
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
  ToggleRow,
  LabeledField,
  HelpText,
  ConfigTitleInput,
  Combobox,
} from "./_shared";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

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

// Enumerate the (year, month) business periods a [startDate, endDate] range
// spans. Walks from the business month containing startDate to the one
// containing endDate inclusively. Mirrors web's getBusinessPeriodsInRange so
// the default-goal lookup filters to the same periods the chart draws.
function businessPeriodsInRange(
  startDate: Date,
  endDate: Date,
): Array<{ year: number; month: number }> {
  const start = businessMonthOf(startDate);
  const end = businessMonthOf(endDate);
  const periods: Array<{ year: number; month: number }> = [];
  let { year, month } = start;
  // Guard against malformed ranges (end before start) — cap at a few years.
  for (let i = 0; i < 64; i++) {
    periods.push({ year, month });
    if (year === end.year && month === end.month) break;
    if (year > end.year || (year === end.year && month > end.month)) break;
    month++;
    if (month > 12) { month = 1; year++; }
  }
  return periods;
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
      // Toggles the admin-configured default goal line. The value itself is no
      // longer typed by the user — it's sourced from the DB (GOAL_METRIC.
      // TASKS_COMPLETED target), matching the web widget. Old persisted configs
      // carried `goal.override`; zod strips that unknown key and `enabled`
      // defaults to true, so they parse fine (back-compat safe).
      enabled: z.boolean().default(true),
    })
    .default({ enabled: true }),
  filters: z
    .object({
      sectorIds: z.array(z.string().uuid()).default([]),
    })
    .default({ sectorIds: [] }),
});
type Config = z.infer<typeof configSchema>;

const DEFAULT_CONFIG: Config = {
  title: "Produtividade",
  accent: { color: "blue", icon: "ChartBar" },
  display: { showHeader: true, showSummary: true },
  period: { preset: "last-6-months", xAxisMode: "month" },
  metric: { yAxisMode: "count" },
  chart: { type: "bar" },
  goal: { enabled: true },
  filters: { sectorIds: [] },
};

// ============================================================
// Mini chart — SVG bars or polyline (line mode).
// ============================================================

interface MiniChartProps {
  data: Array<{ label: string; value: number; goal: number | null }>;
  width: number;
  height: number;
  fillHex: string;
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

  // The tallest goal point must stay on-chart so the goal line isn't clipped.
  const goalMax = data.reduce((a, d) => Math.max(a, d.goal ?? 0), 0);
  const rawMax = Math.max(
    data.reduce((a, d) => Math.max(a, d.value), 0),
    goalMax,
    1,
  );
  // Nice y-axis targeting ~4-5 evenly-spaced ticks with round steps (so we get
  // e.g. 0/20/40/60/80/100 instead of just 0/50/100). The gridlines + labels
  // below are drawn at each of these ticks.
  const { niceMax, niceStep } = niceAxis(rawMax);
  const yScale = (v: number) => padTop + plotH - (v / niceMax) * plotH;
  const yTicks: number[] = [];
  for (let t = 0; t <= niceMax + niceStep * 1e-6; t += niceStep) yTicks.push(t);

  const n = data.length;
  // Slot width — each datum gets an equal column. Bars use 65% of the slot
  // so adjacent bars don't kiss.
  const slotW = plotW / Math.max(n, 1);
  const barW = Math.max(2, slotW * 0.65);

  // Show as MANY x labels as comfortably fit, so the full year view labels all
  // 12 months (the 3-letter abbreviations are narrow). We estimate each label's
  // width from its char count (~5.5px/char at fontSize 9 + 6px gap) and divide
  // the plot width. Only when labels would collide (narrow widget, or dense
  // day-mode with many points) do we drop to an evenly-spaced subset that still
  // includes the first and last. Always-incl-endpoints avoids the old
  // stride+force-last bug that could collide Nov/Dez.
  const maxLabelChars = Math.min(
    4,
    data.reduce((a, d) => Math.max(a, d.label.length), 1),
  );
  const approxLabelW = maxLabelChars * 5.5 + 6;
  const maxLabels = Math.max(2, Math.floor(plotW / approxLabelW));
  const labelIdx = new Set<number>();
  if (n <= maxLabels) {
    for (let i = 0; i < n; i++) labelIdx.add(i);
  } else {
    for (let k = 0; k < maxLabels; k++) {
      labelIdx.add(Math.round((k * (n - 1)) / (maxLabels - 1)));
    }
  }

  // Pre-compute polyline points for line mode.
  const linePoints = type === "line"
    ? data
        .map((d, i) => `${padLeft + i * slotW + slotW / 2},${yScale(d.value)}`)
        .join(" ")
    : "";

  return (
    <Svg width={width} height={height}>
      {/* Horizontal gridline + Y label at each tick (0, step, 2·step, … max).
          The baseline (tick 0) is solid; the rest are faint guides. */}
      {yTicks.map((t, i) => {
        const y = yScale(t);
        return (
          <G key={`yt-${i}`}>
            <Line
              x1={padLeft}
              y1={y}
              x2={padLeft + plotW}
              y2={y}
              stroke={gridHex}
              strokeWidth={i === 0 ? 1 : 0.5}
              opacity={i === 0 ? 1 : 0.4}
            />
            <SvgText
              x={padLeft - 4}
              y={y + 3}
              fill={textHex}
              fontSize={9}
              textAnchor="end"
            >
              {formatAxisNumber(t)}
            </SvgText>
          </G>
        );
      })}
      {/* Y axis vertical line */}
      <Line
        x1={padLeft}
        y1={padTop}
        x2={padLeft}
        y2={padTop + plotH}
        stroke={gridHex}
        strokeWidth={1}
      />

      {/* Bars OR line */}
      {type === "bar" ? (
        <G>
          {data.map((d, i) => {
            const cx = padLeft + i * slotW + slotW / 2;
            const x = padLeft + i * slotW + (slotW - barW) / 2;
            const y = yScale(d.value);
            const h = padTop + plotH - y;
            return (
              <G key={i}>
                <Rect
                  x={x}
                  y={y}
                  width={barW}
                  height={Math.max(0, h)}
                  rx={2}
                  fill={fillHex}
                />
                {/* Value (count) above the bar — mirrors the statistics page. */}
                {d.value > 0 && (
                  <SvgText
                    x={cx}
                    y={y - 3}
                    fill={textHex}
                    fontSize={9}
                    textAnchor="middle"
                  >
                    {formatAxisNumber(d.value)}
                  </SvgText>
                )}
              </G>
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

      {/* Goal line — FOLLOWS each period's target (mirrors the statistics page).
          Dashed segments connect adjacent periods that both have a goal; a
          diamond marks each goal point. Periods without a goal are skipped. */}
      {data.some((d) => d.goal != null) && (
        <G>
          {data.slice(0, -1).map((_, i) => {
            const g1 = data[i].goal;
            const g2 = data[i + 1].goal;
            if (g1 == null || g2 == null) return null;
            return (
              <Line
                key={`goal-seg-${i}`}
                x1={padLeft + i * slotW + slotW / 2}
                y1={yScale(g1)}
                x2={padLeft + (i + 1) * slotW + slotW / 2}
                y2={yScale(g2)}
                stroke={goalHex}
                strokeWidth={1.5}
                strokeDasharray="4 3"
                strokeLinecap="round"
              />
            );
          })}
          {data.map((d, i) => {
            if (d.goal == null) return null;
            const cx = padLeft + i * slotW + slotW / 2;
            const cy = yScale(d.goal);
            return (
              <Rect
                key={`goal-pt-${i}`}
                x={cx - 2.5}
                y={cy - 2.5}
                width={5}
                height={5}
                fill={goalHex}
                transform={`rotate(45 ${cx} ${cy})`}
              />
            );
          })}
        </G>
      )}

      {/* X axis labels — evenly-spaced subset, short (3-letter month) labels */}
      {data.map((d, i) => {
        if (!labelIdx.has(i)) return null;
        return (
          <SvgText
            key={`xl-${i}`}
            x={padLeft + i * slotW + slotW / 2}
            y={padTop + plotH + 14}
            fill={textHex}
            fontSize={9}
            textAnchor="middle"
          >
            {truncate(d.label, 4)}
          </SvgText>
        );
      })}
    </Svg>
  );
}

// Compute a "nice" y-axis (max + step) targeting ~5 evenly-spaced round ticks,
// so the chart shows e.g. 0/20/40/60/80/100 rather than just 0/50/100. Steps
// snap to 1/2/5 × a power of ten. Handles fractional ranges (avg/user rates).
function niceAxis(max: number): { niceMax: number; niceStep: number } {
  const safe = max > 0 ? max : 1;
  const rawStep = safe / 5;
  const mag = Math.pow(10, Math.floor(Math.log10(rawStep)));
  const norm = rawStep / mag;
  const niceStep = (norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 5 ? 5 : 10) * mag;
  const niceMax = Math.ceil(safe / niceStep) * niceStep;
  return { niceMax, niceStep };
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

  // Per-period goal line — sourced from the admin-configured DB target
  // (GOAL_METRIC.TASKS_COMPLETED), mirroring the web widget + statistics page.
  // Each month can have a DIFFERENT goal, so the line FOLLOWS the bars rather
  // than being flat. No typed override. The (year, month) periods are derived
  // from the displayed range so the lookup filters to what the chart draws.
  const goalPeriods = useMemo<BusinessPeriod[]>(
    () => businessPeriodsInRange(startDate, endDate),
    [startDate, endDate],
  );

  // count mode → each period's monthly target; avgPerUser → that target per
  // that period's active users.
  const goalAggregation = useAvg ? "AVERAGE_PER_USER" : "AVERAGE_PER_PERIOD";

  const { perPeriodValues: goalPerPeriod } = useDefaultGoal({
    metric: GOAL_METRIC.TASKS_COMPLETED,
    periods: goalPeriods,
    sectorIds,
    aggregation: goalAggregation,
    // Only relevant in avgPerUser mode; in count mode it's ignored.
    activeUserCount: useAvg ? summary?.totalActiveUsers ?? null : null,
    enabled: config.goal.enabled,
  });

  // Resolve a per-bar goal value aligned to `items`. year mode sums the 12
  // months' targets for that year; avgPerUser divides each period's target by
  // that period's active users; count+day snaps to an integer. null = no goal
  // for that period (the line skips it).
  const perPeriodGoalValues = useMemo<(number | null)[] | null>(() => {
    if (!goalPerPeriod) return null;
    return items.map((item) => {
      let rawSum: number | null;
      if (xAxisMode === "year") {
        let total = 0;
        let hasAny = false;
        for (let m = 1; m <= 12; m++) {
          const v = goalPerPeriod.get(`${item.period}-${String(m).padStart(2, "0")}`);
          if (v != null) {
            total += v;
            hasAny = true;
          }
        }
        rawSum = hasAny ? total : null;
      } else {
        rawSum = goalPerPeriod.get(item.period) ?? null;
      }
      if (rawSum == null) return null;
      let val = rawSum;
      if (useAvg) {
        const activeUsers = item.activeUsers ?? 0;
        if (activeUsers <= 0) return null;
        val = val / activeUsers;
      } else if (xAxisMode === "day") {
        val = Math.round(val);
      }
      return val;
    });
  }, [goalPerPeriod, items, xAxisMode, useAvg]);

  const chartData = useMemo(
    () =>
      items.map((item, i) => ({
        label: abbreviateMonthLabel(stripYear(item.periodLabel)),
        value: useAvg ? item.avgPerUser : item.totalCount,
        goal: perPeriodGoalValues?.[i] ?? null,
      })),
    [items, useAvg, perPeriodGoalValues],
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
  accentHex,
  colors,
  isLoading,
}: {
  data: Array<{ label: string; value: number; goal: number | null }>;
  chartType: "bar" | "line";
  showSummary: boolean;
  summary: { totalCompleted: number; avgPerUser: number } | undefined;
  avgPerDisplayPeriod: number;
  peakCount: number;
  useAvg: boolean;
  xAxisMode: TaskProductionXAxisMode;
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

// Portuguese month name → 3-letter abbreviation. Used for x-axis labels so the
// 12-month year view fits without overlapping (the API returns full month
// names like "Janeiro"). Non-month labels (a year "2026", a day date) pass
// through unchanged.
const MONTH_ABBR: Record<string, string> = {
  janeiro: "Jan",
  fevereiro: "Fev",
  "março": "Mar",
  marco: "Mar",
  abril: "Abr",
  maio: "Mai",
  junho: "Jun",
  julho: "Jul",
  agosto: "Ago",
  setembro: "Set",
  outubro: "Out",
  novembro: "Nov",
  dezembro: "Dez",
};

function abbreviateMonthLabel(label: string): string {
  const key = label.trim().toLowerCase();
  if (MONTH_ABBR[key]) return MONTH_ABBR[key];
  for (const [full, abbr] of Object.entries(MONTH_ABBR)) {
    if (key.startsWith(full)) return abbr;
  }
  return label;
}

// ============================================================
// Config component (bottom sheet body)
// ============================================================

function ConfigComp({ config, onChange }: WidgetConfigProps<Config>) {
  const accentColor = (config.accent?.color ?? "blue") as WidgetAccentColor;
  const accentIcon  = (config.accent?.icon  ?? "ChartBar") as WidgetAccentIcon;
  const accentShade = (config.accent?.shade ?? "500") as WidgetAccentShade;
  const borderColor = (config.accent?.borderColor ?? "none") as WidgetBorderColor;

  // API caps `take` at 100 (sectors is a small set, so 100 fetches all).
  const sectorsQ = useSectors({ take: 100 });
  const sectorOptions = useMemo(
    () =>
      (sectorsQ.data?.data ?? []).map((s: Sector) => ({
        value: s.id,
        label: s.name,
      })),
    [sectorsQ.data],
  );

  return (
    <View style={{ gap: 12 }}>
      <ConfigTitleInput
        value={config.title}
        onChange={(v) => onChange({ ...config, title: v })}
        placeholder="Produtividade"
      />

      <Tabs defaultValue="appearance">
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <TabsList style={{ minWidth: 320 }}>
            <TabsTrigger value="appearance">Aparência</TabsTrigger>
            <TabsTrigger value="chart">Gráfico</TabsTrigger>
            <TabsTrigger value="filters">Filtros</TabsTrigger>
          </TabsList>
        </ScrollView>

        <TabsContent value="appearance">
          <Section title="Aparência" defaultOpen>
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
        </TabsContent>

        <TabsContent value="chart">
          <Section title="Período" defaultOpen>
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

          <Section title="Métrica">
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

          <Section title="Gráfico">
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

          <Section title="Meta">
            <ToggleRow
              label="Mostrar meta"
              checked={config.goal.enabled}
              onCheckedChange={(v) =>
                onChange({ ...config, goal: { enabled: v } })
              }
            />
            <HelpText>
              A meta vem do alvo configurado em Administração › Metas
              (não é digitada aqui). A linha tracejada mostra a meta padrão do
              período exibido. Desative para ocultá-la.
            </HelpText>
          </Section>
        </TabsContent>

        <TabsContent value="filters">
          <Section title="Filtros" defaultOpen>
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
        </TabsContent>
      </Tabs>
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
