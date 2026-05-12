// Task widget — mobile parity rewrite (agent 10).
//
// Goals vs. previous mobile widget:
//   - Full feature parity with web `task-table.tsx` (3253 lines), within the
//     constraints carved out in MOBILE_WIDGETS_SPEC.md §6.1: 12 columns
//     (down from web's 41), 19 filters (web has 24), multi-sort, 3 cell-mode
//     groups, full 11-knob deadlineColors, layoutMode (flat / grouped /
//     tabs), rowClickTarget, behavior.viewAllRouteOverride, columnLabels,
//     and the existing mobile chrome (accent picker, density, search,
//     refetch interval, paint dot).
//
// Cells render via `_table.tsx` primitives so the row inset / striping /
// dividers stay consistent with every other table widget. Status tones go
// through `_status-tones.tsx` so no raw hexes appear in the row body for
// status — the deadlineColors knobs *do* persist user-supplied tokens
// (e.g. "red-500") because that's the web schema's contract; we resolve
// them at render time via a small palette table.

import { useMemo, useState } from "react";
import { z } from "zod";
import { View, Text, Pressable } from "react-native";
import { useRouter } from "expo-router";
import {
  IconClipboardText,
  IconAlertTriangle,
} from "@tabler/icons-react-native";
import { useTheme } from "@/lib/theme";
import {
  TASK_STATUS,
  SECTOR_PRIVILEGES,
  COMMISSION_STATUS,
  TASK_QUOTE_STATUS,
  SERVICE_ORDER_TYPE,
  TRUCK_CATEGORY,
  IMPLEMENT_TYPE,
} from "@/constants/enums";
import {
  TASK_STATUS_LABELS,
  COMMISSION_STATUS_LABELS,
  TASK_QUOTE_STATUS_LABELS,
  SERVICE_ORDER_TYPE_LABELS,
  TRUCK_CATEGORY_LABELS,
  IMPLEMENT_TYPE_LABELS,
} from "@/constants/enum-labels";
import { useTasks } from "@/hooks/useTask";
import { useSectors } from "@/hooks/useSector";
import { useCustomers } from "@/hooks/useCustomer";
import { useUsers } from "@/hooks/useUser";
import {
  Section,
  ToggleRow,
  LimitInput,
  ConfigTitleInput,
  TableRefreshSection,
  computeBodyMaxHeight,
  densityClasses,
  type Density,
  makeTableDisplaySchema,
  TABLE_DISPLAY_DEFAULTS,
  TableDisplayConfigSection,
  type TableDisplay,
} from "./_shared";
import { ColumnPicker } from "../components/column-picker";
import {
  WidgetTableContainer,
  WidgetTableSearch,
  WidgetTableRow,
  WidgetTableHeader,
  WidgetTableMessage,
  cellStyleForColumn,
  type WidgetTableColumn,
} from "./_table";
import { toneForTaskStatus } from "./_status-tones";
import { SkeletonRows } from "./_skeleton";
import { WidgetErrorState } from "./_error-state";
import { lightImpactHaptic } from "@/utils/haptics";
import { Input } from "@/components/ui/input";
import { Combobox } from "@/components/ui/combobox";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScrollView } from "react-native-gesture-handler";
import { WidgetCard } from "../components/widget-card";
import {
  AccentPicker,
  makeAccentSchema,
  resolveAccent,
  borderHexFor,
  type WidgetAccentColor,
  type WidgetAccentIcon,
  type WidgetBorderColor,
} from "../components/widget-accent";
import type {
  WidgetConfigProps,
  WidgetDefinition,
  WidgetRenderProps,
} from "../types";
import { useAuth } from "@/contexts/auth-context";
import { canViewTaskFinancialColumns, isTaskFinancialColumn } from "@/utils/permissions/task-column-permissions";

// ---------------------------------------------------------------------------
// Constants — column / sort / filter / cell-mode catalogs
// ---------------------------------------------------------------------------

/** Mobile-feasible subset of web's 41-column catalog. The omitted columns
 *  (paint canvas swatch, multiple SO sub-counts, plate, chassis, spot,
 *  characteristics flags) are too data-dense for phone width — see
 *  MOBILE_WIDGETS_SPEC §6.1 "Mobile current state (gaps to close)". */
export const TASK_COLUMN_KEYS = [
  "task",
  "customerName",
  "serialNumber",
  "status",
  "sector",
  "responsibles",
  "term",
  "forecastDate",
  "createdAt",
  "commission",
  "quoteStatus",
  "quoteTotal",
] as const;
export type TaskColumnKey = (typeof TASK_COLUMN_KEYS)[number];

const TASK_COLUMN_LABELS: Record<TaskColumnKey, string> = {
  task: "Tarefa",
  customerName: "Cliente",
  serialNumber: "OS",
  status: "Status",
  sector: "Setor",
  responsibles: "Responsáveis",
  term: "Prazo",
  forecastDate: "Previsão",
  createdAt: "Criado em",
  commission: "Comissão",
  quoteStatus: "Orçamento",
  quoteTotal: "Valor",
};

const TASK_COLUMN_PICKER_OPTIONS = TASK_COLUMN_KEYS.map((k) => ({
  key: k,
  label: TASK_COLUMN_LABELS[k],
}));

const TASK_SORT_KEY_OPTIONS = [
  { value: "term", label: "Prazo" },
  { value: "forecastDate", label: "Previsão" },
  { value: "createdAt", label: "Criação" },
  { value: "startedAt", label: "Início" },
  { value: "finishedAt", label: "Conclusão" },
  { value: "name", label: "Nome" },
  { value: "statusOrder", label: "Status" },
  { value: "entryDate", label: "Entrada" },
  { value: "price", label: "Valor" },
  { value: "commissionOrder", label: "Comissão" },
  { value: "updatedAt", label: "Atualização" },
];
const TASK_SORT_KEYS = [
  "term",
  "forecastDate",
  "createdAt",
  "startedAt",
  "finishedAt",
  "name",
  "statusOrder",
  "entryDate",
  "price",
  "commissionOrder",
  "updatedAt",
] as const;

const STATUS_OPTIONS = Object.values(TASK_STATUS).map((s) => ({
  value: s,
  label: TASK_STATUS_LABELS[s],
}));
const COMMISSION_OPTIONS = Object.values(COMMISSION_STATUS).map((s) => ({
  value: s,
  label: COMMISSION_STATUS_LABELS[s],
}));
const QUOTE_STATUS_OPTIONS = Object.values(TASK_QUOTE_STATUS).map((s) => ({
  value: s,
  label: TASK_QUOTE_STATUS_LABELS[s],
}));
const SO_TYPE_OPTIONS = Object.values(SERVICE_ORDER_TYPE).map((s) => ({
  value: s,
  label: SERVICE_ORDER_TYPE_LABELS[s],
}));
const TRUCK_CATEGORY_OPTIONS = Object.values(TRUCK_CATEGORY).map((s) => ({
  value: s,
  label: TRUCK_CATEGORY_LABELS[s],
}));
const IMPLEMENT_TYPE_OPTIONS = Object.values(IMPLEMENT_TYPE).map((s) => ({
  value: s,
  label: IMPLEMENT_TYPE_LABELS[s],
}));

const TRI_STATE = ["any", "yes", "no"] as const;
const TRI_STATE_OPTIONS = [
  { value: "any", label: "Qualquer" },
  { value: "yes", label: "Sim" },
  { value: "no", label: "Não" },
];

const TERM_PRESETS = [
  "any",
  "today",
  "overdue",
  "next-7-days",
  "next-30-days",
  "this-month",
] as const;
const TERM_PRESET_OPTIONS = [
  { value: "any", label: "Qualquer" },
  { value: "today", label: "Hoje" },
  { value: "overdue", label: "Atrasados" },
  { value: "next-7-days", label: "Próximos 7 dias" },
  { value: "next-30-days", label: "Próximos 30 dias" },
  { value: "this-month", label: "Este mês" },
];

const FORECAST_PRESETS = [
  "any",
  "today",
  "next-7-days",
  "next-30-days",
  "this-month",
] as const;
const FORECAST_PRESET_OPTIONS = [
  { value: "any", label: "Qualquer" },
  { value: "today", label: "Hoje" },
  { value: "next-7-days", label: "Próximos 7 dias" },
  { value: "next-30-days", label: "Próximos 30 dias" },
  { value: "this-month", label: "Este mês" },
];

const FINISHED_PRESETS = [
  "any",
  "today",
  "last-7-days",
  "last-30-days",
  "this-month",
] as const;
const CREATED_PRESETS = FINISHED_PRESETS;
const PAST_PRESET_OPTIONS = [
  { value: "any", label: "Qualquer" },
  { value: "today", label: "Hoje" },
  { value: "last-7-days", label: "Últimos 7 dias" },
  { value: "last-30-days", label: "Últimos 30 dias" },
  { value: "this-month", label: "Este mês" },
];

const LAYOUT_MODES = ["flat", "grouped-by-status", "tabs"] as const;
const LAYOUT_MODE_OPTIONS = [
  { value: "flat", label: "Linear" },
  { value: "grouped-by-status", label: "Agrupado por status" },
  { value: "tabs", label: "Abas por status" },
];

const SO_CELL_MODES = ["count", "progress-bar"] as const;
const SO_CELL_MODE_OPTIONS = [
  { value: "count", label: "Contagem" },
  { value: "progress-bar", label: "Barra de progresso" },
];
const PAINT_CELL_MODES = ["swatch", "swatch-name", "name"] as const;
const PAINT_CELL_MODE_OPTIONS = [
  { value: "swatch", label: "Bolinha" },
  { value: "swatch-name", label: "Bolinha + nome" },
  { value: "name", label: "Apenas nome" },
];
const STATUS_CELL_MODES = ["badge", "dot-label", "text"] as const;
const STATUS_CELL_MODE_OPTIONS = [
  { value: "badge", label: "Badge colorido" },
  { value: "dot-label", label: "Ponto + texto" },
  { value: "text", label: "Apenas texto" },
];

const ROW_CLICK_TARGET_OPTIONS = [
  { value: "task", label: "Detalhe da tarefa" },
  { value: "budget", label: "Detalhe do orçamento" },
  { value: "billing", label: "Detalhe do faturamento" },
];

// Tailwind-style tokens used by web's deadlineColors knobs ("red-500",
// "amber-500"). Mobile resolves them through this small palette so saved
// configs round-trip cleanly between platforms.
const TAILWIND_PALETTE: Record<string, string> = {
  "red-400": "#f87171",
  "red-500": "#ef4444",
  "red-600": "#dc2626",
  "red-700": "#b91c1c",
  "orange-400": "#fb923c",
  "orange-500": "#f97316",
  "orange-600": "#ea580c",
  "amber-400": "#fbbf24",
  "amber-500": "#f59e0b",
  "amber-600": "#d97706",
  "yellow-400": "#facc15",
  "yellow-500": "#eab308",
  "yellow-600": "#ca8a04",
  "lime-500": "#84cc16",
  "green-400": "#4ade80",
  "green-500": "#22c55e",
  "green-600": "#16a34a",
  "emerald-500": "#10b981",
  "blue-500": "#3b82f6",
  "blue-600": "#2563eb",
  "gray-400": "#9ca3af",
  "gray-500": "#6b7280",
};
const DEADLINE_COLOR_OPTIONS = [
  { value: "red-500", label: "Vermelho" },
  { value: "orange-500", label: "Laranja" },
  { value: "amber-500", label: "Âmbar" },
  { value: "yellow-500", label: "Amarelo" },
  { value: "lime-500", label: "Lima" },
  { value: "green-500", label: "Verde" },
  { value: "emerald-500", label: "Esmeralda" },
  { value: "blue-500", label: "Azul" },
  { value: "gray-500", label: "Cinza" },
];

