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
import { notify } from "@/api-client";
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

function newInstanceId(): string {
  // RN doesn't always have crypto.randomUUID; fall back to a timestamp + random suffix.
  if (typeof crypto !== "undefined" && typeof (crypto as any).randomUUID === "function") {
    return (crypto as any).randomUUID();
  }
  return `inst-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Strip widgets the user is no longer allowed to use (sector changed, widget
 * removed). Also clamps each instance's size to the current widget's allowed
 * spans.
 */
function sanitizeLayout(
  layout: DashboardLayout,
  userSector: SECTOR_PRIVILEGES | null | undefined,
): DashboardLayout {
  const items = layout.items.flatMap<WidgetInstance>((item) => {
    if (!widgetRegistry.has(item.widgetId)) return [];
    if (!widgetRegistry.canUserUse(item.widgetId, userSector)) return [];
    return [{ ...item, size: clampSize(item.widgetId, item.size) }];
  });
  return { ...layout, items };
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
  const { preferences, isLoading, isUpdating, updateMine } = useMyPreferences();

  const persisted = useMemo<DashboardLayout>(() => {
    const raw = preferences ? (preferences as any).dashboardLayoutMobile : null;
    const base = loadLayoutFromPreferences(raw, currentPrivilege);
    return sanitizeLayout(base, currentPrivilege);
  }, [preferences, currentPrivilege]);

  const [working, setWorking] = useState<DashboardLayout>(persisted);
  const [isEditing, setIsEditing] = useState(false);
  const snapshotRef = useRef<DashboardLayout | null>(null);

  useEffect(() => {
    if (!isEditing) setWorking(persisted);
  }, [persisted, isEditing]);

  const isDirty = useMemo(() => {
    if (!isEditing || !snapshotRef.current) return false;
    return JSON.stringify(snapshotRef.current) !== JSON.stringify(working);
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
    try {
      await updateMine({ dashboardLayoutMobile: next as unknown as any });
      snapshotRef.current = null;
      setIsEditing(false);
      notify.success("Painel atualizado", "Suas configurações foram salvas.");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Não foi possível salvar o painel.";
      notify.error("Erro ao salvar", message);
      throw err;
    }
  }, [working, updateMine]);

  const addWidget = useCallback(
    (widgetId: string, config?: unknown) => {
      const def = widgetRegistry.get(widgetId);
      if (!def) return;
      if (!widgetRegistry.canUserUse(widgetId, currentPrivilege)) return;
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
    [currentPrivilege],
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
    setWorking(sanitizeLayout(preset, currentPrivilege));
  }, [currentPrivilege]);

  return {
    layout: working,
    isLoading: isLoading || !user,
    isSaving: isUpdating,
    isDirty,
    isEditing,
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
