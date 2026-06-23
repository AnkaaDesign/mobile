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

  // PRIMARY, commit-driven claim/dismiss. This is a LAYOUT effect, not a
  // passive effect and not useFocusEffect, on purpose:
  //
  //  - It runs synchronously on every commit whose `isReady` changed —
  //    including the exact commit where this screen's data query resolves and
  //    flips `isReady` false→true. React schedules that commit through its own
  //    (microtask-based) scheduler, never through the native frame loop, so the
  //    dismiss fires even when no frame is being produced. That is what makes
  //    "page ready → hide overlay" deterministic instead of dependent on a
  //    frame/timer ever firing.
  //  - useFocusEffect (used previously as the dismiss path) only runs its
  //    callback AFTER the navigation transition animation settles. If that
  //    animation stalls because the frame loop went idle, focus never fires and
  //    the overlay is stranded until a background→foreground — the bug.
  //
  // While not ready it claims the overlay (suppressing the pathname auto-hide
  // so the overlay genuinely waits for content); the instant it is ready it
  // ends navigation and reveals the page in the same paint as the dismiss.
  useLayoutEffect(() => {
    if (isReady) {
      endNavigation();
    } else {
      claimOverlay();
    }
  }, [isReady, endNavigation, claimOverlay]);

  // Redundant focus-aware safety for RETURN visits to an already-mounted screen
  // (kept in the stack) whose `isReady` did not change, so the layout effect
  // above won't re-fire. Harmless when it does fire late — by then the layout
  // effect or the pathname auto-hide has usually already dismissed.
  useFocusEffect(
    useCallback(() => {
      if (isReady) {
        endNavigation();
      } else {
        claimOverlay();
      }
    }, [isReady, endNavigation, claimOverlay])
  );

  // Conditional cleanup — don't interfere with a new navigation that is already
  // in progress (isNavigatingRef true means another screen owns the overlay).
  useEffect(() => {
    return () => {
      if (!isNavigatingRef.current) {
        endNavigation();
      }
    };
  }, [endNavigation, isNavigatingRef]);
}
