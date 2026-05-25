// Sector-default home dashboard layouts (mobile).
//
// Mirrors the *intent* of `web/src/dashboard/presets.ts` — which widget
// each sector cares about, what it's filtered to, what colour/icon it
// uses — translated to mobile's size shape (`span: 1|2|3`, `rows: 1|2|3|4`)
// and mobile's per-widget config schemas. Every sector web defines a
// preset for, mobile defines an analogous preset for.
//
// Size translation (web → mobile):
//   - cols 1 → span 1
//   - cols 2 → span 2
//   - cols 3 → span 2 or 3 depending on widget allowedSpans
//   - cols 4 → span 3 (clamped — mobile uses a 3-slot row)
//   - rows passes through untouched (1..4)
//
// Layout philosophy on a phone:
//   - Top row: Favoritos (1/3) + Mensagens Recentes (2/3). Pairs cleanly
//     because favorites is span-1 and recent-messages requires span≥2.
//     (Web pairs them as 2+2; on mobile's 3-slot row we use 1+2.)
//   - Below: tables/wide widgets stack full-width (span 3). Side-by-side
//     tables on a phone are unreadable; on web's 4-col grid they work,
//     here they don't.
//
// Per-widget hard size constraints to respect (verify in widget files):
//   - home.recent-messages   : span ∈ {2,3},   rows ∈ {2,3,4}
//   - home.daily-ponto       : span = 3,       rows = 3       (forced)
//   - home.time-entries      : span ∈ {2,3},   rows ∈ {2,3}
//   - home.favorites         : span ∈ {1,2,3}, rows ∈ {1,2,3}
//   - home.quick-note        : span ∈ {1,2,3}, rows ∈ {1,2,3}
//   - home.hr-calendar       : span = 3,       rows ∈ {3,4}    (default 3)
//   - home.production-calendar: span = 3,      rows ∈ {3,4}    (default 3)
//   - table.tasks            : span = 3,       rows ∈ {2,3}
//   - table.items            : span = 3,       rows ∈ {2,3}
//   - table.borrows          : span = 3,       rows ∈ {2,3}
//   - table.ppe-deliveries   : span = 3,       rows ∈ {2,3}
//   - table.hr-requests      : span = 3,       rows ∈ {3,4}    (default 3)
//   - financial.installments : span = 3,       rows ∈ {2,3}
//   - quick-action.budget    : span = 3,       rows ∈ {3,4}    (default 4)
//                              — registered but hidden from allWidgets initially;
//                              kept out of presets pending sign-off (see spec §1.5).
//
// CRITICAL: each config object below MUST use the exact field names declared
// in the widget's Zod schema. Mismatches (e.g. `visibleColumns` instead of
// `columns`, `statuses` instead of `status`) are silently dropped by Zod's
// strip mode and the user gets the schema's default value — making the
// preset functionally useless. Field-name reference (current as of 2026-05-10):
//
//   table.tasks            : { columns, filters: { status, ... }, sort,
//                              showPaintDot, termCriticalHours, ... }
//                            — filter key is `status` (NOT `statuses`);
//                              column field is `columns` (NOT `visibleColumns`);
//                              valid column keys are TASK_COLUMN_KEYS:
//                              task, customerName, serialNumber, status, sector,
//                              responsibles, term, forecastDate, createdAt,
//                              commission, quoteStatus, quoteTotal.
//
//   table.items            : { columns, filters: { stockLevels, isActive, ... },
//                              sort, sorts, ... }
//                            — column field is `columns`; valid keys are
//                              ITEM_COLUMN_KEYS (uniCode, name, brand, category,
//                              quantity, reorderPoint, maxQuantity,
//                              monthlyConsumption, price, totalPrice, supplier,
//                              abcCategory, xyzCategory, isActive,
//                              shouldAssignToUser, createdAt). `isActive` is
//                              a tri-state ("yes"|"no"|"any"), not a boolean.
//
//   table.borrows          : { columns, filters: { statuses, createdPreset,
//                              hideReturned, onlyOverdue, ... }, sorts, ... }
//                            — preset field is `createdPreset` (NOT
//                              `periodPreset`).
//
//   table.ppe-deliveries   : { filters: { statuses, ... }, sorts, ... }
//
//   table.hr-requests      : { display, filters: { searchingFor, estados,
//                              tipos }, sorts, limit, showActionButtons }
//
//   financial.installments : { display: { showBucketChips, layoutMode, ... },
//                              filters: { defaultBucket, hideFullyPaid, ... },
//                              sorts, ... }
//                            — `showBucketChips` lives under `display`,
//                              NOT at top level.
//
// Out-of-scope or not-yet-supported fields are intentionally omitted; once
// each widget's schema gains them, this file is the central place to enable
// them per sector.

