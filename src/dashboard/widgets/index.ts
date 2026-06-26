// Widget barrel — registers every available mobile widget with the registry.
//
// To add a new widget: create a file in this directory exporting a
// WidgetDefinition, then import it here and push it onto the array.

import { widgetRegistry } from "../registry";
// Phase 1+2 — wrappers around existing components.
import { timeEntriesWidget } from "./time-entries";
import { recentMessagesWidget } from "./recent-messages";
import { favoritesWidget } from "./favorites";
// Quick-action / personal.
import { quickNoteWidget } from "./quick-note";
// HR.
import { ppeDeliveryTableWidget } from "./ppe-delivery-table";
import { dailyPontoWidget } from "./daily-ponto";
import { leaderPontoWidget } from "./leader-ponto";
// HR — agent 15 additions (NEW widgets, missing on mobile until now).
import { personnelDepartmentCalendarWidget } from "./personnel-department-calendar";
import { personnelDepartmentRequestsTableWidget } from "./personnel-department-requests-table";
// END AGENT 15 IMPORTS
// Inventory.
import { itemTableWidget } from "./item-table";
import { borrowTableWidget } from "./borrow-table";
// Production.
import { taskTableWidget } from "./task-table";
import { productionCalendarWidget } from "./production-calendar";
import { productivityWidget } from "./productivity";
// Financial.
import { installmentTableWidget } from "./installment-table";
// Quick-action — registered (importable for re-enable) but kept out of the
// gallery list initially. Mirrors web/src/dashboard/widgets/index.ts which
// likewise excludes quick-budget while it's pending sign-off.
import { quickBudgetWidget } from "./quick-budget";

const allWidgets: any[] = [
  // Workhorse data widgets first (most-used surface area).
  taskTableWidget,
  itemTableWidget,
  borrowTableWidget,
  installmentTableWidget,
  // HR approval queues + new HR widgets.
  ppeDeliveryTableWidget,
  dailyPontoWidget,
  leaderPontoWidget,
  personnelDepartmentRequestsTableWidget,
  personnelDepartmentCalendarWidget,
  // Production calendars.
  productionCalendarWidget,
  productivityWidget,
  // Quick-action.
  quickNoteWidget,
  // Personal.
  favoritesWidget,
  recentMessagesWidget,
  timeEntriesWidget,
];

// Side-channel registration of widgets we don't put in the gallery yet.
// The registry needs to know about them so existing layouts referencing
// the IDs can still render — but `allWidgets` (which is what the gallery
// pulls from via `widgetRegistry.all()`) excludes them.
const hiddenWidgets: any[] = [quickBudgetWidget];

let registered = false;
export function registerAllWidgets(): void {
  if (registered) return;
  registered = true;
  for (const w of allWidgets) {
    widgetRegistry.register(w);
  }
  for (const w of hiddenWidgets) {
    widgetRegistry.register(w);
  }
}

registerAllWidgets();
