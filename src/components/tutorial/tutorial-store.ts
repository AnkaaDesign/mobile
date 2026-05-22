/**
 * v4 → v5 compat shim. The v4 store API is dead in v5 — slot rects live in
 * `engine-store.ts`. These exports return the v5 store's snapshot where
 * the names line up, and no-ops elsewhere. Callers should migrate to
 * `engine-store.ts`.
 */
import { useTutorialStore as _v5Store } from "./engine-store";

export const useTutorialStore = _v5Store;

export function getMeasureTick(): number {
  return 0;
}
export function subscribeMeasureTick(_cb: () => void): () => void {
  return () => {};
}
export function getActiveTargetId(): string | null {
  return _v5Store.getState().activeSlot;
}
export function subscribeIsActiveTarget(_id: string, _cb: () => void): () => void {
  return () => {};
}
export function getActiveTargetRect() {
  return _v5Store.getState().activeTargetRect;
}
export function subscribeActiveTargetRect(_cb: () => void): () => void {
  return () => {};
}
export function getTargetAction(_id: string): (() => void) | null {
  return null;
}
export function setOpenDrawerCallback(_fn: (() => void) | null): void {
  /* no-op */
}
export function getOpenDrawerCallback(): (() => void) | null {
  return null;
}
export function setCloseDrawerCallback(_fn: (() => void) | null): void {
  /* no-op */
}
export function getCloseDrawerCallback(): (() => void) | null {
  return null;
}
export function markScreenReady(_route: string): void {
  /* no-op */
}
export function clearScreenReadySignals(): void {
  /* no-op */
}
export function resetTutorialStore(): void {
  _v5Store.getState().resetAll();
}
