import { useCallback, useEffect, useRef } from "react";
import type { View } from "react-native";
import { useOptionalTutorial } from "./tutorial-context";

/**
 * Register a UI element as a tutorial target. Returns refs/handlers that should
 * be attached to the View you want spotlighted.
 *
 *   const { ref, onLayout, onPress } = useTutorialTarget(TUTORIAL_TARGETS.homeGreeting);
 *   return <View ref={ref} onLayout={onLayout}>...</View>;
 *
 * If the element is interactive, also forward `onPress` so the engine can
 * advance when the user actually taps the spotlighted element.
 */
export function useTutorialTarget(id: string) {
  const tutorial = useOptionalTutorial();
  const ref = useRef<View | null>(null);

  // Stable references to the few methods we need so re-renders of the tutorial
  // context don't rebuild our callbacks (which would feed a measure loop).
  const registerTarget = tutorial?.registerTarget;
  const unregisterTarget = tutorial?.unregisterTarget;
  const notifyAction = tutorial?.notifyAction;
  const isActive = tutorial?.isActive ?? false;
  const currentStepIndex = tutorial?.currentStepIndex ?? 0;
  const isActiveTarget = tutorial?.currentStep?.targetId === id;

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
