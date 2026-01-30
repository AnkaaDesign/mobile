import { useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { InteractionManager, Platform } from 'react-native';

/**
 * Hook for prefetching data before navigation completes
 * This helps reduce perceived load time when navigating to detail screens
 *
 * @example
 * const { prefetchOnPress } = useNavigationPrefetch();
 *
 * const handleRowPress = (item) => {
 *   // Start prefetching immediately
 *   prefetchOnPress(
 *     ['customers', 'detail', item.id],
 *     () => customerService.getById(item.id)
 *   );
 *   // Navigate (prefetch runs in parallel)
 *   router.push(`/customers/details/${item.id}`);
 * };
 */
export function useNavigationPrefetch() {
  const queryClient = useQueryClient();
  const prefetchingRef = useRef<Set<string>>(new Set());

  /**
   * Prefetch data when a row/item is pressed
   * Call this BEFORE navigation to start loading data early
   *
   * @param queryKey - The React Query key for the data
   * @param queryFn - The function to fetch the data
   * @param staleTime - How long the data should be considered fresh (default: 5 minutes)
   */
  const prefetchOnPress = useCallback(
    async <T>(
      queryKey: readonly unknown[],
      queryFn: () => Promise<T>,
      staleTime: number = 5 * 60 * 1000
    ) => {
      const keyString = JSON.stringify(queryKey);

      // Prevent duplicate prefetches for the same key
      if (prefetchingRef.current.has(keyString)) {
        return;
      }

      prefetchingRef.current.add(keyString);

      try {
        // Check if we already have fresh data
        const existingData = queryClient.getQueryData(queryKey);
        const queryState = queryClient.getQueryState(queryKey);

        if (existingData && queryState) {
          const dataAge = Date.now() - (queryState.dataUpdatedAt || 0);
          if (dataAge < staleTime) {
            // Data is still fresh, no need to prefetch
            return;
          }
        }

        // Prefetch the data
        await queryClient.prefetchQuery({
          queryKey,
          queryFn,
          staleTime,
        });
      } catch (error) {
        // Silently fail - the actual query will retry when the screen mounts
        console.warn('Prefetch failed:', error);
      } finally {
        prefetchingRef.current.delete(keyString);
      }
    },
    [queryClient]
  );

  /**
   * Prefetch data after interactions complete (for non-critical prefetching)
   * Use this for secondary data that isn't immediately visible
   *
   * @param queryKey - The React Query key for the data
   * @param queryFn - The function to fetch the data
   * @param staleTime - How long the data should be considered fresh
   */
  const prefetchAfterInteractions = useCallback(
    <T>(
      queryKey: readonly unknown[],
      queryFn: () => Promise<T>,
      staleTime: number = 5 * 60 * 1000
    ) => {
      if (Platform.OS === 'ios') {
        // On iOS, use requestAnimationFrame for smoother experience
        requestAnimationFrame(() => {
          prefetchOnPress(queryKey, queryFn, staleTime);
        });
      } else {
        // On Android, wait for interactions to complete
        InteractionManager.runAfterInteractions(() => {
          prefetchOnPress(queryKey, queryFn, staleTime);
        });
      }
    },
    [prefetchOnPress]
  );

  /**
   * Cancel a prefetch that's in progress
   * Useful if the user navigates away before the prefetch completes
   */
  const cancelPrefetch = useCallback(
    (queryKey: readonly unknown[]) => {
      queryClient.cancelQueries({ queryKey });
      prefetchingRef.current.delete(JSON.stringify(queryKey));
    },
    [queryClient]
  );

  return {
    prefetchOnPress,
    prefetchAfterInteractions,
    cancelPrefetch,
  };
}

/**
 * Higher-order function to wrap a navigation handler with prefetching
 * Creates a combined handler that prefetches data and navigates
 *
 * @example
 * const handlePress = createPrefetchingNavigator(
 *   queryClient,
 *   (item) => ['customers', 'detail', item.id],
 *   (item) => customerService.getById(item.id),
 *   (item, router) => router.push(`/customers/details/${item.id}`)
 * );
 */
export function createPrefetchingNavigator<T extends { id: string }>(
  queryClient: ReturnType<typeof useQueryClient>,
  getQueryKey: (item: T) => readonly unknown[],
  queryFn: (item: T) => Promise<unknown>,
  navigate: (item: T, router: any) => void,
  staleTime: number = 5 * 60 * 1000
) {
  return (item: T, router: any) => {
    const queryKey = getQueryKey(item);

    // Start prefetching immediately (don't await)
    queryClient.prefetchQuery({
      queryKey,
      queryFn: () => queryFn(item),
      staleTime,
    }).catch(() => {
      // Silently fail
    });

    // Navigate immediately (prefetch happens in parallel)
    navigate(item, router);
  };
}