import {
  SECTOR_PRIVILEGES,
  TASK_STATUS,
  STOCK_LEVEL,
  PPE_DELIVERY_STATUS,
  BORROW_STATUS,
} from "@/constants/enums";
import { DASHBOARD_LAYOUT_VERSION } from "./types";
import type {
  DashboardLayout,
  WidgetInstance,
  WidgetRows,
  WidgetSpan,
} from "./types";

// ============================================================
// Helpers
// ============================================================

let presetCounter = 0;

/** Stable instance ids: deterministic per-sector via a per-builder counter
 *  reset to 0 at the top of each preset function. Format mirrors web:
 *  `preset-${widgetId}-${n}`. */
function makeInstance(
  widgetId: string,
  span: WidgetSpan,
  rows: WidgetRows,
  config: unknown = {},
): WidgetInstance {
  presetCounter += 1;
  return {
    instanceId: `preset-${widgetId}-${presetCounter}`,
    widgetId,
    size: { span, rows },
    config,
  };
}

// ---------- Typed task config helper ----------
// Centralises the shape so every preset entry below validates cleanly against
// `table.tasks`'s Zod schema. Mirrors web's `taskWidget()` helper.
interface TaskWidgetCfg {
  title: string;
  /** Visible columns, ordered. Must include "task" — the schema enforces
   *  this via a transform but we keep it explicit here. */
  columns?: string[];
  filters?: {
    status?: unknown[];
    sectorIds?: string[];
    customerIds?: string[];
    assigneeIds?: string[];
    termPreset?: string;
    forecastPreset?: string;
    createdPreset?: string;
    isOverdue?: "any" | "yes" | "no";
    defaultSearch?: string;
  };
  sort?: { key: string; direction: "asc" | "desc" };
  limit?: number;
  showPaintDot?: boolean;
  termCriticalHours?: number;
  accent?: { color: string; icon: string; borderColor?: string };
}

function taskWidget(
  span: WidgetSpan,
  rows: WidgetRows,
  cfg: TaskWidgetCfg,
): WidgetInstance {
  return makeInstance("table.tasks", span, rows, {
    title: cfg.title,
    showHeader: true,
    showPaintDot: cfg.showPaintDot ?? true,
    termCriticalHours: cfg.termCriticalHours ?? 4,
    columns: cfg.columns ?? ["task", "status", "term"],
    filters: {
      // Schema field is `status` (singular) — NOT `statuses`. Verified
      // against widgets/task-table.tsx line 418.
      status: cfg.filters?.status ?? [],
      sectorIds: cfg.filters?.sectorIds ?? [],
      customerIds: cfg.filters?.customerIds ?? [],
      assigneeIds: cfg.filters?.assigneeIds ?? [],
      termPreset: cfg.filters?.termPreset ?? "any",
      forecastPreset: cfg.filters?.forecastPreset ?? "any",
      createdPreset: cfg.filters?.createdPreset ?? "any",
      isOverdue: cfg.filters?.isOverdue ?? "any",
      defaultSearch: cfg.filters?.defaultSearch ?? "",
    },
    sort: cfg.sort ?? { key: "term", direction: "asc" },
    limit: cfg.limit ?? 25,
    accent: cfg.accent ?? {
      color: "teal",
      icon: "ClipboardText",
      borderColor: "none",
    },
  });
}

// ---------- Typed item config helper ----------
interface ItemWidgetCfg {
  title: string;
  columns?: string[];
  filters?: {
    stockLevels?: unknown[];
    brandIds?: string[];
    categoryIds?: string[];
    supplierIds?: string[];
    abcCategories?: unknown[];
    xyzCategories?: unknown[];
    /** Tri-state — "yes" | "no" | "any". The schema does NOT accept a
     *  boolean here. */
    isActive?: "yes" | "no" | "any";
  };
  sort?: { key: string; direction: "asc" | "desc" };
  limit?: number;
  accent?: { color: string; icon: string; borderColor?: string };
}

