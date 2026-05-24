// Edit-mode state machine + persistence for the mobile home dashboard.
//
// Independent from web: persists to Preferences.dashboardLayoutMobile and
// uses the mobile-only `{span}` size shape. A web layout JSON cannot be parsed
// here (different schema) — that's intentional, the two platforms keep their
// own state.
//
// Read flow:
//   preferences.dashboardLayoutMobile (JSON)
//     → parseLayout (current schema) → use directly
//     → fall back to parseLegacyLayout (v1 with {cols, rows})
//        → re-attach each instance's size from widget.defaultSpan
//     → fall back to sector preset if absent or unrecognizable
//
// Edit flow: enterEdit() snapshots the working layout. Mutations
// (add/remove/reorder/configure/resize) update local state and mark dirty.
// saveAndExit() PUTs to /preferences/:id; discardAndExit() restores snapshot.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { SECTOR_PRIVILEGES } from "@/constants/enums";
import { useMyPreferences } from "./use-my-preferences";
import { widgetRegistry } from "../registry";
import { parseLayout, parseLegacyLayout } from "../schemas";
import { DASHBOARD_LAYOUT_VERSION } from "../types";
import type {
  DashboardLayout,
  WidgetInstance,
  WidgetSize,
  WidgetSpan,
  WidgetRows,
} from "../types";
import { WIDGET_ROW_VALUES } from "../types";
import { getDefaultLayoutForSector } from "../presets";
import { logFrameworkWarning } from "../internal/logger";

function clampSpan(widgetId: string, requested: WidgetSpan): WidgetSpan {
  const def = widgetRegistry.get(widgetId);
  if (!def) return requested;
  if (def.allowedSpans.includes(requested)) return requested;
  const sorted = [...def.allowedSpans].sort((a, b) => a - b);
  if (sorted.length === 0) return def.defaultSpan;
  if (requested < sorted[0]) return sorted[0];
  if (requested > sorted[sorted.length - 1]) return sorted[sorted.length - 1];
  return def.defaultSpan;
}

function clampRows(widgetId: string, requested: WidgetRows): WidgetRows {
  const def = widgetRegistry.get(widgetId);
  if (!def) return requested;
  const allowed = def.allowedHeights ?? WIDGET_ROW_VALUES;
  if (allowed.includes(requested)) return requested;
  const sorted = [...allowed].sort((a, b) => a - b);
  if (sorted.length === 0) return def.defaultRows;
  if (requested < sorted[0]) return sorted[0];
  if (requested > sorted[sorted.length - 1]) return sorted[sorted.length - 1];
  return def.defaultRows;
}

function clampSize(widgetId: string, requested: WidgetSize): WidgetSize {
  return {
    span: clampSpan(widgetId, requested.span),
    rows: clampRows(widgetId, requested.rows),
  };
}

/**
 * Structural compare for two layouts. Cheaper than JSON.stringify on every
 * render (which allocated and stringified ~10KB on each keystroke in edit
 * mode) — we walk items by index and bail on first difference. Configs fall
 * back to JSON.stringify per-item but only when sizes/IDs match, so most
 * dirty checks short-circuit before reaching that path.
 */
function layoutsEqual(a: DashboardLayout, b: DashboardLayout): boolean {
  if (a === b) return true;
  if (a.items.length !== b.items.length) return false;
  for (let i = 0; i < a.items.length; i++) {
    const ai = a.items[i];
    const bi = b.items[i];
    if (ai.instanceId !== bi.instanceId) return false;
    if (ai.widgetId !== bi.widgetId) return false;
    if (ai.size.span !== bi.size.span) return false;
    if (ai.size.rows !== bi.size.rows) return false;
    if (ai.config !== bi.config) {
      // Configs are mutated by setState replacement on configureWidget, so
      // reference equality catches the no-change path. Only fall through to
      // a deep compare if references differ.
      if (JSON.stringify(ai.config) !== JSON.stringify(bi.config)) return false;
    }
  }
  return true;
}

// Module-local counter to defeat millisecond collisions in the fallback path
// when crypto.randomUUID is unavailable. Date.now() can collide on rapid
// multi-add (e.g. user adds 4 widgets in <1ms via fast taps); the counter
// guarantees per-process uniqueness without taking a polyfill dependency.
let __instanceCounter = 0;

