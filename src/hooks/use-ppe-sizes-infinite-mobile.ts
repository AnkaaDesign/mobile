import { useInfiniteQuery } from "@tanstack/react-query";
import { ppeSizeKeys } from './queryKeys';
import { getPpeSizes } from '@/api-client';
import type { PpeSizeGetManyFormData } from '@/schemas';
import type { PpeSize } from '@/types';

const DEFAULT_LIMIT = 40;

export function usePpeSizesInfiniteMobile(params?: PpeSizeGetManyFormData) {
  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    // isFetching removed
    isFetchingNextPage,
    status,
    refetch,
    isRefetching,
  } = useInfiniteQuery({
    queryKey: ppeSizeKeys.list(params),
    queryFn: async ({ pageParam = 1 }) => {
      const response = await getPpeSizes({
        ...params,
        page: pageParam,
        limit: params?.limit || DEFAULT_LIMIT,
      });
      return response;
    },
    getNextPageParam: (lastPage) => {
      if (!lastPage?.meta?.hasNextPage) return undefined;
      return (lastPage.meta.page || 0) + 1;
    },
    initialPageParam: 1,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Flatten all pages into a single array
  const ppeSizes: PpeSize[] = data?.pages.flatMap((page) => page.data || []) || [];

  // Calculate total items loaded
  const totalItemsLoaded = ppeSizes.length;

  // Extract total count from meta
  const totalCount = data?.pages[0]?.meta?.totalRecords;

  // Loading states
  const isLoading = status === "pending";

  // Refresh function
  const refresh = async () => {
    await refetch();
  };

  // Load more function
  const loadMore = () => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

  return {
    ppeSizes,
    isLoading,
    error,
    refetch,
    isRefetching,
    loadMore,
    canLoadMore: hasNextPage,
    isFetchingNextPage,
    totalItemsLoaded,
    totalCount,
    refresh,
  };
}
