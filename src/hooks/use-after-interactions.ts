import { useEffect, useRef, useState, useCallback } from 'react';
import { InteractionManager, Platform } from 'react-native';

/**
 * Hook that defers execution until after navigation animations complete
 * Critical for Android performance - prevents frame drops during navigation
 *
 * @param enabled - Whether the hook should run (defaults to true)
 * @returns Object with `isReady` boolean and `runAfterInteractions` utility function
 *
 * @example
 * // Basic usage - wait for animations before loading data
 * const { isReady } = useAfterInteractions();
 *
 * const { data } = useQuery({
 *   queryKey: ['myData'],
 *   queryFn: fetchData,
 *   enabled: isReady, // Only fetch after animations complete
 * });
 *
 * @example
 * // Manual execution of deferred tasks
 * const { runAfterInteractions } = useAfterInteractions();
 *
 * useEffect(() => {
 *   runAfterInteractions(() => {
 *     // This runs after animations complete
 *     heavyOperation();
 *   });
 * }, [runAfterInteractions]);
 */
export function useAfterInteractions(enabled: boolean = true) {
  const [isReady, setIsReady] = useState(false);
  const interactionHandle = useRef<ReturnType<typeof InteractionManager.runAfterInteractions> | null>(null);

  useEffect(() => {
    if (!enabled) {
      setIsReady(false);
      return;
    }

    // On iOS, animations are typically smooth enough that we can start immediately
    // On Android, we need to wait for the interaction manager
    if (Platform.OS === 'ios') {
      // Small delay on iOS to ensure the screen is visible
      const timeout = setTimeout(() => setIsReady(true), 50);
      return () => clearTimeout(timeout);
    }

    // Android: Wait for navigation animations to complete
    interactionHandle.current = InteractionManager.runAfterInteractions(() => {
      setIsReady(true);
    });

    return () => {
      if (interactionHandle.current) {
        interactionHandle.current.cancel();
        interactionHandle.current = null;
      }
    };
  }, [enabled]);

  /**
   * Utility to run a function after interactions complete
   * Useful for one-off deferred operations
   */
  const runAfterInteractions = useCallback((callback: () => void) => {
    if (Platform.OS === 'ios') {
      // On iOS, use requestAnimationFrame for smoother experience
      requestAnimationFrame(callback);
    } else {
      // On Android, use InteractionManager
      InteractionManager.runAfterInteractions(callback);
    }
  }, []);

  return {
    isReady,
    runAfterInteractions,
  };
}

/**
 * Hook that provides a delayed ready state for heavy screen components
 * Useful for screens with many components that should render progressively
 *
 * @param delays - Array of delays in ms for progressive rendering
 * @returns Array of boolean states corresponding to each delay
 *
 * @example
 * const [showHeader, showContent, showFooter] = useProgressiveRender([0, 100, 200]);
 *
 * return (
 *   <View>
 *     {showHeader && <Header />}
 *     {showContent && <Content />}
 *     {showFooter && <Footer />}
 *   </View>
 * );
 */
export function useProgressiveRender(delays: number[]): boolean[] {
  const [states, setStates] = useState<boolean[]>(() => delays.map(() => false));
  const { isReady } = useAfterInteractions();

  useEffect(() => {
    if (!isReady) return;

    const timeouts: ReturnType<typeof setTimeout>[] = [];

    delays.forEach((delay, index) => {
      const timeout = setTimeout(() => {
        setStates(prev => {
          const next = [...prev];
          next[index] = true;
          return next;
        });
      }, delay);
      timeouts.push(timeout);
    });

    return () => {
      timeouts.forEach(clearTimeout);
    };
  }, [isReady, delays]);

  return states;
}

/**
 * Hook for deferring data fetching until after navigation completes
 * Wraps useQuery options with interaction-aware enabled flag
 *
 * @param baseEnabled - The original enabled condition for the query
 * @returns enabled flag that respects both the base condition and interaction state
 *
 * @example
 * const deferredEnabled = useDeferredQueryEnabled(!!userId);
 *
 * const { data } = useQuery({
 *   queryKey: ['user', userId],
 *   queryFn: () => fetchUser(userId),
 *   enabled: deferredEnabled,
 * });
 */
export function useDeferredQueryEnabled(baseEnabled: boolean = true): boolean {
  const { isReady } = useAfterInteractions(baseEnabled);
  return isReady && baseEnabled;
}
