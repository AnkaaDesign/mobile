// Zod schemas for dashboard layout persistence. Mirrors web/src/dashboard/schemas.ts.
// Validates the JSON read from / written to Preferences.dashboardLayoutMobile.
// `config` is intentionally permissive (z.unknown) — each widget's own config
// schema validates that field separately at the render boundary.

import { z } from "zod";
import { DASHBOARD_LAYOUT_VERSION } from "./types";
import type { DashboardLayout } from "./types";

export const widgetSizeSchema = z.object({
  cols: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]),
  rows: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]),
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

/**
 * Best-effort parse of an unknown value into a DashboardLayout. Returns null
 * on mismatch — caller falls back to a sector preset.
 */
export function parseLayout(value: unknown): DashboardLayout | null {
  if (value == null) return null;
  const result = dashboardLayoutSchema.safeParse(value);
  if (!result.success) return null;
  return result.data as DashboardLayout;
}

export function emptyLayout(): DashboardLayout {
  return {
    version: DASHBOARD_LAYOUT_VERSION,
    updatedAt: new Date().toISOString(),
    items: [],
  };
}
