// Edit-mode state machine + persistence for the mobile home dashboard.
// Mirrors web/src/dashboard/hooks/use-dashboard-layout.ts but persists to
// `preferences.dashboardLayoutMobile` instead of `dashboardLayoutWeb`.
//
// Read flow: preferences.dashboardLayoutMobile (JSON) → parsed via
// dashboardLayoutSchema → fall back to sector preset if absent or invalid.
//
// Edit flow: enterEdit() snapshots the working layout. Mutations
// (add/remove/reorder/configure) update local state and mark dirty.
// saveAndExit() PUTs to /preferences/:id; discardAndExit() restores snapshot.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { SECTOR_PRIVILEGES } from "@/constants/enums";
import { notify } from "@/api-client";
import { useMyPreferences } from "./use-my-preferences";
import { widgetRegistry } from "../registry";
import { parseLayout } from "../schemas";
import { DASHBOARD_LAYOUT_VERSION } from "../types";
import type { DashboardLayout, WidgetInstance, WidgetSize } from "../types";
import { getDefaultLayoutForSector } from "../presets";

function clampSize(widgetId: string, requested: WidgetSize): WidgetSize {
  const def = widgetRegistry.get(widgetId);
  if (!def) return requested;
  const cols = Math.max(
    def.minSize.cols,
    Math.min(def.maxSize.cols, requested.cols),
  ) as WidgetSize["cols"];
  const rows = Math.max(
    def.minSize.rows,
    Math.min(def.maxSize.rows, requested.rows),
  ) as WidgetSize["rows"];
  return { cols, rows };
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
 * removed). Also clamps each instance's size to the current widget's min/max.
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
    const parsed = preferences
      ? parseLayout((preferences as any).dashboardLayoutMobile)
      : null;
    const base = parsed ?? getDefaultLayoutForSector(currentPrivilege);
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
            size: def.defaultSize,
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