function newInstanceId(): string {
  if (typeof crypto !== "undefined" && typeof (crypto as any).randomUUID === "function") {
    return (crypto as any).randomUUID();
  }
  __instanceCounter += 1;
  return `inst-${Date.now()}-${__instanceCounter}-${Math.random().toString(36).slice(2, 10)}`;
}

interface SanitizeResult {
  layout: DashboardLayout;
  /** Instance IDs whose persisted config failed Zod validation and were
   *  replaced with the widget's defaultConfig. Surfaced to the UI so the
   *  user can be told their saved config was lost (and offered a Reset
   *  affordance) instead of silently swapping under them. */
  restoredInstanceIds: ReadonlySet<string>;
}

/**
 * Strip widgets the user is no longer allowed to use (sector changed, widget
 * removed), clamp each instance's size to allowed spans/rows, AND validate
 * each instance's config against its widget's Zod schema. Validation runs
 * once at load time (not on every render in widget-tile.tsx as before).
 */
function sanitizeLayout(
  layout: DashboardLayout,
  userSector: SECTOR_PRIVILEGES | null | undefined,
  isLeader = false,
): SanitizeResult {
  const restored = new Set<string>();
  const items = layout.items.flatMap<WidgetInstance>((item) => {
    if (!widgetRegistry.has(item.widgetId)) return [];
    if (!widgetRegistry.canUserUse(item.widgetId, userSector, isLeader)) return [];
    const def = widgetRegistry.get(item.widgetId);
    if (!def) return [];
    const parsed = def.configSchema.safeParse(item.config);
    let nextConfig: unknown;
    if (parsed.success) {
      nextConfig = parsed.data;
    } else {
      restored.add(item.instanceId);
      nextConfig = def.defaultConfig;
      logFrameworkWarning("widget-tile", "config-restored", {
        widgetId: item.widgetId,
        instanceId: item.instanceId,
        zodError: parsed.error.issues,
      });
    }
    return [
      {
        ...item,
        size: clampSize(item.widgetId, item.size),
        config: nextConfig,
      },
    ];
  });
  return { layout: { ...layout, items }, restoredInstanceIds: restored };
}

/**
 * Read raw preference value, deciding between current-schema, legacy-v1, and
 * preset fallback. Returns a layout that's safe to render — sizes already
 * filled in for any legacy items.
 */
function loadLayoutFromPreferences(
  raw: unknown,
  userSector: SECTOR_PRIVILEGES | null | undefined,
): DashboardLayout {
  // Path 1: current schema parses cleanly.
  const current = parseLayout(raw);
  if (current) return current;

  // Path 2: legacy v1 layout — re-attach each instance's defaultSpan from its
  // widget definition. Unknown widgets get dropped (they'll be re-stripped by
  // sanitizeLayout anyway).
  const legacy = parseLegacyLayout(raw);
  if (legacy) {
    return {
      version: DASHBOARD_LAYOUT_VERSION,
      updatedAt: legacy.updatedAt,
      items: legacy.items.map((it) => {
        const def = widgetRegistry.get(it.widgetId);
        const span = (def?.defaultSpan ?? 3) as WidgetSpan;
        const rows = (def?.defaultRows ?? 2) as WidgetRows;
        return {
          instanceId: it.instanceId,
          widgetId: it.widgetId,
          size: { span, rows },
          config: it.config,
        };
      }),
    };
  }

  // Path 3: nothing usable — sector preset.
  return getDefaultLayoutForSector(userSector);
}

export interface UseDashboardLayoutReturn {
  layout: DashboardLayout;
  isLoading: boolean;
  isSaving: boolean;
  isDirty: boolean;
  isEditing: boolean;
  /** Instance IDs whose persisted config was invalid and was replaced with
   *  the widget's defaultConfig at load time. Tiles consult this set to
   *  display a one-time "config restored" banner in edit mode so users
   *  notice instead of having defaults silently swapped in. */
  restoredInstanceIds: ReadonlySet<string>;
  enterEdit: () => void;
  saveAndExit: () => Promise<void>;
  discardAndExit: () => void;
  addWidget: (widgetId: string, config?: unknown) => void;
  removeWidget: (instanceId: string) => void;
  reorderItems: (items: WidgetInstance[]) => void;
  resizeWidget: (instanceId: string, size: WidgetSize) => void;
  configureWidget: (instanceId: string, config: unknown) => void;
  resetToPreset: () => void;
}

