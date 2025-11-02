import { useCallback, useMemo, useEffect, useRef } from "react";
import { UseInfiniteQueryResult } from "@tanstack/react-query";
import { useInfiniteErrorHandler } from "./use-infinite-error-handler";

/**
 * Generic hook to enhance infinite query hooks for mobile optimization
 * Provides flattened data, loading states, error handling, and optimized page size for mobile
 * Includes aggressive pre-fetching strategy for smooth scrolling experience
 */
export function useInfiniteMobile<TError = Error>(infiniteQuery: UseInfiniteQueryResult<any, TError>) {
  // Flatten pages data for FlatList consumption
  const items = useMemo(() => {
    const pages = (infiniteQuery.data as any)?.pages || [];
    return pages.flatMap((page: any /* TODO: Add proper type */) => page?.data || []) || [];
  }, [infiniteQuery.data]);

  // Extract total count from meta if available (API returns totalRecords)
  const totalCount = useMemo(() => {
    const pages = (infiniteQuery.data as any)?.pages || [];
    const firstPageMeta = pages[0]?.meta;
    return firstPageMeta?.totalRecords;
  }, [infiniteQuery.data]);

  // Error handling for infinite scroll
  const errorHandler = useInfiniteErrorHandler({
    maxRetries: 2,
    retryDelay: 1000,
    showAlert: false, // Handle errors in components instead
  });

  // Load more function with safety checks and error handling
  const loadMore = useCallback(async (): Promise<void> => {
    if (infiniteQuery.hasNextPage && !infiniteQuery.isFetchingNextPage && !infiniteQuery.isLoading) {
      try {
        await infiniteQuery.fetchNextPage().then(() => {});
        errorHandler.reset(); // Reset error count on success
      } catch (error) {
        errorHandler.handleError(error as Error, () => infiniteQuery.fetchNextPage().then(() => {}));
      }
    }
  }, [infiniteQuery.hasNextPage, infiniteQuery.isFetchingNextPage, infiniteQuery.isLoading, infiniteQuery.fetchNextPage, errorHandler]);

  // Check if can load more (for UI state)
  const canLoadMore = useMemo(() => {
    return infiniteQuery.hasNextPage && !infiniteQuery.isFetchingNextPage && !infiniteQuery.isLoading;
  }, [infiniteQuery.hasNextPage, infiniteQuery.isFetchingNextPage, infiniteQuery.isLoading]);

  // Total items loaded across all pages
  const totalItemsLoaded = useMemo(() => {
    return items.length;
  }, [items.length]);

  // Get current page number
  const currentPage = useMemo(() => {
    const pages = (infiniteQuery.data as any)?.pages || [];
    return pages.length || 0;
  }, [infiniteQuery.data]);

  // Aggressive pre-fetching strategy
  // When user reaches 70% of loaded items, automatically prefetch next page
  const prefetchTriggered = useRef(false);

  useEffect(() => {
    // Reset prefetch flag when page changes
    prefetchTriggered.current = false;
  }, [currentPage]);

  const shouldPrefetch = useMemo(() => {
    return (
      infiniteQuery.hasNextPage &&
      !infiniteQuery.isFetchingNextPage &&
      !infiniteQuery.isLoading &&
      !prefetchTriggered.current &&
      items.length > 0
    );
  }, [infiniteQuery.hasNextPage, infiniteQuery.isFetchingNextPage, infiniteQuery.isLoading, items.length]);

  // Prefetch callback - can be triggered from UI when user scrolls to 70% of data
  const prefetchNext = useCallback(async () => {
    if (shouldPrefetch && !prefetchTriggered.current) {
      prefetchTriggered.current = true;
      try {
        await infiniteQuery.fetchNextPage();
      } catch (error) {
        // Silent prefetch failure - user can still manually load more
        console.warn('Prefetch failed:', error);
        prefetchTriggered.current = false;
      }
    }
  }, [shouldPrefetch, infiniteQuery]);

  return {
    // Flattened data
    items,
    totalItemsLoaded,
    totalCount,
    currentPage,

    // Loading states
    isLoading: infiniteQuery.isLoading,
    isError: infiniteQuery.isError,
    error: infiniteQuery.error,
    isFetchingNextPage: infiniteQuery.isFetchingNextPage,
    isRefetching: infiniteQuery.isRefetching,

    // Pagination control
    loadMore,
    canLoadMore,
    hasNextPage: infiniteQuery.hasNextPage,

    // Pre-fetching
    prefetchNext,
    shouldPrefetch,

    // Error handling
    retryLoadMore: async (): Promise<void> => {
      await errorHandler.retry(() => infiniteQuery.fetchNextPage().then(() => {}));
    },
    canRetry: errorHandler.canRetry,
    retryCount: errorHandler.retryCount,
    isRetrying: errorHandler.isRetrying,

    // Utility functions
    refetch: infiniteQuery.refetch,
    refresh: () => infiniteQuery.refetch({ cancelRefetch: true }),

    // Original query for advanced usage
    originalQuery: infiniteQuery,
  };
}
