import { useMemo, useCallback } from "react";
import { useScheduledBackups } from "./useBackup";
import type { ScheduledBackupJob } from "@/api-client/backup";

/**
 * Adapter hook that wraps useScheduledBackups (simple useQuery) into the shape
 * that useList/Layout expects (infinite-scroll-style interface).
 * Since the scheduled backups API returns a flat array (not paginated),
 * canLoadMore is always false.
 */
export function useScheduledBackupsInfiniteMobile(_params?: Record<string, any>) {
  const query = useScheduledBackups();

  const items = useMemo((): ScheduledBackupJob[] => {
    return query.data || [];
  }, [query.data]);

  const refresh = useCallback(() => {
    return query.refetch({ cancelRefetch: true });
  }, [query.refetch]);

  return {
    // Data
    items,
    data: items,
    totalItemsLoaded: items.length,
    totalCount: items.length,
    currentPage: 1,

    // Loading states
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    isFetchingNextPage: false,
    isRefetching: query.isRefetching,

    // Pagination (not applicable — full array returned)
    loadMore: async () => {},
    canLoadMore: false,
    hasNextPage: false,

    // Pre-fetching (not applicable)
    prefetchNext: async () => {},
    shouldPrefetch: false,

    // Error handling
    retryLoadMore: async () => {},
    canRetry: false,
    retryCount: 0,
    isRetrying: false,

    // Utility
    refetch: query.refetch,
    refresh,

    // Original query
    originalQuery: query,
  };
}
