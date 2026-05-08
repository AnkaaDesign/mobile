// Mobile dashboard barrel — public surface for the home screen and any other
// consumer that needs to render or configure widgets.

export * from "./types";
export * from "./schemas";
export { widgetRegistry } from "./registry";
export type { WidgetRegistry } from "./registry";
export { useDashboardLayout } from "./hooks/use-dashboard-layout";
export { useMyPreferences } from "./hooks/use-my-preferences";
export { DashboardList } from "./components/dashboard-list";
export { WidgetTile } from "./components/widget-tile";
export { WidgetCard } from "./components/widget-card";
export { getDefaultLayoutForSector } from "./presets";

// Side-effect: register all widgets with the registry on import.
// Mirrors the web pattern (see web/src/dashboard/widgets/index.ts:54).
import "./widgets";