function itemWidget(
  span: WidgetSpan,
  rows: WidgetRows,
  cfg: ItemWidgetCfg,
): WidgetInstance {
  return makeInstance("table.items", span, rows, {
    title: cfg.title,
    showHeader: true,
    columns: cfg.columns ?? ["name", "brand", "quantity", "monthlyConsumption"],
    filters: {
      searchingFor: "",
      stockLevels: cfg.filters?.stockLevels ?? [],
      brandIds: cfg.filters?.brandIds ?? [],
      categoryIds: cfg.filters?.categoryIds ?? [],
      supplierIds: cfg.filters?.supplierIds ?? [],
      abcCategories: cfg.filters?.abcCategories ?? [],
      xyzCategories: cfg.filters?.xyzCategories ?? [],
      // Tri-state default mirrors web: "yes" hides inactive items by default.
      isActive: cfg.filters?.isActive ?? "yes",
      hasReorderPoint: "any",
      hasMaxQuantity: "any",
      shouldAssignToUser: "any",
      quantityMin: null,
      quantityMax: null,
    },
    sort: cfg.sort ?? { key: "quantity", direction: "asc" },
    limit: cfg.limit ?? 30,
    accent: cfg.accent ?? {
      color: "yellow",
      icon: "Package",
      borderColor: "none",
    },
  });
}

// ---------- Typed borrow config helper ----------
interface BorrowWidgetCfg {
  title: string;
  columns?: string[];
  filters?: {
    statuses?: unknown[];
    createdPreset?: string;
    hideReturned?: boolean;
    onlyOverdue?: boolean;
  };
  sort?: { key: string; direction: "asc" | "desc" };
  limit?: number;
  accent?: { color: string; icon: string; borderColor?: string };
}

function borrowWidget(
  span: WidgetSpan,
  rows: WidgetRows,
  cfg: BorrowWidgetCfg,
): WidgetInstance {
  return makeInstance("table.borrows", span, rows, {
    title: cfg.title,
    showHeader: true,
    columns: cfg.columns ?? [
      "itemUniCode",
      "itemName",
      "status",
      "borrowedAt",
    ],
    filters: {
      searchingFor: "",
      statuses: cfg.filters?.statuses ?? [],
      itemIds: [],
      userIds: [],
      categoryIds: [],
      brandIds: [],
      // Schema field is `createdPreset` (NOT `periodPreset`). Verified
      // against widgets/borrow-table.tsx line 267.
      createdPreset: cfg.filters?.createdPreset ?? "any",
      hideReturned: cfg.filters?.hideReturned ?? true,
      onlyOverdue: cfg.filters?.onlyOverdue ?? false,
    },
    sorts: [cfg.sort ?? { key: "createdAt", direction: "desc" }],
    limit: cfg.limit ?? 30,
    accent: cfg.accent ?? {
      color: "violet",
      icon: "Package",
      borderColor: "none",
    },
  });
}

// ---------- Top-row builders shared across most sectors ----------

/** Top row: Favoritos (1/3) + Mensagens Recentes (2/3). Both rows=2 because
 *  recent-messages doesn't allow rows=1 on mobile. The pair fills the row
 *  exactly (1 + 2 = 3 slots). Mirrors web's
 *  `favorites() + recentMessages()` pairing. */
function favorites(): WidgetInstance {
  return makeInstance("home.favorites", 1, 2, {
    title: "Favoritos",
    showHeader: true,
    itemsPerRow: 2,
    accent: { color: "blue", icon: "Star", borderColor: "blue" },
  });
}

function recentMessages(): WidgetInstance {
  return makeInstance("home.recent-messages", 2, 2, {
    title: "Mensagens Recentes",
    showHeader: true,
    accent: { color: "indigo", icon: "Message", borderColor: "indigo" },
  });
}

function topRow(): WidgetInstance[] {
  return [favorites(), recentMessages()];
}

/** Personal time-entries widget — most sectors include this near the
 *  bottom so the worker can confirm their own ponto without leaving the
 *  home screen. */
function myWeekPonto(): WidgetInstance {
  return makeInstance("home.time-entries", 3, 2, {
    title: "Meu Ponto",
    showHeader: true,
    accent: { color: "teal", icon: "Clock", borderColor: "none" },
  });
}

/** Team-wide daily-ponto. Forced to (3, 3) by the widget's allowedSpans
 *  / allowedHeights. */
function teamDailyPonto(): WidgetInstance {
  return makeInstance("home.daily-ponto", 3, 3, {
    title: "Ponto do Dia",
    showHeader: true,
    showProgressBar: true,
    hideEmptyCategories: false,
    accent: { color: "teal", icon: "Clock24", borderColor: "teal" },
  });
}

// ---------- Pre-canned table snippets that recur across presets ----------

