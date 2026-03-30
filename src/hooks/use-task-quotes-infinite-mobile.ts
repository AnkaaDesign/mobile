import { useInfiniteQuery } from "@tanstack/react-query";
import { taskQuoteService } from "@/api-client/task-quote";
import { taskQuoteKeys } from "./useTaskQuote";

export const useTaskQuotesInfiniteMobile = (filters?: Record<string, any>) => {
  const pageSize = 25;

  const query = useInfiniteQuery({
    queryKey: taskQuoteKeys.list(filters),
    queryFn: async ({ pageParam = 1 }) => {
      const params = {
        page: pageParam,
        limit: pageSize,
        ...filters,
      };

      return taskQuoteService.getAll(params);
    },
    getNextPageParam: (lastPage: any, allPages: any[]) => {
      // If the response has meta with hasNextPage, use it
      if (lastPage.meta?.hasNextPage) return allPages.length + 1;
      // Otherwise check if we got a full page of results
      const data = lastPage.data || [];
      if (data.length < pageSize) return undefined;
      return allPages.length + 1;
    },
    initialPageParam: 1,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const allItems = query.data?.pages.flatMap((page: any) => page.data || []) ?? [];
  const totalItemsLoaded = allItems.length;
  const totalCount = (query.data?.pages[0] as any)?.meta?.totalRecords ?? (query.data?.pages[0] as any)?.total;

  return {
    items: allItems,
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
