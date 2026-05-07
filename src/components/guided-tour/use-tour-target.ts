import { useCallback, useEffect, useRef } from "react";
import type { View } from "react-native";
import { useOptionalTour } from "./tour-context";

/**
 * Register a UI element as a tour target. The hook returns a ref + an onLayout
 * callback. Attach BOTH to the View you want to highlight:
 *
 *   const { ref, onLayout } = useTourTarget(TOUR_TARGET_IDS.homeWelcomeCard);
 *   return <View ref={ref} onLayout={onLayout}>...</View>;
 */
export function useTourTarget(id: string) {
  const tour = useOptionalTour();
  const ref = useRef<View | null>(null);

  const measure = useCallback(() => {
    if (!tour || !ref.current) return;
    ref.current.measureInWindow((x, y, width, height) => {
      if (width === 0 && height === 0) return;
      tour.registerTarget(id, { x, y, width, height });
    });
  }, [tour, id]);

  const onLayout = useCallback(() => {
    requestAnimationFrame(() => measure());
  }, [measure]);

  useEffect(() => {
    return () => {
      tour?.unregisterTarget(id);
    };
  }, [tour, id]);

  // Re-measure when active step might depend on this target
  useEffect(() => {
    if (!tour?.isActive) return;
    const handle = setTimeout(() => measure(), 150);
    return () => clearTimeout(handle);
  }, [tour?.isActive, tour?.currentStepIndex, measure]);

  const onPress = useCallback(() => {
    tour?.notifyInteraction(id);
  }, [tour, id]);

  return { ref, onLayout, onPress, isActiveTarget: tour?.currentStep?.targetId === id };
}