// ---------- Pre-canned installment-table snippet ----------
// Centralises the financial.installments shape so each preset's call site
// stays declarative and field-name-correct.
interface InstallmentSnapshotCfg {
  title: string;
  span?: WidgetSpan;
  rows?: WidgetRows;
  defaultBucket?:
    | "all"
    | "overdue"
    | "today"
    | "tomorrow"
    | "next-7-days"
    | "next-30-days"
    | "this-month";
  sortDirection?: "asc" | "desc";
  hideFullyPaid?: boolean;
  showBucketChips?: boolean;
  accent?: { color: string; icon: string; borderColor?: string };
}

function installmentSnapshot(cfg: InstallmentSnapshotCfg): WidgetInstance {
  return makeInstance(
    "financial.installments",
    cfg.span ?? 3,
    cfg.rows ?? 2,
    {
      title: cfg.title,
      // `display` MUST be the parent of `showBucketChips`, `layoutMode`, etc.
      // — verified against widgets/installment-table.tsx line 229.
      display: {
        density: "comfortable",
        striping: true,
        gridLines: true,
        hoverHighlight: true,
        stickyHeader: false,
        showSearchBox: true,
        showRowDot: false,
        showColumnHeaders: true,
        showBucketChips: cfg.showBucketChips ?? true,
        showCount: true,
        layoutMode: "flat",
        emptyStateMessage: "",
        refetchInterval: "0",
      },
      filters: {
        defaultBucket: cfg.defaultBucket ?? "next-30-days",
        installmentStatuses: [],
        bankSlipStatuses: [],
        customerIds: [],
        hideFullyPaid: cfg.hideFullyPaid ?? false,
        hideMissingBankSlip: false,
      },
      // Schema field is `sorts` (array) — NOT `sort` (object). Verified
      // against widgets/installment-table.tsx line 329.
      sorts: [{ key: "dueDate", direction: cfg.sortDirection ?? "asc" }],
      limit: 30,
      accent: cfg.accent ?? {
        color: "blue",
        icon: "Receipt",
        borderColor: "none",
      },
    },
  );
}

function lowStockSnapshot(title = "Estoque Baixo"): WidgetInstance {
  return itemWidget(3, 3, {
    title,
    columns: ["name", "brand", "quantity", "monthlyConsumption"],
    filters: {
      stockLevels: [
        STOCK_LEVEL.NEGATIVE_STOCK,
        STOCK_LEVEL.OUT_OF_STOCK,
        STOCK_LEVEL.CRITICAL,
        STOCK_LEVEL.LOW,
      ],
      isActive: "yes",
    },
    sort: { key: "quantity", direction: "asc" },
    limit: 30,
    accent: { color: "red", icon: "Package", borderColor: "red" },
  });
}

// ============================================================
// PRODUCTION
// ----------------------------------------------------------------
// Layout mirrors Pedro Antônio de Oliveira's saved mobile dashboard
// (2026-05-24) — the config a real production-sector worker hand-tuned
// and uses day-to-day: Recent Messages, their own Ponto, and the
// Produtividade chart. This is the canonical PRODUCTION default per the
// user's direction. (Replaced the older kennedy.ankaa@gmail.com layout.)
// ============================================================
function productionLayout(): DashboardLayout {
  presetCounter = 0;
  return {
    version: DASHBOARD_LAYOUT_VERSION,
    updatedAt: new Date().toISOString(),
    items: [
      makeInstance("home.recent-messages", 3, 1, {
        title: "Mensagens Recentes",
        accent: { icon: "Message", color: "indigo", borderColor: "indigo" },
        density: "compact",
        display: { showHeader: true, showViewAll: false },
        showCount: false,
        itemsPerRow: 3,
        itemsPerColumn: 1,
      }),
      makeInstance("home.time-entries", 3, 1, {
        title: "Meu Ponto",
        accent: { icon: "Clock", color: "teal", borderColor: "none" },
        display: {
          density: "compact",
          striping: true,
          gridLines: true,
          showRowDot: false,
          stickyHeader: false,
          showSearchBox: true,
          hoverHighlight: true,
          refetchInterval: "0",
          emptyStateMessage: "",
          showColumnHeaders: true,
        },
        showHeader: true,
        showViewAll: false,
      }),
      makeInstance("production.productivity", 3, 2, {
        title: "Produtividade",
        accent: { icon: "ChartBar", color: "blue" },
        goal: { enabled: true },
        chart: { type: "bar" },
        metric: { yAxisMode: "count" },
        period: { preset: "current-year", xAxisMode: "month" },
        display: { showHeader: true, showSummary: false },
        filters: { sectorIds: [] },
      }),
    ],
  };
}

