import { useCallback, useEffect, useRef } from "react";
import type { View } from "react-native";
import { useOptionalTutorial } from "./tutorial-context";

interface Options {
  /**
   * Called when the user taps the spotlight overlay during an interactive
   * tap step targeting this id. Use this to reproduce the underlying button's
   * behavior so the tutorial works even when the overlay blocks pass-through
   * touches (e.g. on Android with elevated overlays).
   */
  onAction?: () => void;
}

/**
 * Register a UI element as a tutorial target. Returns refs/handlers that should
 * be attached to the View you want spotlighted.
 *
 *   const { ref, onLayout, onPress } = useTutorialTarget(TUTORIAL_TARGETS.homeGreeting);
 *   return <View ref={ref} onLayout={onLayout}>...</View>;
 *
 * If the element is interactive, also forward `onPress` so the engine can
 * advance when the user actually taps the spotlighted element.
 *
 * For interactive `tap` steps, also pass `onAction` so the overlay's spotlight
 * can drive the underlying behavior even when the touch can't reach the
 * underlying button.
 */
export function useTutorialTarget(id: string, options?: Options) {
  const tutorial = useOptionalTutorial();
  const ref = useRef<View | null>(null);

  const registerTarget = tutorial?.registerTarget;
  const unregisterTarget = tutorial?.unregisterTarget;
  const registerAction = tutorial?.registerAction;
  const unregisterAction = tutorial?.unregisterAction;
  const notifyAction = tutorial?.notifyAction;
  const isActive = tutorial?.isActive ?? false;
  const currentStepIndex = tutorial?.currentStepIndex ?? 0;
  const isActiveTarget = tutorial?.currentStep?.targetId === id;

  // Keep the latest onAction in a ref so the registered fn always closes over
  // fresh state (e.g. captures the latest enterEdit closure).
  const onActionRef = useRef<(() => void) | undefined>(options?.onAction);
  onActionRef.current = options?.onAction;

  const measure = useCallback(() => {
    if (!registerTarget || !ref.current) return;
    ref.current.measureInWindow((x, y, width, height) => {
      if (width === 0 && height === 0) return;
      registerTarget(id, { x, y, width, height });
    });
  }, [registerTarget, id]);

  const onLayout = useCallback(() => {
    requestAnimationFrame(() => measure());
  }, [measure]);

  useEffect(() => {
    return () => {
      unregisterTarget?.(id);
    };
  }, [unregisterTarget, id]);

  // Register the action callback whenever an onAction is supplied. Re-runs
  // only when the *presence* of an action changes (not its identity), so
  // inline arrow functions don't churn registrations. The engine invokes
  // `onActionRef.current` which always points to the latest closure.
  const hasAction = !!options?.onAction;
  useEffect(() => {
    if (!registerAction || !unregisterAction) return;
    if (!hasAction) return;
    const fn = () => onActionRef.current?.();
    registerAction(id, fn);
    return () => unregisterAction(id);
  }, [registerAction, unregisterAction, id, hasAction]);

  // Re-measure once when the active step changes — covers post-navigation
  // layout shifts. Does NOT loop because registerTarget short-circuits when the
  // rect is unchanged.
  useEffect(() => {
    if (!isActive) return;
    const handle = setTimeout(() => measure(), 200);
    return () => clearTimeout(handle);
  }, [isActive, currentStepIndex, measure]);

  const onPress = useCallback(() => {
    notifyAction?.("tap", { targetId: id });
  }, [notifyAction, id]);

  return {
    ref,
    onLayout,
    onPress,
    isActiveTarget,
  };
}
