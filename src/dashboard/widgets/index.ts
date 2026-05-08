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
// Inventory.
import { itemTableWidget } from "./item-table";
import { borrowTableWidget } from "./borrow-table";
// Production.
import { taskTableWidget } from "./task-table";
// Financial.
import { installmentTableWidget } from "./installment-table";

const allWidgets: any[] = [
  // Workhorse data widgets first (most-used surface area).
  taskTableWidget,
  itemTableWidget,
  borrowTableWidget,
  installmentTableWidget,
  // HR approval queues.
  ppeDeliveryTableWidget,
  dailyPontoWidget,
  // Quick-action.
  quickNoteWidget,
  // Personal.
  favoritesWidget,
  recentMessagesWidget,
  timeEntriesWidget,
];

let registered = false;
export function registerAllWidgets(): void {
  if (registered) return;
  registered = true;
  for (const w of allWidgets) {
    widgetRegistry.register(w);
  }
}

registerAllWidgets();
