import { useCallback, useMemo } from "react";
import { UseInfiniteQueryResult } from "@tanstack/react-query";
import { useInfiniteErrorHandler } from "./use-infinite-error-handler";

/**
 * Generic hook to enhance infinite query hooks for mobile optimization
 * Provides flattened data, loading states, error handling, and optimized page size for mobile
 */
export function useInfiniteMobile<TData, TError = Error>(infiniteQuery: UseInfiniteQueryResult<{ data?: TData[]; meta?: { hasNextPage: boolean; totalRecords?: number } }, TError>) {
  // Flatten pages data for FlatList consumption
  const items = useMemo(() => {
    const pages = (infiniteQuery.data as any)?.pages || [];
    return pages.flatMap((page: any) => page?.data || []) || [];
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
