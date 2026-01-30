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
 * @example
 * function DetailScreen() {
 *   useScreenReady();
 *   // ... rest of component
 * }
 */
export function useScreenReady() {
  const { endNavigation } = useNavigationLoading();

  useEffect(() => {
    // End navigation loading when screen mounts
    endNavigation();
  }, [endNavigation]);
}
