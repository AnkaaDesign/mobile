/**
 * useSlot — register a tutorial spotlight slot inside a fake scene.
 *
 * Returns an object with `register(slotName)` which produces an `onLayout`
 * callback. When the slotted view lays out, we measureInWindow to get the
 * absolute screen rect (which the spotlight needs), then push it into the
 * tutorial store under `slotName`.
 *
 * Unmount cleanup: the consumer view is responsible for its own lifecycle;
 * we expose `unregister(slotName)` for advanced use but the typical case is
 * "slot is part of the scene's render tree → it auto-unmounts with the
 * scene → store entry will be replaced on next scene mount."
 *
 * Each scene component should call `useSlot()` once at the top and use the
 * returned `register` function on every spotlight-eligible view.
 */
import { useCallback, useRef } from "react";
import { findNodeHandle, UIManager, type LayoutChangeEvent, type View } from "react-native";
import { useTutorialStore } from "./engine-store";

export interface SlotRegistry {
  /** Attach to a View's `onLayout`. The slot's rect is measured and stored. */
  register: (slot: string) => (event: LayoutChangeEvent) => void;
  /** Optional: capture the View ref so we can re-measure after scroll. */
  registerRef: (slot: string) => (node: View | null) => void;
  /** Remove a slot from the store (rare). */
  unregister: (slot: string) => void;
  /** Force re-measure of every registered slot (e.g. after a scroll). */
  remeasureAll: () => void;
}

export function useSlot(): SlotRegistry {
  const refs = useRef(new Map<string, View | null>());

  const measure = useCallback((slot: string, node: View | null) => {
    if (!node) return;
    const handle = findNodeHandle(node);
    if (handle == null) return;
    UIManager.measureInWindow(handle, (x, y, width, height) => {
      if (
        Number.isFinite(x) &&
        Number.isFinite(y) &&
        Number.isFinite(width) &&
        Number.isFinite(height) &&
        width > 0 &&
        height > 0
      ) {
        useTutorialStore
          .getState()
          .registerSlot(slot, { x, y, width, height });
      }
    });
  }, []);

  const register = useCallback(
    (slot: string) => {
      return (_event: LayoutChangeEvent) => {
        const node = refs.current.get(slot);
        if (node) measure(slot, node);
      };
    },
    [measure],
  );

  const registerRef = useCallback(
    (slot: string) => {
      return (node: View | null) => {
        if (node) {
          refs.current.set(slot, node);
          // measure on next tick so layout settles
          requestAnimationFrame(() => measure(slot, node));
        } else {
          refs.current.delete(slot);
        }
      };
    },
    [measure],
  );

  const unregister = useCallback((slot: string) => {
    refs.current.delete(slot);
    useTutorialStore.getState().unregisterSlot(slot);
  }, []);

  const remeasureAll = useCallback(() => {
    refs.current.forEach((node, slot) => measure(slot, node));
  }, [measure]);

  return { register, registerRef, unregister, remeasureAll };
}
