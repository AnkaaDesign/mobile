import { useMemo, useCallback } from "react";
import { useBackups } from "./useBackup";
import type { BackupMetadata, BackupQueryParams } from "@/api-client/backup";

/**
 * Adapter hook that wraps useBackups (simple useQuery) into the shape
 * that useList/Layout expects (infinite-scroll-style interface).
 * Since the backup API returns a flat array (not paginated),
 * canLoadMore is always false.
 */
export function useBackupsInfiniteMobile(params?: Partial<BackupQueryParams> & Record<string, any>) {
  const queryParams = useMemo((): BackupQueryParams | undefined => {
    if (!params) return undefined;
    const { type, status, limit, orderBy } = params;
    const cleaned: BackupQueryParams = {};
    if (type) cleaned.type = type;
    if (status) cleaned.status = status;
    if (limit) cleaned.limit = limit;
    if (orderBy) cleaned.orderBy = orderBy;
    return Object.keys(cleaned).length > 0 ? cleaned : undefined;
  }, [params]);

  const query = useBackups(queryParams);

  const items = useMemo((): BackupMetadata[] => {
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
