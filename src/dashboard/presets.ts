// Sector-default home dashboard layouts for mobile. Each sector gets a
// hand-picked set of widgets in a sensible order. Users can edit, add,
// remove, or reorder freely after first run.
//
// Sizing notes:
//  - Personal/quick widgets (favorites, time-entries, quick-note) start at
//    span 1 (1/3) and pair into 3-slot rows.
//  - Recent messages defaults to span 2 (2/3) so it pairs with span-1 tiles.
//  - Data tables always sit at span 3 (full row).
//  - rows defaults to each widget's defaultRows.

import { SECTOR_PRIVILEGES } from "@/constants/enums";
import { DASHBOARD_LAYOUT_VERSION } from "./types";
import type {
  DashboardLayout,
  WidgetInstance,
  WidgetRows,
  WidgetSpan,
} from "./types";
import { widgetRegistry } from "./registry";

let presetCounter = 0;

function makeInstance(
  widgetId: string,
  span: WidgetSpan,
  rowsOverride?: WidgetRows,
  config: unknown = {},
): WidgetInstance {
  presetCounter += 1;
  const def = widgetRegistry.get(widgetId);
  const rows = rowsOverride ?? (def?.defaultRows ?? 2);
  return {
    instanceId: `preset-${widgetId}-${presetCounter}`,
    widgetId,
    size: { span, rows },
    config,
  };
}

// ---------- Per-sector builders ----------

function commonWidgets(): WidgetInstance[] {
  return [
    makeInstance("home.favorites", 1),
    makeInstance("home.recent-messages", 2),
  ];
}

function productionLayout(): DashboardLayout {
  presetCounter = 0;
  return {
    version: DASHBOARD_LAYOUT_VERSION,
    updatedAt: new Date().toISOString(),
    items: [
      ...commonWidgets(),
      makeInstance("home.time-entries", 3),
      makeInstance("table.tasks", 3),
    ],
  };
}

function warehouseLayout(): DashboardLayout {
  presetCounter = 0;
  return {
    version: DASHBOARD_LAYOUT_VERSION,
    updatedAt: new Date().toISOString(),
    items: [
      ...commonWidgets(),
      makeInstance("table.items", 3),
      makeInstance("table.borrows", 3),
      makeInstance("table.ppe-deliveries", 3),
    ],
  };
}

function hrLayout(): DashboardLayout {
  presetCounter = 0;
  return {
    version: DASHBOARD_LAYOUT_VERSION,
    updatedAt: new Date().toISOString(),
    items: [
      ...commonWidgets(),
      makeInstance("home.daily-ponto", 3),
      makeInstance("table.ppe-deliveries", 3),
    ],
  };
}

function financialLayout(): DashboardLayout {
  presetCounter = 0;
  return {
    version: DASHBOARD_LAYOUT_VERSION,
    updatedAt: new Date().toISOString(),
    items: [
      ...commonWidgets(),
      makeInstance("financial.installments", 3),
      makeInstance("table.tasks", 3),
    ],
  };
}

function defaultLayout(): DashboardLayout {
  presetCounter = 0;
  return {
    version: DASHBOARD_LAYOUT_VERSION,
    updatedAt: new Date().toISOString(),
    items: [
      ...commonWidgets(),
      makeInstance("home.time-entries", 3),
      makeInstance("home.quick-note", 3),
    ],
  };
}

export function getDefaultLayoutForSector(
  sector: SECTOR_PRIVILEGES | null | undefined,
): DashboardLayout {
  switch (sector) {
    case SECTOR_PRIVILEGES.PRODUCTION:
    case SECTOR_PRIVILEGES.PRODUCTION_MANAGER:
    case SECTOR_PRIVILEGES.DESIGNER:
    case SECTOR_PRIVILEGES.PLOTTING:
    case SECTOR_PRIVILEGES.LOGISTIC:
    case SECTOR_PRIVILEGES.MAINTENANCE:
      return productionLayout();
    case SECTOR_PRIVILEGES.WAREHOUSE:
      return warehouseLayout();
    case SECTOR_PRIVILEGES.HUMAN_RESOURCES:
      return hrLayout();
    case SECTOR_PRIVILEGES.FINANCIAL:
    case SECTOR_PRIVILEGES.COMMERCIAL:
      return financialLayout();
    case SECTOR_PRIVILEGES.ADMIN:
      return productionLayout();
    default:
      return defaultLayout();
  }
}
