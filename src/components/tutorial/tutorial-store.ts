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
  if (
    prev === rect ||
    (prev != null &&
      rect != null &&
      prev.x === rect.x &&
      prev.y === rect.y &&
      prev.width === rect.width &&
      prev.height === rect.height)
  ) {
    return;
  }
  _activeTargetRect = rect;
  _activeRectSubscribers.forEach((fn) => fn());
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
  if (prev === id) return;
  _activeTargetId = id;
  if (prev != null) {
    const prevSet = _activeIdSubscribers.get(prev);
    if (prevSet) prevSet.forEach((fn) => fn());
  }
  if (id != null) {
    const nextSet = _activeIdSubscribers.get(id);
    if (nextSet) nextSet.forEach((fn) => fn());
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
  _measureSubscribers.forEach((fn) => fn());
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
    if (prevSet) prevSet.forEach((fn) => fn());
  }
  if (_activeTargetRect != null) {
    _activeTargetRect = null;
    _activeRectSubscribers.forEach((fn) => fn());
  }
  // measureTick is monotonic — no reset needed; the subscriber count is
  // also unchanged because hooks manage their own (un)subscriptions on
  // active→inactive transitions.
}
