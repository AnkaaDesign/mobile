// Zod schemas for mobile dashboard layout persistence.
//
// INDEPENDENT from web — see types.ts for rationale. Validates the JSON read
// from / written to Preferences.dashboardLayoutMobile. Web's persisted
// dashboardLayoutWeb has a different shape ({cols, rows}) and will fail this
// schema; that's intentional — the two platforms keep their own state.
//
// `config` is intentionally permissive (z.unknown) — each widget's own config
// schema validates that field separately at the render boundary.

import { z } from "zod";
import { DASHBOARD_LAYOUT_VERSION } from "./types";
import type { DashboardLayout, WidgetInstance } from "./types";

export const widgetSizeSchema = z.object({
  span: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  rows: z.union([z.literal(1), z.literal(2), z.literal(3)]),
});

export const widgetInstanceSchema = z.object({
  instanceId: z.string().min(1),
  widgetId: z.string().min(1),
  size: widgetSizeSchema,
  config: z.unknown(),
});

export const dashboardLayoutSchema = z.object({
  version: z.number().int().min(1),
  updatedAt: z.string().min(1),
  items: z.array(widgetInstanceSchema),
});

// ---------- Legacy parsing for migration ----------
//
// Layouts saved before the schema split used {cols, rows}. We keep a permissive
// schema that accepts the older shape so use-dashboard-layout.ts can detect
// "this is v1 data" and migrate each instance's size to the widget's
// defaultSpan. Without this fallback, every existing user would lose their
// widget list on upgrade.

const legacyWidgetSizeSchema = z.object({
  cols: z.number().int().min(1).max(4),
  rows: z.number().int().min(1).max(4),
});

const legacyWidgetInstanceSchema = z.object({
  instanceId: z.string().min(1),
  widgetId: z.string().min(1),
  size: legacyWidgetSizeSchema,
  config: z.unknown(),
});

const legacyDashboardLayoutSchema = z.object({
  version: z.number().int().min(1),
  updatedAt: z.string().min(1),
  items: z.array(legacyWidgetInstanceSchema),
});

export interface LegacyParseResult {
  /** Items with widgetId + config preserved. Caller fills in size with each
   *  widget's defaultSpan because the registry is the only place that knows it. */
  items: Array<Pick<WidgetInstance, "instanceId" | "widgetId" | "config">>;
  updatedAt: string;
}

/**
 * Best-effort parse of an unknown value into a DashboardLayout.
 * Returns null on mismatch — caller falls back to a sector preset.
 */
export function parseLayout(value: unknown): DashboardLayout | null {
  if (value == null) return null;
  const result = dashboardLayoutSchema.safeParse(value);
  if (!result.success) return null;
  return result.data as DashboardLayout;
}

/**
 * Try to parse legacy {cols, rows} layouts. Returns the partial items so
 * the caller can re-attach a fresh `size` per widget definition. Returns
 * null when the value isn't recognizable as a v1 layout either.
 */
export function parseLegacyLayout(value: unknown): LegacyParseResult | null {
  if (value == null) return null;
  const result = legacyDashboardLayoutSchema.safeParse(value);
  if (!result.success) return null;
  return {
    updatedAt: result.data.updatedAt,
    items: result.data.items.map((it) => ({
      instanceId: it.instanceId,
      widgetId: it.widgetId,
      config: it.config,
    })),
  };
}

export function emptyLayout(): DashboardLayout {
  return {
    version: DASHBOARD_LAYOUT_VERSION,
    updatedAt: new Date().toISOString(),
    items: [],
  };
}
