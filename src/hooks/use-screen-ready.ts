/**
 * Hook to signal that a screen is ready (has mounted)
 * Automatically ends the navigation loading overlay.
 */
import { useEffect, useLayoutEffect, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useNavigationLoading } from '@/contexts/navigation-loading-context';

/**
 * Call this hook in detail/destination screens to automatically
 * hide the navigation loading overlay when the screen mounts.
 *
 * @param isReady - Optional boolean to delay hiding until data is ready.
 *   Defaults to `true` (hides on mount, same as before).
 *
 * @example
 * // Hide overlay on mount (backward compatible):
 * useScreenReady();
 *
 * // Hide overlay when data loads:
 * useScreenReady(!isLoading);
 */
export function useScreenReady(isReady: boolean = true) {
  const { endNavigation, claimOverlay, isNavigatingRef } = useNavigationLoading();

  // Synchronous claim during commit phase (before any useEffect)
  useLayoutEffect(() => {
    if (!isReady) {
      claimOverlay();
    }
  }, [isReady, claimOverlay]);

  // Dismiss when isReady changes (handles first-visit data load). This fires
  // exactly when THIS screen transitions into the ready state — i.e. it is the
  // destination whose data just loaded — so it reveals the page and hides the
  // overlay at the right moment, and does NOT fire when navigating AWAY from an
  // already-ready screen (isReady unchanged), which must keep the destination's
  // overlay up.
  useEffect(() => {
    if (isReady) {
      endNavigation();
    }
  }, [isReady, endNavigation]);

  // Focus-aware dismiss (handles return visits with cached data)
  // Fires every time the screen gains focus, even if isReady is
  // already true from a previous visit.
  useFocusEffect(
    useCallback(() => {
      if (isReady) {
        endNavigation();
      } else {
        claimOverlay();
      }
    }, [isReady, endNavigation, claimOverlay])
  );

  // Conditional cleanup — don't interfere with new navigations
  useEffect(() => {
    return () => {
      if (!isNavigatingRef.current) {
        endNavigation();
      }
    };
  }, [endNavigation, isNavigatingRef]);
}