// ============================================================
// PRODUCTION_MANAGER
// ----------------------------------------------------------------
// Pairs the team's daily ponto with two task panels — overdue work
// currently in production, and the upcoming queue — plus favorites
// and recent messages.
// ============================================================
function productionManagerLayout(): DashboardLayout {
  presetCounter = 0;
  return {
    version: DASHBOARD_LAYOUT_VERSION,
    updatedAt: new Date().toISOString(),
    items: [
      ...topRow(),
      teamDailyPonto(),
      taskWidget(3, 2, {
        title: "Tarefas em Execução",
        columns: ["task", "customerName", "term", "status"],
        filters: {
          status: [TASK_STATUS.IN_PRODUCTION],
          isOverdue: "yes",
        },
        sort: { key: "term", direction: "asc" },
        limit: 20,
        accent: { color: "blue", icon: "ClipboardText", borderColor: "blue" },
      }),
      taskWidget(3, 2, {
        title: "Tarefas Próximas",
        columns: ["task", "customerName", "term", "status"],
        filters: {
          status: [
            TASK_STATUS.PREPARATION,
            TASK_STATUS.WAITING_PRODUCTION,
            TASK_STATUS.IN_PRODUCTION,
          ],
        },
        sort: { key: "term", direction: "asc" },
        limit: 20,
        accent: {
          color: "orange",
          icon: "ClipboardText",
          borderColor: "orange",
        },
      }),
    ],
  };
}

// ============================================================
// WAREHOUSE
// ----------------------------------------------------------------
// Stocks paint, vinyl, and supplies. Wants to see what's running out
// FIRST (negative / out / critical / low), then what's being made
// right now so they can pre-stage materials.
// ============================================================
function warehouseLayout(): DashboardLayout {
  presetCounter = 0;
  return {
    version: DASHBOARD_LAYOUT_VERSION,
    updatedAt: new Date().toISOString(),
    items: [
      ...topRow(),
      itemWidget(3, 3, {
        title: "Estoque Crítico",
        columns: [
          "name",
          "brand",
          "quantity",
          "reorderPoint",
          "monthlyConsumption",
        ],
        filters: {
          stockLevels: [
            STOCK_LEVEL.NEGATIVE_STOCK,
            STOCK_LEVEL.OUT_OF_STOCK,
            STOCK_LEVEL.CRITICAL,
            STOCK_LEVEL.LOW,
          ],
          isActive: "yes",
        },
        sort: { key: "quantity", direction: "asc" },
        limit: 50,
        accent: { color: "red", icon: "Package", borderColor: "red" },
      }),
      borrowWidget(3, 2, {
        title: "Empréstimos Ativos",
        columns: [
          "itemUniCode",
          "itemName",
          "userName",
          "status",
          "borrowedAt",
        ],
        filters: {
          statuses: [BORROW_STATUS.ACTIVE],
          createdPreset: "any",
          hideReturned: true,
          onlyOverdue: false,
        },
        sort: { key: "createdAt", direction: "desc" },
        limit: 30,
        accent: { color: "violet", icon: "Package", borderColor: "none" },
      }),
      itemWidget(3, 2, {
        title: "Itens Classe A (alto valor)",
        columns: ["name", "brand", "quantity", "price", "abcCategory"],
        filters: { isActive: "yes" },
        sort: { key: "quantity", direction: "desc" },
        limit: 20,
        accent: { color: "yellow", icon: "Package", borderColor: "none" },
      }),
      taskWidget(3, 2, {
        title: "Em Produção (preparar material)",
        columns: ["task", "customerName", "serialNumber", "term"],
        filters: {
          status: [TASK_STATUS.IN_PRODUCTION, TASK_STATUS.WAITING_PRODUCTION],
        },
        sort: { key: "term", direction: "asc" },
        limit: 20,
        accent: { color: "blue", icon: "ClipboardText", borderColor: "blue" },
      }),
      myWeekPonto(),
    ],
  };
}