function paletteHex(token: string | undefined, fallback: string): string {
  if (!token) return fallback;
  const direct = TAILWIND_PALETTE[token];
  if (direct) return direct;
  // Bare token like "red" — fall back to shade 500.
  const five = TAILWIND_PALETTE[`${token}-500`];
  return five ?? fallback;
}

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

const dateRangeSchema = z
  .object({
    from: z.string().nullable().default(null),
    to: z.string().nullable().default(null),
  })
  .default({ from: null, to: null });

const configSchema = z.object({
  title: z.string().min(1).max(80).default("Tarefas").describe("Título"),
  showHeader: z.boolean().default(true).describe("Exibir cabeçalho"),
  showPaintDot: z.boolean().default(true).describe("Bolinha de pintura"),
  /** Hours-before-deadline window that flips the term cell to amber. Mirrors
   *  web's `termCriticalHours` config knob — kept top-level for back-compat
   *  with mobile configs persisted before deadlineColors was added. */
  termCriticalHours: z
    .number()
    .int()
    .min(1)
    .max(72)
    .default(4)
    .describe("Horas críticas (legado)"),

  rowClickTarget: z
    .enum(["task", "budget", "billing"])
    .default("task")
    .describe("Destino do toque na linha"),

  display: makeTableDisplaySchema({
    density: "comfortable",
    showRowDot: false,
    showSearchBox: false,
    stickyHeader: true,
  }).and(
    z
      .object({
        showViewAllLink: z.boolean().default(true),
        showCount: z.boolean().default(true),
        layoutMode: z.enum(LAYOUT_MODES).default("flat"),
      })
      .default({
        showViewAllLink: true,
        showCount: true,
        layoutMode: "flat",
      }),
  ),

  cellModes: z
    .object({
      serviceOrder: z.enum(SO_CELL_MODES).default("progress-bar"),
      paint: z.enum(PAINT_CELL_MODES).default("swatch-name"),
      status: z.enum(STATUS_CELL_MODES).default("badge"),
    })
    .default({
      serviceOrder: "progress-bar",
      paint: "swatch-name",
      status: "badge",
    }),

  deadlineColors: z
    .object({
      enabled: z.boolean().default(true),
      bold: z.boolean().default(true),
      forecastCriticalDays: z.number().int().min(0).max(60).default(3),
      forecastWarningDays: z.number().int().min(0).max(120).default(7),
      forecastNoticeDays: z.number().int().min(0).max(180).default(10),
      forecastCriticalColor: z.string().default("red-500"),
      forecastWarningColor: z.string().default("orange-500"),
      forecastNoticeColor: z.string().default("yellow-500"),
      termOverdueColor: z.string().default("red-500"),
      termCriticalHours: z.number().min(0).max(72).default(4),
      termCriticalColor: z.string().default("amber-500"),
      termOnTrackColor: z.string().default("green-500"),
    })
    .default({
      enabled: true,
      bold: true,
      forecastCriticalDays: 3,
      forecastWarningDays: 7,
      forecastNoticeDays: 10,
      forecastCriticalColor: "red-500",
      forecastWarningColor: "orange-500",
      forecastNoticeColor: "yellow-500",
      termOverdueColor: "red-500",
      termCriticalHours: 4,
      termCriticalColor: "amber-500",
      termOnTrackColor: "green-500",
    }),

  columns: z
    .array(z.enum(TASK_COLUMN_KEYS))
    .min(1)
    .default(["task", "status", "term"])
    .transform((cols) => (cols.includes("task") ? cols : ["task", ...cols])),

  columnLabels: z.record(z.string()).default({}),

  filters: z
    .object({
      status: z.array(z.nativeEnum(TASK_STATUS)).default([]),
      sectorIds: z.array(z.string()).default([]),
      customerIds: z.array(z.string()).default([]),
      assigneeIds: z.array(z.string()).default([]),
      commissions: z.array(z.nativeEnum(COMMISSION_STATUS)).default([]),
      // Truck-related filters mirror web's task-table schema so saved configs
      // round-trip cleanly across platforms. The mobile UI surfaces them; the
      // mobile query builder also threads them through `buildWhere`.
      truckCategories: z.array(z.nativeEnum(TRUCK_CATEGORY)).default([]),
      implementTypes: z.array(z.nativeEnum(IMPLEMENT_TYPE)).default([]),
      hasTruck: z.enum(TRI_STATE).default("any"),
      termPreset: z.enum(TERM_PRESETS).default("any"),
      forecastPreset: z.enum(FORECAST_PRESETS).default("any"),
      finishedPreset: z.enum(FINISHED_PRESETS).default("any"),
      createdPreset: z.enum(CREATED_PRESETS).default("any"),
      termRange: dateRangeSchema,
      forecastRange: dateRangeSchema,
      finishedRange: dateRangeSchema,
      createdRange: dateRangeSchema,
      entryRange: dateRangeSchema,
      isOverdue: z.enum(TRI_STATE).default("any"),
      hasObservation: z.enum(TRI_STATE).default("any"),
      hasBudget: z.enum(TRI_STATE).default("any"),
      // Tri-state shortcut: filter tasks to (or away from) the logged-in
      // user's own sector without having to know its UUID. When set to
      // "yes"/"no" this OVERRIDES `sectorIds` — the runtime injects the
      // current user's `sector.id` (read from useAuth) before the query
      // fires. When "any", `sectorIds` is used as normal.
      mySector: z.enum(TRI_STATE).default("any"),
      // SO / artwork tri-states — present in web schema. Persist them on
      // mobile so cross-platform round-tripping doesn't drop the values.
      hasOpenSO: z.enum(TRI_STATE).default("any"),
      hasArtworks: z.enum(TRI_STATE).default("any"),
      // Completion / commission tri-states — mirror web's task-table filter
      // set so saved configs round-trip cleanly across platforms.
      isCompleted: z.enum(TRI_STATE).default("any"),
      isCommissioned: z.enum(TRI_STATE).default("any"),
      serviceOrderTypes: z.array(z.nativeEnum(SERVICE_ORDER_TYPE)).default([]),
      quoteStatuses: z.array(z.nativeEnum(TASK_QUOTE_STATUS)).default([]),
      defaultSearch: z.string().default(""),
    })
    .default({
      status: [],
      sectorIds: [],
      customerIds: [],
      assigneeIds: [],
      commissions: [],
      truckCategories: [],
      implementTypes: [],
      hasTruck: "any",
      termPreset: "any",
      forecastPreset: "any",
      finishedPreset: "any",
      createdPreset: "any",
      termRange: { from: null, to: null },
      forecastRange: { from: null, to: null },
      finishedRange: { from: null, to: null },
      createdRange: { from: null, to: null },
      entryRange: { from: null, to: null },
      isOverdue: "any",
      hasObservation: "any",
      hasBudget: "any",
      mySector: "any",
      hasOpenSO: "any",
      hasArtworks: "any",
      isCompleted: "any",
      isCommissioned: "any",
      serviceOrderTypes: [],
      quoteStatuses: [],
      defaultSearch: "",
    }),

  sort: z
    .object({
      key: z.enum(TASK_SORT_KEYS).default("term"),
      direction: z.enum(["asc", "desc"]).default("asc"),
    })
    .default({ key: "term", direction: "asc" }),

  /** Multi-sort. Capped at 3 entries on mobile (web allows 5) — see
   *  MOBILE_WIDGETS_SPEC §6.1 mobile gaps. Falls back to `sort` when empty. */
  sorts: z
    .array(
      z.object({
        key: z.string(),
        direction: z.enum(["asc", "desc"]),
      }),
    )
    .max(3)
    .default([{ key: "term", direction: "asc" }]),

  limit: z.number().int().min(5).max(200).default(20),

  behavior: z
    .object({
      viewAllRouteOverride: z.string().default(""),
    })
    .default({ viewAllRouteOverride: "" }),

  accent: makeAccentSchema({
    color: "teal",
    icon: "ClipboardText",
    borderColor: "none",
  }),
});
type Config = z.infer<typeof configSchema>;

// ---------------------------------------------------------------------------
// Date helpers
// ---------------------------------------------------------------------------

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function dateRangeFor(
  preset:
    | (typeof TERM_PRESETS)[number]
    | (typeof FORECAST_PRESETS)[number]
    | (typeof FINISHED_PRESETS)[number]
    | (typeof CREATED_PRESETS)[number],
): { gte?: Date; lte?: Date } | null {
  const today = startOfToday();
  const endToday = new Date(today);
  endToday.setHours(23, 59, 59, 999);
  switch (preset) {
    case "any":
      return null;
    case "today":
      return { gte: today, lte: endToday };
    case "overdue":
      return { lte: today };
    case "next-7-days": {
      const e = new Date(today);
      e.setDate(e.getDate() + 7);
      return { gte: today, lte: e };
    }
    case "next-30-days": {
      const e = new Date(today);
      e.setDate(e.getDate() + 30);
      return { gte: today, lte: e };
    }
    case "this-month": {
      const s = new Date(today.getFullYear(), today.getMonth(), 1);
      const e = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59);
      return { gte: s, lte: e };
    }
    case "last-7-days": {
      const s = new Date(today);
      s.setDate(s.getDate() - 7);
      return { gte: s, lte: endToday };
    }
    case "last-30-days": {
      const s = new Date(today);
      s.setDate(s.getDate() - 30);
      return { gte: s, lte: endToday };
    }
  }
  return null;
}

function rangeFromCalendar(
  range: { from: string | null; to: string | null } | null | undefined,
): { gte?: Date; lte?: Date } | null {
  if (!range) return null;
  const from = range.from ? new Date(range.from) : null;
  const to = range.to ? new Date(range.to) : null;
  if (!from && !to) return null;
  const out: { gte?: Date; lte?: Date } = {};
  if (from) out.gte = from;
  if (to) out.lte = to;
  return out;
}

function formatDateTime(d: Date | string | null | undefined): string {
  if (!d) return "—";
  const x = new Date(d);
  if (Number.isNaN(x.getTime())) return "—";
  const dd = String(x.getDate()).padStart(2, "0");
  const mm = String(x.getMonth() + 1).padStart(2, "0");
  const hh = String(x.getHours()).padStart(2, "0");
  const mi = String(x.getMinutes()).padStart(2, "0");
  return `${dd}/${mm} ${hh}:${mi}`;
}

