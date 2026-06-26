// Mobile dashboard types — INTENTIONALLY DIVERGENT from web.
//
// Mobile and web layouts are fully independent: separate persistence
// (Preferences.dashboardLayoutMobile vs dashboardLayoutWeb), separate widget
// catalogs (mobile/src/dashboard/widgets vs web/src/dashboard/widgets), and
// separate size schemas. A web layout JSON cannot be parsed as a mobile
// layout (different shape) — by design.
//
// Mobile layout model:
//   - Width  → `span`  ∈ {1, 2, 3} — number of slots in a 3-slot row.
//                Items are walked in order and packed into rows whose spans
//                sum ≤ 3. Mirrors web's cols (1/4, 1/2, 3/4, full) clamped
//                for phone real-estate.
//   - Height → `rows`  ∈ {1, 2, 3, 4} — discrete maxHeight token. 1=240px,
//                2=360px, 3=520px, 4=720px. Mirrors web's 1-4 row range so
//                the user can pick the same vertical scale across platforms.
//                Mobile uses pixel caps instead of a global grid-auto-rows
//                since mobile has no CSS grid.
//   - Each widget declares `allowedSpans` and `allowedHeights` so widgets
//     that only make sense at certain sizes (data tables = full+tall) can
//     constrain the picker.
//   - Per-widget density (compact/comfortable/spacious) lives inside the
//     widget's own config (display.density), matching web's per-widget
//     pattern.

import type { ComponentType } from "react";
import type { z } from "zod";
import { SECTOR_PRIVILEGES } from "@/constants/enums";

// ---------- Size ----------

export type WidgetSpan = 1 | 2 | 3;
export type WidgetRows = 1 | 2 | 3 | 4;

export const WIDGET_SPAN_VALUES: readonly WidgetSpan[] = [1, 2, 3] as const;
export const WIDGET_ROW_VALUES: readonly WidgetRows[] = [1, 2, 3, 4] as const;

export interface WidgetSize {
  span: WidgetSpan;
  rows: WidgetRows;
}

export const WIDGET_SPAN_LABELS: Record<WidgetSpan, string> = {
  1: "1/3",
  2: "2/3",
  3: "Total",
};

export const WIDGET_SPAN_LONG_LABELS: Record<WidgetSpan, string> = {
  1: "1/3 da linha",
  2: "2/3 da linha",
  3: "Largura total",
};

export const WIDGET_ROW_LABELS: Record<WidgetRows, string> = {
  1: "1×",
  2: "2×",
  3: "3×",
  4: "4×",
};

export const WIDGET_ROW_LONG_LABELS: Record<WidgetRows, string> = {
  1: "Baixa",
  2: "Normal",
  3: "Alta",
  4: "Muito alta",
};

/** Concrete max-height in pixels for each rows token. Web uses 180px row
 *  units on a ~1080px desktop viewport — proportionally ~17% per unit.
 *  Mobile uses the same arithmetic but with a 140px row unit so a
 *  rows-3 widget lands at ~452px (≈ 60-65% of a typical mobile content
 *  area) instead of "filling the entire screen", matching web's *visual
 *  proportion* on the smaller viewport. Formula: `140·N + 16·(N-1)`. */
export const WIDGET_ROW_MAX_HEIGHT: Record<WidgetRows, number> = {
  1: 140,
  2: 296,
  3: 452,
  4: 608,
};

// ---------- Categories ----------

export type WidgetCategory =
  | "inventory"
  | "hr"
  | "production"
  | "financial"
  | "other";

export const WIDGET_CATEGORY_LABELS: Record<WidgetCategory, string> = {
  inventory: "Estoque",
  hr: "Departamento Pessoal",
  production: "Produção",
  financial: "Financeiro",
  other: "Outros",
};

// ---------- Widget definition ----------

export interface WidgetRenderProps<TConfig = unknown> {
  instanceId: string;
  config: TConfig;
  size: WidgetSize;
  isEditing: boolean;
}

export interface WidgetConfigProps<TConfig = unknown> {
  config: TConfig;
  onChange: (next: TConfig) => void;
}

export interface WidgetDefinition<TConfig = unknown> {
  id: string;
  name: string;
  description: string;
  icon: ComponentType<{ size?: number; color?: string }>;
  category: WidgetCategory;
  allowedSectors: SECTOR_PRIVILEGES[] | "*";
  /** When true, the widget is only available to users who lead a sector
   *  (`user.ledSector` is set) — regardless of `allowedSectors`. Used by
   *  leader-only widgets (e.g. "Ponto do Setor (Líder)") so non-leaders
   *  can't add them and any saved instance is stripped on load. */
  requiresLeader?: boolean;
  /** Spans this widget supports. Tables are typically [3] only; personal
   *  widgets often allow [1, 2, 3]. The size picker shows only these values. */
  allowedSpans: readonly WidgetSpan[];
  /** Heights this widget supports. Defaults to [1, 2, 3] if omitted. Tables
   *  with a fixed search input + ~10 rows usually want [2, 3]; KPI tiles
   *  want [1, 2]; tall analytics-style widgets force [3]. */
  allowedHeights?: readonly WidgetRows[];
  /** Default span when the widget is first added or migrated. */
  defaultSpan: WidgetSpan;
  /** Default rows when the widget is first added or migrated. */
  defaultRows: WidgetRows;
  configSchema: z.ZodType<TConfig, z.ZodTypeDef, any>;
  defaultConfig: TConfig;
  RenderComponent: ComponentType<WidgetRenderProps<TConfig>>;
  ConfigComponent?: ComponentType<WidgetConfigProps<TConfig>>;
}

// ---------- Layout instance ----------

export interface WidgetInstance {
  instanceId: string;
  widgetId: string;
  size: WidgetSize;
  config: unknown;
}

// ---------- Layout document ----------

/** Version history:
 *    1 → original {cols, rows} shape (pre-platform-split). Auto-migrated on read by
 *        use-dashboard-layout.ts via parseLegacyLayout().
 *    2 → divergence from web: {span, rows} with rows ∈ {1, 2, 3}.
 *    3 → widened rows to {1, 2, 3, 4} to match WIDGET_ROW_VALUES (the size
 *        selector already exposed 4×, but v2 schema rejected it on read,
 *        silently dropping user layouts back to the sector preset).
 *        v3 is a strict superset of v2 — no per-item migration; saveAndExit
 *        naturally rewrites the version on next save. */
export const DASHBOARD_LAYOUT_VERSION = 3;

export interface DashboardLayout {
  version: number;
  updatedAt: string;
  items: WidgetInstance[];
}
