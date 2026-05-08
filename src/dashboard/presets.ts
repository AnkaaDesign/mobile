// Sector-default home dashboard layouts for mobile. Each sector gets a
// hand-picked set of widgets in a sensible order. Users can edit, add,
// remove, or reorder freely after first run.

import { SECTOR_PRIVILEGES } from "@/constants/enums";
import { DASHBOARD_LAYOUT_VERSION } from "./types";
import type { DashboardLayout, WidgetInstance } from "./types";

let presetCounter = 0;

function makeInstance(
  widgetId: string,
  size: WidgetInstance["size"],
  config: unknown = {},
): WidgetInstance {
  presetCounter += 1;
  return {
    instanceId: `preset-${widgetId}-${presetCounter}`,
    widgetId,
    size,
    config,
  };
}

// ---------- Per-sector builders ----------

function commonWidgets(): WidgetInstance[] {
  // Every layout gets favoritos + recent messages near the top — they are
  // personal, low-friction, and useful for everyone.
  return [
    makeInstance("home.favorites", { cols: 1, rows: 1 }),
    makeInstance("home.recent-messages", { cols: 1, rows: 2 }),
  ];
}

function productionLayout(): DashboardLayout {
  presetCounter = 0;
  return {
    version: DASHBOARD_LAYOUT_VERSION,
    updatedAt: new Date().toISOString(),
    items: [
      ...commonWidgets(),
      makeInstance("table.tasks", { cols: 1, rows: 3 }),
      makeInstance("home.time-entries", { cols: 1, rows: 2 }),
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
      makeInstance("table.items", { cols: 1, rows: 3 }),
      makeInstance("table.borrows", { cols: 1, rows: 3 }),
      makeInstance("table.ppe-deliveries", { cols: 1, rows: 3 }),
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
      makeInstance("home.daily-ponto", { cols: 1, rows: 3 }),
      makeInstance("table.ppe-deliveries", { cols: 1, rows: 3 }),
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
      makeInstance("financial.installments", { cols: 1, rows: 3 }),
      makeInstance("table.tasks", { cols: 1, rows: 3 }),
    ],
  };
}

function defaultLayout(): DashboardLayout {
  // Catch-all for sectors without a dedicated builder.
  presetCounter = 0;
  return {
    version: DASHBOARD_LAYOUT_VERSION,
    updatedAt: new Date().toISOString(),
    items: [
      ...commonWidgets(),
      makeInstance("home.time-entries", { cols: 1, rows: 2 }),
      makeInstance("home.quick-note", { cols: 1, rows: 2 }),
    ],
  };
}

/**
 * Resolve a sector-specific default layout. Used by useDashboardLayout when
 * the user has no persisted dashboardLayoutMobile yet (first sign-in or after
 * a reset). Defensive layout sanitisation later strips any widget the sector
 * is not authorised for, so it's safe for all of these to include widgets
 * that are sector-restricted — registry filtering takes care of the rest.
 */
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
      // Admin gets the production layout as a useful default; they can
      // customise to taste.
      return productionLayout();
    default:
      return defaultLayout();
  }
}