function formatDateOnly(d: Date | string | null | undefined): string {
  if (!d) return "—";
  const x = new Date(d);
  if (Number.isNaN(x.getTime())) return "—";
  const dd = String(x.getDate()).padStart(2, "0");
  const mm = String(x.getMonth() + 1).padStart(2, "0");
  const yy = String(x.getFullYear()).slice(2);
  return `${dd}/${mm}/${yy}`;
}

function formatBRL(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "—";
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

function isOverdue(
  termIso: string | Date | null | undefined,
  status: TASK_STATUS,
): boolean {
  if (status === TASK_STATUS.COMPLETED || status === TASK_STATUS.CANCELLED) {
    return false;
  }
  if (!termIso) return false;
  const t = new Date(termIso).getTime();
  if (Number.isNaN(t)) return false;
  return t - Date.now() < 0;
}

function deadlineHexFor(
  termIso: string | Date | null | undefined,
  status: TASK_STATUS,
  config: Config["deadlineColors"],
  fallbackMuted: string,
): string {
  if (!config.enabled) return fallbackMuted;
  if (status === TASK_STATUS.COMPLETED) {
    return paletteHex(config.termOnTrackColor, "#16a34a");
  }
  if (status === TASK_STATUS.CANCELLED) return fallbackMuted;
  if (!termIso) return fallbackMuted;
  const t = new Date(termIso).getTime();
  if (Number.isNaN(t)) return fallbackMuted;
  const ms = t - Date.now();
  if (ms < 0) return paletteHex(config.termOverdueColor, "#dc2626");
  if (ms / 3_600_000 <= (config.termCriticalHours ?? 4)) {
    return paletteHex(config.termCriticalColor, "#d97706");
  }
  return paletteHex(config.termOnTrackColor, "#16a34a");
}

function forecastHexFor(
  forecastIso: string | Date | null | undefined,
  status: TASK_STATUS,
  config: Config["deadlineColors"],
  fallbackMuted: string,
): string {
  if (!config.enabled || !forecastIso) return fallbackMuted;
  if (status === TASK_STATUS.COMPLETED || status === TASK_STATUS.CANCELLED) {
    return fallbackMuted;
  }
  const t = new Date(forecastIso).getTime();
  if (Number.isNaN(t)) return fallbackMuted;
  const days = (t - Date.now()) / (1000 * 60 * 60 * 24);
  if (days <= (config.forecastCriticalDays ?? 3)) {
    return paletteHex(config.forecastCriticalColor, "#ef4444");
  }
  if (days <= (config.forecastWarningDays ?? 7)) {
    return paletteHex(config.forecastWarningColor, "#f97316");
  }
  if (days <= (config.forecastNoticeDays ?? 10)) {
    return paletteHex(config.forecastNoticeColor, "#eab308");
  }
  return fallbackMuted;
}

function customerLabel(
  c?: { fantasyName?: string; corporateName?: string } | null,
): string {
  if (!c) return "—";
  return c.fantasyName || c.corporateName || "—";
}

// ---------------------------------------------------------------------------
// Query builder
// ---------------------------------------------------------------------------

const TASK_INCLUDE = {
  customer: true,
  sector: true,
  generalPainting: true,
  responsibles: true,
  serviceOrders: true,
  observation: true,
  quote: true,
};

function buildWhere(
  config: Config,
  runtimeStatus: TASK_STATUS | undefined,
  userSectorId: string | undefined,
): Record<string, any> {
  const where: Record<string, any> = {};
  const ANDs: Array<Record<string, any>> = [];
  const f = config.filters;

  if (runtimeStatus) {
    where.status = runtimeStatus;
  } else if (f.status.length > 0) {
    where.status = { in: f.status };
  }

  // mySector tri-state takes priority over the multi-select sectorIds. When
  // the user has no sector binding on their profile mySector silently
  // degrades to "any" — otherwise "yes"/"no" with no userSectorId would
  // produce an unsatisfiable predicate and the table would always be empty.
  if (f.mySector === "yes" && userSectorId) {
    where.sectorId = userSectorId;
  } else if (f.mySector === "no" && userSectorId) {
    ANDs.push({ sectorId: { not: userSectorId } });
    if (f.sectorIds.length > 0) {
      ANDs.push({ sectorId: { in: f.sectorIds } });
    }
  } else if (f.sectorIds.length > 0) {
    where.sectorId = { in: f.sectorIds };
  }
  if (f.customerIds.length > 0) where.customerId = { in: f.customerIds };
  if (f.commissions.length > 0) where.commission = { in: f.commissions };

  // Truck-related filters — pushed onto the AND chain so multiple truck
  // predicates compose (e.g. "has truck" + "category in [...]").
  if (f.hasTruck === "yes") ANDs.push({ truck: { isNot: null as any } });
  if (f.hasTruck === "no") ANDs.push({ truck: null as any });
  if (f.truckCategories.length > 0) {
    ANDs.push({ truck: { category: { in: f.truckCategories } } });
  }
  if (f.implementTypes.length > 0) {
    ANDs.push({ truck: { implementType: { in: f.implementTypes } } });
  }

  const term = rangeFromCalendar(f.termRange) ?? dateRangeFor(f.termPreset);
  if (term) where.term = term;
  const forecast =
    rangeFromCalendar(f.forecastRange) ?? dateRangeFor(f.forecastPreset);
  if (forecast) where.forecastDate = forecast;
  const finished =
    rangeFromCalendar(f.finishedRange) ?? dateRangeFor(f.finishedPreset);
  if (finished) where.finishedAt = finished;
  const created =
    rangeFromCalendar(f.createdRange) ?? dateRangeFor(f.createdPreset);
  if (created) where.createdAt = created;
  const entry = rangeFromCalendar(f.entryRange);
  if (entry) where.entryDate = entry;

  if (f.hasObservation === "yes") {
    ANDs.push({ observation: { isNot: null as any } });
  } else if (f.hasObservation === "no") {
    ANDs.push({ observation: null as any });
  }

  if (f.hasBudget === "yes") ANDs.push({ quote: { isNot: null as any } });
  if (f.hasBudget === "no") ANDs.push({ quote: null as any });

  // Open SO presence — same status whitelist as web's task-table.
  if (f.hasOpenSO === "yes") {
    ANDs.push({
      serviceOrders: {
        some: {
          status: {
            in: ["PENDING", "IN_PROGRESS", "PAUSED", "WAITING_APPROVE"],
          },
        },
      },
    });
  } else if (f.hasOpenSO === "no") {
    ANDs.push({
      OR: [
        { serviceOrders: { none: {} } },
        {
          serviceOrders: {
            every: { status: { in: ["COMPLETED", "CANCELLED"] } },
          },
        },
      ],
    });
  }

  if (f.hasArtworks === "yes") ANDs.push({ artworks: { some: {} } });
  if (f.hasArtworks === "no") ANDs.push({ artworks: { none: {} } });

  // Completion tri-state — yes/no narrows by COMPLETED status. Skipped when
  // runtimeStatus already pins a status (status tabs/grouped layout).
  if (!runtimeStatus) {
    if (f.isCompleted === "yes") {
      ANDs.push({ status: TASK_STATUS.COMPLETED });
    } else if (f.isCompleted === "no") {
      ANDs.push({ status: { not: TASK_STATUS.COMPLETED } });
    }
  }

  // Commission tri-state — yes = any commission ≠ NO_COMMISSION,
  // no = NO_COMMISSION. Composes with the multi-select `commissions` filter.
  if (f.isCommissioned === "yes") {
    ANDs.push({ commission: { not: COMMISSION_STATUS.NO_COMMISSION } });
  } else if (f.isCommissioned === "no") {
    ANDs.push({ commission: COMMISSION_STATUS.NO_COMMISSION });
  }

  if (f.serviceOrderTypes.length > 0) {
    ANDs.push({
      serviceOrders: { some: { type: { in: f.serviceOrderTypes } } },
    });
  }

  if (f.quoteStatuses.length > 0) {
    ANDs.push({ quote: { is: { status: { in: f.quoteStatuses } } } });
  }

  if (f.isOverdue === "no") {
    ANDs.push({
      OR: [
        { term: null },
        { term: { gte: startOfToday() } },
        { status: { in: [TASK_STATUS.COMPLETED, TASK_STATUS.CANCELLED] } },
      ],
    });
  }

  if (ANDs.length > 0) where.AND = ANDs;
  return where;
}

function buildOrderBy(config: Config): Array<Record<string, "asc" | "desc">> {
  if (config.sorts && config.sorts.length > 0) {
    return config.sorts.map((s) => {
      // customerName is a relation — translate to nested orderBy.
      if (s.key === "customerName") {
        return { customer: { fantasyName: s.direction } } as any;
      }
      return { [s.key]: s.direction };
    });
  }
  return [{ [config.sort.key]: config.sort.direction }];
}

// ---------------------------------------------------------------------------
// Render helpers per cell
// ---------------------------------------------------------------------------

interface CellRenderCtx {
  config: Config;
  display: TableDisplay & {
    showViewAllLink?: boolean;
    showCount?: boolean;
    layoutMode?: (typeof LAYOUT_MODES)[number];
  };
  isDark: boolean;
  colors: ReturnType<typeof useTheme>["colors"];
  density: Density;
  cellFontSize: number;
  metaFontSize: number;
}

// ---------------------------------------------------------------------------
// Column widths (mobile-tuned). flex columns absorb leftover horizontal space.
// ---------------------------------------------------------------------------

const TASK_COLUMN_DEFS: Record<TaskColumnKey, WidgetTableColumn> = {
  task: { key: "task", label: TASK_COLUMN_LABELS.task, flex: 1 },
  customerName: {
    key: "customerName",
    label: TASK_COLUMN_LABELS.customerName,
    flex: 1,
  },
  serialNumber: {
    key: "serialNumber",
    label: TASK_COLUMN_LABELS.serialNumber,
    width: 70,
  },
  status: {
    key: "status",
    label: TASK_COLUMN_LABELS.status,
    width: 100,
    align: "right",
  },
  sector: { key: "sector", label: TASK_COLUMN_LABELS.sector, width: 90 },
  responsibles: {
    key: "responsibles",
    label: TASK_COLUMN_LABELS.responsibles,
    width: 100,
  },
  term: {
    key: "term",
    label: TASK_COLUMN_LABELS.term,
    width: 96,
    align: "right",
  },
  forecastDate: {
    key: "forecastDate",
    label: TASK_COLUMN_LABELS.forecastDate,
    width: 80,
    align: "right",
  },
  createdAt: {
    key: "createdAt",
    label: TASK_COLUMN_LABELS.createdAt,
    width: 80,
    align: "right",
  },
  commission: {
    key: "commission",
    label: TASK_COLUMN_LABELS.commission,
    width: 90,
  },
  quoteStatus: {
    key: "quoteStatus",
    label: TASK_COLUMN_LABELS.quoteStatus,
    width: 96,
  },
  quoteTotal: {
    key: "quoteTotal",
    label: TASK_COLUMN_LABELS.quoteTotal,
    width: 90,
    align: "right",
  },
};

function columnDefWith(
  key: TaskColumnKey,
  customLabel: string | undefined,
): WidgetTableColumn {
  const base = TASK_COLUMN_DEFS[key];
  if (!customLabel || !customLabel.trim()) return base;
  return { ...base, label: customLabel.trim() };
}

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------

function Render({ config, size }: WidgetRenderProps<Config>) {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const accent = resolveAccent({
    color: config.accent?.color as WidgetAccentColor,
    icon: config.accent?.icon as WidgetAccentIcon,
  });
  const Icon = accent.Icon;

  // The makeTableDisplaySchema().and(...) intersection makes `display` a
  // TableDisplay merged with the layoutMode/showViewAllLink/showCount addon.
  const display = (config.display ?? TABLE_DISPLAY_DEFAULTS) as TableDisplay & {
    showViewAllLink?: boolean;
    showCount?: boolean;
    layoutMode?: (typeof LAYOUT_MODES)[number];
  };
  const density = display.density as Density;
  const layoutMode = display.layoutMode ?? "flat";
  const showViewAllLink = display.showViewAllLink ?? true;
  const showCount = display.showCount ?? true;

  const [search, setSearch] = useState(config.filters.defaultSearch ?? "");
  const [activeStatusTab, setActiveStatusTab] = useState<TASK_STATUS | "ALL">(
    "ALL",
  );

  const runtimeStatus =
    layoutMode === "tabs" && activeStatusTab !== "ALL"
      ? activeStatusTab
      : undefined;

  // Auth is hoisted above the query memo so the `mySector` filter can inject
  // the logged-in user's sector id into the where clause at query-build time.
  // The same `user` is also used downstream to gate financial columns.
  const { user } = useAuth();
  const userSectorId = user?.sector?.id ?? undefined;
  const sectorPrivilege = user?.sector?.privileges as SECTOR_PRIVILEGES | undefined;
  const canSeeFinancials = canViewTaskFinancialColumns(sectorPrivilege);

  const queryParams = useMemo(() => {
    const where = buildWhere(config, runtimeStatus, userSectorId);
    const orderBy = buildOrderBy(config);
    const term = (search.trim() || config.filters.defaultSearch.trim()) || "";
    return {
      where,
      orderBy: orderBy as any,
      take: config.limit,
      include: TASK_INCLUDE,
      ...(term ? { searchingFor: term } : {}),
      ...(config.filters.assigneeIds.length > 0
        ? { createdByIds: config.filters.assigneeIds }
        : {}),
      ...(config.filters.isOverdue === "yes" ? { isOverdue: true } : {}),
    };
  }, [config, runtimeStatus, search, userSectorId]);

  const refetchMs = Number(display.refetchInterval ?? "0");
  const { data, isLoading, isError, refetch, isRefetching } = useTasks(
    queryParams as any,
    refetchMs > 0 ? { refetchInterval: Math.max(5000, refetchMs) } : undefined,
  );
  const rows = (data?.data ?? []) as any[];

  // Pause auto-refetch when the device is "hidden" — RN doesn't expose
  // document.visibilityState, but we honor the same intent via AppState in
  // future work. For now refetchInterval handles the polling.

  // Visible columns in display order — schema guarantees `task` is included.
  const visibleCols: TaskColumnKey[] = useMemo(() => {
    const cols = (config.columns?.length ? config.columns : ["task"]) as TaskColumnKey[];
    return cols
      .filter((k): k is TaskColumnKey =>
        (TASK_COLUMN_KEYS as readonly string[]).includes(k),
      )
      .filter((k) => canSeeFinancials || !isTaskFinancialColumn(k));
  }, [config.columns, canSeeFinancials]);

  // Build the list of rendered columns. cellModes.status === "badge" lives in
  // the status cell's column (96px); dot-label/text use the same column.
  const renderedColumns: WidgetTableColumn[] = visibleCols.map((k) =>
    columnDefWith(k, config.columnLabels?.[k]),
  );

  // Resolve detail href based on rowClickTarget. Each target has a separate
  // /(tabs) deep-link. Falls back to the production schedule detail.
  const rowClickTarget = config.rowClickTarget ?? "task";
  const detailHref = (taskId: string): string => {
    if (rowClickTarget === "budget") {
      return `/(tabs)/financeiro/orcamento/detalhes/${taskId}`;
    }
    if (rowClickTarget === "billing") {
      return `/(tabs)/financeiro/faturamento/detalhes/${taskId}`;
    }
    return `/(tabs)/producao/cronograma/detalhes/${taskId}`;
  };
  const viewAllHref =
    config.behavior?.viewAllRouteOverride?.trim() ||
    (rowClickTarget === "budget"
      ? "/(tabs)/financeiro/orcamento"
      : rowClickTarget === "billing"
        ? "/(tabs)/financeiro/faturamento"
        : "/(tabs)/producao/cronograma");

  // Tabs strip (layoutMode === "tabs") — top-level horizontal status filter.
  const tabsStrip =
    layoutMode === "tabs" ? (
      <View
        style={{
          flexDirection: "row",
          flexWrap: "wrap",
          gap: 4,
          paddingHorizontal: 8,
          paddingTop: 6,
          paddingBottom: 6,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        }}
      >
        {(["ALL", ...Object.values(TASK_STATUS)] as Array<TASK_STATUS | "ALL">).map(
          (s) => {
            const active = activeStatusTab === s;
            const label =
              s === "ALL" ? "Todos" : TASK_STATUS_LABELS[s as TASK_STATUS];
            // Cardinal-rule fix: layout/visual chrome (border, radius, bg)
            // lives on the outer View. Pressable is a transparent tap
            // surface so iOS reliably applies the chrome.
            return (
              <View
                key={s}
                style={{
                  borderRadius: 999,
                  backgroundColor: active
                    ? accent.hex + (isDark ? "33" : "22")
                    : "transparent",
                  borderWidth: 1,
                  borderColor: active ? accent.hex : colors.border,
                  overflow: "hidden",
                }}
              >
                <Pressable
                  onPress={() => {
                    lightImpactHaptic();
                    setActiveStatusTab(s);
                  }}
                  android_ripple={{ color: "rgba(0,0,0,0.08)" }}
                  style={{
                    paddingHorizontal: 10,
                    paddingVertical: 4,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 11,
                      fontWeight: active ? "700" : "500",
                      color: active ? accent.hex : colors.mutedForeground,
                    }}
                  >
                    {label}
                  </Text>
                </Pressable>
              </View>
            );
          },
        )}
      </View>
    ) : null;

  // Group dividers for layoutMode === "grouped-by-status".
  const filtered = useMemo(() => rows, [rows]);
  const grouped: Array<{ kind: "header"; status: TASK_STATUS } | { kind: "row"; task: any; index: number }> =
    useMemo(() => {
      if (layoutMode !== "grouped-by-status") {
        return filtered.map((task, i) => ({ kind: "row", task, index: i }) as const);
      }
      const out: Array<
        | { kind: "header"; status: TASK_STATUS }
        | { kind: "row"; task: any; index: number }
      > = [];
      let prev: TASK_STATUS | null = null;
      filtered.forEach((task, i) => {
        if (task.status !== prev) {
          out.push({ kind: "header", status: task.status });
          prev = task.status as TASK_STATUS;
        }
        out.push({ kind: "row", task, index: i });
      });
      return out;
    }, [filtered, layoutMode]);

  return (
    <WidgetCard
      title={config.title || "Tarefas"}
      icon={<Icon size={16} color={accent.hex} />}
      viewAllHref={showViewAllLink ? viewAllHref : undefined}
      showHeader={config.showHeader}
      density={density}
      bodyPadded={false}
      bodyMaxHeight={computeBodyMaxHeight(size.rows)}
      accentColor={accent.hex}
        borderColor={borderHexFor(config.accent?.borderColor as WidgetBorderColor)}
      count={showCount ? filtered.length : null}
      onRefresh={refetch}
      refreshing={isRefetching}
    >
      {tabsStrip}
      <WidgetTableContainer density={density}>
        {display.showSearchBox && (
          <WidgetTableSearch
            value={search}
            onChangeText={setSearch}
            placeholder="Buscar tarefa, cliente ou OS..."
          />
        )}
        {display.showColumnHeaders && (
          <WidgetTableHeader
            columns={renderedColumns}
            // Reserve the leading-dot slot only when the generic accent dot
            // (`showRowDot`) is enabled. Paint color no longer renders as a
            // leading dot — it's applied to the task-name text directly — so
            // the header sits flush with the row content.
            reserveRowDot={display.showRowDot}
            density={density}
          />
        )}

        {isLoading ? (
          <SkeletonRows count={5} density={density} />
        ) : isError ? (
          <WidgetErrorState
            message="Erro ao carregar tarefas."
            onRetry={() => refetch()}
          />
        ) : filtered.length === 0 ? (
          <WidgetTableMessage>
            <Text
              style={{
                fontSize: 12,
                color: colors.mutedForeground,
                textAlign: "center",
              }}
            >
              {display.emptyStateMessage || "Nenhuma tarefa encontrada."}
            </Text>
          </WidgetTableMessage>
        ) : (
          grouped.map((entry, gIdx) => {
            if (entry.kind === "header") {
              return (
                <GroupHeader
                  key={`g-${entry.status}-${gIdx}`}
                  status={entry.status}
                  isDark={isDark}
                />
              );
            }
            const t = entry.task;
            const idx = entry.index;
            return (
              <TaskRow
                key={t.id}
                task={t}
                index={idx}
                config={config}
                display={display}
                density={density}
                visibleCols={visibleCols}
                renderedColumns={renderedColumns}
                accentHex={accent.hex}
                isDark={isDark}
                colors={colors}
                onPress={() => router.push(detailHref(t.id) as any)}
              />
            );
          })
        )}
      </WidgetTableContainer>
    </WidgetCard>
  );
}

// ---------------------------------------------------------------------------
// Group header (layoutMode === "grouped-by-status")
// ---------------------------------------------------------------------------

function GroupHeader({
  status,
  isDark,
}: {
  status: TASK_STATUS;
  isDark: boolean;
}) {
  const tone = toneForTaskStatus(status, isDark);
  return (
    <View
      style={{
        marginHorizontal: -12,
        paddingHorizontal: 12,
        paddingVertical: 4,
        backgroundColor: tone.bg + (isDark ? "33" : "22"),
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: tone.border + (isDark ? "55" : "44"),
      }}
    >
      <Text
        style={{
          fontSize: 10,
          fontWeight: "700",
          letterSpacing: 0.6,
          textTransform: "uppercase",
          color: tone.fg,
        }}
      >
        {TASK_STATUS_LABELS[status]}
      </Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// TaskRow — pulled into its own component so the row's render logic stays
// readable. No state of its own; delegates to WidgetTableRow.
// ---------------------------------------------------------------------------

interface TaskRowProps {
  task: any;
  index: number;
  config: Config;
  display: TableDisplay & {
    showViewAllLink?: boolean;
    showCount?: boolean;
    layoutMode?: (typeof LAYOUT_MODES)[number];
  };
  density: Density;
  visibleCols: TaskColumnKey[];
  renderedColumns: WidgetTableColumn[];
  accentHex: string;
  isDark: boolean;
  colors: ReturnType<typeof useTheme>["colors"];
  onPress: () => void;
}

function TaskRow({
  task,
  index,
  config,
  display,
  density,
  visibleCols,
  renderedColumns,
  accentHex,
  isDark,
  colors,
  onPress,
}: TaskRowProps) {
  const tone = toneForTaskStatus(task.status as TASK_STATUS, isDark) ?? {
    bg: colors.muted,
    fg: colors.mutedForeground,
    border: colors.border,
  };
  const dlColor = deadlineHexFor(
    task.term,
    task.status as TASK_STATUS,
    config.deadlineColors,
    colors.mutedForeground,
  );
  const fcColor = forecastHexFor(
    task.forecastDate,
    task.status as TASK_STATUS,
    config.deadlineColors,
    colors.mutedForeground,
  );
  const overdue = isOverdue(task.term, task.status as TASK_STATUS);
  const paintHex =
    task.generalPainting?.hex ||
    task.generalPainting?.paint?.hex ||
    null;
  const paintName =
    task.generalPainting?.name ||
    task.generalPainting?.paint?.name ||
    null;
  const cellFontSize = densityClasses(density).fontSize;
  const metaFontSize = Math.max(10, cellFontSize - 2);
  const customer = customerLabel(task.customer);
  const sectorName = task.sector?.name ?? null;
  const fontWeightBold: "600" | "700" = config.deadlineColors?.bold ? "700" : "600";

  // Row leading dot is reserved ONLY for the widget accent (`showRowDot`).
  // Paint color used to render as a leading dot here; that approach produced
  // disconnected indicators and forced the header to reserve 12px even when
  // most rows had no paint, throwing off the visual alignment of the TAREFA
  // column. Paint color now flows into the task-name text directly — see the
  // "task" case below.
  const rowDotHex = display.showRowDot ? accentHex : undefined;

  return (
    <WidgetTableRow
      density={density}
      index={index}
      striping={display.striping}
      gridLines={display.gridLines}
      hoverHighlight={display.hoverHighlight}
      rowDotColor={rowDotHex}
      onPress={onPress}
    >
      {visibleCols.map((key, colIdx) => {
        const def = renderedColumns[colIdx];
        switch (key) {
          case "task": {
            // Single-line task cell. Paint color is applied to the task-name
            // text itself when the widget has `showPaintDot` enabled and the
            // task carries a paint hex — replacing the legacy leading-dot
            // indicator. Paint name (when cellMode is "swatch-name" / "name")
            // is appended inline as a muted suffix.
            const showPaintNameInline =
              !!paintName &&
              (config.cellModes?.paint === "swatch-name" ||
                config.cellModes?.paint === "name");
            const taskNameColor =
              config.showPaintDot && paintHex ? paintHex : colors.foreground;
            return (
              <View key={key} style={cellStyleForColumn(def)}>
                <Text
                  numberOfLines={1}
                  style={{
                    flex: 1,
                    minWidth: 0,
                    fontSize: cellFontSize,
                    fontWeight: "600",
                    color: taskNameColor,
                  }}
                >
                  {task.name ?? "—"}
                  {showPaintNameInline && (
                    <Text
                      style={{
                        fontWeight: "400",
                        color: colors.mutedForeground,
                      }}
                    >
                      {" · "}
                      {paintName}
                    </Text>
                  )}
                </Text>
              </View>
            );
          }
          case "customerName":
            return (
              <View key={key} style={cellStyleForColumn(def)}>
                <Text
                  numberOfLines={1}
                  style={{
                    fontSize: cellFontSize,
                    color: colors.foreground,
                  }}
                >
                  {customer}
                </Text>
              </View>
            );
          case "serialNumber":
            return (
              <View key={key} style={cellStyleForColumn(def)}>
                <Text
                  numberOfLines={1}
                  style={{
                    fontSize: metaFontSize,
                    color: colors.mutedForeground,
                    fontVariant: ["tabular-nums"],
                  }}
                >
                  {task.serialNumber ?? "—"}
                </Text>
              </View>
            );
          case "sector":
            return (
              <View key={key} style={cellStyleForColumn(def)}>
                <Text
                  numberOfLines={1}
                  style={{
                    fontSize: metaFontSize,
                    color: colors.mutedForeground,
                  }}
                >
                  {sectorName ?? "—"}
                </Text>
              </View>
            );
          case "responsibles": {
            const list = (task.responsibles ?? []) as Array<{
              id: string;
              name?: string;
            }>;
            const text = list.length
              ? list.map((r) => r.name?.split(" ")[0] ?? "").filter(Boolean).join(", ")
              : "—";
            return (
              <View key={key} style={cellStyleForColumn(def)}>
                <Text
                  numberOfLines={1}
                  style={{
                    fontSize: metaFontSize,
                    color: colors.mutedForeground,
                  }}
                >
                  {text}
                </Text>
              </View>
            );
          }
          case "status": {
            const mode = config.cellModes?.status ?? "badge";
            if (mode === "text") {
              return (
                <View key={key} style={cellStyleForColumn(def)}>
                  <Text
                    numberOfLines={1}
                    style={{
                      fontSize: metaFontSize,
                      fontWeight: "600",
                      color: tone.bg,
                    }}
                  >
                    {TASK_STATUS_LABELS[task.status as TASK_STATUS] ?? task.status}
                  </Text>
                </View>
              );
            }
            if (mode === "dot-label") {
              return (
                <View
                  key={key}
                  style={{
                    ...cellStyleForColumn(def),
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <View
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: tone.bg,
                    }}
                  />
                  <Text
                    numberOfLines={1}
                    style={{
                      fontSize: metaFontSize,
                      fontWeight: "600",
                      color: colors.foreground,
                    }}
                  >
                    {TASK_STATUS_LABELS[task.status as TASK_STATUS] ?? task.status}
                  </Text>
                </View>
              );
            }
            // default — badge
            return (
              <View key={key} style={cellStyleForColumn(def)}>
                <View
                  style={{
                    backgroundColor: tone.bg,
                    paddingHorizontal: 8,
                    paddingVertical: 2,
                    borderRadius: 12,
                  }}
                >
                  <Text
                    numberOfLines={1}
                    style={{
                      fontSize: metaFontSize,
                      fontWeight: "600",
                      color: tone.fg,
                    }}
                  >
                    {TASK_STATUS_LABELS[task.status as TASK_STATUS] ?? task.status}
                  </Text>
                </View>
              </View>
            );
          }
          case "term":
            return (
              <View
                key={key}
                style={{
                  ...cellStyleForColumn(def),
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "flex-end",
                  gap: 3,
                }}
              >
                {overdue && (
                  <IconAlertTriangle
                    size={11}
                    color={dlColor}
                    accessibilityLabel="Tarefa atrasada"
                  />
                )}
                <Text
                  numberOfLines={1}
                  style={{
                    fontSize: metaFontSize,
                    fontWeight: overdue ? fontWeightBold : "600",
                    color: dlColor,
                    fontVariant: ["tabular-nums"],
                  }}
                >
                  {formatDateTime(task.term)}
                </Text>
              </View>
            );
          case "forecastDate":
            return (
              <View key={key} style={cellStyleForColumn(def)}>
                <Text
                  numberOfLines={1}
                  style={{
                    fontSize: metaFontSize,
                    fontWeight: config.deadlineColors?.bold ? "700" : "500",
                    color: fcColor,
                    fontVariant: ["tabular-nums"],
                  }}
                >
                  {formatDateOnly(task.forecastDate)}
                </Text>
              </View>
            );
          case "createdAt":
            return (
              <View key={key} style={cellStyleForColumn(def)}>
                <Text
                  numberOfLines={1}
                  style={{
                    fontSize: metaFontSize,
                    color: colors.mutedForeground,
                    fontVariant: ["tabular-nums"],
                  }}
                >
                  {formatDateOnly(task.createdAt)}
                </Text>
              </View>
            );
          case "commission":
            return (
              <View key={key} style={cellStyleForColumn(def)}>
                <Text
                  numberOfLines={1}
                  style={{
                    fontSize: metaFontSize,
                    color: colors.mutedForeground,
                  }}
                >
                  {task.commission
                    ? COMMISSION_STATUS_LABELS[task.commission as COMMISSION_STATUS] ??
                      task.commission
                    : "—"}
                </Text>
              </View>
            );
          case "quoteStatus":
            return (
              <View key={key} style={cellStyleForColumn(def)}>
                <Text
                  numberOfLines={1}
                  style={{
                    fontSize: metaFontSize,
                    color: colors.mutedForeground,
                  }}
                >
                  {task.quote?.status
                    ? TASK_QUOTE_STATUS_LABELS[
                        task.quote.status as TASK_QUOTE_STATUS
                      ] ?? task.quote.status
                    : "—"}
                </Text>
              </View>
            );
          case "quoteTotal": {
            const total = task.quote?.totalPrice ?? task.quote?.total ?? null;
            return (
              <View key={key} style={cellStyleForColumn(def)}>
                <Text
                  numberOfLines={1}
                  style={{
                    fontSize: metaFontSize,
                    color: colors.foreground,
                    fontVariant: ["tabular-nums"],
                  }}
                >
                  {formatBRL(total)}
                </Text>
              </View>
            );
          }
        }
      })}
    </WidgetTableRow>
  );
}

// ---------------------------------------------------------------------------
// ConfigComponent
// ---------------------------------------------------------------------------

function ConfigComp({ config, onChange }: WidgetConfigProps<Config>) {
  const { colors } = useTheme();
  const { user } = useAuth();
  const sectorPrivilege = user?.sector?.privileges as SECTOR_PRIVILEGES | undefined;
  const canSeeFinancials = canViewTaskFinancialColumns(sectorPrivilege);
  const pickerCatalog = useMemo(
    () =>
      TASK_COLUMN_PICKER_OPTIONS.filter(
        (opt) => canSeeFinancials || !isTaskFinancialColumn(opt.key),
      ),
    [canSeeFinancials],
  );
  const set = <K extends keyof Config>(key: K, value: Config[K]) =>
    onChange({ ...config, [key]: value });
  const setFilter = <K extends keyof Config["filters"]>(
    key: K,
    value: Config["filters"][K],
  ) => onChange({ ...config, filters: { ...config.filters, [key]: value } });
  const setCellMode = <K extends keyof Config["cellModes"]>(
    key: K,
    value: Config["cellModes"][K],
  ) =>
    onChange({
      ...config,
      cellModes: { ...config.cellModes, [key]: value },
    });
  const setDeadline = <K extends keyof Config["deadlineColors"]>(
    key: K,
    value: Config["deadlineColors"][K],
  ) =>
    onChange({
      ...config,
      deadlineColors: { ...config.deadlineColors, [key]: value },
    });
  const setBehavior = <K extends keyof Config["behavior"]>(
    key: K,
    value: Config["behavior"][K],
  ) =>
    onChange({
      ...config,
      behavior: { ...config.behavior, [key]: value },
    });
  const setDisplay = (next: TableDisplay) =>
    onChange({ ...config, display: { ...(config.display as any), ...next } });

  // Sectors / Customers / Users — fetched only while the modal is open.
  const sectors = useSectors({ take: 100 } as any);
  const customers = useCustomers({ take: 100 } as any);
  const users = useUsers({ take: 100 } as any);

  const sectorOptions = useMemo(
    () =>
      ((sectors as any)?.data?.data ?? []).map((s: any) => ({
        value: s.id,
        label: s.name,
      })),
    [sectors],
  );
  const customerOptions = useMemo(
    () =>
      ((customers as any)?.data?.data ?? []).map((c: any) => ({
        value: c.id,
        label: c.fantasyName || c.corporateName,
      })),
    [customers],
  );
  const userOptions = useMemo(
    () =>
      ((users as any)?.data?.data ?? []).map((u: any) => ({
        value: u.id,
        label: u.name,
      })),
    [users],
  );

  return (
    <View style={{ gap: 12 }}>
      <ConfigTitleInput
        value={config.title}
        onChange={(v) => set("title", v)}
        placeholder="Tarefas"
      />

      <Tabs defaultValue="appearance">
        {/* Horizontally-scrollable TabsList so 5 triggers + descenders fit on
            a 360px viewport without ellipsis. Mirrors web's tabbed config
            shell (web file lines 2435-3070). Each TabsContent below renders
            only when its tab is active — but multiple TabsContent blocks
            can share the same value so we don't need to re-order sections
            in the file. */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 0 }}
        >
          <TabsList style={{ minWidth: 360 }}>
            <TabsTrigger value="appearance">Aparência</TabsTrigger>
            <TabsTrigger value="columns">Colunas</TabsTrigger>
            <TabsTrigger value="filters">Filtros</TabsTrigger>
            <TabsTrigger value="colors">Cores</TabsTrigger>
            <TabsTrigger value="behavior">Comportamento</TabsTrigger>
          </TabsList>
        </ScrollView>

        {/* APPEARANCE TAB — accent picker + display toggles + layout mode +
            cell rendering modes. */}
        <TabsContent value="appearance">

      <Section title="Aparência" defaultOpen>
        <AccentPicker
          value={{
            color: (config.accent?.color ?? "teal") as WidgetAccentColor,
            icon: (config.accent?.icon ?? "ClipboardText") as WidgetAccentIcon,
            borderColor: (config.accent?.borderColor ?? "none") as WidgetBorderColor,
          }}
          onChange={(next) => set("accent", next as Config["accent"])}
        />
      </Section>

      <Section title="Cabeçalho">
        <ToggleRow
          label="Exibir cabeçalho"
          checked={config.showHeader}
          onCheckedChange={(v) => set("showHeader", v)}
        />
        <ToggleRow
          label="Mostrar contador de itens"
          checked={(config.display as any)?.showCount ?? true}
          onCheckedChange={(v) =>
            onChange({
              ...config,
              display: { ...(config.display as any), showCount: v },
            })
          }
        />
      </Section>

      <Section title="Tarefa">
        <ToggleRow
          label="Bolinha de pintura"
          hint="Mostra a cor da pintura geral antes do nome da tarefa."
          checked={config.showPaintDot}
          onCheckedChange={(v) => set("showPaintDot", v)}
        />
      </Section>
        </TabsContent>

        {/* BEHAVIOR TAB (part 1 of 3) — row click target + custom view-all
            route. The other two BEHAVIOR fragments (Limite and Refresh) sit
            later in the file but share the same value so they're rendered
            together when this tab is active. */}
        <TabsContent value="behavior">
      <Section title="Comportamento" defaultOpen={false}>
        <View style={{ gap: 4 }}>
          <Text style={{ fontSize: 12, color: colors.foreground }}>
            Destino do toque na linha
          </Text>
          <Combobox
            value={config.rowClickTarget}
            onValueChange={(v: any) =>
              set(
                "rowClickTarget",
                (typeof v === "string" ? v : "task") as Config["rowClickTarget"],
              )
            }
            options={ROW_CLICK_TARGET_OPTIONS}
          />
          <Text style={{ fontSize: 11, color: colors.mutedForeground }}>
            Define para qual tela a tarefa abre quando o usuário tocar em uma
            linha. O atalho "Ver todos" do rodapé acompanha esta escolha.
          </Text>
        </View>
        <View style={{ gap: 4 }}>
          <Text style={{ fontSize: 12, color: colors.foreground }}>
            Rota "Ver todos" personalizada
          </Text>
          <Input
            value={config.behavior?.viewAllRouteOverride ?? ""}
            onChangeText={(v: string) =>
              setBehavior("viewAllRouteOverride", v)
            }
            placeholder="(opcional) /(tabs)/producao/cronograma"
          />
          <Text style={{ fontSize: 11, color: colors.mutedForeground }}>
            Sobrescreve o link do rodapé. Deixe em branco para usar o destino
            padrão da escolha acima.
          </Text>
        </View>
      </Section>
        </TabsContent>

        {/* APPEARANCE TAB (part 2 of 3) — display config + layout mode +
            cell modes. */}
        <TabsContent value="appearance">
      <TableDisplayConfigSection
        value={config.display as TableDisplay}
        onChange={setDisplay}
      />

      <Section title="Layout">
        <View style={{ gap: 4 }}>
          <Text style={{ fontSize: 12, color: colors.foreground }}>
            Modo de exibição
          </Text>
          <Combobox
            value={
              ((config.display as any)?.layoutMode ?? "flat") as string
            }
            onValueChange={(v: any) => {
              const next = (typeof v === "string" ? v : "flat") as
                (typeof LAYOUT_MODES)[number];
              onChange({
                ...config,
                display: { ...(config.display as any), layoutMode: next },
              });
            }}
            options={LAYOUT_MODE_OPTIONS}
          />
          <Text style={{ fontSize: 11, color: colors.mutedForeground }}>
            "Linear" exibe uma lista contínua. "Agrupado" insere cabeçalhos por
            status. "Abas" adiciona uma faixa superior com filtros rápidos.
          </Text>
        </View>
        <ToggleRow
          label="Mostrar link 'Ver todos'"
          checked={(config.display as any)?.showViewAllLink ?? true}
          onCheckedChange={(v) =>
            onChange({
              ...config,
              display: { ...(config.display as any), showViewAllLink: v },
            })
          }
        />
      </Section>

      <Section title="Estilo das células">
        <View style={{ gap: 4 }}>
          <Text style={{ fontSize: 12, color: colors.foreground }}>Status</Text>
          <Combobox
            value={config.cellModes?.status ?? "badge"}
            onValueChange={(v: any) =>
              setCellMode(
                "status",
                (typeof v === "string" ? v : "badge") as Config["cellModes"]["status"],
              )
            }
            options={STATUS_CELL_MODE_OPTIONS}
          />
        </View>
        <View style={{ gap: 4 }}>
          <Text style={{ fontSize: 12, color: colors.foreground }}>
            Pintura
          </Text>
          <Combobox
            value={config.cellModes?.paint ?? "swatch-name"}
            onValueChange={(v: any) =>
              setCellMode(
                "paint",
                (typeof v === "string" ? v : "swatch-name") as Config["cellModes"]["paint"],
              )
            }
            options={PAINT_CELL_MODE_OPTIONS}
          />
        </View>
        <View style={{ gap: 4 }}>
          <Text style={{ fontSize: 12, color: colors.foreground }}>
            Ordens de serviço
          </Text>
          <Combobox
            value={config.cellModes?.serviceOrder ?? "progress-bar"}
            onValueChange={(v: any) =>
              setCellMode(
                "serviceOrder",
                (typeof v === "string"
                  ? v
                  : "progress-bar") as Config["cellModes"]["serviceOrder"],
              )
            }
            options={SO_CELL_MODE_OPTIONS}
          />
        </View>
      </Section>
        </TabsContent>

        {/* COLUMNS TAB — unified ColumnPicker: visibility + reorder + per-row
            header rename + sort chip (multi-sort up to 5 priorities). Replaces
            three legacy sections (column picker + single sort + multi-sort). */}
        <TabsContent value="columns">
      <ColumnPicker<TaskColumnKey>
        catalog={pickerCatalog}
        selected={(config.columns ?? ["task", "status", "term"]) as TaskColumnKey[]}
        onChange={(next) => set("columns", next as Config["columns"])}
        labelOverrides={config.columnLabels as Partial<Record<TaskColumnKey, string>>}
        onLabelChange={(key, value) => {
          const trimmed = value.trim();
          const next = { ...(config.columnLabels ?? {}) } as Record<string, string>;
          if (trimmed.length === 0) delete next[key];
          else next[key] = value;
          set("columnLabels", next as Config["columnLabels"]);
        }}
        sorts={config.sorts as { key: TaskColumnKey; direction: "asc" | "desc" }[]}
        onSortsChange={(next) => set("sorts", next as Config["sorts"])}
        maxSorts={5}
        minVisible={1}
        title="Colunas e ordenação"
      />
        </TabsContent>

        {/* FILTERS TAB — status / sector / customer / assignee / date
            presets / date ranges / sinalizadores tri-states / search. */}
        <TabsContent value="filters">
      <Section title="Filtros" defaultOpen>
        <View style={{ gap: 4 }}>
          <Text style={{ fontSize: 12, color: colors.foreground }}>Status</Text>
          <Combobox
            mode="multiple"
            value={config.filters.status}
            onValueChange={(v: any) =>
              setFilter("status", Array.isArray(v) ? v : [v].filter(Boolean))
            }
            options={STATUS_OPTIONS}
            placeholder="Todos"
          />
        </View>
        <View style={{ gap: 4 }}>
          <Text style={{ fontSize: 12, color: colors.foreground }}>Setor</Text>
          <Combobox
            mode="multiple"
            value={config.filters.sectorIds}
            onValueChange={(v: any) =>
              setFilter("sectorIds", Array.isArray(v) ? v : [v].filter(Boolean))
            }
            options={sectorOptions}
            placeholder="Qualquer setor"
          />
        </View>
        <View style={{ gap: 4 }}>
          <Text style={{ fontSize: 12, color: colors.foreground }}>Cliente</Text>
          <Combobox
            mode="multiple"
            value={config.filters.customerIds}
            onValueChange={(v: any) =>
              setFilter("customerIds", Array.isArray(v) ? v : [v].filter(Boolean))
            }
            options={customerOptions}
            placeholder="Qualquer cliente"
          />
        </View>
        <View style={{ gap: 4 }}>
          <Text style={{ fontSize: 12, color: colors.foreground }}>
            Responsável
          </Text>
          <Combobox
            mode="multiple"
            value={config.filters.assigneeIds}
            onValueChange={(v: any) =>
              setFilter("assigneeIds", Array.isArray(v) ? v : [v].filter(Boolean))
            }
            options={userOptions}
            placeholder="Qualquer responsável"
          />
        </View>
        <View style={{ gap: 4 }}>
          <Text style={{ fontSize: 12, color: colors.foreground }}>
            Comissão
          </Text>
          <Combobox
            mode="multiple"
            value={config.filters.commissions}
            onValueChange={(v: any) =>
              setFilter("commissions", Array.isArray(v) ? v : [v].filter(Boolean))
            }
            options={COMMISSION_OPTIONS}
            placeholder="Todas"
          />
        </View>
        <View style={{ gap: 4 }}>
          <Text style={{ fontSize: 12, color: colors.foreground }}>
            Status do orçamento
          </Text>
          <Combobox
            mode="multiple"
            value={config.filters.quoteStatuses}
            onValueChange={(v: any) =>
              setFilter("quoteStatuses", Array.isArray(v) ? v : [v].filter(Boolean))
            }
            options={QUOTE_STATUS_OPTIONS}
            placeholder="Todos"
          />
        </View>
        <View style={{ gap: 4 }}>
          <Text style={{ fontSize: 12, color: colors.foreground }}>
            Tipos de OS
          </Text>
          <Combobox
            mode="multiple"
            value={config.filters.serviceOrderTypes}
            onValueChange={(v: any) =>
              setFilter(
                "serviceOrderTypes",
                Array.isArray(v) ? v : [v].filter(Boolean),
              )
            }
            options={SO_TYPE_OPTIONS}
            placeholder="Todos"
          />
        </View>

        <Section title="Datas">
          <View style={{ gap: 4 }}>
            <Text style={{ fontSize: 12, color: colors.foreground }}>
              Prazo (preset)
            </Text>
            <Combobox
              value={config.filters.termPreset}
              onValueChange={(v: any) =>
                setFilter(
                  "termPreset",
                  (typeof v === "string" ? v : "any") as Config["filters"]["termPreset"],
                )
              }
              options={TERM_PRESET_OPTIONS}
            />
          </View>
          <View style={{ gap: 4 }}>
            <Text style={{ fontSize: 12, color: colors.foreground }}>
              Prazo (intervalo)
            </Text>
            <DateRangePicker
              value={{
                from: config.filters.termRange.from
                  ? new Date(config.filters.termRange.from)
                  : undefined,
                to: config.filters.termRange.to
                  ? new Date(config.filters.termRange.to)
                  : undefined,
              }}
              onChange={(r: any) =>
                setFilter("termRange", {
                  from: r?.from ? r.from.toISOString() : null,
                  to: r?.to ? r.to.toISOString() : null,
                })
              }
            />
          </View>

          <View style={{ gap: 4 }}>
            <Text style={{ fontSize: 12, color: colors.foreground }}>
              Previsão (preset)
            </Text>
            <Combobox
              value={config.filters.forecastPreset}
              onValueChange={(v: any) =>
                setFilter(
                  "forecastPreset",
                  (typeof v === "string" ? v : "any") as Config["filters"]["forecastPreset"],
                )
              }
              options={FORECAST_PRESET_OPTIONS}
            />
          </View>
          <View style={{ gap: 4 }}>
            <Text style={{ fontSize: 12, color: colors.foreground }}>
              Previsão (intervalo)
            </Text>
            <DateRangePicker
              value={{
                from: config.filters.forecastRange.from
                  ? new Date(config.filters.forecastRange.from)
                  : undefined,
                to: config.filters.forecastRange.to
                  ? new Date(config.filters.forecastRange.to)
                  : undefined,
              }}
              onChange={(r: any) =>
                setFilter("forecastRange", {
                  from: r?.from ? r.from.toISOString() : null,
                  to: r?.to ? r.to.toISOString() : null,
                })
              }
            />
          </View>

          <View style={{ gap: 4 }}>
            <Text style={{ fontSize: 12, color: colors.foreground }}>
              Criação (preset)
            </Text>
            <Combobox
              value={config.filters.createdPreset}
              onValueChange={(v: any) =>
                setFilter(
                  "createdPreset",
                  (typeof v === "string" ? v : "any") as Config["filters"]["createdPreset"],
                )
              }
              options={PAST_PRESET_OPTIONS}
            />
          </View>
          <View style={{ gap: 4 }}>
            <Text style={{ fontSize: 12, color: colors.foreground }}>
              Criação (intervalo)
            </Text>
            <DateRangePicker
              value={{
                from: config.filters.createdRange.from
                  ? new Date(config.filters.createdRange.from)
                  : undefined,
                to: config.filters.createdRange.to
                  ? new Date(config.filters.createdRange.to)
                  : undefined,
              }}
              onChange={(r: any) =>
                setFilter("createdRange", {
                  from: r?.from ? r.from.toISOString() : null,
                  to: r?.to ? r.to.toISOString() : null,
                })
              }
            />
          </View>

          <View style={{ gap: 4 }}>
            <Text style={{ fontSize: 12, color: colors.foreground }}>
              Conclusão (preset)
            </Text>
            <Combobox
              value={config.filters.finishedPreset}
              onValueChange={(v: any) =>
                setFilter(
                  "finishedPreset",
                  (typeof v === "string" ? v : "any") as Config["filters"]["finishedPreset"],
                )
              }
              options={PAST_PRESET_OPTIONS}
            />
          </View>
          <View style={{ gap: 4 }}>
            <Text style={{ fontSize: 12, color: colors.foreground }}>
              Conclusão (intervalo)
            </Text>
            <DateRangePicker
              value={{
                from: config.filters.finishedRange.from
                  ? new Date(config.filters.finishedRange.from)
                  : undefined,
                to: config.filters.finishedRange.to
                  ? new Date(config.filters.finishedRange.to)
                  : undefined,
              }}
              onChange={(r: any) =>
                setFilter("finishedRange", {
                  from: r?.from ? r.from.toISOString() : null,
                  to: r?.to ? r.to.toISOString() : null,
                })
              }
            />
          </View>

          <View style={{ gap: 4 }}>
            <Text style={{ fontSize: 12, color: colors.foreground }}>
              Entrada (intervalo)
            </Text>
            <DateRangePicker
              value={{
                from: config.filters.entryRange.from
                  ? new Date(config.filters.entryRange.from)
                  : undefined,
                to: config.filters.entryRange.to
                  ? new Date(config.filters.entryRange.to)
                  : undefined,
              }}
              onChange={(r: any) =>
                setFilter("entryRange", {
                  from: r?.from ? r.from.toISOString() : null,
                  to: r?.to ? r.to.toISOString() : null,
                })
              }
            />
          </View>
        </Section>

        <Section title="Sinalizadores">
          <View style={{ gap: 4 }}>
            <Text style={{ fontSize: 12, color: colors.foreground }}>
              Apenas do meu setor
            </Text>
            <Combobox
              value={config.filters.mySector}
              onValueChange={(v: any) =>
                setFilter(
                  "mySector",
                  (typeof v === "string" ? v : "any") as Config["filters"]["mySector"],
                )
              }
              options={TRI_STATE_OPTIONS}
            />
            <Text style={{ fontSize: 10, color: colors.mutedForeground }}>
              Quando ativo, sobrescreve a seleção manual de setores acima.
            </Text>
          </View>
          <View style={{ gap: 4 }}>
            <Text style={{ fontSize: 12, color: colors.foreground }}>
              Apenas atrasadas
            </Text>
            <Combobox
              value={config.filters.isOverdue}
              onValueChange={(v: any) =>
                setFilter(
                  "isOverdue",
                  (typeof v === "string" ? v : "any") as Config["filters"]["isOverdue"],
                )
              }
              options={TRI_STATE_OPTIONS}
            />
          </View>
          <View style={{ gap: 4 }}>
            <Text style={{ fontSize: 12, color: colors.foreground }}>
              Possui observação
            </Text>
            <Combobox
              value={config.filters.hasObservation}
              onValueChange={(v: any) =>
                setFilter(
                  "hasObservation",
                  (typeof v === "string" ? v : "any") as Config["filters"]["hasObservation"],
                )
              }
              options={TRI_STATE_OPTIONS}
            />
          </View>
          <View style={{ gap: 4 }}>
            <Text style={{ fontSize: 12, color: colors.foreground }}>
              Possui orçamento
            </Text>
            <Combobox
              value={config.filters.hasBudget}
              onValueChange={(v: any) =>
                setFilter(
                  "hasBudget",
                  (typeof v === "string" ? v : "any") as Config["filters"]["hasBudget"],
                )
              }
              options={TRI_STATE_OPTIONS}
            />
          </View>
          <View style={{ gap: 4 }}>
            <Text style={{ fontSize: 12, color: colors.foreground }}>
              Tem OS aberta
            </Text>
            <Combobox
              value={config.filters.hasOpenSO}
              onValueChange={(v: any) =>
                setFilter(
                  "hasOpenSO",
                  (typeof v === "string" ? v : "any") as Config["filters"]["hasOpenSO"],
                )
              }
              options={TRI_STATE_OPTIONS}
            />
          </View>
          <View style={{ gap: 4 }}>
            <Text style={{ fontSize: 12, color: colors.foreground }}>
              Tem artes
            </Text>
            <Combobox
              value={config.filters.hasArtworks}
              onValueChange={(v: any) =>
                setFilter(
                  "hasArtworks",
                  (typeof v === "string" ? v : "any") as Config["filters"]["hasArtworks"],
                )
              }
              options={TRI_STATE_OPTIONS}
            />
          </View>
          <View style={{ gap: 4 }}>
            <Text style={{ fontSize: 12, color: colors.foreground }}>
              Concluídas
            </Text>
            <Combobox
              value={config.filters.isCompleted}
              onValueChange={(v: any) =>
                setFilter(
                  "isCompleted",
                  (typeof v === "string" ? v : "any") as Config["filters"]["isCompleted"],
                )
              }
              options={TRI_STATE_OPTIONS}
            />
          </View>
          <View style={{ gap: 4 }}>
            <Text style={{ fontSize: 12, color: colors.foreground }}>
              Comissionadas
            </Text>
            <Combobox
              value={config.filters.isCommissioned}
              onValueChange={(v: any) =>
                setFilter(
                  "isCommissioned",
                  (typeof v === "string" ? v : "any") as Config["filters"]["isCommissioned"],
                )
              }
              options={TRI_STATE_OPTIONS}
            />
          </View>
        </Section>

        <Section title="Caminhão">
          <View style={{ gap: 4 }}>
            <Text style={{ fontSize: 12, color: colors.foreground }}>
              Possui caminhão
            </Text>
            <Combobox
              value={config.filters.hasTruck}
              onValueChange={(v: any) =>
                setFilter(
                  "hasTruck",
                  (typeof v === "string" ? v : "any") as Config["filters"]["hasTruck"],
                )
              }
              options={TRI_STATE_OPTIONS}
            />
          </View>
          <View style={{ gap: 4 }}>
            <Text style={{ fontSize: 12, color: colors.foreground }}>
              Categorias do caminhão
            </Text>
            <Combobox
              mode="multiple"
              value={config.filters.truckCategories}
              onValueChange={(v: any) =>
                setFilter(
                  "truckCategories",
                  Array.isArray(v) ? v : [v].filter(Boolean),
                )
              }
              options={TRUCK_CATEGORY_OPTIONS}
              placeholder="Qualquer categoria"
            />
          </View>
          <View style={{ gap: 4 }}>
            <Text style={{ fontSize: 12, color: colors.foreground }}>
              Tipos de implemento
            </Text>
            <Combobox
              mode="multiple"
              value={config.filters.implementTypes}
              onValueChange={(v: any) =>
                setFilter(
                  "implementTypes",
                  Array.isArray(v) ? v : [v].filter(Boolean),
                )
              }
              options={IMPLEMENT_TYPE_OPTIONS}
              placeholder="Qualquer implemento"
            />
          </View>
        </Section>

        <View style={{ gap: 4 }}>
          <Text style={{ fontSize: 12, color: colors.foreground }}>
            Busca padrão
          </Text>
          <Input
            value={config.filters.defaultSearch ?? ""}
            onChangeText={(v: string) => setFilter("defaultSearch", v)}
            placeholder="(opcional)"
          />
          <Text style={{ fontSize: 11, color: colors.mutedForeground }}>
            Pré-preenche a busca toda vez que o widget for aberto.
          </Text>
        </View>
      </Section>
        </TabsContent>

        {/* COLORS TAB — deadline color tokens + thresholds. */}
        <TabsContent value="colors">
      <Section title="Cores de prazo">
        <ToggleRow
          label="Habilitar cores"
          checked={config.deadlineColors.enabled}
          onCheckedChange={(v) => setDeadline("enabled", v)}
        />
        <ToggleRow
          label="Texto em negrito"
          checked={config.deadlineColors.bold}
          onCheckedChange={(v) => setDeadline("bold", v)}
        />
        <View style={{ gap: 4 }}>
          <Text style={{ fontSize: 12, color: colors.foreground }}>
            Previsão crítica (dias)
          </Text>
          <Input
            keyboardType="number-pad"
            value={String(config.deadlineColors.forecastCriticalDays)}
            onChangeText={(t: string) => {
              const n = Number(t.replace(/[^0-9]/g, ""));
              if (!Number.isFinite(n)) return;
              setDeadline("forecastCriticalDays", Math.max(0, Math.min(60, n)));
            }}
          />
        </View>
        <View style={{ gap: 4 }}>
          <Text style={{ fontSize: 12, color: colors.foreground }}>
            Previsão alerta (dias)
          </Text>
          <Input
            keyboardType="number-pad"
            value={String(config.deadlineColors.forecastWarningDays)}
            onChangeText={(t: string) => {
              const n = Number(t.replace(/[^0-9]/g, ""));
              if (!Number.isFinite(n)) return;
              setDeadline("forecastWarningDays", Math.max(0, Math.min(120, n)));
            }}
          />
        </View>
        <View style={{ gap: 4 }}>
          <Text style={{ fontSize: 12, color: colors.foreground }}>
            Previsão aviso (dias)
          </Text>
          <Input
            keyboardType="number-pad"
            value={String(config.deadlineColors.forecastNoticeDays)}
            onChangeText={(t: string) => {
              const n = Number(t.replace(/[^0-9]/g, ""));
              if (!Number.isFinite(n)) return;
              setDeadline("forecastNoticeDays", Math.max(0, Math.min(180, n)));
            }}
          />
        </View>
        <View style={{ gap: 4 }}>
          <Text style={{ fontSize: 12, color: colors.foreground }}>
            Cor — previsão crítica
          </Text>
          <Combobox
            value={config.deadlineColors.forecastCriticalColor}
            onValueChange={(v: any) =>
              setDeadline(
                "forecastCriticalColor",
                typeof v === "string" ? v : "red-500",
              )
            }
            options={DEADLINE_COLOR_OPTIONS}
          />
        </View>
        <View style={{ gap: 4 }}>
          <Text style={{ fontSize: 12, color: colors.foreground }}>
            Cor — previsão alerta
          </Text>
          <Combobox
            value={config.deadlineColors.forecastWarningColor}
            onValueChange={(v: any) =>
              setDeadline(
                "forecastWarningColor",
                typeof v === "string" ? v : "orange-500",
              )
            }
            options={DEADLINE_COLOR_OPTIONS}
          />
        </View>
        <View style={{ gap: 4 }}>
          <Text style={{ fontSize: 12, color: colors.foreground }}>
            Cor — previsão aviso
          </Text>
          <Combobox
            value={config.deadlineColors.forecastNoticeColor}
            onValueChange={(v: any) =>
              setDeadline(
                "forecastNoticeColor",
                typeof v === "string" ? v : "yellow-500",
              )
            }
            options={DEADLINE_COLOR_OPTIONS}
          />
        </View>
        <View style={{ gap: 4 }}>
          <Text style={{ fontSize: 12, color: colors.foreground }}>
            Cor — prazo atrasado
          </Text>
          <Combobox
            value={config.deadlineColors.termOverdueColor}
            onValueChange={(v: any) =>
              setDeadline(
                "termOverdueColor",
                typeof v === "string" ? v : "red-500",
              )
            }
            options={DEADLINE_COLOR_OPTIONS}
          />
        </View>
        <View style={{ gap: 4 }}>
          <Text style={{ fontSize: 12, color: colors.foreground }}>
            Horas críticas até o prazo
          </Text>
          <Input
            keyboardType="number-pad"
            value={String(config.deadlineColors.termCriticalHours)}
            onChangeText={(t: string) => {
              const n = Number(t.replace(/[^0-9.]/g, ""));
              if (!Number.isFinite(n)) return;
              setDeadline("termCriticalHours", Math.max(0, Math.min(72, n)));
            }}
          />
        </View>
        <View style={{ gap: 4 }}>
          <Text style={{ fontSize: 12, color: colors.foreground }}>
            Cor — prazo crítico
          </Text>
          <Combobox
            value={config.deadlineColors.termCriticalColor}
            onValueChange={(v: any) =>
              setDeadline(
                "termCriticalColor",
                typeof v === "string" ? v : "amber-500",
              )
            }
            options={DEADLINE_COLOR_OPTIONS}
          />
        </View>
        <View style={{ gap: 4 }}>
          <Text style={{ fontSize: 12, color: colors.foreground }}>
            Cor — prazo no prazo
          </Text>
          <Combobox
            value={config.deadlineColors.termOnTrackColor}
            onValueChange={(v: any) =>
              setDeadline(
                "termOnTrackColor",
                typeof v === "string" ? v : "green-500",
              )
            }
            options={DEADLINE_COLOR_OPTIONS}
          />
        </View>
      </Section>
        </TabsContent>

        {/* BEHAVIOR TAB (part 2 of 3) — row limit. */}
        <TabsContent value="behavior">
      <Section title="Limite">
        <LimitInput
          value={config.limit}
          onChange={(v) => set("limit", v)}
          min={5}
          max={200}
        />
      </Section>
        </TabsContent>

        {/* BEHAVIOR TAB (part 3 of 3) — refetch interval. */}
        <TabsContent value="behavior">
      <TableRefreshSection
        value={(config.display as TableDisplay).refetchInterval ?? "0"}
        onChange={(v) =>
          onChange({
            ...config,
            display: {
              ...(config.display as any),
              refetchInterval: v,
            },
          })
        }
      />
        </TabsContent>
      </Tabs>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Definition
// ---------------------------------------------------------------------------

export const taskTableWidget: WidgetDefinition<Config> = {
  id: "table.tasks",
  name: "Tarefas",
  description:
    "Tarefas em produção com prazo, cliente, setor e status. Filtre por sector, cliente, responsável, datas e mais. Suporta multi-ordenação, layouts em abas, e múltiplos modos de exibição de status / pintura.",
  icon: IconClipboardText,
  category: "production",
  // Mirror /producao/cronograma route privileges. Financial columns
  // (quoteTotal, quoteStatus) are gated per-column — see
  // canViewTaskFinancialColumns().
  allowedSectors: [
    SECTOR_PRIVILEGES.PRODUCTION,
    SECTOR_PRIVILEGES.PRODUCTION_MANAGER,
    SECTOR_PRIVILEGES.DESIGNER,
    SECTOR_PRIVILEGES.PLOTTING,
    SECTOR_PRIVILEGES.LOGISTIC,
    SECTOR_PRIVILEGES.COMMERCIAL,
    SECTOR_PRIVILEGES.FINANCIAL,
    SECTOR_PRIVILEGES.WAREHOUSE,
    SECTOR_PRIVILEGES.ADMIN,
  ],
  allowedSpans: [3],
  defaultSpan: 3,
  allowedHeights: [2, 3, 4],
  defaultRows: 3,
  configSchema,
  defaultConfig: {
    title: "Tarefas",
    showHeader: true,
    showPaintDot: true,
    termCriticalHours: 4,
    rowClickTarget: "task",
    display: {
      ...TABLE_DISPLAY_DEFAULTS,
      density: "comfortable",
      stickyHeader: true,
      showSearchBox: false,
      // The intersection in configSchema also accepts the layoutMode/etc. keys.
      ...({ showViewAllLink: true, showCount: true, layoutMode: "flat" } as any),
    } as any,
    cellModes: {
      serviceOrder: "progress-bar",
      paint: "swatch-name",
      status: "badge",
    },
    deadlineColors: {
      enabled: true,
      bold: true,
      forecastCriticalDays: 3,
      forecastWarningDays: 7,
      forecastNoticeDays: 10,
      forecastCriticalColor: "red-500",
      forecastWarningColor: "orange-500",
      forecastNoticeColor: "yellow-500",
      termOverdueColor: "red-500",
      termCriticalHours: 4,
      termCriticalColor: "amber-500",
      termOnTrackColor: "green-500",
    },
    columns: ["task", "status", "term"],
    columnLabels: {},
    filters: {
      status: [TASK_STATUS.IN_PRODUCTION, TASK_STATUS.WAITING_PRODUCTION],
      sectorIds: [],
      customerIds: [],
      assigneeIds: [],
      commissions: [],
      truckCategories: [],
      implementTypes: [],
      hasTruck: "any",
      termPreset: "any",
      forecastPreset: "any",
      finishedPreset: "any",
      createdPreset: "any",
      termRange: { from: null, to: null },
      forecastRange: { from: null, to: null },
      finishedRange: { from: null, to: null },
      createdRange: { from: null, to: null },
      entryRange: { from: null, to: null },
      isOverdue: "any",
      hasObservation: "any",
      hasBudget: "any",
      mySector: "any",
      hasOpenSO: "any",
      hasArtworks: "any",
      isCompleted: "any",
      isCommissioned: "any",
      serviceOrderTypes: [],
      quoteStatuses: [],
      defaultSearch: "",
    },
    sort: { key: "term", direction: "asc" },
    sorts: [{ key: "term", direction: "asc" }],
    limit: 20,
    behavior: { viewAllRouteOverride: "" },
    accent: { color: "teal", icon: "ClipboardText", borderColor: "none" },
  } as any,
  RenderComponent: Render,
  ConfigComponent: ConfigComp,
};
