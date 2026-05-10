// Per-instance column-width persistence for table widgets.
//
// Mirrors web/src/hooks/common/use-column-widths.ts in spirit but backed by
// AsyncStorage instead of localStorage. Each widget instance gets its own
// keyspace so two installment-table widgets on the same dashboard don't
// share column widths.
//
// Why per-instance, not per-widget-id: the user can configure two
// item-table widgets with different column subsets (one tracking inventory,
// another tracking PPE). They should remember their own widths.
//
// Storage key shape: ankaa.dashboard.col-widths:<widgetId>:<instanceId>
//
// Usage:
//   const { widths, setWidth, resetWidth, resetAll } = useColumnWidths(
//     widgetId,
//     instanceId,
//     DEFAULT_WIDTHS,
//   );
//
//   <View style={{ width: widths[col.key] ?? col.width ?? 0 }}>...</View>

import { useCallback, useEffect, useRef, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_PREFIX = "ankaa.dashboard.col-widths:";
const DEBOUNCE_MS = 250;

type WidthMap = Record<string, number>;

export interface UseColumnWidthsResult {
  widths: WidthMap;
  /** Set or update a single column's width. Invalid values (≤0, NaN) are
   *  ignored — the caller is expected to clamp pixels to a sane min. */
  setWidth: (columnKey: string, px: number) => void;
  /** Reset a single column to its default — removes its entry so the caller's
   *  fallback (col.width) takes over again. */
  resetWidth: (columnKey: string) => void;
  /** Wipe every override for this instance. */
  resetAll: () => void;
  /** True until the initial AsyncStorage read completes. Render the table
   *  with default widths during this window — overlapping a partial read
   *  would cause a layout flicker once persisted widths apply. */
  hydrated: boolean;
}

export function useColumnWidths(
  widgetId: string,
  instanceId: string | undefined,
  defaults: WidthMap = {},
): UseColumnWidthsResult {
  const storageKey = instanceId ? `${STORAGE_PREFIX}${widgetId}:${instanceId}` : null;
  const [widths, setWidths] = useState<WidthMap>(defaults);
  const [hydrated, setHydrated] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const warnedRef = useRef(false);

  // Initial load.
  useEffect(() => {
    if (!storageKey) {
      setHydrated(true);
      return;
    }
    let cancelled = false;
    AsyncStorage.getItem(storageKey)
      .then((stored) => {
        if (cancelled) return;
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            if (parsed && typeof parsed === "object") {
              setWidths({ ...defaults, ...parsed });
            }
          } catch {
            // Corrupted entry — fall through to defaults.
          }
        }
        setHydrated(true);
      })
      .catch(() => setHydrated(true));
    return () => {
      cancelled = true;
    };
    // defaults intentionally excluded — they're a render-time literal in
    // most callers and would force a re-load on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  // Debounced write.
  useEffect(() => {
    if (!hydrated || !storageKey) return;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      AsyncStorage.setItem(storageKey, JSON.stringify(widths)).catch((err) => {
        if (!warnedRef.current) {
          warnedRef.current = true;
          // eslint-disable-next-line no-console
          console.warn("[use-column-widths] AsyncStorage write failed", err);
        }
      });
    }, DEBOUNCE_MS);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [storageKey, widths, hydrated]);

  const setWidth = useCallback((columnKey: string, px: number) => {
    if (!Number.isFinite(px) || px <= 0) return;
    setWidths((prev) => ({ ...prev, [columnKey]: Math.round(px) }));
  }, []);

  const resetWidth = useCallback((columnKey: string) => {
    setWidths((prev) => {
      if (!(columnKey in prev)) return prev;
      const next = { ...prev };
      delete next[columnKey];
      return next;
    });
  }, []);

  const resetAll = useCallback(() => {
    setWidths({});
  }, []);

  return { widths, setWidth, resetWidth, resetAll, hydrated };
}
