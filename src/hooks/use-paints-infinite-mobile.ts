import { useInfiniteQuery } from "@tanstack/react-query";
import { paintService } from '@/api-client';
import { paintKeys } from './queryKeys';
import type { PaintGetManyFormData } from '@/schemas';

export const usePaintsInfiniteMobile = (filters?: Partial<PaintGetManyFormData>, pageSize: number = 40) => {
  // CRITICAL: Clean filters before using in queryKey and API calls
  // This prevents empty/invalid similarColor from causing API validation errors
  const cleanedFilters = filters ? (() => {
    const cleaned = { ...filters };
    // Remove similarColor if empty, undefined, or invalid hex format
    if ('similarColor' in cleaned) {
      const color = cleaned.similarColor;
      const isValidHex = typeof color === 'string' &&
                         color !== '' &&
                         color !== '#000000' &&
                         /^#[0-9A-Fa-f]{6}$/.test(color);
      if (!isValidHex) {
        delete cleaned.similarColor;
        delete cleaned.similarColorThreshold;
      }
    }
    return cleaned;
  })() : undefined;

  const query = useInfiniteQuery({
    queryKey: paintKeys.list(cleanedFilters),
    queryFn: async ({ pageParam = 1 }) => {
      // Use 'limit' instead of 'perPage' to match API schema
      const params: PaintGetManyFormData = {
        page: pageParam,
        limit: pageSize,
        ...cleanedFilters,
      };

      return paintService.getPaints(params);
    },
    getNextPageParam: (lastPage, allPages) => {
      if (!lastPage.meta?.hasNextPage) return undefined;
      return allPages.length + 1;
    },
    initialPageParam: 1,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Deduplicate items by ID to prevent "two children with same key" errors
  const allItems = query.data?.pages.flatMap((page) => page.data || []) ?? [];
  const seenIds = new Set<string>();
  const uniqueItems = allItems.filter((item) => {
    if (seenIds.has(item.id)) {
      return false;
    }
    seenIds.add(item.id);
    return true;
  });
  const totalItemsLoaded = uniqueItems.length;
  const totalCount = query.data?.pages[0]?.meta?.totalRecords;

  return {
    items: uniqueItems,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
    isRefetching: query.isRefetching,
    loadMore: query.fetchNextPage,
    canLoadMore: query.hasNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
    totalItemsLoaded,
    totalCount,
    refresh: async () => {
      await query.refetch();
    },
  };
};