// ============================================================
// LOGISTIC
// ----------------------------------------------------------------
// Pairs the production calendar with overdue in-production work and a
// 7-day forecast queue, plus favorites and recent messages.
// Web also includes the production-calendar widget — mirrored here.
// ============================================================
function logisticLayout(): DashboardLayout {
  presetCounter = 0;
  return {
    version: DASHBOARD_LAYOUT_VERSION,
    updatedAt: new Date().toISOString(),
    items: [
      ...topRow(),
      // production-calendar config: nested `display.*` and `filters.*` shape
      // matches `widgets/production-calendar.tsx` configSchema (agent 16
      // owns that widget; field names come from spec §6.9).
      makeInstance("home.production-calendar", 3, 3, {
        title: "Calendário de Produção",
        accent: { color: "indigo", icon: "Calendar", borderColor: "none" },
        display: {
          showHeader: true,
          showFilters: true,
          showTerm: true,
          showForecast: true,
          showStarted: true,
          showFinished: true,
          showSunday: false,
          showSaturday: false,
        },
        filters: {
          statuses: [
            TASK_STATUS.PREPARATION,
            TASK_STATUS.WAITING_PRODUCTION,
            TASK_STATUS.IN_PRODUCTION,
            TASK_STATUS.COMPLETED,
          ],
          includeCancelled: false,
        },
      }),
      taskWidget(3, 2, {
        title: "Em Execução",
        columns: ["task", "customerName", "term", "forecastDate"],
        filters: {
          status: [TASK_STATUS.IN_PRODUCTION],
          isOverdue: "yes",
        },
        sort: { key: "term", direction: "asc" },
        limit: 20,
        accent: { color: "blue", icon: "ClipboardText", borderColor: "blue" },
      }),
      taskWidget(3, 2, {
        title: "Próximas",
        columns: ["task", "customerName", "term", "forecastDate"],
        filters: {
          status: [TASK_STATUS.WAITING_PRODUCTION, TASK_STATUS.IN_PRODUCTION],
        },
        sort: { key: "term", direction: "asc" },
        limit: 20,
        accent: {
          color: "orange",
          icon: "ClipboardText",
          borderColor: "orange",
        },
      }),
      myWeekPonto(),
    ],
  };
}

// ============================================================
// DESIGNER
// ----------------------------------------------------------------
// Creates the artwork/layout for each truck. Their queue is "tasks in
// PREPARATION that don't have artworks yet" — mobile schema doesn't
// support hasArtworks tri-state, so we approximate with status only.
// ============================================================
function designerLayout(): DashboardLayout {
  presetCounter = 0;
  return {
    version: DASHBOARD_LAYOUT_VERSION,
    updatedAt: new Date().toISOString(),
    items: [
      ...topRow(),
      taskWidget(3, 3, {
        title: "Em Preparação",
        columns: ["task", "customerName", "serialNumber", "term"],
        filters: {
          status: [TASK_STATUS.PREPARATION, TASK_STATUS.WAITING_PRODUCTION],
        },
        sort: { key: "term", direction: "asc" },
        limit: 30,
        accent: {
          color: "violet",
          icon: "ClipboardText",
          borderColor: "violet",
        },
      }),
      taskWidget(3, 2, {
        title: "Concluídas Recentes",
        columns: ["task", "customerName", "term", "status"],
        filters: { status: [TASK_STATUS.COMPLETED] },
        sort: { key: "createdAt", direction: "desc" },
        limit: 15,
        accent: { color: "green", icon: "ClipboardText", borderColor: "green" },
      }),
      myWeekPonto(),
    ],
  };
}

// ============================================================
// PLOTTING
// ----------------------------------------------------------------
// Cuts the vinyl using a plotter once the artwork is ready.
// ============================================================
function plottingLayout(): DashboardLayout {
  presetCounter = 0;
  return {
    version: DASHBOARD_LAYOUT_VERSION,
    updatedAt: new Date().toISOString(),
    items: [
      ...topRow(),
      taskWidget(3, 3, {
        title: "Aguardando Plotagem",
        columns: ["task", "customerName", "serialNumber", "term"],
        filters: {
          status: [TASK_STATUS.PREPARATION, TASK_STATUS.WAITING_PRODUCTION],
        },
        sort: { key: "term", direction: "asc" },
        limit: 30,
        accent: {
          color: "fuchsia",
          icon: "ClipboardText",
          borderColor: "fuchsia",
        },
      }),
      taskWidget(3, 2, {
        title: "Em Produção",
        columns: ["task", "customerName", "term", "status"],
        filters: { status: [TASK_STATUS.IN_PRODUCTION] },
        sort: { key: "term", direction: "asc" },
        limit: 20,
        accent: { color: "blue", icon: "ClipboardText", borderColor: "blue" },
      }),
      myWeekPonto(),
    ],
  };
}

