/**
 * Hook to signal that a screen is ready (has mounted)
 * Automatically ends the navigation loading overlay
 */
import { useEffect } from 'react';
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
  const { endNavigation, claimOverlay } = useNavigationLoading();

  useEffect(() => {
    if (isReady) {
      endNavigation();
    } else {
      // Claim the overlay so auto-hide on pathname change is suppressed.
      // The overlay stays visible until isReady becomes true.
      claimOverlay();
    }
  }, [isReady, endNavigation, claimOverlay]);
}
