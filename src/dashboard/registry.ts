// Widget registry — single source of truth for which widgets exist
// and which sectors can use them. Mirrors web/src/dashboard/registry.ts.

import { SECTOR_PRIVILEGES } from "@/constants/enums";
import type { WidgetCategory, WidgetDefinition } from "./types";

class WidgetRegistry {
  private defs = new Map<string, WidgetDefinition<any>>();

  register<T>(def: WidgetDefinition<T>): void {
    if (this.defs.has(def.id)) {
      if (process.env.NODE_ENV !== "production") {
        // eslint-disable-next-line no-console
        console.warn(`[WidgetRegistry] Duplicate registration for "${def.id}"`);
      }
    }
    this.defs.set(def.id, def as WidgetDefinition<any>);
  }

  get(id: string): WidgetDefinition<any> | undefined {
    return this.defs.get(id);
  }

  has(id: string): boolean {
    return this.defs.has(id);
  }

  all(): WidgetDefinition<any>[] {
    return Array.from(this.defs.values());
  }

  /**
   * Widgets the user is allowed to add to their dashboard.
   * Rules:
   * - ADMIN sees everything
   * - Widgets with `allowedSectors === "*"` are visible to everyone
   * - Otherwise the user's sector must appear in `allowedSectors`
   */
  getAvailableWidgets(
    userSector: SECTOR_PRIVILEGES | null | undefined,
  ): WidgetDefinition<any>[] {
    if (!userSector) return [];
    const isAdmin = userSector === SECTOR_PRIVILEGES.ADMIN;
    return this.all().filter((def) => {
      if (def.allowedSectors === "*") return true;
      if (isAdmin) return true;
      return def.allowedSectors.includes(userSector);
    });
  }

  groupByCategory(
    userSector: SECTOR_PRIVILEGES | null | undefined,
  ): Array<{ category: WidgetCategory; widgets: WidgetDefinition<any>[] }> {
    const widgets = this.getAvailableWidgets(userSector);
    const groups = new Map<WidgetCategory, WidgetDefinition<any>[]>();
    for (const w of widgets) {
      const list = groups.get(w.category) ?? [];
      list.push(w);
      groups.set(w.category, list);
    }
    return Array.from(groups.entries()).map(([category, widgets]) => ({
      category,
      widgets,
    }));
  }

  canUserUse(
    widgetId: string,
    userSector: SECTOR_PRIVILEGES | null | undefined,
  ): boolean {
    if (!userSector) return false;
    const def = this.get(widgetId);
    if (!def) return false;
    if (def.allowedSectors === "*") return true;
    if (userSector === SECTOR_PRIVILEGES.ADMIN) return true;
    return def.allowedSectors.includes(userSector);
  }
}

export const widgetRegistry = new WidgetRegistry();
export type { WidgetRegistry };