// ============================================================
// COMMERCIAL
// ----------------------------------------------------------------
// Pairs quote-approval and billing-approval queues with the boletos
// pipeline. Web filters by quoteStatuses — mobile doesn't expose that
// field yet, so we approximate by status.
// ============================================================
function commercialLayout(): DashboardLayout {
  presetCounter = 0;
  return {
    version: DASHBOARD_LAYOUT_VERSION,
    updatedAt: new Date().toISOString(),
    items: [
      ...topRow(),
      taskWidget(3, 3, {
        title: "Orçamentos Aguardando Aprovação",
        columns: [
          "task",
          "customerName",
          "quoteStatus",
          "quoteTotal",
          "term",
        ],
        filters: { status: [TASK_STATUS.PREPARATION] },
        sort: { key: "term", direction: "asc" },
        limit: 30,
        accent: { color: "slate", icon: "ClipboardText", borderColor: "slate" },
      }),
      taskWidget(3, 2, {
        title: "Faturamento Aguardando Aprovação",
        columns: ["task", "customerName", "commission", "quoteTotal"],
        showPaintDot: false,
        filters: { status: [TASK_STATUS.COMPLETED] },
        sort: { key: "createdAt", direction: "desc" },
        limit: 30,
        accent: { color: "red", icon: "ClipboardText", borderColor: "red" },
      }),
      installmentSnapshot({
        title: "Boletos",
        accent: { color: "green", icon: "Receipt", borderColor: "green" },
      }),
      myWeekPonto(),
    ],
  };
}

// ============================================================
// FINANCIAL
// ----------------------------------------------------------------
// Pairs the billing-approval queue with two installment views —
// upcoming/overdue and the most recent receipts.
// ============================================================
function financialLayout(): DashboardLayout {
  presetCounter = 0;
  return {
    version: DASHBOARD_LAYOUT_VERSION,
    updatedAt: new Date().toISOString(),
    items: [
      ...topRow(),
      taskWidget(3, 2, {
        title: "Faturamento Aguardando Aprovação",
        columns: ["task", "customerName", "commission", "quoteTotal"],
        showPaintDot: false,
        filters: { status: [TASK_STATUS.COMPLETED] },
        sort: { key: "createdAt", direction: "desc" },
        limit: 30,
        accent: { color: "red", icon: "ClipboardText", borderColor: "red" },
      }),
      installmentSnapshot({
        title: "Próximos Boletos",
        defaultBucket: "next-30-days",
        sortDirection: "asc",
        accent: { color: "amber", icon: "Receipt", borderColor: "amber" },
      }),
      installmentSnapshot({
        title: "Últimos Pagamentos Recebidos",
        defaultBucket: "all",
        sortDirection: "desc",
        showBucketChips: false,
        accent: { color: "green", icon: "Receipt", borderColor: "green" },
      }),
    ],
  };
}

// ============================================================
// HUMAN_RESOURCES + ADMIN (shared)
// ----------------------------------------------------------------
// Web pairs Ponto do Dia with the HR requisitions queue and the PPE
// delivery queue. Mobile mirrors the same set; HR requests is a NEW
// widget being added by agent 15.
// ============================================================
function hrAndAdminItems(): WidgetInstance[] {
  return [
    ...topRow(),
    teamDailyPonto(),
    // hr-requests-table — schema fields verified against
    // widgets/hr-requests-table.tsx (display nested; sorts is multi-key array;
    // estados/tipos are integer arrays).
    makeInstance("table.hr-requests", 3, 3, {
      title: "Requisições de RH",
      showActionButtons: true,
      display: {
        density: "comfortable",
        striping: true,
        gridLines: true,
        hoverHighlight: true,
        showHeader: true,
        showCount: true,
        showSearchBox: false,
        emptyStateMessage: "",
        refetchInterval: "0",
      },
      filters: {
        searchingFor: "",
        estados: [0],
        tipos: [],
      },
      sorts: [{ key: "dataSolicitacao", direction: "desc" }],
      limit: 30,
      accent: { color: "indigo", icon: "Clock", borderColor: "none" },
    }),
    // ppe-deliveries — schema fields verified against
    // widgets/ppe-delivery-table.tsx; uses `sorts` (array) and a
    // tri-state-style `onlyActionable` boolean.
    makeInstance("table.ppe-deliveries", 3, 2, {
      title: "Entregas de EPI",
      showHeader: true,
      filters: {
        searchingFor: "",
        statuses: [
          PPE_DELIVERY_STATUS.PENDING,
          PPE_DELIVERY_STATUS.WAITING_SIGNATURE,
        ],
        itemIds: [],
        userIds: [],
        onlyActionable: false,
      },
      sorts: [{ key: "createdAt", direction: "desc" }],
      limit: 30,
      accent: { color: "amber", icon: "ClipboardCheck", borderColor: "amber" },
    }),
  ];
}

