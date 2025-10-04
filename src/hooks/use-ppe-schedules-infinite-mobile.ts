// apps/mobile/src/hooks/use-ppe-schedules-infinite-mobile.ts

import { useInfiniteQuery } from "@tanstack/react-query";
import { ppeDeliveryScheduleService } from '../api-client';
import type { PpeDeliveryScheduleGetManyFormData } from '../schemas';
import { ppeDeliveryScheduleKeys } from './';

const ITEMS_PER_PAGE = 40;

export function usePpeSchedulesInfiniteMobile(params: PpeDeliveryScheduleGetManyFormData = {}) {
  const queryResult = useInfiniteQuery({
    queryKey: ppeDeliveryScheduleKeys.list(params),
    queryFn: async ({ pageParam = 1 }) => {
      const response = await ppeDeliveryScheduleService.getPpeDeliverySchedules({
        ...params,
        page: pageParam,
        limit: ITEMS_PER_PAGE,
      });
      return response;
    },
    getNextPageParam: (lastPage) => {
      if (lastPage.meta?.hasNextPage) {
        return (lastPage.meta.page || 0) + 1;
      }
      return undefined;
    },
    initialPageParam: 1,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, error, refetch, isRefetching } = queryResult;

  // Flatten all pages into a single array
  const schedules = data?.pages.flatMap((page) => page.data ?? []) ?? [];

  // Total items loaded across all pages
  const totalItemsLoaded = schedules.length;

  // Simplified load more function
  const loadMore = () => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

  // Simplified refresh function
  const refresh = async () => {
    await refetch();
  };

  return {
    schedules,
    isLoading,
    error: error as Error | null,
    refetch,
    isRefetching,
    loadMore,
    canLoadMore: hasNextPage,
    isFetchingNextPage,
    totalItemsLoaded,
    refresh,
  };
}
