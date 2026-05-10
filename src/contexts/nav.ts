/**
 * Consolidated navigation hook — single public surface that the new
 * screen-template layer (and area agents during the migration) consumes.
 *
 * Wraps `useNavigationLoading` (which itself composes `useNavigationHistory`)
 * so callers don't have to know which provider owns which method, and
 * routes everything through the typed `AppRoute` brand for compile-time
 * route correctness.
 *
 * Old `useNavigationLoading` / `useNavigationHistory` hooks are kept and
 * marked `@deprecated` for the migration window — removed in Phase 3.
 */
import { useCallback, useMemo } from "react";
import { usePathname } from "expo-router";

import { useNavigationLoading } from "@/contexts/navigation-loading-context";
import { useNavigationHistory } from "@/contexts/navigation-history-context";
import type { AppRoute } from "@/constants/routes.types";

/**
 * Pathname segments that represent modal / share-sheet style routes.
 * When the active path matches one of these, `useNav().goBack()` falls
 * back to a pure stack pop instead of dismissTo, avoiding the case where
 * dismissTo would unintentionally close the modal hierarchy.
 *
 * Empty by default — populated by area agents as they migrate modal screens.
 */
export const MODAL_SEGMENTS: readonly string[] = [] as const;

export interface UseNavReturn {
  /** Push a new route onto the stack, with the loading overlay. */
  push: (route: AppRoute) => void;
  /** Replace the current screen with the loading overlay. */
  replace: (route: AppRoute) => void;
  /**
   * Smart back — uses the navigation-history stack first, falling back to
   * `dismissTo` (or `replace`) on the supplied fallback when the history
   * is empty. Modal segments fall back to a pure pop instead.
   */
  goBack: (opts?: { fallback?: AppRoute }) => void;
  /** Pop the stack to the supplied route, replacing if not present. */
  dismissTo: (route: AppRoute) => void;
  /** Whether `goBack()` will navigate via history (or via fallback). */
  canGoBack: () => boolean;
  /**
   * Run an async operation with the loading overlay visible for its
   * duration. Closes the "no overlay on mutations" gap.
   */
  withLoading: <T>(fn: () => Promise<T>) => Promise<T>;
}

function isModalPath(pathname: string): boolean {
  if (!pathname) return false;
  for (const seg of MODAL_SEGMENTS) {
    if (pathname.includes(seg)) return true;
  }
  return false;
}

export function useNav(): UseNavReturn {
  const loading = useNavigationLoading();
  const history = useNavigationHistory();
  const pathname = usePathname();

  const push = useCallback(
    (route: AppRoute) => loading.pushWithLoading(route),
    [loading],
  );

  const replace = useCallback(
    (route: AppRoute) => loading.replaceWithLoading(route),
    [loading],
  );

  const dismissTo = useCallback(
    (route: AppRoute) => loading.dismissToWithLoading(route),
    [loading],
  );

  const goBack = useCallback(
    (opts?: { fallback?: AppRoute }) => {
      // Modal context: fall back to a pure stack pop. Dismissing to a sibling
      // route from inside a modal would unmount the modal hierarchy in an
      // unintended way.
      if (isModalPath(pathname)) {
        if (history.canGoBack()) {
          history.goBack(opts?.fallback ? { fallbackRoute: opts.fallback } : undefined);
        }
        return;
      }
      history.goBack(opts?.fallback ? { fallbackRoute: opts.fallback } : undefined);
    },
    [history, pathname],
  );

  const canGoBack = useCallback(() => history.canGoBack(), [history]);

  const withLoading = useCallback(
    <T,>(fn: () => Promise<T>) => loading.withLoading(fn),
    [loading],
  );

  return useMemo(
    () => ({ push, replace, dismissTo, goBack, canGoBack, withLoading }),
    [push, replace, dismissTo, goBack, canGoBack, withLoading],
  );
}
