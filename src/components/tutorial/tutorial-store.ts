/**
 * Per-target subscription store. Replaces the React-context fanout that
 * used to re-render all 140+ `useTutorialTarget` hooks whenever the active
 * step changed or the measure tick bumped.
 *
 * Old: `currentStep?.targetId` change → 1 context value identity change →
 * 140 hooks re-render → 139 do nothing.
 *
 * New: `setActiveTargetId(newId)` notifies ONLY the two affected ids — the
 * one that was active and the one becoming active. 138 hooks stay
 * untouched. Same model for measure ticks: only the currently-active
 * hook subscribes; idle hooks don't.
 *
 * Also hosts the live active-rect — the spotlight overlay subscribes here
 * via useSyncExternalStore, so cutout rendering is decoupled from React's
 * state-update cycle on the provider. Even if a setState somehow doesn't
 * flush (long task on JS thread, React Suspense, etc.) the spotlight
 * still updates the moment measure() succeeds.
 */

import type { TutorialTargetRect } from "./types";

let _activeTargetId: string | null = null;
const _activeIdSubscribers = new Map<string, Set<() => void>>();

let _activeTargetRect: TutorialTargetRect | null = null;
const _activeRectSubscribers = new Set<() => void>();

export function setActiveTargetRect(rect: TutorialTargetRect | null): void {
  const prev = _activeTargetRect;
  // Reference-identical early return — cheap deduplication for the common
  // case where a polling tick re-reads the same rect object. Value-equal
  // but reference-different rects DO trigger a notify so the overlay
  // re-runs its effect; in practice the effect's no-op guard
  // (`prevRectRef.current` comparison) suppresses any visual change.
  // Skipping notify on value-equal rects had been a subtle source of
  // "spotlight invisible" — if the overlay missed its first measure
  // notification because of a useSyncExternalStore subscribe race,
  // subsequent identical measurements would never re-trigger the effect.
  if (prev === rect) return;
  _activeTargetRect = rect;
  _activeRectSubscribers.forEach((fn) => {
    try {
      fn();
    } catch {}
  });
}

export function getActiveTargetRect(): TutorialTargetRect | null {
  return _activeTargetRect;
}

export function subscribeActiveTargetRect(cb: () => void): () => void {
  _activeRectSubscribers.add(cb);
  return () => {
    _activeRectSubscribers.delete(cb);
  };
}

export function setActiveTargetId(id: string | null): void {
  const prev = _activeTargetId;
  _activeTargetId = id;
  // ALWAYS notify both prev and new id subscribers, even when they're
  // the same. Re-entering the same target (same id consecutive steps,
  // or a step transition that doesn't change targetId) used to skip the
  // notify — meaning the hook's `isActiveTarget` snapshot didn't change,
  // its measure-effect didn't re-run, and the spotlight could remain
  // stale or invisible. The notify is cheap (one call to the currently-
  // active hook); same-id re-notifies are idempotent at the consumer
  // (useSyncExternalStore re-reads snapshot, sees same value, no
  // re-render — but the polling effect re-runs because `isActiveTarget`
  // is read fresh inside).
  if (id != null) {
    const nextSet = _activeIdSubscribers.get(id);
    if (nextSet) nextSet.forEach((fn) => { try { fn(); } catch {} });
  }
  if (prev != null && prev !== id) {
    const prevSet = _activeIdSubscribers.get(prev);
    if (prevSet) prevSet.forEach((fn) => { try { fn(); } catch {} });
  }
}

export function getActiveTargetId(): string | null {
  return _activeTargetId;
}

export function subscribeIsActiveTarget(
  id: string,
  cb: () => void,
): () => void {
  let set = _activeIdSubscribers.get(id);
  if (!set) {
    set = new Set();
    _activeIdSubscribers.set(id, set);
  }
  set.add(cb);
  return () => {
    const live = _activeIdSubscribers.get(id);
    if (!live) return;
    live.delete(cb);
    if (live.size === 0) _activeIdSubscribers.delete(id);
  };
}

/**
 * Re-measure trigger. Bumped by the step-entry cascade (80/320/700/1500ms)
 * to give the active target's hook a re-measurement signal after a
 * cross-route push. Only the currently-active hook subscribes.
 */
let _measureTick = 0;
const _measureSubscribers = new Set<() => void>();

export function bumpMeasureTickStore(): void {
  _measureTick++;
  _measureSubscribers.forEach((fn) => {
    try {
      fn();
    } catch {}
  });
}

export function getMeasureTick(): number {
  return _measureTick;
}

export function subscribeMeasureTick(cb: () => void): () => void {
  _measureSubscribers.add(cb);
  return () => {
    _measureSubscribers.delete(cb);
  };
}

/**
 * Test/cleanup helper. Call on tutorial stop so a half-pumped tick value
 * doesn't leak into the next run.
 */
export function resetTutorialStore(): void {
  const prev = _activeTargetId;
  _activeTargetId = null;
  if (prev != null) {
    const prevSet = _activeIdSubscribers.get(prev);
    if (prevSet) prevSet.forEach((fn) => { try { fn(); } catch {} });
  }
  if (_activeTargetRect != null) {
    _activeTargetRect = null;
    _activeRectSubscribers.forEach((fn) => { try { fn(); } catch {} });
  }
}
