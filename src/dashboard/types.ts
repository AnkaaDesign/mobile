// Widget dashboard types — shared across the dashboard module.
// Mirrors web/src/dashboard/types.ts so a layout JSON is interchangeable
// between platforms (we don't migrate web → mobile automatically because
// of size differences, but the wire format stays parseable).
//
// Layout model: an ordered list of widget instances. On mobile we always
// render single-column (cols clamps to 1 at render time), but cols/rows
// stay in the schema so the same persisted JSON can survive a web round-trip.

import type { ComponentType } from "react";
import type { z } from "zod";
import { SECTOR_PRIVILEGES } from "@/constants/enums";

// ---------- Size ----------

export type WidgetCols = 1 | 2 | 3 | 4;
export type WidgetRows = 1 | 2 | 3 | 4;

export interface WidgetSize {
  cols: WidgetCols;
  rows: WidgetRows;
}

export const WIDGET_COL_VALUES: readonly WidgetCols[] = [1, 2, 3, 4] as const;
export const WIDGET_ROW_VALUES: readonly WidgetRows[] = [1, 2, 3, 4] as const;

// ---------- Categories ----------

export type WidgetCategory =
  | "inventory"
  | "hr"
  | "production"
  | "financial"
  | "other";

export const WIDGET_CATEGORY_LABELS: Record<WidgetCategory, string> = {
  inventory: "Estoque",
  hr: "Recursos Humanos",
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
  /** Stable identifier — used as FK from layout instances. Format: "namespace.name" */
  id: string;
  /** Short display name shown in the picker and as widget header. */
  name: string;
  /** One-line description for the picker. */
  description: string;
  /** Icon component (tabler icons accept the same prop shape). */
  icon: ComponentType<{ size?: number; color?: string }>;
  /** Category — used to group widgets in the picker. */
  category: WidgetCategory;
  /** Sectors that can use this widget. Use `"*"` to allow everyone. ADMIN always bypasses. */
  allowedSectors: SECTOR_PRIVILEGES[] | "*";
  /** Default size when first added. On mobile cols always renders as 1. */
  defaultSize: WidgetSize;
  /** Minimum size constraint. */
  minSize: WidgetSize;
  /** Maximum size constraint. */
  maxSize: WidgetSize;
  /** Zod schema validating the config payload. */
  configSchema: z.ZodType<TConfig, z.ZodTypeDef, any>;
  /** Default config for new instances. */
  defaultConfig: TConfig;
  /** Render component. */
  RenderComponent: ComponentType<WidgetRenderProps<TConfig>>;
  /** Optional custom config component. If omitted, DynamicFormField auto-generates from schema. */
  ConfigComponent?: ComponentType<WidgetConfigProps<TConfig>>;
}

// ---------- Layout instance ----------

export interface WidgetInstance {
  /** UUID — unique per instance. */
  instanceId: string;
  /** FK to WidgetDefinition.id */
  widgetId: string;
  /** Discrete size. */
  size: WidgetSize;
  /** Widget-specific config (validated against widget.configSchema). */
  config: unknown;
}

// ---------- Layout document ----------

export const DASHBOARD_LAYOUT_VERSION = 1;

export interface DashboardLayout {
  version: number;
  updatedAt: string;
  items: WidgetInstance[];
}