export function useDashboardLayout(): UseDashboardLayoutReturn {
  const { user } = useAuth();
  const currentPrivilege =
    (user?.sector?.privileges as SECTOR_PRIVILEGES | undefined) ?? null;
  // Leader status gates leader-only widgets (requiresLeader) on load + add.
  const currentIsLeader = !!user?.ledSector;
  const { preferences, isLoading, isUpdating, updateMine } = useMyPreferences();

  const persistedResult = useMemo<SanitizeResult>(() => {
    const raw = preferences ? (preferences as any).dashboardLayoutMobile : null;
    const base = loadLayoutFromPreferences(raw, currentPrivilege);
    return sanitizeLayout(base, currentPrivilege, currentIsLeader);
  }, [preferences, currentPrivilege, currentIsLeader]);

  const persisted = persistedResult.layout;
  const restoredInstanceIds = persistedResult.restoredInstanceIds;

  const [working, setWorking] = useState<DashboardLayout>(persisted);
  const [isEditing, setIsEditing] = useState(false);
  const snapshotRef = useRef<DashboardLayout | null>(null);

  useEffect(() => {
    if (!isEditing) setWorking(persisted);
  }, [persisted, isEditing]);

  const isDirty = useMemo(() => {
    if (!isEditing || !snapshotRef.current) return false;
    return !layoutsEqual(snapshotRef.current, working);
  }, [isEditing, working]);

  const enterEdit = useCallback(() => {
    snapshotRef.current = working;
    setIsEditing(true);
  }, [working]);

  const discardAndExit = useCallback(() => {
    if (snapshotRef.current) setWorking(snapshotRef.current);
    snapshotRef.current = null;
    setIsEditing(false);
  }, []);

  const saveAndExit = useCallback(async () => {
    const next: DashboardLayout = {
      ...working,
      version: DASHBOARD_LAYOUT_VERSION,
      updatedAt: new Date().toISOString(),
    };
    // Success/error toasts are emitted by the axios response interceptor
    // (see api-client/axiosClient.ts) for every write request, so we don't
    // raise our own here — doing so produced a duplicate toast on save.
    // On failure updateMine throws, the interceptor shows the error, and we
    // stay in edit mode (setIsEditing(false) below is never reached).
    await updateMine({ dashboardLayoutMobile: next as unknown as any });
    snapshotRef.current = null;
    setIsEditing(false);
  }, [working, updateMine]);

  const addWidget = useCallback(
    (widgetId: string, config?: unknown) => {
      const def = widgetRegistry.get(widgetId);
      if (!def) return;
      if (!widgetRegistry.canUserUse(widgetId, currentPrivilege, currentIsLeader))
        return;
      setWorking((prev) => ({
        ...prev,
        items: [
          ...prev.items,
          {
            instanceId: newInstanceId(),
            widgetId,
            size: { span: def.defaultSpan, rows: def.defaultRows },
            config: config ?? def.defaultConfig,
          },
        ],
      }));
    },
    [currentPrivilege, currentIsLeader],
  );

  const removeWidget = useCallback((instanceId: string) => {
    setWorking((prev) => ({
      ...prev,
      items: prev.items.filter((it) => it.instanceId !== instanceId),
    }));
  }, []);

  const reorderItems = useCallback((items: WidgetInstance[]) => {
    setWorking((prev) => ({ ...prev, items }));
  }, []);

  const resizeWidget = useCallback((instanceId: string, size: WidgetSize) => {
    setWorking((prev) => ({
      ...prev,
      items: prev.items.map((it) =>
        it.instanceId === instanceId
          ? { ...it, size: clampSize(it.widgetId, size) }
          : it,
      ),
    }));
  }, []);

  const configureWidget = useCallback(
    (instanceId: string, config: unknown) => {
      setWorking((prev) => ({
        ...prev,
        items: prev.items.map((it) =>
          it.instanceId === instanceId ? { ...it, config } : it,
        ),
      }));
    },
    [],
  );

  const resetToPreset = useCallback(() => {
    const preset = getDefaultLayoutForSector(currentPrivilege);
    setWorking(sanitizeLayout(preset, currentPrivilege, currentIsLeader).layout);
  }, [currentPrivilege, currentIsLeader]);

  return {
    layout: working,
    isLoading: isLoading || !user,
    isSaving: isUpdating,
    isDirty,
    isEditing,
    restoredInstanceIds,
    enterEdit,
    saveAndExit,
    discardAndExit,
    addWidget,
    removeWidget,
    reorderItems,
    resizeWidget,
    configureWidget,
    resetToPreset,
  };
}
