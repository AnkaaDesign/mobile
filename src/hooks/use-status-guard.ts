/**
 * useStatusGuard — terminal-status redirect / read-only banner hook.
 *
 * Used by `<DetailScreen editGuard={...}>` and `<FormScreen editGuard={...}>`.
 * Allowlist-driven (see `@/constants/editable-statuses`) — adding a new
 * enum value defaults to non-editable, the safer failure mode.
 *
 * Anti-loop guard: if the redirect target equals the current route (after
 * stripping the `/(tabs)/` prefix), the hook reports `isEditable: false`
 * + `isTerminal: true` and renders nothing — the consuming template
 * shows a read-only banner instead. Without this guard, a detail page
 * that hosts the guard would `dismissTo` itself and infinitely loop.
 */
import { useEffect, useRef } from "react";
import { usePathname } from "expo-router";

import { useNav } from "@/contexts/nav";
import { isEditableStatus } from "@/constants/editable-statuses";
import type { AppRoute } from "@/constants/routes.types";

export interface StatusGuardConfig<T> {
  /** Field to read from the entity. Default: 'status'. */
  field?: keyof T;
  /** Allowed status values — entity is editable only when in this set. */
  editable: readonly string[];
  /**
   * Compute the redirect target for a blocked entity. Default behavior is
   * to render an inline read-only banner (no redirect).
   */
  redirectOnBlock?: (entity: T) => AppRoute;
  /** Optional banner / toast message; consumed by the screen template. */
  message?: string;
}

export interface UseStatusGuardResult {
  /** True when the entity is in an editable state. */
  isEditable: boolean;
  /** True when the entity is in a terminal (non-editable) state. */
  isTerminal: boolean;
  /** Optional human-readable message for read-only banners. */
  message?: string;
}

function stripTabsPrefix(p: string): string {
  return p.replace(/^\/\(tabs\)\//, "/").replace(/\?.*$/, "");
}

export function useStatusGuard<T>(
  entity: T | undefined | null,
  cfg: StatusGuardConfig<T>,
): UseStatusGuardResult {
  const nav = useNav();
  const pathname = usePathname();
  const currentPathnameRef = useRef(pathname);
  currentPathnameRef.current = pathname;

  const field = (cfg.field ?? ("status" as keyof T)) as keyof T;
  const status = entity ? (entity[field] as unknown as string | undefined | null) : undefined;
  const editable = isEditableStatus(status, cfg.editable);

  useEffect(() => {
    if (!entity || editable) return;
    if (!cfg.redirectOnBlock) return;

    const target = cfg.redirectOnBlock(entity);
    const targetStripped = stripTabsPrefix(target);
    const currentStripped = stripTabsPrefix(currentPathnameRef.current ?? "");

    // Anti-loop guard: don't redirect if we're already on the target.
    // The screen renders the read-only banner instead.
    if (targetStripped === currentStripped) return;

    nav.dismissTo(target);
  }, [entity, editable, cfg, nav]);

  return {
    isEditable: editable,
    isTerminal: entity != null && !editable,
    message: cfg.message,
  };
}