function hrLayout(): DashboardLayout {
  presetCounter = 0;
  return {
    version: DASHBOARD_LAYOUT_VERSION,
    updatedAt: new Date().toISOString(),
    items: hrAndAdminItems(),
  };
}

function adminLayout(): DashboardLayout {
  presetCounter = 0;
  return {
    version: DASHBOARD_LAYOUT_VERSION,
    updatedAt: new Date().toISOString(),
    items: hrAndAdminItems(),
  };
}

// ============================================================
// MAINTENANCE
// ----------------------------------------------------------------
// Keeps tools and equipment running. Without a dedicated maintenance
// widget yet, the inventory table covers their day. Recent messages
// keep them in the loop on tool requests from production.
// ============================================================
function maintenanceLayout(): DashboardLayout {
  presetCounter = 0;
  return {
    version: DASHBOARD_LAYOUT_VERSION,
    updatedAt: new Date().toISOString(),
    items: [
      ...topRow(),
      itemWidget(3, 3, {
        title: "Itens com Manutenção",
        columns: ["name", "brand", "category", "quantity", "monthlyConsumption"],
        filters: { isActive: "yes" },
        sort: { key: "name", direction: "asc" },
        limit: 50,
        accent: { color: "yellow", icon: "Package", borderColor: "none" },
      }),
      lowStockSnapshot("Estoque Baixo"),
      myWeekPonto(),
    ],
  };
}

// ============================================================
// EXTERNAL
// ----------------------------------------------------------------
// Very limited access. Just favorites + messages — no production /
// financial visibility.
// ============================================================
function externalLayout(): DashboardLayout {
  presetCounter = 0;
  return {
    version: DASHBOARD_LAYOUT_VERSION,
    updatedAt: new Date().toISOString(),
    items: topRow(),
  };
}

// ============================================================
// Default fallback (BASIC users + anyone without a sector preset)
// ============================================================
function defaultLayout(): DashboardLayout {
  presetCounter = 0;
  return {
    version: DASHBOARD_LAYOUT_VERSION,
    updatedAt: new Date().toISOString(),
    items: [
      ...topRow(),
      taskWidget(3, 2, {
        title: "Tarefas com Prazo Hoje",
        columns: ["task", "customerName", "term"],
        filters: {
          status: [TASK_STATUS.IN_PRODUCTION, TASK_STATUS.WAITING_PRODUCTION],
          termPreset: "today",
        },
        sort: { key: "term", direction: "asc" },
        limit: 25,
        accent: { color: "blue", icon: "ClipboardText", borderColor: "blue" },
      }),
      taskWidget(3, 2, {
        title: "Liberação Próxima",
        columns: ["task", "customerName", "forecastDate"],
        filters: {
          status: [TASK_STATUS.IN_PRODUCTION],
          forecastPreset: "next-7-days",
        },
        sort: { key: "forecastDate", direction: "asc" },
        limit: 25,
        accent: {
          color: "orange",
          icon: "ClipboardText",
          borderColor: "orange",
        },
      }),
      lowStockSnapshot("Estoque Baixo"),
      myWeekPonto(),
    ],
  };
}

// ============================================================
// Sector → preset map
// ============================================================

const presetsBySector: Partial<Record<SECTOR_PRIVILEGES, () => DashboardLayout>> = {
  [SECTOR_PRIVILEGES.PRODUCTION]: productionLayout,
  [SECTOR_PRIVILEGES.PRODUCTION_MANAGER]: productionManagerLayout,
  [SECTOR_PRIVILEGES.WAREHOUSE]: warehouseLayout,
  [SECTOR_PRIVILEGES.LOGISTIC]: logisticLayout,
  [SECTOR_PRIVILEGES.DESIGNER]: designerLayout,
  [SECTOR_PRIVILEGES.PLOTTING]: plottingLayout,
  [SECTOR_PRIVILEGES.COMMERCIAL]: commercialLayout,
  [SECTOR_PRIVILEGES.FINANCIAL]: financialLayout,
  [SECTOR_PRIVILEGES.HUMAN_RESOURCES]: hrLayout,
  [SECTOR_PRIVILEGES.MAINTENANCE]: maintenanceLayout,
  [SECTOR_PRIVILEGES.ADMIN]: adminLayout,
  [SECTOR_PRIVILEGES.EXTERNAL]: externalLayout,
};

export function getDefaultLayoutForSector(
  sector: SECTOR_PRIVILEGES | null | undefined,
): DashboardLayout {
  if (!sector) return defaultLayout();
  const builder = presetsBySector[sector];
  return builder ? builder() : defaultLayout();
}
