import { useInfiniteQuery } from "@tanstack/react-query";
import { serviceService } from '@/api-client';
import { serviceKeys } from './queryKeys';
import type { ServiceGetManyFormData } from '@/schemas';

export const useServicesInfiniteMobile = (filters?: Partial<ServiceGetManyFormData>) => {
  const pageSize = 40;

  const query = useInfiniteQuery({
    queryKey: serviceKeys.list(filters),
    queryFn: async ({ pageParam = 1 }) => {
      const params: ServiceGetManyFormData = {
        page: pageParam,
        perPage: pageSize,
        orderBy: filters?.orderBy || { createdAt: "desc" },
        ...filters,
      };

      return serviceService.getServices(params);
    },
    getNextPageParam: (lastPage, allPages) => {
      if (!lastPage.meta?.hasNextPage) return undefined;
      return allPages.length + 1;
    },
    initialPageParam: 1,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const allItems = query.data?.pages.flatMap((page) => page.data || []) ?? [];
  const totalItemsLoaded = allItems.length;

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
    refresh: async () => {
      await query.refetch();
    },
  };
};